'use client';

import { useState } from 'react';
import type { PhysicalInvestigation } from '@/lib/physical-investigation-types';
import { computeAllPhysicalStatistics, computeLiftingResult, computePushPullResult, computeRepetitiveResult, computeForceResult } from '@/lib/physical-stats';
import { InfoBox } from '@/components/InfoBox';

interface Props {
  investigation: PhysicalInvestigation;
  onUpdate: (partial: Partial<PhysicalInvestigation>) => void;
}

const REVIEW_TRIGGER_OPTIONS = [
  'Wijziging in werkwijze, taken of arbeidsomstandigheden',
  'Introductie van nieuwe machines of arbeidsmiddelen',
  'Toename van klachten aan het bewegingsapparaat',
  'Wijziging in personeelssamenstelling (bijv. nieuwe functies, meer vrouwelijk personeel)',
  'Aanpassing van productiedoelen of werkdruk',
  'Wettelijke heroverweging of nieuw RI&E-traject',
  'Jaarlijkse hercontrole als onderdeel van arbozorg',
];

function buildReportText(inv: PhysicalInvestigation): string {
  const lines: string[] = [];
  const date = new Date().toLocaleDateString('nl-NL', { year: 'numeric', month: 'long', day: 'numeric' });

  lines.push(`RAPPORT FYSIEKE BELASTING`);
  lines.push(`NEN-ISO 11228-1/2/3 · EN 1005-3/4 · Arbobesluit art. 5.1–5.6`);
  lines.push(`Gegenereerd: ${date}`);
  lines.push('');

  if (inv.scope.companyName) lines.push(`Bedrijf: ${inv.scope.companyName}`);
  if (inv.scope.workplaceName) lines.push(`Werkplek: ${inv.scope.workplaceName}`);
  if (inv.scope.investigationPeriod) lines.push(`Periode: ${inv.scope.investigationPeriod}`);
  if (inv.investigators.length > 0) {
    lines.push(`Uitvoerder(s): ${inv.investigators.filter((p) => p.name).map((p) => `${p.name}${p.qualification ? ` (${p.qualification})` : ''}`).join(', ')}`);
  }
  lines.push('');

  // BG summaries
  const stats = computeAllPhysicalStatistics(inv);
  lines.push('RESULTATEN PER BELASTINGSGROEP');
  lines.push('─'.repeat(40));
  for (const s of stats) {
    const bg = inv.bgs.find((b) => b.id === s.bgId);
    lines.push(`${bg?.name ?? s.bgId}: ${s.overallVerdict === 'high' ? 'HOOG RISICO' : s.overallVerdict === 'moderate' ? 'MATIG RISICO' : 'ACCEPTABEL'}${s.maxLI != null ? ` | LI max: ${s.maxLI}` : ''}`);
  }
  lines.push('');

  // Lifting
  if (inv.liftingTasks.length > 0) {
    lines.push('TILLEN & NEERLATEN (NIOSH)');
    lines.push('─'.repeat(40));
    for (const t of inv.liftingTasks) {
      const r = computeLiftingResult(t);
      const bg = inv.bgs.find((b) => b.id === t.bgId);
      lines.push(`${t.taskName} [${bg?.name ?? ''}]: G=${t.weight}kg | RWL=${r.rwl_min}kg | LI=${r.li} → ${r.verdictLabel}`);
      if (r.riskFlags.length > 0) lines.push(`  Risicofactoren: ${r.riskFlags.join(', ')}`);
    }
    lines.push('');
  }

  // Push/pull
  if (inv.pushPullTasks.length > 0) {
    lines.push('DUWEN & TREKKEN');
    lines.push('─'.repeat(40));
    for (const t of inv.pushPullTasks) {
      const r = computePushPullResult(t);
      const bg = inv.bgs.find((b) => b.id === t.bgId);
      lines.push(`${t.taskName} [${bg?.name ?? ''}]: ${t.totalMass}kg | F_init=${t.initialForce ?? '?'}N | F_sust=${t.sustainedForce ?? '?'}N → ${r.verdictLabel}`);
    }
    lines.push('');
  }

  // Repetitive
  if (inv.repetitiveTasks.length > 0) {
    lines.push('REPETERENDE HANDELINGEN (OCRA)');
    lines.push('─'.repeat(40));
    for (const t of inv.repetitiveTasks) {
      const r = computeRepetitiveResult(t);
      const bg = inv.bgs.find((b) => b.id === t.bgId);
      lines.push(`${t.taskName} [${bg?.name ?? ''}]: OCRA score=${r.ocraScore} → ${r.verdictLabel}`);
    }
    lines.push('');
  }

  // Measures
  if (inv.measures.length > 0) {
    lines.push('BEHEERSMAATREGELEN');
    lines.push('─'.repeat(40));
    const sorted = [...inv.measures].sort((a, b) => a.priority - b.priority);
    for (const m of sorted) {
      const bgNames = inv.bgs.filter((b) => m.bgIds.includes(b.id)).map((b) => b.name);
      lines.push(`P${m.priority} | ${m.type === 'technical' ? 'Technisch' : m.type === 'organisational' ? 'Organisatorisch' : 'Persoonlijk'} | ${m.description}${bgNames.length > 0 ? ` [${bgNames.join(', ')}]` : ''}${m.deadline ? ` | Deadline: ${m.deadline}` : ''}`);
    }
    lines.push('');
  }

  // Conclusion
  if (inv.report.conclusion) {
    lines.push('CONCLUSIE');
    lines.push('─'.repeat(40));
    lines.push(inv.report.conclusion);
    lines.push('');
  }

  lines.push(`─── OHSHub · ${date} ───`);
  return lines.join('\n');
}

