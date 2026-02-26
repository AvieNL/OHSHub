'use client';

import type { SoundInvestigation, SoundPerson, PersonQualification } from '@/lib/sound-investigation-types';
import { newSoundId } from '@/lib/sound-investigation-storage';
import React from 'react';
import { Abbr } from '@/components/Abbr';
import { SectionRef } from '@/components/SectionRef';
import { InfoBox } from '@/components/InfoBox';

interface Props {
  investigation: SoundInvestigation;
  onUpdate: (partial: Partial<SoundInvestigation>) => void;
}

function PersonCard({
  person,
  label,
  showQualification,
  showAnonymous,
  onUpdate,
  onRemove,
}: {
  person: SoundPerson;
  label: string;
  showQualification?: boolean;
  showAnonymous?: boolean;
  onUpdate: (updated: SoundPerson) => void;
  onRemove: () => void;
}) {
  const INPUT = 'w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-orange-400';

  function field(key: keyof SoundPerson, placeholder: string, labelText: string, type = 'text') {
    return (
      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
          {labelText}
        </label>
        <input
          type={type}
          value={(person[key] as string) ?? ''}
          onChange={(e) => onUpdate({ ...person, [key]: e.target.value })}
          placeholder={placeholder}
          disabled={key === 'name' && (person.anonymous ?? false)}
          className={`${INPUT} ${key === 'name' && person.anonymous ? 'cursor-not-allowed opacity-40' : ''}`}
        />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/30">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{label}</span>
          {showAnonymous && (
            <label className="flex cursor-pointer items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
              <input
                type="checkbox"
                checked={person.anonymous ?? false}
                onChange={(e) => onUpdate({ ...person, anonymous: e.target.checked })}
                className="accent-orange-500"
              />
              Anoniem
            </label>
          )}
        </div>
        <button onClick={onRemove} className="text-xs text-zinc-400 hover:text-red-500">
          Verwijderen
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {field('name', person.anonymous ? 'Anoniem' : 'Voor- en achternaam', 'Naam')}
        {field('role', 'Functie / rol', 'Functie')}
        {showAnonymous && field('investigationRole', 'Bijv. geïnterviewde, gemeten medewerker', 'Rol in onderzoek')}
        {field('organization', 'Bedrijf of instelling', 'Organisatie')}
        {!person.anonymous && field('address', 'Adres', 'Adres')}
        {!person.anonymous && field('email', 'naam@bedrijf.nl', 'E-mailadres', 'email')}
        {!person.anonymous && field('phone', '+31 6 12345678', 'Telefoonnummer', 'tel')}
      </div>

      {showQualification && (
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
              <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Beroepsprofiel onderzoeker
              </label>
              <select
                value={person.qualification ?? ''}
                onChange={(e) =>
                  onUpdate({ ...person, qualification: (e.target.value || undefined) as PersonQualification | undefined })
                }
                className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-orange-400"
              >
                <option value="">— selecteer kwalificatie —</option>
                <option value="AH">Arbeidshygiënist</option>
                <option value="HVK">HVK&apos;er (Hoger Veiligheidskundige)</option>
                <option value="acousticus">Acousticus</option>
                <option value="other">Overige</option>
              </select>
            </div>

            {(person.qualification === 'AH' || person.qualification === 'HVK') && (
              <div className="space-y-2 rounded-lg bg-zinc-100 px-3 py-2.5 dark:bg-zinc-700/30">
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={person.isAKD ?? false}
                    onChange={(e) => onUpdate({ ...person, isAKD: e.target.checked })}
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
                    <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      AKD-registratienummer (SZW-register)
                    </label>
                    <input
                      type="text"
                      value={person.akdNumber ?? ''}
                      onChange={(e) => onUpdate({ ...person, akdNumber: e.target.value || undefined })}
                      placeholder="Bijv. AH-12345"
                      className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-orange-400"
                    />
                  </div>
                )}
              </div>
            )}

            {person.qualification === 'other' && (
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Omschrijving kwalificatie
                </label>
                <input
                  type="text"
                  value={person.qualificationNote ?? ''}
                  onChange={(e) => onUpdate({ ...person, qualificationNote: e.target.value || undefined })}
                  placeholder="Beschrijf de opleiding of kwalificatie…"
                  className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-orange-400"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SoundStep1_Scope({ investigation, onUpdate }: Props) {
  const { investigators, clients, scope } = investigation;
  const respondents = investigation.respondents ?? [];

  function updateScope(partial: Partial<typeof scope>) {
    onUpdate({ scope: { ...scope, ...partial } });
  }

  function addInvestigator() {
    onUpdate({ investigators: [...investigators, { id: newSoundId() }] });
  }
  function updateInvestigator(updated: SoundPerson) {
    onUpdate({ investigators: investigators.map((p) => (p.id === updated.id ? updated : p)) });
  }
  function removeInvestigator(id: string) {
    onUpdate({ investigators: investigators.filter((p) => p.id !== id) });
  }

  function addClient() {
    onUpdate({ clients: [...clients, { id: newSoundId() }] });
  }
  function updateClient(updated: SoundPerson) {
    onUpdate({ clients: clients.map((p) => (p.id === updated.id ? updated : p)) });
  }
  function removeClient(id: string) {
    onUpdate({ clients: clients.filter((p) => p.id !== id) });
  }

  function addRespondent() {
    onUpdate({ respondents: [...respondents, { id: newSoundId() }] });
  }
  function updateRespondent(updated: SoundPerson) {
    onUpdate({ respondents: respondents.map((p) => (p.id === updated.id ? updated : p)) });
  }
  function removeRespondent(id: string) {
    onUpdate({ respondents: respondents.filter((p) => p.id !== id) });
  }

  function scopeField(
    key: keyof typeof scope,
    label: React.ReactNode,
    placeholder: string,
    multiline?: boolean,
  ) {
    const value = (scope[key] as string) ?? '';
    const common = {
      value,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        updateScope({ [key]: e.target.value }),
      placeholder,
      className:
        'w-full rounded-lg border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-orange-400',
    };
    return (
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {label}
        </label>
        {multiline ? (
          <textarea rows={2} {...common} className={common.className + ' resize-none'} />
        ) : (
          <input type="text" {...common} />
        )}
      </div>
    );
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

      {/* Standard reference */}
      <InfoBox title="Norm — NEN-EN-ISO 9612:2025">
        <strong>Norm:</strong> <Abbr id="NEN9612">NEN-EN-ISO 9612</Abbr>:2025 — Acoustics — Determination of occupational
        noise exposure — Engineering method (Third edition, supersedes ISO 9612:2009)
      </InfoBox>

      {/* Investigators */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Uitvoerder(s) van het onderzoek (<SectionRef id="§15.a.4">§15.a.4</SectionRef>)
          </h3>
          <button
            onClick={addInvestigator}
            className="flex items-center gap-1.5 rounded-lg border border-dashed border-orange-400 px-3 py-1.5 text-xs text-orange-600 transition hover:bg-orange-50 dark:border-orange-500 dark:text-orange-400 dark:hover:bg-orange-950/30"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Toevoegen
          </button>
        </div>
        {investigators.length === 0 ? (
          <p className="text-xs text-zinc-400 dark:text-zinc-500">Nog geen uitvoerder toegevoegd.</p>
        ) : (
          <div className="space-y-3">
            {investigators.map((p, i) => (
              <PersonCard
                key={p.id}
                person={p}
                label={`Uitvoerder ${i + 1}`}
                showQualification
                onUpdate={updateInvestigator}
                onRemove={() => removeInvestigator(p.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Clients */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Opdrachtgever / klant (<SectionRef id="§15.a.1">§15.a.1</SectionRef>)
          </h3>
          <button
            onClick={addClient}
            className="flex items-center gap-1.5 rounded-lg border border-dashed border-orange-400 px-3 py-1.5 text-xs text-orange-600 transition hover:bg-orange-50 dark:border-orange-500 dark:text-orange-400 dark:hover:bg-orange-950/30"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Toevoegen
          </button>
        </div>
        {clients.length === 0 ? (
          <p className="text-xs text-zinc-400 dark:text-zinc-500">Nog geen opdrachtgever toegevoegd.</p>
        ) : (
          <div className="space-y-3">
            {clients.map((p, i) => (
              <PersonCard
                key={p.id}
                person={p}
                label={`Opdrachtgever ${i + 1}`}
                onUpdate={updateClient}
                onRemove={() => removeClient(p.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Respondents */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Respondenten / betrokken medewerkers (<SectionRef id="§15.a.3">§15.a.3</SectionRef>)
            </h3>
            <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">
              Medewerkers die zijn geraadpleegd of waarvan de blootstelling is gemeten. Anonimisering mogelijk.
            </p>
          </div>
          <button
            onClick={addRespondent}
            className="flex items-center gap-1.5 rounded-lg border border-dashed border-orange-400 px-3 py-1.5 text-xs text-orange-600 transition hover:bg-orange-50 dark:border-orange-500 dark:text-orange-400 dark:hover:bg-orange-950/30"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Toevoegen
          </button>
        </div>
        {respondents.length === 0 ? (
          <p className="text-xs text-zinc-400 dark:text-zinc-500">Nog geen respondenten toegevoegd.</p>
        ) : (
          <div className="space-y-3">
            {respondents.map((p, i) => (
              <PersonCard
                key={p.id}
                person={p}
                label={`Respondent ${i + 1}`}
                showAnonymous
                onUpdate={updateRespondent}
                onRemove={() => removeRespondent(p.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Scope */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Onderzoeksgegevens
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {scopeField('companyName', 'Bedrijf / afdeling', 'Bijv. ACME B.V. — productie')}
          {scopeField('workplaceName', <>Meetlocatie / werkplek (<SectionRef id="§15.a.2">§15.a.2</SectionRef>)</>, 'Bijv. Hal 3 — lasstraat')}
        </div>
        {scopeField('workplaceAddress', 'Adres werklocatie', 'Straat, huisnummer, postcode, stad')}
        {scopeField(
          'workerDescription',
          <>Omschrijving betrokken medewerkers (<SectionRef id="§15.a.3">§15.a.3</SectionRef>)</>,
          'Bijv. Lassers, slijpers en bankwerkers in ploegendienst',
          true,
        )}
        {scopeField(
          'purpose',
          <>Doel van het onderzoek (<SectionRef id="§15.a.5">§15.a.5</SectionRef>)</>,
          'Bijv. Bepaling dagelijkse geluidblootstelling conform Arbobesluit art. 6.6',
          true,
        )}
        {scopeField('investigationPeriod', 'Onderzoeksperiode', 'Bijv. januari–februari 2025')}
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Opmerkingen
          </label>
          <textarea
            rows={2}
            value={scope.notes ?? ''}
            onChange={(e) => updateScope({ notes: e.target.value })}
            placeholder="Aanvullende context of bijzonderheden…"
            className="w-full resize-none rounded-lg border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-orange-400"
          />
        </div>
      </section>
    </div>
  );
}
