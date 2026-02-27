/**
 * NEN-EN-ISO 9612:2025 — Geluidblootstelling meetrapport
 * Generates an HTML report suitable for browser print-to-PDF.
 * Formulas rendered via KaTeX (loaded from CDN in the print window).
 */

import katex from 'katex';
import { OCTAVE_BANDS, calcOctaveAPF } from '@/lib/sound-ppe';
import type {
  SoundInvestigation,
  SoundStatistics,
  SoundStrategy,
  InstrumentType,
  SoundEquipment,
  EquipmentCategory,
  MeasurementSeries,
  SoundPerson,
} from './sound-investigation-types';

// ─── KaTeX formula helper ──────────────────────────────────────────────────────

/** Render a LaTeX formula to HTML string for use inside the PDF. */
function tex(math: string): string {
  return katex.renderToString(math, {
    throwOnError: false,
    output: 'html',
    displayMode: false,
  });
}

/** Render a LaTeX formula in display (block) mode. */
function texD(math: string): string {
  return katex.renderToString(math, {
    throwOnError: false,
    output: 'html',
    displayMode: true,
  });
}

// ─── Label maps ────────────────────────────────────────────────────────────────

const STRATEGY_LABEL: Record<SoundStrategy, string> = {
  'task-based': 'Taakgericht (§9)',
  'job-based':  'Functiegericht (§10)',
  'full-day':   'Volledige dag (§11)',
};

const INSTRUMENT_LABEL: Record<InstrumentType, string> = {
  'slm-class1': 'Geluidniveaumeter klasse 1 (IEC 61672-1)',
  'dosimeter':  'Persoonlijke dosimeter (IEC 61252)',
  'slm-class2': 'Geluidniveaumeter klasse 2 (IEC 61672-1)',
};

const U2_LABEL: Record<InstrumentType, string> = {
  'slm-class1': '0,7',
  'dosimeter':  '1,5',
  'slm-class2': '1,5',
};

const WORK_PATTERN_LABEL: Record<string, string> = {
  'stationary-simple':        'Vaste werkplek — eenvoudige of enkelvoudige taak',
  'stationary-complex':       'Vaste werkplek — meerdere of complexe taken',
  'mobile-predictable-small': 'Mobiele medewerker — voorspelbaar patroon, weinig taken',
  'mobile-predictable-large': 'Mobiele medewerker — voorspelbaar patroon, veel/complexe taken',
  'mobile-unpredictable':     'Mobiele medewerker — onvoorspelbaar werkpatroon',
  'unspecified':              'Niet nader bepaald',
};

const VERDICT_COLOR: Record<string, string> = {
  'below-lav': '#16a34a',
  'lav':       '#b45309',
  'uav':       '#c2410c',
  'above-elv': '#991b1b',
};
const VERDICT_BG: Record<string, string> = {
  'below-lav': '#dcfce7',
  'lav':       '#fef9c3',
  'uav':       '#ffedd5',
  'above-elv': '#fee2e2',
};

// ─── Compliance statement formula renderer ─────────────────────────────────────

const COMPLIANCE_TOKENS: { regex: RegExp; latex: string }[] = [
  { regex: /L_EX,8h,95%/g, latex: 'L_{EX,8h,95\\%}' },
  { regex: /L_EX,8h/g,     latex: 'L_{EX,8h}' },
  { regex: /L_p,Cpeak/g,   latex: 'L_{p,Cpeak}' },
  { regex: /L_p,A,eqT/g,   latex: 'L_{p,A,eqT}' },
  { regex: /T_e\b/g,       latex: 'T_e' },
  { regex: /T_0\b/g,       latex: 'T_0' },
];

const MARKER = '\uE000';

/**
 * Render a user-entered compliance statement with KaTeX formulas.
 * Tokens like "L_EX,8h" are replaced with KaTeX HTML; the rest is HTML-escaped.
 */
function renderWithFormulas(text: string): string {
  if (!text) return '';
  const rendered: string[] = [];
  let processed = text;
  for (const { regex, latex } of COMPLIANCE_TOKENS) {
    processed = processed.replace(regex, () => {
      const idx = rendered.length;
      rendered.push(tex(latex));
      return `${MARKER}${idx}${MARKER}`;
    });
  }
  const escaped = processed
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return escaped
    .replace(new RegExp(`${MARKER}(\\d+)${MARKER}`, 'g'), (_, i) => rendered[Number(i)])
    .replace(/\n/g, '<br>');
}

// ─── HTML helpers ──────────────────────────────────────────────────────────────

function esc(s: string | undefined | null): string {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmtDate(iso?: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso + (iso.length === 10 ? 'T12:00:00' : '')).toLocaleDateString('nl-NL', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  } catch { return iso; }
}

function fmt1(n: number | undefined): string {
  if (n === undefined || !isFinite(n)) return '—';
  return n.toFixed(1).replace('.', ',');
}

function fmt2(n: number | undefined): string {
  if (n === undefined || !isFinite(n)) return '—';
  return n.toFixed(2).replace('.', ',');
}

function badge(text: string, color: string, bg: string): string {
  return `<span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:8pt;font-weight:600;color:${color};background:${bg}">${esc(text)}</span>`;
}

function verdictBadge(stat: SoundStatistics): string {
  const color = VERDICT_COLOR[stat.verdict] ?? '#555';
  const bg    = VERDICT_BG[stat.verdict]    ?? '#f4f4f5';
  return badge(stat.verdictLabel, color, bg);
}

/** kv row — key is plain text (escaped). */
function kv(key: string, val: string): string {
  return `<div class="kv"><div class="kv-key">${esc(key)}</div><div class="kv-val">${val || '—'}</div></div>`;
}

/** kv row — key is raw HTML (e.g. KaTeX output). */
function kvH(keyHtml: string, val: string): string {
  return `<div class="kv"><div class="kv-key">${keyHtml}</div><div class="kv-val">${val || '—'}</div></div>`;
}

// ─── CSS ──────────────────────────────────────────────────────────────────────

const CSS = `
  @page { size: A4; margin: 18mm 15mm 20mm 15mm; }
  @page :first { margin-top: 0; }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 9.5pt;
    line-height: 1.55;
    color: #1c1c1c;
    background: #fff;
  }

  /* Cover */
  .cover {
    height: 297mm;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    padding: 30mm 20mm;
    page-break-after: always;
  }
  .cover-logo { font-size: 20pt; font-weight: 800; color: #1c1c1c; margin-bottom: 28mm; letter-spacing: -0.5px; }
  .cover-logo span { color: #f97316; }
  .cover-tag { font-size: 9pt; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; color: #f97316; margin-bottom: 6mm; }
  .cover-title { font-size: 26pt; font-weight: 700; color: #111; line-height: 1.2; margin-bottom: 5mm; }
  .cover-sub { font-size: 12pt; color: #555; margin-bottom: 14mm; }
  .cover-divider { width: 60mm; height: 3px; background: #f97316; border-radius: 2px; margin-bottom: 12mm; }
  .cover-meta { font-size: 9pt; color: #666; line-height: 1.8; }
  .cover-meta strong { color: #1c1c1c; }
  .cover-norm { margin-top: 10mm; font-size: 8pt; color: #888; border-top: 1px solid #e5e7eb; padding-top: 4mm; }

  /* Sections */
  .section { margin-bottom: 9mm; page-break-inside: avoid; }
  .section-title {
    font-size: 8pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #f97316;
    border-bottom: 1.5px solid #f97316;
    padding-bottom: 1.5mm;
    margin-bottom: 4mm;
  }
  h2 { font-size: 11pt; font-weight: 700; margin-bottom: 3mm; color: #111; }
  h3 { font-size: 10pt; font-weight: 600; margin-bottom: 2mm; color: #222; }
  p { margin-bottom: 2mm; }

  /* KV pairs */
  .kv { display: flex; gap: 3mm; margin-bottom: 1.5mm; }
  .kv-key { font-size: 8.5pt; color: #555; min-width: 45mm; flex-shrink: 0; }
  .kv-val { font-size: 8.5pt; color: #1c1c1c; font-weight: 500; }

  /* Tables */
  table { width: 100%; border-collapse: collapse; font-size: 8.5pt; margin-bottom: 3mm; }
  th { background: #f4f4f5; font-weight: 600; color: #555; text-align: left; padding: 2mm 2.5mm; font-size: 7.5pt; border-bottom: 1px solid #e5e7eb; }
  td { padding: 2mm 2.5mm; border-bottom: 1px solid #f0f0f0; vertical-align: middle; }
  tr:last-child td { border-bottom: none; }
  tr:nth-child(even) td { background: #fafafa; }
  td.mono { font-family: 'Courier New', monospace; font-size: 8.5pt; font-weight: 600; }
  td.right, th.right { text-align: right; }

  /* Verdict cards */
  .verdict-card {
    border-radius: 4px;
    border: 1px solid #e5e7eb;
    padding: 3mm 4mm;
    margin-bottom: 4mm;
    page-break-inside: avoid;
  }
  .verdict-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 2mm; }
  .verdict-name { font-size: 9.5pt; font-weight: 700; color: #111; }
  .verdict-meta { font-size: 7.5pt; color: #888; margin-top: 0.5mm; }

  /* Info box */
  .infobox {
    background: #f4f4f5;
    border-radius: 3px;
    padding: 2.5mm 3mm;
    font-size: 8pt;
    color: #555;
    margin-bottom: 3mm;
  }

  /* Obligation list */
  .obs-list { list-style: none; margin: 0; padding: 0; }
  .obs-list li { display: flex; gap: 2mm; padding: 1mm 0; font-size: 8pt; border-bottom: 0.5px solid #f0f0f0; }
  .obs-list li:last-child { border-bottom: none; }
  .obs-art { flex-shrink: 0; min-width: 28mm; font-size: 7.5pt; color: #888; font-family: 'Courier New', monospace; }

  /* Chapter headings */
  .chapter { margin-bottom: 8mm; }
  .chapter-pb { page-break-before: always; margin-bottom: 8mm; }
  .chapter-hd {
    display: flex; align-items: baseline; gap: 3mm;
    border-bottom: 2px solid #f97316; padding-bottom: 2.5mm; margin-bottom: 5mm;
  }
  .chapter-num  { font-size: 11pt; font-weight: 800; color: #f97316; min-width: 12mm; flex-shrink: 0; }
  .chapter-name { font-size: 11pt; font-weight: 700; color: #111; flex: 1; }
  .chapter-norm { font-size: 8pt; color: #888; white-space: nowrap; }

  /* HEG card (work analysis) */
  .heg-card { border: 1px solid #e5e7eb; border-radius: 4px; overflow: hidden;
              margin-bottom: 4mm; page-break-inside: avoid; }
  .heg-card-head { background: #f9fafb; border-bottom: 1px solid #e5e7eb;
                   padding: 2mm 3.5mm; }
  .heg-card-body { padding: 2mm 3.5mm; }

  /* KaTeX adjustments for print context */
  .katex { font-size: 0.95em; }
  .katex-display { margin: 1.5mm 0; }
  .katex-display > .katex { font-size: 1em; }

  /* Print */
  @media print {
    body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    .no-break { page-break-inside: avoid; }
  }
`;

// ─── Section / chapter header helpers ──────────────────────────────────────────

function section(title: string, content: string): string {
  return `<div class="section"><div class="section-title">${esc(title)}</div>${content}</div>`;
}

/** Numbered chapter wrapper. Set pageBreak=true for every chapter after the first. */
function chapter(num: string, title: string, normRef: string, content: string, pageBreak = false): string {
  return `
    <div class="${pageBreak ? 'chapter-pb' : 'chapter'}">
      <div class="chapter-hd">
        <span class="chapter-num">${esc(num)}</span>
        <span class="chapter-name">${esc(title)}</span>
        ${normRef ? `<span class="chapter-norm">${esc(normRef)}</span>` : ''}
      </div>
      ${content}
    </div>`;
}

// ─── HEG label with numbering (x/N) ───────────────────────────────────────────

function hegLabel(hegId: string, inv: SoundInvestigation): string {
  const idx = inv.hegs.findIndex((h) => h.id === hegId) + 1;
  const heg = inv.hegs.find((h) => h.id === hegId);
  return `${heg?.name ?? hegId} (HEG ${idx}/${inv.hegs.length})`;
}

// ─── Managementsamenvatting (auto-generated) ────────────────────────────────────

