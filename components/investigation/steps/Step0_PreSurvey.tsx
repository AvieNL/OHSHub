'use client';

import { useState } from 'react';
import type {
  Investigation,
  HazardousPreSurvey,
  HazardousPreSurveyAnswer,
  HazardousRecommendation,
} from '@/lib/investigation-types';
import { Abbr } from '@/components/Abbr';
import { FieldLabel, FormGrid, Icon, Input, Textarea } from '@/components/ui';
import InlineStepHeader from '@/components/InlineStepHeader';
import InlineEdit from '@/components/InlineEdit';
import MarkdownContent from '@/components/MarkdownContent';

interface Props {
  investigation: Investigation;
  onUpdate: (partial: Partial<Investigation>) => void;
  contentOverrides?: Record<string, string>;
}

// ─── Vraagdefinities ──────────────────────────────────────────────────────────

type QuestionDef = {
  id: string;
  text: string;
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
    title: 'A — Stofidentificatie',
    subtitle: 'Arbobesluit hfst. 4 afd. 1 — inventarisatie gevaarlijke stoffen',
    questions: [
      { id: 'A1', text: 'Zijn er veiligheidsinformatiebladen (VIB/SDS) beschikbaar voor alle gebruikte stoffen?' },
      { id: 'A2', text: 'Zijn er stoffen aanwezig die als CMR zijn geclassificeerd (categorie 1A, 1B of 2)?' },
      { id: 'A3', text: 'Worden er processen uitgevoerd die stof, damp, gas, mist of rook genereren?' },
      { id: 'A4', text: 'Werken medewerkers in besloten of slecht geventileerde ruimten?' },
    ],
  },
  {
    id: 'B',
    title: 'B — Beheersmaatregelen',
    subtitle: 'Arbeidshygiënische strategie (Arbobesluit art. 4.1b)',
    questions: [
      { id: 'B1', text: 'Zijn er technische luchtbeheersmaatregelen aanwezig (bronafzuiging, insluiting, cabine)?' },
      { id: 'B2', text: 'Worden persoonlijke beschermingsmiddelen voor luchtwegen (PBM-A) gebruikt?' },
      { id: 'B3', text: 'Wordt de effectiviteit van beheersmaatregelen periodiek gecontroleerd (luchtmetingen, visuele inspectie)?' },
    ],
  },
  {
    id: 'C',
    title: 'C — Historische data',
    subtitle: 'NEN-EN 689:2018+C1:2019 §5.2 — eerdere informatie',
    questions: [
      { id: 'C1', text: 'Zijn er eerdere blootstellingsmetingen beschikbaar voor de betrokken stoffen?' },
      { id: 'C2', text: 'Zijn in eerder onderzoek grenswaarden (OEL/TGG) overschreden?' },
      { id: 'C3', text: 'Is het bedrijf eerder beoordeeld door een toezichthouder (ISZW/omgevingsdienst) wegens gevaarlijke stoffen?' },
    ],
  },
  {
    id: 'D',
    title: 'D — Gezondheid',
    subtitle: 'Arbowet art. 18 — biologische monitoring en PAGO',
    questions: [
      { id: 'D1', text: 'Zijn er gezondheidsklachten bij medewerkers die mogelijk gerelateerd zijn aan chemische blootstelling?' },
      { id: 'D2', text: 'Is er een periodiek medisch onderzoek (PMO/PAGO) voor blootgestelde medewerkers?' },
    ],
  },
  {
    id: 'E',
    title: 'E — Juridisch & administratief',
    subtitle: 'Arbowet art. 5 — RI&E; Arbobesluit hfst. 3 par. 2a (ATEX); hfst. 2 afd. 2 (ARIE)',
    questions: [
      { id: 'E1', text: 'Is de RI&E uitgevoerd en verwijst die expliciet naar gevaarlijke stoffen?' },
      { id: 'E2', text: 'Is er een ATEX-zone aanwezig op de werkplek (explosiegevaar ontvlambare stoffen)?' },
      { id: 'E3', text: 'Is het bedrijf ARIE-plichtig (grote hoeveelheden zeer gevaarlijke stoffen)?' },
    ],
  },
];

