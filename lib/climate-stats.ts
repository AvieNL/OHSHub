/**
 * Klimaat berekeningen — OHSHub
 *
 * Implementaties:
 *  - PMV/PPD:  ISO 7730:2025 (4e editie)
 *  - WBGT:     ISO 7243:2017 (3e editie)
 *  - IREQ:     ISO 11079:2007 (vereenvoudigd)
 *  - PHS:      ISO 7933:2023 (vereenvoudigd schattingsmodel)
 *  - Lokaal:   ISO 7730:2025 §6 (tocht DR, verticaal Δt, vloertemp)
 */

import type {
  ClimateInvestigation,
  ClimateBG,
  ClimateMeasurement,
  ClimateStatistics,
  MetabolicClass,
  PMVCategory,
  ClimateVerdictColor,
} from './climate-investigation-types';
import { METABOLIC_CLASSES } from './climate-investigation-types';

// ─── Hulpfuncties ─────────────────────────────────────────────────────────────

/** Metabole belasting in W/m² op basis van klasse of handmatige override */
export function getMetabolicRate(bg: ClimateBG): number {
  return bg.metabolicRateOverride ?? METABOLIC_CLASSES[bg.metabolicClass].rate;
}

/** Dampspanning p_a (Pa) uit relatieve vochtigheid en luchttemperatuur */
export function computeVapourPressure(ta: number, RH: number): number {
  // Tetens-formule
  const psat = 610.8 * Math.exp((17.27 * ta) / (ta + 237.3));
  return (RH / 100) * psat;
}

/**
 * Gemiddelde stralingstemperatuur t_r uit globetemperatuur (ISO 7726:1998).
 * Geldig voor standaard zwarte bol ø 150 mm, ε = 0,95.
 */
export function computeMeanRadiantFromGlobe(
  tg: number,
  ta: number,
  va: number,
): number {
  const vaEff = Math.max(va, 0.001);
  const tgK4 = Math.pow(tg + 273, 4);
  // ISO 7726 factor voor ø150 mm globe
  const factor = 2.5e8 * Math.pow(vaEff, 0.6) * (tg - ta);
  return Math.pow(Math.max(tgK4 + factor, 1e10), 0.25) - 273;
}

// ─── PMV / PPD (ISO 7730:2025) ────────────────────────────────────────────────

/**
 * Berekent PMV (Predicted Mean Vote) conform ISO 7730:2025 vergelijking (1).
 *
 * @param M    Metabole belasting [W/m²]
 * @param W    Extern mechanisch werk [W/m²] (doorgaans 0)
 * @param Icl  Kledinginsulatie [clo]
 * @param ta   Luchttemperatuur [°C]
 * @param tr   Gemiddelde stralingstemperatuur [°C]
 * @param var_ Relatieve luchtsnelheid [m/s]
 * @param pa   Partiële waterdampspanning [Pa]
 * @returns PMV (-3 tot +3)
 */
export function computePMV(
  M: number,
  W: number,
  Icl: number,
  ta: number,
  tr: number,
  var_: number,
  pa: number,
): number {
  // Validatiebereik ISO 7730: M 46–232 W/m², ta 10–30°C, var 0–1 m/s
  const IclSI = Icl * 0.155; // clo → m²·K/W
  const fcl = Icl > 0.5 ? 1.05 + 0.645 * Icl : 1.00 + 1.29 * Icl;
  const HL = M - W;

  // Iteratieve berekening t_cl (kledingoppervlaktetemperatuur)
  let tcl = ta + (35.5 - ta) * 0.5; // betere beginwaarde
  for (let i = 0; i < 200; i++) {
    const tclPrev = tcl;
    const hc = Math.max(
      2.38 * Math.pow(Math.abs(tcl - ta), 0.25),
      12.1 * Math.sqrt(Math.max(var_, 0.001)),
    );
    const rhs =
      3.96e-8 * fcl * (Math.pow(tcl + 273, 4) - Math.pow(tr + 273, 4)) +
      fcl * hc * (tcl - ta);
    tcl = 35.7 - 0.028 * HL - IclSI * rhs;
    if (Math.abs(tcl - tclPrev) < 0.001) break;
  }

  const hc = Math.max(
    2.38 * Math.pow(Math.abs(tcl - ta), 0.25),
    12.1 * Math.sqrt(Math.max(var_, 0.001)),
  );

  // Warmtebelasting L (ISO 7730:2025 vgl. 1)
  const L =
    HL
    - 3.05e-3 * (5733 - 6.99 * HL - pa)
    - 0.42 * (HL - 58.15)
    - 1.7e-5 * M * (5867 - pa)
    - 0.0014 * M * (34 - ta)
    - 3.96e-8 * fcl * (Math.pow(tcl + 273, 4) - Math.pow(tr + 273, 4))
    - fcl * hc * (tcl - ta);

  return (0.303 * Math.exp(-0.036 * M) + 0.028) * L;
}

