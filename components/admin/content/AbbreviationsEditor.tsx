'use client';

import { useState } from 'react';

interface Props {
  /** Current DB overrides: key = afkorting-ID, value = definitie */
  customAbbr: Record<string, string>;
  /** Hardcoded afkortingen — als referentie, niet bewerkbaar */
  hardcoded: Record<string, string>;
}

export default function AbbreviationsEditor({ customAbbr, hardcoded }: Props) {
  const [db, setDb] = useState<Record<string, string>>(customAbbr);

  // Add / Edit form
  const [newId, setNewId] = useState('');
  const [newDef, setNewDef] = useState('');
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState('');

  // Edit state for existing rows
  const [editId, setEditId] = useState<string | null>(null);
  const [editDef, setEditDef] = useState('');
  const [rowSaving, setRowSaving] = useState(false);

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

  function startEdit(id: string) {
    setEditId(id);
    setEditDef(db[id]);
  }

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

  const dbEntries = Object.entries(db).sort(([a], [b]) => a.localeCompare(b));
  const hardcodedEntries = Object.entries(hardcoded).sort(([a], [b]) => a.localeCompare(b));

  const inputCls =
    'rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-orange-900/30';

  return (
    <div className="space-y-10">

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
              className={`${inputCls} flex-1 min-w-64`}
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
          {addError && (
            <p className="mt-2 text-sm text-red-500">{addError}</p>
          )}
          <p className="mt-3 text-xs text-zinc-400">
            Gebruik deze afkorting vervolgens in markdown-velden als{' '}
            <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">{'[[abbr:ID]]'}</code>{' '}
            of{' '}
            <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">{'[[abbr:ID:eigen titel]]'}</code>.
          </p>
        </div>
      </section>

      {/* ── Eigen afkortingen (database) ── */}
      <section>
        <h2 className="mb-1 text-base font-semibold text-zinc-900 dark:text-zinc-50">
          Eigen afkortingen (database)
        </h2>
        <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
          Deze overschrijven de standaarddefinities wanneer de ID overeenkomt.
        </p>

        {dbEntries.length === 0 ? (
          <p className="text-sm text-zinc-400 italic">Nog geen eigen afkortingen toegevoegd.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/50">
                  <th className="px-4 py-2.5 text-left font-medium text-zinc-500 dark:text-zinc-400 w-32">ID</th>
                  <th className="px-4 py-2.5 text-left font-medium text-zinc-500 dark:text-zinc-400">Definitie</th>
                  <th className="px-4 py-2.5 text-right font-medium text-zinc-500 dark:text-zinc-400 w-32">Acties</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {dbEntries.map(([id, def]) => (
                  <tr key={id} className="bg-white dark:bg-zinc-900">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-zinc-700 dark:text-zinc-300 align-top">
                      {id}
                    </td>
                    <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300 align-top">
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
                        def
                      )}
                    </td>
                    <td className="px-4 py-3 text-right align-top">
                      {editId !== id && (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => startEdit(id)}
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
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Standaard afkortingen (hardcoded, alleen lezen) ── */}
      <section>
        <h2 className="mb-1 text-base font-semibold text-zinc-900 dark:text-zinc-50">
          Standaard afkortingen
        </h2>
        <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
          Ingebakken in de code — niet bewerkbaar via de interface. Voeg een eigen afkorting toe met hetzelfde ID om de definitie te overschrijven.
        </p>
        <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/50">
                <th className="px-4 py-2.5 text-left font-medium text-zinc-500 dark:text-zinc-400 w-32">ID</th>
                <th className="px-4 py-2.5 text-left font-medium text-zinc-500 dark:text-zinc-400">Definitie</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {hardcodedEntries.map(([id, def]) => (
                <tr key={id} className="bg-white dark:bg-zinc-900">
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-zinc-700 dark:text-zinc-300 align-top">
                    {id}
                    {db[id] !== undefined && (
                      <span className="ml-1.5 rounded bg-orange-100 px-1 py-0.5 text-[10px] font-normal text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                        overschreven
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400 align-top">
                    {def}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
}
