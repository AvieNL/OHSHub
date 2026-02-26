'use client';

import { useState } from 'react';
import type { ClimateInvestigation, ClimateInstrument, ClimateInstrumentType } from '@/lib/climate-investigation-types';
import { newClimateId } from '@/lib/climate-investigation-storage';
import { Abbr } from '@/components/Abbr';
import { InfoBox } from '@/components/InfoBox';

interface Props {
  investigation: ClimateInvestigation;
  onUpdate: (partial: Partial<ClimateInvestigation>) => void;
}

const INSTRUMENT_TYPE_LABELS: Record<ClimateInstrumentType, string> = {
  'wbgt-meter':         'WBGT-meter (direct reading)',
  'globe-thermometer':  'Globethermometer (ø 150 mm zwarte bol)',
  'anemometer':         'Luchtsnelheidsmeter (anemometer)',
  'psychrometer':       'Psychrometer (natte/droge bol)',
  'hygro-thermometer':  'Hygro-thermometer (T + RH)',
  'infrared':           'Infraroodthermometer (oppervlaktetemperaturen)',
  'radiant-asymmetry':  'Planaire stralingsthermometer (stralingsasymmetrie)',
  'pmv-meter':          'Directe PMV-meter',
  'other':              'Overige',
};

const REQUIRED_BY_SCENARIO: Record<ClimateInstrumentType, string[]> = {
  'wbgt-meter':        ['heat'],
  'globe-thermometer': ['comfort', 'heat', 'cold'],
  'anemometer':        ['comfort', 'local'],
  'psychrometer':      ['comfort', 'heat'],
  'hygro-thermometer': ['comfort', 'heat', 'cold'],
  'infrared':          ['local'],
  'radiant-asymmetry': ['local'],
  'pmv-meter':         ['comfort'],
  'other':             [],
};

