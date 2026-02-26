// ─── Enums & literal types ────────────────────────────────────────────────────

export type SoundStrategy = 'task-based' | 'job-based' | 'full-day';
export type InstrumentType = 'slm-class1' | 'dosimeter' | 'slm-class2';
export type SoundActionLevel = 'below-lav' | 'lav' | 'uav' | 'above-elv';
export type PeakActionLevel = 'below-lav' | 'lav' | 'uav' | 'above-elv';
export type SoundMeasureStatus = 'planned' | 'in-progress' | 'completed';
export type SoundMeasureType =
  | 'substitution'   // stiller alternatief — prioriteit 1
  | 'technical'      // afscherming, demping, afstand — prioriteit 2
  | 'organisational' // roulatie, tijdslimiet, zones — prioriteit 3
  | 'ppe'            // gehoorbescherming — prioriteit 4
  | 'audiometry';    // gehooronderzoek

export type WorkPattern =
  | 'stationary-simple'
  | 'stationary-complex'
  | 'mobile-predictable-small'
  | 'mobile-predictable-large'
  | 'mobile-unpredictable'
  | 'unspecified';

// ─── Personnel (§15.a.1, §15.a.3, §15.a.4) ───────────────────────────────────

/** M-6: Kwalificatie onderzoeker (Arbowet art. 14 / WBFO) */
export type PersonQualification = 'AH' | 'HVK' | 'acousticus' | 'other';

export interface SoundPerson {
  id: string;
  name?: string;
  role?: string;
  organization?: string;
  address?: string;
  email?: string;
  phone?: string;
  /** When true the name field is hidden in the report */
  anonymous?: boolean;
  /** Rol van deze persoon in het onderzoek (alleen respondenten) */
  investigationRole?: string;
  /** M-6: Beroepsprofiel uitvoerende (Arbowet art. 14) */
  qualification?: PersonQualification;
  /** M-6: Gecertificeerd Arbokerndeskundige (SZW-register) */
  isAKD?: boolean;
  /** M-6: AKD-registratienummer (SZW Arbokerndeskundigenregister) */
  akdNumber?: string;
  /** M-6: Vrije toelichting bij 'Overige' kwalificatie */
  qualificationNote?: string;
}

// ─── HEG — Homogeneous noise Exposure Group (§7.2) ────────────────────────────

export interface SoundHEG {
  id: string;
  name: string;
  description?: string;
  jobTitle?: string;
  workerCount: number;
  /** T_e — effective duration of working day in hours */
  effectiveDayHours: number;
  strategy: SoundStrategy;
  workPattern?: WorkPattern;
  noiseSources?: string; // observed noise sources
  /** Method used to determine APF (EN 458:2016) */
  ppeMethod?: 'snr' | 'hml' | 'octave' | 'manual';
  /** Method 1 — SNR value from product data sheet; APF = SNR/2 (auto-calculated) */
  ppeSNR?: number;
  /** Method 1 — True when the SNR is explicitly marked as unknown (PPE is used but data sheet is pending) */
  ppeSNRUnknown?: boolean;
  /** Method 3 — Octave band inputs (8 bands: 63–8000 Hz); APF auto-calculated via EN 458 Annex A */
  ppeOctaveBands?: Array<{ lp?: number; m?: number; s?: number }>;
  /** Method 2 — HML values from product data sheet */
  ppeH?: number;
  ppeM?: number;
  ppeL?: number;
  /** Method 2 — Spectral character of the noise (determines which HML value is used) */
  ppeSpectralChar?: 'low' | 'medium' | 'high';
  /** Effective attenuation of hearing protector in dB — auto-calculated from method inputs or manually entered */
  ppeAttenuation?: number;
  /** Type/brand/model of hearing protector and basis for APF determination */
  ppeNotes?: string;
  // Second hearing protector (double protection — EN 458:2016)
  /** True when a second hearing protector is worn simultaneously */
  ppeDouble?: boolean;
  ppe2Method?: 'snr' | 'hml' | 'octave' | 'manual';
  ppe2SNR?: number;
  ppe2SNRUnknown?: boolean;
  ppe2OctaveBands?: Array<{ lp?: number; m?: number; s?: number }>;
  ppe2H?: number;
  ppe2M?: number;
  ppe2L?: number;
  ppe2SpectralChar?: 'low' | 'medium' | 'high';
  /** Effective attenuation of second hearing protector in dB — auto-calculated or manually entered */
  ppe2Attenuation?: number;
  ppe2Notes?: string;
  /** Whether workers in this HEG have reported tinnitus or hearing complaints (RL SHT 2020) */
  tinnitusReported?: boolean;
  notes?: string;
  // ── H-5: Audiometrie-documentatie (Arbobesluit art. 6.7 / art. 6.10) ─────────
  /** Art. 6.7: aangeboden bij LAV; art. 6.10: verplicht periodiek bij UAV */
  audiometryStatus?: 'offered' | 'conducted' | 'pending' | 'not-required' | 'not-conducted';
  /** Datum waarop gehooronderzoek is aangeboden of uitgevoerd */
  audiometryDate?: string;
  /** Deelnamepercentage (%) bij periodiek onderzoek (art. 6.10) */
  audiometryParticipationPct?: number;
  /** Bevindingen / conclusie audiometrisch onderzoek */
  audiometryFindings?: string;
  /** Datum volgende oproep (periodiek, art. 6.10) */
  audiometryNextDate?: string;
  // NPR 3438 — concentratie en communicatie (Tabel 4)
  nprActivity?: 'hoog' | 'redelijk' | 'matig' | 'laag' | 'zeer-laag';
}

