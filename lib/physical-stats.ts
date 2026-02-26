/**
 * Berekeningen voor fysieke belasting — ISO 11228-1 (NIOSH), ISO 11228-2,
 * ISO 11228-3 (OCRA), EN 1005-3 en EN 1005-4.
 */

import type {
  LiftingTask, LiftingResult,
  CarryingTask, CarryingResult,
  PushPullTask, PushPullResult,
  RepetitiveTask, RepetitiveResult,
  ForceTask, ForceResult,
  NIOSHDuration,
  PhysicalRiskLevel, PhysicalVerdictColor,
  PhysicalInvestigation, PhysicalStatistics,
} from './physical-investigation-types';

// ─── NIOSH / ISO 11228-1: Tillen & Neerlaten ─────────────────────────────────

/**
 * Ff frequentiefactor lookup tabel (ISO 11228-1:2021 Annex B / NIOSH 1994).
 * Structuur: entries bevatten maxFreq (lifts/min) en de bijbehorende Ff waarde.
 * Gebruik de eerste entry waarvoor freq ≤ maxFreq.
 */
const FF_BREAKPOINTS: Record<NIOSHDuration, Array<{ maxFreq: number; ff: number }>> = {
  // ≤ 1 uur (met rusttijd ≥ 120% werktijd)
  short: [
    { maxFreq: 0.2,       ff: 1.00 },
    { maxFreq: 1,         ff: 0.94 },
    { maxFreq: 2,         ff: 0.91 },
    { maxFreq: 3,         ff: 0.88 },
    { maxFreq: 4,         ff: 0.84 },
    { maxFreq: 5,         ff: 0.80 },
    { maxFreq: 6,         ff: 0.75 },
    { maxFreq: 7,         ff: 0.70 },
    { maxFreq: 8,         ff: 0.60 },
    { maxFreq: 9,         ff: 0.52 },
    { maxFreq: 10,        ff: 0.45 },
    { maxFreq: 11,        ff: 0.41 },
    { maxFreq: 12,        ff: 0.37 },
    { maxFreq: 13,        ff: 0.34 },
    { maxFreq: 14,        ff: 0.31 },
    { maxFreq: 15,        ff: 0.28 },
    { maxFreq: Infinity,  ff: 0 }, // > 15/min: niet van toepassing
  ],
  // 1–2 uur (met rusttijd ≥ 30% werktijd)
  medium: [
    { maxFreq: 0.2,       ff: 0.95 },
    { maxFreq: 1,         ff: 0.88 },
    { maxFreq: 2,         ff: 0.84 },
    { maxFreq: 3,         ff: 0.79 },
    { maxFreq: 4,         ff: 0.72 },
    { maxFreq: 5,         ff: 0.60 },
    { maxFreq: 6,         ff: 0.50 },
    { maxFreq: 7,         ff: 0.42 },
    { maxFreq: 8,         ff: 0.35 },
    { maxFreq: 9,         ff: 0.30 },
    { maxFreq: 10,        ff: 0.26 },
    { maxFreq: 11,        ff: 0.23 },
    { maxFreq: Infinity,  ff: 0 }, // ≥ 12/min bij 1–2 uur: niet van toepassing
  ],
  // 2–8 uur
  long: [
    { maxFreq: 0.2,       ff: 0.85 },
    { maxFreq: 1,         ff: 0.75 },
    { maxFreq: 2,         ff: 0.65 },
    { maxFreq: 3,         ff: 0.55 },
    { maxFreq: 4,         ff: 0.45 },
    { maxFreq: 5,         ff: 0.35 },
    { maxFreq: 6,         ff: 0.27 },
    { maxFreq: 7,         ff: 0.22 },
    { maxFreq: 8,         ff: 0.18 },
    { maxFreq: Infinity,  ff: 0 }, // ≥ 9/min bij 2–8 uur: niet van toepassing
  ],
};

const GRIP_FACTOR: Record<string, number> = {
  good: 1.00,
  fair: 0.95,
  poor: 0.90,
};

