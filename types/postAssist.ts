/** Request body for the three POST /api/assistant/post-assist/* endpoints (mirrors the backend record). */
export interface PostAssistRequest {
  title?: string;
  content: string;
}

/** 200 response of POST /api/assistant/post-assist/title — 1–3 candidate titles. */
export interface TitleSuggestionsResponse {
  suggestions: string[];
}

/** 200 response of POST /api/assistant/post-assist/tags — 1–8 short tags, no commas. */
export interface TagSuggestionsResponse {
  tags: string[];
}

/** `delta` frame payload — a fragment of the polished content, appended in arrival order. */
export interface PostPolishDeltaPayload {
  text: string;
}

/** Terminal `error` frame payload — sanitized server message, safe to display. */
export interface PostPolishErrorPayload {
  message: string;
}

/**
 * Callbacks consumed by `streamPostPolish`. The terminal `done` frame carries
 * an empty payload, so `onDone` takes no argument. Per turn exactly one
 * terminal callback fires: `onDone`, `onError`, or `onUnauthorized`; `onDelta`
 * may fire any number of times before it. An aborted turn fires no callback
 * at all.
 */
export interface PostPolishStreamHandlers {
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (message: string) => void;
  onUnauthorized: () => void;
}

/** Optional controls for `streamPostPolish`. */
export interface PostPolishStreamOptions {
  signal?: AbortSignal;
}
