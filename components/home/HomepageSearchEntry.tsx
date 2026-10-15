'use client';

import { useState, useRef, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

interface HomepageSearchEntryProps {
  placeholder?: string;
  onSearch?: (keyword: string) => void;
}

const DEFAULT_PLACEHOLDER = 'Search attractions by name\u2026';

export function HomepageSearchEntry({
  placeholder = DEFAULT_PLACEHOLDER,
  onSearch,
}: HomepageSearchEntryProps) {
  const [keyword, setKeyword] = useState('');
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const defaultOnSearch = (kw: string) => {
    router.push(`/attractions?q=${encodeURIComponent(kw)}`);
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
    <form onSubmit={handleSubmit} className="w-full" role="search">
      <label htmlFor="homepage-search" className="sr-only">
        Search attractions
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          id="homepage-search"
          type="text"
          className="h-12 w-full rounded-full border border-input bg-background pl-5 pr-12 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder={placeholder}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          aria-label="Search attractions"
        />
        <button
          type="submit"
          aria-label="Search"
          className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Search className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </form>
  );
}
