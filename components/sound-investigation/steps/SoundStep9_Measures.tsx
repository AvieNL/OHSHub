'use client';

import { useState, useEffect, useRef } from 'react';
import type {
  SoundInvestigation,
  SoundMeasure,
  SoundMeasureType,
  SoundMeasureStatus,
  SoundActionLevel,
} from '@/lib/sound-investigation-types';
import { newSoundId } from '@/lib/sound-investigation-storage';
import { computeAllStatistics } from '@/lib/sound-stats';
import { Abbr } from '@/components/Abbr';

interface Props {
  investigation: SoundInvestigation;
  onUpdate: (partial: Partial<SoundInvestigation>) => void;
}

const TYPE_META: Record<SoundMeasureType, { label: string; prio: string }> = {
  substitution:   { label: 'Substitutie',                prio: 'Prioriteit 1' },
  technical:      { label: 'Technische maatregel',       prio: 'Prioriteit 2' },
  organisational: { label: 'Organisatorische maatregel', prio: 'Prioriteit 3' },
  ppe:            { label: 'Gehoorbescherming (PBM)',    prio: 'Prioriteit 4' },
  audiometry:     { label: 'Gehooronderzoek',            prio: 'Monitoring'   },
};

// Priority number per maatregel type
const TYPE_PRIORITY: Record<SoundMeasureType, 1 | 2 | 3 | 4 | 5> = {
  substitution:   1,
  technical:      2,
  organisational: 3,
  ppe:            4,
  audiometry:     5,
};

