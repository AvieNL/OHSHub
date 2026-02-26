'use client';

import { useState } from 'react';
import type { PhysicalInvestigation, PhysicalPreSurvey, PhysicalSurveyRecommendation, PrePhysicalAnswer } from '@/lib/physical-investigation-types';
import { InfoBox } from '@/components/InfoBox';
import { Abbr } from '@/components/Abbr';

interface Props {
  investigation: PhysicalInvestigation;
  onUpdate: (partial: Partial<PhysicalInvestigation>) => void;
}

type QGroup = 'lifting' | 'push-pull' | 'repetitive' | 'posture' | 'general';

interface Question {
  id: string;
  group: QGroup;
  text: string;
  weight: number;
}

const QUESTIONS: Question[] = [
  // Tillen & dragen
  { id: 'QP1',  group: 'lifting',    text: 'Worden lasten van > 10 kg handmatig getild of neergezet?',                        weight: 3 },
  { id: 'QP2',  group: 'lifting',    text: 'Tilt men met gestrekte armen (> 30 cm van het lichaam)?',                          weight: 2 },
  { id: 'QP3',  group: 'lifting',    text: 'Wordt met een gedraaide romp getild?',                                              weight: 2 },
  { id: 'QP4',  group: 'lifting',    text: 'Worden lasten > 5 kg getild vanuit knieliggende of zittende positie?',             weight: 2 },
  // Duwen & trekken
  { id: 'QP5',  group: 'push-pull',  text: 'Worden karren, pallets of andere rijdende middelen geduwd of getrokken?',          weight: 2 },
  { id: 'QP6',  group: 'push-pull',  text: 'Zijn er klachten over hoge benodigde aanzetkrachten of stroeve bewegingen?',       weight: 2 },
  { id: 'QP7',  group: 'push-pull',  text: 'Vindt duwen/trekken plaats op ongelijke vloer of over drempels?',                  weight: 1 },
  // Repeterende handelingen
  { id: 'QP8',  group: 'repetitive', text: 'Worden herhalende arm- of handbewegingen > 2 uur per dag uitgevoerd?',             weight: 3 },
  { id: 'QP9',  group: 'repetitive', text: 'Is de cyclustijd < 30 seconden (> 2× per minuut dezelfde handeling)?',             weight: 2 },
  { id: 'QP10', group: 'repetitive', text: 'Zijn er klachten aan armen, polsen of handen (RSI-klachten)?',                     weight: 2 },
  // Houdingen & bewegingen
  { id: 'QP11', group: 'posture',    text: 'Werkt men > 1 uur per dag gebogen (romp > 20° voorover)?',                         weight: 2 },
  { id: 'QP12', group: 'posture',    text: 'Werkt men > 1 uur per dag met armen boven schouderhoogte?',                        weight: 2 },
  { id: 'QP13', group: 'posture',    text: 'Werkt men > 4 uur per dag in zittende positie zonder afwisseling?',                weight: 2 },
  { id: 'QP14', group: 'posture',    text: 'Is er sprake van langdurig knielen, hurken of kruipen?',                           weight: 2 },
  // Algemeen
  { id: 'QP15', group: 'general',    text: 'Zijn er bekende klachten aan rug, nek of schouders bij medewerkers in de functie?', weight: 3 },
  { id: 'QP16', group: 'general',    text: 'Is de fysieke belasting eerder als risico aangemerkt in de RI&E?',                 weight: 2 },
  { id: 'QP17', group: 'general',    text: 'Is het ziekteverzuim deels te herleiden tot klachten aan het bewegingsapparaat?',  weight: 2 },
  { id: 'QP18', group: 'general',    text: 'Is het werk eenzijdig of monotoon qua lichamelijke belasting?',                    weight: 1 },
];

const GROUP_LABELS: Record<QGroup, string> = {
  'lifting':    'Tillen & dragen',
  'push-pull':  'Duwen & trekken',
  'repetitive': 'Repeterende handelingen',
  'posture':    'Houdingen & bewegingen',
  'general':    'Algemeen',
};