/**
 * Berekent PPD (Predicted Percentage Dissatisfied) uit PMV.
 * ISO 7730:2025 vergelijking (2).
 */
export function computePPD(pmv: number): number {
  return 100 - 95 * Math.exp(-0.03353 * pmv ** 4 - 0.2179 * pmv ** 2);
}

/** PMV-categorie conform ISO 7730:2025 Tabel 1 */
export function getPMVCategory(pmv: number): PMVCategory {
  const abs = Math.abs(pmv);
  if (abs <= 0.5) return 'A';
  if (abs <= 0.7) return 'B';
  if (abs <= 1.0) return 'C';
  return 'D';
}

const PMV_CATEGORY_LABELS: Record<PMVCategory, string> = {
  A: 'Categorie A — Hoog comfortniveau (< 6% ontevreden)',
  B: 'Categorie B — Normaal comfortniveau (< 20% ontevreden)',
  C: 'Categorie C — Acceptabel comfortniveau (< 30% ontevreden)',
  D: 'Categorie D — Buiten comfortbereik (≥ 30% ontevreden)',
};

const PMV_CATEGORY_COLORS: Record<PMVCategory, ClimateVerdictColor> = {
  A: 'emerald',
  B: 'amber',
  C: 'orange',
  D: 'red',
};

// ─── WBGT (ISO 7243:2017) ────────────────────────────────────────────────────

/**
 * Berekent WBGT (Wet Bulb Globe Temperature) conform ISO 7243:2017 §6.2.
 *
 * @param t_nw  Natte boltemperatuur (°C)
 * @param t_g   Globetemperatuur (°C)
 * @param t_a   Luchttemperatuur (°C) — alleen bij zonlast
 * @param solarLoad  Of zonlast van toepassing is
 */
export function computeWBGT(
  t_nw: number,
  t_g: number,
  t_a: number,
  solarLoad: boolean,
): number {
  if (solarLoad) {
    return 0.7 * t_nw + 0.2 * t_g + 0.1 * t_a;
  }
  return 0.7 * t_nw + 0.3 * t_g;
}

/**
 * Referentiewaarde WBGTref conform ISO 7243:2017 Tabel A.1 + continue formule.
 * Continue formule (Tabel A.1 noot a):
 *   Geacclimatiseerd:    WBGTref = 56,7 − 11,5 × log₁₀(M)
 *   Niet-geacclimatiseerd: WBGTref = 59,9 − 14,1 × log₁₀(M)
 *
 * @param M           Metabole belasting [W/m²]
 * @param acclimatized  Geacclimatiseerd aan warmte
 */
export function computeWBGTRef(M: number, acclimatized: boolean): number {
  if (acclimatized) {
    return 56.7 - 11.5 * Math.log10(M);
  }
  return 59.9 - 14.1 * Math.log10(M);
}

// ─── IREQ (ISO 11079:2007) — vereenvoudigd ────────────────────────────────────

/**
 * Berekent IREQneutral en IREQmin conform ISO 11079:2007.
 *
 * Vereenvoudigd analytisch model — voor gedetailleerde berekening
 * raadpleeg de volledige iteratieve methode in ISO 11079:2007 Bijlage A.
 *
 * @param ta  Luchttemperatuur [°C]
 * @param tr  Gemiddelde stralingstemperatuur [°C]
 * @param va  Luchtsnelheid [m/s]
 * @param pa  Dampspanning [Pa]
 * @param M   Metabole belasting [W/m²]
 * @param W   Mechanisch werk [W/m²]
 */
