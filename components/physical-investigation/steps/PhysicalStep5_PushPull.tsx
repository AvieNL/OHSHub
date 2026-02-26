'use client';

import { useState } from 'react';
import type { PhysicalInvestigation, PushPullTask, PushPullType, HandleHeight } from '@/lib/physical-investigation-types';
import { newPhysicalId } from '@/lib/physical-investigation-storage';
import { computePushPullResult } from '@/lib/physical-stats';
import { InfoBox } from '@/components/InfoBox';
import { Abbr } from '@/components/Abbr';

interface Props {
  investigation: PhysicalInvestigation;
  onUpdate: (partial: Partial<PhysicalInvestigation>) => void;
}

const TYPE_LABELS: Record<PushPullType, string> = {
  push: 'Duwen',
  pull: 'Trekken',
  both: 'Duwen & trekken',
};

const HANDLE_LABELS: Record<HandleHeight, string> = {
  low:  'Laag (< 100 cm)',
  mid:  'Midden (100–150 cm)',
  high: 'Hoog (> 150 cm)',
};

const WHEEL_LABELS = {
  good:    'Goed — harde, vlakke vloer; goede wieltjes',
  average: 'Matig — lichte oneffenheden of matig wieltjes',
  poor:    'Slecht — drempels, zachte vloer of slechte wieltjes',
};

// Reference limits (N) per handle height for initial and sustained force
// Based on ISO 11228-2 / DUTCH guidelines (mixed population)
const FORCE_LIMITS: Record<HandleHeight, { init: number; sust: number }> = {
  low:  { init: 200, sust: 100 },
  mid:  { init: 220, sust: 110 },
  high: { init: 190, sust:  95 },
};