function buildManagementSummary(inv: SoundInvestigation, chapterNum = '2'): string {
  const { statistics, hegs, measures } = inv;
  if (statistics.length === 0) return '';

  const verdictOrder = ['below-lav', 'lav', 'uav', 'above-elv'];
  const worst = statistics.reduce<string>(
    (w, s) => verdictOrder.indexOf(s.verdict) > verdictOrder.indexOf(w) ? s.verdict : w,
    'below-lav',
  );

  const verdictIntro: Record<string, string> = {
    'below-lav': `De geluidblootstelling is bij alle onderzochte homogene blootstellingsgroepen (HEG's) onder de onderste actiewaarde van 80 dB(A). Er zijn geen wettelijke verplichtingen op grond van het Arbobesluit art. 6.6. Het is aanbevolen de resultaten op te nemen in de RI&amp;E.`,
    'lav':       `De geluidblootstelling overschrijdt bij één of meer HEG's de onderste actiewaarde (LAV, 80 dB(A)). Een maatregelenprogramma ter vermindering van de geluidblootstelling is vereist conform Arbobesluit art. 6.6 lid 1a.`,
    'uav':       `De geluidblootstelling overschrijdt bij één of meer HEG's de bovenste actiewaarde (UAV, 85 dB(A)). Gebruik van gehoorbescherming is verplicht; er moet een geluidzone worden aangewezen. Periodiek gehooronderzoek is verplicht (art. 6.10).`,
    'above-elv': `De geluidgrenswaarde (87 dB(A)) wordt bij één of meer HEG's overschreden. <strong>Onmiddellijke actie is vereist</strong> om de blootstelling terug te brengen tot onder de grenswaarde (Arbobesluit art. 6.6 lid 2).`,
  };

  const col = VERDICT_COLOR[worst] ?? '#555';
  const bg  = VERDICT_BG[worst]  ?? '#f4f4f5';

  // Per-HEG summary rows
  let hegRows = '';
  for (const stat of statistics) {
    const heg = hegs.find((h) => h.id === stat.hegId);
    const c   = VERDICT_COLOR[stat.verdict] ?? '#555';
    const b   = VERDICT_BG[stat.verdict]  ?? '#f4f4f5';
    const corrected = stat.lEx8h_95pct_oor ?? null;

    hegRows += `
      <tr style="background:${b}">
        <td style="font-weight:600">${esc(hegLabel(stat.hegId, inv))}</td>
        <td class="mono right">${fmt1(stat.lEx8h)}</td>
        <td class="mono right" style="font-weight:700;color:${c}">${fmt1(stat.lEx8h_95pct)}</td>
        <td>${badge(stat.verdictLabel, c, b)}</td>
      </tr>`;

    if (corrected !== null) {
      const ppeLabel = [heg?.ppeNotes, heg?.ppe2Notes].filter(Boolean).join(' + ');
      const demping  = stat.lEx8h_95pct - corrected;
      const elvOk    = stat.elvPpeCompliant;
      const elvC     = elvOk ? '#15803d' : '#991b1b';
      const elvBg    = elvOk ? '#dcfce7'  : '#fee2e2';
      const elvLbl   = elvOk
        ? `≤ 87 dB(A) — voldoet met PBM`
        : `> 87 dB(A) — grenswaarde overschreden (ook met PBM)`;
      hegRows += `
      <tr style="background:#f0f9ff">
        <td colspan="4" style="padding-left:6mm;padding-top:1.5mm;padding-bottom:1.5mm;font-size:7.5pt;color:#1e40af">
          ↳ <strong>PBM:</strong> ${ppeLabel ? esc(ppeLabel) : '(gehoorbescherming)'}
          &nbsp;·&nbsp; Demping: −${fmt1(demping)} dB
          &nbsp;·&nbsp; ${tex('L_{EX,8h,oor}')} = <strong>${fmt1(corrected)} dB(A)</strong>
          &nbsp;·&nbsp; ${badge(elvLbl, elvC, elvBg)}
        </td>
      </tr>`;
    }
  }

  // Immediate actions
  const actions: string[] = [];
  if (worst === 'above-elv') {
    actions.push('Onmiddellijk maatregelen treffen — grenswaarde overschreden (art. 6.6 lid 2).');
    actions.push('Gehoorbescherming verplicht totdat blootstelling onder 87 dB(A) is gebracht.');
  }
  if (worst === 'uav' || worst === 'above-elv') {
    actions.push('Geluidzone aanwijzen met signalering en afbakening (art. 6.6 lid 1c).');
    actions.push('Periodiek audiometrisch onderzoek verplicht aanbieden via bedrijfsarts (art. 6.10).');
  }
  if (worst !== 'below-lav') {
    actions.push('Maatregelenprogramma opstellen ter vermindering van geluidblootstelling (art. 6.6 lid 1a).');
    actions.push("Voorlichting en opleiding geven over gehoorrisico's en beschermende maatregelen (art. 6.8).");
  }

  const pendingCount = measures.filter((m) => m.status !== 'completed').length;

  let html = `
    <div style="background:${bg};border-left:4px solid ${col};border-radius:3px;padding:3mm 4mm;margin-bottom:4mm">
      <div style="font-size:9.5pt;font-weight:700;color:${col};margin-bottom:1mm">${esc(
        worst === 'above-elv' ? 'Eindoordeel: grenswaarde overschreden — onmiddellijke actie vereist'
        : worst === 'uav'     ? 'Eindoordeel: bovenste actiewaarde overschreden — maatregelen verplicht'
        : worst === 'lav'     ? 'Eindoordeel: onderste actiewaarde overschreden — maatregelenprogramma vereist'
        :                       'Eindoordeel: voldoet — geen actiewaarde bereikt',
      )}</div>
      <div style="font-size:8.5pt;color:#333;line-height:1.6">${verdictIntro[worst] ?? ''}</div>
    </div>
    <table>
      <thead>
        <tr>
          <th>HEG</th>
          <th class="right">${tex('L_{EX,8h}')} dB(A)</th>
          <th class="right">${tex('L_{EX,8h,95\\%}')} dB(A)</th>
          <th>Oordeel</th>
        </tr>
      </thead>
      <tbody>${hegRows}</tbody>
    </table>
    <div style="font-size:7.5pt;color:#888;margin-bottom:3mm">
      ${tex('L_{EX,8h,95\\%}')} = dagelijkse blootstelling inclusief meetonzekerheid (eenzijdig 95%-interval, Formule 10).
      PBM-rij toont geschat blootstellingsniveau bij het oor (${tex('L_{EX,8h,oor}')}) na aftrek APF gehoorbeschermer (EN 458:2016).
    </div>`;

  if (actions.length > 0) {
    html += `
      <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:3px;padding:2.5mm 3.5mm;margin-bottom:3mm">
        <div style="font-size:8.5pt;font-weight:700;color:#9a3412;margin-bottom:1.5mm">Vereiste acties (Arbobesluit):</div>
        <ul style="margin:0;padding-left:4mm;font-size:8.5pt;color:#7c2d12;line-height:1.7">
          ${actions.map((a) => `<li>${esc(a)}</li>`).join('')}
        </ul>
      </div>`;
  }

  if (pendingCount > 0) {
    html += `<div class="infobox" style="font-size:8pt">
      ${pendingCount} beheersmaatregel${pendingCount !== 1 ? 'en' : ''} staan open of lopen. Zie hoofdstuk 8 — Beheersmaatregelen.
    </div>`;
  }

  return chapter(chapterNum, 'Managementsamenvatting', 'NEN-EN-ISO 9612:2025 §15', html, true);
}

// ─── Cover page ────────────────────────────────────────────────────────────────

function buildCover(inv: SoundInvestigation): string {
  const today = new Date().toLocaleDateString('nl-NL', { year: 'numeric', month: 'long', day: 'numeric' });
  const client = inv.clients[0];
  const investigator = inv.investigators[0];

  const rows = [
    client?.organization || client?.name ? `<strong>Opdrachtgever:</strong> ${esc(client.organization || client.name)}` : '',
    investigator?.name ? `<strong>Onderzoeker:</strong> ${esc(investigator.name)}${investigator.organization ? `, ${esc(investigator.organization)}` : ''}` : '',
    inv.scope.workplaceName ? `<strong>Locatie:</strong> ${esc(inv.scope.workplaceName)}` : '',
    inv.scope.investigationPeriod ? `<strong>Meetperiode:</strong> ${esc(inv.scope.investigationPeriod)}` : '',
    `<strong>Rapportdatum:</strong> ${today}`,
  ].filter(Boolean);

  return `
    <div class="cover">
      <div class="cover-logo">OHS<span>Hub</span></div>
      <div class="cover-tag">Meetrapport geluidblootstelling</div>
      <div class="cover-title">${esc(inv.name)}</div>
      ${client?.organization ? `<div class="cover-sub">${esc(client.organization)}</div>` : ''}
      <div class="cover-divider"></div>
      <div class="cover-meta">
        ${rows.map((r) => `<div>${r}</div>`).join('')}
      </div>
      <div class="cover-norm">
        NEN-EN-ISO 9612:2025 — Akoestiek — Bepaling van de blootstelling aan lawaai op de werkplek (Third edition)<br>
        Arbobesluit art. 6.5–6.11 — Geluid op de arbeidsplaats
      </div>
    </div>
  `;
}

// ─── §15.a Scope ───────────────────────────────────────────────────────────────

function buildScope(inv: SoundInvestigation): string {
  const { scope, investigators, clients, respondents } = inv;
  let html = '';

  if (scope.companyName)         html += kv('Opdrachtgever',   esc(scope.companyName));
  if (scope.workplaceName)       html += kv('Arbeidsplaats',   esc(scope.workplaceName));
  if (scope.workplaceAddress)    html += kv('Adres',           esc(scope.workplaceAddress));
  if (scope.workerDescription)   html += kv('Werknemers',      esc(scope.workerDescription));
  if (scope.purpose)             html += kv('Doel',            esc(scope.purpose));
  if (scope.investigationPeriod) html += kv('Meetperiode',     esc(scope.investigationPeriod));
  if (scope.notes)               html += kv('Opmerkingen',     esc(scope.notes));

  if (investigators.length > 0) {
    html += '<br>';
    const QUAL_LABEL: Record<string, string> = {
      AH: 'Arbeidshygiënist', HVK: 'Hogere Veiligheidskundige (HVK)',
      acousticus: 'Acousticus',
    };
    for (const p of investigators) {
      const namePart = [p.name, p.role, p.organization].filter(Boolean).join(' — ');
      // For 'other': use the free-text note as the qualification label, not "Overige"
      const qualPart = p.qualification === 'other'
        ? (p.qualificationNote || null)
        : (p.qualification ? QUAL_LABEL[p.qualification] ?? p.qualification : null);
      const akdPart = p.isAKD
        ? `AKD ${p.akdNumber ? `nr. ${p.akdNumber}` : '(geregistreerd)'}`
        : null;
      // For 'other' the note is already in qualPart, so don't add it again
      const qualLine = [qualPart, akdPart, p.qualification !== 'other' ? p.qualificationNote : null].filter(Boolean).join(' · ');
      const contactLine = [
        p.email ? `✉ ${esc(p.email)}` : null,
        p.phone ? `✆ ${esc(p.phone)}` : null,
      ].filter(Boolean).join(' &nbsp;·&nbsp; ');
      const valHtml = esc(namePart)
        + (qualLine ? `<br><span style="color:#555;font-size:8pt">${esc(qualLine)}</span>` : '')
        + (contactLine ? `<br><span style="color:#555;font-size:8pt">${contactLine}</span>` : '');
      html += kv('Onderzoeker', valHtml);
    }
  }
  if (clients.length > 0) {
    html += '<br>';
    for (const p of clients) {
      const namePart = [p.name, p.role, p.organization, p.address].filter(Boolean).join(' — ');
      const contactLine = [
        p.email ? `✉ ${esc(p.email)}` : null,
        p.phone ? `✆ ${esc(p.phone)}` : null,
      ].filter(Boolean).join(' &nbsp;·&nbsp; ');
      html += kv('Opdrachtgever', esc(namePart) + (contactLine ? `<br><span style="color:#555;font-size:8pt">${contactLine}</span>` : ''));
    }
  }
  if (respondents.length > 0) {
    html += '<br>';
    for (const p of respondents) {
      const namePart = [p.name, p.role, p.organization].filter(Boolean).join(' — ');
      const contactLine = [
        p.email ? `✉ ${esc(p.email)}` : null,
        p.phone ? `✆ ${esc(p.phone)}` : null,
      ].filter(Boolean).join(' &nbsp;·&nbsp; ');
      html += kv('Respondent', esc(namePart) + (contactLine ? `<br><span style="color:#555;font-size:8pt">${contactLine}</span>` : ''));
    }
  }

  return section('§15.a — Algemene informatie', html);
}

// ─── Pre-survey section ────────────────────────────────────────────────────────

function buildPreSurvey(inv: SoundInvestigation): string {
  const { preSurveyRecommendation, preSurveySignals, preSurveyOverrideReason } = inv;
  if (!preSurveyRecommendation) return '';

  const LABEL: Record<string, string> = {
    'measurement-required': 'Meting vereist (conform NEN-EN-ISO 9612)',
    'strongly-recommended': 'Meting sterk aanbevolen',
    'recommended':          'Meting aanbevolen',
    'borderline':           'Grensgebied — oordeel nodig',
    'not-required':         'Meting niet vereist op basis van vooronderzoek',
    'overridden':           'Aanbeveling overschreven door onderzoeker',
  };

  let html = kv('Aanbeveling vooronderzoek', esc(LABEL[preSurveyRecommendation] ?? preSurveyRecommendation));

  if (inv.preSurvey?.respondentName) {
    html += kv('Respondent vooronderzoek', esc(inv.preSurvey.respondentName));
  }
  if (inv.preSurvey?.completedAt) {
    html += kv('Datum vooronderzoek', fmtDate(inv.preSurvey.completedAt));
  }
  if (preSurveySignals?.length) {
    html += kv('Risicosignalen', `<ul style="margin:0;padding-left:4mm">${preSurveySignals.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>`);
  }
  if (preSurveyOverrideReason) {
    html += kv('Reden afwijking aanbeveling', esc(preSurveyOverrideReason));
  }
  if (inv.preSurvey?.conclusionNotes && !preSurveyOverrideReason) {
    html += kv('Toelichting', esc(inv.preSurvey.conclusionNotes));
  }

  return html;
}

// ─── §15.b Work analysis ───────────────────────────────────────────────────────

