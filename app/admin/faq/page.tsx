import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase/admin';
import FaqEditor from '@/components/admin/FaqEditor';
import type { FaqAdminItem } from '@/components/admin/FaqEditor';

export default async function AdminFaqPage() {
  const { data } = await supabaseAdmin
    .from('faq_items')
    .select('id, question, answer, theme_slug, sort_order, published, created_at')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  const items: FaqAdminItem[] = data ?? [];

  return (
    <>
      <div className="mb-8 flex items-center gap-3">
        <Link
          href="/admin"
          className="text-sm text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
        >
          ← Beheerderspaneel
        </Link>
        <span className="text-zinc-300 dark:text-zinc-600">/</span>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">FAQ-beheer</h1>
      </div>

      <FaqEditor initialItems={items} />
    </>
  );
}
