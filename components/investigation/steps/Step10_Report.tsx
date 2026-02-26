'use client';

import { useState } from 'react';
import type {
  Investigation,
  InvestigationReport,
  Substance,
  MeasurementStatistics,
} from '@/lib/investigation-types';
import { computeStats } from '@/lib/measurement-stats';
import { downloadPDF } from '@/lib/pdf-html';

interface Props {
  investigation: Investigation;
  onUpdate: (partial: Partial<Investigation>) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPrimaryOEL(substance: Substance) {
  const twas = substance.oels.filter((o) => (o.period ?? 'tgg-8h') === 'tgg-8h' && o.value != null && o.value > 0);
  if (twas.length > 0) return twas[0];
  return substance.oels.find((o) => o.value != null && o.value > 0) ?? null;
}

function computePlanStats(
  investigation: Investigation,
  planId: string,
): MeasurementStatistics | null {
  const series = investigation.measurementSeries.find((s) => s.planId === planId);
  if (!series) return null;
  const plan = investigation.measurementPlans.find((p) => p.id === planId);
  if (!plan) return null;
  const substance = investigation.substances.find((s) => s.id === plan.substanceId);
  if (!substance) return null;
  const oelEntry = getPrimaryOEL(substance);
  if (!oelEntry || !oelEntry.value) return null;
  const validValues = series.measurements
    .filter((m) => !m.excluded && m.value > 0)
    .map((m) => m.value);
  if (validValues.length < 3) return null;
  return computeStats(validValues, oelEntry.value, oelEntry.unit);
}

function bandLabel(band: string) {
  return band === 'A'
    ? 'Band A — < 10% OELV'
    : band === 'B'
      ? 'Band B — 10–50% OELV'
      : band === 'C'
        ? 'Band C — 50–100% OELV'
        : 'Band D — > 100% OELV';
}

function verdictColor(verdict: MeasurementStatistics['verdict']) {
  return verdict === 'acceptable'
    ? 'text-emerald-600 dark:text-emerald-400'
    : verdict === 'uncertain'
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-red-600 dark:text-red-400';
}

const REVIEW_TRIGGERS = [
  { id: 'new-substance', label: 'Nieuwe stof in gebruik genomen' },
  { id: 'process-change', label: 'Proceswijziging of nieuwe werkwijze' },
  { id: 'incident', label: 'Incident of bijna-incident met gevaarlijke stoffen' },
  { id: 'health-complaint', label: 'Gezondheidsklachten bij medewerkers' },
  { id: 'legislation', label: 'Nieuwe of gewijzigde wetgeving / grenswaarden' },
  { id: 'periodic', label: 'Periodieke herbeoordeling (jaarlijks of per 3 jaar)' },
];

// ─── CSV export ───────────────────────────────────────────────────────────────

function buildCSV(investigation: Investigation): string {
  const rows: string[][] = [
    ['Plan', 'SEG', 'Stof', 'Type', 'Methode', 'Waarde', 'Eenheid', 'Datum', 'Omstandigheden', 'Uitgesloten'],
  ];
  for (const plan of investigation.measurementPlans) {
    const seg = investigation.segs.find((s) => s.id === plan.segId);
    const substance = investigation.substances.find((s) => s.id === plan.substanceId);
    const series = investigation.measurementSeries.find((s) => s.planId === plan.id);
    const typeLabel =
      plan.measurementType === '8h-tgg' ? '8-uurs TGG' : plan.measurementType === '15min' ? '15-min STEL' : 'Plafond';
    if (!series) continue;
    for (const m of series.measurements) {
      const oelEntry = substance ? getPrimaryOEL(substance) : null;
      rows.push([
        `${seg?.name ?? ''} × ${substance?.productName ?? ''}`,
        seg?.name ?? '',
        substance?.productName ?? '',
        typeLabel,
        plan.method ?? '',
        String(m.value),
        oelEntry?.unit ?? '',
        m.date ?? '',
        m.conditions ?? '',
        m.excluded ? 'Ja' : 'Nee',
      ]);
    }
  }
  return rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
}

function downloadCSV(investigation: Investigation) {
  const csv = buildCSV(investigation);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${investigation.name.replace(/\s+/g, '-')}-metingen.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Text export ──────────────────────────────────────────────────────────────

function buildText(investigation: Investigation): string {
  const lines: string[] = [];
  const hr = '─'.repeat(60);

  lines.push('ONDERZOEK GEVAARLIJKE STOFFEN', hr);
  lines.push(`Naam:        ${investigation.name}`);
  for (const c of investigation.clients) {
    const label = [c.name, c.role, c.organization].filter(Boolean).join(', ');
    if (label) lines.push(`Opdrachtgever: ${label}`);
  }
  for (const p of investigation.investigators) {
    const label = [p.name, p.role, p.organization].filter(Boolean).join(', ');
    if (label) lines.push(`Onderzoeker: ${label}`);
  }
  for (const r of investigation.respondents) {
    const label = [r.name, r.role, r.organization].filter(Boolean).join(', ');
    if (label) lines.push(`Respondent:  ${label}`);
  }
  lines.push(`Aangemaakt:  ${new Date(investigation.createdAt).toLocaleDateString('nl-NL')}`);
  lines.push('');

  // Substances
  lines.push(`STOFFEN (${investigation.substances.length})`, hr);
  for (const s of investigation.substances) {
    const oelEntry = getPrimaryOEL(s);
    const oelText = oelEntry?.value ? `OELV ${oelEntry.value} ${oelEntry.unit}` : 'geen OELV';
    lines.push(
      `  • ${s.productName}${s.casNr ? ` (CAS ${s.casNr})` : ''}  CMR: ${s.cmrCategory}  ${oelText}`,
    );
  }
  lines.push('');

  // Tasks
  lines.push(`TAKEN (${investigation.tasks.length})`, hr);
  for (const t of investigation.tasks) {
    const subNames = t.substanceIds
      .map((id) => investigation.substances.find((s) => s.id === id)?.productName ?? id)
      .join(', ');
    lines.push(`  • ${t.description}${t.department ? ` — ${t.department}` : ''}  [${subNames}]`);
  }
  lines.push('');

  // Assessment summary
  const bandCounts = { A: 0, B: 0, C: 0, D: 0 };
  for (const e of investigation.initialEstimates) {
    bandCounts[e.tier1.band]++;
  }
  lines.push('INITIËLE BEOORDELING (TIER-1)', hr);
  for (const band of ['A', 'B', 'C', 'D'] as const) {
    if (bandCounts[band] > 0)
      lines.push(`  Band ${band}: ${bandCounts[band]} combinatie${bandCounts[band] !== 1 ? 's' : ''}`);
  }
  lines.push('');

  // Measurement results
  const plansWithData = investigation.measurementPlans.filter((p) => {
    const s = investigation.measurementSeries.find((ms) => ms.planId === p.id);
    return s && s.measurements.filter((m) => !m.excluded && m.value > 0).length >= 3;
  });
  if (plansWithData.length > 0) {
    lines.push('MEETRESULTATEN', hr);
    for (const plan of plansWithData) {
      const seg = investigation.segs.find((s) => s.id === plan.segId);
      const substance = investigation.substances.find((s) => s.id === plan.substanceId);
      const stats = computePlanStats(investigation, plan.id);
      const label = `${seg?.name ?? '?'} × ${substance?.productName ?? '?'}`;
      if (stats) {
        lines.push(
          `  ${label}  n=${stats.n}  GM=${stats.gm.toFixed(3)}  GSD=${stats.gsd.toFixed(2)}  P95=${stats.p95.toFixed(3)} ${stats.unit}  → ${stats.verdictLabel}`,
        );
      }
    }
    lines.push('');
  }

  // Control measures
  if (investigation.controlMeasures.length > 0) {
    lines.push(`MAATREGELEN (${investigation.controlMeasures.length})`, hr);
    for (const m of investigation.controlMeasures) {
      lines.push(
        `  [P${m.priority}] ${m.description}  Status: ${m.status}${m.deadline ? `  Deadline: ${m.deadline}` : ''}`,
      );
    }
    lines.push('');
  }

  // Conclusion
  if (investigation.report.conclusion) {
    lines.push('CONCLUSIE', hr);
    lines.push(investigation.report.conclusion);
    lines.push('');
  }

  if (investigation.report.nextReviewDate) {
    lines.push(`Volgende herbeoordeling: ${investigation.report.nextReviewDate}`);
    lines.push('');
  }

  lines.push('─── Gegenereerd door OHSHub ───────────────────────────────────');
  return lines.join('\n');
}

// ─── Review date suggestion ───────────────────────────────────────────────────

function suggestReviewDate(investigation: Investigation): string {
  const deadlines = investigation.controlMeasures
    .map((m) => m.deadline)
    .filter((d): d is string => !!d)
    .sort();
  if (deadlines.length > 0) {
    return deadlines[deadlines.length - 1];
  }
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

// ─── ReportSection ────────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
      {children}
    </h3>
  );
}

// ─── Step10_Report ────────────────────────────────────────────────────────────

export default function Step10_Report({ investigation, onUpdate }: Props) {
  const [copied, setCopied] = useState(false);

  const { substances, tasks, initialEstimates, measurementPlans, controlMeasures, report, segs } =
    investigation;

  function updateReport(patch: Partial<InvestigationReport>) {
    onUpdate({ report: { ...report, ...patch } });
  }

  function toggleTrigger(id: string) {
    const triggers = report.nextReviewTriggers.includes(id)
      ? report.nextReviewTriggers.filter((t) => t !== id)
      : [...report.nextReviewTriggers, id];
    updateReport({ nextReviewTriggers: triggers });
  }

  async function handleCopyText() {
    const text = buildText(investigation);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  // Band distribution for summary
  const bandCounts = { A: 0, B: 0, C: 0, D: 0 };
  for (const e of initialEstimates) bandCounts[e.tier1.band]++;

  // Stats per plan
  const planSummaries = measurementPlans.map((plan) => {
    const seg = segs.find((s) => s.id === plan.segId);
    const substance = substances.find((s) => s.id === plan.substanceId);
    const series = investigation.measurementSeries.find((s) => s.planId === plan.id);
    const n = series ? series.measurements.filter((m) => !m.excluded && m.value > 0).length : 0;
    const stats = computePlanStats(investigation, plan.id);
    const typeLabel =
      plan.measurementType === '8h-tgg' ? '8u TGG' : plan.measurementType === '15min' ? '15-min' : 'Plafond';
    return { plan, seg, substance, n, stats, typeLabel };
  });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Stap 10 — Borging, herbeoordeling & rapport
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          Leg de conclusie vast, plan de volgende herbeoordeling en exporteer het volledige
          onderzoeksrapport.
        </p>
      </div>

      {/* ── Conclusion ─────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <SectionTitle>Conclusie & oordeel</SectionTitle>
        <textarea
          rows={5}
          value={report.conclusion ?? ''}
          onChange={(e) => updateReport({ conclusion: e.target.value })}
          placeholder="Beschrijf de algehele conclusie van dit onderzoek: zijn de blootstellingen aanvaardbaar, welke maatregelen zijn essentieel, en wat is de vervolgstap?"
          className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-orange-400"
        />
      </div>

      {/* ── Next review ────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <SectionTitle>Periodieke herbeoordeling</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Datum volgende herbeoordeling
            </label>
            <input
              type="date"
              value={report.nextReviewDate ?? ''}
              onChange={(e) => updateReport({ nextReviewDate: e.target.value })}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-orange-400"
            />
            <div className="mt-2">
              {(() => {
                const latestDeadline = investigation.controlMeasures
                  .map((m) => m.deadline)
                  .filter((d): d is string => !!d)
                  .sort()
                  .at(-1);
                return (
                  <>
                    <button
                      type="button"
                      onClick={() => updateReport({ nextReviewDate: suggestReviewDate(investigation) })}
                      className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:border-orange-400 hover:text-orange-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:border-orange-500 dark:hover:text-orange-400"
                    >
                      {latestDeadline
                        ? `Instellen op basis van maatregelen (${latestDeadline})`
                        : 'Instellen op 1 jaar vanaf vandaag'}
                    </button>
                    {latestDeadline && (
                      <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                        De verste maatregel-deadline is {latestDeadline}. Na implementatie is herbeoordeling aangewezen.
                      </p>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Triggers voor vervroegde herbeoordeling
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {REVIEW_TRIGGERS.map((t) => (
              <label
                key={t.id}
                className={`flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2.5 text-sm transition ${
                  report.nextReviewTriggers.includes(t.id)
                    ? 'border-orange-400 bg-orange-50 dark:border-orange-600 dark:bg-orange-900/20'
                    : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={report.nextReviewTriggers.includes(t.id)}
                  onChange={() => toggleTrigger(t.id)}
                  className="mt-0.5 accent-orange-500"
                />
                <span className="text-zinc-700 dark:text-zinc-300">{t.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* ── Historical notes ────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <SectionTitle>Historische aantekeningen & wijzigingslog</SectionTitle>
        <textarea
          rows={3}
          value={report.historicalNotes ?? ''}
          onChange={(e) => updateReport({ historicalNotes: e.target.value })}
          placeholder="Eerdere onderzoeken, wijzigingen in de situatie, vorige meetresultaten, ontvangen adviezen…"
          className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-orange-400"
        />
      </div>

      {/* ── Export ──────────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <SectionTitle>Exportopties</SectionTitle>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => downloadPDF(investigation)}
            className="inline-flex items-center gap-2 rounded-lg border border-orange-300 bg-orange-500 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-orange-600 dark:border-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            PDF rapport genereren
          </button>

          <button
            onClick={() => downloadCSV(investigation)}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            Excel / CSV
          </button>

          <button
            onClick={() => {
              const blob = new Blob([JSON.stringify([investigation], null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              const slug = investigation.name.replace(/\s+/g, '-').toLowerCase().slice(0, 40);
              a.download = `ohshub-${slug}-${new Date().toISOString().slice(0, 10)}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Opslaan als bestand
          </button>

          <button
            onClick={handleCopyText}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            {copied ? (
              <>
                <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-emerald-600 dark:text-emerald-400">Gekopieerd!</span>
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                Tekst kopiëren
              </>
            )}
          </button>
        </div>
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          PDF: opent een opgemaakt rapport in een nieuw venster — gebruik daarna Afdrukken → Opslaan als PDF.
          CSV: bevat alle ingevulde meetwaarden per meetplan.
        </p>
      </div>

      {/* ── Report preview ───────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <SectionTitle>Samenvatting onderzoek</SectionTitle>

        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6 space-y-6 dark:border-zinc-700 dark:bg-zinc-800/30">
          {/* Header */}
          <div>
            <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
              {investigation.name}
            </h4>
            <div className="mt-1 flex flex-wrap gap-4 text-xs text-zinc-500 dark:text-zinc-400">
              {investigation.clients.map((c) => (
                <span key={c.id}>
                  Opdrachtgever: {[c.name, c.role, c.organization].filter(Boolean).join(', ')}
                </span>
              ))}
              {investigation.investigators.map((p) => (
                <span key={p.id}>
                  Onderzoeker: {[p.name, p.role, p.organization].filter(Boolean).join(', ')}
                </span>
              ))}
              <span>Aangemaakt: {new Date(investigation.createdAt).toLocaleDateString('nl-NL')}</span>
            </div>
          </div>

          {/* Substances */}
          {substances.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Stoffen ({substances.length})
              </p>
              <div className="space-y-1.5">
                {substances.map((s) => {
                  const oelEntry = getPrimaryOEL(s);
                  return (
                    <div
                      key={s.id}
                      className="flex flex-wrap items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800/50"
                    >
                      <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                        {s.productName}
                      </span>
                      {s.casNr && (
                        <span className="text-xs text-zinc-400">CAS {s.casNr}</span>
                      )}
                      {s.cmrCategory !== 'none' && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-400">
                          CMR {s.cmrCategory}
                        </span>
                      )}
                      {oelEntry?.value && (
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                          OELV: {oelEntry.value} {oelEntry.unit}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Assessment summary */}
          {Object.values(bandCounts).some((n) => n > 0) && (
            <div>
              <p className="mb-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Initiële beoordeling (tier-1)
              </p>
              <div className="flex flex-wrap gap-3">
                {(['A', 'B', 'C', 'D'] as const).map((band) => {
                  if (!bandCounts[band]) return null;
                  const colors: Record<string, string> = {
                    A: 'bg-emerald-500',
                    B: 'bg-amber-400',
                    C: 'bg-orange-500',
                    D: 'bg-red-600',
                  };
                  return (
                    <div key={band} className="flex items-center gap-1.5">
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white ${colors[band]}`}
                      >
                        {band}
                      </span>
                      <span className="text-sm text-zinc-600 dark:text-zinc-400">
                        {bandCounts[band]}×
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Measurement summary */}
          {planSummaries.filter((ps) => ps.n >= 3).length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Meetresultaten
              </p>
              <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-zinc-100 dark:bg-zinc-800">
                      <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">Plan</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-zinc-500">n</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-zinc-500">P95</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-zinc-500">Oordeel</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {planSummaries
                      .filter((ps) => ps.n >= 3)
                      .map(({ plan, seg, substance, n, stats, typeLabel }) => (
                        <tr key={plan.id}>
                          <td className="px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300">
                            {seg?.name ?? '?'} × {substance?.productName ?? '?'}{' '}
                            <span className="text-zinc-400">({typeLabel})</span>
                          </td>
                          <td className="px-3 py-2 text-right text-xs text-zinc-500">{n}</td>
                          <td className="px-3 py-2 text-right font-mono text-xs text-zinc-600 dark:text-zinc-400">
                            {stats ? `${stats.p95.toFixed(3)} ${stats.unit}` : '—'}
                          </td>
                          <td
                            className={`px-3 py-2 text-right text-xs font-semibold ${
                              stats ? verdictColor(stats.verdict) : 'text-zinc-400'
                            }`}
                          >
                            {stats
                              ? stats.verdict === 'acceptable'
                                ? 'Aanvaardbaar'
                                : stats.verdict === 'uncertain'
                                  ? 'Onzeker'
                                  : 'Niet-aanvaardbaar'
                              : '—'}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Control measures */}
          {controlMeasures.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Maatregelen ({controlMeasures.length})
              </p>
              <div className="space-y-1.5">
                {controlMeasures
                  .slice()
                  .sort((a, b) => a.priority - b.priority)
                  .map((m) => (
                    <div
                      key={m.id}
                      className="flex items-start gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800/50"
                    >
                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                        {m.priority}
                      </span>
                      <p className="text-xs text-zinc-700 dark:text-zinc-300">{m.description}</p>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Conclusion */}
          {report.conclusion && (
            <div>
              <p className="mb-1 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Conclusie
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">
                {report.conclusion}
              </p>
            </div>
          )}

          {report.nextReviewDate && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Volgende herbeoordeling:{' '}
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                {new Date(report.nextReviewDate + 'T12:00:00').toLocaleDateString('nl-NL', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
