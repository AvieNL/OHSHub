import type { Metadata } from 'next';
import InvestigationApp from '@/components/investigation/InvestigationApp';
import InvestigationThemePage from '@/components/InvestigationThemePage';
import { THEME_LEGAL_INFO } from '@/lib/theme-legal-info';
import { themes } from '@/lib/themes';
import { getNamespaceContent } from '@/lib/content';

export const metadata: Metadata = {
  title: 'Gevaarlijke stoffen — OHSHub',
  description:
    'Volledig onderzoeksinstrument voor gevaarlijke stoffen conform NEN-EN 689:2018, Arbobesluit hoofdstuk 4, REACH en CLP.',
};

const theme = themes.find((t) => t.slug === 'hazardous-substances')!;
const legalInfo = THEME_LEGAL_INFO['hazardous-substances'];

const FALLBACK_TITLE = 'Gevaarlijke stoffen';
const FALLBACK_DESC =
  'Volledig onderzoeksinstrument voor chemische blootstelling op de werkplek — van stoffeninventarisatie en blootstellingsbeoordeling tot meetstrategie, NEN-EN 689 statistieken en maatregelenbeheer.';

export default async function HazardousSubstancesPage() {
  const [legalOverrides, themeOverrides, stepContent] = await Promise.all([
    getNamespaceContent('theme-legal.hazardous-substances'),
    getNamespaceContent('theme.hazardous-substances'),
    getNamespaceContent('investigation.hazardous-substances'),
  ]);

  return (
    <InvestigationThemePage
      slug="hazardous-substances"
      theme={theme}
      legalInfo={legalInfo}
      fallbackTitle={FALLBACK_TITLE}
      fallbackDesc={FALLBACK_DESC}
      pageTitle={themeOverrides['pageTitle'] ?? FALLBACK_TITLE}
      pageDesc={themeOverrides['pageDesc'] ?? FALLBACK_DESC}
      legalOverrides={legalOverrides}
    >
      <InvestigationApp stepContent={stepContent} />
    </InvestigationThemePage>
  );
}