function InstrumentCard({
  instrument,
  onUpdate,
  onRemove,
}: {
  instrument: ClimateInstrument;
  onUpdate: (updated: ClimateInstrument) => void;
  onRemove: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const INPUT = 'w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-orange-400';

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/30">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <button
          type="button"
          onClick={() => setExpanded((o) => !o)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <svg className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform ${expanded ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {INSTRUMENT_TYPE_LABELS[instrument.type]}
            </p>
            {(instrument.manufacturer || instrument.model) && (
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                {[instrument.manufacturer, instrument.model].filter(Boolean).join(' ')}
                {instrument.serialNumber && ` — S/N: ${instrument.serialNumber}`}
              </p>
            )}
            {instrument.lastCalibration && (
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                Gekalibreerd: {new Date(instrument.lastCalibration).toLocaleDateString('nl-NL')}
              </p>
            )}
          </div>
        </button>
        <button onClick={onRemove} className="shrink-0 text-xs text-zinc-400 hover:text-red-500">
          Verwijderen
        </button>
      </div>

      {expanded && (
        <div className="border-t border-zinc-200 px-4 pb-4 pt-3 dark:border-zinc-700">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Type instrument</label>
              <select
                value={instrument.type}
                onChange={(e) => onUpdate({ ...instrument, type: e.target.value as ClimateInstrumentType })}
                className={INPUT}
              >
                {Object.entries(INSTRUMENT_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Fabrikant</label>
              <input type="text" value={instrument.manufacturer ?? ''} onChange={(e) => onUpdate({ ...instrument, manufacturer: e.target.value })} placeholder="Bijv. Brüel & Kjær" className={INPUT} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Model</label>
              <input type="text" value={instrument.model ?? ''} onChange={(e) => onUpdate({ ...instrument, model: e.target.value })} placeholder="Bijv. 1213" className={INPUT} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Serienummer</label>
              <input type="text" value={instrument.serialNumber ?? ''} onChange={(e) => onUpdate({ ...instrument, serialNumber: e.target.value })} placeholder="S/N" className={INPUT} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Datum laatste kalibratie</label>
              <input type="date" value={instrument.lastCalibration ?? ''} onChange={(e) => onUpdate({ ...instrument, lastCalibration: e.target.value })} className={INPUT} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Kalibratiereference / certificaatnummer</label>
              <input type="text" value={instrument.calibrationRef ?? ''} onChange={(e) => onUpdate({ ...instrument, calibrationRef: e.target.value })} placeholder="Cert. nr." className={INPUT} />
            </div>
          </div>
          <div className="mt-3">
            <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Opmerkingen</label>
            <input type="text" value={instrument.notes ?? ''} onChange={(e) => onUpdate({ ...instrument, notes: e.target.value })} placeholder="Bijv. windscherm aanwezig, uitgebreid bereik" className={INPUT} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function ClimateStep4_Equipment({ investigation, onUpdate }: Props) {
  const { instruments, scenarios } = investigation;

  function addInstrument(type: ClimateInstrumentType) {
    onUpdate({ instruments: [...instruments, { id: newClimateId(), type }] });
  }

  function updateInstrument(updated: ClimateInstrument) {
    onUpdate({ instruments: instruments.map((i) => (i.id === updated.id ? updated : i)) });
  }

  function removeInstrument(id: string) {
    onUpdate({ instruments: instruments.filter((i) => i.id !== id) });
  }

  // Bepaal aanbevolen instrumenten op basis van geselecteerde scenario's
  const recommended = (Object.keys(REQUIRED_BY_SCENARIO) as ClimateInstrumentType[]).filter(
    (t) => REQUIRED_BY_SCENARIO[t].some((s) => scenarios.includes(s as ClimateScenario)),
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Stap 5 — Meetapparatuur
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          Registreer de gebruikte meetinstrumenten inclusief kalibratiestatus. Correcte kalibratie
          is vereist voor herleidbare meetresultaten.
        </p>
      </div>

      <InfoBox title="ISO 7726:1998 — Meetinstrumenten voor thermische omgevingen">
        <Abbr id="ISO7726">ISO 7726:1998</Abbr> specificeert de vereisten voor meetinstrumenten voor
        fysische grootheden in thermische omgevingen (t_a, t_g, t_r, v_a, RH). Kalibratie conform
        nationale normen (NMi / ISO/IEC 17025) is vereist voor normatieve beoordelingen.
      </InfoBox>

      {/* Aanbevolen instrumenten op basis van scenario's */}
      {scenarios.length > 0 && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-800/40 dark:bg-blue-900/10">
          <p className="mb-2 text-xs font-semibold text-blue-700 dark:text-blue-400">
            Aanbevolen apparatuur voor geselecteerde scenario&apos;s
          </p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(INSTRUMENT_TYPE_LABELS) as ClimateInstrumentType[]).filter((t) =>
              REQUIRED_BY_SCENARIO[t].some((s) => scenarios.includes(s as ClimateScenario)),
            ).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => addInstrument(t)}
                className="flex items-center gap-1.5 rounded-lg border border-blue-300 bg-white px-2.5 py-1 text-xs font-medium text-blue-700 transition hover:bg-blue-100 dark:border-blue-700 dark:bg-zinc-800 dark:text-blue-400 dark:hover:bg-blue-900/20"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                {INSTRUMENT_TYPE_LABELS[t]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Instrument list */}
      {instruments.length > 0 && (
        <div className="space-y-3">
          {instruments.map((inst) => (
            <InstrumentCard
              key={inst.id}
              instrument={inst}
              onUpdate={updateInstrument}
              onRemove={() => removeInstrument(inst.id)}
            />
          ))}
        </div>
      )}

      {/* Add any instrument */}
      <div>
        <p className="mb-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">Instrument toevoegen</p>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(INSTRUMENT_TYPE_LABELS) as ClimateInstrumentType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => addInstrument(t)}
              className="flex items-center gap-1.5 rounded-lg border border-dashed border-zinc-300 px-2.5 py-1.5 text-xs text-zinc-500 transition hover:border-orange-400 hover:text-orange-600 dark:border-zinc-600 dark:text-zinc-400 dark:hover:border-orange-500 dark:hover:text-orange-400"
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              {INSTRUMENT_TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      {instruments.length === 0 && (
        <p className="text-center text-sm text-zinc-400 dark:text-zinc-500">
          Nog geen meetapparatuur geregistreerd.
        </p>
      )}
    </div>
  );
}

// Re-export for type usage in component
type ClimateScenario = 'comfort' | 'heat' | 'cold' | 'local';
