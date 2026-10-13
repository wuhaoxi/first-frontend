import { streamPostPolish, suggestTags, suggestTitles } from '@/lib/api/postAssist';
import type { PostPolishStreamHandlers } from '@/types/postAssist';

const encoder = new TextEncoder();
const encode = (text: string): Uint8Array => encoder.encode(text);

/** One complete SSE frame (named event + data field, blank-line terminated). */
function frame(event: string, data: string): string {
  return `event:${event}\ndata:${data}\n\n`;
}

/** Mocks global fetch with a JSON response; `status >= 400` makes it non-OK. */
function mockJsonFetch(
  status: number,
  body: unknown,
  statusText = ''
): ReturnType<typeof vi.fn> {
  const mockFetch = vi.fn().mockResolvedValue({
    ok: status < 400,
    status,
    statusText,
    json: () => Promise.resolve(body),
  });
  globalThis.fetch = mockFetch;
  return mockFetch;
}

/**
 * Mocks global fetch with a real ReadableStream body fed with the given chunks
 * (strings are UTF-8 encoded), so the shared reader loop runs for real.
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

function handlers(overrides: Partial<PostPolishStreamHandlers> = {}): PostPolishStreamHandlers {
  return {
    onDelta: vi.fn(),
    onDone: vi.fn(),
    onError: vi.fn(),
    onUnauthorized: vi.fn(),
    ...overrides,
  };
}

describe('post-assist API client', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('suggestTitles POSTs the request body and returns the suggestions', async () => {
    const fetchMock = mockJsonFetch(200, { suggestions: ['Option A', 'Option B'] });

    const result = await suggestTitles({ title: 'My trip', content: 'A post' });

    expect(result).toEqual({ ok: true, data: { suggestions: ['Option A', 'Option B'] }, message: null });
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/assistant/post-assist/title');
    expect(init.method).toBe('POST');
    expect(init.credentials).toBe('include');
    expect(JSON.parse(init.body as string)).toEqual({ title: 'My trip', content: 'A post' });
  });

  it('suggestTags POSTs the request body and returns the tags', async () => {
    const fetchMock = mockJsonFetch(200, { tags: ['food', 'history'] });

    const result = await suggestTags({ content: 'A post' });

    expect(result).toEqual({ ok: true, data: { tags: ['food', 'history'] }, message: null });
    const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/assistant/post-assist/tags');
  });

  it('suggestTitles surfaces the 400 message', async () => {
    mockJsonFetch(400, { message: 'content must not be blank', status: 400 }, 'Bad Request');

    const result = await suggestTitles({ content: '   ' });

    expect(result).toEqual({ ok: false, data: null, message: 'content must not be blank' });
  });

  it('suggestTitles surfaces the 401 message', async () => {
    mockJsonFetch(401, { message: 'Authentication required', status: 401 }, 'Unauthorized');

    const result = await suggestTitles({ content: 'A post' });

    expect(result).toEqual({ ok: false, data: null, message: 'Authentication required' });
  });

  it('suggestTitles surfaces the 429 message', async () => {
    mockJsonFetch(
      429,
      { message: 'Too many assistant requests — try again in a minute', status: 429 },
      'Too Many Requests'
    );

    const result = await suggestTitles({ content: 'A post' });

    expect(result).toEqual({
      ok: false,
      data: null,
      message: 'Too many assistant requests — try again in a minute',
    });
  });

  it('suggestTitles surfaces the 503 message', async () => {
    mockJsonFetch(
      503,
      { message: 'The assistant is temporarily unavailable. Please try again.', status: 503 },
      'Service Unavailable'
    );

    const result = await suggestTitles({ content: 'A post' });

    expect(result).toEqual({
      ok: false,
      data: null,
      message: 'The assistant is temporarily unavailable. Please try again.',
    });
  });
});

describe('streamPostPolish', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('POSTs the request and dispatches deltas in order, then done', async () => {
    const fetchMock = mockStreamFetch(
      frame('delta', '{"text":"Better "}'),
      frame('delta', '{"text":"content"}'),
      frame('done', '{}')
    );
    const deltas: string[] = [];
    const h = handlers({ onDelta: (text) => deltas.push(text) });

    await streamPostPolish({ content: 'A post' }, h);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/assistant/post-assist/polish');
    expect(init.method).toBe('POST');
    expect(init.credentials).toBe('include');
    expect(JSON.parse(init.body as string)).toEqual({ content: 'A post' });
    expect(deltas).toEqual(['Better ', 'content']);
    expect(h.onDone).toHaveBeenCalledTimes(1);
    expect(h.onError).not.toHaveBeenCalled();
    expect(h.onUnauthorized).not.toHaveBeenCalled();
  });

  it('dispatches a sanitized terminal error frame', async () => {
    mockStreamFetch(
      frame('delta', '{"text":"Half"}'),
      frame('error', '{"message":"The assistant is temporarily unavailable. Please try again."}')
    );
    const h = handlers();

    await streamPostPolish({ content: 'A post' }, h);

    expect(h.onError).toHaveBeenCalledWith(
      'The assistant is temporarily unavailable. Please try again.'
    );
    expect(h.onDone).not.toHaveBeenCalled();
  });

  it('reports 401 through onUnauthorized only', async () => {
    mockStatusResponse(401, { message: 'Authentication required' }, 'Unauthorized');
    const h = handlers();

    await streamPostPolish({ content: 'A post' }, h);

    expect(h.onUnauthorized).toHaveBeenCalledTimes(1);
    expect(h.onError).not.toHaveBeenCalled();
    expect(h.onDone).not.toHaveBeenCalled();
  });

  it('reports guard failures as JSON errors', async () => {
    mockStatusResponse(
      429,
      { message: 'Too many assistant requests — try again in a minute' },
      'Too Many Requests'
    );
    const h = handlers();

    await streamPostPolish({ content: 'A post' }, h);

    expect(h.onError).toHaveBeenCalledWith('Too many assistant requests — try again in a minute');
    expect(h.onUnauthorized).not.toHaveBeenCalled();
  });

  it('stops dispatching after the caller aborts mid-stream', async () => {
    mockStreamFetch(
      frame('delta', '{"text":"First"}'),
      frame('delta', '{"text":"Second"}'),
      frame('done', '{}')
    );
    const controller = new AbortController();
    const deltas: string[] = [];
    const h = handlers({
      onDelta: (text) => {
        deltas.push(text);
        controller.abort();
      },
    });

    await streamPostPolish({ content: 'A post' }, h, { signal: controller.signal });

    expect(deltas).toEqual(['First']);
    expect(h.onDone).not.toHaveBeenCalled();
    expect(h.onError).not.toHaveBeenCalled();
  });

  it('ignores malformed and unknown frames and keeps reading', async () => {
    mockStreamFetch(
      'event:delta\ndata:not-json\n\n',
      frame('ping', '{"seq":1}'),
      frame('delta', '{"text":"Hi"}'),
      frame('done', '{}')
    );
    const deltas: string[] = [];
    const h = handlers({ onDelta: (text) => deltas.push(text) });

    await streamPostPolish({ content: 'A post' }, h);

    expect(deltas).toEqual(['Hi']);
    expect(h.onDone).toHaveBeenCalledTimes(1);
    expect(h.onError).not.toHaveBeenCalled();
  });

  it('reports a premature close without a terminal frame', async () => {
    mockStreamFetch(frame('delta', '{"text":"Half"}'));
    const h = handlers();

    await streamPostPolish({ content: 'A post' }, h);

    expect(h.onDone).not.toHaveBeenCalled();
    expect(h.onError).toHaveBeenCalledWith('Network error');
  });

  it('reports fetch rejections as a network error', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('fetch failed'));
    const h = handlers();

    await streamPostPolish({ content: 'A post' }, h);

    expect(h.onError).toHaveBeenCalledWith('Network error');
    expect(h.onDone).not.toHaveBeenCalled();
  });
});