// ─── Aanbevelingslogica ────────────────────────────────────────────────────────

function computeRecommendation(
  responses: Record<string, { answer?: HazardousPreSurveyAnswer }>,
): HazardousRecommendation {
  const yes = (id: string) => responses[id]?.answer === 'yes';
  const yesOrUnknown = (id: string) =>
    responses[id]?.answer === 'yes' || responses[id]?.answer === 'unknown';

  // Volledig blootstellingsonderzoek (NEN-EN 689)
  if (yes('A2')) return 'full'; // CMR altijd volledig onderzoek
  const highSignals = ['A3', 'A4', 'C2', 'D1'].filter(yesOrUnknown).length;
  if (highSignals >= 2) return 'full';

  // Gericht deelonderzoek
  const moderateSignals = ['A1', 'A3', 'A4', 'C1', 'C2', 'C3', 'D1'].filter(yesOrUnknown).length;
  if (moderateSignals >= 2 && !(yes('B1') && yes('B3'))) return 'targeted';

  // Geen volledig onderzoek nodig
  return 'none';
}

const RECOMMENDATION_CONFIG: Record<
  HazardousRecommendation,
  { label: string; badge: string; badgeClass: string; description: string }
> = {
  full: {
    label: 'Volledig blootstellingsonderzoek aanbevolen',
    badge: 'Volledig onderzoek',
    badgeClass: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
    description:
      'Een volledig kwantitatief blootstellingsonderzoek conform NEN-EN 689:2018+C1:2019 is aangewezen. Dit omvat een meetstrategie, representatieve metingen en statistische toetsing aan de grenswaarden (OEL/TGG).',
  },
  targeted: {
    label: 'Gericht deelonderzoek overwegen',
    badge: 'Gericht onderzoek',
    badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
    description:
      'Er zijn signalen voor verhoogde blootstelling, maar de situatie rechtvaardigt mogelijk een gericht deelonderzoek voor specifieke stoffen of taken. Beoordeel welke stoffen prioriteit hebben.',
  },
  none: {
    label: 'Geen volledig onderzoek noodzakelijk',
    badge: 'Geen onderzoek',
    badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
    description:
      'Er zijn weinig signalen voor significante blootstelling en de beheersmaatregelen lijken afdoende. Heroverweeg bij veranderingen in processen, stoffen of klachten van medewerkers.',
  },
};

// ─── Sub-components ────────────────────────────────────────────────────────────

