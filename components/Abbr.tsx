// Shared abbreviation component — gebruik in alle stappen en pagina's

export const ABBR_TITLES: Record<string, string> = {
  OEL:   'Occupational Exposure Limit — grenswaarde voor beroepsmatige blootstelling',
  OELV:  'Occupational Exposure Limit Value — grenswaarde voor beroepsmatige blootstelling',
  TGG:   'Tijdgewogen gemiddelde',
  CLP:   'Classification, Labelling and Packaging — Verordening EG 1272/2008',
  VIB:   'Veiligheidsinformatieblad',
  SDS:   'Safety Data Sheet — veiligheidsinformatieblad',
  CMR:   'Carcinogeen, Mutageen of Reproductietoxisch',
  ATEX:  'ATmosphères EXplosibles — explosieve atmosferen (Arbobesluit hfst. 3 par. 2a)',
  LEL:   'Lower Explosive Limit — laagste explosieve concentratie (% vol)',
  UEL:   'Upper Explosive Limit — hoogste explosieve concentratie (% vol)',
  ARIE:  'Aanvullende Risico-Inventarisatie en -Evaluatie — grote hoeveelheden gevaarlijke stoffen (Arbobesluit hfst. 2 afd. 2)',
  RIE:   'Risico-Inventarisatie en -Evaluatie (Arbowet art. 5)',
  REACH: 'Registration, Evaluation, Authorisation and restriction of CHemicals — Verordening EG 1907/2006',
  IUPAC: 'International Union of Pure and Applied Chemistry',
  DNEL:  'Derived No-Effect Level — grenswaarde afgeleid uit REACH-registratiedossier',
  NLA:   'NLA-handelingskader "Werken met gevaarlijke stoffen" (Nationaal Loket Arbodeskundigen)',
  SEG:   'Similar Exposure Group — groep medewerkers met vergelijkbare blootstelling',
  LEV:   'Lokale Exhaust Ventilatie — bronafzuiging',
  ACH:   'Air Changes per Hour — luchtverversingen per uur',
  PPE:   'Personal Protective Equipment — persoonlijke beschermingsmiddelen',
  PBM:   'Persoonlijke beschermingsmiddelen',
  HOVd:  'Hogere Veiligheidskundige (deskundigheidsniveau d)',
  // ── Geluid / NEN-EN-ISO 9612 ──────────────────────────────────────────────
  HEG:   'Homogene Blootstellingsgroep — groep medewerkers met vergelijkbare geluidblootstelling (NEN-EN-ISO 9612:2025 §7.2)',
  LAV:   'Lagere Actiewaarde geluid — 80 dB(A) dagelijks / 135 dB(C) piek — Arbobesluit art. 6.6 lid 1',
  UAV:   'Bovenste Actiewaarde geluid — 85 dB(A) dagelijks / 137 dB(C) piek — Arbobesluit art. 6.6 lid 1',
  GW:    'Grenswaarde geluid — 87 dB(A) dagelijks / 140 dB(C) piek — Arbobesluit art. 6.6 lid 2',
  SNR:   'Single Number Rating — eén-getal beschermingswaarde gehoorbeschermer (EN 352/EN 458:2016)',
  OB:    'Octaafbandanalyse — meting van het geluidniveau per octaafband (63–8000 Hz), optioneel voor EN 458:2016 methode 3',
  APF:   'Assumed Protection Factor — aangenomen beschermingsfactor in de praktijk (EN 458:2016)',
  SLM:   'Sound Level Meter — geluidniveaumeter (IEC 61672-1)',
  NEN9612: 'NEN-EN-ISO 9612:2025 — Akoestiek — Bepaling van de blootstelling aan lawaai op de werkplek (Third edition)',
  LEX:     'L_EX,8h — dagelijkse geluidblootstelling genormeerd naar 8 uur, A-gewogen (NEN-EN-ISO 9612:2025)',
  NPR3438: 'NPR 3438:2007 — Ergonomie: Geluidhinder op de arbeidsplaats — Bepaling van de mate van verstoring van communicatie en concentratie (Nederlandse Praktijkrichtlijn)',
  // ── Thermisch klimaat / klimaatonderzoek ──────────────────────────────────────
  PMV:     'Predicted Mean Vote — voorspelde gemiddelde thermische waardering (ISO 7730:2025 vgl. 1)',
  PPD:     'Predicted Percentage Dissatisfied — voorspeld percentage ontevreden medewerkers (ISO 7730:2025 vgl. 2)',
  DR:      'Draught Rate — tochtpercentage; kans op thermisch ongemak door luchtstroom (ISO 7730:2025 §6.2)',
  WBGT:    'Wet Bulb Globe Temperature — natteboltemperatuur voor hittestressscreening (ISO 7243:2017)',
  PHS:     'Predicted Heat Strain — voorspelde warmtebelasting; gedetailleerd hittestressmodel (ISO 7933:2023)',
  IREQ:    'Insulation REQuired — benodigde kledinginsulatie voor thermisch evenwicht bij koudestress (ISO 11079:2007)',
  CAV:     'Clothing Adjustment Value — kledingcorrectiewaarde voor WBGT bij beschermende kleding (ISO 7243:2017 Tabel B.2)',
  BG:      'Blootstellingsgroep — groep medewerkers met vergelijkbare thermische blootstelling (analoog SEG in klimaatonderzoek)',
  ISO7730: 'ISO 7730:2025 — Ergonomics of the thermal environment — Analytical determination and interpretation of thermal comfort (4th edition)',
  ISO7243: 'ISO 7243:2017 — Ergonomics of the thermal environment — Assessment of heat stress using the WBGT index (3rd edition)',
  ISO7933: 'ISO 7933:2023 — Ergonomics of the thermal environment — Analytical determination and interpretation of heat stress using calculation of the predicted heat strain (3rd edition)',
  ISO11079: 'ISO 11079:2007 — Ergonomics of the thermal environment — Determination and interpretation of cold stress using required clothing insulation (IREQ) and local cooling effects',
  ISO7726:  'ISO 7726:1998 — Ergonomics of the thermal environment — Instruments for measuring physical quantities',
};

export function Abbr({ id, children }: { id: keyof typeof ABBR_TITLES; children: React.ReactNode }) {
  return (
    <abbr
      title={ABBR_TITLES[id]}
      className="cursor-help underline decoration-dotted decoration-zinc-400 underline-offset-2 [font-variant:normal]"
    >
      {children}
    </abbr>
  );
}
