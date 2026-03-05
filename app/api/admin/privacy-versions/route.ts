import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/auth';
import { revalidateTag } from 'next/cache';

function nextVersion(latest: string | null, type: 'major' | 'minor' | 'patch'): string {
  if (!latest) return '1.0.0';
  const parts = latest.split('.').map(Number);
  const major = parts[0] ?? 1;
  const minor = parts[1] ?? 0;
  const patch = parts[2] ?? 0;
  if (type === 'major') return `${major + 1}.0.0`;
  if (type === 'minor') return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

/** GET — list all privacy versions, newest first */
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('privacy_versions')
    .select('id, version_number, version_type, created_at')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

/** POST — publish a new privacy version */
export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });

  const { body, version_type } = await req.json() as {
    body: string;
    version_type: 'major' | 'minor' | 'patch';
  };

  if (!body || !['major', 'minor', 'patch'].includes(version_type)) {
    return NextResponse.json({ error: 'Ongeldig verzoek' }, { status: 400 });
  }

  // Get the latest version number
  const { data: latest } = await supabaseAdmin
    .from('privacy_versions')
    .select('version_number')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const version_number = nextVersion(latest?.version_number ?? null, version_type);

  // Insert new version
  const { data: newVersion, error: insertError } = await supabaseAdmin
    .from('privacy_versions')
    .insert({ version_number, version_type, body })
    .select('id, version_number, version_type, created_at')
    .single();

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

  // Also update the content table so getContent('page.privacy','body') stays current
  await supabaseAdmin.from('content').upsert(
    { namespace: 'page.privacy', key: 'body', value: body, ctype: 'markdown' },
    { onConflict: 'namespace,key' },
  );

  // Store the current version number in content table for easy retrieval
  await supabaseAdmin.from('content').upsert(
    { namespace: 'page.privacy', key: 'version', value: version_number, ctype: 'plain' },
    { onConflict: 'namespace,key' },
  );

  revalidateTag('content', {});

  return NextResponse.json(newVersion);
}