function lookupFf(frequency: number, duration: NIOSHDuration): number {
  const table = FF_BREAKPOINTS[duration];
  const entry = table.find((e) => frequency <= e.maxFreq);
  return entry?.ff ?? 0;
}

function r2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Bereken NIOSH Horizontal Factor Hf.
 * Hf = 25 / H; H in cm, clamped to [25, 63].
 * Als H > 63: NIOSH niet toepasbaar (geef 0 terug als signaal).
 */
function calcHf(H_cm: number): number {
  if (H_cm < 25) return 1.0;
  if (H_cm > 63) return 0; // grenswaarde overschreden
  return r2(25 / H_cm);
}

/**
 * NIOSH Vertical Factor Vf.
 * Vf = 1 − 0.003 × |V − 75|; V in cm.
 * Als V > 175: NIOSH niet toepasbaar.
 */
function calcVf(V_cm: number): number {
  if (V_cm > 175) return 0;
  const vf = 1 - 0.003 * Math.abs(V_cm - 75);
  return r2(Math.max(0, vf));
}

/**
 * NIOSH Displacement Factor Df.
 * D = |V_end − V_start|; Df = 0.82 + 4.5/D.
 * Als D < 25: Df = 1.0.
 */
function calcDf(V_start: number, V_end: number): number {
  const D = Math.abs(V_end - V_start);
  if (D < 25) return 1.0;
  return r2(Math.min(1.0, 0.82 + 4.5 / D));
}

/**
 * NIOSH Asymmetry Factor Af.
 * Af = 1 − 0.0032 × A; A in graden (0–135).
 */
function calcAf(A_degrees: number): number {
  if (A_degrees > 135) return 0;
  return r2(Math.max(0, 1 - 0.0032 * A_degrees));
}

/**
 * Bereken NIOSH RWL (Recommended Weight Limit).
 * RWL = 23 × Hf × Vf × Df × Ff × Af × Cf
 */
function calcRWL(Hf: number, Vf: number, Df: number, Ff: number, Af: number, Cf: number): number {
  return r2(23 * Hf * Vf * Df * Ff * Af * Cf);
}

