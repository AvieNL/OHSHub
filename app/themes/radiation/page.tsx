import type { Metadata } from 'next';
import InvestigationPlaceholder from '@/components/InvestigationPlaceholder';
import { THEME_LEGAL_INFO } from '@/lib/theme-legal-info';
import { themes } from '@/lib/themes';
import { getNamespaceContent } from '@/lib/content';

export const metadata: Metadata = {
  title: 'Straling — OHSHub',
  description:
    'Onderzoeksinstrument voor ioniserende en niet-ioniserende straling op de werkplek conform het Besluit basisveiligheidsnormen stralingsbescherming (Bbs) en Arbobesluit art. 4.45a–4.45k.',
};

const { legislation, norms, limitGroups, adminObligations } = THEME_LEGAL_INFO['radiation'];
const theme = themes.find((t) => t.slug === 'radiation')!;

const FALLBACK_TITLE = 'Straling';
const FALLBACK_DESC =
  'Beoordeling van blootstelling aan ioniserende straling (röntgen, gamma, neutronenstraling) en niet-ioniserende straling (UV, infrarood, laser en elektromagnetische velden) conform het Besluit basisveiligheidsnormen stralingsbescherming (Bbs/2013/59/Euratom) en Arbobesluit art. 4.45a–4.45k.';

export default async function RadiationPage() {
  const [legalOverrides, themeOverrides] = await Promise.all([
    getNamespaceContent('theme-legal.radiation'),
    getNamespaceContent('theme.radiation'),
  ]);

  return (
    <InvestigationPlaceholder
      namespace="theme.radiation"
      legalNamespace="theme-legal.radiation"
      legalOverrides={legalOverrides}
      title={themeOverrides['pageTitle'] ?? FALLBACK_TITLE}
      fallbackTitle={FALLBACK_TITLE}
      description={themeOverrides['pageDesc'] ?? FALLBACK_DESC}
      fallbackDesc={FALLBACK_DESC}
      iconPaths={theme.iconPaths}
      color={{
        dot: 'bg-purple-500',
        stepDot: 'bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400',
        limitBg: 'bg-purple-50 dark:bg-purple-950/30',
        limitBorder: 'border-purple-200 dark:border-purple-900',
      }}
      legislation={legislation}
      norms={norms}
      limitGroups={limitGroups}
      adminObligations={adminObligations}
      steps={[
        { title: 'Vooronderzoek', desc: 'Inventarisatie van stralingsbronnen (toestellen, radioactieve stoffen, laser, UV-installaties, EMV-bronnen); klachteninventarisatie en beroepshistorie.' },
        { title: 'Opdracht & kaders', desc: 'Opdrachtgever, stralingsbeschermingsdeskundige (SBD/SBK), werkplek, wettelijk kader en vergunningsstatus (Bbs/Kernenergiewet).' },
        { title: 'Classificatie stralingsbronnen', desc: 'Indeling in ioniserend vs. niet-ioniserend; laserklasse (IEC 60825-1); risicogroep optische straling; EMV-frequentiebereik.' },
        { title: 'Blootstellingsgroepen', desc: 'Definieer homogene blootstellingsgroepen; onderscheid stralingswerkers categorie A/B en overige werknemers (Bbs art. 2.1).' },
        { title: 'Dosimetrie & metingen', desc: 'Persoonsdosimetrie (TLD, OSL, filmbadge) voor ioniserende straling; radiometrische meting optische straling; veldsterktemetingen EMV.' },
        { title: 'Statistieken & dosisberekening', desc: 'Berekening effectieve dosis (E), equivalente dosis organen; UV-dosis (H); elektromagnetisch veldniveau vs. actiewaarden.' },
        { title: 'Beoordeling', desc: 'Toetsing aan jaardosislimieten (Bbs), ELV optische straling (Arbobesluit art. 4.45b) en actiewaarden EMV (art. 4.45i); categorisering stralingswerkers.' },
        { title: 'Beheersmaatregelen', desc: 'AHS-hiërarchie: afscherming en afstand (ioniserend), filtermaatregelen (UV/IR), laserbeveiligingsmaatregelen, PBM (loodbeschermschort, laserbril, EMV-bescherming).' },
        { title: 'Gezondheidstoezicht', desc: 'Dosisregistratie in nationaal dosisregister (NDRIS); biologisch effect monitoring; keuring stralingswerkers categorie A (art. 5.2 Bbs).' },
        { title: 'Rapport', desc: 'Volledig rapport met bronnenlijst, dosisgegevens, beoordeling per blootstellingsgroep, maatregelen en handtekening SBD/SBK.' },
      ]}
    />
  );
}
