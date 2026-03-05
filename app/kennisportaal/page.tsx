import type { Metadata } from 'next';
import Link from 'next/link';
import { themes } from '@/lib/themes';
import { supabaseAdmin } from '@/lib/supabase/admin';
import FaqAccordion from '@/components/kennisportaal/FaqAccordion';

export const metadata: Metadata = {
  title: 'Kennisportaal — OHSHub',
  description:
    'Theoretische achtergrond, normen, meetmethoden en veelgestelde vragen per arbeidshygiënisch thema.',
};

export default async function KennisportaalPage() {
  const { data: faqTeaser } = await supabaseAdmin
    .from('faq_items')
    .select('id, question, answer, theme_slug')
    .eq('published', true)
    .is('theme_slug', null)
    .order('sort_order', { ascending: true })
    .limit(5);

  const items = faqTeaser ?? [];

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">

      {/* Header */}
      <div className="mb-12">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Kennisportaal
        </h1>
        <p className="mt-3 max-w-2xl text-base text-zinc-500 dark:text-zinc-400">
          Theoretische achtergrond, normen, meetmethoden en veelgestelde vragen per
          arbeidshygiënisch thema. Vrij toegankelijk — geen account vereist.
        </p>
      </div>

      {/* Theme list */}
      <section className="mb-16">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          Thema&apos;s
        </h2>
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          {themes.map((theme, i) => (
            <Link
              key={theme.slug}
              href={`/kennisportaal/${theme.slug}`}
              className={`group flex items-center gap-4 px-5 py-4 transition hover:bg-zinc-50 dark:hover:bg-zinc-800/60 ${i > 0 ? 'border-t border-zinc-100 dark:border-zinc-800' : ''}`}
            >
              <svg
                className={`h-5 w-5 shrink-0 ${theme.iconClass}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
              >
                {theme.iconPaths.map((d, i) => (
                  <path key={i} strokeLinecap="round" strokeLinejoin="round" d={d} />
                ))}
              </svg>
              <div className="min-w-0 flex-1">
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {theme.name}
                </span>
                <span className="mx-2 text-zinc-300 dark:text-zinc-600">·</span>
                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                  {theme.description}
                </span>
              </div>
              <svg
                className="h-4 w-4 shrink-0 text-zinc-300 transition-transform group-hover:translate-x-0.5 group-hover:text-zinc-400 dark:text-zinc-600 dark:group-hover:text-zinc-500"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      </section>

      {/* FAQ teaser */}
      <section className="mb-12">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
            Veelgestelde vragen
          </h2>
          <Link
            href="/kennisportaal/faq"
            className="text-sm text-orange-600 hover:underline dark:text-orange-400"
          >
            Alle vragen →
          </Link>
        </div>
        {items.length > 0 ? (
          <div className="rounded-xl border border-zinc-200 px-6 dark:border-zinc-800">
            <FaqAccordion items={items} />
          </div>
        ) : (
          <p className="text-sm text-zinc-400 dark:text-zinc-500">
            Nog geen algemene vragen beschikbaar.{' '}
            <Link href="/kennisportaal/faq" className="text-orange-600 hover:underline dark:text-orange-400">
              Bekijk per thema →
            </Link>
          </p>
        )}
      </section>

    </main>
  );
}
