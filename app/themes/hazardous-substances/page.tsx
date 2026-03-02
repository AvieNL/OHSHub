import type { Metadata } from 'next';
import Link from 'next/link';
import InvestigationApp from '@/components/investigation/InvestigationApp';
import ThemeLegalInfo from '@/components/ThemeLegalInfo';
import { THEME_LEGAL_INFO } from '@/lib/theme-legal-info';
import { themes } from '@/lib/themes';

export const metadata: Metadata = {
  title: 'Gevaarlijke stoffen — OHSHub',
  description:
    'Volledig onderzoeksinstrument voor gevaarlijke stoffen conform NEN-EN 689:2018, Arbobesluit hoofdstuk 4, REACH en CLP.',
};

const theme = themes.find((t) => t.slug === 'hazardous-substances')!;
const legalInfo = THEME_LEGAL_INFO['hazardous-substances'];

export default function HazardousSubstancesPage() {
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
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Gevaarlijke stoffen
        </h1>
      </div>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
        Volledig onderzoeksinstrument voor chemische blootstelling op de werkplek — van
        stoffeninventarisatie en blootstellingsbeoordeling tot meetstrategie, NEN-EN 689
        statistieken en maatregelenbeheer.
      </p>

      {/* Legal info */}
      <ThemeLegalInfo
        {...legalInfo}
        className="mt-8"
      />

      {/* App */}
      <div className="mt-10">
        <InvestigationApp />
      </div>
    </main>
  );
}
