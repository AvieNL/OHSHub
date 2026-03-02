import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

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

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });

  // List all users via admin API
  const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
  if (usersError) return NextResponse.json({ error: usersError.message }, { status: 500 });

  // Get all roles + privacy consent
  const { data: roles } = await supabaseAdmin
    .from('user_roles')
    .select('user_id, role, privacy_version_accepted, privacy_accepted_at');

  const roleMap = new Map((roles ?? []).map((r: { user_id: string; role: string; privacy_version_accepted: string | null; privacy_accepted_at: string | null }) => [r.user_id, r]));

  // Get all profiles
  const { data: profiles } = await supabaseAdmin
    .from('profiles')
    .select('user_id, first_name, tussenvoegsel, last_name, company');

  const profileMap = new Map((profiles ?? []).map((p: { user_id: string; first_name: string | null; tussenvoegsel: string | null; last_name: string | null; company: string | null }) => [p.user_id, p]));

  // Get investigation counts per user
  const { data: invCounts } = await supabaseAdmin
    .from('investigations')
    .select('user_id, type');

  const countMap = new Map<string, number>();
  for (const inv of invCounts ?? []) {
    countMap.set(inv.user_id, (countMap.get(inv.user_id) ?? 0) + 1);
  }

  const result = users.map((u) => {
    const roleRow = roleMap.get(u.id);
    const profileRow = profileMap.get(u.id);
    return {
      id: u.id,
      email: u.email,
      role: roleRow?.role ?? 'gebruiker',
      privacy_version_accepted: roleRow?.privacy_version_accepted ?? null,
      privacy_accepted_at: roleRow?.privacy_accepted_at ?? null,
      first_name: profileRow?.first_name ?? null,
      tussenvoegsel: profileRow?.tussenvoegsel ?? null,
      last_name: profileRow?.last_name ?? null,
      company: profileRow?.company ?? null,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      investigation_count: countMap.get(u.id) ?? 0,
    };
  });

  return NextResponse.json(result);
}
