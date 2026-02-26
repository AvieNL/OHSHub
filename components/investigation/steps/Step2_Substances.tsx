'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { Investigation, Substance, OELValue, OELType, OELPeriod, OELRoute, CMRCategory, AggregateState } from '@/lib/investigation-types';
import { newId } from '@/lib/investigation-storage';
import { Abbr, ABBR_TITLES } from '@/components/Abbr';
import { lookupOELByCAS, SZW_VERSION, SZW_SOURCE, EU_OEL_VERSION, EU_OEL_SOURCE } from '@/data/oels';

interface Props {
  investigation: Investigation;
  onUpdate: (partial: Partial<Investigation>) => void;
}

// ─── Source-hint data ─────────────────────────────────────────────────────────

type HintSource = { label: string; url?: string };

const TOXIC: HintSource = {
  label: 'Toxic — chemiekaarten werkproducten',
  url: 'https://app.toxic.nl/nl/frontend/published/puwghvnbywivgcbpbsielsazwyhghj/workplaceproduct/',
};

const H: Record<string, HintSource[]> = {
  productName: [
    TOXIC,
    { label: 'VIB/SDS van leverancier — rubriek 1: identificatie' },
    { label: 'Eigen productpagina van de leverancier' },
    { label: 'Inkoop- of magazijnsysteem (intern)' },
  ],
  iupacName: [
    { label: 'ECHA – Information on Chemicals', url: 'https://echa.europa.eu/information-on-chemicals' },
    { label: 'PubChem (NIH)', url: 'https://pubchem.ncbi.nlm.nih.gov' },
  ],
  casNr: [
    TOXIC,
    { label: 'VIB/SDS rubriek 3 (leverancier)' },
    { label: 'ECHA – Information on Chemicals', url: 'https://echa.europa.eu/information-on-chemicals' },
    { label: 'GESTIS Stoffendatabase (IFA)', url: 'https://gestis.dguv.de' },
  ],
  egNr: [
    { label: 'VIB/SDS rubriek 3' },
    { label: 'ECHA – Information on Chemicals', url: 'https://echa.europa.eu/information-on-chemicals' },
  ],
  reachNr: [
    { label: 'VIB/SDS rubriek 1 en/of 3' },
    { label: 'ECHA registratiedossier (stofpagina)', url: 'https://echa.europa.eu/information-on-chemicals' },
  ],
  sdsAvailable: [
    TOXIC,
    { label: 'Leverancierssite — tab "Safety Data Sheet" / "SDS" / "VIB"' },
    { label: 'Wettelijk kader VIB-inhoud — REACH bijlage II (EUR‑Lex)', url: 'https://eur-lex.europa.eu' },
  ],
  hStatements: [
    TOXIC,
    { label: 'VIB/SDS rubriek 2' },
    { label: 'ECHA – C&L Inventory', url: 'https://echa.europa.eu/information-on-chemicals/cl-inventory' },
    { label: 'RIVM – uitleg H- en P-zinnen', url: 'https://www.rivm.nl' },
  ],
  cmrCategory: [
    TOXIC,
    { label: 'VIB/SDS rubriek 2 (H340/H341/H350/H351/H360/H361)' },
    { label: 'ECHA – C&L / substance dossier', url: 'https://echa.europa.eu/information-on-chemicals' },
    { label: 'Arboregeling bijlage CMR-stoffen (overheid.nl)', url: 'https://wetten.overheid.nl' },
  ],
  isSensitizing: [
    TOXIC,
    { label: 'VIB/SDS rubriek 2' },
    { label: 'ECHA – Information on Chemicals', url: 'https://echa.europa.eu/information-on-chemicals' },
    { label: 'ECHA – C&L Inventory', url: 'https://echa.europa.eu/information-on-chemicals/cl-inventory' },
  ],
  skinNotation: [
    TOXIC,
    { label: 'SER/OEL-databank – H-notatie bij NL grenswaarden', url: 'https://www.ser.nl' },
    { label: 'GESTIS – "Occupational exposure limits"', url: 'https://gestis.dguv.de' },
    { label: 'RIVM – informatie over huidopname', url: 'https://www.rivm.nl' },
  ],
  aggregateState: [
    TOXIC,
    { label: 'VIB/SDS rubriek 9 ("Physical state")' },
    { label: 'ECHA – physical-chemical properties', url: 'https://echa.europa.eu/information-on-chemicals' },
  ],
  vapourPressure: [
    TOXIC,
    { label: 'VIB/SDS rubriek 9 — "Vapour pressure / Damspanning"' },
    { label: 'ECHA – "Vapour pressure"', url: 'https://echa.europa.eu/information-on-chemicals' },
    { label: 'GESTIS – sectie "Physical data"', url: 'https://gestis.dguv.de' },
  ],
  boilingPoint: [
    TOXIC,
    { label: 'VIB/SDS rubriek 9 ("Boiling point/boiling range")' },
    { label: 'ECHA – "Boiling point"', url: 'https://echa.europa.eu/information-on-chemicals' },
    { label: 'GESTIS – "Boiling point"', url: 'https://gestis.dguv.de' },
  ],
  dustiness: [
    TOXIC,
    { label: 'GESTIS – beschrijving vorm ("fine powder", "granules")', url: 'https://gestis.dguv.de' },
    { label: 'ECHA – sectie "Dustiness" of "Appearance"', url: 'https://echa.europa.eu/information-on-chemicals' },
    { label: 'VIB/SDS rubriek 9 – bijv. "dust formation possible"' },
  ],
  oelSzw: [
    TOXIC,
    { label: 'SER/OEL-databank – TGG-8u, TGG-15min, plafond, H-notatie', url: 'https://www.ser.nl' },
    { label: 'Arboregeling bijlage XIII (overheid.nl)', url: 'https://wetten.overheid.nl' },
  ],
  oelEuOel: [
    { label: 'EUR-Lex – indicatieve OEL-richtlijnen (2000/39/EG e.v.)', url: 'https://eur-lex.europa.eu' },
    { label: 'SER/OEL-databank – kolom "EU‑OEL"', url: 'https://www.ser.nl' },
  ],
  oelDnel: [
    { label: 'ECHA REACH-dossier – sectie "Derived no-effect level (DNEL)"', url: 'https://echa.europa.eu/information-on-chemicals' },
  ],
  oelAcgih: [
    { label: 'NIOSH Pocket Guide – eigen REL-waarden (gratis, VS)', url: 'https://www.cdc.gov/niosh/npg' },
    { label: 'GESTIS – soms Amerikaanse grenswaarden', url: 'https://gestis.dguv.de' },
    { label: 'ACGIH – officieel TLV-boekje (betaald)', url: 'https://www.acgih.org' },
  ],
  oelDfg: [
    { label: 'DFG MAK- und BAT-Werte-Liste (gratis PDF)', url: 'https://www.dfg.de' },
    { label: 'GESTIS – kolom met MAK-waarde', url: 'https://gestis.dguv.de' },
  ],
  oelInternal: [
    { label: 'RIVM / DOHSBase-documentatie (methodiek)', url: 'https://www.rivm.nl' },
    { label: 'DOHSBase – info methode; data niet gratis', url: 'https://www.dohsbase.nl' },
  ],
  stelCeiling: [
    TOXIC,
    { label: 'SER/OEL-databank – kolommen TGG-15min en plafondwaarde', url: 'https://www.ser.nl' },
    { label: 'NIOSH Pocket Guide – rubrieken "STEL" en "Ceiling"', url: 'https://www.cdc.gov/niosh/npg' },
    { label: 'GESTIS – grenswaardetabellen', url: 'https://gestis.dguv.de' },
  ],
  flashPoint: [
    TOXIC,
    { label: 'VIB/SDS rubriek 9 — "Flash point / vlampunt"' },
    { label: 'ECHA – "Flash point"', url: 'https://echa.europa.eu/information-on-chemicals' },
    { label: 'GESTIS – "Flash point"', url: 'https://gestis.dguv.de' },
  ],
  lel: [
    TOXIC,
    { label: 'VIB/SDS rubriek 9 — "Lower flammable / explosive limit"' },
    { label: 'ECHA – "Flammability"', url: 'https://echa.europa.eu/information-on-chemicals' },
    { label: 'GESTIS – "Explosiveness"', url: 'https://gestis.dguv.de' },
  ],
  uel: [
    TOXIC,
    { label: 'VIB/SDS rubriek 9 — "Upper flammable / explosive limit"' },
    { label: 'ECHA – "Flammability"', url: 'https://echa.europa.eu/information-on-chemicals' },
    { label: 'GESTIS – "Explosiveness"', url: 'https://gestis.dguv.de' },
  ],
  isAtex: [
    { label: 'Arbobesluit explosieve atmosferen (overheid.nl)', url: 'https://wetten.overheid.nl' },
    { label: 'Infomil – ATEX praktijkbrochures', url: 'https://www.infomil.nl' },
    { label: 'VIB rubriek 9: vlampunt en explosiegrenzen' },
  ],
  isArie: [
    { label: 'ARIE-regeling en drempelhoeveelheden (overheid.nl)', url: 'https://wetten.overheid.nl' },
    { label: 'RIVM/Infomil – ARIE-handleidingen', url: 'https://www.infomil.nl' },
  ],
  notes: [
    TOXIC,
    { label: 'ECHA substance dossiers (toxicologie, PBT)', url: 'https://echa.europa.eu/information-on-chemicals' },
    { label: 'GESTIS – effecten, gevaarsymbolen, noodmaatregelen', url: 'https://gestis.dguv.de' },
    { label: 'RIVM – themapagina\'s gevaarlijke stoffen', url: 'https://www.rivm.nl' },
    { label: 'Lexces – beroepsziekten door stoffen', url: 'https://www.lexces.nl' },
    { label: 'WHO/IPCS INCHEM monografieën', url: 'https://www.who.int' },
    { label: 'IARC monografieën (kankerverwekkendheid)', url: 'https://monographs.iarc.who.int' },
  ],
};

