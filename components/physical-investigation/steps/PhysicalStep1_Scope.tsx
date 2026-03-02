'use client';

import type { PhysicalInvestigation, PhysicalPerson } from '@/lib/physical-investigation-types';
import type { BasePerson, CommonScopeFields } from '@/lib/shared-investigation-types';
import { newPhysicalId } from '@/lib/physical-investigation-storage';
import { InfoBox } from '@/components/InfoBox';
import { Abbr } from '@/components/Abbr';
import { FieldLabel, Textarea } from '@/components/ui';
import { PersonSection } from '@/components/shared/scope/PersonSection';
import { ScopeFields } from '@/components/shared/scope/ScopeFields';

interface Props {
  investigation: PhysicalInvestigation;
  onUpdate: (partial: Partial<PhysicalInvestigation>) => void;
}

const QUALIFICATION_OPTIONS = [
  { value: 'AH',           label: 'Arbeidshygiënist' },
  { value: 'HVK',          label: 'Hogere Veiligheidskundige' },
  { value: 'ergonoom',     label: 'Ergonoom (gecertificeerd)' },
  { value: 'bedrijfsarts', label: 'Bedrijfsarts' },
  { value: 'other',        label: 'Overige deskundige' },
];

export default function PhysicalStep1_Scope({ investigation, onUpdate }: Props) {
  const { investigators, clients, respondents, scope } = investigation;

  function updateScope(patch: Partial<CommonScopeFields & { referenceDocument?: string }>) {
    onUpdate({ scope: { ...scope, ...patch } });
  }

  function updateInvestigators(id: string, patch: Partial<BasePerson>) {
    onUpdate({
      investigators: investigators.map((p) =>
        p.id === id ? ({ ...p, ...patch } as PhysicalPerson) : p,
      ),
    });
  }

  function updateClients(id: string, patch: Partial<BasePerson>) {
    onUpdate({
      clients: clients.map((p) =>
        p.id === id ? ({ ...p, ...patch } as PhysicalPerson) : p,
      ),
    });
  }

  function updateRespondents(id: string, patch: Partial<BasePerson>) {
    onUpdate({
      respondents: respondents.map((p) =>
        p.id === id ? ({ ...p, ...patch } as PhysicalPerson) : p,
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
          Leg de onderzoeksopdracht, betrokkenen en werkplek vast. Dit vormt de basis
          van het rapport conform{' '}
          <Abbr id="NEN-ISO 11228-1">NEN-ISO 11228-1</Abbr> §7 en Arbobesluit art. 5.1.
        </p>
      </div>

      <InfoBox title="Arbobesluit art. 5.1 — Ergonomische risicobeoordeling">
        De werkgever is verplicht de risico&apos;s van handmatige handling te inventariseren
        bij de{' '}
        <abbr title="Risico-inventarisatie en -evaluatie" className="cursor-help underline decoration-dotted decoration-zinc-400 underline-offset-2">RI&amp;E</abbr>.
        Leg de onderzoekopdracht vast: aanleiding (klachten,{' '}
        <abbr title="Risico-inventarisatie en -evaluatie" className="cursor-help underline decoration-dotted decoration-zinc-400 underline-offset-2">RI&amp;E</abbr>,
        nieuwbouw/verbouw), werkplekbeschrijving en betrokken medewerkers.
      </InfoBox>

      {/* Uitvoerders */}
      <PersonSection
        title="Uitvoerend onderzoeker(s)"
        persons={investigators as BasePerson[]}
        onAdd={() => onUpdate({ investigators: [...investigators, { id: newPhysicalId() }] })}
        onUpdate={updateInvestigators}
        onRemove={(id) => onUpdate({ investigators: investigators.filter((p) => p.id !== id) })}
        cardLabel="Uitvoerder"
        showQualification
        qualificationOptions={QUALIFICATION_OPTIONS}
      />

      {/* Opdrachtgevers */}
      <PersonSection
        title="Opdrachtgever(s)"
        persons={clients as BasePerson[]}
        onAdd={() => onUpdate({ clients: [...clients, { id: newPhysicalId() }] })}
        onUpdate={updateClients}
        onRemove={(id) => onUpdate({ clients: clients.filter((p) => p.id !== id) })}
        cardLabel="Opdrachtgever"
      />

      {/* Respondenten */}
      <PersonSection
        title="Geïnterviewde / geobserveerde medewerkers"
        persons={respondents as BasePerson[]}
        onAdd={() => onUpdate({ respondents: [...respondents, { id: newPhysicalId() }] })}
        onUpdate={updateRespondents}
        onRemove={(id) => onUpdate({ respondents: respondents.filter((p) => p.id !== id) })}
        cardLabel="Medewerker"
        showAnonymous
        showInvestigationRole
      />

      {/* Onderzoeksgegevens */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Onderzoekskader</h3>
        <ScopeFields scope={scope} onChange={updateScope} />

        {/* Fysieke-belasting-specifiek: referentiedocument */}
        <div>
          <FieldLabel>Referentiedocument</FieldLabel>
          <Textarea
            rows={2}
            value={scope.referenceDocument ?? ''}
            onChange={(e) => updateScope({ referenceDocument: e.target.value })}
            placeholder="Bijv. RI&E-rapportage d.d. 2024-03-15, arbobeleid versie 4, MHI-rapport…"
            className="w-full"
          />
        </div>
      </section>
    </div>
  );
}
