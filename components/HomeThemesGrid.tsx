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
            {/* stopPropagation zodat klikken op naam/potlood niet navigeert */}
            <div onClick={(e) => e.preventDefault()}>
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
            </div>
          </Link>
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
