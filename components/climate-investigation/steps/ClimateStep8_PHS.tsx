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

function fmt0(v: number | undefined | null): string {
  return v != null ? Math.round(v).toString() : '—';
}

function fmt1(v: number | undefined | null): string {
  return v != null ? v.toFixed(1) : '—';
}

export default function ClimateStep8_PHS({ investigation, onUpdate: _onUpdate }: Props) {
  const { bgs, scenarios } = investigation;

  const isRelevant = scenarios.includes('heat');

  if (!isRelevant) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Stap 9 — Hittestress gedetailleerd (<Abbr id="PHS">PHS</Abbr>)
        </h2>
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800/30 dark:text-zinc-400">
          Dit scenario is niet geselecteerd. Selecteer &ldquo;Warmtestress&rdquo; in stap 4 om de PHS-analyse in te schakelen.
        </div>
      </div>
    );
  }

  if (bgs.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Stap 9 — Hittestress gedetailleerd (PHS)</h2>
        <div className="rounded-lg bg-amber-50 px-4 py-4 text-sm text-amber-700 dark:bg-amber-900/15 dark:text-amber-400">
          Definieer eerst blootstellingsgroepen in stap 3.
        </div>
      </div>
    );
  }

  const statistics = computeAllClimateStatistics(investigation);

  const VERDICT_BORDER: Record<string, string> = {
    acceptable: 'border-emerald-400 dark:border-emerald-600',
    limited:    'border-orange-400 dark:border-orange-600',
    danger:     'border-red-400 dark:border-red-600',
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Stap 9 — Hittestress gedetailleerd (<Abbr id="PHS">PHS</Abbr>)
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          Gedetailleerde hittestressanalyse conform <Abbr id="ISO7933">ISO 7933:2023</Abbr> op basis van
          de vereiste zweetsecretie (S_Wreq) en maximale zweetsecretiecapaciteit (S_Wmax).
          De <Abbr id="PHS">Predicted Heat Strain</Abbr> wordt ingezet wanneer de{' '}
          <Abbr id="WBGT">WBGT</Abbr>-referentiewaarde (stap 8) is overschreden.
        </p>
      </div>

      <InfoBox title="ISO 7933:2023 — PHS model principes">
        <div className="space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
          <p>
            Het PHS-model berekent de vereiste verdampingskoeling (E_req) vanuit de warmtebalans en vergelijkt
            die met de maximale zweetsecretiecapaciteit (S_Wmax).
          </p>
          <ul className="ml-4 list-disc space-y-0.5">
            <li><strong>S_Wmax</strong>: geacclimatiseerd 800 g/h &nbsp;|&nbsp; niet-geacclimatiseerd 400 g/h</li>
            <li><strong>D_lim</strong>: maximale blootstellingstijd bij onvoldoende koelcapaciteit (kerntemperatuur ≤ 38,5 °C)</li>
            <li><strong>Aanvaardbaar</strong>: S_Wreq ≤ S_Wmax &nbsp;|&nbsp; <strong>Beperkt</strong>: S_Wreq &gt; S_Wmax maar D_lim ≥ 60 min &nbsp;|&nbsp; <strong>Gevaarlijk</strong>: D_lim &lt; 60 min</li>
          </ul>
          <p className="mt-1 text-zinc-400 dark:text-zinc-500">
            Let op: dit is een vereenvoudigd schattingsmodel. Voor de volledige iteratieve PHS-berekening
            (ISO 7933:2023 Bijlage C) is gespecialiseerde software vereist.
          </p>
        </div>
      </InfoBox>

      <div className="space-y-5">
        {bgs.map((bg, bgIdx) => {
          const stat = statistics.find((s) => s.bgId === bg.id);
          const hasResult = stat?.phsVerdict != null;
          const borderCls = hasResult && stat?.phsVerdictColor
            ? VERDICT_BORDER[stat.phsVerdict ?? ''] ?? 'border-zinc-200 dark:border-zinc-700'
            : 'border-zinc-200 dark:border-zinc-700';

          const M = getMetabolicRate(bg);

          // PHS is only meaningful when WBGT measurements exist
          const hasWBGT = stat?.wbgt != null;

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
                    I_cl = {bg.clothingInsulation} clo ·{' '}
                    {bg.acclimatized ? 'geacclimatiseerd' : 'niet-geacclimatiseerd'}
                  </p>
                </div>
                {hasResult && stat?.phsVerdict && (
                  <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${verdictBadgeClass(stat.phsVerdictColor!)}`}>
                    {stat.phsVerdictLabel}
                  </span>
                )}
              </div>

              <div className="p-5">
                {!hasWBGT ? (
                  <p className="text-sm text-zinc-400 dark:text-zinc-500">
                    Geen warmtemeetwaarden beschikbaar. Voer t_nw en t_g in (stap 6).
                    <br />
                    <span className="text-xs">PHS wordt berekend op basis van de WBGT-meetwaarden.</span>
                  </p>
                ) : !hasResult ? (
                  <p className="text-sm text-zinc-400 dark:text-zinc-500">
                    PHS-berekening niet beschikbaar — controleer de meetwaarden.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {/* Resultatenraster */}
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                      <div className="rounded-lg bg-zinc-50 px-3 py-2.5 text-center dark:bg-zinc-800/30">
                        <p className="text-xs text-zinc-400 dark:text-zinc-500">S_Wreq</p>
                        <p className="mt-0.5 text-xl font-bold tabular-nums text-zinc-800 dark:text-zinc-200">
                          {fmt0(stat.phsSWreq)} g/h
                        </p>
                        <p className="text-xs text-zinc-400">Vereiste zweetsecretie</p>
                      </div>
                      <div className="rounded-lg bg-zinc-50 px-3 py-2.5 text-center dark:bg-zinc-800/30">
                        <p className="text-xs text-zinc-400 dark:text-zinc-500">S_Wmax</p>
                        <p className="mt-0.5 text-xl font-bold tabular-nums text-zinc-800 dark:text-zinc-200">
                          {fmt0(stat.phsSWmax)} g/h
                        </p>
                        <p className="text-xs text-zinc-400">Maximale capaciteit</p>
                      </div>
                      <div className="rounded-lg bg-zinc-50 px-3 py-2.5 text-center dark:bg-zinc-800/30">
                        <p className="text-xs text-zinc-400 dark:text-zinc-500">S_Wreq / S_Wmax</p>
                        <p className={`mt-0.5 text-xl font-bold tabular-nums ${
                          stat.phsSWreq != null && stat.phsSWmax != null
                            ? stat.phsSWreq <= stat.phsSWmax
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-red-600 dark:text-red-400'
                            : 'text-zinc-600 dark:text-zinc-400'
                        }`}>
                          {stat.phsSWreq != null && stat.phsSWmax != null
                            ? `${Math.round((stat.phsSWreq / stat.phsSWmax) * 100)}%`
                            : '—'}
                        </p>
                        <p className="text-xs text-zinc-400">Belasting zweetsysteem</p>
                      </div>
                      <div className="rounded-lg bg-zinc-50 px-3 py-2.5 text-center dark:bg-zinc-800/30">
                        <p className="text-xs text-zinc-400 dark:text-zinc-500">D_lim</p>
                        <p className={`mt-0.5 text-xl font-bold tabular-nums ${
                          stat.phsDlimMin != null
                            ? stat.phsDlimMin < 60
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-orange-600 dark:text-orange-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {stat.phsDlimMin != null ? `${stat.phsDlimMin} min` : 'Geen'}
                        </p>
                        <p className="text-xs text-zinc-400">Max. blootstellingstijd</p>
                      </div>
                    </div>

                    {/* Oordeel kleurblok */}
                    {stat.phsVerdictColor && (
                      <div className={`rounded-lg px-3 py-2 text-sm font-medium ${verdictBadgeClass(stat.phsVerdictColor)}`}>
                        {stat.phsVerdictLabel}
                      </div>
                    )}

                    {/* Gevaar: D_lim < 60 min */}
                    {stat.phsVerdict === 'danger' && (
                      <div className="flex items-start gap-3 rounded-lg bg-red-50 px-4 py-3 text-sm dark:bg-red-900/15">
                        <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                        </svg>
                        <div>
                          <p className="font-semibold text-red-800 dark:text-red-300">
                            Acuut risico op hitteletsel — D_lim &lt; 60 minuten
                          </p>
                          <p className="mt-0.5 text-xs text-red-700 dark:text-red-400">
                            De maximale blootstellingstijd is minder dan 60 minuten. Onmiddellijk technische
                            en organisatorische maatregelen treffen. Zie stap 12 (maatregelen).
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Beperkt: S_Wreq > S_Wmax */}
                    {stat.phsVerdict === 'limited' && stat.phsDlimMin != null && (
                      <div className="flex items-start gap-3 rounded-lg bg-orange-50 px-4 py-3 text-sm dark:bg-orange-900/15">
                        <svg className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                        </svg>
                        <div>
                          <p className="font-semibold text-orange-800 dark:text-orange-300">
                            Beperkte blootstelling — roulatie vereist (D_lim = {stat.phsDlimMin} min)
                          </p>
                          <p className="mt-0.5 text-xs text-orange-700 dark:text-orange-400">
                            De zweetsecretiecapaciteit is overschreden. Blootstelling beperken via roulatieschema&apos;s
                            met voldoende herstelperiodes in koele omgeving.
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
            Samenvatting PHS alle blootstellingsgroepen
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-700">
                  <th className="pb-1.5 text-left font-semibold">BG</th>
                  <th className="pb-1.5 text-right font-semibold">S_Wreq (g/h)</th>
                  <th className="pb-1.5 text-right font-semibold">S_Wmax (g/h)</th>
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
                      <td className="py-1.5 text-right font-mono">{fmt0(stat?.phsSWreq)}</td>
                      <td className="py-1.5 text-right font-mono">{fmt0(stat?.phsSWmax)}</td>
                      <td className="py-1.5 text-right font-mono">
                        {stat?.phsDlimMin != null ? `${stat.phsDlimMin} min` : stat?.phsVerdict === 'acceptable' ? '—' : '—'}
                      </td>
                      <td className="py-1.5 pl-3">
                        {stat?.phsVerdictColor ? (
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${verdictBadgeClass(stat.phsVerdictColor)}`}>
                            {stat.phsVerdictLabel}
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
