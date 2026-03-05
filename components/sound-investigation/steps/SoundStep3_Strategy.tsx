'use client';

import type { SoundInvestigation, SoundHEG, SoundStrategy, WorkPattern } from '@/lib/sound-investigation-types';
import { Abbr } from '@/components/Abbr';
import { Formula } from '@/components/Formula';
import { SectionRef } from '@/components/SectionRef';
import { InfoBox } from '@/components/InfoBox';
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
const FALLBACK_TITLE = 'Stap 4 — Meetstrategie (§8 NEN-EN-ISO 9612:2025)';
const FALLBACK_DESC = 'Kies per HEG de meetstrategie op basis van het werkpatroon. Bijlage B Tabel B.1 geeft richtlijnen. Documenteer de keuze (§15.b.4 — meetstrategie met normatieve verwijzing).';
const FALLBACK_IB0_TITLE = '§6 — Methodologie';

// Annex B Table B.1 — recommended strategies per work pattern
const STRATEGY_GUIDANCE: Record<WorkPattern, { rec: SoundStrategy[]; note: string }> = {
  'stationary-simple': {
    rec: ['task-based'],
    note: 'Taakgerichte meting is aanbevolen (√ᵃ). Vaste werkplek met enkelvoudige taak leent zich goed voor strategie 1.',
  },
  'stationary-complex': {
    rec: ['task-based', 'job-based', 'full-day'],
    note: 'Alle drie strategieën zijn toepasbaar. Taakgerichte meting is aanbevolen voor gedetailleerde taakbijdragen.',
  },
  'mobile-predictable-small': {
    rec: ['task-based', 'job-based', 'full-day'],
    note: 'Taakgerichte meting is aanbevolen voor mobiele medewerkers met voorspelbaar patroon en weinig taken.',
  },
  'mobile-predictable-large': {
    rec: ['task-based', 'job-based', 'full-day'],
    note: 'Bij veel of complexe taken is volledige-dagmeting (strategie 3) ook aanbevolen voor volledigheid.',
  },
  'mobile-unpredictable': {
    rec: ['job-based', 'full-day'],
    note: 'Bij onvoorspelbaar werkpatroon is taakgerichte meting niet uitvoerbaar. Gebruik strategie 2 (functioneel) of 3 (volledige dag).',
  },
  'unspecified': {
    rec: ['task-based', 'job-based', 'full-day'],
    note: 'Bepaal het werkpatroon in stap 3 voor een gerichte strategieadvies (Bijlage B Tabel B.1).',
  },
};

const STRATEGY_DESCRIPTIONS: Record<SoundStrategy, { title: string; when: string; pros: string; cons: string }> = {
  'task-based': {
    title: '§9 — Taakgerichte meting (Strategie 1)',
    when: 'Aanbevolen wanneer het werk in goed te definiëren taken kan worden opgedeeld met bekende duur.',
    pros: 'Geeft inzicht in welke taken het meest bijdragen. Minste meetduur bij grote groepen. Eenvoudig te herhalen bij gewijzigde taken.',
    cons: 'Vereist gedetailleerde werkanalyse. Niet geschikt bij onbekende taakduur of onvoorspelbare werksituaties.',
  },
  'job-based': {
    title: '§10 — Functiegericht meten (Strategie 2)',
    when: 'Geschikt wanneer taken moeilijk te onderscheiden zijn of de taakduur niet goed te bepalen is.',
    pros: 'Minder tijdrovende werkanalyse. Minder meetduur dan volledigedagmeting bij grote HEGs.',
    cons: 'Geen taakbijdragen per taak zichtbaar. Grotere onzekerheid dan strategie 1 bij complexe situaties.',
  },
  'full-day': {
    title: '§11 — Volledige-dagmeting (Strategie 3)',
    when: 'Aanbevolen bij onbekend, onvoorspelbaar of complex werkpatroon. Eenvoudigste werkanalyse.',
    pros: 'Omvat alle bijdragen van nature. Minste voorkennis werkpatroon vereist. Geschikt als verificatie.',
    cons: 'Hoogste risico op artefacten (mechanische microfoonimpacten). Logging-instrument sterk aanbevolen.',
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
        {/* Guidance note */}
        <InfoBox title="Bijlage B — meetstrategieadvies" variant="blue">
          <strong>Bijlage B advies:</strong> {guidance.note}
        </InfoBox>

        {/* Strategy selection */}
        <div className="space-y-2">
          {(['task-based', 'job-based', 'full-day'] as SoundStrategy[]).map((s) => {
            const desc = STRATEGY_DESCRIPTIONS[s];
            const isSelected = heg.strategy === s;
            const isRec = guidance.rec.includes(s);
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
                    {isSelected && (
                      <div className="h-1.5 w-1.5 rounded-full bg-white" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-semibold ${isSelected ? 'text-orange-700 dark:text-orange-300' : 'text-zinc-800 dark:text-zinc-200'}`}>
                        {desc.title}
                      </p>
                      {isRec && (
                        <Badge variant="emerald" shape="square">Aanbevolen</Badge>
                      )}
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
          <FieldLabel>
            Motivering keuze meetstrategie (<SectionRef id="§15.b.4">§15.b.4</SectionRef>)
          </FieldLabel>
          <Textarea
            rows={2}
            value={heg.notes ?? ''}
            onChange={(e) => onUpdateHEG({ ...heg, notes: e.target.value })}
            placeholder="Beschrijf waarom deze strategie is gekozen…"
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
  const desc = contentOverrides?.[`${STEP_KEY}.desc`];
  const ib0Title = contentOverrides?.[`${STEP_KEY}.infobox.0.title`] ?? FALLBACK_IB0_TITLE;
  const ib0Content = contentOverrides?.[`${STEP_KEY}.infobox.0.content`];

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
                Kies per <Abbr id="HEG">HEG</Abbr> de meetstrategie op basis van het werkpatroon. Bijlage B Tabel B.1 geeft
                richtlijnen. Documenteer de keuze (<SectionRef id="§15.b.4">§15.b.4</SectionRef> — meetstrategie met normatieve verwijzing).
              </p>
          }
        </InlineEdit>
      </div>

      <InfoBox title={
        <InlineEdit namespace={NS} contentKey={`${STEP_KEY}.infobox.0.title`}
          initialValue={ib0Title} fallback={FALLBACK_IB0_TITLE}>
          {ib0Title}
        </InlineEdit>
      }>
        <InlineEdit namespace={NS} contentKey={`${STEP_KEY}.infobox.0.content`}
          initialValue={ib0Content ?? ''} fallback="" multiline markdown>
          {ib0Content
            ? <MarkdownContent>{ib0Content}</MarkdownContent>
            : <><SectionRef id="§6">§6 Methodologie</SectionRef>: Het meetproces bestaat uit 5 stappen: (1) werkanalyse,
              (2) selectie meetstrategie, (3) metingen, (4) fouten behandelen, (5) berekenen &amp;
              presenteren inclusief onzekerheid (Bijlage C).</>
          }
        </InlineEdit>
      </InfoBox>

      <div className="space-y-5">
        {hegs.map((heg) => (
          <StrategyCard key={heg.id} heg={heg} onUpdateHEG={updateHEG} />
        ))}
      </div>
    </div>
  );
}
