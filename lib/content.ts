import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { unstable_cache } from 'next/cache';

// Creates a lightweight anon Supabase client without cookie handling
// (only needed for reading public content rows)
function createContentClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    },
  );
}

/** Fetches all key→value pairs for a namespace, cached with tag 'content' */
export const getNamespaceContent = unstable_cache(
  async (namespace: string): Promise<Record<string, string>> => {
    const supabase = createContentClient();
    const { data, error } = await supabase
      .from('content')
      .select('key, value')
      .eq('namespace', namespace);

    if (error || !data) return {};

    return Object.fromEntries(data.map((row) => [row.key, row.value]));
  },
  ['namespace-content'],
  { tags: ['content'], revalidate: 60 },
);

/** Fetches a single key from a namespace */
export async function getContent(
  namespace: string,
  key: string,
  fallback?: string,
): Promise<string> {
  const ns = await getNamespaceContent(namespace);
  return ns[key] ?? fallback ?? '';
}
