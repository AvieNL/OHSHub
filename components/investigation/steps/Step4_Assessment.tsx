'use client';

import type {
  Investigation,
  WorkTask,
  Substance,
  InitialEstimate,
  TierOneResult,
  ExposureDecision,
  ExposureBand,
} from '@/lib/investigation-types';

interface Props {
  investigation: Investigation;
  onUpdate: (partial: Partial<Investigation>) => void;
}

// ─── Tier-1 exposure model ────────────────────────────────────────────────────

function computeTierOne(task: WorkTask, substance: Substance): TierOneResult {
  // Basis factor (state + vapour pressure / dustiness)
  let basis = 10;
  const state = substance.aggregateState;
  const vp = substance.vapourPressure ?? 1;
  const dustiness = substance.dustiness ?? 'medium';

  if (state === 'gas') basis = 50;
  else if (state === 'vapor-liquid') {
    basis = vp > 50 ? 100 : vp > 10 ? 40 : vp > 0.5 ? 10 : 2;
  } else if (state === 'liquid') {
    basis = vp > 10 ? 15 : vp > 1 ? 5 : 1;
  } else if (state === 'solid-powder') {
    basis = dustiness === 'high' ? 20 : dustiness === 'medium' ? 5 : 1;
  } else if (state === 'aerosol') {
    basis = 80;
  }

  // Process factor
  const pf =
    task.processType === 'closed' ? 0.05
    : task.processType === 'partly-closed' ? 0.2
    : task.processType === 'high-emission' ? 5.0
    : 1.0;

  // Quantity factor
  const qf =
    task.quantityPerTask === '<100g' ? 0.5
    : task.quantityPerTask === '1-10kg' ? 5
    : task.quantityPerTask === '>10kg' ? 10
    : 2;

  // Duration factor (normalised to 8h TWA)
  const df =
    task.durationPerDay === '<15min' ? 0.03
    : task.durationPerDay === '15-60min' ? 0.1
    : task.durationPerDay === '1-2u' ? 0.2
    : task.durationPerDay === '4-8u' ? 0.8
    : task.durationPerDay === '>8u' ? 1.2
    : 0.4;

  // Control score
  const levF =
    task.lev === 'full' ? 100
    : task.lev === 'partial' ? 50
    : task.lev === 'point' ? 20
    : 1;

  const ventF =
    task.ventilation === '>6ACH' ? 5.0
    : task.ventilation === '3-6ACH' ? 2.0
    : task.ventilation === '1-3ACH' ? 1.0
    : task.ventilation === '<1ACH' ? 0.7
    : 0.3;

  const roomF =
    task.roomSize === '>500m3' ? 2.5
    : task.roomSize === '50-500m3' ? 1.0
    : 0.5;

  const controlScore = levF * ventF * roomF;
  const score = (basis * pf * qf * df) / controlScore;

  let band: ExposureBand;
  let label: string;
  let measurementAdvice: string;

  if (score < 0.5) {
    band = 'A';
    label = 'Band A — < 10% van de OELV';
    measurementAdvice = 'Geen meting nodig. Documenteer de kwalitatieve beoordeling.';
  } else if (score < 5) {
    band = 'B';
    label = 'Band B — 10–50% van de OELV';
    measurementAdvice = 'Oriënterende meting aanbevolen (minimaal 3 metingen).';
  } else if (score < 25) {
    band = 'C';
    label = 'Band C — 50–100% van de OELV';
    measurementAdvice = 'Volledige NEN-EN 689 meetcampagne vereist (≥ 6 metingen, worst-case strategie).';
  } else {
    band = 'D';
    label = 'Band D — > 100% van de OELV';
    measurementAdvice = 'Directe actie verplicht + spoedmeting. Overweeg werkstop.';
  }

  return { band, score, label, measurementAdvice };
}

// ─── Breakdown model ──────────────────────────────────────────────────────────

interface FactorRow { label: string; factor: number; }

interface TierBreakdown {
  stateRow: FactorRow;
  processRow: FactorRow;
  quantityRow: FactorRow;
  durationRow: FactorRow;
  levRow: FactorRow;
  ventRow: FactorRow;
  roomRow: FactorRow;
  emissionScore: number;
  controlScore: number;
}

