import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/auth';

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });

  const { data, error } = await supabaseAdmin
    .from('faq_items')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });

  const body = await request.json();
  const { question, answer, theme_slug, sort_order, published } = body;

  if (!question?.trim() || !answer?.trim()) {
    return NextResponse.json({ error: 'Vraag en antwoord zijn verplicht' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('faq_items')
    .insert({
      question: question.trim(),
      answer: answer.trim(),
      theme_slug: theme_slug || null,
      sort_order: sort_order ?? 0,
      published: published ?? true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
