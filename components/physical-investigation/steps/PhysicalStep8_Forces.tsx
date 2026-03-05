'use client';

import { useState } from 'react';
import type { PhysicalInvestigation, ForceTask } from '@/lib/physical-investigation-types';
import { newPhysicalId } from '@/lib/physical-investigation-storage';
import { computeForceResult } from '@/lib/physical-stats';
import { InfoBox } from '@/components/InfoBox';
import { Alert, Button, Card, FieldLabel, Icon, Input, Select } from '@/components/ui';
import InlineStepHeader from '@/components/InlineStepHeader';
import InlineEdit from '@/components/InlineEdit';
import MarkdownContent from '@/components/MarkdownContent';

const STEP_KEY = 'step.8';
const NS = 'investigation.physical-load';
const FALLBACK_TITLE = 'Stap 9 — Krachten op arbeidsmiddelen (EN 1005-3)';
const FALLBACK_DESC = 'Beoordeel krachten uitgeoefend op machines en arbeidsmiddelen. F_Br = F_B × m_v × m_f × m_d; risicodimensie m_r = F / F_Br. m_r ≤ 0,5 acceptabel; 0,5–0,7 grensgebied; > 0,7 niet acceptabel.';
const FALLBACK_IB0_TITLE = 'EN 1005-3:2002 — Aanbevolen krachtgrenzen voor machines';

