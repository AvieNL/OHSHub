'use client';

import type { ClimateInvestigation } from '@/lib/climate-investigation-types';
import { computeAllClimateStatistics, pmvCategoryBadgeClass } from '@/lib/climate-stats';
import { Abbr } from '@/components/Abbr';
import { InfoBox } from '@/components/InfoBox';

interface Props {
  investigation: ClimateInvestigation;
  onUpdate: (partial: Partial<ClimateInvestigation>) => void;
}

function fmt1(v: number | undefined | null): string {
  return v != null ? v.toFixed(1) : '—';
}

function fmt0(v: number | undefined | null): string {
  return v != null ? Math.round(v).toString() : '—';
}

type PMVCat = 'A' | 'B' | 'C' | 'D';

// ISO 7730:2025 Tabel 1 — lokaal oncomfortcriteria
const LOCAL_CRITERIA = {
  dr: {
    A: 10, B: 20, C: 30,
    label: 'Tochtpercentage DR (%)',
    norm: 'ISO 7730:2025 §6.2',
  },
  verticalTemp: {
    A: 2, B: 3, C: 4,
    label: 'Verticaal Δt hoofd–enkel (K)',
    norm: 'ISO 7730:2025 §6.3',
  },
  floorTemp: {
    ok: '19–29 °C',
    A: '22–28 °C',
    label: 'Vloertemperatuur',
    norm: 'ISO 7730:2025 §6.4',
  },
  radAsym: {
    warmCeiling: { A: 5, C: 14, label: 'Warm plafond', norm: 'ISO 7730:2025 §6.5' },
    coldWall:    { A: 10, C: 23, label: 'Koude wand',  norm: 'ISO 7730:2025 §6.5' },
    warmWindow:  { A: 10, C: 35, label: 'Warm venster', norm: 'ISO 7730:2025 §6.5' },
  },
};

