'use client';

import { useState } from 'react';
import type { PhysicalInvestigation, PhysicalPerson, PhysicalPersonQualification } from '@/lib/physical-investigation-types';
import { newPhysicalId } from '@/lib/physical-investigation-storage';
import { InfoBox } from '@/components/InfoBox';
import { Abbr } from '@/components/Abbr';

interface Props {
  investigation: PhysicalInvestigation;
  onUpdate: (partial: Partial<PhysicalInvestigation>) => void;
}

const QUALIFICATION_LABELS: Record<PhysicalPersonQualification, string> = {
  AH: 'Arbeidshygiënist',
  HVK: 'Hogere Veiligheidskundige',
  ergonoom: 'Ergonoom (gecertificeerd)',
  other: 'Overige deskundige',
};

function PersonCard({
  person,
  onUpdate,
  onRemove,
  showQualification,
}: {
  person: PhysicalPerson;
  onUpdate: (updated: PhysicalPerson) => void;
  onRemove: () => void;
  showQualification?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const INPUT = 'w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-orange-400';

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/30">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <button
          type="button"
          onClick={() => setExpanded((o) => !o)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <svg className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform ${expanded ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {person.anonymous ? '— Anoniem —' : (person.name || '— Naam nog niet ingevuld —')}
            </p>
            {(person.organization || person.role || person.qualification) && !person.anonymous && (
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                {[
                  person.organization,
                  person.role,
                  person.qualification ? QUALIFICATION_LABELS[person.qualification] : null,
                  person.isAKD ? `AKD${person.akdNumber ? ` nr. ${person.akdNumber}` : ''}` : null,
                ].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
        </button>
        <button onClick={onRemove} className="shrink-0 text-xs text-zinc-400 hover:text-red-500">
          Verwijderen
        </button>
      </div>

      {expanded && (
        <div className="border-t border-zinc-200 px-4 pb-4 pt-3 dark:border-zinc-700">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-2 sm:col-span-2">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                <input
                  type="checkbox"
                  checked={person.anonymous ?? false}
                  onChange={(e) => onUpdate({ ...person, anonymous: e.target.checked })}
                  className="h-4 w-4 rounded border-zinc-300 text-orange-500"
                />
                Anoniem registreren
              </label>
            </div>
            {!person.anonymous && (
              <>
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Naam</label>
                  <input type="text" value={person.name ?? ''} onChange={(e) => onUpdate({ ...person, name: e.target.value })} placeholder="Volledige naam" className={INPUT} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Functie / rol</label>
                  <input type="text" value={person.role ?? ''} onChange={(e) => onUpdate({ ...person, role: e.target.value })} placeholder="Bijv. Ergonoom, Veiligheidskundige" className={INPUT} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Organisatie</label>
                  <input type="text" value={person.organization ?? ''} onChange={(e) => onUpdate({ ...person, organization: e.target.value })} placeholder="Bedrijf / adviesbureau" className={INPUT} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">E-mail</label>
                  <input type="email" value={person.email ?? ''} onChange={(e) => onUpdate({ ...person, email: e.target.value })} placeholder="naam@organisatie.nl" className={INPUT} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Telefoon</label>
                  <input type="tel" value={person.phone ?? ''} onChange={(e) => onUpdate({ ...person, phone: e.target.value })} placeholder="+31 6 …" className={INPUT} />
                </div>
                {showQualification && (
                  <>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Kwalificatie</label>
                      <select value={person.qualification ?? ''} onChange={(e) => onUpdate({ ...person, qualification: (e.target.value || undefined) as PhysicalPersonQualification | undefined })} className={INPUT}>
                        <option value="">— Kies kwalificatie —</option>
                        {(Object.entries(QUALIFICATION_LABELS) as [PhysicalPersonQualification, string][]).map(([k, v]) => (
                          <option key={k} value={k}>{v}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                        <input
                          type="checkbox"
                          checked={person.isAKD ?? false}
                          onChange={(e) => onUpdate({ ...person, isAKD: e.target.checked })}
                          className="h-4 w-4 rounded border-zinc-300 text-orange-500"
                        />
                        <abbr title="Arbeidshygiënisch Kwaliteitsregister Deskundigen" className="cursor-help underline decoration-dotted decoration-zinc-400 underline-offset-2">AKD</abbr>-geregistreerd
                      </label>
                    </div>
                    {person.isAKD && (
                      <div>
                        <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">AKD-nummer</label>
                        <input type="text" value={person.akdNumber ?? ''} onChange={(e) => onUpdate({ ...person, akdNumber: e.target.value })} placeholder="Registratienummer" className={INPUT} />
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function addPerson(list: PhysicalPerson[]): PhysicalPerson[] {
  return [...list, { id: newPhysicalId() }];
}

export default function PhysicalStep1_Scope({ investigation, onUpdate }: Props) {
  const { investigators, clients, respondents, scope } = investigation;

  const INPUT = 'w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-orange-400';
  const TEXTAREA = `${INPUT} resize-none`;

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
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Uitvoerend onderzoeker(s)
          </h3>
          <button
            type="button"
            onClick={() => onUpdate({ investigators: addPerson(investigators) })}
            className="flex items-center gap-1.5 text-xs text-orange-600 hover:text-orange-700 dark:text-orange-400"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Toevoegen
          </button>
        </div>
        {investigators.length === 0 ? (
          <p className="text-center text-sm text-zinc-400 dark:text-zinc-500">Nog geen uitvoerders toegevoegd.</p>
        ) : (
          <div className="space-y-2">
            {investigators.map((p) => (
              <PersonCard
                key={p.id}
                person={p}
                showQualification
                onUpdate={(u) => onUpdate({ investigators: investigators.map((i) => (i.id === u.id ? u : i)) })}
                onRemove={() => onUpdate({ investigators: investigators.filter((i) => i.id !== p.id) })}
              />
            ))}
          </div>
        )}
      </div>

      {/* Opdrachtgevers */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Opdrachtgever(s)</h3>
          <button
            type="button"
            onClick={() => onUpdate({ clients: addPerson(clients) })}
            className="flex items-center gap-1.5 text-xs text-orange-600 hover:text-orange-700 dark:text-orange-400"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Toevoegen
          </button>
        </div>
        {clients.length === 0 ? (
          <p className="text-center text-sm text-zinc-400 dark:text-zinc-500">Nog geen opdrachtgevers toegevoegd.</p>
        ) : (
          <div className="space-y-2">
            {clients.map((p) => (
              <PersonCard
                key={p.id}
                person={p}
                onUpdate={(u) => onUpdate({ clients: clients.map((i) => (i.id === u.id ? u : i)) })}
                onRemove={() => onUpdate({ clients: clients.filter((i) => i.id !== p.id) })}
              />
            ))}
          </div>
        )}
      </div>

      {/* Respondenten */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Geïnterviewde / geobserveerde medewerkers</h3>
          <button
            type="button"
            onClick={() => onUpdate({ respondents: addPerson(respondents) })}
            className="flex items-center gap-1.5 text-xs text-orange-600 hover:text-orange-700 dark:text-orange-400"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Toevoegen
          </button>
        </div>
        {respondents.length === 0 ? (
          <p className="text-center text-sm text-zinc-400 dark:text-zinc-500">Nog geen medewerkers toegevoegd.</p>
        ) : (
          <div className="space-y-2">
            {respondents.map((p) => (
              <PersonCard
                key={p.id}
                person={p}
                onUpdate={(u) => onUpdate({ respondents: respondents.map((i) => (i.id === u.id ? u : i)) })}
                onRemove={() => onUpdate({ respondents: respondents.filter((i) => i.id !== p.id) })}
              />
            ))}
          </div>
        )}
      </div>

      {/* Scope */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">Onderzoekskader</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Bedrijfsnaam</label>
            <input type="text" value={scope.companyName ?? ''} onChange={(e) => onUpdate({ scope: { ...scope, companyName: e.target.value } })} placeholder="Naam opdrachtgevend bedrijf" className={INPUT} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Werkplek / afdeling</label>
            <input type="text" value={scope.workplaceName ?? ''} onChange={(e) => onUpdate({ scope: { ...scope, workplaceName: e.target.value } })} placeholder="Bijv. Magazijn, Assemblagehal A" className={INPUT} />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Adres werkplek</label>
            <input type="text" value={scope.workplaceAddress ?? ''} onChange={(e) => onUpdate({ scope: { ...scope, workplaceAddress: e.target.value } })} placeholder="Straat, postcode, plaats" className={INPUT} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Onderzoeksperiode</label>
            <input type="text" value={scope.investigationPeriod ?? ''} onChange={(e) => onUpdate({ scope: { ...scope, investigationPeriod: e.target.value } })} placeholder="Bijv. april–mei 2025" className={INPUT} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Referentiedocument</label>
            <input type="text" value={scope.referenceDocument ?? ''} onChange={(e) => onUpdate({ scope: { ...scope, referenceDocument: e.target.value } })} placeholder="RI&E-rapportage, arbobeleid" className={INPUT} />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Beschrijving medewerkers</label>
            <input type="text" value={scope.workerDescription ?? ''} onChange={(e) => onUpdate({ scope: { ...scope, workerDescription: e.target.value } })} placeholder="Bijv. ~15 magazijnmedewerkers, gemengd man/vrouw" className={INPUT} />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Aanleiding / doel onderzoek</label>
            <textarea rows={3} value={scope.purpose ?? ''} onChange={(e) => onUpdate({ scope: { ...scope, purpose: e.target.value } })} placeholder="Bijv. Aanleiding: klachten rug/schouders bij magazijnpersoneel na RI&E. Doel: NIOSH-analyse tillen en houdingsobservatie." className={TEXTAREA} />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Opmerkingen</label>
            <textarea rows={2} value={scope.notes ?? ''} onChange={(e) => onUpdate({ scope: { ...scope, notes: e.target.value } })} placeholder="Aanvullende informatie" className={TEXTAREA} />
          </div>
        </div>
      </div>
    </div>
  );
}