interface Props {
  investigation: PhysicalInvestigation;
  onUpdate: (partial: Partial<PhysicalInvestigation>) => void;
  contentOverrides?: Record<string, string>;
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
    <Card variant="form">
      <h4 className="mb-4 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
        {d.id ? 'Krachttaak bewerken' : `Nieuwe krachttaak — ${bgName}`}
      </h4>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <FieldLabel>Naam taak / bediening *</FieldLabel>
          <Input type="text" value={d.taskName ?? ''} onChange={(e) => setD({ ...d, taskName: e.target.value })} placeholder="Bijv. Bedienen startknop persmachine" />
        </div>
        <div className="sm:col-span-2">
          <FieldLabel>Type bewerking / referentiekracht F_B (N)</FieldLabel>
          <Select
            value={d.referenceForce ?? ''}
            onChange={(e) => setD({ ...d, referenceForce: parseFloat(e.target.value) })}
          >
            <option value="">— Selecteer type —</option>
            {REFERENCE_FORCES.map((r) => (
              <option key={r.value + r.label} value={r.value}>{r.label} — {r.value} N</option>
            ))}
          </Select>
          <p className="mt-1 text-xs text-zinc-400">Of voer een aangepaste F_B in:</p>
          <Input type="number" min={1} value={d.referenceForce ?? ''} onChange={(e) => setD({ ...d, referenceForce: parseFloat(e.target.value) || 0 })} placeholder="F_B in Newton" className="mt-1" />
        </div>
        <div>
          <FieldLabel>Snelheidsmultiplier m_v</FieldLabel>
          <Select value={d.speedMultiplier ?? 1.00} onChange={(e) => setD({ ...d, speedMultiplier: parseFloat(e.target.value) })}>
            {SPEED_MULTIPLIERS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
        </div>
        <div>
          <FieldLabel>Frequentiemultiplier m_f</FieldLabel>
          <Select value={d.freqMultiplier ?? 1.00} onChange={(e) => setD({ ...d, freqMultiplier: parseFloat(e.target.value) })}>
            {FREQ_MULTIPLIERS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
        </div>
        <div>
          <FieldLabel>Duurmultiplier m_d</FieldLabel>
          <Select value={d.durationMultiplier ?? 1.00} onChange={(e) => setD({ ...d, durationMultiplier: parseFloat(e.target.value) })}>
            {DUR_MULTIPLIERS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
        </div>
        {fBr != null && (
          <div className="flex items-center rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700 dark:bg-blue-900/10 dark:text-blue-400">
            Maximale toelaatbare kracht F_Br = <strong className="ml-1">{fBr} N</strong>
          </div>
        )}
        <div>
          <FieldLabel>Gemeten kracht F (N)</FieldLabel>
          <Input type="number" min={0} value={d.measuredForce ?? ''} onChange={(e) => setD({ ...d, measuredForce: parseFloat(e.target.value) || 0 })} placeholder="Gemeten waarde" />
        </div>
        <div className="sm:col-span-2">
          <FieldLabel>Opmerkingen</FieldLabel>
          <Input type="text" value={d.notes ?? ''} onChange={(e) => setD({ ...d, notes: e.target.value })} placeholder="Aanvullende informatie" />
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
        <Button variant="primary" onClick={save} disabled={!d.taskName?.trim()}>Opslaan</Button>
        <Button variant="secondary" onClick={onCancel}>Annuleren</Button>
      </div>
    </Card>
  );
}

export default function PhysicalStep8_Forces({ investigation, onUpdate, contentOverrides }: Props) {
  const title = contentOverrides?.[`${STEP_KEY}.title`] ?? FALLBACK_TITLE;
  const desc = contentOverrides?.[`${STEP_KEY}.desc`];
  const ib0Title = contentOverrides?.[`${STEP_KEY}.infobox.0.title`] ?? FALLBACK_IB0_TITLE;
  const ib0Content = contentOverrides?.[`${STEP_KEY}.infobox.0.content`];
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
        <InlineStepHeader namespace={NS} stepKey={STEP_KEY} fallbackTitle={FALLBACK_TITLE} title={title} />
        <Alert variant="warning" size="md">
          Definieer eerst belastingsgroepen in stap 3.
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <InlineStepHeader namespace={NS} stepKey={STEP_KEY} fallbackTitle={FALLBACK_TITLE} title={title} />
        <InlineEdit namespace={NS} contentKey={`${STEP_KEY}.desc`}
          initialValue={desc ?? FALLBACK_DESC} fallback={FALLBACK_DESC} multiline markdown>
          {desc
            ? <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                <MarkdownContent>{desc}</MarkdownContent>
              </p>
            : <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                Beoordeel krachten uitgeoefend op machines en arbeidsmiddelen.
                F_Br = F_B × m_v × m_f × m_d; risicodimensie m_r = F / F_Br.
                m_r ≤ 0,5 acceptabel; 0,5–0,7 grensgebied; &gt; 0,7 niet acceptabel.
              </p>
          }
        </InlineEdit>
      </div>

      <InfoBox title={
        <InlineEdit namespace={NS} contentKey={`${STEP_KEY}.infobox.0.title`}
          initialValue={ib0Title} fallback={FALLBACK_IB0_TITLE}>
          {ib0Title}
        </InlineEdit>
      }>
        <InlineEdit namespace={NS} contentKey={`${STEP_KEY}.infobox.0.content`}
          initialValue={ib0Content ?? ''} fallback="" multiline markdown>
          {ib0Content
            ? <MarkdownContent>{ib0Content}</MarkdownContent>
            : <>
                De maximale toelaatbare kracht F_Br is gebaseerd op de referentiekracht F_B voor het
                betreffende type bediening, gecorrigeerd voor bewegingssnelheid (m_v), frequentie (m_f)
                en duur (m_d). De risicodimensie{' '}
                <abbr title="Risicodimensie m_r = F / F_Br — verhouding gemeten kracht tot maximale toelaatbare kracht" className="cursor-help underline decoration-dotted decoration-zinc-400 underline-offset-2">m_r</abbr>{' '}
                geeft aan hoe dicht de gemeten kracht bij de grens zit. Bij m_r &gt; 0,7:
                herontwerp van de machine of bediening is noodzakelijk.
              </>
          }
        </InlineEdit>
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
                          <Button variant="ghost" size="xs" leftIcon={<Icon name="pencil" size="xs" />} onClick={() => setEditingId(task.id)}>Bewerken</Button>
                          <Button variant="danger" size="xs" leftIcon={<Icon name="trash" size="xs" />} onClick={() => onUpdate({ forceTasks: forceTasks.filter((t) => t.id !== task.id) })}>Verwijderen</Button>
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
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<Icon name="plus" size="xs" />}
                    onClick={() => setAddingBg(bg.id)}
                  >
                    Krachttaak toevoegen
                  </Button>
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
