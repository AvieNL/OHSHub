import type { WizardStep } from '@/lib/wizard-types';

export const STEPS: WizardStep[] = [
  {
    id: 'inventory',
    title: 'Inventarisatie',
    description:
      'Stel vast welke gevaarlijke stoffen aanwezig zijn, bij welke taken contact optreedt en via welke routes medewerkers worden blootgesteld.',
    questions: [
      {
        id: 'haz-tasks',
        label: 'Bij welke activiteiten of taken komen medewerkers in contact met gevaarlijke stoffen?',
        type: 'text',
        tip: 'Vergeet ook schoonmaak, onderhoud en laad-/losactiviteiten. Die worden bij inventarisaties vaak over het hoofd gezien, maar kunnen een hoge blootstelling geven.',
        placeholder: 'Bijv. mengen van verf, reinigen met oplosmiddelen, verwerken van houtstof, lassen…',
      },
      {
        id: 'haz-categories',
        label: 'Welke categorieën gevaarlijke stoffen zijn aanwezig op de werkplek? (meerdere mogelijk)',
        type: 'checkbox',
        options: [
          { value: 'cmr', label: 'CMR-stoffen — kankerverwekkend, mutageen of schadelijk voor de voortplanting' },
          { value: 'corrosive', label: 'Bijtende of sterk irriterende stoffen (zuren, logen)' },
          { value: 'flammable', label: 'Ontvlambare of explosieve stoffen' },
          { value: 'sensitizing', label: 'Sensibiliserende stoffen — kunnen allergie of astma veroorzaken' },
          { value: 'skin-absorbing', label: 'Stoffen die via de huid worden opgenomen (huidresorberend)' },
        ],
      },
      {
        id: 'haz-routes',
        label: 'Via welke routes vindt of kan blootstelling plaatsvinden? (meerdere mogelijk)',
        type: 'checkbox',
        options: [
          { value: 'inhalation', label: 'Inhalatie — dampen, gassen, nevels of (fijn)stof' },
          { value: 'skin', label: 'Huidcontact of dermale opname' },
          { value: 'eyes', label: 'Oogcontact' },
          { value: 'ingestion', label: 'Ingestie (eten, drinken, aanraken mond)' },
        ],
      },
      {
        id: 'haz-sds',
        label: 'Zijn er actuele veiligheidsinformatiebladen (SDS) beschikbaar voor alle aanwezige stoffen?',
        type: 'radio',
        options: [
          { value: 'yes-complete', label: 'Ja, volledig en actueel (niet ouder dan 3 jaar)' },
          { value: 'partial', label: 'Gedeeltelijk — niet voor alle stoffen of verouderd' },
          { value: 'no', label: 'Nee' },
        ],
      },
    ],
  },
  {
    id: 'legal-framework',
    title: 'Juridische kaders',
    description:
      'Controleer of de gevaarsindeling, grenswaarden en bijzondere verplichtingen voor de aanwezige stoffen bekend zijn.',
    questions: [
      {
        id: 'haz-oels-known',
        label: 'Zijn voor alle relevante stoffen de wettelijke grenswaarden (OEL) opgezocht en vergeleken met de situatie op de werkplek?',
        type: 'radio',
        tip: 'Heeft een stof geen wettelijke grenswaarde, gebruik dan een sectorale of door de leverancier aanbevolen waarde (DNEL of OEL uit de SDS, rubriek 8). Documenteer welke waarde u gebruikt en waarom.',
        options: [
          { value: 'yes', label: 'Ja, voor alle relevante stoffen' },
          { value: 'partial', label: 'Gedeeltelijk — niet voor alle stoffen' },
          { value: 'no', label: 'Nee, dit is nog niet gedaan' },
          { value: 'no-oels', label: 'Er zijn geen wettelijke grenswaarden beschikbaar voor de aanwezige stoffen' },
        ],
      },
      {
        id: 'haz-ghs-known',
        label: 'Is voor elke stof de gevaarsindeling (GHS/CLP: pictogrammen, gevarenaanduidingen) bekend en opgenomen in de RI&E?',
        type: 'radio',
        options: [
          { value: 'yes', label: 'Ja' },
          { value: 'partial', label: 'Gedeeltelijk' },
          { value: 'no', label: 'Nee' },
        ],
      },
      {
        id: 'haz-cmr-present',
        label: 'Zijn er CMR-stoffen aanwezig waarvoor een aanvullend registratieplicht of vervangingsplicht geldt?',
        type: 'radio',
        options: [
          { value: 'yes-registered', label: 'Ja, en ze zijn geregistreerd en alternatieven zijn onderzocht' },
          { value: 'yes-not-registered', label: 'Ja, maar ze zijn nog niet formeel geregistreerd' },
          { value: 'no', label: 'Nee, geen CMR-stoffen aanwezig' },
          { value: 'unknown', label: 'Onbekend' },
        ],
      },
      {
        id: 'haz-skin-sensitizing',
        label: 'Zijn er stoffen aangemerkt als huidresorberend of sensibiliserend, waarvoor speciale maatregelen nodig zijn?',
        type: 'radio',
        options: [
          { value: 'yes-measures', label: 'Ja, en er zijn specifieke maatregelen getroffen' },
          { value: 'yes-no-measures', label: 'Ja, maar er zijn nog geen specifieke maatregelen' },
          { value: 'no', label: 'Nee' },
          { value: 'unknown', label: 'Onbekend' },
        ],
      },
    ],
  },
  {
    id: 'assessment-method',
    title: 'Beoordelingsmethode',
    description:
      'Kies hoe de blootstelling wordt bepaald: meting op de werkplek, rekenmodel of een combinatie.',
    questions: [
      {
        id: 'haz-assessment-approach',
        label: 'Welke aanpak is of wordt gebruikt om de blootstelling te beoordelen?',
        type: 'radio',
        tip: 'Gebruik voor een snelle eerste screening een rekentool zoals Stoffenmanager of ECETOC TRA. Is de blootstelling dicht bij de grenswaarde, dan is een persoonlijke meting nodig voor een betrouwbaar oordeel.',
        options: [
          { value: 'measurement', label: 'Persoonlijke blootstellingsmeting conform een meetstrategie' },
          { value: 'model', label: 'Rekenmodel of schattingstool (bijv. Stoffenmanager, ART, ECETOC TRA)' },
          { value: 'combined', label: 'Combinatie van meting en modellering' },
          { value: 'not-yet', label: 'Nog niet bepaald' },
        ],
      },
      {
        id: 'haz-previous-measurements',
        label: 'Zijn er eerder blootstellingsmetingen uitgevoerd voor de betrokken taken of stoffen?',
        type: 'radio',
        options: [
          { value: 'yes-recent', label: 'Ja, en ze zijn actueel (minder dan 3–5 jaar oud)' },
          { value: 'yes-old', label: 'Ja, maar ze zijn verouderd of de situatie is gewijzigd' },
          { value: 'no', label: 'Nee, er zijn geen metingen beschikbaar' },
        ],
      },
      {
        id: 'haz-exceedance-risk',
        label: 'Zijn er aanwijzingen dat de blootstelling de grenswaarde nadert of overschrijdt?',
        type: 'radio',
        options: [
          { value: 'clearly-below', label: 'Nee, blootstelling ligt duidelijk onder de grenswaarde' },
          { value: 'uncertain', label: 'Onzeker — verder onderzoek of meting is nodig' },
          { value: 'near-oel', label: 'Ja, blootstelling nadert de grenswaarde' },
          { value: 'above-oel', label: 'Ja, blootstelling overschrijdt de grenswaarde' },
        ],
      },
      {
        id: 'haz-biomonitoring',
        label: 'Is biologische monitoring (meting in bloed of urine) relevant of al toegepast voor de aanwezige stoffen?',
        type: 'radio',
        options: [
          { value: 'yes-applied', label: 'Ja, biologische monitoring is al onderdeel van het programma' },
          { value: 'relevant-not-applied', label: 'Relevant maar nog niet toegepast' },
          { value: 'not-relevant', label: 'Niet relevant voor de aanwezige stoffen' },
        ],
      },
    ],
  },
  {
    id: 'control-measures',
    title: 'Beheersmaatregelen',
    description:
      'Pas de arbeidshygiënische strategie toe: begin bij de bron (vervanging), dan techniek, daarna organisatie, en gebruik PBM als laatste stap.',
    questions: [
      {
        id: 'haz-substitution',
        label: 'Zijn mogelijkheden voor vervanging van gevaarlijke stoffen door minder gevaarlijke alternatieven onderzocht?',
        type: 'radio',
        tip: 'Leg uw afweging altijd schriftelijk vast, ook als vervanging niet mogelijk is. U moet kunnen aantonen dat u serieus naar alternatieven heeft gezocht — dit kan bij een inspectie gevraagd worden.',
        options: [
          { value: 'yes-done', label: 'Ja, en vervanging is doorgevoerd' },
          { value: 'yes-not-feasible', label: 'Ja, maar vervanging is technisch of economisch niet haalbaar (gedocumenteerd)' },
          { value: 'not-assessed', label: 'Nee, vervangingsmogelijkheden zijn nog niet onderzocht' },
        ],
      },
      {
        id: 'haz-technical-controls',
        label: 'Welke technische beheersmaatregelen zijn al aanwezig of gepland? (meerdere mogelijk)',
        type: 'checkbox',
        options: [
          { value: 'lev', label: 'Lokale afzuiging (LEV) — afzuigkap, armbuis of bronafzuiging' },
          { value: 'closed-system', label: 'Gesloten systeem of ingekapseld proces' },
          { value: 'general-ventilation', label: 'Algemene ventilatie of verdunningsventilatie' },
          { value: 'wet-methods', label: 'Nat werken of stofbindende middelen om stofvorming te beperken' },
        ],
      },
      {
        id: 'haz-organisational-controls',
        label: 'Welke organisatorische maatregelen zijn al getroffen? (meerdere mogelijk)',
        type: 'checkbox',
        options: [
          { value: 'work-instructions', label: 'Schriftelijke werkinstructies voor veilig omgaan met stoffen' },
          { value: 'rotation', label: 'Taakroulatie om blootstelling per persoon te beperken' },
          { value: 'access-restriction', label: 'Beperking van toegang tot zones met hoge blootstelling' },
          { value: 'storage', label: 'Gescheiden en geventileerde opslag van gevaarlijke stoffen' },
        ],
      },
      {
        id: 'haz-ppe',
        label: 'Welke PBM zijn beschikbaar en wordt het gebruik geborgd? (meerdere mogelijk)',
        type: 'checkbox',
        options: [
          { value: 'gloves', label: 'Handschoenen van het juiste materiaal (chemische bestendigheid gecontroleerd)' },
          { value: 'respirator', label: 'Ademhalingsbescherming van het juiste type (half-, volgelaatsmasker of motorgestuurde kap)' },
          { value: 'eye-protection', label: 'Veiligheidsbril of spatbril' },
          { value: 'protective-clothing', label: 'Beschermende kleding of chemicaliënpak' },
        ],
      },
    ],
  },
  {
    id: 'evaluation-documentation',
    title: 'Evaluatie en documentatie',
    description:
      'Leg de bevindingen vast in de RI&E en het plan van aanpak, en zorg voor periodieke evaluatie.',
    questions: [
      {
        id: 'haz-rie-status',
        label: 'Is de inventarisatie van gevaarlijke stoffen en de bijbehorende risicobeoordeling opgenomen in de RI&E?',
        type: 'radio',
        tip: 'Bewaar meetrapporten en blootstellingsbeoordelingen voor CMR-stoffen minimaal 40 jaar. Bij stoffen met vertraagde gezondheidseffecten kan de registratieplicht veel langer doorlopen dan het dienstverband.',
        options: [
          { value: 'yes', label: 'Ja, volledig en actueel' },
          { value: 'partial', label: 'Gedeeltelijk of verouderd' },
          { value: 'no', label: 'Nee, ontbreekt' },
        ],
      },
      {
        id: 'haz-action-plan',
        label: 'Zijn de beheersmaatregelen vastgelegd in een plan van aanpak, met verantwoordelijke, prioritering en uitvoertermijn?',
        type: 'radio',
        options: [
          { value: 'yes', label: 'Ja' },
          { value: 'partial', label: 'Gedeeltelijk' },
          { value: 'no', label: 'Nee' },
        ],
      },
      {
        id: 'haz-training',
        label: 'Worden medewerkers periodiek geïnformeerd en opgeleid over de risico\'s van gevaarlijke stoffen en het gebruik van PBM?',
        type: 'radio',
        options: [
          { value: 'yes-periodic', label: 'Ja, structureel en periodiek' },
          { value: 'yes-once', label: 'Eenmalig bij indiensttreding, maar niet periodiek herhaald' },
          { value: 'no', label: 'Nee' },
        ],
      },
      {
        id: 'haz-documentation-access',
        label: 'Zijn meetrapporten, blootstellingsbeoordelingen en SDS beschikbaar voor medewerkers, de bedrijfsarts en toezichthouders?',
        type: 'radio',
        options: [
          { value: 'yes', label: 'Ja, centraal opgeslagen en toegankelijk' },
          { value: 'partial', label: 'Gedeeltelijk' },
          { value: 'no', label: 'Nee' },
        ],
      },
    ],
  },
];
