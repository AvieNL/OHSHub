import type { WizardStep } from '@/lib/wizard-types';

export const STEPS: WizardStep[] = [
  {
    id: 'inventory',
    title: 'Inventarisatie',
    description:
      'Breng in kaart welke gevaarlijke stoffen aanwezig zijn, bij welke taken blootstelling optreedt, welke medewerkers betrokken zijn en via welke routes blootstelling plaatsvindt.',
    questions: [
      {
        id: 'haz-inv-tasks',
        label:
          'Beschrijf bij welke taken of werkprocessen medewerkers in contact kunnen komen met gevaarlijke stoffen, en welke functies of medewerkergroepen daarbij betrokken zijn.',
        type: 'text',
        tip: 'Denk ook aan schoonmaak, onderhoud, laden en lossen, en incidentele taken. Vergeet zzp\'ers, uitzendkrachten en stagiairs niet.',
        placeholder:
          'Bijv. verwerken van verf in de spuitcabine (spuiter), reinigen met oplosmiddelen (onderhoudsmonteur), mengen van additieven (productiemedewerker)…',
      },
      {
        id: 'haz-inv-sds',
        label:
          'Is er voor elke gevaarlijke stof die gebruikt of bewaard wordt een actueel Veiligheidsinformatieblad (VIB/SDS) beschikbaar, en zijn alle stoffen opgenomen in een stoffenregister?',
        type: 'radio',
        tip: 'Controleer de uitgiftedatum in VIB-rubriek 1. De grenswaarden en aanbevolen PBM staan in rubriek 8.',
        options: [
          {
            value: 'yes',
            label:
              'Ja — voor alle stoffen, actueel (niet ouder dan 3 jaar of bijgewerkt na CLP-herclassificatie) en volledig stoffenregister aanwezig',
          },
          {
            value: 'partial',
            label: 'Gedeeltelijk — niet voor alle stoffen, of sommige VIB\'s zijn verouderd',
          },
          { value: 'no', label: 'Nee — VIB\'s ontbreken of er is geen stoffenregister bijgehouden' },
        ],
      },
      {
        id: 'haz-inv-cmr',
        label:
          'Zijn er stoffen aanwezig die zijn geclassificeerd als CMR-stof of als sensibiliserend voor huid of luchtwegen? (meerdere mogelijk)',
        type: 'checkbox',
        tip: 'Raadpleeg VIB-rubriek 2 voor de H-zinnen. Twijfelt u? Zoek de CLP-classificatie op in de C&L Inventory van ECHA.',
        options: [
          { value: 'cmr-1a', label: 'Ja — CMR categorie 1A (H340/H350/H360)' },
          { value: 'cmr-1b', label: 'Ja — CMR categorie 1B (H341/H351/H361)' },
          { value: 'cmr-2', label: 'Ja — CMR categorie 2' },
          {
            value: 'sensitizing',
            label: 'Ja — huidsensiliserend (H317) of luchtwegsensibiliserend (H334)',
          },
          { value: 'none', label: 'Nee — geen CMR- of sensibiliserende stoffen aanwezig of bekend' },
        ],
      },
      {
        id: 'haz-inv-routes',
        label:
          'Via welke routes kunnen medewerkers worden blootgesteld aan de gevaarlijke stoffen? (meerdere mogelijk)',
        type: 'checkbox',
        tip: 'Huidresorptie wordt in beoordelingen vaak onderschat. Als een stof is aangemerkt als huidresorberend (via VIB-rubriek 8), telt huidcontact mee in de totale blootstelling.',
        options: [
          { value: 'inhalation', label: 'Inhalatie — inademen van dampen, gassen, nevels of (fijn)stof' },
          {
            value: 'skin',
            label: 'Huidcontact of huidresorptie — opname via de huid, ook zonder zichtbare irritatie',
          },
          { value: 'eyes', label: 'Oogcontact — spatten of damp in contact met de ogen' },
          { value: 'ingestion', label: 'Ingestie — inslikken via besmette handen of oppervlakken' },
        ],
      },
    ],
  },
  {
    id: 'legal-framework',
    title: 'Juridische kaders en informatie',
    description:
      'Controleer of de CLP-classificatie, grenswaarden (OELV\'s) en bijzondere verplichtingen voor CMR-stoffen en REACH-blootstellingsscenario\'s in beeld zijn.',
    questions: [
      {
        id: 'haz-legal-clp',
        label:
          'Zijn de CLP-classificatie en gevarenaanduidingen (H-zinnen) van alle relevante stoffen in beeld?',
        type: 'radio',
        tip: 'Let in het bijzonder op H372 en H373 (STOT bij herhaalde blootstelling): die wijzen op chronische schade aan een specifiek orgaan.',
        options: [
          {
            value: 'yes',
            label: 'Ja — voor alle stoffen zijn de H-zinnen en GHS-pictogrammen gedocumenteerd',
          },
          {
            value: 'partial',
            label: 'Gedeeltelijk — niet voor alle stoffen volledig uitgewerkt',
          },
          { value: 'no', label: 'Nee — classificatie is nog niet beoordeeld' },
        ],
      },
      {
        id: 'haz-legal-oelv',
        label:
          'Zijn voor alle relevante stoffen de toepasselijke grenswaarden (OELV\'s) bepaald?',
        type: 'radio',
        tip: 'De DNEL is de door de leverancier berekende veilige blootstellingsdrempel (via REACH). Als er geen wettelijke OELV bestaat, is de DNEL een bruikbaar alternatief — documenteer dan waarom je deze waarde kiest.',
        options: [
          {
            value: 'szw',
            label: 'Ja — wettelijke Nederlandse grenswaarden gebruikt (SZW-grenswaardelijst)',
          },
          {
            value: 'eu-oel',
            label: 'Ja — Europese indicatieve of bindende OEL gebruikt',
          },
          {
            value: 'dnel',
            label: 'Ja — DNEL of sectorale waarde gebruikt, omdat er geen wettelijke grenswaarde beschikbaar is',
          },
          {
            value: 'partial',
            label: 'Gedeeltelijk — niet voor alle stoffen is een grenswaarde bepaald',
          },
          { value: 'no', label: 'Nee — grenswaarden zijn nog niet opgezocht' },
        ],
      },
      {
        id: 'haz-legal-cmr-obligations',
        label:
          'Als er CMR-stoffen categorie 1A of 1B aanwezig zijn — zijn de extra wettelijke verplichtingen in beeld en ingericht?',
        type: 'radio',
        tip: 'Voor CMR-stoffen 1A/1B geldt een wettelijke vervangingsplicht. Leg de afweging altijd schriftelijk vast.',
        options: [
          {
            value: 'yes',
            label:
              'Ja — alle extra verplichtingen zijn in beeld en worden nageleefd (vervangingsplicht, register, medisch toezicht)',
          },
          {
            value: 'partial',
            label: 'Gedeeltelijk — sommige verplichtingen zijn nog niet ingericht',
          },
          { value: 'no', label: 'Nee — dit is nog niet beoordeeld' },
          {
            value: 'not-applicable',
            label: 'Niet van toepassing — er zijn geen CMR-stoffen categorie 1A/1B aanwezig',
          },
        ],
      },
      {
        id: 'haz-legal-reach-scenarios',
        label:
          'Zijn de blootstellingsscenario\'s die leveranciers als bijlage bij het VIB meeleveren beoordeeld op toepasselijkheid voor de werkwijze?',
        type: 'radio',
        tip: 'Als jouw gebruik buiten het beschreven blootstellingsscenario valt, ben je als downstream user verplicht zelf een chemische veiligheidsbeoordeling uit te voeren.',
        options: [
          {
            value: 'yes-compliant',
            label:
              'Ja — scenario\'s zijn beoordeeld en de werkwijze valt binnen de beschreven gebruiksvoorwaarden',
          },
          {
            value: 'yes-deviant',
            label:
              'Ja — beoordeeld, maar de werkwijze wijkt af van het scenario (downstream user rapport nodig)',
          },
          { value: 'no', label: 'Nee — dit is nog niet beoordeeld' },
          {
            value: 'not-applicable',
            label: 'Niet van toepassing — het VIB bevat geen blootstellingsscenario\'s',
          },
        ],
      },
    ],
  },
  {
    id: 'assessment-method',
    title: 'Beoordelingsmethode en meetstrategie',
    description:
      'Stel vast of een basiskarakterisering is uitgevoerd, of Vergelijkbare Blootstellingsgroepen (VBG\'s) zijn gedefinieerd, welke beoordelingsmethode wordt toegepast en wat de uitkomst is ten opzichte van de OELV.',
    questions: [
      {
        id: 'haz-assess-base',
        label:
          'Is er een basiskarakterisering gemaakt — een schriftelijke beschrijving van de stof, de gebruikte hoeveelheid, de werkwijze, de blootstellingsduur en de omgevingsomstandigheden?',
        type: 'radio',
        tip: 'De basiskarakterisering bevat nog geen meetgegevens — het gaat om een gedocumenteerde situatiebeschrijving: welke stof, welk proces, welke hoeveelheid, hoe lang, hoe vaak, en onder welke omstandigheden.',
        options: [
          {
            value: 'yes',
            label:
              'Ja — volledig gedocumenteerd per stof of stofgroep, als startpunt voor de verdere beoordeling',
          },
          {
            value: 'partial',
            label: 'Gedeeltelijk — niet voor alle stoffen of werkprocessen uitgewerkt',
          },
          { value: 'no', label: 'Nee — dit moet nog worden gedaan' },
        ],
      },
      {
        id: 'haz-assess-seg',
        label:
          'Zijn de blootgestelde medewerkers ingedeeld in Vergelijkbare Blootstellingsgroepen (VBG\'s)?',
        type: 'radio',
        tip: 'Een VBG (NEN-EN 689: SEG) maakt het mogelijk met een beperkt aantal metingen een statistisch onderbouwde uitspraak te doen voor een hele groep medewerkers.',
        options: [
          {
            value: 'yes',
            label: 'Ja — VBG\'s zijn gedefinieerd, gedocumenteerd en de basis voor de meetstrategie',
          },
          {
            value: 'partial',
            label: 'Gedeeltelijk — indeling is voor sommige groepen of stoffen nog niet gemaakt',
          },
          {
            value: 'no',
            label: 'Nee — elke medewerker wordt individueel beoordeeld of het is nog niet bepaald',
          },
          {
            value: 'not-applicable',
            label: 'Niet van toepassing — er is slechts één blootgestelde medewerker',
          },
        ],
      },
      {
        id: 'haz-assess-method',
        label:
          'Welke methode wordt gebruikt om de blootstelling aan gevaarlijke stoffen te beoordelen?',
        type: 'radio',
        tip: 'Pas altijd de gelaagde aanpak toe. Wijst de kwalitatieve beoordeling op een laag risico (blootstelling ruim onder de OELV), dan is verdere actie niet nodig.',
        options: [
          {
            value: 'qualitative',
            label:
              'Kwalitatieve beoordeling op basis van stofeigenschappen en gebruiksomstandigheden (oriënterende inschatting)',
          },
          {
            value: 'model',
            label:
              'Kwantitatieve modellering via een rekentool (bijv. Stoffenmanager, ECETOC TRA of ART)',
          },
          {
            value: 'indicative-measurement',
            label: 'Oriënterende meting (niet conform volledige NEN-EN 689-meetcampagne)',
          },
          {
            value: 'nen-en-689',
            label:
              'Volledige meetcampagne conform NEN-EN 689 met statistische toetsing aan de OELV',
          },
          {
            value: 'biomonitoring',
            label: 'Biologische monitoring als primaire beoordelingsmethode',
          },
        ],
      },
      {
        id: 'haz-assess-outcome',
        label:
          'Wat is de uitkomst van de blootstellingsbeoordeling in verhouding tot de geldende grenswaarde (OELV)?',
        type: 'radio',
        tip: 'NEN-EN 689 werkt met een statistische toets (overschrijdingskans, Pe). De meetcampagne moet aantonen dat de kans op overschrijding kleiner is dan 5%.',
        options: [
          {
            value: 'below-10pct',
            label: 'Blootstelling is duidelijk lager dan de OELV (< 10%) — verwaarloosbaar risico',
          },
          {
            value: '10-50pct',
            label:
              'Blootstelling ligt tussen 10% en 50% van de OELV — laag risico, monitoring aanbevolen',
          },
          {
            value: '50-100pct',
            label:
              'Blootstelling ligt tussen 50% en 100% van de OELV — aandacht vereist, verbetermaatregelen overwegen',
          },
          {
            value: 'above-oel',
            label: 'Blootstelling overschrijdt de OELV — directe maatregelen zijn verplicht',
          },
          {
            value: 'unknown',
            label: 'Beoordeling is nog niet afgerond of de uitkomst is onbekend',
          },
        ],
      },
    ],
  },
  {
    id: 'control-measures',
    title: 'Beheersmaatregelen en restblootstelling',
    description:
      'Doorloop de Arbeidshygiënische Strategie (AHS) stap voor stap: eliminatie/vervanging → techniek → organisatie → PBM. Documenteer ook de extra maatregelen voor CMR-stoffen.',
    questions: [
      {
        id: 'haz-ctrl-ahs',
        label:
          'Is de Arbeidshygiënische Strategie (AHS) stap voor stap doorlopen? (meerdere mogelijk)',
        type: 'checkbox',
        tip: 'Documenteer ook waarom je een hogere stap niet hebt toegepast. Bij een NLA-inspectie moet je aantonen dat je de AHS serieus hebt doorlopen.',
        options: [
          {
            value: 'step1-substitution',
            label:
              'Stap 1 — Eliminatie of vervanging door een minder gevaarlijke stof of werkwijze is onderzocht en gedocumenteerd',
          },
          {
            value: 'step2-technical',
            label:
              'Stap 2 — Technische maatregelen zijn getroffen (gesloten systeem, LEV of andere bronbeheersing)',
          },
          {
            value: 'step3-organisational',
            label:
              'Stap 3 — Organisatorische maatregelen zijn getroffen (werkinstructies, taakroulatie, toegangsbeperking, opslag)',
          },
          {
            value: 'step4-ppe',
            label:
              'Stap 4 — PBM zijn beschikbaar als aanvulling op de bovenstaande maatregelen — niet als enige maatregel',
          },
        ],
      },
      {
        id: 'haz-ctrl-technical',
        label:
          'Welke technische maatregelen zijn aanwezig op de werkplek? (meerdere mogelijk)',
        type: 'checkbox',
        tip: 'Laat de LEV minimaal jaarlijks keuren op effectiviteit. Een slecht onderhouden afzuiginstallatie geeft een vals gevoel van veiligheid.',
        options: [
          {
            value: 'closed-system',
            label: 'Gesloten of ingekapseld systeem — de stof komt niet vrij in de werkruimte',
          },
          {
            value: 'lev',
            label:
              'Lokale afzuiging (LEV) direct bij de bron — periodiek gekeurd op effectiviteit',
          },
          {
            value: 'general-ventilation',
            label:
              'Algemene verdunningsventilatie — alleen als aanvulling, niet als primaire maatregel bij toxische stoffen',
          },
          {
            value: 'wet-methods',
            label: 'Nat werken of stofbindende middelen om stofvorming te beperken',
          },
          {
            value: 'mechanisation',
            label: 'Mechanische verwerking in plaats van handmatig',
          },
        ],
      },
      {
        id: 'haz-ctrl-ppe',
        label:
          'Zijn de juiste PBM beschikbaar en is geborgd dat ze correct en consequent worden gebruikt? (meerdere mogelijk)',
        type: 'checkbox',
        tip: 'Controleer bij handschoenen altijd de doorbraaktijd voor de specifieke stof — een nitrilhandschoen biedt geen bescherming tegen alle oplosmiddelen.',
        options: [
          {
            value: 'respirator',
            label:
              'Ademhalingsbescherming van het juiste type en de juiste filterklasse is beschikbaar, pasvorm is gecontroleerd',
          },
          {
            value: 'gloves',
            label:
              'Handschoenen van het juiste materiaal voor de specifieke stoffen zijn beschikbaar (chemische bestendigheid en doorbraaktijd gecontroleerd)',
          },
          {
            value: 'eye-clothing',
            label: 'Beschermende kleding, veiligheidsbril of spatbril is beschikbaar',
          },
          {
            value: 'usage-monitored',
            label: 'Gebruik van PBM wordt aantoonbaar gemonitord en geborgd',
          },
          {
            value: 'instruction',
            label:
              'Medewerkers zijn geïnstrueerd over correct gebruik, pasvorm en onderhoud van PBM',
          },
        ],
      },
      {
        id: 'haz-ctrl-cmr-extra',
        label:
          'Als er CMR-stoffen categorie 1A of 1B aanwezig zijn — zijn de wettelijk verplichte aanvullende maatregelen getroffen? (meerdere mogelijk)',
        type: 'checkbox',
        options: [
          {
            value: 'closed-system',
            label:
              'Gesloten systeem of maximale insluiting is toegepast (verplicht als technisch haalbaar)',
          },
          {
            value: 'register',
            label:
              'Blootstellingsregister is aangelegd en wordt actueel bijgehouden (bewaartermijn: minimaal 40 jaar na laatste blootstelling)',
          },
          {
            value: 'medical-surveillance',
            label:
              'Medewerkers worden periodiek medisch onderzocht via de bedrijfsarts (PAGO of PMO)',
          },
          {
            value: 'worker-information',
            label:
              'Medewerkers zijn aantoonbaar geïnformeerd over de risico\'s en hun recht op medisch onderzoek',
          },
          {
            value: 'not-applicable',
            label: 'Niet van toepassing — er zijn geen CMR-stoffen categorie 1A/1B aanwezig',
          },
        ],
      },
    ],
  },
  {
    id: 'evaluation-documentation',
    title: 'Evaluatie, rapportage en borging',
    description:
      'Leg de risicobeoordeling vast in de RI&E en het plan van aanpak, borg de periodieke herbeoordeling, bewaar documenten conform wettelijke termijnen en zorg voor aantoonbare instructie van medewerkers.',
    questions: [
      {
        id: 'haz-eval-rie',
        label:
          'Is de risicobeoordeling gevaarlijke stoffen volledig opgenomen in de RI&E, en staan de verbetermaatregelen in een plan van aanpak met verantwoordelijke, prioritering en uitvoertermijn?',
        type: 'radio',
        tip: 'De RI&E moet actueel zijn bij relevante wijzigingen en minimaal elke 4 jaar worden getoetst door een gecertificeerd arbodeskundige (voor bedrijven met meer dan 25 medewerkers).',
        options: [
          {
            value: 'yes',
            label:
              'Ja — RI&E is volledig en actueel, plan van aanpak is opgesteld en bijgewerkt',
          },
          {
            value: 'partial',
            label:
              'Gedeeltelijk — RI&E is aanwezig maar niet volledig, of plan van aanpak ontbreekt of is niet actueel',
          },
          { value: 'no', label: 'Nee — RI&E of plan van aanpak ontbreekt' },
        ],
      },
      {
        id: 'haz-eval-review',
        label:
          'Is er een afspraak gemaakt over de periodieke herbeoordeling van de blootstellingssituatie conform NEN-EN 689, en is vastgelegd bij welke wijzigingen de beoordeling eerder wordt herhaald?',
        type: 'radio',
        tip: 'Triggercriteria voor een vervroegde herbeoordeling: introductie van een nieuwe stof, wijziging van het proces, wijziging van de OELV, nieuwe toxicologische inzichten, of signalen van gezondheidsklachten bij medewerkers.',
        options: [
          {
            value: 'yes',
            label:
              'Ja — herbeoordelingstermijn is vastgelegd (maximaal 5 jaar) en triggercriteria zijn beschreven en bekend',
          },
          {
            value: 'partial',
            label:
              'Gedeeltelijk — er is een termijn maar geen triggercriteria, of omgekeerd',
          },
          { value: 'no', label: 'Nee — er is geen herbeoordeling gepland of vastgelegd' },
        ],
      },
      {
        id: 'haz-eval-docs',
        label:
          'Zijn alle meetrapporten, blootstellingsbeoordelingen, VIB\'s en het blootstellingsregister voor CMR-stoffen gedocumenteerd, toegankelijk en bewaard conform de wettelijke bewaartermijnen?',
        type: 'radio',
        tip: 'Meetrapporten en blootstellingsbeoordelingen voor CMR-stoffen moeten minimaal 40 jaar na de laatste blootstelling bewaard blijven. Voor overige gevaarlijke stoffen geldt minimaal 5 jaar.',
        options: [
          {
            value: 'yes',
            label:
              'Ja — alles is centraal opgeslagen, toegankelijk voor medewerkers en toezichthouders, en conform bewaartermijnen',
          },
          {
            value: 'partial',
            label:
              'Gedeeltelijk — niet alle documenten zijn beschikbaar of de bewaartermijnen zijn niet gewaarborgd',
          },
          {
            value: 'no',
            label: 'Nee — documentatie is onvolledig of de bewaartermijnen zijn niet geborgd',
          },
        ],
      },
      {
        id: 'haz-eval-training',
        label:
          'Zijn medewerkers aantoonbaar geïnformeerd over de risico\'s van de gevaarlijke stoffen waarmee ze werken, de te volgen werkwijze en het correct gebruik van PBM — en wordt dit periodiek herhaald en geregistreerd?',
        type: 'radio',
        tip: '"Aantoonbaar" is het sleutelwoord. Bij een inspectie moet je kunnen laten zien dat medewerkers zijn geïnstrueerd — via een handtekeningenlijst, e-learning logboek of opleidingsregistratie.',
        options: [
          {
            value: 'yes-periodic',
            label: 'Ja — aantoonbaar en periodiek, deelname wordt geregistreerd',
          },
          {
            value: 'yes-once',
            label: 'Ja — eenmalig bij indiensttreding, maar niet periodiek herhaald',
          },
          { value: 'no', label: 'Nee — er is geen aantoonbare instructie of opleiding gegeven' },
        ],
      },
    ],
  },
];
