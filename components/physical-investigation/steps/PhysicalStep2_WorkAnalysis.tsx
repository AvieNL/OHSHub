'use client';

import { useState } from 'react';
import type { PhysicalInvestigation, PhysicalBG } from '@/lib/physical-investigation-types';
import { newPhysicalId } from '@/lib/physical-investigation-storage';
import { InfoBox } from '@/components/InfoBox';
import { Button, Card, FieldLabel, FormGrid, Icon, Input, Select, Textarea } from '@/components/ui';
import InlineStepHeader from '@/components/InlineStepHeader';
import InlineEdit from '@/components/InlineEdit';
import MarkdownContent from '@/components/MarkdownContent';

const STEP_KEY = 'step.2';
const NS = 'investigation.physical-load';
const FALLBACK_TITLE = 'Stap 3 — Belastingsgroepen';
const FALLBACK_DESC = 'Definieer groepen medewerkers met vergelijkbare fysieke belasting. Per groep worden de tiltaken, houdingen en andere belastingtypen afzonderlijk beoordeeld.';
const FALLBACK_IB0_TITLE = 'Belastingsgroepen conform ISO 11228-1 §7.1';

interface Props {
  investigation: PhysicalInvestigation;
  onUpdate: (partial: Partial<PhysicalInvestigation>) => void;
  contentOverrides?: Record<string, string>;
}

