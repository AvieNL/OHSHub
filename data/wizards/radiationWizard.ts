import type { WizardStep, WizardConfig } from '@/lib/wizard-types';

export const STEPS: WizardStep[] = [
  {
    id: 'inventory',
    title: 'Inventarisatie stralingsbronnen',
    description:
      'Breng in kaart welke soorten straling voorkomen op de werkplek en welke functies zijn blootgesteld.',
    questions: [
      {
        id: 'rad-type',
        label: 'Welk type straling komt voor op de werkplek? (meerdere mogelijk)',
        type: 'checkbox',
        tip: 'Ioniserende straling omvat röntgen-, gamma-, neutronenstraling en radioactieve stoffen. Niet-ioniserende straling omvat UV, infrarood, laser en elektromagnetische velden (EMV).',
        options: [
          { value: 'ionising-xray',    label: 'Röntgenstraling — medische apparatuur, NDT, bagagescanners' },
          { value: 'ionising-gamma',   label: 'Gammastraling / radioactieve stoffen — nucleaire sector, radiofarmaca' },
          { value: 'uv',               label: 'Ultraviolette straling (UV) — lassen, UV-lampen, buitenwerk in de zon' },
          { value: 'ir',               label: 'Infraroodstraling (IR) — gietovens, laserapparatuur, warmtelampen' },
          { value: 'laser',            label: 'Laserstraling — lasersnijden, laserlassen, medische lasers' },
          { value: 'emf',              label: 'Elektromagnetische velden (EMV) — MRI-apparatuur, hoogspanning, inductiekachels' },
        ],
      },
      {
        id: 'rad-workers',
        label: 'Zijn werknemers aangewezen als stralingswerker (categorie A of B) conform het Besluit basisveiligheidsnormen stralingsbescherming (Bbs)?',
        type: 'radio',
        tip: 'Stralingswerkers categorie A: jaarlijkse effectieve dosis mogelijk > 6 mSv of equivalente orgaandosis boven bepaalde grenzen. Categorie B: mogelijk > 1 mSv maar < 6 mSv effectieve dosis per jaar. Categorisering door stralingsbeschermingsdeskundige (SBD).',
        options: [
          { value: 'yes-a',  label: 'Ja — stralingswerkers categorie A aanwezig' },
          { value: 'yes-b',  label: 'Ja — stralingswerkers categorie B aanwezig' },
          { value: 'no',     label: 'Nee — geen aangewezen stralingswerkers' },
          { value: 'unknown', label: 'Onbekend — nadere beoordeling nodig' },
        ],
      },
      {
        id: 'rad-permit',
        label: 'Is er een geldige vergunning of melding aanwezig voor de toepassing van ioniserende straling (Bbs / Kernenergiewet)?',
        type: 'radio',
        options: [
          { value: 'permit',      label: 'Ja — vergunning aanwezig en geldig' },
          { value: 'notification', label: 'Ja — melding gedaan (meldingsplichtige toepassing)' },
          { value: 'exempt',      label: 'Vrijgesteld — toepassing valt onder vrijstellingsregeling Bbs' },
          { value: 'no',          label: 'Nee / niet van toepassing — geen ioniserende straling' },
          { value: 'unknown',     label: 'Onbekend' },
        ],
      },
    ],
  },
];

export const WIZARD_CONFIG: WizardConfig = {
  steps: STEPS,
};
