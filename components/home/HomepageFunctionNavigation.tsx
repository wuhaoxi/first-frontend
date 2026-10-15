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

const CARD_CLASS =
  'flex min-h-[88px] flex-col items-center gap-3 rounded-xl border bg-card p-6 text-center text-card-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

const ICON_CHIP_CLASS = 'flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary';

const DEFAULT_ITEMS: FunctionNavItem[] = [
  {
    key: 'community',
    title: 'Community',
    description: 'Share travel stories and tips with fellow travelers',
    icon: <Users className="h-6 w-6" aria-hidden="true" />,
    action: 'link',
    href: '/posts',
  },
  {
    key: 'attractions',
    title: 'Attractions',
    description: 'Browse top attractions across China',
    icon: <Map className="h-6 w-6" aria-hidden="true" />,
    action: 'link',
    href: '/attractions',
  },
  {
    key: 'ai-assistant',
    title: 'AI Assistant',
    description: 'Plan your trip with our intelligent assistant',
    icon: <Bot className="h-6 w-6" aria-hidden="true" />,
    action: 'ai-assistant',
  },
];

function CardContent({ item }: { item: FunctionNavItem }) {
  return (
    <>
      <span className={ICON_CHIP_CLASS}>{item.icon}</span>
      <span className="font-semibold">{item.title}</span>
      <span className="text-sm text-muted-foreground">{item.description}</span>
    </>
  );
}

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
            <Link key={item.key} href={item.href} className={CARD_CLASS}>
              <CardContent item={item} />
            </Link>
          );
        }

        return (
          <button key={item.key} type="button" onClick={handleAiClick} className={CARD_CLASS}>
            <CardContent item={item} />
          </button>
        );
      })}
    </div>
  );
}
