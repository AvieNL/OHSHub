'use client';

import { useState, Fragment } from 'react';
import type {
  SoundInvestigation,
  SoundMeasurement,
  SoundTask,
  MeasurementSeries,
  CalibrationEvent,
} from '@/lib/sound-investigation-types';
import { OCTAVE_BANDS } from '@/lib/sound-ppe';
import { newSoundId } from '@/lib/sound-investigation-storage';
import { downloadMeasurementPlanPDF } from '@/lib/sound-pdf-html';
import { Abbr } from '@/components/Abbr';
import { Formula } from '@/components/Formula';
import { SectionRef } from '@/components/SectionRef';
import { InfoBox } from '@/components/InfoBox';

interface Props {
  investigation: SoundInvestigation;
  onUpdate: (partial: Partial<SoundInvestigation>) => void;
  onGoToStep: (step: number) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseValues(raw: string): number[] {
  return raw
    .split(/[,;\s\n]+/)
    .map((s) => parseFloat(s.trim()))
    .filter((n) => !isNaN(n) && n > 0 && n < 200);
}

/** Drift between pre and post calibration of a series, or null if one is missing. */
function seriesDrift(series: MeasurementSeries): number | null {
  const pre  = series.calibrations.find((c) => c.type === 'pre');
  const post = series.calibrations.find((c) => c.type === 'post');
  if (pre == null || post == null) return null;
  return Math.abs(post.value - pre.value);
}

/** Returns a short readable label for a series (e.g. "Reeks 1"). */
function seriesLabel(series: MeasurementSeries, allSeries: MeasurementSeries[]): string {
  const idx = allSeries.findIndex((s) => s.id === series.id);
  return `Reeks ${idx + 1}`;
}

const SERIES_BADGE_COLORS = [
  'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
];

function seriesBadgeColor(series: MeasurementSeries, allSeries: MeasurementSeries[]): string {
  const idx = allSeries.findIndex((s) => s.id === series.id);
  return SERIES_BADGE_COLORS[idx % SERIES_BADGE_COLORS.length];
}

// ─── Series form ──────────────────────────────────────────────────────────────

interface SeriesFormState {
  instrumentId: string;
  preValue: string;
  preTime: string;
  mids: { id: string; value: string; time: string; reason: string }[];
  postValue: string;
  postTime: string;
  notes: string;
}

function stateFromSeries(series: MeasurementSeries): SeriesFormState {
  const pre  = series.calibrations.find((c) => c.type === 'pre');
  const post = series.calibrations.find((c) => c.type === 'post');
  const mids = series.calibrations.filter((c) => c.type === 'mid');
  return {
    instrumentId: series.instrumentId,
    preValue:  pre  ? String(pre.value)  : '',
    preTime:   pre?.timestamp  ?? '',
    mids: mids.map((m) => ({ id: m.id, value: String(m.value), time: m.timestamp ?? '', reason: m.reason ?? '' })),
    postValue: post ? String(post.value) : '',
    postTime:  post?.timestamp  ?? '',
    notes: series.notes ?? '',
  };
}

function stateToSeries(state: SeriesFormState, base: MeasurementSeries): MeasurementSeries {
  const calibrations: CalibrationEvent[] = [];
  const preVal = parseFloat(state.preValue);
  if (!isNaN(preVal)) {
    calibrations.push({ id: base.calibrations.find((c) => c.type === 'pre')?.id ?? newSoundId(), type: 'pre', value: preVal, timestamp: state.preTime || undefined });
  }
  for (const mid of state.mids) {
    const v = parseFloat(mid.value);
    if (!isNaN(v)) {
      calibrations.push({ id: mid.id, type: 'mid', value: v, timestamp: mid.time || undefined, reason: mid.reason || undefined });
    }
  }
  const postVal = parseFloat(state.postValue);
  if (!isNaN(postVal)) {
    calibrations.push({ id: base.calibrations.find((c) => c.type === 'post')?.id ?? newSoundId(), type: 'post', value: postVal, timestamp: state.postTime || undefined });
  }
  return { ...base, instrumentId: state.instrumentId, calibrations, notes: state.notes || undefined };
}

function SeriesForm({
  initial,
  instrumentOptions,
  onSave,
  onCancel,
  onGoToStep,
}: {
  initial: MeasurementSeries;
  instrumentOptions: { id: string; label: string }[];
  onSave: (updated: MeasurementSeries) => void;
  onCancel: () => void;
  onGoToStep: (step: number) => void;
}) {
  const [state, setState] = useState<SeriesFormState>(() => stateFromSeries(initial));

  function upd(patch: Partial<SeriesFormState>) {
    setState((prev) => ({ ...prev, ...patch }));
  }

  function addMid() {
    upd({ mids: [...state.mids, { id: newSoundId(), value: '', time: '', reason: '' }] });
  }

  function updateMid(id: string, patch: Partial<SeriesFormState['mids'][0]>) {
    upd({ mids: state.mids.map((m) => m.id === id ? { ...m, ...patch } : m) });
  }

  function removeMid(id: string) {
    upd({ mids: state.mids.filter((m) => m.id !== id) });
  }

  // Live drift preview
  const preVal  = parseFloat(state.preValue);
  const postVal = parseFloat(state.postValue);
  const drift   = !isNaN(preVal) && !isNaN(postVal) ? Math.abs(postVal - preVal) : null;

  const INPUT = 'rounded-lg border border-zinc-200 px-3 py-1.5 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100';

  return (
    <div className="space-y-4 rounded-xl border border-orange-200 bg-orange-50/40 p-5 dark:border-orange-800/50 dark:bg-orange-900/10">
      <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Meetserie vastleggen</h4>

      {/* Instrument */}
      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Meetinstrument (<SectionRef id="§12">§12</SectionRef>, Tabel C.5)
        </label>
        {instrumentOptions.length === 0 ? (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            Voeg eerst meetapparatuur toe in{' '}
            <button type="button" onClick={() => onGoToStep(4)} className="cursor-pointer underline decoration-dotted underline-offset-2 hover:no-underline">stap 5</button>.
          </p>
        ) : (
          <select
            value={state.instrumentId}
            onChange={(e) => upd({ instrumentId: e.target.value })}
            className={`w-full ${INPUT}`}
          >
            <option value="">— selecteer instrument —</option>
            {instrumentOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>{opt.label}</option>
            ))}
          </select>
        )}
      </div>

