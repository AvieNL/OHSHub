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
import { SectionRef } from '@/components/SectionRef';
import { Alert, Button, Icon } from '@/components/ui';
import InlineStepHeader from '@/components/InlineStepHeader';
import InlineEdit from '@/components/InlineEdit';
import MarkdownContent from '@/components/MarkdownContent';
import SoundCompliancePanel from '@/components/sound-investigation/SoundCompliancePanel';

interface Props {
  investigation: SoundInvestigation;
  onUpdate: (partial: Partial<SoundInvestigation>) => void;
  onGoToStep: (step: number) => void;
  contentOverrides?: Record<string, string>;
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

const STEP_KEY = 'step.8';
const NS = 'investigation.sound';
const FALLBACK_TITLE = 'Stap 9 — Dagelijkse blootstelling & onzekerheid';
const FALLBACK_DESC = 'Berekening van de dagelijkse geluidblootstelling en de uitgebreide onzekerheid conform NEN-EN-ISO 9612:2025.';

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
        : heg.strategy === 'job-based'
          ? 45 // §10.2: aanbevolen 45 min per steekproef
          : heg.effectiveDayHours * 60 * 0.75; // full-day: ≥ 75% van Te
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
          Meetduur per taak
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
  const isJobBased  = heg.strategy === 'job-based';
  const teMin       = heg.effectiveDayHours * 60;
  // §10.2: job-based 15–60 min per steekproef (aanbevolen 45 min); full-day: ≥ 75% van Te (§11.2/9.4)
  const minDurPerMeas = isJobBased ? 45 : 0.75 * teMin;
  const minN        = isJobBased ? 5 : 3;
  const minTotal    = minN * minDurPerMeas;
  const actualN     = hegMeas.length;
  const ok          = actualN >= minN;
  const stratLabel  = isJobBased ? 'Functiegericht' : 'Volledige dag';

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
        Meetduur steekproeven
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
              <td className="px-3 py-2 text-right font-mono text-zinc-700 dark:text-zinc-300">
                {isJobBased ? '15–60 min *' : `≥\u00A0${formatMin(minDurPerMeas)}`}
              </td>
              <td className="px-3 py-2 text-right font-mono text-zinc-500">≥&nbsp;{minN}</td>
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

