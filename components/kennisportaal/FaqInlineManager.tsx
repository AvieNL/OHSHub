'use client';

import { useState } from 'react';
import { useIsAdmin } from '@/components/AdminContext';
import MarkdownContent from '@/components/MarkdownContent';
import type { FaqItem } from './FaqAccordion';

interface Props {
  items: FaqItem[];
  /** Wordt als theme_slug meegegeven bij nieuwe items; null = Algemeen. */
  themeSlug: string | null;
}

const inputCls =
  'w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-orange-900/30';

const textareaCls = `${inputCls} resize-y`;

export default function FaqInlineManager({ items: initial, themeSlug }: Props) {
  const isAdmin = useIsAdmin();
  const [items, setItems] = useState<FaqItem[]>(initial);
  const [open, setOpen] = useState<string | null>(null);

  // ── Bewerken ──────────────────────────────────────────────────────────────
  const [editId, setEditId] = useState<string | null>(null);
  const [editQ, setEditQ] = useState('');
  const [editA, setEditA] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  function startEdit(item: FaqItem) {
    setEditId(item.id);
    setEditQ(item.question);
    setEditA(item.answer);
    setOpen(item.id); // openklappen zodat het formulier zichtbaar is
  }

  async function saveEdit() {
    if (!editId) return;
    setEditSaving(true);
    await fetch(`/api/admin/faq/${editId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: editQ.trim(), answer: editA.trim() }),
    });
    setItems((prev) =>
      prev.map((it) =>
        it.id === editId ? { ...it, question: editQ.trim(), answer: editA.trim() } : it
      )
    );
    setEditId(null);
    setEditSaving(false);
  }

  async function deleteItem(id: string) {
    if (!confirm('Dit FAQ-item verwijderen?')) return;
    await fetch(`/api/admin/faq/${id}`, { method: 'DELETE' });
    setItems((prev) => prev.filter((it) => it.id !== id));
    if (open === id) setOpen(null);
    if (editId === id) setEditId(null);
  }

  // ── Toevoegen ─────────────────────────────────────────────────────────────
  const [showAdd, setShowAdd] = useState(false);
  const [addQ, setAddQ] = useState('');
  const [addA, setAddA] = useState('');
  const [addSaving, setAddSaving] = useState(false);

  async function addItem() {
    const q = addQ.trim();
    const a = addA.trim();
    if (!q || !a) return;
    setAddSaving(true);
    const res = await fetch('/api/admin/faq', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: q, answer: a, theme_slug: themeSlug, sort_order: 0, published: true }),
    });
    const data = await res.json().catch(() => ({}));
    if (data.item) setItems((prev) => [...prev, data.item]);
    setAddQ('');
    setAddA('');
    setShowAdd(false);
    setAddSaving(false);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (items.length === 0 && !isAdmin) return null;

  return (
    <div className="divide-y divide-zinc-100 dark:divide-zinc-800">

      {items.length === 0 && isAdmin && (
        <p className="py-3 text-sm italic text-zinc-400 dark:text-zinc-500">
          Nog geen vragen — voeg er hieronder een toe.
        </p>
      )}

      {items.map((item) => (
        <div key={item.id}>
          {/* ── Vraag-rij ── */}
          <div className="flex items-center gap-2 py-4">
            <button
              className="flex flex-1 items-center justify-between gap-4 text-left text-sm font-medium text-zinc-900 hover:text-orange-600 dark:text-zinc-100 dark:hover:text-orange-400"
              onClick={() => setOpen(open === item.id ? null : item.id)}
              aria-expanded={open === item.id}
            >
              <span>{item.question}</span>
              <svg
                className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform ${open === item.id ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Admin-knoppen */}
            {isAdmin && (
              <div className="flex shrink-0 gap-1">
                <button
                  onClick={() => editId === item.id ? setEditId(null) : startEdit(item)}
                  title="Bewerken"
                  className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button
                  onClick={() => deleteItem(item.id)}
                  title="Verwijderen"
                  className="rounded p-1 text-zinc-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* ── Antwoord / edit-formulier ── */}
          {open === item.id && (
            <div className="pb-4">
              {editId === item.id ? (
                <div className="space-y-2">
                  <input
                    // eslint-disable-next-line jsx-a11y/no-autofocus
                    autoFocus
                    type="text"
                    value={editQ}
                    onChange={(e) => setEditQ(e.target.value)}
                    placeholder="Vraag"
                    className={inputCls}
                  />
                  <textarea
                    value={editA}
                    onChange={(e) => setEditA(e.target.value)}
                    rows={5}
                    placeholder="Antwoord (markdown)"
                    className={textareaCls}
                  />
                  <p className="text-xs text-zinc-400">
                    Markdown ondersteund — <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">**vet**</code>{' '}
                    <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">*cursief*</code>{' '}
                    <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">{'[[abbr:CMR]]'}</code>{' '}
                    <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">{'[[L_{EX,8h}]]'}</code>
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={saveEdit}
                      disabled={editSaving}
                      className="rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-600 disabled:opacity-50"
                    >
                      {editSaving ? 'Opslaan…' : 'Opslaan'}
                    </button>
                    <button
                      onClick={() => setEditId(null)}
                      className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs text-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                    >
                      Annuleren
                    </button>
                  </div>
                </div>
              ) : (
                <MarkdownContent className="text-sm text-zinc-600 dark:text-zinc-400">
                  {item.answer}
                </MarkdownContent>
              )}
            </div>
          )}
        </div>
      ))}

      {/* ── Vraag toevoegen (admin) ── */}
      {isAdmin && (
        <div className="pt-3">
          {showAdd ? (
            <div className="space-y-2">
              <input
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus
                type="text"
                value={addQ}
                onChange={(e) => setAddQ(e.target.value)}
                placeholder="Vraag"
                className={inputCls}
              />
              <textarea
                value={addA}
                onChange={(e) => setAddA(e.target.value)}
                rows={4}
                placeholder="Antwoord (markdown)"
                className={textareaCls}
              />
              <div className="flex gap-2">
                <button
                  onClick={addItem}
                  disabled={addSaving || !addQ.trim() || !addA.trim()}
                  className="rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-600 disabled:opacity-50"
                >
                  {addSaving ? 'Toevoegen…' : 'Toevoegen'}
                </button>
                <button
                  onClick={() => { setShowAdd(false); setAddQ(''); setAddA(''); }}
                  className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs text-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  Annuleren
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-orange-500 dark:text-zinc-500 dark:hover:text-orange-400"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Vraag toevoegen
            </button>
          )}
        </div>
      )}
    </div>
  );
}
