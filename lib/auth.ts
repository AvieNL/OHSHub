import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { User } from '@supabase/supabase-js';

/**
 * Controleert of de ingelogde gebruiker de rol 'admin' heeft.
 * Retourneert het User-object bij succes, anders null.
 * Gebruik in API routes: `const admin = await requireAdmin(); if (!admin) return 403`.
 */
export async function requireAdmin(): Promise<User | null> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  return data?.role === 'admin' ? user : null;
}
