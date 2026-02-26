'use client';

import { useEffect, useState } from 'react';
import type { PhysicalInvestigation, PhysicalMeasure, PhysicalMeasureType, PhysicalMeasureStatus } from '@/lib/physical-investigation-types';
import { newPhysicalId } from '@/lib/physical-investigation-storage';
import { computeAllPhysicalStatistics, computeLiftingResult, computePushPullResult, computeRepetitiveResult } from '@/lib/physical-stats';
import { InfoBox } from '@/components/InfoBox';

interface Props {
  investigation: PhysicalInvestigation;
  onUpdate: (partial: Partial<PhysicalInvestigation>) => void;
}

const TYPE_LABELS: Record<PhysicalMeasureType, string> = {
  'technical':      'T — Technisch (mechanisatie, hulpmiddelen)',
  'organisational': 'O — Organisatorisch (roulatie, pauzes)',
  'ppe':            'P — Persoonlijk (rugsteun, polsbrace)',
  'training':       'V — Voorlichting & training',
};

const TYPE_PRIORITY: Record<PhysicalMeasureType, number> = {
  technical: 1, organisational: 2, ppe: 3, training: 3,
};

const STATUS_LABELS: Record<PhysicalMeasureStatus, string> = {
  'planned':     'Gepland',
  'in-progress': 'In uitvoering',
  'completed':   'Afgerond',
};

const STATUS_STYLES: Record<PhysicalMeasureStatus, string> = {
  'planned':     'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  'in-progress': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'completed':   'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
};

/**
 * Auto-generate control measures based on identified risks.
 */
