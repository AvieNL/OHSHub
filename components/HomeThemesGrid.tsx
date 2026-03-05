'use client';

import Link from 'next/link';
import { useIsAdmin } from '@/components/AdminContext';
import InlineEdit from '@/components/InlineEdit';

export interface HomeThemeItem {
  slug: string;
  name: string;
  description: string;
  originalName: string;
  originalDescription: string;
  iconClass: string;
  borderClass: string;
  iconPaths: readonly string[];
}

export default function HomeThemesGrid({ items }: { items: HomeThemeItem[] }) {
  const isAdmin = useIsAdmin();

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((theme) =>
        isAdmin ? (
          /* Admin card: div with InlineEdit on name + description, arrow Link for navigation */
          <div
            key={theme.slug}
            className={`flex flex-col gap-3 rounded-xl border-l-4 bg-white p-6 shadow-sm ring-1 ring-zinc-100 dark:bg-zinc-900 dark:ring-zinc-800 ${theme.borderClass}`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <svg
                  className={`h-5 w-5 flex-shrink-0 ${theme.iconClass}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  {theme.iconPaths.map((d, i) => (
                    <path key={i} strokeLinecap="round" strokeLinejoin="round" d={d} />
                  ))}
                </svg>
                <InlineEdit
                  namespace={`theme.${theme.slug}`}
                  contentKey="name"
                  initialValue={theme.name}
                  fallback={theme.originalName}
                >
                  <span className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                    {theme.name}
                  </span>
                </InlineEdit>
              </div>
              <Link
                href={`/themes/${theme.slug}`}
                className="rounded p-1 text-zinc-300 transition hover:text-zinc-600 dark:text-zinc-600 dark:hover:text-zinc-300"
                title={`Naar ${theme.name}`}
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            <InlineEdit
              namespace={`theme.${theme.slug}`}
              contentKey="description"
              initialValue={theme.description}
              fallback={theme.originalDescription}
              multiline
            >
              <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                {theme.description}
              </p>
            </InlineEdit>
          </div>
        ) : (
          /* Non-admin card: full-card Link (unchanged) */
          <Link
            key={theme.slug}
            href={`/themes/${theme.slug}`}
            className={`group flex flex-col gap-3 rounded-xl border-l-4 bg-white p-6 shadow-sm ring-1 ring-zinc-100 transition hover:shadow-md dark:bg-zinc-900 dark:ring-zinc-800 ${theme.borderClass}`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <svg
                  className={`h-5 w-5 flex-shrink-0 ${theme.iconClass}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  {theme.iconPaths.map((d, i) => (
                    <path key={i} strokeLinecap="round" strokeLinejoin="round" d={d} />
                  ))}
                </svg>
                <span className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                  {theme.name}
                </span>
              </div>
              <svg
                className="h-4 w-4 flex-shrink-0 text-zinc-400 transition-transform group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {theme.description}
            </p>
          </Link>
        ),
      )}
    </div>
  );
}
