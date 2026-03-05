import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Niet geauthenticeerd' }, { status: 401 });

  // Fetch the required version before clearing it
  const { data: roleRow } = await supabaseAdmin
    .from('user_roles')
    .select('privacy_required_version')
    .eq('user_id', user.id)
    .single();

  const version = roleRow?.privacy_required_version;
  if (!version) {
    return NextResponse.json({ ok: true }); // nothing to do
  }

  // Accept: set accepted version, clear required version
  const { error } = await supabaseAdmin
    .from('user_roles')
    .update({
      privacy_version_accepted: version,
      privacy_accepted_at: new Date().toISOString(),
      privacy_required_version: null,
    })
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Also update auth metadata
  await supabaseAdmin.auth.admin.updateUserById(user.id, {
    user_metadata: { privacy_version_accepted: version },
  });

  return NextResponse.json({ ok: true });
}
