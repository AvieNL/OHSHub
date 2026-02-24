import type { WizardStep } from '@/lib/wizard-types';

export const STEPS: WizardStep[] = [
  {
    id: 'inventory',
    title: 'Inventarisatie',
    description:
      'Breng in kaart wat voor werkomgeving het betreft, hoe zwaar het werk is en in welke periode klimaatproblemen optreden.',
    questions: [
      {
        id: 'clim-env-type',
        label: 'Wat is het type werkomgeving?',
        type: 'radio',
        options: [
          { value: 'office', label: 'Kantoor of geconditioneerde binnenruimte' },
          { value: 'hot-process', label: 'Productiehal met warmtebronnen (ovens, gieten, lassen)' },
          { value: 'cold', label: 'Koude omgeving — koelcel, vrieshuis of buitenwerk in de winter' },
          { value: 'outdoor', label: 'Buitenwerk in wisselende weersomstandigheden' },
          { value: 'vehicle', label: 'Cabine van een voertuig of mobiele werkplek' },
        ],
      },
      {
        id: 'clim-work-intensity',
        label: 'Hoe zwaar is het fysieke werk dat in deze omgeving wordt uitgevoerd?',
        type: 'radio',
        tip: 'Bij zwaar werk stijgt de lichaamstemperatuur sneller en is de comfortgrens lager dan bij licht werk. Combineer dit met hoge luchtvochtigheid of beschermende kleding en het risico neemt snel toe.',
        options: [
          { value: 'light', label: 'Licht — overwegend zittend of staand met weinig beweging' },
          { value: 'moderate', label: 'Matig — lopend, staand met regelmatig tillen of bewegen' },
          { value: 'heavy', label: 'Zwaar — voortdurende fysieke inspanning of gebruik van grote spiergroepen' },
        ],
      },
      {
        id: 'clim-problem-period',
        label: 'In welke periode of seizoen treden klimaatgerelateerde klachten of risico\'s op? (meerdere mogelijk)',
        type: 'checkbox',
        options: [
          { value: 'summer', label: 'Zomer — hitte en mogelijk hittestress' },
          { value: 'winter', label: 'Winter — koude en risico op onderkoeling of bevriezing' },
          { value: 'yearround', label: 'Jaarrond — vanwege het productieproces of de installatie' },
          { value: 'no-issues', label: 'Er zijn (nog) geen bekende klimaatproblemen' },
        ],
      },
    ],
  },
  {
    id: 'legal-framework',
    title: 'Juridische kaders en eisen',
    description:
      'Controleer welke klimaateisen gelden voor dit type werkplek en of er kwetsbare groepen aanwezig zijn.',
    questions: [
      {
        id: 'clim-requirements-known',
        label: 'Is vastgesteld welke klimaateisen gelden voor dit type werkplek en de aard van de arbeid?',
        type: 'radio',
        tip: 'Voor buitenwerk gelden andere richtwaarden dan voor binnenwerk. Bij extreme warmte geldt een aanvullende zorgplicht voor de werkgever. Houd ook rekening met de combinatie van temperatuur, luchtvochtigheid en fysieke belasting.',
        options: [
          { value: 'yes', label: 'Ja, eisen zijn in beeld en vergeleken met de situatie' },
          { value: 'partial', label: 'Gedeeltelijk — niet voor alle zones of periodes' },
          { value: 'no', label: 'Nee, dit is nog niet bepaald' },
        ],
      },
      {
        id: 'clim-temperature-limits-known',
        label: 'Zijn de richtwaarden voor werkplektemperatuur bij lichte, matige en zware arbeid bekend?',
        type: 'radio',
        options: [
          { value: 'yes', label: 'Ja' },
          { value: 'partial', label: 'Gedeeltelijk — alleen voor bepaalde arbeidsintensiteiten' },
          { value: 'no', label: 'Nee' },
        ],
      },
      {
        id: 'clim-vulnerable-groups',
        label: 'Zijn er medewerkers die extra kwetsbaar zijn voor hitte of koude? (meerdere mogelijk)',
        type: 'checkbox',
        options: [
          { value: 'older', label: 'Oudere medewerkers (55+)' },
          { value: 'medication', label: 'Medewerkers die medicijnen gebruiken die warmteregulatie beïnvloeden' },
          { value: 'pregnant', label: 'Zwangere medewerkers' },
          { value: 'cardiovascular', label: 'Medewerkers met hart- of vaataandoeningen' },
          { value: 'none', label: 'Geen bekende kwetsbare groepen' },
        ],
      },
    ],
  },
  {
    id: 'risk-assessment',
    title: 'Risicobeoordeling',
    description:
      'Stel vast of de thermische belasting is gemeten en welke factoren het comfort en de veiligheid beïnvloeden.',
    questions: [
      {
        id: 'clim-measurement-method',
        label: 'Is de thermische belasting of het klimaat al gemeten of beoordeeld?',
        type: 'radio',
        tip: 'Een WBGT-meting geeft een completer beeld van de thermische belasting dan alleen een luchttemperatuurmeting, omdat het ook warmtestraling en luchtvochtigheid meeweegt — de factoren die het zweten juist belemmeren.',
        options: [
          { value: 'not-yet', label: 'Nee, nog niet gemeten of beoordeeld' },
          { value: 'thermometer', label: 'Ja, eenvoudige luchttemperatuurmeting' },
          { value: 'wbgt', label: 'Ja, WBGT-meting (combinatie van temperatuur, straling en luchtvochtigheid)' },
          { value: 'pmv-ppd', label: 'Ja, comfortbeoordeling via PMV/PPD (kantooromgevingen)' },
        ],
      },
      {
        id: 'clim-complaints',
        label: 'Zijn er klachten of verzuimmeldingen die wijzen op een klimaatprobleem?',
        type: 'radio',
        options: [
          { value: 'no', label: 'Nee, geen bekende klachten' },
          { value: 'comfort', label: 'Ja, comfortklachten (te warm, te koud, tocht)' },
          { value: 'health', label: 'Ja, gezondheidsklachten (duizeligheid, hoofdpijn, spierkrampen)' },
          { value: 'serious', label: 'Ja, er zijn ernstige incidenten geweest (hitteletsel, onderkoeling)' },
        ],
      },
      {
        id: 'clim-influencing-factors',
        label: 'Welke factoren beïnvloeden het thermisch klimaat op de werkplek? (meerdere mogelijk)',
        type: 'checkbox',
        options: [
          { value: 'humidity', label: 'Hoge luchtvochtigheid — vermindert afkoeling door zweten' },
          { value: 'draught', label: 'Tocht of koude luchtstroom' },
          { value: 'radiation', label: 'Warmtestraling van machines, ovens of de zon' },
          { value: 'physical-load', label: 'Hoge fysieke belasting in combinatie met hoge temperatuur' },
          { value: 'clothing', label: 'Dichte of warmte-isolerende werkkleding of PBM' },
        ],
      },
    ],
  },
  {
    id: 'control-measures',
    title: 'Beheersmaatregelen',
    description:
      'Pas technische en organisatorische maatregelen toe om het thermisch klimaat te beheersen voordat persoonlijke maatregelen worden ingezet.',
    questions: [
      {
        id: 'clim-technical-controls',
        label: 'Welke technische maatregelen zijn al aanwezig of gepland? (meerdere mogelijk)',
        type: 'checkbox',
        options: [
          { value: 'cooling', label: 'Airconditioning of plaatselijke koeling' },
          { value: 'heating', label: 'Verwarming of stralingswarmte voor koude omgevingen' },
          { value: 'ventilation', label: 'Mechanische ventilatie of circulatieventilatoren' },
          { value: 'sunshading', label: 'Zonwering, isolatiepanelen of reflecterende oppervlakken' },
          { value: 'heat-shielding', label: 'Afscherming van warmtestralende bronnen (ovens, smeltovens)' },
        ],
      },
      {
        id: 'clim-organisational-measures',
        label: 'Welke organisatorische maatregelen worden al toegepast? (meerdere mogelijk)',
        type: 'checkbox',
        options: [
          { value: 'scheduling', label: 'Aanpassing van werktijden of roosters bij extreme warmte of koude' },
          { value: 'extra-breaks', label: 'Extra of verlengde rustpauzes in koele of verwarmde ruimten' },
          { value: 'rotation', label: 'Taakroulatie — wisselend werken in warme en koele zones' },
          { value: 'buddy-system', label: 'Gebruik van een buddy-systeem bij risicovolle klimaatomstandigheden' },
        ],
      },
      {
        id: 'clim-personal-measures',
        label: 'Welke persoonlijke of aanvullende maatregelen worden ondersteund? (meerdere mogelijk)',
        type: 'checkbox',
        options: [
          { value: 'cooling-clothing', label: 'Koelende kleding, koelvesten of koelende banden' },
          { value: 'insulating-clothing', label: 'Isolerende kleding of thermisch ondergoed voor koude werkomgevingen' },
          { value: 'hydration', label: 'Drinkwatervoorziening — voldoende drinkpunten op de werkplek' },
          { value: 'acclimatisation', label: 'Acclimatisatieprogramma voor nieuw ingestroomde medewerkers' },
        ],
      },
    ],
  },
  {
    id: 'evaluation-documentation',
    title: 'Evaluatie en documentatie',
    description:
      'Leg de klimaatbeoordeling vast in de RI&E, monitor klachten en bereid je voor op extreme situaties.',
    questions: [
      {
        id: 'clim-rie-status',
        label: 'Is het klimaatrisico opgenomen in de RI&E, inclusief maatregelen per werkzone of periode?',
        type: 'radio',
        options: [
          { value: 'yes', label: 'Ja, volledig en actueel' },
          { value: 'partial', label: 'Gedeeltelijk of globaal vermeld' },
          { value: 'no', label: 'Nee, ontbreekt' },
        ],
      },
      {
        id: 'clim-action-plan',
        label: 'Zijn de beheersmaatregelen vastgelegd in een plan van aanpak met termijnen en verantwoordelijken?',
        type: 'radio',
        options: [
          { value: 'yes', label: 'Ja' },
          { value: 'partial', label: 'Gedeeltelijk' },
          { value: 'no', label: 'Nee' },
        ],
      },
      {
        id: 'clim-worker-information',
        label: 'Worden medewerkers actief geïnformeerd over hitte- of kouderisico\'s en de te nemen maatregelen?',
        type: 'radio',
        options: [
          { value: 'yes-periodic', label: 'Ja, periodiek en proactief — bijvoorbeeld voor de zomer of winter' },
          { value: 'yes-reactive', label: 'Alleen bij klachten of na een incident' },
          { value: 'no', label: 'Nee' },
        ],
      },
      {
        id: 'clim-extreme-protocol',
        label: 'Is er een protocol voor extreme weersomstandigheden zoals een hittegolf of strenge vorst?',
        type: 'radio',
        tip: 'Bespreek het hittegolfprotocol elk jaar vóór de zomer met leidinggevenden. Wacht niet op een officiële weerswaarschuwing — de maatregelen (roosters, koeling, hydratatie) moeten dan al ingevoerd zijn.',
        options: [
          { value: 'yes', label: 'Ja, vastgelegd en bekend bij leidinggevenden' },
          { value: 'informal', label: 'Informeel — er wordt actie ondernomen maar het is niet vastgelegd' },
          { value: 'no', label: 'Nee' },
        ],
      },
    ],
  },
];
