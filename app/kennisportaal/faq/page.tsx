import type { Metadata } from 'next';
import Link from 'next/link';
import { themes } from '@/lib/themes';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import FaqInlineManager from '@/components/kennisportaal/FaqInlineManager';
import type { FaqItem } from '@/components/kennisportaal/FaqAccordion';

export const metadata: Metadata = {
  title: 'Veelgestelde vragen — Kennisportaal OHSHub',
  description: 'Antwoorden op veel voorkomende vragen over arbeidshygiënische normen, methoden en onderzoek.',
};

export default async function FaqPage() {
  // Admin-check: admins zien ook lege themabalkjes zodat ze vragen kunnen toevoegen
  let isAdmin = false;
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('user_roles').select('role').eq('user_id', user.id).single();
      isAdmin = data?.role === 'admin';
    }
  } catch { /* niet kritiek */ }

  const { data } = await supabaseAdmin
    .from('faq_items')
    .select('id, question, answer, theme_slug')
    .eq('published', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  const items: FaqItem[] = data ?? [];

  // Groepeer: algemeen + per thema
  const general = items.filter((i) => !i.theme_slug);
  const byTheme = themes
    .map((t) => ({
      theme: t,
      items: items.filter((i) => i.theme_slug === t.slug),
    }))
    // Admins zien alle thema's (ook leeg), bezoekers alleen gevulde
    .filter((g) => isAdmin || g.items.length > 0);

  const total = items.length;

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

      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Veelgestelde vragen
        </h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          {total > 0
            ? `${total} vra${total === 1 ? 'ag' : 'gen'} over normen, methoden en arbeidshygiënisch onderzoek.`
            : 'Nog geen vragen beschikbaar.'}
        </p>
      </div>

      {/* Algemene vragen — altijd zichtbaar voor admins */}
      {(isAdmin || general.length > 0) && (
        <section className="mb-10">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
            Algemeen
          </h2>
          <div className="rounded-xl border border-zinc-200 px-6 dark:border-zinc-800">
            <FaqInlineManager items={general} themeSlug={null} />
          </div>
        </section>
      )}

      {/* Per thema */}
      {byTheme.map(({ theme, items: themeItems }) => (
        <section key={theme.slug} className="mb-10">
          <div className="mb-4 flex items-center gap-2">
            <svg
              className={`h-4 w-4 shrink-0 ${theme.iconClass}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
            >
              {theme.iconPaths.map((d, i) => (
                <path key={i} strokeLinecap="round" strokeLinejoin="round" d={d} />
              ))}
            </svg>
            <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
              {theme.name}
            </h2>
            <Link
              href={`/kennisportaal/${theme.slug}`}
              className={`ml-auto text-xs font-medium ${theme.iconClass} hover:underline`}
            >
              Kennisblad →
            </Link>
          </div>
          <div className="rounded-xl border border-zinc-200 px-6 dark:border-zinc-800">
            <FaqInlineManager items={themeItems} themeSlug={theme.slug} />
          </div>
        </section>
      ))}

    </main>
  );
}
