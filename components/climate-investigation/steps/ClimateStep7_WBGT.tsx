'use client';

import type { ClimateInvestigation } from '@/lib/climate-investigation-types';
import { CAV_VALUES, METABOLIC_CLASSES } from '@/lib/climate-investigation-types';
import { computeAllClimateStatistics, verdictBadgeClass, getMetabolicRate } from '@/lib/climate-stats';
import { Abbr } from '@/components/Abbr';
import { InfoBox } from '@/components/InfoBox';
import { Alert } from '@/components/ui';

interface Props {
  investigation: ClimateInvestigation;
  onUpdate: (partial: Partial<ClimateInvestigation>) => void;
}

function fmt1(v: number | undefined | null): string {
  return v != null ? v.toFixed(1) : '—';
}

// ISO 7243:2017 Tabel A.1 referentiewaarden (discrete stappen)
const WBGT_REF_TABLE: {
  class: number; label: string;
  acclimatized: number; notAcclimatized: number;
}[] = [
  { class: 0, label: 'Klasse 0 (rust)',          acclimatized: 33, notAcclimatized: 32 },
  { class: 1, label: 'Klasse 1 (licht)',         acclimatized: 30, notAcclimatized: 29 },
  { class: 2, label: 'Klasse 2 (matig)',         acclimatized: 28, notAcclimatized: 26 },
  { class: 3, label: 'Klasse 3 (zwaar)',         acclimatized: 25, notAcclimatized: 22 },
  { class: 4, label: 'Klasse 4 (zeer zwaar)',    acclimatized: 23, notAcclimatized: 18 },
];

