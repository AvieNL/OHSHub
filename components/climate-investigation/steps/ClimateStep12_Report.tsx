'use client';

import { useState } from 'react';
import type { ClimateInvestigation, ClimateReport } from '@/lib/climate-investigation-types';
import { computeAllClimateStatistics, verdictBadgeClass, pmvCategoryBadgeClass } from '@/lib/climate-stats';
import { Abbr } from '@/components/Abbr';
import { Button, Icon, Textarea, Input } from '@/components/ui';
import InlineStepHeader from '@/components/InlineStepHeader';
import InlineEdit from '@/components/InlineEdit';
import MarkdownContent from '@/components/MarkdownContent';

const STEP_KEY = 'step.12';
const NS = 'investigation.climate';
const FALLBACK_TITLE = 'Stap 13 — Rapport';
const FALLBACK_DESC = 'Samenvatting van alle onderzoeksresultaten, conclusies en beheersmaatregelen. Exporteer als tekst voor gebruik in rapportagedocumenten.';

interface Props {
  investigation: ClimateInvestigation;
  onUpdate: (partial: Partial<ClimateInvestigation>) => void;
  contentOverrides?: Record<string, string>;
}

const REVIEW_TRIGGER_OPTIONS = [
  'Proceswijziging of verplaatsing van werkplek',
  'Wijziging van arbeidsmiddelen of warmtebronnen',
  'Klachten van medewerkers over warmte, kou of tochtverschijnselen',
  'Resultaten gezondheidsonderzoek geven aanleiding tot herbeoordeling',
  'Organisatiewijziging (nieuwe functies, andere BG-samenstelling)',
  'Na implementatie technische of organisatorische maatregelen',
  'Seizoensgebonden herbeoordeling (zomer / winter)',
  'Periodiek conform arbobeleid (jaarlijks of driejaarlijks)',
];

function fmt1(v: number | undefined | null): string {
  return v != null ? v.toFixed(1) : '—';
}

function fmt2(v: number | undefined | null): string {
  return v != null ? v.toFixed(2) : '—';
}

