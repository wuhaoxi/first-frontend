'use client';

import { HomepageAiAssistantEntry } from '@/components/home/HomepageAiAssistantEntry';
import { HomepageFunctionNavigation } from '@/components/home/HomepageFunctionNavigation';
import { useAssistant } from '@/components/assistant/AssistantProvider';

/**
 * Thin wrappers that wire the two existing homepage components to the
 * assistant context — component bodies stay untouched.
 */

export function AssistantEntryTrigger() {
  const { open } = useAssistant();
  return <HomepageAiAssistantEntry onOpenAiAssistant={open} />;
}

export function AssistantNavigationTrigger() {
  const { open } = useAssistant();
  return <HomepageFunctionNavigation onOpenAiAssistant={open} />;
}
