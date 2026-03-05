'use client';

import { useState } from 'react';

interface Norm {
  name: string;
  desc: string;
}

interface Props {
  namespace: string;
  initialNorms: Norm[];
  onSaved?: () => void;
}

export default function NormsEditorClient({ namespace, initialNorms, onSaved }: Props) {
  const [norms, setNorms] = useState<Norm[]>(JSON.parse(JSON.stringify(initialNorms)));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editNorm, setEditNorm] = useState<Norm>({ name: '', desc: '' });

  const isDirty = JSON.stringify(norms) !== JSON.stringify(initialNorms);

  async function persist(next: Norm[]) {
    setSaving(true);
    await fetch('/api/admin/content', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ namespace, key: 'norms', value: JSON.stringify(next), ctype: 'json' }),
    });
    setSaving(false);
    setSaved(true);
    onSaved?.();
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleReset() {
    await fetch('/api/admin/content', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ namespace, key: 'norms' }),
    });
    setNorms(JSON.parse(JSON.stringify(initialNorms)));
    onSaved?.();
  }

  function startEdit(idx: number) {
    setEditIdx(idx);
    setEditNorm({ ...norms[idx] });
  }

  function commitEdit() {
    if (editIdx === null) return;
    setNorms((prev) => prev.map((n, i) => (i === editIdx ? { ...editNorm } : n)));
    setEditIdx(null);
  }

  function removeNorm(idx: number) {
    setNorms((prev) => prev.filter((_, i) => i !== idx));
  }

  function addNorm() {
    setNorms((prev) => [...prev, { name: 'Nieuwe norm', desc: '' }]);
    setEditIdx(norms.length);
    setEditNorm({ name: 'Nieuwe norm', desc: '' });
  }

  return (
    <div className="space-y-2">
      {norms.map((norm, idx) => (
        <div
          key={idx}
          className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800/50"
        >
          {editIdx === idx ? (
            <div className="space-y-2">
              <input
                type="text"
                value={editNorm.name}
                onChange={(e) => setEditNorm((n) => ({ ...n, name: e.target.value }))}
                placeholder="Normnaam"
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
              />
              <textarea
                rows={2}
                value={editNorm.desc}
                onChange={(e) => setEditNorm((n) => ({ ...n, desc: e.target.value }))}
                placeholder="Beschrijving"
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
              />
              <div className="flex gap-2">
                <button
                  onClick={commitEdit}
                  className="rounded-lg bg-orange-500 px-3 py-1 text-xs font-medium text-white hover:bg-orange-600"
                >
                  ✓ OK
                </button>
                <button
                  onClick={() => setEditIdx(null)}
                  className="rounded-lg border border-zinc-200 px-3 py-1 text-xs text-zinc-500 hover:bg-zinc-100 dark:border-zinc-700"
                >
                  Annuleren
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">{norm.name}</p>
                {norm.desc && (
                  <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{norm.desc}</p>
                )}
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  onClick={() => startEdit(idx)}
                  className="rounded p-1 text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button
                  onClick={() => removeNorm(idx)}
                  className="rounded p-1 text-zinc-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      <button
        onClick={addNorm}
        className="w-full rounded-lg border border-dashed border-zinc-300 py-2 text-sm text-zinc-500 hover:border-zinc-400 hover:text-zinc-700 dark:border-zinc-600"
      >
        + Norm toevoegen
      </button>

      <div className="flex items-center gap-2">
        <button
          onClick={() => persist(norms)}
          disabled={!isDirty || saving}
          className="rounded-lg bg-orange-500 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-orange-600 disabled:opacity-40"
        >
          {saved ? '✓ Opgeslagen' : saving ? 'Opslaan…' : 'Opslaan'}
        </button>
        <button
          onClick={handleReset}
          className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-500 transition hover:bg-zinc-50 dark:border-zinc-700"
        >
          ↺ Reset
        </button>
        {isDirty && <span className="text-xs text-zinc-400">Niet-opgeslagen wijzigingen</span>}
      </div>
    </div>
  );
}
