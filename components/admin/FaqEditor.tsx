'use client';

import { useState } from 'react';
import { themes } from '@/lib/themes';

export type FaqAdminItem = {
  id: string;
  question: string;
  answer: string;
  theme_slug: string | null;
  sort_order: number;
  published: boolean;
  created_at: string;
};

interface Props {
  initialItems: FaqAdminItem[];
}

const inputCls =
  'rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-orange-900/30';

const textareaCls =
  'w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-orange-900/30';

const selectCls =
  'rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-orange-900/30';

function themeLabel(slug: string | null) {
  if (!slug) return 'Algemeen';
  return themes.find((t) => t.slug === slug)?.name ?? slug;
}

export default function FaqEditor({ initialItems }: Props) {
  const [items, setItems] = useState<FaqAdminItem[]>(initialItems);

  // ── Add form ──────────────────────────────────────────────────────────────
  const [addQ, setAddQ] = useState('');
  const [addA, setAddA] = useState('');
  const [addTheme, setAddTheme] = useState('');
  const [addOrder, setAddOrder] = useState(0);
  const [addPublished, setAddPublished] = useState(true);
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState('');

  // ── Edit state ────────────────────────────────────────────────────────────
  const [editId, setEditId] = useState<string | null>(null);
  const [editQ, setEditQ] = useState('');
  const [editA, setEditA] = useState('');
  const [editTheme, setEditTheme] = useState('');
  const [editOrder, setEditOrder] = useState(0);
  const [editPublished, setEditPublished] = useState(true);
  const [editSaving, setEditSaving] = useState(false);

  // ── Handlers ──────────────────────────────────────────────────────────────

  async function handleAdd() {
    const q = addQ.trim();
    const a = addA.trim();
    if (!q) { setAddError('Vul een vraag in.'); return; }
    if (!a) { setAddError('Vul een antwoord in.'); return; }
    setAddError('');
    setAddSaving(true);
    const res = await fetch('/api/admin/faq', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: q,
        answer: a,
        theme_slug: addTheme || null,
        sort_order: addOrder,
        published: addPublished,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (data.item) {
      setItems((prev) => [...prev, data.item]);
    }
    setAddQ('');
    setAddA('');
    setAddTheme('');
    setAddOrder(0);
    setAddPublished(true);
    setAddSaving(false);
  }

  function startEdit(item: FaqAdminItem) {
    setEditId(item.id);
    setEditQ(item.question);
    setEditA(item.answer);
    setEditTheme(item.theme_slug ?? '');
    setEditOrder(item.sort_order);
    setEditPublished(item.published);
  }

  async function handleSaveEdit() {
    if (!editId) return;
    setEditSaving(true);
    await fetch(`/api/admin/faq/${editId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: editQ.trim(),
        answer: editA.trim(),
        theme_slug: editTheme || null,
        sort_order: editOrder,
        published: editPublished,
      }),
    });
    setItems((prev) =>
      prev.map((it) =>
        it.id === editId
          ? { ...it, question: editQ.trim(), answer: editA.trim(), theme_slug: editTheme || null, sort_order: editOrder, published: editPublished }
          : it
      )
    );
    setEditId(null);
    setEditSaving(false);
  }

  async function togglePublished(item: FaqAdminItem) {
    await fetch(`/api/admin/faq/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: !item.published }),
    });
    setItems((prev) =>
      prev.map((it) => (it.id === item.id ? { ...it, published: !it.published } : it))
    );
  }

  async function handleDelete(id: string) {
    if (!confirm('Dit FAQ-item definitief verwijderen?')) return;
    await fetch(`/api/admin/faq/${id}`, { method: 'DELETE' });
    setItems((prev) => prev.filter((it) => it.id !== id));
    if (editId === id) setEditId(null);
  }

  const sorted = [...items].sort((a, b) => {
    if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
    return a.created_at.localeCompare(b.created_at);
  });

  return (
    <div className="space-y-10">

      {/* ── Nieuw FAQ-item ── */}
      <section>
        <h2 className="mb-4 text-base font-semibold text-zinc-900 dark:text-zinc-50">
          Nieuw FAQ-item
        </h2>
        <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 space-y-3">
          <input
            type="text"
            placeholder="Vraag"
            value={addQ}
            onChange={(e) => setAddQ(e.target.value)}
            className={`${inputCls} w-full`}
          />
          <textarea
            placeholder="Antwoord (markdown ondersteund)"
            value={addA}
            onChange={(e) => setAddA(e.target.value)}
            rows={4}
            className={textareaCls}
          />
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={addTheme}
              onChange={(e) => setAddTheme(e.target.value)}
              className={selectCls}
            >
              <option value="">Algemeen</option>
              {themes.map((t) => (
                <option key={t.slug} value={t.slug}>{t.name}</option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
              Volgorde
              <input
                type="number"
                value={addOrder}
                onChange={(e) => setAddOrder(Number(e.target.value))}
                className={`${inputCls} w-20`}
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
              <input
                type="checkbox"
                checked={addPublished}
                onChange={(e) => setAddPublished(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300 accent-orange-500"
              />
              Gepubliceerd
            </label>
            <button
              onClick={handleAdd}
              disabled={addSaving}
              className="ml-auto rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-orange-600 disabled:opacity-50"
            >
              {addSaving ? 'Toevoegen…' : 'Toevoegen'}
            </button>
          </div>
          {addError && <p className="text-sm text-red-500">{addError}</p>}
          <p className="text-xs text-zinc-400">
            Het antwoord ondersteunt markdown — **vet**, *cursief*, lijsten, kopjes en links.
          </p>
        </div>
      </section>

      {/* ── Overzicht ── */}
      <section>
        <h2 className="mb-1 text-base font-semibold text-zinc-900 dark:text-zinc-50">
          FAQ-items ({items.length})
        </h2>
        <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
          Sortering op basis van het volgordenummer, daarna aanmaakdatum.
        </p>

        {sorted.length === 0 ? (
          <p className="text-sm italic text-zinc-400">Nog geen FAQ-items.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/50">
                  <th className="w-12 px-4 py-2.5 text-left font-medium text-zinc-500 dark:text-zinc-400">#</th>
                  <th className="w-28 px-4 py-2.5 text-left font-medium text-zinc-500 dark:text-zinc-400">Thema</th>
                  <th className="px-4 py-2.5 text-left font-medium text-zinc-500 dark:text-zinc-400">Vraag</th>
                  <th className="w-24 px-4 py-2.5 text-center font-medium text-zinc-500 dark:text-zinc-400">Status</th>
                  <th className="w-36 px-4 py-2.5 text-right font-medium text-zinc-500 dark:text-zinc-400">Acties</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {sorted.map((item) => (
                  <>
                    <tr key={item.id} className="bg-white dark:bg-zinc-900">
                      <td className="px-4 py-3 text-zinc-400 align-top tabular-nums">
                        {item.sort_order}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                          {themeLabel(item.theme_slug)}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <p className="font-medium text-zinc-800 dark:text-zinc-200">{item.question}</p>
                        <p className="mt-0.5 line-clamp-2 text-xs text-zinc-400 dark:text-zinc-500">
                          {item.answer}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-center align-top">
                        <button
                          onClick={() => togglePublished(item)}
                          title={item.published ? 'Klik om te verbergen' : 'Klik om te publiceren'}
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition ${
                            item.published
                              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400'
                          }`}
                        >
                          {item.published ? 'Gepubliceerd' : 'Verborgen'}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right align-top">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => editId === item.id ? setEditId(null) : startEdit(item)}
                            className="rounded px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                          >
                            {editId === item.id ? 'Sluiten' : 'Bewerken'}
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="rounded px-2 py-1 text-xs text-red-500 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20"
                          >
                            Verwijderen
                          </button>
                        </div>
                      </td>
                    </tr>

                    {editId === item.id && (
                      <tr key={`${item.id}-edit`} className="bg-orange-50/50 dark:bg-orange-900/5">
                        <td colSpan={5} className="px-4 py-4">
                          <div className="space-y-3">
                            <input
                              // eslint-disable-next-line jsx-a11y/no-autofocus
                              autoFocus
                              type="text"
                              value={editQ}
                              onChange={(e) => setEditQ(e.target.value)}
                              placeholder="Vraag"
                              className={`${inputCls} w-full`}
                            />
                            <textarea
                              value={editA}
                              onChange={(e) => setEditA(e.target.value)}
                              rows={5}
                              placeholder="Antwoord"
                              className={textareaCls}
                            />
                            <div className="flex flex-wrap items-center gap-3">
                              <select
                                value={editTheme}
                                onChange={(e) => setEditTheme(e.target.value)}
                                className={selectCls}
                              >
                                <option value="">Algemeen</option>
                                {themes.map((t) => (
                                  <option key={t.slug} value={t.slug}>{t.name}</option>
                                ))}
                              </select>
                              <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                                Volgorde
                                <input
                                  type="number"
                                  value={editOrder}
                                  onChange={(e) => setEditOrder(Number(e.target.value))}
                                  className={`${inputCls} w-20`}
                                />
                              </label>
                              <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                                <input
                                  type="checkbox"
                                  checked={editPublished}
                                  onChange={(e) => setEditPublished(e.target.checked)}
                                  className="h-4 w-4 rounded border-zinc-300 accent-orange-500"
                                />
                                Gepubliceerd
                              </label>
                              <div className="ml-auto flex gap-2">
                                <button
                                  onClick={() => setEditId(null)}
                                  className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs text-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                                >
                                  Annuleren
                                </button>
                                <button
                                  onClick={handleSaveEdit}
                                  disabled={editSaving}
                                  className="rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-600 disabled:opacity-50"
                                >
                                  {editSaving ? 'Opslaan…' : 'Opslaan'}
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

    </div>
  );
}
