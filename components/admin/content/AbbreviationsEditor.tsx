'use client';

import { useState } from 'react';

interface Props {
  items: Record<string, string>;
}

export default function AbbreviationsEditor({ items: initial }: Props) {
  const [db, setDb] = useState<Record<string, string>>(initial);

  // ── Nieuwe afkorting ───────────────────────────────────────────────────────
  const [newId, setNewId] = useState('');
  const [newDef, setNewDef] = useState('');
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState('');

  async function handleAdd() {
    const id = newId.trim().toUpperCase().replace(/\s+/g, '');
    const def = newDef.trim();
    if (!id) { setAddError('Voer een afkorting-ID in (bijv. GW).'); return; }
    if (!def) { setAddError('Voer een definitie in.'); return; }
    setAddError('');
    setAddSaving(true);
    await fetch('/api/admin/content', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ namespace: 'abbr.list', key: id, value: def, ctype: 'plain' }),
    });
    setDb((prev) => ({ ...prev, [id]: def }));
    setNewId('');
    setNewDef('');
    setAddSaving(false);
  }

  // ── Bewerken ──────────────────────────────────────────────────────────────
  const [editId, setEditId] = useState<string | null>(null);
  const [editDef, setEditDef] = useState('');
  const [rowSaving, setRowSaving] = useState(false);

  async function handleSaveEdit() {
    if (!editId) return;
    const def = editDef.trim();
    if (!def) return;
    setRowSaving(true);
    await fetch('/api/admin/content', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ namespace: 'abbr.list', key: editId, value: def, ctype: 'plain' }),
    });
    setDb((prev) => ({ ...prev, [editId]: def }));
    setEditId(null);
    setRowSaving(false);
  }

  async function handleDelete(id: string) {
    await fetch('/api/admin/content', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ namespace: 'abbr.list', key: id }),
    });
    setDb((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    if (editId === id) setEditId(null);
  }

  const allIds = Object.keys(db).sort((a, b) => a.localeCompare(b));

  const inputCls =
    'rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-orange-900/30';

  return (
    <div className="space-y-8">

      {/* ── Nieuwe afkorting toevoegen ── */}
      <section>
        <h2 className="mb-4 text-base font-semibold text-zinc-900 dark:text-zinc-50">
          Nieuwe afkorting toevoegen
        </h2>
        <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-wrap gap-3">
            <input
              type="text"
              placeholder="ID (bijv. GW)"
              value={newId}
              onChange={(e) => setNewId(e.target.value)}
              className={`${inputCls} w-32 uppercase`}
              maxLength={20}
            />
            <input
              type="text"
              placeholder="Definitie (bijv. Grenswaarde geluid — 87 dB(A))"
              value={newDef}
              onChange={(e) => setNewDef(e.target.value)}
              className={`${inputCls} min-w-64 flex-1`}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
            />
            <button
              onClick={handleAdd}
              disabled={addSaving}
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-orange-600 disabled:opacity-50"
            >
              {addSaving ? 'Toevoegen…' : 'Toevoegen'}
            </button>
          </div>
          {addError && <p className="mt-2 text-sm text-red-500">{addError}</p>}
          <p className="mt-3 text-xs text-zinc-400">
            Gebruik als{' '}
            <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">{'[[abbr:ID]]'}</code>{' '}
            of{' '}
            <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">{'[[abbr:ID:eigen titel]]'}</code>.
          </p>
        </div>
      </section>

      {/* ── Alle afkortingen ── */}
      <section>
        <h2 className="mb-4 text-base font-semibold text-zinc-900 dark:text-zinc-50">
          Alle afkortingen ({allIds.length})
        </h2>
        <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/50">
                <th className="w-36 px-4 py-2.5 text-left font-medium text-zinc-500 dark:text-zinc-400">ID</th>
                <th className="px-4 py-2.5 text-left font-medium text-zinc-500 dark:text-zinc-400">Definitie</th>
                <th className="w-36 px-4 py-2.5 text-right font-medium text-zinc-500 dark:text-zinc-400">Acties</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {allIds.map((id) => (
                <tr key={id} className="bg-white dark:bg-zinc-900">
                  <td className="px-4 py-3 align-top">
                    <span className="font-mono text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      {id}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-top text-zinc-700 dark:text-zinc-300">
                    {editId === id ? (
                      <div className="flex gap-2">
                        <input
                          // eslint-disable-next-line jsx-a11y/no-autofocus
                          autoFocus
                          type="text"
                          value={editDef}
                          onChange={(e) => setEditDef(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit();
                            if (e.key === 'Escape') setEditId(null);
                          }}
                          className={`${inputCls} flex-1`}
                        />
                        <button
                          onClick={handleSaveEdit}
                          disabled={rowSaving}
                          className="rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-600 disabled:opacity-50"
                        >
                          {rowSaving ? '…' : 'Opslaan'}
                        </button>
                        <button
                          onClick={() => setEditId(null)}
                          className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs text-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                        >
                          Annuleren
                        </button>
                      </div>
                    ) : (
                      db[id]
                    )}
                  </td>
                  <td className="px-4 py-3 text-right align-top">
                    {editId !== id && (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => { setEditId(id); setEditDef(db[id]); }}
                          className="rounded px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                        >
                          Bewerken
                        </button>
                        <button
                          onClick={() => handleDelete(id)}
                          className="rounded px-2 py-1 text-xs text-red-500 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20"
                        >
                          Verwijderen
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {allIds.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-sm italic text-zinc-400 dark:text-zinc-500">
                    Nog geen afkortingen — voeg er hierboven een toe.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
}
