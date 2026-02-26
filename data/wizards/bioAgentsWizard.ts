import type { WizardStep, WizardConfig } from '@/lib/wizard-types';

export const STEPS: WizardStep[] = [
  {
    id: 'inventory',
    title: 'Inventarisatie',
    description:
      'Breng in kaart welke activiteiten kunnen leiden tot contact met biologische agentia en welke agentia daarbij een rol spelen.',
    questions: [
      {
        id: 'bio-sector',
        label: 'In welke sector of werksetting vinden de werkzaamheden plaats?',
        type: 'radio',
        options: [
          { value: 'healthcare-lab', label: 'Zorg, verpleging of laboratorium' },
          { value: 'agriculture', label: 'Landbouw, veeteelt of dierenhouderij' },
          { value: 'waste', label: 'Afvalverwerking, rioolbeheer of compostverwerking' },
          { value: 'food', label: 'Voedingsmiddelenindustrie of slachterij' },
          { value: 'other', label: 'Anders' },
        ],
      },
      {
        id: 'bio-activities',
        label: 'Welke werkzaamheden kunnen leiden tot contact met biologische agentia? (meerdere mogelijk)',
        type: 'checkbox',
        tip: 'Denk ook aan indirecte blootstelling: schoonmakers in risicogebieden, technische dienst bij onderhoud van ventilatie, of leerlingen en stagiairs die meewerken.',
        options: [
          { value: 'patient-contact', label: 'Direct patiënt- of cliëntcontact (verzorging, behandeling)' },
          { value: 'animal-contact', label: 'Contact met (levende) dieren of dierlijke producten' },
          { value: 'cultures', label: 'Werken met micro-organismen of celkweek in laboratorium' },
          { value: 'waste-handling', label: 'Omgaan met infectieus afval, rioolwater of mest' },
          { value: 'aerosols', label: 'Activiteiten waarbij aerosolen ontstaan (reinigen, spuiten, zagen)' },
        ],
      },
      {
        id: 'bio-agents-known',
        label:
          'Is er een overzicht beschikbaar van de biologische agentia die bij de werkzaamheden kunnen voorkomen?',
        type: 'radio',
        options: [
          { value: 'yes-complete', label: 'Ja, volledig overzicht aanwezig' },
          { value: 'yes-partial', label: 'Gedeeltelijk — niet alle agentia zijn geïdentificeerd' },
          { value: 'no', label: 'Nee, er is nog geen overzicht' },
        ],
      },
    ],
  },
  {
    id: 'risk-groups',
    title: 'Risicogroepen en classificatie',
    description:
      'Bepaal de risicoklasse van de aanwezige agentia en of er bijzondere groepen medewerkers zijn die extra kwetsbaar zijn.',
    questions: [
      {
        id: 'bio-classification',
        label: 'Zijn de aanwezige biologische agentia ingedeeld in een risicogroep (1 t/m 4)?',
        type: 'radio',
        tip: 'De risicogroepindeling bepaalt welk insluitingsniveau vereist is en welke maatregelen minimaal getroffen moeten worden. Raadpleeg bij twijfel een arbeidshygiënist of bedrijfsarts met infectieziektekennis.',
        options: [
          { value: 'group1', label: 'Risicogroep 1 — geen of verwaarloosbaar risico voor gezonde medewerkers' },
          { value: 'group2', label: 'Risicogroep 2 — beperkt risico, behandeling mogelijk (bijv. salmonella, hepatitis A)' },
          { value: 'group3', label: 'Risicogroep 3 — ernstige ziekte mogelijk, behandeling beschikbaar (bijv. tuberculose, hepatitis B/C)' },
          { value: 'mixed', label: 'Meerdere risicogroepen aanwezig' },
          { value: 'unknown', label: 'Onbekend — classificatie is nog niet bepaald' },
        ],
      },
      {
        id: 'bio-vulnerable-groups',
        label: 'Zijn er medewerkers die tot een bijzonder kwetsbare groep behoren? (meerdere mogelijk)',
        type: 'checkbox',
        options: [
          { value: 'pregnant', label: 'Zwangere medewerkers of medewerkers die borstvoeding geven' },
          { value: 'immunocompromised', label: 'Medewerkers met verminderde weerstand (medicatie, aandoening)' },
          { value: 'young', label: 'Jongeren onder de 18 jaar' },
          { value: 'none', label: 'Geen bijzondere risicogroepen aanwezig of bekend' },
        ],
      },
      {
        id: 'bio-zoonoses',
        label: 'Zijn er zoönosen (van dier op mens overdraagbare ziekten) die bij de werkzaamheden een risico vormen?',
        type: 'radio',
        options: [
          { value: 'yes-identified', label: 'Ja, geïdentificeerd en opgenomen in de risicobeoordeling' },
          { value: 'yes-not-assessed', label: 'Ja, maar nog niet systematisch beoordeeld' },
          { value: 'no', label: 'Nee, niet van toepassing' },
          { value: 'unknown', label: 'Onbekend' },
        ],
      },
    ],
  },
  {
    id: 'exposure-assessment',
    title: 'Blootstellingsbeoordeling',
    description:
      'Stel vast via welke routes blootstelling plaatsvindt, hoe frequent en hoe intensief het contact is.',
    questions: [
      {
        id: 'bio-routes',
        label: 'Via welke routes kan blootstelling aan biologische agentia plaatsvinden? (meerdere mogelijk)',
        type: 'checkbox',
        options: [
          { value: 'inhalation', label: 'Inhalatie van aerosolen, stof of druppelkern' },
          { value: 'skin', label: 'Huid- of slijmvliescontact' },
          { value: 'injection', label: 'Accidentele injectie (prikongeval, snijwond)' },
          { value: 'ingestion', label: 'Ingestie (eten, drinken, aanraken mond)' },
        ],
      },
      {
        id: 'bio-assessment-method',
        label: 'Op welke manier is de mate van blootstelling in beeld gebracht?',
        type: 'radio',
        tip: 'In de gezondheidszorg is een incidentanalyse (prikongevallen, besmettingen) vaak informatiever dan luchtmetingen. In de veehouderij of compostering is juist luchtmeting op aerosolen en endotoxinen waardevoller.',
        options: [
          { value: 'inventory', label: 'Inventarisatie op basis van taakomschrijving en procesbeschrijving' },
          { value: 'measurements', label: 'Luchtmetingen of biologische monitoring' },
          { value: 'incident-analysis', label: 'Analyse van incidenten en klachtenregistratie' },
          { value: 'not-yet', label: 'Blootstelling is nog niet formeel beoordeeld' },
        ],
      },
      {
        id: 'bio-frequency',
        label: 'Hoe frequent komen medewerkers in contact met biologische agentia?',
        type: 'radio',
        options: [
          { value: 'continuous', label: 'Dagelijks en gedurende een groot deel van de dienst' },
          { value: 'daily-incidental', label: 'Dagelijks maar kortdurend of incidenteel' },
          { value: 'weekly', label: 'Wekelijks of minder frequent' },
        ],
      },
    ],
  },
  {
    id: 'control-measures',
    title: 'Beheersmaatregelen',
    description:
      'Pas maatregelen toe in de volgorde: insluiting, hygiëne, organisatie, PBM en vaccinatie.',
    questions: [
      {
        id: 'bio-containment',
        label: 'Welk insluitingsniveau is ingericht voor de werkzaamheden (laboratoria of processen)?',
        type: 'radio',
        options: [
          { value: 'ml1', label: 'ML-I — standaard goede microbiologische werkwijze' },
          { value: 'ml2', label: 'ML-II — verhoogde hygiëne en toegangsbeperking' },
          { value: 'ml3', label: 'ML-III — strikte insluiting, onderdruk, luchtfiltering' },
          { value: 'not-applicable', label: 'Niet van toepassing (geen labsetting)' },
        ],
      },
      {
        id: 'bio-procedures',
        label: 'Welke procedurele en organisatorische maatregelen zijn van kracht? (meerdere mogelijk)',
        type: 'checkbox',
        options: [
          { value: 'hygiene-protocol', label: 'Hygiëneprotocol (handhygiëne, verbod op eten/drinken)' },
          { value: 'work-instructions', label: 'Schriftelijke werkinstructies voor risicovolle handelingen' },
          { value: 'sharps-safety', label: 'Veilig omgaan met scherpe objecten (safety-naalden, geen recappen)' },
          { value: 'disinfection', label: 'Gevalideerd desinfectieprotocol voor oppervlakken en materialen' },
          { value: 'waste-management', label: 'Gescheiden afvalstromen voor infectieus materiaal' },
        ],
      },
      {
        id: 'bio-ppe',
        label: 'Welke PBM zijn beschikbaar en worden daadwerkelijk gebruikt? (meerdere mogelijk)',
        type: 'checkbox',
        options: [
          { value: 'gloves', label: 'Handschoenen (juist type, regelmatig wisselen)' },
          { value: 'mask', label: 'Ademhalingsbescherming (FFP2 of FFP3, afhankelijk van agens en taak)' },
          { value: 'eye-protection', label: 'Spatbril of gelaatsscherm' },
          { value: 'protective-clothing', label: 'Beschermende kleding of overall' },
        ],
      },
      {
        id: 'bio-vaccination',
        label: 'Is er een vaccinatieprogramma voor de relevante biologische agentia?',
        type: 'radio',
        tip: 'Vaccinatie is een aanvullende maatregel, geen vervanging van insluiting en hygiëne. Medewerkers mogen vaccinatie niet verplicht gesteld worden, maar u moet het aanbieden en de keuze documenteren.',
        options: [
          { value: 'yes-complete', label: 'Ja, alle relevante medewerkers zijn gevaccineerd' },
          { value: 'yes-offered', label: 'Ja, vaccinatie wordt aangeboden maar is niet verplicht' },
          { value: 'not-available', label: 'Geen vaccin beschikbaar voor de aanwezige agentia' },
          { value: 'no', label: 'Nee, er is geen vaccinatieprogramma' },
        ],
      },
    ],
  },
  {
    id: 'evaluation-documentation',
    title: 'Evaluatie en documentatie',
    description:
      'Leg de risicobeoordeling vast, registreer incidenten en organiseer bedrijfsgeneeskundig toezicht.',
    questions: [
      {
        id: 'bio-rie-status',
        label: 'Is de blootstelling aan biologische agentia opgenomen in de RI&E, inclusief maatregelen per agens of activiteit?',
        type: 'radio',
        options: [
          { value: 'yes', label: 'Ja, volledig en actueel' },
          { value: 'partial', label: 'Gedeeltelijk of verouderd' },
          { value: 'no', label: 'Nee, ontbreekt' },
        ],
      },
      {
        id: 'bio-incident-registration',
        label: 'Worden incidenten zoals prikongevallen, spatongevallen en besmettingsincidenten geregistreerd en geanalyseerd?',
        type: 'radio',
        tip: 'Registreer ook bijna-ongelukken (near-misses). Die zijn vaak informatiever voor het voorkomen van toekomstige incidenten dan de incidenten zelf — en ze kosten geen gezondheidsschade.',
        options: [
          { value: 'yes-structured', label: 'Ja, gestructureerd met opvolging en analyse' },
          { value: 'yes-ad-hoc', label: 'Ja, maar ad hoc en zonder systematische opvolging' },
          { value: 'no', label: 'Nee' },
        ],
      },
      {
        id: 'bio-health-surveillance',
        label: 'Is er periodiek bedrijfsgeneeskundig toezicht georganiseerd voor medewerkers die aan biologische agentia worden blootgesteld?',
        type: 'radio',
        options: [
          { value: 'yes', label: 'Ja, periodiek en vastgelegd' },
          { value: 'yes-on-request', label: 'Ja, maar alleen op verzoek' },
          { value: 'no', label: 'Nee' },
        ],
      },
    ],
  },
];

export const WIZARD_CONFIG: WizardConfig = { steps: STEPS };
