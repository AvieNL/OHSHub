'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useIsAdmin } from '@/components/AdminContext';

interface Props {
  namespace: string;
  contentKey: string;
  /** Huidige waarde: DB-override ?? hardcoded fallback (voor het edit-veld). */
  initialValue: string;
  /** Hardcoded standaardwaarde — reset verwijdert de DB-override en keert terug naar deze waarde. */
  fallback?: string;
  /** Textarea (meerdere regels) of input (één regel). */
  multiline?: boolean;
  /**
   * Sla op als markdown en toon een markdown-hint in het edit-veld.
   * De weergave (children) wordt door de parent als <ReactMarkdown> doorgegeven.
   */
  markdown?: boolean;
  /** De zichtbare tekst zoals hij getoond wordt (mag JSX met Formula/ReactMarkdown bevatten). */
  children: React.ReactNode;
}

/**
 * Wikkelt bewerkbare tekst in voor admins.
 * - Niet-admins zien alleen `children`, zonder overhead.
 * - Admins zien een zweef-potlood; klik → inline edit-form.
 * - Na opslaan: router.refresh() herlaadt de server-data.
 */
export default function InlineEdit({
  namespace,
  contentKey,
  initialValue,
  fallback,
  multiline,
  markdown,
  children,
}: Props) {
  const isAdmin = useIsAdmin();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initialValue);
  const [saving, setSaving] = useState(false);

  // Sync value wanneer server nieuwe data doorgeeft na router.refresh()
  useEffect(() => {
    if (!editing) setValue(initialValue);
  }, [initialValue, editing]);

  if (!isAdmin) return <>{children}</>;

  const hasOverride = fallback !== undefined && initialValue !== fallback;

  function cancel() {
    setValue(initialValue);
    setEditing(false);
  }

  async function handleSave() {
    setSaving(true);
    await fetch('/api/admin/content', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ namespace, key: contentKey, value, ctype: markdown ? 'markdown' : 'plain' }),
    });
    setSaving(false);
    setEditing(false);
    router.refresh();
  }

  async function handleReset() {
    await fetch('/api/admin/content', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ namespace, key: contentKey }),
    });
    setEditing(false);
    router.refresh();
  }

  if (editing) {
    return (
      <div>
        {multiline ? (
          <textarea
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
            rows={5}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full rounded-lg border border-orange-300 bg-white px-3 py-2 text-sm text-zinc-800 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 dark:border-orange-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-orange-900/30"
          />
        ) : (
          <input
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full rounded-lg border border-orange-300 bg-white px-3 py-2 text-sm text-zinc-800 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 dark:border-orange-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-orange-900/30"
          />
        )}
        {multiline && (
          <p className="mt-1 text-xs text-zinc-400">
            {markdown && (
              <>
                <strong className="font-medium text-zinc-500">Markdown:</strong>{' '}
                <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">**vet**</code>{' '}
                <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">*cursief*</code>{' '}
                <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">- lijst</code>{' · '}
                <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">{'[[abbr:CMR]]'}</code>{' of '}
                <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">{'[[abbr:CMR:eigen titel]]'}</code>{' · '}
              </>
            )}
            Formules: <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">{'[[L_{EX,8h}]]'}</code>
          </p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-orange-500 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-orange-600 disabled:opacity-50"
          >
            {saving ? 'Opslaan…' : 'Opslaan'}
          </button>
          <button
            onClick={cancel}
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            Annuleren
          </button>
          {hasOverride && (
            <button
              onClick={handleReset}
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-500 transition hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              ↺ Reset naar standaard
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="group flex items-start gap-2">
      <div className="min-w-0 flex-1">{children}</div>
      <button
        type="button"
        onClick={() => setEditing(true)}
        title="Tekst bewerken"
        className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-zinc-300 opacity-0 transition group-hover:opacity-100 hover:bg-orange-50 hover:text-orange-500 dark:text-zinc-600 dark:hover:bg-orange-900/20 dark:hover:text-orange-400"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      </button>
    </div>
  );
}
