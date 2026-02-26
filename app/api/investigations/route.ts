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

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });

  const body = await request.json();
  const { id, type, name, data, created_at, updated_at } = body;

  const { error } = await supabase
    .from('investigations')
    .upsert({
      id,
      user_id: user.id,
      type,
      name: name ?? '',
      data: data ?? {},
      created_at,
      updated_at,
    });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
