import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { themes } from '@/lib/themes';
import { getNamespaceContent } from '@/lib/content';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import MarkdownContent from '@/components/MarkdownContent';
import InlineEdit from '@/components/InlineEdit';
import FaqInlineManager from '@/components/kennisportaal/FaqInlineManager';

type Props = { params: Promise<{ slug: string }> };

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const theme = themes.find((t) => t.slug === slug);
  if (!theme) return {};
  return {
    title: `${theme.name} — Kennisportaal OHSHub`,
    description: theme.description,
  };
}

const SECTIONS = [
  { key: 'normen',    label: 'Normen & grenswaarden' },
  { key: 'methoden',  label: 'Meetmethoden & strategie' },
  { key: 'wetgeving', label: 'Wetgeving & regelgeving' },
  { key: 'praktijk',  label: 'Praktische tips' },
  { key: 'bronnen',   label: 'Bronnen' },
] as const;

export default async function KennisThemePage({ params }: Props) {
  const { slug } = await params;
  const theme = themes.find((t) => t.slug === slug);
  if (!theme) notFound();

  // Bepaal admin-status voor server-side conditionele weergave van lege secties
  let isAdmin = false;
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('user_roles').select('role').eq('user_id', user.id).single();
      isAdmin = data?.role === 'admin';
    }
  } catch { /* niet kritiek */ }

  // Haal CMS-inhoud + FAQ-items parallel op
  const [content, { data: faqItems }] = await Promise.all([
    getNamespaceContent(`knowledge.${slug}`),
    supabaseAdmin
      .from('faq_items')
      .select('id, question, answer, theme_slug')
      .eq('published', true)
      .eq('theme_slug', slug)
      .order('sort_order', { ascending: true }),
  ]);

  const intro = content['intro'] ?? theme.intro;

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">

      {/* Teruglink */}
      <Link
        href="/kennisportaal"
        className="mb-8 flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Kennisportaal
      </Link>

      {/* Themaheader */}
      <div className={`mb-8 flex items-start gap-4 rounded-xl border-l-4 bg-white px-6 py-5 shadow-sm ring-1 ring-zinc-100 dark:bg-zinc-900 dark:ring-zinc-800 ${theme.borderClass}`}>
        <svg
          className={`mt-0.5 h-6 w-6 shrink-0 ${theme.iconClass}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
        >
          {theme.iconPaths.map((d, i) => (
            <path key={i} strokeLinecap="round" strokeLinejoin="round" d={d} />
          ))}
        </svg>
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{theme.name}</h1>
          <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">{theme.description}</p>
        </div>
      </div>

      {/* Introductie */}
      <section className="mb-10">
        <InlineEdit
          namespace={`knowledge.${slug}`}
          contentKey="intro"
          initialValue={intro}
          fallback={theme.intro}
          multiline
          markdown
        >
          <MarkdownContent className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
            {intro}
          </MarkdownContent>
        </InlineEdit>
      </section>

      {/* Optionele CMS-secties — alleen zichtbaar als er inhoud is (of voor admin) */}
      {SECTIONS.map(({ key, label }) => {
        const value = content[key] ?? '';
        if (!value && !isAdmin) return null;
        return (
          <section key={key} className="mb-10">
            <h2 className={`mb-3 text-base font-semibold ${theme.iconClass}`}>
              {label}
            </h2>
            <InlineEdit
              namespace={`knowledge.${slug}`}
              contentKey={key}
              initialValue={value}
              fallback=""
              multiline
              markdown
            >
              {value ? (
                <MarkdownContent className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {value}
                </MarkdownContent>
              ) : (
                <p className="text-sm italic text-zinc-400 dark:text-zinc-500">
                  Nog geen inhoud — klik op het potlood om toe te voegen.
                </p>
              )}
            </InlineEdit>
          </section>
        );
      })}

      {/* FAQ voor dit thema */}
      {(isAdmin || (faqItems && faqItems.length > 0)) && (
        <section className="mb-10">
          <h2 className={`mb-4 text-base font-semibold ${theme.iconClass}`}>
            Veelgestelde vragen
          </h2>
          <div className="rounded-xl border border-zinc-200 px-6 dark:border-zinc-800">
            <FaqInlineManager items={faqItems ?? []} themeSlug={theme.slug} />
          </div>
        </section>
      )}

      {/* CTA: onderzoek starten */}
      <div className={`rounded-xl border-l-4 bg-white p-6 ring-1 ring-zinc-100 dark:bg-zinc-900 dark:ring-zinc-800 ${theme.borderClass}`}>
        <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
          Klaar om een {theme.name.toLowerCase()}-onderzoek te starten?
          Gebruik de stap-voor-stap wizard — hiervoor is een account vereist.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/themes/${slug}`}
            className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600"
          >
            Onderzoek starten
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
          <Link
            href="/kennisportaal/faq"
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            Alle FAQ
          </Link>
        </div>
      </div>

    </main>
  );
}
