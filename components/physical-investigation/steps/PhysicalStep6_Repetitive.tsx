'use client';

import { useState } from 'react';
import type { PhysicalInvestigation, RepetitiveTask, LimbSide } from '@/lib/physical-investigation-types';
import { newPhysicalId } from '@/lib/physical-investigation-storage';
import { computeRepetitiveResult } from '@/lib/physical-stats';
import { InfoBox } from '@/components/InfoBox';
import { Abbr } from '@/components/Abbr';

interface Props {
  investigation: PhysicalInvestigation;
  onUpdate: (partial: Partial<PhysicalInvestigation>) => void;
}

// OCRA CF scores (Herstelfactor): hoe meer hersteltijd, hoe lager de score
const CF_OPTIONS = [
  { value: 0, label: '0 — Voldoende hersteltijd (≥ 1 min per uur)' },
  { value: 2, label: '2 — Beperkte hersteltijd' },
  { value: 3, label: '3 — 2 van 8 uur geen hersteltijd' },
  { value: 4, label: '4 — 3 van 8 uur geen hersteltijd' },
  { value: 6, label: '6 — 4 van 8 uur geen hersteltijd' },
  { value: 8, label: '8 — Vrijwel geen hersteltijd' },
  { value: 10, label: '10 — Geen enkele hersteltijd' },
];

const FAF_OPTIONS = [
  { value: 0,  label: '0 — Geen noemenswaardige kracht' },
  { value: 2,  label: '2 — Lichte kracht (< 10% MVC), soms' },
  { value: 4,  label: '4 — Lichte kracht, frequent' },
  { value: 6,  label: '6 — Matige kracht (10–50% MVC), soms' },
  { value: 8,  label: '8 — Matige kracht, frequent' },
  { value: 12, label: '12 — Hoge kracht (> 50% MVC), soms' },
  { value: 16, label: '16 — Hoge kracht, frequent' },
  { value: 24, label: '24 — Schok/piekbelasting' },
];

const PF_OPTIONS = [
  { value: 0,  label: '0 — Neutrale houding, vrijwel geen belasting' },
  { value: 2,  label: '2 — Lichte houdingsafwijking, soms' },
  { value: 4,  label: '4 — Lichte houdingsafwijking, frequent' },
  { value: 8,  label: '8 — Matige houdingsafwijking (bijv. pols gebogen)' },
  { value: 12, label: '12 — Hoge houdingsbelasting (bijv. schouder > 90°)' },
  { value: 16, label: '16 — Extreme houding, frequent' },
  { value: 24, label: '24 — Extreme houding + beweging, continu' },
];

const RF_OPTIONS = [
  { value: 0,  label: '0 — Variabele bewegingen, cyclustijd > 15 s' },
  { value: 1,  label: '1 — Matig variabel, cyclustijd 10–15 s' },
  { value: 3,  label: '3 — Weinig variabel, cyclustijd 5–10 s' },
  { value: 6,  label: '6 — Vrijwel identieke cycli, cyclustijd 3–5 s' },
  { value: 10, label: '10 — Herhaling vrijwel continu, cyclustijd < 3 s' },
];

const ADDF_OPTIONS = [
  { value: 0,  label: '0 — Geen aanvullende factoren' },
  { value: 2,  label: '2 — 1 aanvullende factor (bijv. trilling, handschoenen, nauwkeurig werk)' },
  { value: 4,  label: '4 — 2–3 aanvullende factoren' },
  { value: 8,  label: '8 — 4–5 aanvullende factoren' },
  { value: 12, label: '12 — ≥ 6 aanvullende factoren of extreme omstandigheid' },
];

const LIMB_LABELS: Record<LimbSide, string> = {
  left:  'Links',
  right: 'Rechts',
  both:  'Beide armen',
};

const OCRA_CATEGORY_STYLES = {
  'green':        'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/15 dark:border-emerald-800/40 dark:text-emerald-300',
  'yellow':       'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/15 dark:border-amber-800/40 dark:text-amber-300',
  'light-orange': 'bg-orange-50 border-orange-200 text-orange-800 dark:bg-orange-900/15 dark:border-orange-800/40 dark:text-orange-300',
  'orange':       'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/15 dark:border-red-800/40 dark:text-red-300',
  'red':          'bg-red-100 border-red-300 text-red-900 dark:bg-red-900/20 dark:border-red-700/50 dark:text-red-200',
};

