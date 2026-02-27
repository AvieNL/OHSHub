'use client';

import { useState } from 'react';
import type {
  SoundInvestigation,
  SoundPreSurvey,
  PreSurveyAnswer,
  ExposureDuration,
  SurveyRecommendation,
} from '@/lib/sound-investigation-types';
import { Abbr } from '@/components/Abbr';

interface Props {
  investigation: SoundInvestigation;
  onUpdate: (partial: Partial<SoundInvestigation>) => void;
  onGoToStep: (step: number) => void;
}

// ─── Question definitions ─────────────────────────────────────────────────────

type QuestionDef = {
  id: string;
  text: string;
  isDuration?: boolean;
};

type CategoryDef = {
  id: string;
  title: string;
  subtitle?: string;
  questions: QuestionDef[];
};

const CATEGORIES: CategoryDef[] = [
  {
    id: 'A',
    title: 'A — Indicatoren voor hoge geluidsbelasting',
    subtitle: 'Arbobesluit art. 6.6 — ondergrens voor beheersmaatregelen',
    questions: [
      { id: 'Q1',  text: 'Zijn er geluidsbronnen die naar schatting meer dan 85 dB(A) produceren?' },
      { id: 'Q2',  text: 'Klagen medewerkers over gehoorklachten of tinnitus?' },
      { id: 'Q3',  text: 'Is verstaanbare communicatie alleen mogelijk door te schreeuwen op korte afstand (< 2 m)?' },
    ],
  },
  {
    id: 'B',
    title: 'B — Drempeloverschrijding',
    subtitle: 'Grenswaarde 87 dB(A) Arbobesluit art. 6.6 lid 1',
    questions: [
      { id: 'Q4',  text: 'Is het te verwachten dat de dagelijkse geluidsblootstelling de grenswaarde van 87 dB(A) kan overschrijden?' },
      { id: 'Q5',  text: 'Zijn er eerder geluidsmetingen uitgevoerd waarbij een overschrijding van een actiewaarde of grenswaarde werd vastgesteld?' },
    ],
  },
  {
    id: 'C',
    title: 'C — Duur en intensiteit van de blootstelling',
    questions: [
      { id: 'Q11', text: 'Hoe lang worden medewerkers dagelijks blootgesteld aan lawaai?', isDuration: true },
      { id: 'Q8',  text: 'Is er sprake van kortdurende maar zeer intense geluidspieken (> 135 dB(C) piekgeluid)?' },
      { id: 'Q9',  text: 'Worden medewerkers blootgesteld aan arbeidsmiddelen met een hoog geluidsvermogen (fabrieksopgave > 100 dB(A))?' },
      { id: 'Q10', text: 'Dragen medewerkers al gehoorbescherming tijdens de blootstelling?' },
    ],
  },
  {
    id: 'D',
    title: 'D — Arbeidsmiddelen',
    subtitle: 'Arbobesluit art. 7.4a — keuring; Machinerichtlijn 2006/42/EG',
    questions: [
      { id: 'Q12', text: 'Zijn er arbeidsmiddelen (machines, voertuigen, gereedschap) in gebruik die bijdragen aan de geluidsbelasting?' },
      { id: 'Q13', text: 'Zijn er arbeidsmiddelen waarvoor de CE-conformiteitsverklaring geluidsemissiewaarden (L\u2090, L\u209A\u2090) vermeldt?' },
      { id: 'Q14', text: 'Is het onderhoud achterstallig aan geluidsproducerende arbeidsmiddelen?' },
    ],
  },
  {
    id: 'E',
    title: 'E — Administratief en wettelijk',
    subtitle: 'Arbowet art. 5 — RI\u0026E',
    questions: [
      { id: 'Q15', text: 'Is er een geldig RI\u0026E-rapport aanwezig?' },
      { id: 'Q16', text: 'Zijn geluidsrisico\'s meegenomen in de RI\u0026E?' },
      { id: 'Q17', text: 'Zijn er aanbevelingen uit de RI\u0026E met betrekking tot geluid die nog niet zijn opgevolgd?' },
      { id: 'Q18', text: 'Zijn er klachten over geluid ingediend bij de werkgever of arbodienst?' },
      { id: 'Q19', text: 'Is de medezeggenschap (OR/PVT) betrokken bij de aanpak van geluidsrisico\'s?' },
    ],
  },
];

