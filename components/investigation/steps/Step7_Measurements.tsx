'use client';

import { useState } from 'react';
import type { Investigation, MeasurementSeries, SingleMeasurement } from '@/lib/investigation-types';
import { newId } from '@/lib/investigation-storage';

interface Props {
  investigation: Investigation;
  onUpdate: (partial: Partial<Investigation>) => void;
}

function parseValues(raw: string): number[] {
  return raw
    .split(/[,;\s\n]+/)
    .map((s) => parseFloat(s.trim()))
    .filter((n) => !isNaN(n) && n > 0);
}

function SeriesPanel({
  planId,
  planLabel,
  series,
  onSave,
}: {
  planId: string;
  planLabel: string;
  series?: MeasurementSeries;
  onSave: (s: MeasurementSeries) => void;
}) {
  const existing = series ?? {
    id: newId(),
    planId,
    measurements: [],
  };
  const dist = existing.distribution ?? 'log-normal';

  const [bulkText, setBulkText] = useState(() =>
    existing.measurements.map((m) => m.value).join(', '),
  );
  const [rows, setRows] = useState<SingleMeasurement[]>(() =>
    existing.measurements.length > 0
      ? existing.measurements
      : [],
  );
  const [useRowMode, setUseRowMode] = useState(existing.measurements.length > 0);

  function parseBulk() {
    const vals = parseValues(bulkText);
    const newRows: SingleMeasurement[] = vals.map((v) => ({
      id: newId(),
      value: v,
      excluded: false,
    }));
    setRows(newRows);
    setUseRowMode(true);
    onSave({
      ...existing,
      measurements: newRows,
      statistics: undefined,
    });
  }

  function toggleExclude(id: string) {
    const updated = rows.map((r) =>
      r.id === id ? { ...r, excluded: !r.excluded } : r,
    );
    setRows(updated);
    onSave({ ...existing, measurements: updated, statistics: undefined });
  }

  function updateConditions(id: string, conditions: string) {
    const updated = rows.map((r) => (r.id === id ? { ...r, conditions } : r));
    setRows(updated);
    onSave({ ...existing, measurements: updated, statistics: undefined });
  }

  function addRow() {
    const r: SingleMeasurement = { id: newId(), value: 0, excluded: false };
    const updated = [...rows, r];
    setRows(updated);
    onSave({ ...existing, measurements: updated, statistics: undefined });
  }

  function updateValue(id: string, val: string) {
    const updated = rows.map((r) => (r.id === id ? { ...r, value: parseFloat(val) || 0 } : r));
    setRows(updated);
    onSave({ ...existing, measurements: updated, statistics: undefined });
  }

  function removeRow(id: string) {
    const updated = rows.filter((r) => r.id !== id);
    setRows(updated);
    onSave({ ...existing, measurements: updated, statistics: undefined });
  }

  const validRows = rows.filter((r) => !r.excluded && r.value > 0);

  function setDistribution(d: 'log-normal' | 'normal') {
    onSave({ ...existing, measurements: rows, distribution: d, statistics: undefined });
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/30">
      <div className="border-b border-zinc-200 px-5 py-3 dark:border-zinc-700">
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{planLabel}</p>
        <p className="text-xs text-zinc-400">{rows.length} meting{rows.length !== 1 ? 'en' : ''} ingevoerd{validRows.length < rows.length ? ` (${rows.length - validRows.length} uitgesloten)` : ''}</p>
      </div>

      <div className="p-5">
        {/* Bulk mode */}
        {!useRowMode && (
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Meetwaarden — komma- of spatiescheiding (zelfde eenheid als OELV)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder="Bijv. 0.12, 0.34, 0.28, 0.45, 0.19, 0.31"
                className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-orange-400"
              />
              <button
                onClick={parseBulk}
                disabled={!parseValues(bulkText).length}
                className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-40"
              >
                Importeren
              </button>
            </div>
            <p className="mt-1 text-xs text-zinc-400">
              Of voer meetwaarden handmatig in per rij:
              <button
                onClick={() => setUseRowMode(true)}
                className="ml-1 text-orange-500 hover:text-orange-700 dark:hover:text-orange-300"
              >
                Rij-modus
              </button>
            </p>
          </div>
        )}

        {/* Verdelingstype (Bijlage F §F.3 / §F.4) */}
        <div className="mb-4 flex items-center gap-2">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Verdeling (Bijlage F):
          </span>
          {(['log-normal', 'normal'] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDistribution(d)}
              className={`rounded-lg border px-3 py-1 text-xs font-medium transition ${
                dist === d
                  ? 'border-orange-400 bg-orange-50 text-orange-700 dark:border-orange-600 dark:bg-orange-900/20 dark:text-orange-300'
                  : 'border-zinc-200 text-zinc-500 hover:border-zinc-300 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600'
              }`}
            >
              {d === 'log-normal' ? 'Log-normaal (§F.3)' : 'Normaal (§F.4)'}
            </button>
          ))}
        </div>

        {/* Row mode */}
        {useRowMode && (
          <div className="space-y-3">
            <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-800/50">
                    <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">#</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">Waarde</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">Omstandigheden</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">Uitsluit.</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {rows.map((r, i) => (
                    <tr key={r.id} className={r.excluded ? 'opacity-50' : ''}>
                      <td className="px-3 py-2 text-xs text-zinc-400">{i + 1}</td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          step="any"
                          value={r.value || ''}
                          onChange={(e) => updateValue(r.id, e.target.value)}
                          className="w-20 rounded border border-zinc-200 px-2 py-1 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-orange-400"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={r.conditions ?? ''}
                          onChange={(e) => updateConditions(r.id, e.target.value)}
                          placeholder="Datum, condities…"
                          className="w-full rounded border border-zinc-200 px-2 py-1 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-orange-400"
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={r.excluded ?? false}
                          onChange={() => toggleExclude(r.id)}
                          className="accent-orange-500"
                          title="Uitsluiten van analyse"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <button
                          onClick={() => removeRow(r.id)}
                          className="text-zinc-400 hover:text-red-500"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={addRow}
                className="flex items-center gap-1.5 rounded-lg border border-dashed border-zinc-300 px-4 py-2 text-sm text-zinc-500 transition hover:border-orange-400 hover:text-orange-600 dark:border-zinc-600 dark:text-zinc-400 dark:hover:border-orange-500 dark:hover:text-orange-400"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Meting toevoegen
              </button>
              <button
                onClick={() => { setUseRowMode(false); setBulkText(rows.filter(r => !r.excluded).map(r => r.value).join(', ')); }}
                className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                Bulk-modus
              </button>
            </div>

            {validRows.length >= 3 && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400">
                ✓ {validRows.length} geldige metingen — statistieken berekend in stap 8.
                {validRows.length < 6 && (
                  <span className="ml-1 text-amber-600 dark:text-amber-400">
                    (NEN-EN 689 volledig: ≥ 6 metingen)
                  </span>
                )}
              </p>
            )}
            {rows.length > 0 && validRows.length < 3 && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Minimaal 3 geldige meetwaarden nodig voor statistische analyse.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Step7_Measurements({ investigation, onUpdate }: Props) {
  const { measurementPlans, measurementSeries, segs, substances } = investigation;

  if (measurementPlans.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Stap 7 — Metingen uitvoeren en vastleggen
        </h2>
        <div className="rounded-lg bg-amber-50 px-4 py-4 text-sm text-amber-700 dark:bg-amber-900/15 dark:text-amber-400">
          Stel eerst meetplannen op in stap 6 (per SEG × stof), dan kunt u hier de meetwaarden invoeren.
        </div>
      </div>
    );
  }

  function getSeriesForPlan(planId: string): MeasurementSeries | undefined {
    return measurementSeries.find((s) => s.planId === planId);
  }

  function saveSeries(updated: MeasurementSeries) {
    const others = measurementSeries.filter((s) => s.planId !== updated.planId);
    onUpdate({ measurementSeries: [...others, updated] });
  }

  function planLabel(plan: typeof measurementPlans[0]): string {
    const seg = segs.find((s) => s.id === plan.segId);
    const sub = substances.find((s) => s.id === plan.substanceId);
    const type = plan.measurementType === '8h-tgg' ? '8-uurs TGG' : plan.measurementType === '15min' ? '15-min STEL' : 'Plafond';
    return `${seg?.name ?? '?'} × ${sub?.productName ?? '?'} (${type})`;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Stap 7 — Metingen uitvoeren en vastleggen
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          Voer per meetplan de meetresultaten in. Kies bulk-invoer (kommagescheiden) of rij-voor-rij.
          Afwijkende metingen kunt u uitsluiten met een onderbouwing. Analyses worden in stap 8 berekend.
        </p>
      </div>

      <div className="rounded-lg bg-zinc-50 px-4 py-3 text-xs text-zinc-500 dark:bg-zinc-800/50 dark:text-zinc-400">
        <strong>NEN-EN 689 §5.3:</strong> Registreer per meting de taakomschrijving, duur, gebruikte stoffen,
        aanwezige PBM, status van ventilatie en eventuele bijzonderheden.
        Uitsluitingen moeten goed onderbouwd worden.
      </div>

      <div className="space-y-4">
        {measurementPlans.map((plan) => (
          <SeriesPanel
            key={plan.id}
            planId={plan.id}
            planLabel={planLabel(plan)}
            series={getSeriesForPlan(plan.id)}
            onSave={saveSeries}
          />
        ))}
      </div>
    </div>
  );
}
