/**
 * NEN-EN-ISO 9612:2025 — Acoustics — Determination of occupational noise exposure
 * Statistical calculations for all three measurement strategies.
 *
 * Formula references are to the 2025 edition.
 */

import type {
  SoundInvestigation,
  SoundStatistics,
  SoundTaskResult,
  SoundActionLevel,
  PeakActionLevel,
  InstrumentType,
} from './sound-investigation-types';
import { averageOctaveBands, computeCombinedAttenuation } from './sound-ppe';

// ─── Constants ────────────────────────────────────────────────────────────────

const T0 = 8; // reference duration in hours (§3.2)

// ─── Table C.4 — Uncertainty contribution c1u1 for job/full-day ───────────────
// Rows correspond to N (number of samples), columns to u1 (standard deviation in dB)

const TABLE_C4_N = [3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 16, 18, 20, 25, 30] as const;
const TABLE_C4_U1 = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6] as const;

// Row order matches TABLE_C4_N
const TABLE_C4: number[][] = [
  // N=3
  [0.6, 1.6, 3.1, 5.2, 8.0, 11.5, 15.7, 20.6, 26.1, 32.2, 39.0, 46.5],
  // N=4
  [0.4, 0.9, 1.6, 2.5, 3.6, 5.0, 6.7, 8.6, 10.9, 13.4, 16.1, 19.2],
  // N=5
  [0.3, 0.7, 1.2, 1.7, 2.4, 3.3, 4.4, 5.6, 6.9, 8.5, 10.2, 12.1],
  // N=6
  [0.3, 0.6, 0.9, 1.4, 1.9, 2.6, 3.3, 4.2, 5.2, 6.3, 7.6, 8.9],
  // N=7
  [0.2, 0.5, 0.8, 1.2, 1.6, 2.2, 2.8, 3.5, 4.3, 5.1, 6.1, 7.2],
  // N=8
  [0.2, 0.5, 0.7, 1.1, 1.4, 1.9, 2.4, 3.0, 3.6, 4.4, 5.2, 6.1],
  // N=9
  [0.2, 0.4, 0.7, 1.0, 1.3, 1.7, 2.1, 2.6, 3.2, 3.9, 4.6, 5.4],
  // N=10
  [0.2, 0.4, 0.6, 0.9, 1.2, 1.5, 1.9, 2.4, 2.9, 3.5, 4.1, 4.8],
  // N=12
  [0.2, 0.3, 0.5, 0.8, 1.0, 1.3, 1.7, 2.0, 2.5, 2.9, 3.5, 4.0],
  // N=14
  [0.1, 0.3, 0.5, 0.7, 0.9, 1.2, 1.5, 1.8, 2.2, 2.6, 3.0, 3.5],
  // N=16
  [0.1, 0.3, 0.5, 0.6, 0.8, 1.1, 1.3, 1.6, 2.0, 2.3, 2.7, 3.2],
  // N=18
  [0.1, 0.3, 0.4, 0.6, 0.8, 1.0, 1.2, 1.5, 1.8, 2.1, 2.5, 2.9],
  // N=20
  [0.1, 0.3, 0.4, 0.5, 0.7, 0.9, 1.1, 1.4, 1.7, 2.0, 2.3, 2.6],
  // N=25
  [0.1, 0.2, 0.3, 0.5, 0.6, 0.8, 1.0, 1.2, 1.4, 1.7, 2.0, 2.3],
  // N=30
  [0.1, 0.2, 0.3, 0.4, 0.6, 0.7, 0.9, 1.1, 1.3, 1.5, 1.7, 2.0],
];

/**
 * Bilinear interpolation in Table C.4.
 * Returns c1×u1 in dB for given N and u1.
 */
