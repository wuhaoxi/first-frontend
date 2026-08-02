'use client';

import { Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    <Button
      onClick={handleClick}
      aria-label="AI 助手"
      className="fixed bottom-4 right-4 z-50 min-h-11 min-w-11 rounded-full shadow-lg p-3"
      size="icon"
    >
      <Bot className="h-6 w-6" aria-hidden="true" />
    </Button>
  );
}
