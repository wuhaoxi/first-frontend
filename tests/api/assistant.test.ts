import { streamAssistantMessage } from '@/lib/api/assistant';
import type { AssistantStreamHandlers } from '@/types/assistant';

const encoder = new TextEncoder();
const encode = (text: string): Uint8Array => encoder.encode(text);

/** One complete SSE frame (named event + data field, blank-line terminated). */
function frame(event: string, data: string): string {
  return `event:${event}\ndata:${data}\n\n`;
}

/**
 * Mocks global fetch with a real ReadableStream body fed with the given chunks
 * (strings are UTF-8 encoded), so the client's reader loop, cross-chunk frame
 * buffering, and TextDecoder streaming run for real.
 */
function mockStreamFetch(...chunks: Array<string | Uint8Array>): ReturnType<typeof vi.fn> {
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(typeof chunk === 'string' ? encode(chunk) : chunk);
      }
      controller.close();
    },
  });
  const mockFetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    statusText: 'OK',
    body,
    json: () => Promise.reject(new Error('no json body')),
  });
  globalThis.fetch = mockFetch;
  return mockFetch;
}

/** Mocks global fetch with a non-OK response; `jsonBody === undefined` makes body parsing fail. */
function mockStatusResponse(status: number, jsonBody: unknown, statusText = ''): void {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: false,
    status,
    statusText,
    body: null,
    json: () =>
      jsonBody === undefined
        ? Promise.reject(new Error('not json'))
        : Promise.resolve(jsonBody),
  });
}

function handlers(overrides: Partial<AssistantStreamHandlers> = {}): AssistantStreamHandlers {
  return {
    onDelta: vi.fn(),
    onDone: vi.fn(),
    onError: vi.fn(),
    onUnauthorized: vi.fn(),
    ...overrides,
  };
}

