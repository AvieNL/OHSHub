'use client';

import type { ClimateInvestigation } from '@/lib/climate-investigation-types';
import { METABOLIC_CLASSES } from '@/lib/climate-investigation-types';
import { computeAllClimateStatistics, pmvCategoryBadgeClass, getMetabolicRate } from '@/lib/climate-stats';
import { Abbr } from '@/components/Abbr';
import { Formula } from '@/components/Formula';
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

export default function ClimateStep6_PMV({ investigation, onUpdate }: Props) {
  const { bgs, scenarios } = investigation;

  const isRelevant = scenarios.includes('comfort');

  if (!isRelevant) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Stap 7 — Thermisch comfort (<Abbr id="PMV">PMV</Abbr>/<Abbr id="PPD">PPD</Abbr>)
        </h2>
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800/30 dark:text-zinc-400">
          Dit scenario is niet geselecteerd. Selecteer &ldquo;Thermisch comfort&rdquo; in stap 4 om de PMV/PPD-beoordeling in te schakelen.
        </div>
      </div>
    );
  }

  if (bgs.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Stap 7 — Thermisch comfort (PMV/PPD)</h2>
        <div className="rounded-lg bg-amber-50 px-4 py-4 text-sm text-amber-700 dark:bg-amber-900/15 dark:text-amber-400">
          Definieer eerst blootstellingsgroepen in stap 3.
        </div>
      </div>
    );
  }

  // Herbereken statistieken altijd vers
  const statistics = computeAllClimateStatistics(investigation);

  const COLOR_RING: Record<string, string> = {
    emerald: 'border-emerald-400 dark:border-emerald-600',
    amber:   'border-amber-400 dark:border-amber-600',
    orange:  'border-orange-400 dark:border-orange-600',
    red:     'border-red-400 dark:border-red-600',
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Stap 7 — Thermisch comfort (<Abbr id="PMV">PMV</Abbr>/<Abbr id="PPD">PPD</Abbr>)
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          Berekening van de <Abbr id="PMV">Predicted Mean Vote</Abbr> en{' '}
          <Abbr id="PPD">Predicted Percentage Dissatisfied</Abbr> conform{' '}
          <Abbr id="ISO7730">ISO 7730:2025</Abbr> op basis van de ingevoerde meetwaarden per BG.
        </p>
      </div>

      <InfoBox title="ISO 7730:2025 — PMV/PPD beoordelingscriteria (Tabel 1)">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-700">
                <th className="px-2 py-1.5 text-left font-semibold">Categorie</th>
                <th className="px-2 py-1.5 text-left font-semibold">PMV-bereik</th>
                <th className="px-2 py-1.5 text-left font-semibold">PPD (%)</th>
                <th className="px-2 py-1.5 text-left font-semibold">Toepassing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {[
                { cat: 'A', pmv: '−0,5 tot +0,5', ppd: '< 6%',  app: 'Hoge comforteisen: ziekenhuizen, crèches, studioruimtes' },
                { cat: 'B', pmv: '−0,7 tot +0,7', ppd: '< 10%', app: 'Normaal binnenklimaat: kantoren, klaslokalen, hotels' },
                { cat: 'C', pmv: '−1,0 tot +1,0', ppd: '< 15%', app: 'Acceptabel: ruimten met lagere comforteisen' },
                { cat: 'D', pmv: 'Buiten ±1,0',   ppd: '≥ 15%', app: 'Oncomfortabel — maatregelen noodzakelijk' },
              ].map((row) => (
                <tr key={row.cat}>
                  <td className="px-2 py-1.5 font-semibold">{row.cat}</td>
                  <td className="px-2 py-1.5 font-mono">{row.pmv}</td>
                  <td className="px-2 py-1.5">{row.ppd}</td>
                  <td className="px-2 py-1.5 text-zinc-500 dark:text-zinc-400">{row.app}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </InfoBox>

      <div className="space-y-5">
        {bgs.map((bg, bgIdx) => {
          const stat = statistics.find((s) => s.bgId === bg.id);
          const hasResult = stat?.pmv != null;
          const borderCls = hasResult && stat?.pmvColor ? COLOR_RING[stat.pmvColor] : 'border-zinc-200 dark:border-zinc-700';

          return (
            <div key={bg.id} className={`rounded-xl border-2 bg-white dark:bg-zinc-900 ${borderCls}`}>
              {/* Header */}
              <div className="flex items-center justify-between gap-3 border-b border-zinc-200 px-5 py-3 dark:border-zinc-700">
                <div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    BG {bgIdx + 1}/{bgs.length}: {bg.name}
                  </p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">
                    M = {getMetabolicRate(bg)} W/m² · I_cl = {bg.clothingInsulation} clo ·{' '}
                    {METABOLIC_CLASSES[bg.metabolicClass].label}
                  </p>
                </div>
                {hasResult && stat?.pmvCategory && (
                  <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${pmvCategoryBadgeClass(stat.pmvCategory)}`}>
                    Categorie {stat.pmvCategory}
                  </span>
                )}
              </div>

              <div className="p-5">
                {!hasResult ? (
                  <p className="text-sm text-zinc-400 dark:text-zinc-500">
                    Geen geldige meetwaarden beschikbaar. Voer meetwaarden in stap 6 in.
                    <br />
                    <span className="text-xs">Vereist: t_a, v_ar, RH en t_g of t_r.</span>
                  </p>
                ) : (
                  <div className="space-y-4">
                    {/* Main result */}
                    <div className="flex flex-wrap items-center gap-6">
                      <div className="text-center">
                        <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500">PMV</p>
                        <p className={`mt-0.5 text-3xl font-bold tabular-nums ${
                          stat.pmvColor === 'emerald' ? 'text-emerald-600 dark:text-emerald-400' :
                          stat.pmvColor === 'amber'   ? 'text-amber-600 dark:text-amber-400' :
                          stat.pmvColor === 'orange'  ? 'text-orange-600 dark:text-orange-400' :
                          'text-red-600 dark:text-red-400'
                        }`}>
                          {fmt2(stat.pmv)}
                        </p>
                        <p className="text-xs text-zinc-400">Predicted Mean Vote</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500">PPD</p>
                        <p className="mt-0.5 text-3xl font-bold tabular-nums text-zinc-700 dark:text-zinc-300">
                          {fmt0(stat.ppd)}%
                        </p>
                        <p className="text-xs text-zinc-400">Predicted % Dissatisfied</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500">Metingen</p>
                        <p className="mt-0.5 text-2xl font-bold tabular-nums text-zinc-700 dark:text-zinc-300">
                          {stat.n}
                        </p>
                        <p className="text-xs text-zinc-400">Gemiddeld n = {stat.n}</p>
                      </div>
                    </div>

                    {/* Category label */}
                    {stat.pmvCategoryLabel && (
                      <div className={`rounded-lg px-3 py-2 text-sm font-medium ${pmvCategoryBadgeClass(stat.pmvCategory!)}`}>
                        {stat.pmvCategoryLabel}
                      </div>
                    )}

                    {/* Per-measurement breakdown */}
                    {stat.pmvPerMeasurement && stat.pmvPerMeasurement.length > 1 && (
                      <div>
                        <p className="mb-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">PMV per meting</p>
                        <div className="flex flex-wrap gap-1.5">
                          {stat.pmvPerMeasurement.map((v, i) => (
                            <span key={i} className="rounded bg-zinc-100 px-2 py-0.5 text-xs font-mono text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                              M{i + 1}: {v > 0 ? '+' : ''}{v.toFixed(2)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* PMV formula reference */}
                    <InfoBox title="ISO 7730:2025 vergelijkingen (1) + (2)" defaultOpen={false}>
                      <div className="space-y-1 text-xs">
                        <p><Formula math="PMV = (0{,}303 \cdot e^{-0{,}036M} + 0{,}028) \cdot L" /></p>
                        <p className="text-zinc-500">waarbij L de thermische belasting is (W/m²): combinatie van metabole belasting minus alle warmteverliezen.</p>
                        <p className="mt-1"><Formula math="PPD = 100 - 95 \cdot e^{-0{,}03353 \cdot PMV^4 - 0{,}2179 \cdot PMV^2}" /></p>
                        <p className="text-zinc-500">Geldigheid: M 46–232 W/m², t_a 10–30°C, v_ar 0–1 m/s, t_r 10–40°C.</p>
                      </div>
                    </InfoBox>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
