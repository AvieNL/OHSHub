'use client';

import { useState } from 'react';
import type { SoundInvestigation, SoundHEG, SoundStrategy, WorkPattern } from '@/lib/sound-investigation-types';
import { newSoundId } from '@/lib/sound-investigation-storage';
import { Abbr } from '@/components/Abbr';
import { Formula } from '@/components/Formula';
import { Badge, Button, Card, FieldLabel, FormGrid, Icon, Input, Select, Textarea } from '@/components/ui';
import InlineStepHeader from '@/components/InlineStepHeader';
import InlineEdit from '@/components/InlineEdit';
import MarkdownContent from '@/components/MarkdownContent';

interface Props {
  investigation: SoundInvestigation;
  onUpdate: (partial: Partial<SoundInvestigation>) => void;
  onGoToStep: (step: number) => void;
  contentOverrides?: Record<string, string>;
}

const STEP_KEY = 'step.2';
const NS = 'investigation.sound';
const FALLBACK_TITLE = 'Stap 3 — Werkanalyse';
const FALLBACK_DESC = 'Stel Homogene Blootstellingsgroepen (HEG) vast. Een HEG omvat medewerkers die dezelfde soort werk uitvoeren en daardoor vergelijkbare geluidsblootstelling hebben.';

const WORK_PATTERNS: { value: WorkPattern; label: string }[] = [
  { value: 'stationary-simple',          label: 'Vaste werkplek — eenvoudige of enkelvoudige taak' },
  { value: 'stationary-complex',         label: 'Vaste werkplek — meerdere of complexe taken' },
  { value: 'mobile-predictable-small',   label: 'Mobiele medewerker — voorspelbaar patroon, weinig taken' },
  { value: 'mobile-predictable-large',   label: 'Mobiele medewerker — voorspelbaar patroon, veel/complexe taken' },
  { value: 'mobile-unpredictable',       label: 'Mobiele medewerker — onvoorspelbaar werkpatroon' },
  { value: 'multiple-tasks-unspecified', label: 'Meerdere taken — taaklengtes onbekend of variabel' },
  { value: 'no-tasks-assigned',          label: 'Geen vaste taken toegewezen' },
  { value: 'unspecified',                label: 'Niet nader bepaald' },
];

const STRATEGY_LABELS: Record<SoundStrategy, string> = {
  'task-based': 'Strategie 1 — Taakgericht (§9)',
  'job-based':  'Strategie 2 — Functiegericht (§10)',
  'full-day':   'Strategie 3 — Volledigedagmeting (§11)',
};

const GROUPING_CRITERIA_OPTIONS = [
  { value: '',                   label: '— selecteer criterium —' },
  { value: 'job-title',          label: 'Functietitel / beroepsprofiel' },
  { value: 'work-area',          label: 'Werkzone / afdeling' },
  { value: 'production-process', label: 'Productieproces of activiteit' },
  { value: 'profession',         label: 'Beroep of vak' },
  { value: 'other',              label: 'Combinatie / anders' },
];

