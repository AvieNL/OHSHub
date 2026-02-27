'use client';

import { useEffect, useState } from 'react';
import type {
  SoundInvestigation,
  SoundStatistics,
  SoundHEG,
  SoundTask,
  SoundMeasurement,
  MeasurementSeries,
} from '@/lib/sound-investigation-types';
import { computeAllStatistics } from '@/lib/sound-stats';
import { Abbr } from '@/components/Abbr';
import { Formula } from '@/components/Formula';
import { InfoBox } from '@/components/InfoBox';
import { SectionRef } from '@/components/SectionRef';

interface Props {
  investigation: SoundInvestigation;
  onUpdate: (partial: Partial<SoundInvestigation>) => void;
  onGoToStep: (step: number) => void;
}

function fmt1(n: number): string { return isFinite(n) ? n.toFixed(1) : '—'; }
function fmt2(n: number): string { return isFinite(n) ? n.toFixed(2) : '—'; }

const VERDICT_COLORS = {
  emerald: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/15',
    text: 'text-emerald-800 dark:text-emerald-300',
    badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-900/15',
    text: 'text-amber-800 dark:text-amber-300',
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  },
  orange: {
    bg: 'bg-orange-50 dark:bg-orange-900/15',
    text: 'text-orange-800 dark:text-orange-300',
    badge: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-900/15',
    text: 'text-red-800 dark:text-red-300',
    badge: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  },
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatMin(m: number): string {
  if (m <= 0) return '—';
  if (m < 60) return `${Math.round(m)} min`;
  const h = Math.floor(m / 60);
  const rem = Math.round(m % 60);
  return rem > 0 ? `${h} h ${rem} min` : `${h} h`;
}

// ─── MeasurementDurationPlan ───────────────────────────────────────────────────

