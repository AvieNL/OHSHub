'use client';

import { useState } from 'react';
import type { SoundInvestigation, SoundTask, SoundEquipment } from '@/lib/sound-investigation-types';
import { newSoundId } from '@/lib/sound-investigation-storage';
import { downloadMeasurementPlanPDF } from '@/lib/sound-pdf-html';
import { Abbr } from '@/components/Abbr';
import { Formula } from '@/components/Formula';
import { InfoBox } from '@/components/InfoBox';
import { Alert, Button, Icon, Input, Select } from '@/components/ui';
import InlineStepHeader from '@/components/InlineStepHeader';
import InlineEdit from '@/components/InlineEdit';
import MarkdownContent from '@/components/MarkdownContent';

interface Props {
  investigation: SoundInvestigation;
  onUpdate: (partial: Partial<SoundInvestigation>) => void;
  onGoToStep: (step: number) => void;
  contentOverrides?: Record<string, string>;
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
  if (hegSize <= 40) {
    const h = 20 + (hegSize - 15) * 0.75;
    return `20 + (${hegSize} - 15) × 0,75 = ${Number.isInteger(h) ? h : h.toFixed(2)} uur`;
  }
  return '40 uur of splits de groep';
}

// §10.2: minimum number of 45-min samples for job-based (ceil of min cumulative duration / 45 min)
function minSamplesJobBased(hegSize: number): number | null {
  if (hegSize > 40) return null;
  const hours = hegSize <= 15 ? 6 + (hegSize - 1) : 20 + (hegSize - 15) * 0.75;
  return Math.ceil(hours / 0.75);
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

const STEP_KEY = 'step.6';
const NS = 'investigation.sound';
const FALLBACK_TITLE = 'Stap 7 — Meetplan & taken';
const FALLBACK_DESC = 'Stel voor taakgerichte metingen de taken en hun duur vast. Voor functie- of volledigedagmeting: bekijk het vereiste aantal steekproeven hieronder.';

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
  onGoToStep,
}: {
  task: SoundTask;
  allEquipment: SoundEquipment[];
  onUpdate: (t: SoundTask) => void;
  onRemove: () => void;
  onGoToStep: (step: number) => void;
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
      <td className="px-3 py-2 align-top">
        <Input
          type="text"
          size="xs"
          value={task.name}
          onChange={(e) => onUpdate({ ...task, name: e.target.value })}
          placeholder="Taaknaam"
          className="w-full"
        />
        <label className="mt-1 flex cursor-pointer items-center gap-1.5 whitespace-nowrap text-[10px] text-zinc-500 dark:text-zinc-400">
          <input
            type="checkbox"
            checked={task.isCyclic ?? false}
            onChange={(e) => onUpdate({ ...task, isCyclic: e.target.checked })}
            className="accent-orange-500"
          />
          Cyclisch geluid
        </label>
      </td>
      <td className="px-3 py-2 align-top">
        <div className="flex items-center gap-1">
          <Input
            type="number"
            size="xs"
            min={1}
            max={960}
            step={5}
            value={toMin(task.durationHours)}
            onChange={(e) => {
              const h = fromMin(e.target.value);
              if (h != null) onUpdate({ ...task, durationHours: h });
            }}
            placeholder="0"
            className="w-20"
          />
          <span className="text-xs text-zinc-400">min</span>
        </div>
      </td>
      <td className="px-3 py-2 align-top">
        <div className="flex items-center gap-1">
          <Input
            type="number"
            size="xs"
            min={0}
            max={960}
            step={5}
            value={toMin(task.durationMin)}
            onChange={(e) => onUpdate({ ...task, durationMin: fromMin(e.target.value) })}
            placeholder="—"
            className="w-16"
          />
          <span className="text-xs text-zinc-400">–</span>
          <Input
            type="number"
            size="xs"
            min={0}
            max={960}
            step={5}
            value={toMin(task.durationMax)}
            onChange={(e) => onUpdate({ ...task, durationMax: fromMin(e.target.value) })}
            placeholder="—"
            className="w-16"
          />
          <span className="text-xs text-zinc-400">min</span>
        </div>
        {u1b_min !== undefined && (
          <p className="mt-0.5 text-xs text-zinc-400">
            <Formula math="u_{1b}" /> = {u1b_min} min
          </p>
        )}
        {task.isCyclic && (
          <p className="mt-0.5 text-[10px] font-medium text-orange-500">
            ≥ 3 cycli · min. 3 min/meting
          </p>
        )}
        {task.durationMin == null && task.durationMax == null && (
          <p className="mt-0.5 text-[10px] italic text-zinc-300 dark:text-zinc-600">
            aanbevolen: min/max → <Formula math="u_{1b}" /> (§C.5)
          </p>
        )}
      </td>
      <td className="px-3 py-2 align-top">
        <Input
          type="text"
          size="xs"
          value={task.notes ?? ''}
          onChange={(e) => onUpdate({ ...task, notes: e.target.value })}
          placeholder="Omschrijving…"
          className="w-full"
        />
      </td>
      <td className="px-3 py-2 align-top">
        {allEquipment.length === 0 ? (
          <p className="text-[10px] italic text-zinc-300 dark:text-zinc-600">
            Voeg arbeidsmiddelen toe in{' '}
            <button type="button" onClick={() => onGoToStep(5)} className="cursor-pointer underline decoration-dotted underline-offset-2 hover:no-underline">stap 6</button>
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
      <td className="px-2 py-2 align-top">
        <button
          onClick={onRemove}
          className="text-zinc-400 hover:text-red-500"
        >
          <Icon name="x" size="sm" />
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
      <Select
        size="xs"
        value={selectedId}
        onChange={(e) => setSourceHegId(e.target.value)}
      >
        {hegsWithTasks.map((h) => (
          <option key={h.id} value={h.id}>{h.name}</option>
        ))}
      </Select>
      <button
        onClick={handleCopy}
        className="rounded bg-zinc-200 px-3 py-1 text-xs font-medium text-zinc-700 transition hover:bg-orange-500 hover:text-white dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-orange-500 dark:hover:text-white"
      >
        Kopiëren ▶
      </button>
    </div>
  );
}

export default function SoundStep5_Tasks({ investigation, onUpdate, onGoToStep, contentOverrides }: Props) {
  const { hegs, tasks } = investigation;
  const equipment = investigation.equipment ?? [];
  const [openHEG, setOpenHEG] = useState<string | null>(hegs[0]?.id ?? null);

  const title = contentOverrides?.[`${STEP_KEY}.title`] ?? FALLBACK_TITLE;
  const desc = contentOverrides?.[`${STEP_KEY}.desc`];

  if (hegs.length === 0) {
    return (
      <div className="space-y-4">
        <InlineStepHeader namespace={NS} stepKey={STEP_KEY} fallbackTitle={FALLBACK_TITLE} title={title} />
        <Alert variant="warning" size="md">
          Definieer eerst <Abbr id="HEG">HEG</Abbr>&apos;s in{' '}
          <button type="button" onClick={() => onGoToStep(2)} className="cursor-pointer underline decoration-dotted underline-offset-2 hover:no-underline">stap 3</button>.
        </Alert>
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
      <div className="flex items-start justify-between gap-4">
        <div>
          <InlineStepHeader namespace={NS} stepKey={STEP_KEY} fallbackTitle={FALLBACK_TITLE} title={title} />
          <InlineEdit namespace={NS} contentKey={`${STEP_KEY}.desc`}
            initialValue={desc ?? FALLBACK_DESC} fallback={FALLBACK_DESC} multiline markdown>
            {desc
              ? <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                  <MarkdownContent>{desc}</MarkdownContent>
                </p>
              : <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                  Stel voor taakgerichte metingen de taken en hun duur vast. Voor functie- of
                  volledigedagmeting: bekijk het vereiste aantal steekproeven hieronder.
                </p>
            }
          </InlineEdit>
        </div>
        <Button
          variant="secondary"
          onClick={() => downloadMeasurementPlanPDF(investigation)}
          leftIcon={<Icon name="printer" size="sm" />}
          className="shrink-0"
        >
          Meetplan PDF
        </Button>
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
                <Icon
                  name="chevron-down"
                  size="md"
                  className={`shrink-0 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {isOpen && (
                <div className="border-t border-zinc-200 p-5 dark:border-zinc-700">
                  {heg.strategy === 'task-based' ? (
                    /* Task-based panel */
                    <div className="space-y-4">
                      <InfoBox title="Meetplan taakgericht" variant="blue">
                        <ul className="space-y-0.5">
                          <li>• Min. {minWorkers(heg.workerCount)} mw. bemeten (<Abbr id="HEG">HEG</Abbr> = {heg.workerCount}); per taak ≥ 3 metingen (1 mw.) of ≥ 5 metingen (meerdere mw.)</li>
                          <li>• Handgereedschap en pneumatisch gereedschap: behandel als <strong>aparte taak</strong></li>
                          <li>• Cyclisch / impulsgeluid: markeer de taak als "Cyclisch" — meet dan ≥ 3 volledige cycli, min. 3 min</li>
                        </ul>
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
                                  onGoToStep={onGoToStep}
                                />
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Duration check */}
                      {hegTasks.length > 0 && (
                        <Alert
                          variant={Math.abs(totalDuration - heg.effectiveDayHours) < 0.1 ? 'success' : 'warning'}
                        >
                          <Formula math="\Sigma T_m" /> = {Math.round(totalDuration * 60)} min · <Formula math="T_e" /> = {Math.round(heg.effectiveDayHours * 60)} min
                          {Math.abs(totalDuration - heg.effectiveDayHours) < 0.1
                            ? ' ✓ Totaal klopt'
                            : <> — verschil {Math.round(Math.abs(totalDuration - heg.effectiveDayHours) * 60)} min. Pas taken aan of <Formula math="T_e" /> in{' '}
                            <button type="button" onClick={() => onGoToStep(2)} className="cursor-pointer underline decoration-dotted underline-offset-2 hover:no-underline">stap 3</button>.</>}
                        </Alert>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => addTask(heg.id)}
                        leftIcon={<Icon name="plus" size="xs" />}
                      >
                        Taak toevoegen
                      </Button>
                    </div>
                  ) : (
                    /* Job-based / full-day guidance */
                    <div className="space-y-3 text-sm">
                      <InfoBox
                        title={heg.strategy === 'job-based' ? 'Meetplan functiegericht' : 'Meetplan volledige dag'}
                        variant="blue"
                      >
                        {heg.strategy === 'job-based' ? (
                          <ul className="space-y-0.5">
                            <li>• Min. {minWorkersJobBased(heg.workerCount)} mw. bemeten (<Abbr id="HEG">HEG</Abbr> = {heg.workerCount})</li>
                            <li>• Min. {minSamplesJobBased(heg.workerCount) ?? '—'} steekproeven van 45 min (cumulatief ≥ {minDurationJobBased(heg.workerCount)})</li>
                            <li>• Steekproefduur: 15–60 min; verdeel willekeurig over medewerkers en werktijd</li>
                          </ul>
                        ) : (
                          <ul className="space-y-0.5">
                            <li>• Min. {minWorkersJobBased(heg.workerCount)} mw. bemeten (<Abbr id="HEG">HEG</Abbr> = {heg.workerCount})</li>
                            <li>• Min. 3 volledige-dagmetingen; bij spreiding ≥ 3 dB of <Formula math="c_1 u_1" /> &gt; 3,5 dB na analyse: ≥ 2 extra metingen vereist</li>
                            <li>• Elke meting dekt ≥ 75% van de nominale werkdag</li>
                            <li>• Gebruik bij voorkeur een loggend instrument</li>
                          </ul>
                        )}
                      </InfoBox>
                      <p className="text-xs text-zinc-400">
                        Taken hoeven niet afzonderlijk vastgelegd te worden voor deze strategie.
                        Voer de meetwaarden in bij{' '}
                        <button type="button" onClick={() => onGoToStep(7)} className="cursor-pointer underline decoration-dotted underline-offset-2 hover:no-underline">stap 8</button>.
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