const OEL_TYPE_HINTS: Partial<Record<OELType, HintSource[]>> = {
  szw: H.oelSzw,
  'eu-oel': H.oelEuOel,
  dnel: H.oelDnel,
  acgih: H.oelAcgih,
  dfg: H.oelDfg,
  internal: H.oelInternal,
};

// Abbr en ABBR_TITLES worden geïmporteerd vanuit @/components/Abbr

// ─── FieldHint component ──────────────────────────────────────────────────────

function FieldHint({ sources }: { sources: HintSource[] }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function handle() { setOpen(false); }
    document.addEventListener('click', handle);
    return () => document.removeEventListener('click', handle);
  }, [open]);

  if (!sources.length) return null;

  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const top = rect.bottom + window.scrollY + 6;
      const rawLeft = rect.left + window.scrollX;
      const left = Math.min(rawLeft, window.innerWidth - 296 - 8);
      setPos({ top, left });
    }
    setOpen((o) => !o);
  }

  const popover = (
    <div
      style={{ position: 'absolute', top: pos.top, left: pos.left, zIndex: 9999, width: 288 }}
      className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">Bronnen & referenties</p>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setOpen(false); }}
          className="rounded p-0.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <ul className="space-y-2">
        {sources.map((src, i) => (
          <li key={i} className="flex items-start gap-1.5 text-xs leading-snug">
            <span className="mt-0.5 shrink-0 text-zinc-300 dark:text-zinc-600">▪</span>
            {src.url ? (
              <a
                href={src.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-blue-600 hover:underline dark:text-blue-400"
              >
                {src.label}
              </a>
            ) : (
              <span className="text-zinc-600 dark:text-zinc-400">{src.label}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        className="ml-2 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-zinc-300 transition hover:bg-blue-50 hover:text-blue-500 dark:text-zinc-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
        title="Waar vind ik deze informatie?"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
      {open && typeof document !== 'undefined' && createPortal(popover, document.body)}
    </>
  );
}

// ─── H-statement inference ────────────────────────────────────────────────────

const CMR_ORDER: Record<CMRCategory, number> = { none: 0, '2': 1, '1B': 2, '1A': 3 };

function inferFromHStatements(raw: string): { cmr: CMRCategory; sensitizing: boolean } {
  const parts = raw
    .split(/[,;\s]+/)
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);

  const is1A = parts.some((h) => ['H340', 'H350', 'H360'].some((c) => h.startsWith(c)));
  const is1B = parts.some((h) => ['H341', 'H351', 'H361'].some((c) => h.startsWith(c)));
  const sensitizing = parts.some((h) => h.startsWith('H317') || h.startsWith('H334'));

  const cmr: CMRCategory = is1A ? '1A' : is1B ? '1B' : 'none';
  return { cmr, sensitizing };
}

// ─── Empty substance factory ──────────────────────────────────────────────────

function emptySubstance(): Substance {
  return {
    id: newId(),
    productName: '',
    iupacName: '',
    casNr: '',
    egNr: '',
    reachNr: '',
    hStatements: '',
    cmrCategory: 'none',
    isSensitizing: false,
    skinNotation: false,
    aggregateState: 'liquid',
    vapourPressure: undefined,
    boilingPoint: undefined,
    flashPoint: undefined,
    lel: undefined,
    uel: undefined,
    dustiness: undefined,
    oels: [{ type: 'szw', value: undefined, unit: 'mg/m³', routes: ['inhalatoir'], source: `${SZW_SOURCE} — versie ${SZW_VERSION}` }],
    isAtex: false,
    isArie: false,
    sdsAvailable: true,
    notes: '',
  };
}

// ─── OEL row ─────────────────────────────────────────────────────────────────

const OEL_TYPES: { value: OELType; label: string }[] = [
  { value: 'szw', label: 'SZW (NL wettelijk)' },
  { value: 'eu-oel', label: 'EU-OEL (richtlijn)' },
  { value: 'dnel', label: 'DNEL (REACH)' },
  { value: 'acgih', label: 'ACGIH TLV' },
  { value: 'dfg', label: 'DFG MAK' },
  { value: 'internal', label: 'Interne grenswaarde' },
  { value: 'none', label: 'Geen grenswaarde' },
];

const OEL_PERIODS: { value: OELPeriod; label: React.ReactNode }[] = [
  { value: 'tgg-8h',    label: <>8-uurs <Abbr id="TGG">TGG</Abbr></> },
  { value: 'tgg-15min', label: <>15-min <Abbr id="TGG">TGG</Abbr></> },
  { value: 'ceiling',   label: 'Plafond' },
];

function toggleRoute(routes: OELRoute[] | undefined, route: OELRoute, checked: boolean): OELRoute[] {
  const current = routes ?? [];
  return checked ? [...current.filter((r) => r !== route), route] : current.filter((r) => r !== route);
}

// Auto-route based on unit: mg/m³/ppm/f/cm³ → inhalatoir, mg/kg/d → dermaal
function autoRoutesForUnit(unit: OELValue['unit']): OELRoute[] {
  if (unit === 'mg/m³' || unit === 'ppm' || unit === 'f/cm³') return ['inhalatoir'];
  if (unit === 'mg/kg/d') return ['dermaal'];
  return [];
}

function OELRow({
  oel,
  onChange,
  onRemove,
  showRemove,
}: {
  oel: OELValue;
  onChange: (updated: OELValue) => void;
  onRemove: () => void;
  showRemove: boolean;
}) {
  const typeHints = OEL_TYPE_HINTS[oel.type] ?? [];

  function autoSourceForType(type: OELType): string | undefined {
    if (type === 'szw') return `${SZW_SOURCE} — versie ${SZW_VERSION}`;
    if (type === 'eu-oel') return `${EU_OEL_SOURCE} — versie ${EU_OEL_VERSION}`;
    return undefined;
  }

  function handleTypeChange(type: OELType) {
    const auto = autoSourceForType(type);
    // Only overwrite source if it was empty or previously an auto-source (szw/eu-oel)
    const prevAuto = autoSourceForType(oel.type);
    const currentSource = oel.source;
    const newSource = (!currentSource || currentSource === prevAuto) ? (auto ?? undefined) : currentSource;
    onChange({ ...oel, type, source: newSource });
  }

  function handleUnitChange(unit: OELValue['unit']) {
    onChange({ ...oel, unit, routes: autoRoutesForUnit(unit) });
  }

  return (
    <div className="rounded-lg border border-zinc-200 p-5 dark:border-zinc-700">
      {/* Row 1: type + value + unit + remove */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center">
          <select
            value={oel.type}
            onChange={(e) => handleTypeChange(e.target.value as OELType)}
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-800 outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-orange-400"
          >
            {OEL_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <FieldHint sources={typeHints} />
        </div>

        {oel.type !== 'none' && (
          <>
            <input
              type="number"
              step="any"
              min="0"
              value={oel.value ?? ''}
              onChange={(e) => onChange({ ...oel, value: e.target.value ? parseFloat(e.target.value) : undefined })}
              placeholder="Waarde"
              className="w-24 rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-800 outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-orange-400"
            />
            <select
              value={oel.unit}
              onChange={(e) => handleUnitChange(e.target.value as OELValue['unit'])}
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-800 outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-orange-400"
            >
              <option value="mg/m³">mg/m³</option>
              <option value="ppm">ppm</option>
              <option value="f/cm³">f/cm³</option>
              <option value="mg/kg/d">mg/kg/d</option>
            </select>
          </>
        )}

        {showRemove && (
          <button
            onClick={onRemove}
            className="ml-auto rounded p-1 text-zinc-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Row 2: period + route */}
      {oel.type !== 'none' && (
        <div className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-2">
          {/* Period */}
          <div className="flex items-center gap-3">
            {OEL_PERIODS.map((p) => (
              <label key={p.value} className="flex cursor-pointer items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                <input
                  type="radio"
                  name={`period-${oel.type}-${oel.value}`}
                  checked={(oel.period ?? 'tgg-8h') === p.value}
                  onChange={() => onChange({ ...oel, period: p.value })}
                  className="accent-orange-500"
                />
                {p.label}
              </label>
            ))}
            <FieldHint sources={H.stelCeiling} />
          </div>

          {/* Divider */}
          <span className="h-3.5 w-px bg-zinc-200 dark:bg-zinc-700" />

          {/* Route */}
          <div className="flex items-center gap-3">
            {(['inhalatoir', 'dermaal'] as OELRoute[]).map((route) => (
              <label key={route} className="flex cursor-pointer items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                <input
                  type="checkbox"
                  checked={(oel.routes ?? []).includes(route)}
                  onChange={(e) => onChange({ ...oel, routes: toggleRoute(oel.routes, route, e.target.checked) })}
                  className="accent-orange-500"
                />
                {route.charAt(0).toUpperCase() + route.slice(1)}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Row 3: bronvermelding */}
      {oel.type !== 'none' && (
        <div className="mt-2.5">
          <input
            type="text"
            value={oel.source ?? ''}
            onChange={(e) => onChange({ ...oel, source: e.target.value || undefined })}
            placeholder="Bronvermelding (bijv. VIB/SDS rubriek 8, ECHA-dossier, intern rapport)"
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-600 placeholder:text-zinc-400 outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:placeholder:text-zinc-500 dark:focus:border-orange-400"
          />
        </div>
      )}
    </div>
  );
}

// ─── Label with hint ──────────────────────────────────────────────────────────

function FieldLabel({
  children,
  hint,
  required,
  showPubChem,
}: {
  children: React.ReactNode;
  hint?: HintSource[];
  required?: boolean;
  showPubChem?: boolean;
}) {
  return (
    <div className="mb-1 flex items-center gap-2">
      <span className="whitespace-nowrap text-xs font-medium text-zinc-600 dark:text-zinc-400">
        {children}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </span>
      {showPubChem && (
        <span
          className="inline-flex items-center rounded px-1 py-0.5 text-[10px] font-medium bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
          title="Ingevuld via Opzoeken"
        >
          Opgehaald
        </span>
      )}
      {hint && <FieldHint sources={hint} />}
    </div>
  );
}

// ─── PubChem lookup ───────────────────────────────────────────────────────────

interface PubChemResult {
  iupacName?: string;
  egNr?: string;
  boilingPoint?: number;            // °C
  flashPoint?: number;              // °C
  lel?: number;                     // % vol
  uel?: number;                     // % vol
  vapourPressure?: number;
  vapourPressureUnit?: string;
  physicalDescription?: AggregateState;
  hStatements?: string;             // gesorteerde H-codes: "H225, H302, H361"
}

type LookupStatus = 'idle' | 'loading' | 'found' | 'not-found' | 'error';

interface LookupConflict {
  field: string;
  label: string;
  current: string;
  fromPubChem: string;
  // Patch is applied against the *current* substance at click-time, not against stale closure state
  applyPatch: Partial<Substance>;
  addToPubchemFields: string[];
  addToPubchemOriginals: Record<string, string>;
}

// Extract all "String" values from a PubChem pug_view JSON response
function extractAllStrings(data: unknown): string[] {
  const results: string[] = [];
  const allText = JSON.stringify(data);
  const matches = allText.matchAll(/"String"\s*:\s*"([^"\\]*)"/g);
  for (const m of matches) {
    if (m[1]) results.push(m[1]);
  }
  return results;
}

function parseTemperatureToCelsius(s: string): number | null {
  const matchC = s.match(/([-\d.]+)\s*°?\s*C\b/);
  if (matchC) return Math.round(parseFloat(matchC[1]) * 10) / 10;
  const matchF = s.match(/([-\d.]+)\s*°?\s*F\b/);
  if (matchF) return Math.round(((parseFloat(matchF[1]) - 32) * 5 / 9) * 10) / 10;
  return null;
}

function parseVapourPressure(s: string): { value: number; unit: string } | null {
  const match = s.match(/([\d.]+)\s*(kPa|Pa|mmHg|mbar|bar)\b/i);
  if (!match) return null;
  const value = parseFloat(match[1]);
  const unitMap: Record<string, string> = { kpa: 'kPa', pa: 'Pa', mmhg: 'mmHg', mbar: 'mbar', bar: 'bar' };
  return { value, unit: unitMap[match[2].toLowerCase()] ?? match[2] };
}

function mapPhysicalDescription(desc: string): AggregateState | null {
  const lower = desc.toLowerCase();
  if (/\bgas\b/.test(lower)) return 'gas';
  if (/powder|solid|crystal|granul|pellet/.test(lower)) return 'solid-powder';
  if (/aerosol|spray|\bmist\b/.test(lower)) return 'aerosol';
  if (/liquid|oil|fluid/.test(lower)) return 'liquid';
  return null;
}

function parseExplosiveLimits(strings: string[]): { lel?: number; uel?: number } {
  let lel: number | undefined;
  let uel: number | undefined;
  for (const s of strings) {
    const lower = s.toLowerCase();
    // Range format: "1.0 - 7.0 %"
    const rangeMatch = s.match(/([\d.]+)\s*[-–]\s*([\d.]+)\s*%/);
    if (rangeMatch && lel === undefined) {
      lel = parseFloat(rangeMatch[1]);
      uel = parseFloat(rangeMatch[2]);
      continue;
    }
    const numMatch = s.match(/([\d.]+)\s*%/);
    if (!numMatch) continue;
    const val = parseFloat(numMatch[1]);
    if (lower.includes('lower') || lower.includes('lfl') || lower.includes('lel')) {
      if (lel === undefined) lel = val;
    } else if (lower.includes('upper') || lower.includes('ufl') || lower.includes('uel')) {
      if (uel === undefined) uel = val;
    } else if (lel === undefined) {
      lel = val;
    } else if (uel === undefined) {
      uel = val;
    }
  }
  return { lel, uel };
}

const STATE_LABELS: Record<AggregateState, string> = {
  gas: 'Gas',
  'vapor-liquid': 'Damp / vloeistof (hoge dampdruk)',
  liquid: 'Vloeistof (lage dampdruk)',
  'solid-powder': 'Vaste stof / poeder',
  aerosol: 'Aerosol / nevel',
};

async function fetchPubChem(identifier: string): Promise<PubChemResult | null> {
  try {
    const cidRes = await fetch(
      `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(identifier)}/cids/JSON`,
      { signal: AbortSignal.timeout(8000) },
    );
    if (!cidRes.ok) return null;
    const cidData = await cidRes.json();
    const cid: number | undefined = cidData.IdentifierList?.CID?.[0];
    if (!cid) return null;

    // Use allSettled so a single slow/failed endpoint never discards the others
    const settled = await Promise.allSettled([
      fetch(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/property/IUPACName/JSON`,
        { signal: AbortSignal.timeout(10000) }),
      fetch(`https://pubchem.ncbi.nlm.nih.gov/rest/pug_view/data/compound/${cid}/JSON?heading=GHS+Classification`,
        { signal: AbortSignal.timeout(10000) }),
      fetch(`https://pubchem.ncbi.nlm.nih.gov/rest/pug_view/data/compound/${cid}/JSON?heading=Boiling+Point`,
        { signal: AbortSignal.timeout(10000) }),
      fetch(`https://pubchem.ncbi.nlm.nih.gov/rest/pug_view/data/compound/${cid}/JSON?heading=Vapor+Pressure`,
        { signal: AbortSignal.timeout(10000) }),
      fetch(`https://pubchem.ncbi.nlm.nih.gov/rest/pug_view/data/compound/${cid}/JSON?heading=Physical+Description`,
        { signal: AbortSignal.timeout(10000) }),
      fetch(`https://pubchem.ncbi.nlm.nih.gov/rest/pug_view/data/compound/${cid}/JSON?heading=Flash+Point`,
        { signal: AbortSignal.timeout(10000) }),
      fetch(`https://pubchem.ncbi.nlm.nih.gov/rest/pug_view/data/compound/${cid}/JSON?heading=Explosive+Limits`,
        { signal: AbortSignal.timeout(10000) }),
      fetch(`https://pubchem.ncbi.nlm.nih.gov/rest/pug_view/data/compound/${cid}/JSON?heading=European+Community+%28EC%29+Number`,
        { signal: AbortSignal.timeout(10000) }),
    ]);

    // Helper: extract Response from a PromiseSettledResult, or null if rejected/failed
    function ok(r: PromiseSettledResult<Response>): Response | null {
      return r.status === 'fulfilled' && r.value.ok ? r.value : null;
    }

    const [propRes, ghsRes, bpRes, vpRes, phRes, fpRes, elRes, ecRes] = settled;
    const result: PubChemResult = {};

    // IUPAC name — capitalize first letter
    const propR = ok(propRes);
    if (propR) {
      const propData = await propR.json().catch(() => null);
      const iupac = propData?.PropertyTable?.Properties?.[0]?.IUPACName as string | undefined;
      if (iupac) result.iupacName = iupac.charAt(0).toUpperCase() + iupac.slice(1);
    }

    // H-statements: use JSON.stringify + regex — robust against any nesting
    const ghsR = ok(ghsRes);
    if (ghsR) {
      const ghsData = await ghsR.json().catch(() => null);
      if (ghsData) {
        const codes = [...new Set((JSON.stringify(ghsData).match(/H[2-4]\d{2}/g) ?? []))].sort();
        if (codes.length > 0) result.hStatements = codes.join(', ');
      }
    }

    // Boiling point (experimental)
    const bpR = ok(bpRes);
    if (bpR) {
      const strings = extractAllStrings(await bpR.json().catch(() => ({})));
      for (const s of strings) {
        const bp = parseTemperatureToCelsius(s);
        if (bp !== null) { result.boilingPoint = bp; break; }
      }
    }

    // Vapor pressure (experimental)
    const vpR = ok(vpRes);
    if (vpR) {
      const strings = extractAllStrings(await vpR.json().catch(() => ({})));
      for (const s of strings) {
        const vp = parseVapourPressure(s);
        if (vp) { result.vapourPressure = vp.value; result.vapourPressureUnit = vp.unit; break; }
      }
    }

    // Physical description → aggregate state
    const phR = ok(phRes);
    if (phR) {
      const strings = extractAllStrings(await phR.json().catch(() => ({})));
      for (const s of strings) {
        const state = mapPhysicalDescription(s);
        if (state) { result.physicalDescription = state; break; }
      }
    }

    // Flash point (ATEX)
    const fpR = ok(fpRes);
    if (fpR) {
      const strings = extractAllStrings(await fpR.json().catch(() => ({})));
      for (const s of strings) {
        const fp = parseTemperatureToCelsius(s);
        if (fp !== null) { result.flashPoint = fp; break; }
      }
    }

    // Explosive limits LEL/UEL (ATEX)
    const elR = ok(elRes);
    if (elR) {
      const strings = extractAllStrings(await elR.json().catch(() => ({})));
      const { lel, uel } = parseExplosiveLimits(strings);
      if (lel !== undefined) result.lel = lel;
      if (uel !== undefined) result.uel = uel;
    }

    // EC (EG) number
    const ecR = ok(ecRes);
    if (ecR) {
      const ecText = JSON.stringify(await ecR.json().catch(() => ({})));
      const ecMatch = ecText.match(/\d{3}-\d{3}-\d/);
      if (ecMatch) result.egNr = ecMatch[0];
    }

    return Object.keys(result).length > 0 ? result : null;
  } catch {
    return null;
  }
}

// ─── ATEX / ARIE suggesties + BRZO drempelwaarden ────────────────────────────

function getAtexSuggestion(s: Substance): string | null {
  if (s.isAtex) return null;
  if (s.flashPoint !== undefined && s.flashPoint < 60)
    return `Vlampunt ${s.flashPoint} °C (< 60 °C) — zeer waarschijnlijk ATEX-relevant (brandbare vloeistof cat. 1/2/3)`;
  if (s.flashPoint !== undefined && s.flashPoint < 100)
    return `Vlampunt ${s.flashPoint} °C — controleer ATEX-relevantie (brandbare vloeistof cat. 4 of verneveling)`;
  if (s.lel !== undefined || s.uel !== undefined)
    return 'Explosiegrenzen (LEL/UEL) ingevuld — stof is mogelijk brandbaar/explosief; controleer ATEX';
  if (s.aggregateState === 'gas' || s.aggregateState === 'vapor-liquid')
    return 'Gas of vloeistof met hoge dampdruk — controleer of explosieve atmosfeer kan ontstaan (ATEX)';
  const hCodes = s.hStatements.split(/[,\s]+/).map((c) => c.trim().toUpperCase());
  if (hCodes.some((c) => ['H220', 'H221', 'H222', 'H223', 'H224', 'H225', 'H226', 'H228', 'H229', 'H241', 'H242'].includes(c)))
    return 'Brandbare / ontvlambare H-zin aanwezig — controleer ATEX-relevantie';
  return null;
}

// BRZO 2015 bijlage 1 deel 2 — gevaarcategorieën met drempelwaarden (ton)
interface BRZOMatch {
  id: string;
  label: string;
  basis: string;      // H-codes of fysische eigenschap
  kolom1: number;     // BRZO-plichtig boven deze hoeveelheid (ton)
  kolom2: number;     // Hogere verplichtingen boven deze hoeveelheid (ton)
  note?: string;
}

function getBRZOCategories(s: Substance): BRZOMatch[] {
  const hSet = new Set(
    s.hStatements.split(/[,\s]+/).map((c) => c.trim().toUpperCase()).filter((c) => /^H\d{3}$/.test(c)),
  );
  const has = (...codes: string[]) => codes.filter((c) => hSet.has(c));
  const results: BRZOMatch[] = [];

  // ── Gevaren voor de menselijke gezondheid ──
  // H1: acuut toxisch cat. 1 (H300/H310/H330)
  const h1 = has('H300', 'H310', 'H330');
  if (h1.length > 0)
    results.push({ id: 'H1', label: 'Acuut toxisch cat. 1 (alle routes)', basis: h1.join(', '), kolom1: 5, kolom2: 20 });

  // H2: acuut toxisch cat. 2 alle routes of cat. 3 inhalatoir
  const h2 = has('H301', 'H311', 'H331');
  if (h2.length > 0)
    results.push({ id: 'H2', label: 'Acuut toxisch cat. 2 (alle routes) / cat. 3 inhalatoir', basis: h2.join(', '), kolom1: 50, kolom2: 200 });

  // H3: acuut toxisch cat. 3 dermaal/oraal (alleen als H331 niet van toepassing)
  const h3 = has('H301', 'H311').filter((c) => !h2.includes('H331') || c !== 'H301');
  if (h3.length > 0 && !h2.includes('H331'))
    results.push({ id: 'H3', label: 'Acuut toxisch cat. 3 (dermaal/oraal)', basis: h3.join(', '), kolom1: 200, kolom2: 500 });

  // ── Fysische gevaren ──
  // P1: explosieven
  const p1 = has('H200', 'H201', 'H202', 'H203', 'H204', 'H205');
  if (p1.length > 0)
    results.push({ id: 'P1', label: 'Explosieve stof/mengsel', basis: p1.join(', '), kolom1: 10, kolom2: 50 });

  // P2: ontvlambare gassen cat. 1 & 2
  const p2 = has('H220', 'H221');
  if (p2.length > 0)
    results.push({ id: 'P2', label: 'Ontvlambaar gas cat. 1 & 2', basis: p2.join(', '), kolom1: 10, kolom2: 50 });

  // P3a: brandbare vloeistof cat. 1 (H224 of vlampunt < 23°C + kookpunt ≤ 35°C)
  const isCat1Liq = hSet.has('H224') ||
    (s.flashPoint !== undefined && s.flashPoint < 23 && s.boilingPoint !== undefined && s.boilingPoint <= 35);
  if (isCat1Liq)
    results.push({ id: 'P3a', label: 'Brandbare vloeistof cat. 1', basis: hSet.has('H224') ? 'H224' : `vlampunt ${s.flashPoint} °C`, kolom1: 10, kolom2: 50 });

  // P3c: brandbare vloeistof cat. 2 & 3 (H225, H226 of vlampunt 23–60°C)
  const liqCodes = has('H225', 'H226');
  const flashBasedLiq = !isCat1Liq && s.flashPoint !== undefined && s.flashPoint >= 23 && s.flashPoint < 60;
  if (liqCodes.length > 0 || flashBasedLiq)
    results.push({
      id: 'P3c', label: 'Brandbare vloeistof cat. 2 & 3',
      basis: liqCodes.length > 0 ? liqCodes.join(', ') : `vlampunt ${s.flashPoint} °C`,
      kolom1: 5000, kolom2: 50000,
      note: 'Lagere drempel (50/200 ton) geldt wanneer vloeistof wordt verhit tot boven kookpunt',
    });

  // P4: ontvlambare aerosol
  const p4 = has('H222', 'H223');
  if (p4.length > 0)
    results.push({ id: 'P4', label: 'Ontvlambare aerosol cat. 1 & 2', basis: p4.join(', '), kolom1: 150, kolom2: 500, note: 'Hoeveelheid = netto ontvlambare inhoud' });

  // P5: oxiderend gas
  if (hSet.has('H270'))
    results.push({ id: 'P5', label: 'Oxiderend gas cat. 1', basis: 'H270', kolom1: 50, kolom2: 200 });

  // P6: zelfontledend / organisch peroxide
  const p6a = has('H240', 'H241');
  if (p6a.length > 0)
    results.push({ id: 'P6a', label: 'Zelfontledend / organisch peroxide (type A & B)', basis: p6a.join(', '), kolom1: 10, kolom2: 50 });
  if (hSet.has('H242'))
    results.push({ id: 'P6b', label: 'Zelfontledend / organisch peroxide (overige)', basis: 'H242', kolom1: 50, kolom2: 200 });

  // E1: gevaarlijk voor aquatisch milieu cat. 1
  const e1 = has('H400', 'H410');
  if (e1.length > 0)
    results.push({ id: 'E1', label: 'Gevaarlijk voor aquatisch milieu cat. 1', basis: e1.join(', '), kolom1: 200, kolom2: 500 });

  // Sorteren: meest restrictieve (laagste kolom1) eerst
  return results.sort((a, b) => a.kolom1 - b.kolom1);
}

// ─── Substance form ───────────────────────────────────────────────────────────

function SubstanceForm({
  substance,
  onChange,
  onCancel,
  onSave,
}: {
  substance: Substance;
  onChange: (updated: Substance) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  const s = substance;

  const [lookupStatus, setLookupStatus] = useState<LookupStatus>('idle');
  const [lookupConflicts, setLookupConflicts] = useState<LookupConflict[]>([]);
  const [lookupFilled, setLookupFilled] = useState<string[]>([]);
  const [pubchemFields, setPubchemFields] = useState<Set<string>>(new Set());
  const [pubchemOriginals, setPubchemOriginals] = useState<Record<string, string>>({});
  const [addedOELSuggestions, setAddedOELSuggestions] = useState<Set<string>>(new Set());

  function field(patch: Partial<Substance>) {
    onChange({ ...s, ...patch });
  }

  async function handleLookup() {
    const identifier = s.casNr?.trim() || s.productName?.trim();
    if (!identifier) return;
    setLookupStatus('loading');
    setLookupConflicts([]);
    setLookupFilled([]);

    const result = await fetchPubChem(identifier);

    const patch: Partial<Substance> = {};
    const conflicts: LookupConflict[] = [];
    const filled: string[] = [];
    const newPubchemFields = new Set(pubchemFields);
    const originals: Record<string, string> = {};
    const newAddedOELSuggestions = new Set(addedOELSuggestions);

    if (result) {
      // IUPAC-naam
      if (result.iupacName) {
        if (!s.iupacName) {
          patch.iupacName = result.iupacName;
          filled.push('IUPAC-naam');
          newPubchemFields.add('iupacName');
          originals['iupacName'] = result.iupacName;
        } else if (s.iupacName.toLowerCase() !== result.iupacName.toLowerCase()) {
          const val = result.iupacName;
          conflicts.push({ field: 'iupacName', label: 'IUPAC-naam', current: s.iupacName, fromPubChem: val,
            applyPatch: { iupacName: val }, addToPubchemFields: ['iupacName'], addToPubchemOriginals: { iupacName: val } });
        }
      }

      // Aggregatietoestand
      if (result.physicalDescription) {
        if (s.aggregateState === 'liquid' && result.physicalDescription !== 'liquid') {
          patch.aggregateState = result.physicalDescription;
          filled.push('Aggregatietoestand');
          newPubchemFields.add('aggregateState');
          originals['aggregateState'] = result.physicalDescription;
        } else if (s.aggregateState !== result.physicalDescription) {
          const val = result.physicalDescription;
          conflicts.push({
            field: 'aggregateState', label: 'Aggregatietoestand',
            current: STATE_LABELS[s.aggregateState], fromPubChem: STATE_LABELS[val],
            applyPatch: { aggregateState: val }, addToPubchemFields: ['aggregateState'], addToPubchemOriginals: { aggregateState: val },
          });
        }
      }

      // Damspanning
      if (result.vapourPressure !== undefined) {
        if (!s.vapourPressure) {
          patch.vapourPressure = result.vapourPressure;
          if (result.vapourPressureUnit) patch.vapourPressureUnit = result.vapourPressureUnit as Substance['vapourPressureUnit'];
          filled.push('Damspanning');
          newPubchemFields.add('vapourPressure');
          originals['vapourPressure'] = `${result.vapourPressure} ${result.vapourPressureUnit ?? 'kPa'}`;
        } else if (Math.abs(s.vapourPressure - result.vapourPressure) > 0.001) {
          const val = result.vapourPressure;
          const unitVal = (result.vapourPressureUnit ?? 'kPa') as Substance['vapourPressureUnit'];
          conflicts.push({
            field: 'vapourPressure', label: 'Damspanning',
            current: `${s.vapourPressure} ${s.vapourPressureUnit ?? 'kPa'}`,
            fromPubChem: `${val} ${unitVal}`,
            applyPatch: { vapourPressure: val, vapourPressureUnit: unitVal },
            addToPubchemFields: ['vapourPressure'],
            addToPubchemOriginals: { vapourPressure: `${val} ${unitVal}` },
          });
        }
      }

      // Kookpunt
      if (result.boilingPoint !== undefined) {
        if (!s.boilingPoint) {
          patch.boilingPoint = result.boilingPoint;
          filled.push('Kookpunt');
          newPubchemFields.add('boilingPoint');
          originals['boilingPoint'] = `${result.boilingPoint} °C`;
        } else if (Math.abs(s.boilingPoint - result.boilingPoint) > 2) {
          const val = result.boilingPoint;
          conflicts.push({ field: 'boilingPoint', label: 'Kookpunt (°C)', current: String(s.boilingPoint), fromPubChem: String(val),
            applyPatch: { boilingPoint: val }, addToPubchemFields: ['boilingPoint'], addToPubchemOriginals: { boilingPoint: `${val} °C` } });
        }
      }

      // EG-nummer
      if (result.egNr) {
        if (!s.egNr) {
          patch.egNr = result.egNr;
          filled.push('EG-nummer');
          newPubchemFields.add('egNr');
          originals['egNr'] = result.egNr;
        } else if (s.egNr !== result.egNr) {
          const val = result.egNr;
          conflicts.push({ field: 'egNr', label: 'EG-nummer', current: s.egNr, fromPubChem: val,
            applyPatch: { egNr: val }, addToPubchemFields: ['egNr'], addToPubchemOriginals: { egNr: val } });
        }
      }

      // Vlampunt (ATEX)
      if (result.flashPoint !== undefined) {
        if (!s.flashPoint) {
          patch.flashPoint = result.flashPoint;
          filled.push('Vlampunt');
          newPubchemFields.add('flashPoint');
          originals['flashPoint'] = `${result.flashPoint} °C`;
        } else if (Math.abs(s.flashPoint - result.flashPoint) > 2) {
          const val = result.flashPoint;
          conflicts.push({ field: 'flashPoint', label: 'Vlampunt (°C)', current: String(s.flashPoint), fromPubChem: String(val),
            applyPatch: { flashPoint: val }, addToPubchemFields: ['flashPoint'], addToPubchemOriginals: { flashPoint: `${val} °C` } });
        }
      }

      // LEL (ATEX)
      if (result.lel !== undefined) {
        if (!s.lel) {
          patch.lel = result.lel;
          filled.push('LEL');
          newPubchemFields.add('lel');
          originals['lel'] = `${result.lel} % vol`;
        } else if (Math.abs(s.lel - result.lel) > 0.05) {
          const val = result.lel;
          conflicts.push({ field: 'lel', label: 'LEL (% vol)', current: String(s.lel), fromPubChem: String(val),
            applyPatch: { lel: val }, addToPubchemFields: ['lel'], addToPubchemOriginals: { lel: `${val} % vol` } });
        }
      }

      // UEL (ATEX)
      if (result.uel !== undefined) {
        if (!s.uel) {
          patch.uel = result.uel;
          filled.push('UEL');
          newPubchemFields.add('uel');
          originals['uel'] = `${result.uel} % vol`;
        } else if (Math.abs(s.uel - result.uel) > 0.05) {
          const val = result.uel;
          conflicts.push({ field: 'uel', label: 'UEL (% vol)', current: String(s.uel), fromPubChem: String(val),
            applyPatch: { uel: val }, addToPubchemFields: ['uel'], addToPubchemOriginals: { uel: `${val} % vol` } });
        }
      }

      // H-statements (merge: voeg nieuwe GHS-codes toe)
      if (result.hStatements) {
        const existingCodes = new Set(s.hStatements.split(/[,\s]+/).filter((c) => /^H\d{3}$/.test(c)));
        const newCodes = result.hStatements.split(/[,\s]+/).filter((c) => /^H\d{3}$/.test(c));
        const added = newCodes.filter((c) => !existingCodes.has(c));
        if (added.length > 0 || !s.hStatements) {
          const merged = [...new Set([...existingCodes, ...newCodes])].sort().join(', ');
          if (!s.hStatements) {
            const { cmr, sensitizing } = inferFromHStatements(merged);
            patch.hStatements = merged;
            filled.push('H-statements');
            newPubchemFields.add('hStatements');
            originals['hStatements'] = merged;
            if (CMR_ORDER[cmr] > CMR_ORDER[s.cmrCategory]) {
              patch.cmrCategory = cmr;
              filled.push('CMR-categorie');
              newPubchemFields.add('cmrCategory');
              originals['cmrCategory'] = cmr;
            }
            if (sensitizing && !s.isSensitizing) { patch.isSensitizing = true; filled.push('Sensitiserend'); }
          } else if (added.length > 0) {
            const mergedVal = merged;
            const { cmr: mergedCmr, sensitizing: mergedSensitizing } = inferFromHStatements(mergedVal);
            conflicts.push({
              field: 'hStatements',
              label: `H-statements (${added.length} nieuwe code${added.length > 1 ? 's' : ''}: ${added.join(', ')})`,
              current: s.hStatements, fromPubChem: mergedVal,
              // cmrCategory/isSensitizing are derived from hStatements — safe to compute at conflict-creation time
              applyPatch: {
                hStatements: mergedVal,
                cmrCategory: CMR_ORDER[mergedCmr] > CMR_ORDER[s.cmrCategory] ? mergedCmr : s.cmrCategory,
                isSensitizing: s.isSensitizing || mergedSensitizing,
              },
              addToPubchemFields: ['hStatements'],
              addToPubchemOriginals: { hStatements: mergedVal },
            });
          }
        }
      }
    }

    // ── SZW / EU-OEL opzoeken (lokale data, geen netwerk) ──
    const oelMatches = lookupOELByCAS(s.casNr ?? '');
    for (const match of oelMatches) {
      if (newAddedOELSuggestions.has(match.type)) continue;
      const oelType: OELType = match.type === 'szw' ? 'szw' : 'eu-oel';
      const oelSource = match.type === 'szw'
        ? `${SZW_SOURCE} — versie ${SZW_VERSION}`
        : `${EU_OEL_SOURCE} — versie ${EU_OEL_VERSION}${match.directive ? ` (${match.directive})` : ''}`;
      const baseOELs = patch.oels ?? s.oels;
      const newOELRows: OELValue[] = baseOELs.filter((o) => !(o.type === 'szw' && o.value === undefined));
      if (match.tgg8h_mgm3 !== undefined || match.tgg8h_ppm !== undefined) {
        const useMgm3 = match.tgg8h_mgm3 !== undefined;
        const unit = useMgm3 ? 'mg/m³' : 'ppm';
        newOELRows.push({ type: oelType, value: useMgm3 ? match.tgg8h_mgm3 : match.tgg8h_ppm, unit, period: 'tgg-8h', routes: autoRoutesForUnit(unit), source: oelSource });
      }
      if (match.tgg15min_mgm3 !== undefined || match.tgg15min_ppm !== undefined) {
        const useMgm3 = match.tgg15min_mgm3 !== undefined;
        const unit = useMgm3 ? 'mg/m³' : 'ppm';
        newOELRows.push({ type: oelType, value: useMgm3 ? match.tgg15min_mgm3 : match.tgg15min_ppm, unit, period: 'tgg-15min', routes: autoRoutesForUnit(unit), source: oelSource });
      }
      if (match.ceiling_mgm3 !== undefined || match.ceiling_ppm !== undefined) {
        const useMgm3 = match.ceiling_mgm3 !== undefined;
        const unit = useMgm3 ? 'mg/m³' : 'ppm';
        newOELRows.push({ type: oelType, value: useMgm3 ? match.ceiling_mgm3 : match.ceiling_ppm, unit, period: 'ceiling', routes: autoRoutesForUnit(unit), source: oelSource });
      }
      if (newOELRows.length > 0) patch.oels = newOELRows;
      if (match.hNotatie && !s.skinNotation) patch.skinNotation = true;
      filled.push(match.type === 'szw' ? `SZW-grenswaarden (${match.name})` : `EU-OEL (${match.name})`);
      newAddedOELSuggestions.add(match.type);
    }
    setAddedOELSuggestions(newAddedOELSuggestions);

    if (!result && oelMatches.length === 0) {
      setLookupStatus('not-found');
      setTimeout(() => setLookupStatus('idle'), 4000);
      return;
    }

    if (Object.keys(patch).length > 0) onChange({ ...s, ...patch });
    setLookupConflicts(conflicts);
    setLookupFilled(filled);
    setPubchemFields(newPubchemFields);
    if (Object.keys(originals).length > 0) setPubchemOriginals((prev) => ({ ...prev, ...originals }));
    setLookupStatus('found');
  }

  function handleHStatementsChange(value: string) {
    const { cmr: inferredCmr, sensitizing: inferred } = inferFromHStatements(value);
    const patch: Partial<Substance> = { hStatements: value };

    // Upgrade CMR category (never downgrade manually-set values)
    if (CMR_ORDER[inferredCmr] > CMR_ORDER[s.cmrCategory]) {
      patch.cmrCategory = inferredCmr;
    }
    // Auto-check sensitizing if H317/H334 detected
    if (inferred && !s.isSensitizing) {
      patch.isSensitizing = true;
    }

    field(patch);
  }

  function updateOEL(idx: number, updated: OELValue) {
    field({ oels: s.oels.map((o, i) => (i === idx ? updated : o)) });
  }

  function removeOEL(idx: number) {
    field({ oels: s.oels.filter((_, i) => i !== idx) });
  }

  function addOEL() {
    field({ oels: [...s.oels, { type: 'szw', value: undefined, unit: 'mg/m³', routes: ['inhalatoir'], source: `${SZW_SOURCE} — versie ${SZW_VERSION}` }] });
  }

  // Show inline warning when a looked-up value was manually overridden
  function overrideWarn(fieldKey: string, currentVal: string) {
    const orig = pubchemOriginals[fieldKey];
    if (!pubchemFields.has(fieldKey) || orig === undefined || currentVal === orig) return null;
    return (
      <p className="mt-1 flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-500">
        <svg className="h-3 w-3 shrink-0" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
        </svg>
        Opgehaald: <span className="font-semibold">{orig}</span> — handmatig aangepast
      </p>
    );
  }

  const isLiquidOrGas =
    s.aggregateState === 'vapor-liquid' ||
    s.aggregateState === 'liquid' ||
    s.aggregateState === 'gas';
  const isPowder = s.aggregateState === 'solid-powder';

  return (
    <div className="rounded-xl border border-orange-200 bg-orange-50/40 p-6 dark:border-orange-800/40 dark:bg-orange-900/10">
      <h4 className="mb-6 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
        {s.productName ? `Stof: ${s.productName}` : 'Nieuwe stof'}
      </h4>

      <div className="space-y-8">
        {/* ── Identificatie ─────────────────────────────────────────────── */}
        <section>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Identificatie
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel hint={H.productName} required>Productnaam</FieldLabel>
              <input
                type="text"
                value={s.productName}
                onChange={(e) => field({ productName: e.target.value })}
                placeholder="Bijv. Tolueen, Kwartsstof, Isocyanaat"
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-orange-400"
              />
            </div>
            <div>
              <FieldLabel hint={H.iupacName} showPubChem={pubchemFields.has('iupacName')}><Abbr id="IUPAC">IUPAC</Abbr>-naam</FieldLabel>
              <input
                type="text"
                value={s.iupacName ?? ''}
                onChange={(e) => field({ iupacName: e.target.value })}
                placeholder="Systematische naam"
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-orange-400"
              />
              {overrideWarn('iupacName', s.iupacName ?? '')}
            </div>
            <div>
              <FieldLabel hint={H.casNr}>CAS-nummer</FieldLabel>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={s.casNr ?? ''}
                  onChange={(e) => field({ casNr: e.target.value })}
                  placeholder="Bijv. 108-88-3"
                  className="min-w-0 flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-orange-400"
                />
                <button
                  type="button"
                  onClick={handleLookup}
                  disabled={lookupStatus === 'loading' || (!s.casNr && !s.productName)}
                  title="Stofeigenschappen opzoeken via PubChem + SZW/EU-OEL-grenswaarden (internet vereist voor PubChem)"
                  className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-blue-700 dark:hover:bg-blue-600"
                >
                  {lookupStatus === 'loading' ? (
                    <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                  ) : (
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z" />
                    </svg>
                  )}
                  Opzoeken
                </button>
              </div>
            </div>
            <div>
              <FieldLabel hint={H.egNr} showPubChem={pubchemFields.has('egNr')}><abbr title="Europees gemeenschapsnummer (EINECS/ELINCS)">EG</abbr>-nummer</FieldLabel>
              <input
                type="text"
                value={s.egNr ?? ''}
                onChange={(e) => field({ egNr: e.target.value })}
                placeholder="Bijv. 203-625-9"
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-orange-400"
              />
              {overrideWarn('egNr', s.egNr ?? '')}
            </div>
            <div>
              <FieldLabel hint={H.reachNr}><Abbr id="REACH">REACH</Abbr>-registratienummer</FieldLabel>
              <input
                type="text"
                value={s.reachNr ?? ''}
                onChange={(e) => field({ reachNr: e.target.value })}
                placeholder="01-XXXXXXXXXXXXXXXX-XX"
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-orange-400"
              />
            </div>
            <div className="flex items-center">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                <input
                  type="checkbox"
                  checked={s.sdsAvailable}
                  onChange={(e) => field({ sdsAvailable: e.target.checked })}
                  className="accent-orange-500"
                />
                <Abbr id="VIB">VIB</Abbr>/<Abbr id="SDS">SDS</Abbr> beschikbaar en actueel
                <FieldHint sources={H.sdsAvailable} />
              </label>
            </div>
          </div>

          {/* Lookup status */}
          {lookupStatus === 'not-found' && (
            <p className="mt-3 text-xs text-red-500 dark:text-red-400">
              Niet gevonden. Controleer het CAS-nummer of vul de productnaam in als alternatief.
            </p>
          )}
          {lookupStatus === 'error' && (
            <p className="mt-3 text-xs text-red-500 dark:text-red-400">
              Ophalen mislukt. Controleer uw internetverbinding en probeer opnieuw.
            </p>
          )}
          {lookupStatus === 'found' && lookupFilled.length === 0 && lookupConflicts.length === 0 && (
            <p className="mt-3 text-xs text-zinc-400 dark:text-zinc-500">
              Opgehaald — alle velden waren al ingevuld en komen overeen.
            </p>
          )}

          {/* Afwijkingen */}
          {lookupConflicts.length > 0 && (
            <div className="mt-3 space-y-2">
              {lookupConflicts.map((c) => (
                <div key={c.field} className="rounded-lg border border-orange-200 bg-orange-50 p-3 dark:border-orange-800/50 dark:bg-orange-900/15">
                  <p className="mb-1.5 text-xs font-semibold text-orange-800 dark:text-orange-300">
                    Afwijking: {c.label}
                  </p>
                  <div className="mb-2 grid gap-1 text-xs">
                    <div className="flex gap-2">
                      <span className="w-24 shrink-0 text-zinc-500 dark:text-zinc-400">Huidig:</span>
                      <span className="text-zinc-700 dark:text-zinc-300">{c.current}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="w-24 shrink-0 text-zinc-500 dark:text-zinc-400">Opgehaald:</span>
                      <span className="font-medium text-orange-800 dark:text-orange-300">{c.fromPubChem}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        // Apply against current s (not stale closure) to prevent overwriting other patched fields
                        onChange({ ...s, ...c.applyPatch });
                        if (c.addToPubchemFields.length > 0)
                          setPubchemFields((prev) => new Set([...prev, ...c.addToPubchemFields]));
                        if (Object.keys(c.addToPubchemOriginals).length > 0)
                          setPubchemOriginals((prev) => ({ ...prev, ...c.addToPubchemOriginals }));
                        setLookupConflicts((prev) => prev.filter((x) => x.field !== c.field));
                      }}
                      className="rounded border border-orange-300 bg-orange-100 px-2.5 py-1 text-xs font-medium text-orange-800 transition hover:bg-orange-200 dark:border-orange-700 dark:bg-orange-900/30 dark:text-orange-300 dark:hover:bg-orange-900/50"
                    >
                      Opgehaald gebruiken
                    </button>
                    <button
                      type="button"
                      onClick={() => setLookupConflicts((prev) => prev.filter((x) => x.field !== c.field))}
                      className="rounded border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                    >
                      Huidig behouden
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── CLP-gevaarseigenschappen ───────────────────────────────────── */}
        <section>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            <Abbr id="CLP">CLP</Abbr>-gevaarseigenschappen (<Abbr id="VIB">VIB</Abbr> rubriek 2)
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <FieldLabel hint={H.hStatements} showPubChem={pubchemFields.has('hStatements')}>H-zinnen (kommagescheiden)</FieldLabel>
              <input
                type="text"
                value={s.hStatements}
                onChange={(e) => handleHStatementsChange(e.target.value)}
                placeholder="Bijv. H225, H315, H319, H336"
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-orange-400"
              />
              {overrideWarn('hStatements', s.hStatements)}
            </div>

            <div>
              <FieldLabel hint={H.cmrCategory} showPubChem={pubchemFields.has('cmrCategory')}>CMR-categorie</FieldLabel>
              <select
                value={s.cmrCategory}
                onChange={(e) => field({ cmrCategory: e.target.value as CMRCategory })}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-orange-400"
              >
                <option value="none">Geen CMR</option>
                <option value="1A">Cat. 1A — bewezen (H340/H350/H360)</option>
                <option value="1B">Cat. 1B — vermoedelijk (H341/H351/H361)</option>
                <option value="2">Cat. 2 — verdacht</option>
              </select>
              {overrideWarn('cmrCategory', s.cmrCategory)}
            </div>

            <div className="flex flex-col gap-2 pt-5">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                <input
                  type="checkbox"
                  checked={s.isSensitizing}
                  onChange={(e) => field({ isSensitizing: e.target.checked })}
                  className="accent-orange-500"
                />
                Sensibiliserend — H317/H334
                <FieldHint sources={H.isSensitizing} />
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                <input
                  type="checkbox"
                  checked={s.skinNotation}
                  onChange={(e) => field({ skinNotation: e.target.checked })}
                  className="accent-orange-500"
                />
                H-notatie / skin — huidopname relevant
                <FieldHint sources={H.skinNotation} />
              </label>
            </div>
          </div>

          {(s.cmrCategory === '1A' || s.cmrCategory === '1B') && (
            <div className="mt-3 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 dark:bg-red-900/20">
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <p className="text-xs text-red-700 dark:text-red-400">
                <strong><Abbr id="CMR">CMR</Abbr> {s.cmrCategory}:</strong> Wettelijk verplichte aanvullende maatregelen —
                vervangingsonderzoek, gesloten systeem, blootstellingsregister en medisch toezicht
                (Art. 4.15–4.21 Arbobesluit).
              </p>
            </div>
          )}
        </section>

        {/* ── Fysisch-chemisch ──────────────────────────────────────────── */}
        <section>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Fysisch-chemische eigenschappen (VIB rubriek 9)
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <FieldLabel hint={H.aggregateState} showPubChem={pubchemFields.has('aggregateState')}>Aggregatietoestand</FieldLabel>
              <select
                value={s.aggregateState}
                onChange={(e) => field({ aggregateState: e.target.value as AggregateState })}
                className="w-full h-10 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-orange-400"
              >
                <option value="gas">Gas</option>
                <option value="vapor-liquid">Damp / vloeistof (hoge dampdruk)</option>
                <option value="liquid">Vloeistof (lage dampdruk)</option>
                <option value="solid-powder">Vaste stof / poeder</option>
                <option value="aerosol">Aerosol / nevel</option>
              </select>
              {overrideWarn('aggregateState', s.aggregateState)}
            </div>
            {isLiquidOrGas && (
              <div>
                <FieldLabel hint={H.vapourPressure} showPubChem={pubchemFields.has('vapourPressure')}>Damspanning bij 20°C</FieldLabel>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={s.vapourPressure ?? ''}
                    onChange={(e) => field({ vapourPressure: e.target.value ? parseFloat(e.target.value) : undefined })}
                    placeholder="Waarde"
                    className="min-w-0 flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-orange-400"
                  />
                  <select
                    value={s.vapourPressureUnit ?? 'kPa'}
                    onChange={(e) => field({ vapourPressureUnit: e.target.value as Substance['vapourPressureUnit'] })}
                    className="rounded-lg border border-zinc-200 px-2 py-2 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-orange-400"
                  >
                    <option value="Pa">Pa</option>
                    <option value="kPa">kPa</option>
                    <option value="bar">bar</option>
                    <option value="mbar">mbar</option>
                    <option value="mmHg">mmHg</option>
                  </select>
                </div>
                {overrideWarn('vapourPressure', s.vapourPressure !== undefined ? `${s.vapourPressure} ${s.vapourPressureUnit ?? 'kPa'}` : '')}
              </div>
            )}
            {isLiquidOrGas && (
              <div>
                <FieldLabel hint={H.boilingPoint} showPubChem={pubchemFields.has('boilingPoint')}>Kookpunt (°C)</FieldLabel>
                <input
                  type="number"
                  step="any"
                  value={s.boilingPoint ?? ''}
                  onChange={(e) => field({ boilingPoint: e.target.value ? parseFloat(e.target.value) : undefined })}
                  placeholder="Bijv. 110"
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-orange-400"
                />
                {overrideWarn('boilingPoint', s.boilingPoint !== undefined ? `${s.boilingPoint} °C` : '')}
              </div>
            )}
            {isPowder && (
              <div>
                <FieldLabel hint={H.dustiness}>Stuifpotentieel</FieldLabel>
                <select
                  value={s.dustiness ?? ''}
                  onChange={(e) => field({ dustiness: (e.target.value as Substance['dustiness']) || undefined })}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-orange-400"
                >
                  <option value="">Onbekend</option>
                  <option value="low">Laag (korrelig, weinig stof)</option>
                  <option value="medium">Middel (fijn poeder)</option>
                  <option value="high">Hoog (licht poeder, sterk verstuivend)</option>
                </select>
              </div>
            )}
          </div>
        </section>

        {/* ── Grenswaarden ─────────────────────────────────────────────── */}
        <section>
          <div className="mb-3 flex items-baseline justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Grenswaarden (<Abbr id="OELV">OELV</Abbr>)
            </p>
            <span
              className="shrink-0 text-[10px] text-zinc-300 dark:text-zinc-600"
              title={`${SZW_SOURCE} | ${EU_OEL_SOURCE}`}
            >
              SZW {SZW_VERSION} · EU-OEL {EU_OEL_VERSION}
            </span>
          </div>

          <div className="space-y-3">
            {s.oels.map((oel, idx) => (
              <OELRow
                key={idx}
                oel={oel}
                onChange={(updated) => updateOEL(idx, updated)}
                onRemove={() => removeOEL(idx)}
                showRemove={s.oels.length > 1}
              />
            ))}
            <button
              onClick={addOEL}
              className="flex items-center gap-1.5 rounded-lg border border-dashed border-zinc-300 px-4 py-2 text-sm text-zinc-500 transition hover:border-orange-400 hover:text-orange-600 dark:border-zinc-600 dark:text-zinc-400 dark:hover:border-orange-500 dark:hover:text-orange-400"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Grenswaarde toevoegen
            </button>
          </div>
        </section>

        {/* ── Bijzonderheden ────────────────────────────────────────────── */}
        <section>
          <div className="flex gap-4">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={s.isAtex}
                onChange={(e) => field({ isAtex: e.target.checked })}
                className="accent-orange-500"
              />
              <Abbr id="ATEX">ATEX</Abbr>-relevant
              <FieldHint sources={H.isAtex} />
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={s.isArie}
                onChange={(e) => field({ isArie: e.target.checked })}
                className="accent-orange-500"
              />
              <Abbr id="ARIE">ARIE</Abbr>-relevant
              <FieldHint sources={H.isArie} />
            </label>
          </div>

          {/* ATEX suggestie */}
          {(() => {
            const hint = getAtexSuggestion(s);
            if (!hint) return null;
            return (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 dark:border-amber-800/40 dark:bg-amber-900/15">
                <svg className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                <p className="text-xs text-amber-800 dark:text-amber-300"><strong>ATEX suggestie:</strong> {hint}</p>
              </div>
            );
          })()}

          {/* BRZO 2015 drempelwaarden — automatisch bepaald o.b.v. H-zinnen + fysische data */}
          {(() => {
            const cats = getBRZOCategories(s);
            if (cats.length === 0) return null;
            return (
              <div className="mt-3 rounded-lg border border-zinc-200 dark:border-zinc-700">
                <div className="flex items-center justify-between rounded-t-lg border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800/60">
                  <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                    BRZO 2015 bijlage 1 deel 2 — indicatieve drempelwaarden
                  </p>
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500">Controleer ook deel 1 (stofspecifiek op CAS)</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-zinc-100 dark:border-zinc-700">
                        <th className="px-3 py-1.5 text-left font-medium text-zinc-500 dark:text-zinc-400">Gevaarcategorie</th>
                        <th className="px-3 py-1.5 text-left font-medium text-zinc-500 dark:text-zinc-400">Basis</th>
                        <th className="px-3 py-1.5 text-right font-medium text-zinc-500 dark:text-zinc-400">Kolom 1 (ton)</th>
                        <th className="px-3 py-1.5 text-right font-medium text-zinc-500 dark:text-zinc-400">Kolom 2 (ton)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cats.map((cat) => (
                        <tr key={cat.id} className="border-b border-zinc-50 last:border-0 dark:border-zinc-800">
                          <td className="px-3 py-1.5 text-zinc-700 dark:text-zinc-300">
                            <span className="font-medium">[{cat.id}]</span> {cat.label}
                            {cat.note && <p className="mt-0.5 text-[10px] text-zinc-400 dark:text-zinc-500 italic">{cat.note}</p>}
                          </td>
                          <td className="px-3 py-1.5 font-mono text-zinc-500 dark:text-zinc-400">{cat.basis}</td>
                          <td className="px-3 py-1.5 text-right font-semibold text-zinc-800 dark:text-zinc-200">{cat.kolom1.toLocaleString('nl-NL')}</td>
                          <td className="px-3 py-1.5 text-right font-semibold text-zinc-800 dark:text-zinc-200">{cat.kolom2.toLocaleString('nl-NL')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="rounded-b-lg border-t border-zinc-100 bg-zinc-50/50 px-3 py-1.5 text-[10px] text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800/30 dark:text-zinc-500">
                  ARIE-plichtig bij aanwezigheid ≥ 10% van kolom 1 · BRZO-plichtig bij ≥ kolom 1 · Hogere verplichtingen bij ≥ kolom 2
                </p>
              </div>
            );
          })()}

          {s.isAtex && (
            <div className="mt-4 rounded-lg border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/40">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                <Abbr id="ATEX">ATEX</Abbr>-gegevens (<Abbr id="VIB">VIB</Abbr> rubriek 9)
              </p>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <FieldLabel hint={H.flashPoint} showPubChem={pubchemFields.has('flashPoint')}>Vlampunt (°C)</FieldLabel>
                  <input
                    type="number"
                    step="any"
                    value={s.flashPoint ?? ''}
                    onChange={(e) => field({ flashPoint: e.target.value ? parseFloat(e.target.value) : undefined })}
                    placeholder="Bijv. 23"
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-orange-400"
                  />
                  {overrideWarn('flashPoint', s.flashPoint !== undefined ? `${s.flashPoint} °C` : '')}
                </div>
                <div>
                  <FieldLabel hint={H.lel} showPubChem={pubchemFields.has('lel')}><Abbr id="LEL">LEL</Abbr> (% vol)</FieldLabel>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={s.lel ?? ''}
                    onChange={(e) => field({ lel: e.target.value ? parseFloat(e.target.value) : undefined })}
                    placeholder="Bijv. 1.0"
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-orange-400"
                  />
                  {overrideWarn('lel', s.lel !== undefined ? `${s.lel} % vol` : '')}
                </div>
                <div>
                  <FieldLabel hint={H.uel} showPubChem={pubchemFields.has('uel')}><Abbr id="UEL">UEL</Abbr> (% vol)</FieldLabel>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={s.uel ?? ''}
                    onChange={(e) => field({ uel: e.target.value ? parseFloat(e.target.value) : undefined })}
                    placeholder="Bijv. 7.0"
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-orange-400"
                  />
                  {overrideWarn('uel', s.uel !== undefined ? `${s.uel} % vol` : '')}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ── Opmerkingen ──────────────────────────────────────────────── */}
        <div>
          <FieldLabel hint={H.notes}>Opmerkingen</FieldLabel>
          <textarea
            rows={2}
            value={s.notes ?? ''}
            onChange={(e) => field({ notes: e.target.value })}
            placeholder="Toxicologische bijzonderheden, historische context, links naar ECHA-dossier…"
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-orange-400"
          />
        </div>

        {/* ── Actions ───────────────────────────────────────────────────── */}
        <div className="flex justify-end gap-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
          <button
            onClick={onCancel}
            className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            Annuleren
          </button>
          <button
            onClick={onSave}
            disabled={!s.productName.trim()}
            className="rounded-lg bg-orange-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-40"
          >
            Stof opslaan
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── CMR badge ────────────────────────────────────────────────────────────────

function CMRBadge({ category }: { category: CMRCategory }) {
  if (category === 'none') return null;
  const colors = {
    '1A': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    '1B': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    '2': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${colors[category]}`}>
      CMR {category}
    </span>
  );
}

// ─── Step2_Substances ─────────────────────────────────────────────────────────

export default function Step2_Substances({ investigation, onUpdate }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftSubstance, setDraftSubstance] = useState<Substance | null>(null);

  const substances = investigation.substances;

  function startAdd() {
    setDraftSubstance(emptySubstance());
    setEditingId('__new__');
  }

  function startEdit(s: Substance) {
    setDraftSubstance({ ...s });
    setEditingId(s.id);
  }

  function cancelEdit() {
    setEditingId(null);
    setDraftSubstance(null);
  }

  function saveSubstance() {
    if (!draftSubstance) return;
    if (editingId === '__new__') {
      onUpdate({ substances: [...substances, draftSubstance] });
    } else {
      onUpdate({ substances: substances.map((s) => (s.id === draftSubstance.id ? draftSubstance : s)) });
    }
    setEditingId(null);
    setDraftSubstance(null);
  }

  function deleteSubstance(id: string) {
    onUpdate({ substances: substances.filter((s) => s.id !== id) });
    if (editingId === id) cancelEdit();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Stap 2 — Volledige stoffeninventarisatie
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          Leg alle gevaarlijke stoffen vast conform Arbobesluit hoofdstuk 4 en <Abbr id="REACH">REACH</Abbr> bijlage II.
          Per stof: identificatie, <Abbr id="CLP">CLP</Abbr>-indeling, fysisch-chemische eigenschappen en grenswaarden.
          Klik het <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-zinc-300 align-middle text-xs text-zinc-400">ℹ</span>-icoon
          naast een veld voor bronnen en referenties.
        </p>
      </div>

      {substances.length > 0 && (
        <div className="space-y-3">
          {substances.map((s) => (
            <div key={s.id}>
              {editingId === s.id && draftSubstance ? (
                <SubstanceForm
                  substance={draftSubstance}
                  onChange={setDraftSubstance}
                  onCancel={cancelEdit}
                  onSave={saveSubstance}
                />
              ) : (
                <div className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-zinc-50 px-5 py-4 dark:border-zinc-700 dark:bg-zinc-800/50">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-zinc-900 dark:text-zinc-50">{s.productName}</span>
                      <CMRBadge category={s.cmrCategory} />
                      {s.isSensitizing && (
                        <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                          Sensibiliserend
                        </span>
                      )}
                      {!s.sdsAvailable && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600 dark:bg-red-900/30 dark:text-red-400">
                          VIB ontbreekt
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                      {s.casNr && <span>CAS: {s.casNr}</span>}
                      <span>{s.aggregateState}</span>
                      {s.oels.filter((o) => o.type !== 'none' && o.value).map((o, i) => (
                        <span key={i}>OEL ({o.type.toUpperCase()}): {o.value} {o.unit}</span>
                      ))}
                      {s.hStatements && <span>H: {s.hStatements}</span>}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => startEdit(s)}
                      className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-white dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-700"
                    >
                      Bewerken
                    </button>
                    <button
                      onClick={() => deleteSubstance(s.id)}
                      className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-red-500 transition hover:bg-red-50 dark:border-zinc-600 dark:hover:bg-red-900/20"
                    >
                      Verwijderen
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {editingId === '__new__' && draftSubstance && (
        <SubstanceForm
          substance={draftSubstance}
          onChange={setDraftSubstance}
          onCancel={cancelEdit}
          onSave={saveSubstance}
        />
      )}

      {editingId === null && (
        <button
          onClick={startAdd}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 py-4 text-sm font-medium text-zinc-500 transition hover:border-orange-400 hover:bg-orange-50 hover:text-orange-600 dark:border-zinc-700 dark:hover:border-orange-600 dark:hover:bg-orange-900/10 dark:hover:text-orange-400"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Stof toevoegen
        </button>
      )}

      {substances.length === 0 && editingId === null && (
        <p className="text-center text-sm text-zinc-400 dark:text-zinc-500">
          Nog geen stoffen toegevoegd. Klik hierboven om de eerste stof toe te voegen.
        </p>
      )}

      {substances.length > 0 && (
        <div className="rounded-lg bg-zinc-50 px-4 py-3 text-xs text-zinc-500 dark:bg-zinc-800/50 dark:text-zinc-400">
          <strong>{substances.length} stof{substances.length !== 1 ? 'fen' : ''}</strong> in het register.
          {substances.some((s) => s.cmrCategory === '1A' || s.cmrCategory === '1B') && (
            <span className="ml-2 text-red-600 dark:text-red-400">
              ⚠ CMR 1A/1B aanwezig — wettelijke aanvullende maatregelen verplicht.
            </span>
          )}
        </div>
      )}
    </div>
  );
}
