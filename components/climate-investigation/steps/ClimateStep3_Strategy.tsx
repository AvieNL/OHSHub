'use client';

import type { ClimateInvestigation, ClimateScenario } from '@/lib/climate-investigation-types';
import { Abbr } from '@/components/Abbr';
import { InfoBox } from '@/components/InfoBox';

interface Props {
  investigation: ClimateInvestigation;
  onUpdate: (partial: Partial<ClimateInvestigation>) => void;
}

const SCENARIOS: {
  id: ClimateScenario;
  title: string;
  norm: string;
  description: string;
  when: string;
  steps: string;
}[] = [
  {
    id: 'comfort',
    title: 'Thermisch comfort — PMV/PPD',
    norm: 'ISO 7730:2025',
    description: 'Berekening van de Predicted Mean Vote (PMV) en Predicted Percentage Dissatisfied (PPD) voor binnenwerkomgevingen. Beoordeelt het algemeen thermisch comfortniveau.',
    when: 'Klachten over te warm / te koud binnenklimaat, kantooromgevingen, clean rooms, verpleeghuizen.',
    steps: 'Stap 7',
  },
  {
    id: 'heat',
    title: 'Warmtestress — WBGT + PHS',
    norm: 'ISO 7243:2017 + ISO 7933:2023',
    description: 'Screening met WBGT (Wet Bulb Globe Temperature) gevolgd door gedetailleerde PHS-analyse (Predicted Heat Strain) als de WBGT-referentiewaarde wordt overschreden.',
    when: 'Hoge temperaturen (> 28°C), stralingswarmte, zware lichamelijke arbeid, buitenwerk in zomer.',
    steps: 'Stap 8 + 9',
  },
  {
    id: 'cold',
    title: 'Koudestress — IREQ',
    norm: 'ISO 11079:2007',
    description: 'Berekening van de benodigde kledinginsulatie (IREQ) voor thermisch evenwicht en de maximale blootstellingstijd (D_lim) bij onvoldoende kleding.',
    when: 'Koelcellen, vrieshuizen, buitenwerk in koude seizoenen, temperaturen onder 10°C.',
    steps: 'Stap 10',
  },
  {
    id: 'local',
    title: 'Lokaal thermisch comfort',
    norm: 'ISO 7730:2025 §6',
    description: 'Beoordeling van lokale thermische oncomfortbronnen: tocht (Draught Rate DR), verticaal temperatuurverschil, vloertemperatuur en stralingsasymmetrie.',
    when: 'Tochtverschijnselen, klachten over koude vloeren, stralende warmtebronnen of koude ramen in nabijheid van werkplek.',
    steps: 'Stap 11',
  },
];

export default function ClimateStep3_Strategy({ investigation, onUpdate }: Props) {
  const { scenarios } = investigation;

  function toggleScenario(id: ClimateScenario) {
    const updated = scenarios.includes(id)
      ? scenarios.filter((s) => s !== id)
      : [...scenarios, id];
    onUpdate({ scenarios: updated });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Stap 4 — Meetstrategie &amp; scenario&apos;s
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          Selecteer welke beoordelingsscenario&apos;s van toepassing zijn op dit onderzoek. Meerdere
          scenario&apos;s kunnen gecombineerd worden. De bijbehorende meetstappen worden ingeschakeld
          op basis van uw selectie.
        </p>
      </div>

      <InfoBox title="Keuze meetstrategie — arbeidshygienische aanpak">
        Begin met een voorverkenning (stap 1). Pas daarna de meetstrategie aan op de aard van het
        klimaatprobleem. Warmtestress: start altijd met WBGT-screening (<Abbr id="ISO7243">ISO 7243</Abbr>)
        voordat het gedetailleerdere <Abbr id="PHS">PHS</Abbr>-model (<Abbr id="ISO7933">ISO 7933</Abbr>)
        wordt ingezet. Koudestress: gebruik <Abbr id="IREQ">IREQ</Abbr> (<Abbr id="ISO11079">ISO 11079</Abbr>).
        Thermisch comfort binnenklimaat: gebruik <Abbr id="PMV">PMV</Abbr>/<Abbr id="PPD">PPD</Abbr>{' '}
        (<Abbr id="ISO7730">ISO 7730</Abbr>).
      </InfoBox>

      <div className="space-y-3">
        {SCENARIOS.map((s) => {
          const isSelected = scenarios.includes(s.id);
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => toggleScenario(s.id)}
              className={`w-full rounded-xl border p-4 text-left transition ${
                isSelected
                  ? 'border-orange-400 bg-orange-50 dark:border-orange-600 dark:bg-orange-900/20'
                  : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition ${
                    isSelected
                      ? 'border-orange-500 bg-orange-500'
                      : 'border-zinc-300 dark:border-zinc-600'
                  }`}
                >
                  {isSelected && (
                    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className={`text-sm font-semibold ${isSelected ? 'text-orange-700 dark:text-orange-300' : 'text-zinc-800 dark:text-zinc-200'}`}>
                      {s.title}
                    </p>
                    <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400">
                      {s.norm}
                    </span>
                    <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400">
                      {s.steps}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{s.description}</p>
                  <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                    <span className="font-medium">Wanneer:</span> {s.when}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {scenarios.length === 0 && (
        <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:bg-amber-900/15 dark:text-amber-400">
          Selecteer minimaal één scenario om door te gaan. De bijbehorende meetstappen worden op basis
          van uw selectie ingeschakeld.
        </div>
      )}

      {scenarios.length > 0 && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-800/40 dark:bg-emerald-900/10">
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
            Geselecteerde scenario&apos;s: {scenarios.length}
          </p>
          <ul className="mt-1 space-y-0.5">
            {SCENARIOS.filter((s) => scenarios.includes(s.id)).map((s) => (
              <li key={s.id} className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400">
                <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                <span>{s.title} — {s.norm} ({s.steps})</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
