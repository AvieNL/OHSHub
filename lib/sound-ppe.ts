/**
 * PPE attenuation calculation utilities — EN 458:2016
 * Used by the Assessment component, text report, and PDF export.
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
 *   Combined attenuation = max(APF1, APF2) + 5 dB (HML / SNR methods)
 *   For octave-band method: per-band minimum of both protected levels, then energy-sum.
 *   Hard cap: 35 dB — total attenuation cannot exceed 35 dB(A) due to bone conduction.
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
    const pnr1 = hmlVal1! / 2;
    const pnr2 = hmlVal2! / 2;
    const raw = Math.max(pnr1, pnr2) + 5;
    const capped = raw > 35;
    return {
      attenuation: parseFloat(Math.min(raw, 35).toFixed(1)),
      method: 'double-hml',
      capped,
    };
  }

  // ── Double: SNR / APF fallback ────────────────────────────────────────────
  const snrApf1 = apf1 > 0 ? apf1 : ((heg.ppeSNR ?? 0) / 2);
  const snrApf2 = heg.ppe2SNRUnknown ? 0 : (heg.ppe2Attenuation ?? ((heg.ppe2SNR ?? 0) / 2));
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
