import type { WizardStep, WizardConfig, RiskLevel, RiskFinding, Recommendation } from '@/lib/wizard-types';

export const STEPS: WizardStep[] = [
  {
    id: 'inventory',
    title: 'Inventarisatie',
    description:
      'Breng in kaart welke trillende gereedschappen, machines en voertuigen worden gebruikt en welke functies zijn blootgesteld.',
    questions: [
      {
        id: 'vib-type',
        label: 'Welk type trillingen komt voor op de werkplek? (meerdere mogelijk)',
        type: 'checkbox',
        tip: 'Hand-armtrillingen (HAV) ontstaan bij het vasthouden van trillend gereedschap. Hele-lichaamstrillingen (WBV) treden op bij het besturen of rijden op voertuigen en mobiele werktuigen.',
        options: [
          { value: 'hav', label: 'Hand-armtrillingen (HAV) — gebruik van trillende handgereedschappen, slijpmachines, boren, hamers' },
          { value: 'wbv', label: 'Hele-lichaamstrillingen (WBV) — gebruik van voertuigen, heftrucks, bouwmachines, landbouwvoertuigen' },
        ],
      },
      {
        id: 'vib-tools',
        label: 'Welke trillende gereedschappen of voertuigen worden gebruikt?',
        type: 'text',
        tip: 'Geef zo specifiek mogelijk aan welke apparatuur wordt gebruikt. Fabrikant en type zijn nodig voor het opzoeken van vibratiewaarden in de productdocumentatie (EU-conformiteitsverklaring, art. 7.18a Arbobesluit).',
      },
      {
        id: 'vib-duration',
        label: 'Hoe lang wordt dagelijks gewerkt met trillende gereedschappen of voertuigen?',
        type: 'radio',
        options: [
          { value: 'short', label: 'Kort — minder dan 30 minuten per dag' },
          { value: 'medium', label: 'Matig — 30 minuten tot 2 uur per dag' },
          { value: 'long', label: 'Lang — meer dan 2 uur per dag' },
        ],
      },
      {
        id: 'vib-complaints',
        label: 'Zijn er klachten bekend bij medewerkers die met trillend gereedschap of voertuigen werken?',
        type: 'radio',
        tip: 'Klachten die wijzen op HAVS: witte vingers (Raynaud), tintelingen, gevoelloosheid, verminderde grijpkracht. WBV-klachten: chronische lage rugpijn, nekklachten.',
        options: [
          { value: 'yes', label: 'Ja, er zijn klachten bekend' },
          { value: 'no', label: 'Nee, geen bekende klachten' },
          { value: 'unknown', label: 'Onbekend' },
        ],
      },
    ],
  },
  {
    id: 'current-measures',
    title: 'Huidige maatregelen',
    description: 'Inventariseer welke beheersmaatregelen al aanwezig zijn.',
    questions: [
      {
        id: 'vib-measures-existing',
        label: 'Welke maatregelen zijn al genomen? (meerdere mogelijk)',
        type: 'checkbox',
        options: [
          { value: 'low-vib-tools', label: 'Gebruik van gecertificeerd laagtrillend gereedschap' },
          { value: 'rotation', label: 'Werktaakroulatie om blootstellingsduur te beperken' },
          { value: 'ppe', label: 'Trillingsdempende handschoenen of zitdemping (WBV)' },
          { value: 'maintenance', label: 'Regelmatig onderhoud van gereedschappen en voertuigen' },
          { value: 'training', label: 'Voorlichting en instructie aan medewerkers' },
          { value: 'health-monitoring', label: 'Gezondheidstoezicht (PAGO/PMO op HAVS of rugklachten)' },
          { value: 'none', label: 'Geen specifieke maatregelen getroffen' },
        ],
      },
    ],
  },
];