function buildReportText(inv: ClimateInvestigation): string {
  const now = new Date().toLocaleDateString('nl-NL', { year: 'numeric', month: 'long', day: 'numeric' });
  const statistics = computeAllClimateStatistics(inv);

  const lines: string[] = [];

  lines.push('KLIMAATONDERZOEK RAPPORT');
  lines.push('========================');
  lines.push(`Gegenereerd: ${now}`);
  lines.push('');

  // Opdrachtinformatie
  if (inv.scope.companyName || inv.scope.workplaceName) {
    lines.push('OPDRACHTINFORMATIE');
    lines.push('──────────────────');
    if (inv.scope.companyName)    lines.push(`Bedrijf:        ${inv.scope.companyName}`);
    if (inv.scope.workplaceName)  lines.push(`Werkplek:       ${inv.scope.workplaceName}`);
    if (inv.scope.workplaceAddress) lines.push(`Adres:          ${inv.scope.workplaceAddress}`);
    if (inv.scope.purpose)        lines.push(`Doel:           ${inv.scope.purpose}`);
    if (inv.scope.investigationPeriod) lines.push(`Periode:        ${inv.scope.investigationPeriod}`);
    if (inv.scope.season)         lines.push(`Seizoen:        ${inv.scope.season}`);
    lines.push('');
  }

  // Onderzoekers
  if (inv.investigators.length > 0) {
    lines.push('ONDERZOEKERS');
    lines.push('────────────');
    inv.investigators.forEach((p) => {
      const parts = [p.name, p.qualification, p.organization].filter(Boolean);
      lines.push(`• ${parts.join(' — ')}`);
    });
    lines.push('');
  }

  // Geselecteerde scenario's
  const SCENARIO_LABEL: Record<string, string> = {
    comfort: 'Thermisch comfort (PMV/PPD) — ISO 7730:2025',
    heat:    'Warmtestress (WBGT + PHS) — ISO 7243:2017 + ISO 7933:2023',
    cold:    'Koudestress (IREQ) — ISO 11079:2007',
    local:   'Lokaal thermisch comfort — ISO 7730:2025 §6',
  };
  if (inv.scenarios.length > 0) {
    lines.push("TOEGEPASTE NORMEN");
    lines.push('─────────────────');
    inv.scenarios.forEach((s) => lines.push(`• ${SCENARIO_LABEL[s] ?? s}`));
    lines.push('');
  }

  // Resultaten per BG
  lines.push('RESULTATEN PER BLOOTSTELLINGSGROEP');
  lines.push('───────────────────────────────────');
  inv.bgs.forEach((bg, idx) => {
    const stat = statistics.find((s) => s.bgId === bg.id);
    lines.push(`BG ${idx + 1}: ${bg.name}`);
    lines.push(`  Metabole klasse: ${bg.metabolicClass} | M = ${bg.metabolicRateOverride ?? 0} W/m² | I_cl = ${bg.clothingInsulation} clo`);
    lines.push(`  Metingen: n = ${stat?.n ?? 0}`);

    if (stat?.pmv != null) {
      lines.push(`  PMV/PPD:  PMV = ${fmt2(stat.pmv)} | PPD = ${stat.ppd}% | Categorie ${stat.pmvCategory ?? '—'}`);
    }
    if (stat?.wbgt != null) {
      lines.push(`  WBGT:     ${fmt1(stat.wbgt)} °C (ref: ${fmt1(stat.wbgtRef)} °C) — ${stat.wbgtVerdictLabel ?? '—'}`);
    }
    if (stat?.phsVerdict != null) {
      lines.push(`  PHS:      S_Wreq = ${stat.phsSWreq ?? '—'} g/h | S_Wmax = ${stat.phsSWmax ?? '—'} g/h${stat.phsDlimMin != null ? ` | D_lim = ${stat.phsDlimMin} min` : ''} — ${stat.phsVerdictLabel ?? '—'}`);
    }
    if (stat?.ireqNeutral != null) {
      lines.push(`  IREQ:     IREQneutral = ${fmt2(stat.ireqNeutral)} clo | IREQmin = ${fmt2(stat.ireqMin)} clo | I_cl,r = ${fmt2(stat.ireqAvailable)} clo${stat.ireqDlimMin != null ? ` | D_lim = ${stat.ireqDlimMin} min` : ''} — ${stat.ireqVerdictLabel ?? '—'}`);
    }
    if (stat?.dr != null) {
      lines.push(`  Tocht DR: ${stat.dr}% (Cat. ${stat.drCategory ?? '—'})`);
    }
    if (stat?.verticalTempDiff != null) {
      lines.push(`  Vert. Δt: ${fmt1(stat.verticalTempDiff)} K (Cat. ${stat.verticalTempCategory ?? '—'})`);
    }
    lines.push('');
  });

  // Maatregelen
  if (inv.measures.length > 0) {
    lines.push('BEHEERSMAATREGELEN');
    lines.push('──────────────────');
    inv.measures.forEach((m, i) => {
      lines.push(`${i + 1}. [P${m.priority}] ${m.description}`);
      if (m.responsible) lines.push(`   Verantw.: ${m.responsible}`);
      if (m.deadline) lines.push(`   Deadline: ${m.deadline}`);
      if (m.status !== 'planned') lines.push(`   Status: ${m.status}`);
    });
    lines.push('');
  }

  // Conclusie
  if (inv.report.conclusion) {
    lines.push('CONCLUSIE');
    lines.push('─────────');
    lines.push(inv.report.conclusion);
    lines.push('');
  }

  // Herbeoordelingstriggers
  if (inv.report.reviewTriggers.length > 0) {
    lines.push('HERBEOORDELINGSTRIGGERS');
    lines.push('───────────────────────');
    inv.report.reviewTriggers.forEach((t) => lines.push(`• ${t}`));
    lines.push('');
  }

  lines.push('─────────────────────────────────────────────');
  lines.push(`Gegenereerd door OHSHub · ${now}`);
  lines.push('ISO 7730:2025 · ISO 7243:2017 · ISO 7933:2023 · ISO 11079:2007');

  return lines.join('\n');
}

