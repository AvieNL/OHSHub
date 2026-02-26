'use client';

import { useState } from 'react';
import type { PhysicalInvestigation, ForceTask } from '@/lib/physical-investigation-types';
import { newPhysicalId } from '@/lib/physical-investigation-storage';
import { computeForceResult } from '@/lib/physical-stats';
import { InfoBox } from '@/components/InfoBox';

interface Props {
  investigation: PhysicalInvestigation;
  onUpdate: (partial: Partial<PhysicalInvestigation>) => void;
}

// EN 1005-3 reference forces F_B (N) for common operations
const REFERENCE_FORCES = [
  { label: 'Druk (push, één hand, staand)',              value: 110 },
  { label: 'Druk (push, twee handen, staand)',           value: 220 },
  { label: 'Trek (pull, één hand, staand)',              value: 110 },
  { label: 'Trek (pull, twee handen, staand)',           value: 220 },
  { label: 'Zijwaartse kracht (één hand)',               value:  80 },
  { label: 'Zijwaartse kracht (twee handen)',            value: 160 },
  { label: 'Draaien (rotational, één hand)',             value:  15 },
  { label: 'Handgreep (grip, één hand)',                 value: 130 },
  { label: 'Handgreep (pinch, vingertop)',               value:  25 },
  { label: 'Beendruk (pedaal, zittend)',                 value: 500 },
];

// Speed multiplier m_v
const SPEED_MULTIPLIERS = [
  { label: 'Langzaam (< 0,2 m/s): m_v = 1,00', value: 1.00 },
  { label: 'Matig (0,2–0,5 m/s): m_v = 0,85',  value: 0.85 },
  { label: 'Snel (> 0,5 m/s): m_v = 0,75',     value: 0.75 },
];

// Frequency multiplier m_f
const FREQ_MULTIPLIERS = [
  { label: 'Eenmalig of zelden: m_f = 1,00',            value: 1.00 },
  { label: '< 1×/dag: m_f = 0,90',                      value: 0.90 },
  { label: '1–10×/dag: m_f = 0,80',                     value: 0.80 },
  { label: '10–100×/dag: m_f = 0,70',                   value: 0.70 },
  { label: '> 100×/dag: m_f = 0,60',                    value: 0.60 },
];

// Duration multiplier m_d
const DUR_MULTIPLIERS = [
  { label: 'Kortstondig (< 1 s): m_d = 1,00',           value: 1.00 },
  { label: 'Matig (1–5 s): m_d = 0,90',                 value: 0.90 },
  { label: 'Lang (5–30 s): m_d = 0,80',                 value: 0.80 },
  { label: 'Zeer lang (> 30 s): m_d = 0,70',            value: 0.70 },
];

