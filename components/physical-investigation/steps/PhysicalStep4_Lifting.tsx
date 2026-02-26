'use client';

import { useState } from 'react';
import type { PhysicalInvestigation, LiftingTask, CarryingTask, NIOSHDuration, NIFGrip } from '@/lib/physical-investigation-types';
import { newPhysicalId } from '@/lib/physical-investigation-storage';
import { computeLiftingResult, computeCarryingResult } from '@/lib/physical-stats';
import { InfoBox } from '@/components/InfoBox';
import { Abbr } from '@/components/Abbr';

interface Props {
  investigation: PhysicalInvestigation;
  onUpdate: (partial: Partial<PhysicalInvestigation>) => void;
}

const DURATION_LABELS: Record<NIOSHDuration, string> = {
  short:  '≤ 1 uur (met rust ≥ 120% werktijd)',
  medium: '1–2 uur (met rust ≥ 30% werktijd)',
  long:   '2–8 uur',
};

const GRIP_LABELS: Record<NIFGrip, string> = {
  good: 'Goed — comfortabele handvatten (Cf = 1,00)',
  fair: 'Gewoon — suboptimale handvatten (Cf = 0,95)',
  poor: 'Slecht — geen handvatten (Cf = 0,90)',
};

const VERDICT_STYLES = {
  acceptable: 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/15 dark:border-emerald-800/40 dark:text-emerald-300',
  moderate:   'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/15 dark:border-amber-800/40 dark:text-amber-300',
  high:       'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/15 dark:border-red-800/40 dark:text-red-300',
};