function buildAutoMeasures(inv: PhysicalInvestigation): PhysicalMeasure[] {
  const measures: PhysicalMeasure[] = [];

  // Lifting
  for (const task of inv.liftingTasks) {
    const result = computeLiftingResult(task);
    if (result.verdict === 'high') {
      measures.push({
        id: newPhysicalId(),
        type: 'technical',
        description: `Mechaniseer of gebruik hulpmiddelen voor tiltaak "${task.taskName}" (LI = ${result.li} — zeer risicovol).`,
        bgIds: [task.bgId],
        priority: 1,
        status: 'planned',
      });
      if (result.riskFlags.length > 0) {
        measures.push({
          id: newPhysicalId(),
          type: 'organisational',
          description: `Beperk risicofactoren bij "${task.taskName}": ${result.riskFlags.join(', ')}.`,
          bgIds: [task.bgId],
          priority: 2,
          status: 'planned',
        });
      }
    } else if (result.verdict === 'moderate') {
      measures.push({
        id: newPhysicalId(),
        type: 'organisational',
        description: `Optimaliseer tiltaak "${task.taskName}" (LI = ${result.li}): pas werkhoogte, afstand of frequentie aan.`,
        bgIds: [task.bgId],
        priority: 2,
        status: 'planned',
      });
    }
  }

  // Push/pull
  for (const task of inv.pushPullTasks) {
    const result = computePushPullResult(task);
    if (result.verdict === 'high') {
      measures.push({
        id: newPhysicalId(),
        type: 'technical',
        description: `Verminder duw/trekkrachten bij "${task.taskName}": verbeter wieltjes, vloer of gebruik elektrisch aangedreven middel.`,
        bgIds: [task.bgId],
        priority: 1,
        status: 'planned',
      });
    }
  }

  // Repetitive
  for (const task of inv.repetitiveTasks) {
    const result = computeRepetitiveResult(task);
    if (result.verdict === 'high') {
      measures.push({
        id: newPhysicalId(),
        type: 'technical',
        description: `Herontwerp of automatiseer repetitieve taak "${task.taskName}" (OCRA: ${result.ocraScore} — ${result.verdictLabel}).`,
        bgIds: [task.bgId],
        priority: 1,
        status: 'planned',
      });
    } else if (result.verdict === 'moderate') {
      measures.push({
        id: newPhysicalId(),
        type: 'organisational',
        description: `Vergroot taakvariation en hersteltijd bij "${task.taskName}" (OCRA: ${result.ocraScore}).`,
        bgIds: [task.bgId],
        priority: 2,
        status: 'planned',
      });
    }
  }

  // Posture
  for (const obs of inv.postureObservations) {
    if (obs.verdict === 'not-acceptable') {
      measures.push({
        id: newPhysicalId(),
        type: 'technical',
        description: `Pas werkplek aan voor "${obs.taskName}" — ${obs.bodyPart} houding is niet acceptabel.`,
        bgIds: [obs.bgId],
        priority: 1,
        status: 'planned',
      });
    } else if (obs.verdict === 'conditionally') {
      measures.push({
        id: newPhysicalId(),
        type: 'organisational',
        description: `Varieer werkhouding bij "${obs.taskName}" — ${obs.bodyPart} belasting is voorwaardelijk acceptabel.`,
        bgIds: [obs.bgId],
        priority: 2,
        status: 'planned',
      });
    }
  }

  // Remove duplicates (same description + bgId)
  const seen = new Set<string>();
  return measures.filter((m) => {
    const key = m.description + m.bgIds.join(',');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function MeasureForm({
  measure,
  bgs,
  onSave,
  onCancel,
}: {
  measure: Partial<PhysicalMeasure>;
  bgs: PhysicalInvestigation['bgs'];
  onSave: (m: PhysicalMeasure) => void;
  onCancel: () => void;
}) {
  const [d, setD] = useState<Partial<PhysicalMeasure>>(measure);
  const INPUT = 'w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-orange-400';

  function save() {
    if (!d.description?.trim()) return;
    onSave({
      id: d.id ?? newPhysicalId(),
      type: d.type ?? 'technical',
      description: d.description.trim(),
      bgIds: d.bgIds ?? [],
      priority: d.priority ?? TYPE_PRIORITY[d.type ?? 'technical'] as 1 | 2 | 3,
      responsible: d.responsible,
      deadline: d.deadline,
      status: d.status ?? 'planned',
      notes: d.notes,
    });
  }

  return (
    <div className="rounded-xl border border-orange-200 bg-orange-50/50 px-4 py-4 dark:border-orange-800/30 dark:bg-orange-900/10">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Type maatregel</label>
          <select value={d.type ?? 'technical'} onChange={(e) => {
            const t = e.target.value as PhysicalMeasureType;
            setD({ ...d, type: t, priority: TYPE_PRIORITY[t] as 1 | 2 | 3 });
          }} className={INPUT}>
            {(Object.entries(TYPE_LABELS) as [PhysicalMeasureType, string][]).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Prioriteit (1–3)</label>
          <select value={d.priority ?? 1} onChange={(e) => setD({ ...d, priority: parseInt(e.target.value) as 1 | 2 | 3 })} className={INPUT}>
            <option value={1}>Prioriteit 1 — direct / hoge urgentie</option>
            <option value={2}>Prioriteit 2 — op korte termijn</option>
            <option value={3}>Prioriteit 3 — middellange termijn</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Omschrijving maatregel *</label>
          <input type="text" value={d.description ?? ''} onChange={(e) => setD({ ...d, description: e.target.value })} placeholder="Beschrijf de concrete maatregel" className={INPUT} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Belastingsgroepen</label>
          <div className="space-y-1">
            {bgs.map((bg) => (
              <label key={bg.id} className="flex cursor-pointer items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                <input
                  type="checkbox"
                  checked={(d.bgIds ?? []).includes(bg.id)}
                  onChange={(e) => {
                    const ids = d.bgIds ?? [];
                    setD({ ...d, bgIds: e.target.checked ? [...ids, bg.id] : ids.filter((id) => id !== bg.id) });
                  }}
                  className="h-3.5 w-3.5 rounded border-zinc-300 text-orange-500"
                />
                {bg.name}
              </label>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Verantwoordelijke</label>
            <input type="text" value={d.responsible ?? ''} onChange={(e) => setD({ ...d, responsible: e.target.value })} placeholder="Naam / functie" className={INPUT} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Streefdatum</label>
            <input type="date" value={d.deadline ?? ''} onChange={(e) => setD({ ...d, deadline: e.target.value })} className={INPUT} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Status</label>
            <select value={d.status ?? 'planned'} onChange={(e) => setD({ ...d, status: e.target.value as PhysicalMeasureStatus })} className={INPUT}>
              {(Object.entries(STATUS_LABELS) as [PhysicalMeasureStatus, string][]).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={save} disabled={!d.description?.trim()} className="rounded-lg bg-orange-500 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-40">Opslaan</button>
        <button type="button" onClick={onCancel} className="rounded-lg border border-zinc-200 px-4 py-1.5 text-sm text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800">Annuleren</button>
      </div>
    </div>
  );
}

export default function PhysicalStep9_Measures({ investigation, onUpdate }: Props) {
  const { bgs, measures } = investigation;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [autoGenerated, setAutoGenerated] = useState(false);

  useEffect(() => {
    if (measures.length === 0 && !autoGenerated) {
      const auto = buildAutoMeasures(investigation);
      if (auto.length > 0) {
        onUpdate({ measures: auto });
        setAutoGenerated(true);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function saveMeasure(m: PhysicalMeasure) {
    const exists = measures.find((x) => x.id === m.id);
    onUpdate({
      measures: exists ? measures.map((x) => (x.id === m.id ? m : x)) : [...measures, m],
    });
    setEditingId(null);
    setShowNewForm(false);
  }

  function regenerate() {
    const auto = buildAutoMeasures(investigation);
    onUpdate({ measures: [...measures, ...auto] });
  }

  const sorted = [...measures].sort((a, b) => a.priority - b.priority);
  const stats = computeAllPhysicalStatistics(investigation);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Stap 10 — Beheersmaatregelen
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          Definieer maatregelen op basis van de geïdentificeerde risico&apos;s.
          Volg de{' '}
          <abbr title="Arbeidshygiënische Strategie: T=Technisch, O=Organisatorisch, P=Persoonlijk" className="cursor-help underline decoration-dotted decoration-zinc-400 underline-offset-2">
            Arbeidshygiënische Strategie
          </abbr>: technische maatregelen (bron) gaan altijd voor organisatorische en persoonlijke maatregelen.
        </p>
      </div>

      <InfoBox title="Arbobesluit art. 5.3 — Beheersmaatregelen fysieke belasting">
        Als ergonomische risico&apos;s niet volledig kunnen worden vermeden, zijn maatregelen
        verplicht conform de Arbeidshygiënische Strategie:
        (1) Technisch — mechanisatie, hulpgereedschappen, aanpassing werkplek/hoogte;
        (2) Organisatorisch — taakroulatie, aangepaste werktijden, pauzes;
        (3) Persoonlijk — ergonomische training, gebruiksaanwijzingen.
        Persoonlijke beschermingsmiddelen (rugsteun) zijn geen substitutie voor bronmaatregelen.
      </InfoBox>

      {/* Risk overview */}
      {stats.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((s) => {
            const bg = bgs.find((b) => b.id === s.bgId);
            return (
              <div
                key={s.bgId}
                className={`rounded-xl border px-4 py-3 ${
                  s.overallVerdict === 'high' ? 'border-red-200 bg-red-50 dark:border-red-800/30 dark:bg-red-900/10' :
                  s.overallVerdict === 'moderate' ? 'border-amber-200 bg-amber-50 dark:border-amber-800/30 dark:bg-amber-900/10' :
                  'border-emerald-200 bg-emerald-50 dark:border-emerald-800/30 dark:bg-emerald-900/10'
                }`}
              >
                <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{bg?.name ?? s.bgId}</p>
                <p className={`mt-0.5 text-xs ${
                  s.overallVerdict === 'high' ? 'text-red-700 dark:text-red-400' :
                  s.overallVerdict === 'moderate' ? 'text-amber-700 dark:text-amber-400' :
                  'text-emerald-700 dark:text-emerald-400'
                }`}>
                  {s.overallVerdict === 'high' ? 'Hoog risico' :
                   s.overallVerdict === 'moderate' ? 'Matig risico' : 'Acceptabel'}
                  {s.maxLI != null && ` · LI max: ${s.maxLI}`}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setShowNewForm(true)}
          className="flex items-center gap-1.5 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Maatregel toevoegen
        </button>
        <button
          type="button"
          onClick={regenerate}
          className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          ↺ Auto-genereer maatregelen
        </button>
      </div>

      {showNewForm && (
        <MeasureForm measure={{}} bgs={bgs} onSave={saveMeasure} onCancel={() => setShowNewForm(false)} />
      )}

      {/* Measures list */}
      {sorted.length > 0 && (
        <div className="space-y-3">
          {sorted.map((m) => {
            const bgNames = bgs.filter((b) => m.bgIds.includes(b.id)).map((b) => b.name);
            return (
              <div key={m.id}>
                {editingId === m.id ? (
                  <MeasureForm measure={m} bgs={bgs} onSave={saveMeasure} onCancel={() => setEditingId(null)} />
                ) : (
                  <div className="flex items-start gap-4 rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900">
                    <div className={`mt-0.5 shrink-0 rounded px-2 py-0.5 text-xs font-bold ${
                      m.priority === 1 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                      m.priority === 2 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}>P{m.priority}</div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{m.description}</p>
                      <div className="mt-1 flex flex-wrap gap-3 text-xs text-zinc-400 dark:text-zinc-500">
                        <span>{m.type === 'technical' ? 'Technisch' : m.type === 'organisational' ? 'Organisatorisch' : m.type === 'ppe' ? 'Persoonlijk' : 'Voorlichting'}</span>
                        {bgNames.length > 0 && <span>{bgNames.join(', ')}</span>}
                        {m.responsible && <span>Verantw.: {m.responsible}</span>}
                        {m.deadline && <span>Deadline: {new Date(m.deadline).toLocaleDateString('nl-NL')}</span>}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[m.status]}`}>
                        {STATUS_LABELS[m.status]}
                      </span>
                      <button onClick={() => setEditingId(m.id)} className="text-xs text-zinc-400 hover:text-orange-600">Bewerken</button>
                      <button onClick={() => onUpdate({ measures: measures.filter((x) => x.id !== m.id) })} className="text-xs text-zinc-400 hover:text-red-500">Verwijderen</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {measures.length === 0 && !showNewForm && (
        <p className="text-center text-sm text-zinc-400 dark:text-zinc-500">
          Nog geen maatregelen. Gebruik &ldquo;Auto-genereer maatregelen&rdquo; of voeg handmatig toe.
        </p>
      )}
    </div>
  );
}
