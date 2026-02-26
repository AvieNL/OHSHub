// ─── Core enums ───────────────────────────────────────────────────────────────

export type AggregateState = 'gas' | 'vapor-liquid' | 'liquid' | 'solid-powder' | 'aerosol';
export type OELType = 'szw' | 'eu-oel' | 'dnel' | 'acgih' | 'dfg' | 'internal' | 'none';
export type CMRCategory = '1A' | '1B' | '2' | 'none';
export type ProcessType = 'closed' | 'partly-closed' | 'open' | 'high-emission';
export type ExposureDecision =
  | 'compliant-no-measurement'   // Band A — voldoet, geen meting vereist
  | 'compliant-monitoring'       // Band A — voldoet, wel periodieke monitoring
  | 'tier2-required'             // Band B — Tier-2 IAE uitvoeren
  | 'measurement-needed'         // Band B/C — oriënterende/volledige meting
  | 'measures-alara'             // Band B — ALARA-maatregelen + herhaal tier-1
  | 'measures-then-measure'      // Band C — eerst maatregelen, daarna meten
  | 'immediate-action'           // Band D — onmiddellijk ingrijpen
  | 'non-compliant-act'          // legacy
  | '';
export type MeasurementVerdict = 'acceptable' | 'uncertain' | 'unacceptable';
export type ControlType =
  | 'substitution'
  | 'process-change'
  | 'lev'
  | 'ventilation'
  | 'organisational'
  | 'ppe';
export type ExposureBand = 'A' | 'B' | 'C' | 'D';

// ─── Substance ────────────────────────────────────────────────────────────────

export type OELPeriod = 'tgg-8h' | 'tgg-15min' | 'ceiling';
export type OELRoute = 'inhalatoir' | 'dermaal';

export interface OELValue {
  type: OELType;
  value?: number;
  unit: 'mg/m³' | 'ppm' | 'f/cm³' | 'mg/kg/d';
  period?: OELPeriod;
  routes?: OELRoute[];
  source?: string;   // bronvermelding — auto-ingevuld voor SZW/EU-OEL, vrij tekst voor overige
}

export interface Substance {
  id: string;
  // Identificatie
  productName: string;
  iupacName?: string;
  casNr?: string;
  egNr?: string;
  reachNr?: string;
  // CLP
  hStatements: string; // vrij tekst: "H315, H319, H335"
  cmrCategory: CMRCategory;
  isSensitizing: boolean;
  skinNotation: boolean; // H-notatie voor huidopname
  // Fysisch-chemisch
  aggregateState: AggregateState;
  vapourPressure?: number;
  vapourPressureUnit?: 'Pa' | 'kPa' | 'bar' | 'mbar' | 'mmHg';
  boilingPoint?: number;  // °C
  flashPoint?: number;    // °C (vlampunt, ATEX)
  lel?: number;           // % vol — Lower Explosive Limit (ATEX)
  uel?: number;           // % vol — Upper Explosive Limit (ATEX)
  dustiness?: 'low' | 'medium' | 'high';
  // Grenswaarden
  oels: OELValue[];
  // Overig
  isAtex: boolean;
  isArie: boolean;
  sdsAvailable: boolean;
  notes?: string;
}

// ─── Work Task ────────────────────────────────────────────────────────────────

export interface WorkTask {
  id: string;
  description: string;
  department?: string;
  jobTitle?: string;
  substanceIds: string[];
  processType: ProcessType;
  quantityPerTask: string; // '<100g' | '100g-1kg' | '1-10kg' | '>10kg'
  durationPerDay: string; // '<15min' | '15-60min' | '1-2u' | '2-4u' | '4-8u' | '>8u'
  frequency: string; // 'dagelijks' | '2-4x-week' | '1x-week' | '1-3x-maand' | 'incidenteel'
  lev: string; // 'none' | 'point' | 'partial' | 'full'
  levCheck?: string; // 'recent' | 'outdated' | 'never' — conditioneel
  ventilation: string; // 'none' | '<1ACH' | '1-3ACH' | '3-6ACH' | '>6ACH'
  roomSize: string; // '<50m3' | '50-500m3' | '>500m3'
  ppe: string[]; // 'respirator' | 'gloves' | 'eye-clothing' | 'none'
  notes?: string;
}

// ─── Tier-1 model result ──────────────────────────────────────────────────────

export interface TierOneResult {
  band: ExposureBand;
  score: number;
  label: string;
  measurementAdvice: string;
}

// ─── Initial Assessment ───────────────────────────────────────────────────────

