import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });

  const { data } = await supabase
    .from('profiles')
    .select('first_name, tussenvoegsel, last_name, company')
    .eq('user_id', user.id)
    .single();

  return NextResponse.json(data ?? { first_name: null, tussenvoegsel: null, last_name: null, company: null });
}

export async function PATCH(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });

  const { first_name, tussenvoegsel, last_name, company } = await request.json();

  const { error } = await supabase
    .from('profiles')
    .upsert({
      user_id: user.id,
      first_name: first_name || null,
      tussenvoegsel: tussenvoegsel || null,
      last_name: last_name || null,
      company: company || null,
      updated_at: new Date().toISOString(),
    });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