export function computeIREQ(
  ta: number,
  tr: number,
  va: number,
  pa: number,
  M: number,
  W: number,
): { ireqNeutral: number; ireqMin: number } {
  const HL = M - W;

  // Ademhalingsverliezen (ISO 11079 vgl.)
  const Eres = 0.0023 * M * (44 - pa / 100); // W/m²
  const Cres = 0.0014 * M * (34 - ta);        // W/m²

  // Gemiddelde huidtemperatuur bij thermisch neutraal en minimum
  // ISO 11079:2007 vergelijkingen
  const tskNeutral = 36.8 - 0.0558 * Math.max(HL - 58.15, 0);
  const tskMin     = 35.7 - 0.0285 * Math.max(HL - 58.15, 0);

  // Convectieve warmteoverdrachtscoëfficiënt (koud: ISO 11079 relatie)
  const hc = Math.max(2.38 * Math.pow(Math.abs(tskNeutral - ta), 0.25), 3.5 + 5.2 * va);
  const hr = 0.72; // W/(m²K) — benadering voor koude omgeving
  const h  = hc + hr;

  // Operatieve temperatuur
  const to = (hc * ta + hr * tr) / h;

  // Zweten bij neutraliteit (alleen bij activiteit)
  const EswN = Math.max(0, 0.42 * (HL - 58.15));

  // IREQneutral (clo)
  const denomNeutral = 0.155 * (HL - EswN - Eres - Cres);
  const ireqNeutral  = denomNeutral > 0.5
    ? (tskNeutral - to) / denomNeutral
    : 10; // onbegrensd koud

  // IREQmin (clo) — minimum voor thermisch evenwicht
  const denomMin = 0.155 * (HL - Eres - Cres);
  const ireqMin  = denomMin > 0.5
    ? (tskMin - to) / denomMin
    : 10;

  return {
    ireqNeutral: Math.max(0, ireqNeutral),
    ireqMin:     Math.max(0, Math.min(ireqMin, ireqNeutral)),
  };
}

/**
 * Schat D_lim (min) bij onvoldoende kledinginsulatie (ISO 11079:2007 §7.3).
 * Vereenvoudigd: D_lim ≈ 8h × (beschikbaar - IREQmin) / (IREQneutral - IREQmin)
 * Maximaal de effectieve werkdag.
 */
export function computeIREQDlim(
  ireqMin: number,
  ireqNeutral: number,
  ireqAvailable: number,
  workHoursPerDay: number,
): number | null {
  if (ireqAvailable >= ireqNeutral) return null; // geen beperking
  if (ireqAvailable < ireqMin) return 30; // kritiek — max 30 min als veilige schatting
  const fraction = (ireqAvailable - ireqMin) / (ireqNeutral - ireqMin);
  return Math.round(fraction * workHoursPerDay * 60);
}

// ─── PHS (ISO 7933:2023) — vereenvoudigd schattingsmodel ──────────────────────

/**
 * Vereenvoudigd PHS schattingsmodel conform ISO 7933:2023 structuur.
 *
 * NB: Dit is een vereenvoudigde benadering. Voor de volledige PHS-berekening
 * (inclusief warmteopslagcapaciteit en nauwkeurig D_lim) raadpleeg het volledige
 * iteratieve model uit ISO 7933:2023 Bijlage C.
 *
 * @param ta   Luchttemperatuur [°C]
 * @param tr   Gemiddelde stralingstemperatuur [°C]
 * @param va   Luchtsnelheid [m/s]
 * @param pa   Dampspanning [Pa]
 * @param M    Metabole belasting [W/m²]
 * @param W    Mechanisch werk [W/m²]
 * @param Icl  Kledinginsulatie [clo]
 * @param acclimatized  Geacclimatiseerd (S_Wmax hoger)
 */