const RECOMMENDATION_LABELS: Record<PhysicalSurveyRecommendation, { label: string; color: string; bg: string; border: string }> = {
  'full-investigation':    { label: 'Volledig ergonomisch onderzoek aanbevolen',    color: '#991b1b', bg: '#fee2e2', border: '#fca5a5' },
  'lifting-measurement':   { label: 'NIOSH-tilanalyse aanbevolen',                  color: '#c2410c', bg: '#ffedd5', border: '#fdba74' },
  'push-pull-measurement': { label: 'Duwen & trekken beoordeling aanbevolen',       color: '#92400e', bg: '#fef9c3', border: '#fde68a' },
  'repetitive-measurement':{ label: 'OCRA Checklist aanbevolen',                    color: '#1d4ed8', bg: '#dbeafe', border: '#93c5fd' },
  'posture-observation':   { label: 'Houdingsobservatie aanbevolen',                color: '#6b21a8', bg: '#f3e8ff', border: '#d8b4fe' },
  'not-required':          { label: 'Geen nader onderzoek op basis van voorverkenning', color: '#14532d', bg: '#dcfce7', border: '#86efac' },
  'overridden':            { label: 'Aanbeveling overschreven door onderzoeker',    color: '#374151', bg: '#f3f4f6', border: '#d1d5db' },
};

function computeRecommendation(responses: Record<string, { answer?: PrePhysicalAnswer }>): PhysicalSurveyRecommendation {
  const score = (group: QGroup) =>
    QUESTIONS.filter((q) => q.group === group).reduce((s, q) => {
      return s + (responses[q.id]?.answer === 'yes' ? q.weight : 0);
    }, 0);

  const liftScore = score('lifting');
  const ppScore = score('push-pull');
  const repScore = score('repetitive');
  const postScore = score('posture');
  const genScore = score('general');

  const totalScore = liftScore + ppScore + repScore + postScore + genScore;

  if (totalScore >= 12) return 'full-investigation';
  if (liftScore >= 5)   return 'lifting-measurement';
  if (repScore >= 5)    return 'repetitive-measurement';
  if (postScore >= 4)   return 'posture-observation';
  if (ppScore >= 3)     return 'push-pull-measurement';
  return 'not-required';
}

