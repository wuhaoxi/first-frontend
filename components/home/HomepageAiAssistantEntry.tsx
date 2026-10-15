'use client';

import { Bot } from 'lucide-react';

interface HomepageAiAssistantEntryProps {
  onOpenAiAssistant?: () => void;
  position?: 'bottom-right';
}

export function HomepageAiAssistantEntry({
  onOpenAiAssistant,
}: HomepageAiAssistantEntryProps) {
  const handleClick = () => {
    if (onOpenAiAssistant) {
      onOpenAiAssistant();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="AI Assistant"
      className="fixed bottom-4 right-4 z-50 inline-flex h-12 items-center gap-2 rounded-full bg-primary px-5 text-primary-foreground shadow-lg transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Bot className="h-5 w-5" aria-hidden="true" />
      <span>AI Assistant</span>
    </button>
  );
}
