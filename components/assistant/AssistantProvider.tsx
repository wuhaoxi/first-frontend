'use client';

import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { streamAssistantMessage } from '@/lib/api/assistant';
import type { AssistantStreamHandlers } from '@/types/assistant';

export interface AssistantChatMessage {
  id: number;
  role: 'user' | 'assistant';
  text: string;
}

interface AssistantContextValue {
  isOpen: boolean;
  isStreaming: boolean;
  isUnauthorized: boolean;
  messages: AssistantChatMessage[];
  error: string | null;
  /** Bumped on every open() so the panel refocuses the input even when already open. */
  focusSignal: number;
  open: () => void;
  close: () => void;
  send: (text: string) => void;
  retry: () => void;
}

const AssistantContext = createContext<AssistantContextValue | undefined>(undefined);

/**
 * Homepage-scoped chat state machine: messages, streaming flag, conversationId,
 * and a per-turn AbortController. Terminal client callbacks (done/error/401)
 * always leave the machine non-streaming; aborting on close produces no further
 * callbacks, so close() settles the state itself.
 */
export function AssistantProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusSignal, setFocusSignal] = useState(0);
  const [messages, setMessages] = useState<AssistantChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isUnauthorized, setIsUnauthorized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const conversationIdRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const messageIdRef = useRef(0);

  const nextMessageId = () => {
    messageIdRef.current += 1;
    return messageIdRef.current;
  };

  const open = useCallback(() => {
    setIsOpen(true);
    setFocusSignal((n) => n + 1);
  }, []);

  const startTurn = useCallback((userText: string, appendUserBubble: boolean) => {
    const controller = new AbortController();
    abortRef.current = controller;
    setIsStreaming(true);
    setError(null);
    setMessages((prev) => {
      const base: AssistantChatMessage[] = appendUserBubble
        ? [...prev, { id: nextMessageId(), role: 'user', text: userText }]
        : prev;
      return [...base, { id: nextMessageId(), role: 'assistant', text: '' }];
    });

    const handlers: AssistantStreamHandlers = {
      onDelta: (text) => {
        setMessages((prev) =>
          prev.map((message, index) =>
            index === prev.length - 1 && message.role === 'assistant'
              ? { ...message, text: message.text + text }
              : message
          )
        );
      },
      onDone: (conversationId) => {
        conversationIdRef.current = conversationId;
        abortRef.current = null;
        setIsStreaming(false);
      },
      onError: (message) => {
        abortRef.current = null;
        setIsStreaming(false);
        setError(message);
      },
      onUnauthorized: () => {
        abortRef.current = null;
        setIsStreaming(false);
        setIsUnauthorized(true);
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          return last && last.role === 'assistant' && last.text === ''
            ? prev.slice(0, -1)
            : prev;
        });
      },
    };

    void streamAssistantMessage(
      {
        message: userText,
        conversationId: conversationIdRef.current ?? undefined,
      },
      handlers,
      { signal: controller.signal }
    );
  }, []);

  const send = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isStreaming) {
        return;
      }
      startTurn(trimmed, true);
    },
    [isStreaming, startTurn]
  );

  /** Re-sends the last user message, replacing the failed assistant bubble. */
  const retry = useCallback(() => {
    const withoutFailedReply =
      messages.length > 0 && messages[messages.length - 1].role === 'assistant'
        ? messages.slice(0, -1)
        : messages;
    const lastUser = [...withoutFailedReply].reverse().find((m) => m.role === 'user');
    if (!lastUser) {
      return;
    }
    setMessages(withoutFailedReply);
    startTurn(lastUser.text, false);
  }, [messages, startTurn]);

  const close = useCallback(() => {
    setIsOpen(false);
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  return (
    <AssistantContext.Provider
      value={{
        isOpen,
        isStreaming,
        isUnauthorized,
        messages,
        error,
        focusSignal,
        open,
        close,
        send,
        retry,
      }}
    >
      {children}
    </AssistantContext.Provider>
  );
}

export function useAssistant() {
  const context = useContext(AssistantContext);
  if (context === undefined) {
    throw new Error('useAssistant must be used within an AssistantProvider');
  }
  return context;
}
