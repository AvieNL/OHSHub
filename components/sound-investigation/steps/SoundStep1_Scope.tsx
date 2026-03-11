'use client';

import type { SoundInvestigation, SoundPerson } from '@/lib/sound-investigation-types';
import type { BasePerson, CommonScopeFields } from '@/lib/shared-investigation-types';
import { newSoundId } from '@/lib/sound-investigation-storage';
import { Abbr } from '@/components/Abbr';
import { FieldLabel, Textarea } from '@/components/ui';
import InlineStepHeader from '@/components/InlineStepHeader';
import InlineEdit from '@/components/InlineEdit';
import MarkdownContent from '@/components/MarkdownContent';
import { PersonSection } from '@/components/shared/scope/PersonSection';
import { ScopeFields } from '@/components/shared/scope/ScopeFields';

interface Props {
  investigation: SoundInvestigation;
  onUpdate: (partial: Partial<SoundInvestigation>) => void;
  onGoToStep: (step: number) => void;
  contentOverrides?: Record<string, string>;
}

const QUALIFICATION_OPTIONS = [
  { value: 'AH',           label: 'Arbeidshygiënist' },
  { value: 'HVK',          label: "HVK'er (Hoger Veiligheidskundige)" },
  { value: 'acousticus',   label: 'Acousticus' },
  { value: 'bedrijfsarts', label: 'Bedrijfsarts' },
  { value: 'other',        label: 'Overige' },
];

const STEP_KEY = 'step.1';
const NS = 'investigation.sound';
const FALLBACK_TITLE = 'Stap 2 — Opdracht & kaders';
const FALLBACK_DESC = 'Registreer de opdrachtgever, uitvoerder, meetlocatie en doel van het onderzoek conform NEN-EN-ISO 9612:2025.';

export default function SoundStep1_Scope({ investigation, onUpdate, contentOverrides }: Props) {
  const { investigators, clients, scope } = investigation;
  const respondents = investigation.respondents ?? [];

  function updateScope(patch: Partial<CommonScopeFields & { normNotes?: string }>) {
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

  const title = contentOverrides?.[`${STEP_KEY}.title`] ?? FALLBACK_TITLE;
  const desc = contentOverrides?.[`${STEP_KEY}.desc`];

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
                Registreer de opdrachtgever, uitvoerder, meetlocatie en doel van het onderzoek conform{' '}
                <Abbr id="NEN9612">NEN-EN-ISO 9612</Abbr>:2025.
              </p>
          }
        </InlineEdit>
      </div>

      {/* Uitvoerders */}
      <PersonSection
        title="Uitvoerder(s) van het onderzoek"
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
        title="Opdrachtgever / klant"
        persons={clients as BasePerson[]}
        onAdd={() => onUpdate({ clients: [...clients, { id: newSoundId() }] })}
        onUpdate={updateClients}
        onRemove={(id) => onUpdate({ clients: clients.filter((p) => p.id !== id) })}
        cardLabel="Opdrachtgever"
      />

      {/* Respondenten */}
      <PersonSection
        title="Respondenten / betrokken medewerkers"
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

      {/* Toegepaste norm (§15.a.6) */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Toegepaste norm
        </h3>
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/50">
          <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
            NEN-EN-ISO 9612:2025
          </p>
          <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">
            Acoustics — Determination of occupational noise exposure — Engineering method
          </p>
          <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
            Third edition · Supersedes ISO 9612:2009
          </p>
        </div>
        <div>
          <FieldLabel>Afwijkingen / aanvullende normen</FieldLabel>
          <Textarea
            rows={2}
            value={scope.normNotes ?? ''}
            onChange={(e) => updateScope({ normNotes: e.target.value })}
            placeholder="Eventuele afwijkingen van de norm of aanvullende normen…"
            className="w-full"
          />
        </div>
      </section>
    </div>
  );
}
