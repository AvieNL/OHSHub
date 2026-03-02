'use client';

import type { SoundInvestigation, SoundPerson } from '@/lib/sound-investigation-types';
import type { BasePerson, CommonScopeFields } from '@/lib/shared-investigation-types';
import { newSoundId } from '@/lib/sound-investigation-storage';
import { Abbr } from '@/components/Abbr';
import { SectionRef } from '@/components/SectionRef';
import { InfoBox } from '@/components/InfoBox';
import { PersonSection } from '@/components/shared/scope/PersonSection';
import { ScopeFields } from '@/components/shared/scope/ScopeFields';

interface Props {
  investigation: SoundInvestigation;
  onUpdate: (partial: Partial<SoundInvestigation>) => void;
  onGoToStep: (step: number) => void;
}

const QUALIFICATION_OPTIONS = [
  { value: 'AH',           label: 'Arbeidshygiënist' },
  { value: 'HVK',          label: "HVK'er (Hoger Veiligheidskundige)" },
  { value: 'acousticus',   label: 'Acousticus' },
  { value: 'bedrijfsarts', label: 'Bedrijfsarts' },
  { value: 'other',        label: 'Overige' },
];

export default function SoundStep1_Scope({ investigation, onUpdate }: Props) {
  const { investigators, clients, scope } = investigation;
  const respondents = investigation.respondents ?? [];

  function updateScope(patch: Partial<CommonScopeFields>) {
    onUpdate({ scope: { ...scope, ...patch } });
  }

  function updateInvestigators(id: string, patch: Partial<BasePerson>) {
    onUpdate({
      investigators: investigators.map((p) =>
        p.id === id ? ({ ...p, ...patch } as SoundPerson) : p,
      ),
    });
  }

  function updateClients(id: string, patch: Partial<BasePerson>) {
    onUpdate({
      clients: clients.map((p) =>
        p.id === id ? ({ ...p, ...patch } as SoundPerson) : p,
      ),
    });
  }

  function updateRespondents(id: string, patch: Partial<BasePerson>) {
    onUpdate({
      respondents: respondents.map((p) =>
        p.id === id ? ({ ...p, ...patch } as SoundPerson) : p,
      ),
    });
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Stap 2 — Opdracht & kaders
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          Registreer de opdrachtgever, uitvoerder, meetlocatie en doel van het onderzoek conform{' '}
          <Abbr id="NEN9612">NEN-EN-ISO 9612</Abbr>:2025 <SectionRef id="§15.a">§15.a</SectionRef>.
        </p>
      </div>

      <InfoBox title="Norm — NEN-EN-ISO 9612:2025">
        <strong>Norm:</strong> <Abbr id="NEN9612">NEN-EN-ISO 9612</Abbr>:2025 — Acoustics — Determination of occupational
        noise exposure — Engineering method (Third edition, supersedes ISO 9612:2009)
      </InfoBox>

      {/* Uitvoerders */}
      <PersonSection
        title={<>Uitvoerder(s) van het onderzoek (<SectionRef id="§15.a.4">§15.a.4</SectionRef>)</>}
        persons={investigators as BasePerson[]}
        onAdd={() => onUpdate({ investigators: [...investigators, { id: newSoundId() }] })}
        onUpdate={updateInvestigators}
        onRemove={(id) => onUpdate({ investigators: investigators.filter((p) => p.id !== id) })}
        cardLabel="Uitvoerder"
        showQualification
        qualificationOptions={QUALIFICATION_OPTIONS}
      />

      {/* Opdrachtgevers */}
      <PersonSection
        title={<>Opdrachtgever / klant (<SectionRef id="§15.a.1">§15.a.1</SectionRef>)</>}
        persons={clients as BasePerson[]}
        onAdd={() => onUpdate({ clients: [...clients, { id: newSoundId() }] })}
        onUpdate={updateClients}
        onRemove={(id) => onUpdate({ clients: clients.filter((p) => p.id !== id) })}
        cardLabel="Opdrachtgever"
      />

      {/* Respondenten */}
      <PersonSection
        title={<>Respondenten / betrokken medewerkers (<SectionRef id="§15.a.3">§15.a.3</SectionRef>)</>}
        description="Medewerkers die zijn geraadpleegd of waarvan de blootstelling is gemeten. Anonimisering mogelijk."
        persons={respondents as BasePerson[]}
        onAdd={() => onUpdate({ respondents: [...respondents, { id: newSoundId() }] })}
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
      </section>
    </div>
  );
}
