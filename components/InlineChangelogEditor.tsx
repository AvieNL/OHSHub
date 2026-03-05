'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useIsAdmin } from '@/components/AdminContext';
import ChangelogEditor from '@/components/admin/content/ChangelogEditor';

type ChangelogEntry = {
  version: string;
  date: string;
  type: 'major' | 'minor' | 'patch';
  title: string;
  modules: string[];
  changes: string[];
};

interface Props {
  initialEntries: ChangelogEntry[];
}

export default function InlineChangelogEditor({ initialEntries }: Props) {
  const isAdmin = useIsAdmin();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  if (!isAdmin) return null;

  return (
    <div className="mt-8">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        <svg className="h-4 w-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        {open ? 'Verberg changelog-editor' : 'Changelog bewerken'}
      </button>

      {open && (
        <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900/50">
          <ChangelogEditor
            namespace="page.over"
            contentKey="changelog"
            initialEntries={initialEntries}
            onSaved={() => {
              setOpen(false);
              router.refresh();
            }}
          />
        </div>
      )}
    </div>
  );
}