function buildWorkAnalysis(inv: SoundInvestigation): string {
  const { hegs, tasks } = inv;
  if (hegs.length === 0) return '';

  const hasRangeCols = tasks.some((t) => t.durationMin != null || t.durationMax != null);
  const hasNotesCols = tasks.some((t) => t.notes);

  let html = `<div class="infobox" style="margin-bottom:4mm;font-size:8pt">
    §7.2 NEN-EN-ISO 9612:2025 — Homogeneous noise Exposure Group (HEG): groep medewerkers met vergelijkbare geluidblootstelling.
    Meetstrategie vastgesteld op basis van werkpatroon (§9–§11). ${tex('T_e')} = effectieve werkdag; ${tex('T_m')} = taakduur (in minuten).
  </div>`;

  for (const h of hegs) {
    const hegTasks = tasks.filter((t) => t.hegId === h.id);
    const totalMin  = hegTasks.reduce((s, t) => s + Math.round(t.durationHours * 60), 0);

    let cardBody = '';

    if (h.strategy === 'task-based' && hegTasks.length > 0) {
      const allEquipment: SoundEquipment[] = inv.equipment ?? [];
      const hasEquipmentCols = hegTasks.some((t) => (t.equipmentIds ?? []).length > 0);

      let taskRows = '';
      for (const t of hegTasks) {
        const eqNames = (t.equipmentIds ?? [])
          .map((eid) => allEquipment.find((e) => e.id === eid)?.name)
          .filter(Boolean)
          .join(', ');

        taskRows += `
          <tr>
            <td>${esc(t.name)}</td>
            <td class="mono right">${Math.round(t.durationHours * 60)}</td>
            ${hasRangeCols ? `<td class="mono right">${t.durationMin != null ? Math.round(t.durationMin * 60) : '—'}</td><td class="mono right">${t.durationMax != null ? Math.round(t.durationMax * 60) : '—'}</td>` : ''}
            ${hasNotesCols ? `<td style="font-size:8pt;color:#555">${esc(t.notes ?? '')}</td>` : ''}
            ${hasEquipmentCols ? `<td style="font-size:8pt;color:#555">${esc(eqNames || '—')}</td>` : ''}
          </tr>`;
      }
      cardBody += `
        <div style="font-size:7.5pt;font-weight:600;text-transform:uppercase;color:#888;margin-bottom:1.5mm">
          Taken — taakgerichte meetstrategie (§9)
        </div>
        <table style="margin-bottom:0">
          <thead>
            <tr>
              <th>Taakomschrijving</th>
              <th class="right">${tex('T_m')} (min)</th>
              ${hasRangeCols ? `<th class="right">${tex('T_{m,min}')} (min)</th><th class="right">${tex('T_{m,max}')} (min)</th>` : ''}
              ${hasNotesCols ? '<th>Opmerking</th>' : ''}
              ${hasEquipmentCols ? '<th>Arbeidsmiddelen</th>' : ''}
            </tr>
          </thead>
          <tbody>${taskRows}</tbody>
          <tfoot>
            <tr style="background:#f9fafb">
              <td style="font-weight:600;font-size:8pt">Totaal</td>
              <td class="mono right" style="font-weight:600">${totalMin} min</td>
              ${hasRangeCols ? '<td></td><td></td>' : ''}
              ${hasNotesCols ? '<td></td>' : ''}
              ${hasEquipmentCols ? '<td></td>' : ''}
            </tr>
          </tfoot>
        </table>`;
    } else if (h.strategy !== 'task-based') {
      cardBody += `<p style="font-size:8pt;color:#555">Geen afzonderlijke taken gedefinieerd — ${esc(STRATEGY_LABEL[h.strategy])}.</p>`;
    }

    const extras = [
      h.tinnitusReported ? `<span style="color:#6d28d9">⚕ Tinnitus of gehoorklachten gemeld door werknemers (Richtlijn SHT 2020 / NVAB)</span>` : '',
      h.noiseSources     ? `Geluidbronnen: ${esc(h.noiseSources)}` : '',
      h.notes            ? `Motivering strategie: ${esc(h.notes)}` : '',
    ].filter(Boolean);

    if (extras.length > 0) {
      cardBody += `<div style="font-size:8pt;color:#555;margin-top:2mm;line-height:1.7;border-top:1px solid #f0f0f0;padding-top:1.5mm">${extras.join('<br>')}</div>`;
    }

    html += `
      <div class="heg-card">
        <div class="heg-card-head">
          <div style="display:flex;justify-content:space-between;align-items:baseline;gap:3mm">
            <strong style="font-size:9.5pt">${esc(hegLabel(h.id, inv))}</strong>
            ${h.jobTitle ? `<span style="font-size:8pt;color:#888">${esc(h.jobTitle)}</span>` : ''}
          </div>
          <div style="font-size:8pt;color:#555;margin-top:0.5mm">
            ${h.workerCount} medewerker${h.workerCount !== 1 ? 's' : ''} &nbsp;·&nbsp;
            ${tex('T_e')} = ${h.effectiveDayHours} h &nbsp;·&nbsp;
            ${esc(STRATEGY_LABEL[h.strategy])}
            ${h.workPattern && h.workPattern !== 'unspecified' ? ` &nbsp;·&nbsp; ${esc(WORK_PATTERN_LABEL[h.workPattern] ?? h.workPattern)}` : ''}
          </div>
        </div>
        <div class="heg-card-body">${cardBody}</div>
      </div>`;
  }

  return html;
}

// ─── §15.c Instruments ────────────────────────────────────────────────────────

// ─── Arbeidsmiddeleninventaris ────────────────────────────────────────────────

const EQUIPMENT_CATEGORY_LABEL: Record<EquipmentCategory, string> = {
  voertuig:        'Voertuig',
  machine:         'Machine',
  handgereedschap: 'Handgereedschap',
  pneumatisch:     'Pneumatisch',
  anders:          'Anders',
};

