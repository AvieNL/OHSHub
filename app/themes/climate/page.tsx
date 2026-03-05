import type { Metadata } from 'next';
import ClimateInvestigationApp from '@/components/climate-investigation/ClimateInvestigationApp';
import InvestigationThemePage from '@/components/InvestigationThemePage';
import { THEME_LEGAL_INFO } from '@/lib/theme-legal-info';
import { themes } from '@/lib/themes';
import { getNamespaceContent } from '@/lib/content';

export const metadata: Metadata = {
  title: 'Klimaat — OHSHub',
  description:
    'Volledig onderzoeksinstrument voor thermisch klimaat op de arbeidsplaats conform ISO 7730:2025, ISO 7243:2017, ISO 7933:2023 en ISO 11079:2007.',
};

const theme = themes.find((t) => t.slug === 'climate')!;
const legalInfo = THEME_LEGAL_INFO['climate'];

const FALLBACK_TITLE = 'Thermisch klimaat';
const FALLBACK_DESC =
  'Volledig onderzoeksinstrument voor thermisch klimaat op de arbeidsplaats — van voorverkenning en blootstellingsgroepen tot PMV/PPD-comfortbeoordeling, WBGT-hittestress, IREQ-koudestress en lokaal thermisch comfort conform ISO 7730:2025, ISO 7243:2017, ISO 7933:2023 en ISO 11079:2007.';

export default async function ClimatePage() {
  const [legalOverrides, themeOverrides, stepContent] = await Promise.all([
    getNamespaceContent('theme-legal.climate'),
    getNamespaceContent('theme.climate'),
    getNamespaceContent('investigation.climate'),
  ]);

  return (
    <InvestigationThemePage
      slug="climate"
      theme={theme}
      legalInfo={legalInfo}
      fallbackTitle={FALLBACK_TITLE}
      fallbackDesc={FALLBACK_DESC}
      pageTitle={themeOverrides['pageTitle'] ?? FALLBACK_TITLE}
      pageDesc={themeOverrides['pageDesc'] ?? FALLBACK_DESC}
      legalOverrides={legalOverrides}
    >
      <ClimateInvestigationApp stepContent={stepContent} />
    </InvestigationThemePage>
  );
}
