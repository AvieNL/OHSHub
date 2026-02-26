'use client';

import { useState } from 'react';
import type { PhysicalInvestigation, PostureObservation, PostureBodyPart, PostureFrequency, PostureVerdict } from '@/lib/physical-investigation-types';
import { newPhysicalId } from '@/lib/physical-investigation-storage';
import { InfoBox } from '@/components/InfoBox';

interface Props {
  investigation: PhysicalInvestigation;
  onUpdate: (partial: Partial<PhysicalInvestigation>) => void;
}

const BODY_PART_LABELS: Record<PostureBodyPart, string> = {
  'trunk':       'Romp / rug',
  'neck-head':   'Nek / hoofd',
  'upper-arm':   'Bovenarm / schouder',
  'lower-arm':   'Onderarm / elleboog',
  'wrist-hand':  'Pols / hand',
  'whole-leg':   'Been / heup',
  'knee':        'Knielen / hurken',
};

const FREQ_LABELS: Record<PostureFrequency, string> = {
  'occasional': 'Incidenteel (< 1/3 taaktijd of < 4×/uur)',
  'frequent':   'Frequent (1/3–3/4 taaktijd of 4–15×/uur)',
  'static':     'Statisch / langdurig (> 3/4 taaktijd of > 15×/uur)',
};

const VERDICT_LABELS: Record<PostureVerdict, { label: string; color: string; bg: string; border: string }> = {
  'acceptable':    { label: 'Acceptabel',                 color: '#166534', bg: '#dcfce7', border: '#86efac' },
  'conditionally': { label: 'Voorwaardelijk acceptabel',  color: '#92400e', bg: '#fef9c3', border: '#fde68a' },
  'not-acceptable':{ label: 'Niet acceptabel',            color: '#991b1b', bg: '#fee2e2', border: '#fca5a5' },
};

/**
 * Simplified EN 1005-4 / ISO 11226 verdict heuristic.
 * Returns a verdict based on body part + static/frequency.
 */
function suggestVerdict(
  bodyPart: PostureBodyPart,
  isStatic: boolean,
  frequency: PostureFrequency,
  angle?: number,
): PostureVerdict {
  if (frequency === 'static' || (isStatic && frequency === 'frequent')) {
    // High exposure
    if (['trunk', 'neck-head', 'upper-arm', 'knee'].includes(bodyPart)) {
      return 'not-acceptable';
    }
    return 'conditionally';
  }
  if (frequency === 'frequent') {
    if (bodyPart === 'trunk' || bodyPart === 'neck-head') {
      return 'conditionally';
    }
  }
  // Additional angle-based hints
  if (angle != null) {
    if (bodyPart === 'trunk' && angle > 20) return isStatic ? 'not-acceptable' : 'conditionally';
    if (bodyPart === 'upper-arm' && angle > 60) return isStatic ? 'not-acceptable' : 'conditionally';
    if (bodyPart === 'neck-head' && angle > 25) return 'conditionally';
  }
  return 'acceptable';
}

