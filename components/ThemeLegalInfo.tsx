'use client';

import { useState } from 'react';
import type { ThemeLegalData, ThemeLimitGroup } from '@/lib/theme-legal-info';
import { parseLegalItems, parseLegalJson } from '@/lib/theme-legal-info';
import ThemeLegalContent from '@/components/ThemeLegalContent';

interface ThemeLegalInfoProps extends ThemeLegalData {
  className?: string;
  contentOverrides?: Record<string, string>;
  namespace?: string;
}

export default function ThemeLegalInfo({
  color,
  legislation: fallbackLegislation,
  norms: fallbackNorms,
  limitGroups: fallbackLimitGroups,
  comfortGroups: fallbackComfortGroups,
  className = '',
  contentOverrides,
  namespace,
}: ThemeLegalInfoProps) {
  const [open, setOpen] = useState(false);

  const legislation = parseLegalItems(contentOverrides?.['legislation'], fallbackLegislation);
  const norms       = parseLegalItems(contentOverrides?.['norms'], fallbackNorms);
  const limitGroups = parseLegalJson<ThemeLimitGroup[] | undefined>(
    contentOverrides?.['limitGroups'],
    fallbackLimitGroups,
  );
  const comfortGroups = parseLegalJson<ThemeLimitGroup[] | undefined>(
    contentOverrides?.['comfortGroups'],
    fallbackComfortGroups,
  );


  return (
    <div className={className}>
      <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">

        {/* Inklapbare header */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
        >
          <div className="flex items-center gap-2.5">
            <span className={`h-2 w-2 flex-shrink-0 rounded-full ${color.dot}`} />
            <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
              Wettelijk kader &amp; normen
            </span>
          </div>
          <svg
            className={`h-4 w-4 flex-shrink-0 text-zinc-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {open && (
          <div className="border-t border-zinc-100 p-4 dark:border-zinc-800">
            <ThemeLegalContent
              legislation={legislation}
              norms={norms}
              limitGroups={limitGroups}
              comfortGroups={comfortGroups}
              color={color}
              namespace={namespace}
            />
          </div>
        )}

      </div>
    </div>
  );
}
