'use client';

import { useState } from 'react';
import MarkdownContent from '@/components/MarkdownContent';

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
  theme_slug: string | null;
};

export default function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<string | null>(null);

  if (items.length === 0) return null;

  return (
    <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
      {items.map((item) => (
        <div key={item.id}>
          <button
            className="flex w-full items-center justify-between gap-4 py-4 text-left text-sm font-medium text-zinc-900 hover:text-orange-600 dark:text-zinc-100 dark:hover:text-orange-400"
            onClick={() => setOpen(open === item.id ? null : item.id)}
            aria-expanded={open === item.id}
          >
            <span>{item.question}</span>
            <svg
              className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform ${open === item.id ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {open === item.id && (
            <div className="pb-4">
              <MarkdownContent className="text-sm text-zinc-600 dark:text-zinc-400">
                {item.answer}
              </MarkdownContent>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
