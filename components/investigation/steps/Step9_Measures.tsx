'use client';

import { useState } from 'react';
import type { Investigation, ControlMeasure, ControlType } from '@/lib/investigation-types';
import { newId } from '@/lib/investigation-storage';

interface Props {
  investigation: Investigation;
  onUpdate: (partial: Partial<Investigation>) => void;
}

// ─── AHS hierarchy config ──────────────────────────────────────────────────────

const AHS_LEVELS: {
  type: ControlType;
  rank: number;
  label: string;
  description: string;
  color: string;
  badge: string;
}[] = [
  {
    type: 'substitution',
    rank: 1,
    label: 'Substitutie',
    description: 'Vervang de gevaarlijke stof door een minder gevaarlijk alternatief.',
    color: 'bg-emerald-500',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  {
    type: 'process-change',
    rank: 2,
    label: 'Proceswijziging',
    description: 'Sluit het proces af of pas het aan om emissie te beperken (bronisolatie).',
    color: 'bg-teal-500',
    badge: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  },
  {
    type: 'lev',
    rank: 3,
    label: 'LEV (bronafzuiging)',
    description: 'Lokale Exhaust Ventilatie: afzuiging zo dicht mogelijk bij de bron.',
    color: 'bg-blue-500',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
  {
    type: 'ventilation',
    rank: 4,
    label: 'Collectieve ventilatie',
    description: 'Algemene ventilatie van de werkruimte om concentraties te verdunnen.',
    color: 'bg-amber-500',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
  {
    type: 'organisational',
    rank: 5,
    label: 'Organisatorische maatregelen',
    description: 'Beperk blootstelling via taakverdeling, werktijden of afscherming.',
    color: 'bg-orange-500',
    badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  },
  {
    type: 'ppe',
    rank: 6,
    label: 'PBM (persoonlijke bescherming)',
    description: 'Ademhalingsbescherming, handschoenen, kleding — laatste redmiddel.',
    color: 'bg-red-500',
    badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  },
];

function ahsFor(type: ControlType) {
  return AHS_LEVELS.find((l) => l.type === type)!;
}

function emptyMeasure(): ControlMeasure {
  return {
    id: newId(),
    type: 'substitution',
    description: '',
    priority: 3,
    status: 'planned',
  };
}

// ─── ControlMeasureForm ────────────────────────────────────────────────────────

function ControlMeasureForm({
  measure,
  onChange,
  onCancel,
  onSave,
}: {
  measure: ControlMeasure;
  onChange: (m: ControlMeasure) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  function f(patch: Partial<ControlMeasure>) {
    onChange({ ...measure, ...patch });
  }

  const isValid = measure.description.trim().length > 0;

  return (
    <div className="rounded-xl border border-orange-200 bg-orange-50/40 p-5 dark:border-orange-800/40 dark:bg-orange-900/10">
      <h4 className="mb-4 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
        Maatregel invoeren
      </h4>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Type maatregel (AHS-hiërarchie) <span className="text-red-500">*</span>
          </label>
          <select
            value={measure.type}
            onChange={(e) => f({ type: e.target.value as ControlType })}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-orange-400"
          >
            {AHS_LEVELS.map((l) => (
              <option key={l.type} value={l.type}>
                {l.rank}. {l.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-zinc-400">{ahsFor(measure.type).description}</p>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Prioriteit (1 = hoogst)
          </label>
          <select
            value={measure.priority}
            onChange={(e) => f({ priority: parseInt(e.target.value) as ControlMeasure['priority'] })}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-orange-400"
          >
            {[1, 2, 3, 4, 5].map((p) => (
              <option key={p} value={p}>
                {p} — {p === 1 ? 'Urgent' : p === 2 ? 'Hoog' : p === 3 ? 'Normaal' : p === 4 ? 'Laag' : 'Later'}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Beschrijving van de maatregel <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={2}
            value={measure.description}
            onChange={(e) => f({ description: e.target.value })}
            placeholder="Wat gaat u concreet doen?"
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-orange-400"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Doelstelling / norm
          </label>
          <input
            type="text"
            value={measure.targetDescription ?? ''}
            onChange={(e) => f({ targetDescription: e.target.value })}
            placeholder="Bijv. concentratie reduceren tot < 50% OELV"
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-orange-400"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Verantwoordelijke
          </label>
          <input
            type="text"
            value={measure.responsible ?? ''}
            onChange={(e) => f({ responsible: e.target.value })}
            placeholder="Naam of functie"
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-orange-400"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Deadline
          </label>
          <input
            type="date"
            value={measure.deadline ?? ''}
            onChange={(e) => f({ deadline: e.target.value })}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-orange-400"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Status
          </label>
          <select
            value={measure.status}
            onChange={(e) => f({ status: e.target.value as ControlMeasure['status'] })}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-orange-400"
          >
            <option value="planned">Gepland</option>
            <option value="in-progress">In uitvoering</option>
            <option value="completed">Afgerond</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Opmerkingen
          </label>
          <input
            type="text"
            value={measure.notes ?? ''}
            onChange={(e) => f({ notes: e.target.value })}
            placeholder="Bijzonderheden, randvoorwaarden…"
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-orange-400"
          />
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
        <button
          onClick={onCancel}
          className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          Annuleren
        </button>
        <button
          onClick={onSave}
          disabled={!isValid}
          className="rounded-lg bg-orange-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-40"
        >
          Maatregel opslaan
        </button>
      </div>
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ControlMeasure['status'] }) {
  const map = {
    planned: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
    'in-progress': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  };
  const label = { planned: 'Gepland', 'in-progress': 'In uitvoering', completed: 'Afgerond' };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${map[status]}`}>
      {label[status]}
    </span>
  );
}

// ─── Step9_Measures ───────────────────────────────────────────────────────────

export default function Step9_Measures({ investigation, onUpdate }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ControlMeasure | null>(null);
  const { controlMeasures } = investigation;

  function startAdd() {
    setDraft(emptyMeasure());
    setEditingId('__new__');
  }

  function cancel() {
    setEditingId(null);
    setDraft(null);
  }

  function save() {
    if (!draft) return;
    if (editingId === '__new__') {
      onUpdate({ controlMeasures: [...controlMeasures, draft] });
    } else {
      onUpdate({ controlMeasures: controlMeasures.map((m) => (m.id === draft.id ? draft : m)) });
    }
    cancel();
  }

  function remove(id: string) {
    onUpdate({ controlMeasures: controlMeasures.filter((m) => m.id !== id) });
    if (editingId === id) cancel();
  }

  const byStatus = {
    planned: controlMeasures.filter((m) => m.status === 'planned').length,
    'in-progress': controlMeasures.filter((m) => m.status === 'in-progress').length,
    completed: controlMeasures.filter((m) => m.status === 'completed').length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Stap 9 — Maatregelen (Arbeidshygiënische Strategie)
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          Leg maatregelen vast conform de AHS-hiërarchie: begin altijd bij de bron.
          Persoonlijke bescherming is het laatste redmiddel, niet de eerste keuze.
        </p>
      </div>

      {/* AHS pyramid */}
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          AHS-hiërarchie (Arbobesluit art. 4.1)
        </p>
        <div className="space-y-1.5">
          {AHS_LEVELS.map((l) => (
            <div key={l.type} className="flex items-start gap-2.5">
              <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${l.color}`}
              >
                {l.rank}
              </span>
              <div>
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  {l.label}
                </span>
                <span className="ml-2 text-xs text-zinc-500 dark:text-zinc-400">
                  — {l.description}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Status summary */}
      {controlMeasures.length > 0 && (
        <div className="flex flex-wrap gap-4">
          {(
            [
              { key: 'planned', label: 'Gepland', cls: 'text-zinc-600 dark:text-zinc-400' },
              { key: 'in-progress', label: 'In uitvoering', cls: 'text-blue-600 dark:text-blue-400' },
              { key: 'completed', label: 'Afgerond', cls: 'text-emerald-600 dark:text-emerald-400' },
            ] as const
          ).map(({ key, label, cls }) => (
            <div key={key} className="text-sm">
              <span className={`font-semibold ${cls}`}>{byStatus[key]}</span>{' '}
              <span className="text-zinc-500 dark:text-zinc-400">{label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Measures list */}
      {controlMeasures.length > 0 && (
        <div className="space-y-3">
          {controlMeasures
            .slice()
            .sort((a, b) => a.priority - b.priority || AHS_LEVELS.findIndex((l) => l.type === a.type) - AHS_LEVELS.findIndex((l) => l.type === b.type))
            .map((m) => {
              const ahs = ahsFor(m.type);
              return (
                <div key={m.id}>
                  {editingId === m.id && draft ? (
                    <ControlMeasureForm
                      measure={draft}
                      onChange={setDraft}
                      onCancel={cancel}
                      onSave={save}
                    />
                  ) : (
                    <div className="flex items-start justify-between gap-4 rounded-xl border border-zinc-200 bg-zinc-50 px-5 py-4 dark:border-zinc-700 dark:bg-zinc-800/50">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${ahs.badge}`}
                          >
                            {ahs.rank}. {ahs.label}
                          </span>
                          <span className="text-xs text-zinc-400">Prioriteit {m.priority}</span>
                          <StatusBadge status={m.status} />
                        </div>
                        <p className="mt-1.5 text-sm text-zinc-800 dark:text-zinc-200">
                          {m.description}
                        </p>
                        {m.targetDescription && (
                          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                            Doel: {m.targetDescription}
                          </p>
                        )}
                        <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-zinc-400 dark:text-zinc-500">
                          {m.responsible && <span>Verantw.: {m.responsible}</span>}
                          {m.deadline && <span>Deadline: {m.deadline}</span>}
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button
                          onClick={() => {
                            setDraft({ ...m });
                            setEditingId(m.id);
                          }}
                          className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-white dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-700"
                        >
                          Bewerken
                        </button>
                        <button
                          onClick={() => remove(m.id)}
                          className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-red-500 transition hover:bg-red-50 dark:border-zinc-600 dark:hover:bg-red-900/20"
                        >
                          Verwijderen
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}

      {editingId === '__new__' && draft && (
        <ControlMeasureForm measure={draft} onChange={setDraft} onCancel={cancel} onSave={save} />
      )}

      {editingId === null && (
        <button
          onClick={startAdd}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 py-4 text-sm font-medium text-zinc-500 transition hover:border-orange-400 hover:bg-orange-50 hover:text-orange-600 dark:border-zinc-700 dark:hover:border-orange-600 dark:hover:bg-orange-900/10 dark:hover:text-orange-400"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Maatregel toevoegen
        </button>
      )}

      {controlMeasures.length === 0 && editingId === null && (
        <p className="text-center text-sm text-zinc-400 dark:text-zinc-500">
          Voeg hier de te nemen maatregelen toe, gesorteerd op AHS-prioriteit.
        </p>
      )}
    </div>
  );
}
