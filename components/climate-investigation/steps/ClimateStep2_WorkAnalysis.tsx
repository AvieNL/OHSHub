'use client';

import { useState } from 'react';
import type { ClimateInvestigation, ClimateBG, MetabolicClass } from '@/lib/climate-investigation-types';
import { METABOLIC_CLASSES, CLOTHING_PRESETS } from '@/lib/climate-investigation-types';
import { newClimateId } from '@/lib/climate-investigation-storage';
import { getMetabolicRate } from '@/lib/climate-stats';
import { Abbr } from '@/components/Abbr';
import { InfoBox } from '@/components/InfoBox';
import { Button, Card, FieldLabel, Icon, Input, Textarea } from '@/components/ui';
import InlineStepHeader from '@/components/InlineStepHeader';
import InlineEdit from '@/components/InlineEdit';
import MarkdownContent from '@/components/MarkdownContent';

const STEP_KEY = 'step.2';
const NS = 'investigation.climate';
const FALLBACK_TITLE = 'Stap 3 — Werkanalyse';
const FALLBACK_DESC = "Definieer Blootstellingsgroepen (BG's) — groepen medewerkers met vergelijkbare thermische blootstelling. Stel per BG de metabole belasting en kledinginsulatie in.";

const FALLBACK_IB0_TITLE = 'ISO 7243:2017 / ISO 7730:2025 — Werkanalyse';

interface Props {
  investigation: ClimateInvestigation;
  onUpdate: (partial: Partial<ClimateInvestigation>) => void;
  contentOverrides?: Record<string, string>;
}

