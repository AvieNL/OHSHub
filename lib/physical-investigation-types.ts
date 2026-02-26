// ─── Enums & literal types ────────────────────────────────────────────────────

/** Welke belastingtypen zijn onderzocht */
export type PhysicalLoadMethod =
  | 'lifting'      // Tillen & neerlaten — ISO 11228-1 / NIOSH
  | 'carrying'     // Dragen — ISO 11228-1 / Mital
  | 'push-pull'    // Duwen & trekken — ISO 11228-2 / DUTCH
  | 'repetitive'   // Repeterende handelingen — ISO 11228-3 / OCRA
  | 'posture'      // Houdingen & bewegingen — EN 1005-4 / ISO 11226
  | 'forces';      // Krachten arbeidsmiddelen — EN 1005-3

export type PhysicalRiskLevel = 'acceptable' | 'moderate' | 'high';

export type PhysicalVerdictColor = 'emerald' | 'amber' | 'red';

export type PhysicalMeasureStatus = 'planned' | 'in-progress' | 'completed';
export type PhysicalMeasureType =
  | 'technical'       // Technisch (mechanisatie, hulpmiddelen) — prioriteit 1
  | 'organisational'  // Organisatorisch (roulatie, pauzes, werkverdeling) — prioriteit 2
  | 'ppe'             // Persoonlijk (rugsteun, polsbrace) — prioriteit 3
  | 'training';       // Voorlichting & training

/** Kwalificatie onderzoeker (Arbowet / NEN-ISO 11228) */
export type PhysicalPersonQualification = 'AH' | 'HVK' | 'ergonoom' | 'other';

// ─── Personeel ────────────────────────────────────────────────────────────────

export interface PhysicalPerson {
  id: string;
  name?: string;
  role?: string;
  organization?: string;
  address?: string;
  email?: string;
  phone?: string;
  anonymous?: boolean;
  investigationRole?: string;
  qualification?: PhysicalPersonQualification;
  isAKD?: boolean;
  akdNumber?: string;
  qualificationNote?: string;
}

// ─── Belastingsgroep (BG) — vergelijkbaar met HEG/BG in andere modules ────────

/**
 * Groep medewerkers die vergelijkbare fysieke belasting uitvoeren.
 * Arbobesluit art. 5.1 / NEN-ISO 11228-1.
 */
export interface PhysicalBG {
  id: string;
  name: string;
  description?: string;
  jobTitle?: string;
  workerCount: number;
  workHoursPerDay: number;
  /** Geslachtssamenstelling (relevant voor Mital draagmethode) */
  gender?: 'male' | 'female' | 'mixed';
  notes?: string;
}

// ─── Tillen & Neerlaten (ISO 11228-1 / NIOSH) ────────────────────────────────

export type NIOSHDuration = 'short' | 'medium' | 'long';
// short  = ≤ 1 uur (met rusttijd ≥ 120% werktijd)
// medium = 1–2 uur (met rusttijd ≥ 30% werktijd)
// long   = 2–8 uur

export type NIFGrip = 'good' | 'fair' | 'poor';
// good (goed): 1.00 — comfortabele handvatten / uitsparingen
// fair (gewoon): 0.95 — handvatten niet optimaal of vingers 90° gebogen
// poor (slecht): 0.90 — geen handvatten, moeilijk grip

export interface LiftingTask {
  id: string;
  bgId: string;
  taskName: string;

  // ── NIOSH invoerparameters ──
  /** Gewicht van de last G (kg) */
  weight: number;
  /** Horizontale afstand begin handen–enkels H_start (cm) */
  H_start: number;
  /** Horizontale afstand einde (cm) — laat leeg als gelijk aan begin */
  H_end?: number;
  /** Verticale tilhoogte begin V_start (cm boven vloer) */
  V_start: number;
  /** Verticale tilhoogte einde V_end (cm boven vloer) */
  V_end: number;
  /** Asymmetrie begin A_start (graden, 0–135) */
  A_start: number;
  /** Asymmetrie einde A_end (graden) — laat leeg als gelijk aan begin */
  A_end?: number;
  /** Frequentie (tilbewegingen per minuut) */
  frequency: number;
  /** Duurcategorie */
  duration: NIOSHDuration;
  /** Gripkwaliteit */
  grip: NIFGrip;

