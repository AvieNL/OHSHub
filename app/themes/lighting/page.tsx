import type { Metadata } from 'next';
import InvestigationPlaceholder from '@/components/InvestigationPlaceholder';

export const metadata: Metadata = {
  title: 'Verlichting — OHSHub',
  description:
    'Onderzoeksinstrument voor werkplekverlichting conform NEN-EN-12464-1:2021 en Arbobesluit art. 6.29–6.32.',
};

export default function LightingPage() {
  return (
    <InvestigationPlaceholder
      title="Verlichting"
      subtitle="NEN-EN 12464"
      description="Systematische beoordeling van kunstmatige en daglichtsituaties op de werkplek conform NEN-EN-12464-1:2021. Onvoldoende of ongepaste verlichting leidt tot visuele vermoeidheid, verhoogde foutkans, hoofdpijn en een hoger risico op bedrijfsongevallen. De beoordeling omvat verlichtingssterkte, uniformiteit, verblinding (UGR) en kleurweergave."
      color={{
        border: 'border-amber-500',
        badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
        dot: 'bg-amber-500',
        stepDot: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400',
        limitBg: 'bg-amber-50 dark:bg-amber-950/30',
        limitBorder: 'border-amber-200 dark:border-amber-900',
      }}
      legislation={[
        'Arbobesluit art. 6.29–6.32 — verlichting van arbeidsplaatsen: daglicht, kunstlicht en noodverlichting',
        'Bouwbesluit 2012 art. 6.35 — minimumeisen verlichtingssterkte voor verblijfsgebieden',
        'Arbobesluit art. 3.1g — ergonomische inrichting werkplek (visueel comfort)',
        'Richtlijn 89/654/EEG — minimumvoorschriften veiligheid en gezondheid op arbeidsplaatsen',
      ]}
      norms={[
        { name: 'NEN-EN-12464-1:2021', desc: 'Licht en verlichting — Verlichting van werkplekken — Deel 1: Binnenwerkplekken. Vervangt de 2011-editie.' },
        { name: 'NEN-EN-12464-2:2014', desc: 'Licht en verlichting — Verlichting van werkplekken — Deel 2: Buitenwerkplekken' },
        { name: 'NEN-EN-12665:2011', desc: 'Licht en verlichting — Basisbegrippen en criteria voor het specificeren van verlichtingseisen' },
        { name: 'CIE 117:1995', desc: 'Discomfort Glare in Interior Lighting — Unified Glare Rating (UGR) methode' },
        { name: 'NEN-EN-1838:2013', desc: 'Toegepaste verlichting — Noodverlichting' },
        { name: 'NVVL Richtlijn Daglicht', desc: 'Nederlandse Vereniging voor Verlichtingskunde — richtlijnen voor daglichttoetreding en beoordeling' },
      ]}
      limitGroups={[
        {
          title: 'Verlichtingssterkte (Em) — voorbeelden',
          limits: [
            { label: 'Gangen, trappenhuizen', value: '≥ 100 lux' },
            { label: 'Kantoorwerk (beeldscherm)', value: '≥ 500 lux' },
            { label: 'Tekenkamer, fijn assemblage', value: '≥ 750 lux' },
            { label: 'Zeer nauwkeurig werk', value: '≥ 1 000 lux' },
          ],
        },
        {
          title: 'Overige parameters',
          limits: [
            { label: 'Uniformiteitsratio', sublabel: 'U0 = Emin/Em', value: '≥ 0,60–0,70' },
            { label: 'Verblindingsindex', sublabel: 'UGR', value: '≤ 16–22' },
            { label: 'Kleurweergave-index', sublabel: 'Ra', value: '≥ 80' },
          ],
        },
      ]}
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
