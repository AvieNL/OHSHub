import { SZW_GRENSWAARDEN, SZW_VERSION, SZW_SOURCE } from './szw';
import { EU_OEL_LIST, EU_OEL_VERSION, EU_OEL_SOURCE } from './eu-oel';

export { SZW_VERSION, SZW_SOURCE, EU_OEL_VERSION, EU_OEL_SOURCE };

export interface OELMatch {
  type: 'szw' | 'eu-oel';
  name: string;
  tgg8h_mgm3?: number;
  tgg8h_ppm?: number;
  tgg15min_mgm3?: number;
  tgg15min_ppm?: number;
  ceiling_mgm3?: number;
  ceiling_ppm?: number;
  hNotatie?: boolean;
  binding?: boolean;        // EU-OEL only
  source: string;
  version: string;
  directive?: string;
  notes?: string;
}

// Normalize CAS: strip leading zeros from last segment (e.g. "431-03-08" → "431-03-8")
function normalizeCAS(cas: string): string {
  return cas.trim().replace(/-0+(\d+)$/, '-$1');
}

/**
 * Look up official OEL values for a given CAS number.
 * SZW is always primary (legally binding in NL).
 * EU-OEL is returned only when no SZW match is found.
 */
export function lookupOELByCAS(cas: string): OELMatch[] {
  if (!cas.trim()) return [];
  const normalized = normalizeCAS(cas);

  // SZW lookup
  const szw = SZW_GRENSWAARDEN.find((e) =>
    e.cas.some((c) => normalizeCAS(c) === normalized),
  );
  if (szw) {
    return [{
      type: 'szw',
      name: szw.name,
      tgg8h_mgm3: szw.tgg8h_mgm3,
      tgg8h_ppm: szw.tgg8h_ppm,
      tgg15min_mgm3: szw.tgg15min_mgm3,
      tgg15min_ppm: szw.tgg15min_ppm,
      ceiling_mgm3: szw.ceiling_mgm3,
      ceiling_ppm: szw.ceiling_ppm,
      hNotatie: szw.hNotatie,
      source: SZW_SOURCE,
      version: SZW_VERSION,
      notes: szw.notes,
    }];
  }

  // EU-OEL fallback (substance not in SZW list)
  const eu = EU_OEL_LIST.find((e) =>
    e.cas.some((c) => normalizeCAS(c) === normalized),
  );
  if (eu) {
    return [{
      type: 'eu-oel',
      name: eu.name,
      tgg8h_mgm3: eu.tgg8h_mgm3,
      tgg8h_ppm: eu.tgg8h_ppm,
      tgg15min_mgm3: eu.tgg15min_mgm3,
      tgg15min_ppm: eu.tgg15min_ppm,
      hNotatie: false,
      binding: eu.binding,
      source: EU_OEL_SOURCE,
      version: EU_OEL_VERSION,
      directive: eu.directive,
      notes: eu.notes,
    }];
  }

  return [];
}
