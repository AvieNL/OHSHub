// ─── Enums & literal types ────────────────────────────────────────────────────

/** Which assessment scenarios apply to this investigation */
export type ClimateScenario = 'comfort' | 'heat' | 'cold' | 'local';

/** ISO 8996 / ISO 7243 metabolic rate class */
export type MetabolicClass = 0 | 1 | 2 | 3 | 4;

/** PMV comfort category per ISO 7730:2025 Table 1 */
export type PMVCategory = 'A' | 'B' | 'C' | 'D';

export type ClimateVerdictColor = 'emerald' | 'amber' | 'orange' | 'red';

export type ClimateMeasureStatus = 'planned' | 'in-progress' | 'completed';
export type ClimateMeasureType =
  | 'technical'      // HVAC, isolatie, zonwering, koeling — prioriteit 1
  | 'organisational' // roulatie, pauzes, acclimatisatie — prioriteit 2
  | 'ppe'            // koelvest, thermisch ondergoed — prioriteit 3
  | 'monitoring';    // continue bewaking WBGT/thermisch comfort

/** Kwalificatie uitvoerend onderzoeker (Arbowet art. 14 / NEN-EN-ISO 7730) */
export type ClimatePersonQualification = 'AH' | 'HVK' | 'ergonoom' | 'other';

// ─── Personnel ────────────────────────────────────────────────────────────────

export interface ClimatePerson {
  id: string;
  name?: string;
  role?: string;
  organization?: string;
  address?: string;
  email?: string;
  phone?: string;
  anonymous?: boolean;
  investigationRole?: string;
  qualification?: ClimatePersonQualification;
  isAKD?: boolean;
  akdNumber?: string;
  qualificationNote?: string;
}

// ─── Blootstellingsgroep (BG) — Similar Exposure Group ───────────────────────

/**
 * ISO 7243 / 7730 / 11079: Groep medewerkers met vergelijkbare thermische
 * blootstelling (gelijkwaardig aan HEG in NEN-EN-ISO 9612).
 */
export interface ClimateBG {
  id: string;
  name: string;
  description?: string;
  jobTitle?: string;
  workerCount: number;

  // ── Metabole belasting (ISO 8996 / ISO 7243) ──
  /** Metabole klasse per ISO 8996 Tabel A.1 / ISO 7243 Tabel A.1 */
  metabolicClass: MetabolicClass;
  /** Handmatige override van metabole belasting in W/m² (0 = gebruik klasse) */
  metabolicRateOverride?: number;

  // ── Kleding (ISO 9920) ──
  /** Kledinginsulatie I_cl in clo */
  clothingInsulation: number;
  clothingDescription?: string;

  // ── Werkschema ──
  /** Effectieve werkdag in uren (voor IREQ D_lim berekening) */
  workHoursPerDay: number;
  /** Is de groep geacclimatiseerd aan warmte? (ISO 7243 Tabel A.1) */
  acclimatized?: boolean;

  // ── Lokaal comfort ──
  /** Turbulentie-intensiteit Tu (%) voor tochtbeoordeling (ISO 7730 §6.2) */
  turbulenceIntensity?: number;

  notes?: string;
}

// ─── Meetapparaat ─────────────────────────────────────────────────────────────

export type ClimateInstrumentType =
  | 'wbgt-meter'          // WBGT-meter (direct reading)
  | 'globe-thermometer'   // Globethermometer ø 150 mm zwarte bol
  | 'anemometer'          // Luchtsnelheidsmeter
  | 'psychrometer'        // Natte/droge bolthermometer
  | 'hygro-thermometer'   // Temperatuur + luchtvochtigheid
  | 'infrared'            // Infraroodthermometer (oppervlaktetemperaturen)
  | 'radiant-asymmetry'   // Planaire stralingsthermometer (ISO 7726)
  | 'pmv-meter'           // Directe PMV-meter
  | 'other';

export interface ClimateInstrument {
  id: string;
  type: ClimateInstrumentType;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  lastCalibration?: string;  // ISO date
  calibrationRef?: string;
  notes?: string;
}

// ─── Meetwaarden per BG (per meetronde) ───────────────────────────────────────

/**
 * Eén meetronde per BG — bevat alle klimaatparameters benodigd voor
 * PMV/PPD, WBGT en IREQ berekeningen.
 */
export interface ClimateMeasurement {
  id: string;
  bgId: string;
  date?: string;        // ISO date
  startTime?: string;   // HH:MM
  measurementRound?: number;

  // ── Primaire meetwaarden ──
  /** Luchttemperatuur t_a (°C) */
  t_a: number;
  /** Globetemperatuur t_g (°C) — ø 150 mm zwarte bol voor t_r afleiding */
  t_g?: number;
  /** Gemiddelde stralingstemperatuur t_r (°C) — handmatig of berekend uit t_g */
  t_r?: number;
  /** Natte boltemperatuur t_nw (°C) — voor WBGT berekening */
  t_nw?: number;
  /** Relatieve luchtsnelheid v_ar (m/s) */
  v_ar: number;
  /** Relatieve luchtvochtigheid RH (%) */
  RH: number;