function AnswerButtons({
  answer,
  onChange,
}: {
  answer?: HazardousPreSurveyAnswer;
  onChange: (a: HazardousPreSurveyAnswer) => void;
}) {
  const btn = (val: HazardousPreSurveyAnswer, label: string, active: string, inactive: string) => (
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
}: {
  q: QuestionDef;
  response?: { answer?: HazardousPreSurveyAnswer; notes?: string };
  onAnswerChange: (id: string, a: HazardousPreSurveyAnswer) => void;
  onNotesChange: (id: string, notes: string) => void;
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
            <Icon name="note" size="sm" />
          </button>
        </div>
      </div>
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

// ─── Content keys ──────────────────────────────────────────────────────────────

const STEP_KEY = 'step.0';
const NS = 'investigation.hazardous-substances';
const FALLBACK_TITLE = 'Stap 1 — Voorverkenning gevaarlijke stoffen';
const FALLBACK_DESC = 'Beantwoord de onderstaande oriënterende vragen samen met de opdrachtgever of contactpersoon om te bepalen of en welk type blootstellingsonderzoek noodzakelijk is. Elke beantwoorde vraag verbetert de aanbeveling.';

// ─── Hoofdcomponent ────────────────────────────────────────────────────────────

export default function Step0_PreSurvey({ investigation, onUpdate, contentOverrides }: Props) {
  const survey: HazardousPreSurvey = investigation.preSurvey ?? { responses: {} };

  const title = contentOverrides?.[`${STEP_KEY}.title`] ?? FALLBACK_TITLE;
  const desc = contentOverrides?.[`${STEP_KEY}.desc`];

  function upd(patch: Partial<HazardousPreSurvey>) {
    const newSurvey = { ...survey, ...patch };
    const autoRec = computeRecommendation(newSurvey.responses);
    const preSurveyRecommendation = newSurvey.recommendationOverride ?? autoRec;
    onUpdate({
      preSurvey: newSurvey,
      preSurveyRecommendation,
    });
  }

  function setAnswer(id: string, answer: HazardousPreSurveyAnswer) {
    upd({ responses: { ...survey.responses, [id]: { ...survey.responses[id], answer } } });
  }

  function setNotes(id: string, notes: string) {
    upd({ responses: { ...survey.responses, [id]: { ...survey.responses[id], notes } } });
  }

  const autoRecommendation = computeRecommendation(survey.responses);
  const effectiveRecommendation = survey.recommendationOverride ?? autoRecommendation;

  const allQuestions = CATEGORIES.flatMap((c) => c.questions);
  const answeredCount = allQuestions.filter((q) => survey.responses[q.id]?.answer).length;
  const totalQuestions = allQuestions.length;

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
                om te bepalen of en welk type blootstellingsonderzoek noodzakelijk is. Elke beantwoorde
                vraag verbetert de aanbeveling.
              </p>
          }
        </InlineEdit>
      </div>

      <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
        Een voorverkenning vervangt geen kwantitatief blootstellingsonderzoek conform{' '}
        <Abbr id="NEN-EN 689">NEN-EN 689</Abbr>:2018+C1:2019, maar helpt om de omvang, urgentie
        en aanpak te bepalen. De definitieve beslissing berust bij de{' '}
        <Abbr id="AH">arbeidshygiënist</Abbr> of{' '}
        <Abbr id="HVK">hogere veiligheidskundige</Abbr>.
      </p>

      {/* Metagegevens */}
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

      {/* Voortgangsindicator */}
      <div className="flex items-center gap-3 text-xs text-zinc-400 dark:text-zinc-500">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
          <div
            className="h-full rounded-full bg-orange-400 transition-all"
            style={{
              width: totalQuestions > 0 ? `${(answeredCount / totalQuestions) * 100}%` : '0%',
            }}
          />
        </div>
        <span>{answeredCount}/{totalQuestions} vragen beantwoord</span>
      </div>

      {/* Vragencategorieën A–E */}
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
            />
          ))}
        </div>
      ))}

      {/* Beslishulp: aanbeveling */}
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-700 dark:bg-zinc-800/40">
        <h3 className="mb-4 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
          F — Beslishulp: aanbeveling
        </h3>

        <div className="flex flex-col gap-3">
          {(['full', 'targeted', 'none'] as HazardousRecommendation[]).map((val) => {
            const cfg = RECOMMENDATION_CONFIG[val];
            const isSelected = effectiveRecommendation === val;
            const isRecommended = autoRecommendation === val;
            const borderColor =
              val === 'full'
                ? 'border-red-300 bg-red-50 dark:border-red-700/60 dark:bg-red-900/15'
                : val === 'targeted'
                  ? 'border-amber-300 bg-amber-50 dark:border-amber-700/60 dark:bg-amber-900/15'
                  : 'border-emerald-300 bg-emerald-50 dark:border-emerald-700/60 dark:bg-emerald-900/15';
            return (
              <button
                key={val}
                type="button"
                onClick={() =>
                  upd({
                    recommendationOverride: isRecommended ? undefined : val,
                  })
                }
                className={`rounded-lg border p-3 text-left transition ${
                  isSelected
                    ? `${borderColor} ring-2 ring-offset-1 ${
                        val === 'full'
                          ? 'ring-red-400 dark:ring-red-600'
                          : val === 'targeted'
                            ? 'ring-amber-400 dark:ring-amber-600'
                            : 'ring-emerald-400 dark:ring-emerald-600'
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

        {/* Handmatige override melding */}
        {survey.recommendationOverride && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800/40 dark:bg-amber-900/10">
            <p className="mb-3 text-xs text-amber-800 dark:text-amber-400">
              <strong>Handmatig gekozen</strong> — wijkt af van de automatische aanbeveling
              ({RECOMMENDATION_CONFIG[autoRecommendation].badge}). Geef hieronder een toelichting.
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

        {/* Toelichting in automatische modus */}
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
