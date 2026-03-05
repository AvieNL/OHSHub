'use client';

import { useState } from 'react';

interface Props {
  namespace: string;
  contentKey: string;
  initialItems: string[];
  label?: string;
  itemLabel?: string;
  onSaved?: (items: string[]) => void;
}

export default function JsonArrayEditor({
  namespace,
  contentKey,
  initialItems,
  label,
  itemLabel = 'Item',
  onSaved,
}: Props) {
  const [items, setItems] = useState<string[]>(initialItems);
  const [newItem, setNewItem] = useState('');
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editVal, setEditVal] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const isDirty = JSON.stringify(items) !== JSON.stringify(initialItems);

  async function persist(next: string[]) {
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
    setItems(initialItems);
    onSaved?.(initialItems);
  }

  function addItem() {
    if (!newItem.trim()) return;
    const next = [...items, newItem.trim()];
    setItems(next);
    setNewItem('');
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function moveUp(idx: number) {
    if (idx === 0) return;
    setItems((prev) => {
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  }

  function moveDown(idx: number) {
    if (idx === items.length - 1) return;
    setItems((prev) => {
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  }

  function startEdit(idx: number) {
    setEditIdx(idx);
    setEditVal(items[idx]);
  }

  function commitEdit() {
    if (editIdx === null) return;
    setItems((prev) => prev.map((v, i) => (i === editIdx ? editVal : v)));
    setEditIdx(null);
  }

  return (
    <div>
      {label && (
        <p className="mb-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
      )}

      <div className="space-y-1">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="flex items-start gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800/50"
          >
            {editIdx === idx ? (
              <>
                <textarea
                  rows={2}
                  value={editVal}
                  onChange={(e) => setEditVal(e.target.value)}
                  className="flex-1 rounded border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
                />
                <div className="flex flex-col gap-1">
                  <button
                    onClick={commitEdit}
                    className="rounded bg-orange-500 px-2 py-1 text-xs font-medium text-white hover:bg-orange-600"
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => setEditIdx(null)}
                    className="rounded border border-zinc-200 px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-700"
                  >
                    ✕
                  </button>
                </div>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                  {item}
                </span>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => moveUp(idx)}
                    disabled={idx === 0}
                    className="rounded p-1 text-zinc-400 hover:bg-zinc-200 disabled:opacity-30 dark:hover:bg-zinc-700"
                    title="Omhoog"
                  >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => moveDown(idx)}
                    disabled={idx === items.length - 1}
                    className="rounded p-1 text-zinc-400 hover:bg-zinc-200 disabled:opacity-30 dark:hover:bg-zinc-700"
                    title="Omlaag"
                  >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => startEdit(idx)}
                    className="rounded p-1 text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                    title="Bewerken"
                  >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => removeItem(idx)}
                    className="rounded p-1 text-zinc-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                    title="Verwijderen"
                  >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Add new item */}
      <div className="mt-2 flex gap-2">
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addItem()}
          placeholder={`Nieuw ${itemLabel.toLowerCase()}…`}
          className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm placeholder-zinc-400 outline-none transition focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500"
        />
        <button
          onClick={addItem}
          disabled={!newItem.trim()}
          className="rounded-lg border border-dashed border-zinc-300 px-3 py-1.5 text-sm text-zinc-500 transition hover:border-zinc-400 hover:text-zinc-700 disabled:opacity-40 dark:border-zinc-600 dark:hover:border-zinc-500"
        >
          + {itemLabel}
        </button>
      </div>

      {/* Save controls */}
      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={() => persist(items)}
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
