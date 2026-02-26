import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { themes } from '@/lib/themes';
import { getWizardConfig } from '@/lib/wizard-configs';
import ThemeWizard from '@/components/ThemeWizard';
import type { ThemeSlug } from '@/lib/themes';

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return themes
    .filter((theme) => theme.slug !== 'hazardous-substances')
    .map((theme) => ({ slug: theme.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const theme = themes.find((t) => t.slug === slug);
  if (!theme) return { title: 'Niet gevonden — OHSHub' };
  return {
    title: `${theme.name} — OHSHub`,
    description: theme.description,
  };
}

export default async function ThemePage({ params }: Props) {
  const { slug } = await params;
  const theme = themes.find((t) => t.slug === slug);

  if (!theme) notFound();

  const themeSlug = theme.slug as ThemeSlug;
  const config = getWizardConfig(themeSlug);

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
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

      {/* Theme header */}
      <div className={`mb-3 h-1 w-10 rounded-full ${theme.dotClass}`} />
      <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        {theme.name}
      </h1>

      {/* Intro */}
      <div className="mt-4 space-y-3 border-l-2 border-zinc-200 pl-5 dark:border-zinc-700">
        {theme.intro.split('\n').map((paragraph, i) => (
          <p key={i} className="text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
            {paragraph}
          </p>
        ))}
      </div>

      {/* Step count indicator */}
      <div className="mt-8 flex items-center gap-2">
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${theme.badgeClass}`}>
          tot {config.steps.length} stappen
        </span>
        <span className="text-xs text-zinc-400 dark:text-zinc-500">
          Verplichte vragen zijn gemarkeerd met een *
        </span>
      </div>

      {/* Wizard */}
      <ThemeWizard slug={themeSlug} themeName={theme.name} />
    </main>
  );
}
