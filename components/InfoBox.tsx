'use client';

import { useState } from 'react';

interface InfoBoxProps {
  /** Titel zichtbaar in ingeklapte staat */
  title: React.ReactNode;
  children: React.ReactNode;
  /** Kleurvariant */
  variant?: 'zinc' | 'blue';
  /** Standaard ingeklapt (default: true) */
  defaultOpen?: boolean;
}

export function InfoBox({ title, children, variant = 'zinc', defaultOpen = false }: InfoBoxProps) {
  const [open, setOpen] = useState(defaultOpen);

  const base =
    variant === 'blue'
      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/15 dark:text-blue-300'
      : 'bg-zinc-50 text-zinc-500 dark:bg-zinc-800/50 dark:text-zinc-400';

  return (
    <div className={`rounded-lg text-xs ${base}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center justify-between gap-2 px-4 py-2.5 font-medium ${base}`}
      >
        <span>{title}</span>
        <svg
          className={`h-3.5 w-3.5 flex-shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className={`border-t px-4 pb-3 pt-2.5 ${
          variant === 'blue'
            ? 'border-blue-200/60 dark:border-blue-800/40'
            : 'border-zinc-200/80 dark:border-zinc-700/40'
        }`}>
          {children}
        </div>
      )}
    </div>
  );
}