function computeBreakdown(task: WorkTask, substance: Substance): TierBreakdown {
  const state = substance.aggregateState;
  const vp = substance.vapourPressure ?? 1;
  const vpUnit = substance.vapourPressureUnit ?? 'kPa';
  const dustiness = substance.dustiness ?? 'medium';

  let basis: number;
  let stateLabel: string;
  if (state === 'gas') {
    basis = 50; stateLabel = 'Gas';
  } else if (state === 'vapor-liquid') {
    if (vp > 50)      { basis = 100; stateLabel = `Damp/vloeistof — damspanning ${vp} ${vpUnit} (> 50 kPa)`; }
    else if (vp > 10) { basis = 40;  stateLabel = `Damp/vloeistof — damspanning ${vp} ${vpUnit} (10–50 kPa)`; }
    else if (vp > 0.5){ basis = 10;  stateLabel = `Damp/vloeistof — damspanning ${vp} ${vpUnit} (0.5–10 kPa)`; }
    else              { basis = 2;   stateLabel = `Damp/vloeistof — damspanning ${vp} ${vpUnit} (< 0.5 kPa)`; }
  } else if (state === 'liquid') {
    if (vp > 10)      { basis = 15; stateLabel = `Vloeistof — damspanning ${vp} ${vpUnit} (> 10 kPa)`; }
    else if (vp > 1)  { basis = 5;  stateLabel = `Vloeistof — damspanning ${vp} ${vpUnit} (1–10 kPa)`; }
    else              { basis = 1;  stateLabel = `Vloeistof — damspanning ${vp} ${vpUnit} (≤ 1 kPa)`; }
  } else if (state === 'solid-powder') {
    const dl = dustiness === 'high' ? 'hoog' : dustiness === 'medium' ? 'middel' : 'laag';
    basis = dustiness === 'high' ? 20 : dustiness === 'medium' ? 5 : 1;
    stateLabel = `Vaste stof/poeder — stuifpotentieel ${dl}`;
  } else {
    basis = 80; stateLabel = 'Aerosol / nevel';
  }

  const PROCESS_LABELS: Record<string, string> = {
    closed: 'Gesloten systeem', 'partly-closed': 'Gedeeltelijk gesloten',
    open: 'Open handeling', 'high-emission': 'Open, hoge emissie',
  };
  const pf = task.processType === 'closed' ? 0.05 : task.processType === 'partly-closed' ? 0.2
    : task.processType === 'high-emission' ? 5.0 : 1.0;

  const QTY_LABELS: Record<string, string> = {
    '<100g': '< 100 g/ml', '100g-1kg': '100 g – 1 kg', '1-10kg': '1 – 10 kg', '>10kg': '> 10 kg',
  };
  const qf = task.quantityPerTask === '<100g' ? 0.5 : task.quantityPerTask === '1-10kg' ? 5
    : task.quantityPerTask === '>10kg' ? 10 : 2;

  const DUR_LABELS: Record<string, string> = {
    '<15min': '< 15 min/dag', '15-60min': '15 – 60 min/dag', '1-2u': '1 – 2 u/dag',
    '2-4u': '2 – 4 u/dag', '4-8u': '4 – 8 u/dag', '>8u': '> 8 u/dag',
  };
  const df = task.durationPerDay === '<15min' ? 0.03 : task.durationPerDay === '15-60min' ? 0.1
    : task.durationPerDay === '1-2u' ? 0.2 : task.durationPerDay === '4-8u' ? 0.8
    : task.durationPerDay === '>8u' ? 1.2 : 0.4;

  const LEV_LABELS: Record<string, string> = {
    none: 'Geen LEV', point: 'Bronafzuiging', partial: 'Gedeeltelijke LEV', full: 'Volledige LEV',
  };
  const levF = task.lev === 'full' ? 100 : task.lev === 'partial' ? 50 : task.lev === 'point' ? 20 : 1;

  const VENT_LABELS: Record<string, string> = {
    none: 'Geen ventilatie', '<1ACH': '< 1 ACH', '1-3ACH': '1 – 3 ACH', '3-6ACH': '3 – 6 ACH', '>6ACH': '> 6 ACH',
  };
  const ventF = task.ventilation === '>6ACH' ? 5.0 : task.ventilation === '3-6ACH' ? 2.0
    : task.ventilation === '1-3ACH' ? 1.0 : task.ventilation === '<1ACH' ? 0.7 : 0.3;

  const ROOM_LABELS: Record<string, string> = {
    '<50m3': '< 50 m³', '50-500m3': '50 – 500 m³', '>500m3': '> 500 m³',
  };
  const roomF = task.roomSize === '>500m3' ? 2.5 : task.roomSize === '50-500m3' ? 1.0 : 0.5;

  return {
    stateRow:    { label: stateLabel,                                          factor: basis },
    processRow:  { label: PROCESS_LABELS[task.processType]  ?? task.processType,  factor: pf },
    quantityRow: { label: QTY_LABELS[task.quantityPerTask]  ?? task.quantityPerTask, factor: qf },
    durationRow: { label: DUR_LABELS[task.durationPerDay]   ?? task.durationPerDay, factor: df },
    levRow:      { label: LEV_LABELS[task.lev]              ?? task.lev,           factor: levF },
    ventRow:     { label: VENT_LABELS[task.ventilation]     ?? task.ventilation,    factor: ventF },
    roomRow:     { label: ROOM_LABELS[task.roomSize]        ?? task.roomSize,       factor: roomF },
    emissionScore: basis * pf * qf * df,
    controlScore:  levF * ventF * roomF,
  };
}

