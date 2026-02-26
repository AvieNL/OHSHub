import type {
  Investigation,
  Substance,
  WorkTask,
  OELValue,
  OELType,
  OELPeriod,
  AggregateState,
  ControlType,
  ExposureBand,
  MeasurementStatistics,
} from './investigation-types';
import { computeStats } from './measurement-stats';

// ─── Label maps ───────────────────────────────────────────────────────────────

const STATE_LABEL: Record<AggregateState, string> = {
  gas: 'Gas',
  'vapor-liquid': 'Damp / vloeistof (hoge dampdruk)',
  liquid: 'Vloeistof (lage dampdruk)',
  'solid-powder': 'Vaste stof / poeder',
  aerosol: 'Aerosol / nevel',
};

const OEL_TYPE_LABEL: Record<OELType, string> = {
  szw: 'SZW (NL)',
  'eu-oel': 'EU-OEL',
  dnel: 'DNEL',
  acgih: 'ACGIH TLV',
  dfg: 'DFG MAK',
  internal: 'Intern',
  none: '—',
};

const OEL_PERIOD_LABEL: Record<OELPeriod, string> = {
  'tgg-8h': '8-uurs TGG',
  'tgg-15min': '15-min TGG',
  ceiling: 'Plafond',
};

const PROCESS_LABEL: Record<string, string> = {
  closed: 'Gesloten systeem',
  'partly-closed': 'Gedeeltelijk gesloten',
  open: 'Open proces',
  'high-emission': 'Open — hoge emissie',
};

const LEV_LABEL: Record<string, string> = {
  none: 'Geen LEV',
  point: 'Bronafzuiging (punt)',
  local: 'Lokale afzuiging',
  partial: 'Gedeeltelijk ingekapseld',
  full: 'Volledig ingekapseld',
};

const VENTILATION_LABEL: Record<string, string> = {
  none: 'Geen ventilatie',
  '<1ACH': '< 1 luchwisseling/uur',
  '1-3ACH': '1–3 luchtwisselingen/uur',
  '3-6ACH': '3–6 luchtwisselingen/uur',
  '>6ACH': '> 6 luchtwisselingen/uur',
};

const ROOM_LABEL: Record<string, string> = {
  '<50m3': '< 50 m³',
  '50-500m3': '50–500 m³',
  '>500m3': '> 500 m³',
};

const PPE_LABEL: Record<string, string> = {
  respirator: 'Ademhalingsbescherming',
  gloves: 'Handschoenen',
  'eye-clothing': 'Oog-/gelaatsbescherming & kleding',
  'usage-monitored': 'Gebruik wordt gecontroleerd',
  none: 'Geen PBM',
};

const CONTROL_TYPE_LABEL: Record<ControlType, string> = {
  substitution: 'Substitutie',
  'process-change': 'Procesaanpassing',
  lev: 'LEV / bronafzuiging',
  ventilation: 'Ventilatie',
  organisational: 'Organisatorisch',
  ppe: 'PBM',
};

const DECISION_LABEL: Record<string, string> = {
  'compliant-no-measurement': 'Voldoet — geen meting vereist',
  'compliant-monitoring': 'Voldoet — periodieke monitoring',
  'tier2-required': 'Tier-2 IAE uitvoeren',
  'measurement-needed': 'Oriënterende of volledige meting',
  'measures-alara': 'ALARA-maatregelen + herhaal tier-1',
  'measures-then-measure': 'Eerst maatregelen, daarna meten',
  'immediate-action': 'Onmiddellijk ingrijpen vereist',
  'non-compliant-act': 'Actie vereist',
  '': '—',
};

const BAND_COLOR: Record<ExposureBand, string> = {
  A: '#16a34a',
  B: '#b45309',
  C: '#c2410c',
  D: '#dc2626',
};

const BAND_BG: Record<ExposureBand, string> = {
  A: '#dcfce7',
  B: '#fef9c3',
  C: '#ffedd5',
  D: '#fee2e2',
};

const STATUS_LABEL: Record<string, string> = {
  planned: 'Gepland',
  'in-progress': 'In uitvoering',
  completed: 'Gereed',
};

const NORM_LABEL: Record<string, string> = {
  'nen-en-689': 'NEN-EN 689:2018+C1:2019 — Meetstrategie inhalatieblootstelling',
  'nen-en-482': 'NEN-EN 482 — Algemene eisen meetmethoden',
  reach: 'REACH-verordening (EG 1907/2006)',
  clp: 'CLP-verordening (EG 1272/2008)',
  nla: 'NLA-handelingskader gevaarlijke stoffen',
  atex: 'ATEX (Arbobesluit hfst. 3 par. 2a)',
  arie: 'ARIE (Arbobesluit hfst. 2 afd. 2)',
};

// ─── HTML helpers ─────────────────────────────────────────────────────────────

