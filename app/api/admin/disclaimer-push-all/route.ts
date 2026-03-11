import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/auth';

export async function POST() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });

  // Fetch latest disclaimer version
  const { data: latestRow, error: verError } = await supabaseAdmin
    .from('disclaimer_versions')
    .select('version_number')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (verError || !latestRow) {
    return NextResponse.json({ error: 'Geen disclaimerversie gevonden' }, { status: 404 });
  }

  const latest = latestRow.version_number as string;

  // Update all users where required_version differs from latest
  const { data, error } = await supabaseAdmin
    .from('user_roles')
    .update({ disclaimer_required_version: latest })
    .neq('disclaimer_required_version', latest)
    .select('user_id');

  // Also update rows where disclaimer_required_version IS NULL (neq doesn't match NULLs in Postgres)
  const { data: nullData, error: nullError } = await supabaseAdmin
    .from('user_roles')
    .update({ disclaimer_required_version: latest })
    .is('disclaimer_required_version', null)
    .select('user_id');

  if (error || nullError) {
    return NextResponse.json({ error: error?.message ?? nullError?.message }, { status: 500 });
  }

  const count = (data?.length ?? 0) + (nullData?.length ?? 0);

  return NextResponse.json({ count, version: latest });
}
