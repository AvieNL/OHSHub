import type { Metadata } from 'next';
import Link from 'next/link';
import { themes } from '@/lib/themes';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import FaqAllSearch from '@/components/kennisportaal/FaqAllSearch';
import type { FaqItem } from '@/components/kennisportaal/FaqAccordion';

export const metadata: Metadata = {
  title: 'Veelgestelde vragen — Kennisportaal OHSHub',
  description: 'Antwoorden op veel voorkomende vragen over arbeidshygiënische normen, methoden en onderzoek.',
};

export default async function FaqPage() {
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

  const allItems: FaqItem[] = data ?? [];

  const themeLookup = Object.fromEntries(
    themes.map((t) => [t.slug, { slug: t.slug, name: t.name, iconClass: t.iconClass, iconPaths: t.iconPaths }])
  );

  const general = allItems.filter((i) => !i.theme_slug);
  const groups = [
    { theme: null, items: general },
    ...themes
      .map((t) => ({
        theme: { slug: t.slug, name: t.name, iconClass: t.iconClass, iconPaths: t.iconPaths },
        items: allItems.filter((i) => i.theme_slug === t.slug),
      }))
      .filter((g) => isAdmin || g.items.length > 0),
  ];

  const total = allItems.length;

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
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Veelgestelde vragen
        </h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          {total > 0
            ? `${total} vra${total === 1 ? 'ag' : 'gen'} over normen, methoden en arbeidshygiënisch onderzoek.`
            : 'Nog geen vragen beschikbaar.'}
        </p>
      </div>

      <FaqAllSearch
        allItems={allItems}
        groups={groups}
        themeLookup={themeLookup}
        isAdmin={isAdmin}
      />

    </main>
  );
}
