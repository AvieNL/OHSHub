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
  active: boolean;
}

function ThemeIcon({ iconPaths, iconClass }: { iconPaths: readonly string[]; iconClass: string }) {
  return (
    <svg
      className={`h-6 w-6 shrink-0 ${iconClass}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      {iconPaths.map((d, i) => (
        <path key={i} strokeLinecap="round" strokeLinejoin="round" d={d} />
      ))}
    </svg>
  );
}

export default function HomeThemesGrid({ items }: { items: HomeThemeItem[] }) {
  const isAdmin = useIsAdmin();

  return (
    <div className="grid grid-cols-4 gap-3">
      {items.map((theme) => {
        const isInactive = !theme.active;

        if (isAdmin) {
          // Admins see all tiles as links; inactive ones show a subtle badge
          return (
            <Link
              key={theme.slug}
              href={`/themes/${theme.slug}`}
              className={`group relative flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border-l-4 bg-white p-3 shadow-sm ring-1 ring-zinc-100 transition hover:shadow-md dark:bg-zinc-900 dark:ring-zinc-800 ${theme.borderClass} ${isInactive ? 'opacity-60' : ''}`}
            >
              {isInactive && (
                <span className="absolute right-1.5 top-1.5 rounded-full bg-zinc-100 px-1.5 py-0.5 text-[9px] font-medium leading-none text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500">
                  inactief
                </span>
              )}
              <ThemeIcon iconPaths={theme.iconPaths} iconClass={theme.iconClass} />
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
          );
        }

        // Non-admin: inactive tiles are greyed out and non-clickable
        if (isInactive) {
          return (
            <div
              key={theme.slug}
              className={`flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border-l-4 bg-white p-3 opacity-40 shadow-sm ring-1 ring-zinc-100 dark:bg-zinc-900 dark:ring-zinc-800 ${theme.borderClass}`}
              title="Dit thema is nog niet beschikbaar"
            >
              <ThemeIcon iconPaths={theme.iconPaths} iconClass={theme.iconClass} />
              <span className="text-center text-xs font-medium text-zinc-900 dark:text-zinc-50">
                {theme.name}
              </span>
              <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-[9px] font-medium leading-none text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500">
                Binnenkort
              </span>
            </div>
          );
        }

        // Non-admin, active tile
        return (
          <Link
            key={theme.slug}
            href={`/themes/${theme.slug}`}
            className={`group flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border-l-4 bg-white p-3 shadow-sm ring-1 ring-zinc-100 transition hover:shadow-md dark:bg-zinc-900 dark:ring-zinc-800 ${theme.borderClass}`}
          >
            <ThemeIcon iconPaths={theme.iconPaths} iconClass={theme.iconClass} />
            <span className="text-center text-xs font-medium text-zinc-900 dark:text-zinc-50">
              {theme.name}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