function buildEquipmentInventory(inv: SoundInvestigation): string {
  const equipment: SoundEquipment[] = inv.equipment ?? [];
  if (equipment.length === 0) return '';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let rows = '';
  for (const eq of equipment) {
    let expiryCell = '—';
    let rowStyle = '';

    if (eq.inspectionRequired && eq.inspectionExpiry) {
      const expiry = new Date(eq.inspectionExpiry + 'T00:00:00');
      const daysLeft = Math.round((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      expiryCell = fmtDate(eq.inspectionExpiry);
      if (daysLeft < 0) {
        rowStyle = 'background:#fee2e2;color:#991b1b';
        expiryCell += ' <strong>VERLOPEN</strong>';
      } else if (daysLeft <= 30) {
        rowStyle = 'background:#fef9c3;color:#92400e';
        expiryCell += ` (nog ${daysLeft} dag${daysLeft === 1 ? '' : 'en'})`;
      }
    } else if (eq.inspectionRequired) {
      rowStyle = 'background:#fee2e2;color:#991b1b';
      expiryCell = 'Niet geregistreerd';
    }

    const maintenanceHtml = eq.maintenanceStatus
      ? `<span style="color:${eq.maintenanceStatus === 'goed' ? '#16a34a' : eq.maintenanceStatus === 'matig' ? '#b45309' : '#991b1b'}">${esc(eq.maintenanceStatus)}</span>`
      : '—';

    const idHtml = eq.category === 'voertuig' && eq.registrationNumber
      ? esc(eq.registrationNumber)
      : eq.serialNumber
        ? `S/N: ${esc(eq.serialNumber)}`
        : eq.registrationNumber
          ? esc(eq.registrationNumber)
          : '—';

    const lwaLpa = [
      eq.lwaGuaranteed != null ? `L<sub>WA</sub>: ${eq.lwaGuaranteed} dB` : '',
      eq.lpaManufacturer != null ? `L<sub>pA</sub>: ${eq.lpaManufacturer} dB` : '',
    ].filter(Boolean).join(' / ') || '—';

    rows += `<tr style="${rowStyle}">
      <td>${esc(eq.name)}</td>
      <td>${esc(EQUIPMENT_CATEGORY_LABEL[eq.category])}</td>
      <td style="font-size:8pt">${[esc(eq.manufacturer ?? ''), esc(eq.model ?? '')].filter(Boolean).join(' ') || '—'}</td>
      <td class="mono" style="font-size:8pt">${idHtml}</td>
      <td style="font-size:8pt">${lwaLpa}</td>
      <td style="font-size:8pt">${expiryCell}</td>
      <td style="font-size:8pt">${maintenanceHtml}</td>
    </tr>`;

    if (eq.inspectionBody || eq.inspectionCertNumber || eq.inspectionType || eq.notes) {
      rows += `<tr style="${rowStyle ? rowStyle + ';border-top:none' : 'border-top:none'}">
        <td colspan="7" style="font-size:7.5pt;color:#555;padding-left:4mm;padding-bottom:1.5mm">
          ${[
            eq.inspectionType      ? `Type keuring: ${esc(eq.inspectionType)}` : '',
            eq.inspectionBody      ? `Keurende instantie: ${esc(eq.inspectionBody)}` : '',
            eq.inspectionCertNumber ? `Cert.nr.: ${esc(eq.inspectionCertNumber)}` : '',
            eq.yearOfManufacture   ? `Bouwjaar: ${eq.yearOfManufacture}` : '',
            eq.notes               ? `Opmerking: ${esc(eq.notes)}` : '',
          ].filter(Boolean).join(' &nbsp;·&nbsp; ')}
        </td>
      </tr>`;
    }
  }

  const html = `
    <div class="infobox" style="margin-bottom:4mm;font-size:8pt">
      Art. 7.4a Arbobesluit — Arbeidsmiddelen die aan bijzondere gevaren onderhevig zijn, worden periodiek gekeurd.
      Machinerichtlijn 2006/42/EG — Fabrikant vermeldt L<sub>WA</sub> en L<sub>pA</sub> in handleiding en CE-declaratie.
    </div>
    <table>
      <thead>
        <tr>
          <th>Naam</th>
          <th>Categorie</th>
          <th>Fabrikant / model</th>
          <th>Kenteken / S/N</th>
          <th>L<sub>WA</sub> / L<sub>pA</sub></th>
          <th>Keuring t/m</th>
          <th>Onderhoud</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;

  return section('Arbeidsmiddeleninventaris', html);
}

function buildInstruments(inv: SoundInvestigation): string {
  if (inv.instruments.length === 0) return '';

  let rows = '';
  for (const inst of inv.instruments) {
    rows += `
      <tr>
        <td>${esc(INSTRUMENT_LABEL[inst.type])}</td>
        <td class="mono">${esc(inst.manufacturer ?? '')} ${esc(inst.model ?? '')}</td>
        <td class="mono">${esc(inst.serialNumber ?? '—')}</td>
        <td>${fmtDate(inst.lastLabCalibration)}${inst.calibrationRef ? `<br><span style="color:#888;font-size:8pt">Cert: ${esc(inst.calibrationRef)}</span>` : ''}</td>
        <td class="mono right">${U2_LABEL[inst.type]} dB</td>
      </tr>
    `;
    if (inst.windscreen || inst.extensionCable || inst.notes) {
      rows += `
        <tr>
          <td colspan="5" style="font-size:8pt;color:#555;padding-left:4mm;padding-bottom:2mm">
            ${[
              inst.windscreen     ? 'Windkap: ja'      : '',
              inst.extensionCable ? 'Verlengkabel: ja'  : '',
              inst.notes          ? `Opmerking: ${esc(inst.notes)}` : '',
            ].filter(Boolean).join(' &nbsp;·&nbsp; ')}
          </td>
        </tr>
      `;
    }
  }

  const html = `
    <table>
      <thead>
        <tr>
          <th>Type</th>
          <th>Fabrikant / model</th>
          <th>Serienr.</th>
          <th>Kalibratie (§15.c.3)</th>
          <th class="right">${tex('u_2')}</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="infobox">§12.2 Veldkalibratie: uitvoeren vóór en ná elke meetserie. Afwijking &gt; 0,5 dB → meting afkeuren. ${tex('u_3')} = 1,0 dB (microfoonplaatsing, §C.6).</div>
  `;

  return section('§15.c — Meetapparatuur', html);
}

// ─── §15.d + e Results per HEG ────────────────────────────────────────────────

function buildHEGResult(inv: SoundInvestigation, stat: SoundStatistics): string {
  const heg = inv.hegs.find((h) => h.id === stat.hegId);
  const hegName = hegLabel(stat.hegId, inv);
  const color = VERDICT_COLOR[stat.verdict] ?? '#555';
  const bg = VERDICT_BG[stat.verdict] ?? '#f4f4f5';

  let html = `
    <div class="verdict-card no-break">
      <div class="verdict-header">
        <div>
          <div class="verdict-name">${esc(hegName)}</div>
          <div class="verdict-meta">
            ${esc(STRATEGY_LABEL[stat.strategy])} · n = ${stat.n} meting${stat.n !== 1 ? 'en' : ''}
            ${heg ? ` · ${tex('T_e')} = ${heg.effectiveDayHours} h · ${heg.workerCount} medewerker${heg.workerCount !== 1 ? 's' : ''}` : ''}
          </div>
        </div>
        ${verdictBadge(stat)}
      </div>
  `;

  // Task contributions
  if (stat.taskResults && stat.taskResults.length > 0) {
    let taskRows = '';
    for (const tr of stat.taskResults) {
      taskRows += `
        <tr>
          <td>${esc(tr.taskName)}</td>
          <td class="mono right">${Math.round(tr.durationHours * 60)}</td>
          <td class="mono right">${tr.nMeasurements}</td>
          <td class="mono right">${fmt1(tr.lpa_eqTm)}</td>
          <td class="mono right">${fmt1(tr.lEx8hm)}</td>
          <td class="mono right">${fmt2(tr.u1a)}</td>
          <td class="mono right">${fmt2(tr.c1a)}</td>
        </tr>
      `;
    }
    html += `
      <div style="font-size:7.5pt;font-weight:600;text-transform:uppercase;color:#888;margin-bottom:1.5mm">Taakbijdragen (Formule 3 &amp; 4)</div>
      <table>
        <thead>
          <tr>
            <th>Taak</th>
            <th class="right">${tex('T_m')} (min)</th>
            <th class="right">n</th>
            <th class="right">${tex('L_{p,A,eqT_m}')} (dB)</th>
            <th class="right">${tex('L_{EX,8h,m}')} (dB)</th>
            <th class="right">${tex('u_{1a}')} (dB)</th>
            <th class="right">${tex('c_{1a}')}</th>
          </tr>
        </thead>
        <tbody>${taskRows}</tbody>
      </table>
    `;
  }

  // Energy average (job/full-day)
  if (stat.lpa_eqTe !== undefined) {
    html += kvH(`${tex('L_{p,A,eqT_e}')} (Formule 7)`, `${fmt1(stat.lpa_eqTe)} dB`);
  }

  // Spread warnings (K-5) — before calculations, after measurements
  if (stat.spreadWarnings && stat.spreadWarnings.length > 0) {
    const swRows = stat.spreadWarnings.map((sw) =>
      `<li style="margin:0.5mm 0">${esc(sw.taskName)}: spreiding ${sw.spread.toFixed(1)} dB &gt; limiet ${sw.limit.toFixed(1)} dB</li>`
    ).join('');
    html += `
      <div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:3px;padding:2mm 3mm;font-size:8pt;margin-top:2mm">
        <strong>⚠ K-5 — Spreiding te groot (Bijlage E NEN-EN-ISO 9612:2025):</strong>
        <ul style="margin:1.5mm 0 0 4mm;padding:0">${swRows}</ul>
        <span style="color:#92400e">Overweeg meer metingen of een andere meetstrategie.</span>
      </div>
    `;
  }

  // Main results table (includes L_EX,8h,oor row when PPE data is available)
  const oorRow = (() => {
    if (stat.lEx8h_95pct_oor != null) {
      const elvOk = stat.elvPpeCompliant;
      const elvC  = elvOk ? '#15803d' : '#991b1b';
      const elvBg = elvOk ? '#dcfce7'  : '#fee2e2';
      return `<tr style="background:${elvBg}">
          <td style="font-weight:600">${tex('L_{EX,8h,oor}')} — mét PBM (art. 6.5 lid 3 Arbobesluit / EN 458)</td>
          <td class="mono right" style="font-weight:700;color:${elvC}">${fmt1(stat.lEx8h_95pct_oor)} dB(A)</td>
          <td style="font-size:8pt;font-weight:600;color:${elvC}">${elvOk ? '✓ GW niet overschreden' : '✗ GW overschreden — direct ingrijpen'}</td>
        </tr>`;
    }
    if (heg?.ppeSNRUnknown) {
      return `<tr>
          <td>${tex('L_{EX,8h,oor}')} — mét PBM (art. 6.5 lid 3 Arbobesluit / EN 458)</td>
          <td class="mono right" style="color:#92400e">— SNR onbekend</td>
          <td style="font-size:8pt;color:#92400e">Niet bepaald — SNR datablad ontbreekt</td>
        </tr>`;
    }
    return '';
  })();

  html += `
    <div style="font-size:7.5pt;font-weight:600;text-transform:uppercase;color:#888;margin:2mm 0 1.5mm">Berekening (§15.e)</div>
    <table>
      <tbody>
        <tr>
          <td>${tex('L_{EX,8h}')} (Formule 5/8/9)</td>
          <td class="mono right">${fmt1(stat.lEx8h)} dB(A)</td>
          <td></td>
        </tr>
        <tr>
          <td>${tex('u_1')} — bemonsteringsonzekerheid</td>
          <td class="mono right">${fmt2(stat.u1)} dB</td>
          <td style="font-size:8pt;color:#888">${stat.strategy === 'task-based' ? 'Formule C.6' : 'Formule C.12'}</td>
        </tr>
        ${stat.c1u1 !== undefined ? `
        <tr>
          <td>${tex('c_1 u_1')} — uit Tabel C.4 (N=${stat.n})</td>
          <td class="mono right">${fmt2(stat.c1u1)} dB</td>
          <td style="font-size:8pt;color:${stat.c1u1Excessive ? '#c2410c' : '#888'}">${stat.c1u1Excessive ? '> 3,5 dB → meetplan herzien (§10.4)' : 'Tabel C.4'}</td>
        </tr>` : ''}
        <tr>
          <td>${tex('u_2')} — instrumentonzekerheid</td>
          <td class="mono right">${fmt2(stat.u2)} dB</td>
          <td style="font-size:8pt;color:#888">Tabel C.5</td>
        </tr>
        <tr>
          <td>${tex('u_3')} — microfoonplaatsing</td>
          <td class="mono right">${fmt2(stat.u3)} dB</td>
          <td style="font-size:8pt;color:#888">§C.6</td>
        </tr>
        <tr>
          <td>${tex('u')} — gecombineerde standaardonzekerheid</td>
          <td class="mono right">${fmt2(stat.u)} dB</td>
          <td style="font-size:8pt;color:#888">Formule C.1</td>
        </tr>
        <tr>
          <td>${tex('U')} — uitgebreide onzekerheid (k=1,65; 95%)</td>
          <td class="mono right">${fmt1(stat.U)} dB</td>
          <td style="font-size:8pt;color:#888">eenzijdig 95%</td>
        </tr>
        <tr style="background:${bg}">
          <td style="font-weight:700">${tex('L_{EX,8h,95\\%}')} (Formule 10)</td>
          <td class="mono right" style="font-weight:700;color:${color}">${fmt1(stat.lEx8h_95pct)} dB(A)</td>
          <td style="font-size:8pt;font-weight:600;color:${color}">${esc(stat.verdictLabel)}</td>
        </tr>
        ${stat.lCpeak !== undefined ? (() => {
          const peakExceeded = stat.lCpeak! >= 140;
          const peakCellStyle = peakExceeded ? 'color:#991b1b;font-weight:700' : '';
          const peakLabelStyle = peakExceeded ? 'font-size:8pt;color:#991b1b;font-weight:700' : 'font-size:8pt;color:#888';
          return `<tr>
          <td>${tex('L_{p,Cpeak}')} (hoogste waarde)</td>
          <td class="mono right" style="${peakCellStyle}">${fmt1(stat.lCpeak)} dB(C)</td>
          <td style="${peakLabelStyle}">${esc(stat.peakVerdictLabel ?? '')}</td>
        </tr>`;
        })() : ''}
        ${oorRow}
      </tbody>
    </table>
  `;

  // Task warnings (K-1, K-3)
  if (stat.taskWarnings && stat.taskWarnings.length > 0) {
    const twRows = stat.taskWarnings.map((w) =>
      `<li style="margin:0.5mm 0">${esc(w)}</li>`
    ).join('');
    html += `
      <div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:3px;padding:2mm 3mm;font-size:8pt;margin-top:2mm">
        <strong>⚠ Taakmeldingen:</strong>
        <ul style="margin:1.5mm 0 0 4mm;padding:0">${twRows}</ul>
      </div>
    `;
  }

  // PPE correction — SNR unknown disclaimer
  if (heg?.ppeSNRUnknown && (heg.ppeMethod ?? 'snr') === 'snr') {
    html += `
      <div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:3px;padding:2mm 3mm;font-size:8pt;margin-top:2mm">
        <strong>PBM in gebruik — SNR onbekend (Arbobesluit art. 6.9 / EN 458:2016):</strong><br>
        ${heg.ppeNotes ? `Type/merk/model: <em>${esc(heg.ppeNotes)}</em><br>` : ''}
        De <abbr title="Single Number Rating">SNR</abbr>-waarde van de gehoorbeschermer is (nog) niet vastgesteld
        (datablad niet beschikbaar). De blootstelling aan het oor bij gebruik van de gehoorbescherming kan
        daardoor niet worden bepaald.<br>
        <strong>De beoordeling is gebaseerd op de onbeschermde
        ${tex('L_{EX,8h,95\\%}')} = ${fmt1(stat.lEx8h_95pct)} dB(A).</strong>
        Zodra de SNR-waarde bekend is dient de grenswaarde-toetsing (art. 6.5 lid 3) te worden herhaald.
      </div>
    `;
  }

  // PPE correction — APF known (single or combined dual)
  if (!heg?.ppeSNRUnknown && (heg?.ppeAttenuation ?? 0) > 0) {
    const combinedAPF = stat.lEx8h_95pct_oor != null
      ? stat.lEx8h_95pct - stat.lEx8h_95pct_oor  // derived from pre-computed stat
      : (heg!.ppeAttenuation ?? 0);
    const corrected = stat.lEx8h_95pct - combinedAPF;
    const elvOk = corrected < 87;

    const ppeMethodLabel: Record<string, string> = {
      snr: 'Methode 1 — SNR/2', hml: 'Methode 2 — HML',
      octave: 'Methode 3 — Octaafband', manual: 'Handmatig',
    };
    const combinedMethodLabel: Record<string, string> = {
      'single':        'Enkelvoudig',
      'double-snr':    'Dubbel — SNR-methode (EN 458:2016)',
      'double-hml':    'Dubbel — HML-methode (EN 458:2016)',
      'double-octave': 'Dubbel — Octaafbandmethode (EN 458:2016)',
    };
    const charLabel: Record<string, string> = {
      low: 'Laagfrequent (C−A > 2 dB)', medium: 'Middenfrequent (C−A ≤ 2 dB)', high: 'Hoogfrequent',
    };

    const m1 = heg!.ppeMethod ?? 'snr';
    const m2 = heg!.ppe2Method ?? 'snr';
    const isDouble = heg!.ppeDouble && stat.ppeCombinedMethod && stat.ppeCombinedMethod !== 'single';

    // Device 1 details
    const dev1Details = m1 === 'snr' && heg!.ppeSNR
      ? `SNR ${heg!.ppeSNR} dB → APF = ${heg!.ppeAttenuation} dB`
      : m1 === 'hml'
      ? [heg!.ppeH ? `H=${heg!.ppeH}` : null, heg!.ppeM ? `M=${heg!.ppeM}` : null, heg!.ppeL ? `L=${heg!.ppeL}` : null]
          .filter(Boolean).join(', ') + ` dB · ${charLabel[heg!.ppeSpectralChar ?? 'medium']} → APF = ${heg!.ppeAttenuation} dB`
      : `APF = ${heg!.ppeAttenuation} dB`;

    // Device 2 details (if double)
    let dev2Html = '';
    if (isDouble && heg!.ppe2Attenuation) {
      const dev2Details = m2 === 'snr' && heg!.ppe2SNR
        ? `SNR ${heg!.ppe2SNR} dB → APF = ${heg!.ppe2Attenuation} dB`
        : m2 === 'hml'
        ? [heg!.ppe2H ? `H=${heg!.ppe2H}` : null, heg!.ppe2M ? `M=${heg!.ppe2M}` : null, heg!.ppe2L ? `L=${heg!.ppe2L}` : null]
            .filter(Boolean).join(', ') + ` dB · ${charLabel[heg!.ppe2SpectralChar ?? 'medium']} → APF = ${heg!.ppe2Attenuation} dB`
        : `APF = ${heg!.ppe2Attenuation} dB`;
      dev2Html = `
        <tr>
          <td style="padding:0.5mm 0;font-weight:600;color:#1e40af">Apparaat 2:</td>
          <td style="padding:0.5mm 0 0.5mm 3mm">${heg!.ppe2Notes ? `<em>${esc(heg!.ppe2Notes)}</em> — ` : ''}${esc(ppeMethodLabel[m2])} — ${esc(dev2Details)}</td>
        </tr>`;
    }

    // Octave band table for device 1 (method 3)
    let octaveTable = '';
    if (m1 === 'octave' && heg!.ppeOctaveBands) {
      const octRes = calcOctaveAPF(heg!.ppeOctaveBands);
      const tdS = 'style="padding:0.5mm 2mm;text-align:right;font-family:monospace;font-size:7.5pt"';
      const thS = 'style="padding:1mm 2mm;text-align:right;font-size:7.5pt;font-weight:600;color:#1e40af;background:#eff6ff"';
      octaveTable = `
        <table style="width:100%;border-collapse:collapse;margin-top:2mm;font-size:7.5pt;border:1px solid #bae6fd">
          <thead><tr>
            <th ${thS} style="${thS.slice(7, -1)};text-align:left">Band (Hz)</th>
            <th ${thS}>L<sub>p,i</sub> (dB)</th>
            <th ${thS}><em>m</em> (dB)</th>
            <th ${thS}><em>s</em> (dB)</th>
            <th ${thS}>APV</th>
            <th ${thS}>L′<sub>A,i</sub> (dB)</th>
          </tr></thead>
          <tbody>
            ${heg!.ppeOctaveBands.map((b, i) => {
              const br  = octRes?.bandResults[i];
              const apv = br != null ? br.apv.toFixed(1) : '—';
              const lpa = br != null ? br.lProtectedA.toFixed(1) : '—';
              const bg  = i % 2 === 0 ? '#f8fafc' : '#fff';
              return `<tr style="background:${bg}">
                <td style="padding:0.5mm 2mm;font-family:monospace;font-weight:600;color:#1d4ed8">${OCTAVE_BANDS[i]}</td>
                <td ${tdS}>${b.lp ?? '—'}</td>
                <td ${tdS}>${b.m ?? '—'}</td>
                <td ${tdS}>${b.s ?? '—'}</td>
                <td ${tdS}>${apv}</td>
                <td ${tdS} style="${tdS.slice(7, -1)};font-weight:600">${lpa}</td>
              </tr>`;
            }).join('')}
          </tbody>
          ${octRes ? `<tfoot><tr style="background:#eff6ff;border-top:1px solid #bae6fd;font-weight:600">
            <td style="padding:1mm 2mm;color:#1e40af">Totaal</td>
            <td colspan="3" ${tdS} style="${tdS.slice(7, -1)};font-weight:600;color:#1e40af">L<sub>p,A</sub> = ${octRes.lA.toFixed(1)} dB(A)</td>
            <td></td>
            <td ${tdS} style="${tdS.slice(7, -1)};font-weight:600;color:#1e40af">L′<sub>A</sub> = ${octRes.lPrime.toFixed(1)} dB(A)</td>
          </tr></tfoot>` : ''}
        </table>`;
    }

    html += `
      <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:3px;padding:2mm 3mm;font-size:8pt;margin-top:2mm">
        <strong>PBM-correctie (EN 458:2016 / Arbobesluit art. 6.9):</strong>
        ${isDouble ? `<span style="margin-left:4mm;background:#dbeafe;color:#1e40af;border-radius:3px;padding:0.5mm 2mm;font-size:7.5pt;font-weight:600">
          ${esc(combinedMethodLabel[stat.ppeCombinedMethod!] ?? stat.ppeCombinedMethod!)}
        </span>` : ''}
        <table style="width:100%;border-collapse:collapse;margin:1.5mm 0;font-size:8pt">
          <tr>
            <td style="padding:0.5mm 0;font-weight:600;color:#1e40af;white-space:nowrap">Apparaat 1:</td>
            <td style="padding:0.5mm 0 0.5mm 3mm">${heg!.ppeNotes ? `<em>${esc(heg!.ppeNotes)}</em> — ` : ''}${esc(ppeMethodLabel[m1])} — ${esc(dev1Details)}</td>
          </tr>
          ${dev2Html}
        </table>
        ${octaveTable}
        ${isDouble && stat.ppeCapped ? `
        <div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:2px;padding:1mm 2mm;font-size:7.5pt;margin-bottom:1.5mm">
          ⚠ Gecombineerde demping begrensd op 35 dB(A) (botgeleiding — EN 458:2016)
        </div>` : ''}
        <div style="margin-top:1.5mm">
          ${isDouble
            ? `Gecombineerde <abbr title="Assumed Protection Factor">APF</abbr> = <strong>${fmt1(combinedAPF)} dB</strong> — `
            : `<abbr title="Assumed Protection Factor">APF</abbr> = ${fmt1(combinedAPF)} dB — `}
          ${tex('L_{EX,8h,oor}')} = ${fmt1(stat.lEx8h_95pct)} − ${fmt1(combinedAPF)} = <strong>${fmt1(corrected)} dB(A)</strong>
          ${elvOk ? badge('Onder grenswaarde', '#15803d', '#dcfce7') : badge('Grenswaarde overschreden — direct ingrijpen', '#991b1b', '#fee2e2')}
        </div>
        <div style="margin-top:1.5mm;font-size:7pt;color:#64748b;border-top:1px solid #e0f2fe;padding-top:1mm">
          Dempingswaarden zijn gebaseerd op fabrikantgegevens (EN 458:2016).${isDouble
            ? ' Bij dubbele gehoorbescherming worden waarden niet opgeteld; totale demping is begrensd op 35 dB(A) vanwege botgeleiding.'
            : ''}
          Waarden zijn schattingen, geen garantie. Periodieke pasvormcontrole, voorlichting en onderhoud blijven vereist (art. 6.9 Arbobesluit).
        </div>
      </div>
    `;
  }

  // Audiometry section (H-5)
  if (heg && stat.verdict !== 'below-lav') {
    const AUDIO_STATUS: Record<string, string> = {
      offered: 'Aangeboden', conducted: 'Uitgevoerd', pending: 'Gepland',
      'not-required': 'Niet vereist', 'not-conducted': 'Niet uitgevoerd — actie vereist',
    };
    const statusLabel = heg.audiometryStatus ? (AUDIO_STATUS[heg.audiometryStatus] ?? heg.audiometryStatus) : null;
    const isRequired  = stat.verdict === 'uav' || stat.verdict === 'above-elv';
    const audioBg     = !heg.audiometryStatus && isRequired ? '#fff1f2' : '#f0fdf4';
    const audioBorder = !heg.audiometryStatus && isRequired ? '#fca5a5' : '#bbf7d0';
    html += `
      <div style="background:${audioBg};border:1px solid ${audioBorder};border-radius:3px;padding:2mm 3mm;font-size:8pt;margin-top:2mm">
        <strong>Gehooronderzoek (art. 6.10 / 6.10a Arbobesluit):</strong>
        ${!heg.audiometryStatus ? `<span style="color:${isRequired ? '#991b1b' : '#555'}"> — nog niet gedocumenteerd${isRequired ? ' (verplicht bij UAV/GW)' : ''}</span>` : ''}
        ${statusLabel ? `<br>Status: <strong>${esc(statusLabel)}</strong>` : ''}
        ${heg.audiometryDate ? `<br>Datum: ${esc(heg.audiometryDate)}` : ''}
        ${heg.audiometryParticipationPct != null ? `<br>Deelname: ${heg.audiometryParticipationPct}%` : ''}
        ${heg.audiometryFindings ? `<br>Bevindingen: <em>${esc(heg.audiometryFindings)}</em>` : ''}
        ${heg.audiometryNextDate ? `<br>Volgende meting: ${esc(heg.audiometryNextDate)}` : ''}
      </div>
    `;
  }

  html += '</div>';
  return html;
}

// ─── Formula reference box ─────────────────────────────────────────────────────

function buildFormulaBox(inv: SoundInvestigation): string {
  const hasTaskBased = inv.hegs.some((h) => h.strategy === 'task-based');
  const hasNonTask   = inv.hegs.some((h) => h.strategy === 'job-based' || h.strategy === 'full-day');
  const hasJobBased  = inv.hegs.some((h) => h.strategy === 'job-based');
  const hasFullDay   = inv.hegs.some((h) => h.strategy === 'full-day');
  const parts: string[] = [];

  if (hasTaskBased) {
    parts.push(`
      <div style="margin-bottom:2mm">
        <span style="color:#888;font-size:7.5pt">Formule (3) — Energiegemiddeld geluidniveau per taak (§9.3.4):</span>
        ${texD('L_{p,A,eqT_m} = 10 \\lg\\!\\left(\\frac{1}{I_m}\\sum_{i=1}^{I_m} 10^{0.1\\,L_i}\\right)')}
      </div>
      <div style="margin-bottom:2mm">
        <span style="color:#888;font-size:7.5pt">Formule (4) — Bijdrage taak m aan dagdosis (§9.3):</span>
        ${texD('L_{EX,8h,m} = L_{p,A,eqT_m} + 10 \\lg\\!\\left(\\tfrac{T_m}{T_0}\\right)')}
      </div>
      <div style="margin-bottom:2mm">
        <span style="color:#888;font-size:7.5pt">Formule (5) — Dagelijkse blootstelling taakgericht (§9.3):</span>
        ${texD('L_{EX,8h} = 10 \\lg\\!\\left(\\sum_m \\frac{T_m}{T_0} \\cdot 10^{0.1\\, L_{p,A,eqT_m}}\\right)')}
      </div>
    `);
  }

  if (hasNonTask) {
    const secRef = hasJobBased && hasFullDay ? '§10.4 / §11.4' : hasJobBased ? '§10.4' : '§11.4';
    const fNum   = hasJobBased && hasFullDay ? '(8)/(9)' : hasJobBased ? '(8)' : '(9)';
    parts.push(`
      <div style="margin-bottom:2mm">
        <span style="color:#888;font-size:7.5pt">Formule (7) — Energiegemiddeld geluidniveau (${esc(secRef)}):</span>
        ${texD('L_{p,A,eqT_e} = 10 \\lg\\!\\left(\\frac{1}{N}\\sum_{i=1}^{N} 10^{0.1\\,L_{p,A,eqT,i}}\\right)')}
      </div>
      <div style="margin-bottom:2mm">
        <span style="color:#888;font-size:7.5pt">Formule ${esc(fNum)} — Dagelijkse blootstelling (${esc(secRef)}):</span>
        ${texD('L_{EX,8h} = L_{p,A,eqT_e} + 10 \\lg\\!\\left(\\tfrac{T_e}{T_0}\\right), \\quad T_0 = 8\\,\\text{h}')}
      </div>
    `);
  }

  // Formula (10) always
  parts.push(`
    <div style="margin-bottom:2mm">
      <span style="color:#888;font-size:7.5pt">Formule (10) — Uitgebreide onzekerheid:</span>
      ${texD('L_{EX,8h,95\\%} = L_{EX,8h} + U \\qquad U = 1{,}65 \\cdot u')}
    </div>
  `);

  // Annex C — always C.1, conditional C.6 / C.12
  parts.push(`
    <div style="border-top:0.5px solid #ddd;padding-top:2mm;margin-top:1mm;margin-bottom:2mm">
      <span style="color:#888;font-size:7.5pt;font-weight:600">Bijlage C — Onzekerheidsberekening:</span>
    </div>
    <div style="margin-bottom:2mm">
      <span style="color:#888;font-size:7.5pt">Formule C.1 — Gecombineerde standaardonzekerheid:</span>
      ${texD('u = \\sqrt{(c_1 u_1)^2 + u_2^2 + u_3^2}')}
    </div>
    ${hasTaskBased ? `
    <div style="margin-bottom:2mm">
      <span style="color:#888;font-size:7.5pt">Formule C.6 — Bemonsteringsonzekerheid per taak:</span>
      ${texD('u_{1a,m} = \\frac{s_m}{\\sqrt{I_m}}')}
    </div>` : ''}
    ${hasNonTask ? `
    <div>
      <span style="color:#888;font-size:7.5pt">Formule C.12 — Bemonsteringsonzekerheid ${hasJobBased && hasFullDay ? 'functie-/dagmeting' : hasJobBased ? 'functiegericht' : 'volledige dag'}:</span>
      ${texD('c_1 u_1 = \\frac{s}{\\sqrt{N}}')}
    </div>` : ''}
  `);

  return `
    <div class="infobox" style="margin-bottom:4mm">
      <strong style="font-size:8pt;display:block;margin-bottom:2mm">Gebruikte formules — NEN-EN-ISO 9612:2025</strong>
      ${parts.join('')}
    </div>
  `;
}

// ─── §12.2 Meetreeksen & veldkalibratie ───────────────────────────────────────

function buildMeasurementSeries(inv: SoundInvestigation): string {
  const allSeries: MeasurementSeries[] = inv.measurementSeries ?? [];
  if (allSeries.length === 0) return '';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  function instrLabel(instrumentId: string): string {
    const inst = inv.instruments.find((i) => i.id === instrumentId);
    if (!inst) return '—';
    return [INSTRUMENT_LABEL[inst.type], inst.manufacturer, inst.model, inst.serialNumber ? `S/N ${inst.serialNumber}` : ''].filter(Boolean).join(' · ');
  }

  let rows = '';
  allSeries.forEach((series, idx) => {
    const heg  = inv.hegs.find((h) => h.id === series.hegId);
    const task = series.taskId ? inv.tasks.find((t) => t.id === series.taskId) : null;
    const context = [heg?.name, task?.name].filter(Boolean).join(' / ');

    const pre  = series.calibrations.find((c) => c.type === 'pre');
    const post = series.calibrations.find((c) => c.type === 'post');
    const mids = series.calibrations.filter((c) => c.type === 'mid');

    const drift = pre && post ? Math.abs(post.value - pre.value) : null;
    const driftExceeded = drift !== null && drift > 0.5;

    const preCell  = pre  ? `${pre.value} dB${pre.timestamp ? ` (${pre.timestamp})` : ''}` : '—';
    const postCell = post ? `${post.value} dB${post.timestamp ? ` (${post.timestamp})` : ''}` : '—';
    const driftCell = drift !== null
      ? `<span style="font-weight:600;color:${driftExceeded ? '#991b1b' : '#16a34a'}">${drift.toFixed(2)} dB ${driftExceeded ? '✖' : '✓'}</span>`
      : '—';

    const mCount = inv.measurements.filter((m) => m.seriesId === series.id).length;

    rows += `<tr style="${driftExceeded ? 'background:#fee2e2' : ''}">
      <td style="font-weight:600">Reeks ${idx + 1}</td>
      <td style="font-size:8pt">${esc(context)}</td>
      <td style="font-size:8pt">${esc(instrLabel(series.instrumentId))}</td>
      <td style="font-size:8pt">${esc(preCell)}</td>
      <td style="font-size:8pt">${esc(postCell)}</td>
      <td style="font-size:8pt">${driftCell}</td>
      <td class="right" style="font-size:8pt">${mCount}</td>
    </tr>`;

    for (const mid of mids) {
      rows += `<tr style="${driftExceeded ? 'background:#fee2e2' : 'background:#fffbeb'}">
        <td></td>
        <td colspan="2" style="font-size:7.5pt;color:#92400e;padding-left:4mm">
          ↳ Tussencalibratie${mid.timestamp ? ` (${mid.timestamp})` : ''}: <strong>${mid.value} dB</strong>
          ${mid.reason ? ` — ${esc(mid.reason)}` : ''}
        </td>
        <td colspan="4"></td>
      </tr>`;
    }

    if (driftExceeded) {
      rows += `<tr style="background:#fee2e2">
        <td colspan="7" style="font-size:7.5pt;color:#991b1b;font-style:italic;padding-left:4mm">
          Kalibratiefout: afwijking ${drift!.toFixed(2)} dB > 0,5 dB → alle metingen van deze reeks automatisch uitgesloten (§12.2 NEN-EN-ISO 9612:2025)
        </td>
      </tr>`;
    }

    if (series.notes) {
      rows += `<tr><td colspan="7" style="font-size:7.5pt;color:#555;padding-left:4mm">${esc(series.notes)}</td></tr>`;
    }
  });

  return `
    <div style="margin-bottom:3mm">
      <div style="font-size:7.5pt;font-weight:600;text-transform:uppercase;color:#888;margin-bottom:1.5mm">
        §12.2 Veldkalibratie — meetreeksen
      </div>
      <table>
        <thead>
          <tr>
            <th>Reeks</th>
            <th>HEG / Taak</th>
            <th>Instrument</th>
            <th>Kalibratie vóór</th>
            <th>Kalibratie na</th>
            <th>Δ</th>
            <th class="right">Metingen</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

// ─── §15.d Individual measurements ────────────────────────────────────────────

function buildMeasurementTable(inv: SoundInvestigation): string {
  if (inv.measurements.length === 0 && (inv.measurementSeries ?? []).length === 0) return '';

  let html = buildMeasurementSeries(inv);

  for (const heg of inv.hegs) {
    const showTask = heg.strategy === 'task-based';

    // For task-based HEGs, only include measurements tied to a known task.
    // Orphaned measurements (deleted task, empty taskId, strategy change artefacts)
    // are invisible in the app's Step 6 view and should not appear in the report.
    const validTaskIds = showTask
      ? new Set(inv.tasks.filter((t) => t.hegId === heg.id).map((t) => t.id))
      : null;

    const hegMeas = inv.measurements.filter((m) => {
      if (m.hegId !== heg.id) return false;
      if (showTask) return m.taskId != null && validTaskIds!.has(m.taskId);
      return !m.taskId; // job-based / full-day: taskId is empty/undefined
    });
    if (hegMeas.length === 0) continue;

    let rows = '';
    for (const m of hegMeas) {
      const task   = m.taskId ? inv.tasks.find((t) => t.id === m.taskId) : null;
      const calib  = (m.calibBefore != null || m.calibAfter != null)
        ? `${m.calibBefore ?? '—'} / ${m.calibAfter ?? '—'}`
        : '—';
      const nonRep = m.representativeConditions === false
        ? `<span style="color:#92400e;font-style:italic">(niet-representatief §15.d.4)</span>`
        : '';
      const extra  = m.excluded
        ? `<span style="color:#c2410c">Uitgesloten${m.exclusionReason ? `: ${esc(m.exclusionReason)}` : ''}</span>`
        : [m.deviations ? esc(m.deviations) : '', nonRep].filter(Boolean).join(' ');

      const hasOB = m.octaveBands?.some((v) => v > 0);
      rows += `
        <tr style="${m.excluded ? 'opacity:0.55;' : ''}">
          ${showTask ? `<td style="font-size:8pt">${task ? esc(task.name) : '—'}</td>` : ''}
          <td style="font-size:8pt">${esc(m.workerLabel ?? '—')}</td>
          <td style="font-size:8pt">${m.date ? fmtDate(m.date) : '—'}${m.startTime ? `<br><span style="color:#888">${m.startTime}${m.endTime ? `–${m.endTime}` : ''}</span>` : ''}</td>
          <td class="mono right">${m.lpa_eqT.toFixed(1)}</td>
          <td class="mono right">${m.lpCpeak != null ? m.lpCpeak.toFixed(1) : '—'}</td>
          <td class="right" style="font-size:8pt;color:#888">${calib}</td>
          <td style="font-size:8pt">${extra}</td>
        </tr>
        ${hasOB && m.octaveBands ? `
        <tr style="${m.excluded ? 'opacity:0.55;' : ''}background:#f0f9ff;">
          <td colspan="${showTask ? 7 : 6}" style="padding:1mm 3mm 1.5mm;font-size:7.5pt;color:#1e40af">
            <span style="font-weight:600;margin-right:2mm">OBA:</span>
            ${OCTAVE_BANDS.map((f, i) =>
              `<span style="margin-right:2.5mm"><span style="color:#64748b">${f} Hz</span> <span style="font-family:monospace;font-weight:600">${m.octaveBands![i]?.toFixed(1) ?? '—'}</span></span>`
            ).join('')} dB
          </td>
        </tr>` : ''}
      `;
    }

    html += `
      <div style="margin-bottom:4mm">
        <div style="font-size:9pt;font-weight:700;margin-bottom:1.5mm">${esc(heg.name)}</div>
        <table>
          <thead>
            <tr>
              ${showTask ? '<th>Taak</th>' : ''}
              <th>Werknemer</th>
              <th>Datum / tijd</th>
              <th class="right">${tex('L_{p,A,eqT}')} (dB)</th>
              <th class="right">${tex('L_{p,Cpeak}')} (dB(C))</th>
              <th class="right">Calib voor/na (dB)</th>
              <th>Afwijkingen / opmerkingen</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  }

  return html ? section('§15.d — Individuele meetwaarden (§15.d.1–5)', html) : '';
}

// ─── §15.e Obligations ─────────────────────────────────────────────────────────

function buildObligations(inv: SoundInvestigation): string {
  if (inv.statistics.length === 0) return '';

  const verdictOrder = ['below-lav', 'lav', 'uav', 'above-elv'];
  const worst = inv.statistics.reduce((w, s) =>
    verdictOrder.indexOf(s.verdict) > verdictOrder.indexOf(w) ? s.verdict : w,
    'below-lav' as string
  );

  const OB: Record<string, Array<{ art: string; text: string }>> = {
    'below-lav': [
      { art: '—', text: 'Geen actiewaarde bereikt. Geen specifieke wettelijke verplichtingen; verwerk resultaten in de RI&E.' },
    ],
    'lav': [
      { art: 'Art. 6.6 lid 1a', text: 'Maatregelenprogramma opstellen ter vermindering van geluidblootstelling.' },
      { art: 'Art. 6.6 lid 1b', text: 'Gehoorbeschermers ter beschikking stellen op verzoek.' },
      { art: 'Art. 6.7',        text: 'Gehooronderzoek aanbieden op verzoek.' },
      { art: 'Art. 6.8',        text: 'Voorlichting en opleiding over risico\'s en beschermende maatregelen.' },
    ],
    'uav': [
      { art: 'Art. 6.6 lid 1a', text: 'Maatregelenprogramma opstellen én uitvoeren.' },
      { art: 'Art. 6.6 lid 1b', text: 'Gehoorbeschermers beschikbaar stellen; gebruik is verplicht.' },
      { art: 'Art. 6.6 lid 1c', text: 'Geluidzone aanwijzen met signalering, afbakening en toegangsbeperking.' },
      { art: 'Art. 6.7',        text: 'Periodiek gehooronderzoek verplicht aanbieden.' },
      { art: 'Art. 6.8',        text: 'Voorlichting en opleiding (verplicht).' },
      { art: 'Art. 6.9',        text: 'Kwaliteitseisen gehoorbeschermer: oor-niveau moet onder 87 dB(A) blijven.' },
      { art: 'Art. 6.10',       text: 'Periodiek preventief gehooronderzoek door of onder toezicht van bedrijfsarts.' },
    ],
    'above-elv': [
      { art: 'Art. 6.6 lid 2',  text: 'ONMIDDELLIJK maatregelen nemen om blootstelling tot onder grenswaarde te brengen.' },
      { art: 'Art. 6.6 lid 2',  text: 'Oorzaak overschrijding bepalen; gedocumenteerde corrigerende maatregelen treffen.' },
      { art: 'Art. 6.6 lid 2',  text: 'Gebruik gehoorbescherming verplicht totdat grenswaarde niet langer wordt overschreden.' },
      { art: 'Art. 6.6 lid 1',  text: 'Alle verplichtingen van de LAV en UAV zijn tevens van kracht.' },
      { art: 'Art. 6.10a',      text: 'Indien gehoorverlies vastgesteld: informeer werknemer, pas maatregelenprogramma aan.' },
    ],
  };

  const obligations = OB[worst] ?? [];
  const col = VERDICT_COLOR[worst] ?? '#555';
  const bg  = VERDICT_BG[worst]  ?? '#f4f4f5';

  const verdictLabels: Record<string, string> = {
    'below-lav': 'Geen actiewaarde',
    'lav':       'Boven onderste actiewaarde — ≥ 80 dB(A)',
    'uav':       'Boven bovenste actiewaarde — ≥ 85 dB(A)',
    'above-elv': 'Grenswaarde overschreden — ≥ 87 dB(A)',
  };

  const html = `
    <div style="background:${bg};border-left:4px solid ${col};padding:2.5mm 3.5mm;border-radius:3px;margin-bottom:4mm">
      <strong style="color:${col};font-size:9pt">${esc(verdictLabels[worst] ?? worst)}</strong>
    </div>
    <ul class="obs-list">
      ${obligations.map((ob) => `<li><span class="obs-art">${esc(ob.art)}</span><span>${esc(ob.text)}</span></li>`).join('')}
    </ul>
  `;

  return section('Beoordeling actiewaarden (Arbobesluit art. 6.5–6.11)', html);
}

// ─── Control measures ─────────────────────────────────────────────────────────

function buildMeasures(inv: SoundInvestigation): string {
  if (inv.measures.length === 0) return '';

  const TYPE_LABEL: Record<string, string> = {
    substitution:   'Substitutie (prioriteit 1)',
    technical:      'Technische maatregel (prioriteit 2)',
    organisational: 'Organisatorisch (prioriteit 3)',
    ppe:            'Gehoorbescherming (prioriteit 4)',
    audiometry:     'Gehooronderzoek',
  };

  const PRIORITY_STYLE: Record<number, { color: string; bg: string }> = {
    1: { color: '#991b1b', bg: '#fee2e2' },
    2: { color: '#c2410c', bg: '#ffedd5' },
    3: { color: '#92400e', bg: '#fef9c3' },
    4: { color: '#1d4ed8', bg: '#dbeafe' },
    5: { color: '#5b21b6', bg: '#ede9fe' },
  };

  const sorted = [...inv.measures].sort((a, b) => a.priority - b.priority);
  let rows = '';
  for (const m of sorted) {
    const statusBadge = m.status === 'completed'
      ? badge('Gereed', '#15803d', '#dcfce7')
      : m.status === 'in-progress'
        ? badge('Loopt', '#92400e', '#fef9c3')
        : badge('Gepland', '#555', '#f4f4f5');
    const ps = PRIORITY_STYLE[m.priority] ?? { color: '#555', bg: '#f4f4f5' };
    rows += `
      <tr>
        <td style="font-weight:700;color:${ps.color};background:${ps.bg};text-align:center;white-space:nowrap">P${m.priority}</td>
        <td>${esc(TYPE_LABEL[m.type] ?? m.type)}</td>
        <td>${esc(m.description)}${m.notes ? `<br><span style="color:#888;font-size:8pt">${esc(m.notes)}</span>` : ''}</td>
        <td>${esc(m.responsible ?? '—')}</td>
        <td>${fmtDate(m.deadline)}</td>
        <td>${statusBadge}</td>
      </tr>
    `;
  }

  const html = `
    <table>
      <thead>
        <tr><th>Prio</th><th>Type</th><th>Omschrijving</th><th>Verantwoordelijke</th><th>Deadline</th><th>Status</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;

  return section('Beheersmaatregelen (Arbeidshygiënische Strategie)', html);
}

// ─── Conclusion ────────────────────────────────────────────────────────────────

function buildConclusion(inv: SoundInvestigation): string {
  const { report } = inv;
  let html = '';

  if (report.conclusion) {
    html += `<p style="margin-bottom:3mm">${esc(report.conclusion).replace(/\n/g, '<br>')}</p>`;
  }

  // Auto-generated conformiteitsverklaring per NEN-EN-ISO 9612:2025 §15.e.7
  if (inv.statistics.length > 0) {
    const today = new Date().toLocaleDateString('nl-NL', { year: 'numeric', month: 'long', day: 'numeric' });
    const verdictRows = inv.statistics.map((stat) => {
      const heg   = inv.hegs.find((h) => h.id === stat.hegId);
      const col   = VERDICT_COLOR[stat.verdict] ?? '#555';
      const ok    = stat.verdict === 'below-lav';
      const elv   = stat.verdict === 'above-elv';
      const icon  = ok ? '✓' : elv ? '✗' : '⚠';
      const ppeTxt = heg?.ppeSNRUnknown
        ? ` &nbsp;·&nbsp; <em style="color:#92400e">PBM in gebruik — SNR onbekend, ${tex('L_{EX,8h,oor}')} niet bepaald</em>`
        : stat.lEx8h_95pct_oor != null
        ? ` &nbsp;·&nbsp; ${tex('L_{EX,8h,oor}')} = ${fmt1(stat.lEx8h_95pct_oor)} dB(A) (mét PBM${stat.ppeCapped ? ', 35 dB-cap' : ''})`
        : '';
      return `
        <tr>
          <td style="font-weight:600">${esc(heg?.name ?? stat.hegId)}</td>
          <td class="mono right">${fmt1(stat.lEx8h)} dB(A)</td>
          <td class="mono right" style="font-weight:700">${fmt1(stat.lEx8h_95pct)} dB(A)</td>
          <td style="color:${col};font-weight:600">${icon} ${esc(stat.verdictLabel)}${ppeTxt}</td>
        </tr>`;
    }).join('');

    html += `
      <div style="border:1px solid #e5e7eb;border-radius:4px;padding:3mm 4mm;margin-bottom:4mm;page-break-inside:avoid">
        <div style="font-size:8.5pt;font-weight:700;margin-bottom:2mm">Conformiteitsverklaring — NEN-EN-ISO 9612:2025 §15.e.7</div>
        <div style="font-size:8pt;color:#333;margin-bottom:2.5mm;line-height:1.6">
          Ondergetekende verklaart dat de geluidblootstelling is bepaald conform NEN-EN-ISO 9612:2025
          en dat onderstaande waarden de dagelijkse blootstelling (${tex('L_{EX,8h}')}) vertegenwoordigen inclusief
          meetonzekerheid (${tex('U')}, eenzijdig 95%-interval): ${tex('L_{EX,8h,95\\%}')} = ${tex('L_{EX,8h}')} + ${tex('U')}.
          Toetsing is uitgevoerd aan de actiewaarden en grenswaarden uit het Arbobesluit art. 6.5 lid 1 en 2.
        </div>
        <table style="margin-bottom:2mm">
          <thead>
            <tr>
              <th>HEG</th>
              <th class="right">${tex('L_{EX,8h}')} (dB(A))</th>
              <th class="right">${tex('L_{EX,8h,95\\%}')} (dB(A))</th>
              <th>Oordeel Arbobesluit art. 6.6</th>
            </tr>
          </thead>
          <tbody>${verdictRows}</tbody>
        </table>
        <div style="font-size:7.5pt;color:#888">Rapportdatum: ${today}</div>
      </div>`;
  }

  if (report.complianceStatement) {
    html += `<div class="infobox"><strong>Toelichting (§15.e.7):</strong><br>${renderWithFormulas(report.complianceStatement)}</div>`;
  }
  if (report.nextReviewDate) {
    html += kv('Datum volgende herbeoordeling', fmtDate(report.nextReviewDate));
  }
  if (report.reviewTriggers.length > 0) {
    html += `<div style="margin-top:2mm"><strong style="font-size:8.5pt">Herbeoordeling ook bij:</strong>
      <ul style="margin:1mm 0 0 5mm;padding:0;font-size:8.5pt;line-height:1.7">
        ${report.reviewTriggers.map((t) => `<li>${esc(t)}</li>`).join('')}
      </ul>
    </div>`;
  }
  if (report.notes) {
    html += `<p style="margin-top:3mm;font-size:8.5pt;color:#555">${esc(report.notes).replace(/\n/g, '<br>')}</p>`;
  }

  return html ? section('Conclusie & conformiteitsverklaring', html) : '';
}

// ─── NPR 3438 — concentratie en communicatie ───────────────────────────────────

// Tabel 4 NPR 3438:2007 — kwalificatie, voorbeelden, streefwaarde en max toelaatbaar (L_Aeq)
const NPR_THRESHOLDS: Record<string, { kwalificatie: string; voorbeelden: string; streef: number; max: number }> = {
  'hoog':      { kwalificatie: 'Hoog',      streef: 35, max: 45, voorbeelden: 'Chirurgisch werk, Beleidswerk, Procesregeling, Confereren/vergaderen, Ontwerpen, Lesgeven, Apothekerswerk, Studeren' },
  'redelijk':  { kwalificatie: 'Redelijk',  streef: 45, max: 55, voorbeelden: 'Beeldschermwerk, Laboratoriumwerk, Systeemontwerpen' },
  'matig':     { kwalificatie: 'Matig',     streef: 55, max: 65, voorbeelden: 'Stuurmanwerk, Garagewerk, Verkopen, Cameratoezicht, Magazijnwerk, Receptiewerk, Fijn mechanisch werk' },
  'laag':      { kwalificatie: 'Laag',      streef: 65, max: 75, voorbeelden: 'Schoonmaakwerk, Gegevensverwerking, Kassawerk, Assemblagewerk' },
  'zeer-laag': { kwalificatie: 'Zeer laag', streef: 75, max: 80, voorbeelden: 'Lopende-bandwerk, Grof mechanisch werk' },
};

function buildNPR3438(inv: SoundInvestigation): string {
  const hegsWithNPR = inv.hegs.filter((h) => h.nprActivity);
  if (hegsWithNPR.length === 0) return '';

  let rows = '';
  for (const heg of hegsWithNPR) {
    const thr   = NPR_THRESHOLDS[heg.nprActivity!];
    const stat  = inv.statistics.find((s) => s.hegId === heg.id);
    const lEx   = stat?.lEx8h;
    const label = hegLabel(heg.id, inv);

    // Three-tier verdict: below target / between target and max / above max
    let verdictBadgeHtml = '—';
    if (lEx != null) {
      if (lEx <= thr.streef) {
        verdictBadgeHtml = badge('✓ Onder streefwaarde', '#15803d', '#dcfce7');
      } else if (lEx <= thr.max) {
        verdictBadgeHtml = badge('~ Boven streefwaarde, binnen maximum', '#92400e', '#fef9c3');
      } else {
        verdictBadgeHtml = badge('✗ Boven maximaal toelaatbare waarde', '#991b1b', '#fee2e2');
      }
    }

    rows += `<tr>
      <td style="font-size:8pt">${esc(label)}</td>
      <td style="font-size:8pt"><strong>${esc(thr.kwalificatie)}</strong><br><span style="color:#888;font-size:7.5pt">${esc(thr.voorbeelden)}</span></td>
      <td class="mono right" style="font-size:8pt">${thr.streef} dB(A)</td>
      <td class="mono right" style="font-size:8pt">${thr.max} dB(A)</td>
      <td class="mono right">${lEx != null ? fmt1(lEx) : '—'} dB(A)</td>
      <td>${verdictBadgeHtml}</td>
    </tr>`;
  }

  const html = `
    <div class="infobox" style="margin-bottom:4mm;font-size:8pt">
      NPR 3438:2007 §5.2 Tabel 4 — Minimale concentratiekwalificatie voor verschillende typen werkzaamheden.
      Streefwaarden zijn maximaal na te streven niveaus; de maximaal toelaatbare waarde ligt 10 dB(A) hoger.
      Geen wettelijke normen, maar aanbevolen praktijk. Vergelijking op basis van ${tex('L_{EX,8h}')} (NEN-EN-ISO 9612:2025).
    </div>
    <table>
      <thead><tr>
        <th>HEG</th>
        <th>Kwalificatie &amp; voorbeeldactiviteiten (Tabel 4)</th>
        <th class="right">Streefwaarde</th>
        <th class="right">Max toelaatbaar</th>
        <th class="right">${tex('L_{EX,8h}')} dB(A)</th>
        <th>Oordeel</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>`;

  return section('NPR 3438:2007 — Concentratie en communicatie (Tabel 4)', html);
}

// ─── Digitale handtekening ─────────────────────────────────────────────────────

function findSignatory(inv: SoundInvestigation): SoundPerson | null {
  const rank = (p: SoundPerson) =>
    p.isAKD              ? 0 :
    p.qualification === 'AH'        ? 1 :
    p.qualification === 'HVK'       ? 2 :
    p.qualification === 'acousticus' ? 3 : 4;
  return [...inv.investigators].sort((a, b) => rank(a) - rank(b))[0] ?? null;
}

function buildSignature(inv: SoundInvestigation): string {
  const sig = findSignatory(inv);
  if (!sig?.name) return '';
  const today = new Date().toLocaleDateString('nl-NL', { year: 'numeric', month: 'long', day: 'numeric' });
  const QUAL: Record<string, string> = {
    AH: 'Arbeidshygiënist', HVK: 'Hogere Veiligheidskundige',
    acousticus: 'Acousticus',
  };
  // For 'other': show the free-text note, not "Overige deskundige"
  const qualLabel = sig.qualification === 'other'
    ? (sig.qualificationNote || null)
    : (sig.qualification ? (QUAL[sig.qualification] ?? sig.qualification) : null);
  return `
    <div style="margin-top:12mm;border-top:1px solid #e5e7eb;padding-top:4mm;page-break-inside:avoid">
      <div style="font-size:8pt;color:#888;margin-bottom:4mm">
        Ondertekening conform NEN-EN-ISO 9612:2025 §15.e.7
      </div>
      <div style="min-width:70mm;display:inline-block">
        <div style="font-size:9pt;font-weight:700">${esc(sig.name)}</div>
        ${qualLabel ? `<div style="font-size:8pt;color:#555">${esc(qualLabel)}</div>` : ''}
        ${sig.isAKD ? `<div style="font-size:8pt;color:#1d4ed8">AKD nr. ${esc(sig.akdNumber ?? '(geregistreerd)')}</div>` : ''}
        ${sig.organization ? `<div style="font-size:8pt;color:#555">${esc(sig.organization)}</div>` : ''}
        <div style="margin-top:10mm;border-top:1px solid #555;width:70mm;padding-top:1mm;font-size:7.5pt;color:#888">
          Handtekening &nbsp;·&nbsp; Datum: ${today}
        </div>
      </div>
    </div>`;
}

// ─── Full report ───────────────────────────────────────────────────────────────

function buildReport(inv: SoundInvestigation): string {
  const today = new Date().toLocaleDateString('nl-NL');

  // Strip existing section() wrappers: call inner content builders directly
  // where possible; use the section() wrappers that already exist otherwise.
  const preSurveyContent  = buildPreSurvey(inv);
  const scopeContent      = buildScope(inv);
  const equipContent      = buildEquipmentInventory(inv);
  const instrContent      = buildInstruments(inv);
  const measContent       = buildMeasurementTable(inv);
  const obligContent      = buildObligations(inv);
  const measuresContent   = buildMeasures(inv);
  const conclusionContent = buildConclusion(inv);
  const nprContent        = buildNPR3438(inv);

  // Chapter numbering shifts by 1 when pre-survey is present
  const o = preSurveyContent ? 1 : 0;

  let resultsHtml = '';
  if (inv.statistics.length > 0) {
    resultsHtml = inv.statistics.map((stat) => buildHEGResult(inv, stat)).join('');
  }

  const parts: string[] = [
    buildCover(inv),
    '<div style="padding-top:5mm">',

    // 1. Pre-survey (optional)
    preSurveyContent
      ? chapter('1', 'Vooronderzoek en meetaanleiding', 'NEN-EN-ISO 9612:2025 §7', preSurveyContent)
      : '',

    // 1/2. Scope / onderzoeksopdracht
    scopeContent
      ? chapter(String(1 + o), 'Onderzoeksopdracht en doel', 'NEN-EN-ISO 9612:2025 §15.a', scopeContent, !!preSurveyContent)
      : '',

    // 2/3. Management summary (includes its own chapter header + page break)
    buildManagementSummary(inv, String(2 + o)),

    // 3/4. Work analysis
    inv.hegs.length > 0
      ? chapter(String(3 + o), 'Werkanalyse en HEG-definitie', 'NEN-EN-ISO 9612:2025 §15.b + §7.2', buildWorkAnalysis(inv), true)
      : '',

    // Equipment inventory (art. 7.4a)
    equipContent || '',

    // 4/5. Instruments
    instrContent
      ? chapter(String(4 + o), 'Meetapparatuur en kalibratie', 'NEN-EN-ISO 9612:2025 §15.c', instrContent, true)
      : '',

    // 5/6. Measurements
    measContent
      ? chapter(String(5 + o), 'Meetgegevens', 'NEN-EN-ISO 9612:2025 §15.d', measContent, true)
      : '',

    // 6/7. Statistics / results
    resultsHtml
      ? chapter(String(6 + o), 'Statistische berekeningen en resultaten', 'NEN-EN-ISO 9612:2025 §15.e', resultsHtml, true)
      : '',

    // 7/8. Action-level assessment
    obligContent
      ? chapter(String(7 + o), 'Beoordeling actiewaarden', 'Arbobesluit art. 6.5–6.11', obligContent, true)
      : '',

    // 8/9. Control measures
    measuresContent
      ? chapter(String(8 + o), 'Beheersmaatregelen', 'Arbeidshygiënische Strategie', measuresContent, true)
      : '',

    // 9/10. NPR 3438 (optional)
    nprContent
      ? chapter(String(9 + o), 'NPR 3438 — Concentratie en communicatie', 'NPR 3438:2007', nprContent, true)
      : '',

    // 9/10/11. Conclusion
    conclusionContent
      ? chapter(String(9 + o + (nprContent ? 1 : 0)), 'Conclusie en conformiteitsverklaring', 'NEN-EN-ISO 9612:2025 §15.e.7', conclusionContent, true)
      : '',

    // Bijlage A — Formulas
    chapter('Bijlage A', 'Gebruikte formules en onzekerheidsmodel', 'NEN-EN-ISO 9612:2025', buildFormulaBox(inv), true),

    // Digital signature
    buildSignature(inv),

    `<div style="margin-top:10mm;border-top:1px solid #e5e7eb;padding-top:3mm;font-size:7.5pt;color:#888">
      Gegenereerd door OHSHub op ${today} · NEN-EN-ISO 9612:2025 · Arbobesluit art. 6.5–6.11
    </div>`,

    '</div>',
  ];

  return parts.filter(Boolean).join('\n');
}

// ─── Measurement Plan PDF ──────────────────────────────────────────────────────

const PLAN_CSS = `
  @page { size: A4; margin: 14mm 14mm 18mm 14mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 9pt; line-height: 1.45; color: #111; background: #fff; }

  .plan-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2pt solid #f97316; padding-bottom: 4mm; margin-bottom: 5mm; }
  .logo { font-size: 15pt; font-weight: 800; }
  .logo span { color: #f97316; }
  .doc-right { text-align: right; }
  .doc-title { font-size: 12.5pt; font-weight: 700; margin-bottom: 1mm; }
  .doc-sub { font-size: 8pt; color: #666; }

  .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1mm 6mm; border: 0.5pt solid #ddd; border-radius: 1.5mm; padding: 3mm; background: #fafafa; margin-bottom: 5mm; font-size: 8.5pt; }
  .meta-row { display: flex; gap: 1.5mm; }
  .meta-label { font-weight: 700; color: #555; white-space: nowrap; min-width: 24mm; }

  h2 { font-size: 10pt; font-weight: 700; background: #f97316; color: #fff; padding: 1.5mm 4mm; margin: 5mm 0 3mm 0; border-radius: 1mm; }
  h3 { font-size: 9pt; font-weight: 700; border-left: 3pt solid #f97316; padding-left: 2.5mm; margin: 4mm 0 2mm 0; }

  .req-box { border: 0.5pt solid #fb923c; border-radius: 1.5mm; padding: 2mm 3mm; margin: 0 0 3mm 0; font-size: 7.5pt; line-height: 1.5; background: #fff7ed; }
  .req-box.green { border-color: #86efac; background: #f0fdf4; }
  .req-box strong { color: #c2410c; }
  .req-box.green strong { color: #166534; }

  table { width: 100%; border-collapse: collapse; font-size: 7.5pt; margin-bottom: 3mm; }
  th { background: #f4f4f5; border: 0.5pt solid #aaa; padding: 1.5mm 2mm; font-size: 7pt; font-weight: 700; text-align: left; white-space: nowrap; }
  th.center { text-align: center; }
  td { border: 0.5pt solid #bbb; padding: 0.5mm 2mm; height: 9mm; vertical-align: middle; }
  td.idx { width: 7mm; text-align: center; color: #999; font-size: 7pt; background: #fafafa; }

  .note-lines { margin-top: 3mm; }
  .note-line { border-bottom: 0.5pt solid #ccc; height: 9mm; margin-bottom: 1.5mm; }
  .note-label { font-size: 7.5pt; font-weight: 700; color: #555; margin-bottom: 1.5mm; }

  .sign-block { display: grid; grid-template-columns: 1fr 1fr; gap: 8mm; margin-top: 8mm; }
  .sign-box { border-top: 0.5pt solid #555; padding-top: 1.5mm; font-size: 7.5pt; color: #555; }

  .plan-footer { margin-top: 6mm; padding-top: 3mm; border-top: 0.5pt solid #ddd; font-size: 7pt; color: #999; text-align: right; }
  .page-break { page-break-before: always; }
`;

function fmtMinutes(m: number): string {
  if (m <= 0) return '—';
  if (m < 60) return `${Math.round(m)} min`;
  const h = Math.floor(m / 60);
  const rem = Math.round(m % 60);
  return rem > 0 ? `${h} h ${rem} min` : `${h} h`;
}

function buildMeasurementPlan(inv: SoundInvestigation): string {
  const { scope, hegs, tasks, instruments, investigators } = inv;
  const measurementSeries = inv.measurementSeries ?? [];
  const today = new Date().toLocaleDateString('nl-NL', { year: 'numeric', month: 'long', day: 'numeric' });

  const strategyLabel: Record<string, string> = {
    'task-based': 'Taakgericht (Strategie 1, §9)',
    'job-based':  'Functiegericht (Strategie 2, §10)',
    'full-day':   'Volledige dag (Strategie 3, §11)',
  };

  const instrLine = (id: string): string => {
    const instr = instruments.find((i) => i.id === id);
    if (!instr) return '—';
    return esc([instr.manufacturer, instr.model, instr.serialNumber].filter(Boolean).join(' ') || instr.type);
  };

  const instrList = instruments.length > 0
    ? instruments.map((i, n) =>
        `${n + 1}. ${esc([i.manufacturer, i.model, i.serialNumber].filter(Boolean).join(' ') || i.type)}`
      ).join(' &nbsp;|&nbsp; ')
    : '—';

  const header = `
    <div class="plan-header">
      <div><div class="logo">OHS<span>Hub</span></div><div class="doc-sub">ohs-hub.vercel.app</div></div>
      <div class="doc-right">
        <div class="doc-title">Meetplan — Geluidblootstelling</div>
        <div class="doc-sub">NEN-EN-ISO 9612:2025 — Veldregistratieformulier</div>
        <div class="doc-sub">Aangemaakt: ${today}</div>
      </div>
    </div>`;

  const investigatorNames = investigators.map((p) => esc(p.name || '—')).join(', ') || '—';
  const meta = `
    <div class="meta-grid">
      <div class="meta-row"><div class="meta-label">Onderzoek:</div><div>${esc(inv.name)}</div></div>
      <div class="meta-row"><div class="meta-label">Bedrijf:</div><div>${esc(scope.companyName)}</div></div>
      <div class="meta-row"><div class="meta-label">Locatie:</div><div>${esc(scope.workplaceName)}</div></div>
      <div class="meta-row"><div class="meta-label">Onderzoeker(s):</div><div>${investigatorNames}</div></div>
      <div class="meta-row" style="grid-column:span 2"><div class="meta-label">Instrument(en):</div><div>${instrList}</div></div>
    </div>`;

  const measRow = (i: number) => `
    <tr>
      <td class="idx">${i}</td>
      <td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td>
    </tr>`;

  const measHead = (includeTask: boolean) => `
    <tr>
      <th class="center" style="width:7mm">#</th>
      <th style="width:20mm">Datum</th>
      <th style="width:28mm">Medewerker</th>
      <th style="width:12mm">Reeks nr.</th>
      ${includeTask ? '' : ''}
      <th style="width:14mm">Start</th>
      <th style="width:14mm">Einde</th>
      <th style="width:16mm">Duur (min)</th>
      <th style="width:22mm">L<sub>p,A,eqT</sub> (dB)</th>
      <th style="width:22mm">L<sub>p,Cpeak</sub> (dB)</th>
      <th>Opmerkingen / OB</th>
    </tr>`;

  const calibHead = `
    <tr>
      <th class="center" style="width:9mm">Reeks</th>
      <th style="width:46mm">Instrument (fabr. / model / nr.)</th>
      <th style="width:20mm">Voorkal. tijd</th>
      <th style="width:20mm">Voorkal. (dB)</th>
      <th style="width:20mm">Nakal. tijd</th>
      <th style="width:20mm">Nakal. (dB)</th>
      <th style="width:18mm">Drift (dB)</th>
      <th>Voldoet? (&lt;&nbsp;0,5&nbsp;dB)</th>
    </tr>`;

  let hegSections = '';

  hegs.forEach((heg, hegIdx) => {
    const hegTasks  = tasks.filter((t) => t.hegId === heg.id);
    const hegSeries = measurementSeries.filter((s) => s.hegId === heg.id);
    const calibCount = Math.max(hegSeries.length, 3);

    const hegMeta = `
      <h2>${hegIdx + 1}. HEG: ${esc(heg.name)}</h2>
      <div class="meta-grid">
        <div class="meta-row"><div class="meta-label">Strategie:</div><div>${esc(strategyLabel[heg.strategy] ?? heg.strategy)}</div></div>
        <div class="meta-row"><div class="meta-label">Medewerkers:</div><div>${heg.workerCount} personen</div></div>
        <div class="meta-row"><div class="meta-label">T<sub>e</sub> (werkdag):</div><div>${fmtMinutes(heg.effectiveDayHours * 60)}</div></div>
        <div class="meta-row"><div class="meta-label">Functiomschrijving:</div><div>${esc(heg.jobTitle)}</div></div>
      </div>`;

    let tables = '';

    if (heg.strategy === 'task-based') {
      const totalMin = hegTasks.reduce((s, t) => { const tm = t.durationHours * 60; return s + 3 * (tm >= 5 ? 5 : tm); }, 0);
      tables += `
        <div class="req-box">
          <strong>NEN-EN-ISO 9612 §9.3.2 / Arbobesluit art. 6.9</strong> &nbsp;—&nbsp;
          Per taak: ≥&nbsp;<strong>3 metingen</strong>, elk ≥&nbsp;<strong>5 min</strong> (of volledige taak als T<sub>m</sub> &lt; 5 min).
          Minimale totale meettijd voor deze HEG: ≥&nbsp;<strong>${fmtMinutes(totalMin)}</strong>.
          Kalibreer vóór en ná elke meetserie (§12.2). Drift &gt; 0,5&nbsp;dB: reeks uitsluiten.
        </div>`;

      if (hegTasks.length === 0) {
        tables += `<p style="color:#888;font-size:8pt;margin:2mm 0;">Geen taken gedefinieerd in stap 5.</p>`;
      } else {
        for (const task of hegTasks) {
          const tmMin      = task.durationHours * 60;
          const minPerMeas = tmMin >= 5 ? 5 : tmMin;
          const normNote   = tmMin < 5 ? ' <em>(volledige taak; T<sub>m</sub> &lt; 5 min)</em>' : '';
          tables += `
            <h3>Taak: ${esc(task.name || '(naamloos)')}</h3>
            <div class="req-box green">
              T<sub>m</sub> = <strong>${fmtMinutes(tmMin)}</strong> &nbsp;·&nbsp;
              Min. meetduur / meting: ≥&nbsp;<strong>${fmtMinutes(minPerMeas)}</strong>${normNote} &nbsp;·&nbsp;
              Min. aantal: ≥&nbsp;<strong>3</strong> &nbsp;·&nbsp;
              Min. totaal: ≥&nbsp;<strong>${fmtMinutes(3 * minPerMeas)}</strong>
            </div>
            <table><thead>${measHead(false)}</thead><tbody>
              ${[1,2,3,4,5].map(measRow).join('')}
            </tbody></table>`;
        }
      }
    } else {
      const teMin    = heg.effectiveDayHours * 60;
      const secRef   = heg.strategy === 'job-based' ? '§10.4' : '§11.4';
      tables += `
        <div class="req-box">
          <strong>NEN-EN-ISO 9612 ${secRef} / Arbobesluit art. 6.9</strong> &nbsp;—&nbsp;
          ≥&nbsp;<strong>3 steekproeven</strong>, elk de volledige werkdag
          (T<sub>e</sub> = <strong>${fmtMinutes(teMin)}</strong>).
          Minimale totale meettijd: ≥&nbsp;<strong>${fmtMinutes(3 * teMin)}</strong>.
          Kalibreer vóór en ná elke meetserie (§12.2).
        </div>
        <table><thead>${measHead(false)}</thead><tbody>
          ${[1,2,3,4,5].map(measRow).join('')}
        </tbody></table>`;
    }

    // Calibration table
    const calibRows = Array.from({ length: calibCount }, (_, i) => {
      const series = hegSeries[i];
      const instrLabel = series ? instrLine(series.instrumentId) : '';
      return `<tr>
        <td class="idx">${i + 1}</td>
        <td>${instrLabel}</td>
        <td></td><td></td><td></td><td></td><td></td><td></td>
      </tr>`;
    }).join('');

    const calibSection = `
      <h3>Kalibratie meetreeksen (§12.2 NEN-EN-ISO 9612)</h3>
      <div class="req-box">
        Vóór en ná elke meetserie een veldkalibratie met gekalibreerde geluidkalibrateur. Drift &gt; 0,5&nbsp;dB → reeks <strong>uitsluiten</strong>.
      </div>
      <table><thead>${calibHead}</thead><tbody>${calibRows}</tbody></table>`;

    const notes = `
      <div class="note-lines">
        <div class="note-label">Opmerkingen / afwijkingen van representatieve omstandigheden (§15.d.4):</div>
        <div class="note-line"></div>
        <div class="note-line"></div>
      </div>`;

    hegSections += `${hegIdx > 0 ? '<div class="page-break"></div>' : ''}${hegMeta}${tables}${calibSection}${notes}`;
  });

  const signatures = `
    <div class="sign-block">
      <div class="sign-box">Handtekening onderzoeker &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Datum: _______________</div>
      <div class="sign-box">Handtekening leidinggevende &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Datum: _______________</div>
    </div>`;

  const footer = `<div class="plan-footer">OHSHub — NEN-EN-ISO 9612:2025 / Arbobesluit art. 6.6–6.9 — Gegenereerd op ${today}</div>`;

  return [header, meta, hegSections, signatures, footer].join('\n');
}

// ─── Export ────────────────────────────────────────────────────────────────────

export function downloadMeasurementPlanPDF(inv: SoundInvestigation): void {
  const html = `<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="UTF-8">
<title>${esc(inv.name)} — Meetplan</title>
<style>${PLAN_CSS}</style>
</head>
<body>
${buildMeasurementPlan(inv)}
<script>setTimeout(function() { window.print(); }, 300);</script>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const win  = window.open(url, '_blank');
  if (!win) {
    const a = document.createElement('a');
    a.href = url;
    a.download = `${inv.name.replace(/\s+/g, '-').toLowerCase().slice(0, 50)}-meetplan.html`;
    a.click();
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function downloadSoundPDF(inv: SoundInvestigation): void {
  const html = `<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="UTF-8">
<title>${esc(inv.name)} — OHSHub Geluidrapport</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.33/dist/katex.min.css" crossorigin="anonymous">
<style>${CSS}</style>
</head>
<body>
${buildReport(inv)}
<script>
  // Print after KaTeX fonts have had a moment to load
  setTimeout(function() { window.print(); }, 600);
</script>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (!win) {
    const a = document.createElement('a');
    a.href = url;
    a.download = `${inv.name.replace(/\s+/g, '-').toLowerCase().slice(0, 50)}-geluidrapport.html`;
    a.click();
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