  // ── Aanvullende risicofactoren (verhogen verdict) ──
  oneHanded?: boolean;          // Éénhandig tillen
  slipperyFloor?: boolean;      // Gladde vloer
  extremeClimate?: boolean;     // Bijzonder klimaat (> 32 °C of < 0 °C)
  unevenFloor?: boolean;        // Ongelijke of zachte vloer
  exceedEightHours?: boolean;   // Werktijd > 8 uur
  unstableObject?: boolean;     // Instabiel object / wisselend gewicht
  highAcceleration?: boolean;   // Hoge versnelling / schokkende beweging
  restrictedSpace?: boolean;    // Beperkte bewegingsvrijheid

  notes?: string;
}

export interface LiftingResult {
  taskId: string;
  bgId: string;
  // Multipliers
  Hf_start: number; Hf_end?: number;
  Vf_start: number; Vf_end: number;
  Df: number;
  Ff: number;
  Af_start: number; Af_end?: number;
  Cf: number;
  // Resultaten
  rwl_start: number;
  rwl_end?: number;
  /** Laagste RWL (bepalend voor LI) */
  rwl_min: number;
  /** Tillingsindex LI = G / RWL_min */
  li: number;
  verdict: PhysicalRiskLevel;
  verdictLabel: string;
  verdictColor: PhysicalVerdictColor;
  /** Extra risicosignalen naast LI */
  riskFlags: string[];
  /** Directe actie vereist (ongeacht LI) */
  directAction: boolean;
  directActionReasons: string[];
}

// ─── Dragen (ISO 11228-1 / Mital) ────────────────────────────────────────────

export interface CarryingTask {
  id: string;
  bgId: string;
  taskName: string;
  weight: number;          // kg
  carryDistance: number;   // m
  frequency: number;       // per minuut (tweehandig) of incidenteel/frequent (eenhandig)
  carryHeight: number;     // cm (draaghoogte: 79/111 cm vrouw/man of specifiek)
  bimanual: boolean;       // Tweehandig (true) of eenhandig (false)
  workDuration: number;    // uur (1/4/8/12)
  asymmetry?: '0-30' | '30-60'; // Rotatie schouders t.o.v. looprichting (graden)
  grip?: NIFGrip;
  climate?: 'normal' | 'warm'; // warm = > 27°C
  notes?: string;
}

export interface CarryingResult {
  taskId: string;
  bgId: string;
  /** Gecombineerde correctiefactor C */
  C: number;
  /** Acceptabele grens (kg) */
  acceptableLimit?: number;
  /** Zeer risicovol grens (kg) */
  highRiskLimit?: number;
  verdict: PhysicalRiskLevel;
  verdictLabel: string;
  verdictColor: PhysicalVerdictColor;
  notes?: string;
}

// ─── Duwen & Trekken (ISO 11228-2 / DUTCH-methode) ───────────────────────────

export type PushPullType = 'push' | 'pull' | 'both';
export type HandleHeight = 'low' | 'mid' | 'high';
// low  = lage handgreep (< 100 cm)
// mid  = midden (100–150 cm)
// high = hoog (> 150 cm)

export interface PushPullTask {
  id: string;
  bgId: string;
  taskName: string;
  type: PushPullType;

  // ── Belastingkarakteristieken ──
  totalMass: number;          // kg (last + transportmiddel)
  /** Meetwaarde aanzetter kracht F_init (N) — gebruik dynamometer */
  initialForce?: number;
  /** Meetwaarde voortbeweging kracht F_sust (N) */
  sustainedForce?: number;
  handleHeight: HandleHeight;
  /** Afstand per duw- of trekcyclus (m) */
  distancePerCycle: number;
  /** Frequentie (cycli per uur) */
  frequency: number;