function LiftingForm({
  task,
  bgName,
  onSave,
  onCancel,
}: {
  task: Partial<LiftingTask>;
  bgName: string;
  onSave: (t: LiftingTask) => void;
  onCancel: () => void;
}) {
  const [d, setD] = useState<Partial<LiftingTask>>(task);
  const INPUT = 'w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-orange-400';

  function save() {
    if (!d.taskName?.trim() || !d.bgId) return;
    onSave({
      id: d.id ?? newPhysicalId(),
      bgId: d.bgId,
      taskName: d.taskName.trim(),
      weight: d.weight ?? 10,
      H_start: d.H_start ?? 35,
      H_end: d.H_end,
      V_start: d.V_start ?? 75,
      V_end: d.V_end ?? 135,
      A_start: d.A_start ?? 0,
      A_end: d.A_end,
      frequency: d.frequency ?? 1,
      duration: d.duration ?? 'long',
      grip: d.grip ?? 'fair',
      oneHanded: d.oneHanded,
      slipperyFloor: d.slipperyFloor,
      extremeClimate: d.extremeClimate,
      unevenFloor: d.unevenFloor,
      exceedEightHours: d.exceedEightHours,
      unstableObject: d.unstableObject,
      highAcceleration: d.highAcceleration,
      restrictedSpace: d.restrictedSpace,
      notes: d.notes,
    });
  }

  const preview = d.weight && d.H_start && d.V_start != null && d.V_end != null && d.A_start != null && d.frequency && d.duration && d.grip
    ? computeLiftingResult(d as LiftingTask)
    : null;

  return (
    <div className="rounded-xl border border-orange-200 bg-orange-50/50 px-5 py-4 dark:border-orange-800/30 dark:bg-orange-900/10">
      <h4 className="mb-4 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
        {d.id ? 'Tiltaak bewerken' : `Nieuwe tiltaak — ${bgName}`}
      </h4>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Naam taak *</label>
          <input type="text" value={d.taskName ?? ''} onChange={(e) => setD({ ...d, taskName: e.target.value })} placeholder="Bijv. Tillen dozen van transportband naar pallet" className={INPUT} />
        </div>

        {/* Main NIOSH parameters */}
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Gewicht G (kg) <span className="text-zinc-400">— max 25 kg aanbevolen</span>
          </label>
          <input type="number" min={0} step={0.1} value={d.weight ?? ''} onChange={(e) => setD({ ...d, weight: parseFloat(e.target.value) || 0 })} className={INPUT} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Horizontale afstand begin H (cm) <span className="text-zinc-400">optim: 25 cm</span>
          </label>
          <input type="number" min={1} value={d.H_start ?? ''} onChange={(e) => setD({ ...d, H_start: parseInt(e.target.value) || 0 })} className={INPUT} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Verticale hoogte begin V_start (cm) <span className="text-zinc-400">optim: 75 cm</span>
          </label>
          <input type="number" min={0} value={d.V_start ?? ''} onChange={(e) => setD({ ...d, V_start: parseInt(e.target.value) || 0 })} className={INPUT} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Verticale hoogte einde V_end (cm)
          </label>
          <input type="number" min={0} value={d.V_end ?? ''} onChange={(e) => setD({ ...d, V_end: parseInt(e.target.value) || 0 })} className={INPUT} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Asymmetrie begin A (graden) <span className="text-zinc-400">0° = recht voor</span>
          </label>
          <input type="number" min={0} max={135} value={d.A_start ?? ''} onChange={(e) => setD({ ...d, A_start: parseInt(e.target.value) || 0 })} className={INPUT} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Frequentie (tilbewegingen/min)
          </label>
          <input type="number" min={0} step={0.1} value={d.frequency ?? ''} onChange={(e) => setD({ ...d, frequency: parseFloat(e.target.value) || 0 })} className={INPUT} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Duurcategorie</label>
          <select value={d.duration ?? 'long'} onChange={(e) => setD({ ...d, duration: e.target.value as NIOSHDuration })} className={INPUT}>
            {(Object.entries(DURATION_LABELS) as [NIOSHDuration, string][]).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Gripkwaliteit</label>
          <select value={d.grip ?? 'fair'} onChange={(e) => setD({ ...d, grip: e.target.value as NIFGrip })} className={INPUT}>
            {(Object.entries(GRIP_LABELS) as [NIFGrip, string][]).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        {/* Optional end-position parameters */}
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Horizontale afstand einde H_end (cm) <span className="text-zinc-400">optioneel</span>
          </label>
          <input type="number" min={1} value={d.H_end ?? ''} onChange={(e) => setD({ ...d, H_end: e.target.value ? parseInt(e.target.value) : undefined })} placeholder="Laat leeg = gelijk aan begin" className={INPUT} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Asymmetrie einde A_end (graden) <span className="text-zinc-400">optioneel</span>
          </label>
          <input type="number" min={0} max={135} value={d.A_end ?? ''} onChange={(e) => setD({ ...d, A_end: e.target.value ? parseInt(e.target.value) : undefined })} placeholder="Laat leeg = gelijk aan begin" className={INPUT} />
        </div>

        {/* Risk flags */}
        <div className="sm:col-span-2">
          <label className="mb-2 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Aanvullende risicofactoren</label>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {([
              ['oneHanded', 'Éénhandig tillen'],
              ['slipperyFloor', 'Gladde vloer'],
              ['extremeClimate', 'Bijzonder klimaat (> 32 °C / < 0 °C)'],
              ['unevenFloor', 'Ongelijke of zachte vloer'],
              ['exceedEightHours', 'Werktijd > 8 uur'],
              ['unstableObject', 'Instabiel object / wisselend gewicht'],
              ['highAcceleration', 'Hoge versnelling / schokbelasting'],
              ['restrictedSpace', 'Beperkte bewegingsvrijheid'],
            ] as [keyof LiftingTask, string][]).map(([key, label]) => (
              <label key={key} className="flex cursor-pointer items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                <input
                  type="checkbox"
                  checked={!!(d as Record<string, unknown>)[key]}
                  onChange={(e) => setD({ ...d, [key]: e.target.checked })}
                  className="h-3.5 w-3.5 rounded border-zinc-300 text-orange-500"
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Opmerkingen</label>
          <input type="text" value={d.notes ?? ''} onChange={(e) => setD({ ...d, notes: e.target.value })} placeholder="Aanvullende informatie" className={INPUT} />
        </div>
      </div>

      {/* Live preview */}
      {preview && (
        <div className={`mt-4 rounded-lg border px-4 py-3 ${VERDICT_STYLES[preview.verdict]}`}>
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <span><strong>RWL_min:</strong> {preview.rwl_min} kg</span>
            <span><strong>LI:</strong> {preview.li}</span>
            <span className="font-semibold">{preview.verdictLabel}</span>
          </div>
          {preview.directActionReasons.length > 0 && (
            <p className="mt-1 text-xs text-red-700 dark:text-red-400">
              ⚠ Directe actie: {preview.directActionReasons.join(', ')}
            </p>
          )}
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <button type="button" onClick={save} disabled={!d.taskName?.trim()} className="rounded-lg bg-orange-500 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-40">Opslaan</button>
        <button type="button" onClick={onCancel} className="rounded-lg border border-zinc-200 px-4 py-1.5 text-sm text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800">Annuleren</button>
      </div>
    </div>
  );
}

export default function PhysicalStep4_Lifting({ investigation, onUpdate }: Props) {
  const { bgs, liftingTasks, carryingTasks, methods } = investigation;
  const [editingLiftId, setEditingLiftId] = useState<string | null>(null);
  const [addingLiftBg, setAddingLiftBg] = useState<string | null>(null);
  const [addingCarryBg, setAddingCarryBg] = useState<string | null>(null);

  function saveLift(task: LiftingTask) {
    const exists = liftingTasks.find((t) => t.id === task.id);
    onUpdate({
      liftingTasks: exists
        ? liftingTasks.map((t) => (t.id === task.id ? task : t))
        : [...liftingTasks, task],
    });
    setEditingLiftId(null);
    setAddingLiftBg(null);
  }

  function saveCarry(task: CarryingTask) {
    const exists = carryingTasks.find((t) => t.id === task.id);
    onUpdate({
      carryingTasks: exists
        ? carryingTasks.map((t) => (t.id === task.id ? task : t))
        : [...carryingTasks, task],
    });
    setAddingCarryBg(null);
  }

  if (bgs.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Stap 5 — Tillen &amp; dragen (NIOSH)</h2>
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
          Stap 5 — Tillen &amp; dragen (<Abbr id="NIOSH">NIOSH</Abbr>)
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          Voer per belastingsgroep de tiltaken in en bereken de Tillingsindex{' '}
          <abbr title="Lifting Index: LI = Gewicht / Recommended Weight Limit" className="cursor-help underline decoration-dotted decoration-zinc-400 underline-offset-2">LI</abbr>.
          Formule: <code className="rounded bg-zinc-100 px-1 text-xs dark:bg-zinc-800">RWL = 23 × Hf × Vf × Df × Ff × Af × Cf</code>
        </p>
      </div>

      <InfoBox title="NEN-ISO 11228-1:2021 — NIOSH-methode">
        De{' '}
        <abbr title="National Institute for Occupational Safety and Health" className="cursor-help underline decoration-dotted decoration-zinc-400 underline-offset-2">NIOSH</abbr>{' '}
        Recommended Weight Limit (<abbr title="Recommended Weight Limit" className="cursor-help underline decoration-dotted decoration-zinc-400 underline-offset-2">RWL</abbr>)
        is het maximale gewicht dat onder optimale omstandigheden door 90% van de beroepsbevolking
        kan worden getild zonder risico op lage rugklachten. De Tillingsindex{' '}
        <abbr title="Lifting Index = Gewicht / RWL" className="cursor-help underline decoration-dotted decoration-zinc-400 underline-offset-2">LI</abbr>{' '}
        = G / RWL:
        LI ≤ 1 acceptabel, 1–2 risicovol, &gt; 2 zeer risicovol.
        Referentiegewicht = 23 kg (optimale omstandigheden, geen verzwarende factoren).
      </InfoBox>

      {/* Per BG: lifting tasks */}
      {bgs.map((bg) => {
        const tasks = liftingTasks.filter((t) => t.bgId === bg.id);
        return (
          <div key={bg.id} className="rounded-xl border border-zinc-200 dark:border-zinc-700">
            <div className="flex items-center justify-between gap-3 rounded-t-xl bg-zinc-50 px-4 py-3 dark:bg-zinc-800/50">
              <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{bg.name}</h3>
              {!['push-pull', 'repetitive', 'posture', 'forces'].every((m) => !methods.includes(m as never)) || true ? null : null}
            </div>
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {tasks.map((task) => {
                const result = computeLiftingResult(task);
                return (
                  <div key={task.id}>
                    {editingLiftId === task.id ? (
                      <div className="px-4 py-4">
                        <LiftingForm task={task} bgName={bg.name} onSave={saveLift} onCancel={() => setEditingLiftId(null)} />
                      </div>
                    ) : (
                      <div className="flex items-center gap-4 px-4 py-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{task.taskName}</p>
                          <div className="mt-1 flex flex-wrap gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                            <span>G = {task.weight} kg</span>
                            <span>RWL = {result.rwl_min} kg</span>
                            <span className={`font-semibold ${
                              result.verdict === 'high' ? 'text-red-600' :
                              result.verdict === 'moderate' ? 'text-amber-600' : 'text-emerald-600'
                            }`}>
                              LI = {result.li}
                            </span>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            result.verdict === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                            result.verdict === 'moderate' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                            'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          }`}>
                            {result.verdict === 'high' ? 'Zeer risicovol' : result.verdict === 'moderate' ? 'Risicovol' : 'Acceptabel'}
                          </span>
                          <button onClick={() => setEditingLiftId(task.id)} className="text-xs text-zinc-400 hover:text-orange-600">Bewerken</button>
                          <button onClick={() => onUpdate({ liftingTasks: liftingTasks.filter((t) => t.id !== task.id) })} className="text-xs text-zinc-400 hover:text-red-500">Verwijderen</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {addingLiftBg === bg.id ? (
                <div className="px-4 py-4">
                  <LiftingForm task={{ bgId: bg.id }} bgName={bg.name} onSave={saveLift} onCancel={() => setAddingLiftBg(null)} />
                </div>
              ) : (
                <div className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => setAddingLiftBg(bg.id)}
                    className="flex items-center gap-1.5 text-xs text-orange-600 hover:text-orange-700 dark:text-orange-400"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Tiltaak toevoegen
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Summary table */}
      {liftingTasks.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">Overzicht tillingsindex</h3>
          <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-700">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50">
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-zinc-500">Taak</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-zinc-500">BG</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold text-zinc-500">G (kg)</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold text-zinc-500">RWL (kg)</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold text-zinc-500">LI</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-zinc-500">Oordeel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {liftingTasks.map((t) => {
                  const r = computeLiftingResult(t);
                  const bg = bgs.find((b) => b.id === t.bgId);
                  return (
                    <tr key={t.id} className="bg-white dark:bg-zinc-900">
                      <td className="px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300">{t.taskName}</td>
                      <td className="px-4 py-2.5 text-xs text-zinc-500">{bg?.name ?? '—'}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-sm">{t.weight}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-sm">{r.rwl_min}</td>
                      <td className={`px-4 py-2.5 text-right font-mono font-semibold ${
                        r.verdict === 'high' ? 'text-red-600' :
                        r.verdict === 'moderate' ? 'text-amber-600' : 'text-emerald-600'
                      }`}>{r.li}</td>
                      <td className="px-4 py-2.5">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          r.verdict === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                          r.verdict === 'moderate' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                          'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        }`}>
                          {r.verdictLabel.split(' — ')[0]}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {liftingTasks.length === 0 && (
        <p className="text-center text-sm text-zinc-400 dark:text-zinc-500">
          Nog geen tiltaken ingevoerd. Voeg een taak toe per belastingsgroep.
        </p>
      )}
    </div>
  );
}
