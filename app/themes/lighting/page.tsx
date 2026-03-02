import type { Metadata } from 'next';
import InvestigationPlaceholder from '@/components/InvestigationPlaceholder';
import { THEME_LEGAL_INFO } from '@/lib/theme-legal-info';
import { themes } from '@/lib/themes';

export const metadata: Metadata = {
  title: 'Verlichting — OHSHub',
  description:
    'Onderzoeksinstrument voor werkplekverlichting conform NEN-EN-12464-1:2021 en Arbobesluit art. 6.29–6.32.',
};

const { legislation, norms, limitGroups, adminObligations } = THEME_LEGAL_INFO['lighting'];
const theme = themes.find((t) => t.slug === 'lighting')!;

export default function LightingPage() {
  return (
    <InvestigationPlaceholder
      title="Verlichting"
      subtitle="NEN-EN 12464"
      description="Systematische beoordeling van kunstmatige en daglichtsituaties op de werkplek conform NEN-EN-12464-1:2021. Onvoldoende of ongepaste verlichting leidt tot visuele vermoeidheid, verhoogde foutkans, hoofdpijn en een hoger risico op bedrijfsongevallen. De beoordeling omvat verlichtingssterkte, uniformiteit, verblinding (UGR) en kleurweergave."
      iconPaths={theme.iconPaths}
      color={{
        border: 'border-amber-500',
        badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
        dot: 'bg-amber-500',
        stepDot: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400',
        limitBg: 'bg-amber-50 dark:bg-amber-950/30',
        limitBorder: 'border-amber-200 dark:border-amber-900',
      }}
      legislation={legislation}
      norms={norms}
      limitGroups={limitGroups}
      adminObligations={adminObligations}
      steps={[
        { title: 'Vooronderzoek', desc: 'Vragenlijst: type werkzaamheden, visuele nauwkeurigheid, klachten (hoofdpijn, oogvermoeidheid), aanwezigheid daglicht en noodverlichting.' },
        { title: 'Opdracht & kaders', desc: 'Opdrachtgever, uitvoerende deskundige, te beoordelen ruimten en functies, onderzoeksperiode en referentiedocumentatie.' },
        { title: 'Ruimte- en taakanalyse', desc: 'Indeling per ruimtetype conform NEN-EN-12464-1 bijlage A; vaststelling visuele taakniveaus en referentievlak.' },
        { title: 'Meetstrategie', desc: 'Keuze meetnetten (raster- of werkplekmeting); bepaling meetpunten, meetomstandigheden (dag/nacht, bezetting) en te meten grootheden.' },
        { title: 'Meetapparatuur', desc: 'Registratie luxmeter (klasse C of beter conform CIE 69), kalibratiestatus, correctiefactoren en omgevingscondities.' },
        { title: 'Verlichtingsmetingen', desc: 'Meting verlichtingssterkte Em (horizontaal, verticaal, cilindrisch), uniformiteitsratio U0 en lichtkleur (CCT, Ra).' },
        { title: 'Daglichttoetreding', desc: 'Bepaling daglichttoetreding (daglichtquotiënt DGQ of BREEAM/LEED equivalent); beoordeling vensteroppervlak vs. vloeroppervlak.' },
        { title: 'Verblinding & flikkering', desc: 'UGR-berekening of -meting per werkplek; flicker-index beoordeling (stroboscopisch effect bij machines).' },
        { title: 'Noodverlichting', desc: 'Beoordeling noodverlichtingsinstallatie conform NEN-EN-1838: vluchtwegen, antipaniek, reserve-vermogen en testfrequentie.' },
        { title: 'Beheersmaatregelen', desc: 'TOP-hiërarchie: vervangen armaturen/lampen, daglichttoetreding vergroten, dimregeling, PBM (vergrootglas, taakverlichting).' },
        { title: 'Rapport', desc: 'Volledig rapport met meetdocumentatie per ruimte, beoordeling per parameter, maatregelenplan en handtekening deskundige.' },
      ]}
    />
  );
}
