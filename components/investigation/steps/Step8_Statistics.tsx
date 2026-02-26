'use client';

import type { Investigation, MeasurementStatistics, MeasurementVerdict, Substance } from '@/lib/investigation-types';
import { computeStats, getUT } from '@/lib/measurement-stats';

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

function fmt(n: number, dec = 3): string {
  return n.toFixed(dec);
}

// ─── Verdict badge ────────────────────────────────────────────────────────────

function VerdictBadge({ verdict, label }: { verdict: MeasurementVerdict; label: string }) {
  const cls =
    verdict === 'acceptable'
      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
      : verdict === 'uncertain'
        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${cls}`}>
      {label}
    </span>
  );
}

// ─── Stats table rows ─────────────────────────────────────────────────────────

function StatRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <tr>
      <td className="px-4 py-2.5 text-xs text-zinc-500 dark:text-zinc-400">{label}</td>
      <td
        className={`px-4 py-2.5 text-right font-mono text-sm font-semibold ${
          highlight ? 'text-red-600 dark:text-red-400' : 'text-zinc-900 dark:text-zinc-50'
        }`}
      >
        {value}
      </td>
    </tr>
  );
}

// ─── Bijlage I — herbeoordeling interval ──────────────────────────────────────

function reassessmentMonths(gm: number, oelv: number): number {
  const r = gm / oelv;
  return r < 0.1 ? 36 : r < 0.25 ? 24 : r < 0.5 ? 18 : 12;
}

// ─── Plan stats card ──────────────────────────────────────────────────────────

function PlanStatsCard({
  planLabel,
  n,
  stats,
  hasOEL,
}: {
  planLabel: string;
  n: number;
  stats: MeasurementStatistics | null;
  hasOEL: boolean;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800/30">
      <div className="border-b border-zinc-100 px-5 py-3 dark:border-zinc-700">
        <p className="font-semibold text-zinc-900 dark:text-zinc-50">{planLabel}</p>
        <p className="text-xs text-zinc-400">
          {n} geldige meting{n !== 1 ? 'en' : ''}
        </p>
      </div>

      <div className="p-5">
        {n < 3 && (
          <p className="text-sm text-amber-600 dark:text-amber-400">
            Minimaal 3 geldige meetwaarden nodig voor statistische analyse.
            Voer meer meetwaarden in bij stap 7.
          </p>
        )}

        {n >= 3 && !hasOEL && (
          <div className="space-y-3">
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Geen OELV beschikbaar voor deze stof. Stel een grenswaarde in bij stap 2
              voor een volledig statistisch oordeel.
            </p>
            {stats && (
              <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-900/50">
                <p className="mb-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Beschrijvende statistieken (zonder OELV-toetsing)
                </p>
                <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                  {[
                    { label: 'n', value: String(stats.n) },
                    { label: 'GM', value: fmt(stats.gm) },
                    { label: 'GSD', value: fmt(stats.gsd, 2) },
                    { label: 'P95', value: fmt(stats.p95) },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
                      <p className="font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {n >= 3 && hasOEL && stats && (
          <div className="space-y-4">
            <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
              <table className="w-full">
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  <StatRow label="Aantal metingen (n)" value={String(stats.n)} />
                  {stats.distribution === 'normal' && stats.am != null ? (
                    <>
                      <StatRow
                        label="Rekenkundig gemiddelde (AM)"
                        value={`${fmt(stats.am)} ${stats.unit}`}
                      />
                      <StatRow
                        label="Standaardafwijking (SD)"
                        value={`${fmt(stats.sd ?? 0)} ${stats.unit}`}
                      />
                    </>
                  ) : (
                    <>
                      <StatRow
                        label="Geometrisch gemiddelde (GM)"
                        value={`${fmt(stats.gm)} ${stats.unit}`}
                      />
                      <StatRow label="Geometrische standaarddeviatie (GSD)" value={fmt(stats.gsd, 2)} />
                    </>
                  )}
                  <StatRow
                    label="95e percentiel (P95)"
                    value={`${fmt(stats.p95)} ${stats.unit}`}
                    highlight={stats.p95 >= stats.oelv}
                  />
                  <StatRow label="OELV" value={`${stats.oelv} ${stats.unit}`} />
                  <StatRow
                    label="P95 als % van OELV"
                    value={`${fmt(stats.p95PctOfOelv, 1)}%`}
                    highlight={stats.p95PctOfOelv >= 100}
                  />
                  <StatRow
                    label="Overschrijdingsfractie"
                    value={`${fmt(stats.overshootFraction * 100, 1)}%`}
                  />
                  {stats.testMethod === 'bijlage-f' && stats.ur != null && stats.ut != null && (
                    <>
                      <StatRow
                        label={
                          stats.distribution === 'normal'
                            ? 'U_R  [= (OELV − AM) / SD]'
                            : 'U_R  [= (ln OELV − ln GM) / ln GSD]'
                        }
                        value={fmt(stats.ur)}
                        highlight={stats.ur < stats.ut}
                      />
                      <StatRow
                        label={`U_T  (kritieke waarde n=${stats.n}, Tabel F.1)`}
                        value={fmt(stats.ut)}
                      />
                    </>
                  )}
                  {stats.testMethod === 'preliminary' && (
                    <StatRow
                      label={`Drempel §5.5.2  (${stats.n === 3 ? '10' : stats.n === 4 ? '15' : '20'}% × OELV)`}
                      value={`${fmt((stats.n === 3 ? 0.1 : stats.n === 4 ? 0.15 : 0.2) * stats.oelv)} ${stats.unit}`}
                    />
                  )}
                </tbody>
              </table>
            </div>

            <VerdictBadge verdict={stats.verdict} label={stats.verdictLabel} />

            {stats.testMethod === 'bijlage-f' && stats.verdict === 'acceptable' && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                <span className="font-medium">Herbeoordeling (Bijlage I):</span>{' '}
                GM/OELV = {fmt(stats.gm / stats.oelv, 2)} → aanbevolen interval{' '}
                <span className="font-semibold">
                  {reassessmentMonths(stats.gm, stats.oelv)} maanden
                </span>
                .
              </p>
            )}

            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              {stats.testMethod === 'bijlage-f'
                ? `Bijlage F toets conform NEN-EN 689:2018+C1:2019 (n≥6): U_R vs U_T uit Tabel F.1. Verdeling: ${stats.distribution === 'normal' ? 'normaal (§F.4)' : 'log-normaal (§F.3)'}.`
                : '§5.5.2 voorlopige toets conform NEN-EN 689:2018+C1:2019 (n<6): maximumwaarde vs drempelpercentage.'}
              {stats.verdict === 'uncertain' && (
                <span className="ml-1 text-amber-500 dark:text-amber-400">
                  Geen beslissing — breid uit tot ≥ 6 metingen voor statistische toets (§5.5.3).
                </span>
              )}
            </p>
            {stats.testMethod === 'bijlage-f' && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                <strong>Bijlage E (§5.4.3):</strong> De Bijlage F-toets veronderstelt een
                log-normale verdeling. Valideer dit met een log-waarschijnlijkheidsplot van de
                meetdata vóór interpretatie van het oordeel.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Step8_Statistics ─────────────────────────────────────────────────────────

export default function Step8_Statistics({ investigation }: Props) {
  const { measurementPlans, measurementSeries, substances, segs, tasks } = investigation;

  if (measurementPlans.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Stap 8 — Kwantitatieve beoordeling
        </h2>
        <div className="rounded-lg bg-amber-50 px-4 py-4 text-sm text-amber-700 dark:bg-amber-900/15 dark:text-amber-400">
          Stel meetplannen op in stap 6 en voer meetwaarden in bij stap 7.
        </div>
      </div>
    );
  }

  // Compute stats per plan
  const planStats = measurementPlans.map((plan) => {
    const series = measurementSeries.find((s) => s.planId === plan.id);
    const substance = substances.find((s) => s.id === plan.substanceId);
    const seg = segs.find((s) => s.id === plan.segId);
    const validValues = series
      ? series.measurements.filter((m) => !m.excluded && m.value > 0).map((m) => m.value)
      : [];

    const oelEntry = substance ? getPrimaryOEL(substance) : null;
    const hasOEL = Boolean(oelEntry && oelEntry.value != null && oelEntry.value > 0);

    const typeLabel =
      plan.measurementType === '8h-tgg'
        ? '8-uurs TGG'
        : plan.measurementType === '15min'
          ? '15-min STEL'
          : 'Plafond';

    const planLabel = `${seg?.name ?? '?'} × ${substance?.productName ?? '?'} (${typeLabel})`;

    const dist = series?.distribution ?? 'log-normal';
    let stats: MeasurementStatistics | null = null;
    if (validValues.length >= 3 && hasOEL && oelEntry!.value != null) {
      stats = computeStats(validValues, oelEntry!.value!, oelEntry!.unit, dist);
    } else if (validValues.length >= 3) {
      // Compute descriptive stats without OEL comparison
      const n = validValues.length;
      const lnVals = validValues.map(Math.log);
      const lnMean = lnVals.reduce((s, v) => s + v, 0) / n;
      const lnStd =
        n > 1
          ? Math.sqrt(lnVals.reduce((s, v) => s + (v - lnMean) ** 2, 0) / (n - 1))
          : 0;
      stats = {
        n,
        gm: Math.exp(lnMean),
        gsd: Math.exp(lnStd),
        p95: Math.exp(lnMean + 1.645 * lnStd),
        oelv: 0,
        unit: oelEntry?.unit ?? 'mg/m³',
        p95PctOfOelv: 0,
        overshootFraction: 0,
        verdict: 'uncertain',
        verdictLabel: 'OELV onbekend',
      };
    }

    return { plan, planLabel, substance, seg, validValues, stats, hasOEL };
  });

  // Mixture IE per SEG (Σ GMᵢ / OELᵢ) — only meaningful for ≥2 substances
  type MixtureResult = {
    segId: string;
    segName: string;
    ie: number;
    ieVerdict: MeasurementVerdict;
    ieLabel: string;
    contributions: { substanceName: string; gm: number; oelv: number; unit: string; ratio: number }[];
  };

  const segIds = [...new Set(measurementPlans.map((p) => p.segId))];
  const mixtureResults: MixtureResult[] = segIds.reduce<MixtureResult[]>((acc, segId) => {
    const seg = segs.find((s) => s.id === segId);
    const segItems = planStats.filter(
      (ps) => ps.plan.segId === segId && ps.stats !== null && ps.hasOEL,
    );
    if (segItems.length < 2) return acc;

    const contributions = segItems.map((ps) => ({
      substanceName: ps.substance?.productName ?? '?',
      gm: ps.stats!.gm,
      oelv: ps.stats!.oelv,
      unit: ps.stats!.unit,
      ratio: ps.stats!.gm / ps.stats!.oelv,
    }));
    const ie = contributions.reduce((s, c) => s + c.ratio, 0);
    const ieVerdict: MeasurementVerdict = ie < 1 ? 'acceptable' : 'unacceptable';
    const ieLabel = ie < 1 ? 'Aanvaardbaar (IE < 1)' : 'Niet-aanvaardbaar (IE ≥ 1)';

    acc.push({ segId, segName: seg?.name ?? '?', ie, ieVerdict, ieLabel, contributions });
    return acc;
  }, []);

  const hasAnyStats = planStats.some((ps) => ps.validValues.length >= 3);

  // VBG-gerelateerde waarschuwingen: taken gekoppeld aan meetplannen
  const linkedTaskIds = new Set(
    segs
      .filter((seg) => measurementPlans.some((p) => p.segId === seg.id))
      .flatMap((seg) => seg.taskIds),
  );
  const linkedTasks = tasks.filter((t) => linkedTaskIds.has(t.id));
  const hasRespiratorPPE = linkedTasks.some((t) => t.ppe.includes('respirator'));
  const hasLongShift = linkedTasks.some((t) => t.durationPerDay === '>8u');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Stap 8 — Kwantitatieve beoordeling t.o.v. grenswaarden
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          Statistische compliance-toets conform NEN-EN 689:2018+C1:2019.
          Bij n&lt;6: §5.5.2 voorlopige drempeltoets. Bij n≥6: Bijlage F toets (U_R vs U_T).
        </p>
      </div>

      <div className="rounded-lg bg-zinc-50 px-4 py-3 text-xs text-zinc-500 dark:bg-zinc-800/50 dark:text-zinc-400">
        <strong>Toetsregels (NEN-EN 689:2018+C1:2019):</strong>{' '}
        n&lt;6: §5.5.2 — Aanvaardbaar als alle waarden &lt; drempel×OELV; Niet-aanvaardbaar als
        een waarde &gt; OELV.{' '}
        n≥6: Bijlage F — Aanvaardbaar als U_R ≥ U_T (Tabel F.1); anders Niet-aanvaardbaar.
      </div>

      {hasRespiratorPPE && (
        <div className="rounded-lg bg-amber-50 px-4 py-3 text-xs text-amber-700 dark:bg-amber-900/15 dark:text-amber-400">
          <strong>Let op — PBM-correctie vereist (NEN-EN 689:2018+C1:2019, §5.3.2):</strong>{' '}
          Voor één of meer VBG's is een ademhalingsbeschermingsmiddel (ABM) opgegeven. Als de
          metingen zijn verricht terwijl het ABM gedragen werd, geven de meetwaarden de
          werkelijke inademing <em>niet</em> correct weer. Corrigeer de gemeten concentraties
          met de toewijzingsbeschermingsfactor (APF) vóór statistische analyse.
        </div>
      )}

      {hasLongShift && (
        <div className="rounded-lg bg-amber-50 px-4 py-3 text-xs text-amber-700 dark:bg-amber-900/15 dark:text-amber-400">
          <strong>Let op — Dienst &gt; 8 uur (NEN-EN 689:2018+C1:2019, Bijlage G):</strong>{' '}
          Voor één of meer VBG's is een blootstellingsduur van meer dan 8 uur per dag opgegeven.
          Bereken conform Bijlage G formule G.1 de afgeleide dagblootstelling:{' '}
          <em>
            E<sub>d</sub> = C<sub>i</sub> × t / 8
          </em>{' '}
          (gemeten concentratie × dienstverlening in uren ÷ 8). Vergelijk E<sub>d</sub> — niet{' '}
          C<sub>i</sub> — met de OELV in de statistische toets hieronder.
        </div>
      )}

      {!hasAnyStats && (
        <div className="rounded-lg bg-amber-50 px-4 py-4 text-sm text-amber-700 dark:bg-amber-900/15 dark:text-amber-400">
          Nog geen meetplannen met voldoende meetwaarden (min. 3 per plan). Voer meetwaarden in
          bij stap 7.
        </div>
      )}

      <div className="space-y-4">
        {planStats.map(({ plan, planLabel, validValues, stats, hasOEL }) => (
          <PlanStatsCard
            key={plan.id}
            planLabel={planLabel}
            n={validValues.length}
            stats={stats}
            hasOEL={hasOEL}
          />
        ))}
      </div>

      {/* Mixture IE */}
      {mixtureResults.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Mengselbeoordeling — Interactie-index (IE = Σ GM<sub>i</sub> / OELV<sub>i</sub>)
          </h3>
          <div className="rounded-lg bg-zinc-50 px-4 py-3 text-xs text-zinc-500 dark:bg-zinc-800/50 dark:text-zinc-400">
            De IE telt gecombineerde blootstelling op bij additieve toxiciteit (zelfde doelorgaan).
            IE &lt; 1 = aanvaardbaar; IE ≥ 1 = niet-aanvaardbaar. Conform NEN-EN 689:2018+C1:2019, Bijlage C.{' '}
            <span className="text-zinc-400 dark:text-zinc-500">
              GM wordt hier gebruikt als proxy voor E<sub>i</sub> (representatieve blootstelling
              per stof). Voer voor Tier-2 analyse (Bijlage C §2) per doelorgaan een gedetailleerde
              IE-berekening uit op individuele meetwaarden.
            </span>
          </div>
          {mixtureResults.map((mr) => (
            <div
              key={mr.segId}
              className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-800/30"
            >
              <div className="mb-3 flex items-center justify-between gap-4">
                <p className="font-semibold text-zinc-900 dark:text-zinc-50">{mr.segName}</p>
                <VerdictBadge verdict={mr.ieVerdict} label={mr.ieLabel} />
              </div>
              <div className="overflow-hidden rounded-lg border border-zinc-100 dark:border-zinc-800">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-800/50">
                      <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">
                        Stof
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-zinc-500">
                        GM
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-zinc-500">
                        OELV
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-zinc-500">
                        GM / OELV
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {mr.contributions.map((c) => (
                      <tr key={c.substanceName}>
                        <td className="px-3 py-2 text-zinc-700 dark:text-zinc-300">
                          {c.substanceName}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-xs text-zinc-500 dark:text-zinc-400">
                          {fmt(c.gm)} {c.unit}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-xs text-zinc-500 dark:text-zinc-400">
                          {c.oelv} {c.unit}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                          {fmt(c.ratio)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-zinc-50 dark:bg-zinc-800/50">
                      <td
                        className="px-3 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400"
                        colSpan={3}
                      >
                        IE totaal
                      </td>
                      <td
                        className={`px-3 py-2 text-right font-mono text-sm font-bold ${
                          mr.ie >= 1
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {fmt(mr.ie)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
