'use client';

import { useState } from 'react';
import type { ThemeLegalData } from '@/lib/theme-legal-info';
import { Formula } from '@/components/Formula';

/**
 * Splits a string on `{{LaTeX}}` markers and renders the math parts via KaTeX.
 * Plain text segments pass through unchanged.
 * Example: "Dagblootstelling {{L_{EX,8h}}} — art. 6.5"
 */
function renderWithFormulas(text: string) {
  const parts = text.split(/(\[\[[^\]]+\]\])/);
  if (parts.length === 1) return text;
  return (
    <>
      {parts.map((part, i) => {
        const match = part.match(/^\[\[(.+)\]\]$/);
        return match ? <Formula key={i} math={match[1]} /> : part;
      })}
    </>
  );
}

interface ThemeLegalInfoProps extends ThemeLegalData {
  /** Extra klassen op de buitenste wrapper, bijv. 'mt-8' op werkpagina's */
  className?: string;
}

export default function ThemeLegalInfo({
  color,
  legislation,
  norms,
  limitGroups,
  adminObligations,
  className = '',
}: ThemeLegalInfoProps) {
  const [open, setOpen] = useState(false);

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

        {/* Vier losse sub-panelen in een grid */}
        {open && (
          <div className="border-t border-zinc-100 p-4 dark:border-zinc-800">
            <div className="grid gap-3 sm:grid-cols-2">

              {/* Wetgeving */}
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
                <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Wetgeving
                </h3>
                <ul className="space-y-1.5">
                  {legislation.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                      <span className={`mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full ${color.dot}`} />
                      {renderWithFormulas(item)}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Toepasselijke normen */}
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
                <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Toepasselijke normen
                </h3>
                <ul className="space-y-3">
                  {norms.map((n, i) => (
                    <li key={i}>
                      <div className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{renderWithFormulas(n.name)}</div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">{renderWithFormulas(n.desc)}</div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Grenswaarden */}
              {limitGroups && limitGroups.length > 0 && (
                <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
                  <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Grenswaarden
                  </h3>
                  <div className="space-y-4">
                    {limitGroups.map((group, gi) => (
                      <div key={gi}>
                        <div className="mb-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                          {renderWithFormulas(group.title)}
                        </div>
                        <div className="space-y-1.5">
                          {group.limits.map((lim, li) => (
                            <div
                              key={li}
                              className={`flex items-center justify-between rounded-lg border px-3 py-2 ${color.limitBg} ${color.limitBorder}`}
                            >
                              <span className="text-xs text-zinc-600 dark:text-zinc-400">
                                {renderWithFormulas(lim.label)}
                                {lim.sublabel && (
                                  <span className="ml-1 text-zinc-400 dark:text-zinc-500">({renderWithFormulas(lim.sublabel)})</span>
                                )}
                              </span>
                              <span className="font-mono text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                                {renderWithFormulas(lim.value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Administratieve verplichtingen */}
              {adminObligations.length > 0 && (
                <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
                  <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Administratieve verplichtingen
                  </h3>
                  <ul className="space-y-1.5">
                    {adminObligations.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                        <span className={`mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full ${color.dot}`} />
                        {renderWithFormulas(item)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
