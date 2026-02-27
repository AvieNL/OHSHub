'use client';

import { useEffect, useRef, useState } from 'react';
import type { SoundInvestigation, SoundReport } from '@/lib/sound-investigation-types';
import { OCTAVE_BANDS, calcOctaveAPF } from '@/lib/sound-ppe';
import { downloadSoundPDF } from '@/lib/sound-pdf-html';
import katex from 'katex';
import { Formula } from '@/components/Formula';
import { SectionRef } from '@/components/SectionRef';

interface Props {
  investigation: SoundInvestigation;
  onUpdate: (partial: Partial<SoundInvestigation>) => void;
  onGoToStep: (step: number) => void;
}

function fmt1(n: number): string {
  return isFinite(n) ? n.toFixed(1) : '—';
}

const STRATEGY_LABEL: Record<string, string> = {
  'task-based': 'Taakgericht (§9)',
  'job-based':  'Functiegericht (§10)',
  'full-day':   'Volledige dag (§11)',
};

const WORK_PATTERN_LABEL: Record<string, string> = {
  'stationary-simple':        'Vaste werkplek — eenvoudige of enkelvoudige taak',
  'stationary-complex':       'Vaste werkplek — meerdere of complexe taken',
  'mobile-predictable-small': 'Mobiele medewerker — voorspelbaar patroon, weinig taken',
  'mobile-predictable-large': 'Mobiele medewerker — voorspelbaar patroon, veel/complexe taken',
  'mobile-unpredictable':     'Mobiele medewerker — onvoorspelbaar werkpatroon',
  'unspecified':              'Niet nader bepaald',
};

const INSTRUMENT_TYPE_LABEL: Record<string, string> = {
  'slm-class1': 'Geluidniveaumeter klasse 1 (IEC 61672-1)',
  'dosimeter':  'Persoonlijke dosimeter (IEC 61252)',
  'slm-class2': 'Geluidniveaumeter klasse 2 (IEC 61672-1)',
};

const REVIEW_TRIGGER_OPTIONS = [
  'Proceswijziging of introductie nieuwe geluidbronnen',
  'Wijziging van productie-omstandigheden of werkmethoden',
  'Klachten van medewerkers over gehoor of tinnitus',
  'Resultaten gehooronderzoek geven aanleiding tot herbeoordeling',
  'Organisatiewijziging (nieuwe functies, andere HEG-samenstelling)',
  'Na implementatie technische of organisatorische maatregelen',
  'Periodiek (driejaarlijks of conform arbobeleid)',
];

// §9.7 / §10.5 / §11.5: triggers die de norm expliciet vereist
const NORM_REQUIRED_TRIGGERS = [
  'Proceswijziging of introductie nieuwe geluidbronnen',
  'Wijziging van productie-omstandigheden of werkmethoden',
  'Resultaten gehooronderzoek geven aanleiding tot herbeoordeling',
  'Na implementatie technische of organisatorische maatregelen',
];

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
      {children}
    </h3>
  );
}

// ─── CSV export ────────────────────────────────────────────────────────────────

function buildCSV(inv: SoundInvestigation): string {
  const rows: string[][] = [
    ['HEG', 'Taak', 'Werknemer', 'Datum', 'Start', 'Eind', 'L_p,A,eqT (dB)', 'L_p,Cpeak (dB(C))', 'Calib voor (dB)', 'Calib na (dB)', 'Uitgesloten', 'Reden uitsluiting'],
  ];
  for (const m of inv.measurements) {
    const heg   = inv.hegs.find((h) => h.id === m.hegId);
    const task  = m.taskId ? inv.tasks.find((t) => t.id === m.taskId) : null;
    rows.push([
      heg?.name ?? '',
      task?.name ?? '',
      m.workerLabel ?? '',
      m.date ?? '',
      m.startTime ?? '',
      m.endTime ?? '',
      String(m.lpa_eqT),
      m.lpCpeak != null ? String(m.lpCpeak) : '',
      m.calibBefore != null ? String(m.calibBefore) : '',
      m.calibAfter != null ? String(m.calibAfter) : '',
      m.excluded ? 'Ja' : 'Nee',
      m.exclusionReason ?? '',
    ]);
  }
  return rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
}

