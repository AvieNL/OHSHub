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
    <div className="grid grid-cols-4 gap-3">
      {items.map((theme) =>
        isAdmin ? (
          <div
            key={theme.slug}
            className={`relative flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border-l-4 bg-white p-3 shadow-sm ring-1 ring-zinc-100 dark:bg-zinc-900 dark:ring-zinc-800 ${theme.borderClass}`}
          >
            <svg
              className={`h-6 w-6 shrink-0 ${theme.iconClass}`}
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
              <span className="text-center text-xs font-medium text-zinc-900 dark:text-zinc-50">
                {theme.name}
              </span>
            </InlineEdit>
            <Link
              href={`/themes/${theme.slug}`}
              className="absolute right-1 top-1 rounded p-1 text-zinc-300 transition hover:text-zinc-600 dark:text-zinc-600 dark:hover:text-zinc-300"
              title={`Naar ${theme.name}`}
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        ) : (
          <Link
            key={theme.slug}
            href={`/themes/${theme.slug}`}
            className={`group flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border-l-4 bg-white p-3 shadow-sm ring-1 ring-zinc-100 transition hover:shadow-md dark:bg-zinc-900 dark:ring-zinc-800 ${theme.borderClass}`}
          >
            <svg
              className={`h-6 w-6 shrink-0 ${theme.iconClass}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              {theme.iconPaths.map((d, i) => (
                <path key={i} strokeLinecap="round" strokeLinejoin="round" d={d} />
              ))}
            </svg>
            <span className="text-center text-xs font-medium text-zinc-900 dark:text-zinc-50">
              {theme.name}
            </span>
          </Link>
        ),
      )}
    </div>
  );
}
