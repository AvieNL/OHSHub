/**
 * Tijdelijk debug-endpoint — verwijder dit bestand na gebruik.
 * Geeft terug welke env vars aanwezig zijn (nooit de waarden zelf).
 */
export async function GET() {
  function check(key: string) {
    const val = process.env[key];
    if (!val) return { set: false };
    return { set: true, length: val.length, preview: val.slice(0, 6) + '…' };
  }

  return Response.json({
    NEXT_PUBLIC_SUPABASE_URL:    check('NEXT_PUBLIC_SUPABASE_URL'),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: check('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    SUPABASE_SERVICE_ROLE_KEY:   check('SUPABASE_SERVICE_ROLE_KEY'),
  });
}
