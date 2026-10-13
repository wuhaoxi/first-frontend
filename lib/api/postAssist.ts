import { authFetch, type ApiResponse } from '@/lib/api/client';
import { consumeSseStream, isAbortError, type SseFrame } from '@/lib/api/sse';
import type {
  PostAssistRequest,
  PostPolishDeltaPayload,
  PostPolishErrorPayload,
  PostPolishStreamHandlers,
  PostPolishStreamOptions,
  TagSuggestionsResponse,
  TitleSuggestionsResponse,
} from '@/types/postAssist';

const TITLE_PATH = '/api/assistant/post-assist/title';
const TAGS_PATH = '/api/assistant/post-assist/tags';
const POLISH_PATH = '/api/assistant/post-assist/polish';
const NETWORK_ERROR_MESSAGE = 'Network error';
const FALLBACK_ERROR_MESSAGE = 'Request failed';

/** Requests up to three candidate titles from POST /api/assistant/post-assist/title. */
export function suggestTitles(
  request: PostAssistRequest
): Promise<ApiResponse<TitleSuggestionsResponse>> {
  return authFetch<TitleSuggestionsResponse>(TITLE_PATH, {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

/** Requests up to eight tag suggestions from POST /api/assistant/post-assist/tags. */
export function suggestTags(
  request: PostAssistRequest
): Promise<ApiResponse<TagSuggestionsResponse>> {
  return authFetch<TagSuggestionsResponse>(TAGS_PATH, {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

/**
 * Streams one polish pass from POST /api/assistant/post-assist/polish.
 *
 * Never throws and never resolves to a value: progress is reported through
 * `handlers`. Non-2xx responses are parsed as ErrorResponse JSON first
 * (401 → `onUnauthorized`); SSE frames are dispatched as soon as a complete
 * frame is buffered, so `onDelta` fires progressively. An aborted turn fires
 * no callback at all.
 */
export async function streamPostPolish(
  request: PostAssistRequest,
  handlers: PostPolishStreamHandlers,
  options?: PostPolishStreamOptions
): Promise<void> {
  const signal = options?.signal;

  let response: Response;
  try {
    const init: RequestInit = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(request),
    };
    if (signal) {
      init.signal = signal;
    }
    response = await fetch(POLISH_PATH, init);
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

  await consumeSseStream(response.body.getReader(), signal, {
    onFrame: (frame) => dispatchPolishFrame(frame, handlers),
    onTransportError: () => handlers.onError(NETWORK_ERROR_MESSAGE),
  });
}

/**
 * Dispatches one parsed SSE frame. Returns true when a terminal event
 * (done/error) was delivered; the `done` payload is ignored, and unknown
 * events or payloads of the wrong shape are skipped.
 */
function dispatchPolishFrame(frame: SseFrame, handlers: PostPolishStreamHandlers): boolean {
  switch (frame.event) {
    case 'delta': {
      const text = (frame.data as PostPolishDeltaPayload | null)?.text;
      if (typeof text === 'string') {
        handlers.onDelta(text);
      }
      return false;
    }
    case 'done':
      handlers.onDone();
      return true;
    case 'error': {
      const message = (frame.data as PostPolishErrorPayload | null)?.message;
      handlers.onError(typeof message === 'string' && message ? message : NETWORK_ERROR_MESSAGE);
      return true;
    }
    default:
      return false;
  }
}
