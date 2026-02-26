'use client';

import { useState } from 'react';
import type { PhysicalInvestigation, PhysicalBG } from '@/lib/physical-investigation-types';
import { newPhysicalId } from '@/lib/physical-investigation-storage';
import { InfoBox } from '@/components/InfoBox';

interface Props {
  investigation: PhysicalInvestigation;
  onUpdate: (partial: Partial<PhysicalInvestigation>) => void;
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
  const INPUT = 'w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-orange-400';

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
    <div className="rounded-xl border border-orange-200 bg-orange-50/50 px-5 py-4 dark:border-orange-800/30 dark:bg-orange-900/10">
      <h4 className="mb-4 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
        {draft.id ? 'Belastingsgroep bewerken' : 'Nieuwe belastingsgroep'}
      </h4>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Naam belastingsgroep <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={draft.name ?? ''}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            placeholder="Bijv. Magazijnmedewerkers tillen, Productiemedewerkers assemblage"
            className={INPUT}
            autoFocus
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Functietitel</label>
          <input
            type="text"
            value={draft.jobTitle ?? ''}
            onChange={(e) => setDraft({ ...draft, jobTitle: e.target.value })}
            placeholder="Bijv. Orderpicker, Montagemedewerker"
            className={INPUT}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Aantal medewerkers</label>
          <input
            type="number"
            min={1}
            value={draft.workerCount ?? ''}
            onChange={(e) => setDraft({ ...draft, workerCount: parseInt(e.target.value) || 1 })}
            className={INPUT}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Effectieve werkdag (uren)</label>
          <input
            type="number"
            min={1}
            max={12}
            step={0.5}
            value={draft.workHoursPerDay ?? ''}
            onChange={(e) => setDraft({ ...draft, workHoursPerDay: parseFloat(e.target.value) || 8 })}
            className={INPUT}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Geslachtssamenstelling</label>
          <select
            value={draft.gender ?? ''}
            onChange={(e) => setDraft({ ...draft, gender: (e.target.value || undefined) as PhysicalBG['gender'] })}
            className={INPUT}
          >
            <option value="">Onbekend / gemengd</option>
            <option value="mixed">Gemengd (man &amp; vrouw)</option>
            <option value="male">Overwegend mannen</option>
            <option value="female">Overwegend vrouwen</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Beschrijving taken</label>
          <textarea
            rows={2}
            value={draft.description ?? ''}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            placeholder="Beschrijf de taken en werksituatie van deze groep"
            className={`${INPUT} resize-none`}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Opmerkingen</label>
          <input
            type="text"
            value={draft.notes ?? ''}
            onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
            placeholder="Aanvullende informatie"
            className={INPUT}
          />
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={!draft.name?.trim()}
          className="rounded-lg bg-orange-500 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-40"
        >
          Opslaan
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-zinc-200 px-4 py-1.5 text-sm text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          Annuleren
        </button>
      </div>
    </div>
  );
}

export default function PhysicalStep2_WorkAnalysis({ investigation, onUpdate }: Props) {
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
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Stap 3 — Belastingsgroepen
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          Definieer groepen medewerkers met vergelijkbare fysieke belasting. Per groep
          worden de tiltaken, houdingen en andere belastingtypen afzonderlijk beoordeeld.
        </p>
      </div>

      <InfoBox title="Belastingsgroepen conform ISO 11228-1 §7.1">
        Groepeer medewerkers die{' '}
        <abbr title="Vergelijkbare fysieke belasting in aard, intensiteit en duur" className="cursor-help underline decoration-dotted decoration-zinc-400 underline-offset-2">
          vergelijkbare fysieke belasting
        </abbr>{' '}
        uitvoeren (vergelijkbaar aan{' '}
        <abbr title="Homogene Exposure Group — groep medewerkers met vergelijkbare blootstelling" className="cursor-help underline decoration-dotted decoration-zinc-400 underline-offset-2">HEG</abbr>{' '}
        bij geluid). Taken met duidelijk verschillende belastingprofielen (bijv. tillen vs. duwen)
        kunnen beter als aparte groepen worden geanalyseerd, ook als het dezelfde medewerkers zijn.
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
                      <button
                        onClick={() => setEditingId(bg.id)}
                        className="text-xs text-zinc-400 hover:text-orange-600 dark:hover:text-orange-400"
                      >
                        Bewerken
                      </button>
                      <button
                        onClick={() => removeBG(bg.id)}
                        className="text-xs text-zinc-400 hover:text-red-500"
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
      )}

      {/* New BG form */}
      {showNewForm ? (
        <BGForm
          bg={{}}
          onSave={saveBG}
          onCancel={() => setShowNewForm(false)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setShowNewForm(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 py-4 text-sm font-medium text-zinc-500 transition hover:border-orange-400 hover:text-orange-600 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-orange-500 dark:hover:text-orange-400"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Belastingsgroep toevoegen
        </button>
      )}

      {bgs.length === 0 && !showNewForm && (
        <p className="text-center text-sm text-zinc-400 dark:text-zinc-500">
          Voeg minimaal één belastingsgroep toe om verder te gaan.
        </p>
      )}
    </div>
  );
}
