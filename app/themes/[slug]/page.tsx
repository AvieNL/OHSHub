import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { themes } from '@/lib/themes';
import { getWizardConfig } from '@/lib/wizard-configs';
import ThemeWizard from '@/components/ThemeWizard';
import type { ThemeSlug } from '@/lib/themes';
import { getNamespaceContent } from '@/lib/content';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import InlineEdit from '@/components/InlineEdit';

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  // Alle gedefinieerde thema's hebben eigen pagina's; deze route dient
  // alleen als fallback voor onbekende slugs (→ notFound()).
  return [];
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

  // Guard: redirect non-admins away from inactive themes
  if (!theme.active) {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    const isAdmin = user
      ? (await supabase.from('user_roles').select('role').eq('user_id', user.id).single()).data?.role === 'admin'
      : false;
    if (!isAdmin) redirect('/');
  }

  const themeSlug = theme.slug as ThemeSlug;
  const config = getWizardConfig(themeSlug);

  // Load content overrides in parallel
  const [themeOverrides, wizardOverrides] = await Promise.all([
    getNamespaceContent(`theme.${slug}`),
    getNamespaceContent(`wizard.${slug}`),
  ]);

  const displayName = themeOverrides['name'] ?? theme.name;
  const displayIntro = themeOverrides['intro'] ?? theme.intro;

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
      <InlineEdit
        namespace={`theme.${slug}`}
        contentKey="name"
        initialValue={displayName}
        fallback={theme.name}
      >
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          {displayName}
        </h1>
      </InlineEdit>

      {/* Intro */}
      <InlineEdit
        namespace={`theme.${slug}`}
        contentKey="intro"
        initialValue={displayIntro}
        fallback={theme.intro}
        multiline
      >
        <div className="mt-4 space-y-3 border-l-2 border-zinc-200 pl-5 dark:border-zinc-700">
          {displayIntro.split('\n').map((paragraph, i) => (
            <p key={i} className="text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
              {paragraph}
            </p>
          ))}
        </div>
      </InlineEdit>

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
      <ThemeWizard
        slug={themeSlug}
        themeName={displayName}
        contentOverrides={wizardOverrides}
      />
    </main>
  );
}