function esc(s: string | undefined | null): string {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function nl2p(s: string): string {
  return s
    .split(/\n{2,}/)
    .map((p) => `<p>${esc(p.trim()).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

function fmtDate(iso?: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('nl-NL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

function fmtNum(n: number, decimals = 2): string {
  return n.toLocaleString('nl-NL', { minimumFractionDigits: 0, maximumFractionDigits: decimals });
}

function badge(text: string, color: string, bg: string): string {
  return `<span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:8.5pt;font-weight:600;color:${color};background:${bg}">${esc(text)}</span>`;
}

function bandBadge(band: ExposureBand): string {
  const labels: Record<ExposureBand, string> = {
    A: 'Band A — < 10% OELV',
    B: 'Band B — 10–50% OELV',
    C: 'Band C — 50–100% OELV',
    D: 'Band D — > 100% OELV',
  };
  return badge(labels[band], BAND_COLOR[band], BAND_BG[band]);
}

function verdictBadge(verdict: MeasurementStatistics['verdict'], label: string): string {
  const map = {
    acceptable: { color: '#15803d', bg: '#dcfce7' },
    uncertain: { color: '#92400e', bg: '#fef9c3' },
    unacceptable: { color: '#991b1b', bg: '#fee2e2' },
  };
  const { color, bg } = map[verdict];
  return badge(label, color, bg);
}

function cmrBadge(cat: string): string {
  if (cat === '1A') return badge('CMR 1A', '#991b1b', '#fee2e2');
  if (cat === '1B') return badge('CMR 1B', '#9a3412', '#ffedd5');
  if (cat === '2') return badge('CMR 2', '#92400e', '#fef9c3');
  return '';
}

// ─── Data helpers ─────────────────────────────────────────────────────────────

function getPrimaryOEL(s: Substance): OELValue | null {
  const twas = s.oels.filter((o) => (o.period ?? 'tgg-8h') === 'tgg-8h' && o.value != null && o.value > 0);
  if (twas.length > 0) return twas[0];
  return s.oels.find((o) => o.value != null && o.value > 0) ?? null;
}

function computePlanStats(inv: Investigation, planId: string): MeasurementStatistics | null {
  const series = inv.measurementSeries.find((s) => s.planId === planId);
  if (!series) return null;
  const plan = inv.measurementPlans.find((p) => p.id === planId);
  if (!plan) return null;
  const substance = inv.substances.find((s) => s.id === plan.substanceId);
  if (!substance) return null;
  const oelEntry = getPrimaryOEL(substance);
  if (!oelEntry?.value) return null;
  const vals = series.measurements.filter((m) => !m.excluded && m.value > 0).map((m) => m.value);
  if (vals.length < 3) return null;
  return computeStats(vals, oelEntry.value, oelEntry.unit);
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

  /* ── Cover ──────────────────────────────────────────────────────────────── */
  .cover {
    height: 297mm;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    padding: 30mm 20mm;
    page-break-after: always;
    background: #fff;
  }
  .cover-logo { font-size: 20pt; font-weight: 800; color: #1c1c1c; margin-bottom: 30mm; letter-spacing: -0.5px; }
  .cover-logo span { color: #f97316; }
  .cover-tag { font-size: 9pt; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; color: #f97316; margin-bottom: 6mm; }
  .cover-title { font-size: 26pt; font-weight: 700; color: #111; line-height: 1.2; margin-bottom: 5mm; }
  .cover-sub { font-size: 12pt; color: #555; margin-bottom: 16mm; }
  .cover-divider { width: 60mm; height: 3px; background: #f97316; border-radius: 2px; margin-bottom: 12mm; }
  .cover-meta { font-size: 9pt; line-height: 1.9; color: #444; }
  .cover-meta strong { color: #1c1c1c; }

  /* ── Sections ────────────────────────────────────────────────────────────── */
  .section { page-break-before: always; padding-top: 4mm; }
  .section-header {
    border-bottom: 2px solid #f97316;
    padding-bottom: 3mm;
    margin-bottom: 6mm;
    display: flex;
    align-items: baseline;
    gap: 8px;
  }
  .section-num { font-size: 9pt; font-weight: 700; color: #f97316; }
  .section-title { font-size: 14pt; font-weight: 700; color: #111; }

  h3 { font-size: 10.5pt; font-weight: 700; color: #1c1c1c; margin: 5mm 0 2mm 0; }
  h4 { font-size: 9.5pt; font-weight: 700; color: #374151; margin: 4mm 0 1.5mm 0; }

  p { margin-bottom: 2mm; }

  /* ── Card (per substance/task) ───────────────────────────────────────────── */
  .card {
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    margin-bottom: 6mm;
    page-break-inside: avoid;
    overflow: hidden;
  }
  .card-header {
    background: #f9fafb;
    border-bottom: 1px solid #e5e7eb;
    padding: 3mm 4mm;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .card-header-title { font-size: 10pt; font-weight: 700; color: #111; }
  .card-body { padding: 4mm; }

  /* ── Tables ──────────────────────────────────────────────────────────────── */
  table { width: 100%; border-collapse: collapse; font-size: 8.5pt; margin-bottom: 3mm; }
  th {
    background: #f3f4f6;
    text-align: left;
    padding: 2mm 3mm;
    font-size: 7.5pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    color: #6b7280;
    border-bottom: 1px solid #e5e7eb;
  }
  td { padding: 2mm 3mm; vertical-align: top; border-bottom: 1px solid #f3f4f6; color: #374151; }
  tr:last-child td { border-bottom: none; }
  tr:nth-child(even) td { background: #fafafa; }
  .num { text-align: right; font-variant-numeric: tabular-nums; }
  .mono { font-family: "Courier New", monospace; font-size: 8pt; }

  /* ── Two-column property grid ────────────────────────────────────────────── */
  .props { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5mm 6mm; font-size: 8.5pt; }
  .props.three { grid-template-columns: 1fr 1fr 1fr; }
  .prop-label { font-size: 7.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px; color: #9ca3af; }
  .prop-value { color: #111; font-weight: 500; }

  /* ── Verdict ─────────────────────────────────────────────────────────────── */
  .verdict-block {
    border-left: 3px solid;
    padding: 2mm 3mm;
    border-radius: 0 4px 4px 0;
    margin-top: 2mm;
    font-size: 8.5pt;
  }
  .verdict-acceptable { border-color: #16a34a; background: #f0fdf4; }
  .verdict-uncertain   { border-color: #d97706; background: #fffbeb; }
  .verdict-unacceptable { border-color: #dc2626; background: #fef2f2; }

  /* ── Misc ────────────────────────────────────────────────────────────────── */
  .empty { color: #9ca3af; font-style: italic; font-size: 8.5pt; }
  .tag { display: inline-block; padding: 1px 6px; border-radius: 3px; font-size: 7.5pt; font-weight: 600; margin: 1px; }
  .tag-orange { background: #fff7ed; color: #c2410c; }
  .tag-blue   { background: #eff6ff; color: #1d4ed8; }
  .tag-red    { background: #fef2f2; color: #991b1b; }
  .tag-gray   { background: #f3f4f6; color: #374151; }
  .priority-star { color: #f97316; }

  /* ── Footer ──────────────────────────────────────────────────────────────── */
  @page { @bottom-center { content: "OHSHub · " attr(data-name) " · pagina " counter(page) " van " counter(pages); font-size: 7.5pt; color: #9ca3af; } }
`;

// ─── Section builders ─────────────────────────────────────────────────────────

function coverPage(inv: Investigation): string {
  const personLine = (p: { name: string; role?: string; organization?: string; address?: string; anonymous?: boolean }) => {
    if (p.anonymous) return 'Anoniem';
    return [p.name, p.role, p.organization, p.address].filter(Boolean).join(', ');
  };

  const investigators = inv.investigators.filter((p) => p.name || p.role).map(personLine);
  const clients = inv.clients.filter((p) => p.name || p.role).map(personLine);

  return `
  <div class="cover">
    <div class="cover-logo">OHS<span>Hub</span></div>
    <div class="cover-tag">Blootstellingsbeoordeling gevaarlijke stoffen</div>
    <div class="cover-title">${esc(inv.name)}</div>
    ${inv.scope.departments ? `<div class="cover-sub">${esc(inv.scope.departments)}</div>` : ''}
    <div class="cover-divider"></div>
    <div class="cover-meta">
      <div><strong>Datum:</strong> ${fmtDate(inv.createdAt)}</div>
      ${inv.scope.isPartOfRIE ? `<div><strong>Onderdeel van RI&amp;E:</strong> Ja</div>` : ''}
      ${inv.scope.workplaceAddress ? `<div><strong>Werklocatie:</strong> ${esc(inv.scope.workplaceAddress)}</div>` : ''}
      ${clients.length > 0 ? `<div><strong>Opdrachtgever${clients.length > 1 ? 's' : ''}:</strong> ${clients.map(esc).join('; ')}</div>` : ''}
      ${investigators.length > 0 ? `<div><strong>Onderzoeker${investigators.length > 1 ? 's' : ''}:</strong> ${investigators.map(esc).join('; ')}</div>` : ''}
      ${inv.report.nextReviewDate ? `<div><strong>Volgende herbeoordeling:</strong> ${fmtDate(inv.report.nextReviewDate)}</div>` : ''}
    </div>
  </div>`;
}

function sectionHeader(num: string, title: string): string {
  return `
  <div class="section-header">
    <span class="section-num">${num}</span>
    <span class="section-title">${title}</span>
  </div>`;
}

function scopeSection(inv: Investigation): string {
  const { scope } = inv;
  const questionLabel: Record<string, string> = {
    current: 'Huidige blootstellingssituatie',
    historical: 'Historische blootstelling',
    both: 'Huidige en historische blootstelling',
    '': '—',
  };
  const respondents = inv.respondents.filter((p) => p.name || p.role);

  return `
  <div class="section">
    ${sectionHeader('1', 'Opdracht &amp; kaders')}

    <div class="props" style="margin-bottom:4mm">
      <div>
        <div class="prop-label">Onderzoeksvraag</div>
        <div class="prop-value">${questionLabel[scope.question] ?? '—'}</div>
      </div>
      <div>
        <div class="prop-label">Onderdeel van RI&amp;E</div>
        <div class="prop-value">${scope.isPartOfRIE ? 'Ja' : 'Nee'}</div>
      </div>
      ${scope.atexApplicable || scope.arieApplicable ? `<div>
        <div class="prop-label">Bijzondere regelgeving</div>
        <div class="prop-value">${[scope.atexApplicable && 'ATEX', scope.arieApplicable && 'ARIE'].filter(Boolean).join(', ')}</div>
      </div>` : ''}
      ${scope.workplaceAddress ? `<div style="grid-column:span 2">
        <div class="prop-label">Werklocatie (§6(b) NEN-EN 689)</div>
        <div class="prop-value">${esc(scope.workplaceAddress)}</div>
      </div>` : ''}
      ${scope.departments ? `<div style="grid-column:span 2">
        <div class="prop-label">Afdelingen / locaties</div>
        <div class="prop-value">${esc(scope.departments)}</div>
      </div>` : ''}
    </div>

    ${scope.applicableNorms.length > 0 ? `
    <h3>Toepasselijke normen en kaders</h3>
    <ul style="padding-left:5mm;font-size:8.5pt;line-height:1.8">
      ${scope.applicableNorms.map((n) => `<li>${esc(NORM_LABEL[n] ?? n)}</li>`).join('')}
    </ul>` : ''}

    ${respondents.length > 0 ? `
    <h3>Respondenten</h3>
    <table>
      <thead><tr><th>Naam</th><th>Functie</th><th>Organisatie</th></tr></thead>
      <tbody>
        ${respondents.map((r) => `<tr>
          <td>${r.anonymous ? '<em>Anoniem</em>' : esc(r.name)}</td>
          <td>${esc(r.role)}</td>
          <td>${esc(r.organization)}</td>
        </tr>`).join('')}
      </tbody>
    </table>` : ''}

    ${scope.notes ? `<h3>Toelichting</h3><div style="font-size:8.5pt">${nl2p(scope.notes)}</div>` : ''}
  </div>`;
}

function oelTable(oels: OELValue[]): string {
  const active = oels.filter((o) => o.type !== 'none');
  if (active.length === 0) return `<span class="empty">Geen grenswaarden ingevuld</span>`;
  return `
  <table>
    <thead><tr>
      <th>Type</th><th>Waarde</th><th>Eenheid</th><th>Periode</th><th>Route</th><th>Bron</th>
    </tr></thead>
    <tbody>
      ${active.map((o) => `<tr>
        <td>${esc(OEL_TYPE_LABEL[o.type] ?? o.type)}</td>
        <td class="num">${o.value != null ? fmtNum(o.value, 4) : '—'}</td>
        <td>${esc(o.unit)}</td>
        <td>${o.period ? OEL_PERIOD_LABEL[o.period] ?? o.period : '—'}</td>
        <td>${(o.routes ?? []).map(esc).join(', ') || '—'}</td>
        <td style="font-size:7.5pt;color:#6b7280">${esc(o.source)}</td>
      </tr>`).join('')}
    </tbody>
  </table>`;
}

function substancesSection(inv: Investigation): string {
  if (inv.substances.length === 0) {
    return `<div class="section">${sectionHeader('2', 'Stoffen')}<p class="empty">Geen stoffen geregistreerd.</p></div>`;
  }

  const cards = inv.substances.map((s, i) => {
    const physProps: string[] = [];
    if (s.aggregateState) physProps.push(`<div><div class="prop-label">Aggregatietoestand</div><div class="prop-value">${esc(STATE_LABEL[s.aggregateState])}</div></div>`);
    if (s.vapourPressure != null) physProps.push(`<div><div class="prop-label">Dampspanning (20°C)</div><div class="prop-value">${fmtNum(s.vapourPressure, 3)} ${esc(s.vapourPressureUnit ?? 'kPa')}</div></div>`);
    if (s.boilingPoint != null) physProps.push(`<div><div class="prop-label">Kookpunt</div><div class="prop-value">${fmtNum(s.boilingPoint, 1)} °C</div></div>`);
    if (s.flashPoint != null) physProps.push(`<div><div class="prop-label">Vlampunt</div><div class="prop-value">${fmtNum(s.flashPoint, 1)} °C</div></div>`);
    if (s.lel != null || s.uel != null) physProps.push(`<div><div class="prop-label">Explosiegrens</div><div class="prop-value">LEL ${s.lel ?? '—'} % / UEL ${s.uel ?? '—'} %</div></div>`);
    if (s.dustiness) {
      const d: Record<string, string> = { low: 'Laag', medium: 'Middel', high: 'Hoog' };
      physProps.push(`<div><div class="prop-label">Stuifpotentieel</div><div class="prop-value">${d[s.dustiness] ?? s.dustiness}</div></div>`);
    }

    const flags: string[] = [];
    if (s.sdsAvailable) flags.push(`<span class="tag tag-blue">VIB/SDS beschikbaar</span>`);
    if (s.isAtex) flags.push(`<span class="tag tag-orange">ATEX-relevant</span>`);
    if (s.isArie) flags.push(`<span class="tag tag-orange">ARIE-relevant</span>`);
    if (s.isSensitizing) flags.push(`<span class="tag tag-red">Sensibiliserend</span>`);
    if (s.skinNotation) flags.push(`<span class="tag tag-red">H-notatie (huid)</span>`);

    return `
    <div class="card">
      <div class="card-header">
        <span class="card-header-title">${i + 1}. ${esc(s.productName)}</span>
        ${cmrBadge(s.cmrCategory)}
        ${s.casNr ? `<span style="font-size:8pt;color:#6b7280;margin-left:auto">CAS ${esc(s.casNr)}</span>` : ''}
      </div>
      <div class="card-body">

        <div class="props" style="margin-bottom:3mm">
          ${s.iupacName ? `<div><div class="prop-label">IUPAC-naam</div><div class="prop-value">${esc(s.iupacName)}</div></div>` : ''}
          ${s.egNr ? `<div><div class="prop-label">EG-nummer</div><div class="prop-value">${esc(s.egNr)}</div></div>` : ''}
          ${s.reachNr ? `<div><div class="prop-label">REACH-registratie</div><div class="prop-value">${esc(s.reachNr)}</div></div>` : ''}
          ${s.hStatements ? `<div style="grid-column:span 2"><div class="prop-label">H-zinnen</div><div class="prop-value mono">${esc(s.hStatements)}</div></div>` : ''}
        </div>

        ${physProps.length > 0 ? `<div class="props three" style="margin-bottom:3mm">${physProps.join('')}</div>` : ''}

        ${flags.length > 0 ? `<div style="margin-bottom:3mm">${flags.join('')}</div>` : ''}

        <h4>Grenswaarden (OELV)</h4>
        ${oelTable(s.oels)}

        ${s.notes ? `<div style="margin-top:2mm;font-size:8.5pt;color:#6b7280;border-top:1px solid #f3f4f6;padding-top:2mm">${nl2p(s.notes)}</div>` : ''}
      </div>
    </div>`;
  }).join('');

  return `<div class="section">${sectionHeader('2', 'Stoffen')}${cards}</div>`;
}

function tasksSection(inv: Investigation): string {
  if (inv.tasks.length === 0) {
    return `<div class="section">${sectionHeader('3', 'Werkzaamheden')}<p class="empty">Geen werkzaamheden geregistreerd.</p></div>`;
  }

  const cards = inv.tasks.map((t, i) => {
    const subNames = t.substanceIds
      .map((id) => inv.substances.find((s) => s.id === id)?.productName ?? '?')
      .join(', ');

    const ppeLabels = t.ppe.length > 0
      ? t.ppe.map((p) => PPE_LABEL[p] ?? p).join('; ')
      : 'Geen PBM';

    return `
    <div class="card">
      <div class="card-header">
        <span class="card-header-title">${i + 1}. ${esc(t.description)}</span>
        ${t.department ? `<span style="font-size:8pt;color:#6b7280">${esc(t.department)}</span>` : ''}
        ${t.jobTitle ? `<span style="font-size:8pt;color:#6b7280;margin-left:auto">${esc(t.jobTitle)}</span>` : ''}
      </div>
      <div class="card-body">
        <div class="props three">
          <div><div class="prop-label">Procesvorm</div><div class="prop-value">${esc(PROCESS_LABEL[t.processType] ?? t.processType)}</div></div>
          <div><div class="prop-label">Hoeveelheid</div><div class="prop-value">${esc(t.quantityPerTask)}</div></div>
          <div><div class="prop-label">Duur/dag</div><div class="prop-value">${esc(t.durationPerDay)}</div></div>
          <div><div class="prop-label">Frequentie</div><div class="prop-value">${esc(t.frequency)}</div></div>
          <div><div class="prop-label">LEV</div><div class="prop-value">${esc(LEV_LABEL[t.lev] ?? t.lev)}${t.levCheck && t.lev !== 'none' ? ` (${t.levCheck === 'recent' ? 'recent gekeurd' : t.levCheck === 'outdated' ? 'keuring verlopen' : 'nooit gekeurd'})` : ''}</div></div>
          <div><div class="prop-label">Ventilatie</div><div class="prop-value">${esc(VENTILATION_LABEL[t.ventilation] ?? t.ventilation)}</div></div>
          <div><div class="prop-label">Ruimte</div><div class="prop-value">${esc(ROOM_LABEL[t.roomSize] ?? t.roomSize)}</div></div>
          <div><div class="prop-label">PBM</div><div class="prop-value">${esc(ppeLabels)}</div></div>
        </div>
        ${subNames ? `<div style="margin-top:2.5mm;font-size:8pt;color:#6b7280">Stoffen: ${esc(subNames)}</div>` : ''}
        ${t.notes ? `<div style="margin-top:2mm;font-size:8.5pt;color:#6b7280;border-top:1px solid #f3f4f6;padding-top:2mm">${nl2p(t.notes)}</div>` : ''}
      </div>
    </div>`;
  }).join('');

  return `<div class="section">${sectionHeader('3', 'Werkzaamheden')}${cards}</div>`;
}

function assessmentSection(inv: Investigation): string {
  if (inv.initialEstimates.length === 0) {
    return `<div class="section">${sectionHeader('4', 'Initiële beoordeling (Tier-1)')}<p class="empty">Geen beoordelingen ingevuld.</p></div>`;
  }

  const rows = inv.initialEstimates.map((est) => {
    const task = inv.tasks.find((t) => t.id === est.taskId);
    const substance = inv.substances.find((s) => s.id === est.substanceId);
    return `<tr>
      <td>${esc(task?.description ?? '—')}${task?.department ? `<br><span style="font-size:7.5pt;color:#9ca3af">${esc(task.department)}</span>` : ''}</td>
      <td>${esc(substance?.productName ?? '—')}${substance?.casNr ? `<br><span class="mono" style="font-size:7.5pt;color:#9ca3af">${esc(substance.casNr)}</span>` : ''}</td>
      <td style="text-align:center">${bandBadge(est.tier1.band)}</td>
      <td class="num" style="font-size:7.5pt;color:#6b7280">${fmtNum(est.tier1.score, 1)}</td>
      <td>${esc(DECISION_LABEL[est.decision] ?? est.decision)}</td>
      ${est.decisionNotes ? `<td style="font-size:7.5pt;color:#6b7280">${esc(est.decisionNotes)}</td>` : '<td></td>'}
    </tr>`;
  }).join('');

  return `
  <div class="section">
    ${sectionHeader('4', 'Initiële beoordeling (Tier-1)')}
    <table>
      <thead><tr>
        <th>Werkzaamheid</th><th>Stof</th><th>Band</th><th>Score</th><th>Besluit</th><th>Toelichting</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
}

function segSection(inv: Investigation): string {
  if (inv.segs.length === 0) {
    return `<div class="section">${sectionHeader('5', "VBG's (Vergelijkbare Blootstellingsgroepen)")}<p class="empty">Geen VBG's gedefinieerd.</p></div>`;
  }

  const cards = inv.segs.map((seg, i) => {
    const tasks = seg.taskIds
      .map((tid) => inv.tasks.find((t) => t.id === tid)?.description ?? '?')
      .join('; ');

    return `
    <div class="card">
      <div class="card-header">
        <span class="card-header-title">${i + 1}. ${esc(seg.name)}</span>
        <span style="font-size:8pt;color:#6b7280;margin-left:auto">${seg.workerCount} medewerker${seg.workerCount !== 1 ? 's' : ''}</span>
      </div>
      <div class="card-body">
        ${seg.description ? `<p style="font-size:8.5pt;margin-bottom:2mm">${esc(seg.description)}</p>` : ''}
        ${tasks ? `<div style="font-size:8pt;color:#6b7280">Werkzaamheden: ${esc(tasks)}</div>` : ''}
        ${seg.notes ? `<div style="margin-top:2mm;font-size:8.5pt;color:#6b7280;border-top:1px solid #f3f4f6;padding-top:2mm">${nl2p(seg.notes)}</div>` : ''}
      </div>
    </div>`;
  }).join('');

  return `<div class="section">${sectionHeader('5', "VBG's (Vergelijkbare Blootstellingsgroepen)")}${cards}</div>`;
}

function measurementPlanSection(inv: Investigation): string {
  if (inv.measurementPlans.length === 0) {
    return `<div class="section">${sectionHeader('6', 'Meetplan')}<p class="empty">Geen meetplannen aangemaakt.</p></div>`;
  }

  const typeLabel: Record<string, string> = {
    '8h-tgg': '8-uurs TGG',
    '15min': '15-min STEL',
    ceiling: 'Plafondwaarde',
  };

  const rows = inv.measurementPlans.map((p) => {
    const seg = inv.segs.find((s) => s.id === p.segId);
    const substance = inv.substances.find((s) => s.id === p.substanceId);
    const oelEntry = substance ? getPrimaryOEL(substance) : null;
    return `<tr>
      <td>${esc(seg?.name ?? '—')}</td>
      <td>${esc(substance?.productName ?? '—')}</td>
      <td>${esc(typeLabel[p.measurementType] ?? p.measurementType)}</td>
      <td class="num">${p.plannedCount}</td>
      <td>${esc(p.method)}</td>
      <td>${esc(p.lab)}</td>
      <td>${p.plannedDate ? fmtDate(p.plannedDate) : '—'}</td>
      <td>${oelEntry?.value ? `${fmtNum(oelEntry.value, 4)} ${esc(oelEntry.unit)}` : '—'}</td>
    </tr>`;
  }).join('');

  return `
  <div class="section">
    ${sectionHeader('6', 'Meetplan')}
    <table>
      <thead><tr>
        <th>VBG</th><th>Stof</th><th>Type</th><th>Aantal</th><th>Methode</th><th>Laboratorium</th><th>Gepland</th><th>OELV</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
}

function measurementsSection(inv: Investigation): string {
  const plansWithData = inv.measurementPlans.filter((p) => {
    const s = inv.measurementSeries.find((ms) => ms.planId === p.id);
    return s && s.measurements.filter((m) => !m.excluded && m.value > 0).length > 0;
  });

  if (plansWithData.length === 0) {
    return `<div class="section">${sectionHeader('7', 'Meetresultaten &amp; statistiek')}<p class="empty">Nog geen meetresultaten ingevoerd.</p></div>`;
  }

  const typeLabel: Record<string, string> = {
    '8h-tgg': '8-uurs TGG',
    '15min': '15-min STEL',
    ceiling: 'Plafondwaarde',
  };

  const blocks = plansWithData.map((plan) => {
    const seg = inv.segs.find((s) => s.id === plan.segId);
    const substance = inv.substances.find((s) => s.id === plan.substanceId);
    const series = inv.measurementSeries.find((s) => s.planId === plan.id);
    if (!series) return '';

    const stats = computePlanStats(inv, plan.id);
    const oelEntry = substance ? getPrimaryOEL(substance) : null;

    const valueRows = series.measurements.map((m) => `<tr${m.excluded ? ' style="opacity:0.5"' : ''}>
      <td>${m.date ? fmtDate(m.date) : '—'}</td>
      <td style="white-space:nowrap">${m.samplingStartTime ?? '—'}&nbsp;–&nbsp;${m.samplingEndTime ?? '—'}</td>
      <td class="num">${fmtNum(m.value, 4)}</td>
      <td>${esc(oelEntry?.unit ?? '?')}</td>
      <td>${m.conditions ? esc(m.conditions) : '—'}</td>
      <td>${m.excluded ? `<span style="color:#dc2626">Uitgesloten${m.exclusionReason ? ': ' + esc(m.exclusionReason) : ''}</span>` : '✓'}</td>
    </tr>`).join('');

    const verdictClass = stats ? `verdict-${stats.verdict}` : '';

    return `
    <div class="card" style="page-break-inside:avoid">
      <div class="card-header">
        <span class="card-header-title">${esc(seg?.name ?? '—')} × ${esc(substance?.productName ?? '—')}</span>
        <span style="font-size:8pt;color:#6b7280;margin-left:auto">${esc(typeLabel[plan.measurementType] ?? plan.measurementType)}</span>
      </div>
      <div class="card-body">
        <table>
          <thead><tr><th>Datum</th><th>Begin – Eind</th><th>Waarde</th><th>Eenheid</th><th>Omstandigheden</th><th>Status</th></tr></thead>
          <tbody>${valueRows}</tbody>
        </table>

        ${stats ? `
        <h4>Statistisch rapport — NEN-EN 689:2018+C1:2019${stats.testMethod === 'bijlage-f' ? ', Bijlage F' : ', §5.5.2'}</h4>
        <div class="props three">
          <div><div class="prop-label">Aantal metingen (n)</div><div class="prop-value">${stats.n}</div></div>
          <div><div class="prop-label">Geom. gemiddelde (GM)</div><div class="prop-value">${fmtNum(stats.gm, 4)} ${esc(stats.unit)}</div></div>
          <div><div class="prop-label">Geom. standaard&shy;afwijking (GSD)</div><div class="prop-value">${fmtNum(stats.gsd, 3)}</div></div>
          <div><div class="prop-label">95e percentiel (P95)</div><div class="prop-value">${fmtNum(stats.p95, 4)} ${esc(stats.unit)}</div></div>
          <div><div class="prop-label">OELV</div><div class="prop-value">${fmtNum(stats.oelv, 4)} ${esc(stats.unit)}</div></div>
          <div><div class="prop-label">P95 als % van OELV</div><div class="prop-value">${fmtNum(stats.p95PctOfOelv, 1)} %</div></div>
          <div><div class="prop-label">Overschrijdings&shy;fractie</div><div class="prop-value">${fmtNum(stats.overshootFraction * 100, 2)} %</div></div>
          ${stats.testMethod === 'bijlage-f' && stats.ur != null && stats.ut != null ? `
          <div><div class="prop-label">U_R  [Bijlage F]</div><div class="prop-value">${fmtNum(stats.ur, 3)}</div></div>
          <div><div class="prop-label">U_T  (n=${stats.n}, Tabel F.1)</div><div class="prop-value">${fmtNum(stats.ut, 3)}</div></div>` : ''}
        </div>
        <div class="verdict-block ${verdictClass}">
          <strong>Oordeel:</strong> ${verdictBadge(stats.verdict, stats.verdictLabel)}
        </div>` : `
        <p style="font-size:8pt;color:#9ca3af;margin-top:2mm">Minimaal 3 geldige metingen en een OELV vereist voor statistisch rapport.</p>`}
      </div>
    </div>`;
  }).join('');

  const nen482Statement = `
  <p style="font-size:7.5pt;color:#6b7280;margin-top:6mm;padding-top:3mm;border-top:1px solid #e5e7eb">
    De meetmethoden zijn uitgevoerd conform de algemene eisen van <strong>NEN-EN 482</strong>
    (Workplace exposure — General requirements for the performance of procedures for the
    measurement of chemical agents). De statistische beoordeling is uitgevoerd conform
    <strong>NEN-EN 689:2018+C1:2019</strong>.
  </p>`;

  return `<div class="section">${sectionHeader('7', 'Meetresultaten &amp; statistiek')}${blocks}${nen482Statement}</div>`;
}

function controlMeasuresSection(inv: Investigation): string {
  if (inv.controlMeasures.length === 0) {
    return `<div class="section">${sectionHeader('8', 'Beheersmaatregelen')}<p class="empty">Geen beheersmaatregelen geregistreerd.</p></div>`;
  }

  const sorted = [...inv.controlMeasures].sort((a, b) => a.priority - b.priority);

  const rows = sorted.map((m) => {
    const stars = '★'.repeat(m.priority) + '☆'.repeat(5 - m.priority);
    const statusColors: Record<string, string> = {
      planned: '#6b7280',
      'in-progress': '#d97706',
      completed: '#16a34a',
    };
    return `<tr>
      <td>${esc(CONTROL_TYPE_LABEL[m.type] ?? m.type)}</td>
      <td>${esc(m.description)}${m.targetDescription ? `<br><span style="font-size:7.5pt;color:#9ca3af">${esc(m.targetDescription)}</span>` : ''}</td>
      <td style="font-size:8pt;color:#f97316;white-space:nowrap">${esc(stars)}</td>
      <td>${esc(m.responsible)}</td>
      <td>${m.deadline ? fmtDate(m.deadline) : '—'}</td>
      <td style="color:${statusColors[m.status] ?? '#6b7280'};font-weight:600">${esc(STATUS_LABEL[m.status] ?? m.status)}</td>
    </tr>`;
  }).join('');

  return `
  <div class="section">
    ${sectionHeader('8', 'Beheersmaatregelen (AHS-hiërarchie)')}
    <table>
      <thead><tr>
        <th>Type</th><th>Maatregel</th><th>Prioriteit</th><th>Verantwoordelijke</th><th>Deadline</th><th>Status</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
}

function conclusionSection(inv: Investigation): string {
  const { report } = inv;
  const triggers = report.nextReviewTriggers ?? [];

  const TRIGGER_LABELS: Record<string, string> = {
    'new-substance': 'Nieuwe stof in gebruik genomen',
    'process-change': 'Proceswijziging of nieuwe werkwijze',
    incident: 'Incident of bijna-incident',
    'health-complaint': 'Gezondheidsklachten bij medewerkers',
    legislation: 'Nieuwe of gewijzigde wetgeving / grenswaarden',
    periodic: 'Periodieke herbeoordeling',
  };

  return `
  <div class="section">
    ${sectionHeader('9', 'Conclusie &amp; rapportage')}

    ${report.conclusion ? `
    <h3>Conclusie</h3>
    <div style="font-size:9pt">${nl2p(report.conclusion)}</div>` : ''}

    <div class="props" style="margin-top:4mm">
      ${report.nextReviewDate ? `<div>
        <div class="prop-label">Volgende herbeoordeling</div>
        <div class="prop-value">${fmtDate(report.nextReviewDate)}</div>
      </div>` : ''}
    </div>

    ${triggers.length > 0 ? `
    <h3>Aanleidingen voor herbeoordeling</h3>
    <ul style="padding-left:5mm;font-size:8.5pt;line-height:1.8">
      ${triggers.map((t) => `<li>${esc(TRIGGER_LABELS[t] ?? t)}</li>`).join('')}
    </ul>` : ''}

    ${report.historicalNotes ? `
    <h3>Historische aantekeningen &amp; wijzigingslog</h3>
    <div style="font-size:8.5pt">${nl2p(report.historicalNotes)}</div>` : ''}

    <div style="margin-top:12mm;padding-top:4mm;border-top:1px solid #e5e7eb;font-size:8pt;color:#9ca3af;display:flex;justify-content:space-between">
      <span>Gegenereerd door OHSHub · ${new Date().toLocaleDateString('nl-NL', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
      <span>${esc(inv.name)}</span>
    </div>
  </div>`;
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function generatePDFHtml(inv: Investigation): string {
  const sections = [
    coverPage(inv),
    scopeSection(inv),
    substancesSection(inv),
    tasksSection(inv),
    assessmentSection(inv),
    segSection(inv),
    measurementPlanSection(inv),
    measurementsSection(inv),
    controlMeasuresSection(inv),
    conclusionSection(inv),
  ].join('\n');

  return `<!DOCTYPE html>
<html lang="nl" data-name="${esc(inv.name)}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Rapport — ${esc(inv.name)}</title>
  <style>${CSS}</style>
</head>
<body>
${sections}
<script>
  window.addEventListener('load', function() {
    setTimeout(function() { window.print(); }, 400);
  });
</script>
</body>
</html>`;
}

export function downloadPDF(inv: Investigation): void {
  const html = generatePDFHtml(inv);
  const win = window.open('', '_blank', 'width=960,height=800,menubar=no,toolbar=no');
  if (!win) {
    // Popup blocked — fall back to blob download of the HTML file
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${inv.name.replace(/\s+/g, '-').slice(0, 50)}-rapport.html`;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
}
