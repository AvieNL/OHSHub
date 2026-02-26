import type { WizardStep, WizardConfig } from '@/lib/wizard-types';

export const STEPS: WizardStep[] = [
  {
    id: 'inventory',
    title: 'Inventarisatie',
    description:
      'Breng in kaart welke fysiek belastende taken voorkomen, welke functies zijn blootgesteld en hoe lang de taken worden uitgevoerd.',
    questions: [
      {
        id: 'phys-task-types',
        label: 'Welke fysiek belastende taken komen voor op de werkplek? (meerdere mogelijk)',
        type: 'checkbox',
        tip: 'Observeer het werk ook daadwerkelijk op de werkvloer. Wat in een functieomschrijving staat, wijkt soms sterk af van wat medewerkers in de praktijk doen.',
        options: [
          { value: 'lifting', label: 'Handmatig tillen of dragen van lasten' },
          { value: 'pushing-pulling', label: 'Duwen of trekken van karren, pallets of patiënten' },
          { value: 'repetitive', label: 'Repeterende bewegingen — dezelfde handeling meerdere keren per minuut' },
          { value: 'static-postures', label: 'Langdurige statische houdingen (staan, zitten, armen geheven)' },
          { value: 'awkward-postures', label: 'Werken in ongemakkelijke houdingen (bukken, draaien, reiken)' },
          { value: 'whole-body-vibration', label: 'Trillingen van het hele lichaam (rijden op voertuigen of machines)' },
        ],
      },
      {
        id: 'phys-duration',
        label: 'Hoe lang per dienst worden de fysiek belastende taken in totaal uitgevoerd?',
        type: 'radio',
        options: [
          { value: 'lt2h', label: 'Minder dan 2 uur' },
          { value: '2-4h', label: '2 tot 4 uur' },
          { value: '4-6h', label: '4 tot 6 uur' },
          { value: 'gt6h', label: 'Meer dan 6 uur — fysiek belastende arbeid gedurende vrijwel de hele dienst' },
        ],
      },
      {
        id: 'phys-exposed-functions',
        label: 'Welke functies of medewerkergroepen zijn het meest blootgesteld aan fysieke belasting?',
        type: 'text',
        placeholder: 'Bijv. magazijnmedewerkers, verpleegkundigen, bouwvakkers, productiemedewerkers…',
      },
    ],
  },
  {
    id: 'legal-framework',
    title: 'Juridische kaders en actiegrenzen',
    description:
      'Controleer of de geldende actiegrenzen en risicofactoren voor de betrokken taken bekend zijn.',
    questions: [
      {
        id: 'phys-limits-known',
        label: 'Zijn de actiegrenzen voor tillen, duwen, trekken en repetitieve taken bekend voor de betrokken functies?',
        type: 'radio',
        tip: 'De grens voor tillen is niet alleen afhankelijk van het gewicht, maar ook van houding, frequentie, reikafstand en de duur van de taak. Een last van 25 kg bij een ideale houding kan te zwaar zijn als de medewerker moet draaien of reiken.',
        options: [
          { value: 'yes', label: 'Ja, voor alle relevante taken' },
          { value: 'partial', label: 'Gedeeltelijk — niet voor alle taken of functies' },
          { value: 'no', label: 'Nee, dit is nog niet in beeld gebracht' },
        ],
      },
      {
        id: 'phys-vulnerable-groups',
        label: 'Zijn er medewerkers die extra bescherming nodig hebben vanwege bijzondere omstandigheden? (meerdere mogelijk)',
        type: 'checkbox',
        options: [
          { value: 'young', label: 'Jongeren onder de 18 jaar' },
          { value: 'pregnant', label: 'Zwangere medewerkers of medewerkers die borstvoeding geven' },
          { value: 'older', label: 'Oudere medewerkers (55+) met verminderd herstelvermogen' },
          { value: 'limited-capacity', label: 'Medewerkers met een lichamelijke beperking of reïntegratietraject' },
          { value: 'none', label: 'Geen bijzondere risicogroepen aanwezig' },
        ],
      },
      {
        id: 'phys-previous-assessment',
        label: 'Is er al een eerdere risicobeoordeling of klachtenregistratie beschikbaar voor fysieke belasting?',
        type: 'radio',
        options: [
          { value: 'yes-recent', label: 'Ja, actueel (minder dan 3 jaar oud)' },
          { value: 'yes-old', label: 'Ja, maar verouderd of de taken zijn gewijzigd' },
          { value: 'no', label: 'Nee, er is nog geen beoordeling beschikbaar' },
        ],
      },
    ],
  },
  {
    id: 'risk-assessment',
    title: 'Risicobeoordeling',
    description:
      'Kies een passende beoordelingsmethode en stel vast of de fysieke belasting binnen aanvaardbare grenzen blijft.',
    questions: [
      {
        id: 'phys-assessment-method',
        label: 'Welke beoordelingsmethode is of wordt gebruikt voor de risicobeoordeling? (meerdere mogelijk)',
        type: 'checkbox',
        tip: 'De KIM-methode is voor de meeste praktijksituaties een goede eerste stap. Voor gedetailleerde analyse van beeldschermwerk of repetitief handwerk zijn RULA of OCRA beter geschikt.',
        options: [
          { value: 'niosh', label: 'NIOSH-tilnorm (tileenheden voor handmatig tillen)' },
          { value: 'kim', label: 'KIM-methode (sleutelindicatormethode voor tillen, duwen, repetitief werk)' },
          { value: 'reba-rula', label: 'REBA of RULA (beoordeling van werkhoudingen)' },
          { value: 'ocra', label: 'OCRA-methode (risicobeoordeling repetitieve taken)' },
          { value: 'observation', label: 'Taakobservatie en taakinventarisatie zonder gestandaardiseerde methode' },
        ],
      },
      {
        id: 'phys-expert-involved',
        label: 'Is een ergonoom, arbodeskundige of bedrijfsarts betrokken bij de risicobeoordeling?',
        type: 'radio',
        options: [
          { value: 'yes', label: 'Ja, een deskundige is betrokken of adviseert' },
          { value: 'planned', label: 'Nog niet, maar dit is gepland' },
          { value: 'no', label: 'Nee, de beoordeling wordt intern uitgevoerd' },
        ],
      },
      {
        id: 'phys-assessment-basis',
        label: 'Op welke basis is de beoordeling uitgevoerd of gepland?',
        type: 'radio',
        options: [
          { value: 'observation', label: 'Directe taakobservatie op de werkplek' },
          { value: 'video', label: 'Videoanalyse van de werkzaamheden' },
          { value: 'self-report', label: 'Zelfrapportage door medewerkers (vragenlijst)' },
          { value: 'combination', label: 'Combinatie van observatie, meting en zelfrapportage' },
        ],
      },
    ],
  },
  {
    id: 'control-measures',
    title: 'Beheersmaatregelen',
    description:
      'Pas de arbeidshygiënische strategie toe: begin bij mechanisering en ergonomische aanpassingen voordat PBM worden ingezet.',
    questions: [
      {
        id: 'phys-mechanization',
        label: 'Zijn mogelijkheden voor mechanisering of automatisering van fysiek belastende taken onderzocht?',
        type: 'radio',
        tip: 'Mechanisering hoeft niet altijd duur te zijn. Eenvoudige tilhulpen, beter gepositioneerde opslaglocaties of een verstelbaar werkplatform kunnen de belasting al aanzienlijk verminderen.',
        options: [
          { value: 'yes-done', label: 'Ja, en mechanisering is al (deels) doorgevoerd' },
          { value: 'yes-not-feasible', label: 'Ja, maar niet haalbaar vanwege technische of ruimtelijke beperkingen' },
          { value: 'not-assessed', label: 'Nee, dit is nog niet onderzocht' },
        ],
      },
      {
        id: 'phys-aids-adaptations',
        label: 'Welke technische hulpmiddelen of werkplekaanpassingen zijn al aanwezig of gepland? (meerdere mogelijk)',
        type: 'checkbox',
        options: [
          { value: 'lifting-aids', label: 'Tilhulpen — vacuümhef, hijsbalken, exoskeletten' },
          { value: 'transport', label: 'Transportmiddelen — rolcontainers, pallet-jacks, lopende band' },
          { value: 'adjustable-stations', label: 'Verstelbare werkstations, tafels of platforms' },
          { value: 'handles-grips', label: 'Verbeterde grepen, handvatten of laadadapters' },
          { value: 'floor', label: 'Ergonomische vloerbedekking of anti-vermoeidheidsmatten' },
        ],
      },
      {
        id: 'phys-organisational-measures',
        label: 'Welke organisatorische maatregelen zijn al doorgevoerd? (meerdere mogelijk)',
        type: 'checkbox',
        options: [
          { value: 'rotation', label: 'Taakroulatie om eenzijdige belasting te beperken' },
          { value: 'extra-breaks', label: 'Extra of gestructureerde pauzes bij zwaar werk' },
          { value: 'work-instructions', label: 'Schriftelijke werkinstructies voor veilige tiltechnieken of werkhoudingen' },
          { value: 'weight-limits', label: 'Beperking van laadgewichten of palletgewichten' },
        ],
      },
      {
        id: 'phys-training',
        label: 'Worden medewerkers getraind in veilige werktechnieken, juiste werkhoudingen en gebruik van hulpmiddelen?',
        type: 'radio',
        options: [
          { value: 'yes-periodic', label: 'Ja, periodiek herhaald' },
          { value: 'yes-once', label: 'Eenmalig bij indiensttreding' },
          { value: 'no', label: 'Nee' },
        ],
      },
    ],
  },
  {
    id: 'evaluation-documentation',
    title: 'Evaluatie en documentatie',
    description:
      'Leg de bevindingen vast in de RI&E, monitor klachten en bied periodiek gezondheidsonderzoek aan.',
    questions: [
      {
        id: 'phys-rie-status',
        label: 'Is de fysieke belasting opgenomen in de RI&E, uitgesplitst per taak of functie met bijbehorende maatregelen?',
        type: 'radio',
        options: [
          { value: 'yes', label: 'Ja, volledig en actueel' },
          { value: 'partial', label: 'Gedeeltelijk of globaal vermeld' },
          { value: 'no', label: 'Nee, ontbreekt' },
        ],
      },
      {
        id: 'phys-action-plan',
        label: 'Zijn de verbetermaatregelen vastgelegd in een plan van aanpak met termijnen en verantwoordelijken?',
        type: 'radio',
        options: [
          { value: 'yes', label: 'Ja' },
          { value: 'partial', label: 'Gedeeltelijk' },
          { value: 'no', label: 'Nee' },
        ],
      },
      {
        id: 'phys-pmo',
        label: 'Wordt periodiek medisch onderzoek (PMO of PAGO) aangeboden aan medewerkers met een hoge fysieke belasting?',
        type: 'radio',
        tip: 'Koppel de uitkomsten van het PMO aan de RI&E. Structurele klachten aan rug of schouders bij een specifieke functie zijn een signaal dat de maatregelen onvoldoende zijn en dat de beoordeling opnieuw gedaan moet worden.',
        options: [
          { value: 'yes', label: 'Ja, periodiek en gestructureerd aangeboden' },
          { value: 'yes-on-request', label: 'Alleen op verzoek van de medewerker' },
          { value: 'no', label: 'Nee' },
        ],
      },
      {
        id: 'phys-complaint-monitoring',
        label: 'Worden klachten en verzuim gerelateerd aan fysieke belasting bijgehouden en geanalyseerd op patronen?',
        type: 'radio',
        options: [
          { value: 'yes', label: 'Ja, structureel bijgehouden en besproken' },
          { value: 'partial', label: 'Ad hoc — alleen bij ernstige klachten of verzuim' },
          { value: 'no', label: 'Nee' },
        ],
      },
    ],
  },
];

export const WIZARD_CONFIG: WizardConfig = { steps: STEPS };
