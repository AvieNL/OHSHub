import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });

  const [{ data: investigations }, { data: roleRow }, { data: profileRow }] = await Promise.all([
    supabase
      .from('investigations')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false }),
    supabase
      .from('user_roles')
      .select('role, privacy_version_accepted, privacy_accepted_at')
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('profiles')
      .select('first_name, tussenvoegsel, last_name, company')
      .eq('user_id', user.id)
      .single(),
  ]);

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
    },
    role: roleRow?.role ?? 'gebruiker',
    privacy_version_accepted: roleRow?.privacy_version_accepted ?? null,
    privacy_accepted_at: roleRow?.privacy_accepted_at ?? null,
    profile: {
      first_name: profileRow?.first_name ?? null,
      tussenvoegsel: profileRow?.tussenvoegsel ?? null,
      last_name: profileRow?.last_name ?? null,
      company: profileRow?.company ?? null,
    },
    investigations: investigations ?? [],
  });
}