  /** Zonlast aanwezig (bepaalt WBGT-formule) */
  solarLoad?: boolean;

  // ── Lokaal thermisch comfort (ISO 7730 §6) ──
  /** Luchttemperatuur op enkelhoogte 0,1 m (°C) — voor Δt verticaal */
  t_a_ankle?: number;
  /** Luchttemperatuur op hoofdhoogte 1,1 m zittend / 1,7 m staand (°C) */
  t_a_head?: number;
  /** Vloertemperatuur (°C) — voor beoordering §6.4 */
  t_floor?: number;
  /** Stralingsasymmetrie warm plafond Δt_pr (K) — ISO 7730 §6.5 */
  radAsymmetryWarmCeiling?: number;
  /** Stralingsasymmetrie koude wand Δt_pr (K) */
  radAsymmetryColdWall?: number;
  /** Stralingsasymmetrie warm raam/wand Δt_pr (K) */
  radAsymmetryWarmWindow?: number;

  notes?: string;
  excluded?: boolean;
  exclusionReason?: string;
}

// ─── Berekende statistieken per BG ───────────────────────────────────────────

export interface ClimateStatistics {
  bgId: string;
  n: number; // aantal geldige metingen

  // ── PMV/PPD (ISO 7730:2025) ──
  /** Gemiddelde PMV over meetronden */
  pmv?: number;
  /** Bijbehorende PPD (%) */
  ppd?: number;
  /** Comfortkategorie per Tabel 1 ISO 7730:2025 */
  pmvCategory?: PMVCategory;
  pmvCategoryLabel?: string;
  pmvColor?: ClimateVerdictColor;
  /** PMV per individuele meting */
  pmvPerMeasurement?: number[];

  // ── WBGT (ISO 7243:2017) ──
  /** Gemiddelde WBGT (°C) */
  wbgt?: number;
  /** WBGTeff = WBGT + CAV (kledingcorrectie) */
  wbgtEff?: number;
  /** Referentiewaarde WBGTref per metabole klasse + acclimatisatie */
  wbgtRef?: number;
  /** Toegepaste CAV waarde */
  wbgtCAV?: number;
  wbgtVerdict?: 'acceptable' | 'caution' | 'exceeds';
  wbgtVerdictLabel?: string;
  wbgtVerdictColor?: ClimateVerdictColor;

  // ── PHS (ISO 7933:2023) — vereiste zweetsecretie ──
  /** Vereiste zweetsecretie S_Wreq (g/h) */
  phsSWreq?: number;
  /** Maximale zweetsecretie S_Wmax (g/h) */
  phsSWmax?: number;
  /** Toegestane blootstellingstijd D_lim (min) — null als niet beperkt */
  phsDlimMin?: number | null;
  phsVerdict?: 'acceptable' | 'limited' | 'danger';
  phsVerdictLabel?: string;
  phsVerdictColor?: ClimateVerdictColor;

  // ── IREQ (ISO 11079:2007) ──
  /** Benodigde kledinginsulatie voor thermisch neutraal IREQneutral (clo) */
  ireqNeutral?: number;
  /** Minimale kledinginsulatie voor thermisch evenwicht IREQmin (clo) */
  ireqMin?: number;
  /** Beschikbare kleding I_cl,r (clo) = BG.clothingInsulation */
  ireqAvailable?: number;
  /** Toegestane blootstellingstijd D_lim (min) — null als kleding voldoende */
  ireqDlimMin?: number | null;
  ireqVerdict?: 'comfortable' | 'cool' | 'danger';
  ireqVerdictLabel?: string;
  ireqVerdictColor?: ClimateVerdictColor;

  // ── Lokaal comfort (ISO 7730:2025 §6) ──
  /** Tochtbeoordeling DR (%) — bij v_ar > 0,05 m/s */
  dr?: number;
  drCategory?: PMVCategory;
  /** Verticaal temperatuurverschil Δt hoofd–enkel (K) */
  verticalTempDiff?: number;
  verticalTempCategory?: PMVCategory;
  /** Vloertemperatuur oordeel */
  floorTempVerdict?: 'ok' | 'low' | 'high';
  floorTempCategory?: PMVCategory;
}

// ─── Beheersmaatregelen ───────────────────────────────────────────────────────

export interface ClimateMeasure {
  id: string;
  type: ClimateMeasureType;
  description: string;
  /** Welke BG's worden aangepakt */
  bgIds: string[];
  priority: 1 | 2 | 3;
  responsible?: string;
  deadline?: string;   // ISO date
  status: ClimateMeasureStatus;
  notes?: string;
}

// ─── Onderzoekskader ──────────────────────────────────────────────────────────

export interface ClimateInvestigationScope {
  companyName?: string;
  workplaceName?: string;
  workplaceAddress?: string;
  workerDescription?: string;
  purpose?: string;
  investigationPeriod?: string;
  /** Seizoen / weersomstandigheden tijdens meting */
  season?: string;
  notes?: string;
}

// ─── Rapport ─────────────────────────────────────────────────────────────────

