import type {
  WizardStep,
  WizardAnswers,
  WizardConfig,
  RiskFinding,
  Recommendation,
  RiskAssessmentResult,
  RiskLevel,
} from '@/lib/wizard-types';

// ─── Helper predicates ────────────────────────────────────────────────────────

const radio = (a: WizardAnswers, id: string, v: string) => a[id] === v;
const radioAny = (a: WizardAnswers, id: string, vs: string[]) =>
  vs.includes(a[id] as string);
const checked = (a: WizardAnswers, id: string, v: string) =>
  Array.isArray(a[id]) && (a[id] as string[]).includes(v);
const hasCMR = (a: WizardAnswers) =>
  checked(a, 'haz2-categories', 'cmr-1a') || checked(a, 'haz2-categories', 'cmr-1b');
const isQuantified = (a: WizardAnswers) =>
  radioAny(a, 'haz3-quantified', ['yes-nen689', 'yes-rekentool', 'yes-indicative']);

// ─── Steps ────────────────────────────────────────────────────────────────────

export const STEPS: WizardStep[] = [
  // ── Stap 1: Werkplek & blootgestelde medewerkers ──────────────────────────
  {
    id: 'haz-step1-workplace',
    title: 'Werkplek & blootgestelde medewerkers',
    description:
      'Beschrijf de werkplek en breng in kaart welke medewerkers(groepen) worden blootgesteld aan gevaarlijke stoffen en bij welke taken.',
    questions: [
      {
        id: 'haz1-sector',
        label: 'In welke sector of branche is uw organisatie actief?',
        type: 'radio',
        options: [
          { value: 'manufacturing', label: 'Industrie / productie' },
          { value: 'construction', label: 'Bouw / installatie' },
          { value: 'healthcare', label: 'Zorg / laboratorium' },
          { value: 'agriculture', label: 'Agrarisch / tuinbouw' },
          { value: 'cleaning', label: 'Schoonmaak / facilitair' },
          { value: 'other', label: 'Anders' },
        ],
      },
      {
        id: 'haz1-workers',
        label: 'Hoeveel medewerkers worden (mogelijk) blootgesteld aan gevaarlijke stoffen?',
        type: 'radio',
        options: [
          { value: '1', label: '1 medewerker' },
          { value: '2-10', label: '2 – 10 medewerkers' },
          { value: '11-50', label: '11 – 50 medewerkers' },
          { value: '50+', label: 'Meer dan 50 medewerkers' },
        ],
      },
      {
        id: 'haz1-tasks',
        label:
          'Beschrijf de taken of werkprocessen waarbij blootstelling optreedt, en welke medewerkergroepen daarbij betrokken zijn.',
        type: 'text',
        required: false,
        placeholder:
          'Bijv. spuiten van verf in cabine (spuiter), reinigen met oplosmiddelen (monteur), mengen van additieven (productiemedewerker)…',
        tip: 'Denk ook aan schoonmaak, onderhoud, laden/lossen en incidentele taken. Vergeet zzp\'ers, uitzendkrachten en stagiairs niet.',
      },
      {
        id: 'haz1-rie',
        label: 'Is de risicobeoordeling gevaarlijke stoffen al opgenomen in een actuele RI&E?',
        type: 'radio',
        tip: 'De RI&E moet actueel zijn bij relevante wijzigingen en minimaal elke 4 jaar getoetst worden door een gecertificeerd arbodeskundige (>25 medewerkers).',
        options: [
          { value: 'yes', label: 'Ja — volledig en actueel' },
          { value: 'partial', label: 'Gedeeltelijk — niet volledig of niet actueel' },
          { value: 'no', label: 'Nee — RI&E ontbreekt of gevaarlijke stoffen zijn niet opgenomen' },
        ],
      },
    ],
  },

  // ── Stap 2: Stoffen en gevaarseigenschappen ───────────────────────────────
  {
    id: 'haz-step2-substances',
    title: 'Stoffen en gevaarseigenschappen',
    description:
      'Breng in kaart welke gevaarlijke stoffen aanwezig zijn, wat hun gevaarseigenschappen zijn en of er CMR-stoffen bij zitten.',
    questions: [
      {
        id: 'haz2-sds',
        label:
          'Is er voor elke gevaarlijke stof een actueel Veiligheidsinformatieblad (VIB/SDS) beschikbaar en zijn alle stoffen in een stoffenregister opgenomen?',
        type: 'radio',
        tip: 'Controleer de uitgiftedatum in VIB-rubriek 1. Grenswaarden en aanbevolen PBM staan in rubriek 8.',
        options: [
          {
            value: 'yes',
            label: 'Ja — actueel (niet ouder dan 3 jaar), volledig stoffenregister aanwezig',
          },
          {
            value: 'partial',
            label: 'Gedeeltelijk — niet voor alle stoffen, of sommige VIB\'s zijn verouderd',
          },
          { value: 'no', label: 'Nee — VIB\'s ontbreken of geen stoffenregister' },
        ],
      },
      {
        id: 'haz2-categories',
        label:
          'Welke gevaarcategorieën zijn aanwezig op de werkplek? (meerdere mogelijk)',
        type: 'checkbox',
        tip: 'Raadpleeg VIB-rubriek 2 voor H-zinnen. CMR 1A/1B: H340/H350/H360 resp. H341/H351/H361.',
        options: [
          { value: 'cmr-1a', label: 'CMR categorie 1A (H340/H350/H360) — bewezen carcinogeen/mutageen/reproductietoxisch' },
          { value: 'cmr-1b', label: 'CMR categorie 1B (H341/H351/H361) — vermoedelijk carcinogeen/mutageen/reproductietoxisch' },
          { value: 'cmr-2', label: 'CMR categorie 2 — verdacht' },
          { value: 'sensitizing', label: 'Sensibiliserend (H317 huidsensibilisering / H334 luchtwegsensibilisering)' },
          { value: 'toxic', label: 'Acuut toxisch (H300/H310/H330)' },
          { value: 'irritant', label: 'Irriterend of huidcorrosief (H314/H315/H319)' },
          { value: 'none', label: 'Geen van bovenstaande / onbekend' },
        ],
      },
      {
        id: 'haz2-substitution',
        label:
          'Is vervanging door een minder gevaarlijke stof of werkwijze onderzocht en gedocumenteerd?',
        type: 'radio',
        tip: 'Voor CMR 1A/1B geldt een wettelijke vervangingsplicht (art. 4.17 Arbobesluit). Leg de afweging altijd schriftelijk vast.',
        visibleWhen: (a) => hasCMR(a),
        options: [
          { value: 'yes', label: 'Ja — onderzocht, gedocumenteerd en aantoonbaar niet haalbaar' },
          {
            value: 'partial',
            label: 'Gedeeltelijk — onderzoek is gestart maar nog niet afgerond of vastgelegd',
          },
          { value: 'no', label: 'Nee — nog niet onderzocht' },
        ],
      },
    ],
  },

  // ── Stap 3: Blootstellingsbeoordeling ─────────────────────────────────────
  {
    id: 'haz-step3-exposure',
    title: 'Blootstellingsbeoordeling',
    description:
      'Stel vast hoe de blootstelling is beoordeeld en wat de uitkomst is ten opzichte van de geldende grenswaarden (OELV\'s).',
    questions: [
      {
        id: 'haz3-quantified',
        label: 'Is de blootstelling kwantitatief bepaald?',
        type: 'radio',
        tip: 'Pas altijd de gelaagde aanpak toe: kwalitatief → rekenmodel → meting. Wijst de kwalitatieve beoordeling op laag risico, dan is verdere kwantificering niet altijd nodig.',
        options: [
          { value: 'yes-nen689', label: 'Ja — volledige meetcampagne conform NEN-EN 689' },
          { value: 'yes-rekentool', label: 'Ja — rekenmodel (Stoffenmanager, ECETOC TRA, ART)' },
          { value: 'yes-indicative', label: 'Ja — oriënterende meting (niet conform NEN-EN 689)' },
          { value: 'no-qualitative', label: 'Nee — alleen kwalitatieve beoordeling gedaan' },
          { value: 'no-none', label: 'Nee — geen beoordeling uitgevoerd' },
        ],
      },
      {
        id: 'haz3-process-type',
        label: 'Wat is het type werkproces waarbij blootstelling optreedt?',
        type: 'radio',
        tip: 'Open processen met hoge emissie zijn een sterke indicator voor hoge blootstelling als er geen adequate beheersmaatregelen zijn.',
        visibleWhen: (a) => !isQuantified(a),
        options: [
          { value: 'closed', label: 'Gesloten systeem — stof komt niet vrij' },
          { value: 'low-emission', label: 'Open proces met lage emissie (kleine hoeveelheden, laag dampspanning)' },
          { value: 'high-emission', label: 'Open proces met hoge emissie (spuiten, gieten, slijpen, grote oppervlakken)' },
          { value: 'unknown', label: 'Onbekend' },
        ],
      },
      {
        id: 'haz3-oelv-result',
        label: 'Wat is de uitkomst van de blootstellingsbeoordeling t.o.v. de grenswaarde (OELV)?',
        type: 'radio',
        tip: 'NEN-EN 689: statistische toets op overschrijdingskans (Pe < 5%). Bij rekenmodellen: vergelijk modeluitkomst direct met de OELV.',
        visibleWhen: (a) => isQuantified(a),
        options: [
          { value: 'below-10pct', label: '< 10% van de OELV — verwaarloosbaar risico' },
          { value: '10-50pct', label: '10 – 50% van de OELV — laag risico, monitoring aanbevolen' },
          { value: '50-100pct', label: '50 – 100% van de OELV — aandacht vereist' },
          { value: 'above-oel', label: '> 100% van de OELV (overschrijding) — directe maatregelen verplicht' },
          { value: 'unknown', label: 'Nog niet bepaald' },
        ],
      },
    ],
  },

  // ── Stap 4: Huidige beheersmaatregelen ────────────────────────────────────
  {
    id: 'haz-step4-controls',
    title: 'Huidige beheersmaatregelen',
    description:
      'Breng in kaart welke beheersmaatregelen al aanwezig zijn, conform de Arbeidshygiënische Strategie (AHS).',
    questions: [
      {
        id: 'haz4-technical',
        label: 'Welke technische maatregelen zijn aanwezig? (meerdere mogelijk)',
        type: 'checkbox',
        options: [
          { value: 'closed-system', label: 'Gesloten of ingekapseld systeem' },
          { value: 'lev', label: 'Lokale afzuiging (LEV) direct bij de bron' },
          { value: 'general-ventilation', label: 'Algemene verdunningsventilatie (als aanvulling)' },
          { value: 'wet-methods', label: 'Nat werken of stofbindende middelen' },
          { value: 'mechanisation', label: 'Mechanische verwerking i.p.v. handmatig' },
          { value: 'none', label: 'Geen technische maatregelen aanwezig' },
        ],
      },
      {
        id: 'haz4-lev-inspected',
        label: 'Is de LEV-installatie periodiek gekeurd op effectiviteit?',
        type: 'radio',
        tip: 'LEV dient minimaal jaarlijks gekeurd te worden. Een ongekeurde afzuiging geeft een vals gevoel van veiligheid.',
        visibleWhen: (a) => checked(a, 'haz4-technical', 'lev'),
        options: [
          { value: 'yes-recent', label: 'Ja — gekeurd en goedgekeurd, rapport aanwezig' },
          { value: 'yes-outdated', label: 'Ja — maar de laatste keuring is meer dan 1 jaar geleden' },
          { value: 'no', label: 'Nee — nooit gekeurd of geen keuringsrapport aanwezig' },
        ],
      },
      {
        id: 'haz4-ppe',
        label: 'Zijn PBM beschikbaar als aanvullende maatregel? (meerdere mogelijk)',
        type: 'checkbox',
        options: [
          { value: 'respirator', label: 'Ademhalingsbescherming van het juiste type en filterklasse' },
          { value: 'gloves', label: 'Handschoenen met gecontroleerde chemische bestendigheid' },
          { value: 'eye-clothing', label: 'Oog- en/of huidbescherming (bril, spatbril, beschermende kleding)' },
          { value: 'usage-monitored', label: 'Gebruik van PBM wordt aantoonbaar gemonitord' },
          { value: 'none', label: 'Geen PBM aanwezig of van toepassing' },
        ],
      },
      {
        id: 'haz4-ppe-only',
        label: 'Zijn PBM de enige maatregel (zonder onderliggende technische of organisatorische maatregelen)?',
        type: 'radio',
        tip: 'Conform de AHS zijn PBM altijd een aanvulling, nooit de primaire maatregel. PBM als enige maatregel is een overtreding van art. 4.4 Arbobesluit.',
        visibleWhen: (a) =>
          Array.isArray(a['haz4-ppe']) &&
          (a['haz4-ppe'] as string[]).length > 0 &&
          !(a['haz4-ppe'] as string[]).includes('none'),
        options: [
          { value: 'yes', label: 'Ja — PBM zijn de enige maatregel' },
          {
            value: 'no',
            label: 'Nee — er zijn ook technische en/of organisatorische maatregelen getroffen',
          },
        ],
      },
      {
        id: 'haz4-training',
        label: 'Zijn medewerkers aantoonbaar geïnformeerd over de risico\'s en correct gebruik van PBM?',
        type: 'radio',
        tip: '"Aantoonbaar" betekent dat u bij een inspectie kunt laten zien dat medewerkers zijn geïnstrueerd (handtekeningenlijst, e-learning logboek, opleidingsregistratie).',
        options: [
          { value: 'yes-periodic', label: 'Ja — aantoonbaar en periodiek herhaald' },
          { value: 'yes-once', label: 'Ja — eenmalig bij indiensttreding, niet periodiek herhaald' },
          { value: 'no', label: 'Nee — geen aantoonbare instructie gegeven' },
        ],
      },
    ],
  },

  // ── Stap 5: CMR-aanvullende maatregelen (alleen zichtbaar bij CMR 1A/1B) ──
  {
    id: 'haz-step5-cmr',
    title: 'CMR-aanvullende maatregelen',
    description:
      'Voor CMR-stoffen categorie 1A en 1B gelden wettelijk verplichte aanvullende maatregelen. Controleer of deze zijn ingericht.',
    visibleWhen: (a) => hasCMR(a),
    questions: [
      {
        id: 'haz5-closed-system',
        label:
          'Is een gesloten systeem of maximale insluiting toegepast (wettelijk verplicht als technisch haalbaar)?',
        type: 'radio',
        tip: 'Art. 4.18 Arbobesluit: bij CMR 1A/1B moet een gesloten systeem worden gebruikt tenzij dit technisch niet haalbaar is. Leg dit dan schriftelijk onderbouwd vast.',
        options: [
          { value: 'yes', label: 'Ja — gesloten systeem is aanwezig en wordt gebruikt' },
          {
            value: 'no-motivated',
            label: 'Nee — open proces, maar dit is schriftelijk onderbouwd als technisch niet haalbaar',
          },
          { value: 'no', label: 'Nee — open proces zonder schriftelijke onderbouwing' },
        ],
      },
      {
        id: 'haz5-register',
        label:
          'Is er een blootstellingsregister aangelegd met de gegevens van alle blootgestelde medewerkers?',
        type: 'radio',
        tip: 'Art. 4.15 Arbobesluit: het register moet minimaal 40 jaar na de laatste blootstelling bewaard blijven.',
        options: [
          { value: 'yes', label: 'Ja — register is aanwezig, actueel en veilig bewaard (40-jaarstermijn geborgd)' },
          { value: 'partial', label: 'Gedeeltelijk — register bestaat maar is niet compleet of bewaartermijn is niet geborgd' },
          { value: 'no', label: 'Nee — register ontbreekt' },
        ],
      },
      {
        id: 'haz5-medical',
        label:
          'Worden blootgestelde medewerkers periodiek medisch onderzocht via de bedrijfsarts?',
        type: 'radio',
        tip: 'Art. 4.10a Arbobesluit: periodiek medisch onderzoek (PAGO/PMO) is verplicht bij CMR 1A/1B. Medewerkers hebben recht op dit onderzoek.',
        options: [
          { value: 'yes', label: 'Ja — periodiek PMO/PAGO wordt aangeboden en geregistreerd' },
          { value: 'partial', label: 'Gedeeltelijk — niet voor alle blootgestelde medewerkers' },
          { value: 'no', label: 'Nee — geen medisch toezicht ingericht' },
        ],
      },
    ],
  },

  // ── Stap 6: Documentatie en borging ──────────────────────────────────────
  {
    id: 'haz-step6-documentation',
    title: 'Documentatie en borging',
    description:
      'Controleer of de risicobeoordeling is vastgelegd, verbetermaatregelen zijn geprioriteerd en de herbeoordeling is geborgd.',
    questions: [
      {
        id: 'haz6-action-plan',
        label:
          'Zijn de verbetermaatregelen uit de risicobeoordeling opgenomen in een plan van aanpak met verantwoordelijke, prioritering en uitvoertermijn?',
        type: 'radio',
        options: [
          { value: 'yes', label: 'Ja — plan van aanpak is actueel en wordt bijgehouden' },
          { value: 'partial', label: 'Gedeeltelijk — plan bestaat maar is niet compleet of niet actueel' },
          { value: 'no', label: 'Nee — plan van aanpak ontbreekt' },
        ],
      },
      {
        id: 'haz6-review',
        label:
          'Is er een afspraak gemaakt over de periodieke herbeoordeling van de blootstellingssituatie?',
        type: 'radio',
        tip: 'Triggercriteria voor vervroegde herbeoordeling: nieuwe stof, proceswijziging, gewijzigde OELV, nieuwe toxicologische inzichten, of signalen van gezondheidsklachten.',
        options: [
          {
            value: 'yes',
            label: 'Ja — herbeoordelingstermijn vastgelegd (max. 5 jaar) én triggercriteria beschreven',
          },
          { value: 'partial', label: 'Gedeeltelijk — termijn of triggercriteria ontbreekt' },
          { value: 'no', label: 'Nee — geen herbeoordeling gepland' },
        ],
      },
      {
        id: 'haz6-docs',
        label:
          'Zijn meetrapporten, blootstellingsbeoordelingen en VIB\'s gedocumenteerd en toegankelijk conform wettelijke bewaartermijnen?',
        type: 'radio',
        tip: 'CMR-documenten: minimaal 40 jaar. Overige gevaarlijke stoffen: minimaal 5 jaar.',
        options: [
          { value: 'yes', label: 'Ja — centraal opgeslagen, toegankelijk en conform bewaartermijnen' },
          { value: 'partial', label: 'Gedeeltelijk — niet alle documenten beschikbaar of bewaartermijnen niet geborgd' },
          { value: 'no', label: 'Nee — documentatie onvolledig of bewaartermijnen niet geborgd' },
        ],
      },
    ],
  },
];