function PostureForm({
  obs,
  bgName,
  onSave,
  onCancel,
}: {
  obs: Partial<PostureObservation>;
  bgName: string;
  onSave: (o: PostureObservation) => void;
  onCancel: () => void;
}) {
  const [d, setD] = useState<Partial<PostureObservation>>(obs);
  const INPUT = 'w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-orange-400';

  const bodyPart = d.bodyPart ?? 'trunk';
  const isStatic = d.isStatic ?? false;
  const frequency = d.frequency ?? 'occasional';
  const angle = d.angle;

  const suggested = suggestVerdict(bodyPart, isStatic, frequency, angle);

  function save() {
    if (!d.taskName?.trim() || !d.bgId) return;
    const verdict = d.verdict ?? suggested;
    onSave({
      id: d.id ?? newPhysicalId(),
      bgId: d.bgId,
      taskName: d.taskName.trim(),
      bodyPart,
      postureDescription: d.postureDescription ?? '',
      isStatic,
      frequency,
      angle,
      verdict,
      verdictColor: verdict === 'not-acceptable' ? 'red' : verdict === 'conditionally' ? 'amber' : 'emerald',
      notes: d.notes,
    });
  }

  return (
    <div className="rounded-xl border border-orange-200 bg-orange-50/50 px-5 py-4 dark:border-orange-800/30 dark:bg-orange-900/10">
      <h4 className="mb-4 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
        {d.id ? 'Houding bewerken' : `Nieuwe houdingsobservatie — ${bgName}`}
      </h4>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Naam taak / activiteit *</label>
          <input type="text" value={d.taskName ?? ''} onChange={(e) => setD({ ...d, taskName: e.target.value })} placeholder="Bijv. Inpakken staand aan transportband" className={INPUT} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Lichaamsgebied</label>
          <select value={d.bodyPart ?? 'trunk'} onChange={(e) => setD({ ...d, bodyPart: e.target.value as PostureBodyPart, verdict: undefined })} className={INPUT}>
            {(Object.entries(BODY_PART_LABELS) as [PostureBodyPart, string][]).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Frequentie / duur</label>
          <select value={d.frequency ?? 'occasional'} onChange={(e) => setD({ ...d, frequency: e.target.value as PostureFrequency, verdict: undefined })} className={INPUT}>
            {(Object.entries(FREQ_LABELS) as [PostureFrequency, string][]).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <input
              type="checkbox"
              checked={d.isStatic ?? false}
              onChange={(e) => setD({ ...d, isStatic: e.target.checked, verdict: undefined })}
              className="h-4 w-4 rounded border-zinc-300 text-orange-500"
            />
            Statische houding (&gt; 4 s aaneengesloten)
          </label>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Hoek (°) — optioneel</label>
          <input type="number" min={0} max={180} value={d.angle ?? ''} onChange={(e) => setD({ ...d, angle: e.target.value ? parseInt(e.target.value) : undefined, verdict: undefined })} placeholder="Bijv. 30 = 30° voorover gebogen" className={INPUT} />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Beschrijving houding</label>
          <input type="text" value={d.postureDescription ?? ''} onChange={(e) => setD({ ...d, postureDescription: e.target.value })} placeholder="Bijv. romp 30° voorover gebogen, armen voor het lichaam" className={INPUT} />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Oordeel</label>
          <div className="flex gap-2">
            {(Object.entries(VERDICT_LABELS) as [PostureVerdict, typeof VERDICT_LABELS[PostureVerdict]][]).map(([k, v]) => (
              <button
                key={k}
                type="button"
                onClick={() => setD({ ...d, verdict: k })}
                className="flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition"
                style={
                  (d.verdict ?? suggested) === k
                    ? { background: v.bg, borderColor: v.border, color: v.color, fontWeight: 700 }
                    : { background: 'transparent', borderColor: '#e4e4e7', color: '#71717a' }
                }
              >
                {v.label}
                {(d.verdict == null && k === suggested) && ' ✓'}
              </button>
            ))}
          </div>
          {d.verdict == null && (
            <p className="mt-1 text-xs text-zinc-400">Suggestie op basis van lichaamsgebied + frequentie. Pas aan op basis van uw observatie.</p>
          )}
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Opmerkingen</label>
          <input type="text" value={d.notes ?? ''} onChange={(e) => setD({ ...d, notes: e.target.value })} placeholder="Aanvullende informatie" className={INPUT} />
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <button type="button" onClick={save} disabled={!d.taskName?.trim()} className="rounded-lg bg-orange-500 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-40">Opslaan</button>
        <button type="button" onClick={onCancel} className="rounded-lg border border-zinc-200 px-4 py-1.5 text-sm text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800">Annuleren</button>
      </div>
    </div>
  );
}

export default function PhysicalStep7_Postures({ investigation, onUpdate }: Props) {
  const { bgs, postureObservations } = investigation;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addingBg, setAddingBg] = useState<string | null>(null);

  function saveObs(obs: PostureObservation) {
    const exists = postureObservations.find((o) => o.id === obs.id);
    onUpdate({
      postureObservations: exists
        ? postureObservations.map((o) => (o.id === obs.id ? obs : o))
        : [...postureObservations, obs],
    });
    setEditingId(null);
    setAddingBg(null);
  }

  if (bgs.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Stap 8 — Houdingen &amp; bewegingen</h2>
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-800/30 dark:bg-amber-900/10 dark:text-amber-400">
          ⚠ Definieer eerst belastingsgroepen in stap 3.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Stap 8 — Houdingen &amp; bewegingen
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          Registreer geobserveerde houdingen per lichaamsgebied en taak.
          Beoordeling conform{' '}
          <abbr title="Safety of machinery — Human physical performance — Part 4: Evaluation of working postures" className="cursor-help underline decoration-dotted decoration-zinc-400 underline-offset-2">EN 1005-4:2005</abbr>{' '}
          en{' '}
          <abbr title="Ergonomics — Evaluation of static working postures" className="cursor-help underline decoration-dotted decoration-zinc-400 underline-offset-2">ISO 11226:2000</abbr>.
        </p>
      </div>

      <InfoBox title="EN 1005-4:2005 — Zone-indeling werkhoudingen">
        Werkhoudingen worden ingedeeld in drie zones op basis van lichaamsgebied, hoek en frequentie:
        <strong> Acceptabel</strong> (groen),{' '}
        <strong> Voorwaardelijk acceptabel</strong> (geel — maatregelen gewenst),{' '}
        <strong> Niet acceptabel</strong> (rood — maatregelen vereist).
        Bijzondere aandacht voor statische houdingen: ook bij kleine hoeken kan langdurige statische belasting
        leiden tot klachten (ISO 11226 §5).
      </InfoBox>

      {bgs.map((bg) => {
        const obs = postureObservations.filter((o) => o.bgId === bg.id);
        return (
          <div key={bg.id} className="rounded-xl border border-zinc-200 dark:border-zinc-700">
            <div className="rounded-t-xl bg-zinc-50 px-4 py-3 dark:bg-zinc-800/50">
              <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{bg.name}</h3>
            </div>
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {obs.map((o) => {
                const info = VERDICT_LABELS[o.verdict];
                return (
                  <div key={o.id}>
                    {editingId === o.id ? (
                      <div className="px-4 py-4">
                        <PostureForm obs={o} bgName={bg.name} onSave={saveObs} onCancel={() => setEditingId(null)} />
                      </div>
                    ) : (
                      <div className="flex items-center gap-4 px-4 py-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{o.taskName}</p>
                          <div className="mt-1 flex flex-wrap gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                            <span>{BODY_PART_LABELS[o.bodyPart]}</span>
                            <span>{FREQ_LABELS[o.frequency].split(' ')[0]}</span>
                            {o.isStatic && <span>Statisch</span>}
                            {o.angle != null && <span>{o.angle}°</span>}
                          </div>
                          {o.postureDescription && (
                            <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500 line-clamp-1">{o.postureDescription}</p>
                          )}
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                          <span
                            className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                            style={{ background: info.bg, color: info.color, border: `1px solid ${info.border}` }}
                          >
                            {info.label}
                          </span>
                          <button onClick={() => setEditingId(o.id)} className="text-xs text-zinc-400 hover:text-orange-600">Bewerken</button>
                          <button onClick={() => onUpdate({ postureObservations: postureObservations.filter((x) => x.id !== o.id) })} className="text-xs text-zinc-400 hover:text-red-500">Verwijderen</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {addingBg === bg.id ? (
                <div className="px-4 py-4">
                  <PostureForm obs={{ bgId: bg.id }} bgName={bg.name} onSave={saveObs} onCancel={() => setAddingBg(null)} />
                </div>
              ) : (
                <div className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => setAddingBg(bg.id)}
                    className="flex items-center gap-1.5 text-xs text-orange-600 hover:text-orange-700 dark:text-orange-400"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Houdingsobservatie toevoegen
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {postureObservations.length === 0 && (
        <p className="text-center text-sm text-zinc-400 dark:text-zinc-500">
          Nog geen houdingsobservaties ingevoerd.
        </p>
      )}
    </div>
  );
}
