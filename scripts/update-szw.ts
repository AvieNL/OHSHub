/**
 * update-szw.ts
 *
 * Fetches Bijlage XIII from the Arboregeling (BWBR0008587) on wetten.overheid.nl
 * and writes /data/oels/szw.ts with parsed OEL data.
 *
 * Run with:
 *   npx tsx scripts/update-szw.ts
 *   # or: node --loader ts-node/esm scripts/update-szw.ts
 *
 * Source: https://wetten.overheid.nl/BWBR0008587/2025-02-01/Bijlage-XIII
 * The server redirects date queries to the most recent version in force.
 *
 * Table columns (bijlage XIII):
 *   0  ISO-naam van de stof
 *   1  CAS-nummer
 *   2  TGG 8u in mg/m³
 *   3  TGG 8u in ppm
 *   4  C (ceiling flag — literal "C" or numeric ceiling)
 *   5  TGG 15min in mg/m³
 *   6  TGG 15min in ppm
 *   7  H (skin notation flag — literal "H")
 *
 * Edge cases handled:
 *   - Sub-entries ("– damp", "– stof", "– druppels") are folded into parent entry
 *   - Continuation rows (3 cols) that overflow the TGG-8u cell of the previous row
 *   - Dutch number format: "1.210" = 1210, "0,05" = 0.05
 *   - Ceiling column: "C" = flag only (value in tgg8h applies); numeric = separate ceiling
 *   - Ozon has a "(TGG 1uur)" annotation — preserved in notes
 *   - Footnote superscripts stripped from substance names
 */

import { writeFileSync } from 'fs';
import { join } from 'path';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SZWEntry {
  name: string;
  cas: string[];
  tgg8h_mgm3?: number;
  tgg8h_ppm?: number;
  tgg15min_mgm3?: number;
  tgg15min_ppm?: number;
  ceiling_mgm3?: number;
  ceiling_ppm?: number;
  hNotatie: boolean;
  notes?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Strip HTML tags and decode common entities */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

/**
 * Parse a Dutch-formatted number:
 *   "1.210"  → 1210    (period = thousands separator)
 *   "0,05"   → 0.05    (comma = decimal separator)
 *   "3.600"  → 3600
 *   "48,7"   → 48.7
 * Returns undefined for empty / non-numeric strings.
 */
function parseNL(raw: string): number | undefined {
  // Normalise: remove thousand-separators (periods NOT followed by digits that
  // look like decimals), then swap comma for decimal point.
  const s = raw.trim();
  if (!s) return undefined;
  // Remove leading/trailing parentheticals like "(TGG 1uur)"
  const clean = s.replace(/\s*\([^)]+\)/g, '').trim();
  if (!clean) return undefined;
  // Dutch: thousands = '.', decimal = ','
  const normalised = clean.replace(/\./g, '').replace(',', '.');
  const n = parseFloat(normalised);
  return isNaN(n) ? undefined : n;
}

/** Split a CAS string that may contain multiple numbers separated by / or , */
function parseCAS(raw: string): string[] {
  if (!raw) return [];
  return raw
    .split(/[/,;]/)
    .map(s => s.trim())
    .filter(s => /\d/.test(s));
}

// ─── Fetch ────────────────────────────────────────────────────────────────────

const URL =
  'https://wetten.overheid.nl/BWBR0008587/2025-02-01/Bijlage-XIII';

async function fetchPage(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'OHSHub-Updater/1.0 (+https://github.com/ohshub)' },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

// ─── Parse ────────────────────────────────────────────────────────────────────

function extractTable(html: string): string {
  const bijlageStart = html.indexOf('id="BijlageXIII"');
  if (bijlageStart === -1) throw new Error('BijlageXIII anchor not found in page');
  const tableStart = html.indexOf('<table', bijlageStart);
  if (tableStart === -1) throw new Error('OEL table not found after BijlageXIII anchor');
  const tableEnd = html.indexOf('</table>', tableStart);
  return html.slice(tableStart, tableEnd + 8);
}

