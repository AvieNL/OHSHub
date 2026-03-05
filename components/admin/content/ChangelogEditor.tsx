'use client';

import { useState } from 'react';

type ChangelogEntry = {
  version: string;
  date: string;
  type: 'major' | 'minor' | 'patch';
  title: string;
  modules: string[];
  changes: string[];
};

interface Props {
  namespace: string;
  contentKey: string;
  initialEntries: ChangelogEntry[];
  onSaved?: (entries: ChangelogEntry[]) => void;
}

const BLANK: ChangelogEntry = {
  version: '',
  date: new Date().toISOString().slice(0, 10),
  type: 'patch',
  title: '',
  modules: [],
  changes: [],
};

export default function ChangelogEditor({
  namespace,
  contentKey,
  initialEntries,
  onSaved,
}: Props) {
  const [entries, setEntries] = useState<ChangelogEntry[]>(
    JSON.parse(JSON.stringify(initialEntries)),
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [addingNew, setAddingNew] = useState(false);
  const [draft, setDraft] = useState<ChangelogEntry>({ ...BLANK });

  const isDirty = JSON.stringify(entries) !== JSON.stringify(initialEntries);

  async function persist(next: ChangelogEntry[]) {
    setSaving(true);
    await fetch('/api/admin/content', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        namespace,
        key: contentKey,
        value: JSON.stringify(next),
        ctype: 'json',
      }),
    });
    setSaving(false);
    setSaved(true);
    onSaved?.(next);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleReset() {
    await fetch('/api/admin/content', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ namespace, key: contentKey }),
    });
    setEntries(JSON.parse(JSON.stringify(initialEntries)));
    onSaved?.(initialEntries);
  }

  function addEntry() {
    if (!draft.version || !draft.title) return;
    const next = [{ ...draft }, ...entries];
    setEntries(next);
    setDraft({ ...BLANK });
    setAddingNew(false);
  }

  function removeEntry(idx: number) {
    setEntries((prev) => prev.filter((_, i) => i !== idx));
  }

  return (
    <div className="space-y-4">
      {/* New entry form */}
      <div>
        {!addingNew ? (
          <button
            onClick={() => setAddingNew(true)}
            className="rounded-lg border border-dashed border-zinc-300 px-4 py-2 text-sm text-zinc-500 hover:border-zinc-400 hover:text-zinc-700 dark:border-zinc-600 dark:hover:border-zinc-500"
          >
            + Release toevoegen
          </button>
        ) : (
          <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 dark:border-orange-800/50 dark:bg-orange-900/10">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-orange-700 dark:text-orange-400">
              Nieuwe release
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs text-zinc-500">Versie</label>
                <input
                  type="text"
                  value={draft.version}
                  onChange={(e) => setDraft((d) => ({ ...d, version: e.target.value }))}
                  placeholder="0.15.0"
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-mono dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-zinc-500">Datum</label>
                <input
                  type="date"
                  value={draft.date}
                  onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-zinc-500">Type</label>
                <select
                  value={draft.type}
                  onChange={(e) => setDraft((d) => ({ ...d, type: e.target.value as ChangelogEntry['type'] }))}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
                >
                  <option value="patch">patch</option>
                  <option value="minor">minor</option>
                  <option value="major">major</option>
                </select>
              </div>
            </div>
            <div className="mt-3">
              <label className="mb-1 block text-xs text-zinc-500">Titel</label>
              <input
                type="text"
                value={draft.title}
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                placeholder="Beschrijving van de release"
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </div>
            <div className="mt-3">
              <label className="mb-1 block text-xs text-zinc-500">
                Modules (komma-gescheiden)
              </label>
              <input
                type="text"
                value={draft.modules.join(', ')}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    modules: e.target.value
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean),
                  }))
                }
                placeholder="Platform, Geluid"
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </div>
            <div className="mt-3">
              <label className="mb-1 block text-xs text-zinc-500">
                Wijzigingen (één per regel)
              </label>
              <textarea
                rows={4}
                value={draft.changes.join('\n')}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    changes: e.target.value.split('\n').filter(Boolean),
                  }))
                }
                placeholder="Wijziging 1&#10;Wijziging 2"
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={addEntry}
                disabled={!draft.version || !draft.title}
                className="rounded-lg bg-orange-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-40"
              >
                Toevoegen
              </button>
              <button
                onClick={() => setAddingNew(false)}
                className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                Annuleren
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Entries list */}
      <div className="space-y-2">
        {entries.map((entry, idx) => (
          <div
            key={idx}
            className="flex items-start justify-between gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800/50"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  v{entry.version}
                </span>
                <span className="rounded bg-zinc-200 px-1.5 py-0.5 text-xs dark:bg-zinc-700 dark:text-zinc-300">
                  {entry.type}
                </span>
                <span className="text-xs text-zinc-400">{entry.date}</span>
              </div>
              <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-300">{entry.title}</p>
            </div>
            <button
              onClick={() => removeEntry(idx)}
              className="shrink-0 rounded p-1 text-zinc-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
              title="Verwijderen"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => persist(entries)}
          disabled={!isDirty || saving}
          className="rounded-lg bg-orange-500 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saved ? '✓ Opgeslagen' : saving ? 'Opslaan…' : 'Opslaan'}
        </button>
        <button
          onClick={handleReset}
          className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-500 transition hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          ↺ Reset
        </button>
        {isDirty && <span className="text-xs text-zinc-400">Niet-opgeslagen wijzigingen</span>}
      </div>
    </div>
  );
}