  // ── Conditiefactoren ──
  /** Wieltjes / loopvlak conditie */
  wheelCondition: 'good' | 'average' | 'poor';
  /** Helling (%) */
  gradient?: number;
  /** Ruimtebeperking */
  restrictedSpace?: boolean;
  notes?: string;
}

export interface PushPullResult {
  taskId: string;
  bgId: string;
  verdict: PhysicalRiskLevel;
  verdictLabel: string;
  verdictColor: PhysicalVerdictColor;
  /** DUTCH-beoordeling score of classificatie */
  score?: number;
  notes?: string;
}

// ─── Repeterende handelingen (ISO 11228-3 / OCRA Checklist) ──────────────────

export type RecoveryFactor = 'good' | 'moderate' | 'poor' | 'none';
export type LimbSide = 'left' | 'right' | 'both';

export interface RepetitiveTask {
  id: string;
  bgId: string;
  taskName: string;
  limb: LimbSide;
  /** Netto taaktijd (min/dag) */
  taskDurationMin: number;
  /** Cyclustijd (seconden per cyclus) */
  cycleDuration: number;

  // ── OCRA Checklist factoren ──
  /** Herstelfactor CF (0–10) */
  recoveryFactor: number;
  /** Krachtfactor FaF (0–24) */
  forceFactor: number;
  /** Houdingsfactor PF (0–24) — schouder/elleboog/pols/hand */
  postureFactor: number;
  /** Herhalingsfactor RF (0–10) */
  repetitivenessFactor: number;
  /** Aanvullende factoren AddF (0–12) */
  additionalFactor: number;

  notes?: string;
}

export interface RepetitiveResult {
  taskId: string;
  bgId: string;
  /** OCRA Checklist Totaalscore */
  ocraScore: number;
  verdict: PhysicalRiskLevel;
  verdictLabel: string;
  verdictColor: PhysicalVerdictColor;
  /** Risicokategorie: GREEN/YELLOW/LIGHT ORANGE/ORANGE/RED */
  ocraCategory: 'green' | 'yellow' | 'light-orange' | 'orange' | 'red';
}

// ─── Houdingen & Bewegingen (EN 1005-4 / ISO 11226) ──────────────────────────

export type PostureBodyPart =
  | 'trunk'          // Romp
  | 'neck-head'      // Nek/hoofd
  | 'upper-arm'      // Bovenarm
  | 'lower-arm'      // Onderarm / elleboog
  | 'wrist-hand'     // Pols/hand
  | 'whole-leg'      // Been/knie
  | 'knee';          // Knielen/hurken

export type PostureFrequency = 'occasional' | 'frequent' | 'static';
// occasional = < 1/3 van de taaktijd of < 4× per uur
// frequent   = 1/3 – 3/4 van de taaktijd of 4–15× per uur
// static     = > 3/4 van de taaktijd of > 15× per uur

export type PostureVerdict =
  | 'acceptable'            // Acceptabele zone
  | 'conditionally'         // Onder voorwaarden acceptabel
  | 'not-acceptable';       // Niet acceptabel — directe actie

export interface PostureObservation {
  id: string;
  bgId: string;
  taskName: string;
  bodyPart: PostureBodyPart;
  /** Beschrijving van de houding */
  postureDescription: string;
  /** Is de houding statisch (> 4s) of dynamisch? */
  isStatic: boolean;
  frequency: PostureFrequency;
  /** Hoek of specifieke positie (optioneel voor verdere precisering) */
  angle?: number;
  verdict: PostureVerdict;
  verdictColor: PhysicalVerdictColor;
  notes?: string;
}

// ─── Krachten (EN 1005-3) ─────────────────────────────────────────────────────

export interface ForceTask {
  id: string;
  bgId: string;
  taskName: string;
  /** Gemeten kracht F (N) */
  measuredForce: number;
  /** Basisreferentiekracht F_B (N) uit EN 1005-3 tabel */
  referenceForce: number;
  /** Snelheidsmultiplier m_v */
  speedMultiplier: number;
  /** Frequentiemultiplier m_f */
  freqMultiplier: number;
  /** Duurmultiplier m_d */
  durationMultiplier: number;
  notes?: string;
}

