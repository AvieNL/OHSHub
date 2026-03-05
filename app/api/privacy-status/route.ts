import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Niet geauthenticeerd' }, { status: 401 });

  const { data: roleRow } = await supabaseAdmin
    .from('user_roles')
    .select('privacy_required_version')
    .eq('user_id', user.id)
    .single();

  const requiredVersion = roleRow?.privacy_required_version ?? null;

  if (!requiredVersion) {
    return NextResponse.json({ version: null, body: null });
  }

  const { data: versionRow } = await supabaseAdmin
    .from('privacy_versions')
    .select('body')
    .eq('version_number', requiredVersion)
    .single();

  return NextResponse.json({
    version: requiredVersion,
    body: versionRow?.body ?? null,
  });
}
