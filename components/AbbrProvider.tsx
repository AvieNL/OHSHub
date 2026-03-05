'use client';

import { createContext, useContext } from 'react';
import { ABBR_TITLES } from '@/components/Abbr';

/**
 * Context met de volledige afkortingentabel: hardcoded ABBR_TITLES + DB-overrides.
 * Standaardwaarde = alleen de hardcoded tabel (werkt buiten de provider).
 */
const AbbrContext = createContext<Record<string, string>>(ABBR_TITLES);

export const useAbbrTitles = () => useContext(AbbrContext);

/**
 * Provider — zet in app/layout.tsx met server-gefetched customAbbr.
 * Merge-volgorde: hardcoded wordt overschreven door DB-waarden.
 */
export default function AbbrProvider({
  customAbbr,
  children,
}: {
  customAbbr: Record<string, string>;
  children: React.ReactNode;
}) {
  const merged = { ...ABBR_TITLES, ...customAbbr };
  return <AbbrContext.Provider value={merged}>{children}</AbbrContext.Provider>;
}