export function computePHS(
  ta: number,
  tr: number,
  va: number,
  pa: number,
  M: number,
  W: number,
  Icl: number,
  acclimatized: boolean,
): {
  sWreq: number;        // Vereiste zweetsecretie [g/h]
  sWmax: number;        // Maximale zweetsecretie [g/h]
  dlimMin: number | null;
  verdict: 'acceptable' | 'limited' | 'danger';
} {
  const HL = M - W;

  // Warmteoverdrachtscoëfficiënten (ISO 7933 relaties)
  const hc = Math.max(3 * Math.pow(Math.max(va, 0.1), 0.5), 8.7 * Math.pow(Math.max(va, 0.1), 0.6));
  const hr = 4.7; // W/(m²K) benadering

  // Operatieve temperatuur
  const to = (hc * ta + hr * tr) / (hc + hr);

  // Sensibele warmteuitwisseling C + R
  const fclFactor = 1 + 0.31 * Icl;
  const CR = (35.0 - to) / (0.155 * Icl + 1 / (hc + hr) * fclFactor);

  // Vereiste verdampingskoeling
  const Ereq = Math.max(0, HL - CR);

  if (Ereq < 5) {
    // Geen noemenswaardig zwetennodig
    const sWmax = acclimatized ? 800 : 400;
    return { sWreq: 0, sWmax, dlimMin: null, verdict: 'acceptable' };
  }

  // Maximale verdampingscapaciteit van omgeving
  const eMax = Math.max(0, 16.7 * (hc / fclFactor) * (56 - pa / 100));

  // Vereiste zweetsecretie (ISO 7933:2023 vgl. benadering)
  // Conversie: 1 W/m² ≈ 1.47 g/(h·m²) — voor lichaam 1.8 m²
  const sWreq = Math.round((Ereq / 0.95) * 1.47 * 1.8);
  const sWmax = acclimatized ? 800 : 400;

  if (sWreq <= sWmax) {
    return { sWreq, sWmax, dlimMin: null, verdict: 'acceptable' };
  }

  // Schatting D_lim bij onvoldoende koelcapaciteit
  let dlimMin: number | null = null;
  if (eMax < Ereq) {
    // Warmteoverschot per m²
    const excessHeat = Ereq - eMax; // W/m²
    // Toegelaten kerntemperatuurstijging (ISO 7933: 38,5°C max)
    const deltaT = 1.0; // K
    const heatCapacity = 3640 * 70 / 1.8; // J/(K·m²) benadering voor 70 kg lichaam
    dlimMin = Math.max(15, Math.round((heatCapacity * deltaT) / (excessHeat * 60)));
  }

  const verdict = dlimMin !== null && dlimMin < 60 ? 'danger' : 'limited';
  return { sWreq, sWmax, dlimMin, verdict };
}

// ─── Lokaal thermisch comfort (ISO 7730:2025 §6) ─────────────────────────────

/**
 * Tochtbeoordeling — Draught Rate (DR) conform ISO 7730:2025 vergelijking (6).
 *
 * Geldig voor: ta 20–26°C, va 0,05–0,5 m/s, Tu 0–70%.
 *
 * @param ta  Luchttemperatuur [°C]
 * @param va  Lokale gemiddelde luchtsnelheid [m/s]
 * @param Tu  Turbulentie-intensiteit [%] (standaard 40% voor mechanische ventilatie)
 */
export function computeDR(ta: number, va: number, Tu: number): number {
  if (va <= 0.05) return 0;
  return (34 - ta) * Math.pow(va - 0.05, 0.62) * (0.37 * va * Tu + 3.14);
}

/** Tochtcategorie op basis van DR (ISO 7730:2025 Tabel 1) */
export function getDRCategory(dr: number): PMVCategory {
  if (dr <= 10) return 'A';
  if (dr <= 20) return 'B';
  if (dr <= 30) return 'C';
  return 'D';
}

// ─── Hoofd berekeningsfunctie ─────────────────────────────────────────────────

/**
 * Berekent alle statistieken voor het klimaatonderzoek.
 * Altijd vers berekenen (nooit gecachede statistieken gebruiken).
 */
export function computeAllClimateStatistics(
  inv: ClimateInvestigation,
): ClimateStatistics[] {
  return inv.bgs.map((bg) => computeBGStatistics(bg, inv));
}