// Left-border color per maatregel type
const TYPE_COLORS: Record<SoundMeasureType, { border: string; badge: string }> = {
  substitution:   { border: 'border-l-red-400 dark:border-l-red-600',       badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'         },
  technical:      { border: 'border-l-orange-400 dark:border-l-orange-500', badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  organisational: { border: 'border-l-amber-400 dark:border-l-amber-500',   badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'   },
  ppe:            { border: 'border-l-blue-400 dark:border-l-blue-500',     badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'       },
  audiometry:     { border: 'border-l-violet-400 dark:border-l-violet-500', badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' },
};

const STATUS_META: Record<SoundMeasureStatus, { label: string; color: string }> = {
  planned:       { label: 'Gepland', color: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'             },
  'in-progress': { label: 'Loopt',   color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'      },
  completed:     { label: 'Gereed',  color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
};

// Suggested measures per action level — with Arbobesluit article references
const SUGGESTIONS: Partial<Record<SoundActionLevel, Array<{ type: SoundMeasureType; text: string }>>> = {
  lav: [
    { type: 'technical',      text: 'Maatregelenprogramma opstellen met technische en organisatorische maatregelen om geluidblootstelling te verminderen (art. 6.6 lid 1 sub a Arbobesluit).' },
    { type: 'ppe',            text: 'Gehoorbeschermers op verzoek ter beschikking stellen; zorg voor voldoende keuze en geschiktheid conform EN 458:2016 (art. 6.6 lid 1 sub b Arbobesluit).' },
    { type: 'organisational', text: 'Werknemers en hun vertegenwoordigers voorlichten over de geluidsrisico\'s, de beoordeling, maatregelen en het recht op audiometrisch onderzoek (art. 6.8 Arbobesluit).' },
    { type: 'audiometry',     text: 'Arbeidsgezondheidskundig onderzoek (audiometrie) aanbieden aan werknemers die dat wensen (art. 6.7 lid 1 Arbobesluit).' },
  ],
  uav: [
    { type: 'substitution',   text: 'Onderzoek naar een stiller productie- of werkproces als bronmaatregel (art. 6.6 lid 1 sub a Arbobesluit; Arbowet art. 3 lid 1b).' },
    { type: 'technical',      text: 'Technische maatregelen treffen: demping, afscherming, omhulsing of afstandsvergroting tot geluidsbron (art. 6.6 lid 1 sub a Arbobesluit).' },
    { type: 'organisational', text: 'Roulatieschema opstellen zodat individuele dagblootstelling onder de onderste actiewaarde van 80 dB(A) blijft (art. 6.6 lid 1 sub a Arbobesluit).' },
    { type: 'organisational', text: 'Ruimten waar de bovenste actiewaarde wordt overschreden aanduiden met geluidszoneborden; toegang beperken tot geautoriseerd personeel (art. 6.6 lid 1 sub c Arbobesluit).' },
    { type: 'ppe',            text: 'Passende gehoorbescherming beschikbaar stellen en het gebruik ervan actief bevorderen; selectie conform EN 458:2016 (art. 6.6 lid 1 sub b Arbobesluit).' },
    { type: 'organisational', text: 'Werknemers en hun vertegenwoordigers informeren en voorlichten over geluidsrisico\'s, de beoordeling, maatregelen en de audiometrieplicht (art. 6.8 Arbobesluit).' },
    { type: 'audiometry',     text: 'Arbeidsgezondheidskundig onderzoek (audiometrie) verplicht aanbieden via de bedrijfsarts (art. 6.7 lid 1 Arbobesluit).' },
  ],
  'above-elv': [
    { type: 'substitution',   text: 'Onmiddellijk onderzoek naar stiller productieproces of vervanging van lawaaiige arbeidsmiddelen — grenswaarde is overschreden (art. 6.6 lid 2 Arbobesluit jo. Arbowet art. 3 lid 1b).' },
    { type: 'technical',      text: 'Onmiddellijke technische maatregelen treffen (demping, afscherming, inkapseling) om blootstelling onder de grenswaarde van 87 dB(A) te brengen (art. 6.6 lid 2 Arbobesluit).' },
    { type: 'organisational', text: 'Werkzaamheden in de lawaaizone direct beperken of tijdelijk stilleggen totdat blootstelling onder de grenswaarde is gebracht (art. 6.6 lid 2 Arbobesluit).' },
    { type: 'ppe',            text: 'Gebruik van gehoorbescherming onmiddellijk verplicht stellen totdat de grenswaarde van 87 dB(A) niet langer wordt overschreden; selectie conform EN 458:2016 (art. 6.6 lid 2 Arbobesluit).' },
    { type: 'organisational', text: 'Werknemers onmiddellijk informeren over de overschrijding, de te nemen maatregelen en het recht op audiometrisch onderzoek (art. 6.8 Arbobesluit).' },
    { type: 'audiometry',     text: 'Onmiddellijk arbeidsgezondheidskundig onderzoek (audiometrie) uitvoeren voor alle blootgestelde werknemers via de bedrijfsarts (art. 6.7 lid 2 Arbobesluit).' },
  ],
};

const TINNITUS_DESCRIPTION =
  'Plan PAGO / gehooronderzoek bij bedrijfsarts voor werknemers die tinnitus of gehoorklachten hebben gemeld. ' +
  'Overweeg afname Tinnitus Handicap Inventory (THI) in het spreekuur ter gradering van de ernst (RL SHT 2020). ' +
  'Verwijscriteria: gehoorverlies > 35 dB of THI ≥ graad 3 → audiologisch centrum. Meld bij vermoede beroepsziekte: NCvB B001.';

const verdictOrder: SoundActionLevel[] = ['below-lav', 'lav', 'uav', 'above-elv'];

/** Build the auto-suggested measure list from current investigation data. */
function buildAutoMeasures(inv: SoundInvestigation): SoundMeasure[] {
  const freshStats = computeAllStatistics(inv);
  if (freshStats.length === 0) return [];

  const freshStatMap = new Map(freshStats.map((s) => [s.hegId, s]));

  const freshWorstVerdict = freshStats.reduce<SoundActionLevel>((worst, s) => {
    return verdictOrder.indexOf(s.verdict) > verdictOrder.indexOf(worst) ? s.verdict : worst;
  }, 'below-lav');

  const allHegIds = inv.hegs.map((h) => h.id);
  const tinnitusHegs = inv.hegs.filter((h) => h.tinnitusReported);

  const hegsWithPPE = inv.hegs.filter(
    (h) => h.ppeSNRUnknown || (h.ppeAttenuation != null && h.ppeAttenuation > 0),
  );
  const hegIdsWithPPE = new Set(hegsWithPPE.map((h) => h.id));
  const hegsWithoutPPE = inv.hegs.filter((h) => !hegIdsWithPPE.has(h.id));

  const result: SoundMeasure[] = [];

  // Generic suggestions — PPE suggestions only for HEGs without PPE data
  (SUGGESTIONS[freshWorstVerdict] ?? []).forEach((s) => {
    const targetIds =
      s.type === 'ppe' && hegsWithPPE.length > 0
        ? hegsWithoutPPE.map((h) => h.id)
        : allHegIds;
    if (targetIds.length === 0) return;
    result.push({
      id: newSoundId(),
      type: s.type,
      description: s.text,
      hegIds: targetIds,
      priority: TYPE_PRIORITY[s.type],
      status: 'planned',
    });
  });

  // PPE adequacy per HEG with known PPE data
  for (const heg of hegsWithPPE) {
    const stat = freshStatMap.get(heg.id);
    if (!stat) continue;

    const ppeName = heg.ppeNotes?.trim() || 'gehoorbeschermer';

    if (heg.ppeSNRUnknown) {
      result.push({
        id: newSoundId(),
        type: 'ppe',
        description: `HEG "${heg.name}": SNR van ${ppeName} is onbekend — vraag het productblad op bij de fabrikant en herbereken de dempingswaarde conform EN 458:2016.`,
        hegIds: [heg.id],
        priority: TYPE_PRIORITY.ppe,
        status: 'planned',
      });
      continue;
    }

    const attenuation = heg.ppeAttenuation ?? 0;
    const lOor = stat.lEx8h_95pct - attenuation;
    const lOorStr = lOor.toFixed(1);

    if (lOor > 87) {
      // Minimum APF to comply with ELV (87 dB) and recommended APF to reach below LAV (80 dB)
      const minAPF_ELV = Math.ceil(stat.lEx8h_95pct - 87);
      const minAPF_LAV = Math.ceil(stat.lEx8h_95pct - 80);
      result.push({
        id: newSoundId(),
        type: 'ppe',
        description:
          `HEG "${heg.name}": ${ppeName} (demping ${attenuation} dB) is onvoldoende — blootstelling aan het oor bedraagt ${lOorStr} dB(A), boven de grenswaarde van 87 dB(A). ` +
          `Vervangen door gehoorbeschermer met hogere dempingswaarde. ` +
          `Minimale APF: ${minAPF_ELV} dB (grenswaarde 87 dB(A)), aanbevolen APF: ${minAPF_LAV} dB (onder LAV 80 dB(A)). ` +
          `Op het productlabel (EN 458:2016 SNR-methode): SNR ≥ ${minAPF_ELV * 2} respectievelijk ≥ ${minAPF_LAV * 2} dB.`,
        hegIds: [heg.id],
        priority: TYPE_PRIORITY.ppe,
        status: 'planned',
      });
    } else if (lOor > 80) {
      // Minimum APF to bring exposure below LAV (80 dB)
      const minAPF_LAV = Math.ceil(stat.lEx8h_95pct - 80);
      result.push({
        id: newSoundId(),
        type: 'ppe',
        description:
          `HEG "${heg.name}": ${ppeName} (demping ${attenuation} dB) voldoet aan de grenswaarde (oor: ${lOorStr} dB(A)), maar blootstelling aan het oor overschrijdt de onderste actiewaarde van 80 dB(A). ` +
          `Voor blootstelling onder de LAV is een minimale APF van ${minAPF_LAV} dB vereist ` +
          `(SNR op productlabel ≥ ${minAPF_LAV * 2} dB conform EN 458:2016 SNR-methode).`,
        hegIds: [heg.id],
        priority: TYPE_PRIORITY.ppe,
        status: 'planned',
      });
    } else {
      result.push({
        id: newSoundId(),
        type: 'ppe',
        description: `HEG "${heg.name}": ${ppeName} (demping ${attenuation} dB) is geschikt — blootstelling aan het oor bedraagt ${lOorStr} dB(A), onder de onderste actiewaarde van 80 dB(A). Huidig type handhaven; jaarlijkse controle op conditie en juist gebruik.`,
        hegIds: [heg.id],
        priority: TYPE_PRIORITY.ppe,
        status: 'planned',
      });
    }
  }

  if (tinnitusHegs.length > 0) {
    result.push({
      id: newSoundId(),
      type: 'audiometry',
      description: TINNITUS_DESCRIPTION,
      hegIds: tinnitusHegs.map((h) => h.id),
      priority: TYPE_PRIORITY.audiometry,
      status: 'planned',
      notes: 'RL SHT 2020 (NVAB)',
    });
  }

  return result;
}

function MeasureForm({
  measure,
  hegs,
  onSave,
  onCancel,
}: {
  measure: SoundMeasure;
  hegs: SoundInvestigation['hegs'];
  onSave: (m: SoundMeasure) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState(measure);

  function upd(partial: Partial<SoundMeasure>) {
    setForm((prev) => ({ ...prev, ...partial }));
  }

  function toggleHeg(id: string) {
    const has = form.hegIds.includes(id);
    upd({ hegIds: has ? form.hegIds.filter((h) => h !== id) : [...form.hegIds, id] });
  }

  return (
    <div className="space-y-4 rounded-xl border border-orange-200 bg-orange-50/50 p-5 dark:border-orange-800/50 dark:bg-orange-900/10">
      {/* Type */}
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Type maatregel (Arbeidshygiënische Strategie)
        </label>
        <div className="space-y-1.5">
          {(Object.keys(TYPE_META) as SoundMeasureType[]).map((t) => (
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

      {/* HEGs */}
      {hegs.length > 0 && (
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Van toepassing op <Abbr id="HEG">HEG</Abbr>&apos;s
          </label>
          <div className="flex flex-wrap gap-2">
            {hegs.map((h) => (
              <label key={h.id} className="flex cursor-pointer items-center gap-1.5 text-xs">
                <input
                  type="checkbox"
                  checked={form.hegIds.includes(h.id)}
                  onChange={() => toggleHeg(h.id)}
                  className="accent-orange-500"
                />
                <span className="text-zinc-700 dark:text-zinc-300">{h.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Status / responsible / deadline */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Status</label>
          <select
            value={form.status}
            onChange={(e) => upd({ status: e.target.value as SoundMeasureStatus })}
            className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          >
            {(Object.keys(STATUS_META) as SoundMeasureStatus[]).map((s) => (
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

export default function SoundStep9_Measures({ investigation, onUpdate }: Props) {
  const { measures, hegs } = investigation;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [noStatsWarning, setNoStatsWarning] = useState(false);
  const autoPopulatedRef = useRef(false);

  const hegMap = Object.fromEntries(hegs.map((h) => [h.id, h.name]));
  const allHegIds = hegs.map((h) => h.id);

  function applyGenerated(inv: SoundInvestigation) {
    const auto = buildAutoMeasures(inv);
    if (auto.length === 0) {
      setNoStatsWarning(true);
    } else {
      setNoStatsWarning(false);
      onUpdate({ measures: auto });
    }
  }

  // Auto-populate on first mount when no measures exist yet
  useEffect(() => {
    if (autoPopulatedRef.current || measures.length > 0) return;
    autoPopulatedRef.current = true;
    applyGenerated(investigation);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function saveMeasure(updated: SoundMeasure) {
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

  // Sort by priority, then by type order within same priority
  const typeOrder: SoundMeasureType[] = ['substitution', 'technical', 'organisational', 'ppe', 'audiometry'];
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
            Stap 11 — Beheersmaatregelen
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            Maatregelen zijn automatisch voorgesteld op basis van het beoordelingsresultaat, conform de
            Arbeidshygiënische Strategie (substitutie → technisch → organisatorisch →{' '}
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

      {/* Legend */}
      <div className="flex flex-wrap gap-2 text-xs">
        {(Object.keys(TYPE_META) as SoundMeasureType[]).map((t) => (
          <span key={t} className={`rounded-full px-2.5 py-1 font-medium ${TYPE_COLORS[t].badge}`}>
            {TYPE_META[t].prio} — {TYPE_META[t].label}
          </span>
        ))}
      </div>

      {/* Measure list */}
      {sorted.length > 0 && (
        <div className="space-y-3">
          {sorted.map((m) => (
            <div key={m.id}>
              {editingId === m.id ? (
                <MeasureForm
                  measure={m}
                  hegs={hegs}
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
                          <span className="text-xs text-zinc-400">Deadline: {m.deadline}</span>
                        )}
                      </div>
                      <p className="mt-1.5 text-sm text-zinc-800 dark:text-zinc-200">{m.description}</p>
                      <div className="mt-1 flex flex-wrap gap-3 text-xs text-zinc-400">
                        {m.responsible && <span>Verantw.: {m.responsible}</span>}
                        {m.hegIds.length > 0 && (
                          <span><Abbr id="HEG">HEG</Abbr>: {m.hegIds.map((id) => hegMap[id] ?? id).join(', ')}</span>
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

      {/* New measure form */}
      {showNew ? (
        <MeasureForm
          measure={{
            id: newSoundId(),
            type: 'technical',
            description: '',
            hegIds: allHegIds,
            priority: TYPE_PRIORITY.technical,
            status: 'planned',
          }}
          hegs={hegs}
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
            Geen meetresultaten beschikbaar. Voer eerst metingen in (stap 8) en doorloop stap 9 (berekeningen) voordat maatregelen kunnen worden gegenereerd.
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