// ─── Tasks — Strategy 1 task-based (§9) ──────────────────────────────────────

// ─── Measurement series — veldkalibratie per meetserie (§12.2) ───────────────

/** A single calibration check (before, mid-series, or after). */
export interface CalibrationEvent {
  id: string;
  type: 'pre' | 'mid' | 'post';
  /** Reading of the calibrator in dB (e.g. 94.0) */
  value: number;
  /** HH:MM time of the check */
  timestamp?: string;
  /** Only for 'mid': why was a mid-series recalibration performed? */
  reason?: string;
}

/** One measurement series = one instrument session, bookended by calibration. */
export interface MeasurementSeries {
  id: string;
  hegId: string;
  /** Only set for task-based series */
  taskId?: string;
  /** References SoundInstrument.id */
  instrumentId: string;
  calibrations: CalibrationEvent[];
  notes?: string;
}

export interface SoundTask {
  id: string;
  hegId: string;
  name: string;
  /** T_m — arithmetic average duration in hours */
  durationHours: number;
  /** T_min — lower range for u_1b estimation */
  durationMin?: number;
  /** T_max — upper range for u_1b estimation */
  durationMax?: number;
  notes?: string;
  /** References to SoundEquipment.id used during this task */
  equipmentIds?: string[];
}

// ─── Equipment — Arbeidsmiddelen (Arbobesluit art. 7.4a / Machinerichtlijn 2006/42/EG) ───────

export type EquipmentCategory =
  | 'voertuig'        // auto, heftruck, tractor
  | 'machine'         // niet-handgedragen machine
  | 'handgereedschap' // elektrisch/handmatig gereedschap
  | 'pneumatisch'     // pneumatisch gereedschap
  | 'anders';

export interface SoundEquipment {
  id: string;
  name: string;
  category: EquipmentCategory;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  yearOfManufacture?: number;
  registrationNumber?: string;   // kenteken (voertuig) of intern regnr (machine)

  // Geluidemissie fabrikant (Machinerichtlijn 2006/42/EG)
  lwaGuaranteed?: number;        // L_WA gegarandeerd (dB)
  lpaManufacturer?: number;      // L_pA werkplek fabrieksopgave (dB)

  // Keuring (Arbobesluit art. 7.4a)
  inspectionRequired?: boolean;
  inspectionType?: string;
  inspectionDate?: string;       // ISO date
  inspectionExpiry?: string;     // ISO date — warning als verlopen
  inspectionBody?: string;       // keurende instantie
  inspectionCertNumber?: string;

  // Onderhoud
  maintenanceStatus?: 'goed' | 'matig' | 'slecht';
  notes?: string;
}

// ─── Instrument (§5.1, §12, Table C.5) ───────────────────────────────────────

export interface SoundInstrument {
  id: string;
  type: InstrumentType;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  /** Date of last laboratory calibration */
  lastLabCalibration?: string;
  calibrationRef?: string;
  windscreen?: boolean;
  extensionCable?: boolean;
  notes?: string;
}

