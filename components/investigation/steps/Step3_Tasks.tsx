'use client';

import { useState } from 'react';
import type { Investigation, WorkTask, ProcessType } from '@/lib/investigation-types';
import { newId } from '@/lib/investigation-storage';

interface Props {
  investigation: Investigation;
  onUpdate: (partial: Partial<Investigation>) => void;
}

function emptyTask(): WorkTask {
  return {
    id: newId(),
    description: '',
    department: '',
    jobTitle: '',
    substanceIds: [],
    processType: 'open',
    quantityPerTask: '100g-1kg',
    durationPerDay: '2-4u',
    frequency: 'dagelijks',
    lev: 'none',
    levCheck: undefined,
    ventilation: '1-3ACH',
    roomSize: '50-500m3',
    ppe: [],
    notes: '',
  };
}

const PROCESS_TYPES: { value: ProcessType; label: string }[] = [
  { value: 'closed', label: 'Gesloten systeem — stof komt niet vrij' },
  { value: 'partly-closed', label: 'Gedeeltelijk gesloten (inkapseling, afscherming)' },
  { value: 'open', label: 'Open proces — normaal emissieniveau' },
  { value: 'high-emission', label: 'Open proces — hoge emissie (spuiten, gieten, malen)' },
];

function RadioGroup({
  name,
  value,
  onChange,
  options,
}: {
  name: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="space-y-1.5">
      {options.map((opt) => (
        <label
          key={opt.value}
          className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-sm transition ${
            value === opt.value
              ? 'border-orange-400 bg-orange-50 dark:border-orange-600 dark:bg-orange-900/20'
              : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600'
          }`}
        >
          <input
            type="radio"
            name={name}
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
            className="accent-orange-500"
          />
          <span className="text-zinc-700 dark:text-zinc-300">{opt.label}</span>
        </label>
      ))}
    </div>
  );
}

function TaskForm({
  task,
  substances,
  onChange,
  onCancel,
  onSave,
}: {
  task: WorkTask;
  substances: Investigation['substances'];
  onChange: (t: WorkTask) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  function f(patch: Partial<WorkTask>) {
    onChange({ ...task, ...patch });
  }

  function toggleSubstance(id: string) {
    const ids = task.substanceIds.includes(id)
      ? task.substanceIds.filter((s) => s !== id)
      : [...task.substanceIds, id];
    f({ substanceIds: ids });
  }

  function togglePpe(val: string) {
    const ppe = task.ppe.includes(val) ? task.ppe.filter((p) => p !== val) : [...task.ppe, val];
    f({ ppe });
  }

  const hasLev = task.lev !== 'none';

  return (
    <div className="rounded-xl border border-orange-200 bg-orange-50/40 p-5 dark:border-orange-800/40 dark:bg-orange-900/10">
      <h4 className="mb-5 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
        {task.description ? `Taak: ${task.description}` : 'Nieuwe taak / werkzaamheid'}
      </h4>

      <div className="space-y-5">
        {/* Basis */}
        <section>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Omschrijving</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Taakomschrijving <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={task.description}
                onChange={(e) => f({ description: e.target.value })}
                placeholder="Bijv. Spuiten primer in cabine, mengen additieven, reinigen met oplosmiddelen"
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-orange-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Afdeling</label>
              <input
                type="text"
                value={task.department ?? ''}
                onChange={(e) => f({ department: e.target.value })}
                placeholder="Bijv. Afdeling Lakkerij"
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-orange-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Functie</label>
              <input
                type="text"
                value={task.jobTitle ?? ''}
                onChange={(e) => f({ jobTitle: e.target.value })}
                placeholder="Bijv. Spuiter, Monteur"
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-orange-400"
              />
            </div>
          </div>
        </section>

        {/* Stoffen */}
        {substances.length > 0 && (
          <section>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Relevante stoffen bij deze taak
            </p>
            <div className="space-y-1.5">
              {substances.map((s) => (
                <label
                  key={s.id}
                  className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-sm transition ${
                    task.substanceIds.includes(s.id)
                      ? 'border-orange-400 bg-orange-50 dark:border-orange-600 dark:bg-orange-900/20'
                      : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={task.substanceIds.includes(s.id)}
                    onChange={() => toggleSubstance(s.id)}
                    className="accent-orange-500"
                  />
                  <span className="text-zinc-700 dark:text-zinc-300">{s.productName}</span>
                  {s.casNr && <span className="text-xs text-zinc-400">CAS {s.casNr}</span>}
                </label>
              ))}
            </div>
          </section>
        )}

        {substances.length === 0 && (
          <p className="rounded-lg bg-amber-50 px-4 py-3 text-xs text-amber-700 dark:bg-amber-900/15 dark:text-amber-400">
            Voeg eerst stoffen toe in stap 2, dan kunt u ze hier koppelen.
          </p>
        )}

        {/* Procesomstandigheden */}
        <section>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Procesomstandigheden</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Procestype</label>
              <RadioGroup
                name={`process-${task.id}`}
                value={task.processType}
                onChange={(v) => f({ processType: v as ProcessType })}
                options={PROCESS_TYPES}
              />
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Hoeveelheid per taak</label>
                <RadioGroup
                  name={`qty-${task.id}`}
                  value={task.quantityPerTask}
                  onChange={(v) => f({ quantityPerTask: v })}
                  options={[
                    { value: '<100g', label: '< 100 g of ml' },
                    { value: '100g-1kg', label: '100 g – 1 kg/L' },
                    { value: '1-10kg', label: '1 – 10 kg/L' },
                    { value: '>10kg', label: '> 10 kg/L' },
                  ]}
                />
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Blootstellingsduur/dag</label>
              <RadioGroup
                name={`dur-${task.id}`}
                value={task.durationPerDay}
                onChange={(v) => f({ durationPerDay: v })}
                options={[
                  { value: '<15min', label: '< 15 minuten' },
                  { value: '15-60min', label: '15 min – 1 uur' },
                  { value: '1-2u', label: '1 – 2 uur' },
                  { value: '2-4u', label: '2 – 4 uur' },
                  { value: '4-8u', label: '4 – 8 uur' },
                  { value: '>8u', label: '> 8 uur' },
                ]}
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Frequentie</label>
              <RadioGroup
                name={`freq-${task.id}`}
                value={task.frequency}
                onChange={(v) => f({ frequency: v })}
                options={[
                  { value: 'dagelijks', label: 'Dagelijks' },
                  { value: '2-4x-week', label: '2 – 4 × per week' },
                  { value: '1x-week', label: '1 × per week' },
                  { value: '1-3x-maand', label: '1 – 3 × per maand' },
                  { value: 'incidenteel', label: 'Incidenteel' },
                ]}
              />
            </div>
          </div>
        </section>

        {/* Beheersmaatregelen */}
        <section>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Aanwezige beheersmaatregelen</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Lokale afzuiging (LEV)</label>
              <RadioGroup
                name={`lev-${task.id}`}
                value={task.lev}
                onChange={(v) => f({ lev: v, levCheck: v === 'none' ? undefined : task.levCheck })}
                options={[
                  { value: 'none', label: 'Geen LEV' },
                  { value: 'point', label: 'Bron-afzuiging (puntafzuiging)' },
                  { value: 'partial', label: 'Gedeeltelijke afzuiging' },
                  { value: 'full', label: 'Volledige inkapseling + afzuiging' },
                ]}
              />
              {hasLev && (
                <div className="mt-2">
                  <label className="mb-2 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    LEV-keuring — jaarlijks vereist (art. 4.5b Arbobesluit)
                  </label>
                  <RadioGroup
                    name={`levcheck-${task.id}`}
                    value={task.levCheck ?? ''}
                    onChange={(v) => f({ levCheck: v })}
                    options={[
                      { value: 'recent', label: 'Gekeurd < 1 jaar geleden' },
                      { value: 'outdated', label: 'Gekeurd ≥ 1 jaar geleden — keuring verlopen' },
                      { value: 'never', label: 'Nooit gekeurd' },
                    ]}
                  />
                </div>
              )}
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Algemene ventilatie</label>
                <RadioGroup
                  name={`vent-${task.id}`}
                  value={task.ventilation}
                  onChange={(v) => f({ ventilation: v })}
                  options={[
                    { value: 'none', label: 'Geen mechanische ventilatie' },
                    { value: '<1ACH', label: '< 1 luchtwissel/uur' },
                    { value: '1-3ACH', label: '1 – 3 ACH' },
                    { value: '3-6ACH', label: '3 – 6 ACH' },
                    { value: '>6ACH', label: '> 6 ACH (intensief)' },
                  ]}
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Ruimtegrootte</label>
                <RadioGroup
                  name={`room-${task.id}`}
                  value={task.roomSize}
                  onChange={(v) => f({ roomSize: v })}
                  options={[
                    { value: '<50m3', label: '< 50 m³ (kleine ruimte)' },
                    { value: '50-500m3', label: '50 – 500 m³' },
                    { value: '>500m3', label: '> 500 m³ (grote hal)' },
                  ]}
                />
              </div>
            </div>
          </div>

          <div className="mt-4">
            <label className="mb-2 block text-xs font-medium text-zinc-600 dark:text-zinc-400">PBM in gebruik</label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'respirator', label: 'Ademhalingsbescherming' },
                { value: 'gloves', label: 'Handschoenen' },
                { value: 'eye-clothing', label: 'Oog/huidbescherming' },
                { value: 'none', label: 'Geen PBM' },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                    task.ppe.includes(opt.value)
                      ? 'border-orange-400 bg-orange-50 dark:border-orange-600 dark:bg-orange-900/20'
                      : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-700'
                  }`}
                >
                  <input type="checkbox" checked={task.ppe.includes(opt.value)} onChange={() => togglePpe(opt.value)} className="accent-orange-500" />
                  <span className="text-zinc-700 dark:text-zinc-300">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
        </section>

        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Opmerkingen</label>
          <textarea
            rows={2}
            value={task.notes ?? ''}
            onChange={(e) => f({ notes: e.target.value })}
            placeholder="Bijzondere procescondities, historische context…"
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-orange-400"
          />
        </div>

        <div className="flex justify-end gap-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
          <button onClick={onCancel} className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800">
            Annuleren
          </button>
          <button
            onClick={onSave}
            disabled={!task.description.trim()}
            className="rounded-lg bg-orange-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-40"
          >
            Taak opslaan
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Step3_Tasks({ investigation, onUpdate }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<WorkTask | null>(null);
  const { substances, tasks } = investigation;

  function startAdd() {
    const t = emptyTask();
    setDraft(t);
    setEditingId('__new__');
  }

  function startEdit(t: WorkTask) {
    setDraft({ ...t });
    setEditingId(t.id);
  }

  function cancel() {
    setEditingId(null);
    setDraft(null);
  }

  function save() {
    if (!draft) return;
    if (editingId === '__new__') {
      onUpdate({ tasks: [...tasks, draft] });
    } else {
      onUpdate({ tasks: tasks.map((t) => (t.id === draft.id ? draft : t)) });
    }
    setEditingId(null);
    setDraft(null);
  }

  function remove(id: string) {
    onUpdate({ tasks: tasks.filter((t) => t.id !== id) });
    if (editingId === id) cancel();
  }

  function substanceName(id: string) {
    return substances.find((s) => s.id === id)?.productName ?? id;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Stap 3 — Werkzaamheden en blootstellingsroutes
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          Breng per afdeling/functie alle werkzaamheden in kaart waarbij blootstelling aan gevaarlijke
          stoffen optreedt, inclusief procescondities en aanwezige beheersmaatregelen.
        </p>
      </div>

      {tasks.length > 0 && (
        <div className="space-y-3">
          {tasks.map((t) => (
            <div key={t.id}>
              {editingId === t.id && draft ? (
                <TaskForm task={draft} substances={substances} onChange={setDraft} onCancel={cancel} onSave={save} />
              ) : (
                <div className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-zinc-50 px-5 py-4 dark:border-zinc-700 dark:bg-zinc-800/50">
                  <div className="min-w-0">
                    <p className="font-semibold text-zinc-900 dark:text-zinc-50">{t.description}</p>
                    <div className="mt-1 flex flex-wrap gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                      {t.department && <span>{t.department}</span>}
                      <span>{t.processType}</span>
                      <span>{t.durationPerDay}/dag</span>
                      <span>{t.frequency}</span>
                    </div>
                    {t.substanceIds.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {t.substanceIds.map((id) => (
                          <span key={id} className="rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                            {substanceName(id)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button onClick={() => startEdit(t)} className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-white dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-700">Bewerken</button>
                    <button onClick={() => remove(t.id)} className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-red-500 transition hover:bg-red-50 dark:border-zinc-600 dark:hover:bg-red-900/20">Verwijderen</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {editingId === '__new__' && draft && (
        <TaskForm task={draft} substances={substances} onChange={setDraft} onCancel={cancel} onSave={save} />
      )}

      {editingId === null && (
        <button
          onClick={startAdd}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 py-4 text-sm font-medium text-zinc-500 transition hover:border-orange-400 hover:bg-orange-50 hover:text-orange-600 dark:border-zinc-700 dark:hover:border-orange-600 dark:hover:bg-orange-900/10 dark:hover:text-orange-400"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Taak / werkzaamheid toevoegen
        </button>
      )}
    </div>
  );
}
