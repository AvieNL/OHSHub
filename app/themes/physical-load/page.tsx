import type { Metadata } from 'next';
import PhysicalInvestigationApp from '@/components/physical-investigation/PhysicalInvestigationApp';
import InvestigationThemePage from '@/components/InvestigationThemePage';
import { THEME_LEGAL_INFO } from '@/lib/theme-legal-info';
import { themes } from '@/lib/themes';
import { getNamespaceContent } from '@/lib/content';

export const metadata: Metadata = {
  title: 'Fysieke belasting — OHSHub',
  description:
    'Volledig onderzoeksinstrument voor fysieke arbeidsbelasting conform ISO 11228-1 (NIOSH tillen/dragen), ISO 11228-2 (duwen/trekken), ISO 11228-3 (OCRA repetitieve handelingen) en Arbobesluit art. 5.1–5.6.',
};

const theme = themes.find((t) => t.slug === 'physical-load')!;
const legalInfo = THEME_LEGAL_INFO['physical-load'];

const FALLBACK_TITLE = 'Fysieke belasting';
const FALLBACK_DESC =
  'Volledig onderzoeksinstrument voor fysieke arbeidsbelasting — van voorverkenning en belastingsgroepen tot NIOSH-tilanalyse, duwen & trekken, repeterende handelingen en houdingsbeoordeling conform ISO 11228-1/2/3, EN 1005-3/4 en Arbobesluit art. 5.1–5.6.';

export default async function PhysicalLoadPage() {
  const [legalOverrides, themeOverrides, stepContent] = await Promise.all([
    getNamespaceContent('theme-legal.physical-load'),
    getNamespaceContent('theme.physical-load'),
    getNamespaceContent('investigation.physical-load'),
  ]);

  return (
    <InvestigationThemePage
      slug="physical-load"
      theme={theme}
      legalInfo={legalInfo}
      fallbackTitle={FALLBACK_TITLE}
      fallbackDesc={FALLBACK_DESC}
      pageTitle={themeOverrides['pageTitle'] ?? FALLBACK_TITLE}
      pageDesc={themeOverrides['pageDesc'] ?? FALLBACK_DESC}
      legalOverrides={legalOverrides}
    >
      <PhysicalInvestigationApp stepContent={stepContent} />
    </InvestigationThemePage>
  );
}
