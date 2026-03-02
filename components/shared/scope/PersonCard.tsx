'use client';

import type { BasePerson } from '@/lib/shared-investigation-types';
import { Button, Card, FieldLabel, FormGrid, Icon, Input, Select } from '@/components/ui';

export interface QualificationOption {
  value: string;
  label: string;
}

interface PersonCardProps {
  person: BasePerson;
  label: string;
  onUpdate: (updated: BasePerson) => void;
  onRemove: () => void;
  showQualification?: boolean;
  qualificationOptions?: QualificationOption[];
  showAKD?: boolean;
  showAnonymous?: boolean;
  showInvestigationRole?: boolean;
}

export function PersonCard({
  person,
  label,
  onUpdate,
  onRemove,
  showQualification = false,
  qualificationOptions = [],
  showAKD = true,
  showAnonymous = false,
  showInvestigationRole = false,
}: PersonCardProps) {
  function set(patch: Partial<BasePerson>) {
    onUpdate({ ...person, ...patch });
  }

  function field(
    key: keyof BasePerson,
    labelText: string,
    placeholder: string,
    type = 'text',
  ) {
    return (
      <div>
        <FieldLabel>{labelText}</FieldLabel>
        <Input
          type={type}
          size="sm"
          value={(person[key] as string) ?? ''}
          onChange={(e) => set({ [key]: e.target.value })}
          placeholder={placeholder}
          disabled={key === 'name' && (person.anonymous ?? false)}
          className={
            key === 'name' && person.anonymous
              ? 'cursor-not-allowed opacity-40'
              : undefined
          }
        />
      </div>
    );
  }

  return (
    <Card>
      {/* Card header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
            {label}
          </span>
          {showAnonymous && (
            <label className="flex cursor-pointer items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
              <input
                type="checkbox"
                checked={person.anonymous ?? false}
                onChange={(e) => set({ anonymous: e.target.checked })}
                className="accent-orange-500"
              />
              Anoniem
            </label>
          )}
        </div>
        <Button
          variant="ghost"
          size="xs"
          onClick={onRemove}
          title="Verwijderen"
          leftIcon={<Icon name="x" size="xs" />}
        />
      </div>

      {/* Core fields */}
      <FormGrid>
        {field('name', 'Naam', person.anonymous ? 'Anoniem' : 'Voor- en achternaam')}
        {field('role', 'Functie', 'Functie / rol')}
        {showInvestigationRole &&
          field('investigationRole', 'Rol in onderzoek', 'Bijv. geïnterviewde, gemeten medewerker')}
        {field('organization', 'Organisatie', 'Bedrijf of instelling')}
        {!person.anonymous && field('address', 'Adres', 'Adres')}
        {!person.anonymous && field('email', 'E-mailadres', 'naam@bedrijf.nl', 'email')}
        {!person.anonymous && field('phone', 'Telefoonnummer', '+31 6 12345678', 'tel')}
      </FormGrid>

      {/* Qualification block */}
      {showQualification && qualificationOptions.length > 0 && (
        <div className="mt-4 border-t border-zinc-200 pt-3 dark:border-zinc-700">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Kwalificatie —{' '}
            <abbr
              title="Arbowet art. 14: deskundigheidseis voor het uitvoeren van blootstellingsbeoordelingen"
              className="cursor-help underline decoration-dotted decoration-zinc-400 underline-offset-2"
            >
              Arbowet art. 14
            </abbr>
          </p>
          <div className="space-y-3">
            <div>
              <FieldLabel>Beroepsprofiel onderzoeker</FieldLabel>
              <Select
                size="sm"
                value={person.qualification ?? ''}
                onChange={(e) => set({ qualification: e.target.value || undefined })}
                className="w-full"
              >
                <option value="">— selecteer kwalificatie —</option>
                {qualificationOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </div>

            {showAKD &&
              (person.qualification === 'AH' || person.qualification === 'HVK') && (
                <div className="space-y-2 rounded-lg bg-zinc-100 px-3 py-2.5 dark:bg-zinc-700/30">
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={person.isAKD ?? false}
                      onChange={(e) => set({ isAKD: e.target.checked })}
                      className="accent-orange-500"
                    />
                    <span className="text-zinc-700 dark:text-zinc-300">
                      Gecertificeerd{' '}
                      <abbr
                        title="Arbokerndeskundige — geregistreerd in het SZW-register arbokerndeskundigen (Arbowet art. 20)"
                        className="cursor-help underline decoration-dotted decoration-zinc-400 underline-offset-2"
                      >
                        arbokerndeskundige (AKD)
                      </abbr>
                    </span>
                  </label>
                  {person.isAKD && (
                    <div>
                      <FieldLabel>AKD-registratienummer (SZW-register)</FieldLabel>
                      <Input
                        size="sm"
                        type="text"
                        value={person.akdNumber ?? ''}
                        onChange={(e) =>
                          set({ akdNumber: e.target.value || undefined })
                        }
                        placeholder="Bijv. AH-12345"
                        className="w-full"
                      />
                    </div>
                  )}
                </div>
              )}

            {person.qualification === 'bedrijfsarts' && (
              <div className="rounded-lg bg-zinc-100 px-3 py-2.5 dark:bg-zinc-700/30">
                <FieldLabel>
                  <abbr
                    title="BIG-registratienummer — Wet op de Beroepen in de Individuele Gezondheidszorg (Wet BIG, art. 3); verplicht voor bedrijfsartsen"
                    className="cursor-help underline decoration-dotted decoration-zinc-400 underline-offset-2"
                  >
                    BIG
                  </abbr>
                  -registratienummer
                </FieldLabel>
                <Input
                  size="sm"
                  type="text"
                  value={person.bigNumber ?? ''}
                  onChange={(e) => set({ bigNumber: e.target.value || undefined })}
                  placeholder="Bijv. 19012345601"
                  className="w-full"
                />
              </div>
            )}

            {person.qualification === 'other' && (
              <div>
                <FieldLabel>Omschrijving kwalificatie</FieldLabel>
                <Input
                  size="sm"
                  type="text"
                  value={person.qualificationNote ?? ''}
                  onChange={(e) =>
                    set({ qualificationNote: e.target.value || undefined })
                  }
                  placeholder="Beschrijf de opleiding of kwalificatie…"
                  className="w-full"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
