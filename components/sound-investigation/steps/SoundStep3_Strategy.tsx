'use client';

import type { SoundInvestigation, SoundHEG, SoundStrategy, WorkPattern } from '@/lib/sound-investigation-types';
import { Abbr } from '@/components/Abbr';
import { Formula } from '@/components/Formula';
import { Alert, Badge, Card, FieldLabel, Textarea } from '@/components/ui';
import InlineStepHeader from '@/components/InlineStepHeader';
import InlineEdit from '@/components/InlineEdit';
import MarkdownContent from '@/components/MarkdownContent';

interface Props {
  investigation: SoundInvestigation;
  onUpdate: (partial: Partial<SoundInvestigation>) => void;
  onGoToStep: (step: number) => void;
  contentOverrides?: Record<string, string>;
}

const STEP_KEY = 'step.3';
const NS = 'investigation.sound';
const FALLBACK_TITLE = 'Stap 4 — Meetstrategie';
const FALLBACK_DESC = 'Kies per HEG de meetstrategie op basis van het werkpatroon. Tabel B.1 van NEN-EN-ISO 9612:2025 geeft de aanbevolen en acceptabele strategieën per situatie.';

// Annex B Table B.1 — three tiers: preferred (✓ᵃ), acceptable (✓), not recommended (—)
const STRATEGY_GUIDANCE: Record<WorkPattern, {
  preferred: SoundStrategy[];
  acceptable: SoundStrategy[];
  note: string;
}> = {
  'stationary-simple': {
    preferred:  ['task-based'],
    acceptable: [],
    note: 'Vaste werkplek met enkelvoudige taak — taakgerichte meting is de enige aanbevolen keuze. Functiegerichte en volledige-dagmeting zijn niet aanbevolen.',
  },
  'stationary-complex': {
    preferred:  ['task-based'],
    acceptable: ['job-based', 'full-day'],
    note: 'Vaste werkplek met meerdere taken — taakgerichte meting is eerste keuze. Functiegerichte en volledige-dagmeting zijn acceptabele alternatieven.',
  },
  'mobile-predictable-small': {
    preferred:  ['task-based'],
    acceptable: ['job-based', 'full-day'],
    note: 'Mobiele medewerker, voorspelbaar patroon, weinig taken — taakgerichte meting is eerste keuze. De andere strategieën zijn acceptabel.',
  },
  'mobile-predictable-large': {
    preferred:  ['full-day'],
    acceptable: ['task-based', 'job-based'],
    note: 'Mobiele medewerker, veel of complexe taken — volledige-dagmeting is eerste keuze. Taakgerichte en functiegerichte meting zijn acceptabele alternatieven.',
  },
  'mobile-unpredictable': {
    preferred:  ['full-day'],
    acceptable: ['job-based'],
    note: 'Onvoorspelbaar werkpatroon — volledige-dagmeting is eerste keuze. Functiegerichte meting is een acceptabel alternatief. Taakgerichte meting is niet aanbevolen.',
  },
  'multiple-tasks-unspecified': {
    preferred:  ['job-based'],
    acceptable: ['full-day'],
    note: 'Meerdere taken met onbekende taaklengtes — functiegerichte meting is eerste keuze. Volledige-dagmeting is acceptabel. Taakgerichte meting is niet aanbevolen.',
  },
  'no-tasks-assigned': {
    preferred:  ['job-based'],
    acceptable: ['full-day'],
    note: 'Geen vaste taken toegewezen — functiegerichte meting is eerste keuze. Volledige-dagmeting is acceptabel. Taakgerichte meting is niet aanbevolen.',
  },
  'unspecified': {
    preferred:  [],
    acceptable: ['task-based', 'job-based', 'full-day'],
    note: 'Bepaal het werkpatroon in stap 3 voor een gericht strategieadvies.',
  },
};

const STRATEGY_DESCRIPTIONS: Record<SoundStrategy, { title: string; when: string; pros: string; cons: string }> = {
  'task-based': {
    title: 'Strategie 1 — Taakgerichte meting',
    when:  'Aanbevolen wanneer het werk in goed te definiëren taken kan worden opgedeeld met bekende duur.',
    pros:  'Geeft inzicht in welke taken het meest bijdragen. Minste meetduur bij grote groepen. Eenvoudig te herhalen bij gewijzigde taken.',
    cons:  'Vereist gedetailleerde werkanalyse. Niet geschikt bij onbekende taakduur of onvoorspelbare werksituaties.',
  },
  'job-based': {
    title: 'Strategie 2 — Functiegerichte meting',
    when:  'Geschikt wanneer taken moeilijk te onderscheiden zijn of de taakduur niet goed te bepalen is.',
    pros:  'Minder tijdrovende werkanalyse. Minder meetduur dan volledige-dagmeting bij grote HEGs.',
    cons:  'Geen taakbijdragen per taak zichtbaar. Grotere onzekerheid dan strategie 1 bij complexe situaties.',
  },
  'full-day': {
    title: 'Strategie 3 — Volledige-dagmeting',
    when:  'Aanbevolen bij onbekend, onvoorspelbaar of complex werkpatroon. Eenvoudigste werkanalyse.',
    pros:  'Omvat alle bijdragen van nature. Minste voorkennis werkpatroon vereist. Geschikt als verificatie.',
    cons:  'Hoogste risico op artefacten (mechanische microfoonimpacten). Logging-instrument sterk aanbevolen.',
  },
};