export function tableC4Lookup(N: number, u1: number): number {
  const nClamped = Math.max(TABLE_C4_N[0], Math.min(TABLE_C4_N[TABLE_C4_N.length - 1], N));
  const u1Clamped = Math.max(TABLE_C4_U1[0], Math.min(TABLE_C4_U1[TABLE_C4_U1.length - 1], u1));

  // Find N row bracket
  let ri = TABLE_C4_N.length - 2;
  for (let i = 0; i < TABLE_C4_N.length - 1; i++) {
    if (TABLE_C4_N[i + 1] >= nClamped) { ri = i; break; }
  }
  // Find u1 column bracket
  let ci = TABLE_C4_U1.length - 2;
  for (let i = 0; i < TABLE_C4_U1.length - 1; i++) {
    if (TABLE_C4_U1[i + 1] >= u1Clamped) { ci = i; break; }
  }

  const ri2 = Math.min(ri + 1, TABLE_C4_N.length - 1);
  const ci2 = Math.min(ci + 1, TABLE_C4_U1.length - 1);

  const nFrac =
    TABLE_C4_N[ri] === TABLE_C4_N[ri2]
      ? 0
      : (nClamped - TABLE_C4_N[ri]) / (TABLE_C4_N[ri2] - TABLE_C4_N[ri]);
  const uFrac =
    TABLE_C4_U1[ci] === TABLE_C4_U1[ci2]
      ? 0
      : (u1Clamped - TABLE_C4_U1[ci]) / (TABLE_C4_U1[ci2] - TABLE_C4_U1[ci]);

  const v11 = TABLE_C4[ri][ci];
  const v12 = TABLE_C4[ri][ci2];
  const v21 = TABLE_C4[ri2][ci];
  const v22 = TABLE_C4[ri2][ci2];

  return v11 * (1 - nFrac) * (1 - uFrac)
       + v12 * (1 - nFrac) * uFrac
       + v21 * nFrac * (1 - uFrac)
       + v22 * nFrac * uFrac;
}

// ─── Table C.5 — Standard uncertainty u2 of instrumentation ──────────────────

export function u2FromInstrumentType(type: InstrumentType): number {
  switch (type) {
    case 'slm-class1': return 0.7;
    case 'dosimeter':  return 1.5;
    case 'slm-class2': return 1.5;
  }
}

// ─── §C.6 — Standard uncertainty due to microphone position ──────────────────
const U3 = 1.0; // dB — §C.6

// ─── Formula helpers ──────────────────────────────────────────────────────────

/**
 * Formula (3) / (7): A-weighted equivalent continuous SPL — energy average.
 * L = 10 × lg(1/N × Σ 10^(0.1 × Li))
 */
export function energyAverage(values: number[]): number {
  if (values.length === 0) return -Infinity;
  const sum = values.reduce((acc, v) => acc + Math.pow(10, 0.1 * v), 0);
  return 10 * Math.log10(sum / values.length);
}

/**
 * Formula (4): Contribution from task m to daily noise exposure level.
 * L_EX,8h,m = L_p,A,eqTm + 10 × lg(Tm / T0)
 */
export function lEx8hTask(lpa_eqTm: number, durationHours: number): number {
  return lpa_eqTm + 10 * Math.log10(durationHours / T0);
}

/**
 * Formula (5): Daily noise exposure level from task-based measurements.
 * L_EX,8h = 10 × lg(Σm Tm/T0 × 10^(0.1 × L_p,A,eqTm))
 */
export function lEx8hFromTasks(
  tasks: Array<{ lpa_eqTm: number; durationHours: number }>,
): number {
  if (tasks.length === 0) return -Infinity;
  const sum = tasks.reduce(
    (acc, t) => acc + (t.durationHours / T0) * Math.pow(10, 0.1 * t.lpa_eqTm),
    0,
  );
  return 10 * Math.log10(sum);
}

/**
 * Formula (8) / (9): Daily noise exposure level for job-based or full-day.
 * L_EX,8h = L_p,A,eqTe + 10 × lg(Te / T0)
 */
export function lEx8hFromJobBased(lpa_eqTe: number, effectiveDayHours: number): number {
  return lpa_eqTe + 10 * Math.log10(effectiveDayHours / T0);
}

/**
 * Formula C.6: Standard uncertainty due to noise level sampling for task m.
 * u_1a,m = sqrt(1/(I(I-1)) × Σ(L_p,A,eqTm,i − L̄_p,A,eqTm)²)
 * Note: L̄ is the ARITHMETIC mean of dB values (confirmed by Annex D example).
 */