export interface InitialEstimate {
  taskId: string;
  substanceId: string;
  tier1: TierOneResult;
  decision: ExposureDecision;
  decisionNotes?: string;
}

// ─── SEG (Similar Exposure Group) ─────────────────────────────────────────────

export interface SEG {
  id: string;
  name: string;
  description?: string;
  taskIds: string[];
  workerCount: number;
  notes?: string;
}

// ─── Measurement Plan ─────────────────────────────────────────────────────────

export interface MeasurementPlanEntry {
  id: string;
  segId: string;
  substanceId: string;
  measurementType: '8h-tgg' | '15min' | 'ceiling';
  plannedCount: number;
  method?: string;
  lab?: string;
  plannedDate?: string;
  notes?: string;
}

// ─── Measurements & Statistics ────────────────────────────────────────────────

export interface SingleMeasurement {
  id: string;
  value: number;
  date?: string;
  samplingStartTime?: string;  // HH:MM — begin bemonstering §6(f) NEN-EN 689
  samplingEndTime?: string;    // HH:MM — einde bemonstering §6(f) NEN-EN 689
  conditions?: string;
  excluded?: boolean;
  exclusionReason?: string;
}

export interface MeasurementStatistics {
  n: number;
  gm: number;
  gsd: number;
  p95: number;
  oelv: number;
  unit: string;
  p95PctOfOelv: number;
  overshootFraction: number;
  verdict: MeasurementVerdict;
  verdictLabel: string;
  // NEN-EN 689:2018+C1:2019 toetsparameters
  testMethod?: 'preliminary' | 'bijlage-f'; // §5.5.2 (n<6) of §5.5.3+Bijlage F (n≥6)
  distribution?: 'log-normal' | 'normal';   // Bijlage F §F.3 (log-normaal) of §F.4 (normaal)
  ur?: number;  // Bijlage F: log-normaal: [ln(OELV)−ln(GM)]/ln(GSD) | normaal: (OELV−AM)/SD
  ut?: number;  // U_T uit Tabel F.1 (n-afhankelijk)
  am?: number;  // Rekenkundig gemiddelde — alleen normaalverdeling
  sd?: number;  // Steekproef-standaardafwijking — alleen normaalverdeling
}

export interface MeasurementSeries {
  id: string;
  planId: string; // verwijzing naar MeasurementPlanEntry
  distribution?: 'log-normal' | 'normal'; // Bijlage F §F.3/F.4 — default: log-normal
  measurements: SingleMeasurement[];
  statistics?: MeasurementStatistics;
}

// ─── Control Measures (AHS) ───────────────────────────────────────────────────

export interface ControlMeasure {
  id: string;
  type: ControlType;
  description: string;
  targetDescription?: string;
  priority: 1 | 2 | 3 | 4 | 5;
  responsible?: string;
  deadline?: string;
  status: 'planned' | 'in-progress' | 'completed';
  notes?: string;
}

// ─── Person entries ───────────────────────────────────────────────────────────

export interface PersonEntry {
  id: string;
  name: string;
  role?: string;
  organization?: string;
  address?: string;   // adres werkgever/opdrachtgever — §6(b) NEN-EN 689
  email?: string;
  phone?: string;
  anonymous?: boolean;
}

// ─── Top-level investigation object ──────────────────────────────────────────

export interface InvestigationScope {
  question: 'current' | 'historical' | 'both' | '';
  departments: string;
  workplaceAddress?: string; // §6(b) NEN-EN 689 — naam en adres werklocatie (≠ adres werkgever)
  isPartOfRIE: boolean;
  atexApplicable: boolean;
  arieApplicable: boolean;
  applicableNorms: string[]; // 'nen-en-689' | 'nen-en-482' | 'reach' | 'clp' | 'nla'
  notes?: string;
}

export interface InvestigationReport {
  conclusion?: string;
  nextReviewDate?: string;
  nextReviewTriggers: string[];
  historicalNotes?: string;
}

export interface Investigation {
  id: string;
  name: string;
  /** @deprecated use investigators[] */ company?: string;
  /** @deprecated use investigators[] */ investigator?: string;
  investigators: PersonEntry[];
  clients: PersonEntry[];
  respondents: PersonEntry[];
  createdAt: string;
  updatedAt: string;
  currentStep: number; // 0–9

  scope: InvestigationScope;
  substances: Substance[];
  tasks: WorkTask[];
  initialEstimates: InitialEstimate[];
  segs: SEG[];
  measurementPlans: MeasurementPlanEntry[];
  measurementSeries: MeasurementSeries[];
  controlMeasures: ControlMeasure[];
  report: InvestigationReport;
}
