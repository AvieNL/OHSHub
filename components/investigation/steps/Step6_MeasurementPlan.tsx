'use client';

import { useState } from 'react';
import type { Investigation, MeasurementPlanEntry } from '@/lib/investigation-types';
import { newId } from '@/lib/investigation-storage';
import { Button, Input, Select, Textarea, Icon } from '@/components/ui';
import InlineStepHeader from '@/components/InlineStepHeader';
import InlineEdit from '@/components/InlineEdit';
import MarkdownContent from '@/components/MarkdownContent';

interface Props {
  investigation: Investigation;
  onUpdate: (partial: Partial<Investigation>) => void;
  contentOverrides?: Record<string, string>;
}

const STEP_KEY = 'step.6';
const NS = 'investigation.hazardous-substances';
const FALLBACK_TITLE = 'Stap 6 — Meetstrategie opstellen';
const FALLBACK_DESC = 'Stel per SEG × stof een formeel meetplan op conform NEN-EN 689 §5.2 en EN 482. Leg vast: type meting, meetmethode, laboratorium, aantal metingen en planning.';

function emptyPlan(segId: string, substanceId: string): MeasurementPlanEntry {
  return {
    id: newId(),
    segId,
    substanceId,
    measurementType: '8h-tgg',
    plannedCount: 6,
    method: '',
    lab: '',
    plannedDate: '',
    notes: '',
  };
}

