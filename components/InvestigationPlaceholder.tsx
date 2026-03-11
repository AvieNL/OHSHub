import Link from 'next/link';
import type { ThemeLegalItem, ThemeLimitGroup } from '@/lib/theme-legal-info';
import ThemeLegalInfo from '@/components/ThemeLegalInfo';
import InlineEdit from '@/components/InlineEdit';

export interface PlaceholderStep {
  title: string;
  desc: string;
}

export interface InvestigationPlaceholderProps {
  namespace: string;
  legalNamespace: string;
  legalOverrides: Record<string, string>;
  title: string;
  fallbackTitle: string;
  description: string;
  fallbackDesc: string;
  /** SVG path `d` attributes for the theme icon (Heroicons v2 outline) */
  iconPaths?: readonly string[];
  color: {
    dot: string;          // e.g. 'bg-rose-500'
    stepDot: string;      // e.g. 'bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400'
    limitBg: string;      // e.g. 'bg-rose-50 dark:bg-rose-950/30'
    limitBorder: string;  // e.g. 'border-rose-200 dark:border-rose-900'
  };
  legislation: ThemeLegalItem[];
  norms: ThemeLegalItem[];
  limitGroups?: ThemeLimitGroup[];
  steps: PlaceholderStep[];
}

export default function InvestigationPlaceholder({
  namespace,
  legalNamespace,
  legalOverrides,
  title,
  fallbackTitle,
  description,
  fallbackDesc,
  iconPaths,
  color,
  legislation,
  norms,
  limitGroups,
  steps,
}: InvestigationPlaceholderProps) {
  const iconColor = color.dot.replace('bg-', 'text-');

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      {/* Back link */}
      <Link
        href="/"
        className="mb-10 inline-flex items-center gap-1.5 text-sm text-zinc-500 transition hover:text-zinc-900 dark:hover:text-zinc-50"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Terug naar home
      </Link>

      {/* Header */}
      <div className="mb-3 h-1 w-10 rounded-full bg-orange-500" />
      <div className="flex flex-wrap items-center gap-3">
        {iconPaths && iconPaths.length > 0 && (
          <svg
            className={`h-8 w-8 ${iconColor}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            {iconPaths.map((d, i) => (
              <path key={i} strokeLinecap="round" strokeLinejoin="round" d={d} />
            ))}
          </svg>
        )}
        <InlineEdit
          namespace={namespace}
          contentKey="pageTitle"
          initialValue={title}
          fallback={fallbackTitle}
        >
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {title}
          </h1>
        </InlineEdit>
        <span className="rounded-full bg-zinc-100 px-3 py-0.5 text-xs font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
          In ontwikkeling
        </span>
      </div>

      <InlineEdit
        namespace={namespace}
        contentKey="pageDesc"
        initialValue={description}
        fallback={fallbackDesc}
        multiline
      >
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
          {description}
        </p>
      </InlineEdit>

      {/* Wettelijk kader */}
      <ThemeLegalInfo
        color={{ dot: color.dot, limitBg: color.limitBg, limitBorder: color.limitBorder }}
        legislation={legislation}
        norms={norms}
        limitGroups={limitGroups}
        className="mt-8"
        contentOverrides={legalOverrides}
        namespace={legalNamespace}
      />

      {/* Geplande stappen */}
      <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Geplande stappen
        </h2>
        <ol className="space-y-3">
          {steps.map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span
                className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${color.stepDot}`}
              >
                {i + 1}
              </span>
              <div>
                <div className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{step.title}</div>
                <div className="mt-0.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">{step.desc}</div>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* Coming soon notice */}
      <div className="mt-8 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-5 text-center dark:border-zinc-700 dark:bg-zinc-900/50">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Dit onderzoeksinstrument is momenteel in ontwikkeling.{' '}
          <span className="text-zinc-400 dark:text-zinc-500">
            Gebruik in de tussentijd de risico-inventarisatie wizard via het hoofdmenu.
          </span>
        </p>
      </div>
    </main>
  );
}
