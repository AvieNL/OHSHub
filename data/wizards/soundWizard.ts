import type { WizardStep } from '@/lib/wizard-types';

export const STEPS: WizardStep[] = [
  {
    id: 'inventory',
    title: 'Inventarisatie',
    description:
      'Breng in kaart waar geluid voorkomt, welke bronnen er zijn en welke medewerkers worden blootgesteld.',
    questions: [
      {
        id: 'sound-workplace-type',
        label: 'Wat voor type werkplek of werkomgeving betreft het?',
        type: 'radio',
        options: [
          { value: 'production', label: 'Productiehal of industriële omgeving' },
          { value: 'construction', label: 'Bouwplaats of buitenwerk' },
          { value: 'office', label: 'Kantoor of vergaderruimte' },
          { value: 'entertainment', label: 'Horeca, evenement of entertainmentsector' },
          { value: 'other', label: 'Anders' },
        ],
      },
      {
        id: 'sound-sources',
        label: 'Welke geluidsbronnen zijn aanwezig op de werkplek? (meerdere mogelijk)',
        type: 'checkbox',
        tip: 'Vergeet ook impulsgeluiden zoals perslucht, spijkerpistolen of het dichtvallen van containers. Die veroorzaken piekbelasting die apart beoordeeld moet worden.',
        options: [
          { value: 'machines', label: 'Machines, gereedschappen of procesapparatuur' },
          { value: 'transport', label: 'Intern transport, voertuigen of heftrucs' },
          { value: 'impact', label: 'Slagwerk, stampen of persen' },
          { value: 'airflow', label: 'Luchtstromen, ventilatoren of compressoren' },
          { value: 'music', label: 'Muziek of omroepinstallaties' },
        ],
      },
      {
        id: 'sound-exposed-groups',
        label: 'Welke functies of medewerkergroepen worden het meest blootgesteld aan hoge geluidsniveaus?',
        type: 'text',
        placeholder: 'Bijv. machinisten, lassers, baliemedewerkers, schoonmakers…',
      },
    ],
  },
  {
    id: 'legal-framework',
    title: 'Juridische kaders',
    description:
      'Controleer of de actiewaarden en grenswaarden bekend zijn en of aan de informatieplicht is voldaan.',
    questions: [
      {
        id: 'sound-action-values-known',
        label:
          'Is per geluidsbron of werkplek beoordeeld of het dagelijkse geluidsniveau boven de onderste actiewaarde kan uitkomen?',
        type: 'radio',
        tip: 'Als er twijfel is of het niveau de onderste actiewaarde haalt, is een indicatieve meting met een geluidsniveaumeter al een goede eerste stap. Dat kost weinig tijd en geeft snel richting.',
        options: [
          { value: 'yes', label: 'Ja, dit is beoordeeld' },
          { value: 'partial', label: 'Gedeeltelijk — niet voor alle bronnen of functies' },
          { value: 'no', label: 'Nee, dit is nog niet beoordeeld' },
          { value: 'unknown', label: 'Onbekend' },
        ],
      },
      {
        id: 'sound-limit-exceedance',
        label:
          'Is bekend of medewerkers werken boven de bovenste actiewaarde of de grenswaarde?',
        type: 'radio',
        options: [
          { value: 'below-lower', label: 'Nee, blootstelling ligt ruim onder de onderste actiewaarde' },
          { value: 'between', label: 'Blootstelling ligt tussen de onderste en bovenste actiewaarde' },
          { value: 'above-upper', label: 'Blootstelling ligt boven de bovenste actiewaarde' },
          { value: 'unknown', label: 'Onbekend — nog niet bepaald' },
        ],
      },
      {
        id: 'sound-information',
        label:
          'Zijn de betrokken medewerkers geïnformeerd over de geluidsniveaus, de risico\'s en hun recht op gehooronderzoek?',
        type: 'radio',
        options: [
          { value: 'yes', label: 'Ja, schriftelijk en mondeling' },
          { value: 'partial', label: 'Gedeeltelijk' },
          { value: 'no', label: 'Nee' },
        ],
      },
    ],
  },
  {
    id: 'exposure-assessment',
    title: 'Blootstellingsbeoordeling',
    description:
      'Bepaal hoe de blootstelling aan geluid wordt vastgesteld: via meting, berekening of schatting.',
    questions: [
      {
        id: 'sound-assessment-method',
        label: 'Hoe wordt de dagelijkse geluidsblootstelling (LEX,8h) bepaald?',
        type: 'radio',
        tip: 'Persoonlijke dosimetrie (geluid over de hele dienst) is betrouwbaarder dan een stationaire meting, zeker wanneer medewerkers rondlopen of wisselend werk uitvoeren op meerdere locaties.',
        options: [
          { value: 'personal-measurement', label: 'Persoonlijke blootstellingsmeting (dosimeter)' },
          { value: 'stationary', label: 'Stationaire meting gecombineerd met tijdregistratie' },
          { value: 'estimation', label: 'Schatting op basis van ervaringscijfers of fabrieksgegevens' },
          { value: 'not-yet', label: 'Nog niet bepaald' },
        ],
      },
      {
        id: 'sound-peak-levels',
        label: 'Zijn er werkzaamheden waarbij ook piekgeluiden (LC,piek) kunnen optreden, zoals slagwerk of schoten?',
        type: 'radio',
        options: [
          { value: 'yes-assessed', label: 'Ja, en de pieken zijn ook beoordeeld' },
          { value: 'yes-not-assessed', label: 'Ja, maar pieken zijn nog niet beoordeeld' },
          { value: 'no', label: 'Nee, piekgeluiden zijn niet van toepassing' },
        ],
      },
      {
        id: 'sound-measurement-age',
        label: 'Wanneer is de meest recente blootstellingsbeoordeling uitgevoerd?',
        type: 'radio',
        options: [
          { value: 'lt3y', label: 'Minder dan 3 jaar geleden' },
          { value: '3-5y', label: '3 tot 5 jaar geleden' },
          { value: 'gt5y', label: 'Meer dan 5 jaar geleden of nooit' },
        ],
      },
    ],
  },
  {
    id: 'source-technical-measures',
    title: 'Bronmaatregelen en technische beheersing',
    description:
      'Pas de arbeidshygiënische strategie toe: begin bij de bron voordat naar PBM wordt gegrepen.',
    questions: [
      {
        id: 'sound-substitution',
        label:
          'Zijn de geluidsbronnen beoordeeld op mogelijkheden voor vervanging door stillere alternatieven of een stiller proces?',
        type: 'radio',
        tip: 'Vraag bij aanschaf van nieuwe machines altijd naar het geluidsemissieniveau (LWA in dB(A)). Dit staat vermeld op de CE-verklaring en in de handleiding — zo voorkomt u dat een nieuw apparaat een nieuw geluidsprobleem veroorzaakt.',
        options: [
          { value: 'yes-done', label: 'Ja, en vervanging is doorgevoerd' },
          { value: 'yes-not-feasible', label: 'Ja, maar vervanging is technisch of financieel niet haalbaar' },
          { value: 'not-assessed', label: 'Nee, dit is nog niet beoordeeld' },
        ],
      },
      {
        id: 'sound-technical-controls',
        label: 'Welke technische maatregelen zijn al aanwezig of gepland? (meerdere mogelijk)',
        type: 'checkbox',
        options: [
          { value: 'enclosure', label: 'Omkasting of afscherming van de geluidsbron' },
          { value: 'damping', label: 'Demping, trillingsdempers of anti-vibratie-maatregelen' },
          { value: 'distance', label: 'Vergroot afstand tussen bron en medewerker' },
          { value: 'barriers', label: 'Geluidswerende schermen of wanden' },
          { value: 'cabins', label: 'Stille cabine of afgeschermde werkpost' },
        ],
      },
      {
        id: 'sound-procurement',
        label:
          'Is er een aankoopbeleid voor machines en gereedschappen waarbij geluidsvermogen een selectiecriterium is?',
        type: 'radio',
        options: [
          { value: 'yes', label: 'Ja, geluid is een vast selectiecriterium' },
          { value: 'informal', label: 'Informeel, maar niet formeel vastgelegd' },
          { value: 'no', label: 'Nee' },
        ],
      },
    ],
  },
  {
    id: 'organisational-ppe',
    title: 'Organisatorische maatregelen en PBM',
    description:
      'Beperk blootstelling via planning en roulatie; zet persoonlijke gehoorbescherming in als aanvullende maatregel.',
    questions: [
      {
        id: 'sound-rotation',
        label:
          'Worden medewerkers ingedeeld om blootstelling te beperken via taakroulatie of tijdsbeperking in lawaaiige zones?',
        type: 'radio',
        options: [
          { value: 'yes', label: 'Ja, structureel geregeld' },
          { value: 'partial', label: 'Incidenteel of informeel' },
          { value: 'no', label: 'Nee' },
        ],
      },
      {
        id: 'sound-ppe-status',
        label:
          'Welke aspecten rondom gehoorbescherming zijn geborgd? (meerdere mogelijk)',
        type: 'checkbox',
        options: [
          { value: 'available', label: 'Gehoorbescherming is beschikbaar op de juiste locaties' },
          { value: 'correct-type', label: 'Het type bescherming sluit aan bij het geluidsspectrum (SNR/HML)' },
          { value: 'fit-checked', label: 'Pasvorm is gecontroleerd (individueel aangemeten of getest)' },
          { value: 'usage-monitored', label: 'Daadwerkelijk gebruik wordt gecontroleerd' },
          { value: 'instruction', label: 'Medewerkers zijn geïnstrueerd over gebruik en onderhoud' },
        ],
      },
    ],
  },
  {
    id: 'evaluation-documentation',
    title: 'Evaluatie en documentatie',
    description:
      'Leg de bevindingen en maatregelen vast en organiseer periodiek gezondheidstoezicht.',
    questions: [
      {
        id: 'sound-rie-status',
        label: 'Is het geluidshoofdstuk in de RI&E actueel en volledig voor alle blootgestelde functies?',
        type: 'radio',
        options: [
          { value: 'yes', label: 'Ja, actueel en volledig' },
          { value: 'partial', label: 'Gedeeltelijk of verouderd' },
          { value: 'no', label: 'Nee, ontbreekt' },
        ],
      },
      {
        id: 'sound-action-plan',
        label:
          'Staan de geluidmaatregelen in het plan van aanpak, voorzien van prioritering, verantwoordelijke en termijn?',
        type: 'radio',
        options: [
          { value: 'yes', label: 'Ja' },
          { value: 'partial', label: 'Gedeeltelijk' },
          { value: 'no', label: 'Nee' },
        ],
      },
      {
        id: 'sound-audiometry',
        label:
          'Worden medewerkers die boven de onderste actiewaarde worden blootgesteld periodiek onderzocht op gehoorverlies?',
        type: 'radio',
        tip: 'Audiometrie moet uitgevoerd worden door of onder supervisie van een bedrijfsarts. Gebruik de resultaten voor trendanalyse op groepsniveau — vroeg gehoorverlies is een signaal dat maatregelen onvoldoende zijn.',
        options: [
          { value: 'yes-regular', label: 'Ja, periodiek en gestructureerd' },
          { value: 'yes-incidental', label: 'Ja, maar incidenteel of op verzoek' },
          { value: 'no', label: 'Nee' },
          { value: 'not-applicable', label: 'Niet van toepassing — blootstelling onder drempelwaarde' },
        ],
      },
      {
        id: 'sound-documentation',
        label:
          'Zijn meetrapporten, beoordelingen en keuringsresultaten gedocumenteerd en toegankelijk voor medewerkers en toezichthouders?',
        type: 'radio',
        options: [
          { value: 'yes', label: 'Ja, centraal opgeslagen en beschikbaar' },
          { value: 'partial', label: 'Gedeeltelijk' },
          { value: 'no', label: 'Nee' },
        ],
      },
    ],
  },
];
