'use client';

import type { PhysicalInvestigation, PhysicalLoadMethod } from '@/lib/physical-investigation-types';
import { InfoBox } from '@/components/InfoBox';

interface Props {
  investigation: PhysicalInvestigation;
  onUpdate: (partial: Partial<PhysicalInvestigation>) => void;
}

interface MethodOption {
  value: PhysicalLoadMethod;
  label: string;
  norm: string;
  description: string;
  tool: string;
}

const METHOD_OPTIONS: MethodOption[] = [
  {
    value: 'lifting',
    label: 'Tillen & neerlaten',
    norm: 'NEN-ISO 11228-1:2021',
    tool: 'NIOSH-methode (RWL / Tillingsindex)',
    description: 'Beoordeling van manueel tillen en neerlaten van lasten ≥ 3 kg. Berekening van de Recommended Weight Limit (RWL) en Tillingsindex (LI = G/RWL).',
  },
  {
    value: 'carrying',
    label: 'Dragen',
    norm: 'NEN-ISO 11228-1:2021 / Mital',
    tool: 'Mital-methode (correctiefactoren)',
    description: 'Beoordeling van handmatig dragen van lasten over een afstand. Acceptabele draaggrens op basis van correctiefactoren voor duur, asymmetrie, grip en klimaat.',
  },
  {
    value: 'push-pull',
    label: 'Duwen & trekken',
    norm: 'NEN-ISO 11228-2:2007 / DUTCH',
    tool: 'DUTCH-methode / krachtengrenswaarden',
    description: 'Beoordeling van duw- en trekkrachten bij verplaatsen van objecten/transportmiddelen. Vergelijking gemeten krachten met populatienormen per handgreephoogte.',
  },
  {
    value: 'repetitive',
    label: 'Repeterende handelingen',
    norm: 'NEN-ISO 11228-3:2007 / EN 1005-5',
    tool: 'OCRA Checklist',
    description: 'Beoordeling van repeterende arm- en handbewegingen. OCRA Checklist score combineert hersteltijd, kracht, houding, herhaalbaarheid en aanvullende factoren.',
  },
  {
    value: 'posture',
    label: 'Houdingen & bewegingen',
    norm: 'EN 1005-4:2005 / ISO 11226:2000',
    tool: 'Houdingsbeoordeling (zone-indeling)',
    description: 'Observatie en beoordeling van werkhoudingen per lichaamsgebied (romp, nek, schouder, arm, been). Indeling in acceptabel / voorwaardelijk / niet acceptabel op basis van hoek en frequentie.',
  },
  {
    value: 'forces',
    label: 'Krachten op arbeidsmiddelen',
    norm: 'EN 1005-3:2002',
    tool: 'Risicodimensie m_r = F / F_Br',
    description: 'Beoordeling van krachten die worden uitgeoefend op bedieningselementen van machines en arbeidsmiddelen. Vergelijking met referentiekrachten gecorrigeerd voor snelheid, frequentie en duur.',
  },
];

export default function PhysicalStep3_Strategy({ investigation, onUpdate }: Props) {
  const { methods, bgs } = investigation;

  function toggleMethod(m: PhysicalLoadMethod) {
    if (methods.includes(m)) {
      onUpdate({ methods: methods.filter((x) => x !== m) });
    } else {
      onUpdate({ methods: [...methods, m] });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Stap 4 — Meetstrategie
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          Selecteer welke belastingtypen in dit onderzoek worden beoordeeld.
          De geselecteerde methoden bepalen welke stappen actief zijn.
        </p>
      </div>

      <InfoBox title="Arbeidshygiënische Strategie — keuze meetmethoden">
        Kies de meetmethode op basis van de dominante belasting in de functie.
        De{' '}
        <abbr title="Arbeidshygiënische Strategie: van bronmaatregelen naar persoonlijke bescherming" className="cursor-help underline decoration-dotted decoration-zinc-400 underline-offset-2">
          Arbeidshygiënische Strategie
        </abbr>{' '}
        geldt ook voor ergonomie: technische oplossingen (mechanisatie, hulpmiddelen)
        gaan altijd vóór organisatorische maatregelen (roulatie, pauzes) en persoonlijke
        beschermingsmiddelen (rugsteun, polsbraces). Meerdere methoden kunnen worden gecombineerd.
      </InfoBox>

      {bgs.length === 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-800/30 dark:bg-amber-900/10 dark:text-amber-400">
          ⚠ Definieer eerst belastingsgroepen in stap 3 om de strategie te kunnen koppelen.
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {METHOD_OPTIONS.map((opt) => {
          const selected = methods.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggleMethod(opt.value)}
              className={`flex flex-col items-start gap-1 rounded-xl border px-4 py-4 text-left transition ${
                selected
                  ? 'border-orange-400 bg-orange-50 dark:border-orange-600 dark:bg-orange-900/15'
                  : 'border-zinc-200 bg-zinc-50 hover:border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800/30 dark:hover:border-zinc-600'
              }`}
            >
              <div className="flex w-full items-center justify-between">
                <span className={`text-sm font-semibold ${selected ? 'text-orange-700 dark:text-orange-400' : 'text-zinc-800 dark:text-zinc-200'}`}>
                  {opt.label}
                </span>
                <span className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition ${
                  selected
                    ? 'border-orange-500 bg-orange-500'
                    : 'border-zinc-300 dark:border-zinc-600'
                }`}>
                  {selected && (
                    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                </span>
              </div>
              <p className={`text-xs ${selected ? 'text-orange-600 dark:text-orange-400' : 'text-zinc-500 dark:text-zinc-400'}`}>
                {opt.norm} · {opt.tool}
              </p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                {opt.description}
              </p>
            </button>
          );
        })}
      </div>

      {methods.length === 0 && (
        <p className="text-center text-sm text-zinc-400 dark:text-zinc-500">
          Selecteer minimaal één methode om verder te gaan.
        </p>
      )}

      {methods.length > 0 && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-800/40 dark:bg-blue-900/10">
          <p className="mb-2 text-xs font-semibold text-blue-700 dark:text-blue-400">
            Geselecteerde beoordelingsmethoden
          </p>
          <div className="flex flex-wrap gap-2">
            {methods.map((m) => {
              const opt = METHOD_OPTIONS.find((o) => o.value === m);
              return (
                <span key={m} className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                  {opt?.label ?? m}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