const DURATION_OPTIONS: { value: ExposureDuration; label: string }[] = [
  { value: 'lt1h', label: '< 1 uur per dag' },
  { value: '1-2h', label: '1 – 2 uur per dag' },
  { value: '2-4h', label: '2 – 4 uur per dag' },
  { value: 'gt4h', label: '> 4 uur per dag' },
];

// ─── Recommendation logic (Section G) ────────────────────────────────────────

function computeRecommendation(
  responses: Record<string, { answer?: PreSurveyAnswer }>,
  duration?: ExposureDuration,
): SurveyRecommendation {
  const yes = (id: string) => responses[id]?.answer === 'yes';
  const durationGe1h = duration === '1-2h' || duration === '2-4h' || duration === 'gt4h';
  const durationGe2h = duration === '2-4h' || duration === 'gt4h';
  const durationGt4h = duration === 'gt4h';

  // Duration counts as positive signals:
  // > 4 uur = 2 signalen (vervangt oude Q6 én Q7); 2–4 uur = 1 signaal (vervangt oude Q6)
  const durationPositives = durationGt4h ? 2 : durationGe2h ? 1 : 0;

  // Full investigation triggers
  if (yes('Q4') || yes('Q5')) return 'full';
  if ((yes('Q8') || yes('Q9')) && durationGe1h) return 'full';
  if (yes('Q14') && !yes('Q10')) return 'full';
  if ((yes('Q1') || yes('Q2') || yes('Q3')) && durationGe2h) return 'full';
  if (yes('Q13') && (yes('Q1') || yes('Q2') || yes('Q3'))) return 'full';

  const KEY_SIGNALS = ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q8', 'Q9', 'Q13', 'Q14'];
  if (KEY_SIGNALS.filter(yes).length + durationPositives >= 3) return 'full';

  // Indicative investigation triggers
  const hasPositive =
    ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q8', 'Q9', 'Q12', 'Q13', 'Q14'].some(yes) || durationGe2h;
  if (hasPositive && durationGe1h) return 'indicative';
  if (yes('Q17') || yes('Q18') || yes('Q19')) return 'indicative';

  return 'none';
}

const RECOMMENDATION_CONFIG: Record<
  SurveyRecommendation,
  { label: string; badge: string; badgeClass: string; description: string }
