'use client';

import React from 'react';
import type { ClimateInvestigation, ClimatePerson, ClimatePersonQualification } from '@/lib/climate-investigation-types';
import { newClimateId } from '@/lib/climate-investigation-storage';
import { Abbr } from '@/components/Abbr';
import { InfoBox } from '@/components/InfoBox';

interface Props {
  investigation: ClimateInvestigation;
  onUpdate: (partial: Partial<ClimateInvestigation>) => void;
}

function PersonCard({
  person,
  label,
  showQualification,
  showAnonymous,
  onUpdate,
  onRemove,
}: {
  person: ClimatePerson;
  label: string;
  showQualification?: boolean;
  showAnonymous?: boolean;
  onUpdate: (updated: ClimatePerson) => void;
  onRemove: () => void;
}) {
  const INPUT = 'w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-orange-400';

  function field(key: keyof ClimatePerson, placeholder: string, labelText: string, type = 'text') {
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
              title="Arbowet art. 14: deskundigheidseis voor uitvoeren van blootstellingsbeoordelingen"
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
                  onUpdate({ ...person, qualification: (e.target.value || undefined) as ClimatePersonQualification | undefined })
                }
                className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-orange-400"
              >
                <option value="">— selecteer kwalificatie —</option>
                <option value="AH">Arbeidshygiënist</option>
                <option value="HVK">HVK&apos;er (Hoger Veiligheidskundige)</option>
                <option value="ergonoom">Ergonoom</option>
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
                      title="Arbokerndeskundige — geregistreerd in het SZW-register (Arbowet art. 20)"
                      className="cursor-help underline decoration-dotted decoration-zinc-400 underline-offset-2"
                    >
                      arbokerndeskundige (AKD)
                    </abbr>
                  </span>
                </label>
                {person.isAKD && (
                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      AKD-registratienummer
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

export default function ClimateStep1_Scope({ investigation, onUpdate }: Props) {
  const { investigators, clients, scope } = investigation;
  const respondents = investigation.respondents ?? [];

  function updateScope(partial: Partial<typeof scope>) {
    onUpdate({ scope: { ...scope, ...partial } });
  }

  function addInvestigator() {
    onUpdate({ investigators: [...investigators, { id: newClimateId() }] });
  }
  function updateInvestigator(updated: ClimatePerson) {
    onUpdate({ investigators: investigators.map((p) => (p.id === updated.id ? updated : p)) });
  }
  function removeInvestigator(id: string) {
    onUpdate({ investigators: investigators.filter((p) => p.id !== id) });
  }

  function addClient() {
    onUpdate({ clients: [...clients, { id: newClimateId() }] });
  }
  function updateClient(updated: ClimatePerson) {
    onUpdate({ clients: clients.map((p) => (p.id === updated.id ? updated : p)) });
  }
  function removeClient(id: string) {
    onUpdate({ clients: clients.filter((p) => p.id !== id) });
  }

  function addRespondent() {
    onUpdate({ respondents: [...respondents, { id: newClimateId() }] });
  }
  function updateRespondent(updated: ClimatePerson) {
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
          Registreer de opdrachtgever, uitvoerder, meetlocatie en doel van het onderzoek.
        </p>
      </div>

      <InfoBox title="Normen — ISO 7730:2025 · ISO 7243:2017 · ISO 7933:2023 · ISO 11079:2007">
        Dit onderzoek kan de volgende normen omvatten:{' '}
        <Abbr id="ISO7730">ISO 7730:2025</Abbr> (thermisch comfort PMV/PPD),{' '}
        <Abbr id="ISO7243">ISO 7243:2017</Abbr> (warmtestress WBGT),{' '}
        <Abbr id="ISO7933">ISO 7933:2023</Abbr> (gedetailleerde warmtestress PHS),{' '}
        <Abbr id="ISO11079">ISO 11079:2007</Abbr> (koudestress IREQ).
        Wetgeving: Arbobesluit art. 3.2 (inrichting arbeidsplaatsen — klimaat).
      </InfoBox>

      {/* Investigators */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Uitvoerder(s) van het onderzoek
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
            Opdrachtgever / klant
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
              Respondenten / betrokken medewerkers
            </h3>
            <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">
              Medewerkers die zijn geraadpleegd of gemeten. Anonimisering mogelijk.
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
          {scopeField('companyName', 'Bedrijf / afdeling', 'Bijv. ACME B.V. — assemblage')}
          {scopeField('workplaceName', 'Meetlocatie / werkplek', 'Bijv. Assemblagehal A — 2e verdieping')}
        </div>
        {scopeField('workplaceAddress', 'Adres werklocatie', 'Straat, huisnummer, postcode, stad')}
        {scopeField('workerDescription', 'Omschrijving betrokken medewerkers', 'Bijv. assemblagemedewerkers, ploegendienst', true)}
        {scopeField('purpose', 'Doel van het onderzoek', 'Bijv. Beoordeling thermisch comfort conform Arbobesluit art. 3.2', true)}
        <div className="grid gap-4 sm:grid-cols-2">
          {scopeField('investigationPeriod', 'Onderzoeksperiode', 'Bijv. augustus 2025')}
          {scopeField('season', 'Seizoen / weersomstandigheden', 'Bijv. zomer, hittegolf, buiten 35°C')}
        </div>
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
