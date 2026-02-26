'use client';

import { useState } from 'react';
import type { SoundInvestigation, SoundHEG, SoundStrategy, WorkPattern } from '@/lib/sound-investigation-types';
import { newSoundId } from '@/lib/sound-investigation-storage';
import { Abbr } from '@/components/Abbr';
import { Formula } from '@/components/Formula';
import { SectionRef } from '@/components/SectionRef';
import { InfoBox } from '@/components/InfoBox';

interface Props {
  investigation: SoundInvestigation;
  onUpdate: (partial: Partial<SoundInvestigation>) => void;
}

const WORK_PATTERNS: { value: WorkPattern; label: string }[] = [
  { value: 'stationary-simple',      label: 'Vaste werkplek — eenvoudige of enkelvoudige taak' },
  { value: 'stationary-complex',     label: 'Vaste werkplek — meerdere of complexe taken' },
  { value: 'mobile-predictable-small', label: 'Mobiele medewerker — voorspelbaar patroon, weinig taken' },
  { value: 'mobile-predictable-large', label: 'Mobiele medewerker — voorspelbaar patroon, veel/complexe taken' },
  { value: 'mobile-unpredictable',   label: 'Mobiele medewerker — onvoorspelbaar werkpatroon' },
  { value: 'unspecified',            label: 'Niet nader bepaald' },
];

const STRATEGY_LABELS: Record<SoundStrategy, string> = {
  'task-based': 'Strategie 1 — Taakgericht (§9)',
  'job-based':  'Strategie 2 — Functiegericht (§10)',
  'full-day':   'Strategie 3 — Volledigedagmeting (§11)',
};

function HEGForm({
  heg,
  onSave,
  onCancel,
}: {
  heg: SoundHEG;
  onSave: (h: SoundHEG) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState(heg);

  function upd(partial: Partial<SoundHEG>) {
    setForm((prev) => ({ ...prev, ...partial }));
  }

  return (
    <div className="space-y-4 rounded-xl border border-orange-200 bg-orange-50/50 p-5 dark:border-orange-800/50 dark:bg-orange-900/10">
      <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        {form.id && heg.name ? `HEG bewerken: ${heg.name}` : 'Nieuwe HEG toevoegen'}
      </h4>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Naam HEG <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => upd({ name: e.target.value })}
            placeholder="Bijv. Lassers hal 3"
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
            placeholder="Bijv. Constructielasser MIG/MAG"
            className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Aantal medewerkers in de HEG
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
            Effectieve werkdag <Formula math="T_e" /> (uur)
          </label>
          <input
            type="number"
            min={0.25}
            max={16}
            step={0.25}
            value={form.effectiveDayHours || ''}
            onChange={(e) => upd({ effectiveDayHours: parseFloat(e.target.value) || 8 })}
            className="w-24 rounded-lg border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
          <p className="mt-0.5 text-xs text-zinc-400"><Formula math="T_0" /> = 8 uur (referentieduur)</p>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Werkpatroon (<SectionRef id="§8">§8</SectionRef>, <SectionRef id="Bijlage B">Bijlage B</SectionRef> Tabel B.1)
        </label>
        <select
          value={form.workPattern ?? 'unspecified'}
          onChange={(e) => upd({ workPattern: e.target.value as WorkPattern })}
          className="rounded-lg border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        >
          {WORK_PATTERNS.map((wp) => (
            <option key={wp.value} value={wp.value}>{wp.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Voorkeursstrategie (kan worden gewijzigd in stap 3)
        </label>
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

      <div className="flex flex-wrap gap-4">
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.tinnitusReported ?? false}
            onChange={(e) => upd({ tinnitusReported: e.target.checked })}
            className="accent-orange-500"
          />
          <span className="text-zinc-700 dark:text-zinc-300">
            Tinnitus of gehoorklachten gemeld door werknemers <span className="text-zinc-400">(Richtlijn SHT 2020)</span>
          </span>
        </label>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Geluidsbronnen & werkomschrijving
        </label>
        <textarea
          rows={2}
          value={form.noiseSources ?? ''}
          onChange={(e) => upd({ noiseSources: e.target.value })}
          placeholder="Beschrijf de aanwezige geluidsbronnen en werksituatie…"
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

export default function SoundStep2_WorkAnalysis({ investigation, onUpdate }: Props) {
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
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Stap 3 — Werkanalyse (<SectionRef id="§7">§7</SectionRef> <Abbr id="NEN9612">NEN-EN-ISO 9612</Abbr>:2025)
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          Stel Homogene Blootstellingsgroepen (HBG / <Abbr id="HEG">HEG</Abbr>) vast. Een <Abbr id="HEG">HEG</Abbr> omvat medewerkers die
          dezelfde soort werk uitvoeren en daardoor vergelijkbare geluidsblootstelling hebben (<SectionRef id="§7.2">§7.2</SectionRef>).
        </p>
      </div>

      <InfoBox title="§7.2 — HEG-definitie">
        <SectionRef id="§7.2">§7.2</SectionRef>: Definieer voor elke <Abbr id="HEG">HEG</Abbr>: de samenstelling, het werkpatroon en de
        nominale werkdag (welke taken, hoe lang). De effectieve werkdag <Formula math="T_e" /> is de som van
        alle taaklengtes (<SectionRef id="§9.2">§9.2</SectionRef> Formule 2). <Formula math="T_0" /> = 8 uur is de referentieduur.
      </InfoBox>

      {/* HEG list */}
      <div className="space-y-4">
        {hegs.map((heg) => (
          <div key={heg.id}>
            {editingId === heg.id ? (
              <HEGForm heg={heg} onSave={saveHEG} onCancel={() => setEditingId(null)} />
            ) : (
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/30">
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
                      {heg.tinnitusReported && (
                        <>
                          <span>·</span>
                          <span className="rounded bg-purple-100 px-1.5 py-0.5 font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                            ⚕ Tinnitus/gehoorklachten
                          </span>
                        </>
                      )}
                      <span>·</span>
                      <span className="rounded bg-zinc-100 px-1.5 py-0.5 font-medium dark:bg-zinc-700">
                        {STRATEGY_LABELS[heg.strategy]}
                      </span>
                    </div>
                    {heg.noiseSources && (
                      <p className="mt-1.5 text-xs text-zinc-400">{heg.noiseSources}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingId(heg.id)}
                      className="rounded border border-zinc-200 px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-700"
                    >
                      Bewerken
                    </button>
                    <button
                      onClick={() => removeHEG(heg.id)}
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

      {/* Add new HEG */}
      {isAddingNew && draftNew ? (
        <HEGForm
          heg={draftNew}
          onSave={saveHEG}
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
          <Abbr id="HEG">HEG</Abbr> (Homogene Blootstellingsgroep) toevoegen
        </button>
      )}

      {hegs.length === 0 && !isAddingNew && (
        <p className="text-center text-sm text-zinc-400 dark:text-zinc-500">
          Voeg minimaal één <Abbr id="HEG">HEG</Abbr> toe om door te gaan naar stap 3.
        </p>
      )}
    </div>
  );
}
