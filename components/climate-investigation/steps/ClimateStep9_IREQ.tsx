'use client';

import type { ClimateInvestigation } from '@/lib/climate-investigation-types';
import { METABOLIC_CLASSES } from '@/lib/climate-investigation-types';
import { computeAllClimateStatistics, verdictBadgeClass, getMetabolicRate } from '@/lib/climate-stats';
import { Abbr } from '@/components/Abbr';
import { InfoBox } from '@/components/InfoBox';

interface Props {
  investigation: ClimateInvestigation;
  onUpdate: (partial: Partial<ClimateInvestigation>) => void;
}

function fmt2(v: number | undefined | null): string {
  return v != null ? v.toFixed(2) : '—';
}

function fmt0(v: number | undefined | null): string {
  return v != null ? Math.round(v).toString() : '—';
}

export default function ClimateStep9_IREQ({ investigation, onUpdate: _onUpdate }: Props) {
  const { bgs, scenarios } = investigation;

  const isRelevant = scenarios.includes('cold');

  if (!isRelevant) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Stap 10 — Koudestress (<Abbr id="IREQ">IREQ</Abbr>)
        </h2>
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800/30 dark:text-zinc-400">
          Dit scenario is niet geselecteerd. Selecteer &ldquo;Koudestress&rdquo; in stap 4 om de IREQ-analyse in te schakelen.
        </div>
      </div>
    );
  }

  if (bgs.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Stap 10 — Koudestress (IREQ)</h2>
        <div className="rounded-lg bg-amber-50 px-4 py-4 text-sm text-amber-700 dark:bg-amber-900/15 dark:text-amber-400">
          Definieer eerst blootstellingsgroepen in stap 3.
        </div>
      </div>
    );
  }

  const statistics = computeAllClimateStatistics(investigation);

  const VERDICT_BORDER: Record<string, string> = {
    comfortable: 'border-emerald-400 dark:border-emerald-600',
    cool:        'border-amber-400 dark:border-amber-600',
    danger:      'border-red-400 dark:border-red-600',
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Stap 10 — Koudestress (<Abbr id="IREQ">IREQ</Abbr>)
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          Koudestressanalyse conform <Abbr id="ISO11079">ISO 11079:2007</Abbr>. De{' '}
          <Abbr id="IREQ">Insulation REQuired</Abbr> bepaalt de benodigde kledinginsulatie voor
          thermisch neutraal (IREQneutral) en thermisch evenwicht (IREQmin). Als de beschikbare
          kleding onvoldoende is, wordt de maximale blootstellingstijd D_lim berekend.
        </p>
      </div>

      <InfoBox title="ISO 11079:2007 — IREQ begrippen">
        <div className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400">
          <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
            <div className="rounded bg-zinc-100 px-2 py-1.5 dark:bg-zinc-800">
              <p className="font-semibold">IREQneutral</p>
              <p>Kledinginsulatie voor thermisch comfortabel (neutraal) gevoel — geen koelstress.</p>
            </div>
            <div className="rounded bg-zinc-100 px-2 py-1.5 dark:bg-zinc-800">
              <p className="font-semibold">IREQmin</p>
              <p>Minimale kledinginsulatie voor thermisch evenwicht — koelgevoel maar fysiologisch acceptabel.</p>
            </div>
            <div className="rounded bg-zinc-100 px-2 py-1.5 dark:bg-zinc-800">
              <p className="font-semibold">I_cl,r (beschikbaar)</p>
              <p>Werkelijke kledinginsulatie die de medewerker draagt (uit BG-configuratie).</p>
            </div>
            <div className="rounded bg-zinc-100 px-2 py-1.5 dark:bg-zinc-800">
              <p className="font-semibold">D_lim</p>
              <p>Maximale ononderbroken blootstellingstijd (min) als kleding onvoldoende is.</p>
            </div>
          </div>
          <div className="mt-2 rounded border border-blue-200 bg-blue-50 px-2 py-1.5 dark:border-blue-800/40 dark:bg-blue-900/10">
            <p className="font-semibold text-blue-700 dark:text-blue-400">Beoordelingsschema</p>
            <p className="text-blue-600 dark:text-blue-400">
              I_cl,r ≥ IREQneutral → Comfortabel &nbsp;|&nbsp;
              IREQmin ≤ I_cl,r &lt; IREQneutral → Koelstress (D_lim geldt) &nbsp;|&nbsp;
              I_cl,r &lt; IREQmin → Gevaarlijk
            </p>
          </div>
          <p className="text-zinc-400 dark:text-zinc-500">
            Vereenvoudigd model — voor de volledige iteratieve IREQ-berekening (incl. lokale koeling
            en bewegingseffect) raadpleeg ISO 11079:2007 Bijlage A.
          </p>
        </div>
      </InfoBox>

      <div className="space-y-5">
        {bgs.map((bg, bgIdx) => {
          const stat = statistics.find((s) => s.bgId === bg.id);
          const hasResult = stat?.ireqNeutral != null;
          const borderCls = hasResult && stat?.ireqVerdictColor
            ? VERDICT_BORDER[stat.ireqVerdict ?? ''] ?? 'border-zinc-200 dark:border-zinc-700'
            : 'border-zinc-200 dark:border-zinc-700';

          const M = getMetabolicRate(bg);
          const hasMeasurements = stat != null && stat.n > 0;

          return (
            <div key={bg.id} className={`rounded-xl border-2 bg-white dark:bg-zinc-900 ${borderCls}`}>
              {/* Header */}
              <div className="flex items-center justify-between gap-3 border-b border-zinc-200 px-5 py-3 dark:border-zinc-700">
                <div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    BG {bgIdx + 1}/{bgs.length}: {bg.name}
                  </p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">
                    M = {M} W/m² · {METABOLIC_CLASSES[bg.metabolicClass].label} ·{' '}
                    I_cl = {bg.clothingInsulation} clo · werkdag {bg.workHoursPerDay} h
                  </p>
                </div>
                {hasResult && stat?.ireqVerdict && (
                  <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${verdictBadgeClass(stat.ireqVerdictColor!)}`}>
                    {stat.ireqVerdictLabel}
                  </span>
                )}
              </div>

              <div className="p-5">
                {!hasMeasurements ? (
                  <p className="text-sm text-zinc-400 dark:text-zinc-500">
                    Geen meetwaarden beschikbaar voor deze BG. Voer t_a, t_r en v_ar in (stap 6).
                  </p>
                ) : !hasResult ? (
                  <p className="text-sm text-zinc-400 dark:text-zinc-500">
                    IREQ-berekening niet beschikbaar — controleer de meetwaarden.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {/* Kledingvergelijking */}
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                      <div className="rounded-lg bg-zinc-50 px-3 py-2.5 text-center dark:bg-zinc-800/30">
                        <p className="text-xs text-zinc-400 dark:text-zinc-500">IREQneutral</p>
                        <p className="mt-0.5 text-xl font-bold tabular-nums text-zinc-800 dark:text-zinc-200">
                          {fmt2(stat.ireqNeutral)} clo
                        </p>
                        <p className="text-xs text-zinc-400">Comfortabel</p>
                      </div>
                      <div className="rounded-lg bg-zinc-50 px-3 py-2.5 text-center dark:bg-zinc-800/30">
                        <p className="text-xs text-zinc-400 dark:text-zinc-500">IREQmin</p>
                        <p className="mt-0.5 text-xl font-bold tabular-nums text-zinc-800 dark:text-zinc-200">
                          {fmt2(stat.ireqMin)} clo
                        </p>
                        <p className="text-xs text-zinc-400">Minimaal veilig</p>
                      </div>
                      <div className="rounded-lg bg-zinc-50 px-3 py-2.5 text-center dark:bg-zinc-800/30">
                        <p className="text-xs text-zinc-400 dark:text-zinc-500">I_cl,r beschikbaar</p>
                        <p className={`mt-0.5 text-xl font-bold tabular-nums ${
                          stat.ireqVerdict === 'comfortable'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : stat.ireqVerdict === 'cool'
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-red-600 dark:text-red-400'
                        }`}>
                          {fmt2(stat.ireqAvailable)} clo
                        </p>
                        <p className="text-xs text-zinc-400">Werkelijke kleding</p>
                      </div>
                      <div className="rounded-lg bg-zinc-50 px-3 py-2.5 text-center dark:bg-zinc-800/30">
                        <p className="text-xs text-zinc-400 dark:text-zinc-500">D_lim</p>
                        <p className={`mt-0.5 text-xl font-bold tabular-nums ${
                          stat.ireqDlimMin != null
                            ? stat.ireqDlimMin <= 30
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-amber-600 dark:text-amber-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {stat.ireqDlimMin != null ? `${fmt0(stat.ireqDlimMin)} min` : 'Geen'}
                        </p>
                        <p className="text-xs text-zinc-400">Max. blootstellingstijd</p>
                      </div>
                    </div>

                    {/* Visuele kledingbalk */}
                    {stat.ireqNeutral != null && (
                      <div>
                        <p className="mb-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">Kledinginsulatie-overzicht</p>
                        <div className="relative h-8 w-full rounded-full bg-zinc-100 dark:bg-zinc-800">
                          {/* IREQmin marker */}
                          <div
                            className="absolute top-0 h-full w-0.5 bg-amber-400"
                            style={{ left: `${Math.min((stat.ireqMin! / Math.max(stat.ireqNeutral! * 1.5, 4)) * 100, 95)}%` }}
                            title={`IREQmin: ${stat.ireqMin} clo`}
                          />
                          {/* IREQneutral marker */}
                          <div
                            className="absolute top-0 h-full w-0.5 bg-emerald-400"
                            style={{ left: `${Math.min((stat.ireqNeutral! / Math.max(stat.ireqNeutral! * 1.5, 4)) * 100, 95)}%` }}
                            title={`IREQneutral: ${stat.ireqNeutral} clo`}
                          />
                          {/* Available marker */}
                          <div
                            className={`absolute top-1 h-6 w-1.5 -translate-x-0.5 rounded-full ${
                              stat.ireqVerdict === 'comfortable' ? 'bg-emerald-500' :
                              stat.ireqVerdict === 'cool' ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                            style={{ left: `${Math.min((stat.ireqAvailable! / Math.max(stat.ireqNeutral! * 1.5, 4)) * 100, 98)}%` }}
                            title={`Beschikbaar: ${stat.ireqAvailable} clo`}
                          />
                        </div>
                        <div className="mt-0.5 flex gap-4 text-xs text-zinc-400">
                          <span className="flex items-center gap-1"><span className="h-2 w-2 inline-block bg-amber-400 rounded-full" /> IREQmin</span>
                          <span className="flex items-center gap-1"><span className="h-2 w-2 inline-block bg-emerald-400 rounded-full" /> IREQneutral</span>
                          <span className="flex items-center gap-1"><span className={`h-2 w-2 inline-block rounded-full ${stat.ireqVerdict === 'comfortable' ? 'bg-emerald-500' : stat.ireqVerdict === 'cool' ? 'bg-amber-500' : 'bg-red-500'}`} /> I_cl,r beschikbaar</span>
                        </div>
                      </div>
                    )}

                    {/* Oordeel kleurblok */}
                    {stat.ireqVerdictColor && (
                      <div className={`rounded-lg px-3 py-2 text-sm font-medium ${verdictBadgeClass(stat.ireqVerdictColor)}`}>
                        {stat.ireqVerdictLabel}
                      </div>
                    )}

                    {/* Aanbevelingen bij onvoldoende kleding */}
                    {stat.ireqVerdict === 'danger' && (
                      <div className="flex items-start gap-3 rounded-lg bg-red-50 px-4 py-3 text-sm dark:bg-red-900/15">
                        <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                        </svg>
                        <div>
                          <p className="font-semibold text-red-800 dark:text-red-300">Onvoldoende kledinginsulatie voor thermisch evenwicht</p>
                          <p className="mt-0.5 text-xs text-red-700 dark:text-red-400">
                            De beschikbare kleding ({stat.ireqAvailable} clo) is onvoldoende voor het IREQmin ({stat.ireqMin} clo).
                            Verhoog de kledinginsulatie direct of beperk blootstelling tot maximaal 30 minuten per periode.
                          </p>
                        </div>
                      </div>
                    )}

                    {stat.ireqVerdict === 'cool' && stat.ireqDlimMin != null && (
                      <div className="flex items-start gap-3 rounded-lg bg-amber-50 px-4 py-3 text-sm dark:bg-amber-900/15">
                        <svg className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                        </svg>
                        <div>
                          <p className="font-semibold text-amber-800 dark:text-amber-300">
                            Koelstress — blootstelling beperken tot {stat.ireqDlimMin} minuten
                          </p>
                          <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-400">
                            Kleding ({stat.ireqAvailable} clo) is voldoende voor thermisch evenwicht (IREQmin = {stat.ireqMin} clo)
                            maar onvoldoende voor comfort (IREQneutral = {stat.ireqNeutral} clo).
                            Organiseer werkroulatie met verwarmingspauzes.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Samenvatting */}
      {bgs.length > 1 && (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800/30">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Samenvatting IREQ alle blootstellingsgroepen
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-700">
                  <th className="pb-1.5 text-left font-semibold">BG</th>
                  <th className="pb-1.5 text-right font-semibold">IREQmin (clo)</th>
                  <th className="pb-1.5 text-right font-semibold">IREQneutral (clo)</th>
                  <th className="pb-1.5 text-right font-semibold">I_cl,r (clo)</th>
                  <th className="pb-1.5 text-right font-semibold">D_lim</th>
                  <th className="pb-1.5 pl-3 text-left font-semibold">Oordeel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {bgs.map((bg, idx) => {
                  const stat = statistics.find((s) => s.bgId === bg.id);
                  return (
                    <tr key={bg.id}>
                      <td className="py-1.5">BG {idx + 1}: {bg.name}</td>
                      <td className="py-1.5 text-right font-mono">{fmt2(stat?.ireqMin)}</td>
                      <td className="py-1.5 text-right font-mono">{fmt2(stat?.ireqNeutral)}</td>
                      <td className="py-1.5 text-right font-mono">{fmt2(stat?.ireqAvailable)}</td>
                      <td className="py-1.5 text-right font-mono">
                        {stat?.ireqDlimMin != null ? `${stat.ireqDlimMin} min` : '—'}
                      </td>
                      <td className="py-1.5 pl-3">
                        {stat?.ireqVerdictColor ? (
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${verdictBadgeClass(stat.ireqVerdictColor)}`}>
                            {stat.ireqVerdictLabel}
                          </span>
                        ) : <span className="text-zinc-400">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