function extractVersion(html: string): string {
  // The permalink inside the BijlageXIII section contains z=YYYY-MM-DD
  const chunk = html.slice(html.indexOf('id="BijlageXIII"'));
  const m = chunk.match(/bijlage=XIII&(?:amp;)?z=(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : 'unknown';
}

interface RawRow {
  cells: string[]; // cleaned text per cell
}

function parseRows(tableHtml: string): RawRow[] {
  const rows: RawRow[] = [];
  const rowRe = /<tr class="(?:odd|even)">(.*?)<\/tr>/gs;
  let m: RegExpExecArray | null;
  while ((m = rowRe.exec(tableHtml)) !== null) {
    const rowHtml = m[1];
    const cells: string[] = [];
    const cellRe = /<td[^>]*>(.*?)<\/td>/gs;
    let cm: RegExpExecArray | null;
    while ((cm = cellRe.exec(rowHtml)) !== null) {
      cells.push(stripHtml(cm[1]));
    }
    rows.push({ cells });
  }
  return rows;
}

/**
 * Merge raw rows into logical entries, handling:
 *   - Sub-rows ("– damp", "– druppels", "– stof", "– nevel")
 *   - Continuation rows (3 cells, overflow from TGG-8u mg/m³ cell)
 */
function mergeRows(rawRows: RawRow[]): SZWEntry[] {
  const entries: SZWEntry[] = [];
  let pending: SZWEntry | null = null;
  let pendingNeedsContin = false; // true when row 94 Mangaan had its value split

  for (let i = 0; i < rawRows.length; i++) {
    const { cells } = rawRows[i];
    const ncols = cells.length;

    // ── 3-column continuation row (e.g. row 95: "0,0510") ──
    // These appear after an 8-col row whose TGG-8u value was split.
    // Column layout: [mg/m³ continuation] [empty] [empty]
    if (ncols === 3 && pending) {
      // Append the continuation value as the second line of tgg8h_mgm3 notes
      const contVal = parseNL(cells[0]);
      if (contVal !== undefined) {
        const note = `tgg8h_mgm3 also listed as ${contVal}`;
        pending.notes = pending.notes ? `${pending.notes}; ${note}` : note;
      }
      continue;
    }

    // ── 4-column sub-row (e.g. "– damp" / "– stof" for 1,6-Hexanolactam) ──
    // Columns: [sub-type] [tgg8h_mgm3] [empty] [empty]
    if (ncols === 4 && cells[0].startsWith('–') && pending) {
      const sub = cells[0].replace('–', '').trim();
      const mgm3 = parseNL(cells[1]);
      if (mgm3 !== undefined) {
        const note = `${sub}: TGG 8u ${mgm3} mg/m³`;
        pending.notes = pending.notes ? `${pending.notes}; ${note}` : note;
      }
      continue;
    }

    // ── 7-column sub-row (e.g. "– damp" / "– druppels" for Ethaan-1,2-diol) ──
    // Columns: [sub-type] [tgg8h_mgm3] [tgg8h_ppm] [C] [tgg15min_mgm3] [tgg15min_ppm] [H]
    if (ncols === 7 && cells[0].startsWith('–') && pending) {
      const sub = cells[0].replace('–', '').trim();
      const tgg8h = parseNL(cells[1]);
      const tgg8h_ppm = parseNL(cells[2]);
      const ceilFlag = cells[3];
      const tgg15 = parseNL(cells[4]);
      const tgg15_ppm = parseNL(cells[5]);
      const h = cells[6] === 'H';

      const parts: string[] = [`${sub}:`];
      if (tgg8h !== undefined) parts.push(`TGG 8u ${tgg8h} mg/m³`);
      if (tgg8h_ppm !== undefined) parts.push(`(${tgg8h_ppm} ppm)`);
      if (ceilFlag === 'C') parts.push('C');
      else if (parseNL(ceilFlag) !== undefined) parts.push(`ceiling ${parseNL(ceilFlag)} mg/m³`);
      if (tgg15 !== undefined) parts.push(`TGG 15min ${tgg15} mg/m³`);
      if (tgg15_ppm !== undefined) parts.push(`(${tgg15_ppm} ppm)`);
      if (h) { parts.push('H'); pending.hNotatie = true; }

      const note = parts.join(' ');
      pending.notes = pending.notes ? `${pending.notes}; ${note}` : note;
      continue;
    }

    // ── Normal 8-column row ──
    if (ncols === 8) {
      // Flush previous pending
      if (pending) entries.push(pending);

      const rawName = cells[0];
      const rawCas  = cells[1];

      // Strip footnote digits appended to name (e.g. "Aniline3" → "Aniline", footnote 3)
      let footNotes: string[] = [];
      const nameClean = rawName.replace(/(\d+)$/, (_, n) => {
        footNotes.push(`note ${n}`);
        return '';
      }).trim();

      // TGG 8u
      let tgg8h_notes: string | undefined;
      let tgg8h_mgm3: number | undefined;
      const raw8h = cells[2];
      if (raw8h.includes('(')) {
        // e.g. "0,12 (TGG 1uur)" — different time basis
        tgg8h_mgm3 = parseNL(raw8h);
        tgg8h_notes = raw8h.match(/\(([^)]+)\)/)?.[1];
      } else {
        tgg8h_mgm3 = parseNL(raw8h);
      }

      // Ceiling column: "C" = ceiling flag (value not separate), numeric = ceiling value
      const rawC = cells[4];
      let ceiling_mgm3: number | undefined;
      let ceilingFlag = false;
      if (rawC === 'C') {
        ceilingFlag = true;
      } else {
        ceiling_mgm3 = parseNL(rawC);
      }

      const notes: string[] = [];
      if (footNotes.length > 0) notes.push(...footNotes);
      if (tgg8h_notes) notes.push(`TGG time basis: ${tgg8h_notes}`);
      if (ceilingFlag) notes.push('ceiling (C)');

      pending = {
        name: nameClean,
        cas: parseCAS(rawCas),
        tgg8h_mgm3,
        tgg8h_ppm:    parseNL(cells[3]),
        tgg15min_mgm3: parseNL(cells[5]),
        tgg15min_ppm:  parseNL(cells[6]),
        ceiling_mgm3,
        hNotatie: cells[7] === 'H',
        notes: notes.length > 0 ? notes.join('; ') : undefined,
      };
      continue;
    }

    // ── Anything else: skip (header rows etc.) ──
  }

  if (pending) entries.push(pending);
  return entries;
}

// ─── Code generation ──────────────────────────────────────────────────────────

function formatEntry(e: SZWEntry): string {
  const lines: string[] = [];
  lines.push('  {');
  lines.push(`    name: ${JSON.stringify(e.name)},`);
  lines.push(`    cas: ${JSON.stringify(e.cas)},`);
  if (e.tgg8h_mgm3    !== undefined) lines.push(`    tgg8h_mgm3: ${e.tgg8h_mgm3},`);
  if (e.tgg8h_ppm     !== undefined) lines.push(`    tgg8h_ppm: ${e.tgg8h_ppm},`);
  if (e.tgg15min_mgm3 !== undefined) lines.push(`    tgg15min_mgm3: ${e.tgg15min_mgm3},`);
  if (e.tgg15min_ppm  !== undefined) lines.push(`    tgg15min_ppm: ${e.tgg15min_ppm},`);
  if (e.ceiling_mgm3  !== undefined) lines.push(`    ceiling_mgm3: ${e.ceiling_mgm3},`);
  if (e.ceiling_ppm   !== undefined) lines.push(`    ceiling_ppm: ${e.ceiling_ppm},`);
  lines.push(`    hNotatie: ${e.hNotatie},`);
  if (e.notes) lines.push(`    notes: ${JSON.stringify(e.notes)},`);
  lines.push('  }');
  return lines.join('\n');
}

function generateTS(entries: SZWEntry[], version: string): string {
  const blocks = entries.map(formatEntry).join(',\n');
  return `// AUTO-GENERATED — do not edit manually.
// Source: scripts/update-szw.ts
// Re-generate: npx tsx scripts/update-szw.ts

export const SZW_VERSION = '${version}';
export const SZW_SOURCE = 'Arboregeling bijlage XIII (BWBR0008587)';

export interface SZWEntry {
  /** ISO-naam van de stof */
  name: string;
  /** CAS-nummer(s) — one substance can have multiple */
  cas: string[];
  /** TGG 8 uur in mg/m³ */
  tgg8h_mgm3?: number;
  /** TGG 8 uur in ppm */
  tgg8h_ppm?: number;
  /** TGG 15 minuten in mg/m³ */
  tgg15min_mgm3?: number;
  /** TGG 15 minuten in ppm */
  tgg15min_ppm?: number;
  /** Ceiling (C) in mg/m³ — only present when a numeric ceiling is listed */
  ceiling_mgm3?: number;
  /** Ceiling (C) in ppm */
  ceiling_ppm?: number;
  /** H-notatie: skin absorption possible */
  hNotatie: boolean;
  /** Footnotes, special annotations, sub-form values */
  notes?: string;
}

export const SZW_GRENSWAARDEN: SZWEntry[] = [
${blocks},
];
`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Fetching', URL, '…');
  const html = await fetchPage(URL);
  console.log(`Page size: ${(html.length / 1024).toFixed(0)} kB`);

  const version = extractVersion(html);
  console.log('Version (inwerking datum BijlageXIII):', version);

  const tableHtml = extractTable(html);
  const rawRows = parseRows(tableHtml);
  console.log('Raw rows:', rawRows.length);

  const entries = mergeRows(rawRows);
  console.log('Parsed entries:', entries.length);

  // Stats
  const withH = entries.filter(e => e.hNotatie).length;
  const noCas = entries.filter(e => e.cas.length === 0).length;
  const withCeiling = entries.filter(e => e.ceiling_mgm3 !== undefined || (e.notes && e.notes.includes('ceiling'))).length;
  console.log(`  With H-notatie: ${withH}`);
  console.log(`  Without CAS: ${noCas}`);
  console.log(`  With ceiling: ${withCeiling}`);

  const outPath = join(import.meta.dirname ?? __dirname, '../data/oels/szw.ts');
  const ts = generateTS(entries, version);
  writeFileSync(outPath, ts, 'utf-8');
  console.log('Written:', outPath);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