export function u1aSampling(measurements: number[]): number {
  const I = measurements.length;
  if (I < 2) return 0;
  const arithmMean = measurements.reduce((a, b) => a + b, 0) / I;
  const sumSq = measurements.reduce((acc, v) => acc + Math.pow(v - arithmMean, 2), 0);
  return Math.sqrt(sumSq / (I * (I - 1)));
}

/**
 * Formula C.12: Standard uncertainty due to noise level sampling for job/full-day.
 * u1 = sqrt(1/(N-1) × Σ(L_p,A,eqTn − L̄_p,A,eqT)²)
 * This is the sample standard deviation of the measured dB values.
 */
export function u1JobSampling(samples: number[]): number {
  const N = samples.length;
  if (N < 2) return 0;
  const arithmMean = samples.reduce((a, b) => a + b, 0) / N;
  const sumSq = samples.reduce((acc, v) => acc + Math.pow(v - arithmMean, 2), 0);
  return Math.sqrt(sumSq / (N - 1));
}

/**
 * Formula C.4: Sensitivity coefficient for task m.
 * c_1a,m = (Tm / T0) × 10^(0.1 × (L_p,A,eqTm − L_EX,8h))
 */
export function c1aSensitivity(
  durationHours: number,
  lpa_eqTm: number,
  lEx8h: number,
): number {
  return (durationHours / T0) * Math.pow(10, 0.1 * (lpa_eqTm - lEx8h));
}

// ─── Verdict helpers ──────────────────────────────────────────────────────────

/** Arbobesluit art. 6.6–6.8 action values for L_EX,8h */
export function soundActionLevel(lEx8h_95pct: number): SoundActionLevel {
  if (lEx8h_95pct < 80) return 'below-lav';
  if (lEx8h_95pct < 85) return 'lav';
  if (lEx8h_95pct < 87) return 'uav';
  return 'above-elv';
}

export function soundActionLevelLabel(level: SoundActionLevel): string {
  switch (level) {
    case 'below-lav': return 'Onder onderste actiewaarde (< 80 dB(A))';
    case 'lav':       return 'Boven onderste actiewaarde (80–85 dB(A))';
    case 'uav':       return 'Boven bovenste actiewaarde (85–87 dB(A))';
    case 'above-elv': return 'Grenswaarde overschreden (≥ 87 dB(A))';
  }
}

export function soundActionLevelColor(level: SoundActionLevel): 'emerald' | 'amber' | 'orange' | 'red' {
  switch (level) {
    case 'below-lav': return 'emerald';
    case 'lav':       return 'amber';
    case 'uav':       return 'orange';
    case 'above-elv': return 'red';
  }
}

/** Arbobesluit art. 6.6–6.8 action values for L_p,Cpeak */
export function peakActionLevel(lCpeak: number): PeakActionLevel {
  if (lCpeak < 135) return 'below-lav';
  if (lCpeak < 137) return 'lav';
  if (lCpeak < 140) return 'uav';
  return 'above-elv';
}

export function peakActionLevelLabel(level: PeakActionLevel): string {
  switch (level) {
    case 'below-lav': return 'Onder onderste actiewaarde (< 135 dB(C))';
    case 'lav':       return 'Boven onderste actiewaarde (135–137 dB(C))';
    case 'uav':       return 'Boven bovenste actiewaarde (137–140 dB(C))';
    case 'above-elv': return 'Piekgrenswaarde overschreden (≥ 140 dB(C))';
  }
}

// ─── Main computation ─────────────────────────────────────────────────────────

/**
 * Compute SoundStatistics for all HEGs in a SoundInvestigation.
 * Called at the start of Step 7 and whenever measurements change.
 */
export function computeAllStatistics(inv: SoundInvestigation): SoundStatistics[] {
  const results: SoundStatistics[] = [];

  for (const heg of inv.hegs) {
    const stat = computeHegStatistics(inv, heg.id);
    if (stat) results.push(stat);
  }

  return results;
}

