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

      {/* Theme grid */}
      <section className="mb-16">
        <h2 className="mb-6 text-sm font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          Thema&apos;s
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {themes.map((theme) => (
            <Link
              key={theme.slug}
              href={`/kennisportaal/${theme.slug}`}
              className={`group flex flex-col gap-3 rounded-xl border-l-4 bg-white p-6 shadow-sm ring-1 ring-zinc-100 transition hover:shadow-md hover:ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800 dark:hover:ring-zinc-700 ${theme.borderClass}`}
            >
              <div className="flex items-center gap-2.5">
                <svg
                  className={`h-5 w-5 shrink-0 ${theme.iconClass}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
                >
                  {theme.iconPaths.map((d, i) => (
                    <path key={i} strokeLinecap="round" strokeLinejoin="round" d={d} />
                  ))}
                </svg>
                <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                  {theme.name}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                {theme.description}
              </p>
              <span className={`self-start text-xs font-medium ${theme.iconClass}`}>
                Lees meer →
              </span>
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
