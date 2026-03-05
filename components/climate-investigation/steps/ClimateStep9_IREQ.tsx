'use client';

import type { ClimateInvestigation } from '@/lib/climate-investigation-types';
import { METABOLIC_CLASSES } from '@/lib/climate-investigation-types';
import { computeAllClimateStatistics, verdictBadgeClass, getMetabolicRate } from '@/lib/climate-stats';
import { Abbr } from '@/components/Abbr';
import { InfoBox } from '@/components/InfoBox';
import { Alert } from '@/components/ui';
import InlineStepHeader from '@/components/InlineStepHeader';
import InlineEdit from '@/components/InlineEdit';
import MarkdownContent from '@/components/MarkdownContent';

const STEP_KEY = 'step.9';
const NS = 'investigation.climate';
const FALLBACK_TITLE = 'Stap 10 — Koudestress (IREQ)';
const FALLBACK_DESC = 'Koudestressanalyse conform ISO 11079:2007. De Insulation REQuired bepaalt de benodigde kledinginsulatie voor thermisch neutraal (IREQneutral) en thermisch evenwicht (IREQmin). Als de beschikbare kleding onvoldoende is, wordt de maximale blootstellingstijd D_lim berekend.';

const FALLBACK_IB0_TITLE = 'ISO 11079:2007 — IREQ begrippen';

interface Props {
  investigation: ClimateInvestigation;
  onUpdate: (partial: Partial<ClimateInvestigation>) => void;
  contentOverrides?: Record<string, string>;
}

function fmt2(v: number | undefined | null): string {
  return v != null ? v.toFixed(2) : '—';
}

function fmt0(v: number | undefined | null): string {
  return v != null ? Math.round(v).toString() : '—';
}

export default function ClimateStep9_IREQ({ investigation, onUpdate: _onUpdate, contentOverrides }: Props) {
  const { bgs, scenarios } = investigation;

  const title = contentOverrides?.[`${STEP_KEY}.title`] ?? FALLBACK_TITLE;
  const desc = contentOverrides?.[`${STEP_KEY}.desc`];
  const ib0Title = contentOverrides?.[`${STEP_KEY}.infobox.0.title`] ?? FALLBACK_IB0_TITLE;
  const ib0Content = contentOverrides?.[`${STEP_KEY}.infobox.0.content`];

  const isRelevant = scenarios.includes('cold');

  if (!isRelevant) {
    return (
      <div className="space-y-4">
        <InlineStepHeader namespace={NS} stepKey={STEP_KEY} fallbackTitle={FALLBACK_TITLE} title={title} />
        <Alert variant="neutral">
          Dit scenario is niet geselecteerd. Selecteer &ldquo;Koudestress&rdquo; in stap 4 om de IREQ-analyse in te schakelen.
        </Alert>
      </div>
    );
  }

  if (bgs.length === 0) {
    return (
      <div className="space-y-4">
        <InlineStepHeader namespace={NS} stepKey={STEP_KEY} fallbackTitle={FALLBACK_TITLE} title={title} />
        <Alert variant="warning">
          Definieer eerst blootstellingsgroepen in stap 3.
        </Alert>
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
        <InlineStepHeader namespace={NS} stepKey={STEP_KEY} fallbackTitle={FALLBACK_TITLE} title={title} />
        <InlineEdit namespace={NS} contentKey={`${STEP_KEY}.desc`}
          initialValue={desc ?? FALLBACK_DESC} fallback={FALLBACK_DESC} multiline markdown>
          {desc
            ? <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                <MarkdownContent>{desc}</MarkdownContent>
              </p>
            : <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                Koudestressanalyse conform <Abbr id="ISO11079">ISO 11079:2007</Abbr>. De{' '}
                <Abbr id="IREQ">Insulation REQuired</Abbr> bepaalt de benodigde kledinginsulatie voor
                thermisch neutraal (IREQneutral) en thermisch evenwicht (IREQmin). Als de beschikbare
                kleding onvoldoende is, wordt de maximale blootstellingstijd D_lim berekend.
              </p>
          }
        </InlineEdit>
      </div>

      <InfoBox title={
        <InlineEdit namespace={NS} contentKey={`${STEP_KEY}.infobox.0.title`}
          initialValue={ib0Title} fallback={FALLBACK_IB0_TITLE}>
          {ib0Title}
        </InlineEdit>
      }>
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
                      <Alert variant="error">
                        <p className="font-semibold">Onvoldoende kledinginsulatie voor thermisch evenwicht</p>
                        <p className="mt-0.5 text-xs">
                          De beschikbare kleding ({stat.ireqAvailable} clo) is onvoldoende voor het IREQmin ({stat.ireqMin} clo).
                          Verhoog de kledinginsulatie direct of beperk blootstelling tot maximaal 30 minuten per periode.
                        </p>
                      </Alert>
                    )}

                    {stat.ireqVerdict === 'cool' && stat.ireqDlimMin != null && (
                      <Alert variant="warning">
                        <p className="font-semibold">Koelstress — blootstelling beperken tot {stat.ireqDlimMin} minuten</p>
                        <p className="mt-0.5 text-xs">
                          Kleding ({stat.ireqAvailable} clo) is voldoende voor thermisch evenwicht (IREQmin = {stat.ireqMin} clo)
                          maar onvoldoende voor comfort (IREQneutral = {stat.ireqNeutral} clo).
                          Organiseer werkroulatie met verwarmingspauzes.
                        </p>
                      </Alert>
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