function RepetitiveForm({
  task,
  bgName,
  onSave,
  onCancel,
}: {
  task: Partial<RepetitiveTask>;
  bgName: string;
  onSave: (t: RepetitiveTask) => void;
  onCancel: () => void;
}) {
  const [d, setD] = useState<Partial<RepetitiveTask>>(task);
  const INPUT = 'w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-orange-400';

  const preview = d.recoveryFactor != null && d.forceFactor != null && d.postureFactor != null && d.repetitivenessFactor != null && d.additionalFactor != null
    ? computeRepetitiveResult(d as RepetitiveTask)
    : null;

  function save() {
    if (!d.taskName?.trim() || !d.bgId) return;
    onSave({
      id: d.id ?? newPhysicalId(),
      bgId: d.bgId,
      taskName: d.taskName.trim(),
      limb: d.limb ?? 'both',
      taskDurationMin: d.taskDurationMin ?? 480,
      cycleDuration: d.cycleDuration ?? 30,
      recoveryFactor: d.recoveryFactor ?? 0,
      forceFactor: d.forceFactor ?? 0,
      postureFactor: d.postureFactor ?? 0,
      repetitivenessFactor: d.repetitivenessFactor ?? 0,
      additionalFactor: d.additionalFactor ?? 0,
      notes: d.notes,
    });
  }

  return (
    <div className="rounded-xl border border-orange-200 bg-orange-50/50 px-5 py-4 dark:border-orange-800/30 dark:bg-orange-900/10">
      <h4 className="mb-4 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
        {d.id ? 'Taak bewerken' : `Nieuwe repetitieve taak — ${bgName}`}
      </h4>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Naam taak *</label>
          <input type="text" value={d.taskName ?? ''} onChange={(e) => setD({ ...d, taskName: e.target.value })} placeholder="Bijv. Inpakken producten transportband" className={INPUT} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Ledemaat</label>
          <select value={d.limb ?? 'both'} onChange={(e) => setD({ ...d, limb: e.target.value as LimbSide })} className={INPUT}>
            {(Object.entries(LIMB_LABELS) as [LimbSide, string][]).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Netto taaktijd (min/dag)</label>
          <input type="number" min={0} max={480} value={d.taskDurationMin ?? ''} onChange={(e) => setD({ ...d, taskDurationMin: parseInt(e.target.value) || 0 })} className={INPUT} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Cyclustijd (seconden)</label>
          <input type="number" min={1} value={d.cycleDuration ?? ''} onChange={(e) => setD({ ...d, cycleDuration: parseFloat(e.target.value) || 0 })} className={INPUT} />
        </div>

        <div className="sm:col-span-2">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            OCRA Checklist scores
          </p>
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Herstelfactor <abbr title="Recovery Factor CF — hogere score = minder hersteltijd = meer belasting" className="cursor-help underline decoration-dotted decoration-zinc-400 underline-offset-2">CF</abbr>
          </label>
          <select value={d.recoveryFactor ?? 0} onChange={(e) => setD({ ...d, recoveryFactor: parseInt(e.target.value) })} className={INPUT}>
            {CF_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Krachtfactor <abbr title="Force Factor FaF — gebaseerd op kracht als % van maximale vrijwillige contractie (MVC)" className="cursor-help underline decoration-dotted decoration-zinc-400 underline-offset-2">FaF</abbr>
            {' '}(multiplier voor overige factoren)
          </label>
          <select value={d.forceFactor ?? 0} onChange={(e) => setD({ ...d, forceFactor: parseInt(e.target.value) })} className={INPUT}>
            {FAF_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Houdingsfactor <abbr title="Posture Factor PF — schouder, elleboog, pols en hand" className="cursor-help underline decoration-dotted decoration-zinc-400 underline-offset-2">PF</abbr>
          </label>
          <select value={d.postureFactor ?? 0} onChange={(e) => setD({ ...d, postureFactor: parseInt(e.target.value) })} className={INPUT}>
            {PF_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Herhalingsfactor <abbr title="Repetitiveness Factor RF — gebaseerd op cyclustijd en variatie" className="cursor-help underline decoration-dotted decoration-zinc-400 underline-offset-2">RF</abbr>
          </label>
          <select value={d.repetitivenessFactor ?? 0} onChange={(e) => setD({ ...d, repetitivenessFactor: parseInt(e.target.value) })} className={INPUT}>
            {RF_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Aanvullende factoren <abbr title="Additional Factors AddF — trilling, nauwkeurig werk, handschoenen, koud, etc." className="cursor-help underline decoration-dotted decoration-zinc-400 underline-offset-2">AddF</abbr>
          </label>
          <select value={d.additionalFactor ?? 0} onChange={(e) => setD({ ...d, additionalFactor: parseInt(e.target.value) })} className={INPUT}>
            {ADDF_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Opmerkingen</label>
          <input type="text" value={d.notes ?? ''} onChange={(e) => setD({ ...d, notes: e.target.value })} placeholder="Aanvullende informatie" className={INPUT} />
        </div>
      </div>

      {preview && (
        <div className={`mt-4 rounded-lg border px-4 py-3 ${OCRA_CATEGORY_STYLES[preview.ocraCategory]}`}>
          <div className="flex items-center gap-4 text-xs">
            <span><strong>OCRA score:</strong> {preview.ocraScore}</span>
            <span className="font-semibold">{preview.verdictLabel}</span>
          </div>
          <p className="mt-1 text-xs opacity-75">
            Score = CF ({d.recoveryFactor}) + FaF ({d.forceFactor}) × (PF ({d.postureFactor}) + RF ({d.repetitivenessFactor}) + AddF ({d.additionalFactor}))
          </p>
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <button type="button" onClick={save} disabled={!d.taskName?.trim()} className="rounded-lg bg-orange-500 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-40">Opslaan</button>
        <button type="button" onClick={onCancel} className="rounded-lg border border-zinc-200 px-4 py-1.5 text-sm text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800">Annuleren</button>
      </div>
    </div>
  );
}

export default function PhysicalStep6_Repetitive({ investigation, onUpdate }: Props) {
  const { bgs, repetitiveTasks } = investigation;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addingBg, setAddingBg] = useState<string | null>(null);

  function saveTask(task: RepetitiveTask) {
    const exists = repetitiveTasks.find((t) => t.id === task.id);
    onUpdate({
      repetitiveTasks: exists
        ? repetitiveTasks.map((t) => (t.id === task.id ? task : t))
        : [...repetitiveTasks, task],
    });
    setEditingId(null);
    setAddingBg(null);
  }

  if (bgs.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Stap 7 — Repeterende handelingen (OCRA)</h2>
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-800/30 dark:bg-amber-900/10 dark:text-amber-400">
          ⚠ Definieer eerst belastingsgroepen in stap 3.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Stap 7 — Repeterende handelingen (<Abbr id="OCRA">OCRA</Abbr> Checklist)
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          Beoordeel repeterende arm- en handbewegingen met de{' '}
          <abbr title="Occupational Repetitive Actions checklist — screeningsinstrument voor repetitieve belasting van de bovenste extremiteiten" className="cursor-help underline decoration-dotted decoration-zinc-400 underline-offset-2">OCRA</abbr>{' '}
          Checklist (NEN-ISO 11228-3 / EN 1005-5).
          Score = CF + FaF × (PF + RF + AddF).
        </p>
      </div>

      <InfoBox title="NEN-ISO 11228-3:2007 — OCRA Checklist risicocategorieën">
        <span className="inline-block mr-3">{'< 7,5'} <strong>GROEN</strong> — Acceptabel</span>
        <span className="inline-block mr-3">7,5–11 <strong>GEEL</strong> — Licht risicovol</span>
        <span className="inline-block mr-3">11–14 <strong>LICHTORANJE</strong> — Matig risicovol</span>
        <span className="inline-block mr-3">14–22,5 <strong>ORANJE</strong> — Risicovol</span>
        <span className="inline-block">&gt; 22,5 <strong>ROOD</strong> — Zeer risicovol</span>
        <br />
        <span className="mt-1 block text-xs opacity-75">
          Bij score ≥ 11: biomechanisch onderzoek en maatregelen vereist.
          <abbr title="Occupational Repetitive Actions Index — uitgebreidere analyse naast de checklist" className="cursor-help underline decoration-dotted decoration-zinc-400 underline-offset-2 ml-1">OCRA Index</abbr>{' '}
          biedt verdere precisering.
        </span>
      </InfoBox>

      {bgs.map((bg) => {
        const tasks = repetitiveTasks.filter((t) => t.bgId === bg.id);
        return (
          <div key={bg.id} className="rounded-xl border border-zinc-200 dark:border-zinc-700">
            <div className="rounded-t-xl bg-zinc-50 px-4 py-3 dark:bg-zinc-800/50">
              <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{bg.name}</h3>
            </div>
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {tasks.map((task) => {
                const result = computeRepetitiveResult(task);
                return (
                  <div key={task.id}>
                    {editingId === task.id ? (
                      <div className="px-4 py-4">
                        <RepetitiveForm task={task} bgName={bg.name} onSave={saveTask} onCancel={() => setEditingId(null)} />
                      </div>
                    ) : (
                      <div className="flex items-center gap-4 px-4 py-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{task.taskName}</p>
                          <div className="mt-1 flex flex-wrap gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                            <span>{LIMB_LABELS[task.limb]}</span>
                            <span>Cyclus: {task.cycleDuration} s</span>
                            <span className={`font-semibold ${
                              result.verdict === 'high' ? 'text-red-600' :
                              result.verdict === 'moderate' ? 'text-amber-600' : 'text-emerald-600'
                            }`}>
                              OCRA: {result.ocraScore}
                            </span>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            result.verdict === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                            result.verdict === 'moderate' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                            'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          }`}>
                            {result.ocraCategory.toUpperCase()}
                          </span>
                          <button onClick={() => setEditingId(task.id)} className="text-xs text-zinc-400 hover:text-orange-600">Bewerken</button>
                          <button onClick={() => onUpdate({ repetitiveTasks: repetitiveTasks.filter((t) => t.id !== task.id) })} className="text-xs text-zinc-400 hover:text-red-500">Verwijderen</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {addingBg === bg.id ? (
                <div className="px-4 py-4">
                  <RepetitiveForm task={{ bgId: bg.id }} bgName={bg.name} onSave={saveTask} onCancel={() => setAddingBg(null)} />
                </div>
              ) : (
                <div className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => setAddingBg(bg.id)}
                    className="flex items-center gap-1.5 text-xs text-orange-600 hover:text-orange-700 dark:text-orange-400"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Repetitieve taak toevoegen
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {repetitiveTasks.length === 0 && (
        <p className="text-center text-sm text-zinc-400 dark:text-zinc-500">
          Nog geen repetitieve taken ingevoerd.
        </p>
      )}
    </div>
  );
}
