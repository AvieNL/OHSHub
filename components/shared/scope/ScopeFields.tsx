'use client';

import type { CommonScopeFields } from '@/lib/shared-investigation-types';
import { FieldLabel, FormGrid, Input, Textarea } from '@/components/ui';

interface ScopeFieldsProps {
  scope: CommonScopeFields;
  onChange: (patch: Partial<CommonScopeFields>) => void;
}

/**
 * Gedeelde "Onderzoeksgegevens"-sectie voor alle onderzoeksmodules.
 * Volgorde: bedrijfsnaam → afdeling → werkplek → adres → medewerkers → doel → periode → aantekeningen.
 */
export function ScopeFields({ scope, onChange }: ScopeFieldsProps) {
  function field(
    key: keyof CommonScopeFields,
    labelText: string,
    placeholder: string,
    multiline?: boolean,
  ) {
    const value = (scope[key] as string) ?? '';
    return (
      <div>
        <FieldLabel>{labelText}</FieldLabel>
        {multiline ? (
          <Textarea
            rows={2}
            value={value}
            onChange={(e) => onChange({ [key]: e.target.value })}
            placeholder={placeholder}
            className="w-full"
          />
        ) : (
          <Input
            type="text"
            value={value}
            onChange={(e) => onChange({ [key]: e.target.value })}
            placeholder={placeholder}
            className="w-full"
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <FormGrid cols={2}>
        {field('companyName', 'Bedrijfsnaam', 'Naam opdrachtgevend bedrijf')}
        {field('department', 'Afdeling / locatie', 'Bijv. Afdeling Productie, Magazijn')}
      </FormGrid>
      <FormGrid cols={2}>
        {field('workplaceName', 'Naam werkplek / meetlocatie', 'Bijv. Hal 3 — lasstraat')}
        {field('workplaceAddress', 'Adres werkplek', 'Straat, huisnummer, postcode, stad')}
      </FormGrid>
      {field(
        'workerDescription',
        'Omschrijving medewerkers(groep)',
        'Bijv. Lassers en bankwerkers in dagdienst (~20 personen)',
        true,
      )}
      {field(
        'purpose',
        'Doel van het onderzoek',
        'Bijv. Bepaling blootstelling conform Arbobesluit',
        true,
      )}
      <FormGrid cols={2}>
        {field('investigationPeriod', 'Onderzoeksperiode', 'Bijv. januari–februari 2025')}
      </FormGrid>
      <div>
        <FieldLabel>Aantekeningen</FieldLabel>
        <Textarea
          rows={2}
          value={scope.notes ?? ''}
          onChange={(e) => onChange({ notes: e.target.value })}
          placeholder="Aanvullende context of bijzonderheden…"
          className="w-full"
        />
      </div>
    </div>
  );
}