      {isJobBased && (
        <p className="text-xs text-zinc-400">
          * §10.2: meetduur per steekproef 15–60 min; aanbevolen 45 min. Minimaal 5 steekproeven (Tabel C.4, Noot 1).
        </p>
      )}
      {!isJobBased && (
        <p className="text-xs text-zinc-400">
          Min. duur per dagmeting = 75% van T<sub>e</sub> = {formatMin(minDurPerMeas)} (§9.4).
        </p>
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
            label={stat.strategy === 'full-day'
              ? 'Energiegemiddelde — Formule (7) → Formule (9)'
              : 'Energiegemiddelde — Formule (7) → Formule (8)'}
            rows={[
              [stat.strategy === 'full-day' ? 'Aantal dagmetingen N' : 'Aantal steekproeven N', String(stat.n)],
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
          label="Onzekerheidsbudget"
          rows={[
            [<><Formula math="u_1" />{' — bemonsteringsonzekerheid'}</>, `${fmt2(stat.u1)} dB`,
              stat.strategy === 'task-based' ? 'Formule C.6' : 'Formule C.12'],
            ...(stat.c1u1 !== undefined
              ? [[<><Formula math="c_1 u_1" />{' — uit Tabel C.4'}</>, `${fmt2(stat.c1u1)} dB`, 'N=' + stat.n] as [React.ReactNode, string, string?]]
              : []),
            [<><Formula math="u_2" />{' — instrumentonzekerheid'}</>, `${fmt2(stat.u2)} dB`, 'Tabel C.5'],
            [<><Formula math="u_3" />{' — microfoonpositie'}</>, `${fmt2(stat.u3)} dB`, '§C.6'],
            [<><Formula math="u" />{' — gecombineerde standaardonzekerheid'}</>, `${fmt2(stat.u)} dB`,
              stat.strategy === 'task-based' ? 'Formule C.3' : 'Formule C.9'],
            [<><Formula math="U" />{' — uitgebreide onzekerheid (k=1,65)'}</>, `${fmt1(stat.U)} dB`, '95% eenzijdig'],
            [<><Formula math="L_{EX,8h,95\%} = L_{EX,8h} + U" /></>, `${fmt1(stat.lEx8h_95pct)} dB(A)`, 'Formule (10)'],
          ]}
        />

        {stat.complianceChecks && stat.complianceChecks.length > 0 && (
          <SoundCompliancePanel checks={stat.complianceChecks} />
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

export default function SoundStep7_Calculation({ investigation, onUpdate, onGoToStep, contentOverrides }: Props) {
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

  const title = contentOverrides?.[`${STEP_KEY}.title`] ?? FALLBACK_TITLE;
  const desc = contentOverrides?.[`${STEP_KEY}.desc`];

  const hegMap        = Object.fromEntries(hegs.map((h) => [h.id, h.name]));
  const hasTaskBased  = hegs.some((h) => h.strategy === 'task-based');
  const hasNonTask    = hegs.some((h) => h.strategy === 'job-based' || h.strategy === 'full-day');
  const hasJobBased   = hegs.some((h) => h.strategy === 'job-based');
  const hasFullDay    = hegs.some((h) => h.strategy === 'full-day');

  if (hegs.length === 0) {
    return (
      <div className="space-y-4">
        <InlineStepHeader namespace={NS} stepKey={STEP_KEY} fallbackTitle={FALLBACK_TITLE} title={title} />
        <Alert variant="warning" size="md">
          Voer eerst meetwaarden in bij{' '}
          <Button variant="link" type="button" onClick={() => onGoToStep(7)}>stap 8</Button>.
        </Alert>
      </div>
    );
  }

  // HEGs with verdict ≥ LAV but no PPE data — prompt user to enter it in Step 6
  const hegsWithoutPPE = statistics
    .filter((s) => s.verdict !== 'below-lav')
    .map((s) => hegs.find((h) => h.id === s.hegId))
    .filter((h) => h != null && !h.ppeSNRUnknown && !h.ppeAttenuation && !h.ppeSNR && !h.ppeNotes);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <InlineStepHeader namespace={NS} stepKey={STEP_KEY} fallbackTitle={FALLBACK_TITLE} title={title} />
          <InlineEdit namespace={NS} contentKey={`${STEP_KEY}.desc`}
            initialValue={desc ?? FALLBACK_DESC} fallback={FALLBACK_DESC} multiline markdown>
            {desc
              ? <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                  <MarkdownContent>{desc}</MarkdownContent>
                </p>
              : <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                  Berekening van de dagelijkse geluidblootstelling en de uitgebreide onzekerheid conform{' '}
                  <Abbr id="NEN9612">NEN-EN-ISO 9612</Abbr>:2025.
                </p>
            }
          </InlineEdit>
        </div>
        <Button variant="secondary" className="shrink-0" onClick={recompute}>
          Herberekenen
        </Button>
      </div>

      {hegsWithoutPPE.length > 0 && (
        <Alert variant="info" size="md">
          <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">
            Gehoorbescherming niet ingevoerd
          </p>
          <p className="mt-1 text-xs text-blue-700 dark:text-blue-400">
            Voor de volgende <Abbr id="HEG">HEG</Abbr>{hegsWithoutPPE.length > 1 ? '&apos;s' : ''} is de actiewaarde overschreden maar is nog geen gehoorbescherming ingevoerd.
            Voer de gebruikte <Abbr id="PBM">PBM</Abbr> in via{' '}
            <Button variant="link" type="button" onClick={() => onGoToStep(5)} className="font-medium">stap 6 — Arbeidsmiddelen</Button>{' '}
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
        </Alert>
      )}

      {/* Formula reference box */}
      <div className="rounded-lg border border-zinc-200 text-xs text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
        <button
          type="button"
          onClick={() => setFormulasOpen((o) => !o)}
          className="flex w-full items-center justify-between px-5 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
        >
          <span className="font-semibold text-zinc-600 dark:text-zinc-300">Formules NEN-EN-ISO 9612:2025</span>
          <Icon
            name="chevron-down"
            size="md"
            className={`text-zinc-400 transition-transform ${formulasOpen ? 'rotate-180' : ''}`}
          />
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

      <div className="space-y-6">
        {hegs.map((heg) => {
          const stat = statistics.find((s) => s.hegId === heg.id);
          if (stat) {
            return (
              <HEGResult
                key={heg.id}
                stat={stat}
                hegName={heg.name}
                heg={heg}
                tasks={tasks}
                measurements={measurements}
                measurementSeries={measurementSeries}
              />
            );
          }
          return (
            <div key={heg.id} className="rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/30">
              <div className="border-b border-zinc-200 px-5 py-3 dark:border-zinc-700">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{heg.name}</p>
              </div>
              <div className="px-5 py-4 text-sm text-zinc-500 dark:text-zinc-400">
                Geen meetresultaten beschikbaar. Voer metingen in via{' '}
                <Button variant="link" type="button" onClick={() => onGoToStep(7)}>stap 8</Button>.
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