> = {
  full: {
    label: 'Volledig geluidsonderzoek aanbevolen',
    badge: 'Volledig onderzoek',
    badgeClass:
      'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
    description:
      'Een volledig kwantitatief geluidsonderzoek conform NEN-EN-ISO 9612:2025 is aangewezen om de dagelijkse blootstelling (L\u2091\u02E3,\u2088\u2095) te bepalen en te toetsen aan de actiewaarden en grenswaarde (Arbobesluit art. 6.6).',
  },
  indicative: {
    label: 'Indicatief onderzoek overwegen',
    badge: 'Indicatief onderzoek',
    badgeClass:
      'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
    description:
      'Een indicatief of oriënterend onderzoek (zonder volledig uitgewerkte onzekerheidsanalyse) kan de omvang van het risico verduidelijken en de noodzaak van een volledig onderzoek bevestigen of uitsluiten.',
  },
  none: {
    label: 'Onderzoek op dit moment niet noodzakelijk',
    badge: 'Geen onderzoek',
    badgeClass:
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
    description:
      'Er is geen directe aanleiding voor een kwantitatief geluidsonderzoek. Heroverweeg bij veranderingen in taken, arbeidsmiddelen of klachten van medewerkers.',
  },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function AnswerButtons({
  answer,
  onChange,
}: {
  answer?: PreSurveyAnswer;
  onChange: (a: PreSurveyAnswer) => void;
}) {
  const btn = (val: PreSurveyAnswer, label: string, active: string, inactive: string) => (
    <button
      type="button"
      onClick={() => onChange(val)}
      className={`rounded px-3 py-1 text-xs font-medium transition ${
        answer === val ? active : inactive
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex gap-1">
      {btn(
        'yes',
        'Ja',
        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        'bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-600',
      )}
      {btn(
        'no',
        'Nee',
        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
        'bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-600',
      )}
      {btn(
        'unknown',
        'Onbekend',
        'bg-zinc-200 text-zinc-700 dark:bg-zinc-600 dark:text-zinc-200',
        'bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-600',
      )}
    </div>
  );
}

function QuestionRow({
  q,
  response,
  onAnswerChange,
  onNotesChange,
  duration,
  onDurationChange,
}: {
  q: QuestionDef;
  response?: { answer?: PreSurveyAnswer; notes?: string };
  onAnswerChange: (id: string, a: PreSurveyAnswer) => void;
  onNotesChange: (id: string, notes: string) => void;
  duration?: ExposureDuration;
  onDurationChange?: (d: ExposureDuration) => void;
}) {
  const [showNotes, setShowNotes] = useState(!!response?.notes);

  return (
    <div className="rounded-lg border border-zinc-100 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-800/50">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <p className="text-sm text-zinc-800 dark:text-zinc-200">
          <span className="mr-1.5 font-mono text-xs font-bold text-zinc-400 dark:text-zinc-500">
            {q.id}
          </span>
          {q.text}
        </p>

        {!q.isDuration && (
          <div className="flex shrink-0 items-center gap-2">
            <AnswerButtons
              answer={response?.answer}
              onChange={(a) => onAnswerChange(q.id, a)}
            />
            <button
              type="button"
              title="Toelichting toevoegen"
              onClick={() => setShowNotes((v) => !v)}
              className={`rounded p-1 text-xs transition ${
                showNotes || response?.notes
                  ? 'text-orange-500 dark:text-orange-400'
                  : 'text-zinc-300 hover:text-zinc-500 dark:text-zinc-600 dark:hover:text-zinc-400'
              }`}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M7 8h10M7 12h6m-6 4h4M5 20l2.586-2.586A2 2 0 019 17H19a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v11a2 2 0 002 2z"
                />
              </svg>
            </button>
          </div>
        )}
      </div>

      {q.isDuration && onDurationChange && (
        <div className="mt-2">
          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            {DURATION_OPTIONS.map((opt) => (
              <label key={opt.value} className="flex cursor-pointer items-center gap-1.5 text-sm">
                <input
                  type="radio"
                  name="exposureDuration"
                  checked={duration === opt.value}
                  onChange={() => onDurationChange(opt.value)}
                  className="accent-orange-500"
                />
                <span className="text-zinc-700 dark:text-zinc-300">{opt.label}</span>
              </label>
            ))}
          </div>
          <div className="mt-1.5 flex justify-end">
            <button
              type="button"
              title="Toelichting toevoegen"
              onClick={() => setShowNotes((v) => !v)}
              className={`rounded p-1 text-xs transition ${
                showNotes || response?.notes
                  ? 'text-orange-500 dark:text-orange-400'
                  : 'text-zinc-300 hover:text-zinc-500 dark:text-zinc-600 dark:hover:text-zinc-400'
              }`}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M7 8h10M7 12h6m-6 4h4M5 20l2.586-2.586A2 2 0 019 17H19a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v11a2 2 0 002 2z"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {(showNotes || response?.notes) && (
        <input
          type="text"
          value={response?.notes ?? ''}
          onChange={(e) => onNotesChange(q.id, e.target.value)}
          placeholder="Toelichting…"
          className="mt-2 w-full rounded border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm outline-none focus:border-orange-400 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
        />
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SoundStep0_PreSurvey({ investigation, onUpdate }: Props) {
  const survey: SoundPreSurvey = investigation.preSurvey ?? { responses: {} };

  const REC_MAP: Record<SurveyRecommendation, 'measurement-required' | 'recommended' | 'not-required'> = {
    full: 'measurement-required',
    indicative: 'recommended',
    none: 'not-required',
  };

  function upd(patch: Partial<SoundPreSurvey>) {
    const newSurvey = { ...survey, ...patch };
    const autoRec = computeRecommendation(newSurvey.responses, newSurvey.exposureDuration);
    const preSurveyRecommendation = newSurvey.recommendationOverride
      ? ('overridden' as const)
      : REC_MAP[autoRec];
    const preSurveySignals = CATEGORIES
      .flatMap((c) => c.questions)
      .filter((q) => !q.isDuration && newSurvey.responses[q.id]?.answer === 'yes')
      .map((q) => q.text);
    onUpdate({
      preSurvey: newSurvey,
      preSurveyRecommendation,
      preSurveySignals,
      preSurveyOverrideReason: newSurvey.recommendationOverride
        ? (newSurvey.conclusionNotes || undefined)
        : undefined,
    });
  }

  function setAnswer(id: string, answer: PreSurveyAnswer) {
    upd({ responses: { ...survey.responses, [id]: { ...survey.responses[id], answer } } });
  }

  function setNotes(id: string, notes: string) {
    upd({ responses: { ...survey.responses, [id]: { ...survey.responses[id], notes } } });
  }

  const autoRecommendation = computeRecommendation(survey.responses, survey.exposureDuration);
  const effectiveRecommendation = survey.recommendationOverride ?? autoRecommendation;

  // Count answered questions (excluding Q11 duration)
  const answeredCount = CATEGORIES.flatMap((c) => c.questions)
    .filter((q) => !q.isDuration && survey.responses[q.id]?.answer)
    .length;
  const totalQuestions = CATEGORIES.flatMap((c) => c.questions).filter((q) => !q.isDuration).length;


  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Stap 1 — Voorverkenning geluidsbelasting
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          Beantwoord de onderstaande oriënterende vragen samen met de opdrachtgever of contactpersoon
          om te bepalen of (en welk type) geluidsonderzoek noodzakelijk is. De vragen hoeven niet
          volledig te worden ingevuld; elke beantwoorde vraag verbetert de aanbeveling.
        </p>
      </div>

      <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
        Een voorverkenning is geen vervanging voor een kwantitatief geluidsonderzoek conform{' '}
        <Abbr id="NEN9612">NEN-EN-ISO 9612</Abbr>:2025, maar helpt om de omvang, urgentie en
        aanpak van het onderzoek te bepalen. De aanbeveling onder deze voorverkenning is een hulpmiddel — de
        definitieve beslissing berust bij de{' '}
        <Abbr id="AH">arbeidshygiënist</Abbr> of{' '}
        <Abbr id="HVK">hogere veiligheidskundige</Abbr>.
      </p>

      {/* Meta */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Naam respondent / contactpersoon
          </label>
          <input
            type="text"
            value={survey.respondentName ?? ''}
            onChange={(e) => upd({ respondentName: e.target.value })}
            placeholder="Naam…"
            className="w-full rounded-lg border border-zinc-200 px-4 py-2 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Datum voorverkenning
          </label>
          <input
            type="date"
            value={survey.completedAt ?? ''}
            onChange={(e) => upd({ completedAt: e.target.value })}
            className="w-full rounded-lg border border-zinc-200 px-4 py-2 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
      </div>

      {/* Progress indicator */}
      <div className="flex items-center gap-3 text-xs text-zinc-400 dark:text-zinc-500">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
          <div
            className="h-full rounded-full bg-orange-400 transition-all"
            style={{ width: totalQuestions > 0 ? `${(answeredCount / totalQuestions) * 100}%` : '0%' }}
          />
        </div>
        <span>{answeredCount}/{totalQuestions} vragen beantwoord</span>
      </div>

      {/* Question categories A–F */}
      {CATEGORIES.map((cat) => (
        <div key={cat.id} className="space-y-2">
          <div>
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{cat.title}</h3>
            {cat.subtitle && (
              <p className="text-xs text-zinc-400 dark:text-zinc-500">{cat.subtitle}</p>
            )}
          </div>
          {cat.questions.map((q) => (
            <QuestionRow
              key={q.id}
              q={q}
              response={survey.responses[q.id]}
              onAnswerChange={setAnswer}
              onNotesChange={setNotes}
              duration={survey.exposureDuration}
              onDurationChange={q.isDuration ? (d) => upd({ exposureDuration: d }) : undefined}
            />
          ))}
        </div>
      ))}

      {/* Section G — Decision aid */}
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-700 dark:bg-zinc-800/40">
        <h3 className="mb-4 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
          G — Beslishulp: aanbeveling
        </h3>

        {/* Three option cards */}
        <div className="flex flex-col gap-3">
          {(['full', 'indicative', 'none'] as SurveyRecommendation[]).map((val) => {
            const cfg = RECOMMENDATION_CONFIG[val];
            const isSelected = effectiveRecommendation === val;
            const isRecommended = autoRecommendation === val;
            const borderColor =
              val === 'full'      ? 'border-red-300 bg-red-50 dark:border-red-700/60 dark:bg-red-900/15' :
              val === 'indicative'? 'border-amber-300 bg-amber-50 dark:border-amber-700/60 dark:bg-amber-900/15' :
                                    'border-emerald-300 bg-emerald-50 dark:border-emerald-700/60 dark:bg-emerald-900/15';
            return (
              <button
                key={val}
                type="button"
                onClick={() =>
                  upd({
                    // Klik op de aanbevolen optie → altijd terug naar automatisch
                    // Klik op een andere optie → zet als handmatige override
                    recommendationOverride: isRecommended ? undefined : val,
                  })
                }
                className={`rounded-lg border p-3 text-left transition ${
                  isSelected
                    ? `${borderColor} ring-2 ring-offset-1 ${
                        val === 'full'       ? 'ring-red-400 dark:ring-red-600' :
                        val === 'indicative' ? 'ring-amber-400 dark:ring-amber-600' :
                                              'ring-emerald-400 dark:ring-emerald-600'
                      }`
                    : 'border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/60 dark:hover:bg-zinc-700/50'
                }`}
              >
                <div className="mb-2 flex items-start justify-between gap-1">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${cfg.badgeClass}`}>
                    {cfg.badge}
                  </span>
                  {isRecommended && (
                    <span className="shrink-0 rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400">
                      aanbevolen
                    </span>
                  )}
                </div>
                <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {cfg.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Manual override notice */}
        {survey.recommendationOverride && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800/40 dark:bg-amber-900/10">
            <p className="mb-3 text-xs text-amber-800 dark:text-amber-400">
              <strong>Handmatig gekozen</strong> — wijkt af van de automatische aanbeveling
              ({RECOMMENDATION_CONFIG[autoRecommendation].badge}).
              Geef hieronder een toelichting bij deze keuze.
            </p>
            <textarea
              value={survey.conclusionNotes ?? ''}
              onChange={(e) => upd({ conclusionNotes: e.target.value })}
              rows={3}
              placeholder="Toelichting bij de handmatige keuze…"
              className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm outline-none focus:border-orange-500 dark:border-amber-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
        )}

        {/* Conclusion notes (auto mode) */}
        {!survey.recommendationOverride && (
          <div className="mt-4">
            <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Toelichting / afspraken (voor rapport)
            </label>
            <textarea
              value={survey.conclusionNotes ?? ''}
              onChange={(e) => upd({ conclusionNotes: e.target.value })}
              rows={3}
              placeholder="Context, afspraken met opdrachtgever…"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
        )}
      </div>
    </div>
  );
}
