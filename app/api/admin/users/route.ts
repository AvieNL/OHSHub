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

  // Get all roles
  const { data: roles } = await supabaseAdmin
    .from('user_roles')
    .select('user_id, role');

  const roleMap = new Map((roles ?? []).map((r: { user_id: string; role: string }) => [r.user_id, r.role]));

  // Get investigation counts per user
  const { data: invCounts } = await supabaseAdmin
    .from('investigations')
    .select('user_id, type');

  const countMap = new Map<string, number>();
  for (const inv of invCounts ?? []) {
    countMap.set(inv.user_id, (countMap.get(inv.user_id) ?? 0) + 1);
  }

  const result = users.map((u) => ({
    id: u.id,
    email: u.email,
    role: roleMap.get(u.id) ?? 'gebruiker',
    created_at: u.created_at,
    last_sign_in_at: u.last_sign_in_at,
    investigation_count: countMap.get(u.id) ?? 0,
  }));

  return NextResponse.json(result);
}