export default function PhysicalStep0_PreSurvey({ investigation, onUpdate }: Props) {
  const preSurvey = investigation.preSurvey ?? { responses: {} };
  const [showOverride, setShowOverride] = useState(!!preSurvey.recommendationOverride);

  function updatePreSurvey(patch: Partial<PhysicalPreSurvey>) {
    const updated = { ...preSurvey, ...patch };
    onUpdate({ preSurvey: updated });
  }

  function setAnswer(id: string, answer: PrePhysicalAnswer | undefined) {
    const responses = { ...preSurvey.responses, [id]: { ...preSurvey.responses[id], answer } };
    updatePreSurvey({ responses });
  }

  const autoRec = computeRecommendation(preSurvey.responses);
  const activeRec = preSurvey.recommendationOverride ?? autoRec;
  const recInfo = RECOMMENDATION_LABELS[activeRec];

  const groups: QGroup[] = ['lifting', 'push-pull', 'repetitive', 'posture', 'general'];

  const INPUT = 'w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-orange-400';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Stap 1 — Voorverkenning fysieke belasting
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          Beantwoord de signaleringsvrager om te bepalen welk soort onderzoek nodig is.
          De aanbeveling is gebaseerd op de{' '}
          <Abbr id="RI&E">RI&amp;E</Abbr>-systematiek en Arbobesluit art. 5.1.
        </p>
      </div>

      <InfoBox title="Arbobesluit art. 5.1 — Risicobeoordeling fysieke belasting">
        De werkgever is verplicht bij{' '}
        <abbr title="Risico-inventarisatie en -evaluatie" className="cursor-help underline decoration-dotted decoration-zinc-400 underline-offset-2">RI&amp;E</abbr>{' '}
        de risico&apos;s van handmatig tillen, duwen/trekken en repeterende bewegingen te beoordelen.
        Arbobesluit art. 5.1 schrijft voor dat specifieke maatregelen worden getroffen als
        ongunstige ergonomische omstandigheden niet vermeden kunnen worden. Gebruik deze voorverkenning
        om te bepalen welk nader onderzoek nodig is (NIOSH, OCRA, DUTCH of houdingsobservatie).
      </InfoBox>

      {/* Respondent info */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Naam respondent</label>
          <input
            type="text"
            value={preSurvey.respondentName ?? ''}
            onChange={(e) => updatePreSurvey({ respondentName: e.target.value })}
            placeholder="Naam medewerker / leidinggevende"
            className={INPUT}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Datum voorverkenning</label>
          <input
            type="date"
            value={preSurvey.completedAt ?? ''}
            onChange={(e) => updatePreSurvey({ completedAt: e.target.value })}
            className={INPUT}
          />
        </div>
      </div>

      {/* Questions per group */}
      {groups.map((group) => {
        const qs = QUESTIONS.filter((q) => q.group === group);
        return (
          <div key={group}>
            <h3 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              {GROUP_LABELS[group]}
            </h3>
            <div className="space-y-2">
              {qs.map((q) => {
                const ans = preSurvey.responses[q.id]?.answer;
                return (
                  <div
                    key={q.id}
                    className="flex items-start gap-3 rounded-lg border border-zinc-100 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-800/30"
                  >
                    <p className="min-w-0 flex-1 text-sm text-zinc-700 dark:text-zinc-300">{q.text}</p>
                    <div className="flex shrink-0 gap-1.5">
                      {(['yes', 'no', 'unknown'] as const).map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setAnswer(q.id, v)}
                          className={`rounded px-2.5 py-1 text-xs font-medium transition ${
                            ans === v
                              ? v === 'yes'
                                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                : v === 'no'
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                  : 'bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300'
                              : 'bg-white text-zinc-500 ring-1 ring-zinc-200 hover:bg-zinc-50 dark:bg-zinc-800 dark:ring-zinc-700 dark:hover:bg-zinc-700'
                          }`}
                        >
                          {v === 'yes' ? 'Ja' : v === 'no' ? 'Nee' : '?'}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Klachten */}
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-4 dark:border-zinc-700 dark:bg-zinc-800/30">
        <div className="mb-3 flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer">
            <input
              type="checkbox"
              checked={preSurvey.complaintsReported ?? false}
              onChange={(e) => updatePreSurvey({ complaintsReported: e.target.checked })}
              className="h-4 w-4 rounded border-zinc-300 text-orange-500 focus:ring-orange-500"
            />
            Er zijn klachten gemeld aan het bewegingsapparaat
          </label>
        </div>
        {preSurvey.complaintsReported && (
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Beschrijving klachten</label>
              <input
                type="text"
                value={preSurvey.complaintsDescription ?? ''}
                onChange={(e) => updatePreSurvey({ complaintsDescription: e.target.value })}
                placeholder="Bijv. lage rugpijn, nek-/schouderklachten, RSI-klachten"
                className={INPUT}
              />
            </div>
          </div>
        )}
      </div>

      {/* Aanbeveling */}
      <div
        className="rounded-xl border px-5 py-4"
        style={{ background: recInfo.bg, borderColor: recInfo.border }}
      >
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide" style={{ color: recInfo.color }}>
          Aanbeveling voorverkenning
        </p>
        <p className="text-sm font-medium" style={{ color: recInfo.color }}>
          {recInfo.label}
        </p>
        <div className="mt-2 flex flex-wrap gap-4 text-xs" style={{ color: recInfo.color }}>
          {(['lifting', 'push-pull', 'repetitive', 'posture', 'general'] as QGroup[]).map((g) => {
            const s = QUESTIONS.filter((q) => q.group === g).reduce(
              (acc, q) => acc + (preSurvey.responses[q.id]?.answer === 'yes' ? q.weight : 0), 0
            );
            return <span key={g}>{GROUP_LABELS[g]}: {s} pt</span>;
          })}
        </div>
      </div>

      {/* Manual override */}
      <div>
        <button
          type="button"
          onClick={() => setShowOverride((o) => !o)}
          className="text-xs text-zinc-400 hover:text-orange-600 dark:hover:text-orange-400"
        >
          {showOverride ? '▲ Verberg' : '▼ Aanbeveling handmatig overschrijven'}
        </button>
        {showOverride && (
          <div className="mt-3 space-y-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-4 dark:border-zinc-700 dark:bg-zinc-800/30">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Overschreven aanbeveling</label>
              <select
                value={preSurvey.recommendationOverride ?? ''}
                onChange={(e) =>
                  updatePreSurvey({
                    recommendationOverride: (e.target.value || undefined) as PhysicalSurveyRecommendation | undefined,
                  })
                }
                className={INPUT}
              >
                <option value="">— gebruik automatische aanbeveling —</option>
                {(Object.keys(RECOMMENDATION_LABELS) as PhysicalSurveyRecommendation[]).map((k) => (
                  <option key={k} value={k}>{RECOMMENDATION_LABELS[k].label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Reden afwijking</label>
              <input
                type="text"
                value={preSurvey.conclusionNotes ?? ''}
                onChange={(e) => updatePreSurvey({ conclusionNotes: e.target.value })}
                placeholder="Toelichting op de afwijking van de aanbeveling"
                className={INPUT}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