function PlanForm({
  plan,
  segs,
  substances,
  onChange,
  onCancel,
  onSave,
}: {
  plan: MeasurementPlanEntry;
  segs: Investigation['segs'];
  substances: Investigation['substances'];
  onChange: (p: MeasurementPlanEntry) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  function f(patch: Partial<MeasurementPlanEntry>) {
    onChange({ ...plan, ...patch });
  }

  const isValid = plan.segId && plan.substanceId && plan.plannedCount >= 3;

  return (
    <div className="rounded-xl border border-orange-200 bg-orange-50/40 p-5 dark:border-orange-800/40 dark:bg-orange-900/10">
      <h4 className="mb-4 text-sm font-semibold text-zinc-800 dark:text-zinc-200">Meetplan invoegen</h4>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
            SEG <span className="text-red-500">*</span>
          </label>
          <Select
            value={plan.segId}
            onChange={(e) => f({ segId: e.target.value })}
            className="w-full"
          >
            <option value="">Selecteer SEG…</option>
            {segs.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </Select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Stof <span className="text-red-500">*</span>
          </label>
          <Select
            value={plan.substanceId}
            onChange={(e) => f({ substanceId: e.target.value })}
            className="w-full"
          >
            <option value="">Selecteer stof…</option>
            {substances.map((s) => (
              <option key={s.id} value={s.id}>{s.productName}</option>
            ))}
          </Select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Type meting</label>
          <Select
            value={plan.measurementType}
            onChange={(e) => f({ measurementType: e.target.value as MeasurementPlanEntry['measurementType'] })}
            className="w-full"
          >
            <option value="8h-tgg">8-uurs TGG (langetermijn)</option>
            <option value="15min">15-min STEL (kortetermijn)</option>
            <option value="ceiling">Plafondwaarde (piek)</option>
          </Select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Aantal metingen gepland
          </label>
          <Input
            type="number"
            value={String(plan.plannedCount)}
            onChange={(e) => f({ plannedCount: parseInt(e.target.value) || 6 })}
            className="w-full"
          />
          <p className="mt-1 text-xs text-zinc-400">
            {plan.plannedCount >= 6 ? '≥ 6: volledige statistische toets mogelijk' : '3–5: preliminary test (beperkt)'}
          </p>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Meetmethode (EN 482)</label>
          <Input
            type="text"
            value={plan.method ?? ''}
            onChange={(e) => f({ method: e.target.value })}
            placeholder="Bijv. NIOSH 1500, ISO 8518, MDHS14"
            className="w-full"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Laboratorium</label>
          <Input
            type="text"
            value={plan.lab ?? ''}
            onChange={(e) => f({ lab: e.target.value })}
            placeholder="Naam en accreditatienummer lab"
            className="w-full"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Geplande datum</label>
          <Input
            type="date"
            value={plan.plannedDate ?? ''}
            onChange={(e) => f({ plannedDate: e.target.value })}
            className="w-full"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Opmerkingen</label>
          <Textarea
            rows={2}
            value={plan.notes ?? ''}
            onChange={(e) => f({ notes: e.target.value })}
            placeholder="Worst-case scenario, bijzondere condities, representatieve taken…"
          />
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
        <Button variant="secondary" onClick={onCancel}>
          Annuleren
        </Button>
        <Button
          variant="primary"
          onClick={onSave}
          disabled={!isValid}
        >
          Meetplan opslaan
        </Button>
      </div>
    </div>
  );
}

export default function Step6_MeasurementPlan({ investigation, onUpdate, contentOverrides }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<MeasurementPlanEntry | null>(null);
  const { segs, substances, measurementPlans, initialEstimates, tasks } = investigation;

  const title = contentOverrides?.[`${STEP_KEY}.title`] ?? FALLBACK_TITLE;
  const desc = contentOverrides?.[`${STEP_KEY}.desc`];

  // Which pairs need measurement?
  const measurementNeeded = initialEstimates.filter(
    (e) => e.decision === 'measurement-needed' || e.decision === 'non-compliant-act',
  );

  function getSegName(id: string) { return segs.find((s) => s.id === id)?.name ?? id; }
  function getSubstanceName(id: string) { return substances.find((s) => s.id === id)?.productName ?? id; }

  function startAdd() {
    const firstSeg = segs[0]?.id ?? '';
    const firstSub = substances[0]?.id ?? '';
    setDraft(emptyPlan(firstSeg, firstSub));
    setEditingId('__new__');
  }

  function cancel() { setEditingId(null); setDraft(null); }

  function save() {
    if (!draft) return;
    if (editingId === '__new__') {
      onUpdate({ measurementPlans: [...measurementPlans, draft] });
    } else {
      onUpdate({ measurementPlans: measurementPlans.map((p) => (p.id === draft.id ? draft : p)) });
    }
    cancel();
  }

  function remove(id: string) {
    onUpdate({ measurementPlans: measurementPlans.filter((p) => p.id !== id) });
    if (editingId === id) cancel();
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
                Stel per SEG × stof een formeel meetplan op conform NEN-EN 689 §5.2 en EN 482.
                Leg vast: type meting, meetmethode, laboratorium, aantal metingen en planning.
              </p>
          }
        </InlineEdit>
      </div>

      {/* Summary from step 4 */}
      {measurementNeeded.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800/40 dark:bg-amber-900/15">
          <p className="mb-2 text-xs font-semibold text-amber-800 dark:text-amber-300">
            Uit stap 4 — combinaties waarvoor meting gepland/vereist is:
          </p>
          <div className="space-y-1">
            {measurementNeeded.map((e) => {
              const task = tasks.find((t) => t.id === e.taskId);
              const sub = substances.find((s) => s.id === e.substanceId);
              return (
                <div key={`${e.taskId}-${e.substanceId}`} className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400">
                  <span className={`rounded-full px-1.5 py-0.5 font-bold ${e.decision === 'non-compliant-act' ? 'bg-red-200 text-red-700 dark:bg-red-900/40 dark:text-red-400' : 'bg-amber-200 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'}`}>
                    {e.decision === 'non-compliant-act' ? 'DIRECT' : 'METEN'}
                  </span>
                  <span>{task?.description} × {sub?.productName} (Band {e.tier1.band})</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* NEN-EN 689 guidance */}
      <div className="rounded-lg bg-zinc-50 p-4 text-xs text-zinc-600 dark:bg-zinc-800/50 dark:text-zinc-400">
        <p className="font-semibold mb-2">NEN-EN 689 richtlijnen voor aantal metingen:</p>
        <ul className="space-y-1 list-disc list-inside">
          <li><strong>3–5 metingen:</strong> preliminary test — alleen bij lage blootstelling of als startselectie</li>
          <li><strong>≥ 6 metingen:</strong> volledige statistische toets (Bijlage F, IHSTAT/BWStat)</li>
          <li>Monstername bij voorkeur als <strong>persoonlijk monster in de ademzone</strong></li>
          <li>Meet tijdens <strong>verwachte hoogste blootstelling</strong> (worst-case strategie)</li>
        </ul>
      </div>

      {/* Plans list */}
      {measurementPlans.length > 0 && (
        <div className="space-y-3">
          {measurementPlans.map((p) => (
            <div key={p.id}>
              {editingId === p.id && draft ? (
                <PlanForm plan={draft} segs={segs} substances={substances} onChange={setDraft} onCancel={cancel} onSave={save} />
              ) : (
                <div className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-zinc-50 px-5 py-4 dark:border-zinc-700 dark:bg-zinc-800/50">
                  <div className="min-w-0">
                    <p className="font-semibold text-zinc-900 dark:text-zinc-50">
                      {getSegName(p.segId)} × {getSubstanceName(p.substanceId)}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                      <span>{p.measurementType === '8h-tgg' ? '8-uurs TGG' : p.measurementType === '15min' ? '15-min STEL' : 'Plafond'}</span>
                      <span>{p.plannedCount} metingen gepland</span>
                      {p.method && <span>Methode: {p.method}</span>}
                      {p.lab && <span>Lab: {p.lab}</span>}
                      {p.plannedDate && <span>Datum: {p.plannedDate}</span>}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => { setDraft({ ...p }); setEditingId(p.id); }}
                      leftIcon={<Icon name="pencil" size="xs" />}
                    >
                      Bewerken
                    </Button>
                    <Button
                      variant="danger"
                      size="xs"
                      onClick={() => remove(p.id)}
                      leftIcon={<Icon name="trash" size="xs" />}
                    >
                      Verwijderen
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {editingId === '__new__' && draft && (
        <PlanForm plan={draft} segs={segs} substances={substances} onChange={setDraft} onCancel={cancel} onSave={save} />
      )}

      {editingId === null && (
        <Button
          variant="dashed"
          className="w-full justify-center py-4"
          onClick={startAdd}
          disabled={segs.length === 0 || substances.length === 0}
          leftIcon={<Icon name="plus" size="sm" />}
        >
          Meetplan toevoegen
        </Button>
      )}

      {segs.length === 0 && (
        <p className="text-center text-sm text-zinc-400 dark:text-zinc-500">
          Voeg eerst SEG&apos;s toe in stap 5 voordat u meetplannen kunt aanmaken.
        </p>
      )}
    </div>
  );
}
