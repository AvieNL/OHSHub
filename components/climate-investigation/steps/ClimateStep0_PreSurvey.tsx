'use client';

import { useState } from 'react';
import type { ClimateInvestigation, ClimatePreSurvey, PreClimateResponse, ClimateSurveyRecommendation } from '@/lib/climate-investigation-types';
import { Abbr } from '@/components/Abbr';
import { InfoBox } from '@/components/InfoBox';

interface Props {
  investigation: ClimateInvestigation;
  onUpdate: (partial: Partial<ClimateInvestigation>) => void;
}

// Voorverkenningsvragen per thema
const PRE_SURVEY_QUESTIONS: {
  id: string;
  group: string;
  text: string;
  weight: number;
  scenario: 'heat' | 'cold' | 'comfort' | 'general';
}[] = [
  // Warmte
  { id: 'QC1',  group: 'Warmtestress',         text: 'Is de luchttemperatuur op de werkplek regelmatig boven 28°C (binnenwerk) of 30°C (buitenwerk)?',              weight: 3, scenario: 'heat' },
  { id: 'QC2',  group: 'Warmtestress',         text: 'Zijn er stralingswarmtebronnen aanwezig (ovens, smeltinstallaties, zonlast, hete machineoppervlakken)?',      weight: 3, scenario: 'heat' },
  { id: 'QC3',  group: 'Warmtestress',         text: 'Is de lichamelijke belasting matig tot zwaar (ISO 8996 klasse 2 of hoger, > 200 W/m²)?',                    weight: 2, scenario: 'heat' },
  { id: 'QC4',  group: 'Warmtestress',         text: 'Is de relatieve luchtvochtigheid structureel hoog (> 60%) gecombineerd met hoge temperatuur?',               weight: 2, scenario: 'heat' },
  { id: 'QC5',  group: 'Warmtestress',         text: 'Worden luchtdichte of slecht dampsdoorlatende beschermende kleding of overalls gedragen?',                   weight: 2, scenario: 'heat' },
  // Kou
  { id: 'QC6',  group: 'Koudestress',          text: 'Is de luchttemperatuur op de werkplek regelmatig onder 10°C (koel werk) of onder 0°C (koud werk)?',          weight: 3, scenario: 'cold' },
  { id: 'QC7',  group: 'Koudestress',          text: 'Is er sprake van buitenwerk in koude seizoenen of in koelcellen / vrieshuizen?',                             weight: 3, scenario: 'cold' },
  { id: 'QC8',  group: 'Koudestress',          text: 'Zijn er klachten over kou-gerelateerde gezondheidsklachten (bevroren ledematen, hypothermie-symptomen)?',    weight: 2, scenario: 'cold' },
  // Comfort (binnenklimaat)
  { id: 'QC9',  group: 'Comfort binnenklimaat', text: 'Zijn er herhaalde klachten over te warm of te koud binnenklimaat zonder directe hitte- of koudestress?',     weight: 2, scenario: 'comfort' },
  { id: 'QC10', group: 'Comfort binnenklimaat', text: 'Zijn er klachten over tocht (koude luchtstroom, koudere enkel/hoofd-zone) op de werkplek?',                  weight: 2, scenario: 'comfort' },
  { id: 'QC11', group: 'Comfort binnenklimaat', text: 'Is de luchttemperatuur op de werkplek structureel buiten het bereik 20–26°C?',                              weight: 2, scenario: 'comfort' },
  { id: 'QC12', group: 'Comfort binnenklimaat', text: 'Is de relatieve luchtvochtigheid structureel lager dan 30% of hoger dan 70%?',                              weight: 1, scenario: 'comfort' },
  // Algemeen
  { id: 'QC13', group: 'Algemeen',             text: 'Zijn er incidenten of bijna-incidenten gerelateerd aan hitte of kou (warmte-uitputting, bevriezingen)?',     weight: 3, scenario: 'general' },
  { id: 'QC14', group: 'Algemeen',             text: 'Is er een risico-inventarisatie (RI&E) beschikbaar die klimaat als risicofactor identificeert?',             weight: 1, scenario: 'general' },
  { id: 'QC15', group: 'Algemeen',             text: 'Zijn medewerkers niet of recent geacclimatiseerd aan extreme temperatuuromstandigheden?',                    weight: 2, scenario: 'general' },
];

