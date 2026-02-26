import type { Metadata } from 'next';
import Link from 'next/link';
import PhysicalInvestigationApp from '@/components/physical-investigation/PhysicalInvestigationApp';

export const metadata: Metadata = {
  title: 'Fysieke belasting — OHSHub',
  description:
    'Volledig onderzoeksinstrument voor fysieke arbeidsbelasting conform ISO 11228-1 (NIOSH tillen/dragen), ISO 11228-2 (duwen/trekken), ISO 11228-3 (OCRA repetitieve handelingen) en Arbobesluit art. 5.1–5.6.',
};

export default function PhysicalLoadPage() {
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
      <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        Fysieke belasting
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
        Volledig onderzoeksinstrument voor fysieke arbeidsbelasting — van
        voorverkenning en belastingsgroepen tot NIOSH-tilanalyse, duwen &amp; trekken,
        repeterende handelingen en houdingsbeoordeling conform{' '}
        <abbr title="Normen voor handmatig verplaatsen van lasten">ISO 11228-1/2/3</abbr>,{' '}
        <abbr title="Safety of machinery — Human physical performance">EN 1005-3/4</abbr>{' '}
        en Arbobesluit art. 5.1–5.6.
      </p>

      {/* App */}
      <PhysicalInvestigationApp />
    </main>
  );
}
