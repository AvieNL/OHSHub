import type { WizardStep } from '@/lib/wizard-types';

export const STEPS: WizardStep[] = [
  {
    id: 'inventory',
    title: 'Inventarisatie',
    description:
      'Breng in kaart wat voor ruimte het betreft, welke visuele taken worden uitgevoerd en hoe de huidige verlichting is ingericht.',
    questions: [
      {
        id: 'light-space-type',
        label: 'Wat is het type werkruimte of werkplek?',
        type: 'radio',
        options: [
          { value: 'office', label: 'Kantoor of beeldschermwerkplek' },
          { value: 'production', label: 'Productieomgeving of werkplaats' },
          { value: 'warehouse', label: 'Magazijn of opslagruimte' },
          { value: 'healthcare', label: 'Zorgomgeving (behandelkamer, operatiezaal)' },
          { value: 'outdoor', label: 'Buitenlocatie of deels overdekte ruimte' },
        ],
      },
      {
        id: 'light-visual-tasks',
        label: 'Welke visuele taken worden in deze ruimte uitgevoerd? (meerdere mogelijk)',
        type: 'checkbox',
        tip: 'Hoe nauwkeuriger de visuele taak, hoe hoger de verlichtingssterkte die nodig is. Kijk niet alleen naar de gemiddelde lux in de ruimte, maar ook naar de verlichting op het exacte werkvlak.',
        options: [
          { value: 'screens', label: 'Beeldschermwerk (computer, tablet, controlepaneel)' },
          { value: 'fine-work', label: 'Fijn handwerk of nauwkeurige montage' },
          { value: 'reading', label: 'Lezen, schrijven of papierwerk' },
          { value: 'inspection', label: 'Visuele inspectie of kwaliteitscontrole' },
          { value: 'transport', label: 'Verplaatsing van materialen of gebruik van voertuigen' },
        ],
      },
      {
        id: 'light-daylight',
        label: 'Is er daglichtinval aanwezig in de ruimte?',
        type: 'radio',
        options: [
          { value: 'ample', label: 'Ja, ruim — grote ramen of dakramen met goed uitzicht' },
          { value: 'limited', label: 'Beperkt — kleine ramen of gedeeltelijk daglicht' },
          { value: 'none', label: 'Nee, de ruimte is geheel kunstmatig verlicht' },
        ],
      },
      {
        id: 'light-current-installation',
        label: 'Welke soorten kunstmatige verlichting zijn momenteel aanwezig? (meerdere mogelijk)',
        type: 'checkbox',
        options: [
          { value: 'tl', label: 'TL-verlichting (fluorescentiebuizen)' },
          { value: 'led', label: 'LED-armaturen' },
          { value: 'hid', label: 'Hogedruk-gasontladingslampen (HID — voor hoge ruimten)' },
          { value: 'task-lighting', label: 'Taak- of bureauverlichting' },
          { value: 'emergency', label: 'Noodverlichting of vluchtwegsignalering' },
        ],
      },
    ],
  },
  {
    id: 'standards-requirements',
    title: 'Normen en eisen per werktaak',
    description:
      'Stel vast welke verlichtingseisen gelden voor de uitgevoerde taken en of er bijzondere omstandigheden zijn.',
    questions: [
      {
        id: 'light-lux-requirements-known',
        label: 'Is per werktaak of werkzone vastgesteld welke minimale verlichtingssterkte (lux) vereist is?',
        type: 'radio',
        tip: 'De eisen variëren sterk per taak: van 100 lux in een opslagruimte tot 1000 lux of meer bij nauwkeurig inspectie- of chirurgisch werk. Kijk ook naar het onderhoudsniveau — armaturen verliezen in de loop der tijd rendement.',
        options: [
          { value: 'yes', label: 'Ja, eisen zijn per werkzone bepaald' },
          { value: 'partial', label: 'Gedeeltelijk — niet voor alle zones of taken' },
          { value: 'no', label: 'Nee, dit is nog niet bepaald' },
        ],
      },
      {
        id: 'light-color-rendering',
        label: 'Zijn er eisen aan de kleurweergave (Ra-index) van de verlichting vanwege de aard van de taken?',
        type: 'radio',
        options: [
          { value: 'yes-high', label: 'Ja, hoge kleurweergave vereist (bijv. kleurcontrole, medische taken)' },
          { value: 'standard', label: 'Standaard kleurweergave volstaat' },
          { value: 'unknown', label: 'Onbekend — dit is nog niet beoordeeld' },
        ],
      },
      {
        id: 'light-special-conditions',
        label: 'Zijn er bijzondere werkomstandigheden die extra aandacht vragen? (meerdere mogelijk)',
        type: 'checkbox',
        options: [
          { value: 'nightwork', label: 'Nachtwerk of wisselende diensten' },
          { value: 'hazardous-equipment', label: 'Werken met gevaarlijke machines waarbij goed zicht cruciaal is' },
          { value: 'fine-inspection', label: 'Fijn inspectiewerk waarbij details zichtbaar moeten zijn' },
          { value: 'older-workers', label: 'Oudere medewerkers met verhoogde verlichtingsbehoefte' },
        ],
      },
    ],
  },
  {
    id: 'measurement-assessment',
    title: 'Meting en beoordeling',
    description:
      'Stel vast of de verlichtingssituatie is gemeten en of er klachten zijn die wijzen op knelpunten.',
    questions: [
      {
        id: 'light-measured',
        label: 'Is de verlichtingssterkte (lux) op de werkplekken al gemeten?',
        type: 'radio',
        tip: 'Meet de verlichtingssterkte op het werkvlak (bureau, machine, werkbank) en niet op de vloer. Vervuilde armaturen en vergrijsde lampen kunnen het lichtniveau met 30–50% verlagen ten opzichte van de ontwerpwaarde.',
        options: [
          { value: 'yes-recent', label: 'Ja, recent gemeten (minder dan 3 jaar geleden)' },
          { value: 'yes-old', label: 'Ja, maar de meting is verouderd of de situatie is sindsdien gewijzigd' },
          { value: 'no', label: 'Nee, er zijn nog geen metingen uitgevoerd' },
        ],
      },
      {
        id: 'light-complaints',
        label: 'Zijn er klachten of signalen die wijzen op een verlichtingsprobleem? (meerdere mogelijk)',
        type: 'checkbox',
        options: [
          { value: 'fatigue-headache', label: 'Vermoeidheid of hoofdpijn gerelateerd aan visuele inspanning' },
          { value: 'glare', label: 'Verblinding of schittering (direct of via reflectie)' },
          { value: 'insufficient', label: 'Medewerkers ervaren de verlichting als onvoldoende of te donker' },
          { value: 'flickering', label: 'Flikkering of ongewenste kleurverschillen' },
          { value: 'no-complaints', label: 'Geen bekende klachten' },
        ],
      },
      {
        id: 'light-uniformity',
        label: 'Is de uniformiteit van de verlichting beoordeeld — zijn er grote verschillen in lichte en donkere vlekken?',
        type: 'radio',
        options: [
          { value: 'yes-ok', label: 'Ja, beoordeeld en uniformiteit is voldoende' },
          { value: 'yes-problems', label: 'Ja, er zijn zones met onvoldoende uniformiteit' },
          { value: 'no', label: 'Nee, uniformiteit is nog niet beoordeeld' },
        ],
      },
      {
        id: 'light-maintenance-issues',
        label: 'Zijn er storingen, defecte armaturen of zichtbare veroudering aan de verlichtingsinstallatie?',
        type: 'radio',
        options: [
          { value: 'no', label: 'Nee, installatie is in goede staat' },
          { value: 'minor', label: 'Enkele kleine defecten die worden opgevolgd' },
          { value: 'significant', label: 'Aanzienlijke storingen of veroudering die de verlichting beïnvloeden' },
        ],
      },
    ],
  },
  {
    id: 'control-measures',
    title: 'Maatregelen',
    description:
      'Verbeter de verlichtingssituatie via aanpassingen aan de installatie, taakverlichting of onderhoud.',
    questions: [
      {
        id: 'light-improvements',
        label: 'Welke verbeteringen zijn al doorgevoerd of gepland? (meerdere mogelijk)',
        type: 'checkbox',
        options: [
          { value: 'new-luminaires', label: 'Vervanging van armaturen door energiezuinigere of betere typen' },
          { value: 'task-lighting', label: 'Toevoeging van taak- of bureauverlichting op knelpuntlocaties' },
          { value: 'dimming-control', label: 'Aanpassing van schakelgroepen of dimmers voor flexibele verlichtingsniveaus' },
          { value: 'glare-reduction', label: 'Plaatsing van zonwering, blindering of anti-reflecterende oppervlakken' },
          { value: 'layout-change', label: 'Aanpassing van de werkplekindeling om dichter bij lichtbronnen te werken' },
        ],
      },
      {
        id: 'light-maintenance-schedule',
        label: 'Is er een reinigings- en onderhoudsschema voor de verlichtingsinstallatie?',
        type: 'radio',
        tip: 'Regelmatig reinigen van armaturen en tijdig vervangen van lampen is een van de meest kosteneffectieve maatregelen. De lichtstroom van TL-buizen kan na 2–3 jaar al 20–30% zijn afgenomen.',
        options: [
          { value: 'yes', label: 'Ja, vastgelegd en uitgevoerd' },
          { value: 'informal', label: 'Informeel — defecten worden verholpen, maar zonder schema' },
          { value: 'no', label: 'Nee, geen onderhoudsprogramma' },
        ],
      },
      {
        id: 'light-worker-involvement',
        label: 'Worden medewerkers betrokken bij de beoordeling van de verlichtingssituatie op hun werkplek?',
        type: 'radio',
        options: [
          { value: 'yes', label: 'Ja, via overleg, enquête of werkplekobservatie' },
          { value: 'ad-hoc', label: 'Ad hoc — alleen wanneer er klachten zijn' },
          { value: 'no', label: 'Nee' },
        ],
      },
    ],
  },
  {
    id: 'evaluation-documentation',
    title: 'Evaluatie en documentatie',
    description:
      'Leg de verlichtingsbeoordeling en maatregelen vast en plan periodieke controle.',
    questions: [
      {
        id: 'light-rie-status',
        label: 'Is de verlichtingssituatie opgenomen in de RI&E, uitgesplitst per werkzone of taak?',
        type: 'radio',
        options: [
          { value: 'yes', label: 'Ja, volledig en actueel' },
          { value: 'partial', label: 'Gedeeltelijk of globaal vermeld' },
          { value: 'no', label: 'Nee, ontbreekt' },
        ],
      },
      {
        id: 'light-results-documented',
        label: 'Zijn meetresultaten en genomen maatregelen gedocumenteerd en toegankelijk?',
        type: 'radio',
        options: [
          { value: 'yes', label: 'Ja' },
          { value: 'partial', label: 'Gedeeltelijk' },
          { value: 'no', label: 'Nee' },
        ],
      },
      {
        id: 'light-periodic-review',
        label: 'Is een periodieke hercontrole of herkeuring van de verlichtingsinstallatie ingepland?',
        type: 'radio',
        options: [
          { value: 'yes', label: 'Ja, ingepland en vastgelegd' },
          { value: 'no', label: 'Nee, geen hercontrole gepland' },
        ],
      },
    ],
  },
];