export default function ClimateStep7_WBGT({ investigation, onUpdate }: Props) {
  const { bgs, scenarios } = investigation;

  const isRelevant = scenarios.includes('heat');

  if (!isRelevant) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Stap 8 — Hittestress screening (<Abbr id="WBGT">WBGT</Abbr>)
        </h2>
        <Alert variant="neutral">
          Dit scenario is niet geselecteerd. Selecteer &ldquo;Warmtestress&rdquo; in stap 4 om de WBGT-beoordeling in te schakelen.
        </Alert>
      </div>
    );
  }

  if (bgs.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Stap 8 — Hittestress screening (WBGT)
        </h2>
        <Alert variant="warning">
          Definieer eerst blootstellingsgroepen in stap 3.
        </Alert>
      </div>
    );
  }

  const statistics = computeAllClimateStatistics(investigation);

  const VERDICT_BORDER: Record<string, string> = {
    acceptable: 'border-emerald-400 dark:border-emerald-600',
    caution:    'border-amber-400 dark:border-amber-600',
    exceeds:    'border-red-400 dark:border-red-600',
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Stap 8 — Hittestress screening (<Abbr id="WBGT">WBGT</Abbr>)
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          Screening op hittestress conform <Abbr id="ISO7243">ISO 7243:2017</Abbr> op basis van de{' '}
          <Abbr id="WBGT">Wet Bulb Globe Temperature</Abbr>. De WBGT wordt vergeleken met de
          referentiewaarde (WBGTref) per metabole klasse en acclimatisatiestatus.
          Overschrijding vereist een gedetailleerdere <Abbr id="PHS">PHS</Abbr>-analyse (stap 9).
        </p>
      </div>

      {/* Referentietabel */}
      <InfoBox title="ISO 7243:2017 Tabel A.1 — WBGTref per metabole klasse (°C)">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-700">
                <th className="px-2 py-1.5 text-left font-semibold">Klasse</th>
                <th className="px-2 py-1.5 text-left font-semibold">W/m²</th>
                <th className="px-2 py-1.5 text-right font-semibold">Geacclimatiseerd</th>
                <th className="px-2 py-1.5 text-right font-semibold">Niet-geacclimatiseerd</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {WBGT_REF_TABLE.map((row) => (
                <tr key={row.class}>
                  <td className="px-2 py-1.5">{row.label}</td>
                  <td className="px-2 py-1.5 font-mono">{METABOLIC_CLASSES[row.class as 0|1|2|3|4].rate}</td>
                  <td className="px-2 py-1.5 text-right font-mono">{row.acclimatized} °C</td>
                  <td className="px-2 py-1.5 text-right font-mono">{row.notAcclimatized} °C</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          Continue formule: Geacclimatiseerd: WBGTref = 56,7 − 11,5 × log₁₀(M) &nbsp;|&nbsp;
          Niet-geacclimatiseerd: WBGTref = 59,9 − 14,1 × log₁₀(M)
        </p>
      </InfoBox>

      {/* CAV informatietabel */}
      <InfoBox title="ISO 7243:2017 Tabel B.2 — Kledingcorrectiewaarden (CAV)" defaultOpen={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-700">
                <th className="px-2 py-1.5 text-left font-semibold">Kledingtype</th>
                <th className="px-2 py-1.5 text-right font-semibold">CAV (°C)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {CAV_VALUES.map((c) => (
                <tr key={c.cav + c.label}>
                  <td className="px-2 py-1.5">{c.label}</td>
                  <td className="px-2 py-1.5 text-right font-mono">+{c.cav}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          WBGTeff = WBGT + CAV. Als standaard werkkleding wordt gedragen (CAV = 0) is geen correctie nodig.
        </p>
      </InfoBox>

      {/* Per-BG resultaten */}
      <div className="space-y-5">
        {bgs.map((bg, bgIdx) => {
          const stat = statistics.find((s) => s.bgId === bg.id);
          const hasResult = stat?.wbgt != null;
          const borderCls = hasResult && stat?.wbgtVerdictColor
            ? VERDICT_BORDER[stat.wbgtVerdict ?? ''] ?? 'border-zinc-200 dark:border-zinc-700'
            : 'border-zinc-200 dark:border-zinc-700';

          const M = getMetabolicRate(bg);

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
                    {bg.acclimatized ? 'geacclimatiseerd' : 'niet-geacclimatiseerd'}
                  </p>
                </div>
                {hasResult && stat?.wbgtVerdict && (
                  <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${verdictBadgeClass(stat.wbgtVerdictColor!)}`}>
                    {stat.wbgtVerdictLabel}
                  </span>
                )}
              </div>

              <div className="p-5">
                {!hasResult ? (
                  <p className="text-sm text-zinc-400 dark:text-zinc-500">
                    Geen WBGT-meetwaarden beschikbaar voor deze BG.
                    <br />
                    <span className="text-xs">Vereist: t_nw (natte boltemperatuur) en t_g (globetemperatuur) in stap 6.</span>
                  </p>
                ) : (
                  <div className="space-y-4">
                    {/* 3-kolom resultatenraster */}
                    <div className="grid grid-cols-3 gap-4 rounded-lg bg-zinc-50 px-4 py-3 dark:bg-zinc-800/30">
                      <div className="text-center">
                        <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500">WBGT gemeten</p>
                        <p className="mt-0.5 text-2xl font-bold tabular-nums text-zinc-800 dark:text-zinc-200">
                          {fmt1(stat.wbgt)} °C
                        </p>
                        {stat.wbgtCAV != null && stat.wbgtCAV > 0 && (
                          <p className="text-xs text-zinc-400">+CAV {stat.wbgtCAV} → eff. {fmt1(stat.wbgtEff)} °C</p>
                        )}
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500">WBGTref</p>
                        <p className="mt-0.5 text-2xl font-bold tabular-nums text-zinc-800 dark:text-zinc-200">
                          {fmt1(stat.wbgtRef)} °C
                        </p>
                        <p className="text-xs text-zinc-400">ISO 7243 Tabel A.1</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500">WBGT − WBGTref</p>
                        <p className={`mt-0.5 text-2xl font-bold tabular-nums ${
                          stat.wbgtVerdict === 'acceptable' ? 'text-emerald-600 dark:text-emerald-400' :
                          stat.wbgtVerdict === 'caution'    ? 'text-amber-600 dark:text-amber-400' :
                          'text-red-600 dark:text-red-400'
                        }`}>
                          {stat.wbgt != null && stat.wbgtRef != null
                            ? `${(stat.wbgt - stat.wbgtRef) >= 0 ? '+' : ''}${fmt1(stat.wbgt - stat.wbgtRef)}`
                            : '—'} K
                        </p>
                        <p className="text-xs text-zinc-400">Marge t.o.v. referentie</p>
                      </div>
                    </div>

                    {/* Overschrijding — PHS vereist */}
                    {stat.wbgtVerdict === 'exceeds' && (
                      <Alert variant="error">
                        <p className="font-semibold">WBGTref overschreden — PHS-analyse vereist</p>
                        <p className="mt-0.5 text-xs">
                          De referentiewaarde is overschreden. Ga naar stap 9 (<Abbr id="PHS">Predicted Heat Strain</Abbr>) voor
                          een gedetailleerde analyse conform <Abbr id="ISO7933">ISO 7933:2023</Abbr>.
                        </p>
                      </Alert>
                    )}

                    {/* Nabij de grens */}
                    {stat.wbgtVerdict === 'caution' && (
                      <Alert variant="warning">
                        <p className="font-semibold">WBGT nabij referentiewaarde</p>
                        <p className="mt-0.5 text-xs">
                          De WBGT-waarde nadert de referentiewaarde (verschil &lt; 2 K). Overweeg preventieve maatregelen
                          en herhaal de meting bij warmere omstandigheden of hogere activiteit.
                        </p>
                      </Alert>
                    )}

                    {/* Aanvaardbaar */}
                    {stat.wbgtVerdict === 'acceptable' && (
                      <Alert variant="success">
                        WBGT ligt ruim onder de referentiewaarde — hittestress is aanvaardbaar.
                      </Alert>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Samenvattingstabel */}
      {bgs.length > 1 && (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800/30">
          <p className="mb-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Samenvatting alle blootstellingsgroepen
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-700">
                  <th className="pb-1.5 text-left font-semibold">BG</th>
                  <th className="pb-1.5 text-right font-semibold">WBGT (°C)</th>
                  <th className="pb-1.5 text-right font-semibold">WBGTref (°C)</th>
                  <th className="pb-1.5 pl-3 text-left font-semibold">Oordeel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {bgs.map((bg, idx) => {
                  const stat = statistics.find((s) => s.bgId === bg.id);
                  return (
                    <tr key={bg.id}>
                      <td className="py-1.5">BG {idx + 1}: {bg.name}</td>
                      <td className="py-1.5 text-right font-mono">{fmt1(stat?.wbgt)}</td>
                      <td className="py-1.5 text-right font-mono">{fmt1(stat?.wbgtRef)}</td>
                      <td className="py-1.5 pl-3">
                        {stat?.wbgtVerdictColor ? (
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${verdictBadgeClass(stat.wbgtVerdictColor)}`}>
                            {stat.wbgtVerdictLabel}
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
