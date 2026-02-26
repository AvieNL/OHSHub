import type { MeasurementStatistics, MeasurementVerdict } from './investigation-types';

// ─── Abramowitz & Stegun 26.2.17 polynomial approximation ────────────────────

export function normalCDF(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  const t = 1 / (1 + p * Math.abs(x));
  const y = ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t;
  return 0.5 * (1 + sign * (1 - y * Math.exp(-x * x)));
}

function mean(arr: number[]): number {
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function sampleStd(arr: number[]): number {
  const m = mean(arr);
  const variance = arr.reduce((s, v) => s + (v - m) ** 2, 0) / (arr.length - 1);
  return Math.sqrt(variance);
}

// ─── U_T lookup table (NEN-EN 689:2018+C1:2019, Tabel F.1) ───────────────────
// 70%-bovengrensfactor voor het 95e percentiel van een log-normale verdeling.
// Bron: NEN-EN 689:2018+C1:2019, Annex F, Table F.1.
// Voor n > 30 geeft de tabel geen waarden; gebruik n=30 (1,820) als conservatieve
// ondergrensbenadering (fout is gunstig voor gezondheidsprotectie).

const UT_TABLE: Record<number, number> = {
   6: 2.187,  7: 2.120,  8: 2.072,  9: 2.035, 10: 2.005,
  11: 1.981, 12: 1.961, 13: 1.944, 14: 1.929, 15: 1.917,
  16: 1.905, 17: 1.895, 18: 1.886, 19: 1.878, 20: 1.870,
  21: 1.863, 22: 1.857, 23: 1.851, 24: 1.846, 25: 1.841,
  26: 1.836, 27: 1.832, 28: 1.828, 29: 1.824, 30: 1.820,
};

export function getUT(n: number): number {
  return UT_TABLE[n] ?? 1.820; // n > 30: conservatief (tabel eindigt bij 30)
}

/**
 * Statistische analyse conform NEN-EN 689:2018+C1:2019.
 *
 * n = 3–5 → §5.5.2 Voorlopige toets (drempeltest) — verdeling-onafhankelijk:
 *   - Alle waarden < 10%/15%/20% × OELV → Aanvaardbaar
 *   - Waarde > OELV                      → Niet-aanvaardbaar
 *   - Anders                             → Geen beslissing (uitbreiden naar ≥ 6)
 *
 * n ≥ 6 → §5.5.3 + Bijlage F Statistische toets (U_R vs U_T):
 *   Log-normaal (F.3): U_R = [ln(OELV) − ln(GM)] / ln(GSD)
 *   Normaal     (F.4): U_R = (OELV − AM) / SD
 *   U_R ≥ U_T → Aanvaardbaar | U_R < U_T → Niet-aanvaardbaar
 *
 * Vereist minimaal 3 geldige meetwaarden en een bekende OELV.
 */
export function computeStats(
  values: number[],
  oelv: number,
  unit: string,
  distribution: 'log-normal' | 'normal' = 'log-normal',
): MeasurementStatistics {
  const n = values.length;

  // Log-normale parameters (altijd berekend — voor weergave en Bijlage F §F.3)
  const lnVals = values.map(Math.log);
  const lnMean = mean(lnVals);
  const lnStd = n > 1 ? sampleStd(lnVals) : 0;
  const gm = Math.exp(lnMean);
  const gsd = Math.exp(lnStd);

  // Rekenkundige parameters (Bijlage F §F.4 — normaalverdeling)
  const am = mean(values);
  const sd = n > 1 ? sampleStd(values) : 0;

  // Verdeling-afhankelijke P95 en overschrijdingsfractie
  let p95: number;
  let overshootFraction: number;
  if (distribution === 'normal') {
    p95 = am + 1.645 * sd;
    overshootFraction = sd > 0
      ? 1 - normalCDF((oelv - am) / sd)
      : am >= oelv ? 1 : 0;
  } else {
    p95 = Math.exp(lnMean + 1.645 * lnStd);
    overshootFraction = lnStd > 0
      ? 1 - normalCDF((Math.log(oelv) - lnMean) / lnStd)
      : gm >= oelv ? 1 : 0;
  }

  let verdict: MeasurementVerdict;
  let verdictLabel: string;
  let ur: number | undefined;
  let ut: number | undefined;
  let testMethod: MeasurementStatistics['testMethod'];

  if (n < 6) {
    // ── §5.5.2 Voorlopige toets (verdeling-onafhankelijk) ─────────────────
    testMethod = 'preliminary';
    const maxVal = Math.max(...values);
    const pct = n === 3 ? 0.1 : n === 4 ? 0.15 : 0.2; // n=5 → 0,2

    if (maxVal > oelv) {
      verdict = 'unacceptable';
      verdictLabel = `Niet-aanvaardbaar — waarde ${maxVal} > OELV ${oelv} (§5.5.2)`;
    } else if (maxVal < pct * oelv) {
      verdict = 'acceptable';
      verdictLabel =
        `Aanvaardbaar — alle waarden < ${pct * 100}% van OELV (§5.5.2 voorlopige toets, n=${n})`;
    } else {
      verdict = 'uncertain';
      verdictLabel =
        `Geen beslissing — hoogste waarde tussen ${pct * 100}% en 100% OELV. ` +
        `Uitbreiden naar ≥ 6 metingen voor statistische toets (§5.5.3).`;
    }
  } else {
    // ── §5.5.3 + Bijlage F Statistische toets ─────────────────────────────
    testMethod = 'bijlage-f';
    ut = getUT(n);

    if (distribution === 'normal') {
      // Bijlage F §F.4 — normaalverdeling: U_R = (OELV − AM) / SD
      if (sd === 0) {
        verdict = am < oelv ? 'acceptable' : 'unacceptable';
        verdictLabel = am < oelv
          ? 'Aanvaardbaar — alle metingen identiek en < OELV'
          : 'Niet-aanvaardbaar — alle metingen identiek en ≥ OELV';
      } else {
        ur = (oelv - am) / sd;
        if (ur >= ut) {
          verdict = 'acceptable';
          verdictLabel =
            `Aanvaardbaar — U_R (${ur.toFixed(3)}) ≥ U_T (${ut.toFixed(3)}) ` +
            `conform NEN-EN 689:2018+C1:2019, Bijlage F (normaalverdeling, §F.4)`;
        } else {
          verdict = 'unacceptable';
          verdictLabel =
            `Niet-aanvaardbaar — U_R (${ur.toFixed(3)}) < U_T (${ut.toFixed(3)}) ` +
            `conform NEN-EN 689:2018+C1:2019, Bijlage F (normaalverdeling, §F.4)`;
        }
      }
    } else {
      // Bijlage F §F.3 — log-normale verdeling: U_R = [ln(OELV) − ln(GM)] / ln(GSD)
      if (lnStd === 0) {
        verdict = gm < oelv ? 'acceptable' : 'unacceptable';
        verdictLabel = gm < oelv
          ? 'Aanvaardbaar — alle metingen identiek en < OELV'
          : 'Niet-aanvaardbaar — alle metingen identiek en ≥ OELV';
      } else {
        ur = (Math.log(oelv) - lnMean) / lnStd; // = [ln(OELV) − ln(GM)] / ln(GSD)
        if (ur >= ut) {
          verdict = 'acceptable';
          verdictLabel =
            `Aanvaardbaar — U_R (${ur.toFixed(3)}) ≥ U_T (${ut.toFixed(3)}) ` +
            `conform NEN-EN 689:2018+C1:2019, Bijlage F`;
        } else {
          verdict = 'unacceptable';
          verdictLabel =
            `Niet-aanvaardbaar — U_R (${ur.toFixed(3)}) < U_T (${ut.toFixed(3)}) ` +
            `conform NEN-EN 689:2018+C1:2019, Bijlage F`;
        }
      }
    }
  }

  return {
    n,
    gm,
    gsd,
    p95,
    oelv,
    unit,
    p95PctOfOelv: (p95 / oelv) * 100,
    overshootFraction,
    verdict,
    verdictLabel,
    testMethod,
    distribution,
    ur,
    ut,
    am,
    sd,
  };
}
