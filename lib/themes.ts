export const themes = [
  {
    slug: 'sound',
    active: true,
    name: 'Geluid',
    description: 'Geluidsbelasting, gehoorschade en RI&E geluid op de werkplek.',
    intro:
      'Langdurige blootstelling aan te hoog geluid is in Nederland een veelvoorkomende oorzaak van beroepsziekte en blijvend gehoorverlies. Dit stappenplan begeleidt u door een systematische beoordeling: van het in kaart brengen van geluidsbronnen en blootstelling per functie tot het kiezen van de juiste technische en organisatorische maatregelen. Aan het einde krijgt u een overzicht dat direct bruikbaar is als input voor de RI&E en het plan van aanpak.',
    borderClass: 'border-blue-500',
    badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    dotClass: 'bg-blue-500',
    iconClass: 'text-blue-500',
    iconPaths: [
      'M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z',
    ],
  },
  {
    slug: 'bio-agents',
    active: false,
    name: 'Biologische agentia',
    description: 'Blootstelling aan micro-organismen, endotoxinen en allergenen.',
    intro:
      'In sectoren zoals de gezondheidszorg, landbouw en afvalverwerking kunnen medewerkers worden blootgesteld aan bacteriën, virussen, schimmels en andere biologische agentia. De risico\'s variëren sterk per sector, activiteit en de risicoklasse van het agens. Dit stappenplan helpt u de blootstelling systematisch in beeld te brengen, de juiste insluitingsmaatregelen te kiezen en het gezondheidstoezicht te organiseren.',
    borderClass: 'border-emerald-500',
    badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    dotClass: 'bg-emerald-500',
    iconClass: 'text-emerald-500',
    iconPaths: [
      'M16 12a4 4 0 11-8 0 4 4 0 018 0z',
      'M16 12h3M14 15.46l1.5 2.59M10 15.46l-1.5 2.59M8 12H5M10 8.54l-1.5-2.59M14 8.54l1.5-2.59',
      'M19 12h.01M15.5 18.05h.01M8.5 18.05h.01M5 12h.01M8.5 5.95h.01M15.5 5.95h.01',
    ],
  },
  {
    slug: 'hazardous-substances',
    active: false,
    name: 'Gevaarlijke stoffen',
    description: 'Chemische blootstellingslimieten, GHS/CMR en vervangingsplicht.',
    intro:
      'Contact met gevaarlijke stoffen op het werk kan leiden tot acute en chronische gezondheidsschade, variërend van huid- en luchtwegirritatie tot beroepskanker. De arbeidshygiënische strategie schrijft voor dat u altijd begint bij de bron: vervanging door minder gevaarlijke alternatieven gaat vóór technische maatregelen, die op hun beurt vóór persoonlijke beschermingsmiddelen komen. Dit stappenplan begeleidt u stap voor stap door die afweging.',
    borderClass: 'border-orange-500',
    badgeClass: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
    dotClass: 'bg-orange-500',
    iconClass: 'text-orange-500',
    iconPaths: [
      'M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5',
    ],
  },
  {
    slug: 'lighting',
    active: false,
    name: 'Verlichting',
    description: 'Werkplekverlichting, verlichtingssterkte en visueel comfort.',
    intro:
      'Een goede werkplekverlichting vermindert visuele vermoeidheid, voorkomt fouten en draagt bij aan de veiligheid van medewerkers. Onvoldoende of ongepaste verlichting is een onderschat risico dat leidt tot klachten als hoofdpijn, verhoogde foutkans en een hoger risico op ongelukken. Dit stappenplan helpt u de verlichtingssituatie systematisch te beoordelen op basis van de aard en nauwkeurigheid van de uitgevoerde taken.',
    borderClass: 'border-amber-500',
    badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    dotClass: 'bg-amber-500',
    iconClass: 'text-amber-500',
    iconPaths: [
      'M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18',
    ],
  },
  {
    slug: 'physical-load',
    active: false,
    name: 'Fysieke belasting',
    description: 'Ergonomie, tilnormen en beoordeling van fysieke arbeidsbelasting.',
    intro:
      'Lichamelijke klachten door werk zijn een van de meest voorkomende oorzaken van ziekteverzuim in Nederland. Handmatig tillen, repeterende bewegingen en langdurige ongunstige werkhoudingen zijn bekende risicofactoren die leiden tot klachten aan rug, schouders en armen. Dit stappenplan begeleidt u van inventarisatie en risicobeoordeling naar effectieve ergonomische en technische maatregelen, afgestemd op de specifieke taken en functies.',
    borderClass: 'border-violet-500',
    badgeClass: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
    dotClass: 'bg-violet-500',
    iconClass: 'text-violet-500',
    iconPaths: [
      'M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z',
    ],
  },
  {
    slug: 'climate',
    active: false,
    name: 'Klimaat',
    description: 'Thermisch comfort, WBGT en beoordeling van werkplekklimaat.',
    intro:
      'Het thermisch klimaat op de werkplek beïnvloedt het welzijn, de prestaties en de veiligheid van medewerkers rechtstreeks. Zowel hitte- als koudebelasting kunnen leiden tot serieuze gezondheidsrisico\'s, met name in combinatie met zwaar fysiek werk of beschermende kleding. Dit stappenplan helpt u de klimaatsituatie systematisch te inventariseren, te meten en passende technische en organisatorische maatregelen te kiezen.',
    borderClass: 'border-teal-500',
    badgeClass: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
    dotClass: 'bg-teal-500',
    iconClass: 'text-teal-500',
    iconPaths: [
      'M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z',
    ],
  },
  {
    slug: 'vibration',
    active: false,
    name: 'Trillingen',
    description: 'Hand-armtrillingen, hele-lichaamstrillingen en Richtlijn 2002/44/EG.',
    intro:
      'Langdurige blootstelling aan hand-armtrillingen of hele-lichaamstrillingen kan leiden tot ernstige en onomkeerbare gezondheidsschade, zoals het Hand-Arm Vibration Syndrome (HAVS), witte vingers of chronische rugklachten. De Europese Trillingenrichtlijn en het Arbobesluit stellen grenswaarden voor de dagelijkse trillingsblootstelling A(8). Dit onderzoeksinstrument begeleidt u van inventarisatie en meting tot beoordeling en beheersmaatregelen.',
    borderClass: 'border-rose-500',
    badgeClass: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
    dotClass: 'bg-rose-500',
    iconClass: 'text-rose-500',
    iconPaths: [
      'M9.348 14.651a3.75 3.75 0 010-5.303m5.304-.001a3.75 3.75 0 010 5.304m-7.425 2.122a6.75 6.75 0 010-9.546m9.546 0a6.75 6.75 0 010 9.546M5.106 18.894c-3.808-3.808-3.808-9.98 0-13.789m13.788 0c3.808 3.808 3.808 9.981 0 13.79M12 12h.008v.007H12V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z',
    ],
  },
  {
    slug: 'radiation',
    active: false,
    name: 'Straling',
    description: 'Ioniserende en niet-ioniserende straling: dosimetrie, EMV en optische straling.',
    intro:
      'Blootstelling aan straling op de werkplek omvat zowel ioniserende straling (röntgen, gamma, neutronenstraling) als niet-ioniserende straling (UV, infrarood, laser en elektromagnetische velden). Ioniserende straling kan leiden tot stochastische en deterministische gezondheidseffecten; niet-ioniserende straling tot huid- en oogschade, verhitting van weefsel en zenuwstelseleffecten. Dit onderzoeksinstrument begeleidt u van inventarisatie en classificatie tot dosismeting, beoordeling en beheersmaatregelen conform het Besluit basisveiligheidsnormen stralingsbescherming en het Arbobesluit.',
    borderClass: 'border-purple-500',
    badgeClass: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    dotClass: 'bg-purple-500',
    iconClass: 'text-purple-500',
    iconPaths: [
      'M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z',
    ],
  },
] as const;

export type ThemeSlug = (typeof themes)[number]['slug'];
export type Theme = (typeof themes)[number];
