import type { ThemeSlug } from '@/lib/themes';

export interface ThemeNorm {
  name: string;
  desc: string;
}

export interface ThemeLimit {
  label: string;
  value: string;
  sublabel?: string;
}

export interface ThemeLimitGroup {
  title: string;
  limits: ThemeLimit[];
}

export interface ThemeLegalData {
  color: {
    dot: string;
    limitBg: string;
    limitBorder: string;
  };
  legislation: string[];
  norms: ThemeNorm[];
  limitGroups?: ThemeLimitGroup[];
  adminObligations: string[];
}

export const THEME_LEGAL_INFO: Record<ThemeSlug, ThemeLegalData> = {
  sound: {
    color: {
      dot: 'bg-blue-500',
      limitBg: 'bg-blue-50 dark:bg-blue-950/30',
      limitBorder: 'border-blue-200 dark:border-blue-900',
    },
    legislation: [
      'Arbobesluit art. 6.5–6.11 — blootstelling aan lawaai: actiewaarden (LAV/UAV), grenswaarde, maatregelenprogramma, persoonlijke bescherming en gezondheidstoezicht',
      'Arbobesluit art. 2.14a (Arbowet art. 14) — verplichte inzet gecertificeerd deskundige bij overschrijding bovenste actiewaarde',
      'Arbowet art. 3 lid 1 — zorgverplichting en risico-inventarisatie & evaluatie (RI&E)',
      'Richtlijn 2003/10/EG — minimumgezondheids- en veiligheidsvoorschriften voor blootstelling van werknemers aan lawaai',
    ],
    norms: [
      { name: 'NEN-EN-ISO 9612:2025', desc: 'Akoestiek: bepaling van de blootstelling aan lawaai op de arbeidsplaats — ingenieursmethode (derde editie)' },
      { name: 'NEN-EN 458:2016', desc: 'Gehoorbeschermers: aanbevelingen voor selectie, gebruik, verzorging en onderhoud (H, M, L, SNR-methoden)' },
      { name: 'IEC 61672-1:2013', desc: 'Elektroakoestiek: specificaties voor geluidniveaumeters — klasse 1 (laboratorium) en klasse 2 (veldmeting)' },
      { name: 'IEC 61252:2002', desc: 'Elektroakoestiek: specificaties voor persoonlijke geluidsdosimeters' },
      { name: 'ISO 1999:2013', desc: 'Akoestiek: schatting van door lawaai veroorzaakte gehoordrempelverschuiving (NIPTS)' },
    ],
    limitGroups: [
      {
        title: 'Dagblootstelling [[L_{EX,8h}]] — Arbobesluit art. 6.5',
        limits: [
          { label: 'Onderste actiewaarde (LAV)', sublabel: 'zónder PBM', value: '≥ 80 dB(A)' },
          { label: 'Bovenste actiewaarde (UAV)', sublabel: 'zónder PBM', value: '≥ 85 dB(A)' },
          { label: 'Grenswaarde (GW)',           sublabel: 'mét PBM',    value: '≥ 87 dB(A)' },
        ],
      },
      {
        title: 'Piekgeluidsdruk [[L_{p,Cpeak}]]',
        limits: [
          { label: 'p-Onderste actiewaarde', value: '≥ 135 dB(C)' },
          { label: 'p-Bovenste actiewaarde', value: '≥ 137 dB(C)' },
          { label: 'p-Grenswaarde',           value: '≥ 140 dB(C)' },
        ],
      },
    ],
    adminObligations: [
      'Blootstellingsregistratie bijhouden voor werknemers met blootstelling ≥ LAV (Arbobesluit art. 6.8)',
      'Audiometrisch onderzoek aanbieden bij ≥ LAV; verplicht bij ≥ UAV (Arbobesluit art. 4.10a jo. art. 2.14a)',
      'Programma van maatregelen opstellen en uitvoeren bij overschrijding UAV (Arbobesluit art. 6.7)',
      'Voorlichting en instructie over risico\'s, maatregelen en PBM-gebruik (Arbowet art. 8)',
      'Meetresultaten bewaren als onderbouwing van de RI&E; actualiseren bij relevante proceswijzigingen',
    ],
  },

  'bio-agents': {
    color: {
      dot: 'bg-emerald-500',
      limitBg: 'bg-emerald-50 dark:bg-emerald-950/30',
      limitBorder: 'border-emerald-200 dark:border-emerald-900',
    },
    legislation: [
      'Richtlijn 2000/54/EG — bescherming van werknemers tegen risico\'s van blootstelling aan biologische agentia',
      'Arbobesluit art. 4.85–4.114 — biologische agentia: risico-inventarisatie, risicoklassen, insluitingsmaatregelen, meldingsplicht',
      'Regeling biologische agentia — lijst van biologische agentia met risicoklasse-indeling',
      'Arbowet art. 3 lid 1 — zorgverplichting en risico-inventarisatie & evaluatie',
      'Verordening (EG) nr. 1272/2008 (CLP) — voor biologische agentia die ook als gevaarlijke stof zijn geclassificeerd',
    ],
    norms: [
      { name: 'NEN-EN-12469:2000', desc: 'Biotechnologie — Prestatiecriteria voor microbiologische veiligheidskasten' },
      { name: 'RIVM Risicoklassenindeling', desc: 'Nationale lijst biologische agentia ingedeeld in risicoklasse 1, 2, 3 of 4' },
      { name: 'WHO Laboratory Biosafety Manual (4e druk)', desc: 'Internationale richtsnoeren voor biosafety-niveaus BSL-1 t/m BSL-4' },
      { name: 'NEN-EN-ISO 15190:2003', desc: 'Medische laboratoria — eisen voor veiligheid' },
      { name: 'ECDC Technisch richtsnoer', desc: 'Risicobeoordeling voor laboratoria die werken met SARS-CoV-2 en andere pathogenen' },
    ],
    limitGroups: [
      {
        title: 'Risicoklassen biologische agentia',
        limits: [
          { label: 'Klasse 1', sublabel: 'laag risico',       value: 'geen ziekte bij mensen' },
          { label: 'Klasse 2', sublabel: 'beperkt risico',    value: 'ziekte mogelijk, behandelbaar' },
          { label: 'Klasse 3', sublabel: 'ernstig risico',    value: 'ernstige ziekte, vaccin/behandeling beschikbaar' },
          { label: 'Klasse 4', sublabel: 'zeer ernstig risico', value: 'levensbedreiging, geen behandeling' },
        ],
      },
    ],
    adminObligations: [
      'Register blootgestelde werknemers bijhouden: 10 jaar bewaren bij klasse 2; 40 jaar bij klasse 3/4 (Arbobesluit art. 4.99)',
      'Arbeidsgezondheidskundig onderzoek aanbieden aan blootgestelde werknemers (Arbobesluit art. 4.100)',
      'Eerste gebruik van klasse 2 agentia melden aan de Inspectie SZW (Arbobesluit art. 4.109 lid 1)',
      'Vergunning of melding vereist voor opzettelijk gebruik van klasse 3/4 agentia (Arbobesluit art. 4.109 lid 2/3)',
      'Vaccinatieprogramma aanbieden en vaccinatiestatus per werknemer registreren bij beschikbare vaccins (art. 4.101)',
    ],
  },

  'hazardous-substances': {
    color: {
      dot: 'bg-orange-500',
      limitBg: 'bg-orange-50 dark:bg-orange-950/30',
      limitBorder: 'border-orange-200 dark:border-orange-900',
    },
    legislation: [
      'Arbobesluit art. 4.1–4.23 — gevaarlijke stoffen: arbeidshygiënische strategie, grenswaarden en meting van blootstelling',
      'Arbobesluit art. 4.17–4.22 — carcinogene, mutagene en reproductietoxische stoffen (CMR): vervangingsplicht en registratieplicht',
      'Arbobesluit art. 4.45 — explosieve atmosfeer (ATEX): zonering en beschermde uitrusting',
      'Arbowet art. 3 lid 1 — zorgverplichting en risico-inventarisatie & evaluatie (RI&E)',
      'Verordening (EG) nr. 1907/2006 (REACH) — registratie, evaluatie, autorisatie en beperkingen van chemische stoffen',
      'Verordening (EG) nr. 1272/2008 (CLP/GHS) — indeling, etikettering en verpakking van stoffen en mengsels',
    ],
    norms: [
      { name: 'NEN-EN 689:2018', desc: 'Blootstelling op de werkplek: meting van inademing van chemische stoffen en strategie voor toetsing aan wettelijke grenswaarden' },
      { name: 'NEN-EN 14042:2003', desc: 'Blootstelling op de werkplek: leidraad voor toepassing van procedures voor beoordeling van blootstelling aan chemische agentia' },
      { name: 'NEN-EN 482:2021', desc: 'Blootstelling op de werkplek: algemene eisen voor prestatiekenmerken van meetprocedures voor chemische agentia' },
      { name: 'NEN-EN 13936:2013', desc: 'Blootstelling op de werkplek: meting van een mengsel van twee of meer chemische agentia' },
      { name: 'ECETOC TRA', desc: 'Targeted Risk Assessment — blootstellingsschattingsinstrument voor stoffen in REACH-context' },
    ],
    limitGroups: [
      {
        title: 'Arbeidshygiënische strategie (prioriteitsvolgorde)',
        limits: [
          { label: 'Prioriteit 1', sublabel: 'bronmaatregel', value: 'Substitutie / proceswijziging' },
          { label: 'Prioriteit 2', sublabel: 'collectief',    value: 'Afzuiging / inkapseling' },
          { label: 'Prioriteit 3', sublabel: 'organisatorisch', value: 'Taakroulatie / beperking blootstelling' },
          { label: 'Prioriteit 4', sublabel: 'laatste optie', value: 'PBM (ademhalingsbescherming, handschoenen)' },
        ],
      },
    ],
    adminObligations: [
      'Register gevaarlijke stoffen bijhouden (actuele veiligheidsinformatiebladen, blootstellingsdata CMR-stoffen) (Arbobesluit art. 4.15)',
      'Blootstellingsregister CMR-stoffen bewaren: minimaal 40 jaar na laatste blootstelling (Arbobesluit art. 4.16)',
      'Biologisch effectmonitoringonderzoek uitvoeren bij CMR-stoffen indien toepasselijk (Arbobesluit art. 4.10a)',
      'Explosieveiligheidsdocument (EVD) opstellen en actueel houden bij aanwezigheid van ATEX-zones (Arbobesluit art. 3.5d)',
      'Informeren van toeleveranciers en afnemers via veiligheidsinformatieblad (SDS) conform REACH (Verordening 1907/2006)',
    ],
  },

  lighting: {
    color: {
      dot: 'bg-amber-500',
      limitBg: 'bg-amber-50 dark:bg-amber-950/30',
      limitBorder: 'border-amber-200 dark:border-amber-900',
    },
    legislation: [
      'Arbobesluit art. 6.29–6.32 — verlichting van arbeidsplaatsen: daglicht, kunstlicht en noodverlichting',
      'Bouwbesluit 2012 art. 6.35 — minimumeisen verlichtingssterkte voor verblijfsgebieden',
      'Arbobesluit art. 3.1g — ergonomische inrichting werkplek (visueel comfort)',
      'Richtlijn 89/654/EEG — minimumvoorschriften veiligheid en gezondheid op arbeidsplaatsen',
    ],
    norms: [
      { name: 'NEN-EN-12464-1:2021', desc: 'Licht en verlichting: verlichting van werkplekken — Deel 1: Binnenwerkplekken' },
      { name: 'NEN-EN-12464-2:2014', desc: 'Licht en verlichting: verlichting van werkplekken — Deel 2: Buitenwerkplekken' },
      { name: 'NEN-EN-12665:2011',   desc: 'Licht en verlichting: basisbegrippen en criteria voor het specificeren van verlichtingseisen' },
      { name: 'CIE 117:1995',        desc: 'Discomfort Glare in Interior Lighting — Unified Glare Rating (UGR) methode' },
      { name: 'NEN-EN-1838:2013',    desc: 'Toegepaste verlichting: noodverlichting (vluchtwegen en antipaniek)' },
    ],
    limitGroups: [
      {
        title: 'Verlichtingssterkte Em — voorbeelden NEN-EN 12464-1',
        limits: [
          { label: 'Gangen en trappenhuizen',       value: '≥ 100 lux' },
          { label: 'Kantoorwerk (beeldscherm)',      value: '≥ 500 lux' },
          { label: 'Tekenkamer / fijn assemblage',   value: '≥ 750 lux' },
          { label: 'Zeer nauwkeurig werk',           value: '≥ 1 000 lux' },
        ],
      },
      {
        title: 'Overige kwaliteitsparameters',
        limits: [
          { label: 'Uniformiteitsratio', sublabel: 'U0 = Emin/Em',   value: '≥ 0,60–0,70' },
          { label: 'Verblindingsindex',  sublabel: 'UGR',             value: '≤ 16–22' },
          { label: 'Kleurweergave-index', sublabel: 'Ra',              value: '≥ 80' },
        ],
      },
    ],
    adminObligations: [
      'Verlichtingsmetingen vastleggen als onderdeel van de RI&E; actualiseren bij verbouwing of herinrichting (Arbowet art. 5)',
      'Noodverlichtingsinstallatie periodiek testen (maandelijks functioneel; jaarlijks volledige ontlading) en logboek bijhouden (NEN-EN 50172)',
      'Kalibratiestatus luxmeter bijhouden conform leverancierseisen (aanbevolen jaarlijks); correctiefactoren documenteren',
      'Klachtenregistratie visuele klachten (oogvermoeidheid, hoofdpijn) opnemen in PAGO/PMO-dossier',
      'Periodieke herkeuring verlichtingsinstallatie documenteren (aanbevolen elke 3–5 jaar of na wijziging)',
    ],
  },

  'physical-load': {
    color: {
      dot: 'bg-violet-500',
      limitBg: 'bg-violet-50 dark:bg-violet-950/30',
      limitBorder: 'border-violet-200 dark:border-violet-900',
    },
    legislation: [
      'Arbobesluit art. 5.1–5.6 — fysieke belasting: risicobeoordeling tillen, dragen, duwen, trekken en repeterende handelingen',
      'Arbobesluit art. 5.2 — beoordeling en voorkoming van risico\'s door handmatig hanteren van lasten',
      'Arbowet art. 3 lid 1 — zorgverplichting en risico-inventarisatie & evaluatie (RI&E)',
      'Richtlijn 90/269/EEG — minimumveiligheids- en gezondheidsvoorschriften voor handmatig hanteren van lasten',
      'Richtlijn 90/270/EEG — minimumveiligheids- en gezondheidsvoorschriften voor beeldschermwerk',
      'Beleidsregel 5.2-2 Arbobesluit — nadere invulling van de norm voor handmatig tillen van lasten',
    ],
    norms: [
      { name: 'ISO 11228-1:2021', desc: 'Ergonomie: handmatig hanteren van lasten — Deel 1: Tillen, vasthouden en dragen (herziene NIOSH-methode)' },
      { name: 'ISO 11228-2:2007', desc: 'Ergonomie: handmatig hanteren van lasten — Deel 2: Duwen en trekken' },
      { name: 'ISO 11228-3:2007', desc: 'Ergonomie: handmatig hanteren van lasten — Deel 3: Laagfrequente repeterende handelingen (OCRA-checklist)' },
      { name: 'EN 1005-3:2002/A1:2008', desc: 'Veiligheid van machines: aanbevolen grenswaarden voor handmatige krachtsuitoefening' },
      { name: 'EN 1005-4:2005/A1:2008', desc: 'Veiligheid van machines: beoordeling van werkhoudingen en bewegingen bij bedienen van machines' },
    ],
    limitGroups: [
      {
        title: 'NIOSH tilindex TI (ISO 11228-1)',
        limits: [
          { label: 'Aanvaardbaar',          sublabel: 'TI',  value: '≤ 1,0' },
          { label: 'Verhoogd risico',        sublabel: 'TI',  value: '1,0 < TI ≤ 3,0' },
          { label: 'Onacceptabel',           sublabel: 'TI',  value: '> 3,0' },
        ],
      },
      {
        title: 'Samengesteld tilindex CTI',
        limits: [
          { label: 'Aanvaardbaar',  sublabel: 'CTI', value: '≤ 1,0' },
          { label: 'Risico',        sublabel: 'CTI', value: '> 1,0 — aanpassing vereist' },
        ],
      },
    ],
    adminObligations: [
      'RI&E en plan van aanpak opstellen en bijhouden bij risico\'s door fysieke belasting (Arbobesluit art. 5.3)',
      'Klachtenregistratie musculoskeletale aandoeningen (MSA/RSI) opnemen in PAGO/PMO-dossier',
      'Beroepsziekten door fysieke belasting melden bij het Nederlands Centrum voor Beroepsziekten (NCvB) via bedrijfsarts',
      'Periodiek arbeidsgezondheidskundig onderzoek (PAGO) aanbieden bij risicoblootstelling (Arbowet art. 18)',
      'Ergonomische beoordeling documenteren bij aanschaf of wijziging van arbeidsmiddelen of werkplekken (Machinerichtlijn 2006/42/EG)',
    ],
  },

  climate: {
    color: {
      dot: 'bg-teal-500',
      limitBg: 'bg-teal-50 dark:bg-teal-950/30',
      limitBorder: 'border-teal-200 dark:border-teal-900',
    },
    legislation: [
      'Arbobesluit art. 6.1–6.4 — thermisch klimaat: temperatuur, luchtsnelheid en ventilatie in werkruimten',
      'Arbobesluit art. 3.2 — ventilatie: minimale hoeveelheid verse buitenlucht per werkende per uur',
      'Arbowet art. 3 lid 1 — zorgverplichting en risico-inventarisatie & evaluatie (RI&E)',
      'Richtlijn 89/654/EEG — minimumveiligheids- en gezondheidsvoorschriften voor de arbeidsplaatsen',
      'Arbobesluit art. 6.32a — beschermende kleding bij extreme thermische omstandigheden',
    ],
    norms: [
      { name: 'ISO 7730:2025', desc: 'Ergonomie van de thermische omgeving: analytische bepaling en interpretatie van thermisch comfort via PMV/PPD-methode' },
      { name: 'ISO 7243:2017', desc: 'Ergonomie van de thermische omgeving: beoordeling van hittestress met de WBGT-index (arbeidsplaats en omgeving)' },
      { name: 'ISO 7933:2023', desc: 'Ergonomie van de thermische omgeving: analytische bepaling en interpretatie van hittestress (Predicted Heat Strain — PHS)' },
      { name: 'ISO 11079:2007', desc: 'Ergonomie van de thermische omgeving: bepaling en interpretatie van koudestress via de IREQ-index en lokale effecten' },
      { name: 'ISO 9886:2004',  desc: 'Ergonomie van de thermische omgeving: evaluatie van thermische belasting via fysiologische metingen' },
      { name: 'NEN-EN 27726:1993', desc: 'Thermische omgeving: instrumenten en meetmethoden voor fysische grootheden' },
    ],
    limitGroups: [
      {
        title: 'PMV-comfortklassen (ISO 7730)',
        limits: [
          { label: 'Klasse A (streefdoel)', sublabel: '|PMV| < 0.2', value: 'PPD < 6%' },
          { label: 'Klasse B (acceptabel)', sublabel: '|PMV| < 0.5', value: 'PPD < 10%' },
          { label: 'Klasse C (minimaal)',   sublabel: '|PMV| < 0.7', value: 'PPD < 15%' },
        ],
      },
      {
        title: 'WBGT-grenswaarden (ISO 7243 — geacclimateerde werknemers)',
        limits: [
          { label: 'Licht werk',      sublabel: 'M ≤ 117 W',    value: '33 °C' },
          { label: 'Matig werk',      sublabel: 'M 117–234 W',  value: '28 °C' },
          { label: 'Zwaar werk',      sublabel: 'M 234–360 W',  value: '25 °C' },
          { label: 'Zeer zwaar werk', sublabel: 'M > 360 W',    value: '23 °C' },
        ],
      },
    ],
    adminObligations: [
      'Klimaatmetingen en beoordelingsresultaten vastleggen in de RI&E; actualiseren bij proceswijzigingen (Arbowet art. 5)',
      'Hittewaarschuwingsprotocol opstellen en communiceren bij risico op hittestress (aanbevolen bij WBGT-overschrijding)',
      'Beroepsziekten door hitte of koude (bijv. hitteberoerte, bevriezing) melden bij NCvB via bedrijfsarts',
      'Periodiek preventief medisch onderzoek (PMO) aanbieden bij werknemers in extreme thermische omstandigheden (Arbowet art. 18)',
      'Ventilatie- en klimaatinstallaties periodiek inspecteren, reinigen en testresultaten registreren',
    ],
  },

  vibration: {
    color: {
      dot: 'bg-rose-500',
      limitBg: 'bg-rose-50 dark:bg-rose-950/30',
      limitBorder: 'border-rose-200 dark:border-rose-900',
    },
    legislation: [
      'Richtlijn 2002/44/EG — minimumvoorschriften inzake veiligheid en gezondheid met betrekking tot blootstelling van werknemers aan trillingen',
      'Arbobesluit art. 6.11a–6.11g — dagelijkse trillingsblootstelling, grenswaarden en actiewaarden',
      'Arbowet art. 3 lid 1 — zorgverplichting en risico-inventarisatie & evaluatie',
      'Beleidsregel 6.11a–2 — inventarisatie en meting van trillingsblootstelling',
    ],
    norms: [
      { name: 'ISO 5349-1:2001', desc: 'Meting en beoordeling van blootstelling van mensen aan hand-armtrillingen — Deel 1: Algemene eisen' },
      { name: 'ISO 5349-2:2001', desc: 'Meting en beoordeling van blootstelling van mensen aan hand-armtrillingen — Deel 2: Praktische handreiking op de werkplek' },
      { name: 'ISO 2631-1:1997', desc: 'Meting en beoordeling van blootstelling van mensen aan hele-lichaamstrillingen — Deel 1: Algemene eisen' },
      { name: 'ISO 2631-5:2004', desc: 'Hele-lichaamstrillingen — Deel 5: Methode voor evaluatie van trillingen met meervoudige schokken' },
      { name: 'NEN-EN-ISO 8662', desc: 'Handheld portable power tools — meting van trillingen aan het handgreep (meerdelige serie)' },
    ],
    limitGroups: [
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
    ],
    adminObligations: [
      'Blootstellingsregister bijhouden voor werknemers met blootstelling ≥ EAV (Arbobesluit art. 6.11e)',
      'Medisch onderzoek (HAVS-beoordeling) aanbieden bij blootstelling ≥ EAV (Arbobesluit art. 4.10a jo. art. 6.11f)',
      'Plan van aanpak opstellen bij overschrijding EAV; werknemer onmiddellijk beschermen bij overschrijding ELV (art. 6.11c)',
      'Trillingsblootstellingsdata bewaren als onderbouwing van de RI&E; actualiseren bij wijziging van gereedschappen of werkwijzen',
      'HAVS of andere trillingsgebonden beroepsziekten melden bij NCvB via bedrijfsarts',
    ],
  },

  radiation: {
    color: {
      dot: 'bg-purple-500',
      limitBg: 'bg-purple-50 dark:bg-purple-950/30',
      limitBorder: 'border-purple-200 dark:border-purple-900',
    },
    legislation: [
      'Richtlijn 2013/59/Euratom — basisveiligheidsnormen voor bescherming tegen gevaren van blootstelling aan ioniserende straling',
      'Besluit basisveiligheidsnormen stralingsbescherming (Bbs), Stb. 2017/502 — implementatie van Richtlijn 2013/59/Euratom',
      'Kernenergiewet — vergunning en toezicht op toepassingen van ioniserende straling',
      'Richtlijn 2013/35/EU — minimumgezondheids- en veiligheidsvoorschriften voor elektromagnetische velden (EMV)',
      'Richtlijn 2006/25/EG — minimumgezondheids- en veiligheidsvoorschriften voor kunstmatige optische straling',
      'Arbobesluit art. 4.45a–4.45h — beoordeling en beheersing van blootstelling aan kunstmatige optische straling',
      'Arbobesluit art. 4.45i–4.45k — beoordeling en beheersing van blootstelling aan elektromagnetische velden',
    ],
    norms: [
      { name: 'IEC 60825-1:2014', desc: 'Veiligheid van laserproducten — Deel 1: Classificatie van apparatuur en eisen' },
      { name: 'NEN-EN 12198', desc: 'Veiligheid van machines: beoordeling en vermindering van risico\'s door straling die wordt uitgezonden door machines' },
      { name: 'ICNIRP-richtlijnen', desc: 'Richtlijnen voor blootstelling aan niet-ioniserende straling (International Commission on Non-Ionizing Radiation Protection)' },
      { name: 'ICRP Publicatie 103', desc: 'Aanbevelingen van de International Commission on Radiological Protection (2007)' },
      { name: 'NEN-EN 61000-4', desc: 'Elektromagnetische compatibiliteit — beproevings- en meetmethoden voor EMV' },
    ],
    limitGroups: [
      {
        title: 'Ioniserende straling — jaardosislimieten (Bbs art. 3.8)',
        limits: [
          { label: 'Stralingswerkers (Cat. A/B)', sublabel: 'effectieve dosis', value: '20 mSv/jaar' },
          { label: 'Leerling/student ≥ 18 jaar',  sublabel: 'effectieve dosis', value: '6 mSv/jaar' },
          { label: 'Algemeen publiek',             sublabel: 'effectieve dosis', value: '1 mSv/jaar' },
        ],
      },
      {
        title: 'Niet-ioniserende straling — UV (Arbobesluit art. 4.45b)',
        limits: [
          { label: 'ELV oog (315–400 nm)', value: '10 000 J/m² (8 h)' },
          { label: 'ELV huid (180–400 nm)', value: '30 J/m² (8 h)' },
        ],
      },
    ],
    adminObligations: [
      'Dosisregistratie bijhouden in het Nationaal Dosisregistratiesysteem (NDRIS) voor alle stralingswerkers (Bbs art. 4.10)',
      'Individueel stralingsdossier per stralingswerker bewaren: 30 jaar na einde blootstelling, of tot leeftijd van 75 jaar (Bbs art. 4.10 lid 5)',
      'Vergunning of melding conform Kernenergiewet en Bbs bijhouden en actueel houden; wijzigingen direct melden aan ANVS',
      'Aanstelling en registratie van stralingsbeschermingsdeskundige (SBD) en stralingsbeschermingsbegeleider (SBB) (Bbs hoofdstuk 5)',
      'Jaarlijkse dosisrapportage aan de Autoriteit Nucleaire Veiligheid en Stralingsbescherming (ANVS)',
    ],
  },
};