type Answer = 'yes' | 'no' | 'unknown';

function computeRecommendation(survey: ClimatePreSurvey): {
  recommendation: ClimateSurveyRecommendation;
  heatScore: number;
  coldScore: number;
  comfortScore: number;
  signals: string[];
} {
  let heatScore = 0;
  let coldScore = 0;
  let comfortScore = 0;
  const signals: string[] = [];

  for (const q of PRE_SURVEY_QUESTIONS) {
    const resp = survey.responses[q.id];
    if (resp?.answer === 'yes') {
      if (q.scenario === 'heat') heatScore += q.weight;
      else if (q.scenario === 'cold') coldScore += q.weight;
      else if (q.scenario === 'comfort') comfortScore += q.weight;
      else { heatScore += q.weight * 0.5; coldScore += q.weight * 0.5; comfortScore += q.weight * 0.5; }
      signals.push(q.text);
    }
  }

  // Geschatte temperatuur bijdrage
  if (survey.estimatedTemp != null) {
    if (survey.estimatedTemp > 28) heatScore += 2;
    if (survey.estimatedTemp < 10) coldScore += 2;
    if (survey.estimatedTemp > 32) heatScore += 3;
    if (survey.estimatedTemp < 0) coldScore += 3;
  }

  if (survey.complaintsReported) {
    heatScore += 1; coldScore += 1; comfortScore += 1;
    if (survey.complaintsDescription) signals.push(`Klachten: ${survey.complaintsDescription}`);
  }

  const maxScore = Math.max(heatScore, coldScore, comfortScore);

  let recommendation: ClimateSurveyRecommendation;
  if (maxScore === 0) {
    recommendation = 'not-required';
  } else if (heatScore >= 6 && coldScore >= 4) {
    recommendation = 'full-investigation';
  } else if (heatScore >= 6) {
    recommendation = 'heat-measurement';
  } else if (coldScore >= 6) {
    recommendation = 'cold-measurement';
  } else if (comfortScore >= 4 || heatScore >= 3 || coldScore >= 3) {
    recommendation = 'comfort-measurement';
  } else {
    recommendation = 'not-required';
  }

  return { recommendation, heatScore, coldScore, comfortScore, signals };
}

