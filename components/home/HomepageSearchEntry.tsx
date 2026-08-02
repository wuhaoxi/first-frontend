'use client';

import { useState, useRef, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HomepageSearchEntryProps {
  placeholder?: string;
  onSearch?: (keyword: string) => void;
}

const DEFAULT_PLACEHOLDER = 'Search guides, cities, destinations\u2026';

export function HomepageSearchEntry({
  placeholder = DEFAULT_PLACEHOLDER,
  onSearch,
}: HomepageSearchEntryProps) {
  const [keyword, setKeyword] = useState('');
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const defaultOnSearch = (kw: string) => {
    router.push(`/guides?q=${encodeURIComponent(kw)}`);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = keyword.trim();

    if (!trimmed) {
      inputRef.current?.focus();
      return;
    }

    const handler = onSearch ?? defaultOnSearch;
    handler(trimmed);
    setKeyword('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 w-full" role="search">
      <label htmlFor="homepage-search" className="sr-only">
        Search destinations
      </label>
      <input
        ref={inputRef}
        id="homepage-search"
        type="text"
        className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        placeholder={placeholder}
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        aria-label="Search destinations"
      />
      <Button type="submit" size="sm" aria-label="Search">
        <Search className="h-4 w-4" />
        <span className="ml-1 hidden sm:inline">Search</span>
      </Button>
    </form>
  );
}