export function computeLiftingResult(task: LiftingTask): LiftingResult {
  const Hf_start = calcHf(task.H_start);
  const Hf_end = task.H_end != null ? calcHf(task.H_end) : undefined;
  const Vf_start = calcVf(task.V_start);
  const Vf_end = calcVf(task.V_end);
  const Df = calcDf(task.V_start, task.V_end);
  const Ff = lookupFf(task.frequency, task.duration);
  const Af_start = calcAf(task.A_start);
  const Af_end = task.A_end != null ? calcAf(task.A_end) : undefined;
  const Cf = GRIP_FACTOR[task.grip] ?? 0.90;

  // Gebruik slechtste combinatie per positie
  const Hf_use_start = Hf_start;
  const Hf_use_end = Hf_end ?? Hf_start;
  const Af_use_start = Af_start;
  const Af_use_end = Af_end ?? Af_start;

  const rwl_start = calcRWL(Hf_use_start, Vf_start, Df, Ff, Af_use_start, Cf);
  const rwl_end = Hf_end != null || task.A_end != null
    ? calcRWL(Hf_use_end, Vf_end, Df, Ff, Af_use_end, Cf)
    : undefined;

  const rwl_min = rwl_end != null ? Math.min(rwl_start, rwl_end) : rwl_start;
  const li = rwl_min > 0 ? r2(task.weight / rwl_min) : 99;

  // ── Directe actie criteria (ongeacht LI) ──
  const directActionReasons: string[] = [];
  if (task.weight > 25) directActionReasons.push('Gewicht > 25 kg');
  if (task.V_start > 175 || task.V_end > 175) directActionReasons.push('Verticale tilhoogte > 175 cm');
  if (task.V_start < 0) directActionReasons.push('Verticale tilhoogte < 0 cm (onder vloerniveau)');
  if (task.frequency > 900 / 60) directActionReasons.push('Frequentie > 900×/uur');
  if (task.H_start > 63 || (task.H_end != null && task.H_end > 63)) directActionReasons.push('Horizontale afstand > 63 cm');
  if (task.A_start > 135 || (task.A_end != null && task.A_end > 135)) directActionReasons.push('Draaihoek > 135°');
  const directAction = directActionReasons.length > 0 || li > 2;

  // ── Risicovlaggen (Li ≤ 1 maar toch risicovol) ──
  const riskFlags: string[] = [];
  if (task.oneHanded) riskFlags.push('Éénhandig tillen');
  if (task.slipperyFloor) riskFlags.push('Gladde vloer');
  if (task.extremeClimate) riskFlags.push('Bijzonder klimaat (> 32 °C of < 0 °C)');
  if (task.unevenFloor) riskFlags.push('Ongelijke of zachte vloer');
  if (task.exceedEightHours) riskFlags.push('Werktijd > 8 uur');
  if (task.unstableObject) riskFlags.push('Instabiel object / wisselend gewicht');
  if (task.highAcceleration) riskFlags.push('Hoge versnelling / schokbelasting');
  if (task.restrictedSpace) riskFlags.push('Beperkte bewegingsvrijheid');

  // ── Verdict ──
  let verdict: PhysicalRiskLevel;
  let verdictLabel: string;
  let verdictColor: PhysicalVerdictColor;

  if (directActionReasons.length > 0 || li > 2) {
    verdict = 'high';
    verdictLabel = 'Zeer risicovol — direct actie vereist';
    verdictColor = 'red';
  } else if (li > 1 || (li <= 1 && riskFlags.length > 0)) {
    verdict = 'moderate';
    verdictLabel = li > 1 ? 'Risicovol — maatregelen nodig' : 'Licht risicovol — aandacht vereist';
    verdictColor = 'amber';
  } else {
    verdict = 'acceptable';
    verdictLabel = 'Acceptabel';
    verdictColor = 'emerald';
  }

  return {
    taskId: task.id,
    bgId: task.bgId,
    Hf_start, Hf_end,
    Vf_start, Vf_end,
    Df, Ff,
    Af_start, Af_end,
    Cf,
    rwl_start, rwl_end,
    rwl_min, li,
    verdict, verdictLabel, verdictColor,
    riskFlags, directAction, directActionReasons,
  };
}

// ─── Dragen (Mital methode) ───────────────────────────────────────────────────

export function computeCarryingResult(task: CarryingTask): CarryingResult {
  // Correctiefactoren
  const durationFactor =
    task.workDuration <= 1 ? 1.14 :
    task.workDuration <= 4 ? 1.08 :
    task.workDuration <= 8 ? 1.00 : 0.92;

  const asymmetryFactor =
    task.asymmetry === '30-60' ? 0.92 : 1.00;

  const gripFactor =
    task.grip === 'fair' ? 0.93 :
    task.grip === 'poor' ? 0.85 : 1.00;

  const heatFactor =
    task.climate === 'warm' ? 0.88 : 1.00;

  const C = r2(durationFactor * asymmetryFactor * gripFactor * heatFactor);

  // Simplified Mital lookup — tweehandig, 2.1 m, 111 cm hoogte, 1/min baseline
  // Acceptabele grens ≈ 13 × C; Zeer risicovol ≈ 20 × C (ruwe benadering)
  const base_acceptable = task.bimanual ? 13 : 5.5;
  const base_high_risk = task.bimanual ? 20 : 10.5;

  const acceptableLimit = r2(base_acceptable * C);
  const highRiskLimit = r2(base_high_risk * C);

  let verdict: PhysicalRiskLevel;
  let verdictLabel: string;
  let verdictColor: PhysicalVerdictColor;

  if (task.weight <= acceptableLimit) {
    verdict = 'acceptable'; verdictLabel = 'Acceptabel'; verdictColor = 'emerald';
  } else if (task.weight < highRiskLimit) {
    verdict = 'moderate'; verdictLabel = 'Risicovol — maatregelen overwegen'; verdictColor = 'amber';
  } else {
    verdict = 'high'; verdictLabel = 'Zeer risicovol — maatregelen vereist'; verdictColor = 'red';
  }

  return {
    taskId: task.id,
    bgId: task.bgId,
    C, acceptableLimit, highRiskLimit,
    verdict, verdictLabel, verdictColor,
  };
}

