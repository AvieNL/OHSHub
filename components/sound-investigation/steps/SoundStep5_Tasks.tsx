'use client';

import { useState } from 'react';
import type { SoundInvestigation, SoundTask, SoundEquipment } from '@/lib/sound-investigation-types';
import { newSoundId } from '@/lib/sound-investigation-storage';
import { Abbr } from '@/components/Abbr';
import { Formula } from '@/components/Formula';
import { SectionRef } from '@/components/SectionRef';
import { InfoBox } from '@/components/InfoBox';

interface Props {
  investigation: SoundInvestigation;
  onUpdate: (partial: Partial<SoundInvestigation>) => void;
}

// Table 1 (§9.3.2): minimum workers to measure per task
function minWorkers(hegSize: number): number {
  if (hegSize <= 2) return 1;
  if (hegSize <= 5) return 2;
  if (hegSize <= 11) return 3;
  if (hegSize <= 15) return 4;
  if (hegSize <= 20) return 5;
  return 6;
}

// §10.2 Table 3: minimum cumulative measurement duration for job-based
function minDurationJobBased(hegSize: number): string {
  if (hegSize <= 15) return `6 + (${hegSize} - 1) × 1 = ${6 + (hegSize - 1)} uur`;
  if (hegSize <= 40) return `20 + (${hegSize} - 15) × 0.75 uur`;
  return '40 uur of splits de groep';
}

// Table 2 (§10.2): minimum workers to sample for job-based
function minWorkersJobBased(hegSize: number): number {
  if (hegSize <= 2) return 1;
  if (hegSize <= 5) return 2;
  if (hegSize <= 9) return 3;
  if (hegSize <= 14) return 4;
  if (hegSize <= 20) return 5;
  if (hegSize <= 30) return 7;
  if (hegSize <= 50) return 9;
  if (hegSize <= 75) return 12;
  if (hegSize <= 100) return 15;
  return 20;
}

/** Convert stored hours to whole minutes for display. */
function toMin(hours: number | undefined): string {
  return hours != null && isFinite(hours) ? String(Math.round(hours * 60)) : '';
}
/** Convert minutes input to hours for storage. */
function fromMin(raw: string): number | undefined {
  const n = parseInt(raw, 10);
  return isFinite(n) && n > 0 ? n / 60 : undefined;
}

function equipmentCategoryShort(cat: SoundEquipment['category']): string {
  const map: Record<SoundEquipment['category'], string> = {
    voertuig: 'Voertuig',
    machine: 'Machine',
    handgereedschap: 'Handgereedsch.',
    pneumatisch: 'Pneumatisch',
    anders: 'Anders',
  };
  return map[cat] ?? cat;
}