// ─── Risk assessment ──────────────────────────────────────────────────────────

const LEVEL_ORDER: Record<RiskLevel, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
  unknown: 0,
};

function maxLevel(levels: RiskLevel[]): RiskLevel {
  return levels.reduce<RiskLevel>(
    (max, l) => (LEVEL_ORDER[l] > LEVEL_ORDER[max] ? l : max),
    'unknown',
  );
}

function assessRisk(answers: WizardAnswers): RiskAssessmentResult {
  const findings: RiskFinding[] = [];
  const recommendations: Recommendation[] = [];
  const dataGaps: string[] = [];
  let priority = 1;

  function addFinding(f: RiskFinding) {
    findings.push(f);
  }

  function addRec(r: Omit<Recommendation, 'priority'>) {
    recommendations.push({ priority: priority++, ...r });
  }

  // ── RI&E ──────────────────────────────────────────────────────────────────
  if (radio(answers, 'haz1-rie', 'no')) {
    addFinding({
      topic: 'RI&E',
      level: 'high',
      summary: 'Risicobeoordeling gevaarlijke stoffen ontbreekt in de RI&E.',
      legalBasis: 'Art. 5 Arbowet',
    });
    addRec({
      ahsStep: 'Documentatie',
      action: 'Neem de risicobeoordeling gevaarlijke stoffen op in de RI&E.',
      why: 'Wettelijke verplichting (art. 5 Arbowet). Bij een inspectie levert dit direct een boete op.',
      deadline: '3 maanden',
      legalBasis: 'Art. 5 Arbowet',
    });
  } else if (radio(answers, 'haz1-rie', 'partial')) {
    addFinding({
      topic: 'RI&E',
      level: 'medium',
      summary: 'RI&E is niet volledig of niet actueel voor gevaarlijke stoffen.',
      legalBasis: 'Art. 5 Arbowet',
    });
    addRec({
      ahsStep: 'Documentatie',
      action: 'Actualiseer de RI&E zodat alle gevaarlijke stoffen en blootstellingsituaties zijn opgenomen.',
      why: 'Onvolledige RI&E voldoet niet aan wettelijke verplichtingen.',
      deadline: '6 maanden',
      legalBasis: 'Art. 5 Arbowet',
    });
  }

  // ── Stoffenregister / SDS ─────────────────────────────────────────────────
  if (radio(answers, 'haz2-sds', 'no')) {
    addFinding({
      topic: 'Stoffenregister & SDS',
      level: 'high',
      summary: 'Veiligheidsinformatiebladen ontbreken of er is geen stoffenregister.',
      legalBasis: 'Art. 4.2 Arbobesluit; REACH Verordening (EG) 1907/2006',
    });
    addRec({
      ahsStep: 'Stap 1 — Inventarisatie',
      action: 'Stel voor elke gevaarlijke stof een actueel VIB op en leg een compleet stoffenregister aan.',
      why: 'Zonder SDS en register kunt u de risico\'s niet beoordelen en niet aantonen dat u aan uw zorgplicht voldoet.',
      deadline: '1 maand',
      legalBasis: 'Art. 4.2 Arbobesluit',
    });
  } else if (radio(answers, 'haz2-sds', 'partial')) {
    addFinding({
      topic: 'Stoffenregister & SDS',
      level: 'medium',
      summary: 'Niet voor alle stoffen is een actueel VIB beschikbaar of het stoffenregister is onvolledig.',
      legalBasis: 'Art. 4.2 Arbobesluit',
    });
    addRec({
      ahsStep: 'Stap 1 — Inventarisatie',
      action: 'Compleet het stoffenregister en vernieuw verouderde VIB\'s.',
      why: 'Verouderde VIB\'s bevatten mogelijk onjuiste grenswaarden en PBM-adviezen.',
      deadline: '3 maanden',
      legalBasis: 'Art. 4.2 Arbobesluit',
    });
  }

  // ── CMR-stoffen ───────────────────────────────────────────────────────────
  if (hasCMR(answers)) {
    // Vervangingsplicht
    if (radio(answers, 'haz2-substitution', 'no')) {
      addFinding({
        topic: 'CMR — Vervangingsplicht',
        level: 'high',
        summary: 'Vervanging van CMR 1A/1B-stoffen is niet onderzocht of niet gedocumenteerd.',
        legalBasis: 'Art. 4.17 Arbobesluit',
      });
      addRec({
        ahsStep: 'Stap 1 — Eliminatie/Vervanging',
        action: 'Onderzoek of CMR 1A/1B-stoffen vervangen kunnen worden door minder gevaarlijke alternatieven en leg de afweging schriftelijk vast.',
        why: 'De vervangingsplicht is wettelijk verankerd. Zonder gedocumenteerde afweging is er sprake van een overtreding.',
        deadline: '2 maanden',
        legalBasis: 'Art. 4.17 Arbobesluit',
      });
    }

    // Blootstellingsregister
    if (radio(answers, 'haz5-register', 'no')) {
      addFinding({
        topic: 'CMR — Blootstellingsregister',
        level: 'critical',
        summary: 'Blootstellingsregister voor CMR 1A/1B-stoffen ontbreekt (40-jaar bewaartermijn).',
        legalBasis: 'Art. 4.15 Arbobesluit',
      });
      addRec({
        ahsStep: 'Documentatie',
        action: 'Leg onmiddellijk een blootstellingsregister aan voor alle medewerkers die worden blootgesteld aan CMR 1A/1B-stoffen.',
        why: 'Wettelijk verplicht. Latente ziekten (kanker) kunnen decennia later optreden. Bewaartermijn: 40 jaar.',
        deadline: '1 maand',
        legalBasis: 'Art. 4.15 Arbobesluit',
      });
    } else if (radio(answers, 'haz5-register', 'partial')) {
      addFinding({
        topic: 'CMR — Blootstellingsregister',
        level: 'high',
        summary: 'Blootstellingsregister is onvolledig of de 40-jaar bewaartermijn is niet geborgd.',
        legalBasis: 'Art. 4.15 Arbobesluit',
      });
    }

    // Medisch toezicht
    if (radio(answers, 'haz5-medical', 'no')) {
      addFinding({
        topic: 'CMR — Medisch toezicht',
        level: 'high',
        summary: 'Geen periodiek medisch onderzoek (PMO/PAGO) ingericht voor medewerkers die worden blootgesteld aan CMR 1A/1B-stoffen.',
        legalBasis: 'Art. 4.10a Arbobesluit',
      });
      addRec({
        ahsStep: 'Stap 3 — Organisatie',
        action: 'Regel periodiek medisch toezicht via de bedrijfsarts voor alle medewerkers blootgesteld aan CMR 1A/1B.',
        why: 'Wettelijk verplicht. Vroege detectie van gezondheidsschade is alleen mogelijk via regelmatige monitoring.',
        deadline: '3 maanden',
        legalBasis: 'Art. 4.10a Arbobesluit',
      });
    } else if (radio(answers, 'haz5-medical', 'partial')) {
      addFinding({
        topic: 'CMR — Medisch toezicht',
        level: 'medium',
        summary: 'Medisch toezicht is niet voor alle blootgestelde medewerkers ingericht.',
        legalBasis: 'Art. 4.10a Arbobesluit',
      });
    }

    // Gesloten systeem
    if (radio(answers, 'haz5-closed-system', 'no')) {
      addFinding({
        topic: 'CMR — Gesloten systeem',
        level: 'critical',
        summary: 'Open proces met CMR 1A/1B-stoffen zonder schriftelijke onderbouwing dat gesloten systeem niet haalbaar is.',
        legalBasis: 'Art. 4.18 Arbobesluit',
      });
      addRec({
        ahsStep: 'Stap 2 — Techniek',
        action: 'Pas een gesloten systeem toe of onderbouw schriftelijk waarom dit technisch niet haalbaar is.',
        why: 'Wettelijk verplicht bij CMR 1A/1B. Zonder onderbouwing is er sprake van een directe overtreding.',
        deadline: '1 maand',
        legalBasis: 'Art. 4.18 Arbobesluit',
      });
    }
  }

  // ── Blootstellingsniveau ──────────────────────────────────────────────────
  if (isQuantified(answers)) {
    if (radio(answers, 'haz3-oelv-result', 'above-oel')) {
      addFinding({
        topic: 'Blootstelling',
        level: 'critical',
        summary: 'Gemeten blootstelling overschrijdt de grenswaarde (OELV > 100%).',
        detail: 'Directe maatregelen zijn wettelijk verplicht.',
        legalBasis: 'Art. 4.3 Arbobesluit',
      });
      addRec({
        ahsStep: 'Stap 2 — Techniek',
        action: 'Tref onmiddellijk technische maatregelen om de blootstelling onder de OELV te brengen. Stop de werkzaamheden als dit niet direct mogelijk is.',
        why: 'Overschrijding van de OELV is een directe wettelijke overtreding. Medewerkers lopen acuut gezondheidsrisico.',
        deadline: 'Onmiddellijk',
        legalBasis: 'Art. 4.3 Arbobesluit',
      });
    } else if (radio(answers, 'haz3-oelv-result', '50-100pct')) {
      addFinding({
        topic: 'Blootstelling',
        level: 'high',
        summary: 'Blootstelling ligt tussen 50% en 100% van de OELV — verbetermaatregelen zijn noodzakelijk.',
        legalBasis: 'Art. 4.3 Arbobesluit',
      });
      addRec({
        ahsStep: 'Stap 2 — Techniek',
        action: 'Onderzoek aanvullende technische maatregelen om de blootstelling verder te reduceren.',
        why: 'Blootstelling boven 50% OELV vereist concrete verbetermaatregelen conform de AHS.',
        deadline: '3 maanden',
        legalBasis: 'Art. 4.3 Arbobesluit',
      });
    } else if (radio(answers, 'haz3-oelv-result', '10-50pct')) {
      addFinding({
        topic: 'Blootstelling',
        level: 'medium',
        summary: 'Blootstelling ligt tussen 10% en 50% van de OELV — monitoring aanbevolen.',
      });
      addRec({
        ahsStep: 'Stap 3 — Organisatie',
        action: 'Leg een monitoringsplan vast en voer periodiek hermetingen uit.',
        why: 'Blootstelling in dit bereik vereist bewaking om verdere stijging tijdig te signaleren.',
        deadline: '6 maanden',
      });
    } else if (radio(answers, 'haz3-oelv-result', 'below-10pct')) {
      addFinding({
        topic: 'Blootstelling',
        level: 'low',
        summary: 'Blootstelling is duidelijk lager dan de OELV (< 10%) — verwaarloosbaar risico.',
      });
    }
  } else {
    // Niet gemeten
    if (radioAny(answers, 'haz3-process-type', ['high-emission', 'unknown'])) {
      addFinding({
        topic: 'Blootstelling',
        level: 'high',
        summary: 'Blootstelling is niet gekwantificeerd terwijl het procestype een significant emissierisico kent.',
      });
      addRec({
        ahsStep: 'Stap 2 — Techniek',
        action: 'Voer een kwantitatieve blootstellingsbeoordeling uit (rekenmodel of meting conform NEN-EN 689).',
        why: 'Zonder kwantificering is niet aantoonbaar dat de blootstelling acceptabel is.',
        deadline: '3 maanden',
        legalBasis: 'Art. 4.3 Arbobesluit',
      });
      dataGaps.push('Kwantitatieve blootstellingsgegevens ontbreken voor een hoog-emissieproces.');
    } else if (radio(answers, 'haz3-process-type', 'low-emission')) {
      addFinding({
        topic: 'Blootstelling',
        level: 'medium',
        summary: 'Blootstelling is niet gekwantificeerd. Op basis van procestype wordt een lage emissie verwacht.',
      });
      dataGaps.push('Kwantitatieve blootstellingsgegevens ontbreken — een kwalitatieve beoordeling is aanwezig.');
    } else if (radio(answers, 'haz3-process-type', 'closed')) {
      addFinding({
        topic: 'Blootstelling',
        level: 'low',
        summary: 'Gesloten systeem — blootstelling is inherent laag.',
      });
    } else if (radio(answers, 'haz3-quantified', 'no-none')) {
      addFinding({
        topic: 'Blootstelling',
        level: 'high',
        summary: 'Er is geen blootstellingsbeoordeling uitgevoerd.',
        legalBasis: 'Art. 4.3 Arbobesluit',
      });
      addRec({
        ahsStep: 'Stap 2 — Techniek',
        action: 'Start direct met een blootstellingsbeoordeling (minimaal kwalitatief, gevolgd door kwantificering waar nodig).',
        why: 'Zonder beoordeling kunt u niet bepalen of medewerkers adequaat worden beschermd.',
        deadline: '2 maanden',
        legalBasis: 'Art. 4.3 Arbobesluit',
      });
      dataGaps.push('Geen blootstellingsbeoordeling uitgevoerd.');
    }
  }

  // ── PBM als enige maatregel ───────────────────────────────────────────────
  if (radio(answers, 'haz4-ppe-only', 'yes')) {
    addFinding({
      topic: 'Beheersmaatregelen (AHS)',
      level: 'high',
      summary: 'PBM zijn de enige maatregel — schending van de Arbeidshygiënische Strategie.',
      detail: 'Technische en organisatorische maatregelen gaan voor PBM conform de AHS.',
      legalBasis: 'Art. 4.4 Arbobesluit',
    });
    addRec({
      ahsStep: 'Stap 2 — Techniek',
      action: 'Implementeer technische beheersmaatregelen (bijv. LEV, gesloten systeem). PBM mogen uitsluitend als aanvulling worden ingezet.',
      why: 'PBM als enige maatregel is een directe schending van de AHS en art. 4.4 Arbobesluit.',
      deadline: '3 maanden',
      legalBasis: 'Art. 4.4 Arbobesluit',
    });
  }

  // ── LEV-keuring ───────────────────────────────────────────────────────────
  if (radio(answers, 'haz4-lev-inspected', 'no')) {
    addFinding({
      topic: 'LEV-keuring',
      level: 'high',
      summary: 'LEV is nooit gekeurd of keuringsrapport ontbreekt.',
      legalBasis: 'Art. 4.5 Arbobesluit',
    });
    addRec({
      ahsStep: 'Stap 2 — Techniek',
      action: 'Laat de LEV direct keuren op effectiviteit door een deskundige.',
      why: 'Een ongekeurde afzuiging kan onvoldoende bescherming bieden zonder dat dit zichtbaar is.',
      deadline: '1 maand',
      legalBasis: 'Art. 4.5 Arbobesluit',
    });
  } else if (radio(answers, 'haz4-lev-inspected', 'yes-outdated')) {
    addFinding({
      topic: 'LEV-keuring',
      level: 'medium',
      summary: 'LEV-keuring is meer dan 1 jaar geleden — periodieke keuring is vereist.',
      legalBasis: 'Art. 4.5 Arbobesluit',
    });
    addRec({
      ahsStep: 'Stap 2 — Techniek',
      action: 'Plan een nieuwe LEV-keuring in.',
      why: 'LEV dient minimaal jaarlijks gekeurd te worden op effectiviteit.',
      deadline: '2 maanden',
      legalBasis: 'Art. 4.5 Arbobesluit',
    });
  }

  // ── Training ──────────────────────────────────────────────────────────────
  if (radio(answers, 'haz4-training', 'no')) {
    addFinding({
      topic: 'Voorlichting & instructie',
      level: 'medium',
      summary: 'Medewerkers zijn niet aantoonbaar geïnstrueerd over risico\'s en PBM-gebruik.',
      legalBasis: 'Art. 8 Arbowet',
    });
    addRec({
      ahsStep: 'Stap 3 — Organisatie',
      action: 'Geef medewerkers aantoonbare voorlichting over gevaarlijke stoffen en correct PBM-gebruik. Registreer de deelname.',
      why: 'Wettelijk verplicht (art. 8 Arbowet). Medewerkers moeten de risico\'s kennen om zich te kunnen beschermen.',
      deadline: '3 maanden',
      legalBasis: 'Art. 8 Arbowet',
    });
  } else if (radio(answers, 'haz4-training', 'yes-once')) {
    addFinding({
      topic: 'Voorlichting & instructie',
      level: 'medium',
      summary: 'Instructie is eenmalig gegeven bij indiensttreding, maar niet periodiek herhaald.',
      legalBasis: 'Art. 8 Arbowet',
    });
    addRec({
      ahsStep: 'Stap 3 — Organisatie',
      action: 'Stel een periodiek herhalingsschema in voor voorlichting over gevaarlijke stoffen.',
      why: 'Kennis neemt af en situaties veranderen. Periodieke herhaling houdt medewerkers scherp.',
      deadline: '6 maanden',
      legalBasis: 'Art. 8 Arbowet',
    });
  }

  // ── Plan van aanpak ───────────────────────────────────────────────────────
  if (radio(answers, 'haz6-action-plan', 'no')) {
    addFinding({
      topic: 'Plan van aanpak',
      level: 'medium',
      summary: 'Plan van aanpak ontbreekt voor gevaarlijke stoffen.',
      legalBasis: 'Art. 5 lid 3 Arbowet',
    });
    addRec({
      ahsStep: 'Documentatie',
      action: 'Stel een plan van aanpak op met prioritering, verantwoordelijken en uitvoertermijnen voor alle gevonden risico\'s.',
      why: 'Een plan van aanpak is wettelijk verplicht en nodig om structureel verbetering te boeken.',
      deadline: '2 maanden',
      legalBasis: 'Art. 5 lid 3 Arbowet',
    });
  }

  // ── Geen technische maatregelen ───────────────────────────────────────────
  if (checked(answers, 'haz4-technical', 'none')) {
    addFinding({
      topic: 'Beheersmaatregelen (AHS)',
      level: 'high',
      summary: 'Geen technische beheersmaatregelen aanwezig.',
      legalBasis: 'Art. 4.4 Arbobesluit',
    });
    addRec({
      ahsStep: 'Stap 2 — Techniek',
      action: 'Onderzoek en implementeer technische maatregelen conform de AHS (bronbeheersing, LEV, gesloten systeem).',
      why: 'Technische maatregelen zijn het primaire middel conform de AHS. PBM zijn onvoldoende als enige bescherming.',
      deadline: '3 maanden',
      legalBasis: 'Art. 4.4 Arbobesluit',
    });
  }

  // ── Overall level ─────────────────────────────────────────────────────────
  const overallLevel = findings.length > 0 ? maxLevel(findings.map((f) => f.level)) : 'low';

  // Sort recommendations by priority (already ascending from priority counter)
  recommendations.sort((a, b) => a.priority - b.priority);

  return { overallLevel, findings, recommendations, dataGaps };
}

// ─── Exports ──────────────────────────────────────────────────────────────────

export const WIZARD_CONFIG: WizardConfig = { steps: STEPS, assessRisk };