function CategoryBadge({ cat }: { cat: PMVCat }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${pmvCategoryBadgeClass(cat)}`}>
      Cat. {cat}
    </span>
  );
}

function ScoreRow({
  label, value, unit, category, limit_a, limit_b, limit_c, norm,
}: {
  label: string;
  value: string;
  unit: string;
  category?: PMVCat;
  limit_a?: number;
  limit_b?: number;
  limit_c?: number;
  norm: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-100 px-3 py-2.5 dark:border-zinc-800">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{label}</p>
        <p className="text-xs text-zinc-400 dark:text-zinc-500">{norm}</p>
        {limit_a != null && (
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            Cat. A &lt; {limit_a} {unit} &nbsp;|&nbsp;
            {limit_b && `Cat. B < ${limit_b} ${unit} |`}&nbsp;
            Cat. C &lt; {limit_c} {unit}
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="text-sm font-bold tabular-nums text-zinc-800 dark:text-zinc-200">
          {value} {unit}
        </span>
        {category && <CategoryBadge cat={category} />}
      </div>
    </div>
  );
}

export default function ClimateStep10_LocalComfort({ investigation, onUpdate: _onUpdate }: Props) {
  const { bgs, scenarios } = investigation;

  const isRelevant = scenarios.includes('local');

  if (!isRelevant) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Stap 11 — Lokaal thermisch comfort
        </h2>
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800/30 dark:text-zinc-400">
          Dit scenario is niet geselecteerd. Selecteer &ldquo;Lokaal thermisch comfort&rdquo; in stap 4 om
          de lokale comfortbeoordeling in te schakelen.
        </div>
      </div>
    );
  }

  if (bgs.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Stap 11 — Lokaal thermisch comfort</h2>
        <div className="rounded-lg bg-amber-50 px-4 py-4 text-sm text-amber-700 dark:bg-amber-900/15 dark:text-amber-400">
          Definieer eerst blootstellingsgroepen in stap 3.
        </div>
      </div>
    );
  }

  const statistics = computeAllClimateStatistics(investigation);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Stap 11 — Lokaal thermisch comfort
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          Beoordeling van lokale thermische oncomfortbronnen conform{' '}
          <Abbr id="ISO7730">ISO 7730:2025</Abbr> §6: tocht (<Abbr id="DR">DR</Abbr>),
          verticaal temperatuurverschil, vloertemperatuur en stralingsasymmetrie.
        </p>
      </div>

      {/* Normen overzicht */}
      <InfoBox title="ISO 7730:2025 §6 — Beoordelingscriteria lokaal comfort (Tabel 1)">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-700">
                <th className="px-2 py-1.5 text-left font-semibold">Parameter</th>
                <th className="px-2 py-1.5 text-center font-semibold">Cat. A</th>
                <th className="px-2 py-1.5 text-center font-semibold">Cat. B</th>
                <th className="px-2 py-1.5 text-center font-semibold">Cat. C</th>
                <th className="px-2 py-1.5 text-left font-semibold">Noot</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              <tr>
                <td className="px-2 py-1.5">Tochtpercentage DR (%)</td>
                <td className="px-2 py-1.5 text-center font-mono">&lt; 10</td>
                <td className="px-2 py-1.5 text-center font-mono">&lt; 20</td>
                <td className="px-2 py-1.5 text-center font-mono">&lt; 30</td>
                <td className="px-2 py-1.5 text-zinc-500">v_ar &gt; 0,05 m/s</td>
              </tr>
              <tr>
                <td className="px-2 py-1.5">Verticaal Δt hoofd–enkel (K)</td>
                <td className="px-2 py-1.5 text-center font-mono">&lt; 2</td>
                <td className="px-2 py-1.5 text-center font-mono">&lt; 3</td>
                <td className="px-2 py-1.5 text-center font-mono">&lt; 4</td>
                <td className="px-2 py-1.5 text-zinc-500">0,1 m – 1,1 m (zittend)</td>
              </tr>
              <tr>
                <td className="px-2 py-1.5">Vloertemperatuur (°C)</td>
                <td className="px-2 py-1.5 text-center font-mono">22–28</td>
                <td className="px-2 py-1.5 text-center font-mono">19–29</td>
                <td className="px-2 py-1.5 text-center font-mono">17–31</td>
                <td className="px-2 py-1.5 text-zinc-500">Voor zittend werk</td>
              </tr>
              <tr>
                <td className="px-2 py-1.5">Stralingsasymm. warm plafond (K)</td>
                <td className="px-2 py-1.5 text-center font-mono">&lt; 5</td>
                <td className="px-2 py-1.5 text-center font-mono">&lt; 10</td>
                <td className="px-2 py-1.5 text-center font-mono">&lt; 14</td>
                <td className="px-2 py-1.5 text-zinc-500">Δt_pr planair</td>
              </tr>
              <tr>
                <td className="px-2 py-1.5">Stralingsasymm. koude wand (K)</td>
                <td className="px-2 py-1.5 text-center font-mono">&lt; 10</td>
                <td className="px-2 py-1.5 text-center font-mono">&lt; 16</td>
                <td className="px-2 py-1.5 text-center font-mono">&lt; 23</td>
                <td className="px-2 py-1.5 text-zinc-500">Δt_pr planair</td>
              </tr>
              <tr>
                <td className="px-2 py-1.5">Stralingsasymm. warm venster (K)</td>
                <td className="px-2 py-1.5 text-center font-mono">&lt; 10</td>
                <td className="px-2 py-1.5 text-center font-mono">&lt; 23</td>
                <td className="px-2 py-1.5 text-center font-mono">&lt; 35</td>
                <td className="px-2 py-1.5 text-zinc-500">Δt_pr planair</td>
              </tr>
            </tbody>
          </table>
        </div>
      </InfoBox>

      {/* Per-BG kaarten */}
      <div className="space-y-5">
        {bgs.map((bg, bgIdx) => {
          const stat = statistics.find((s) => s.bgId === bg.id);

          // Determine overall worst category from all local parameters
          const cats: Array<PMVCat | undefined> = [
            stat?.drCategory,
            stat?.verticalTempCategory,
            stat?.floorTempCategory,
          ];
          const catOrder: PMVCat[] = ['A', 'B', 'C', 'D'];
          const worstCat = cats.reduce<PMVCat | undefined>((worst, c) => {
            if (!c) return worst;
            if (!worst) return c;
            return catOrder.indexOf(c) > catOrder.indexOf(worst) ? c : worst;
          }, undefined);

          const hasAnyData = stat?.dr != null || stat?.verticalTempDiff != null || stat?.floorTempVerdict != null;

          // Check radiant asymmetry data (from measurements)
          const validMeasurements = investigation.measurements.filter(
            (m) => m.bgId === bg.id && !m.excluded,
          );
          const avgRadWarmCeiling = avg(validMeasurements.map((m) => m.radAsymmetryWarmCeiling).filter((v): v is number => v != null));
          const avgRadColdWall    = avg(validMeasurements.map((m) => m.radAsymmetryColdWall).filter((v): v is number => v != null));
          const avgRadWarmWindow  = avg(validMeasurements.map((m) => m.radAsymmetryWarmWindow).filter((v): v is number => v != null));

          const radWarmCeilingCat: PMVCat | undefined = avgRadWarmCeiling != null ? (avgRadWarmCeiling < 5 ? 'A' : avgRadWarmCeiling < 10 ? 'B' : avgRadWarmCeiling < 14 ? 'C' : 'D') : undefined;
          const radColdWallCat: PMVCat | undefined    = avgRadColdWall != null    ? (avgRadColdWall < 10 ? 'A' : avgRadColdWall < 16 ? 'B' : avgRadColdWall < 23 ? 'C' : 'D') : undefined;
          const radWarmWindowCat: PMVCat | undefined  = avgRadWarmWindow != null  ? (avgRadWarmWindow < 10 ? 'A' : avgRadWarmWindow < 23 ? 'B' : avgRadWarmWindow < 35 ? 'C' : 'D') : undefined;

          return (
            <div key={bg.id} className={`rounded-xl border-2 bg-white dark:bg-zinc-900 ${
              worstCat === 'A' ? 'border-emerald-400 dark:border-emerald-600' :
              worstCat === 'B' ? 'border-amber-400 dark:border-amber-600' :
              worstCat === 'C' ? 'border-orange-400 dark:border-orange-600' :
              worstCat === 'D' ? 'border-red-400 dark:border-red-600' :
              'border-zinc-200 dark:border-zinc-700'
            }`}>
              {/* Header */}
              <div className="flex items-center justify-between gap-3 border-b border-zinc-200 px-5 py-3 dark:border-zinc-700">
                <div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    BG {bgIdx + 1}/{bgs.length}: {bg.name}
                  </p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">
                    Turbulentie-intensiteit Tu = {bg.turbulenceIntensity ?? 40}%
                  </p>
                </div>
                {worstCat && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">Slechtste categorie:</span>
                    <CategoryBadge cat={worstCat} />
                  </div>
                )}
              </div>

              <div className="p-5">
                {!hasAnyData && avgRadWarmCeiling == null && avgRadColdWall == null && avgRadWarmWindow == null ? (
                  <p className="text-sm text-zinc-400 dark:text-zinc-500">
                    Geen lokale comfortmeetwaarden beschikbaar.
                    <br />
                    <span className="text-xs">Voer in stap 6 de lokale meetwaarden in: t_a_ankle, t_a_head, t_floor en/of stralingsasymmetrie.</span>
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {/* Tocht DR */}
                    {stat?.dr != null && (
                      <ScoreRow
                        label="Tochtpercentage (DR)"
                        value={fmt0(stat.dr)}
                        unit="%"
                        category={stat.drCategory}
                        limit_a={LOCAL_CRITERIA.dr.A}
                        limit_b={LOCAL_CRITERIA.dr.B}
                        limit_c={LOCAL_CRITERIA.dr.C}
                        norm={LOCAL_CRITERIA.dr.norm}
                      />
                    )}

                    {/* Verticaal temperatuurverschil */}
                    {stat?.verticalTempDiff != null && (
                      <ScoreRow
                        label="Verticaal temperatuurverschil (Δt hoofd–enkel)"
                        value={fmt1(stat.verticalTempDiff)}
                        unit="K"
                        category={stat.verticalTempCategory}
                        limit_a={LOCAL_CRITERIA.verticalTemp.A}
                        limit_b={LOCAL_CRITERIA.verticalTemp.B}
                        limit_c={LOCAL_CRITERIA.verticalTemp.C}
                        norm="ISO 7730:2025 §6.3"
                      />
                    )}

                    {/* Vloertemperatuur */}
                    {stat?.floorTempVerdict != null && (
                      <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-100 px-3 py-2.5 dark:border-zinc-800">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Vloertemperatuur</p>
                          <p className="text-xs text-zinc-400 dark:text-zinc-500">ISO 7730:2025 §6.4</p>
                          <p className="text-xs text-zinc-400 dark:text-zinc-500">Comfortbereik: 19–29 °C (Cat. B), 22–28 °C (Cat. A)</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className="text-sm font-bold tabular-nums text-zinc-800 dark:text-zinc-200">
                            {fmt1(avg(validMeasurements.map((m) => m.t_floor).filter((v): v is number => v != null)))} °C
                          </span>
                          {stat.floorTempCategory && <CategoryBadge cat={stat.floorTempCategory} />}
                          {stat.floorTempVerdict !== 'ok' && (
                            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                              {stat.floorTempVerdict === 'low' ? 'Te koud' : 'Te warm'}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Stralingsasymmetrie */}
                    {avgRadWarmCeiling != null && (
                      <ScoreRow
                        label="Stralingsasymmetrie — warm plafond (Δt_pr)"
                        value={fmt1(avgRadWarmCeiling)}
                        unit="K"
                        category={radWarmCeilingCat}
                        limit_a={5} limit_b={10} limit_c={14}
                        norm={LOCAL_CRITERIA.radAsym.warmCeiling.norm}
                      />
                    )}
                    {avgRadColdWall != null && (
                      <ScoreRow
                        label="Stralingsasymmetrie — koude wand (Δt_pr)"
                        value={fmt1(avgRadColdWall)}
                        unit="K"
                        category={radColdWallCat}
                        limit_a={10} limit_b={16} limit_c={23}
                        norm={LOCAL_CRITERIA.radAsym.coldWall.norm}
                      />
                    )}
                    {avgRadWarmWindow != null && (
                      <ScoreRow
                        label="Stralingsasymmetrie — warm venster (Δt_pr)"
                        value={fmt1(avgRadWarmWindow)}
                        unit="K"
                        category={radWarmWindowCat}
                        limit_a={10} limit_b={23} limit_c={35}
                        norm={LOCAL_CRITERIA.radAsym.warmWindow.norm}
                      />
                    )}

                    {/* Categorie D melding */}
                    {worstCat === 'D' && (
                      <div className="flex items-start gap-3 rounded-lg bg-red-50 px-4 py-3 text-sm dark:bg-red-900/15">
                        <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                        </svg>
                        <div>
                          <p className="font-semibold text-red-800 dark:text-red-300">Categorie D — Onaanvaardbaar lokaal oncomfort</p>
                          <p className="mt-0.5 text-xs text-red-700 dark:text-red-400">
                            Een of meer lokale comfortparameters vallen buiten de Categorie C-grens. Maatregelen vereist.
                            Zie stap 12 voor de beheersmaatregelen.
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
    </div>
  );
}

function avg(arr: number[]): number | undefined {
  if (arr.length === 0) return undefined;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}
