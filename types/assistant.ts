/** Request body for POST /api/assistant/chat (mirrors the backend record). */
export interface AssistantChatRequest {
  message: string;
  /** Omitted for a fresh conversation — the server generates and returns one in `done`. */
  conversationId?: string;
}

/** `delta` frame payload — a fragment of the assistant reply, appended in arrival order. */
export interface AssistantDeltaPayload {
  text: string;
}

/** Terminal `done` frame payload — echoes or newly generates the conversation id. */
export interface AssistantDonePayload {
  conversationId: string;
}

/** Terminal `error` frame payload — sanitized server message, safe to display. */
export interface AssistantErrorPayload {
  message: string;
}

/**
 * Callbacks consumed by `streamAssistantMessage`. Per turn exactly one terminal
 * callback fires: `onDone`, `onError`, or `onUnauthorized`; `onDelta` may fire
 * any number of times before it. An aborted turn fires no callback at all.
 */
export interface AssistantStreamHandlers {
  onDelta: (text: string) => void;
  onDone: (conversationId: string) => void;
  onError: (message: string) => void;
  onUnauthorized: () => void;
}

/** Optional controls for `streamAssistantMessage`. */
export interface AssistantStreamOptions {
  signal?: AbortSignal;
}
