'use client';

import Link from 'next/link';
import { Users, Map, Bot } from 'lucide-react';

export interface FunctionNavItem {
  key: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action: 'link' | 'ai-assistant';
  href?: string;
}

interface HomepageFunctionNavigationProps {
  items?: FunctionNavItem[];
  onOpenAiAssistant?: () => void;
}

const DEFAULT_ITEMS: FunctionNavItem[] = [
  {
    key: 'community',
    title: '旅游社区',
    description: 'Share travel stories and tips with fellow travelers',
    icon: <Users className="h-8 w-8" aria-hidden="true" />,
    action: 'link',
    href: '/community',
  },
  {
    key: 'guides',
    title: '景点攻略',
    description: 'Discover detailed guides for top destinations',
    icon: <Map className="h-8 w-8" aria-hidden="true" />,
    action: 'link',
    href: '/guides',
  },
  {
    key: 'ai-assistant',
    title: 'AI 助手',
    description: 'Plan your trip with our intelligent assistant',
    icon: <Bot className="h-8 w-8" aria-hidden="true" />,
    action: 'ai-assistant',
  },
];

export function HomepageFunctionNavigation({
  items = DEFAULT_ITEMS,
  onOpenAiAssistant,
}: HomepageFunctionNavigationProps) {
  const handleAiClick = () => {
    if (onOpenAiAssistant) {
      onOpenAiAssistant();
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {items.map((item) => {
        if (item.action === 'link' && item.href) {
          return (
            <Link
              key={item.key}
              href={item.href}
              className="flex flex-col items-center gap-2 rounded-xl border bg-card p-6 text-card-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[88px]"
            >
              {item.icon}
              <span className="font-semibold">{item.title}</span>
              <span className="text-sm text-muted-foreground text-center">{item.description}</span>
            </Link>
          );
        }

        return (
          <button
            key={item.key}
            onClick={handleAiClick}
            className="flex flex-col items-center gap-2 rounded-xl border bg-card p-6 text-card-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[88px]"
          >
            {item.icon}
            <span className="font-semibold">{item.title}</span>
            <span className="text-sm text-muted-foreground text-center">{item.description}</span>
          </button>
        );
      })}
    </div>
  );
}