function ForceForm({
  task,
  bgName,
  onSave,
  onCancel,
}: {
  task: Partial<ForceTask>;
  bgName: string;
  onSave: (t: ForceTask) => void;
  onCancel: () => void;
}) {
  const [d, setD] = useState<Partial<ForceTask>>(task);
  const INPUT = 'w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-orange-400';

  const preview = d.measuredForce != null && d.referenceForce && d.speedMultiplier && d.freqMultiplier && d.durationMultiplier
    ? computeForceResult(d as ForceTask)
    : null;

  function save() {
    if (!d.taskName?.trim() || !d.bgId) return;
    onSave({
      id: d.id ?? newPhysicalId(),
      bgId: d.bgId,
      taskName: d.taskName.trim(),
      measuredForce: d.measuredForce ?? 0,
      referenceForce: d.referenceForce ?? 110,
      speedMultiplier: d.speedMultiplier ?? 1.00,
      freqMultiplier: d.freqMultiplier ?? 1.00,
      durationMultiplier: d.durationMultiplier ?? 1.00,
      notes: d.notes,
    });
  }

  const fBr = d.referenceForce && d.speedMultiplier && d.freqMultiplier && d.durationMultiplier
    ? Math.round(d.referenceForce * d.speedMultiplier * d.freqMultiplier * d.durationMultiplier * 10) / 10
    : null;

  return (
    <div className="rounded-xl border border-orange-200 bg-orange-50/50 px-5 py-4 dark:border-orange-800/30 dark:bg-orange-900/10">
      <h4 className="mb-4 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
        {d.id ? 'Krachttaak bewerken' : `Nieuwe krachttaak — ${bgName}`}
      </h4>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Naam taak / bediening *</label>
          <input type="text" value={d.taskName ?? ''} onChange={(e) => setD({ ...d, taskName: e.target.value })} placeholder="Bijv. Bedienen startknop persmachine" className={INPUT} />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Type bewerking / referentiekracht F_B (N)</label>
          <select
            value={d.referenceForce ?? ''}
            onChange={(e) => setD({ ...d, referenceForce: parseFloat(e.target.value) })}
            className={INPUT}
          >
            <option value="">— Selecteer type —</option>
            {REFERENCE_FORCES.map((r) => (
              <option key={r.value + r.label} value={r.value}>{r.label} — {r.value} N</option>
            ))}
          </select>
          <p className="mt-1 text-xs text-zinc-400">Of voer een aangepaste F_B in:</p>
          <input type="number" min={1} value={d.referenceForce ?? ''} onChange={(e) => setD({ ...d, referenceForce: parseFloat(e.target.value) || 0 })} placeholder="F_B in Newton" className={`${INPUT} mt-1`} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Snelheidsmultiplier m_v</label>
          <select value={d.speedMultiplier ?? 1.00} onChange={(e) => setD({ ...d, speedMultiplier: parseFloat(e.target.value) })} className={INPUT}>
            {SPEED_MULTIPLIERS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Frequentiemultiplier m_f</label>
          <select value={d.freqMultiplier ?? 1.00} onChange={(e) => setD({ ...d, freqMultiplier: parseFloat(e.target.value) })} className={INPUT}>
            {FREQ_MULTIPLIERS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Duurmultiplier m_d</label>
          <select value={d.durationMultiplier ?? 1.00} onChange={(e) => setD({ ...d, durationMultiplier: parseFloat(e.target.value) })} className={INPUT}>
            {DUR_MULTIPLIERS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        {fBr != null && (
          <div className="flex items-center rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700 dark:bg-blue-900/10 dark:text-blue-400">
            Maximale toelaatbare kracht F_Br = <strong className="ml-1">{fBr} N</strong>
          </div>
        )}
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Gemeten kracht F (N)</label>
          <input type="number" min={0} value={d.measuredForce ?? ''} onChange={(e) => setD({ ...d, measuredForce: parseFloat(e.target.value) || 0 })} placeholder="Gemeten waarde" className={INPUT} />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Opmerkingen</label>
          <input type="text" value={d.notes ?? ''} onChange={(e) => setD({ ...d, notes: e.target.value })} placeholder="Aanvullende informatie" className={INPUT} />
        </div>
      </div>

      {preview && (
        <div className={`mt-4 rounded-lg border px-4 py-3 ${
          preview.verdict === 'high' ? 'bg-red-50 border-red-200 text-red-800' :
          preview.verdict === 'moderate' ? 'bg-amber-50 border-amber-200 text-amber-800' :
          'bg-emerald-50 border-emerald-200 text-emerald-800'
        } dark:bg-transparent`}>
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <span><strong>F_Br:</strong> {preview.fBr} N</span>
            <span><strong>m_r:</strong> {preview.mr}</span>
            <span className="font-semibold">{preview.verdictLabel}</span>
          </div>
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <button type="button" onClick={save} disabled={!d.taskName?.trim()} className="rounded-lg bg-orange-500 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-40">Opslaan</button>
        <button type="button" onClick={onCancel} className="rounded-lg border border-zinc-200 px-4 py-1.5 text-sm text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800">Annuleren</button>
      </div>
    </div>
  );
}

export default function PhysicalStep8_Forces({ investigation, onUpdate }: Props) {
  const { bgs, forceTasks } = investigation;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addingBg, setAddingBg] = useState<string | null>(null);

  function saveTask(task: ForceTask) {
    const exists = forceTasks.find((t) => t.id === task.id);
    onUpdate({
      forceTasks: exists
        ? forceTasks.map((t) => (t.id === task.id ? task : t))
        : [...forceTasks, task],
    });
    setEditingId(null);
    setAddingBg(null);
  }

  if (bgs.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Stap 9 — Krachten (EN 1005-3)</h2>
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
          Stap 9 — Krachten op arbeidsmiddelen (EN 1005-3)
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          Beoordeel krachten uitgeoefend op machines en arbeidsmiddelen.
          F_Br = F_B × m_v × m_f × m_d; risicodimensie m_r = F / F_Br.
          m_r ≤ 0,5 acceptabel; 0,5–0,7 grensgebied; &gt; 0,7 niet acceptabel.
        </p>
      </div>

      <InfoBox title="EN 1005-3:2002 — Aanbevolen krachtgrenzen voor machines">
        De maximale toelaatbare kracht F_Br is gebaseerd op de referentiekracht F_B voor het
        betreffende type bediening, gecorrigeerd voor bewegingssnelheid (m_v), frequentie (m_f)
        en duur (m_d). De risicodimensie{' '}
        <abbr title="Risicodimensie m_r = F / F_Br — verhouding gemeten kracht tot maximale toelaatbare kracht" className="cursor-help underline decoration-dotted decoration-zinc-400 underline-offset-2">m_r</abbr>{' '}
        geeft aan hoe dicht de gemeten kracht bij de grens zit. Bij m_r &gt; 0,7:
        herontwerp van de machine of bediening is noodzakelijk.
      </InfoBox>

      {bgs.map((bg) => {
        const tasks = forceTasks.filter((t) => t.bgId === bg.id);
        return (
          <div key={bg.id} className="rounded-xl border border-zinc-200 dark:border-zinc-700">
            <div className="rounded-t-xl bg-zinc-50 px-4 py-3 dark:bg-zinc-800/50">
              <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{bg.name}</h3>
            </div>
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {tasks.map((task) => {
                const result = computeForceResult(task);
                return (
                  <div key={task.id}>
                    {editingId === task.id ? (
                      <div className="px-4 py-4">
                        <ForceForm task={task} bgName={bg.name} onSave={saveTask} onCancel={() => setEditingId(null)} />
                      </div>
                    ) : (
                      <div className="flex items-center gap-4 px-4 py-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{task.taskName}</p>
                          <div className="mt-1 flex flex-wrap gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                            <span>F = {task.measuredForce} N</span>
                            <span>F_Br = {result.fBr} N</span>
                            <span className={`font-semibold ${
                              result.verdict === 'high' ? 'text-red-600' :
                              result.verdict === 'moderate' ? 'text-amber-600' : 'text-emerald-600'
                            }`}>m_r = {result.mr}</span>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            result.verdict === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                            result.verdict === 'moderate' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                            'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          }`}>
                            {result.verdict === 'high' ? 'Niet acceptabel' : result.verdict === 'moderate' ? 'Grensgebied' : 'Acceptabel'}
                          </span>
                          <button onClick={() => setEditingId(task.id)} className="text-xs text-zinc-400 hover:text-orange-600">Bewerken</button>
                          <button onClick={() => onUpdate({ forceTasks: forceTasks.filter((t) => t.id !== task.id) })} className="text-xs text-zinc-400 hover:text-red-500">Verwijderen</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {addingBg === bg.id ? (
                <div className="px-4 py-4">
                  <ForceForm task={{ bgId: bg.id }} bgName={bg.name} onSave={saveTask} onCancel={() => setAddingBg(null)} />
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
                    Krachttaak toevoegen
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {forceTasks.length === 0 && (
        <p className="text-center text-sm text-zinc-400 dark:text-zinc-500">
          Nog geen krachtmetingen ingevoerd.
        </p>
      )}
    </div>
  );
}
