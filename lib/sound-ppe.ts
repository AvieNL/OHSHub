/**
 * PPE attenuation calculation utilities — EN 458:2025 (NEN-EN 458:2026)
 * Supersedes EN 458:2016. Used by Assessment, text report, and PDF export.
 *
 * Implemented methods:
 *   §A.2  Octave-band method (exact — Formule A.1: APV = m − s per band)
 *   §A.4  HML check-method   (no L_C needed; used as conservative estimate)
 *   §A.5  SNR method         (exact when L_p,C is available; SNR/2 approximation as fallback)
 *
 * Deviations from EN 458:2025:
 *   HML:  Full HML method §A.3 (interpolation with L_p,C) is NOT implemented; §A.4 check-method is used instead.
 *   SNR:  When L_p,C is unavailable, SNR/2 is used as an approximation (not normative).
 *   Dual: §6.2.4 prescribes manufacturer combination data; this module estimates max(APF1,APF2)+5 dB.
 *   Cap:  35 dB(A) bone-conduction limit is physically motivated but not stated as a fixed value in EN 458:2025.
 */

import type { SoundHEG } from './sound-investigation-types';

/** Octave band centre frequencies (Hz) */
export const OCTAVE_BANDS = [63, 125, 250, 500, 1000, 2000, 4000, 8000] as const;

/** A-weighting corrections per octave band (dB), ISO 226 */
export const A_WEIGHTS = [-26.2, -16.1, -8.6, -3.2, 0.0, 1.2, 1.0, -1.1] as const;

export interface OctaveBandResult {
  /** Assumed Protection Value = m − s (84th percentile, dB) */
  apv: number;
  /** A-weighted protected level for this band (dB) */
  lProtectedA: number;
  /** A-weighted unprotected level for this band (dB) */
  lUnprotectedA: number;
}

export interface OctaveAPFResult {
  /** A-weighted unprotected level from octave bands, dB(A) */
  lA: number;
  /** A-weighted protected level at ear, dB(A) */
  lPrime: number;
  /** APF = lA − lPrime, dB */
  apf: number;
  /** Per-band detail; null when band data is incomplete */
  bandResults: (OctaveBandResult | null)[];
}

/**
 * Energy-average octave band spectra over multiple non-excluded measurements.
 * Returns 8-element array or null if no measurements have complete octave band data.
 */
export function averageOctaveBands(
  measurements: Array<{ octaveBands?: number[]; excluded?: boolean }>,
): number[] | null {
  const valid = measurements.filter((m) => !m.excluded && m.octaveBands?.length === 8);
  if (valid.length === 0) return null;
  return Array.from({ length: 8 }, (_, i) => {
    const sum = valid.reduce((acc, m) => acc + Math.pow(10, m.octaveBands![i] / 10), 0);
    return parseFloat((10 * Math.log10(sum / valid.length)).toFixed(1));
  });
}

/**
 * Build the merged bands array used by calcOctaveAPF.
 * lp is taken from avgLp (measurement averages) when available, otherwise from stored ppeOctaveBands[i].lp.
 * m and s always come from ppeOctaveBands (data sheet values entered by user).
 */
export function buildMergedBands(
  ppeOctaveBands: Array<{ lp?: number; m?: number; s?: number }> | undefined,
  avgLp: number[] | null,
): Array<{ lp?: number; m?: number; s?: number }> {
  return Array.from({ length: 8 }, (_, i) => ({
    lp: avgLp?.[i] ?? ppeOctaveBands?.[i]?.lp,
    m:  ppeOctaveBands?.[i]?.m,
    s:  ppeOctaveBands?.[i]?.s,
  }));
}

/**
 * Compute octave band APF per EN 458:2016 Annex A method 3.
 * Returns null when fewer than 3 bands have complete data.
 */
export function calcOctaveAPF(
  bands: Array<{ lp?: number; m?: number; s?: number }>,
): OctaveAPFResult | null {
  let sumUnprotected = 0;
  let sumProtected   = 0;
  let count          = 0;
  const bandResults: (OctaveBandResult | null)[] = [];

  for (let i = 0; i < 8; i++) {
    const b = bands[i];
    if (!b || b.lp == null || b.m == null || b.s == null) {
      bandResults.push(null);
      continue;
    }
    const apv          = b.m - b.s;
    const lUnprotectedA = b.lp + A_WEIGHTS[i];
    const lProtectedA  = b.lp - apv + A_WEIGHTS[i];
    sumUnprotected    += Math.pow(10, lUnprotectedA / 10);
    sumProtected      += Math.pow(10, lProtectedA  / 10);
    bandResults.push({ apv, lProtectedA, lUnprotectedA });
    count++;
  }

  if (count < 3) return null;

  const lA     = parseFloat((10 * Math.log10(sumUnprotected)).toFixed(1));
  const lPrime = parseFloat((10 * Math.log10(sumProtected)).toFixed(1));
  const apf    = parseFloat((lA - lPrime).toFixed(1));

  return { lA, lPrime, apf, bandResults };
}

// ─── Combined PPE attenuation (single or double) ──────────────────────────────

export interface CombinedPPEResult {
  attenuation: number;
  method: 'single' | 'double-snr' | 'double-hml' | 'double-octave';
  capped: boolean;
}

