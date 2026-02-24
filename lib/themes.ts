export const themes = [
  {
    slug: 'sound',
    name: 'Geluid',
    description: 'Geluidsbelasting, gehoorschade en RI&E geluid op de werkplek.',
    intro:
      'Langdurige blootstelling aan te hoog geluid is in Nederland een veelvoorkomende oorzaak van beroepsziekte en blijvend gehoorverlies. Dit stappenplan begeleidt u door een systematische beoordeling: van het in kaart brengen van geluidsbronnen en blootstelling per functie tot het kiezen van de juiste technische en organisatorische maatregelen. Aan het einde krijgt u een overzicht dat direct bruikbaar is als input voor de RI&E en het plan van aanpak.',
    borderClass: 'border-blue-500',
    badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    dotClass: 'bg-blue-500',
  },
  {
    slug: 'bio-agents',
    name: 'Biologische agentia',
    description: 'Blootstelling aan micro-organismen, endotoxinen en allergenen.',
    intro:
      'In sectoren zoals de gezondheidszorg, landbouw en afvalverwerking kunnen medewerkers worden blootgesteld aan bacteriën, virussen, schimmels en andere biologische agentia. De risico\'s variëren sterk per sector, activiteit en de risicoklasse van het agens. Dit stappenplan helpt u de blootstelling systematisch in beeld te brengen, de juiste insluitingsmaatregelen te kiezen en het gezondheidstoezicht te organiseren.',
    borderClass: 'border-emerald-500',
    badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    dotClass: 'bg-emerald-500',
  },
  {
    slug: 'hazardous-substances',
    name: 'Gevaarlijke stoffen',
    description: 'Chemische blootstellingslimieten, GHS/CMR en vervangingsplicht.',
    intro:
      'Contact met gevaarlijke stoffen op het werk kan leiden tot acute en chronische gezondheidsschade, variërend van huid- en luchtwegirritatie tot beroepskanker. De arbeidshygiënische strategie schrijft voor dat u altijd begint bij de bron: vervanging door minder gevaarlijke alternatieven gaat vóór technische maatregelen, die op hun beurt vóór persoonlijke beschermingsmiddelen komen. Dit stappenplan begeleidt u stap voor stap door die afweging.',
    borderClass: 'border-orange-500',
    badgeClass: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
    dotClass: 'bg-orange-500',
  },
  {
    slug: 'lighting',
    name: 'Verlichting',
    description: 'Werkplekverlichting, verlichtingssterkte en visueel comfort.',
    intro:
      'Een goede werkplekverlichting vermindert visuele vermoeidheid, voorkomt fouten en draagt bij aan de veiligheid van medewerkers. Onvoldoende of ongepaste verlichting is een onderschat risico dat leidt tot klachten als hoofdpijn, verhoogde foutkans en een hoger risico op ongelukken. Dit stappenplan helpt u de verlichtingssituatie systematisch te beoordelen op basis van de aard en nauwkeurigheid van de uitgevoerde taken.',
    borderClass: 'border-amber-500',
    badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    dotClass: 'bg-amber-500',
  },
  {
    slug: 'physical-load',
    name: 'Fysieke belasting',
    description: 'Ergonomie, tilnormen en beoordeling van fysieke arbeidsbelasting.',
    intro:
      'Lichamelijke klachten door werk zijn een van de meest voorkomende oorzaken van ziekteverzuim in Nederland. Handmatig tillen, repeterende bewegingen en langdurige ongunstige werkhoudingen zijn bekende risicofactoren die leiden tot klachten aan rug, schouders en armen. Dit stappenplan begeleidt u van inventarisatie en risicobeoordeling naar effectieve ergonomische en technische maatregelen, afgestemd op de specifieke taken en functies.',
    borderClass: 'border-violet-500',
    badgeClass: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
    dotClass: 'bg-violet-500',
  },
  {
    slug: 'climate',
    name: 'Klimaat',
    description: 'Thermisch comfort, WBGT en beoordeling van werkplekklimaat.',
    intro:
      'Het thermisch klimaat op de werkplek beïnvloedt het welzijn, de prestaties en de veiligheid van medewerkers rechtstreeks. Zowel hitte- als koudebelasting kunnen leiden tot serieuze gezondheidsrisico\'s, met name in combinatie met zwaar fysiek werk of beschermende kleding. Dit stappenplan helpt u de klimaatsituatie systematisch te inventariseren, te meten en passende technische en organisatorische maatregelen te kiezen.',
    borderClass: 'border-teal-500',
    badgeClass: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
    dotClass: 'bg-teal-500',
  },
] as const;

export type ThemeSlug = (typeof themes)[number]['slug'];
export type Theme = (typeof themes)[number];