export function computeHegStatistics(
  inv: SoundInvestigation,
  hegId: string,
): SoundStatistics | null {
  const heg = inv.hegs.find((h) => h.id === hegId);
  if (!heg) return null;

  // Fallback u2 als geen instrumentId is gekoppeld aan meting (Tabel C.5)
  const u2 = inv.instruments.length > 0
    ? Math.max(...inv.instruments.map((inst) => u2FromInstrumentType(inst.type)))
    : 1.5;

  const validMeasurements = inv.measurements.filter(
    (m) => m.hegId === hegId && !m.excluded,
  );

  const stat = heg.strategy === 'task-based'
    ? computeTaskBased(inv, heg.id, heg.effectiveDayHours, u2, validMeasurements)
    : computeJobBased(inv, heg.id, heg.effectiveDayHours, u2, validMeasurements);

  if (!stat) return null;

  // H-1: ELV-toetsing met PBM-correctie (art. 6.6 lid 2 Arbobesluit)
  // LAV (80 dB(A)) en UAV (85 dB(A)) worden beoordeeld ZONDER PBM-aftrek.
  // De grenswaarde (87 dB(A)) MAG worden beoordeeld MÉT PBM-aftrek.
  const avgLp = averageOctaveBands(validMeasurements);
  const ppeResult = computeCombinedAttenuation(heg, avgLp);
  if (ppeResult && ppeResult.attenuation > 0) {
    const lEx8h_95pct_oor = stat.lEx8h_95pct - ppeResult.attenuation;
    return {
      ...stat,
      lEx8h_95pct_oor,
      elvPpeCompliant: lEx8h_95pct_oor < 87,
      ppeCombinedMethod: ppeResult.method,
      ppeCapped: ppeResult.capped,
    };
  }

  return stat;
}