// ─── Motivation panel ─────────────────────────────────────────────────────────

function MotivationPanel({ task, substance, score }: { task: WorkTask; substance: Substance; score: number }) {
  const b = computeBreakdown(task, substance);

  const emissionRows: [string, FactorRow][] = [
    ['Toestand / emissie',  b.stateRow],
    ['Procesvorm',          b.processRow],
    ['Hoeveelheid',         b.quantityRow],
    ['Blootstellingsduur',  b.durationRow],
  ];
  const controlRows: [string, FactorRow][] = [
    ['LEV',        b.levRow],
    ['Ventilatie', b.ventRow],
    ['Ruimte',     b.roomRow],
  ];

  function fmt(n: number) { return n % 1 === 0 ? String(n) : n.toFixed(2); }

  return (
    <details className="group mt-3">
      <summary className="flex cursor-pointer select-none list-none items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300">
        <svg className="h-3 w-3 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        Hoe is de index berekend?
      </summary>

      <div className="mt-2 overflow-hidden rounded-lg border border-zinc-200 bg-white text-xs dark:border-zinc-700 dark:bg-zinc-900">
        {/* Emission table */}
        <table className="w-full">
          <thead>
            <tr className="bg-zinc-50 dark:bg-zinc-800/60">
              <th className="px-3 py-2 text-left font-semibold text-zinc-500 dark:text-zinc-400" colSpan={2}>Emissiefactoren</th>
              <th className="px-3 py-2 text-right font-semibold text-zinc-500 dark:text-zinc-400">Waarde</th>
            </tr>
          </thead>
          <tbody>
            {emissionRows.map(([name, row], i) => (
              <tr key={i} className="border-t border-zinc-100 dark:border-zinc-800">
                <td className="px-3 py-1.5 text-zinc-400 dark:text-zinc-500">{name}</td>
                <td className="px-3 py-1.5 text-zinc-600 dark:text-zinc-300">{row.label}</td>
                <td className="px-3 py-1.5 text-right font-mono text-zinc-700 dark:text-zinc-200">
                  {i === 0 ? fmt(row.factor) : `× ${fmt(row.factor)}`}
                </td>
              </tr>
            ))}
            <tr className="border-t border-zinc-200 bg-zinc-50 font-semibold dark:border-zinc-700 dark:bg-zinc-800/60">
              <td className="px-3 py-1.5 text-zinc-500 dark:text-zinc-400" colSpan={2}>Emissiescore</td>
              <td className="px-3 py-1.5 text-right font-mono text-zinc-800 dark:text-zinc-100">= {fmt(b.emissionScore)}</td>
            </tr>
          </tbody>
        </table>

        {/* Control table */}
        <table className="w-full border-t-2 border-zinc-200 dark:border-zinc-700">
          <thead>
            <tr className="bg-zinc-50 dark:bg-zinc-800/60">
              <th className="px-3 py-2 text-left font-semibold text-zinc-500 dark:text-zinc-400" colSpan={2}>Beheersmaatregelen</th>
              <th className="px-3 py-2 text-right font-semibold text-zinc-500 dark:text-zinc-400">Waarde</th>
            </tr>
          </thead>
          <tbody>
            {controlRows.map(([name, row], i) => (
              <tr key={i} className="border-t border-zinc-100 dark:border-zinc-800">
                <td className="px-3 py-1.5 text-zinc-400 dark:text-zinc-500">{name}</td>
                <td className="px-3 py-1.5 text-zinc-600 dark:text-zinc-300">{row.label}</td>
                <td className="px-3 py-1.5 text-right font-mono text-zinc-700 dark:text-zinc-200">
                  {i === 0 ? fmt(row.factor) : `× ${fmt(row.factor)}`}
                </td>
              </tr>
            ))}
            <tr className="border-t border-zinc-200 bg-zinc-50 font-semibold dark:border-zinc-700 dark:bg-zinc-800/60">
              <td className="px-3 py-1.5 text-zinc-500 dark:text-zinc-400" colSpan={2}>Beheerscore</td>
              <td className="px-3 py-1.5 text-right font-mono text-zinc-800 dark:text-zinc-100">= {fmt(b.controlScore)}</td>
            </tr>
          </tbody>
        </table>

        {/* Result */}
        <div className="border-t-2 border-zinc-200 bg-zinc-50 px-3 py-2.5 text-center font-mono dark:border-zinc-700 dark:bg-zinc-800/60">
          <span className="text-zinc-500 dark:text-zinc-400">
            Index = {fmt(b.emissionScore)} ÷ {fmt(b.controlScore)} =&nbsp;
          </span>
          <span className="font-bold text-zinc-900 dark:text-zinc-50">{score.toFixed(2)}</span>
        </div>
      </div>
    </details>
  );
}

