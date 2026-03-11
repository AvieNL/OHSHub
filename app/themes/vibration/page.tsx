import type { Metadata } from 'next';
import InvestigationPlaceholder from '@/components/InvestigationPlaceholder';
import { THEME_LEGAL_INFO } from '@/lib/theme-legal-info';
import { themes } from '@/lib/themes';
import { getNamespaceContent } from '@/lib/content';

export const metadata: Metadata = {
  title: 'Trillingen — OHSHub',
  description:
    'Onderzoeksinstrument voor hand-armtrillingen (HAV) en hele-lichaamstrillingen (WBV) conform Richtlijn 2002/44/EG en Arbobesluit art. 6.11a–6.11g.',
};

const { legislation, norms, limitGroups } = THEME_LEGAL_INFO['vibration'];
const theme = themes.find((t) => t.slug === 'vibration')!;

const FALLBACK_TITLE = 'Trillingen';
const FALLBACK_DESC =
  'Beoordeling van blootstelling aan hand-armtrillingen (HAV) en hele-lichaamstrillingen (WBV) conform de Europese Trillingenrichtlijn 2002/44/EG en Arbobesluit art. 6.11a–6.11g. Langdurige blootstelling kan leiden tot het Hand-Arm Vibration Syndrome (HAVS), witte vingers of chronische rugklachten.';

export default async function VibrationPage() {
  const [legalOverrides, themeOverrides] = await Promise.all([
    getNamespaceContent('theme-legal.vibration'),
    getNamespaceContent('theme.vibration'),
  ]);

  return (
    <InvestigationPlaceholder
      namespace="theme.vibration"
      legalNamespace="theme-legal.vibration"
      legalOverrides={legalOverrides}
      title={themeOverrides['pageTitle'] ?? FALLBACK_TITLE}
      fallbackTitle={FALLBACK_TITLE}
      description={themeOverrides['pageDesc'] ?? FALLBACK_DESC}
      fallbackDesc={FALLBACK_DESC}
      iconPaths={theme.iconPaths}
      color={{
        dot: 'bg-rose-500',
        stepDot: 'bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400',
        limitBg: 'bg-rose-50 dark:bg-rose-950/30',
        limitBorder: 'border-rose-200 dark:border-rose-900',
      }}
      legislation={legislation}
      norms={norms}
      limitGroups={limitGroups}
      steps={[
        { title: 'Vooronderzoek', desc: 'Vragenlijst: inventarisatie van trillende gereedschappen, machines en voertuigen; klachteninventarisatie HAVS/rug.' },
        { title: 'Opdracht & kaders', desc: 'Opdrachtgever, uitvoerende deskundige, werkplek, onderzoeksperiode en referentiedocumentatie.' },
        { title: 'Blootstellingsgroepen', desc: 'Definieer homogene blootstellingsgroepen (HBG) per functie of taakverdeling.' },
        { title: 'Meetstrategie', desc: 'Keuze HAV en/of WBV; taakgebaseerde of functiegerichte meetaanpak conform ISO 5349-2 / ISO 2631-1.' },
        { title: 'Meetapparatuur', desc: 'Registratie van accelerometer, data-acquisitiesysteem, kalibratiestatus en eventuele drift.' },
        { title: 'Trillingsmetingen HAV', desc: 'Meting van frequentiegewogen versnelling (ahw) per taak en gereedschap; triaxiale meting of 1-assig bij standaard gereedschappen.' },
        { title: 'Trillingsmetingen WBV', desc: 'Meting van frequentiegewogen versnelling (aw of kaw) per rijroute, voertuig en ondergrond.' },
        { title: 'Statistieken & A(8)', desc: 'Berekening dagelijkse blootstelling A(8) via energiegemiddelde; onzekerheidsanalyse.' },
        { title: 'Beoordeling', desc: 'Toetsing aan EAV en ELV; prioritering per HBG; vroegtijdige herkenning HAVS (Stockholm-schaal).' },
        { title: 'Beheersmaatregelen', desc: 'TOP-hiërarchie: vervanging van gereedschap, demping, werkroulatie, PBM (trillingsdemping handschoenen).' },
        { title: 'Rapport', desc: 'Volledig rapport met meetdocumentatie, beoordeling, maatregelen en handtekening deskundige.' },
      ]}
    />
  );
}