const RECOMMENDATION_LABELS: Record<ClimateSurveyRecommendation, { label: string; color: string; bg: string }> = {
  'comfort-measurement':  { label: 'PMV/PPD comfortmeting aanbevolen',                          color: 'text-amber-700 dark:text-amber-300',   bg: 'bg-amber-50 dark:bg-amber-900/15' },
  'heat-measurement':     { label: 'WBGT-hittestressmeting aanbevolen (ISO 7243)',               color: 'text-orange-700 dark:text-orange-300', bg: 'bg-orange-50 dark:bg-orange-900/15' },
  'cold-measurement':     { label: 'IREQ-koudestressbeoordeling aanbevolen (ISO 11079)',         color: 'text-blue-700 dark:text-blue-300',     bg: 'bg-blue-50 dark:bg-blue-900/15' },
  'full-investigation':   { label: 'Volledig klimaatonderzoek vereist (alle scenario\'s)',        color: 'text-red-700 dark:text-red-300',       bg: 'bg-red-50 dark:bg-red-900/15' },
  'not-required':         { label: 'Meting niet noodzakelijk op basis van voorverkenning',       color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-50 dark:bg-emerald-900/15' },
  'overridden':           { label: 'Aanbeveling handmatig overschreven door onderzoeker',        color: 'text-zinc-700 dark:text-zinc-300',     bg: 'bg-zinc-50 dark:bg-zinc-800/50' },
};

const ANSWER_LABELS: Record<Answer, string> = { yes: 'Ja', no: 'Nee', unknown: 'Onbekend' };

export default function ClimateStep0_PreSurvey({ investigation, onUpdate }: Props) {
  const survey = investigation.preSurvey ?? { responses: {} };
  const [showAll, setShowAll] = useState(false);

  function updateSurvey(partial: Partial<ClimatePreSurvey>) {
    onUpdate({ preSurvey: { ...survey, ...partial } });
  }

  function setResponse(qid: string, answer: Answer | undefined) {
    updateSurvey({
      responses: { ...survey.responses, [qid]: { ...survey.responses[qid], answer } },
    });
  }

  const { recommendation, heatScore, coldScore, comfortScore, signals } = computeRecommendation(survey);
  const effectiveRec = survey.recommendationOverride ?? recommendation;
  const recStyle = RECOMMENDATION_LABELS[effectiveRec];

  const groups = [...new Set(PRE_SURVEY_QUESTIONS.map((q) => q.group))];
  const visibleGroups = showAll ? groups : groups.slice(0, 3);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Stap 1 — Voorverkenning
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          Beantwoord de oriënterende vragen om de aard en omvang van het klimaatrisico in te schatten.
          Op basis van de antwoorden wordt aanbevolen welk meetscenario van toepassing is
          (<Abbr id="PMV">PMV</Abbr>/PPD, <Abbr id="WBGT">WBGT</Abbr> of <Abbr id="IREQ">IREQ</Abbr>).
        </p>
      </div>

      <InfoBox title="Arbobesluit art. 3.2 — Klimaateisen arbeidsplaatsen">
        Arbobesluit art. 3.2 lid 1 en 2 eisen dat de klimatologische omstandigheden op de arbeidsplaats
        geen gevaar opleveren voor de veiligheid en gezondheid van de medewerkers. Bij afwijkende omstandigheden
        moeten technische, organisatorische of persoonlijke maatregelen worden getroffen.
      </InfoBox>

      {/* Respondent */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Naam respondent (geïnterviewde)
          </label>
          <input
            type="text"
            value={survey.respondentName ?? ''}
            onChange={(e) => updateSurvey({ respondentName: e.target.value })}
            placeholder="Naam van de contactpersoon / geïnterviewde"
            className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-orange-400"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Geschatte omgevingstemperatuur (°C)
          </label>
          <input
            type="number"
            step={0.5}
            value={survey.estimatedTemp ?? ''}
            onChange={(e) => updateSurvey({ estimatedTemp: parseFloat(e.target.value) || undefined })}
            placeholder="Bijv. 32"
            className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-orange-400"
          />
        </div>
      </div>

      {/* Klachten */}
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/30">
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={survey.complaintsReported ?? false}
            onChange={(e) => updateSurvey({ complaintsReported: e.target.checked })}
            className="accent-orange-500"
          />
          <span className="font-medium text-zinc-700 dark:text-zinc-300">
            Medewerkers of leidinggevenden hebben klachten over het thermisch klimaat gemeld
          </span>
        </label>
        {survey.complaintsReported && (
          <div className="mt-3">
            <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Omschrijving klachten
            </label>
            <textarea
              rows={2}
              value={survey.complaintsDescription ?? ''}
              onChange={(e) => updateSurvey({ complaintsDescription: e.target.value })}
              placeholder="Bijv. medewerkers klagen over tocht bij de ramen, hitte bij de oven…"
              className="w-full resize-none rounded-lg border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-orange-400"
            />
          </div>
        )}
      </div>

      {/* Vragenlijst */}
      <div className="space-y-5">
        {visibleGroups.map((group) => {
          const groupQs = PRE_SURVEY_QUESTIONS.filter((q) => q.group === group);
          return (
            <div key={group}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                {group}
              </p>
              <div className="space-y-2">
                {groupQs.map((q) => {
                  const answer = survey.responses[q.id]?.answer;
                  return (
                    <div
                      key={q.id}
                      className={`rounded-xl border p-3.5 transition ${
                        answer === 'yes'
                          ? 'border-orange-200 bg-orange-50 dark:border-orange-800/40 dark:bg-orange-900/10'
                          : 'border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/30'
                      }`}
                    >
                      <p className="mb-2.5 text-sm text-zinc-700 dark:text-zinc-300">{q.text}</p>
                      <div className="flex flex-wrap gap-2">
                        {(['yes', 'no', 'unknown'] as Answer[]).map((a) => (
                          <button
                            key={a}
                            type="button"
                            onClick={() => setResponse(q.id, answer === a ? undefined : a)}
                            className={`rounded-lg border px-3 py-1 text-xs font-medium transition ${
                              answer === a
                                ? a === 'yes'
                                  ? 'border-orange-400 bg-orange-500 text-white'
                                  : 'border-zinc-400 bg-zinc-600 text-white dark:border-zinc-500 dark:bg-zinc-600'
                                : 'border-zinc-200 text-zinc-500 hover:border-zinc-300 dark:border-zinc-700 dark:text-zinc-400'
                            }`}
                          >
                            {ANSWER_LABELS[a]}
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

        {!showAll && (
          <button
            onClick={() => setShowAll(true)}
            className="text-sm text-orange-600 underline hover:text-orange-700 dark:text-orange-400"
          >
            Toon alle vragen ({PRE_SURVEY_QUESTIONS.length})
          </button>
        )}
      </div>

      {/* Aanbeveling */}
      <div className={`rounded-xl border p-4 ${recStyle.bg}`}>
        <div className="mb-2 flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Aanbeveling</span>
        </div>
        <p className={`font-semibold ${recStyle.color}`}>{recStyle.label}</p>
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-zinc-500 dark:text-zinc-400">
          <span>Hittescore: <strong>{Math.round(heatScore)}</strong></span>
          <span>·</span>
          <span>Koudescores: <strong>{Math.round(coldScore)}</strong></span>
          <span>·</span>
          <span>Comfortscore: <strong>{Math.round(comfortScore)}</strong></span>
        </div>
        {signals.length > 0 && (
          <ul className="mt-3 space-y-1 text-xs text-zinc-500 dark:text-zinc-400">
            {signals.slice(0, 5).map((s, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="mt-0.5 text-orange-500">›</span>
                <span>{s}</span>
              </li>
            ))}
            {signals.length > 5 && <li className="text-zinc-400">+ {signals.length - 5} meer risicosignalen</li>}
          </ul>
        )}
      </div>

      {/* Override */}
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Aanbeveling handmatig overschrijven (optioneel)
        </label>
        <select
          value={survey.recommendationOverride ?? ''}
          onChange={(e) =>
            updateSurvey({ recommendationOverride: (e.target.value || undefined) as ClimateSurveyRecommendation | undefined })
          }
          className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-orange-400"
        >
          <option value="">— gebruik berekende aanbeveling —</option>
          <option value="comfort-measurement">PMV/PPD comfortmeting aanbevolen</option>
          <option value="heat-measurement">WBGT-hittestressmeting aanbevolen</option>
          <option value="cold-measurement">IREQ-koudestressbeoordeling aanbevolen</option>
          <option value="full-investigation">Volledig klimaatonderzoek (alle scenario&apos;s)</option>
          <option value="not-required">Meting niet vereist</option>
        </select>
        {survey.recommendationOverride && (
          <div className="mt-2">
            <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Motivering afwijking aanbeveling
            </label>
            <textarea
              rows={2}
              value={survey.conclusionNotes ?? ''}
              onChange={(e) => updateSurvey({ conclusionNotes: e.target.value })}
              placeholder="Reden voor het afwijken van de berekende aanbeveling…"
              className="w-full resize-none rounded-lg border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-orange-400"
            />
          </div>
        )}
      </div>
    </div>
  );
}