function TaskRow({
  task,
  allEquipment,
  onUpdate,
  onRemove,
}: {
  task: SoundTask;
  allEquipment: SoundEquipment[];
  onUpdate: (t: SoundTask) => void;
  onRemove: () => void;
}) {
  // u_1b in minutes: 0.5 × (T_max − T_min)
  const u1b_min = task.durationMin != null && task.durationMax != null
    ? Math.round(0.5 * (task.durationMax - task.durationMin) * 60)
    : undefined;

  function toggleEquipment(eqId: string) {
    const current = task.equipmentIds ?? [];
    const next = current.includes(eqId)
      ? current.filter((id) => id !== eqId)
      : [...current, eqId];
    onUpdate({ ...task, equipmentIds: next });
  }

  return (
    <tr>
      <td className="px-3 py-2">
        <input
          type="text"
          value={task.name}
          onChange={(e) => onUpdate({ ...task, name: e.target.value })}
          placeholder="Taaknaam"
          className="w-full rounded border border-zinc-200 px-2 py-1 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-1">
          <input
            type="number"
            min={1}
            max={960}
            step={5}
            value={toMin(task.durationHours)}
            onChange={(e) => {
              const h = fromMin(e.target.value);
              if (h != null) onUpdate({ ...task, durationHours: h });
            }}
            placeholder="0"
            className="w-20 rounded border border-zinc-200 px-2 py-1 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
          <span className="text-xs text-zinc-400">min</span>
        </div>
      </td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-1">
          <input
            type="number"
            min={0}
            max={960}
            step={5}
            value={toMin(task.durationMin)}
            onChange={(e) => onUpdate({ ...task, durationMin: fromMin(e.target.value) })}
            placeholder="—"
            className="w-16 rounded border border-zinc-200 px-2 py-1 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
          <span className="text-xs text-zinc-400">–</span>
          <input
            type="number"
            min={0}
            max={960}
            step={5}
            value={toMin(task.durationMax)}
            onChange={(e) => onUpdate({ ...task, durationMax: fromMin(e.target.value) })}
            placeholder="—"
            className="w-16 rounded border border-zinc-200 px-2 py-1 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
          <span className="text-xs text-zinc-400">min</span>
        </div>
        {u1b_min !== undefined && (
          <p className="mt-0.5 text-xs text-zinc-400">
            <Formula math="u_{1b}" /> = {u1b_min} min
          </p>
        )}
        {task.durationMin == null && task.durationMax == null && (
          <p className="mt-0.5 text-[10px] italic text-zinc-300 dark:text-zinc-600">
            aanbevolen: min/max → <Formula math="u_{1b}" /> (§C.5)
          </p>
        )}
      </td>
      <td className="px-3 py-2">
        <input
          type="text"
          value={task.notes ?? ''}
          onChange={(e) => onUpdate({ ...task, notes: e.target.value })}
          placeholder="Omschrijving…"
          className="w-full rounded border border-zinc-200 px-2 py-1 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </td>
      <td className="px-3 py-2 align-top">
        {allEquipment.length === 0 ? (
          <p className="text-[10px] italic text-zinc-300 dark:text-zinc-600">
            Voeg arbeidsmiddelen toe in Stap 6
          </p>
        ) : (
          <div className="space-y-0.5">
            {allEquipment.map((eq) => (
              <label key={eq.id} className="flex cursor-pointer items-center gap-1.5 text-xs">
                <input
                  type="checkbox"
                  checked={(task.equipmentIds ?? []).includes(eq.id)}
                  onChange={() => toggleEquipment(eq.id)}
                  className="accent-orange-500"
                />
                <span className="text-zinc-600 dark:text-zinc-400">
                  {eq.name}
                  <span className="ml-1 text-[10px] text-zinc-400">({equipmentCategoryShort(eq.category)})</span>
                </span>
              </label>
            ))}
          </div>
        )}
      </td>
      <td className="px-2 py-2">
        <button
          onClick={onRemove}
          className="text-zinc-400 hover:text-red-500"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </td>
    </tr>
  );
}

/** Bar to copy tasks from another HEG into the current HEG. */
function CopyTasksBar({
  currentHegId,
  hegs,
  tasks,
  onCopy,
}: {
  currentHegId: string;
  hegs: SoundInvestigation['hegs'];
  tasks: SoundTask[];
  onCopy: (sourceTasks: SoundTask[]) => void;
}) {
  const [sourceHegId, setSourceHegId] = useState('');

  // Only show HEGs that are task-based and have at least one task (and are not this HEG)
  const hegsWithTasks = hegs.filter(
    (h) => h.id !== currentHegId && h.strategy === 'task-based' && tasks.some((t) => t.hegId === h.id),
  );

  if (hegsWithTasks.length === 0) return null;

  function handleCopy() {
    const src = sourceHegId || hegsWithTasks[0]?.id;
    if (!src) return;
    const sourceTasks = tasks.filter((t) => t.hegId === src);
    onCopy(sourceTasks);
  }

  const selectedId = sourceHegId || hegsWithTasks[0]?.id;

  return (
    <div className="flex items-center gap-2 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800/30">
      <span className="text-xs text-zinc-500 dark:text-zinc-400">Kopieer taken van:</span>
      <select
        value={selectedId}
        onChange={(e) => setSourceHegId(e.target.value)}
        className="rounded border border-zinc-200 px-2 py-1 text-xs outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
      >
        {hegsWithTasks.map((h) => (
          <option key={h.id} value={h.id}>{h.name}</option>
        ))}
      </select>
      <button
        onClick={handleCopy}
        className="rounded bg-zinc-200 px-3 py-1 text-xs font-medium text-zinc-700 transition hover:bg-orange-500 hover:text-white dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-orange-500 dark:hover:text-white"
      >
        Kopiëren ▶
      </button>
    </div>
  );
}

