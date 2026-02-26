'use client';

import { useState } from 'react';
import type { Investigation, SEG } from '@/lib/investigation-types';
import { newId } from '@/lib/investigation-storage';

interface Props {
  investigation: Investigation;
  onUpdate: (partial: Partial<Investigation>) => void;
}

function emptySEG(): SEG {
  return {
    id: newId(),
    name: '',
    description: '',
    taskIds: [],
    workerCount: 1,
    notes: '',
  };
}

function SEGForm({
  seg,
  tasks,
  onChange,
  onCancel,
  onSave,
}: {
  seg: SEG;
  tasks: Investigation['tasks'];
  onChange: (s: SEG) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  function f(patch: Partial<SEG>) {
    onChange({ ...seg, ...patch });
  }

  function toggleTask(id: string) {
    const ids = seg.taskIds.includes(id)
      ? seg.taskIds.filter((t) => t !== id)
      : [...seg.taskIds, id];
    f({ taskIds: ids });
  }

  return (
    <div className="rounded-xl border border-orange-200 bg-orange-50/40 p-5 dark:border-orange-800/40 dark:bg-orange-900/10">
      <h4 className="mb-4 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
        {seg.name ? `SEG: ${seg.name}` : 'Nieuwe SEG'}
      </h4>

      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Naam SEG <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={seg.name}
              onChange={(e) => f({ name: e.target.value })}
              placeholder="Bijv. Spuiter — Afdeling Lakkerij"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-orange-400"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Aantal werknemers in deze SEG
            </label>
            <input
              type="number"
              min="1"
              value={seg.workerCount}
              onChange={(e) => f({ workerCount: parseInt(e.target.value) || 1 })}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-orange-400"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Omschrijving blootstellingsprofiel
            </label>
            <textarea
              rows={2}
              value={seg.description ?? ''}
              onChange={(e) => f({ description: e.target.value })}
              placeholder="Waarom hebben deze werknemers vergelijkbare blootstelling? (zelfde taken, stoffen, procescondities, beheersmaatregelen)"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-orange-400"
            />
          </div>
        </div>

        {tasks.length > 0 && (
          <div>
            <label className="mb-2 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Taken die bij deze SEG horen
            </label>
            <div className="space-y-1.5">
              {tasks.map((t) => (
                <label
                  key={t.id}
                  className={`flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2.5 text-sm transition ${
                    seg.taskIds.includes(t.id)
                      ? 'border-orange-400 bg-orange-50 dark:border-orange-600 dark:bg-orange-900/20'
                      : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={seg.taskIds.includes(t.id)}
                    onChange={() => toggleTask(t.id)}
                    className="mt-0.5 accent-orange-500"
                  />
                  <div>
                    <p className="text-zinc-700 dark:text-zinc-300">{t.description}</p>
                    {t.department && (
                      <p className="text-xs text-zinc-400">{t.department}</p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Opmerkingen</label>
          <textarea
            rows={2}
            value={seg.notes ?? ''}
            onChange={(e) => f({ notes: e.target.value })}
            placeholder="Bijzonderheden, overlap met andere SEG's, representatieve medewerkers…"
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-orange-400"
          />
        </div>

        <div className="flex justify-end gap-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
          <button onClick={onCancel} className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800">
            Annuleren
          </button>
          <button
            onClick={onSave}
            disabled={!seg.name.trim()}
            className="rounded-lg bg-orange-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-40"
          >
            SEG opslaan
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Step5_SEGs({ investigation, onUpdate }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<SEG | null>(null);
  const { tasks, substances, segs } = investigation;

  function substancesForSEG(seg: SEG): string[] {
    const subIds = new Set<string>();
    for (const taskId of seg.taskIds) {
      const task = tasks.find((t) => t.id === taskId);
      if (task) task.substanceIds.forEach((id) => subIds.add(id));
    }
    return Array.from(subIds).map(
      (id) => substances.find((s) => s.id === id)?.productName ?? id,
    );
  }

  function startAdd() {
    const s = emptySEG();
    setDraft(s);
    setEditingId('__new__');
  }

  function startEdit(s: SEG) {
    setDraft({ ...s });
    setEditingId(s.id);
  }

  function cancel() {
    setEditingId(null);
    setDraft(null);
  }

  function save() {
    if (!draft) return;
    if (editingId === '__new__') {
      onUpdate({ segs: [...segs, draft] });
    } else {
      onUpdate({ segs: segs.map((s) => (s.id === draft.id ? draft : s)) });
    }
    setEditingId(null);
    setDraft(null);
  }

  function remove(id: string) {
    onUpdate({ segs: segs.filter((s) => s.id !== id) });
    if (editingId === id) cancel();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Stap 5 — SEG-vorming (Similar Exposure Groups)
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          Groepeer werknemers met vergelijkbare blootstelling in SEG&apos;s conform NEN-EN 689 §5.2.1.
          Elk SEG heeft dezelfde taken, stoffen, procescondities en beheersmaatregelen.
          Metingen (stap 7) worden per SEG uitgevoerd.
        </p>
      </div>

      <div className="rounded-lg bg-zinc-50 px-4 py-3 text-xs text-zinc-500 dark:bg-zinc-800/50 dark:text-zinc-400">
        <strong>NEN-EN 689 richtlijn:</strong> Controleer bij vorming van SEG&apos;s dat medewerkers in één SEG
        echt vergelijkbaar blootstellingsprofiel hebben. Bij twijfel: opsplitsen in aparte SEG&apos;s en meten.
      </div>

      {segs.length > 0 && (
        <div className="space-y-3">
          {segs.map((s) => (
            <div key={s.id}>
              {editingId === s.id && draft ? (
                <SEGForm seg={draft} tasks={tasks} onChange={setDraft} onCancel={cancel} onSave={save} />
              ) : (
                <div className="flex items-start justify-between gap-4 rounded-xl border border-zinc-200 bg-zinc-50 px-5 py-4 dark:border-zinc-700 dark:bg-zinc-800/50">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-zinc-900 dark:text-zinc-50">{s.name}</span>
                      <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400">
                        {s.workerCount} medewerker{s.workerCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                    {s.description && (
                      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{s.description}</p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {s.taskIds.map((id) => {
                        const task = tasks.find((t) => t.id === id);
                        return task ? (
                          <span key={id} className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                            {task.description}
                          </span>
                        ) : null;
                      })}
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {substancesForSEG(s).map((name) => (
                        <span key={name} className="rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button onClick={() => startEdit(s)} className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-white dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-700">Bewerken</button>
                    <button onClick={() => remove(s.id)} className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-red-500 transition hover:bg-red-50 dark:border-zinc-600 dark:hover:bg-red-900/20">Verwijderen</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {editingId === '__new__' && draft && (
        <SEGForm seg={draft} tasks={tasks} onChange={setDraft} onCancel={cancel} onSave={save} />
      )}

      {editingId === null && (
        <button
          onClick={startAdd}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 py-4 text-sm font-medium text-zinc-500 transition hover:border-orange-400 hover:bg-orange-50 hover:text-orange-600 dark:border-zinc-700 dark:hover:border-orange-600 dark:hover:bg-orange-900/10 dark:hover:text-orange-400"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          SEG toevoegen
        </button>
      )}
    </div>
  );
}