export const WIZARD_CONFIG: WizardConfig = {
  steps: STEPS,
  assessRisk(answers) {
    const type = answers['vib-type'] as string[] | undefined ?? [];
    const duration = answers['vib-duration'] as string | undefined;
    const complaints = answers['vib-complaints'] as string | undefined;
    const measures = answers['vib-measures-existing'] as string[] | undefined ?? [];

    const findings: RiskFinding[] = [];
    const recommendations: Recommendation[] = [];
    const dataGaps: string[] = [];

    const longDuration = duration === 'long';
    const mediumDuration = duration === 'medium';
    const hasComplaints = complaints === 'yes';
    const unknownComplaints = complaints === 'unknown';
    const noMeasures = measures.includes('none') || measures.length === 0;

    if (!duration) dataGaps.push('Gebruiksduur per dag niet opgegeven — nodig voor A(8)-berekening.');
    if (!type.length) dataGaps.push('Type trillingen (HAV/WBV) niet gespecificeerd.');
    if (unknownComplaints) dataGaps.push('Klachteninventarisatie bij medewerkers niet uitgevoerd.');

    if (type.includes('hav')) {
      const level: RiskLevel =
        longDuration && hasComplaints ? 'high' :
        longDuration || (mediumDuration && hasComplaints) ? 'medium' :
        'low';

      findings.push({
        level,
        topic: 'Hand-armtrillingen (HAV)',
        summary: longDuration
          ? 'Langdurig gebruik van trillend handgereedschap. Actiewaarde (EAV = 2,5 m/s²) mogelijk overschreden.'
          : 'Blootstelling aan hand-armtrillingen vastgesteld. Kwantificeer A(8) via fabrikantwaarden en gebruiksduur.',
        detail: 'Conform Arbobesluit art. 6.11b dient de dagelijkse trillingsblootstelling A(8) niet de ELV van 5,0 m/s² te overschrijden. Boven de EAV van 2,5 m/s² zijn actieve beheersmaatregelen verplicht.',
        legalBasis: 'Arbobesluit art. 6.11a–6.11g; Richtlijn 2002/44/EG; ISO 5349-1/2',
      });

      recommendations.push(
        {
          priority: noMeasures ? 1 : 2,
          ahsStep: 'Meting',
          action: 'Bepaal de dagelijkse trillingsblootstelling A(8) op basis van EU-conformiteitsverklaring vibratiewaarden en werkelijk gemeten gebruiksduur per gereedschapstype.',
          why: 'Noodzakelijk voor toetsing aan EAV (2,5 m/s²) en ELV (5,0 m/s²) conform art. 6.11b Arbobesluit.',
          legalBasis: 'Arbobesluit art. 6.11b; ISO 5349-1',
        },
        {
          priority: 2,
          ahsStep: 'Technisch',
          action: 'Vervang hoog-trillend gereedschap door gecertificeerde laagtrillende alternatieven (raadpleeg HAV-productdatabase HSE of TNO).',
          why: 'Bronmaatregel conform de arbeidshygienische strategie: reductie van trillingsemissie aan de bron heeft prioriteit boven organisatorische en persoonlijke maatregelen.',
          legalBasis: 'Arbobesluit art. 6.11e; Arbeidshygienische strategie',
        },
        {
          priority: 2,
          ahsStep: 'Organisatorisch',
          action: 'Voer werktaakroulatie in: beperk de continue gebruiksduur per medewerker per gereedschapstype en gun hersteltijd.',
          why: 'Beperkt de cumulatieve trillingsenergie per werkdag en reduceert risico op HAVS.',
        },
        {
          priority: 3,
          ahsStep: 'Gezondheidstoezicht',
          action: 'Stel periodiek gezondheidstoezicht (PAGO) in voor blootgestelde medewerkers met de Stockholm Workshop Scale voor vroegherkenning van HAVS.',
          why: 'Vroegtijdige signalering van HAVS (witte vingers, neuropathie) maakt tijdige interventie mogelijk.',
          legalBasis: 'Arbobesluit art. 6.11g',
        },
      );
    }

    if (type.includes('wbv')) {
      const level: RiskLevel =
        longDuration && hasComplaints ? 'high' :
        longDuration || (mediumDuration && hasComplaints) ? 'medium' :
        'low';

      findings.push({
        level,
        topic: 'Hele-lichaamstrillingen (WBV)',
        summary: longDuration
          ? 'Dagelijks langdurig rijden op voertuigen. Actiewaarde (EAV = 0,5 m/s²) mogelijk overschreden.'
          : 'Blootstelling aan hele-lichaamstrillingen vastgesteld. Kwantificeer A(8) via meting of fabrikantdocumentatie.',
        detail: 'Conform Arbobesluit art. 6.11b dient de dagelijkse WBV-blootstelling A(8) niet de ELV van 1,15 m/s² te overschrijden. Boven EAV van 0,5 m/s² zijn maatregelen verplicht.',
        legalBasis: 'Arbobesluit art. 6.11a–6.11g; Richtlijn 2002/44/EG; ISO 2631-1',
      });

      recommendations.push(
        {
          priority: noMeasures ? 1 : 2,
          ahsStep: 'Meting',
          action: 'Meet of bereken de dagelijkse WBV-blootstelling A(8) conform ISO 2631-1; raadpleeg de voertuigfabrikant voor emissiewaarden (EU-typegoedkeuring).',
          why: 'Noodzakelijk voor toetsing aan EAV (0,5 m/s²) en ELV (1,15 m/s²) conform art. 6.11b Arbobesluit.',
          legalBasis: 'Arbobesluit art. 6.11b; ISO 2631-1',
        },
        {
          priority: 2,
          ahsStep: 'Technisch',
          action: 'Pas actieve of passieve zitdemping toe (ISO 7096-gecertificeerde trillingsgedempte bestuurdersstoel). Onderhoud rijbaanoppervlakken.',
          why: 'Vermindert de overdracht van voertuigtrillingen naar het lichaam van de bestuurder.',
        },
        {
          priority: 3,
          ahsStep: 'Organisatorisch',
          action: 'Plan rijpauzes en taakroulatie om de cumulatieve WBV-blootstelling per dag te beperken; vermijd onverharde of beschadigde rijroutes.',
          why: 'Beperkt de totale dagelijkse trillingsenergie en geeft het lichaam hersteltijd.',
        },
      );
    }

    if (!type.length) {
      findings.push({
        level: 'low',
        topic: 'Trillingen',
        summary: 'Op basis van de inventarisatie zijn geen aanwijzingen voor significante trillingsblootstelling vastgesteld.',
        detail: 'Herhaal de inventarisatie bij introductie van nieuwe gereedschappen, machines of voertuigen.',
      });
    }

    const order: RiskLevel[] = ['unknown', 'low', 'medium', 'high', 'critical'];
    const overallLevel = findings.reduce<RiskLevel>(
      (acc, f) => order.indexOf(f.level) > order.indexOf(acc) ? f.level : acc,
      'unknown',
    );

    return { overallLevel, findings, recommendations, dataGaps };
  },
};
