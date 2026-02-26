'use client';

import type { SoundInvestigation, SoundStatistics, SoundActionLevel, SoundHEG } from '@/lib/sound-investigation-types';
import { averageOctaveBands, buildMergedBands, calcOctaveAPF } from '@/lib/sound-ppe';
import type { SoundMeasurement } from '@/lib/sound-investigation-types';
import { Abbr } from '@/components/Abbr';
import { Formula } from '@/components/Formula';
import { LegalRef } from '@/components/LegalRef';
import { InfoBox } from '@/components/InfoBox';

interface Props {
  investigation: SoundInvestigation;
  onUpdate: (partial: Partial<SoundInvestigation>) => void;
}

function fmt1(n: number): string {
  return isFinite(n) ? n.toFixed(1) : '—';
}

const LEVEL_COLORS = {
  'below-lav': {
    bar: 'bg-emerald-500',
    bg: 'bg-emerald-50 dark:bg-emerald-900/15',
    text: 'text-emerald-800 dark:text-emerald-300',
    badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  'lav': {
    bar: 'bg-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-900/15',
    text: 'text-amber-800 dark:text-amber-300',
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
  },
  'uav': {
    bar: 'bg-orange-500',
    bg: 'bg-orange-50 dark:bg-orange-900/15',
    text: 'text-orange-800 dark:text-orange-300',
    badge: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    border: 'border-orange-200 dark:border-orange-800',
  },
  'above-elv': {
    bar: 'bg-red-500',
    bg: 'bg-red-50 dark:bg-red-900/15',
    text: 'text-red-800 dark:text-red-300',
    badge: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    border: 'border-red-200 dark:border-red-800',
  },
};

interface Obligation { article: string; text: string }

const OBLIGATIONS: Record<SoundActionLevel, Obligation[]> = {
  'below-lav': [
    { article: 'Goede praktijk', text: 'Geen wettelijke verplichtingen. Zorg dat de situatie geen actiewaarde bereikt bij proceswijzigingen en verwerk resultaten in de RI&E.' },
  ],
  'lav': [
    { article: 'Art. 6.6 lid 1a', text: 'Maatregelenprogramma opstellen ter vermindering van de geluidblootstelling.' },
    { article: 'Art. 6.6 lid 1b', text: 'Gehoorbeschermers ter beschikking stellen op verzoek van de werknemer.' },
    { article: 'Arbowet art. 5',  text: 'Risicobeoordeling documenteren; meting herhalen bij wijzigingen.' },
    { article: 'Art. 6.7',        text: 'Gehooronderzoek (audiometrie) aanbieden op verzoek van de werknemer.' },
    { article: 'Art. 6.8',        text: 'Voorlichting en opleiding geven over de geluidrisico\'s en beschermende maatregelen.' },
    { article: 'Art. 6.10',       text: 'Gehooronderzoek (audiometrie) aanbieden indien de risicobeoordeling daartoe aanleiding geeft.' },
    { article: 'Art. 6.11',       text: 'Werknemers informeren over meetresultaten, maatregelen, actiewaarden en beschikbaarheid van gehooronderzoek.' },
  ],
  'uav': [
    { article: 'Art. 6.6 lid 1a', text: 'Maatregelenprogramma opstellen én daadwerkelijk uitvoeren.' },
    { article: 'Art. 6.6 lid 1b', text: 'Gehoorbeschermers beschikbaar stellen; gebruik is verplicht.' },
    { article: 'Art. 6.6 lid 1c', text: 'Geluidzone aanwijzen (signalering, afbakening, beperking van toegang voor derden).' },
    { article: 'Arbowet art. 5',  text: 'Risicobeoordeling documenteren; meting herhalen bij wijzigingen.' },
    { article: 'Art. 6.7',        text: 'Gehooronderzoek (audiometrie) aanbieden op verzoek van de werknemer.' },
    { article: 'Art. 6.8',        text: 'Voorlichting en opleiding (verplicht).' },
    { article: 'Art. 6.9',        text: 'Zorgen dat de gekozen gehoorbeschermers de blootstelling bij het oor terugbrengen tot onder de grenswaarde; instructie over gebruik en onderhoud.' },
    { article: 'Art. 6.10',       text: 'Periodiek preventief gehooronderzoek (audiometrie) verplicht aanbieden via bedrijfsarts.' },
    { article: 'Art. 6.11',       text: 'Werknemers informeren over meetresultaten, maatregelen, actiewaarden en beschikbaarheid van gehooronderzoek.' },
  ],
  'above-elv': [
    { article: 'Art. 6.6 lid 2', text: 'Onmiddellijk maatregelen nemen om blootstelling terug te brengen tot onder de grenswaarde.' },
    { article: 'Art. 6.6 lid 2', text: 'Oorzaak bepalen en gedocumenteerde corrigerende maatregelen treffen.' },
    { article: 'Art. 6.6 lid 2', text: 'Gebruik van gehoorbescherming is verplicht totdat grenswaarde niet langer wordt overschreden.' },
    { article: 'Art. 6.6 lid 1', text: 'Alle verplichtingen van de onderste en bovenste actiewaarde zijn tevens van kracht.' },
    { article: 'Art. 6.9',       text: 'Effectiviteit gehoorbescherming aantonen; instructie gebruik en onderhoud verplicht.' },
    { article: 'Art. 6.10',      text: 'Periodiek preventief gehooronderzoek (audiometrie) verplicht aanbieden via bedrijfsarts.' },
    { article: 'Art. 6.10a',     text: 'Indien audiometrie gehoorschade aantoont: risicobeoordeling herzien, werknemer persoonlijk informeren en blootstelling voortdurend bewaken.' },
    { article: 'Art. 6.11',      text: 'Werknemers informeren over meetresultaten, maatregelen, actiewaarden en beschikbaarheid van gehooronderzoek.' },
  ],
};

const PEAK_OBLIGATIONS: Record<SoundActionLevel, Obligation[]> = {
  'below-lav': [{ article: 'Goede praktijk', text: 'Piekgeluid onder onderste actiewaarde (< 135 dB(C)).' }],
  'lav': [
    { article: 'Art. 6.6 lid 1', text: 'Piekgeluid overschrijdt onderste actiewaarde (≥ 135 dB(C)). Maatregelenprogramma uitbreiden.' },
    { article: 'Art. 6.6 lid 1b', text: 'Gehoorbeschermers beschikbaar stellen die ook piekgeluiden dempen.' },
  ],
  'uav': [
    { article: 'Art. 6.6 lid 1', text: 'Piekgeluid overschrijdt bovenste actiewaarde (≥ 137 dB(C)). Maatregelenprogramma voor impulsgeluid uitvoeren.' },
    { article: 'Art. 6.6 lid 1b–c', text: 'Gehoorbescherming beschikbaar stellen, gebruik aanbevelen; overweeg zonering.' },
  ],
  'above-elv': [
    { article: 'Art. 6.6 lid 2', text: 'Piekgrenswaarde overschreden (≥ 140 dB(C)). Onmiddellijk maatregelen treffen.' },
    { article: 'Art. 6.6 lid 2', text: 'Gehoorbescherming is verplicht.' },
  ],
};

function ExposureBar({ lEx8h_95pct, lEx8h_oor }: { lEx8h_95pct: number; lEx8h_oor?: number }) {
  const minShown = lEx8h_oor !== undefined && isFinite(lEx8h_oor)
    ? Math.min(lEx8h_95pct, lEx8h_oor)
    : lEx8h_95pct;
  const MIN_DB = isFinite(minShown) && minShown < 70
    ? Math.ceil(minShown / 10) * 10 - 15
    : 60;
  const maxVal = Math.max(lEx8h_95pct, lEx8h_oor ?? 0);
  const MAX_DB = isFinite(maxVal) && maxVal > 87
    ? Math.floor(maxVal / 10) * 10 + 15
    : 95;
  const clamp = (v: number) => Math.max(0, Math.min(100, ((v - MIN_DB) / (MAX_DB - MIN_DB)) * 100));

  const pct    = clamp(lEx8h_95pct);
  const oorPct = lEx8h_oor !== undefined && isFinite(lEx8h_oor) ? clamp(lEx8h_oor) : null;
  const lav = clamp(80);
  const uav = clamp(85);
  const elv = clamp(87);

  const oorSafe = lEx8h_oor !== undefined && lEx8h_oor < 87;

  return (
    <div className="mt-3">
      {/* Top labels: main value row 1, APF-corrected row 2 */}
      <div className={`relative mb-1 text-[10px] ${oorPct !== null ? 'h-8' : 'h-4'}`}>
        <span
          className="absolute top-0 -translate-x-1/2 font-semibold text-zinc-700 dark:text-zinc-200"
          style={{ left: `${pct}%` }}
        >
          {isFinite(lEx8h_95pct) ? lEx8h_95pct.toFixed(1) : '—'} dB(A)
        </span>
        {oorPct !== null && lEx8h_oor !== undefined && (
          <span
            className={`absolute top-4 -translate-x-1/2 font-semibold ${
              oorSafe ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'
            }`}
            style={{ left: `${oorPct}%` }}
          >
            {lEx8h_oor.toFixed(1)} dB(A) (met <Abbr id="PBM">PBM</Abbr>)
          </span>
        )}
      </div>

      <div className="relative h-3 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
        <div className="absolute inset-y-0 left-0 bg-emerald-200 dark:bg-emerald-900/40" style={{ width: `${lav}%` }} />
        <div className="absolute inset-y-0 bg-amber-200 dark:bg-amber-900/40" style={{ left: `${lav}%`, width: `${uav - lav}%` }} />
        <div className="absolute inset-y-0 bg-orange-200 dark:bg-orange-900/40" style={{ left: `${uav}%`, width: `${elv - uav}%` }} />
        <div className="absolute inset-y-0 bg-red-200 dark:bg-red-900/40" style={{ left: `${elv}%`, right: 0 }} />
        {[lav, uav, elv].map((p, i) => (
          <div key={i} className="absolute inset-y-0 w-px bg-zinc-400/60 dark:bg-zinc-500" style={{ left: `${p}%` }} />
        ))}
        {/* APF-corrected marker (drawn first so main marker renders on top) */}
        {oorPct !== null && (
          <div
            className={`absolute top-1/2 h-5 w-1.5 -translate-y-1/2 rounded-sm shadow ring-2 ring-white transition-all dark:ring-zinc-900 ${
              oorSafe ? 'bg-emerald-500' : 'bg-red-500'
            }`}
            style={{ left: `calc(${oorPct}% - 3px)` }}
          />
        )}
        {/* Main (unprotected) marker */}
        <div
          className="absolute top-1/2 h-5 w-1.5 -translate-y-1/2 rounded-sm bg-zinc-900 shadow ring-2 ring-white transition-all dark:bg-white dark:ring-zinc-900"
          style={{ left: `calc(${pct}% - 3px)` }}
        />
      </div>

      {/* Two-row stagger: LAV + GW on row 1, UAV on row 2 to avoid overlap */}
      <div className="relative mt-1 h-8 text-[10px] text-zinc-400">
        <span style={{ left: `${lav}%` }} className="absolute top-0 -translate-x-1/2">80 (<Abbr id="LAV">LAV</Abbr>)</span>
        <span style={{ left: `${uav}%` }} className="absolute top-3.5 -translate-x-1/2">85 (<Abbr id="UAV">UAV</Abbr>)</span>
        <span style={{ left: `${elv}%` }} className="absolute top-0 -translate-x-1/2">87 (<Abbr id="GW">GW</Abbr>)</span>
        <span className="absolute right-0 top-0">dB(A)</span>
      </div>
    </div>
  );
}

function PeakExposureBar({ lCpeak, lCpeak_oor }: { lCpeak: number; lCpeak_oor?: number }) {
  const minShown = lCpeak_oor !== undefined && isFinite(lCpeak_oor)
    ? Math.min(lCpeak, lCpeak_oor)
    : lCpeak;
  const MIN_DB = isFinite(minShown) && minShown < 130
    ? Math.ceil(minShown / 10) * 10 - 15
    : 120;
  const maxVal = Math.max(lCpeak, lCpeak_oor ?? 0);
  const MAX_DB = isFinite(maxVal) && maxVal > 140
    ? Math.floor(maxVal / 10) * 10 + 10
    : 145;
  const clamp = (v: number) => Math.max(0, Math.min(100, ((v - MIN_DB) / (MAX_DB - MIN_DB)) * 100));

  const pct    = clamp(lCpeak);
  const oorPct = lCpeak_oor !== undefined && isFinite(lCpeak_oor) ? clamp(lCpeak_oor) : null;
  const plav = clamp(135);
  const puav = clamp(137);
  const pgw  = clamp(140);

  const oorSafe = lCpeak_oor !== undefined && lCpeak_oor < 140;

  return (
    <div className="mt-3">
      <div className={`relative mb-1 text-[10px] ${oorPct !== null ? 'h-8' : 'h-4'}`}>
        <span
          className="absolute top-0 -translate-x-1/2 font-semibold text-zinc-700 dark:text-zinc-200"
          style={{ left: `${pct}%` }}
        >
          {isFinite(lCpeak) ? lCpeak.toFixed(1) : '—'} dB(C)
        </span>
        {oorPct !== null && lCpeak_oor !== undefined && (
          <span
            className={`absolute top-4 -translate-x-1/2 font-semibold ${
              oorSafe ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'
            }`}
            style={{ left: `${oorPct}%` }}
          >
            {lCpeak_oor.toFixed(1)} dB(C) (met <Abbr id="PBM">PBM</Abbr>)
          </span>
        )}
      </div>

      <div className="relative h-3 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
        <div className="absolute inset-y-0 left-0 bg-emerald-200 dark:bg-emerald-900/40" style={{ width: `${plav}%` }} />
        <div className="absolute inset-y-0 bg-amber-200 dark:bg-amber-900/40" style={{ left: `${plav}%`, width: `${puav - plav}%` }} />
        <div className="absolute inset-y-0 bg-orange-200 dark:bg-orange-900/40" style={{ left: `${puav}%`, width: `${pgw - puav}%` }} />
        <div className="absolute inset-y-0 bg-red-200 dark:bg-red-900/40" style={{ left: `${pgw}%`, right: 0 }} />
        {[plav, puav, pgw].map((p, i) => (
          <div key={i} className="absolute inset-y-0 w-px bg-zinc-400/60 dark:bg-zinc-500" style={{ left: `${p}%` }} />
        ))}
        {/* APF-corrected marker */}
        {oorPct !== null && (
          <div
            className={`absolute top-1/2 h-5 w-1.5 -translate-y-1/2 rounded-sm shadow ring-2 ring-white transition-all dark:ring-zinc-900 ${
              oorSafe ? 'bg-emerald-500' : 'bg-red-500'
            }`}
            style={{ left: `calc(${oorPct}% - 3px)` }}
          />
        )}
        {/* Main marker */}
        <div
          className="absolute top-1/2 h-5 w-1.5 -translate-y-1/2 rounded-sm bg-zinc-900 shadow ring-2 ring-white transition-all dark:bg-white dark:ring-zinc-900"
          style={{ left: `calc(${pct}% - 3px)` }}
        />
      </div>

      {/* Two-row stagger: LAV + GW on row 1, UAV on row 2 to avoid overlap */}
      <div className="relative mt-1 h-8 text-[10px] text-zinc-400">
        <span style={{ left: `${plav}%` }} className="absolute top-0 -translate-x-1/2">135 (p-<Abbr id="LAV">LAV</Abbr>)</span>
        <span style={{ left: `${puav}%` }} className="absolute top-3.5 -translate-x-1/2">137 (p-<Abbr id="UAV">UAV</Abbr>)</span>
        <span style={{ left: `${pgw}%` }} className="absolute top-0 -translate-x-1/2">140 (p-<Abbr id="GW">GW</Abbr>)</span>
        <span className="absolute right-0 top-0">dB(C)</span>
      </div>
    </div>
  );
}

/** Read-only PPE summary — input is now in Step 6 (Arbeidsmiddelen) */
function PPEReadOnlySummary({
  heg,
  stat,
}: {
  heg: SoundHEG;
  stat: SoundStatistics;
}) {
  const hasPPE = heg.ppeMethod != null || heg.ppeSNRUnknown || (heg.ppeAttenuation ?? 0) > 0;
  const combinedAPF = stat.lEx8h_95pct_oor != null
    ? stat.lEx8h_95pct - stat.lEx8h_95pct_oor
    : null;
  const methodLabel: Record<string, string> = {
    'single':        'enkelvoudig',
    'double-snr':    'dubbel — SNR',
    'double-hml':    'dubbel — HML',
    'double-octave': 'dubbel — octaafband',
  };

  function DeviceRow({ label, apf, snr, snrUnknown }: {
    label: string;
    apf?: number;
    snr?: number;
    snrUnknown?: boolean;
  }) {
    return (
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className="font-medium text-zinc-700 dark:text-zinc-300">{label}:</span>
        {snrUnknown ? (
          <span className="text-amber-600 dark:text-amber-400">SNR onbekend — datablad niet beschikbaar</span>
        ) : apf != null ? (
          <span className="font-mono text-blue-700 dark:text-blue-300">
            <Abbr id="APF">APF</Abbr> = {apf.toFixed(1)} dB
            {snr != null && <span className="ml-1 text-zinc-400 dark:text-zinc-500">(SNR {snr} dB)</span>}
          </span>
        ) : (
          <span className="text-zinc-400 dark:text-zinc-500">bescherming nog niet berekend</span>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800/50 dark:bg-blue-900/10">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">
          <Abbr id="PBM">PBM</Abbr> — gehoorbescherming
        </p>
        <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
          Invoer/wijzigen → Stap 6 (Arbeidsmiddelen)
        </span>
      </div>

      {!hasPPE ? (
        <div className="rounded-lg border border-blue-100 bg-blue-50/60 px-3 py-2.5 dark:border-blue-800/30 dark:bg-blue-900/10">
          <p className="text-xs text-blue-700 dark:text-blue-400">
            Nog geen gehoorbescherming ingevoerd voor deze <Abbr id="HEG">HEG</Abbr>.
            De grenswaarde-toetsing met <Abbr id="PBM">PBM</Abbr> (<Formula math="L_{EX,8h,oor}" />) kan daardoor niet worden uitgevoerd.{' '}
            <strong>Voer gehoorbescherming in via Stap 6 — Arbeidsmiddelen.</strong>
          </p>
        </div>
      ) : (
        <div className="space-y-1.5 text-xs">
          {/* Device 1 */}
          <DeviceRow
            label={heg.ppeNotes || 'Gehoorbescherming 1'}
            apf={heg.ppeAttenuation ?? undefined}
            snr={heg.ppeSNR ?? undefined}
            snrUnknown={heg.ppeSNRUnknown}
          />

          {/* Device 2 (only when double protection) */}
          {heg.ppeDouble && (
            <DeviceRow
              label={heg.ppe2Notes || 'Gehoorbescherming 2'}
              apf={heg.ppe2Attenuation ?? undefined}
              snr={heg.ppe2SNR ?? undefined}
              snrUnknown={heg.ppe2SNRUnknown}
            />
          )}

          {/* Combined result (only when double) */}
          {heg.ppeDouble && combinedAPF != null && (
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 border-t border-blue-100 pt-1.5 dark:border-blue-800/40">
              <span className="font-medium text-zinc-700 dark:text-zinc-300">Gecombineerd:</span>
              <span className="font-mono text-blue-700 dark:text-blue-300">
                <Abbr id="APF">APF</Abbr> = {combinedAPF.toFixed(1)} dB
              </span>
              <span className="text-zinc-400 dark:text-zinc-500">
                ({methodLabel[stat.ppeCombinedMethod ?? 'single']})
              </span>
              {stat.ppeCapped && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                  35 dB-cap toegepast
                </span>
              )}
            </div>
          )}

          {/* L_EX,8h,oor verdict */}
          {stat.lEx8h_95pct_oor != null && (
            <p className={`pt-0.5 font-semibold ${stat.elvPpeCompliant ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
              <Formula math="L_{EX,8h,oor}" /> = {stat.lEx8h_95pct_oor.toFixed(1)} dB(A)
              {' '}— {stat.elvPpeCompliant ? '✓ onder grenswaarde' : '✗ grenswaarde overschreden'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Returns true only when the stored ppeAttenuation is backed by actual
 * frequency-specific data that supports the calculation:
 * - HML: all three values (H, M, L) present + spectral character chosen
 * - Octave: the octave-band calculation must actually produce a result
 *   (≥ 3 bands fully filled: Lp,i + m + s)
 *
 * Method 1 (SNR/2) and manual entry are excluded — they don't use
 * frequency data so cannot support a frequency-based APF claim.
 */
function isAPFFrequencyBased(heg: SoundHEG, avgLp: number[] | null): boolean {
  if (!heg.ppeAttenuation || heg.ppeAttenuation <= 0) return false;
  if (heg.ppeSNRUnknown) return false;

  switch (heg.ppeMethod ?? 'snr') {
    case 'hml': {
      const hasAllValues = heg.ppeH != null && heg.ppeM != null && heg.ppeL != null;
      const hasChar      = heg.ppeSpectralChar != null;
      return hasAllValues && hasChar;
    }
    case 'octave': {
      const merged = buildMergedBands(heg.ppeOctaveBands, avgLp);
      return calcOctaveAPF(merged) !== null;
    }
    default:
      return false;
  }
}


// NPR 3438:2007 Tabel 4 — concentratiekwalificaties (exact conform de norm)
const NPR_THRESHOLDS_UI: Record<string, { kwalificatie: string; voorbeelden: string; streef: number; max: number }> = {
  'hoog':      { kwalificatie: 'Hoog',      streef: 35, max: 45, voorbeelden: 'Chirurgisch werk, Beleidswerk, Procesregeling, Confereren/vergaderen, Ontwerpen, Lesgeven, Apothekerswerk, Studeren' },
  'redelijk':  { kwalificatie: 'Redelijk',  streef: 45, max: 55, voorbeelden: 'Beeldschermwerk, Laboratoriumwerk, Systeemontwerpen' },
  'matig':     { kwalificatie: 'Matig',     streef: 55, max: 65, voorbeelden: 'Stuurmanwerk, Garagewerk, Verkopen, Cameratoezicht, Magazijnwerk, Receptiewerk, Fijn mechanisch werk' },
  'laag':      { kwalificatie: 'Laag',      streef: 65, max: 75, voorbeelden: 'Schoonmaakwerk, Gegevensverwerking, Kassawerk, Assemblagewerk' },
  'zeer-laag': { kwalificatie: 'Zeer laag', streef: 75, max: 80, voorbeelden: 'Lopende-bandwerk, Grof mechanisch werk' },
};

function TinnitusSection({ heg }: { heg: SoundHEG }) {
  if (!heg.tinnitusReported) return null;

  return (
    <div className="py-4">
      <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 dark:border-purple-800/50 dark:bg-purple-900/10">
        <p className="mb-2 text-sm font-semibold text-purple-800 dark:text-purple-300">
          ⚕ Tinnitus / gehoorklachten gemeld
        </p>
        <div className="space-y-2 text-xs text-purple-700 dark:text-purple-300">
          <p>
            Werknemers in deze HEG hebben tinnitus of gehoorklachten gemeld.
            Conform de <LegalRef id="RL SHT 2020">Richtlijn Slechthorendheid en Tinnitus 2020</LegalRef> zijn aanvullende stappen vereist:
          </p>
          <ul className="space-y-1 pl-2">
            <li>• Audiometrisch onderzoek laten uitvoeren door bedrijfsarts — ongeacht het blootstellingsniveau (<LegalRef id="Art. 6.10">art. 6.10</LegalRef>)</li>
            <li>• Tinnitus Handicap Inventory (THI) afnemen voor ernstgradering</li>
            <li>• Bij THI ≥ graad 3 (score ≥ 38) of gehoorverlies &gt; 35 dB: verwijzing naar audiologisch centrum</li>
            <li>• Bij gehoorschade: risicobeoordeling herzien en werknemer persoonlijk informeren (<LegalRef id="Art. 6.10a">art. 6.10a</LegalRef>)</li>
            <li>• Bij vermoede beroepsziekte: melden bij NCvB (B001 — Lawaaislechthorendheid)</li>
          </ul>
          <div className="mt-2 rounded bg-purple-100 px-2 py-1.5 dark:bg-purple-900/30">
            <p className="font-medium">THI-gradering (Tinnitus Handicap Inventory):</p>
            <p className="mt-0.5">
              Graad 1 licht (0–16) · Graad 2 mild (18–36) · Graad 3 matig (38–56) · Graad 4 ernstig (58–76) · Graad 5 catastrofaal (78–100)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── H-5: Audiometry section per HEG ──────────────────────────────────────────

function AudiometrySection({
  heg,
  verdict,
  onUpdateHEG,
}: {
  heg: SoundHEG;
  verdict: SoundActionLevel;
  onUpdateHEG: (updated: SoundHEG) => void;
}) {
  if (verdict === 'below-lav') return null;

  const isUAVOrAbove = verdict === 'uav' || verdict === 'above-elv';

  function upd(partial: Partial<SoundHEG>) {
    onUpdateHEG({ ...heg, ...partial });
  }

  const STATUS_OPTIONS = [
    { value: 'conducted',     label: 'Uitgevoerd' },
    { value: 'offered',       label: 'Aangeboden aan werknemer(s)' },
    { value: 'pending',       label: 'Gepland / openstaand' },
    { value: 'not-conducted', label: 'Niet uitgevoerd' },
    { value: 'not-required',  label: 'Niet (meer) vereist' },
  ] as const;

  return (
    <div className="py-4">
      <div className="space-y-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/30">
        {/* Header inside the panel — matches PPESection layout */}
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Audiometrie — Arbobesluit{' '}
            {isUAVOrAbove
              ? <><abbr title="Art. 6.10: Periodiek preventief gehooronderzoek verplicht bij UAV" className="cursor-help underline decoration-dotted decoration-zinc-400 underline-offset-2">art. 6.10</abbr> (verplicht periodiek)</>
              : <><abbr title="Art. 6.7/6.10: Gehooronderzoek aanbieden bij LAV" className="cursor-help underline decoration-dotted decoration-zinc-400 underline-offset-2">art. 6.7 / 6.10</abbr> (aanbieden)</>}
          </p>
          <span className="shrink-0 rounded bg-zinc-200 px-1.5 py-0.5 text-[10px] text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400"
                title="Art. 6.10 Arbobesluit koppelt de verplichting aan de blootstelling per werknemersgroep (HEG)">
            per HEG (art. 6.10)
          </span>
        </div>
        {isUAVOrAbove && (
          <div className="rounded-lg bg-orange-50 px-3 py-2 text-xs text-orange-700 dark:bg-orange-900/15 dark:text-orange-400">
            <strong>Verplicht:</strong> Periodiek preventief gehooronderzoek aanbieden via bedrijfsarts
            (Arbobesluit art. 6.10 lid 1). Bij vastgestelde gehoorschade: risicobeoordeling herzien en
            werknemer persoonlijk informeren (art. 6.10a).
          </div>
        )}

        {/* Status select */}
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Status gehooronderzoek
          </label>
          <select
            value={heg.audiometryStatus ?? ''}
            onChange={(e) => upd({ audiometryStatus: (e.target.value || undefined) as SoundHEG['audiometryStatus'] })}
            className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          >
            <option value="">— selecteer —</option>
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Not conducted: warning + notes only */}
        {heg.audiometryStatus === 'not-conducted' && (
          <>
            <div className={`rounded-lg px-3 py-2 text-xs ${
              isUAVOrAbove
                ? 'bg-red-50 text-red-700 dark:bg-red-900/15 dark:text-red-400'
                : 'bg-amber-50 text-amber-700 dark:bg-amber-900/15 dark:text-amber-400'
            }`}>
              {isUAVOrAbove
                ? <><strong>Actie vereist:</strong> Gehooronderzoek is nog niet uitgevoerd. Bij de bovenste actiewaarde is periodiek preventief gehooronderzoek verplicht (art. 6.10 lid 1).</>
                : <><strong>Aanbevolen:</strong> Gehooronderzoek is nog niet uitgevoerd. Overweeg om gehooronderzoek aan te bieden (art. 6.10).</>}
              {' '}Voeg dit toe als maatregel in stap 10.
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Opmerkingen
              </label>
              <textarea
                rows={2}
                value={heg.audiometryFindings ?? ''}
                onChange={(e) => upd({ audiometryFindings: e.target.value || undefined })}
                placeholder="Bijv. Nog niet ingepland. Verantwoordelijke: HR-afdeling."
                className="w-full resize-none rounded-lg border border-zinc-200 px-3 py-1.5 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
          </>
        )}

        {/* Not required: notes only (no scheduling fields needed) */}
        {heg.audiometryStatus === 'not-required' && (
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Opmerkingen
            </label>
            <textarea
              rows={2}
              value={heg.audiometryFindings ?? ''}
              onChange={(e) => upd({ audiometryFindings: e.target.value || undefined })}
              placeholder="Bijv. Blootstelling onder LAV; audiometrie niet vereist op basis van RI&E."
              className="w-full resize-none rounded-lg border border-zinc-200 px-3 py-1.5 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
        )}

        {/* Active statuses: full detail fields */}
        {(heg.audiometryStatus === 'conducted' || heg.audiometryStatus === 'offered' || heg.audiometryStatus === 'pending') && (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Datum aanbieding / uitvoering
                </label>
                <input
                  type="date"
                  value={heg.audiometryDate ?? ''}
                  onChange={(e) => upd({ audiometryDate: e.target.value || undefined })}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              {isUAVOrAbove && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Deelnamepercentage (%) —{' '}
                    <abbr title="Arbobesluit art. 6.10: documenteer deelnamepercentage periodiek onderzoek" className="cursor-help underline decoration-dotted decoration-zinc-400 underline-offset-2">art. 6.10</abbr>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number" min={0} max={100} step={1}
                      value={heg.audiometryParticipationPct ?? ''}
                      onChange={(e) => upd({ audiometryParticipationPct: parseFloat(e.target.value) || undefined })}
                      placeholder="—"
                      className="w-24 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                    />
                    <span className="text-sm text-zinc-500">%</span>
                  </div>
                </div>
              )}

              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Volgende oproep
                </label>
                <input
                  type="date"
                  value={heg.audiometryNextDate ?? ''}
                  onChange={(e) => upd({ audiometryNextDate: e.target.value || undefined })}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Bevindingen / conclusie
              </label>
              <textarea
                rows={2}
                value={heg.audiometryFindings ?? ''}
                onChange={(e) => upd({ audiometryFindings: e.target.value || undefined })}
                placeholder="Bijv. Geen gehoorverlies vastgesteld. Volgende oproep over 2 jaar."
                className="w-full resize-none rounded-lg border border-zinc-200 px-3 py-1.5 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── HEGAssessment ─────────────────────────────────────────────────────────────

function HEGAssessment({
  stat,
  heg,
  measurements,
  onUpdateHEG,
  index,
  total,
}: {
  stat: SoundStatistics;
  heg: SoundHEG;
  measurements: SoundMeasurement[];
  onUpdateHEG: (updated: SoundHEG) => void;
  index: number;
  total: number;
}) {
  const c = LEVEL_COLORS[stat.verdict];
  const obligations = OBLIGATIONS[stat.verdict];
  const hasPeak = stat.lCpeak !== undefined && stat.peakVerdict !== undefined;
  const peakColors = hasPeak ? LEVEL_COLORS[stat.peakVerdict!] : null;
  const peakObs = hasPeak ? PEAK_OBLIGATIONS[stat.peakVerdict!] : null;

  // APF-corrected values for exposure bars.
  // L_EX,8h,oor: taken from stat (includes combined dual-PPE attenuation computed in Step 9).
  // L_p,Cpeak,oor: requires frequency-specific data (HML or octave) because
  // peak assessment depends on spectral composition of the noise.
  const ppeMethod    = heg.ppeMethod ?? 'snr';
  const avgLpForHEG  = averageOctaveBands(measurements);
  const apfFreqBased = isAPFFrequencyBased(heg, avgLpForHEG);
  const attenuation  = heg.ppeSNRUnknown ? 0 : (heg.ppeAttenuation ?? 0);
  // Use pre-computed stat value (includes combined dual-PPE logic from sound-stats.ts)
  const lEx8h_oor    = stat.lEx8h_95pct_oor;
  const lCpeak_oor   = apfFreqBased && attenuation > 0 && stat.lCpeak !== undefined
    ? stat.lCpeak - attenuation
    : undefined;

  // Show peak-frequency caveat when PPE is configured but no frequency-based
  // APF is available (method 1, manual, or incomplete method 2/3 data).
  const showPeakFreqNote = hasPeak && attenuation > 0 && !apfFreqBased;

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700">
      {/* ── Neutral HEG name header ── */}
      <div className="border-b border-zinc-200 bg-zinc-50 px-5 py-3 dark:border-zinc-800 dark:bg-zinc-800/50">
        <div className="flex items-center gap-2">
          {total > 1 && (
            <span className="shrink-0 font-mono text-xs font-semibold text-zinc-400 dark:text-zinc-500">
              <Abbr id="HEG">HEG</Abbr> {index}/{total}
            </span>
          )}
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{heg.name}</p>
        </div>
      </div>

      <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {/* ── Dagblootstelling ── */}
        <div>
          {/* Coloured sub-header: title left, badge right */}
          <div className={`${c.bg} flex items-start justify-between gap-3 px-5 py-3`}>
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wide ${c.text}`}>
                Dagblootstelling
              </p>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                <Formula math="L_{EX,8h}" /> = {fmt1(stat.lEx8h)} dB(A) · U = {stat.U.toFixed(1)} dB ·{' '}
                <strong><Formula math="L_{EX,8h,95\%}" /> = {fmt1(stat.lEx8h_95pct)} dB(A)</strong>
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${c.badge}`}>
                {stat.verdictLabel}
              </span>
              {stat.elvPpeCompliant !== undefined && (
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                  stat.elvPpeCompliant
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                }`}>
                  GW mét <Abbr id="PBM">PBM</Abbr>: {stat.elvPpeCompliant ? '✓ voldoet' : '✗ overschreden'}
                </span>
              )}
            </div>
          </div>
          {/* Chart + obligations */}
          <div className="px-5 pt-3 pb-4">
            <ExposureBar lEx8h_95pct={stat.lEx8h_95pct} lEx8h_oor={lEx8h_oor} />
            <p className="mt-4 mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Wettelijke verplichtingen (Arbobesluit art. 6.6–6.8)
            </p>
            <table className="w-full text-xs">
              <tbody>
                {obligations.map((ob, i) => (
                  <tr key={i} className="align-top">
                    <td className="w-px whitespace-nowrap py-1 pr-3">
                      <LegalRef id={ob.article} />
                    </td>
                    <td className="py-1 text-zinc-700 dark:text-zinc-300">{ob.text}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Piekgeluid ── */}
        {hasPeak && peakColors && peakObs && (
          <div>
            {/* Coloured sub-header: title left, badge right */}
            <div className={`${peakColors.bg} flex items-start justify-between gap-3 px-5 py-3`}>
              <div>
                <p className={`text-xs font-semibold uppercase tracking-wide ${peakColors.text}`}>
                  Piekgeluid
                </p>
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                  <Formula math="L_{p,Cpeak}" /> = {fmt1(stat.lCpeak!)} dB(C)
                </p>
              </div>
              <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${peakColors.badge}`}>
                {stat.peakVerdictLabel}
              </span>
            </div>
            {/* Chart + obligations */}
            <div className="px-5 pt-3 pb-4">
              <PeakExposureBar lCpeak={stat.lCpeak!} lCpeak_oor={lCpeak_oor} />
              {showPeakFreqNote && (
                <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
                  <strong className="text-zinc-500 dark:text-zinc-400">Let op:</strong>{' '}
                  het beoordelen van de invloed van gehoorbescherming op piekgeluid (<Formula math="L_{p,Cpeak,oor}" />) is niet volledig
                  mogelijk zonder kennis van de frequentiesamenstelling en de afzonderlijke frequenties van het gemeten piekgeluid.{' '}
                  {ppeMethod === 'hml'
                    ? 'Vul alle HML-waarden en het spectraal karakter volledig in.'
                    : ppeMethod === 'octave'
                    ? 'Vul minimaal 3 octaafbanden volledig in (Lp,i · m · s) voor een geldig resultaat.'
                    : 'Gebruik methode 2 (HML) of methode 3 (octaafband) voor een nauwkeuriger beoordeling.'}
                </p>
              )}
              <table className="mt-4 w-full text-xs">
                <tbody>
                  {peakObs.map((ob, i) => (
                    <tr key={i} className="align-top">
                      <td className="w-px whitespace-nowrap py-1 pr-3">
                        <LegalRef id={ob.article} />
                      </td>
                      <td className="py-1 text-zinc-700 dark:text-zinc-300">{ob.text}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PPE summary (input is in Step 6 — Arbeidsmiddelen) */}
        <div className="py-4">
          <PPEReadOnlySummary heg={heg} stat={stat} />
        </div>

        {/* Tinnitus / hearing complaints */}
        <TinnitusSection heg={heg} />

        {/* H-5: Audiometry documentation */}
        <AudiometrySection heg={heg} verdict={stat.verdict} onUpdateHEG={onUpdateHEG} />

        {/* NPR 3438 — concentratie en communicatie (Tabel 4) */}
        <div className="px-5 py-4">
          <div className="mb-3 flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                <Abbr id="NPR3438">NPR 3438:2007</Abbr> — Concentratie en communicatie
              </p>
              <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">
                Tabel 4 — niet-wettelijk, aanbevolen praktijk. Vink de kwalificatie aan die past bij de werkzaamheden van deze <Abbr id="HEG">HEG</Abbr>.
              </p>
            </div>
            {heg.nprActivity && (
              <button
                type="button"
                onClick={() => onUpdateHEG({ ...heg, nprActivity: undefined })}
                className="shrink-0 text-xs text-zinc-400 underline hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                Wis selectie
              </button>
            )}
          </div>

          <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/60">
                  <th className="w-8 py-2 pl-3" />
                  <th className="px-3 py-2 text-left font-semibold text-zinc-600 dark:text-zinc-400">Kwalificatie</th>
                  <th className="px-3 py-2 text-left font-semibold text-zinc-600 dark:text-zinc-400">Werkzaamheden (Tabel 4)</th>
                  <th className="px-3 py-2 text-right font-semibold text-zinc-600 dark:text-zinc-400 whitespace-nowrap">Streef dB(A)</th>
                  <th className="px-3 py-2 text-right font-semibold text-zinc-600 dark:text-zinc-400 whitespace-nowrap">Max dB(A)</th>
                  <th className="px-3 py-2 text-center font-semibold text-zinc-600 dark:text-zinc-400">Oordeel</th>
                </tr>
              </thead>
              <tbody>
                {(Object.entries(NPR_THRESHOLDS_UI) as [SoundHEG['nprActivity'] & string, typeof NPR_THRESHOLDS_UI[string]][]).map(([key, thr], idx, arr) => {
                  const isSelected = heg.nprActivity === key;
                  const lEx = stat.lEx8h;
                  const aboveMax   = lEx > thr.max;
                  const aboveSteef = !aboveMax && lEx > thr.streef;
                  const verdictTxt = aboveMax
                    ? '✗ Boven max'
                    : aboveSteef
                    ? '~ Boven streef'
                    : '✓ Onder streef';
                  const verdictCls = aboveMax
                    ? 'text-red-700 dark:text-red-400 font-semibold'
                    : aboveSteef
                    ? 'text-amber-700 dark:text-amber-400 font-semibold'
                    : 'text-emerald-700 dark:text-emerald-400 font-semibold';
                  const rowBg = isSelected
                    ? 'bg-orange-50 dark:bg-orange-900/15'
                    : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/40';
                  const isLast = idx === arr.length - 1;
                  return (
                    <tr
                      key={key}
                      onClick={() => onUpdateHEG({ ...heg, nprActivity: isSelected ? undefined : key as SoundHEG['nprActivity'] })}
                      className={`cursor-pointer transition-colors ${rowBg} ${!isLast ? 'border-b border-zinc-100 dark:border-zinc-800' : ''}`}
                    >
                      <td className="py-2.5 pl-3 pr-1">
                        <div className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                          isSelected
                            ? 'border-orange-500 bg-orange-500'
                            : 'border-zinc-300 dark:border-zinc-600'
                        }`}>
                          {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                        </div>
                      </td>
                      <td className={`px-3 py-2.5 font-semibold whitespace-nowrap ${isSelected ? 'text-orange-700 dark:text-orange-300' : 'text-zinc-800 dark:text-zinc-200'}`}>
                        {thr.kwalificatie}
                      </td>
                      <td className="px-3 py-2.5 text-zinc-500 dark:text-zinc-400 leading-relaxed">
                        {thr.voorbeelden}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                        {thr.streef}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                        {thr.max}
                      </td>
                      <td className={`px-3 py-2.5 text-center whitespace-nowrap ${verdictCls}`}>
                        {verdictTxt}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {heg.nprActivity && (() => {
            const thr = NPR_THRESHOLDS_UI[heg.nprActivity];
            const lEx = stat.lEx8h;
            const aboveMax   = lEx > thr.max;
            const aboveSteef = !aboveMax && lEx > thr.streef;
            const colorCls = aboveMax
              ? 'border-red-200 bg-red-50 dark:border-red-800/50 dark:bg-red-900/10'
              : aboveSteef
              ? 'border-amber-200 bg-amber-50 dark:border-amber-800/50 dark:bg-amber-900/10'
              : 'border-emerald-200 bg-emerald-50 dark:border-emerald-800/50 dark:bg-emerald-900/10';
            const verdictCls = aboveMax
              ? 'text-red-700 dark:text-red-400'
              : aboveSteef
              ? 'text-amber-700 dark:text-amber-400'
              : 'text-emerald-700 dark:text-emerald-400';
            const verdictTxt = aboveMax
              ? '✗ Boven maximaal toelaatbare waarde'
              : aboveSteef
              ? '~ Boven streefwaarde, maar binnen maximaal toelaatbare waarde'
              : '✓ Onder streefwaarde';
            return (
              <div className={`mt-2 rounded-lg border px-3 py-2 text-xs ${colorCls}`}>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 font-mono text-zinc-500 dark:text-zinc-400">
                  <span>Streef: {thr.streef} dB(A)</span>
                  <span>Max: {thr.max} dB(A)</span>
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                    <Formula math="L_{EX,8h}" /> = {fmt1(lEx)} dB(A)
                  </span>
                </div>
                <p className={`mt-1 font-semibold ${verdictCls}`}>{verdictTxt}</p>
                {lEx >= 80 && (
                  <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                    Opmerking: bij <Formula math="L_{EX,8h}" /> ≥ 80 dB(A) zijn de Arbobesluit-actiewaarden van toepassing. NPR 3438 is in dit geval informatief.
                  </p>
                )}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

export default function SoundStep8_Assessment({ investigation, onUpdate }: Props) {
  const { hegs, statistics, measurements: allMeasurements } = investigation;

  function updateHEG(updated: SoundHEG) {
    onUpdate({ hegs: hegs.map((h) => (h.id === updated.id ? updated : h)) });
  }

  const verdictOrder: SoundActionLevel[] = ['below-lav', 'lav', 'uav', 'above-elv'];
  const worstVerdict = statistics.reduce<SoundActionLevel>((worst, s) => {
    return verdictOrder.indexOf(s.verdict) > verdictOrder.indexOf(worst) ? s.verdict : worst;
  }, 'below-lav');
  const worstColors = LEVEL_COLORS[worstVerdict];

  if (hegs.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Stap 10 — Beoordeling actiewaarden
        </h2>
        <div className="rounded-lg bg-amber-50 px-4 py-4 text-sm text-amber-700 dark:bg-amber-900/15 dark:text-amber-400">
          Definieer eerst <Abbr id="HEG">HEG</Abbr>&apos;s in stap 2.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Stap 10 — Beoordeling actiewaarden (Arbobesluit art. 6.6–6.8)
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          Toetsing van <Formula math="L_{EX,8h,95\%}" /> aan de actiewaarden en grenswaarde conform het Arbobesluit.
          De invloed van gehoorbescherming (<Abbr id="PBM">PBM</Abbr>) wordt weergegeven op basis van de gegevens uit Stap 6 (Arbeidsmiddelen).
        </p>
      </div>

      {/* Threshold reference */}
      <section className="space-y-4">
        <h3 className="border-b border-zinc-100 pb-2 text-sm font-semibold uppercase tracking-wider text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
          Actiewaarden en grenswaarden
        </h3>
        <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/50">
                <th className="px-4 py-2 text-left font-medium text-zinc-500">Niveau</th>
                <th className="px-4 py-2 text-right font-medium text-zinc-500"><Formula math="L_{EX,8h}" /> (dB(A))</th>
                <th className="px-4 py-2 text-right font-medium text-zinc-500"><Formula math="L_{p,Cpeak}" /> (dB(C))</th>
                <th className="px-4 py-2 text-left font-medium text-zinc-500">Grondslag</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              <tr className="bg-emerald-50/50 dark:bg-emerald-900/5">
                <td className="px-4 py-2 text-emerald-700 dark:text-emerald-400">Geen actiewaarde</td>
                <td className="px-4 py-2 text-right font-mono">&lt; 80</td>
                <td className="px-4 py-2 text-right font-mono">&lt; 135</td>
                <td className="px-4 py-2 text-zinc-500">—</td>
              </tr>
              <tr className="bg-amber-50/50 dark:bg-amber-900/5">
                <td className="px-4 py-2 text-amber-700 dark:text-amber-400">Onderste actiewaarde (<Abbr id="LAV">LAV</Abbr>)</td>
                <td className="px-4 py-2 text-right font-mono">≥ 80</td>
                <td className="px-4 py-2 text-right font-mono">≥ 135</td>
                <td className="px-4 py-2 text-zinc-500">Art. 6.6 lid 1 — zónder <Abbr id="PBM">PBM</Abbr></td>
              </tr>
              <tr className="bg-orange-50/50 dark:bg-orange-900/5">
                <td className="px-4 py-2 text-orange-700 dark:text-orange-400">Bovenste actiewaarde (<Abbr id="UAV">UAV</Abbr>)</td>
                <td className="px-4 py-2 text-right font-mono">≥ 85</td>
                <td className="px-4 py-2 text-right font-mono">≥ 137</td>
                <td className="px-4 py-2 text-zinc-500">Art. 6.6 lid 1 — zónder <Abbr id="PBM">PBM</Abbr></td>
              </tr>
              <tr className="bg-red-50/50 dark:bg-red-900/5">
                <td className="px-4 py-2 text-red-700 dark:text-red-400">Grenswaarde (<Abbr id="GW">GW</Abbr>)</td>
                <td className="px-4 py-2 text-right font-mono">≥ 87</td>
                <td className="px-4 py-2 text-right font-mono">≥ 140</td>
                <td className="px-4 py-2 text-zinc-500">Art. 6.6 lid 2 — <em>mét</em> <Abbr id="PBM">PBM</Abbr></td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          <strong>Belangrijk:</strong> <Abbr id="LAV">LAV</Abbr> en <Abbr id="UAV">UAV</Abbr> worden getoetst aan de
          blootstelling <em>zónder</em> gehoorbescherming. De grenswaarde (<Abbr id="GW">GW</Abbr> 87 dB(A)) wordt
          getoetst aan het geluidniveau dat het oor daadwerkelijk bereikt, dus ná aftrek van de demping door
          de gehoorbeschermer (Arbobesluit art. 6.5 lid 3).
        </p>
      </section>

      {statistics.length === 0 ? (
        <div className="rounded-lg bg-amber-50 px-4 py-4 text-sm text-amber-700 dark:bg-amber-900/15 dark:text-amber-400">
          Voer eerst meetwaarden in bij stap 6 en bereken de blootstelling bij stap 7.
        </div>
      ) : (
        <section className="space-y-4">
          <h3 className="border-b border-zinc-100 pb-2 text-sm font-semibold uppercase tracking-wider text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
            Beoordeling per <Abbr id="HEG">HEG</Abbr>
          </h3>

          {/* Overall verdict */}
          <div className={`rounded-xl border px-5 py-4 ${worstColors.bg} ${worstColors.border}`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className={`text-sm font-semibold ${worstColors.text}`}>Eindoordeel — alle <Abbr id="HEG">HEG</Abbr>&apos;s</p>
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                  Gebaseerd op <Formula math="L_{EX,8h,95\%}" /> (meest ongunstige <Abbr id="HEG">HEG</Abbr>)
                </p>
              </div>
              <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${worstColors.badge}`}>
                {worstVerdict === 'above-elv' ? 'Grenswaarde overschreden'
                  : worstVerdict === 'uav' ? 'Bovenste actiewaarde overschreden'
                  : worstVerdict === 'lav' ? 'Onderste actiewaarde overschreden'
                  : 'Voldoet — geen actiewaarde bereikt'}
              </span>
            </div>
          </div>

          {/* Per-HEG */}
          <div className="space-y-4">
            {statistics.map((stat, idx) => {
              const heg = hegs.find((h) => h.id === stat.hegId);
              if (!heg) return null;
              const hegMeasurements = allMeasurements.filter((m) => m.hegId === stat.hegId);
              return (
                <HEGAssessment
                  key={stat.hegId}
                  stat={stat}
                  heg={heg}
                  measurements={hegMeasurements}
                  onUpdateHEG={updateHEG}
                  index={idx + 1}
                  total={statistics.length}
                />
              );
            })}
          </div>

          {hegs.length > statistics.length && (
            <div className="rounded-lg bg-amber-50 px-4 py-3 text-xs text-amber-700 dark:bg-amber-900/15 dark:text-amber-400">
              {hegs.length - statistics.length} <Abbr id="HEG">HEG</Abbr>{hegs.length - statistics.length !== 1 ? '\'s' : ''} heeft onvoldoende meetgegevens.
            </div>
          )}
        </section>
      )}

    </div>
  );
}