function computeTaskBased(
  inv: SoundInvestigation,
  hegId: string,
  _effectiveDayHours: number,
  u2: number,
  validMeasurements: SoundInvestigation['measurements'],
): SoundStatistics | null {
  const hegTasks = inv.tasks.filter((t) => t.hegId === hegId);
  if (hegTasks.length === 0) return null;

  const heg = inv.hegs.find((h) => h.id === hegId);
  const taskResults: SoundTaskResult[] = [];
  const taskWarnings: string[] = [];
  const spreadWarnings: SoundStatistics['spreadWarnings'] = [];

  for (const task of hegTasks) {
    const taskMeasObjs = validMeasurements.filter((m) => m.taskId === task.id);
    const taskMeas = taskMeasObjs.map((m) => m.lpa_eqT);

    if (taskMeas.length === 0) continue;

    // K-3: Minimaal 3 metingen per taak (§9.3.1 NEN-EN-ISO 9612:2025)
    if (taskMeas.length < 3) {
      taskWarnings.push(
        `Taak '${task.name}': ${taskMeas.length} meting${taskMeas.length !== 1 ? 'en' : ''} — minimaal 3 vereist (§9.3.1 NEN-EN-ISO 9612:2025)`,
      );
    }

    // K-5: Spreidingscontrole — Bijlage E NEN-EN-ISO 9612:2025
    if (taskMeas.length >= 2) {
      const spread = Math.max(...taskMeas) - Math.min(...taskMeas);
      // Grens: ≤ 3 dB voor één medewerker, ≤ 5 dB voor groep (Bijlage E)
      const spreadLimit = (heg?.workerCount ?? 2) <= 1 ? 3 : 5;
      if (spread > spreadLimit) {
        spreadWarnings.push({ taskId: task.id, taskName: task.name, spread, limit: spreadLimit });
      }
      taskResults.push({
        taskId: task.id,
        taskName: task.name,
        durationHours: task.durationHours,
        nMeasurements: taskMeas.length,
        lpa_eqTm: energyAverage(taskMeas),
        lEx8hm: lEx8hTask(energyAverage(taskMeas), task.durationHours),
        u1a: u1aSampling(taskMeas),
        c1a: 0,
        // K-1: u1b effectief in dB — taakduurspreiding (§C.5 NEN-EN-ISO 9612:2025)
        // u1b,eff = (10/ln10) × (Tmax − Tmin) / (2√3 × Tm)   [dB]
        u1b: (task.durationMin != null && task.durationMax != null && task.durationHours > 0)
          ? (10 / Math.LN10) * (task.durationMax - task.durationMin) / (2 * Math.sqrt(3) * task.durationHours)
          : 0,
        spread: taskMeas.length >= 2 ? Math.max(...taskMeas) - Math.min(...taskMeas) : 0,
      });
    } else {
      taskResults.push({
        taskId: task.id,
        taskName: task.name,
        durationHours: task.durationHours,
        nMeasurements: taskMeas.length,
        lpa_eqTm: energyAverage(taskMeas),
        lEx8hm: lEx8hTask(energyAverage(taskMeas), task.durationHours),
        u1a: u1aSampling(taskMeas),
        c1a: 0,
        u1b: (task.durationMin != null && task.durationMax != null && task.durationHours > 0)
          ? (10 / Math.LN10) * (task.durationMax - task.durationMin) / (2 * Math.sqrt(3) * task.durationHours)
          : 0,
        spread: 0,
      });
    }
  }

  if (taskResults.length === 0) return null;

  // Formula (5): L_EX,8h
  const lEx8h = lEx8hFromTasks(taskResults);

  // Update sensitivity coefficients (Formula C.4)
  for (const tr of taskResults) {
    tr.c1a = c1aSensitivity(tr.durationHours, tr.lpa_eqTm, lEx8h);
  }

  // H-3: u2 per meting via seriesId → instrumentId (§C.6 / Tabel C.5 NEN-EN-ISO 9612:2025)
  // Per taak: max u2 van de daadwerkelijk gebruikte instrumenten.
  const taskU2Map = new Map<string, number>();
  for (const task of hegTasks) {
    const taskMeasObjs = validMeasurements.filter((m) => m.taskId === task.id);
    const taskU2 = taskMeasObjs.length > 0
      ? Math.max(...taskMeasObjs.map((m) => {
          const series = (inv.measurementSeries ?? []).find((s) => s.id === m.seriesId);
          const instId = series?.instrumentId ?? m.instrumentId;
          const inst = inv.instruments.find((i) => i.id === instId);
          return inst ? u2FromInstrumentType(inst.type) : u2;
        }))
      : u2;
    taskU2Map.set(task.id, taskU2);
  }

  // K-1: Gecombineerde onzekerheid (Formule C.3 NEN-EN-ISO 9612:2025)
  // u²(L_EX,8h) = Σm [c1a,m² × (u1a,m² + u1b,m² + u2,m² + u3²)]
  const uSq = taskResults.reduce((acc, tr) => {
    const tU2 = taskU2Map.get(tr.taskId) ?? u2;
    return acc + Math.pow(tr.c1a, 2) * (
      Math.pow(tr.u1a, 2) + Math.pow(tr.u1b, 2) + Math.pow(tU2, 2) + Math.pow(U3, 2)
    );
  }, 0);
  const u = Math.sqrt(uSq);
  const U = 1.65 * u; // Formule (10): k = 1,65 eenzijdig 95%-betrouwbaarheidsinterval
  const lEx8h_95pct = lEx8h + U;

  // u1 representatief (hoogste taakwaarde voor overzichtsweergave)
  const u1 = taskResults.length > 0 ? Math.max(...taskResults.map((tr) => tr.u1a)) : 0;

  // Peak: hoogste gemeten L_p,Cpeak
  const peaks = validMeasurements.filter((m) => m.lpCpeak != null).map((m) => m.lpCpeak!);
  const lCpeak = peaks.length > 0 ? Math.max(...peaks) : undefined;

  const verdict = soundActionLevel(lEx8h_95pct);
  const insufficientTaskData = taskWarnings.length > 0;

  // Effective u2 for summary display (max across all tasks)
  const effectiveU2 = taskResults.length > 0
    ? Math.max(...taskResults.map((tr) => taskU2Map.get(tr.taskId) ?? u2))
    : u2;

  return {
    hegId,
    strategy: 'task-based',
    n: validMeasurements.length,
    taskResults,
    lEx8h,
    u1,
    u2: effectiveU2,
    u3: U3,
    u,
    U,
    lEx8h_95pct,
    verdict,
    verdictLabel: soundActionLevelLabel(verdict),
    verdictColor: soundActionLevelColor(verdict),
    insufficientTaskData,
    taskWarnings: taskWarnings.length > 0 ? taskWarnings : undefined,
    spreadWarnings: spreadWarnings.length > 0 ? spreadWarnings : undefined,
    ...(lCpeak !== undefined
      ? { lCpeak, peakVerdict: peakActionLevel(lCpeak), peakVerdictLabel: peakActionLevelLabel(peakActionLevel(lCpeak)) }
      : {}),
  };
}

