'use client';

import { useState, useEffect, useRef } from 'react';
import type {
  ClimateInvestigation,
  ClimateMeasure,
  ClimateMeasureType,
  ClimateMeasureStatus,
} from '@/lib/climate-investigation-types';
import { newClimateId } from '@/lib/climate-investigation-storage';
import { computeAllClimateStatistics } from '@/lib/climate-stats';
import { Abbr } from '@/components/Abbr';

interface Props {
  investigation: ClimateInvestigation;
  onUpdate: (partial: Partial<ClimateInvestigation>) => void;
}

const TYPE_META: Record<ClimateMeasureType, { label: string; prio: string }> = {
  technical:      { label: 'Technische maatregel',       prio: 'Prioriteit 1' },
  organisational: { label: 'Organisatorische maatregel', prio: 'Prioriteit 2' },
  ppe:            { label: 'Persoonlijke bescherming',   prio: 'Prioriteit 3' },
  monitoring:     { label: 'Monitoring / bewaking',      prio: 'Monitoring'   },
};

const TYPE_PRIORITY: Record<ClimateMeasureType, 1 | 2 | 3> = {
  technical:      1,
  organisational: 2,
  ppe:            3,
  monitoring:     3,
};

const TYPE_COLORS: Record<ClimateMeasureType, { border: string; badge: string }> = {
  technical:      { border: 'border-l-red-400 dark:border-l-red-600',       badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  organisational: { border: 'border-l-amber-400 dark:border-l-amber-500',   badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  ppe:            { border: 'border-l-blue-400 dark:border-l-blue-500',     badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  monitoring:     { border: 'border-l-violet-400 dark:border-l-violet-500', badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' },
};

const STATUS_META: Record<ClimateMeasureStatus, { label: string; color: string }> = {
  planned:       { label: 'Gepland', color: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400' },
  'in-progress': { label: 'Loopt',   color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  completed:     { label: 'Gereed',  color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
};

// Suggesties per scenario
type ClimateVerdictKey = 'heat-exceeds' | 'heat-caution' | 'heat-phs-danger' | 'cold-danger' | 'cold-cool' | 'comfort-D' | 'local-D';

const SUGGESTIONS: Record<ClimateVerdictKey, Array<{ type: ClimateMeasureType; text: string }>> = {
  'heat-exceeds': [
    { type: 'technical',      text: 'HVAC-capaciteit verhogen of koelinstallatie plaatsen om WBGT onder de referentiewaarde te brengen (ISO 7243:2017).' },
    { type: 'technical',      text: 'Stralingswarmte afschermen met hittebestendige schermen of reflecterend materiaal.' },
    { type: 'organisational', text: 'Roulatieschema opstellen: beperk blootstelling conform PHS D_lim met voldoende herstelperiodes in koele ruimte (ISO 7933:2023).' },
    { type: 'organisational', text: 'Acclimatisatieprotocol invoeren voor nieuwe medewerkers (1–2 weken progressieve blootstelling).' },
    { type: 'ppe',            text: 'Koelvest of koelende beschermkleding ter beschikking stellen als aanvullende maatregel na technische en organisatorische maatregelen.' },
    { type: 'monitoring',     text: 'Continue WBGT-bewaking instellen met alarmdrempel op 90% van WBGTref; resultaten vastleggen in werkplekinventarisatie.' },
  ],
  'heat-caution': [
    { type: 'organisational', text: 'Extra pauzemomenten inplannen in koele ruimte bij warm weer of bij hogere activiteit.' },
    { type: 'monitoring',     text: 'Periodiek WBGT meten bij warm seizoen of gewijzigde productieomstandigheden.' },
  ],
  'heat-phs-danger': [
    { type: 'technical',      text: 'Onmiddellijke koeling van de werkruimte realiseren — PHS-analyse toont acuut hitteletselrisico (D_lim < 60 min).' },
    { type: 'organisational', text: 'Werkzaamheden tijdelijk staken of naar koelere omgeving verplaatsen totdat technische maatregelen zijn getroffen.' },
    { type: 'ppe',            text: 'Persoonlijke koeling (koelvest, neckkoeler) direct inzetten als overbruggende maatregel.' },
  ],
  'cold-danger': [
    { type: 'technical',      text: 'Werkplek verwarmen of windafschermingen plaatsen om effectieve temperatuur boven IREQmin te brengen (ISO 11079:2007).' },
    { type: 'organisational', text: 'Blootstelling direct beperken tot maximaal 30 minuten — werknemerkleding is onvoldoende voor thermisch evenwicht.' },
    { type: 'ppe',            text: 'Thermische beschermkleding (I_cl ≥ IREQneutral) direct ter beschikking stellen.' },
    { type: 'monitoring',     text: 'Kerntemperatuur bewaken bij langdurige blootstelling aan extreme kou.' },
  ],
  'cold-cool': [
    { type: 'organisational', text: 'Werkroulatie met verwarmingspauzes invoeren conform D_lim (ISO 11079:2007).' },
    { type: 'ppe',            text: 'Thermisch ondergoed of geïsoleerde werkkleding ter beschikking stellen om I_cl te verhogen naar IREQneutral.' },
  ],
  'comfort-D': [
    { type: 'technical',      text: 'HVAC-installatie controleren en afstellen op set-point binnen de PMV-cat. B grenzen (ISO 7730:2025).' },
    { type: 'technical',      text: 'Thermostaten, zonnewering of ventilatiedebiet aanpassen om operatieve temperatuur in comfortzone te brengen.' },
    { type: 'monitoring',     text: 'PMV/PPD monitoren na aanpassingen; resultaten opnemen in periodieke comfortbeoordeling.' },
  ],
  'local-D': [
    { type: 'technical',      text: 'Tocht reduceren: luchtuitlaten herpositioneren, tochtschermen plaatsen of luchtsnelheid reduceren (ISO 7730:2025 §6.2).' },
    { type: 'technical',      text: 'Stralingsasymmetrie reduceren: isolatie van koude wanden, zonwering bij warm glas, stralingskachel vervangen.' },
    { type: 'technical',      text: 'Vloertemperatuur corrigeren via vloerverwarming of geïsoleerde vloerbedekking.' },
  ],
};

function buildAutoMeasures(inv: ClimateInvestigation): ClimateMeasure[] {
  const statistics = computeAllClimateStatistics(inv);
  if (statistics.length === 0) return [];

  const allBgIds = inv.bgs.map((b) => b.id);
  const result: ClimateMeasure[] = [];

  // Determine worst verdicts across all BGs
  const hasHeatExceeds   = statistics.some((s) => s.wbgtVerdict === 'exceeds');
  const hasHeatCaution   = statistics.some((s) => s.wbgtVerdict === 'caution');
  const hasPHSDanger     = statistics.some((s) => s.phsVerdict === 'danger');
  const hasColdDanger    = statistics.some((s) => s.ireqVerdict === 'danger');
  const hasColdCool      = statistics.some((s) => s.ireqVerdict === 'cool');
  const hasComfortD      = statistics.some((s) => s.pmvCategory === 'D');
  const hasLocalD        = statistics.some((s) =>
    s.drCategory === 'D' || s.verticalTempCategory === 'D' || s.floorTempCategory === 'D',
  );

  function add(key: ClimateVerdictKey, bgIds: string[]) {
    (SUGGESTIONS[key] ?? []).forEach((s) => {
      result.push({
        id: newClimateId(),
        type: s.type,
        description: s.text,
        bgIds,
        priority: TYPE_PRIORITY[s.type],
        status: 'planned',
      });
    });
  }

  if (hasPHSDanger)    add('heat-phs-danger', allBgIds);
  else if (hasHeatExceeds) add('heat-exceeds', allBgIds);
  else if (hasHeatCaution) add('heat-caution', allBgIds);

  if (hasColdDanger) add('cold-danger', allBgIds);
  else if (hasColdCool) add('cold-cool', allBgIds);

  if (hasComfortD) add('comfort-D', allBgIds);
  if (hasLocalD)   add('local-D', allBgIds);

  return result;
}

function MeasureForm({
  measure,
  bgs,
  onSave,
  onCancel,
}: {
  measure: ClimateMeasure;
  bgs: ClimateInvestigation['bgs'];
  onSave: (m: ClimateMeasure) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState(measure);

  function upd(partial: Partial<ClimateMeasure>) {
    setForm((prev) => ({ ...prev, ...partial }));
  }

  function toggleBG(id: string) {
    const has = form.bgIds.includes(id);
    upd({ bgIds: has ? form.bgIds.filter((b) => b !== id) : [...form.bgIds, id] });
  }

  return (
    <div className="space-y-4 rounded-xl border border-orange-200 bg-orange-50/50 p-5 dark:border-orange-800/50 dark:bg-orange-900/10">
      {/* Type */}
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Type maatregel (Arbeidshygiënische Strategie)
        </label>
        <div className="space-y-1.5">
          {(Object.keys(TYPE_META) as ClimateMeasureType[]).map((t) => (
            <label key={t} className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="radio"
                checked={form.type === t}
                onChange={() => upd({ type: t, priority: TYPE_PRIORITY[t] })}
                className="accent-orange-500"
              />
              <span className="text-zinc-800 dark:text-zinc-200">
                {TYPE_META[t].label}
                <span className="ml-2 text-xs text-zinc-400">{TYPE_META[t].prio}</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Omschrijving maatregel
        </label>
        <textarea
          rows={3}
          value={form.description}
          onChange={(e) => upd({ description: e.target.value })}
          placeholder="Beschrijf de concrete maatregel…"
          className="w-full resize-none rounded-lg border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>

      {/* BGs */}
      {bgs.length > 0 && (
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Van toepassing op blootstellingsgroepen
          </label>
          <div className="flex flex-wrap gap-2">
            {bgs.map((bg) => (
              <label key={bg.id} className="flex cursor-pointer items-center gap-1.5 text-xs">
                <input
                  type="checkbox"
                  checked={form.bgIds.includes(bg.id)}
                  onChange={() => toggleBG(bg.id)}
                  className="accent-orange-500"
                />
                <span className="text-zinc-700 dark:text-zinc-300">{bg.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Status / responsible / deadline / notes */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Status</label>
          <select
            value={form.status}
            onChange={(e) => upd({ status: e.target.value as ClimateMeasureStatus })}
            className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          >
            {(Object.keys(STATUS_META) as ClimateMeasureStatus[]).map((s) => (
              <option key={s} value={s}>{STATUS_META[s].label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Verantwoordelijke</label>
          <input
            type="text"
            value={form.responsible ?? ''}
            onChange={(e) => upd({ responsible: e.target.value })}
            placeholder="Naam / functie"
            className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Streefdatum</label>
          <input
            type="date"
            value={form.deadline ?? ''}
            onChange={(e) => upd({ deadline: e.target.value })}
            className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Notities</label>
          <input
            type="text"
            value={form.notes ?? ''}
            onChange={(e) => upd({ notes: e.target.value })}
            placeholder="Aanvullende opmerkingen…"
            className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onSave(form)}
          disabled={!form.description.trim()}
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

export default function ClimateStep11_Measures({ investigation, onUpdate }: Props) {
  const { measures, bgs } = investigation;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [noStatsWarning, setNoStatsWarning] = useState(false);
  const autoPopulatedRef = useRef(false);

  const bgMap = Object.fromEntries(bgs.map((b) => [b.id, b.name]));
  const allBgIds = bgs.map((b) => b.id);

  function applyGenerated(inv: ClimateInvestigation) {
    const auto = buildAutoMeasures(inv);
    if (auto.length === 0) {
      setNoStatsWarning(true);
    } else {
      setNoStatsWarning(false);
      onUpdate({ measures: auto });
    }
  }

  useEffect(() => {
    if (autoPopulatedRef.current || measures.length > 0) return;
    autoPopulatedRef.current = true;
    applyGenerated(investigation);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function saveMeasure(updated: ClimateMeasure) {
    const exists = measures.some((m) => m.id === updated.id);
    const newList = exists
      ? measures.map((m) => (m.id === updated.id ? updated : m))
      : [...measures, updated];
    onUpdate({ measures: newList });
    setEditingId(null);
    setShowNew(false);
  }

  function removeMeasure(id: string) {
    onUpdate({ measures: measures.filter((m) => m.id !== id) });
  }

  const typeOrder: ClimateMeasureType[] = ['technical', 'organisational', 'ppe', 'monitoring'];
  const sorted = [...measures].sort((a, b) =>
    a.priority !== b.priority
      ? a.priority - b.priority
      : typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Stap 12 — Beheersmaatregelen
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            Maatregelen zijn automatisch voorgesteld op basis van het beoordelingsresultaat,
            conform de Arbeidshygiënische Strategie (technisch → organisatorisch →{' '}
            <Abbr id="PBM">PBM</Abbr>). Pas de omschrijving, verantwoordelijke en deadline aan.
          </p>
        </div>
        <button
          onClick={() => applyGenerated(investigation)}
          title="Verwijder huidige maatregelen en genereer opnieuw op basis van meetresultaten"
          className="shrink-0 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:border-orange-400 hover:text-orange-600 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-orange-500 dark:hover:text-orange-400"
        >
          ↺ Opnieuw genereren
        </button>
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap gap-2 text-xs">
        {(Object.keys(TYPE_META) as ClimateMeasureType[]).map((t) => (
          <span key={t} className={`rounded-full px-2.5 py-1 font-medium ${TYPE_COLORS[t].badge}`}>
            {TYPE_META[t].prio} — {TYPE_META[t].label}
          </span>
        ))}
      </div>

      {/* Maatregelenlijst */}
      {sorted.length > 0 && (
        <div className="space-y-3">
          {sorted.map((m) => (
            <div key={m.id}>
              {editingId === m.id ? (
                <MeasureForm
                  measure={m}
                  bgs={bgs}
                  onSave={saveMeasure}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <div className={`rounded-xl border border-l-4 bg-white p-4 dark:bg-zinc-900 ${TYPE_COLORS[m.type].border} border-zinc-200 dark:border-zinc-700`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${TYPE_COLORS[m.type].badge}`}>
                          {TYPE_META[m.type].prio}
                        </span>
                        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                          {TYPE_META[m.type].label}
                        </span>
                        <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${STATUS_META[m.status].color}`}>
                          {STATUS_META[m.status].label}
                        </span>
                        {m.deadline && (
                          <span className="text-xs text-zinc-400">
                            Deadline: {new Date(m.deadline).toLocaleDateString('nl-NL')}
                          </span>
                        )}
                      </div>
                      <p className="mt-1.5 text-sm text-zinc-800 dark:text-zinc-200">{m.description}</p>
                      <div className="mt-1 flex flex-wrap gap-3 text-xs text-zinc-400">
                        {m.responsible && <span>Verantw.: {m.responsible}</span>}
                        {m.bgIds.length > 0 && (
                          <span>BG: {m.bgIds.map((id) => bgMap[id] ?? id).join(', ')}</span>
                        )}
                        {m.notes && <span>{m.notes}</span>}
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button
                        onClick={() => setEditingId(m.id)}
                        className="rounded border border-zinc-200 px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-700"
                      >
                        Bewerken
                      </button>
                      <button
                        onClick={() => removeMeasure(m.id)}
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
      )}

      {/* Nieuw formulier */}
      {showNew ? (
        <MeasureForm
          measure={{
            id: newClimateId(),
            type: 'technical',
            description: '',
            bgIds: allBgIds,
            priority: 1,
            status: 'planned',
          }}
          bgs={bgs}
          onSave={saveMeasure}
          onCancel={() => setShowNew(false)}
        />
      ) : (
        <button
          onClick={() => setShowNew(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 py-4 text-sm text-zinc-500 transition hover:border-orange-400 hover:text-orange-600 dark:border-zinc-600 dark:text-zinc-400 dark:hover:border-orange-500 dark:hover:text-orange-400"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Maatregel toevoegen
        </button>
      )}

      {measures.length === 0 && !showNew && (
        noStatsWarning ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-700/40 dark:bg-amber-900/20 dark:text-amber-300">
            Geen meetresultaten beschikbaar. Voer eerst meetwaarden in (stap 6) en doorloop de
            berekende stappen (7–11) voordat maatregelen kunnen worden gegenereerd.
          </div>
        ) : (
          <p className="text-center text-xs text-zinc-400">
            Geen maatregelen. Gebruik ↺ Opnieuw genereren of voeg handmatig een maatregel toe.
          </p>
        )
      )}
    </div>
  );
}