function computeBGStatistics(
  bg: ClimateBG,
  inv: ClimateInvestigation,
): ClimateStatistics {
  const validMeasurements = inv.measurements.filter(
    (m) => m.bgId === bg.id && !m.excluded,
  );
  const n = validMeasurements.length;

  const stats: ClimateStatistics = { bgId: bg.id, n };

  if (n === 0) return stats;

  const M = getMetabolicRate(bg);

  // ── PMV/PPD ──────────────────────────────────────────────────────────────────
  const pmvValues: number[] = [];
  for (const m of validMeasurements) {
    // Bepaal t_r: handmatig ingevuld, of berekend uit globetemperatuur
    let tr = m.t_r;
    if (tr == null && m.t_g != null) {
      tr = computeMeanRadiantFromGlobe(m.t_g, m.t_a, m.v_ar);
    }
    if (tr == null) continue;

    const pa = m.RH != null ? computeVapourPressure(m.t_a, m.RH) : 1333; // Pa
    const pmv = computePMV(M, 0, bg.clothingInsulation, m.t_a, tr, m.v_ar, pa);
    pmvValues.push(pmv);
  }

  if (pmvValues.length > 0) {
    const avgPMV = pmvValues.reduce((a, b) => a + b, 0) / pmvValues.length;
    const category = getPMVCategory(avgPMV);
    stats.pmv = Math.round(avgPMV * 100) / 100;
    stats.ppd = Math.round(computePPD(avgPMV));
    stats.pmvCategory = category;
    stats.pmvCategoryLabel = PMV_CATEGORY_LABELS[category];
    stats.pmvColor = PMV_CATEGORY_COLORS[category];
    stats.pmvPerMeasurement = pmvValues.map((v) => Math.round(v * 100) / 100);
  }

  // ── WBGT ─────────────────────────────────────────────────────────────────────
  const wbgtValues: number[] = [];
  for (const m of validMeasurements) {
    if (m.t_nw != null && m.t_g != null) {
      const wbgt = computeWBGT(m.t_nw, m.t_g, m.t_a, m.solarLoad ?? false);
      wbgtValues.push(wbgt);
    }
  }

  if (wbgtValues.length > 0) {
    const avgWBGT = wbgtValues.reduce((a, b) => a + b, 0) / wbgtValues.length;
    const wbgtRef = computeWBGTRef(M, bg.acclimatized ?? false);
    stats.wbgt = Math.round(avgWBGT * 10) / 10;
    stats.wbgtRef = Math.round(wbgtRef * 10) / 10;

    // Standaard geen CAV-correctie in statberekening — CAV is scenario-specifiek
    stats.wbgtCAV = 0;
    stats.wbgtEff = stats.wbgt;

    const diff = avgWBGT - wbgtRef;
    if (diff <= -2) {
      stats.wbgtVerdict = 'acceptable';
      stats.wbgtVerdictLabel = 'Aanvaardbaar — WBGT onder referentiewaarde';
      stats.wbgtVerdictColor = 'emerald';
    } else if (diff <= 0) {
      stats.wbgtVerdict = 'caution';
      stats.wbgtVerdictLabel = 'Let op — WBGT nabij referentiewaarde';
      stats.wbgtVerdictColor = 'amber';
    } else {
      stats.wbgtVerdict = 'exceeds';
      stats.wbgtVerdictLabel = 'Referentiewaarde overschreden — PHS-analyse vereist';
      stats.wbgtVerdictColor = 'red';
    }
  }

  // ── PHS ──────────────────────────────────────────────────────────────────────
  if (wbgtValues.length > 0) {
    // Gebruik gemiddelde meetwaarden voor PHS
    const avgTA = avg(validMeasurements.map((m) => m.t_a));
    const avgTR = avg(validMeasurements.map((m) => {
      if (m.t_r != null) return m.t_r;
      if (m.t_g != null) return computeMeanRadiantFromGlobe(m.t_g, m.t_a, m.v_ar);
      return m.t_a; // fallback
    }));
    const avgVA = avg(validMeasurements.map((m) => m.v_ar));
    const avgRH = avg(validMeasurements.map((m) => m.RH));
    const avgPA = computeVapourPressure(avgTA, avgRH);

    const phs = computePHS(avgTA, avgTR, avgVA, avgPA, M, 0, bg.clothingInsulation, bg.acclimatized ?? false);
    stats.phsSWreq = phs.sWreq;
    stats.phsSWmax = phs.sWmax;
    stats.phsDlimMin = phs.dlimMin;
    stats.phsVerdict = phs.verdict;

    const PHS_LABELS = {
      acceptable: 'Aanvaardbaar — zweetsecretie binnen capaciteit',
      limited:    'Beperkte blootstelling — D_lim van toepassing',
      danger:     'Gevaarlijk — direct risico op hitteletsel',
    };
    const PHS_COLORS: Record<string, ClimateVerdictColor> = {
      acceptable: 'emerald', limited: 'orange', danger: 'red',
    };
    stats.phsVerdictLabel = PHS_LABELS[phs.verdict];
    stats.phsVerdictColor = PHS_COLORS[phs.verdict] as ClimateVerdictColor;
  }

  // ── IREQ ─────────────────────────────────────────────────────────────────────
  {
    const avgTA = avg(validMeasurements.map((m) => m.t_a));
    const avgTR = avg(validMeasurements.map((m) => {
      if (m.t_r != null) return m.t_r;
      if (m.t_g != null) return computeMeanRadiantFromGlobe(m.t_g, m.t_a, m.v_ar);
      return m.t_a;
    }));
    const avgVA = avg(validMeasurements.map((m) => m.v_ar));
    const avgRH = avg(validMeasurements.map((m) => m.RH));
    const avgPA = computeVapourPressure(avgTA, avgRH);

    const { ireqNeutral, ireqMin } = computeIREQ(avgTA, avgTR, avgVA, avgPA, M, 0);
    const ireqAvailable = bg.clothingInsulation;
    const dlim = computeIREQDlim(ireqMin, ireqNeutral, ireqAvailable, bg.workHoursPerDay);

    stats.ireqNeutral  = Math.round(ireqNeutral * 100) / 100;
    stats.ireqMin      = Math.round(ireqMin * 100) / 100;
    stats.ireqAvailable = ireqAvailable;
    stats.ireqDlimMin  = dlim;

    if (ireqAvailable >= ireqNeutral) {
      stats.ireqVerdict = 'comfortable';
      stats.ireqVerdictLabel = 'Comfortabel — kleding voldoende voor thermisch neutraal';
      stats.ireqVerdictColor = 'emerald';
    } else if (ireqAvailable >= ireqMin) {
      stats.ireqVerdict = 'cool';
      stats.ireqVerdictLabel = `Koelstress — kleding onvoldoende voor neutraliteit (D_lim ${dlim ?? '?'} min)`;
      stats.ireqVerdictColor = 'amber';
    } else {
      stats.ireqVerdict = 'danger';
      stats.ireqVerdictLabel = 'Gevaarlijk — kleding onvoldoende voor thermisch evenwicht';
      stats.ireqVerdictColor = 'red';
    }
  }

  // ── Lokaal comfort ─────────────────────────────────────────────────────────
  {
    const drValues: number[] = [];
    for (const m of validMeasurements) {
      if (m.v_ar != null && m.t_a != null) {
        const Tu = bg.turbulenceIntensity ?? 40; // 40% standaard voor mechanische ventilatie
        const dr = computeDR(m.t_a, m.v_ar, Tu);
        drValues.push(dr);
      }
    }
    if (drValues.length > 0) {
      const avgDR = avg(drValues);
      stats.dr = Math.round(avgDR);
      stats.drCategory = getDRCategory(avgDR);
    }

    // Verticaal temperatuurverschil (hoofd − enkel)
    const vtDiffs: number[] = [];
    for (const m of validMeasurements) {
      if (m.t_a_head != null && m.t_a_ankle != null) {
        vtDiffs.push(m.t_a_head - m.t_a_ankle);
      }
    }
    if (vtDiffs.length > 0) {
      const avgVT = avg(vtDiffs);
      stats.verticalTempDiff = Math.round(avgVT * 10) / 10;
      // ISO 7730 Tabel 1: Cat A < 2 K, B < 3 K, C < 4 K
      stats.verticalTempCategory =
        avgVT < 2 ? 'A' : avgVT < 3 ? 'B' : avgVT < 4 ? 'C' : 'D';
    }

    // Vloertemperatuur (ISO 7730 §6.4: 19–29°C voor zittend werk)
    const floorTemps: number[] = [];
    for (const m of validMeasurements) {
      if (m.t_floor != null) floorTemps.push(m.t_floor);
    }
    if (floorTemps.length > 0) {
      const avgFloor = avg(floorTemps);
      if (avgFloor < 19) {
        stats.floorTempVerdict = 'low';
        stats.floorTempCategory = 'D';
      } else if (avgFloor > 29) {
        stats.floorTempVerdict = 'high';
        stats.floorTempCategory = 'D';
      } else {
        stats.floorTempVerdict = 'ok';
        stats.floorTempCategory = avgFloor >= 22 && avgFloor <= 28 ? 'A' : 'B';
      }
    }
  }

  return stats;
}

function avg(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

// ─── Afgeleid ─────────────────────────────────────────────────────────────────

/** Geeft het PMV-kleurlabel terug (voor badges) */
export function pmvCategoryBadgeClass(cat: PMVCategory): string {
  const MAP: Record<PMVCategory, string> = {
    A: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    B: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    C: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    D: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };
  return MAP[cat] ?? MAP.D;
}

export function verdictBadgeClass(color: ClimateVerdictColor): string {
  const MAP: Record<ClimateVerdictColor, string> = {
    emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    amber:   'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    orange:  'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    red:     'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };
  return MAP[color] ?? MAP.red;
}
