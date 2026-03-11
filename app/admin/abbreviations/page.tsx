import Link from 'next/link';
import { getNamespaceContent } from '@/lib/content';
import AbbreviationsEditor from '@/components/admin/content/AbbreviationsEditor';

export default async function AbbreviationsPage() {
  const items = await getNamespaceContent('abbr.list').catch(() => ({}));

  return (
    <>
      <div className="mb-8 flex items-center gap-3">
        <Link
          href="/admin"
          className="text-sm text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
        >
          ← Beheerderspaneel
        </Link>
        <span className="text-zinc-300 dark:text-zinc-600">/</span>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Afkortingen</h1>
      </div>

      <AbbreviationsEditor items={items} />
    </>
  );
}