function PushPullForm({
  task,
  bgName,
  onSave,
  onCancel,
}: {
  task: Partial<PushPullTask>;
  bgName: string;
  onSave: (t: PushPullTask) => void;
  onCancel: () => void;
}) {
  const [d, setD] = useState<Partial<PushPullTask>>(task);
  const INPUT = 'w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-orange-400';

  const handleHeight = d.handleHeight ?? 'mid';
  const wheelFactor = d.wheelCondition === 'poor' ? 0.6 : d.wheelCondition === 'average' ? 0.8 : 1.0;
  const adjLimits = {
    init: Math.round(FORCE_LIMITS[handleHeight].init * wheelFactor),
    sust: Math.round(FORCE_LIMITS[handleHeight].sust * wheelFactor),
  };

  function save() {
    if (!d.taskName?.trim() || !d.bgId) return;
    onSave({
      id: d.id ?? newPhysicalId(),
      bgId: d.bgId,
      taskName: d.taskName.trim(),
      type: d.type ?? 'push',
      totalMass: d.totalMass ?? 100,
      initialForce: d.initialForce,
      sustainedForce: d.sustainedForce,
      handleHeight: d.handleHeight ?? 'mid',
      distancePerCycle: d.distancePerCycle ?? 5,
      frequency: d.frequency ?? 10,
      wheelCondition: d.wheelCondition ?? 'good',
      gradient: d.gradient,
      restrictedSpace: d.restrictedSpace,
      notes: d.notes,
    });
  }

  return (
    <div className="rounded-xl border border-orange-200 bg-orange-50/50 px-5 py-4 dark:border-orange-800/30 dark:bg-orange-900/10">
      <h4 className="mb-4 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
        {d.id ? 'Taak bewerken' : `Nieuwe duwen/trekken taak — ${bgName}`}
      </h4>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Naam taak *</label>
          <input type="text" value={d.taskName ?? ''} onChange={(e) => setD({ ...d, taskName: e.target.value })} placeholder="Bijv. Palletwagen beladen verplaatsen magazijn" className={INPUT} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Type</label>
          <select value={d.type ?? 'push'} onChange={(e) => setD({ ...d, type: e.target.value as PushPullType })} className={INPUT}>
            {(Object.entries(TYPE_LABELS) as [PushPullType, string][]).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Totaal gewicht (last + middel, kg)</label>
          <input type="number" min={0} value={d.totalMass ?? ''} onChange={(e) => setD({ ...d, totalMass: parseFloat(e.target.value) || 0 })} className={INPUT} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Handgreephoogte</label>
          <select value={d.handleHeight ?? 'mid'} onChange={(e) => setD({ ...d, handleHeight: e.target.value as HandleHeight })} className={INPUT}>
            {(Object.entries(HANDLE_LABELS) as [HandleHeight, string][]).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Conditie vloer / wieltjes</label>
          <select value={d.wheelCondition ?? 'good'} onChange={(e) => setD({ ...d, wheelCondition: e.target.value as PushPullTask['wheelCondition'] })} className={INPUT}>
            {(Object.entries(WHEEL_LABELS)).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        {/* Reference values info */}
        <div className="sm:col-span-2 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700 dark:bg-blue-900/10 dark:text-blue-400">
          Grenswaarden voor geselecteerde configuratie: aanzetter ≤ <strong>{adjLimits.init} N</strong>, voortbeweging ≤ <strong>{adjLimits.sust} N</strong>
          {' '}(ISO 11228-2 / DUTCH, gemengde populatie)
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Aanzetkracht F_init (N) — gemeten</label>
          <input type="number" min={0} value={d.initialForce ?? ''} onChange={(e) => setD({ ...d, initialForce: e.target.value ? parseFloat(e.target.value) : undefined })} placeholder={`Grenswaarde: ${adjLimits.init} N`} className={INPUT} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Voortbewegingskracht F_sust (N) — gemeten</label>
          <input type="number" min={0} value={d.sustainedForce ?? ''} onChange={(e) => setD({ ...d, sustainedForce: e.target.value ? parseFloat(e.target.value) : undefined })} placeholder={`Grenswaarde: ${adjLimits.sust} N`} className={INPUT} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Afstand per cyclus (m)</label>
          <input type="number" min={0} step={0.5} value={d.distancePerCycle ?? ''} onChange={(e) => setD({ ...d, distancePerCycle: parseFloat(e.target.value) || 0 })} className={INPUT} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Frequentie (cycli/uur)</label>
          <input type="number" min={0} value={d.frequency ?? ''} onChange={(e) => setD({ ...d, frequency: parseFloat(e.target.value) || 0 })} className={INPUT} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Helling (%)</label>
          <input type="number" min={0} max={20} step={0.5} value={d.gradient ?? ''} onChange={(e) => setD({ ...d, gradient: e.target.value ? parseFloat(e.target.value) : undefined })} placeholder="0 = vlakke vloer" className={INPUT} />
        </div>
        <div className="flex items-center gap-2">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <input type="checkbox" checked={d.restrictedSpace ?? false} onChange={(e) => setD({ ...d, restrictedSpace: e.target.checked })} className="h-4 w-4 rounded border-zinc-300 text-orange-500" />
            Beperkte bewegingsvrijheid
          </label>
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Opmerkingen</label>
          <input type="text" value={d.notes ?? ''} onChange={(e) => setD({ ...d, notes: e.target.value })} placeholder="Aanvullende informatie" className={INPUT} />
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <button type="button" onClick={save} disabled={!d.taskName?.trim()} className="rounded-lg bg-orange-500 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-40">Opslaan</button>
        <button type="button" onClick={onCancel} className="rounded-lg border border-zinc-200 px-4 py-1.5 text-sm text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800">Annuleren</button>
      </div>
    </div>
  );
}

export default function PhysicalStep5_PushPull({ investigation, onUpdate }: Props) {
  const { bgs, pushPullTasks } = investigation;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addingBg, setAddingBg] = useState<string | null>(null);

  function saveTask(task: PushPullTask) {
    const exists = pushPullTasks.find((t) => t.id === task.id);
    onUpdate({
      pushPullTasks: exists
        ? pushPullTasks.map((t) => (t.id === task.id ? task : t))
        : [...pushPullTasks, task],
    });
    setEditingId(null);
    setAddingBg(null);
  }

  if (bgs.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Stap 6 — Duwen &amp; trekken</h2>
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
          Stap 6 — Duwen &amp; trekken
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          Voer per belastingsgroep de duw- en trekkrachten in. Vergelijk gemeten krachten
          met de grenswaarden uit{' '}
          <Abbr id="NEN-ISO 11228-2">NEN-ISO 11228-2</Abbr> /{' '}
          <abbr title="Duw en Trek CHeck — TNO hulpmiddel voor beoordeling duw/trekkrachten" className="cursor-help underline decoration-dotted decoration-zinc-400 underline-offset-2">DUTCH</abbr>.
        </p>
      </div>

      <InfoBox title="NEN-ISO 11228-2:2007 — Duwen & trekken">
        Grenswaarden voor duwen en trekken zijn afhankelijk van handgreephoogte, afstand en
        frequentie. Meet de aanzettkracht (aanzetter) en de voortbewegingskracht met een{' '}
        <abbr title="Een instrument dat krachten meet; hier gebruikt als dynamometer" className="cursor-help underline decoration-dotted decoration-zinc-400 underline-offset-2">
          dynamometer
        </abbr>.
        De grenswaarden in dit instrument zijn gebaseerd op de gemengde populatie (mannen &amp; vrouwen).
        Voor specifieke populaties of hogere frequenties: raadpleeg de volledige norm.
      </InfoBox>

      {bgs.map((bg) => {
        const tasks = pushPullTasks.filter((t) => t.bgId === bg.id);
        return (
          <div key={bg.id} className="rounded-xl border border-zinc-200 dark:border-zinc-700">
            <div className="rounded-t-xl bg-zinc-50 px-4 py-3 dark:bg-zinc-800/50">
              <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{bg.name}</h3>
            </div>
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {tasks.map((task) => {
                const result = computePushPullResult(task);
                return (
                  <div key={task.id}>
                    {editingId === task.id ? (
                      <div className="px-4 py-4">
                        <PushPullForm task={task} bgName={bg.name} onSave={saveTask} onCancel={() => setEditingId(null)} />
                      </div>
                    ) : (
                      <div className="flex items-center gap-4 px-4 py-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{task.taskName}</p>
                          <div className="mt-1 flex flex-wrap gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                            <span>{TYPE_LABELS[task.type]}</span>
                            <span>{task.totalMass} kg totaal</span>
                            {task.initialForce != null && <span>F_init: {task.initialForce} N</span>}
                            {task.sustainedForce != null && <span>F_sust: {task.sustainedForce} N</span>}
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            result.verdict === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                            result.verdict === 'moderate' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                            'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          }`}>
                            {result.verdict === 'high' ? 'Overschreden' : result.verdict === 'moderate' ? 'Grensgebied' : 'Acceptabel'}
                          </span>
                          <button onClick={() => setEditingId(task.id)} className="text-xs text-zinc-400 hover:text-orange-600">Bewerken</button>
                          <button onClick={() => onUpdate({ pushPullTasks: pushPullTasks.filter((t) => t.id !== task.id) })} className="text-xs text-zinc-400 hover:text-red-500">Verwijderen</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {addingBg === bg.id ? (
                <div className="px-4 py-4">
                  <PushPullForm task={{ bgId: bg.id }} bgName={bg.name} onSave={saveTask} onCancel={() => setAddingBg(null)} />
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
                    Duw/trek-taak toevoegen
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {pushPullTasks.length === 0 && (
        <p className="text-center text-sm text-zinc-400 dark:text-zinc-500">
          Nog geen duw/trek-taken ingevoerd.
        </p>
      )}
    </div>
  );
}