// ─── Duwen & Trekken (vereenvoudigde DUTCH/ISO 11228-2 beoordeling) ───────────

export function computePushPullResult(task: PushPullTask): PushPullResult {
  // Referentiekrachten (N) per handgreephoogte en type — ISO 11228-2 / DUTCH richtlijn
  // Waarden zijn gemiddelden voor gemengde populatie (mannen+vrouwen), start en voortbeweging
  const FORCE_LIMITS: Record<string, { init: number; sust: number }> = {
    'low':  { init: 200, sust: 100 },
    'mid':  { init: 220, sust: 110 },
    'high': { init: 190, sust:  95 },
  };

  // Wieltjes / rijbaancorrectie
  const wheelFactor =
    task.wheelCondition === 'good'    ? 1.0 :
    task.wheelCondition === 'average' ? 0.8 : 0.6;

  const limits = FORCE_LIMITS[task.handleHeight];
  const adjInit = r2(limits.init * wheelFactor);
  const adjSust = r2(limits.sust * wheelFactor);

  const initForce = task.initialForce ?? 0;
  const sustForce = task.sustainedForce ?? 0;

  let verdict: PhysicalRiskLevel;
  let verdictLabel: string;
  let verdictColor: PhysicalVerdictColor;

  const initOk = initForce <= adjInit;
  const sustOk = sustForce <= adjSust;

  if (initOk && sustOk) {
    verdict = 'acceptable'; verdictLabel = 'Acceptabel'; verdictColor = 'emerald';
  } else if (initForce <= adjInit * 1.3 && sustForce <= adjSust * 1.3) {
    verdict = 'moderate'; verdictLabel = 'Grensgebied — maatregelen overwegen'; verdictColor = 'amber';
  } else {
    verdict = 'high'; verdictLabel = 'Overschreden — maatregelen vereist'; verdictColor = 'red';
  }

  return {
    taskId: task.id,
    bgId: task.bgId,
    verdict, verdictLabel, verdictColor,
    notes: `Grenswaarden: aanzet ≤ ${adjInit} N, voortbeweging ≤ ${adjSust} N`,
  };
}

// ─── Repeterende handelingen (OCRA Checklist — ISO 11228-3 / EN 1005-5) ───────

/**
 * OCRA Checklist totaalscore:
 * Score = CF + FaF × (PF + RF + AddF)
 *
 * Risicocategorieën:
 *  < 7.5   GREEN        Acceptabel
 *  7.5–11  YELLOW       Licht risicovol
 *  11–14   LIGHT-ORANGE Matig risicovol
 *  14–22.5 ORANGE       Risicovol
 *  > 22.5  RED          Zeer risicovol
 */
export function computeRepetitiveResult(task: RepetitiveTask): RepetitiveResult {
  const ocraScore = r2(
    task.recoveryFactor + task.forceFactor * (task.postureFactor + task.repetitivenessFactor + task.additionalFactor)
  );

  let ocraCategory: RepetitiveResult['ocraCategory'];
  let verdict: PhysicalRiskLevel;
  let verdictLabel: string;
  let verdictColor: PhysicalVerdictColor;

  if (ocraScore < 7.5) {
    ocraCategory = 'green';
    verdict = 'acceptable'; verdictLabel = 'Acceptabel (OCRA: groen)'; verdictColor = 'emerald';
  } else if (ocraScore < 11) {
    ocraCategory = 'yellow';
    verdict = 'moderate'; verdictLabel = 'Licht risicovol (OCRA: geel)'; verdictColor = 'amber';
  } else if (ocraScore < 14) {
    ocraCategory = 'light-orange';
    verdict = 'moderate'; verdictLabel = 'Matig risicovol (OCRA: lichtoranje)'; verdictColor = 'amber';
  } else if (ocraScore < 22.5) {
    ocraCategory = 'orange';
    verdict = 'high'; verdictLabel = 'Risicovol (OCRA: oranje)'; verdictColor = 'red';
  } else {
    ocraCategory = 'red';
    verdict = 'high'; verdictLabel = 'Zeer risicovol (OCRA: rood)'; verdictColor = 'red';
  }

  return {
    taskId: task.id,
    bgId: task.bgId,
    ocraScore,
    verdict, verdictLabel, verdictColor,
    ocraCategory,
  };
}

