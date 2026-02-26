import type { Metadata } from 'next';
import Link from 'next/link';
import SoundInvestigationApp from '@/components/sound-investigation/SoundInvestigationApp';
import { Formula } from '@/components/Formula';

export const metadata: Metadata = {
  title: 'Geluid — OHSHub',
  description:
    'Volledig onderzoeksinstrument voor geluidblootstelling conform NEN-EN-ISO 9612:2025, Arbobesluit art. 6.5–6.8.',
};

export default function SoundPage() {
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
        Geluidblootstelling
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
        Volledig onderzoeksinstrument voor geluid op de arbeidsplaats — van werkanalyse en HEG-definitie
        tot <Formula math="L_{EX,8h}" />-berekening met meetonzekerheid conform NEN-EN-ISO 9612:2025 en toetsing aan de
        actiewaarden uit het Arbobesluit.
      </p>

      {/* App */}
      <SoundInvestigationApp />
    </main>
  );
}