// ─── Band visual ──────────────────────────────────────────────────────────────

const BAND_COLORS: Record<
  ExposureBand,
  { active: string; inactive: string; pct: string }
> = {
  A: { active: 'bg-emerald-500 text-white', inactive: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400', pct: '< 10%' },
  B: { active: 'bg-amber-400 text-white', inactive: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400', pct: '10–50%' },
  C: { active: 'bg-orange-500 text-white', inactive: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400', pct: '50–100%' },
  D: { active: 'bg-red-600 text-white', inactive: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400', pct: '> 100%' },
};

function BandVisual({ band }: { band: ExposureBand }) {
  const bands: ExposureBand[] = ['A', 'B', 'C', 'D'];
  return (
    <div className="grid grid-cols-4 gap-1">
      {bands.map((b) => {
        const c = BAND_COLORS[b];
        const isActive = b === band;
        return (
          <div
            key={b}
            className={`rounded-lg px-2 py-2 text-center text-xs font-bold transition ${isActive ? c.active : c.inactive}`}
          >
            <div className="text-sm font-bold">{b}</div>
            <div className="mt-0.5 font-normal opacity-90">{c.pct}</div>
          </div>
        );
      })}
    </div>
  );
}

// ─── NEN advice per band ──────────────────────────────────────────────────────

const NEN_ADVICE: Record<ExposureBand, {
  heading: string;
  context: string;
  steps: string[];
  color: string;
  borderColor: string;
  bgColor: string;
  textColor: string;
}> = {
  A: {
    heading: 'Band A — Voldoet conform Tier-1 (Annex C)',
    context: 'De conservatieve Tier-1 schatting toont aan dat de blootstelling ruim onder de OEL\'s valt. Op basis van deze schatting mag u concluderen dat de SEG voldoet.',
    steps: [
      'Leg de beoordeling vast in de RI&E-tox: gebruikte stoffen, OEL\'s, IE-waarde en argumentatie.',
      'Plan een periodieke herbeoordeling (aanbevolen interval: 3 jaar conform Annex I).',
      'Borg maatregelen en beheersing: ventilatie actueel, VIB\'s bijgewerkt, procedures geborgd.',
    ],
    color: 'emerald',
    borderColor: 'border-emerald-300 dark:border-emerald-700/60',
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/10',
    textColor: 'text-emerald-800 dark:text-emerald-300',
  },
  B: {
    heading: 'Band B — Twijfelzone: Tier-2 of meting vereist (Annex C §2)',
    context: 'De grove Tier-1 schatting kan niet uitsluiten dat de gecombineerde OEL-belasting de grens bereikt. U zit in de twijfelzone: niet evident veilig, maar ook geen hard overschrijdingssignaal.',
    steps: [
      'Voer een Tier-2 IAE-berekening uit per doelorgaan/gezondheidseffect (Annex C): IAE = Σ(Cᵢ/OELᵢ). IAE < 1 per groep = acceptabel.',
      'Treef ALARA-maatregelen: bronafzuiging verbeteren, werkduur beperken — ook zonder formele overschrijding vraagt de Arbowet om reductie dicht bij de grens.',
      'Als IAE ook rond 1 hangt: stel oriënterende metingen op conform NEN-EN 689 (n ≥ 3, §5.5 preliminary test).',
    ],
    color: 'amber',
    borderColor: 'border-amber-300 dark:border-amber-700/60',
    bgColor: 'bg-amber-50 dark:bg-amber-900/10',
    textColor: 'text-amber-800 dark:text-amber-300',
  },
  C: {
    heading: 'Band C — Waarschijnlijk non-compliant (NEN-EN 689 §5.1.5)',
    context: 'De Tier-1 schatting geeft een waarschijnlijke overschrijding aan. Conform NEN-EN 689 §5.1.5 neemt u eerst risicobeheersmaatregelen vóórdat u gaat meten.',
    steps: [
      'Neem direct brongerichte maatregelen: substitutie, gesloten systemen, extra bronafzuiging, verkorte blootstellingsduur.',
      'Stel daarna een volledig meetplan op conform NEN-EN 689 (SEG-strategie, n ≥ 6, worst-case metingen, statistische toets §5.5).',
      'Zet deze SEG hoog op de prioriteitenlijst in de RI&E-tox en plan versnelde herbeoordeling.',
    ],
    color: 'orange',
    borderColor: 'border-orange-300 dark:border-orange-700/60',
    bgColor: 'bg-orange-50 dark:bg-orange-900/10',
    textColor: 'text-orange-800 dark:text-orange-300',
  },
  D: {
    heading: 'Band D — Onmiddellijk ingrijpen vereist (Arbobesluit art. 4.1)',
    context: 'De Tier-1 schatting laat een ruime overschrijding zien. Dit is non-compliance in de geest van de norm en de Arbowet. U moet onverwijld ingrijpen.',
    steps: [
      'Neem onmiddellijk bron- en collectieve maatregelen; overweeg tijdelijke aanpassing of werkstop.',
      'Voer na verbetering metingen uit conform NEN-EN 689 (SEG-strategie, statistische toets) om te bewijzen dat de nieuwe situatie voldoet.',
      'Leg de D-uitkomst, maatregelen, tijdpad en verantwoordelijken gedetailleerd vast in de RI&E-tox.',
    ],
    color: 'red',
    borderColor: 'border-red-300 dark:border-red-700/60',
    bgColor: 'bg-red-50 dark:bg-red-900/10',
    textColor: 'text-red-800 dark:text-red-300',
  },
};

const BAND_DECISION_OPTIONS: Record<ExposureBand, { value: ExposureDecision; label: string; color: string }[]> = {
  A: [
    { value: 'compliant-no-measurement', label: 'Voldoet — geen meting vereist, periodieke herbeoordeling plannen', color: 'emerald' },
    { value: 'compliant-monitoring',     label: 'Voldoet — wel oriënterende meting wenselijk (extra zekerheid)',  color: 'emerald' },
  ],
  B: [
    { value: 'tier2-required',     label: 'Tier-2 IAE-berekening uitvoeren per doelorgaan (Annex C §2)', color: 'amber' },
    { value: 'measurement-needed', label: 'Oriënterende metingen opstellen (n ≥ 3, NEN-EN 689 §5.5)',   color: 'amber' },
    { value: 'measures-alara',     label: 'ALARA-maatregelen treffen en Tier-1 herhalen',                color: 'amber' },
  ],
  C: [
    { value: 'measures-then-measure', label: 'Direct maatregelen treffen + volledig meetplan NEN-EN 689 (n ≥ 6)', color: 'orange' },
    { value: 'measurement-needed',    label: 'Meetplan opstellen: worst-case strategie, n ≥ 6',                   color: 'orange' },
  ],
  D: [
    { value: 'immediate-action', label: 'Onmiddellijk ingrijpen — maatregelen + eventueel werkstop', color: 'red' },
  ],
};

const CARD_STYLE: Record<ExposureBand, string> = {
  A: 'border-emerald-200 bg-emerald-50/70 dark:border-emerald-800/50 dark:bg-emerald-900/15',
  B: 'border-amber-200 bg-amber-50/70 dark:border-amber-800/50 dark:bg-amber-900/15',
  C: 'border-orange-200 bg-orange-50/70 dark:border-orange-800/50 dark:bg-orange-900/15',
  D: 'border-red-200 bg-red-50/70 dark:border-red-800/50 dark:bg-red-900/15',
};

const SELECTED_OPTION_STYLE: Record<string, string> = {
  emerald: 'border-emerald-400 bg-emerald-50 dark:border-emerald-600 dark:bg-emerald-900/20',
  amber:   'border-amber-400 bg-amber-50 dark:border-amber-600 dark:bg-amber-900/20',
  orange:  'border-orange-400 bg-orange-50 dark:border-orange-600 dark:bg-orange-900/20',
  red:     'border-red-400 bg-red-50 dark:border-red-600 dark:bg-red-900/20',
};

// ─── Pair card ────────────────────────────────────────────────────────────────

function PairCard({
  task,
  substance,
  estimate,
  onDecisionChange,
  onNotesChange,
}: {
  task: WorkTask;
  substance: Substance;
  estimate: InitialEstimate;
  onDecisionChange: (decision: ExposureDecision) => void;
  onNotesChange: (notes: string) => void;
}) {
  const t = estimate.tier1;
  const advice = NEN_ADVICE[t.band];
  const decisionOptions = BAND_DECISION_OPTIONS[t.band];

  return (
    <div className={`rounded-xl border p-5 ${CARD_STYLE[t.band]}`}>
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-50">{task.description}</h4>
          <p className="mt-0.5 text-sm text-orange-600 dark:text-orange-400">
            Stof: {substance.productName}
            {substance.casNr && <span className="ml-2 text-xs text-zinc-500">CAS {substance.casNr}</span>}
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-zinc-500 dark:text-zinc-400">Model-index (IE)</div>
          <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{t.score.toFixed(2)}</div>
        </div>
      </div>

      <BandVisual band={t.band} />

      {/* NEN advice box */}
      <div className={`mt-4 rounded-lg border p-4 ${advice.borderColor} ${advice.bgColor}`}>
        <p className={`text-sm font-semibold ${advice.textColor}`}>{advice.heading}</p>
        <p className={`mt-1 text-xs leading-relaxed ${advice.textColor} opacity-80`}>{advice.context}</p>
        <ol className="mt-2.5 space-y-1">
          {advice.steps.map((step, i) => (
            <li key={i} className={`flex gap-2 text-xs leading-relaxed ${advice.textColor}`}>
              <span className="mt-0.5 shrink-0 font-bold opacity-60">{i + 1}.</span>
              <span className="opacity-90">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      <MotivationPanel task={task} substance={substance} score={t.score} />

      {/* Decision */}
      <div className="mt-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Uw beslissing
        </p>
        <div className="space-y-1.5">
          {decisionOptions.map((opt) => (
            <label
              key={opt.value}
              className={`flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2.5 text-sm transition ${
                estimate.decision === opt.value
                  ? SELECTED_OPTION_STYLE[opt.color]
                  : 'border-zinc-200 bg-white/60 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800/30'
              }`}
            >
              <input
                type="radio"
                name={`decision-${task.id}-${substance.id}`}
                checked={estimate.decision === opt.value}
                onChange={() => onDecisionChange(opt.value)}
                className="mt-0.5 accent-orange-500"
              />
              <span className="text-zinc-700 dark:text-zinc-300">{opt.label}</span>
            </label>
          ))}
        </div>
        {estimate.decision && (
          <textarea
            rows={2}
            value={estimate.decisionNotes ?? ''}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Onderbouwing / aanvullende notitie (aanbevolen voor dossier)…"
            className="mt-2 w-full rounded-lg border border-zinc-200 bg-white/70 px-3 py-2 text-sm text-zinc-800 placeholder-zinc-400 outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-orange-400"
          />
        )}
      </div>
    </div>
  );
}

// ─── Step4_Assessment ─────────────────────────────────────────────────────────

export default function Step4_Assessment({ investigation, onUpdate }: Props) {
  const { tasks, substances, initialEstimates } = investigation;

  // Collect all task × substance pairs that need assessment
  const pairs: { task: WorkTask; substance: Substance }[] = [];
  for (const task of tasks) {
    for (const substId of task.substanceIds) {
      const substance = substances.find((s) => s.id === substId);
      if (substance) pairs.push({ task, substance });
    }
  }

  // Build or update estimates array
  function getEstimate(taskId: string, substanceId: string): InitialEstimate {
    const existing = initialEstimates.find(
      (e) => e.taskId === taskId && e.substanceId === substanceId,
    );
    if (existing) return existing;
    const task = tasks.find((t) => t.id === taskId)!;
    const substance = substances.find((s) => s.id === substanceId)!;
    return {
      taskId,
      substanceId,
      tier1: computeTierOne(task, substance),
      decision: '',
      decisionNotes: '',
    };
  }

  function updateEstimate(taskId: string, substanceId: string, patch: Partial<InitialEstimate>) {
    const task = tasks.find((t) => t.id === taskId)!;
    const substance = substances.find((s) => s.id === substanceId)!;
    const current = getEstimate(taskId, substanceId);
    const updated: InitialEstimate = {
      ...current,
      ...patch,
      tier1: computeTierOne(task, substance),
    };
    const others = initialEstimates.filter(
      (e) => !(e.taskId === taskId && e.substanceId === substanceId),
    );
    onUpdate({ initialEstimates: [...others, updated] });
  }

  if (tasks.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Stap 4 — Eerste risicobeoordeling
        </h2>
        <div className="rounded-lg bg-amber-50 px-4 py-4 text-sm text-amber-700 dark:bg-amber-900/15 dark:text-amber-400">
          Voeg eerst taken toe in stap 3 en koppel stoffen daaraan, dan verschijnen hier de tier-1 beoordelingen.
        </div>
      </div>
    );
  }

  if (pairs.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Stap 4 — Eerste risicobeoordeling
        </h2>
        <div className="rounded-lg bg-amber-50 px-4 py-4 text-sm text-amber-700 dark:bg-amber-900/15 dark:text-amber-400">
          Koppel in stap 3 stoffen aan de taken. Dan berekent het tier-1 model hier de blootstellingsband per taak-stof combinatie.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Stap 4 — Eerste risicobeoordeling (zonder metingen)
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          Tier-1 oriënterend model (conform Stoffenmanager-methodiek) op basis van emissiefactoren
          en beheersmaatregelen. Per combinatie neemt u een beslissing conform NEN-EN 689 §5.1.5.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {pairs.map(({ task, substance }) => {
          const estimate = getEstimate(task.id, substance.id);
          // Recompute tier1 fresh from current data
          const freshTier1 = computeTierOne(task, substance);
          const freshEstimate = { ...estimate, tier1: freshTier1 };
          return (
            <PairCard
              key={`${task.id}-${substance.id}`}
              task={task}
              substance={substance}
              estimate={freshEstimate}
              onDecisionChange={(decision) => updateEstimate(task.id, substance.id, { decision })}
              onNotesChange={(notes) => updateEstimate(task.id, substance.id, { decisionNotes: notes })}
            />
          );
        })}
      </div>

      {/* Summary */}
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Samenvatting beslissingen</p>
        <div className="flex flex-wrap gap-4 text-sm">
          {(['A', 'B', 'C', 'D'] as ExposureBand[]).map((band) => {
            const count = pairs.filter(({ task, substance }) => {
              const e = getEstimate(task.id, substance.id);
              return computeTierOne(task, substance).band === band;
            }).length;
            if (count === 0) return null;
            const c = BAND_COLORS[band];
            return (
              <div key={band} className="flex items-center gap-2">
                <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${c.active}`}>{band}</span>
                <span className="text-zinc-600 dark:text-zinc-400">{count} combinatie{count !== 1 ? 's' : ''}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