// ─── Measurements (§9.3, §10.3, §11.3, §12) ──────────────────────────────────

export interface SoundMeasurement {
  id: string;
  hegId: string;
  /** Only for task-based measurements */
  taskId?: string;
  instrumentId?: string;
  /** References MeasurementSeries.id — determines instrument (u₂) and calibration context */
  seriesId?: string;
  /** §15.d.1 — worker whose noise exposure was measured */
  workerLabel?: string;
  /** §15.d.2 — ISO date */
  date?: string;
  startTime?: string; // HH:MM
  endTime?: string;   // HH:MM
  /** Actual measured duration in minutes */
  durationMin?: number;
  /** L_p,A,eqT measured value in dB — the primary measurement */
  lpa_eqT: number;
  /** L_p,Cpeak in dB(C) — optional, for peak assessment */
  lpCpeak?: number;
  /** Field calibration check before measurement (dB) */
  calibBefore?: number;
  /** Field calibration check after measurement (dB) */
  calibAfter?: number;
  /** §15.d.5 — description of any deviations from normal conditions */
  deviations?: string;
  excluded?: boolean;
  exclusionReason?: string;
  notes?: string;
  /** Octave band SPL per band (63–8000 Hz, 8 values) for PPE attenuation calculation (EN 458 method 3) */
  octaveBands?: number[];
  /** M-1: Meting uitgevoerd onder representatieve omstandigheden (§15.d.4 NEN-EN-ISO 9612:2025) */
  representativeConditions?: boolean;
}

// ─── Statistics per HEG (computed in Step 7) ─────────────────────────────────

export interface SoundTaskResult {
  taskId: string;
  taskName: string;
  durationHours: number;
  nMeasurements: number;
  /** Formula (3): L_p,A,eqTm — energy average for task m */
  lpa_eqTm: number;
  /** Formula (4): L_EX,8h,m — contribution to daily level */
  lEx8hm: number;
  /** Formula C.6: standard uncertainty due to noise level sampling */
  u1a: number;
  /** Formula C.4: sensitivity coefficient c_1a,m */
  c1a: number;
  /** K-1: Effective u1b in dB — uncertainty due to task duration variability (§C.5 NEN-EN-ISO 9612:2025) */
  u1b: number;
  /** K-5: Range of task measurements max(Li)−min(Li) in dB (Bijlage E NEN-EN-ISO 9612:2025) */
  spread: number;
}

export interface SoundStatistics {
  hegId: string;
  strategy: SoundStrategy;
  n: number; // total valid measurements

  // Task-based only
  taskResults?: SoundTaskResult[];

  // Energy average (job/full-day: Formula 7; result used in 8/9)
  lpa_eqTe?: number;

  /** Formula (5) or (8)/(9): L_EX,8h in dB(A) */
  lEx8h: number;

  // Uncertainty (Annex C)
  u1: number;    // standard uncertainty due to sampling
  u2: number;    // standard uncertainty due to instrumentation (Table C.5)
  u3: number;    // standard uncertainty due to microphone position = 1.0 dB
  u: number;     // combined standard uncertainty
  U: number;     // expanded uncertainty = 1.65 × u
  /** c1×u1 from Table C.4 (job/full-day) or computed (task-based) */
  c1u1?: number;
  /** Flag: c1u1 > 3.5 dB → measurement plan should be revised */
  c1u1Excessive?: boolean;

  /** Formula (10): L_EX,8h,95% = L_EX,8h + U */
  lEx8h_95pct: number;

  // Peak
  /** Highest measured L_p,Cpeak in dB(C) */
  lCpeak?: number;

