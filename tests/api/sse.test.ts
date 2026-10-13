import { consumeSseStream, parseFrame } from '@/lib/api/sse';

const encoder = new TextEncoder();
const encode = (text: string): Uint8Array => encoder.encode(text);

/** One complete SSE frame (named event + data field, blank-line terminated). */
function frame(event: string, data: string): string {
  return `event:${event}\ndata:${data}\n\n`;
}

/**
 * Real reader over the given chunks (strings are UTF-8 encoded) that closes
 * after the last chunk, so the reader loop, cross-chunk frame buffering, and
 * TextDecoder streaming run for real.
 */
function readerFrom(chunks: Array<string | Uint8Array>): ReadableStreamDefaultReader<Uint8Array> {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(typeof chunk === 'string' ? encode(chunk) : chunk);
      }
      controller.close();
    },
  });
  return stream.getReader();
}

describe('parseFrame', () => {
  it('parses a named event with a JSON data line', () => {
    expect(parseFrame('event:delta\ndata:{"text":"hi"}')).toEqual({
      event: 'delta',
      data: { text: 'hi' },
    });
  });

  it('accepts data lines with and without a leading space', () => {
    expect(parseFrame('event:ping\ndata:{"seq":1}')).toEqual({ event: 'ping', data: { seq: 1 } });
    expect(parseFrame('event:ping\ndata: {"seq":1}')).toEqual({ event: 'ping', data: { seq: 1 } });
  });

  it('joins multiple data lines with a newline before parsing', () => {
    expect(parseFrame('event:delta\ndata:{"text":\ndata:"multi\\nline"}')).toEqual({
      event: 'delta',
      data: { text: 'multi\nline' },
    });
  });

  it('tolerates CRLF line endings', () => {
    expect(parseFrame('event:delta\r\ndata:{"text":"hi"}\r\n')).toEqual({
      event: 'delta',
      data: { text: 'hi' },
    });
  });

  it('returns null for empty, incomplete, or malformed frames', () => {
    expect(parseFrame('')).toBeNull();
    expect(parseFrame('event:delta')).toBeNull();
    expect(parseFrame('data:{"text":"hi"}')).toBeNull();
    expect(parseFrame('event:delta\ndata:not-json')).toBeNull();
    expect(parseFrame('event:delta\ndata:')).toBeNull();
  });
});

describe('consumeSseStream', () => {
  it('dispatches every complete frame in order and resolves on a terminal frame', async () => {
    const events: string[] = [];
    const onTransportError = vi.fn();

    await consumeSseStream(
      readerFrom([
        frame('delta', '{"text":"a"}'),
        frame('delta', '{"text":"b"}'),
        frame('done', '{}'),
      ]),
      undefined,
      {
        onFrame: (parsed) => {
          events.push(parsed.event);
          return parsed.event === 'done';
        },
        onTransportError,
      }
    );

    expect(events).toEqual(['delta', 'delta', 'done']);
    expect(onTransportError).not.toHaveBeenCalled();
  });

  it('buffers frames across chunk boundaries — even mid multi-byte character', async () => {
    const bytes = encode(frame('delta', '{"text":"北京"}') + frame('done', '{}'));
    // Byte 26 starts the first Chinese character: the cuts land inside its
    // 3-byte UTF-8 sequence and inside the frame terminator.
    const received: unknown[] = [];
    const onTransportError = vi.fn();

    await consumeSseStream(
      readerFrom([bytes.slice(0, 27), bytes.slice(27, 30), bytes.slice(30, 34), bytes.slice(34)]),
      undefined,
      {
        onFrame: (parsed) => {
          received.push(parsed.data);
          return parsed.event === 'done';
        },
        onTransportError,
      }
    );

    expect(received).toEqual([{ text: '北京' }, {}]);
    expect(onTransportError).not.toHaveBeenCalled();
  });

  it('stops at a terminal frame and cancels the reader', async () => {
    const events: string[] = [];
    const onCancel = vi.fn();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(
          encode(
            frame('delta', '{"text":"a"}') + frame('done', '{}') + frame('delta', '{"text":"late"}')
          )
        );
      },
      cancel: onCancel,
    });

    await consumeSseStream(stream.getReader(), undefined, {
      onFrame: (parsed) => {
        events.push(parsed.event);
        return parsed.event === 'done';
      },
      onTransportError: vi.fn(),
    });

    expect(events).toEqual(['delta', 'done']);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('stops silently when the caller aborts mid-stream', async () => {
    const controller = new AbortController();
    const events: string[] = [];
    const onTransportError = vi.fn();

    await consumeSseStream(
      readerFrom([
        frame('delta', '{"text":"first"}'),
        frame('delta', '{"text":"second"}'),
        frame('done', '{}'),
      ]),
      controller.signal,
      {
        onFrame: (parsed) => {
          events.push(parsed.event);
          controller.abort();
          return false;
        },
        onTransportError,
      }
    );

    expect(events).toEqual(['delta']);
    expect(onTransportError).not.toHaveBeenCalled();
  });

  it('reports a premature close as a transport error', async () => {
    const events: string[] = [];
    const onTransportError = vi.fn();

    await consumeSseStream(readerFrom([frame('delta', '{"text":"half"}')]), undefined, {
      onFrame: (parsed) => {
        events.push(parsed.event);
        return false;
      },
      onTransportError,
    });

    expect(events).toEqual(['delta']);
    expect(onTransportError).toHaveBeenCalledTimes(1);
  });

  it('reports a read failure as a transport error', async () => {
    const onFrame = vi.fn().mockReturnValue(false);
    const onTransportError = vi.fn();
    const reader = {
      read: vi
        .fn()
        .mockResolvedValueOnce({ done: false, value: encode(frame('delta', '{"text":"hi"}')) })
        .mockRejectedValueOnce(new TypeError('connection lost')),
      cancel: vi.fn().mockResolvedValue(undefined),
    } as unknown as ReadableStreamDefaultReader<Uint8Array>;

    await consumeSseStream(reader, undefined, { onFrame, onTransportError });

    expect(onFrame).toHaveBeenCalledTimes(1);
    expect(onTransportError).toHaveBeenCalledTimes(1);
  });

  it('stays silent when a pending read rejects with AbortError', async () => {
    const reader = {
      read: vi.fn().mockRejectedValue(Object.assign(new Error('aborted'), { name: 'AbortError' })),
      cancel: vi.fn().mockResolvedValue(undefined),
    } as unknown as ReadableStreamDefaultReader<Uint8Array>;
    const onFrame = vi.fn();
    const onTransportError = vi.fn();

    await consumeSseStream(reader, undefined, { onFrame, onTransportError });

    expect(onFrame).not.toHaveBeenCalled();
    expect(onTransportError).not.toHaveBeenCalled();
  });

  it('skips blank and malformed frames and keeps reading', async () => {
    const events: string[] = [];
    const onTransportError = vi.fn();

    await consumeSseStream(
      readerFrom([
        '\n\n',
        'event:delta\ndata:not-json\n\n',
        frame('delta', '{"text":"ok"}'),
        frame('done', '{}'),
      ]),
      undefined,
      {
        onFrame: (parsed) => {
          events.push(parsed.event);
          return parsed.event === 'done';
        },
        onTransportError,
      }
    );

    expect(events).toEqual(['delta', 'done']);
    expect(onTransportError).not.toHaveBeenCalled();
  });
});
