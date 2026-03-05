import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  let query = supabase
    .from('investigations')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (type) query = query.eq('type', type);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

const VALID_TYPES = ['hazardous', 'sound', 'physical', 'climate'] as const;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });

  const body = await request.json();
  const { id, type, name, data, created_at } = body;

  // Validate type
  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: 'Ongeldig type' }, { status: 400 });
  }

  // Validate id format if provided
  if (id !== undefined && !UUID_RE.test(String(id))) {
    return NextResponse.json({ error: 'Ongeldig id-formaat' }, { status: 400 });
  }

  // Validate name length
  if (name !== undefined && String(name).length > 500) {
    return NextResponse.json({ error: 'Naam te lang' }, { status: 400 });
  }

  const { error } = await supabase
    .from('investigations')
    .upsert({
      id,
      user_id: user.id,
      type,
      name: name ?? '',
      data: data ?? {},
      created_at: created_at ?? new Date().toISOString(),
      updated_at: new Date().toISOString(), // altijd server-gegenereerd
    });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