/**
 * Compute effective combined PPE attenuation following EN 458:2016.
 *
 * Single protector:  returns the stored ppeAttenuation directly.
 * Double protectors: uses the highest-accuracy method available (octave → HML → SNR/APF).
 *   Octave method:   per-band minimum of both protected A-weighted levels, then energy-sum.
 *   HML/SNR methods: max(APF1, APF2) + 5 dB (estimated bonus based on EN 458:2025 §6.2.4 guidance,
 *                    measured range 1–12 dB; EN 458:2025 prescribes manufacturer combination data,
 *                    no formula provided).
 *   Cap: 35 dB — physically motivated bone-conduction limit; not a fixed value in EN 458:2025.
 *
 * Returns null when no PPE data is present.
 */
export function computeCombinedAttenuation(
  heg: SoundHEG,
  avgLp: number[] | null,
): CombinedPPEResult | null {
  const apf1 = heg.ppeSNRUnknown ? 0 : (heg.ppeAttenuation ?? 0);
  if (apf1 <= 0 && !heg.ppeDouble) return null;

  // ── Single protector ──────────────────────────────────────────────────────
  if (!heg.ppeDouble) {
    return apf1 > 0
      ? { attenuation: apf1, method: 'single', capped: false }
      : null;
  }

  // ── Double: try octave-band method first ──────────────────────────────────
  const hasOctave1 = (heg.ppeOctaveBands ?? []).some((b) => b.m != null && b.s != null);
  const hasOctave2 = (heg.ppe2OctaveBands ?? []).some((b) => b.m != null && b.s != null);

  if (hasOctave1 && hasOctave2) {
    const merged1 = buildMergedBands(heg.ppeOctaveBands, avgLp);
    const merged2 = buildMergedBands(heg.ppe2OctaveBands, avgLp);
    const res1 = calcOctaveAPF(merged1);
    const res2 = calcOctaveAPF(merged2);
    if (res1 && res2) {
      // Per-band minimum of both protected A-weighted levels, then energy-sum
      let sumProtectedComb = 0;
      for (let i = 0; i < 8; i++) {
        const b1 = res1.bandResults[i];
        const b2 = res2.bandResults[i];
        if (b1 && b2) {
          sumProtectedComb += Math.pow(10, Math.min(b1.lProtectedA, b2.lProtectedA) / 10);
        }
      }
      const lRestComb = 10 * Math.log10(sumProtectedComb);
      const rawRed = res1.lA - lRestComb;
      const capped = rawRed > 35;
      return {
        attenuation: parseFloat(Math.min(rawRed, 35).toFixed(1)),
        method: 'double-octave',
        capped,
      };
    }
  }

  // ── Double: HML method ────────────────────────────────────────────────────
  const char1 = heg.ppeSpectralChar ?? 'medium';
  const char2 = heg.ppe2SpectralChar ?? 'medium';
  const hmlVal1 = char1 === 'high' ? heg.ppeH : char1 === 'low' ? heg.ppeL : heg.ppeM;
  const hmlVal2 = char2 === 'high' ? heg.ppe2H : char2 === 'low' ? heg.ppe2L : heg.ppe2M;
  const hasHML1 = heg.ppeH != null && heg.ppeM != null && heg.ppeL != null && hmlVal1 != null;
  const hasHML2 = heg.ppe2H != null && heg.ppe2M != null && heg.ppe2L != null && hmlVal2 != null;

  if (hasHML1 && hasHML2) {
    const pnr1 = hmlVal1!;
    const pnr2 = hmlVal2!;
    const raw = Math.max(pnr1, pnr2) + 5;
    const capped = raw > 35;
    return {
      attenuation: parseFloat(Math.min(raw, 35).toFixed(1)),
      method: 'double-hml',
      capped,
    };
  }

  // ── Double: SNR / APF fallback ────────────────────────────────────────────
  // Derive L_p,A from octave-band averages + A-weighting for use in exact SNR formula (EN 458:2025 §A.5).
  // Falls back to SNR/2 approximation (not normative) when L_p,C or octave data is unavailable.
  let lpAFromOctave: number | null = null;
  if (avgLp) {
    const sumA = avgLp.reduce((s, lp, i) => s + Math.pow(10, (lp + A_WEIGHTS[i]) / 10), 0);
    lpAFromOctave = 10 * Math.log10(sumA);
  }
  const toSnrApf = (snr: number, lpC: number | undefined): number =>
    lpC != null && lpAFromOctave != null ? snr - (lpC - lpAFromOctave) : snr / 2;

  const snrApf1 = apf1 > 0 ? apf1 : (heg.ppeSNR ? toSnrApf(heg.ppeSNR, heg.ppeLpC) : 0);
  const snrApf2 = heg.ppe2SNRUnknown ? 0
    : (heg.ppe2Attenuation ?? (heg.ppe2SNR ? toSnrApf(heg.ppe2SNR, heg.ppe2LpC) : 0));
  if (snrApf1 > 0 || snrApf2 > 0) {
    const raw = Math.max(snrApf1, snrApf2) + 5;
    const capped = raw > 35;
    return {
      attenuation: parseFloat(Math.min(raw, 35).toFixed(1)),
      method: 'double-snr',
      capped,
    };
  }

  return null;
}
