import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/auth';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });

  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(id);
  if (authError || !authUser.user) return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 404 });

  const [{ data: roleRow }, { data: profileRow }] = await Promise.all([
    supabaseAdmin.from('user_roles').select('role, privacy_version_accepted, privacy_accepted_at, privacy_required_version, disclaimer_version_accepted, disclaimer_accepted_at, disclaimer_required_version').eq('user_id', id).single(),
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
    privacy_required_version: roleRow?.privacy_required_version ?? null,
    disclaimer_version_accepted: roleRow?.disclaimer_version_accepted ?? null,
    disclaimer_accepted_at: roleRow?.disclaimer_accepted_at ?? null,
    disclaimer_required_version: roleRow?.disclaimer_required_version ?? null,
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
  const { role, action } = body;

  // Handle privacy push/clear actions
  if (action === 'privacy-push') {
    const { data: latestRow, error: verError } = await supabaseAdmin
      .from('privacy_versions')
      .select('version_number')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (verError || !latestRow) {
      return NextResponse.json({ error: 'Geen privacyversie gevonden' }, { status: 404 });
    }

    const { error } = await supabaseAdmin
      .from('user_roles')
      .update({ privacy_required_version: latestRow.version_number })
      .eq('user_id', id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, version: latestRow.version_number });
  }

  if (action === 'privacy-clear') {
    const { error } = await supabaseAdmin
      .from('user_roles')
      .update({ privacy_required_version: null })
      .eq('user_id', id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === 'disclaimer-push') {
    const { data: latestRow, error: verError } = await supabaseAdmin
      .from('disclaimer_versions')
      .select('version_number')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (verError || !latestRow) {
      return NextResponse.json({ error: 'Geen disclaimerversie gevonden' }, { status: 404 });
    }

    const { error } = await supabaseAdmin
      .from('user_roles')
      .update({ disclaimer_required_version: latestRow.version_number })
      .eq('user_id', id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, version: latestRow.version_number });
  }

  if (action === 'disclaimer-clear') {
    const { error } = await supabaseAdmin
      .from('user_roles')
      .update({ disclaimer_required_version: null })
      .eq('user_id', id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // Default: role update
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
