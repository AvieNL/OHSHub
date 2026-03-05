import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

/** Returns the current live privacy version number (public, no auth required). */
export async function GET() {
  const { data } = await supabaseAdmin
    .from('privacy_versions')
    .select('version_number')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return NextResponse.json({ version: data?.version_number ?? '1.0' });
}