// ─── Krachten (EN 1005-3) ─────────────────────────────────────────────────────

/**
 * Maximale toelaatbare kracht F_Br = F_B × m_v × m_f × m_d
 * Risicodimensie m_r = F / F_Br
 *  m_r ≤ 0.5:  Acceptabel
 *  0.5–0.7:    Grensgebied
 *  > 0.7:      Niet acceptabel
 */
export function computeForceResult(task: ForceTask): ForceResult {
  const fBr = r2(task.referenceForce * task.speedMultiplier * task.freqMultiplier * task.durationMultiplier);
  const mr = fBr > 0 ? r2(task.measuredForce / fBr) : 99;

  let verdict: PhysicalRiskLevel;
  let verdictLabel: string;
  let verdictColor: PhysicalVerdictColor;

  if (mr <= 0.5) {
    verdict = 'acceptable'; verdictLabel = 'Acceptabel (m_r ≤ 0,5)'; verdictColor = 'emerald';
  } else if (mr <= 0.7) {
    verdict = 'moderate'; verdictLabel = 'Grensgebied (0,5 < m_r ≤ 0,7)'; verdictColor = 'amber';
  } else {
    verdict = 'high'; verdictLabel = 'Niet acceptabel (m_r > 0,7)'; verdictColor = 'red';
  }

  return {
    taskId: task.id,
    bgId: task.bgId,
    fBr, mr,
    verdict, verdictLabel, verdictColor,
  };
}

// ─── Overkoepelende BG statistieken ──────────────────────────────────────────

export function computeAllPhysicalStatistics(inv: PhysicalInvestigation): PhysicalStatistics[] {
  return inv.bgs.map((bg) => {
    const liftResults = inv.liftingTasks
      .filter((t) => t.bgId === bg.id)
      .map(computeLiftingResult);

    const carryResults = inv.carryingTasks
      .filter((t) => t.bgId === bg.id)
      .map(computeCarryingResult);

    const pushPullResults = inv.pushPullTasks
      .filter((t) => t.bgId === bg.id)
      .map(computePushPullResult);

    const repResults = inv.repetitiveTasks
      .filter((t) => t.bgId === bg.id)
      .map(computeRepetitiveResult);

    const forceResults = inv.forceTasks
      .filter((t) => t.bgId === bg.id)
      .map(computeForceResult);

    const allVerdicts = [
      ...liftResults.map((r) => r.verdict),
      ...carryResults.map((r) => r.verdict),
      ...pushPullResults.map((r) => r.verdict),
      ...repResults.map((r) => r.verdict),
      ...forceResults.map((r) => r.verdict),
    ];

    const maxLiftResult = liftResults.reduce<LiftingResult | null>(
      (best, r) => (best == null || r.li > best.li ? r : best), null
    );

    let overallVerdict: PhysicalRiskLevel = 'acceptable';
    if (allVerdicts.includes('high')) overallVerdict = 'high';
    else if (allVerdicts.includes('moderate')) overallVerdict = 'moderate';

    const overallVerdictColor: PhysicalVerdictColor =
      overallVerdict === 'high' ? 'red' :
      overallVerdict === 'moderate' ? 'amber' : 'emerald';

    return {
      bgId: bg.id,
      maxLI: maxLiftResult?.li,
      maxLITaskId: maxLiftResult?.taskId,
      overallVerdict,
      overallVerdictColor,
    } satisfies PhysicalStatistics;
  });
}
