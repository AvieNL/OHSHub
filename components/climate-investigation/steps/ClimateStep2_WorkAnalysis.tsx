'use client';

import { useState } from 'react';
import type { ClimateInvestigation, ClimateBG, MetabolicClass } from '@/lib/climate-investigation-types';
import { METABOLIC_CLASSES, CLOTHING_PRESETS } from '@/lib/climate-investigation-types';
import { newClimateId } from '@/lib/climate-investigation-storage';
import { getMetabolicRate } from '@/lib/climate-stats';
import { Abbr } from '@/components/Abbr';
import { InfoBox } from '@/components/InfoBox';

interface Props {
  investigation: ClimateInvestigation;
  onUpdate: (partial: Partial<ClimateInvestigation>) => void;
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
    <div className="space-y-4 rounded-xl border border-orange-200 bg-orange-50/50 p-5 dark:border-orange-800/50 dark:bg-orange-900/10">
      <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        {form.name ? `BG bewerken: ${form.name}` : 'Nieuwe blootstellingsgroep toevoegen'}
      </h4>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Naam BG <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => upd({ name: e.target.value })}
            placeholder="Bijv. Assemblagemedewerkers hal A"
            className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Functie / beroepsprofiel
          </label>
          <input
            type="text"
            value={form.jobTitle ?? ''}
            onChange={(e) => upd({ jobTitle: e.target.value })}
            placeholder="Bijv. Assemblagemedewerker"
            className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Aantal medewerkers
          </label>
          <input
            type="number"
            min={1}
            value={form.workerCount || ''}
            onChange={(e) => upd({ workerCount: parseInt(e.target.value) || 1 })}
            className="w-24 rounded-lg border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Effectieve werkdag (uur)
          </label>
          <input
            type="number"
            min={0.5}
            max={16}
            step={0.5}
            value={form.workHoursPerDay || ''}
            onChange={(e) => upd({ workHoursPerDay: parseFloat(e.target.value) || 8 })}
            className="w-24 rounded-lg border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
      </div>

      {/* Metabolic class */}
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Metabole klasse (<Abbr id="ISO7243">ISO 8996</Abbr> / ISO 7243 Tabel A.1)
        </label>
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
            <input
              type="number"
              min={58}
              max={800}
              step={10}
              value={form.metabolicRateOverride ?? ''}
              onChange={(e) => upd({ metabolicRateOverride: parseFloat(e.target.value) || undefined })}
              placeholder={`${METABOLIC_CLASSES[form.metabolicClass].rate}`}
              className="w-28 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
            <span className="text-xs text-zinc-400">W/m² — effectief: <strong>{effectiveRate} W/m²</strong></span>
          </div>
        </div>
      </div>

      {/* Clothing */}
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Kledinginsulatie I_cl (clo) — ISO 9920
        </label>
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
            <input
              type="number"
              min={0}
              max={5}
              step={0.1}
              value={form.clothingInsulation || ''}
              onChange={(e) => upd({ clothingInsulation: parseFloat(e.target.value) || 0 })}
              className="w-20 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
            <span className="text-xs text-zinc-400">clo</span>
          </div>
        </div>
        <div className="mt-2">
          <input
            type="text"
            value={form.clothingDescription ?? ''}
            onChange={(e) => upd({ clothingDescription: e.target.value })}
            placeholder="Omschrijving kleding (bijv. overall + shirt)"
            className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
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
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Beschrijving werkzaamheden / toelichting
        </label>
        <textarea
          rows={2}
          value={form.description ?? ''}
          onChange={(e) => upd({ description: e.target.value })}
          placeholder="Omschrijf de werkzaamheden en werkomstandigheden…"
          className="w-full resize-none rounded-lg border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => { if (form.name.trim()) onSave(form); }}
          disabled={!form.name.trim()}
          className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-40"
        >
          Opslaan
        </button>
        <button
          onClick={onCancel}
          className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          Annuleren
        </button>
      </div>
    </div>
  );
}

export default function ClimateStep2_WorkAnalysis({ investigation, onUpdate }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftNew, setDraftNew] = useState<ClimateBG | null>(null);
  const { bgs } = investigation;
  const newId = '__new__';

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
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Stap 3 — Werkanalyse
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          Definieer Blootstellingsgroepen (<Abbr id="BG">BG</Abbr>&apos;s) — groepen medewerkers met vergelijkbare thermische
          blootstelling. Stel per BG de metabole belasting en kledinginsulatie in.
        </p>
      </div>

      <InfoBox title="ISO 7243:2017 / ISO 7730:2025 — Werkanalyse">
        Per blootstellingsgroep worden vastgesteld: de metabole belasting M (W/m²) conform{' '}
        <Abbr id="ISO7243">ISO 8996</Abbr>, de kledinginsulatie I_cl (clo) conform ISO 9920,
        het werkrooster en de acclimatisatiestatus. Deze gegevens zijn basis voor alle berekeningen
        (<Abbr id="PMV">PMV</Abbr>, <Abbr id="WBGT">WBGT</Abbr>, <Abbr id="IREQ">IREQ</Abbr>).
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
                    <button
                      onClick={() => setEditingId(bg.id)}
                      className="rounded border border-zinc-200 px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-700"
                    >
                      Bewerken
                    </button>
                    <button
                      onClick={() => removeBG(bg.id)}
                      className="rounded border border-zinc-200 px-2 py-1 text-xs text-zinc-500 hover:bg-red-50 hover:text-red-500 dark:border-zinc-700"
                    >
                      Verwijderen
                    </button>
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
        <button
          onClick={startNew}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 py-4 text-sm text-zinc-500 transition hover:border-orange-400 hover:text-orange-600 dark:border-zinc-600 dark:text-zinc-400 dark:hover:border-orange-500 dark:hover:text-orange-400"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <Abbr id="BG">Blootstellingsgroep</Abbr> (BG) toevoegen
        </button>
      )}

      {bgs.length === 0 && editingId !== newId && (
        <p className="text-center text-sm text-zinc-400 dark:text-zinc-500">
          Voeg minimaal één BG toe om door te gaan.
        </p>
      )}
    </div>
  );
}