function StrategyCard({
  heg,
  onUpdateHEG,
}: {
  heg: SoundHEG;
  onUpdateHEG: (updated: SoundHEG) => void;
}) {
  const guidance = STRATEGY_GUIDANCE[heg.workPattern ?? 'unspecified'];

  return (
    <Card>
      <div className="border-b border-zinc-200 px-5 py-3 dark:border-zinc-700">
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{heg.name}</p>
        <p className="text-xs text-zinc-400">
          {heg.workerCount} medewerker{heg.workerCount !== 1 ? 's' : ''} · <Formula math="T_e" /> = {heg.effectiveDayHours} h
        </p>
      </div>

      <div className="p-5 space-y-4">
        {/* Bijlage B guidance */}
        <p className="rounded-lg bg-blue-50 px-3 py-2.5 text-xs text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
          {guidance.note}
        </p>

        {/* Strategy selection */}
        <div className="space-y-2">
          {(['task-based', 'job-based', 'full-day'] as SoundStrategy[]).map((s) => {
            const desc = STRATEGY_DESCRIPTIONS[s];
            const isSelected  = heg.strategy === s;
            const isPreferred = guidance.preferred.includes(s);
            const isAcceptable = guidance.acceptable.includes(s);
            const isNotRec    = !isPreferred && !isAcceptable;
            return (
              <button
                key={s}
                type="button"
                onClick={() => onUpdateHEG({ ...heg, strategy: s })}
                className={`w-full rounded-xl border p-4 text-left transition ${
                  isSelected
                    ? 'border-orange-400 bg-orange-50 dark:border-orange-600 dark:bg-orange-900/20'
                    : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                      isSelected
                        ? 'border-orange-500 bg-orange-500'
                        : 'border-zinc-300 dark:border-zinc-600'
                    }`}
                  >
                    {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className={`text-sm font-semibold ${isSelected ? 'text-orange-700 dark:text-orange-300' : 'text-zinc-800 dark:text-zinc-200'}`}>
                        {desc.title}
                      </p>
                      {isPreferred  && <Badge variant="emerald" shape="square">Aanbevolen</Badge>}
                      {isAcceptable && <Badge variant="zinc"    shape="square">Acceptabel</Badge>}
                      {isNotRec     && <Badge variant="amber"   shape="square">Niet aanbevolen</Badge>}
                    </div>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{desc.when}</p>
                    <div className="mt-2 grid gap-1 text-xs sm:grid-cols-2">
                      <p className="text-emerald-700 dark:text-emerald-400">+ {desc.pros}</p>
                      <p className="text-amber-700 dark:text-amber-400">− {desc.cons}</p>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Justification */}
        <div>
          <FieldLabel>Motivering keuze meetstrategie</FieldLabel>
          <Textarea
            rows={2}
            value={heg.notes ?? ''}
            onChange={(e) => onUpdateHEG({ ...heg, notes: e.target.value })}
            placeholder="Beschrijf waarom deze strategie is gekozen gezien het werkpatroon en de meetomstandigheden…"
            className="w-full"
          />
        </div>
      </div>
    </Card>
  );
}

export default function SoundStep3_Strategy({ investigation, onUpdate, onGoToStep, contentOverrides }: Props) {
  const { hegs } = investigation;

  const title = contentOverrides?.[`${STEP_KEY}.title`] ?? FALLBACK_TITLE;
  const desc  = contentOverrides?.[`${STEP_KEY}.desc`];

  function updateHEG(updated: SoundHEG) {
    onUpdate({ hegs: hegs.map((h) => (h.id === updated.id ? updated : h)) });
  }

  if (hegs.length === 0) {
    return (
      <div className="space-y-4">
        <InlineStepHeader namespace={NS} stepKey={STEP_KEY} fallbackTitle={FALLBACK_TITLE} title={title} />
        <Alert variant="warning" size="md">
          Definieer eerst <Abbr id="HEG">HEG</Abbr>&apos;s in{' '}
          <button type="button" onClick={() => onGoToStep(2)} className="cursor-pointer underline decoration-dotted underline-offset-2 hover:no-underline">stap 3</button>,
          dan kunt u hier per <Abbr id="HEG">HEG</Abbr> de meetstrategie kiezen.
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <InlineStepHeader namespace={NS} stepKey={STEP_KEY} fallbackTitle={FALLBACK_TITLE} title={title} />
        <InlineEdit namespace={NS} contentKey={`${STEP_KEY}.desc`}
          initialValue={desc ?? FALLBACK_DESC} fallback={FALLBACK_DESC} multiline markdown>
          {desc
            ? <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                <MarkdownContent>{desc}</MarkdownContent>
              </p>
            : <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                Kies per <Abbr id="HEG">HEG</Abbr> de meetstrategie op basis van het werkpatroon.
                Tabel B.1 van <Abbr id="NEN9612">NEN-EN-ISO 9612</Abbr>:2025 geeft de aanbevolen en acceptabele strategieën per situatie.
              </p>
          }
        </InlineEdit>
      </div>

      <div className="space-y-5">
        {hegs.map((heg) => (
          <StrategyCard key={heg.id} heg={heg} onUpdateHEG={updateHEG} />
        ))}
      </div>
    </div>
  );
}