function HEGForm({
  heg,
  onSave,
  onCancel,
  onGoToStep,
}: {
  heg: SoundHEG;
  onSave: (h: SoundHEG) => void;
  onCancel: () => void;
  onGoToStep: (step: number) => void;
}) {
  const [form, setForm] = useState(heg);

  function upd(partial: Partial<SoundHEG>) {
    setForm((prev) => ({ ...prev, ...partial }));
  }

  return (
    <Card variant="form">
      <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        {form.id && heg.name ? `HEG bewerken: ${heg.name}` : 'Nieuwe HEG toevoegen'}
      </h4>

      {/* Identificatie */}
      <FormGrid>
        <div>
          <FieldLabel>Naam HEG <span className="text-red-500">*</span></FieldLabel>
          <Input
            type="text"
            value={form.name}
            onChange={(e) => upd({ name: e.target.value })}
            placeholder="Bijv. Lassers hal 3"
            className="w-full"
          />
        </div>
        <div>
          <FieldLabel>Functie / beroepsprofiel</FieldLabel>
          <Input
            type="text"
            value={form.jobTitle ?? ''}
            onChange={(e) => upd({ jobTitle: e.target.value })}
            placeholder="Bijv. Constructielasser MIG/MAG"
            className="w-full"
          />
        </div>
        <div>
          <FieldLabel>Indelingscriterium HEG</FieldLabel>
          <Select
            value={form.groupingCriteria ?? ''}
            onChange={(e) => upd({ groupingCriteria: e.target.value || undefined })}
            className="w-full"
          >
            {GROUPING_CRITERIA_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
        </div>
        <div>
          <FieldLabel>Aantal medewerkers in de HEG</FieldLabel>
          <Input
            type="number"
            min={1}
            value={form.workerCount || ''}
            onChange={(e) => upd({ workerCount: parseInt(e.target.value) || 1 })}
            className="w-24"
          />
        </div>
        <div>
          <FieldLabel>
            Effectieve werkdag <Formula math="T_e" /> (uur)
          </FieldLabel>
          <Input
            type="number"
            min={0.25}
            max={16}
            step={0.25}
            value={form.effectiveDayHours || ''}
            onChange={(e) => upd({ effectiveDayHours: parseFloat(e.target.value) || 8 })}
            className="w-24"
          />
          <p className="mt-0.5 text-xs text-zinc-400"><Formula math="T_0" /> = 8 uur (referentieduur)</p>
        </div>
      </FormGrid>

      {/* Werkpatroon & strategie */}
      <div>
        <FieldLabel>Werkpatroon</FieldLabel>
        <Select
          value={form.workPattern ?? 'unspecified'}
          onChange={(e) => upd({ workPattern: e.target.value as WorkPattern })}
        >
          {WORK_PATTERNS.map((wp) => (
            <option key={wp.value} value={wp.value}>{wp.label}</option>
          ))}
        </Select>
      </div>

      <div>
        <FieldLabel>
          Voorkeursstrategie (kan worden gewijzigd in{' '}
          <button type="button" onClick={() => onGoToStep(3)} className="cursor-pointer underline decoration-dotted underline-offset-2 hover:no-underline">stap 4</button>)
        </FieldLabel>
        <div className="flex flex-wrap gap-2">
          {(['task-based', 'job-based', 'full-day'] as SoundStrategy[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => upd({ strategy: s })}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                form.strategy === s
                  ? 'border-orange-400 bg-orange-50 text-orange-700 dark:border-orange-600 dark:bg-orange-900/20 dark:text-orange-300'
                  : 'border-zinc-200 text-zinc-500 hover:border-zinc-300 dark:border-zinc-700 dark:text-zinc-400'
              }`}
            >
              {STRATEGY_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Werkanalyse-inhoud */}
      <div>
        <FieldLabel>Beschrijving werkzaamheden</FieldLabel>
        <Textarea
          rows={2}
          value={form.workDescription ?? ''}
          onChange={(e) => upd({ workDescription: e.target.value })}
          placeholder="Beschrijf welke werkzaamheden de medewerkers in deze HEG uitvoeren…"
          className="w-full"
        />
      </div>

      <div>
        <FieldLabel>Geluidsbronnen</FieldLabel>
        <Textarea
          rows={2}
          value={form.noiseSources ?? ''}
          onChange={(e) => upd({ noiseSources: e.target.value })}
          placeholder="Beschrijf de aanwezige geluidsbronnen en blootstellingssituatie…"
          className="w-full"
        />
      </div>

      <div>
        <FieldLabel>Beschrijving nominale werkdag</FieldLabel>
        <Textarea
          rows={3}
          value={form.nominalDayDescription ?? ''}
          onChange={(e) => upd({ nominalDayDescription: e.target.value })}
          placeholder="Beschrijf de typische werkdag: welke taken, in welke volgorde, hoe lang (inclusief pauzes en niet-blootgestelde periodes)…"
          className="w-full"
        />
      </div>

      {/* Piekgebeurtenissen & audiologie */}
      <div className="flex flex-wrap gap-4">
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.hasPeakEvents ?? false}
            onChange={(e) => upd({ hasPeakEvents: e.target.checked })}
            className="accent-orange-500"
          />
          <span className="text-zinc-700 dark:text-zinc-300">
            Significante piekgebeurtenissen aanwezig
          </span>
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.tinnitusReported ?? false}
            onChange={(e) => upd({ tinnitusReported: e.target.checked })}
            className="accent-orange-500"
          />
          <span className="text-zinc-700 dark:text-zinc-300">
            Tinnitus of gehoorklachten gemeld <span className="text-zinc-400">(Richtlijn SHT 2020)</span>
          </span>
        </label>
      </div>

      {form.hasPeakEvents && (
        <div>
          <FieldLabel>Beschrijving piekgebeurtenissen</FieldLabel>
          <Textarea
            rows={2}
            value={form.peakEventsDescription ?? ''}
            onChange={(e) => upd({ peakEventsDescription: e.target.value })}
            placeholder="Bijv. pneumatisch slaan, schoten, klapgeluiden — aard, duur en dagelijkse frequentie…"
            className="w-full"
          />
        </div>
      )}

      <div className="flex gap-2">
        <Button
          variant="primary"
          onClick={() => { if (form.name.trim()) onSave(form); }}
          disabled={!form.name.trim()}
        >
          Opslaan
        </Button>
        <Button variant="secondary" onClick={onCancel}>Annuleren</Button>
      </div>
    </Card>
  );
}

export default function SoundStep2_WorkAnalysis({ investigation, onUpdate, onGoToStep, contentOverrides }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const { hegs } = investigation;

  function saveHEG(updated: SoundHEG) {
    const exists = hegs.some((h) => h.id === updated.id);
    const newList = exists
      ? hegs.map((h) => (h.id === updated.id ? updated : h))
      : [...hegs, updated];
    onUpdate({ hegs: newList });
    setEditingId(null);
  }

  function removeHEG(id: string) {
    onUpdate({
      hegs: hegs.filter((h) => h.id !== id),
      tasks: investigation.tasks.filter((t) => t.hegId !== id),
      measurements: investigation.measurements.filter((m) => m.hegId !== id),
      statistics: investigation.statistics.filter((s) => s.hegId !== id),
    });
  }

  function newHEG(): SoundHEG {
    return {
      id: newSoundId(),
      name: '',
      workerCount: 1,
      effectiveDayHours: 8,
      strategy: 'task-based',
    };
  }

  const title = contentOverrides?.[`${STEP_KEY}.title`] ?? FALLBACK_TITLE;
  const desc = contentOverrides?.[`${STEP_KEY}.desc`];

  const newId = '__new__';
  const isAddingNew = editingId === newId;
  const [draftNew, setDraftNew] = useState<SoundHEG | null>(null);

  function startNew() {
    setDraftNew(newHEG());
    setEditingId(newId);
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
                Stel <Abbr id="HEG">Homogene Blootstellingsgroepen (HEG)</Abbr> vast. Een <Abbr id="HEG">HEG</Abbr> omvat
                medewerkers die dezelfde soort werk uitvoeren en daardoor vergelijkbare geluidsblootstelling hebben.
              </p>
          }
        </InlineEdit>
      </div>

      {/* HEG list */}
      <div className="space-y-4">
        {hegs.map((heg) => (
          <div key={heg.id}>
            {editingId === heg.id ? (
              <HEGForm heg={heg} onSave={saveHEG} onCancel={() => setEditingId(null)} onGoToStep={onGoToStep} />
            ) : (
              <Card>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-zinc-900 dark:text-zinc-50">{heg.name}</p>
                    {heg.jobTitle && (
                      <p className="mt-0.5 text-xs text-zinc-500">{heg.jobTitle}</p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-zinc-500">
                      <span>{heg.workerCount} medewerker{heg.workerCount !== 1 ? 's' : ''}</span>
                      <span>·</span>
                      <span><Formula math="T_e" /> = {heg.effectiveDayHours} uur</span>
                      {heg.hasPeakEvents && (
                        <>
                          <span>·</span>
                          <Badge variant="amber">⚡ Piekgebeurtenissen</Badge>
                        </>
                      )}
                      {heg.tinnitusReported && (
                        <>
                          <span>·</span>
                          <Badge variant="purple">⚕ Tinnitus/gehoorklachten</Badge>
                        </>
                      )}
                      <span>·</span>
                      <Badge variant="zinc" shape="square">{STRATEGY_LABELS[heg.strategy]}</Badge>
                    </div>
                    {heg.workDescription && (
                      <p className="mt-1.5 text-xs text-zinc-400 line-clamp-2">{heg.workDescription}</p>
                    )}
                    {heg.noiseSources && (
                      <p className="mt-0.5 text-xs text-zinc-400 line-clamp-1">{heg.noiseSources}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="xs" onClick={() => setEditingId(heg.id)}>
                      Bewerken
                    </Button>
                    <Button variant="danger" size="xs" onClick={() => removeHEG(heg.id)}>
                      Verwijderen
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>
        ))}
      </div>

      {/* Add new HEG */}
      {isAddingNew && draftNew ? (
        <HEGForm
          heg={draftNew}
          onSave={saveHEG}
          onCancel={() => { setEditingId(null); setDraftNew(null); }}
          onGoToStep={onGoToStep}
        />
      ) : (
        <Button
          variant="dashed"
          onClick={startNew}
          className="py-4"
          leftIcon={<Icon name="plus" size="sm" />}
        >
          <Abbr id="HEG">HEG</Abbr> (Homogene Blootstellingsgroep) toevoegen
        </Button>
      )}

      {hegs.length === 0 && !isAddingNew && (
        <p className="text-center text-sm text-zinc-400 dark:text-zinc-500">
          Voeg minimaal één <Abbr id="HEG">HEG</Abbr> toe om door te gaan naar{' '}
          <button type="button" onClick={() => onGoToStep(3)} className="cursor-pointer underline decoration-dotted underline-offset-2 hover:no-underline">stap 4</button>.
        </p>
      )}
    </div>
  );
}