function downloadCSV(inv: SoundInvestigation) {
  const csv  = buildCSV(inv);
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `${inv.name.replace(/\s+/g, '-')}-meetwaarden.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Render formula tokens in plain text → safe HTML ─────────────────────────

const FORMULA_TOKENS: { regex: RegExp; latex: string }[] = [
  { regex: /L_EX,8h,95%/g,  latex: 'L_{EX,8h,95\\%}' },
  { regex: /L_EX,8h/g,      latex: 'L_{EX,8h}' },
  { regex: /L_p,Cpeak/g,    latex: 'L_{p,Cpeak}' },
  { regex: /L_p,A,eqT/g,    latex: 'L_{p,A,eqT}' },
  { regex: /T_e\b/g,        latex: 'T_e' },
  { regex: /T_0\b/g,        latex: 'T_0' },
];

const MARKER = '\uE000';

function renderComplianceHtml(text: string): string {
  if (!text) return '';

  const renderedFormulas: string[] = [];

  let processed = text;
  for (const { regex, latex } of FORMULA_TOKENS) {
    processed = processed.replace(regex, () => {
      const idx = renderedFormulas.length;
      renderedFormulas.push(
        katex.renderToString(latex, { throwOnError: false, output: 'html', strict: false }),
      );
      return `${MARKER}${idx}${MARKER}`;
    });
  }

  // HTML-escape the literal text parts (markers survive because they don't contain <>&")
  const escaped = processed
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Restore formula HTML, then turn newlines into <br>
  return escaped
    .replace(new RegExp(`${MARKER}(\\d+)${MARKER}`, 'g'), (_, i) => renderedFormulas[Number(i)])
    .replace(/\n/g, '<br>');
}

// ─── Auto-generated compliance statement (§15.e.7) ────────────────────────────

const STRATEGY_LABEL_SHORT: Record<string, string> = {
  'task-based': 'taakgerichte strategie (§9)',
  'job-based':  'functiegerichte strategie (§10)',
  'full-day':   'volledige-dagstrategie (§11)',
};

function generateComplianceStatement(inv: SoundInvestigation): string {
  const { hegs, instruments, statistics, scope } = inv;

  const fmt1 = (n: number) => isFinite(n) ? n.toFixed(1) : '—';
  const today = new Date().toLocaleDateString('nl-NL');
  const company = scope.companyName ? ` bij ${scope.companyName}` : '';
  const location = scope.workplaceName ? ` (${scope.workplaceName})` : '';

  const instLine = instruments.length > 0
    ? instruments.map((i) => {
        const t = i.type === 'slm-class1' ? 'geluidniveaumeter klasse 1' :
                  i.type === 'dosimeter'  ? 'persoonlijke dosimeter' : 'geluidniveaumeter klasse 2';
        const cal = i.lastLabCalibration ? `, gecalibreerd ${i.lastLabCalibration}` : '';
        const desc = [i.manufacturer, i.model].filter(Boolean).join(' ');
        return `${t}${desc ? ` (${desc})` : ''}${cal}`;
      }).join('; ')
    : 'meetapparatuur conform NEN-EN-ISO 9612:2025 §5';

  if (statistics.length === 0) {
    return `Dit onderzoek${company}${location} is uitgevoerd conform NEN-EN-ISO 9612:2025 (Third edition). ` +
           `De meetonzekerheid is bepaald conform Bijlage C (k = 1,65; eenzijdig 95%-betrouwbaarheidsinterval). ` +
           `Meetapparatuur: ${instLine}. ` +
           `Resultaten worden vastgelegd zodra de berekeningen zijn uitgevoerd (stap 9).`;
  }

  const resultLines = statistics.map((stat) => {
    const heg = hegs.find((h) => h.id === stat.hegId);
    const stratLabel = STRATEGY_LABEL_SHORT[stat.strategy] ?? stat.strategy;
    const verdict =
      stat.verdict === 'below-lav' ? 'voldoet — geen actiewaarde overschreden' :
      stat.verdict === 'lav'       ? 'onderste actiewaarde (80 dB(A)) overschreden' :
      stat.verdict === 'uav'       ? 'bovenste actiewaarde (85 dB(A)) overschreden' :
                                     'GRENSWAARDE (87 dB(A)) OVERSCHREDEN';
    return `• ${heg?.name ?? stat.hegId}: L_EX,8h = ${fmt1(stat.lEx8h)} dB(A), U = ${fmt1(stat.U)} dB, ` +
           `L_EX,8h,95% = ${fmt1(stat.lEx8h_95pct)} dB(A) [${stratLabel}, n = ${stat.n}] — ${verdict}`;
  }).join('\n');

  const worstVerdict = statistics.reduce<string>((w, s) => {
    const order = ['below-lav', 'lav', 'uav', 'above-elv'];
    return order.indexOf(s.verdict) > order.indexOf(w) ? s.verdict : w;
  }, 'below-lav');

  const overallVerdict =
    worstVerdict === 'below-lav' ? 'De blootstelling van alle HEGs blijft onder de actiewaarden.' :
    worstVerdict === 'lav'       ? 'Ten minste één HEG overschrijdt de onderste actiewaarde; het maatregelenprogramma (art. 6.6 lid 1a) is van toepassing.' :
    worstVerdict === 'uav'       ? 'Ten minste één HEG overschrijdt de bovenste actiewaarde; directe uitvoering van het maatregelenprogramma en verplicht gebruik van gehoorbescherming (art. 6.6 lid 1b) zijn vereist.' :
    'Ten minste één HEG overschrijdt de grenswaarde; onmiddellijke maatregelen zijn wettelijk verplicht (art. 6.6 lid 2).';

  return `Dit onderzoek${company}${location} is uitgevoerd conform NEN-EN-ISO 9612:2025 (Third edition) — ` +
         `Akoestiek — Bepaling van de blootstelling aan lawaai op de arbeidsplaats. ` +
         `Datum rapport: ${today}.\n\n` +
         `Meetapparatuur: ${instLine}.\n\n` +
         `De meetonzekerheid is bepaald conform Bijlage C van NEN-EN-ISO 9612:2025 ` +
         `met uitbreidingsfactor k = 1,65 (eenzijdig 95%-betrouwbaarheidsinterval).\n\n` +
         `Resultaten per homogene blootstellingsgroep (HEG):\n${resultLines}\n\n` +
         `${overallVerdict}`;
}

// ─── Markdown export ───────────────────────────────────────────────────────────

const PRE_SURVEY_LABEL: Record<string, string> = {
  'measurement-required': 'Meting vereist (conform NEN-EN-ISO 9612)',
  'strongly-recommended': 'Meting sterk aanbevolen',
  'recommended':          'Meting aanbevolen',
  'borderline':           'Grensgebied — oordeel nodig',
  'not-required':         'Meting niet vereist op basis van vooronderzoek',
  'overridden':           'Aanbeveling overschreven door onderzoeker',
};

function mdRow(key: string, val: string | number | undefined | null): string {
  if (val == null || val === '') return '';
  return `| ${key} | ${val} |\n`;
}

function buildReportMarkdown(inv: SoundInvestigation): string {
  const { scope, investigators, clients, respondents, hegs, tasks, instruments, measurements, statistics, measures, report } = inv;
  const today = new Date().toLocaleDateString('nl-NL');
  const lines: string[] = [];

  lines.push(`# ${inv.name}`);
  lines.push(`> NEN-EN-ISO 9612:2025 · Arbobesluit art. 6.5–6.11 · OHSHub · ${today}`);
  lines.push('');

  // ── 1. Vooronderzoek ─────────────────────────────────────────────────────────
  if (inv.preSurveyRecommendation) {
    lines.push('## 1. Vooronderzoek en meetaanleiding');
    lines.push('| Veld | Waarde |');
    lines.push('|------|--------|');
    lines.push(mdRow('Aanbeveling', PRE_SURVEY_LABEL[inv.preSurveyRecommendation] ?? inv.preSurveyRecommendation));
    if (inv.preSurvey?.respondentName) lines.push(mdRow('Respondent', inv.preSurvey.respondentName));
    if (inv.preSurvey?.completedAt)   lines.push(mdRow('Datum', inv.preSurvey.completedAt));
    if (inv.preSurveyOverrideReason)  lines.push(mdRow('Reden afwijking', inv.preSurveyOverrideReason));
    lines.push('');
    if (inv.preSurveySignals?.length) {
      lines.push('**Risicosignalen:**');
      for (const s of inv.preSurveySignals) lines.push(`- ${s}`);
      lines.push('');
    }
  }

  // ── 2. Onderzoeksopdracht ────────────────────────────────────────────────────
  const chScope = inv.preSurveyRecommendation ? 2 : 1;
  lines.push(`## ${chScope}. Onderzoeksopdracht en doel`);
  lines.push('| Veld | Waarde |');
  lines.push('|------|--------|');
  lines.push(mdRow('Opdrachtgever', scope.companyName));
  lines.push(mdRow('Arbeidsplaats', scope.workplaceName));
  lines.push(mdRow('Adres', scope.workplaceAddress));
  lines.push(mdRow('Werknemers', scope.workerDescription));
  lines.push(mdRow('Doel', scope.purpose));
  lines.push(mdRow('Meetperiode', scope.investigationPeriod));
  lines.push(mdRow('Opmerkingen', scope.notes));
  lines.push('');

  const QUAL_LABEL: Record<string, string> = {
    AH: 'Arbeidshygiënist', HVK: 'Hogere Veiligheidskundige',
    acousticus: 'Acousticus',
  };
  if (investigators.length > 0) {
    lines.push('**Onderzoeker(s):**');
    for (const p of investigators) {
      const namePart = [p.name, p.role, p.organization].filter(Boolean).join(' — ');
      // For 'other': use the free-text note, not "Overige"
      const qualPart = p.qualification === 'other'
        ? (p.qualificationNote || null)
        : (p.qualification ? (QUAL_LABEL[p.qualification] ?? p.qualification) : null);
      const akdPart  = p.isAKD ? `AKD nr. ${p.akdNumber ?? '(geregistreerd)'}` : null;
      // For 'other' the note is already in qualPart, so don't add it again
      const qualLine = [qualPart, akdPart, p.qualification !== 'other' ? p.qualificationNote : null].filter(Boolean).join(' · ');
      const contact  = [p.email ? `✉ ${p.email}` : null, p.phone ? `✆ ${p.phone}` : null].filter(Boolean).join(' · ');
      lines.push(`- **${namePart}**${qualLine ? ` — ${qualLine}` : ''}${contact ? `  \n  ${contact}` : ''}`);
    }
    lines.push('');
  }
  if (clients.length > 0) {
    lines.push('**Opdrachtgever(s):**');
    for (const p of clients) {
      const namePart = [p.name, p.role, p.organization, p.address].filter(Boolean).join(' — ');
      const contact  = [p.email ? `✉ ${p.email}` : null, p.phone ? `✆ ${p.phone}` : null].filter(Boolean).join(' · ');
      lines.push(`- **${namePart}**${contact ? `  \n  ${contact}` : ''}`);
    }
    lines.push('');
  }
  if (respondents.length > 0) {
    lines.push('**Respondent(en):**');
    for (const p of respondents) {
      const namePart = [p.name, p.role, p.organization].filter(Boolean).join(' — ');
      const contact  = [p.email ? `✉ ${p.email}` : null, p.phone ? `✆ ${p.phone}` : null].filter(Boolean).join(' · ');
      lines.push(`- **${namePart}**${contact ? `  \n  ${contact}` : ''}`);
    }
    lines.push('');
  }

  // ── 3. Werkanalyse ───────────────────────────────────────────────────────────
  const chWork = chScope + 1;
  lines.push(`## ${chWork}. Werkanalyse en HEG-definitie`);
  for (const h of hegs) {
    const idx = hegs.indexOf(h) + 1;
    lines.push(`### HEG ${idx}/${hegs.length}: ${h.name}`);
    lines.push('| Veld | Waarde |');
    lines.push('|------|--------|');
    lines.push(mdRow('Medewerkers', h.workerCount));
    lines.push(mdRow('T_e (werkdag)', `${h.effectiveDayHours} h`));
    lines.push(mdRow('Meetstrategie', STRATEGY_LABEL[h.strategy] ?? h.strategy));
    if (h.workPattern) lines.push(mdRow('Werkpatroon', WORK_PATTERN_LABEL[h.workPattern] ?? h.workPattern));
    if (h.noiseSources) lines.push(mdRow('Geluidbronnen', h.noiseSources));
    if (h.tinnitusReported) lines.push(mdRow('Tinnitus gemeld', 'Ja — Richtlijn SHT 2020 / NVAB'));
    if (h.notes) lines.push(mdRow('Motivering strategie', h.notes));
    if (h.ppeNotes) {
      const ppeLine = h.ppeNotes + (h.ppe2Notes ? ` + ${h.ppe2Notes}` : '');
      lines.push(mdRow('PBM (gehoorbescherming)', ppeLine));
    }
    lines.push('');
    if (h.strategy === 'task-based') {
      const hegTasks = tasks.filter((t) => t.hegId === h.id);
      if (hegTasks.length > 0) {
        lines.push('| Taak | T_m (h) | Motivering |');
        lines.push('|------|---------|------------|');
        for (const t of hegTasks) {
          lines.push(`| ${t.name} | ${t.durationHours} | ${t.notes ?? ''} |`);
        }
        lines.push('');
      }
    }
  }

  // ── 4. Meetapparatuur ────────────────────────────────────────────────────────
  const chInst = chWork + 1;
  lines.push(`## ${chInst}. Meetapparatuur en kalibratie`);
  if (instruments.length === 0) {
    lines.push('*Geen meetapparatuur geregistreerd.*');
  } else {
    lines.push('| Type | Fabrikant/model | Serienr. | Kalibratie |');
    lines.push('|------|----------------|---------|-----------|');
    for (const inst of instruments) {
      const t = INSTRUMENT_TYPE_LABEL[inst.type] ?? inst.type;
      const fab = [inst.manufacturer, inst.model].filter(Boolean).join(' ');
      lines.push(`| ${t} | ${fab || '—'} | ${inst.serialNumber ?? '—'} | ${inst.lastLabCalibration ?? '—'} |`);
    }
  }
  lines.push('');

  // ── 5. Meetgegevens (summary) ─────────────────────────────────────────────────
  const chMeas = chInst + 1;
  lines.push(`## ${chMeas}. Meetgegevens`);
  const validMeas = measurements.filter((m) => !m.excluded);
  lines.push(`Totaal meetwaarden: ${measurements.length} (${validMeas.length} geldig, ${measurements.length - validMeas.length} uitgesloten)`);
  lines.push('');
  for (const h of hegs) {
    const showTask = h.strategy === 'task-based';
    const validTaskIds = showTask ? new Set(tasks.filter((t) => t.hegId === h.id).map((t) => t.id)) : null;
    const hegMeas = measurements.filter((m) => {
      if (m.hegId !== h.id) return false;
      if (showTask) return m.taskId != null && validTaskIds!.has(m.taskId);
      return !m.taskId;
    });
    if (hegMeas.length === 0) continue;
    const idx = hegs.indexOf(h) + 1;
    lines.push(`### HEG ${idx}/${hegs.length}: ${h.name}`);
    lines.push(`| ${showTask ? 'Taak | ' : ''}Werknemer | Datum | L_p,A,eqT (dB) | L_p,Cpeak (dB(C)) | Status |`);
    lines.push(`| ${showTask ? '---- | ' : ''}--------- | ----- | -------------- | ----------------- | ------ |`);
    for (const m of hegMeas) {
      const task = m.taskId ? tasks.find((t) => t.id === m.taskId) : null;
      const status = m.excluded ? `~~uitgesloten${m.exclusionReason ? ': ' + m.exclusionReason : ''}~~` : 'geldig';
      lines.push(`| ${showTask ? (task?.name ?? '—') + ' | ' : ''}${m.workerLabel ?? '—'} | ${m.date ?? '—'} | ${m.lpa_eqT.toFixed(1)} | ${m.lpCpeak != null ? m.lpCpeak.toFixed(1) : '—'} | ${status} |`);
    }
    lines.push('');
  }

  // ── 6. Resultaten ─────────────────────────────────────────────────────────────
  const chRes = chMeas + 1;
  lines.push(`## ${chRes}. Statistische berekeningen en resultaten`);
  lines.push('*NEN-EN-ISO 9612:2025 · T₀ = 8 h · k = 1,65 (eenzijdig 95%)*');
  lines.push('');
  if (statistics.length === 0) {
    lines.push('*Geen berekeningen beschikbaar. Voer meetwaarden in bij stap 8 en herbereken bij stap 9.*');
  } else {
    for (const stat of statistics) {
      const heg  = hegs.find((h) => h.id === stat.hegId);
      const idx  = hegs.indexOf(heg!) + 1;
      const peakExceeded = stat.lCpeak != null && stat.lCpeak >= 140;
      lines.push(`### HEG ${idx}/${hegs.length}: ${heg?.name ?? stat.hegId} — ${stat.verdictLabel}`);
      lines.push('| Waarde | Resultaat |');
      lines.push('|--------|-----------|');
      lines.push(`| L_EX,8h | ${fmt1(stat.lEx8h)} dB(A) |`);
      lines.push(`| U (95%) | ${stat.U.toFixed(1)} dB |`);
      lines.push(`| **L_EX,8h,95%** | **${fmt1(stat.lEx8h_95pct)} dB(A)** |`);
      lines.push(`| Oordeel | ${stat.verdictLabel} |`);
      if (stat.lCpeak !== undefined) {
        lines.push(`| L_p,Cpeak | ${peakExceeded ? '⚠ ' : ''}${fmt1(stat.lCpeak)} dB(C)${peakExceeded ? ' — **PIEKGRENSWAARDE OVERSCHREDEN**' : ''} |`);
      }
      if (heg?.ppeAttenuation && !heg.ppeSNRUnknown) {
        const combinedAPF = stat.lEx8h_95pct_oor != null
          ? stat.lEx8h_95pct - stat.lEx8h_95pct_oor
          : heg.ppeAttenuation;
        const corrected = stat.lEx8h_95pct - combinedAPF;
        const ppeLine = heg.ppeNotes ? `${heg.ppeNotes}${heg.ppe2Notes ? ' + ' + heg.ppe2Notes : ''} — APF ${fmt1(combinedAPF)} dB` : `APF ${fmt1(combinedAPF)} dB`;
        lines.push(`| PBM | ${ppeLine} |`);
        lines.push(`| L_EX,8h,oor | ${fmt1(corrected)} dB(A) — ${corrected < 87 ? 'onder grenswaarde' : '⚠ GRENSWAARDE OVERSCHREDEN'} |`);
      } else if (heg?.ppeSNRUnknown) {
        lines.push(`| PBM | ${heg.ppeNotes ?? 'in gebruik'} — SNR onbekend, oor-niveau niet bepaald |`);
      }
      lines.push('');
      if (stat.taskResults?.length) {
        lines.push('| Taak | T_m (h) | n | L_p,A,eqTm (dB) | L_EX,8h,m (dB) |');
        lines.push('|------|---------|---|-----------------|----------------|');
        for (const tr of stat.taskResults) {
          lines.push(`| ${tr.taskName} | ${tr.durationHours} | ${tr.nMeasurements} | ${fmt1(tr.lpa_eqTm)} | ${fmt1(tr.lEx8hm)} |`);
        }
        lines.push('');
      }
    }
  }

  // ── 7. Beheersmaatregelen ─────────────────────────────────────────────────────
  const chMeasures = chRes + 1;
  if (measures.length > 0) {
    lines.push(`## ${chMeasures}. Beheersmaatregelen`);
    lines.push('| Prio | Type | Omschrijving | Verantwoordelijke | Deadline | Status |');
    lines.push('|------|------|-------------|-------------------|---------|--------|');
    const TYPE_LABEL: Record<string, string> = {
      substitution: 'Substitutie', technical: 'Technisch', organisational: 'Organisatorisch',
      ppe: 'PBM', audiometry: 'Gehooronderzoek',
    };
    for (const m of [...measures].sort((a, b) => a.priority - b.priority)) {
      const statusLabel = m.status === 'completed' ? '✓ Gereed' : m.status === 'in-progress' ? '⟳ Loopt' : '○ Gepland';
      lines.push(`| **P${m.priority}** | ${TYPE_LABEL[m.type] ?? m.type} | ${m.description}${m.notes ? ` *(${m.notes})*` : ''} | ${m.responsible ?? '—'} | ${m.deadline ?? '—'} | ${statusLabel} |`);
    }
    lines.push('');
  }

  // ── 8. Conclusie ──────────────────────────────────────────────────────────────
  const chConc = measures.length > 0 ? chMeasures + 1 : chRes + 1;
  lines.push(`## ${chConc}. Conclusie en conformiteitsverklaring`);
  if (report.conclusion) {
    lines.push(report.conclusion);
    lines.push('');
  }
  if (report.complianceStatement) {
    lines.push('**Conformiteitsverklaring:**');
    lines.push(report.complianceStatement);
    lines.push('');
  }
  if (report.nextReviewDate) lines.push(`**Datum volgende herbeoordeling:** ${report.nextReviewDate}`);
  if (report.reviewTriggers.length > 0) {
    lines.push('**Herbeoordeling ook vereist bij:**');
    for (const t of report.reviewTriggers) lines.push(`- ${t}`);
    lines.push('');
  }
  if (report.notes) { lines.push('**Overige opmerkingen:**'); lines.push(report.notes); lines.push(''); }

  // ── Handtekening ─────────────────────────────────────────────────────────────
  const QUAL_SIG: Record<string, string> = {
    AH: 'Arbeidshygiënist', HVK: 'Hogere Veiligheidskundige',
    acousticus: 'Acousticus',
  };
  const rankFn = (p: { isAKD?: boolean; qualification?: string }) =>
    p.isAKD ? 0 : p.qualification === 'AH' ? 1 : p.qualification === 'HVK' ? 2 : p.qualification === 'acousticus' ? 3 : 4;
  const sig = [...investigators].sort((a, b) => rankFn(a) - rankFn(b))[0];
  if (sig?.name) {
    lines.push('---');
    lines.push(`*Ondertekening conform NEN-EN-ISO 9612:2025 §15.e.7*`);
    lines.push('');
    lines.push(`**${sig.name}**`);
    // For 'other': show free-text note instead of "Overige deskundige"
    const sigQualLabel = sig.qualification === 'other'
      ? (sig.qualificationNote || null)
      : (sig.qualification ? (QUAL_SIG[sig.qualification] ?? sig.qualification) : null);
    if (sigQualLabel) lines.push(sigQualLabel);
    if (sig.isAKD) lines.push(`AKD nr. ${sig.akdNumber ?? '(geregistreerd)'}`);
    if (sig.organization) lines.push(sig.organization);
    lines.push(`Datum: ${today}`);
    lines.push('');
  }

  lines.push('---');
  lines.push(`*Gegenereerd door OHSHub · ${today} · NEN-EN-ISO 9612:2025*`);

  return lines.join('\n');
}