export default function ClimateStep12_Report({ investigation, onUpdate, contentOverrides }: Props) {
  const [copied, setCopied] = useState(false);
  const statistics = computeAllClimateStatistics(investigation);

  const title = contentOverrides?.[`${STEP_KEY}.title`] ?? FALLBACK_TITLE;
  const desc = contentOverrides?.[`${STEP_KEY}.desc`];

  function updateReport(partial: Partial<ClimateReport>) {
    onUpdate({ report: { ...investigation.report, ...partial } });
  }

  function toggleTrigger(trigger: string) {
    const current = investigation.report.reviewTriggers;
    const updated = current.includes(trigger)
      ? current.filter((t) => t !== trigger)
      : [...current, trigger];
    updateReport({ reviewTriggers: updated });
  }

  // Determine overall compliance status
  const hasExceedances = statistics.some(
    (s) =>
      s.wbgtVerdict === 'exceeds' ||
      s.phsVerdict === 'danger' ||
      s.ireqVerdict === 'danger' ||
      s.pmvCategory === 'D',
  );
  const hasWarnings = statistics.some(
    (s) =>
      s.wbgtVerdict === 'caution' ||
      s.phsVerdict === 'limited' ||
      s.ireqVerdict === 'cool' ||
      s.pmvCategory === 'C',
  );

  return (
    <div className="space-y-8">
      <div>
        <InlineStepHeader namespace={NS} stepKey={STEP_KEY} fallbackTitle={FALLBACK_TITLE} title={title} />
        <InlineEdit namespace={NS} contentKey={`${STEP_KEY}.desc`}
          initialValue={desc ?? FALLBACK_DESC} fallback={FALLBACK_DESC} multiline markdown>
          {desc
            ? <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                <MarkdownContent>{desc}</MarkdownContent>
              </p>
            : <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                Samenvatting van alle onderzoeksresultaten, conclusies en beheersmaatregelen.
                Exporteer als tekst voor gebruik in rapportagedocumenten.
              </p>
          }
        </InlineEdit>
      </div>

      {/* Compliancestatus */}
      <div className={`rounded-xl border-2 px-5 py-4 ${
        hasExceedances
          ? 'border-red-400 bg-red-50 dark:border-red-600 dark:bg-red-900/10'
          : hasWarnings
            ? 'border-amber-400 bg-amber-50 dark:border-amber-600 dark:bg-amber-900/10'
            : statistics.length === 0
              ? 'border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/30'
              : 'border-emerald-400 bg-emerald-50 dark:border-emerald-600 dark:bg-emerald-900/10'
      }`}>
        <p className={`text-sm font-semibold ${
          hasExceedances ? 'text-red-800 dark:text-red-300' :
          hasWarnings    ? 'text-amber-800 dark:text-amber-300' :
          statistics.length === 0 ? 'text-zinc-600 dark:text-zinc-400' :
          'text-emerald-800 dark:text-emerald-300'
        }`}>
          {hasExceedances
            ? 'Overschrijding(en) vastgesteld — maatregelen vereist'
            : hasWarnings
              ? 'Aandachtspunten — preventieve maatregelen aanbevolen'
              : statistics.length === 0
                ? 'Nog geen meetresultaten beschikbaar'
                : 'Alle beoordeelde parameters voldoen aan de normen'}
        </p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          {investigation.bgs.length} blootstellingsgroep{investigation.bgs.length !== 1 ? 'en' : ''} &nbsp;·&nbsp;{' '}
          {investigation.scenarios.map((s) => ({
            comfort: 'PMV/PPD', heat: 'WBGT/PHS', cold: 'IREQ', local: 'Lokaal',
          }[s] ?? s)).join(' · ')}
        </p>
      </div>

      {/* Resultaten samenvatting per BG */}
      {investigation.bgs.length > 0 && (
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Resultaten per blootstellingsgroep
          </h3>
          <div className="space-y-2">
            {investigation.bgs.map((bg, idx) => {
              const stat = statistics.find((s) => s.bgId === bg.id);
              return (
                <div key={bg.id} className="rounded-lg border border-zinc-200 px-4 py-3 dark:border-zinc-700">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                        BG {idx + 1}: {bg.name}
                      </p>
                      <p className="text-xs text-zinc-400">n = {stat?.n ?? 0} meting{(stat?.n ?? 0) !== 1 ? 'en' : ''}</p>
                    </div>
                    <div className="flex flex-wrap justify-end gap-1.5">
                      {stat?.pmvCategory && (
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${pmvCategoryBadgeClass(stat.pmvCategory)}`}>
                          PMV {fmt2(stat.pmv)} Cat.{stat.pmvCategory}
                        </span>
                      )}
                      {stat?.wbgtVerdictColor && (
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${verdictBadgeClass(stat.wbgtVerdictColor)}`}>
                          WBGT {fmt1(stat.wbgt)} °C
                        </span>
                      )}
                      {stat?.phsVerdictColor && (
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${verdictBadgeClass(stat.phsVerdictColor)}`}>
                          PHS {stat.phsVerdict === 'acceptable' ? '✓' : `D_lim ${stat.phsDlimMin ?? '?'} min`}
                        </span>
                      )}
                      {stat?.ireqVerdictColor && (
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${verdictBadgeClass(stat.ireqVerdictColor)}`}>
                          IREQ {stat.ireqVerdict === 'comfortable' ? '✓' : fmt2(stat.ireqAvailable) + ' clo'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Conclusietekst */}
      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          Conclusie
        </h3>
        <Textarea
          rows={5}
          value={investigation.report.conclusion ?? ''}
          onChange={(e) => updateReport({ conclusion: e.target.value })}
          placeholder="Samenvatting van de belangrijkste bevindingen en conclusies…"
        />
      </div>

      {/* Conformiteitsverklaring */}
      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          Conformiteitsverklaring
        </h3>
        <Textarea
          rows={3}
          value={investigation.report.complianceStatement ?? ''}
          onChange={(e) => updateReport({ complianceStatement: e.target.value })}
          placeholder="Bijv. 'Alle gemeten blootstellingsgroepen voldoen aan de normen van ISO 7730:2025 categorie B en ISO 7243:2017.'"
        />
      </div>

      {/* Herbeoordeling */}
      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          Datum volgende herbeoordeling
        </h3>
        <Input
          type="date"
          value={investigation.report.nextReviewDate ?? ''}
          onChange={(e) => updateReport({ nextReviewDate: e.target.value })}
        />
      </div>

      {/* Herbeoordelingstriggers */}
      <div>
        <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          Herbeoordelingstriggers
        </h3>
        <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
          Selecteer de situaties die aanleiding geven tot een nieuwe beoordeling van het thermisch klimaat.
        </p>
        <div className="space-y-1.5">
          {REVIEW_TRIGGER_OPTIONS.map((trigger) => (
            <label key={trigger} className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-100 px-3 py-2 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50">
              <input
                type="checkbox"
                checked={investigation.report.reviewTriggers.includes(trigger)}
                onChange={() => toggleTrigger(trigger)}
                className="h-4 w-4 accent-orange-500"
              />
              <span className="text-sm text-zinc-700 dark:text-zinc-300">{trigger}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Notities */}
      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          Rapportnotities
        </h3>
        <Textarea
          rows={3}
          value={investigation.report.notes ?? ''}
          onChange={(e) => updateReport({ notes: e.target.value })}
          placeholder="Aanvullende opmerkingen over het onderzoek…"
        />
      </div>

      {/* Exportbalk */}
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-5 py-4 dark:border-zinc-700 dark:bg-zinc-800/30">
        <h3 className="mb-1 text-sm font-semibold text-zinc-800 dark:text-zinc-200">Export</h3>
        <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
          Kopieer de rapporttekst naar klembord voor gebruik in een tekstverwerker of e-mail.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="primary"
            onClick={() => {
              navigator.clipboard.writeText(buildReportText(investigation));
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            leftIcon={copied ? <Icon name="check" size="sm" /> : <Icon name="document" size="sm" />}
          >
            {copied ? 'Gekopieerd!' : 'Kopieer rapporttekst'}
          </Button>
        </div>
      </div>

      {/* Afronding */}
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 dark:border-emerald-800/40 dark:bg-emerald-900/10">
        <div className="flex items-start gap-3">
          <svg className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
              Klimaatonderzoek afgerond
            </p>
            <p className="mt-0.5 text-xs text-emerald-700 dark:text-emerald-400">
              Alle stappen zijn doorlopen. Bewaar dit onderzoek in uw archieven conform de bewaarplicht
              van het arbobeleid. Herzie bij elke wijziging in de werkprocessen of bij het aantreden van
              nieuwe medewerkers in de blootgestelde functies.
            </p>
            <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-500">
              Toepasselijke normen: <Abbr id="ISO7730">ISO 7730:2025</Abbr> ·{' '}
              <Abbr id="ISO7243">ISO 7243:2017</Abbr> ·{' '}
              <Abbr id="ISO7933">ISO 7933:2023</Abbr> ·{' '}
              <Abbr id="ISO11079">ISO 11079:2007</Abbr>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