function MeasurementDurationPlan({
  heg,
  tasks,
  measurements,
  measurementSeries,
}: {
  heg: SoundHEG;
  tasks: SoundTask[];
  measurements: SoundMeasurement[];
  measurementSeries: MeasurementSeries[];
}) {
  const hegSeries = measurementSeries.filter((s) => s.hegId === heg.id);
  const hegMeas   = measurements.filter((m) => m.hegId === heg.id && !m.excluded);

  // Per-series rows — one row per MeasurementSeries
  const seriesRows = hegSeries.map((series, idx) => {
    const task = tasks.find((t) => t.id === series.taskId);
    const seriesMeas = hegMeas.filter((m) => m.seriesId === series.id);
    const hasActual  = seriesMeas.some((m) => m.durationMin != null);
    const actualTotal = seriesMeas.reduce((sum, m) => sum + (m.durationMin ?? 0), 0);
    const expectedPerMeas =
      heg.strategy === 'task-based'
        ? task ? (task.durationHours * 60 >= 5 ? 5 : task.durationHours * 60) : 5
        : heg.effectiveDayHours * 60;
    return {
      label: `Reeks ${idx + 1}`,
      taskName: heg.strategy === 'task-based' ? (task?.name ?? '(onbekende taak)') : null,
      n: seriesMeas.length,
      expectedPerMeas,
      actualTotal: hasActual ? actualTotal : null,
    };
  });

  // ── Strategy 1 — task-based ──────────────────────────────────────────────────
  if (heg.strategy === 'task-based') {
    const hegTasks = tasks.filter((t) => t.hegId === heg.id);
    if (hegTasks.length === 0) return null;

    const totalMinRequired = hegTasks.reduce(
      (sum, t) => { const tm = t.durationHours * 60; return sum + 3 * (tm >= 5 ? 5 : tm); },
      0,
    );
    const hasNormMin = hegTasks.some((t) => t.durationHours * 60 < 5);

    return (
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
          Meetduur per taak — <SectionRef id="§9.3.2">§9.3.2</SectionRef> / Tabel 2 (NEN-EN-ISO 9612)
        </p>

        {/* Per-task minimum requirements */}
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/50">
                <th className="px-3 py-2 text-left font-medium text-zinc-500">Taak</th>
                <th className="px-3 py-2 text-right font-medium text-zinc-500"><Formula math="T_m" /></th>
                <th className="px-3 py-2 text-right font-medium text-zinc-500">Min. duur / meting</th>
                <th className="px-3 py-2 text-right font-medium text-zinc-500">Min. n</th>
                <th className="px-3 py-2 text-right font-medium text-zinc-500">Min. totaal</th>
                <th className="px-3 py-2 text-right font-medium text-zinc-500">Werkelijk n</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {hegTasks.map((task) => {
                const tmMin      = task.durationHours * 60;
                const minPerMeas = tmMin >= 5 ? 5 : tmMin;
                const minTotal   = 3 * minPerMeas;
                const taskMeas   = hegMeas.filter((m) => m.taskId === task.id);
                const actualN    = taskMeas.length;
                const ok         = actualN >= 3;
                return (
                  <tr key={task.id}>
                    <td className="px-3 py-2 text-zinc-800 dark:text-zinc-200">
                      {task.name || <span className="italic text-zinc-400">(naamloos)</span>}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-zinc-500">{formatMin(tmMin)}</td>
                    <td className="px-3 py-2 text-right font-mono text-zinc-700 dark:text-zinc-300">
                      ≥&nbsp;{formatMin(minPerMeas)}
                      {tmMin < 5 && <span className="ml-0.5 text-zinc-400">*</span>}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-zinc-500">≥&nbsp;3</td>
                    <td className="px-3 py-2 text-right font-mono font-semibold text-zinc-900 dark:text-zinc-50">
                      ≥&nbsp;{formatMin(minTotal)}
                    </td>
                    <td className={`px-3 py-2 text-right font-mono font-semibold ${
                      ok ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'
                    }`}>
                      {actualN}&nbsp;{ok ? '✓' : '⚠'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-zinc-200 bg-zinc-50/80 dark:border-zinc-700 dark:bg-zinc-800/40">
                <td colSpan={4} className="px-3 py-2 font-semibold text-zinc-600 dark:text-zinc-300">
                  HEG-minimum totaal
                </td>
                <td className="px-3 py-2 text-right font-mono font-bold text-zinc-900 dark:text-zinc-50">
                  ≥&nbsp;{formatMin(totalMinRequired)}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Per meetreeks */}
        {seriesRows.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
            <p className="border-b border-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
              Per meetreeks
            </p>
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-zinc-50/50 dark:bg-zinc-800/20">
                  <th className="px-3 py-2 text-left font-medium text-zinc-500">Reeks</th>
                  <th className="px-3 py-2 text-left font-medium text-zinc-500">Taak</th>
                  <th className="px-3 py-2 text-right font-medium text-zinc-500">n</th>
                  <th className="px-3 py-2 text-right font-medium text-zinc-500">Min. duur / meting</th>
                  <th className="px-3 py-2 text-right font-medium text-zinc-500">Werkelijke totaalduur</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {seriesRows.map((row) => (
                  <tr key={row.label}>
                    <td className="px-3 py-2 font-mono text-zinc-700 dark:text-zinc-300">{row.label}</td>
                    <td className="px-3 py-2 text-zinc-500">{row.taskName ?? '—'}</td>
                    <td className="px-3 py-2 text-right font-mono text-zinc-700 dark:text-zinc-300">{row.n}</td>
                    <td className="px-3 py-2 text-right font-mono text-zinc-500">≥&nbsp;{formatMin(row.expectedPerMeas)}</td>
                    <td className="px-3 py-2 text-right font-mono text-zinc-500">
                      {row.actualTotal != null ? formatMin(row.actualTotal) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {hasNormMin && (
          <p className="text-xs text-zinc-400">
            * Taakduur &lt; 5 min: meet de volledige taak (§9.3.2).
          </p>
        )}
      </div>
    );
  }

  // ── Strategy 2 / 3 — job-based or full-day ───────────────────────────────────
  const teMin     = heg.effectiveDayHours * 60;
  const minTotal  = 3 * teMin;
  const actualN   = hegMeas.length;
  const ok        = actualN >= 3;
  const sectionId = heg.strategy === 'job-based' ? '§10.4' : '§11.4';
  const stratLabel = heg.strategy === 'job-based' ? 'Functiegericht' : 'Volledige dag';

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
        Meetduur steekproeven — <SectionRef id={sectionId}>{sectionId}</SectionRef> / Tabel 2 (NEN-EN-ISO 9612)
      </p>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-zinc-50 dark:bg-zinc-800/50">
              <th className="px-3 py-2 text-left font-medium text-zinc-500">Strategie</th>
              <th className="px-3 py-2 text-right font-medium text-zinc-500"><Formula math="T_e" /> (werkdag)</th>
              <th className="px-3 py-2 text-right font-medium text-zinc-500">Min. duur / meting</th>
              <th className="px-3 py-2 text-right font-medium text-zinc-500">Min. n</th>
              <th className="px-3 py-2 text-right font-medium text-zinc-500">Min. totaal</th>
              <th className="px-3 py-2 text-right font-medium text-zinc-500">Werkelijk n</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-3 py-2 text-zinc-700 dark:text-zinc-300">{stratLabel}</td>
              <td className="px-3 py-2 text-right font-mono text-zinc-500">{formatMin(teMin)}</td>
              <td className="px-3 py-2 text-right font-mono text-zinc-700 dark:text-zinc-300">≥&nbsp;{formatMin(teMin)}</td>
              <td className="px-3 py-2 text-right font-mono text-zinc-500">≥&nbsp;3</td>
              <td className="px-3 py-2 text-right font-mono font-semibold text-zinc-900 dark:text-zinc-50">
                ≥&nbsp;{formatMin(minTotal)}
              </td>
              <td className={`px-3 py-2 text-right font-mono font-semibold ${
                ok ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'
              }`}>
                {actualN}&nbsp;{ok ? '✓' : '⚠'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Per meetreeks */}
      {seriesRows.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
          <p className="border-b border-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            Per meetreeks
          </p>
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-zinc-50/50 dark:bg-zinc-800/20">
                <th className="px-3 py-2 text-left font-medium text-zinc-500">Reeks</th>
                <th className="px-3 py-2 text-right font-medium text-zinc-500">n</th>
                <th className="px-3 py-2 text-right font-medium text-zinc-500">Min. duur / meting</th>
                <th className="px-3 py-2 text-right font-medium text-zinc-500">Werkelijke totaalduur</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {seriesRows.map((row) => (
                <tr key={row.label}>
                  <td className="px-3 py-2 font-mono text-zinc-700 dark:text-zinc-300">{row.label}</td>
                  <td className="px-3 py-2 text-right font-mono text-zinc-700 dark:text-zinc-300">{row.n}</td>
                  <td className="px-3 py-2 text-right font-mono text-zinc-500">≥&nbsp;{formatMin(row.expectedPerMeas)}</td>
                  <td className="px-3 py-2 text-right font-mono text-zinc-500">
                    {row.actualTotal != null ? formatMin(row.actualTotal) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── StatTable — accepts React.ReactNode as row key so formulas can appear ─────

function StatTable({ label, rows }: { label: string; rows: [React.ReactNode, string, string?][] }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-400">{label}</p>
      <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
        <table className="w-full text-sm">
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {rows.map(([key, val, note], i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-zinc-50/50 dark:bg-zinc-800/20' : ''}>
                <td className="px-4 py-2 text-xs text-zinc-500 dark:text-zinc-400">{key}</td>
                <td className="px-4 py-2 text-right font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {val}
                </td>
                {note && (
                  <td className="px-4 py-2 text-right text-xs text-zinc-400">{note}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── HEGResult ─────────────────────────────────────────────────────────────────

function HEGResult({
  stat,
  hegName,
  heg,
  tasks,
  measurements,
  measurementSeries,
}: {
  stat: SoundStatistics;
  hegName: string;
  heg: SoundHEG;
  tasks: SoundTask[];
  measurements: SoundMeasurement[];
  measurementSeries: MeasurementSeries[];
}) {
  const c = VERDICT_COLORS[stat.verdictColor];

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/30">
      <div className="border-b border-zinc-200 px-5 py-3 dark:border-zinc-700">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{hegName}</p>
          <span className={`rounded-full px-3 py-0.5 text-xs font-semibold ${c.badge}`}>
            {stat.verdictLabel}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-zinc-400">
          {stat.strategy === 'task-based'
            ? `Taakgericht · ${stat.n} metingen · ${stat.taskResults?.length ?? 0} taken`
            : stat.strategy === 'job-based'
            ? `Functiegericht · ${stat.n} steekproeven`
            : `Volledige dag · ${stat.n} dagmetingen`}
        </p>
      </div>

      <div className="space-y-5 p-5">

        {/* Measurement duration plan */}
        <MeasurementDurationPlan
          heg={heg}
          tasks={tasks}
          measurements={measurements}
          measurementSeries={measurementSeries}
        />

        {/* Task contributions (strategy 1 only) */}
        {stat.taskResults && stat.taskResults.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Taakbijdragen — Formule (3) &amp; (4)
            </p>
            <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-800/50">
                    <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">Taak</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-zinc-500">
                      <Formula math="T_m" /> (min)
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-zinc-500">n</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-zinc-500">
                      <Formula math="L_{p,A,eqT_m}" /> (dB)
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-zinc-500">
                      <Formula math="L_{EX,8h,m}" /> (dB)
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-zinc-500">
                      <Formula math="u_{1a}" /> (dB)
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-zinc-500">
                      <Formula math="c_{1a}" />
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {stat.taskResults.map((tr) => (
                    <tr key={tr.taskId}>
                      <td className="px-3 py-2 text-zinc-800 dark:text-zinc-200">
                        {tr.taskName || <span className="italic text-zinc-400">(naamloze taak)</span>}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-zinc-700 dark:text-zinc-300">{Math.round(tr.durationHours * 60)}</td>
                      <td className="px-3 py-2 text-right text-zinc-500">{tr.nMeasurements}</td>
                      <td className="px-3 py-2 text-right font-mono font-semibold text-zinc-900 dark:text-zinc-50">{fmt1(tr.lpa_eqTm)}</td>
                      <td className="px-3 py-2 text-right font-mono text-zinc-700 dark:text-zinc-300">{fmt1(tr.lEx8hm)}</td>
                      <td className="px-3 py-2 text-right font-mono text-zinc-500">{fmt2(tr.u1a)}</td>
                      <td className="px-3 py-2 text-right font-mono text-zinc-500">{fmt2(tr.c1a)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Job/full-day energy average */}
        {stat.lpa_eqTe !== undefined && (
          <StatTable
            label="Energiegemiddelde (Formule 7)"
            rows={[
              ['Aantal steekproeven N', String(stat.n)],
              [<><Formula math="L_{p,A,eqT_e}" />{' — energiegemiddelde'}</>, `${fmt1(stat.lpa_eqTe)} dB`, 'Formule (7)'],
            ]}
          />
        )}

        {/* Main result */}
        <StatTable
          label="Dagelijkse geluidblootstelling"
          rows={[
            [<Formula math="L_{EX,8h}" />, `${fmt1(stat.lEx8h)} dB(A)`, stat.strategy === 'task-based' ? 'Formule (5)' : 'Formule (8)/(9)'],
          ]}
        />

        {/* Uncertainty budget */}
        <StatTable
          label="Onzekerheidsbudget (Bijlage C)"
          rows={[
            [<><Formula math="u_1" />{' — bemonsteringsonzekerheid'}</>, `${fmt2(stat.u1)} dB`,
              stat.strategy === 'task-based' ? 'Formule C.6' : 'Formule C.12'],
            ...(stat.c1u1 !== undefined
              ? [[<><Formula math="c_1 u_1" />{' — uit Tabel C.4'}</>, `${fmt2(stat.c1u1)} dB`, 'N=' + stat.n] as [React.ReactNode, string, string?]]
              : []),
            [<><Formula math="u_2" />{' — instrumentonzekerheid'}</>, `${fmt2(stat.u2)} dB`, 'Tabel C.5'],
            [<><Formula math="u_3" />{' — microfoonpositie'}</>, `${fmt2(stat.u3)} dB`, '§C.6'],
            [<><Formula math="u" />{' — gecombineerde standaardonzekerheid'}</>, `${fmt2(stat.u)} dB`, 'Formule C.1'],
            [<><Formula math="U" />{' — uitgebreide onzekerheid (k=1,65)'}</>, `${fmt1(stat.U)} dB`, '95% eenzijdig'],
            [<><Formula math="L_{EX,8h,95\%} = L_{EX,8h} + U" /></>, `${fmt1(stat.lEx8h_95pct)} dB(A)`, 'Formule (10)'],
          ]}
        />

        {stat.c1u1Excessive && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-800/50 dark:bg-red-900/15 dark:text-red-400">
            <strong>⚠ H-4 — <Formula math="c_1 u_1" /> &gt; 3,5 dB: meetplan herzien</strong>{' '}
            (Tabel C.4 / <SectionRef id="§10.4">§10.4</SectionRef> NEN-EN-ISO 9612:2025). De bemonsteringsonzekerheid is te groot voor een
            betrouwbare uitspraak. Voeg extra steekproeven toe, verkleiner de{' '}
            <Abbr id="HEG">HEG</Abbr>, of gebruik een andere meetstrategie.
          </div>
        )}

        {/* K-3 / K-5 — task warnings (task-based strategy only) */}
        {stat.taskWarnings && stat.taskWarnings.length > 0 && (
          <div className="space-y-1 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-900/15 dark:text-amber-400">
            {stat.taskWarnings.map((w, i) => (
              <p key={i}>⚠ {w}</p>
            ))}
          </div>
        )}
        {stat.spreadWarnings && stat.spreadWarnings.length > 0 && (
          <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-900/15 dark:text-amber-400">
            <p className="mb-1 font-semibold">
              ⚠ K-5 — Spreiding te groot (Bijlage E NEN-EN-ISO 9612:2025):
            </p>
            <ul className="space-y-0.5 pl-2">
              {stat.spreadWarnings.map((sw) => (
                <li key={sw.taskId}>
                  Taak &apos;{sw.taskName}&apos;: spreiding {sw.spread.toFixed(1)} dB (grens {sw.limit} dB).
                  Vergroot de steekproef of onderzoek de oorzaak van de variatie.
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Peak */}
        {stat.lCpeak !== undefined && (
          <StatTable
            label={`Piekgeluid`}
            rows={[
              [<><Formula math="L_{p,Cpeak}" />{' — hoogste gemeten waarde'}</>, `${fmt1(stat.lCpeak)} dB(C)`],
              ['Oordeel', stat.peakVerdictLabel ?? '—'],
            ]}
          />
        )}

        {/* Final verdict banner */}
        <div className={`rounded-xl px-4 py-3 ${c.bg} ${c.text}`}>
          <p className="text-sm font-semibold">
            <Formula math="L_{EX,8h,95\%}" /> = {fmt1(stat.lEx8h_95pct)} dB(A) — {stat.verdictLabel}
          </p>
          <p className="mt-0.5 text-xs opacity-80">
            <Abbr id="NEN9612">NEN-EN-ISO 9612</Abbr>:2025 Formule (10) · Referentie: Arbobesluit art. 6.6–6.8
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function SoundStep7_Calculation({ investigation, onUpdate, onGoToStep }: Props) {
  const { hegs, statistics, tasks, measurements, measurementSeries } = investigation;
  const [formulasOpen, setFormulasOpen] = useState(false);

  useEffect(() => {
    const computed = computeAllStatistics(investigation);
    onUpdate({ statistics: computed });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function recompute() {
    const computed = computeAllStatistics(investigation);
    onUpdate({ statistics: computed });
  }

  const hegMap        = Object.fromEntries(hegs.map((h) => [h.id, h.name]));
  const hasTaskBased  = hegs.some((h) => h.strategy === 'task-based');
  const hasNonTask    = hegs.some((h) => h.strategy === 'job-based' || h.strategy === 'full-day');
  const hasJobBased   = hegs.some((h) => h.strategy === 'job-based');
  const hasFullDay    = hegs.some((h) => h.strategy === 'full-day');

  if (hegs.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Stap 9 — <Formula math="L_{EX,8h}" /> &amp; onzekerheid
        </h2>
        <div className="rounded-lg bg-amber-50 px-4 py-4 text-sm text-amber-700 dark:bg-amber-900/15 dark:text-amber-400">
          Voer eerst meetwaarden in bij{' '}
          <button type="button" onClick={() => onGoToStep(7)} className="cursor-pointer underline decoration-dotted underline-offset-2 hover:no-underline">stap 8</button>.
        </div>
      </div>
    );
  }

  const noResults = statistics.length === 0;

  // HEGs with verdict ≥ LAV but no PPE data — prompt user to enter it in Step 6
  const hegsWithoutPPE = statistics
    .filter((s) => s.verdict !== 'below-lav')
    .map((s) => hegs.find((h) => h.id === s.hegId))
    .filter((h) => h != null && !h.ppeSNRUnknown && !h.ppeAttenuation && !h.ppeSNR && !h.ppeNotes);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Stap 9 — <Formula math="L_{EX,8h}" /> &amp; onzekerheid (Bijlage C)
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            Berekening van de dagelijkse geluidblootstelling en de uitgebreide onzekerheid conform{' '}
            <Abbr id="NEN9612">NEN-EN-ISO 9612</Abbr>:2025.
          </p>
        </div>
        <button
          onClick={recompute}
          className="shrink-0 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          Herberekenen
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

      {hegsWithoutPPE.length > 0 && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-800/50 dark:bg-blue-900/15">
          <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">
            Gehoorbescherming niet ingevoerd
          </p>
          <p className="mt-1 text-xs text-blue-700 dark:text-blue-400">
            Voor de volgende <Abbr id="HEG">HEG</Abbr>{hegsWithoutPPE.length > 1 ? '&apos;s' : ''} is de actiewaarde overschreden maar is nog geen gehoorbescherming ingevoerd.
            Voer de gebruikte <Abbr id="PBM">PBM</Abbr> in via{' '}
            <button type="button" onClick={() => onGoToStep(5)} className="cursor-pointer font-medium underline decoration-dotted underline-offset-2 hover:no-underline">stap 6 — Arbeidsmiddelen</button>{' '}
            om de grenswaarde-toetsing (<Formula math="L_{EX,8h,oor}" />) te completeren:
          </p>
          <ul className="mt-1.5 space-y-0.5 text-xs text-blue-700 dark:text-blue-400">
            {hegsWithoutPPE.map((h) => (
              <li key={h!.id} className="flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-blue-400" />
                {h!.name}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Formula reference box */}
      <div className="rounded-lg border border-zinc-200 text-xs text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
        <button
          type="button"
          onClick={() => setFormulasOpen((o) => !o)}
          className="flex w-full items-center justify-between px-5 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
        >
          <span className="font-semibold text-zinc-600 dark:text-zinc-300">Formules NEN-EN-ISO 9612:2025</span>
          <svg
            className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform ${formulasOpen ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {formulasOpen && (
        <div className="border-t border-zinc-200 px-5 py-4 dark:border-zinc-700 space-y-3">

          {/* ── Task-based formulas (strategy 1) ─────────────────────────── */}
          {hasTaskBased && (<>
            <div className="space-y-1.5">
              <p className="font-semibold text-zinc-600 dark:text-zinc-300">
                Formule (3) — Energiegemiddeld geluidniveau per taak (<SectionRef id="§9.3.2">§9.3.2</SectionRef>):
              </p>
              <div className="pl-2">
                <Formula display math="L_{p,A,eqT_m} = 10 \lg\!\left(\frac{1}{I_m}\sum_{i=1}^{I_m} 10^{0.1\,L_i}\right)" />
              </div>
            </div>
            <div className="space-y-1.5">
              <p className="font-semibold text-zinc-600 dark:text-zinc-300">
                Formule (4) — Bijdrage taak m aan dagdosis (<SectionRef id="§9.3.2">§9.3.2</SectionRef>):
              </p>
              <div className="pl-2">
                <Formula display math="L_{EX,8h,m} = L_{p,A,eqT_m} + 10 \lg\!\left(\tfrac{T_m}{T_0}\right)" />
              </div>
            </div>
            <div className="space-y-1.5">
              <p className="font-semibold text-zinc-600 dark:text-zinc-300">
                Formule (5) — Dagelijkse blootstelling taakgericht (<SectionRef id="§9.3.2">§9.3.2</SectionRef>):
              </p>
              <div className="pl-2">
                <Formula display math="L_{EX,8h} = 10 \lg\!\left(\sum_m \frac{T_m}{T_0} \cdot 10^{0.1\, L_{p,A,eqT_m}}\right)" />
              </div>
            </div>
          </>)}

          {/* ── Job-based / full-day formulas (strategy 2 & 3) ───────────── */}
          {hasNonTask && (<>
            <div className="space-y-1.5">
              <p className="font-semibold text-zinc-600 dark:text-zinc-300">
                Formule (7) — Energiegemiddeld geluidniveau{' '}
                {hasJobBased && <><SectionRef id="§10.4">§10.4</SectionRef>{hasFullDay ? ' / ' : ''}</>}
                {hasFullDay  && <SectionRef id="§11.4">§11.4</SectionRef>}:
              </p>
              <div className="pl-2">
                <Formula display math="L_{p,A,eqT_e} = 10 \lg\!\left(\frac{1}{N}\sum_{i=1}^{N} 10^{0.1\,L_{p,A,eqT,i}}\right)" />
              </div>
            </div>
            <div className="space-y-1.5">
              <p className="font-semibold text-zinc-600 dark:text-zinc-300">
                {hasJobBased && hasFullDay
                  ? <>Formule (8)/(9) — Dagelijkse blootstelling functie- en dagmeting (<SectionRef id="§10.4">§10.4</SectionRef> / <SectionRef id="§11.4">§11.4</SectionRef>):</>
                  : hasJobBased
                  ? <>Formule (8) — Dagelijkse blootstelling functiegericht (<SectionRef id="§10.4">§10.4</SectionRef>):</>
                  : <>Formule (9) — Dagelijkse blootstelling volledige dag (<SectionRef id="§11.4">§11.4</SectionRef>):</>}
              </p>
              <div className="pl-2">
                <Formula display math="L_{EX,8h} = L_{p,A,eqT_e} + 10 \lg\!\left(\frac{T_e}{T_0}\right), \quad T_0 = 8\,\text{h}" />
              </div>
            </div>
          </>)}

          {/* ── Formula (10) — always shown ──────────────────────────────── */}
          <div className="space-y-1.5">
            <p className="font-semibold text-zinc-600 dark:text-zinc-300">Formule (10) — Uitgebreide onzekerheid:</p>
            <div className="pl-2">
              <Formula display math="L_{EX,8h,95\%} = L_{EX,8h} + U \qquad U = 1{,}65 \cdot u \quad (k = 1{,}65,\ 95\%\text{ eenzijdig})" />
            </div>
          </div>

          {/* ── Annex C ──────────────────────────────────────────────────── */}
          <div className="border-t border-zinc-200 pt-3 dark:border-zinc-700">
            <p className="mb-2 font-semibold text-zinc-600 dark:text-zinc-300">
              <SectionRef id="Bijlage C">Bijlage C</SectionRef> — Onzekerheidsberekening:
            </p>
            <div className="space-y-2">
              <div className="space-y-0.5">
                <p>Formule C.1 — Gecombineerde standaardonzekerheid:</p>
                <div className="pl-2">
                  <Formula display math="u = \sqrt{(c_1 u_1)^2 + u_2^2 + u_3^2}" />
                </div>
              </div>
              {hasTaskBased && (
                <div className="space-y-0.5">
                  <p>Formule C.6 — Bemonsteringsonzekerheid taakgericht (<Formula math="u_{1a,m}" />, per taak m):</p>
                  <div className="pl-2">
                    <Formula display math="u_{1a,m} = \frac{s_m}{\sqrt{I_m}}" />
                  </div>
                  <p className="pl-2 text-zinc-400">
                    waarbij <Formula math="s_m" /> = standaardafwijking van de <Formula math="I_m" /> meetwaarden voor taak m.
                  </p>
                </div>
              )}
              {hasNonTask && (
                <div className="space-y-0.5">
                  <p>Formule C.12 — Bemonsteringsonzekerheid{hasJobBased && hasFullDay ? ' functie-/dagmeting' : hasJobBased ? ' functiegericht' : ' volledige dag'} (<Formula math="c_1 u_1" />, via Tabel C.4):</p>
                  <div className="pl-2">
                    <Formula display math="c_1 u_1 = \frac{s}{\sqrt{N}}" />
                  </div>
                  <p className="pl-2 text-zinc-400">
                    waarbij <Formula math="s" /> = standaardafwijking van de <Formula math="N" /> steekproeven en de gevoeligheidscoëfficiënt <Formula math="c_1" /> uit Tabel C.4.
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>
        )}
      </div>

      {noResults ? (
        <div className="rounded-lg bg-amber-50 px-4 py-4 text-sm text-amber-700 dark:bg-amber-900/15 dark:text-amber-400">
          Geen berekeningen mogelijk. Zorg dat voor elke <Abbr id="HEG">HEG</Abbr> minimaal 3 geldige meetwaarden zijn ingevoerd in{' '}
          <button type="button" onClick={() => onGoToStep(7)} className="cursor-pointer underline decoration-dotted underline-offset-2 hover:no-underline">stap 8</button>.
        </div>
      ) : (
        <div className="space-y-6">
          {statistics.map((stat) => {
            const heg = hegs.find((h) => h.id === stat.hegId)!;
            return (
            <HEGResult
              key={stat.hegId}
              stat={stat}
              hegName={hegMap[stat.hegId] ?? stat.hegId}
              heg={heg}
              tasks={tasks}
              measurements={measurements}
              measurementSeries={measurementSeries}
            />
          );
          })}
        </div>
      )}

      {hegs.length > statistics.length && (
        <div className="rounded-lg bg-amber-50 px-4 py-3 text-xs text-amber-700 dark:bg-amber-900/15 dark:text-amber-400">
          {hegs.length - statistics.length} <Abbr id="HEG">HEG</Abbr>{hegs.length - statistics.length !== 1 ? '\'s' : ''} heeft onvoldoende meetwaarden (minimaal 3 nodig).
          Voer meer metingen in bij{' '}
          <button type="button" onClick={() => onGoToStep(7)} className="cursor-pointer underline decoration-dotted underline-offset-2 hover:no-underline">stap 8</button>.
        </div>
      )}
    </div>
  );
}