function BGForm({
  bg,
  onSave,
  onCancel,
}: {
  bg: ClimateBG;
  onSave: (b: ClimateBG) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState(bg);

  function upd(partial: Partial<ClimateBG>) {
    setForm((prev) => ({ ...prev, ...partial }));
  }

  const effectiveRate = getMetabolicRate(form);

  return (
    <Card variant="form">
      <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        {form.name ? `BG bewerken: ${form.name}` : 'Nieuwe blootstellingsgroep toevoegen'}
      </h4>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <FieldLabel>Naam BG <span className="text-red-500">*</span></FieldLabel>
          <Input
            type="text"
            value={form.name}
            onChange={(e) => upd({ name: e.target.value })}
            placeholder="Bijv. Assemblagemedewerkers hal A"
          />
        </div>
        <div>
          <FieldLabel>Functie / beroepsprofiel</FieldLabel>
          <Input
            type="text"
            value={form.jobTitle ?? ''}
            onChange={(e) => upd({ jobTitle: e.target.value })}
            placeholder="Bijv. Assemblagemedewerker"
          />
        </div>
        <div>
          <FieldLabel>Aantal medewerkers</FieldLabel>
          <Input
            type="number"
            min={1}
            value={form.workerCount || ''}
            onChange={(e) => upd({ workerCount: parseInt(e.target.value) || 1 })}
            className="w-24"
          />
        </div>
        <div>
          <FieldLabel>Effectieve werkdag (uur)</FieldLabel>
          <Input
            type="number"
            min={0.5}
            max={16}
            step={0.5}
            value={form.workHoursPerDay || ''}
            onChange={(e) => upd({ workHoursPerDay: parseFloat(e.target.value) || 8 })}
            className="w-24"
          />
        </div>
      </div>

      {/* Metabolic class */}
      <div>
        <FieldLabel>Metabole klasse (<Abbr id="ISO7243">ISO 8996</Abbr> / ISO 7243 Tabel A.1)</FieldLabel>
        <div className="space-y-2">
          {([0, 1, 2, 3, 4] as MetabolicClass[]).map((cls) => {
            const info = METABOLIC_CLASSES[cls];
            return (
              <button
                key={cls}
                type="button"
                onClick={() => upd({ metabolicClass: cls, metabolicRateOverride: undefined })}
                className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left transition ${
                  form.metabolicClass === cls && !form.metabolicRateOverride
                    ? 'border-orange-400 bg-orange-50 dark:border-orange-600 dark:bg-orange-900/20'
                    : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-700'
                }`}
              >
                <div className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                  form.metabolicClass === cls && !form.metabolicRateOverride
                    ? 'border-orange-500 bg-orange-500'
                    : 'border-zinc-300 dark:border-zinc-600'
                }`}>
                  {form.metabolicClass === cls && !form.metabolicRateOverride && (
                    <div className="h-1.5 w-1.5 rounded-full bg-white" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{info.label}</span>
                    <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs font-mono text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400">
                      {info.rate} W/m²
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{info.example}</p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-3">
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Handmatige override metabole belasting (W/m²) — laat leeg om klasse te gebruiken
          </label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={58}
              max={800}
              step={10}
              size="sm"
              value={form.metabolicRateOverride ?? ''}
              onChange={(e) => upd({ metabolicRateOverride: parseFloat(e.target.value) || undefined })}
              placeholder={`${METABOLIC_CLASSES[form.metabolicClass].rate}`}
              className="w-28"
            />
            <span className="text-xs text-zinc-400">W/m² — effectief: <strong>{effectiveRate} W/m²</strong></span>
          </div>
        </div>
      </div>

      {/* Clothing */}
      <div>
        <FieldLabel>Kledinginsulatie I_cl (clo) — ISO 9920</FieldLabel>
        <div className="mb-2 flex flex-wrap gap-2">
          {CLOTHING_PRESETS.map((p) => (
            <button
              key={p.clo}
              type="button"
              onClick={() => upd({ clothingInsulation: p.clo, clothingDescription: p.label })}
              className={`rounded-lg border px-2.5 py-1.5 text-xs transition ${
                form.clothingInsulation === p.clo
                  ? 'border-orange-400 bg-orange-50 text-orange-700 dark:border-orange-600 dark:bg-orange-900/20 dark:text-orange-300'
                  : 'border-zinc-200 text-zinc-500 hover:border-zinc-300 dark:border-zinc-700 dark:text-zinc-400'
              }`}
            >
              {p.clo} clo
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-zinc-500 dark:text-zinc-400">Handmatig:</label>
            <Input
              type="number"
              min={0}
              max={5}
              step={0.1}
              size="sm"
              value={form.clothingInsulation || ''}
              onChange={(e) => upd({ clothingInsulation: parseFloat(e.target.value) || 0 })}
              className="w-20"
            />
            <span className="text-xs text-zinc-400">clo</span>
          </div>
        </div>
        <div className="mt-2">
          <Input
            type="text"
            size="sm"
            value={form.clothingDescription ?? ''}
            onChange={(e) => upd({ clothingDescription: e.target.value })}
            placeholder="Omschrijving kleding (bijv. overall + shirt)"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.acclimatized ?? false}
            onChange={(e) => upd({ acclimatized: e.target.checked })}
            className="accent-orange-500"
          />
          <span className="text-zinc-700 dark:text-zinc-300">
            Groep is geacclimatiseerd aan warmte{' '}
            <span className="text-zinc-400">(ISO 7243 — hogere WBGTref)</span>
          </span>
        </label>
      </div>

      <div>
        <FieldLabel>Beschrijving werkzaamheden / toelichting</FieldLabel>
        <Textarea
          rows={2}
          value={form.description ?? ''}
          onChange={(e) => upd({ description: e.target.value })}
          placeholder="Omschrijf de werkzaamheden en werkomstandigheden…"
        />
      </div>

      <div className="flex gap-2">
        <Button
          variant="primary"
          onClick={() => { if (form.name.trim()) onSave(form); }}
          disabled={!form.name.trim()}
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

export default function ClimateStep2_WorkAnalysis({ investigation, onUpdate, contentOverrides }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftNew, setDraftNew] = useState<ClimateBG | null>(null);
  const { bgs } = investigation;
  const newId = '__new__';

  const title = contentOverrides?.[`${STEP_KEY}.title`] ?? FALLBACK_TITLE;
  const desc = contentOverrides?.[`${STEP_KEY}.desc`];
  const ib0Title = contentOverrides?.[`${STEP_KEY}.infobox.0.title`] ?? FALLBACK_IB0_TITLE;
  const ib0Content = contentOverrides?.[`${STEP_KEY}.infobox.0.content`];

  function newBG(): ClimateBG {
    return {
      id: newClimateId(),
      name: '',
      workerCount: 1,
      metabolicClass: 1,
      clothingInsulation: 1.0,
      workHoursPerDay: 8,
    };
  }

  function saveBG(updated: ClimateBG) {
    const exists = bgs.some((b) => b.id === updated.id);
    onUpdate({ bgs: exists ? bgs.map((b) => (b.id === updated.id ? updated : b)) : [...bgs, updated] });
    setEditingId(null);
    setDraftNew(null);
  }

  function removeBG(id: string) {
    onUpdate({
      bgs: bgs.filter((b) => b.id !== id),
      measurements: investigation.measurements.filter((m) => m.bgId !== id),
      statistics: investigation.statistics.filter((s) => s.bgId !== id),
    });
  }

  function startNew() {
    setDraftNew(newBG());
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
                Definieer Blootstellingsgroepen (<Abbr id="BG">BG</Abbr>&apos;s) — groepen medewerkers met vergelijkbare thermische
                blootstelling. Stel per BG de metabole belasting en kledinginsulatie in.
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
                Per blootstellingsgroep worden vastgesteld: de metabole belasting M (W/m²) conform{' '}
                <Abbr id="ISO7243">ISO 8996</Abbr>, de kledinginsulatie I_cl (clo) conform ISO 9920,
                het werkrooster en de acclimatisatiestatus. Deze gegevens zijn basis voor alle berekeningen
                (<Abbr id="PMV">PMV</Abbr>, <Abbr id="WBGT">WBGT</Abbr>, <Abbr id="IREQ">IREQ</Abbr>).
              </>
          }
        </InlineEdit>
      </InfoBox>

      {/* BG list */}
      <div className="space-y-4">
        {bgs.map((bg) => (
          <div key={bg.id}>
            {editingId === bg.id ? (
              <BGForm bg={bg} onSave={saveBG} onCancel={() => setEditingId(null)} />
            ) : (
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/30">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-zinc-900 dark:text-zinc-50">{bg.name}</p>
                    {bg.jobTitle && <p className="mt-0.5 text-xs text-zinc-500">{bg.jobTitle}</p>}
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-zinc-500">
                      <span>{bg.workerCount} medewerker{bg.workerCount !== 1 ? 's' : ''}</span>
                      <span>·</span>
                      <span>{bg.workHoursPerDay} uur/dag</span>
                      <span>·</span>
                      <span className="rounded bg-zinc-100 px-1.5 py-0.5 dark:bg-zinc-700">
                        M = {getMetabolicRate(bg)} W/m²{' '}
                        ({METABOLIC_CLASSES[bg.metabolicClass].label.split(' — ')[0]})
                      </span>
                      <span>·</span>
                      <span className="rounded bg-zinc-100 px-1.5 py-0.5 dark:bg-zinc-700">
                        I_cl = {bg.clothingInsulation} clo
                      </span>
                      {bg.acclimatized && (
                        <>
                          <span>·</span>
                          <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                            Geacclimatiseerd
                          </span>
                        </>
                      )}
                    </div>
                    {bg.description && (
                      <p className="mt-1.5 text-xs text-zinc-400">{bg.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="xs" onClick={() => setEditingId(bg.id)} leftIcon={<Icon name="pencil" size="xs" />}>
                      Bewerken
                    </Button>
                    <Button variant="danger" size="xs" onClick={() => removeBG(bg.id)} leftIcon={<Icon name="trash" size="xs" />}>
                      Verwijderen
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add new BG */}
      {editingId === newId && draftNew ? (
        <BGForm
          bg={draftNew}
          onSave={saveBG}
          onCancel={() => { setEditingId(null); setDraftNew(null); }}
        />
      ) : (
        <Button
          variant="dashed"
          className="w-full justify-center py-4"
          onClick={startNew}
          leftIcon={<Icon name="plus" size="sm" />}
        >
          <Abbr id="BG">Blootstellingsgroep</Abbr> (BG) toevoegen
        </Button>
      )}

      {bgs.length === 0 && editingId !== newId && (
        <p className="text-center text-sm text-zinc-400 dark:text-zinc-500">
          Voeg minimaal één BG toe om door te gaan.
        </p>
      )}
    </div>
  );
}
