import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/auth';

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });

  const body = await request.json();
  const { body: disclaimerBody, version_type } = body as {
    body: string;
    version_type: 'major' | 'minor' | 'patch';
  };

  if (!disclaimerBody?.trim()) {
    return NextResponse.json({ error: 'Inhoud mag niet leeg zijn' }, { status: 400 });
  }
  if (!['major', 'minor', 'patch'].includes(version_type)) {
    return NextResponse.json({ error: 'Ongeldig versietype' }, { status: 400 });
  }

  // Fetch latest version to compute next number
  const { data: latestRow } = await supabaseAdmin
    .from('disclaimer_versions')
    .select('version_number')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const latest = latestRow?.version_number ?? null;
  const next = computeNextVersion(latest, version_type);

  const { error } = await supabaseAdmin
    .from('disclaimer_versions')
    .insert({ version_number: next, version_type, body: disclaimerBody.trim() });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, version: next });
}

function computeNextVersion(latest: string | null, type: 'major' | 'minor' | 'patch'): string {
  if (!latest) return '1.0.0';
  const parts = latest.split('.').map(Number);
  const major = parts[0] ?? 1;
  const minor = parts[1] ?? 0;
  const patch = parts[2] ?? 0;
  if (type === 'major') return `${major + 1}.0.0`;
  if (type === 'minor') return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}