export interface ForceResult {
  taskId: string;
  bgId: string;
  /** F_Br = F_B × m_v × m_f × m_d */
  fBr: number;
  /** m_r = F / F_Br */
  mr: number;
  verdict: PhysicalRiskLevel;
  verdictLabel: string;
  verdictColor: PhysicalVerdictColor;
}

// ─── Beheersmaatregelen ───────────────────────────────────────────────────────

export interface PhysicalMeasure {
  id: string;
  type: PhysicalMeasureType;
  description: string;
  /** Welke belastingsgroepen worden aangepakt */
  bgIds: string[];
  priority: 1 | 2 | 3;
  responsible?: string;
  deadline?: string; // ISO date
  status: PhysicalMeasureStatus;
  notes?: string;
}

// ─── Onderzoekskader ──────────────────────────────────────────────────────────

export interface PhysicalInvestigationScope {
  companyName?: string;
  workplaceName?: string;
  workplaceAddress?: string;
  workerDescription?: string;
  purpose?: string;
  investigationPeriod?: string;
  referenceDocument?: string; // RI&E, arbobeleid, MHI
  notes?: string;
}

// ─── Rapport ─────────────────────────────────────────────────────────────────

export interface PhysicalReport {
  conclusion?: string;
  complianceStatement?: string;
  nextReviewDate?: string;
  reviewTriggers: string[];
  notes?: string;
}

// ─── Pre-survey (voorverkenning) ──────────────────────────────────────────────

export type PrePhysicalAnswer = 'yes' | 'no' | 'unknown';

export interface PrePhysicalResponse {
  answer?: PrePhysicalAnswer;
  notes?: string;
}

export type PhysicalSurveyRecommendation =
  | 'lifting-measurement'       // NIOSH meting aanbevolen
  | 'push-pull-measurement'     // Duwen/trekken meting aanbevolen
  | 'repetitive-measurement'    // OCRA checklist aanbevolen
  | 'posture-observation'       // Houdingsobservatie aanbevolen
  | 'full-investigation'        // Volledig ergonomisch onderzoek
  | 'not-required'              // Geen nader onderzoek op basis van voorverkenning
  | 'overridden';               // Aanbeveling handmatig overschreven

export interface PhysicalPreSurvey {
  respondentName?: string;
  completedAt?: string;
  /** Keyed by question id: QP1–QP18 */
  responses: Record<string, PrePhysicalResponse>;
  complaintsReported?: boolean;
  complaintsDescription?: string;
  /** Klachtenlocatie (rug, schouders, armen, etc.) */
  complaintsLocation?: string[];
  recommendationOverride?: PhysicalSurveyRecommendation;
  conclusionNotes?: string;
}

// ─── Statistieken (computed) ──────────────────────────────────────────────────

export interface PhysicalStatistics {
  bgId: string;
  /** Hoogste LI over alle tiltaken */
  maxLI?: number;
  maxLITaskId?: string;
  /** Totale risicoklasse voor de BG */
  overallVerdict: PhysicalRiskLevel;
  overallVerdictColor: PhysicalVerdictColor;
}

// ─── Top-level fysieke belasting onderzoek ────────────────────────────────────

export interface PhysicalInvestigation {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  currentStep: number; // 0–10

  /** Welke methoden zijn geselecteerd */
  methods: PhysicalLoadMethod[];

  preSurvey?: PhysicalPreSurvey;

  investigators: PhysicalPerson[];
  clients: PhysicalPerson[];
  respondents: PhysicalPerson[];

  scope: PhysicalInvestigationScope;

  /** Belastingsgroepen */
  bgs: PhysicalBG[];

  // ── Taakinventarisaties per methode ──
  liftingTasks: LiftingTask[];
  carryingTasks: CarryingTask[];
  pushPullTasks: PushPullTask[];
  repetitiveTasks: RepetitiveTask[];
  postureObservations: PostureObservation[];
  forceTasks: ForceTask[];

  /** Berekende statistieken per BG */
  statistics: PhysicalStatistics[];

  measures: PhysicalMeasure[];
  report: PhysicalReport;
}
