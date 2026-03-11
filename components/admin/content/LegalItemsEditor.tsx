'use client';

import { useState } from 'react';

export interface LegalItem {
  name: string;
  desc?: string;
  indent?: number; // 0/undefined = geen inspringing, 1 = 1 niveau, 2 = 2 niveaus
}

interface Props {
  namespace: string;
  contentKey: string;
  initialItems: LegalItem[];
  addLabel?: string;
  onSaved?: () => void;
}

function UpIcon() {
  return (
    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
    </svg>
  );
}
function DownIcon() {
  return (
    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}
function PencilIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  );
}
function XIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

export default function LegalItemsEditor({
  namespace,
  contentKey,
  initialItems,
  addLabel = 'Item',
  onSaved,
}: Props) {
  const [items, setItems] = useState<LegalItem[]>(JSON.parse(JSON.stringify(initialItems)));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editItem, setEditItem] = useState<LegalItem>({ name: '' });

  const isDirty = JSON.stringify(items) !== JSON.stringify(initialItems);

  async function persist(next: LegalItem[]) {
    setSaving(true);
    await fetch('/api/admin/content', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ namespace, key: contentKey, value: JSON.stringify(next), ctype: 'json' }),
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
      body: JSON.stringify({ namespace, key: contentKey }),
    });
    setItems(JSON.parse(JSON.stringify(initialItems)));
    onSaved?.();
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
    setEditItem({ ...items[idx] });
  }

  function commitEdit() {
    if (editIdx === null) return;
    setItems((prev) => prev.map((it, i) => (i === editIdx ? { ...editItem } : it)));
    setEditIdx(null);
  }

  function remove(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function addItem() {
    const newItem: LegalItem = { name: '' };
    setItems((prev) => [...prev, newItem]);
    setEditIdx(items.length);
    setEditItem(newItem);
  }

  function adjustIndent(delta: number) {
    const cur = editItem.indent ?? 0;
    const next = Math.max(0, Math.min(2, cur + delta));
    setEditItem((it) => ({ ...it, indent: next === 0 ? undefined : next }));
  }

  const INDENT_LABELS = ['geen', '1×', '2×'];

  return (
    <div className="space-y-2">
      {items.map((item, idx) => (
        <div
          key={idx}
          className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900"
          style={{ marginLeft: `${(item.indent ?? 0) * 16}px` }}
        >
          {editIdx === idx ? (
            <div className="space-y-2">
              <textarea
                rows={2}
                value={editItem.name}
                onChange={(e) => setEditItem((it) => ({ ...it, name: e.target.value }))}
                placeholder="Naam — ondersteunt **vet**, *cursief*, <u>onderstreept</u>"
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium placeholder-zinc-400 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
              />
              <textarea
                rows={2}
                value={editItem.desc ?? ''}
                onChange={(e) =>
                  setEditItem((it) => ({ ...it, desc: e.target.value || undefined }))
                }
                placeholder="Beschrijving (optioneel) — ondersteunt **vet**, *cursief*, <u>onderstreept</u>"
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm placeholder-zinc-400 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
              />
              {/* Indent controls */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400">Inspringing:</span>
                <button
                  type="button"
                  onClick={() => adjustIndent(-1)}
                  disabled={(editItem.indent ?? 0) === 0}
                  className="rounded border border-zinc-200 px-2 py-0.5 text-xs text-zinc-600 hover:bg-zinc-100 disabled:opacity-30 dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-700"
                >
                  ◀
                </button>
                <span className="min-w-[2rem] text-center text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  {INDENT_LABELS[editItem.indent ?? 0]}
                </span>
                <button
                  type="button"
                  onClick={() => adjustIndent(1)}
                  disabled={(editItem.indent ?? 0) >= 2}
                  className="rounded border border-zinc-200 px-2 py-0.5 text-xs text-zinc-600 hover:bg-zinc-100 disabled:opacity-30 dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-700"
                >
                  ▶
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={commitEdit}
                  className="rounded-lg bg-orange-500 px-3 py-1 text-xs font-medium text-white hover:bg-orange-600"
                >
                  ✓ OK
                </button>
                <button
                  type="button"
                  onClick={() => setEditIdx(null)}
                  className="rounded-lg border border-zinc-200 px-3 py-1 text-xs text-zinc-500 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-700"
                >
                  Annuleren
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">{item.name}</p>
                {item.desc && (
                  <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{item.desc}</p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => moveUp(idx)}
                  disabled={idx === 0}
                  className="rounded p-1 text-zinc-400 hover:bg-zinc-200 disabled:opacity-30 dark:hover:bg-zinc-700"
                  title="Omhoog"
                >
                  <UpIcon />
                </button>
                <button
                  type="button"
                  onClick={() => moveDown(idx)}
                  disabled={idx === items.length - 1}
                  className="rounded p-1 text-zinc-400 hover:bg-zinc-200 disabled:opacity-30 dark:hover:bg-zinc-700"
                  title="Omlaag"
                >
                  <DownIcon />
                </button>
                <button
                  type="button"
                  onClick={() => startEdit(idx)}
                  className="rounded p-1 text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                  title="Bewerken"
                >
                  <PencilIcon />
                </button>
                <button
                  type="button"
                  onClick={() => remove(idx)}
                  className="rounded p-1 text-zinc-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                  title="Verwijderen"
                >
                  <XIcon />
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      <button
        type="button"
        onClick={addItem}
        className="w-full rounded-lg border border-dashed border-zinc-300 py-2 text-sm text-zinc-500 hover:border-zinc-400 hover:text-zinc-700 dark:border-zinc-600 dark:hover:border-zinc-500"
      >
        + {addLabel} toevoegen
      </button>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => persist(items)}
          disabled={!isDirty || saving}
          className="rounded-lg bg-orange-500 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-orange-600 disabled:opacity-40"
        >
          {saved ? '✓ Opgeslagen' : saving ? 'Opslaan…' : 'Opslaan'}
        </button>
        <button
          type="button"
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
