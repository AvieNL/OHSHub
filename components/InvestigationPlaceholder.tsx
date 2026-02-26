import Link from 'next/link';

export interface PlaceholderStep {
  title: string;
  desc: string;
}

export interface PlaceholderNorm {
  name: string;
  desc: string;
}

export interface PlaceholderLimit {
  label: string;
  value: string;
  sublabel?: string;
}

export interface PlaceholderLimitGroup {
  title: string;
  limits: PlaceholderLimit[];
}

export interface InvestigationPlaceholderProps {
  title: string;
  subtitle: string;
  description: string;
  color: {
    border: string;       // e.g. 'border-rose-500'
    badge: string;        // e.g. 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
    dot: string;          // e.g. 'bg-rose-500'
    stepDot: string;      // e.g. 'bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400'
    limitBg: string;      // e.g. 'bg-rose-50 dark:bg-rose-950/30'
    limitBorder: string;  // e.g. 'border-rose-200 dark:border-rose-900'
  };
  legislation: string[];
  norms: PlaceholderNorm[];
  steps: PlaceholderStep[];
  limitGroups?: PlaceholderLimitGroup[];
}

export default function InvestigationPlaceholder({
  title,
  subtitle,
  description,
  color,
  legislation,
  norms,
  steps,
  limitGroups,
}: InvestigationPlaceholderProps) {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      {/* Back link */}
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Terug naar home
      </Link>

      {/* Header */}
      <div className={`mb-8 rounded-xl border-l-4 ${color.border} bg-white px-6 py-5 shadow-sm dark:bg-zinc-900`}>
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {title}
          </h1>
          <span className={`rounded-full px-3 py-0.5 text-xs font-semibold ${color.badge}`}>
            {subtitle}
          </span>
          <span className="rounded-full bg-zinc-100 px-3 py-0.5 text-xs font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
            In ontwikkeling
          </span>
        </div>
        <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{description}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left column: wetgeving + normen + grenswaarden */}
        <div className="space-y-5">
          {/* Wetgeving */}
          <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Wetgeving
            </h2>
            <ul className="space-y-1.5">
              {legislation.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                  <span className={`mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full ${color.dot}`} />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Normen */}
          <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Toepasselijke normen
            </h2>
            <ul className="space-y-3">
              {norms.map((n, i) => (
                <li key={i}>
                  <div className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{n.name}</div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">{n.desc}</div>
                </li>
              ))}
            </ul>
          </div>

          {/* Grenswaarden */}
          {limitGroups && limitGroups.length > 0 && (
            <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Grenswaarden
              </h2>
              <div className="space-y-4">
                {limitGroups.map((group, gi) => (
                  <div key={gi}>
                    <div className="mb-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400">{group.title}</div>
                    <div className="space-y-1.5">
                      {group.limits.map((lim, li) => (
                        <div
                          key={li}
                          className={`flex items-center justify-between rounded-lg border px-3 py-2 ${color.limitBg} ${color.limitBorder}`}
                        >
                          <span className="text-xs text-zinc-600 dark:text-zinc-400">
                            {lim.label}
                            {lim.sublabel && (
                              <span className="ml-1 text-zinc-400 dark:text-zinc-500">({lim.sublabel})</span>
                            )}
                          </span>
                          <span className="font-mono text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                            {lim.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column: geplande stappen */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Geplande stappen
          </h2>
          <ol className="relative border-l border-zinc-200 pl-5 dark:border-zinc-700">
            {steps.map((step, i) => (
              <li key={i} className={`relative ${i < steps.length - 1 ? 'mb-5' : ''}`}>
                <span
                  className={`absolute -left-[18px] flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${color.stepDot}`}
                >
                  {i}
                </span>
                <div className="ml-1">
                  <div className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{step.title}</div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">{step.desc}</div>
                </div>
              </li>
            ))}
          </ol>
        </div>
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
