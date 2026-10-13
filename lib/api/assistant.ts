import { consumeSseStream, isAbortError, type SseFrame } from '@/lib/api/sse';
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

  await consumeSseStream(response.body.getReader(), signal, {
    onFrame: (frame) => dispatchFrame(frame, handlers),
    onTransportError: () => handlers.onError(NETWORK_ERROR_MESSAGE),
  });
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
 * Dispatches one parsed SSE frame to the assistant handlers. Returns true when
 * a terminal event (done/error) was delivered; unknown events and payloads of
 * the wrong shape are ignored.
 */
function dispatchFrame(frame: SseFrame, handlers: AssistantStreamHandlers): boolean {
  switch (frame.event) {
    case 'delta': {
      const text = (frame.data as AssistantDeltaPayload | null)?.text;
      if (typeof text === 'string') {
        handlers.onDelta(text);
      }
      return false;
    }
    case 'done': {
      const conversationId = (frame.data as AssistantDonePayload | null)?.conversationId;
      if (typeof conversationId === 'string') {
        handlers.onDone(conversationId);
        return true;
      }
      return false;
    }
    case 'error': {
      const message = (frame.data as AssistantErrorPayload | null)?.message;
      handlers.onError(typeof message === 'string' && message ? message : NETWORK_ERROR_MESSAGE);
      return true;
    }
    default:
      return false;
  }
}
