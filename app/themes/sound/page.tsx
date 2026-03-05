import type { Metadata } from 'next';
import SoundInvestigationApp from '@/components/sound-investigation/SoundInvestigationApp';
import InvestigationThemePage from '@/components/InvestigationThemePage';
import { THEME_LEGAL_INFO } from '@/lib/theme-legal-info';
import { themes } from '@/lib/themes';
import { getNamespaceContent } from '@/lib/content';

export const metadata: Metadata = {
  title: 'Geluid — OHSHub',
  description:
    'Volledig onderzoeksinstrument voor geluidblootstelling conform NEN-EN-ISO 9612:2025, Arbobesluit art. 6.5–6.8.',
};

const theme = themes.find((t) => t.slug === 'sound')!;
const legalInfo = THEME_LEGAL_INFO['sound'];

const FALLBACK_TITLE = 'Geluidblootstelling';
const FALLBACK_DESC =
  'Volledig onderzoeksinstrument voor geluid op de arbeidsplaats — van werkanalyse en HEG-definitie tot [[L_{EX,8h}]]-berekening met meetonzekerheid conform NEN-EN-ISO 9612:2025 en toetsing aan de actiewaarden uit het Arbobesluit.';

export default async function SoundPage() {
  const [legalOverrides, themeOverrides, stepContent] = await Promise.all([
    getNamespaceContent('theme-legal.sound'),
    getNamespaceContent('theme.sound'),
    getNamespaceContent('investigation.sound'),
  ]);

  return (
    <InvestigationThemePage
      slug="sound"
      theme={theme}
      legalInfo={legalInfo}
      fallbackTitle={FALLBACK_TITLE}
      fallbackDesc={FALLBACK_DESC}
      pageTitle={themeOverrides['pageTitle'] ?? FALLBACK_TITLE}
      pageDesc={themeOverrides['pageDesc'] ?? FALLBACK_DESC}
      legalOverrides={legalOverrides}
    >
      <SoundInvestigationApp stepContent={stepContent} />
    </InvestigationThemePage>
  );
}
