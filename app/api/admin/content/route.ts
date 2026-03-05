import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/auth';

// GET /api/admin/content?namespace=...
export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const namespace = req.nextUrl.searchParams.get('namespace');
  if (!namespace) return NextResponse.json({ error: 'namespace required' }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('content')
    .select('key, value, ctype, updated_at')
    .eq('namespace', namespace);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const result: Record<string, { value: string; ctype: string; updated_at: string }> = {};
  for (const row of data ?? []) {
    result[row.key] = { value: row.value, ctype: row.ctype, updated_at: row.updated_at };
  }

  return NextResponse.json(result);
}

// PUT /api/admin/content  { namespace, key, value, ctype? }
export async function PUT(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { namespace, key, value, ctype = 'plain' } = body ?? {};
  if (!namespace || !key || value === undefined) {
    return NextResponse.json({ error: 'namespace, key, value required' }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from('content').upsert(
    { namespace, key, value, ctype, updated_at: new Date().toISOString(), updated_by: admin.id },
    { onConflict: 'namespace,key' },
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  revalidateTag('content', {});
  return NextResponse.json({ ok: true });
}

// DELETE /api/admin/content  { namespace, key }
export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { namespace, key } = body ?? {};
  if (!namespace || !key) {
    return NextResponse.json({ error: 'namespace and key required' }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('content')
    .delete()
    .eq('namespace', namespace)
    .eq('key', key);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  revalidateTag('content', {});
  return NextResponse.json({ ok: true });
}
