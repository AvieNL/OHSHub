'use client';

import { useState } from 'react';
import Link from 'next/link';
import FaqInlineManager from './FaqInlineManager';
import MarkdownContent from '@/components/MarkdownContent';
import { renderWithFormulas } from '@/lib/render-with-formulas';
import type { FaqItem } from './FaqAccordion';

interface ThemeInfo {
  slug: string;
  name: string;
  iconClass: string;
  iconPaths: readonly string[];
}

interface FaqGroup {
  theme: ThemeInfo | null; // null = Algemeen
  items: FaqItem[];
}

interface Props {
  allItems: FaqItem[];
  groups: FaqGroup[];
  themeLookup: Record<string, ThemeInfo>;
  isAdmin: boolean;
}

export default function FaqAllSearch({ allItems, groups, themeLookup, isAdmin }: Props) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<string | null>(null);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? allItems.filter(
        (it) =>
          it.question.toLowerCase().includes(q) ||
          it.answer.toLowerCase().includes(q),
      )
    : [];

  const isSearching = q.length > 0;

  return (
    <div>
      {/* Zoekbalk */}
      <div className="mb-8 relative">
        <svg
          className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Zoek in alle veelgestelde vragen…"
          className="w-full rounded-xl border border-zinc-200 bg-white py-3 pl-12 pr-4 text-sm text-zinc-800 shadow-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-orange-900/30"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            aria-label="Zoekopdracht wissen"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Zoekresultaten */}
      {isSearching && (
        <>
          {filtered.length === 0 ? (
            <p className="py-4 text-sm text-zinc-400 dark:text-zinc-500">
              Geen resultaten voor{' '}
              <span className="font-medium text-zinc-600 dark:text-zinc-300">"{query}"</span>.
            </p>
          ) : (
            <div className="mb-4">
              <p className="mb-4 text-xs text-zinc-400 dark:text-zinc-500">
                {filtered.length} resultaat{filtered.length !== 1 ? 'en' : ''} voor{' '}
                <span className="font-medium text-zinc-600 dark:text-zinc-300">"{query}"</span>
              </p>
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {filtered.map((item) => {
                    const theme = item.theme_slug ? themeLookup[item.theme_slug] : null;
                    return (
                      <div key={item.id} className="px-6">
                        <div className="flex items-center gap-2 py-4">
                          <button
                            className="flex flex-1 items-start justify-between gap-4 text-left"
                            onClick={() => setOpen(open === item.id ? null : item.id)}
                            aria-expanded={open === item.id}
                          >
                            <div>
                              {theme && (
                                <span className={`mb-1 inline-flex items-center gap-1 text-xs font-medium ${theme.iconClass}`}>
                                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    {theme.iconPaths.map((d, i) => (
                                      <path key={i} strokeLinecap="round" strokeLinejoin="round" d={d} />
                                    ))}
                                  </svg>
                                  {theme.name}
                                </span>
                              )}
                              <p className="text-sm font-medium text-zinc-900 hover:text-orange-600 dark:text-zinc-100 dark:hover:text-orange-400">
                                {renderWithFormulas(item.question)}
                              </p>
                            </div>
                            <svg
                              className={`mt-0.5 h-4 w-4 shrink-0 text-zinc-400 transition-transform ${open === item.id ? 'rotate-180' : ''}`}
                              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>
                        {open === item.id && (
                          <div className="pb-4">
                            <MarkdownContent className="text-sm text-zinc-600 dark:text-zinc-400">
                              {item.answer}
                            </MarkdownContent>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Gegroepeerde weergave — verborgen tijdens zoeken */}
      {!isSearching && (
        <>
          {groups.map(({ theme, items }) => {
            const slug = theme?.slug ?? null;
            const hasItems = items.length > 0;
            if (!hasItems && !isAdmin) return null;
            return (
              <section key={slug ?? 'general'} className="mb-10">
                <div className="mb-4 flex items-center gap-2">
                  {theme ? (
                    <>
                      <svg
                        className={`h-4 w-4 shrink-0 ${theme.iconClass}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
                      >
                        {theme.iconPaths.map((d, i) => (
                          <path key={i} strokeLinecap="round" strokeLinejoin="round" d={d} />
                        ))}
                      </svg>
                      <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                        {theme.name}
                      </h2>
                      <Link
                        href={`/kennisportaal/${theme.slug}`}
                        className={`ml-auto text-xs font-medium ${theme.iconClass} hover:underline`}
                      >
                        Kennisblad →
                      </Link>
                    </>
                  ) : (
                    <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                      Algemeen
                    </h2>
                  )}
                </div>
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                  <FaqInlineManager items={items} themeSlug={slug} />
                </div>
              </section>
            );
          })}
        </>
      )}
    </div>
  );
}
