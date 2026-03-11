import Link from 'next/link';
import ThemeLegalInfo from '@/components/ThemeLegalInfo';
import InlineEdit from '@/components/InlineEdit';
import MarkdownContent from '@/components/MarkdownContent';
import type { Theme } from '@/lib/themes';
import type { ThemeLegalData } from '@/lib/theme-legal-info';

interface Props {
  slug: string;
  theme: Theme;
  legalInfo: ThemeLegalData;
  fallbackTitle: string;
  fallbackDesc: string;
  pageTitle: string;
  pageDesc: string;
  legalOverrides: Record<string, string>;
  children: React.ReactNode;
}

export default function InvestigationThemePage({
  slug,
  theme,
  legalInfo,
  fallbackTitle,
  fallbackDesc,
  pageTitle,
  pageDesc,
  legalOverrides,
  children,
}: Props) {
  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      {/* Back link */}
      <Link
        href="/"
        className="mb-10 inline-flex items-center gap-1.5 text-sm text-zinc-500 transition hover:text-zinc-900 dark:hover:text-zinc-50"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Terug naar home
      </Link>

      {/* Header */}
      <div className="mb-3 h-1 w-10 rounded-full bg-orange-500" />
      <div className="flex items-center gap-3">
        <svg
          className={`h-8 w-8 ${theme.iconClass}`}
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
          namespace={`theme.${slug}`}
          contentKey="pageTitle"
          initialValue={pageTitle}
          fallback={fallbackTitle}
        >
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {pageTitle}
          </h1>
        </InlineEdit>
      </div>

      <InlineEdit
        namespace={`theme.${slug}`}
        contentKey="pageDesc"
        initialValue={pageDesc}
        fallback={fallbackDesc}
        multiline
        markdown
      >
        <MarkdownContent className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
          {pageDesc}
        </MarkdownContent>
      </InlineEdit>

      {/* Legal info */}
      <ThemeLegalInfo
        {...legalInfo}
        className="mt-8"
        contentOverrides={legalOverrides}
        namespace={`theme-legal.${slug}`}
      />

      {/* App */}
      <div className="mt-10">{children}</div>
    </main>
  );
}