export interface ClimateReport {
  conclusion?: string;
  complianceStatement?: string;
  nextReviewDate?: string;
  reviewTriggers: string[];
  notes?: string;
}

// ─── Pre-survey (voorverkenning) ──────────────────────────────────────────────

export type PreClimateAnswer = 'yes' | 'no' | 'unknown';

export interface PreClimateResponse {
  answer?: PreClimateAnswer;
  notes?: string;
}

/** Aanbeveling uit de voorverkenning */
export type ClimateSurveyRecommendation =
  | 'comfort-measurement'   // PMV/PPD meting aanbevolen
  | 'heat-measurement'      // WBGT meting vereist
  | 'cold-measurement'      // IREQ berekening aanbevolen
  | 'full-investigation'    // Volledig onderzoek alle scenario's
  | 'not-required'          // Geen meting nodig op basis van voorverkenning
  | 'overridden';           // Aanbeveling handmatig overschreven

export interface ClimatePreSurvey {
  respondentName?: string;
  completedAt?: string;
  /** Keyed by question id: QC1–QC15 */
  responses: Record<string, PreClimateResponse>;
  /** Geschatte omgevingstemperatuur (°C) */
  estimatedTemp?: number;
  /** Is er sprake van klachten? */
  complaintsReported?: boolean;
  /** Toelichting klachten */
  complaintsDescription?: string;
  /** Manual override */
  recommendationOverride?: ClimateSurveyRecommendation;
  conclusionNotes?: string;
}

// ─── Top-level klimaatonderzoek ───────────────────────────────────────────────

export interface ClimateInvestigation {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  currentStep: number; // 0–12

  // Geselecteerde scenario's (comfort, heat, cold, local)
  scenarios: ClimateScenario[];

  // Pre-survey
  preSurvey?: ClimatePreSurvey;

  // Personen
  investigators: ClimatePerson[];
  clients: ClimatePerson[];
  respondents: ClimatePerson[];

  scope: ClimateInvestigationScope;

  /** Blootstellingsgroepen */
  bgs: ClimateBG[];

  instruments: ClimateInstrument[];
  measurements: ClimateMeasurement[];

  /** Berekende statistieken per BG (recomputed in stap 5) */
  statistics: ClimateStatistics[];

  measures: ClimateMeasure[];
  report: ClimateReport;
}

// ─── Constanten (ISO norm-referentiewaarden) ──────────────────────────────────

/** ISO 8996 / ISO 7243 metabole klasse referentiewaarden */
export const METABOLIC_CLASSES: Record<
  MetabolicClass,
  { label: string; rate: number; example: string }
> = {
  0: { label: 'Klasse 0 — Rust',          rate: 115, example: 'Zittend rusten, slaap' },
  1: { label: 'Klasse 1 — Licht',         rate: 180, example: 'Schrijven, licht monteren, autorijden' },
  2: { label: 'Klasse 2 — Matig',         rate: 300, example: 'Lopen 3,5 km/h, schilderen, schoonmaken' },
  3: { label: 'Klasse 3 — Zwaar',         rate: 415, example: 'Lopen 5–7 km/h, graven, zwaar tillen' },
  4: { label: 'Klasse 4 — Zeer zwaar',    rate: 520, example: 'Lopen > 7 km/h, houthakken, zware handenarbeid' },
};

/** Standaard kledinginsulatie-waarden (ISO 9920) */
export const CLOTHING_PRESETS: { label: string; clo: number }[] = [
  { label: 'Naakt (0,0 clo)',                                          clo: 0.0 },
  { label: 'Zomerse lichte kleding — shorts + T-shirt (0,3 clo)',     clo: 0.3 },
  { label: 'Lichte binnenkleding — broek + overhemd (0,5 clo)',       clo: 0.5 },
  { label: 'Normale kantoorkleding — broek + overhemd + jasje (1,0 clo)', clo: 1.0 },
  { label: 'Werkkleding — overall + onderkleding (1,5 clo)',          clo: 1.5 },
  { label: 'Winterkleding — trui + dikke broek + jas (2,0 clo)',      clo: 2.0 },
  { label: 'Zware beschermende kleding — overall + isolatie (3,0 clo)', clo: 3.0 },
];

/** WBGT kledingcorrectiewaarden CAV (ISO 7243:2017 Tabel B.2) */
export const CAV_VALUES: { label: string; cav: number }[] = [
  { label: 'Standaard werkkleding (CAV = 0)',                    cav: 0  },
  { label: 'Witte katoen overall (CAV = 0)',                     cav: 0  },
  { label: 'Kleding met beperkte dampttransport (CAV = +3)',      cav: 3  },
  { label: 'SMS-polypropeen overall (CAV = +0,5)',               cav: 0.5},
  { label: 'Polyolefine overall (CAV = +1)',                     cav: 1  },
  { label: 'Dubbele kleding laag (CAV = +3)',                    cav: 3  },
  { label: 'Niet-dampsdoorlatende overall (CAV = +11)',          cav: 11 },
  { label: 'Afgesloten dampsdichte overall (CAV = +12)',         cav: 12 },
];