  // Verdict based on L_EX,8h,95%
  verdict: SoundActionLevel;
  verdictLabel: string;
  verdictColor: 'emerald' | 'amber' | 'orange' | 'red';
  peakVerdict?: PeakActionLevel;
  peakVerdictLabel?: string;
  /** H-1: LEX,8h,95% − PPE-APF (art. 6.6 lid 2 Arbobesluit — grenswaarde met PBM) */
  lEx8h_95pct_oor?: number;
  /** H-1: true als lEx8h_95pct_oor < 87 dB(A) (grenswaarde met PBM niet overschreden) */
  elvPpeCompliant?: boolean;
  /** K-3: true als ten minste één taak < 3 metingen heeft (§9.3.2 NEN-EN-ISO 9612:2025) */
  insufficientTaskData?: boolean;
  /** K-3 / K-5: Foutmeldingen per taak voor het rapport */
  taskWarnings?: string[];
  /** K-5: Taken waarvan de spreiding de grens overschrijdt (Bijlage E NEN-EN-ISO 9612:2025) */
  spreadWarnings?: { taskId: string; taskName: string; spread: number; limit: number }[];
  /** Method used to compute combined PPE attenuation */
  ppeCombinedMethod?: 'single' | 'double-snr' | 'double-hml' | 'double-octave';
  /** True if the 35 dB cap was applied to combined dual-PPE attenuation */
  ppeCapped?: boolean;
}

// ─── Control Measures (Arbeidshygiënische Strategie) ──────────────────────────

export interface SoundMeasure {
  id: string;
  type: SoundMeasureType;
  description: string;
  /** Which HEG(s) does this measure address */
  hegIds: string[];
  priority: 1 | 2 | 3 | 4 | 5;
  responsible?: string;
  deadline?: string;
  status: SoundMeasureStatus;
  notes?: string;
}

// ─── Investigation scope (§15.a) ─────────────────────────────────────────────

export interface SoundInvestigationScope {
  /** §15.a.1 name of client/company */
  companyName?: string;
  /** §15.a.2 identification of working place(s) */
  workplaceName?: string;
  workplaceAddress?: string;
  /** §15.a.3 identification of worker(s) or group(s) */
  workerDescription?: string;
  /** §15.a.5 purpose of the determination */
  purpose?: string;
  investigationPeriod?: string;
  notes?: string;
}

// ─── Report (§15) ─────────────────────────────────────────────────────────────

export interface SoundReport {
  conclusion?: string;
  /** §15.e.7 statement on conformity with requirements */
  complianceStatement?: string;
  nextReviewDate?: string;
  reviewTriggers: string[];
  notes?: string;
}

// ─── Pre-investigation survey (voorverkenning) ────────────────────────────────

/** Ja / Nee / Onbekend answer for a survey question */
export type PreSurveyAnswer = 'yes' | 'no' | 'unknown';

/** Estimated daily noise exposure duration */
export type ExposureDuration = 'lt1h' | '1-2h' | '2-4h' | 'gt4h';

/** Auto-calculated or manually overridden recommendation */
export type SurveyRecommendation = 'full' | 'indicative' | 'none';

export interface PreSurveyResponse {
  answer?: PreSurveyAnswer;
  notes?: string;
}

export interface SoundPreSurvey {
  respondentName?: string;
  /** ISO date when the pre-survey was completed */
  completedAt?: string;
  /** Keyed by question id: Q1–Q19 */
  responses: Record<string, PreSurveyResponse>;
  /** Q11 — estimated daily exposure duration */
  exposureDuration?: ExposureDuration;
  /** Manual override of the auto-calculated recommendation */
  recommendationOverride?: SurveyRecommendation;
  conclusionNotes?: string;
}

// ─── Top-level sound investigation ───────────────────────────────────────────

export interface SoundInvestigation {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  currentStep: number; // 0–9

  // Pre-investigation survey (voorverkenning)
  preSurvey?: SoundPreSurvey;

  // Personnel (§15.a.1, §15.a.3, §15.a.4)
  investigators: SoundPerson[];
  clients: SoundPerson[];
  respondents: SoundPerson[];

  scope: SoundInvestigationScope;
  hegs: SoundHEG[];
  tasks: SoundTask[];        // task-based strategy only
  equipment: SoundEquipment[];
  instruments: SoundInstrument[];
  measurementSeries: MeasurementSeries[];
  measurements: SoundMeasurement[];
  statistics: SoundStatistics[]; // one per HEG, recomputed in Step 7
  measures: SoundMeasure[];
  report: SoundReport;
  // Pre-survey resultaten (Stap 1)
  preSurveyRecommendation?: 'measurement-required' | 'strongly-recommended'
                           | 'recommended' | 'borderline' | 'not-required' | 'overridden';
  preSurveySignals?: string[];
  preSurveyOverrideReason?: string;
}