export default function PhysicalStep10_Report({ investigation, onUpdate }: Props) {
  const { bgs, report } = investigation;
  const [copied, setCopied] = useState(false);

  const stats = computeAllPhysicalStatistics(investigation);
  const highRiskBGs = stats.filter((s) => s.overallVerdict === 'high');
  const moderateBGs = stats.filter((s) => s.overallVerdict === 'moderate');
  const acceptableBGs = stats.filter((s) => s.overallVerdict === 'acceptable');

  const overallWorst = highRiskBGs.length > 0 ? 'high' : moderateBGs.length > 0 ? 'moderate' : 'acceptable';

  const INPUT = 'w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-orange-400';
  const TEXTAREA = `${INPUT} resize-none`;

  function toggleTrigger(t: string) {
    const current = report.reviewTriggers ?? [];
    const updated = current.includes(t) ? current.filter((x) => x !== t) : [...current, t];
    onUpdate({ report: { ...report, reviewTriggers: updated } });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Stap 11 — Rapport
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          Vat de bevindingen samen, leg de compliancestatus vast en exporteer het rapport.
        </p>
      </div>

      {/* Overall status banner */}
      <div className={`rounded-xl border px-5 py-4 ${
        overallWorst === 'high'
          ? 'border-red-300 bg-red-50 dark:border-red-800/40 dark:bg-red-900/15'
          : overallWorst === 'moderate'
            ? 'border-amber-300 bg-amber-50 dark:border-amber-800/40 dark:bg-amber-900/15'
            : 'border-emerald-300 bg-emerald-50 dark:border-emerald-800/40 dark:bg-emerald-900/15'
      }`}>
        <p className={`text-sm font-semibold ${
          overallWorst === 'high' ? 'text-red-800 dark:text-red-300' :
          overallWorst === 'moderate' ? 'text-amber-800 dark:text-amber-300' :
          'text-emerald-800 dark:text-emerald-300'
        }`}>
          {overallWorst === 'high'
            ? '⚠ Hoog risico — maatregelen vereist (direct actie)'
            : overallWorst === 'moderate'
              ? '⚠ Matig risico — maatregelen aanbevolen'
              : '✓ Acceptabel — geen acute maatregelen vereist'}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {bgs.map((bg) => {
            const s = stats.find((x) => x.bgId === bg.id);
            if (!s) return null;
            return (
              <span
                key={bg.id}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  s.overallVerdict === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                  s.overallVerdict === 'moderate' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                }`}
              >
                {bg.name}
                {s.maxLI != null && ` · LI ${s.maxLI}`}
              </span>
            );
          })}
        </div>
      </div>

      {/* Results summary per BG */}
      {stats.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">Samenvatting per belastingsgroep</h3>
          <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-700">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50">
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-zinc-500">Belastingsgroep</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-zinc-500">Medewerkers</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold text-zinc-500">LI max</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-zinc-500">Oordeel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {bgs.map((bg) => {
                  const s = stats.find((x) => x.bgId === bg.id);
                  return (
                    <tr key={bg.id} className="bg-white dark:bg-zinc-900">
                      <td className="px-4 py-2.5 font-medium text-zinc-800 dark:text-zinc-200">{bg.name}</td>
                      <td className="px-4 py-2.5 text-zinc-500">{bg.workerCount}</td>
                      <td className={`px-4 py-2.5 text-right font-mono font-semibold ${
                        s?.overallVerdict === 'high' ? 'text-red-600' :
                        s?.overallVerdict === 'moderate' ? 'text-amber-600' : 'text-emerald-600'
                      }`}>{s?.maxLI ?? '—'}</td>
                      <td className="px-4 py-2.5">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          s?.overallVerdict === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                          s?.overallVerdict === 'moderate' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                          'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        }`}>
                          {s?.overallVerdict === 'high' ? 'Hoog risico' : s?.overallVerdict === 'moderate' ? 'Matig risico' : 'Acceptabel'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Conclusion */}
      <div>
        <label className="mb-1 block text-sm font-semibold text-zinc-700 dark:text-zinc-300">Conclusie</label>
        <textarea
          rows={4}
          value={report.conclusion ?? ''}
          onChange={(e) => onUpdate({ report: { ...report, conclusion: e.target.value } })}
          placeholder="Vat de bevindingen samen: welke belastingen zijn onderzocht, welke risico's zijn geïdentificeerd en wat zijn de aanbevelingen?"
          className={TEXTAREA}
        />
      </div>

      {/* Compliance statement */}
      <div>
        <label className="mb-1 block text-sm font-semibold text-zinc-700 dark:text-zinc-300">Complianceverklaring</label>
        <textarea
          rows={2}
          value={report.complianceStatement ?? ''}
          onChange={(e) => onUpdate({ report: { ...report, complianceStatement: e.target.value } })}
          placeholder="Bijv. 'Op basis van dit onderzoek wordt geconcludeerd dat de fysieke belasting voor belastingsgroep X voldoet aan Arbobesluit art. 5.1.'"
          className={TEXTAREA}
        />
      </div>

      {/* Review triggers */}
      <div>
        <label className="mb-2 block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          Herbeoordelingstriggers
        </label>
        <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
          Geef aan bij welke omstandigheden een herbeoordeling moet plaatsvinden.
        </p>
        <div className="space-y-1.5">
          {REVIEW_TRIGGER_OPTIONS.map((t) => (
            <label key={t} className="flex cursor-pointer items-start gap-2 text-sm text-zinc-600 dark:text-zinc-400">
              <input
                type="checkbox"
                checked={(report.reviewTriggers ?? []).includes(t)}
                onChange={() => toggleTrigger(t)}
                className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-orange-500 focus:ring-orange-500"
              />
              {t}
            </label>
          ))}
        </div>
      </div>

      {/* Next review date */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Datum volgende herbeoordeling
          </label>
          <input
            type="date"
            value={report.nextReviewDate ?? ''}
            onChange={(e) => onUpdate({ report: { ...report, nextReviewDate: e.target.value } })}
            className={INPUT}
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="mb-1 block text-sm font-semibold text-zinc-700 dark:text-zinc-300">Opmerkingen</label>
        <textarea
          rows={2}
          value={report.notes ?? ''}
          onChange={(e) => onUpdate({ report: { ...report, notes: e.target.value } })}
          placeholder="Aanvullende opmerkingen bij het rapport"
          className={TEXTAREA}
        />
      </div>

      {/* Export */}
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-5 py-4 dark:border-zinc-700 dark:bg-zinc-800/30">
        <h3 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">Rapport exporteren</h3>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(buildReportText(investigation));
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.905.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
            </svg>
            {copied ? '✓ Gekopieerd' : 'Kopieer als tekst'}
          </button>
        </div>
        <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
          Gebruik &ldquo;Exporteer als JSON&rdquo; in het onderzoekenoverzicht voor een volledige back-up.
        </p>
      </div>
    </div>
  );
}
