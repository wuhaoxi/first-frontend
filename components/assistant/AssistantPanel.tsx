'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Send, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useAssistant } from '@/components/assistant/AssistantProvider';

const MAX_MESSAGE_LENGTH = 2000;

/**
 * Non-modal floating chat card: fixed above the entry button on desktop,
 * near-full-width bottom sheet on mobile. The transcript container for each
 * assistant reply is an aria-live region so streamed deltas are announced.
 */
export function AssistantPanel() {
  const { isOpen, close, messages, isStreaming, isUnauthorized, error, send, retry, focusSignal } =
    useAssistant();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState('');

  // Focus the input whenever the panel opens — and on re-trigger while open.
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen, focusSignal]);

  // Escape closes the panel from anywhere within it.
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, close]);

  // Keep the transcript pinned to the latest content.
  useEffect(() => {
    const transcript = transcriptRef.current;
    if (transcript) {
      transcript.scrollTop = transcript.scrollHeight;
    }
  }, [messages]);

  if (!isOpen) {
    return null;
  }

  const trimmed = draft.trim();
  const tooLong = draft.length > MAX_MESSAGE_LENGTH;
  const canSend = !isStreaming && !isUnauthorized && trimmed.length > 0 && !tooLong;
  const lastMessage = messages[messages.length - 1];
  const thinking = isStreaming && lastMessage?.role === 'assistant' && lastMessage.text === '';

  const handleSend = () => {
    if (!canSend) {
      return;
    }
    send(trimmed);
    setDraft('');
  };

  return (
    <div
      role="dialog"
      aria-label="AI Assistant"
      className="fixed bottom-20 right-4 z-[60] flex max-h-[70vh] w-[calc(100vw-2rem)] flex-col rounded-xl border bg-background shadow-lg sm:max-h-[32rem] sm:w-96"
    >
      <div className="flex items-center justify-between border-b px-4 py-3">
        <span className="font-semibold">AI Assistant</span>
        <Button variant="ghost" size="icon-sm" aria-label="Close" onClick={close}>
          <X aria-hidden="true" />
        </Button>
      </div>

      <div ref={transcriptRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {messages.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Ask about weather, exchange rates, or trip planning.
          </p>
        )}
        {messages.map((message) =>
          message.role === 'user' ? (
            <div
              key={message.id}
              className="ml-auto w-fit max-w-[85%] rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground"
            >
              {message.text}
            </div>
          ) : (
            <div
              key={message.id}
              aria-live="polite"
              className="w-fit max-w-[85%] rounded-lg bg-muted px-3 py-2 text-sm [overflow-wrap:anywhere]"
            >
              {message.text}
            </div>
          )
        )}
        {thinking && (
          <div
            role="status"
            className="w-fit rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground"
          >
            Thinking…
          </div>
        )}
        {isUnauthorized && (
          <p className="text-sm">
            Log in to use the AI assistant.{' '}
            <Link href="/login" className="underline">
              Log in
            </Link>
          </p>
        )}
        {error && (
          <Alert variant="destructive">
            <AlertDescription className="flex items-center justify-between gap-3">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={retry}>
                Try again
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </div>

      <div className="border-t p-3">
        {tooLong && (
          <p className="mb-2 text-xs text-destructive">
            Message is limited to 2000 characters.
          </p>
        )}
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            aria-label="Message"
            placeholder="Ask me anything about your trip…"
            rows={2}
            value={draft}
            disabled={isStreaming || isUnauthorized}
            onChange={(event) => setDraft(event.target.value)}
            className="max-h-24 flex-1 resize-none rounded-lg border bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          />
          <Button aria-label="Send" size="icon" disabled={!canSend} onClick={handleSend}>
            <Send aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}
