import type {
  AssistantChatRequest,
  AssistantDeltaPayload,
  AssistantDonePayload,
  AssistantErrorPayload,
  AssistantStreamHandlers,
  AssistantStreamOptions,
} from '@/types/assistant';

const CHAT_PATH = '/api/assistant/chat';
const NETWORK_ERROR_MESSAGE = 'Network error';
const FALLBACK_ERROR_MESSAGE = 'Request failed';

/**
 * Streams one assistant turn from POST /api/assistant/chat.
 *
 * Never throws and never resolves to a value: progress is reported through
 * `handlers`. Non-2xx responses are parsed as ErrorResponse JSON first
 * (401 → `onUnauthorized`); SSE frames are dispatched as soon as a complete
 * frame is buffered, so `onDelta` fires progressively. An aborted turn fires
 * no callback at all.
 */
export async function streamAssistantMessage(
  request: AssistantChatRequest,
  handlers: AssistantStreamHandlers,
  options?: AssistantStreamOptions
): Promise<void> {
  const signal = options?.signal;

  let response: Response;
  try {
    const init: RequestInit = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(toRequestBody(request)),
    };
    if (signal) {
      init.signal = signal;
    }
    response = await fetch(CHAT_PATH, init);
  } catch (error) {
    if (!isAbortError(error)) {
      handlers.onError(NETWORK_ERROR_MESSAGE);
    }
    return;
  }

  if (!response.ok) {
    if (response.status === 401) {
      handlers.onUnauthorized();
      return;
    }
    const errorBody = (await response.json().catch(() => null)) as {
      message?: unknown;
    } | null;
    const message =
      typeof errorBody?.message === 'string' && errorBody.message
        ? errorBody.message
        : response.statusText || FALLBACK_ERROR_MESSAGE;
    handlers.onError(message);
    return;
  }

  if (!response.body) {
    handlers.onError(NETWORK_ERROR_MESSAGE);
    return;
  }

  await consumeStream(response.body.getReader(), signal, handlers);
}

/** Drops a blank/absent conversationId so a fresh turn starts a new server-side conversation. */
function toRequestBody(request: AssistantChatRequest): AssistantChatRequest {
  const body: AssistantChatRequest = { message: request.message };
  if (request.conversationId) {
    body.conversationId = request.conversationId;
  }
  return body;
}

/**
 * Reader loop: buffers decoded text, dispatches every complete
 * (`\n\n`-terminated) frame, and stops quietly on abort or after a terminal
 * frame. A stream that closes without a terminal frame is a lost connection.
 */
async function consumeStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  signal: AbortSignal | undefined,
  handlers: AssistantStreamHandlers
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
          handlers.onError(NETWORK_ERROR_MESSAGE);
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
        if (dispatchFrame(frame, handlers)) {
          void reader.cancel().catch(() => {});
          return;
        }
        boundary = buffer.indexOf('\n\n');
      }
    }
  } catch (error) {
    if (!isAbortError(error)) {
      handlers.onError(NETWORK_ERROR_MESSAGE);
    }
  }
}

/**
 * Parses one SSE frame and dispatches known events. Returns true when a
 * terminal event (done/error) was delivered; unknown events, malformed JSON,
 * and payloads of the wrong shape are ignored.
 */
function dispatchFrame(frame: string, handlers: AssistantStreamHandlers): boolean {
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
    return false;
  }

  let payload: unknown;
  try {
    payload = JSON.parse(dataLines.join('\n'));
  } catch {
    return false;
  }

  switch (event) {
    case 'delta': {
      const text = (payload as AssistantDeltaPayload | null)?.text;
      if (typeof text === 'string') {
        handlers.onDelta(text);
      }
      return false;
    }
    case 'done': {
      const conversationId = (payload as AssistantDonePayload | null)?.conversationId;
      if (typeof conversationId === 'string') {
        handlers.onDone(conversationId);
        return true;
      }
      return false;
    }
    case 'error': {
      const message = (payload as AssistantErrorPayload | null)?.message;
      handlers.onError(typeof message === 'string' && message ? message : NETWORK_ERROR_MESSAGE);
      return true;
    }
    default:
      return false;
  }
}

/** AbortError surfaces as a DOMException in browsers and as an Error in tests/Node. */
function isAbortError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { name?: unknown }).name === 'AbortError'
  );
}