// ─── Review date suggestion ────────────────────────────────────────────────────

function suggestReviewDate(inv: SoundInvestigation): string {
  const deadlines = inv.measures
    .map((m) => m.deadline)
    .filter((d): d is string => !!d)
    .sort();
  if (deadlines.length > 0) {
    // Latest measure deadline — this is the point all measures should be complete,
    // making it a natural time to reassess the situation.
    return deadlines[deadlines.length - 1];
  }
  // Fallback: one year from today
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SoundStep10_Report({ investigation, onUpdate }: Props) {
  const { report, statistics, hegs, measures } = investigation;
  const [copied, setCopied] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const complianceRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize the compliance statement textarea.
  // Set height to 0 first so scrollHeight reflects the actual content regardless
  // of the current height. CSS min-h-24 on the element guarantees the 4-row
  // minimum even when scrollHeight is small (empty content).
  useEffect(() => {
    const el = complianceRef.current;
    if (!el) return;
    el.style.height = '0px';
    el.style.height = `${el.scrollHeight}px`;
  }, [report.complianceStatement]);

  function upd(partial: Partial<SoundReport>) {
    onUpdate({ report: { ...report, ...partial } });
  }

  // Seed norm-required review triggers on first render when the list is empty
  useEffect(() => {
    if (report.reviewTriggers.length === 0) {
      upd({ reviewTriggers: NORM_REQUIRED_TRIGGERS });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleTrigger(t: string) {
    const has = report.reviewTriggers.includes(t);
    upd({ reviewTriggers: has ? report.reviewTriggers.filter((x) => x !== t) : [...report.reviewTriggers, t] });
  }

  async function copyReport() {
    const text = buildReportMarkdown(investigation);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // ignore
    }
  }

  // Completion checklist
  const checks = [
    { label: 'HEG\'s gedefinieerd',              ok: hegs.length > 0 },
    { label: 'Meetstrategie gedocumenteerd',     ok: hegs.every((h) => h.strategy) },
    { label: 'Meetapparatuur geregistreerd',     ok: investigation.instruments.length > 0 },
    { label: 'Meetwaarden ingevoerd',            ok: investigation.measurements.filter((m) => !m.excluded).length >= 3 },
    { label: 'Berekeningen uitgevoerd',          ok: statistics.length > 0 },
    { label: 'Beheersmaatregelen vastgelegd',    ok: measures.length > 0 },
    { label: 'Conclusie ingevuld',               ok: !!report.conclusion?.trim() },
    { label: 'Conformiteitsverklaring ingevuld', ok: !!report.complianceStatement?.trim() },
    { label: 'Kwalificatie onderzoeker vastgelegd (art. 14 Arbowet)', ok: investigation.investigators.some((p) => !!p.qualification) },
    { label: 'Audiometrie gedocumenteerd voor LAV+ HEG\'s (art. 6.10 Arbobesluit)', ok: hegs.every((h) => {
        const stat = statistics.find((s) => s.hegId === h.id);
        if (!stat || stat.verdict === 'below-lav') return true;
        return !!h.audiometryStatus;
      })
    },
  ];
  const completionPct = Math.round((checks.filter((c) => c.ok).length / checks.length) * 100);

  // Suggestion hint for review date
  const latestDeadline = measures
    .map((m) => m.deadline)
    .filter((d): d is string => !!d)
    .sort()
    .at(-1);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Stap 12 — Rapport (<SectionRef id="§15">§15</SectionRef> NEN-EN-ISO 9612:2025)
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          Vul de conclusie en conformiteitsverklaring in. Het volledige rapport inclusief
          alle <SectionRef id="§15">§15</SectionRef>-vereiste gegevens kan worden geëxporteerd als PDF, CSV of JSON.
        </p>
      </div>

      {/* ── Completion checklist ─────────────────────────────────────────── */}
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/30">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Volledigheidscheck (<SectionRef id="§15">§15</SectionRef> vereisten)
          </p>
          <span className="text-xs font-semibold text-zinc-500">{completionPct}%</span>
        </div>
        <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
          <div
            className={`h-full rounded-full transition-all duration-500 ${completionPct === 100 ? 'bg-emerald-500' : 'bg-orange-500'}`}
            style={{ width: `${completionPct}%` }}
          />
        </div>
        <div className="grid gap-1 sm:grid-cols-2">
          {checks.map((c, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span className={c.ok ? 'text-emerald-500' : 'text-zinc-400'}>{c.ok ? '✓' : '○'}</span>
              <span className={c.ok ? 'text-zinc-700 dark:text-zinc-300' : 'text-zinc-400'}>{c.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Results summary ──────────────────────────────────────────────── */}
      {statistics.length > 0 && (
        <div className="space-y-3">
          <SectionTitle>Samenvatting meetresultaten</SectionTitle>
          <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-800/50">
                  <th className="px-4 py-2 text-left   text-xs font-medium text-zinc-500">HEG</th>
                  <th className="px-4 py-2 text-right  text-xs font-medium text-zinc-500"><Formula math="L_{EX,8h}" /> (dB(A))</th>
                  <th className="px-4 py-2 text-right  text-xs font-medium text-zinc-500"><Formula math="U" /> (dB)</th>
                  <th className="px-4 py-2 text-right  text-xs font-medium text-zinc-500"><Formula math="L_{EX,8h,95\%}" /> (dB(A))</th>
                  <th className="px-4 py-2 text-left   text-xs font-medium text-zinc-500">Oordeel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {statistics.map((stat) => {
                  const heg = hegs.find((h) => h.id === stat.hegId);
                  return (
                    <tr key={stat.hegId}>
                      <td className="px-4 py-2 text-zinc-800 dark:text-zinc-200">{heg?.name ?? stat.hegId}</td>
                      <td className="px-4 py-2 text-right font-mono">{fmt1(stat.lEx8h)}</td>
                      <td className="px-4 py-2 text-right font-mono">{stat.U.toFixed(1)}</td>
                      <td className="px-4 py-2 text-right font-mono font-semibold text-zinc-900 dark:text-zinc-50">{fmt1(stat.lEx8h_95pct)}</td>
                      <td className="px-4 py-2">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          stat.verdictColor === 'emerald' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                          stat.verdictColor === 'amber'   ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                          stat.verdictColor === 'orange'  ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                                                            'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {stat.verdictLabel}
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

      {/* ── Conclusion ───────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <SectionTitle>Conclusie & conformiteit</SectionTitle>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Conclusie (<SectionRef id="§15.e.6">§15.e.6</SectionRef>)
          </label>
          <textarea
            rows={5}
            value={report.conclusion ?? ''}
            onChange={(e) => upd({ conclusion: e.target.value })}
            placeholder="Samenvatting van de bevindingen en de beoordeling van de geluidblootstelling…"
            className="w-full resize-none rounded-lg border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between gap-3">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Conformiteitsverklaring (<SectionRef id="§15.e.7">§15.e.7</SectionRef>)
            </label>
            <button
              type="button"
              onClick={() => upd({ complianceStatement: generateComplianceStatement(investigation) })}
              className="shrink-0 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:border-orange-400 hover:text-orange-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:border-orange-500 dark:hover:text-orange-400"
            >
              Genereer op basis van meetresultaten
            </button>
          </div>
          <textarea
            ref={complianceRef}
            rows={4}
            value={report.complianceStatement ?? ''}
            onChange={(e) => upd({ complianceStatement: e.target.value })}
            placeholder="Klik 'Genereer op basis van meetresultaten' voor een automatisch gegenereerde conformiteitsverklaring op basis van stap 9."
            className="w-full min-h-24 resize-none overflow-hidden rounded-lg border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
          {report.complianceStatement && (
            <div className="mt-2 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50">
              <button
                type="button"
                onClick={() => setPreviewOpen((o) => !o)}
                className="flex w-full items-center justify-between px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
              >
                <span>Weergave (formules gerenderd)</span>
                <svg
                  className={`h-3.5 w-3.5 transition-transform ${previewOpen ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {previewOpen && (
                <div
                  className="border-t border-zinc-200 px-4 py-3 text-sm leading-relaxed text-zinc-700 dark:border-zinc-700 dark:text-zinc-300 [&_.katex]:text-[0.95em]"
                  dangerouslySetInnerHTML={{ __html: renderComplianceHtml(report.complianceStatement) }}
                />
              )}
            </div>
          )}
          <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
            De gegenereerde tekst is een startpunt — pas aan naar wens voordat u het rapport afrondt.
          </p>
        </div>
      </div>

      {/* ── Periodieke herbeoordeling ────────────────────────────────────── */}
      <div className="space-y-4">
        <SectionTitle>Periodieke herbeoordeling</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Datum volgende herbeoordeling
            </label>
            <input
              type="date"
              value={report.nextReviewDate ?? ''}
              onChange={(e) => upd({ nextReviewDate: e.target.value })}
              className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
            {latestDeadline && (
              <>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => upd({ nextReviewDate: latestDeadline })}
                    className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:border-orange-400 hover:text-orange-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:border-orange-500 dark:hover:text-orange-400"
                  >
                    Instellen op basis van maatregelen ({latestDeadline})
                  </button>
                </div>
                <p className="mt-1.5 text-xs text-zinc-400 dark:text-zinc-500">
                  De verste maatregel-deadline is {latestDeadline}. Na implementatie van alle maatregelen is herbeoordeling logisch.
                </p>
              </>
            )}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Herbeoordeling ook vereist bij (<SectionRef id="§9.7">§9.7</SectionRef> / <SectionRef id="§10.5">§10.5</SectionRef> / <SectionRef id="§11.5">§11.5</SectionRef>)
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {REVIEW_TRIGGER_OPTIONS.map((t) => (
              <label
                key={t}
                className={`flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2.5 text-sm transition ${
                  report.reviewTriggers.includes(t)
                    ? 'border-zinc-300 bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-700/40'
                    : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={report.reviewTriggers.includes(t)}
                  onChange={() => toggleTrigger(t)}
                  className="mt-0.5 accent-orange-500"
                />
                <span className="text-zinc-700 dark:text-zinc-300">{t}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* ── Notes ────────────────────────────────────────────────────────── */}
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Overige opmerkingen
        </label>
        <textarea
          rows={3}
          value={report.notes ?? ''}
          onChange={(e) => upd({ notes: e.target.value })}
          placeholder="Bijzonderheden, voorbehouden, aanvullende informatie…"
          className="w-full resize-none rounded-lg border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>

      {/* ── Export ───────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <SectionTitle>Exportopties</SectionTitle>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => downloadSoundPDF(investigation)}
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
              const url  = URL.createObjectURL(blob);
              const a    = document.createElement('a');
              a.href     = url;
              const slug = investigation.name.replace(/\s+/g, '-').toLowerCase().slice(0, 40);
              a.download = `ohshub-geluid-${slug}-${new Date().toISOString().slice(0, 10)}.json`;
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
            onClick={copyReport}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            {copied ? (
              <>
                <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-emerald-600 dark:text-emerald-400">Markdown gekopieerd!</span>
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                Kopieer als Markdown
              </>
            )}
          </button>
        </div>
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          PDF: opent een opgemaakt rapport in een nieuw venster — gebruik Afdrukken → Opslaan als PDF.
          CSV: alle meetwaarden per meting met kalibratie- en uitsluitingsdata (UTF-8 BOM voor Excel).
          Markdown: volledig rapport als .md — te plakken in Notion, Obsidian, GitHub of een teksteditor.
        </p>
      </div>

      {/* ── §15 reference ────────────────────────────────────────────────── */}
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-xs text-zinc-500 space-y-1 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-400">
        <p className="font-semibold"><SectionRef id="§15">§15</SectionRef> NEN-EN-ISO 9612:2025 — Vereiste rapportinhoud:</p>
        <p><SectionRef id="§15.a">§15.a</SectionRef>: Naam opdrachtgever, arbeidsplaatsen, werknemers/groepen, meettijdstippen, doel</p>
        <p><SectionRef id="§15.b">§15.b</SectionRef>: Werkanalyse, HEGs, strategie met motivering</p>
        <p><SectionRef id="§15.c">§15.c</SectionRef>: Meetapparatuur (type, serienr., kalibratie)</p>
        <p><SectionRef id="§15.d">§15.d</SectionRef>: Meetcondities, afwijkingen normale omstandigheden</p>
        <p><SectionRef id="§15.e">§15.e</SectionRef>: <Formula math="L_{EX,8h}" />, <Formula math="L_{EX,8h,95\%}" />, onzekerheidscomponenten, <Formula math="L_{p,Cpeak}" /> (indien gemeten), toetsing actiewaarden, conformiteitsverklaring</p>
      </div>
    </div>
  );
}
