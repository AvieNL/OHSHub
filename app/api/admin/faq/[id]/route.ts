import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/auth';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });

  const body = await request.json();
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (body.question !== undefined) updates.question = body.question;
  if (body.answer !== undefined) updates.answer = body.answer;
  if ('theme_slug' in body) updates.theme_slug = body.theme_slug || null;
  if (body.sort_order !== undefined) updates.sort_order = body.sort_order;
  if (body.published !== undefined) updates.published = body.published;

  const { error } = await supabaseAdmin
    .from('faq_items')
    .update(updates)
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });

  const { error } = await supabaseAdmin
    .from('faq_items')
    .delete()
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
