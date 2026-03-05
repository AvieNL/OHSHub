'use client';

import React from 'react';
import type { ClimateInvestigation, ClimatePerson } from '@/lib/climate-investigation-types';
import type { BasePerson, CommonScopeFields } from '@/lib/shared-investigation-types';
import { newClimateId } from '@/lib/climate-investigation-storage';
import { Abbr } from '@/components/Abbr';
import { InfoBox } from '@/components/InfoBox';
import { FieldLabel, FormGrid, Select } from '@/components/ui';
import { PersonSection } from '@/components/shared/scope/PersonSection';
import { ScopeFields } from '@/components/shared/scope/ScopeFields';
import InlineStepHeader from '@/components/InlineStepHeader';
import InlineEdit from '@/components/InlineEdit';
import MarkdownContent from '@/components/MarkdownContent';

const STEP_KEY = 'step.1';
const NS = 'investigation.climate';
const FALLBACK_TITLE = 'Stap 2 — Opdracht & kaders';
const FALLBACK_DESC = 'Registreer de opdrachtgever, uitvoerder, meetlocatie en doel van het onderzoek.';

const FALLBACK_IB0_TITLE = 'Normen — ISO 7730:2025 · ISO 7243:2017 · ISO 7933:2023 · ISO 11079:2007';

interface Props {
  investigation: ClimateInvestigation;
  onUpdate: (partial: Partial<ClimateInvestigation>) => void;
  contentOverrides?: Record<string, string>;
}

const QUALIFICATION_OPTIONS = [
  { value: 'AH',           label: 'Arbeidshygiënist' },
  { value: 'HVK',          label: "HVK'er (Hoger Veiligheidskundige)" },
  { value: 'ergonoom',     label: 'Ergonoom' },
  { value: 'bedrijfsarts', label: 'Bedrijfsarts' },
  { value: 'other',        label: 'Overige' },
];

export default function ClimateStep1_Scope({ investigation, onUpdate, contentOverrides }: Props) {
  const { investigators, clients, scope } = investigation;
  const respondents = investigation.respondents ?? [];

  const title = contentOverrides?.[`${STEP_KEY}.title`] ?? FALLBACK_TITLE;
  const desc = contentOverrides?.[`${STEP_KEY}.desc`];
  const ib0Title = contentOverrides?.[`${STEP_KEY}.infobox.0.title`] ?? FALLBACK_IB0_TITLE;
  const ib0Content = contentOverrides?.[`${STEP_KEY}.infobox.0.content`];

  function updateScope(patch: Partial<CommonScopeFields & { season?: string }>) {
    onUpdate({ scope: { ...scope, ...patch } });
  }

  function updateInvestigators(id: string, patch: Partial<BasePerson>) {
    onUpdate({
      investigators: investigators.map((p) =>
        p.id === id ? ({ ...p, ...patch } as ClimatePerson) : p,
      ),
    });
  }

  function updateClients(id: string, patch: Partial<BasePerson>) {
    onUpdate({
      clients: clients.map((p) =>
        p.id === id ? ({ ...p, ...patch } as ClimatePerson) : p,
      ),
    });
  }

  function updateRespondents(id: string, patch: Partial<BasePerson>) {
    onUpdate({
      respondents: respondents.map((p) =>
        p.id === id ? ({ ...p, ...patch } as ClimatePerson) : p,
      ),
    });
  }

  return (
    <div className="space-y-8">
      <div>
        <InlineStepHeader namespace={NS} stepKey={STEP_KEY} fallbackTitle={FALLBACK_TITLE} title={title} />
        <InlineEdit namespace={NS} contentKey={`${STEP_KEY}.desc`}
          initialValue={desc ?? FALLBACK_DESC} fallback={FALLBACK_DESC} multiline markdown>
          {desc
            ? <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                <MarkdownContent>{desc}</MarkdownContent>
              </p>
            : <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                Registreer de opdrachtgever, uitvoerder, meetlocatie en doel van het onderzoek.
              </p>
          }
        </InlineEdit>
      </div>

      <InfoBox title={
        <InlineEdit namespace={NS} contentKey={`${STEP_KEY}.infobox.0.title`}
          initialValue={ib0Title} fallback={FALLBACK_IB0_TITLE}>
          {ib0Title}
        </InlineEdit>
      }>
        <InlineEdit namespace={NS} contentKey={`${STEP_KEY}.infobox.0.content`}
          initialValue={ib0Content ?? ''} fallback="" multiline markdown>
          {ib0Content
            ? <MarkdownContent>{ib0Content}</MarkdownContent>
            : <>
                Dit onderzoek kan de volgende normen omvatten:{' '}
                <Abbr id="ISO7730">ISO 7730:2025</Abbr> (thermisch comfort PMV/PPD),{' '}
                <Abbr id="ISO7243">ISO 7243:2017</Abbr> (warmtestress WBGT),{' '}
                <Abbr id="ISO7933">ISO 7933:2023</Abbr> (gedetailleerde warmtestress PHS),{' '}
                <Abbr id="ISO11079">ISO 11079:2007</Abbr> (koudestress IREQ).
                Wetgeving: Arbobesluit art. 3.2 (inrichting arbeidsplaatsen — klimaat).
              </>
          }
        </InlineEdit>
      </InfoBox>

      {/* Uitvoerders */}
      <PersonSection
        title="Uitvoerder(s) van het onderzoek"
        persons={investigators as BasePerson[]}
        onAdd={() => onUpdate({ investigators: [...investigators, { id: newClimateId() }] })}
        onUpdate={updateInvestigators}
        onRemove={(id) => onUpdate({ investigators: investigators.filter((p) => p.id !== id) })}
        cardLabel="Uitvoerder"
        showQualification
        qualificationOptions={QUALIFICATION_OPTIONS}
      />

      {/* Opdrachtgevers */}
      <PersonSection
        title="Opdrachtgever / klant"
        persons={clients as BasePerson[]}
        onAdd={() => onUpdate({ clients: [...clients, { id: newClimateId() }] })}
        onUpdate={updateClients}
        onRemove={(id) => onUpdate({ clients: clients.filter((p) => p.id !== id) })}
        cardLabel="Opdrachtgever"
      />

      {/* Respondenten */}
      <PersonSection
        title="Respondenten / betrokken medewerkers"
        description="Medewerkers die zijn geraadpleegd of gemeten. Anonimisering mogelijk."
        persons={respondents as BasePerson[]}
        onAdd={() => onUpdate({ respondents: [...respondents, { id: newClimateId() }] })}
        onUpdate={updateRespondents}
        onRemove={(id) => onUpdate({ respondents: respondents.filter((p) => p.id !== id) })}
        cardLabel="Respondent"
        showAnonymous
        showInvestigationRole
      />

      {/* Onderzoeksgegevens */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Onderzoeksgegevens
        </h3>
        <ScopeFields scope={scope} onChange={updateScope} />

        {/* Klimaat-specifiek: seizoen */}
        <FormGrid cols={2}>
          <div>
            <FieldLabel>Seizoen / weersomstandigheden</FieldLabel>
            <Select
              value={scope.season ?? ''}
              onChange={(e) => updateScope({ season: e.target.value || undefined })}
            >
              <option value="">— selecteer —</option>
              <option value="zomer">Zomer (warm)</option>
              <option value="winter">Winter (koud)</option>
              <option value="beide">Beide seizoenen</option>
              <option value="onbekend">Onbekend / niet van toepassing</option>
            </Select>
          </div>
        </FormGrid>
      </section>
    </div>
  );
}
