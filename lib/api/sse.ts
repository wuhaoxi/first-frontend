/** One parsed SSE frame: the named event plus its JSON-decoded data payload. */
export interface SseFrame {
  event: string;
  data: unknown;
}

/** Callbacks consumed by `consumeSseStream`. */
export interface SseConsumeHandlers {
  /**
   * Called for every parsed frame. Return true when the frame is terminal —
   * reading stops and the underlying reader is cancelled.
   */
  onFrame: (frame: SseFrame) => boolean;
  /**
   * Called when the stream dies without a terminal frame (premature close or
   * read error). Never called after abort.
   */
  onTransportError: () => void;
}

/**
 * Parses one SSE frame into `{ event, data }`. Returns null for empty,
 * incomplete (no event or no data line), or malformed-JSON frames; unknown
 * payload shapes stay the caller's concern.
 */
export function parseFrame(frame: string): SseFrame | null {
  let event = '';
  const dataLines: string[] = [];
  for (const rawLine of frame.split('\n')) {
    const line = rawLine.endsWith('\r') ? rawLine.slice(0, -1) : rawLine;
    if (line.startsWith('event:')) {
      event = line.slice('event:'.length).trim();
    } else if (line.startsWith('data:')) {
      let value = line.slice('data:'.length);
      if (value.startsWith(' ')) {
        value = value.slice(1);
      }
      dataLines.push(value);
    }
  }
  if (!event || dataLines.length === 0) {
    return null;
  }

  let data: unknown;
  try {
    data = JSON.parse(dataLines.join('\n'));
  } catch {
    return null;
  }
  return { event, data };
}

/**
 * Reader loop shared by the streaming API clients: buffers decoded text,
 * dispatches every complete (`\n\n`-terminated) frame through `onFrame`, and
 * stops quietly on abort or after a terminal frame. A stream that closes
 * without a terminal frame is a lost connection and reports through
 * `onTransportError`; malformed frames are skipped without breaking the loop.
 */
export async function consumeSseStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  signal: AbortSignal | undefined,
  handlers: SseConsumeHandlers
): Promise<void> {
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      if (signal?.aborted) {
        return;
      }
      const { done, value } = await reader.read();
      if (done) {
        if (!signal?.aborted) {
          handlers.onTransportError();
        }
        return;
      }
      buffer += decoder.decode(value, { stream: true });

      let boundary = buffer.indexOf('\n\n');
      while (boundary !== -1) {
        const frame = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);
        if (signal?.aborted) {
          return;
        }
        const parsed = parseFrame(frame);
        if (parsed && handlers.onFrame(parsed)) {
          void reader.cancel().catch(() => {});
          return;
        }
        boundary = buffer.indexOf('\n\n');
      }
    }
  } catch (error) {
    if (!isAbortError(error)) {
      handlers.onTransportError();
    }
  }
}

/** AbortError surfaces as a DOMException in browsers and as an Error in tests/Node. */
export function isAbortError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { name?: unknown }).name === 'AbortError'
  );
}