describe('assistant SSE client', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('posts the message with credentials and dispatches deltas in order, then done', async () => {
    const fetchMock = mockStreamFetch(
      frame('delta', '{"text":"北京 "}'),
      frame('delta', '{"text":"今天 "}'),
      frame('delta', '{"text":"晴"}'),
      frame('done', '{"conversationId":"conv-42"}')
    );
    const deltas: string[] = [];
    const h = handlers({ onDelta: (text) => deltas.push(text) });

    await streamAssistantMessage({ message: '北京天气' }, h);

    expect(fetchMock).toHaveBeenCalledWith('/api/assistant/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: '{"message":"北京天气"}',
    });
    expect(deltas).toEqual(['北京 ', '今天 ', '晴']);
    expect(h.onDone).toHaveBeenCalledWith('conv-42');
    expect(h.onError).not.toHaveBeenCalled();
    expect(h.onUnauthorized).not.toHaveBeenCalled();
  });

  it('carries an existing conversationId in the request body', async () => {
    const fetchMock = mockStreamFetch(frame('done', '{"conversationId":"conv-1"}'));
    const h = handlers();

    await streamAssistantMessage({ message: 'What is my name?', conversationId: 'conv-1' }, h);

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(JSON.parse(init.body as string)).toEqual({
      message: 'What is my name?',
      conversationId: 'conv-1',
    });
    expect(h.onDone).toHaveBeenCalledWith('conv-1');
  });

  it('buffers frames split across chunk boundaries — even mid multi-byte character', async () => {
    const bytes = encode(
      frame('delta', '{"text":"北京"}') + frame('done', '{"conversationId":"c9"}')
    );
    // Byte 26 starts the first Chinese character: the cuts land inside its
    // 3-byte UTF-8 sequence and inside the frame terminator.
    mockStreamFetch(bytes.slice(0, 27), bytes.slice(27, 30), bytes.slice(30, 34), bytes.slice(34));
    const deltas: string[] = [];
    const h = handlers({ onDelta: (text) => deltas.push(text) });

    await streamAssistantMessage({ message: 'hi' }, h);

    expect(deltas).toEqual(['北京']);
    expect(h.onDone).toHaveBeenCalledWith('c9');
  });

  it('joins multi-line data fields before parsing', async () => {
    mockStreamFetch(
      'event:delta\ndata:{"text":\ndata:"multi\\nline"}\n\n',
      frame('done', '{"conversationId":"c1"}')
    );
    const deltas: string[] = [];
    const h = handlers({ onDelta: (text) => deltas.push(text) });

    await streamAssistantMessage({ message: 'hi' }, h);

    expect(deltas).toEqual(['multi\nline']);
    expect(h.onDone).toHaveBeenCalledWith('c1');
  });

  it('ignores unknown events and keeps streaming', async () => {
    mockStreamFetch(
      frame('ping', '{"seq":1}'),
      frame('delta', '{"text":"Hi"}'),
      frame('done', '{"conversationId":"c2"}')
    );
    const deltas: string[] = [];
    const h = handlers({ onDelta: (text) => deltas.push(text) });

    await streamAssistantMessage({ message: 'hi' }, h);

    expect(deltas).toEqual(['Hi']);
    expect(h.onDone).toHaveBeenCalledWith('c2');
    expect(h.onError).not.toHaveBeenCalled();
  });

  it('stays silent when fetch rejects with AbortError', async () => {
    globalThis.fetch = vi
      .fn()
      .mockRejectedValue(Object.assign(new Error('aborted'), { name: 'AbortError' }));
    const h = handlers();

    await streamAssistantMessage({ message: 'hi' }, h);

    expect(h.onDelta).not.toHaveBeenCalled();
    expect(h.onDone).not.toHaveBeenCalled();
    expect(h.onError).not.toHaveBeenCalled();
    expect(h.onUnauthorized).not.toHaveBeenCalled();
  });

  it('stops dispatching after the caller aborts mid-stream', async () => {
    mockStreamFetch(
      frame('delta', '{"text":"First"}'),
      frame('delta', '{"text":"Second"}'),
      frame('done', '{"conversationId":"c3"}')
    );
    const controller = new AbortController();
    const deltas: string[] = [];
    const h = handlers({
      onDelta: (text) => {
        deltas.push(text);
        controller.abort();
      },
    });

    await streamAssistantMessage({ message: 'hi' }, h, { signal: controller.signal });

    expect(deltas).toEqual(['First']);
    expect(h.onDone).not.toHaveBeenCalled();
    expect(h.onError).not.toHaveBeenCalled();
  });

  it('reports 401 through onUnauthorized only', async () => {
    mockStatusResponse(401, { message: 'Authentication required' }, 'Unauthorized');
    const h = handlers();

    await streamAssistantMessage({ message: 'hi' }, h);

    expect(h.onUnauthorized).toHaveBeenCalledTimes(1);
    expect(h.onError).not.toHaveBeenCalled();
    expect(h.onDone).not.toHaveBeenCalled();
  });

  it('reports 429 with the server message', async () => {
    mockStatusResponse(
      429,
      { message: 'Too many assistant requests — try again in a minute' },
      'Too Many Requests'
    );
    const h = handlers();

    await streamAssistantMessage({ message: 'hi' }, h);

    expect(h.onError).toHaveBeenCalledWith('Too many assistant requests — try again in a minute');
    expect(h.onUnauthorized).not.toHaveBeenCalled();
  });

  it('reports 503 with the server message', async () => {
    mockStatusResponse(
      503,
      { message: 'The assistant is temporarily unavailable. Please try again.' },
      'Service Unavailable'
    );
    const h = handlers();

    await streamAssistantMessage({ message: 'hi' }, h);

    expect(h.onError).toHaveBeenCalledWith(
      'The assistant is temporarily unavailable. Please try again.'
    );
  });

  it('falls back to the HTTP status text when the error body is not JSON', async () => {
    mockStatusResponse(503, undefined, 'Service Unavailable');
    const h = handlers();

    await streamAssistantMessage({ message: 'hi' }, h);

    expect(h.onError).toHaveBeenCalledWith('Service Unavailable');
  });

  it('reports fetch rejections as a network error', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('fetch failed'));
    const h = handlers();

    await streamAssistantMessage({ message: 'hi' }, h);

    expect(h.onError).toHaveBeenCalledWith('Network error');
    expect(h.onDone).not.toHaveBeenCalled();
  });

  it('reports an error when the stream closes without a terminal event', async () => {
    mockStreamFetch(frame('delta', '{"text":"Half"}'));
    const deltas: string[] = [];
    const h = handlers({ onDelta: (text) => deltas.push(text) });

    await streamAssistantMessage({ message: 'hi' }, h);

    expect(deltas).toEqual(['Half']);
    expect(h.onDone).not.toHaveBeenCalled();
    expect(h.onError).toHaveBeenCalledWith('Network error');
  });
});
