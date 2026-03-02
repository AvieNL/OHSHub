import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

type Params = { params: Promise<{ id: string }> };

async function requireAdmin() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: roleRow } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();
  if (roleRow?.role !== 'admin') return null;
  return user;
}

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });

  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(id);
  if (authError || !authUser.user) return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 404 });

  const [{ data: roleRow }, { data: profileRow }] = await Promise.all([
    supabaseAdmin.from('user_roles').select('role, privacy_version_accepted, privacy_accepted_at').eq('user_id', id).single(),
    supabaseAdmin.from('profiles').select('first_name, tussenvoegsel, last_name, company').eq('user_id', id).single(),
  ]);

  return NextResponse.json({
    id: authUser.user.id,
    email: authUser.user.email,
    created_at: authUser.user.created_at,
    last_sign_in_at: authUser.user.last_sign_in_at,
    role: roleRow?.role ?? 'gebruiker',
    privacy_version_accepted: roleRow?.privacy_version_accepted ?? null,
    privacy_accepted_at: roleRow?.privacy_accepted_at ?? null,
    first_name: profileRow?.first_name ?? null,
    tussenvoegsel: profileRow?.tussenvoegsel ?? null,
    last_name: profileRow?.last_name ?? null,
    company: profileRow?.company ?? null,
  });
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });

  const body = await request.json();
  const { role } = body;

  if (!['admin', 'test-gebruiker', 'gebruiker'].includes(role)) {
    return NextResponse.json({ error: 'Ongeldige rol' }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('user_roles')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('user_id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });

  // Prevent self-deletion
  if (admin.id === id) {
    return NextResponse.json({ error: 'U kunt uw eigen account niet verwijderen.' }, { status: 400 });
  }

  const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