function computeJobBased(
  _inv: SoundInvestigation,
  hegId: string,
  effectiveDayHours: number,
  u2: number,
  validMeasurements: SoundInvestigation['measurements'],
): SoundStatistics | null {
  const samples = validMeasurements.map((m) => m.lpa_eqT);
  if (samples.length < 3) return null;

  // K-4 fix: strategie van de HEG-instelling, niet afgeleid van meetaantal
  const heg = _inv.hegs.find((h) => h.id === hegId);
  const strategy = heg?.strategy ?? 'job-based';

  // H-3: u2 per meting via seriesId → instrumentId (Tabel C.5 NEN-EN-ISO 9612:2025)
  const effectiveU2 = validMeasurements.length > 0
    ? Math.max(...validMeasurements.map((m) => {
        const series = (_inv.measurementSeries ?? []).find((s) => s.id === m.seriesId);
        const instId = series?.instrumentId ?? m.instrumentId;
        const inst = _inv.instruments.find((i) => i.id === instId);
        return inst ? u2FromInstrumentType(inst.type) : u2;
      }))
    : u2;

  // Formula (7): energy average L_p,A,eqTe
  const lpa_eqTe = energyAverage(samples);

  // Formula (8)/(9): L_EX,8h
  const lEx8h = lEx8hFromJobBased(lpa_eqTe, effectiveDayHours);

  // Formula C.12: u1 (standaarddeviatie van de steekproef)
  const u1 = u1JobSampling(samples);

  // Tabel C.4: c1u1 (bemonsteringsonzekerheid via interpolatie)
  const c1u1 = tableC4Lookup(samples.length, u1);
  const c1u1Excessive = c1u1 > 3.5; // §10.4: meetplan herzien als > 3,5 dB

  // Formula C.9: u²(L_EX,8h) = (c1u1)² + u2² + u3²
  const uSq = Math.pow(c1u1, 2) + Math.pow(effectiveU2, 2) + Math.pow(U3, 2);
  const u = Math.sqrt(uSq);
  const U = 1.65 * u; // k = 1,65 eenzijdig 95%-betrouwbaarheidsinterval (Formule 10)
  const lEx8h_95pct = lEx8h + U;

  // Peak
  const peaks = validMeasurements.filter((m) => m.lpCpeak != null).map((m) => m.lpCpeak!);
  const lCpeak = peaks.length > 0 ? Math.max(...peaks) : undefined;

  const verdict = soundActionLevel(lEx8h_95pct);

  return {
    hegId,
    strategy, // K-4: correct van HEG-definitie
    n: samples.length,
    lpa_eqTe,
    lEx8h,
    u1,
    u2: effectiveU2,
    u3: U3,
    u,
    U,
    c1u1,
    c1u1Excessive,
    lEx8h_95pct,
    verdict,
    verdictLabel: soundActionLevelLabel(verdict),
    verdictColor: soundActionLevelColor(verdict),
    ...(lCpeak !== undefined
      ? { lCpeak, peakVerdict: peakActionLevel(lCpeak), peakVerdictLabel: peakActionLevelLabel(peakActionLevel(lCpeak)) }
      : {}),
  };
}
