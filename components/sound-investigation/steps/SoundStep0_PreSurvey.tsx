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
import { FieldLabel, FormGrid, Icon, Input, Textarea } from '@/components/ui';
import InlineStepHeader from '@/components/InlineStepHeader';
import InlineEdit from '@/components/InlineEdit';
import MarkdownContent from '@/components/MarkdownContent';

interface Props {
  investigation: SoundInvestigation;
  onUpdate: (partial: Partial<SoundInvestigation>) => void;
  onGoToStep: (step: number) => void;
  contentOverrides?: Record<string, string>;
}

// ─── Question definitions ─────────────────────────────────────────────────────

type QuestionDef = {
  id: string;
  text: string;
  isDuration?: boolean;
  /** Wanneer true: vraag is N.v.t. en wordt niet meegeteld in beantwoorde vragen */
  disabledWhen?: (responses: Record<string, { answer?: PreSurveyAnswer }>) => boolean;
  disabledNote?: string;
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
    title: 'A — Indicatoren voor geluidsbelasting',
    subtitle: 'Lagere actiewaarde 80 dB(A) / bovenste actiewaarde 85 dB(A) — Arbobesluit art. 6.6 lid 1',
    questions: [
      { id: 'Q1',  text: 'Zijn er geluidsbronnen die naar schatting 80 dB(A) of meer produceren?' },
      { id: 'Q2',  text: 'Klagen medewerkers over gehoorklachten of tinnitus?' },
      { id: 'Q3',  text: 'Is verstaanbare communicatie alleen mogelijk door te schreeuwen op korte afstand (< 2 m)?' },
    ],
  },
  {
    id: 'B',
    title: 'B — Drempeloverschrijding',
    subtitle: 'Grenswaarde 87 dB(A) — Arbobesluit art. 6.6 lid 2',
    questions: [
      { id: 'Q4',  text: 'Is het te verwachten dat de dagelijkse geluidsblootstelling de grenswaarde van 87 dB(A) kan overschrijden?' },
      { id: 'Q5',  text: 'Zijn er eerder geluidsmetingen uitgevoerd waarbij een overschrijding van een actiewaarde of grenswaarde werd vastgesteld?' },
    ],
  },
  {
    id: 'C',
    title: 'C — Duur en intensiteit van de blootstelling',
    questions: [
      { id: 'Q6',  text: 'Hoe lang worden medewerkers dagelijks blootgesteld aan lawaai?', isDuration: true },
      { id: 'Q7',  text: 'Is er sprake van kortdurende maar zeer intense geluidspieken (> 135 dB(C) piekgeluid)?' },
      { id: 'Q8',  text: 'Zijn er arbeidsmiddelen waarbij de fabrieksopgave voor het geluidsdrukpeil op de werkpost (Lₚₐ) ≥ 85 dB(A) bedraagt?' },
      { id: 'Q9',  text: 'Dragen medewerkers aantoonbaar geschikte gehoorbescherming (type en attenuatiewaarde gedocumenteerd) tijdens de blootstelling?' },
    ],
  },
  {
    id: 'D',
    title: 'D — Arbeidsmiddelen',
    subtitle: 'Arbobesluit art. 7.4a — keuring; Machinerichtlijn 2006/42/EG',
    questions: [
      { id: 'Q10', text: 'Zijn er arbeidsmiddelen (machines, voertuigen, gereedschap) in gebruik die bijdragen aan de geluidsbelasting?' },
      { id: 'Q11', text: 'Zijn er arbeidsmiddelen waarvoor de CE-conformiteitsverklaring geluidsemissiewaarden (Lₐ, Lₚₐ) vermeldt?' },
      { id: 'Q12', text: 'Is het onderhoud achterstallig aan geluidsproducerende arbeidsmiddelen?' },
    ],
  },
  {
    id: 'E',
    title: 'E — Administratief en wettelijk',
    subtitle: 'Arbowet art. 5 — RI&E; Arbobesluit art. 6.10 — audiometrie',
    questions: [
      { id: 'Q13', text: 'Is er een geldig RI&E-rapport aanwezig?' },
      { id: 'Q14', text: 'Zijn geluidsrisico\'s meegenomen in de RI&E?',
        disabledWhen: (r) => r['Q13']?.answer === 'no',
        disabledNote: 'N.v.t. — geen RI&E aanwezig' },
      { id: 'Q15', text: 'Zijn er aanbevelingen uit de RI&E met betrekking tot geluid die nog niet zijn opgevolgd?',
        disabledWhen: (r) => r['Q13']?.answer === 'no',
        disabledNote: 'N.v.t. — geen RI&E aanwezig' },
      { id: 'Q16', text: 'Zijn er klachten over geluid ingediend bij de werkgever of arbodienst?' },
      { id: 'Q17', text: 'Ontbreekt een periodiek audiometrisch programma voor geluidblootgestelde medewerkers?' },
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
  // > 4 uur = 2 signalen; 2–4 uur = 1 signaal
  const durationPositives = durationGt4h ? 2 : durationGe2h ? 1 : 0;

  // Full investigation triggers
  if (yes('Q4') || yes('Q5')) return 'full';
  if ((yes('Q7') || yes('Q8')) && durationGe1h) return 'full';   // pieken Q7; L_pA ≥ 85 Q8
  if (yes('Q12') && !yes('Q9')) return 'full';                   // achterstallig onderhoud zonder PPE
  if ((yes('Q1') || yes('Q2') || yes('Q3')) && durationGe2h) return 'full';
  if (yes('Q11') && (yes('Q1') || yes('Q2') || yes('Q3'))) return 'full'; // CE + geluidsklacht

  const KEY_SIGNALS = ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q7', 'Q8', 'Q11', 'Q12'];
  if (KEY_SIGNALS.filter(yes).length + durationPositives >= 3) return 'full';

  // Indicative investigation triggers
  const hasPositive =
    ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q7', 'Q8', 'Q10', 'Q11', 'Q12'].some(yes) || durationGe2h;
  if (hasPositive && durationGe1h) return 'indicative';
  if (yes('Q15') || yes('Q16') || yes('Q17')) return 'indicative'; // RI&E-opvolging, klachten, audiometrie

  // Geen RI&E (Q13=Nee) is altijd aanleiding voor minimaal indicatief onderzoek;
  // gecombineerd met geluidsklachten of relevante blootstelling → volledig onderzoek
  const noRIE = responses['Q13']?.answer === 'no';
  if (noRIE && (yes('Q1') || yes('Q2') || yes('Q3') || durationGe2h)) return 'full';
  if (noRIE) return 'indicative';

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
      'Een volledig kwantitatief geluidsonderzoek conform NEN-EN-ISO 9612:2025 is aangewezen om de dagelijkse blootstelling (Lex,8h) te bepalen en te toetsen aan de actiewaarden en grenswaarde (Arbobesluit art. 6.6).',
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
  disabled = false,
}: {
  q: QuestionDef;
  response?: { answer?: PreSurveyAnswer; notes?: string };
  onAnswerChange: (id: string, a: PreSurveyAnswer) => void;
  onNotesChange: (id: string, notes: string) => void;
  duration?: ExposureDuration;
  onDurationChange?: (d: ExposureDuration) => void;
  disabled?: boolean;
}) {
  const [showNotes, setShowNotes] = useState(!!response?.notes);

  const notesToggleBtn = (
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
      <Icon name="note" size="sm" />
    </button>
  );

  if (disabled) {
    return (
      <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-3 opacity-50 dark:border-zinc-700 dark:bg-zinc-800/20">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-zinc-500 dark:text-zinc-500">
            <span className="mr-1.5 font-mono text-xs font-bold text-zinc-300 dark:text-zinc-600">{q.id}</span>
            {q.text}
          </p>
          {q.disabledNote && (
            <span className="shrink-0 rounded bg-zinc-200 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400">
              {q.disabledNote}
            </span>
          )}
        </div>
      </div>
    );
  }

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
            {notesToggleBtn}
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
            {notesToggleBtn}
          </div>
        </div>
      )}

      {(showNotes || response?.notes) && (
        <Input
          type="text"
          value={response?.notes ?? ''}
          onChange={(e) => onNotesChange(q.id, e.target.value)}
          placeholder="Toelichting…"
          size="sm"
          className="mt-2 w-full bg-zinc-50 dark:bg-zinc-700"
        />
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const STEP_KEY = 'step.0';
const NS = 'investigation.sound';
const FALLBACK_TITLE = 'Stap 1 — Voorverkenning geluidsbelasting';
const FALLBACK_DESC = 'Beantwoord de onderstaande oriënterende vragen samen met de opdrachtgever of contactpersoon om te bepalen of (en welk type) geluidsonderzoek noodzakelijk is. De vragen hoeven niet volledig te worden ingevuld; elke beantwoorde vraag verbetert de aanbeveling.';

export default function SoundStep0_PreSurvey({ investigation, onUpdate, contentOverrides }: Props) {
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

  // Count answered questions (excluding duration and disabled questions)
  const allQuestions = CATEGORIES.flatMap((c) => c.questions);
  const answeredCount = allQuestions
    .filter((q) => !q.isDuration && !q.disabledWhen?.(survey.responses) && survey.responses[q.id]?.answer)
    .length;
  const totalQuestions = allQuestions
    .filter((q) => !q.isDuration && !q.disabledWhen?.(survey.responses))
    .length;


  const title = contentOverrides?.[`${STEP_KEY}.title`] ?? FALLBACK_TITLE;
  const desc = contentOverrides?.[`${STEP_KEY}.desc`];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <InlineStepHeader namespace={NS} stepKey={STEP_KEY} fallbackTitle={FALLBACK_TITLE} title={title} />
        <InlineEdit namespace={NS} contentKey={`${STEP_KEY}.desc`}
          initialValue={desc ?? FALLBACK_DESC} fallback={FALLBACK_DESC} multiline markdown>
          {desc
            ? <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                <MarkdownContent>{desc}</MarkdownContent>
              </p>
            : <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                Beantwoord de onderstaande oriënterende vragen samen met de opdrachtgever of contactpersoon
                om te bepalen of (en welk type) geluidsonderzoek noodzakelijk is. De vragen hoeven niet
                volledig te worden ingevuld; elke beantwoorde vraag verbetert de aanbeveling.
              </p>
          }
        </InlineEdit>
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
      <FormGrid>
        <div>
          <FieldLabel>Naam respondent / contactpersoon</FieldLabel>
          <Input
            type="text"
            value={survey.respondentName ?? ''}
            onChange={(e) => upd({ respondentName: e.target.value })}
            placeholder="Naam…"
            className="w-full"
          />
        </div>
        <div>
          <FieldLabel>Datum voorverkenning</FieldLabel>
          <Input
            type="date"
            value={survey.completedAt ?? ''}
            onChange={(e) => upd({ completedAt: e.target.value })}
            className="w-full"
          />
        </div>
      </FormGrid>

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
              disabled={q.disabledWhen?.(survey.responses) ?? false}
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
            <Textarea
              value={survey.conclusionNotes ?? ''}
              onChange={(e) => upd({ conclusionNotes: e.target.value })}
              rows={3}
              placeholder="Toelichting bij de handmatige keuze…"
              className="w-full border-amber-200 dark:border-amber-700"
            />
          </div>
        )}

        {/* Conclusion notes (auto mode) */}
        {!survey.recommendationOverride && (
          <div className="mt-4">
            <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Toelichting / afspraken (voor rapport)
            </label>
            <Textarea
              value={survey.conclusionNotes ?? ''}
              onChange={(e) => upd({ conclusionNotes: e.target.value })}
              rows={3}
              placeholder="Context, afspraken met opdrachtgever…"
              className="w-full"
            />
          </div>
        )}
      </div>
    </div>
  );
}
