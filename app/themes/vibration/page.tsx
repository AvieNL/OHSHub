import type { Metadata } from 'next';
import InvestigationPlaceholder from '@/components/InvestigationPlaceholder';

export const metadata: Metadata = {
  title: 'Trillingen — OHSHub',
  description:
    'Onderzoeksinstrument voor hand-armtrillingen (HAV) en hele-lichaamstrillingen (WBV) conform Richtlijn 2002/44/EG en Arbobesluit art. 6.11a–6.11g.',
};

export default function VibrationPage() {
  return (
    <InvestigationPlaceholder
      title="Trillingen"
      subtitle="HAV · WBV"
      description="Beoordeling van blootstelling aan hand-armtrillingen (HAV) en hele-lichaamstrillingen (WBV) conform de Europese Trillingenrichtlijn 2002/44/EG en Arbobesluit art. 6.11a–6.11g. Langdurige blootstelling kan leiden tot het Hand-Arm Vibration Syndrome (HAVS), witte vingers of chronische rugklachten."
      color={{
        border: 'border-rose-500',
        badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
        dot: 'bg-rose-500',
        stepDot: 'bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400',
        limitBg: 'bg-rose-50 dark:bg-rose-950/30',
        limitBorder: 'border-rose-200 dark:border-rose-900',
      }}
      legislation={[
        'Richtlijn 2002/44/EG — minimumvoorschriften inzake veiligheid en gezondheid met betrekking tot blootstelling van werknemers aan trillingen',
        'Arbobesluit art. 6.11a–6.11g — dagelijkse trillingsblootstelling, grenswaarden en actiewaarden',
        'Arbowet art. 3 lid 1 — zorgverplichting en risico-inventarisatie',
        'Beleidsregel 6.11a–2 — inventarisatie en meting van trillingsblootstelling',
      ]}
      norms={[
        { name: 'ISO 5349-1:2001', desc: 'Meting en beoordeling van blootstelling van mensen aan hand-armtrillingen — Deel 1: Algemene eisen' },
        { name: 'ISO 5349-2:2001', desc: 'Meting en beoordeling van blootstelling van mensen aan hand-armtrillingen — Deel 2: Praktische handreiking op de werkplek' },
        { name: 'ISO 2631-1:1997', desc: 'Meting en beoordeling van blootstelling van mensen aan hele-lichaamstrillingen — Deel 1: Algemene eisen' },
        { name: 'ISO 2631-5:2004', desc: 'Hele-lichaamstrillingen — Deel 5: Methode voor evaluatie van trillingen met meervoudige schokken' },
        { name: 'NEN-EN-ISO 8662', desc: 'Handheld portable power tools — Meting van trillingen aan het handgreep (meerdelige serie)' },
      ]}
      limitGroups={[
        {
          title: 'Hand-armtrillingen (HAV)',
          limits: [
            { label: 'Actiewaarde', sublabel: 'EAV', value: 'A(8) = 2,5 m/s²' },
            { label: 'Grenswaarde', sublabel: 'ELV', value: 'A(8) = 5,0 m/s²' },
          ],
        },
        {
          title: 'Hele-lichaamstrillingen (WBV)',
          limits: [
            { label: 'Actiewaarde', sublabel: 'EAV', value: 'A(8) = 0,5 m/s²' },
            { label: 'Grenswaarde', sublabel: 'ELV', value: 'A(8) = 1,15 m/s²' },
          ],
        },
      ]}
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
        { title: 'Beheersmaatregelen', desc: 'TOP-hiërarchie: vervanging van gereedschap, demping, werkrotatíe, PBM (trillingsdemping handschoenen).' },
        { title: 'Rapport', desc: 'Volledig rapport met meetdocumentatie, beoordeling, maatregelen en handtekening deskundige.' },
      ]}
    />
  );
}
