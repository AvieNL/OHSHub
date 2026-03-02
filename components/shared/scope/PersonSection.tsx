'use client';

import React from 'react';
import type { BasePerson } from '@/lib/shared-investigation-types';
import { Button, Icon } from '@/components/ui';
import { PersonCard } from './PersonCard';
import type { QualificationOption } from './PersonCard';

interface PersonSectionProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  persons: BasePerson[];
  onAdd: () => void;
  onUpdate: (id: string, patch: Partial<BasePerson>) => void;
  onRemove: (id: string) => void;
  /** Prefix voor het kaartlabel (bijv. "Uitvoerder" → "Uitvoerder 1") — plain string voor nummering */
  cardLabel: string;
  showQualification?: boolean;
  qualificationOptions?: QualificationOption[];
  showAKD?: boolean;
  showAnonymous?: boolean;
  showInvestigationRole?: boolean;
  emptyText?: string;
}

export function PersonSection({
  title,
  description,
  persons,
  onAdd,
  onUpdate,
  onRemove,
  cardLabel,
  showQualification = false,
  qualificationOptions = [],
  showAKD = true,
  showAnonymous = false,
  showInvestigationRole = false,
  emptyText,
}: PersonSectionProps) {
  return (
    <section>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {title}
          </h3>
          {description && (
            <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">
              {description}
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="xs"
          onClick={onAdd}
          leftIcon={<Icon name="plus" size="xs" />}
        >
          Toevoegen
        </Button>
      </div>

      {persons.length === 0 ? (
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          {emptyText ?? `Nog geen ${cardLabel.toLowerCase()} toegevoegd.`}
        </p>
      ) : (
        <div className="space-y-3">
          {persons.map((person, i) => (
            <PersonCard
              key={person.id}
              person={person}
              label={persons.length > 1 ? `${cardLabel} ${i + 1}` : cardLabel}
              onUpdate={(updated) => onUpdate(updated.id, updated)}
              onRemove={() => onRemove(person.id)}
              showQualification={showQualification}
              qualificationOptions={qualificationOptions}
              showAKD={showAKD}
              showAnonymous={showAnonymous}
              showInvestigationRole={showInvestigationRole}
            />
          ))}
        </div>
      )}

      {persons.length === 0 && (
        <Button
          variant="dashed"
          className="mt-2 w-full"
          onClick={onAdd}
          leftIcon={<Icon name="plus" size="sm" />}
        >
          {cardLabel} toevoegen
        </Button>
      )}
    </section>
  );
}