export default function SoundStep5_Tasks({ investigation, onUpdate }: Props) {
  const { hegs, tasks } = investigation;
  const equipment = investigation.equipment ?? [];
  const [openHEG, setOpenHEG] = useState<string | null>(hegs[0]?.id ?? null);

  if (hegs.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Stap 7 — Meetplan & taken
        </h2>
        <div className="rounded-lg bg-amber-50 px-4 py-4 text-sm text-amber-700 dark:bg-amber-900/15 dark:text-amber-400">
          Definieer eerst <Abbr id="HEG">HEG</Abbr>&apos;s in stap 2.
        </div>
      </div>
    );
  }

  function getTasksForHEG(hegId: string) {
    return tasks.filter((t) => t.hegId === hegId);
  }

  function addTask(hegId: string) {
    const newTask: SoundTask = {
      id: newSoundId(),
      hegId,
      name: '',
      durationHours: 1,
    };
    onUpdate({ tasks: [...tasks, newTask] });
  }

  function updateTask(updated: SoundTask) {
    onUpdate({ tasks: tasks.map((t) => (t.id === updated.id ? updated : t)) });
  }

  function removeTask(id: string) {
    onUpdate({
      tasks: tasks.filter((t) => t.id !== id),
      measurements: investigation.measurements.filter((m) => m.taskId !== id),
    });
  }

  function copyTasksToHEG(hegId: string, sourceTasks: SoundTask[]) {
    const copied: SoundTask[] = sourceTasks.map((t) => ({
      ...t,
      id: newSoundId(),
      hegId,
    }));
    onUpdate({ tasks: [...tasks, ...copied] });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Stap 7 — Meetplan & taken
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          Stel voor taakgerichte metingen de taken en hun duur vast (<SectionRef id="§9.2">§9.2</SectionRef>). Voor functie- of
          volledigedagmeting: bekijk het vereiste aantal steekproeven hieronder.
        </p>
      </div>

      <div className="space-y-4">
        {hegs.map((heg) => {
          const isOpen = openHEG === heg.id;
          const hegTasks = getTasksForHEG(heg.id);
          const totalDuration = hegTasks.reduce((s, t) => s + (t.durationHours || 0), 0);

          return (
            <div key={heg.id} className="rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/30">
              {/* Header */}
              <button
                onClick={() => setOpenHEG(isOpen ? null : heg.id)}
                className="flex w-full items-center justify-between px-5 py-3 text-left"
              >
                <div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{heg.name}</p>
                  <p className="text-xs text-zinc-400">
                    {heg.strategy === 'task-based'
                      ? <>{hegTasks.length} taken · totaal {Math.round(totalDuration * 60)} min / <Formula math="T_e" /> = {Math.round(heg.effectiveDayHours * 60)} min</>
                      : `Strategie: ${heg.strategy === 'job-based' ? 'Functiegericht' : 'Volledige dag'} · ${heg.workerCount} medewerkers`}
                  </p>
                </div>
                <svg
                  className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isOpen && (
                <div className="border-t border-zinc-200 p-5 dark:border-zinc-700">
                  {heg.strategy === 'task-based' ? (
                    /* Task-based panel */
                    <div className="space-y-4">
                      <InfoBox title="§9.3.2 — Minimumaantal medewerkers & metingen" variant="blue">
                        <SectionRef id="§9.3.2">§9.3.2</SectionRef>: Minimaal {minWorkers(heg.workerCount)} medewerker{minWorkers(heg.workerCount) > 1 ? 's' : ''} bemeten
                        (<Abbr id="HEG">HEG</Abbr> = {heg.workerCount}). Per taak: ≥ 3 metingen (1 medewerker) of ≥ 5 metingen (meerdere).
                        Max. spreiding: &le; 3 dB (1 medewerker) of &le; 5 dB (groep).
                      </InfoBox>

                      {/* Copy tasks bar */}
                      <CopyTasksBar
                        currentHegId={heg.id}
                        hegs={hegs}
                        tasks={tasks}
                        onCopy={(sourceTasks) => copyTasksToHEG(heg.id, sourceTasks)}
                      />

                      {hegTasks.length > 0 && (
                        <div className="overflow-x-auto overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-zinc-50 dark:bg-zinc-800/50">
                                <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">Taak</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500"><Formula math="T_m" /> (min)</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">
                                  Duurvariantie min–max (min)
                                  <span className="block font-normal text-zinc-400">optioneel → geeft <Formula math="u_{1b}" /></span>
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">Omschrijving</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">Arbeidsmiddelen</th>
                                <th className="px-2 py-2" />
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                              {hegTasks.map((t) => (
                                <TaskRow
                                  key={t.id}
                                  task={t}
                                  allEquipment={equipment ?? []}
                                  onUpdate={updateTask}
                                  onRemove={() => removeTask(t.id)}
                                />
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Duration check */}
                      {hegTasks.length > 0 && (
                        <div className={`rounded-lg px-3 py-2 text-xs ${
                          Math.abs(totalDuration - heg.effectiveDayHours) < 0.1
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/15 dark:text-emerald-400'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-900/15 dark:text-amber-400'
                        }`}>
                          <Formula math="\Sigma T_m" /> = {Math.round(totalDuration * 60)} min · <Formula math="T_e" /> = {Math.round(heg.effectiveDayHours * 60)} min
                          {Math.abs(totalDuration - heg.effectiveDayHours) < 0.1
                            ? ' ✓ Totaal klopt'
                            : <> — verschil {Math.round(Math.abs(totalDuration - heg.effectiveDayHours) * 60)} min. Pas taken aan of <Formula math="T_e" /> in stap 2.</>}
                        </div>
                      )}

                      <button
                        onClick={() => addTask(heg.id)}
                        className="flex items-center gap-1.5 rounded-lg border border-dashed border-zinc-300 px-4 py-2 text-sm text-zinc-500 transition hover:border-orange-400 hover:text-orange-600 dark:border-zinc-600 dark:text-zinc-400"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        Taak toevoegen
                      </button>
                    </div>
                  ) : (
                    /* Job-based / full-day guidance */
                    <div className="space-y-3 text-sm">
                      <InfoBox
                        title={heg.strategy === 'job-based' ? '§10.2 — Meetplan functiegericht' : '§11.3 — Meetplan volledige dag'}
                        variant="blue"
                      >
                        {heg.strategy === 'job-based' ? (
                          <>
                            <p><SectionRef id="§10.2">§10.2 Meetplan functiegericht</SectionRef>:</p>
                            <ul className="mt-1 space-y-0.5">
                              <li>• Min. {minWorkersJobBased(heg.workerCount)} medewerker{minWorkersJobBased(heg.workerCount) > 1 ? 's' : ''} bemeten (<Abbr id="HEG">HEG</Abbr> = {heg.workerCount})</li>
                              <li>• Min. cumulatieve meetduur: {minDurationJobBased(heg.workerCount)}</li>
                              <li>• Aanbevolen steekproefduur: 45 min (min. 15 min, max. 1 uur)</li>
                              <li>• Verdeel steekproeven willekeurig over medewerkers en werktijd</li>
                            </ul>
                          </>
                        ) : (
                          <>
                            <p><SectionRef id="§11.3">§11.3 Meetplan volledige dag</SectionRef>:</p>
                            <ul className="mt-1 space-y-0.5">
                              <li>• Min. {minWorkersJobBased(heg.workerCount)} medewerker{minWorkersJobBased(heg.workerCount) > 1 ? 's' : ''} bemeten (<Abbr id="HEG">HEG</Abbr> = {heg.workerCount})</li>
                              <li>• Min. 3 volledige-dagmetingen (bij spreiding &lt; 3 dB en <Formula math="c_1 u_1" /> ≤ 3,5 dB)</li>
                              <li>• Meting dekt ≥ 75% van de nominale werkdag</li>
                              <li>• Gebruik bij voorkeur een loggend instrument (<SectionRef id="§11.2">§11.2</SectionRef>)</li>
                            </ul>
                          </>
                        )}
                      </InfoBox>
                      <p className="text-xs text-zinc-400">
                        Taken hoeven niet afzonderlijk vastgelegd te worden voor deze strategie.
                        Voer de meetwaarden in bij stap 7.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