function BGForm({
  bg,
  onSave,
  onCancel,
}: {
  bg: Partial<PhysicalBG>;
  onSave: (bg: PhysicalBG) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<Partial<PhysicalBG>>(bg);

  function handleSave() {
    if (!draft.name?.trim()) return;
    onSave({
      id: draft.id ?? newPhysicalId(),
      name: draft.name.trim(),
      description: draft.description,
      jobTitle: draft.jobTitle,
      workerCount: draft.workerCount ?? 1,
      workHoursPerDay: draft.workHoursPerDay ?? 8,
      gender: draft.gender,
      notes: draft.notes,
    });
  }

  return (
    <Card variant="form">
      <h4 className="mb-4 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
        {draft.id ? 'Belastingsgroep bewerken' : 'Nieuwe belastingsgroep'}
      </h4>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <FieldLabel>
            Naam belastingsgroep <span className="text-red-500">*</span>
          </FieldLabel>
          <Input
            type="text"
            value={draft.name ?? ''}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            placeholder="Bijv. Magazijnmedewerkers tillen, Productiemedewerkers assemblage"
            autoFocus
          />
        </div>
        <div>
          <FieldLabel>Functietitel</FieldLabel>
          <Input
            type="text"
            value={draft.jobTitle ?? ''}
            onChange={(e) => setDraft({ ...draft, jobTitle: e.target.value })}
            placeholder="Bijv. Orderpicker, Montagemedewerker"
          />
        </div>
        <div>
          <FieldLabel>Aantal medewerkers</FieldLabel>
          <Input
            type="number"
            min={1}
            value={draft.workerCount ?? ''}
            onChange={(e) => setDraft({ ...draft, workerCount: parseInt(e.target.value) || 1 })}
          />
        </div>
        <div>
          <FieldLabel>Effectieve werkdag (uren)</FieldLabel>
          <Input
            type="number"
            min={1}
            max={12}
            step={0.5}
            value={draft.workHoursPerDay ?? ''}
            onChange={(e) => setDraft({ ...draft, workHoursPerDay: parseFloat(e.target.value) || 8 })}
          />
        </div>
        <div>
          <FieldLabel>Geslachtssamenstelling</FieldLabel>
          <Select
            value={draft.gender ?? ''}
            onChange={(e) => setDraft({ ...draft, gender: (e.target.value || undefined) as PhysicalBG['gender'] })}
          >
            <option value="">Onbekend / gemengd</option>
            <option value="mixed">Gemengd (man &amp; vrouw)</option>
            <option value="male">Overwegend mannen</option>
            <option value="female">Overwegend vrouwen</option>
          </Select>
        </div>
        <div className="sm:col-span-2">
          <FieldLabel>Beschrijving taken</FieldLabel>
          <Textarea
            rows={2}
            value={draft.description ?? ''}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            placeholder="Beschrijf de taken en werksituatie van deze groep"
          />
        </div>
        <div className="sm:col-span-2">
          <FieldLabel>Opmerkingen</FieldLabel>
          <Input
            type="text"
            value={draft.notes ?? ''}
            onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
            placeholder="Aanvullende informatie"
          />
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={!draft.name?.trim()}
        >
          Opslaan
        </Button>
        <Button variant="secondary" onClick={onCancel}>
          Annuleren
        </Button>
      </div>
    </Card>
  );
}

export default function PhysicalStep2_WorkAnalysis({ investigation, onUpdate, contentOverrides }: Props) {
  const title = contentOverrides?.[`${STEP_KEY}.title`] ?? FALLBACK_TITLE;
  const desc = contentOverrides?.[`${STEP_KEY}.desc`];
  const ib0Title = contentOverrides?.[`${STEP_KEY}.infobox.0.title`] ?? FALLBACK_IB0_TITLE;
  const ib0Content = contentOverrides?.[`${STEP_KEY}.infobox.0.content`];
  const { bgs } = investigation;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);

  function saveBG(bg: PhysicalBG) {
    const exists = bgs.find((b) => b.id === bg.id);
    if (exists) {
      onUpdate({ bgs: bgs.map((b) => (b.id === bg.id ? bg : b)) });
    } else {
      onUpdate({ bgs: [...bgs, bg] });
    }
    setEditingId(null);
    setShowNewForm(false);
  }

  function removeBG(id: string) {
    onUpdate({
      bgs: bgs.filter((b) => b.id !== id),
      // Remove all tasks associated with this BG
      liftingTasks: investigation.liftingTasks.filter((t) => t.bgId !== id),
      carryingTasks: investigation.carryingTasks.filter((t) => t.bgId !== id),
      pushPullTasks: investigation.pushPullTasks.filter((t) => t.bgId !== id),
      repetitiveTasks: investigation.repetitiveTasks.filter((t) => t.bgId !== id),
      postureObservations: investigation.postureObservations.filter((t) => t.bgId !== id),
      forceTasks: investigation.forceTasks.filter((t) => t.bgId !== id),
      statistics: investigation.statistics.filter((s) => s.bgId !== id),
    });
  }

  const GENDER_LABEL: Record<string, string> = {
    male: 'Overwegend mannen',
    female: 'Overwegend vrouwen',
    mixed: 'Gemengd',
  };

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
                Definieer groepen medewerkers met vergelijkbare fysieke belasting. Per groep
                worden de tiltaken, houdingen en andere belastingtypen afzonderlijk beoordeeld.
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
                Groepeer medewerkers die{' '}
                <abbr title="Vergelijkbare fysieke belasting in aard, intensiteit en duur" className="cursor-help underline decoration-dotted decoration-zinc-400 underline-offset-2">
                  vergelijkbare fysieke belasting
                </abbr>{' '}
                uitvoeren (vergelijkbaar aan{' '}
                <abbr title="Homogene Exposure Group — groep medewerkers met vergelijkbare blootstelling" className="cursor-help underline decoration-dotted decoration-zinc-400 underline-offset-2">HEG</abbr>{' '}
                bij geluid). Taken met duidelijk verschillende belastingprofielen (bijv. tillen vs. duwen)
                kunnen beter als aparte groepen worden geanalyseerd, ook als het dezelfde medewerkers zijn.
              </>
          }
        </InlineEdit>
      </InfoBox>

      {/* BG list */}
      {bgs.length > 0 && (
        <div className="space-y-3">
          {bgs.map((bg, idx) => (
            <div key={bg.id}>
              {editingId === bg.id ? (
                <BGForm bg={bg} onSave={saveBG} onCancel={() => setEditingId(null)} />
              ) : (
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/30">
                  <div className="flex items-center justify-between gap-4 px-4 py-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                          {idx + 1}
                        </span>
                        <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">{bg.name}</p>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-3 pl-8 text-xs text-zinc-400 dark:text-zinc-500">
                        {bg.jobTitle && <span>{bg.jobTitle}</span>}
                        <span>{bg.workerCount} medewerker{bg.workerCount !== 1 ? 's' : ''}</span>
                        <span>{bg.workHoursPerDay} uur/dag</span>
                        {bg.gender && <span>{GENDER_LABEL[bg.gender]}</span>}
                      </div>
                      {bg.description && (
                        <p className="mt-1 pl-8 text-xs text-zinc-400 dark:text-zinc-500 line-clamp-1">{bg.description}</p>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button
                        variant="ghost"
                        size="xs"
                        leftIcon={<Icon name="pencil" size="xs" />}
                        onClick={() => setEditingId(bg.id)}
                      >
                        Bewerken
                      </Button>
                      <Button
                        variant="danger"
                        size="xs"
                        leftIcon={<Icon name="trash" size="xs" />}
                        onClick={() => removeBG(bg.id)}
                      >
                        Verwijderen
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* New BG form */}
      {showNewForm ? (
        <BGForm
          bg={{}}
          onSave={saveBG}
          onCancel={() => setShowNewForm(false)}
        />
      ) : (
        <Button
          variant="dashed"
          className="w-full"
          onClick={() => setShowNewForm(true)}
        >
          <Icon name="plus" size="sm" />
          Belastingsgroep toevoegen
        </Button>
      )}

      {bgs.length === 0 && !showNewForm && (
        <p className="text-center text-sm text-zinc-400 dark:text-zinc-500">
          Voeg minimaal één belastingsgroep toe om verder te gaan.
        </p>
      )}
    </div>
  );
}