      {/* Calibration before */}
      <div>
        <p className="mb-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400">
          Veldkalibratie vóór meetserie (<SectionRef id="§12.2">§12.2</SectionRef>)
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-zinc-500">Waarde:</label>
            <input
              type="number" step="0.1" min={80} max={120}
              value={state.preValue}
              onChange={(e) => upd({ preValue: e.target.value })}
              placeholder="94.0"
              className={`w-20 ${INPUT}`}
            />
            <span className="text-xs text-zinc-400">dB</span>
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-zinc-500">Tijdstip:</label>
            <input
              type="time"
              value={state.preTime}
              onChange={(e) => upd({ preTime: e.target.value })}
              className={`w-28 ${INPUT}`}
            />
          </div>
        </div>
      </div>

      {/* Mid calibrations */}
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
            Tussencalibraties (optioneel — bijv. na wissel of reparatie)
          </p>
          <button
            onClick={addMid}
            className="flex items-center gap-1 rounded border border-dashed border-zinc-300 px-2 py-0.5 text-xs text-zinc-500 hover:border-orange-400 hover:text-orange-600 dark:border-zinc-600"
          >
            <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Toevoegen
          </button>
        </div>
        <div className="space-y-2">
          {state.mids.map((mid) => (
            <div key={mid.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-amber-200 bg-amber-50/50 px-3 py-2 dark:border-amber-800/30 dark:bg-amber-900/10">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-zinc-500">Waarde:</span>
                <input
                  type="number" step="0.1" min={80} max={120}
                  value={mid.value}
                  onChange={(e) => updateMid(mid.id, { value: e.target.value })}
                  placeholder="94.0"
                  className="w-18 rounded border border-zinc-200 px-2 py-1 text-xs outline-none focus:border-orange-400 dark:border-zinc-700 dark:bg-zinc-800"
                />
                <span className="text-xs text-zinc-400">dB</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-zinc-500">Tijdstip:</span>
                <input
                  type="time"
                  value={mid.time}
                  onChange={(e) => updateMid(mid.id, { time: e.target.value })}
                  className="w-24 rounded border border-zinc-200 px-2 py-1 text-xs outline-none focus:border-orange-400 dark:border-zinc-700 dark:bg-zinc-800"
                />
              </div>
              <div className="flex flex-1 items-center gap-1.5">
                <span className="text-xs text-zinc-500">Reden:</span>
                <input
                  type="text"
                  value={mid.reason}
                  onChange={(e) => updateMid(mid.id, { reason: e.target.value })}
                  placeholder="Bijv. microfoon gewisseld, instrument gevallen…"
                  className="flex-1 rounded border border-zinc-200 px-2 py-1 text-xs outline-none focus:border-orange-400 dark:border-zinc-700 dark:bg-zinc-800"
                />
              </div>
              <button onClick={() => removeMid(mid.id)} className="text-zinc-400 hover:text-red-500">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Calibration after */}
      <div>
        <p className="mb-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400">
          Veldkalibratie ná meetserie (<SectionRef id="§12.2">§12.2</SectionRef>)
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-zinc-500">Waarde:</label>
            <input
              type="number" step="0.1" min={80} max={120}
              value={state.postValue}
              onChange={(e) => upd({ postValue: e.target.value })}
              placeholder="94.1"
              className={`w-20 ${INPUT}`}
            />
            <span className="text-xs text-zinc-400">dB</span>
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-zinc-500">Tijdstip:</label>
            <input
              type="time"
              value={state.postTime}
              onChange={(e) => upd({ postTime: e.target.value })}
              className={`w-28 ${INPUT}`}
            />
          </div>
          {drift !== null && (
            <span className={`text-xs font-semibold ${drift > 0.5 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              Δ {drift.toFixed(2)} dB {drift > 0.5 ? '— metingen worden automatisch uitgesloten (§12.2)' : '✓'}
            </span>
          )}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Opmerking</label>
        <input
          type="text"
          value={state.notes}
          onChange={(e) => upd({ notes: e.target.value })}
          placeholder="Bijv. winderige omstandigheden, meetlocatie beschrijving"
          className={`w-full ${INPUT}`}
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onSave(stateToSeries(state, initial))}
          className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600"
        >
          Opslaan
        </button>
        <button
          onClick={onCancel}
          className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          Annuleren
        </button>
      </div>
    </div>
  );
}

// ─── Series card (display) ────────────────────────────────────────────────────

function SeriesCard({
  series,
  allSeries,
  measurementCount,
  instrumentOptions,
  onEdit,
  onRemove,
}: {
  series: MeasurementSeries;
  allSeries: MeasurementSeries[];
  measurementCount: number;
  instrumentOptions: { id: string; label: string }[];
  onEdit: () => void;
  onRemove: () => void;
}) {
  const pre   = series.calibrations.find((c) => c.type === 'pre');
  const post  = series.calibrations.find((c) => c.type === 'post');
  const mids  = series.calibrations.filter((c) => c.type === 'mid');
  const drift = seriesDrift(series);
  const badgeColor = seriesBadgeColor(series, allSeries);
  const instrLabel = instrumentOptions.find((o) => o.id === series.instrumentId)?.label ?? 'Geen instrument';

  return (
    <div className={`rounded-xl border p-4 ${drift !== null && drift > 0.5 ? 'border-red-200 bg-red-50/50 dark:border-red-800/40 dark:bg-red-900/10' : 'border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/30'}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-md px-1.5 py-0.5 text-xs font-bold ${badgeColor}`}>
              {seriesLabel(series, allSeries)}
            </span>
            <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">{instrLabel}</span>
            <span className="text-xs text-zinc-400">{measurementCount} meting{measurementCount !== 1 ? 'en' : ''}</span>
          </div>

          {/* Calibration timeline */}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            {pre ? (
              <span className="text-zinc-600 dark:text-zinc-400">
                Vóór: <strong>{pre.value} dB</strong>{pre.timestamp ? ` (${pre.timestamp})` : ''}
              </span>
            ) : (
              <span className="text-zinc-400 italic">Vóór: niet ingevuld</span>
            )}

            {mids.map((mid) => (
              <span key={mid.id} className="text-amber-700 dark:text-amber-400">
                → Tussencalibratie: <strong>{mid.value} dB</strong>
                {mid.timestamp ? ` (${mid.timestamp})` : ''}
                {mid.reason ? ` — ${mid.reason}` : ''}
              </span>
            ))}

            {post ? (
              <span className={drift !== null && drift > 0.5 ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-zinc-600 dark:text-zinc-400'}>
                Na: <strong>{post.value} dB</strong>{post.timestamp ? ` (${post.timestamp})` : ''}
                {drift !== null ? (
                  <span className={`ml-1 font-bold ${drift > 0.5 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    Δ {drift.toFixed(2)} dB {drift > 0.5 ? '✖' : '✓'}
                  </span>
                ) : null}
              </span>
            ) : (
              <span className="text-zinc-400 italic">Na: niet ingevuld</span>
            )}
          </div>

          {/* Drift warning */}
          {drift !== null && drift > 0.5 && (
            <div className="mt-2 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs text-red-700 dark:bg-red-900/20 dark:text-red-300">
              ✖ Kalibratiefout Δ {drift.toFixed(2)} dB &gt; 0,5 dB — alle metingen van deze reeks zijn automatisch uitgesloten (§12.2 <Abbr id="NEN9612">NEN-EN-ISO 9612</Abbr>:2025)
            </div>
          )}

          {series.notes && (
            <p className="mt-1.5 text-xs text-zinc-400 italic">{series.notes}</p>
          )}
        </div>

        <div className="flex shrink-0 gap-2">
          <button
            onClick={onEdit}
            className="rounded border border-zinc-200 px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-700"
          >
            Bewerken
          </button>
          <button
            onClick={onRemove}
            className="rounded border border-zinc-200 px-2 py-1 text-xs text-zinc-500 hover:bg-red-50 hover:text-red-500 dark:border-zinc-700"
          >
            Verwijderen
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Series panel ─────────────────────────────────────────────────────────────

function SeriesPanel({
  hegId,
  taskId,
  allSeries,
  measurements,
  instrumentOptions,
  onUpdateSeries,
  onUpdateMeasurements,
  onGoToStep,
}: {
  hegId: string;
  taskId?: string;
  allSeries: MeasurementSeries[];
  measurements: SoundMeasurement[];
  instrumentOptions: { id: string; label: string }[];
  onUpdateSeries: (series: MeasurementSeries[]) => void;
  onUpdateMeasurements: (measurements: SoundMeasurement[]) => void;
  onGoToStep: (step: number) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  // Filter series for this context
  const contextSeries = allSeries.filter(
    (s) => s.hegId === hegId && s.taskId === taskId,
  );

  /** Re-evaluate exclusions for all measurements in the given series. */
  function applyAutoExclusions(series: MeasurementSeries, allMeas: SoundMeasurement[]): SoundMeasurement[] {
    const drift = seriesDrift(series);
    const autoReason = `Auto-uitgesloten: kalibratiefout ${seriesLabel(series, allSeries)}: Δ ${drift?.toFixed(2)} dB > 0,5 dB (§12.2 NEN-EN-ISO 9612:2025)`;

    return allMeas.map((m) => {
      if (m.seriesId !== series.id) return m;
      if (drift !== null && drift > 0.5) {
        // Only auto-exclude if not already manually excluded with another reason
        if (!m.excluded || m.exclusionReason?.startsWith('Auto-uitgesloten: kalibratiefout')) {
          return { ...m, excluded: true, exclusionReason: autoReason };
        }
        return m;
      } else {
        // Un-exclude if it was auto-excluded by this series
        if (m.excluded && m.exclusionReason?.startsWith('Auto-uitgesloten: kalibratiefout')) {
          return { ...m, excluded: false, exclusionReason: undefined };
        }
        return m;
      }
    });
  }

  function saveSeries(updated: MeasurementSeries) {
    const exists = allSeries.some((s) => s.id === updated.id);
    const newList = exists
      ? allSeries.map((s) => (s.id === updated.id ? updated : s))
      : [...allSeries, updated];
    onUpdateSeries(newList);
    // Apply auto-exclusion to measurements
    const newMeas = applyAutoExclusions(updated, measurements);
    if (newMeas !== measurements) {
      onUpdateMeasurements(newMeas);
    }
    setEditingId(null);
    setShowNew(false);
  }

  function removeSeries(id: string) {
    onUpdateSeries(allSeries.filter((s) => s.id !== id));
    // Detach measurements from this series (keep them, just unlink)
    onUpdateMeasurements(measurements.map((m) => m.seriesId === id ? { ...m, seriesId: undefined } : m));
  }

  const newSeriesTemplate = (): MeasurementSeries => ({
    id: newSoundId(),
    hegId,
    taskId,
    instrumentId: instrumentOptions[0]?.id ?? '',
    calibrations: [],
  });

  if (contextSeries.length === 0 && !showNew) {
    return (
      <button
        onClick={() => setShowNew(true)}
        className="flex items-center gap-1.5 rounded-lg border border-dashed border-zinc-300 px-3 py-2 text-xs text-zinc-500 transition hover:border-orange-400 hover:text-orange-600 dark:border-zinc-600 dark:text-zinc-400"
      >
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Meetserie + kalibratie toevoegen
      </button>
    );
  }

  return (
    <div className="space-y-2">
      {contextSeries.map((series) => (
        <div key={series.id}>
          {editingId === series.id ? (
            <SeriesForm
              initial={series}
              instrumentOptions={instrumentOptions}
              onSave={saveSeries}
              onCancel={() => setEditingId(null)}
              onGoToStep={onGoToStep}
            />
          ) : (
            <SeriesCard
              series={series}
              allSeries={allSeries}
              measurementCount={measurements.filter((m) => m.seriesId === series.id).length}
              instrumentOptions={instrumentOptions}
              onEdit={() => setEditingId(series.id)}
              onRemove={() => removeSeries(series.id)}
            />
          )}
        </div>
      ))}

      {showNew ? (
        <SeriesForm
          initial={newSeriesTemplate()}
          instrumentOptions={instrumentOptions}
          onSave={saveSeries}
          onCancel={() => setShowNew(false)}
          onGoToStep={onGoToStep}
        />
      ) : (
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-1.5 rounded-lg border border-dashed border-zinc-300 px-3 py-2 text-xs text-zinc-500 transition hover:border-orange-400 hover:text-orange-600 dark:border-zinc-600 dark:text-zinc-400"
        >
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Meetserie toevoegen
        </button>
      )}
    </div>
  );
}

// ─── Measurement table for one task (task-based) ──────────────────────────────

function TaskMeasurements({
  task,
  measurements,
  allMeasurements,
  allSeries,
  instrumentOptions,
  onSave,
  onGoToStep,
}: {
  task: SoundTask;
  measurements: SoundMeasurement[];
  allMeasurements: SoundMeasurement[];
  allSeries: MeasurementSeries[];
  instrumentOptions: { id: string; label: string }[];
  onSave: (updated: SoundMeasurement[]) => void;
  onGoToStep: (step: number) => void;
}) {
  const [bulkText, setBulkText] = useState(() =>
    measurements.map((m) => m.lpa_eqT).join(', '),
  );
  const [rowMode, setRowMode] = useState(measurements.length > 0);
  const [openOB, setOpenOB] = useState<string | null>(null);

  const contextSeries = allSeries.filter((s) => s.hegId === task.hegId && s.taskId === task.id);

  function parseBulk() {
    const vals = parseValues(bulkText);
    const defaultSeriesId = contextSeries[contextSeries.length - 1]?.id;
    const newMeas: SoundMeasurement[] = vals.map((v) => ({
      id: newSoundId(),
      hegId: task.hegId,
      taskId: task.id,
      lpa_eqT: v,
      seriesId: defaultSeriesId,
    }));
    setRowMode(true);
    const others = allMeasurements.filter((m) => m.taskId !== task.id);
    onSave([...others, ...newMeas]);
  }

  function updateMeas(updated: SoundMeasurement) {
    const newList = allMeasurements.map((m) => (m.id === updated.id ? updated : m));
    onSave(newList);
  }

  function addRow() {
    const defaultSeriesId = contextSeries[contextSeries.length - 1]?.id;
    const m: SoundMeasurement = {
      id: newSoundId(),
      hegId: task.hegId,
      taskId: task.id,
      lpa_eqT: 0,
      seriesId: defaultSeriesId,
    };
    onSave([...allMeasurements, m]);
  }

  function removeRow(id: string) {
    onSave(allMeasurements.filter((m) => m.id !== id));
  }

  const validMeas = measurements.filter((m) => !m.excluded && m.lpa_eqT > 0);

  const hasSeriesCol = contextSeries.length > 0;

  function toMin(hours: number | undefined): string {
    return hours != null && isFinite(hours) ? String(Math.round(hours * 60)) : '';
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/30">
      <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-700">
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{task.name}</p>
        <p className="text-xs text-zinc-400">
          <Formula math="T_m" /> = {toMin(task.durationHours)} min · {measurements.length} meting{measurements.length !== 1 ? 'en' : ''} ingevoerd
          {validMeas.length < measurements.length ? ` (${measurements.length - validMeas.length} uitgesloten)` : ''}
        </p>
      </div>

      <div className="p-4 space-y-3">
        {!rowMode ? (
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              <Formula math="L_{p,A,eqT_m}" /> waarden in dB — komma- of spatiescheiding (<SectionRef id="§9.3.4">§9.3.4</SectionRef> Formule 3)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder="Bijv. 88.2, 91.4, 86.7, 90.1, 89.3"
                className="flex-1 rounded-lg border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
              <button
                onClick={parseBulk}
                disabled={!parseValues(bulkText).length}
                className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-40"
              >
                Importeren
              </button>
            </div>
            <button
              onClick={() => setRowMode(true)}
              className="mt-1 text-xs text-orange-500 hover:text-orange-700"
            >
              Rij-modus
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="overflow-x-auto overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-800/50">
                    <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">#</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500"><Formula math="L_{p,A,eqT}" /> (dB)</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500"><Formula math="L_{p,Cpeak}" /> (dB(C))</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">Medewerker / datum</th>
                    {hasSeriesCol && (
                      <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">Reeks</th>
                    )}
                    <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">Uitsl.</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-zinc-500">
                      <abbr title="Representatieve omstandigheden — §15.d.4 NEN-EN-ISO 9612:2025" className="cursor-help underline decoration-dotted decoration-zinc-400 underline-offset-2">Rep.</abbr>
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500"><Abbr id="OB">OB</Abbr></th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {measurements.map((m, i) => {
                    const obOpen = openOB === m.id;
                    const hasOB  = m.octaveBands?.some((v) => v > 0);
                    const mSeries = allSeries.find((s) => s.id === m.seriesId);
                    return (
                      <Fragment key={m.id}>
                        <tr className={m.excluded ? 'opacity-50' : ''}>
                          <td className="px-3 py-2 text-xs text-zinc-400">{i + 1}</td>
                          <td className="px-3 py-2">
                            <input
                              type="number" step="0.1"
                              value={m.lpa_eqT || ''}
                              onChange={(e) => updateMeas({ ...m, lpa_eqT: parseFloat(e.target.value) || 0 })}
                              className="w-20 rounded border border-zinc-200 px-2 py-1 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number" step="0.1"
                              value={m.lpCpeak ?? ''}
                              onChange={(e) => updateMeas({ ...m, lpCpeak: parseFloat(e.target.value) || undefined })}
                              placeholder="—"
                              className="w-20 rounded border border-zinc-200 px-2 py-1 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={m.workerLabel ?? ''}
                              onChange={(e) => updateMeas({ ...m, workerLabel: e.target.value })}
                              placeholder="Naam / datum"
                              className="w-full rounded border border-zinc-200 px-2 py-1 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                            />
                          </td>
                          {hasSeriesCol && (
                            <td className="px-3 py-2">
                              <select
                                value={m.seriesId ?? ''}
                                onChange={(e) => updateMeas({ ...m, seriesId: e.target.value || undefined })}
                                className={`rounded border border-zinc-200 px-1.5 py-0.5 text-xs outline-none focus:border-orange-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 ${mSeries ? seriesBadgeColor(mSeries, allSeries) + ' border-transparent' : ''}`}
                              >
                                <option value="">—</option>
                                {contextSeries.map((s) => (
                                  <option key={s.id} value={s.id}>{seriesLabel(s, allSeries)}</option>
                                ))}
                              </select>
                            </td>
                          )}
                          <td className="px-3 py-2">
                            <div className="flex flex-col items-center gap-1">
                              <input
                                type="checkbox"
                                checked={m.excluded ?? false}
                                onChange={() => updateMeas({ ...m, excluded: !m.excluded, exclusionReason: m.excluded ? undefined : m.exclusionReason })}
                                className="accent-orange-500"
                                title="Uitsluiten van analyse (§13)"
                              />
                              {m.excluded && (
                                <input
                                  type="text"
                                  value={m.exclusionReason ?? ''}
                                  onChange={(e) => updateMeas({ ...m, exclusionReason: e.target.value || undefined })}
                                  placeholder="Reden…"
                                  className="w-24 rounded border border-zinc-200 px-1.5 py-0.5 text-[10px] outline-none focus:border-orange-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                                />
                              )}
                            </div>
                          </td>
                          <td className="px-2 py-2 text-center">
                            <input
                              type="checkbox"
                              checked={m.representativeConditions !== false}
                              onChange={() => updateMeas({
                                ...m,
                                representativeConditions: m.representativeConditions !== false ? false : undefined,
                              })}
                              className="accent-orange-500"
                              title="Meting uitgevoerd onder representatieve omstandigheden (§15.d.4 NEN-EN-ISO 9612:2025)"
                            />
                            {m.representativeConditions === false && (
                              <div className="mx-auto mt-0.5 h-1.5 w-1.5 rounded-full bg-amber-400" />
                            )}
                          </td>
                          <td className="px-2 py-2 text-center">
                            <button
                              onClick={() => setOpenOB(obOpen ? null : m.id)}
                              title="Octaafbandanalyse invoeren"
                              className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                                hasOB
                                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                  : 'text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                              }`}
                            >
                              <Abbr id="OB">OB</Abbr>{hasOB ? ' ✓' : ''}
                            </button>
                          </td>
                          <td className="px-2 py-2">
                            <button onClick={() => removeRow(m.id)} className="text-zinc-400 hover:text-red-500">
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                        {obOpen && (
                          <tr className="bg-blue-50/50 dark:bg-blue-900/10">
                            <td colSpan={hasSeriesCol ? 9 : 8} className="px-3 py-2 space-y-3">
                              {/* Octave bands */}
                              <div>
                                <p className="mb-1.5 text-[10px] font-medium text-blue-700 dark:text-blue-300">
                                  Octaafbandniveaus L<sub>p,i</sub> (dB) — optioneel, voor EN 458:2016 methode 3
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {OCTAVE_BANDS.map((freq, bi) => (
                                    <div key={freq} className="flex flex-col items-center gap-0.5">
                                      <span className="text-[9px] text-zinc-400">{freq >= 1000 ? `${freq/1000}k` : freq}</span>
                                      <input
                                        type="number" step="0.1" min={30} max={140}
                                        value={m.octaveBands?.[bi] ?? ''}
                                        onChange={(e) => {
                                          const bands = Array.from({ length: 8 }, (_, j) => m.octaveBands?.[j] ?? 0);
                                          bands[bi] = parseFloat(e.target.value) || 0;
                                          updateMeas({ ...m, octaveBands: bands.every((v) => v === 0) ? undefined : bands });
                                        }}
                                        placeholder="—"
                                        className="w-14 rounded border border-blue-200 bg-white px-1.5 py-1 text-center text-xs outline-none focus:border-orange-400 dark:border-blue-700 dark:bg-zinc-800 dark:text-zinc-100"
                                      />
                                    </div>
                                  ))}
                                  <button
                                    onClick={() => updateMeas({ ...m, octaveBands: undefined })}
                                    className="self-end text-[10px] text-zinc-400 hover:text-red-500"
                                  >
                                    Wissen
                                  </button>
                                </div>
                              </div>

                              {/* Not-representative deviations */}
                              {m.representativeConditions === false && (
                                <div className="border-t border-amber-100 pt-2 dark:border-amber-800">
                                  <label className="mb-0.5 block text-[10px] font-medium text-amber-600 dark:text-amber-400">
                                    ⚠ Afwijkingen van representatieve omstandigheden — <SectionRef id="§15.d.5">§15.d.5</SectionRef>
                                  </label>
                                  <input
                                    type="text"
                                    value={m.deviations ?? ''}
                                    onChange={(e) => updateMeas({ ...m, deviations: e.target.value || undefined })}
                                    placeholder="Beschrijf de afwijkingen van normale werkomstandigheden…"
                                    className="w-full rounded border border-amber-200 bg-white px-2 py-0.5 text-[10px] outline-none focus:border-orange-400 dark:border-amber-700 dark:bg-zinc-800 dark:text-zinc-200"
                                  />
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={addRow}
                className="flex items-center gap-1.5 rounded-lg border border-dashed border-zinc-300 px-3 py-1.5 text-xs text-zinc-500 transition hover:border-orange-400 hover:text-orange-600 dark:border-zinc-600"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Meting toevoegen
              </button>
              <button
                onClick={() => { setRowMode(false); setBulkText(measurements.filter((m) => !m.excluded).map((m) => m.lpa_eqT).join(', ')); }}
                className="text-xs text-zinc-400 hover:text-zinc-600"
              >
                Bulk-modus
              </button>
            </div>
          </div>
        )}

        {validMeas.length >= 3 && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400">
            ✓ {validMeas.length} geldige metingen — <Formula math="L_{EX,8h}" /> berekend in{' '}
            <button type="button" onClick={() => onGoToStep(8)} className="cursor-pointer underline decoration-dotted underline-offset-2 hover:no-underline">stap 9</button>.
            {validMeas.length < 5 && (
              <span className="ml-1 text-amber-600 dark:text-amber-400">
                (<SectionRef id="§9.3.2">§9.3.2</SectionRef>: ≥ 5 aanbevolen bij meerdere medewerkers)
              </span>
            )}
          </p>
        )}
        {measurements.length > 0 && validMeas.length < 3 && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            Minimaal 3 geldige meetwaarden nodig voor berekening.
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SoundStep6_Measurements({ investigation, onUpdate, onGoToStep }: Props) {
  const { hegs, tasks, measurements, instruments } = investigation;
  const measurementSeries = investigation.measurementSeries ?? [];
  const [openHEG, setOpenHEG] = useState<string | null>(hegs[0]?.id ?? null);
  const [durOpen, setDurOpen] = useState(false);

  const instrumentOptions = instruments.map((i) => ({
    id: i.id,
    label: [i.manufacturer, i.model, i.serialNumber].filter(Boolean).join(' ') || i.type,
  }));

  function handleMeasUpdate(updated: SoundMeasurement[]) {
    onUpdate({ measurements: updated });
  }

  function handleSeriesUpdate(updated: MeasurementSeries[]) {
    onUpdate({ measurementSeries: updated });
  }

  function handleSeriesAndMeasUpdate(series: MeasurementSeries[], meas: SoundMeasurement[]) {
    onUpdate({ measurementSeries: series, measurements: meas });
  }

  if (hegs.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Stap 8 — Meetresultaten</h2>
        <div className="rounded-lg bg-amber-50 px-4 py-4 text-sm text-amber-700 dark:bg-amber-900/15 dark:text-amber-400">
          Definieer eerst <Abbr id="HEG">HEG</Abbr>&apos;s in{' '}
          <button type="button" onClick={() => onGoToStep(2)} className="cursor-pointer underline decoration-dotted underline-offset-2 hover:no-underline">stap 3</button>.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Stap 8 — Meetresultaten
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            Leg per <Abbr id="HEG">HEG</Abbr> de meetreeksen vast (instrument + kalibratie) en voer de gemeten{' '}
            <Formula math="L_{p,A,eqT}" />-waarden in. Voor taakgerichte meting per taak; voor functie- en volledigedagmeting per{' '}
            <Abbr id="HEG">HEG</Abbr>. <Formula math="L_{p,Cpeak}" /> is optioneel.
          </p>
        </div>
        <button
          type="button"
          onClick={() => downloadMeasurementPlanPDF(investigation)}
          className="shrink-0 flex items-center gap-2 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Meetplan PDF
        </button>
      </div>

      <InfoBox title="§9.2 / §9.3 / §12.2 / §15.d — Meetprocedure & eisen (NEN-EN-ISO 9612)">
        <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
          {/* Meetduur */}
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Meetduur <SectionRef id="§9.3.2">§9.3.2</SectionRef>
            </p>
            <ul className="space-y-0.5 text-xs">
              <li>→ Minimaal <strong>5 minuten</strong> per meting</li>
              <li>→ Taak korter dan 5 min? Meet de <strong>volledige taak</strong></li>
              <li>→ <strong>Stabiliteitcriterium:</strong> meting mag eerder stoppen als{' '}
                <abbr title="Equivalent geluidniveau A-gewogen over meetduur" className="cursor-help underline decoration-dotted decoration-zinc-400 underline-offset-2">
                  L<sub>p,A,eq</sub>
                </abbr>{' '}
                gedurende <strong>30 s niet meer dan 0,2 dB</strong> varieert (alleen bij stationaire bronnen)</li>
              <li>→ Start <strong>ná aanlooptijd</strong> — wacht tot bron stabiel draait</li>
            </ul>
          </div>

          {/* Meetpositie */}
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Meetpositie <SectionRef id="§9.2">§9.2</SectionRef>
            </p>
            <ul className="space-y-0.5 text-xs">
              <li>→ Microfoon op <strong>oorhoogte medewerker</strong>, op ± 0,1–0,2 m van het oor</li>
              <li>→ Medewerker in <strong>normale werkhouding</strong></li>
              <li>→ Microfoon niet beschaduwd door hoofd of schouder</li>
              <li>→ Windkap gebruiken bij luchtbeweging &gt; 1 m/s</li>
            </ul>
          </div>

          {/* Omstandigheden */}
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Omstandigheden <SectionRef id="§9.3.1">§9.3.1</SectionRef> / <SectionRef id="§15.d.4">§15.d.4</SectionRef>
            </p>
            <ul className="space-y-0.5 text-xs">
              <li>→ Meten tijdens <strong>representatieve, normale werkzaamheden</strong></li>
              <li>→ Alle geluidbronnen actief die normaal aanwezig zijn</li>
              <li>→ Afwijkingen vastleggen per meting via de <strong>OB-knop</strong> <SectionRef id="§15.d.5">§15.d.5</SectionRef></li>
            </ul>
          </div>

          {/* Kalibratie & aantallen */}
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Kalibratie & aantallen <SectionRef id="§12.2">§12.2</SectionRef> / <SectionRef id="§9.3">§9.3</SectionRef>
            </p>
            <ul className="space-y-0.5 text-xs">
              <li>→ <strong>Vóór en ná</strong> elke meetserie een veldkalibratie uitvoeren</li>
              <li>→ Kalibratiefout &gt; 0,5 dB → serie <strong>automatisch uitgesloten</strong></li>
              <li>→ Per taak: ≥ <strong>3 metingen</strong> verplicht; ≥ <strong>5 aanbevolen</strong> bij meerdere medewerkers</li>
            </ul>
          </div>
        </div>
      </InfoBox>

      {/* ── Meetduur-vereisten per HEG / taak ──────────────────────────────── */}
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-700">
        <button
          type="button"
          onClick={() => setDurOpen((o) => !o)}
          className="flex w-full items-center justify-between px-4 py-2.5 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
        >
          <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
            Meetduur-vereisten per HEG — <SectionRef id="§9.3.2">§9.3.2</SectionRef> / <SectionRef id="§10.4">§10.4</SectionRef> / <SectionRef id="§11.4">§11.4</SectionRef> NEN-EN-ISO 9612
          </span>
          <svg className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform ${durOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {durOpen && <table className="w-full text-xs border-t border-zinc-100 dark:border-zinc-800">
          <thead>
            <tr className="bg-zinc-50 dark:bg-zinc-800/50">
              <th className="px-3 py-2 text-left font-medium text-zinc-500"><Abbr id="HEG">HEG</Abbr> / Taak</th>
              <th className="px-3 py-2 text-right font-medium text-zinc-500">Duur</th>
              <th className="px-3 py-2 text-right font-medium text-zinc-500">Min. duur / meting</th>
              <th className="px-3 py-2 text-right font-medium text-zinc-500">Min. n</th>
              <th className="px-3 py-2 text-right font-medium text-zinc-500">Min. totaal</th>
              <th className="px-3 py-2 text-right font-medium text-zinc-500">Huidig n</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {hegs.map((heg) => {
              const hegTasks    = tasks.filter((t) => t.hegId === heg.id);
              const hegMeas     = measurements.filter((m) => m.hegId === heg.id && !m.excluded);
              const fmtM = (m: number) => m < 60 ? `${Math.round(m)} min` : `${Math.floor(m/60)} h${Math.round(m%60) > 0 ? ` ${Math.round(m%60)} min` : ''}`;

              if (heg.strategy === 'task-based') {
                const totalMin = hegTasks.reduce((s, t) => { const tm = t.durationHours * 60; return s + 3 * (tm >= 5 ? 5 : tm); }, 0);
                return (
                  <>
                    {/* HEG header row */}
                    <tr key={heg.id} className="bg-zinc-50/60 dark:bg-zinc-800/20">
                      <td colSpan={4} className="px-3 py-1.5 font-semibold text-zinc-700 dark:text-zinc-200">
                        {heg.name} <span className="ml-1 font-normal text-zinc-400">(taakgericht)</span>
                      </td>
                      <td className="px-3 py-1.5 text-right font-mono font-semibold text-zinc-700 dark:text-zinc-200">
                        ≥&nbsp;{fmtM(totalMin)}
                      </td>
                      <td className="px-3 py-1.5 text-right font-mono text-zinc-400">
                        {hegMeas.length}
                      </td>
                    </tr>
                    {/* Per-task rows */}
                    {hegTasks.map((task) => {
                      const tmMin      = task.durationHours * 60;
                      const minPerMeas = tmMin >= 5 ? 5 : tmMin;
                      const taskMeas   = hegMeas.filter((m) => m.taskId === task.id);
                      const ok         = taskMeas.length >= 3;
                      return (
                        <tr key={task.id}>
                          <td className="px-3 py-1.5 pl-7 text-zinc-600 dark:text-zinc-300">
                            {task.name || <span className="italic text-zinc-400">(naamloos)</span>}
                          </td>
                          <td className="px-3 py-1.5 text-right font-mono text-zinc-400">{fmtM(tmMin)}</td>
                          <td className="px-3 py-1.5 text-right font-mono text-zinc-600 dark:text-zinc-300">
                            ≥&nbsp;{fmtM(minPerMeas)}{tmMin < 5 && <span className="text-zinc-400">*</span>}
                          </td>
                          <td className="px-3 py-1.5 text-right font-mono text-zinc-500">≥&nbsp;3</td>
                          <td className="px-3 py-1.5 text-right font-mono font-semibold text-zinc-700 dark:text-zinc-200">
                            ≥&nbsp;{fmtM(3 * minPerMeas)}
                          </td>
                          <td className={`px-3 py-1.5 text-right font-mono font-semibold ${ok ? 'text-emerald-700 dark:text-emerald-400' : 'text-zinc-500'}`}>
                            {taskMeas.length}{ok ? ' ✓' : ''}
                          </td>
                        </tr>
                      );
                    })}
                    {hegTasks.length === 0 && (
                      <tr key={`${heg.id}-empty`}>
                        <td colSpan={6} className="px-3 py-1.5 pl-7 italic text-zinc-400">
                          Geen taken — definieer taken in{' '}
                          <button type="button" onClick={() => onGoToStep(6)} className="cursor-pointer underline decoration-dotted underline-offset-2 hover:no-underline">stap 7</button>
                        </td>
                      </tr>
                    )}
                  </>
                );
              } else {
                const teMin   = heg.effectiveDayHours * 60;
                const ok      = hegMeas.length >= 3;
                const sRef    = heg.strategy === 'job-based' ? '§10.4' : '§11.4';
                const sLabel  = heg.strategy === 'job-based' ? 'functiegericht' : 'volledige dag';
                return (
                  <tr key={heg.id}>
                    <td className="px-3 py-1.5 font-semibold text-zinc-700 dark:text-zinc-200">
                      {heg.name} <span className="ml-1 font-normal text-zinc-400">({sLabel}, <SectionRef id={sRef}>{sRef}</SectionRef>)</span>
                    </td>
                    <td className="px-3 py-1.5 text-right font-mono text-zinc-400">{fmtM(teMin)}</td>
                    <td className="px-3 py-1.5 text-right font-mono text-zinc-600 dark:text-zinc-300">≥&nbsp;{fmtM(teMin)}</td>
                    <td className="px-3 py-1.5 text-right font-mono text-zinc-500">≥&nbsp;3</td>
                    <td className="px-3 py-1.5 text-right font-mono font-semibold text-zinc-700 dark:text-zinc-200">
                      ≥&nbsp;{fmtM(3 * teMin)}
                    </td>
                    <td className={`px-3 py-1.5 text-right font-mono font-semibold ${ok ? 'text-emerald-700 dark:text-emerald-400' : 'text-zinc-500'}`}>
                      {hegMeas.length}{ok ? ' ✓' : ''}
                    </td>
                  </tr>
                );
              }
            })}
          </tbody>
        </table>}
        {durOpen && hegs.some((h) => h.strategy === 'task-based' && tasks.some((t) => t.hegId === h.id && t.durationHours * 60 < 5)) && (
          <p className="border-t border-zinc-100 px-4 py-1.5 text-xs text-zinc-400 dark:border-zinc-800">
            * Taakduur &lt; 5 min: meet de volledige taak (§9.3.2).
          </p>
        )}
      </div>

      <div className="space-y-4">
        {hegs.map((heg) => {
          const isOpen = openHEG === heg.id;
          const hegMeas = measurements.filter((m) => m.hegId === heg.id && !m.excluded);
          const hegTasks = tasks.filter((t) => t.hegId === heg.id);

          return (
            <div key={heg.id} className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
              <button
                onClick={() => setOpenHEG(isOpen ? null : heg.id)}
                className="flex w-full items-center justify-between px-5 py-3 text-left"
              >
                <div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{heg.name}</p>
                  <p className="text-xs text-zinc-400">
                    {heg.strategy === 'task-based'
                      ? `${hegTasks.length} taken`
                      : heg.strategy === 'job-based'
                      ? 'Functiegericht'
                      : 'Volledige dag'}
                    {' · '}{hegMeas.length} meting{hegMeas.length !== 1 ? 'en' : ''} ingevoerd
                  </p>
                </div>
                <svg
                  className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isOpen && (
                <div className="border-t border-zinc-200 p-5 dark:border-zinc-700">
                  {heg.strategy === 'task-based' ? (
                    <div className="space-y-6">
                      {hegTasks.length === 0 ? (
                        <p className="text-sm text-amber-600 dark:text-amber-400">
                          Definieer eerst taken in{' '}
                          <button type="button" onClick={() => onGoToStep(6)} className="cursor-pointer underline decoration-dotted underline-offset-2 hover:no-underline">stap 7</button>.
                        </p>
                      ) : (
                        hegTasks.map((task) => (
                          <div key={task.id} className="space-y-3">
                            {/* Series panel per task */}
                            <div>
                              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                                Meetreeksen &amp; kalibratie — {task.name}
                              </p>
                              <SeriesPanel
                                hegId={heg.id}
                                taskId={task.id}
                                allSeries={measurementSeries}
                                measurements={measurements}
                                instrumentOptions={instrumentOptions}
                                onUpdateSeries={handleSeriesUpdate}
                                onUpdateMeasurements={(meas) => handleSeriesAndMeasUpdate(measurementSeries, meas)}
                                onGoToStep={onGoToStep}
                              />
                            </div>
                            {/* Measurement table */}
                            <TaskMeasurements
                              task={task}
                              measurements={measurements.filter((m) => m.taskId === task.id)}
                              allMeasurements={measurements}
                              allSeries={measurementSeries}
                              instrumentOptions={instrumentOptions}
                              onSave={handleMeasUpdate}
                              onGoToStep={onGoToStep}
                            />
                          </div>
                        ))
                      )}
                    </div>
                  ) : (
                    /* Job-based / full-day: series + flat measurement list */
                    <div className="space-y-4">
                      <div>
                        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                          Meetreeksen &amp; kalibratie
                        </p>
                        <SeriesPanel
                          hegId={heg.id}
                          taskId={undefined}
                          allSeries={measurementSeries}
                          measurements={measurements}
                          instrumentOptions={instrumentOptions}
                          onUpdateSeries={handleSeriesUpdate}
                          onUpdateMeasurements={(meas) => handleSeriesAndMeasUpdate(measurementSeries, meas)}
                          onGoToStep={onGoToStep}
                        />
                      </div>

                      <div className="space-y-3">
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {heg.strategy === 'job-based'
                            ? 'Functiegericht — steekproefmetingen, geen afzonderlijke taken.'
                            : 'Volledige dag — één of meer dagmetingen per medewerker.'}
                        </p>

                        {/* Inline flat measurement table for job/full-day */}
                        {(() => {
                          const hegFlatMeas = measurements.filter((m) => m.hegId === heg.id && !m.taskId);
                          const contextSeries = measurementSeries.filter((s) => s.hegId === heg.id && !s.taskId);
                          const hasSeriesCol = contextSeries.length > 0;
                          return (
                            <div className="space-y-2">
                              <div className="overflow-x-auto overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="bg-zinc-50 dark:bg-zinc-800/50">
                                      <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">#</th>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500"><Formula math="L_{p,A,eqT}" /> (dB)</th>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500"><Formula math="L_{p,Cpeak}" /></th>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">Medewerker / datum</th>
                                      {hasSeriesCol && <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">Reeks</th>}
                                      <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">Uitsl.</th>
                                      <th className="px-2 py-2 text-left text-xs font-medium text-zinc-500">
                                        <abbr title="Representatieve omstandigheden" className="cursor-help underline decoration-dotted decoration-zinc-400 underline-offset-2">Rep.</abbr>
                                      </th>
                                      <th className="px-3 py-2" />
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                    {hegFlatMeas.map((m, i) => {
                                      const mSeries = measurementSeries.find((s) => s.id === m.seriesId);
                                      return (
                                        <tr key={m.id} className={m.excluded ? 'opacity-50' : ''}>
                                          <td className="px-3 py-2 text-xs text-zinc-400">{i + 1}</td>
                                          <td className="px-3 py-2">
                                            <input type="number" step="0.1"
                                              value={m.lpa_eqT || ''}
                                              onChange={(e) => {
                                                const newList = measurements.map((x) => x.id === m.id ? { ...x, lpa_eqT: parseFloat(e.target.value) || 0 } : x);
                                                handleMeasUpdate(newList);
                                              }}
                                              className="w-20 rounded border border-zinc-200 px-2 py-1 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                                            />
                                          </td>
                                          <td className="px-3 py-2">
                                            <input type="number" step="0.1"
                                              value={m.lpCpeak ?? ''}
                                              onChange={(e) => {
                                                const newList = measurements.map((x) => x.id === m.id ? { ...x, lpCpeak: parseFloat(e.target.value) || undefined } : x);
                                                handleMeasUpdate(newList);
                                              }}
                                              placeholder="—"
                                              className="w-20 rounded border border-zinc-200 px-2 py-1 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                                            />
                                          </td>
                                          <td className="px-3 py-2">
                                            <input type="text"
                                              value={m.workerLabel ?? ''}
                                              onChange={(e) => {
                                                const newList = measurements.map((x) => x.id === m.id ? { ...x, workerLabel: e.target.value } : x);
                                                handleMeasUpdate(newList);
                                              }}
                                              placeholder="Naam / datum"
                                              className="w-full rounded border border-zinc-200 px-2 py-1 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                                            />
                                          </td>
                                          {hasSeriesCol && (
                                            <td className="px-3 py-2">
                                              <select
                                                value={m.seriesId ?? ''}
                                                onChange={(e) => {
                                                  const newList = measurements.map((x) => x.id === m.id ? { ...x, seriesId: e.target.value || undefined } : x);
                                                  handleMeasUpdate(newList);
                                                }}
                                                className={`rounded border border-zinc-200 px-1.5 py-0.5 text-xs outline-none focus:border-orange-400 dark:border-zinc-700 dark:bg-zinc-800 ${mSeries ? seriesBadgeColor(mSeries, measurementSeries) + ' border-transparent' : ''}`}
                                              >
                                                <option value="">—</option>
                                                {contextSeries.map((s) => (
                                                  <option key={s.id} value={s.id}>{seriesLabel(s, measurementSeries)}</option>
                                                ))}
                                              </select>
                                            </td>
                                          )}
                                          <td className="px-3 py-2">
                                            <input
                                              type="checkbox"
                                              checked={m.excluded ?? false}
                                              onChange={() => {
                                                const newList = measurements.map((x) => x.id === m.id ? { ...x, excluded: !x.excluded } : x);
                                                handleMeasUpdate(newList);
                                              }}
                                              className="accent-orange-500"
                                            />
                                          </td>
                                          <td className="px-2 py-2 text-center">
                                            <input
                                              type="checkbox"
                                              checked={m.representativeConditions !== false}
                                              onChange={() => {
                                                const newList = measurements.map((x) => x.id === m.id ? { ...x, representativeConditions: x.representativeConditions !== false ? false : undefined } : x);
                                                handleMeasUpdate(newList);
                                              }}
                                              className="accent-orange-500"
                                            />
                                          </td>
                                          <td className="px-2 py-2">
                                            <button
                                              onClick={() => handleMeasUpdate(measurements.filter((x) => x.id !== m.id))}
                                              className="text-zinc-400 hover:text-red-500"
                                            >
                                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                              </svg>
                                            </button>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                              <button
                                onClick={() => {
                                  const defaultSeriesId = contextSeries[contextSeries.length - 1]?.id;
                                  handleMeasUpdate([...measurements, { id: newSoundId(), hegId: heg.id, lpa_eqT: 0, seriesId: defaultSeriesId }]);
                                }}
                                className="flex items-center gap-1.5 rounded-lg border border-dashed border-zinc-300 px-3 py-1.5 text-xs text-zinc-500 transition hover:border-orange-400 hover:text-orange-600 dark:border-zinc-600"
                              >
                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                                Meting toevoegen
                              </button>
                              {hegFlatMeas.filter((m) => !m.excluded && m.lpa_eqT > 0).length >= 3 && (
                                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                                  ✓ {hegFlatMeas.filter((m) => !m.excluded && m.lpa_eqT > 0).length} geldige metingen — <Formula math="L_{EX,8h}" /> berekend in{' '}
                                  <button type="button" onClick={() => onGoToStep(8)} className="cursor-pointer underline decoration-dotted underline-offset-2 hover:no-underline">stap 9</button>.
                                </p>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
