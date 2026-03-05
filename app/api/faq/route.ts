import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const theme = searchParams.get('theme'); // optioneel filter op theme_slug

  let query = supabaseAdmin
    .from('faq_items')
    .select('id, question, answer, theme_slug, sort_order')
    .eq('published', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (theme === 'general') {
    query = query.is('theme_slug', null);
  } else if (theme) {
    query = query.eq('theme_slug', theme);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
