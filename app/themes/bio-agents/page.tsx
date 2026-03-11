import type { Metadata } from 'next';
import InvestigationPlaceholder from '@/components/InvestigationPlaceholder';
import { THEME_LEGAL_INFO } from '@/lib/theme-legal-info';
import { themes } from '@/lib/themes';
import { getNamespaceContent } from '@/lib/content';

export const metadata: Metadata = {
  title: 'Biologische agentia — OHSHub',
  description:
    'Onderzoeksinstrument voor biologische agentia conform Richtlijn 2000/54/EG en Arbobesluit art. 4.85–4.114.',
};

const { legislation, norms, limitGroups } = THEME_LEGAL_INFO['bio-agents'];
const theme = themes.find((t) => t.slug === 'bio-agents')!;

const FALLBACK_TITLE = 'Biologische agentia';
const FALLBACK_DESC =
  'Systematische beoordeling van blootstelling aan biologische agentia (bacteriën, virussen, schimmels, parasieten, prionen en afgeleide producten zoals endotoxinen en allergenen) conform Richtlijn 2000/54/EG en Arbobesluit art. 4.85–4.114. Toepasbaar in gezondheidszorg, landbouw, laboratoriumwerk en afvalverwerking.';

export default async function BioAgentsPage() {
  const [legalOverrides, themeOverrides] = await Promise.all([
    getNamespaceContent('theme-legal.bio-agents'),
    getNamespaceContent('theme.bio-agents'),
  ]);

  return (
    <InvestigationPlaceholder
      namespace="theme.bio-agents"
      legalNamespace="theme-legal.bio-agents"
      legalOverrides={legalOverrides}
      title={themeOverrides['pageTitle'] ?? FALLBACK_TITLE}
      fallbackTitle={FALLBACK_TITLE}
      description={themeOverrides['pageDesc'] ?? FALLBACK_DESC}
      fallbackDesc={FALLBACK_DESC}
      iconPaths={theme.iconPaths}
      color={{
        dot: 'bg-emerald-500',
        stepDot: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400',
        limitBg: 'bg-emerald-50 dark:bg-emerald-950/30',
        limitBorder: 'border-emerald-200 dark:border-emerald-900',
      }}
      legislation={legislation}
      norms={norms}
      limitGroups={limitGroups}
      steps={[
        { title: 'Vooronderzoek', desc: 'Sectorspecifieke vragenlijst: aard van de werkzaamheden, bekende biologische agentia, incidenthistorie en bestaande maatregelen.' },
        { title: 'Opdracht & kaders', desc: 'Opdrachtgever, uitvoerende deskundige, betrokken werkplekken en afdelingen, onderzoeksperiode.' },
        { title: 'Inventarisatie agentia', desc: 'Vaststelling van welke biologische agentia aanwezig zijn of kunnen voorkomen; raadpleging RIVM-lijst en wetenschappelijke literatuur.' },
        { title: 'Risicoklassering', desc: 'Indeling van elk agens in risicoklasse 1–4 conform Regeling biologische agentia; beoordeling van mengblootstelling en comorbiditeit.' },
        { title: 'Blootstellingsroutes', desc: 'Analyse van overdrachtsroutes: inhalatie (aerosolen, bioaerosolen), huid- en slijmvliescontact, percutaan, ingestie.' },
        { title: 'Insluitingsmaatregelen', desc: 'Koppeling aan containmentniveau (BSL-1 t/m 4); beoordeling van technische insluitingssystemen, veiligheidskasten, HEPA-filtratie.' },
        { title: 'Gezondheidstoezicht', desc: 'Verplicht of aanbevolen gezondheidstoezicht per risicoklasse; vaccinatieprogramma, biologische monitoring, medisch dossier.' },
        { title: 'Meldingsplicht', desc: 'Beoordeling meldingsplicht klasse 3/4 agentia aan de toezichthoudende autoriteit (art. 4.109 Arbobesluit).' },
        { title: 'Beheersmaatregelen', desc: 'TOP-hiërarchie: substitutie, gesloten systemen, ventilatie, persoonlijke beschermingsmiddelen en noodprocedures.' },
        { title: 'Rapport', desc: 'Volledig rapport met risicoklassering, blootstellingsbeoordeling, maatregelenplan en handtekening BG-deskundige.' },
      ]}
    />
  );
}
