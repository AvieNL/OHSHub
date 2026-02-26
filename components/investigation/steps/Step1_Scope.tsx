'use client';

import type { Investigation, InvestigationScope, PersonEntry } from '@/lib/investigation-types';
import { Abbr } from '@/components/Abbr';

interface Props {
  investigation: Investigation;
  onUpdate: (partial: Partial<Investigation>) => void;
}

const NORMS: { id: string; label: React.ReactNode }[] = [
  { id: 'nen-en-689', label: 'NEN-EN 689:2018+C1:2019 — Meetstrategie inhalatieblootstelling' },
  { id: 'nen-en-482', label: 'NEN-EN 482 — Algemene eisen aan meetmethoden' },
  { id: 'reach',      label: <><Abbr id="REACH">REACH</Abbr>-verordening (EG 1907/2006) — registratie, <Abbr id="DNEL">DNEL</Abbr>&apos;s</> },
  { id: 'clp',        label: <><Abbr id="CLP">CLP</Abbr>-verordening (EG 1272/2008) — indeling en etikettering</> },
  { id: 'nla',        label: <><Abbr id="NLA">NLA</Abbr>-handelingskader &ldquo;Werken met gevaarlijke stoffen&rdquo;</> },
  { id: 'atex',       label: <><Abbr id="ATEX">ATEX</Abbr> (Arbobesluit hfst. 3 par. 2a) — explosiegevaar</> },
  { id: 'arie',       label: <><Abbr id="ARIE">ARIE</Abbr> (Arbobesluit hfst. 2 afd. 2) — grote hoeveelheden</> },
];

// ─── PersonList — reusable add/edit/remove list ───────────────────────────────

interface PersonListProps {
  label: string;
  namePlaceholder: string;
  rolePlaceholder: string;
  orgPlaceholder: string;
  showOrg?: boolean;
  showAnonymous?: boolean;
  entries: PersonEntry[];
  onChange: (entries: PersonEntry[]) => void;
}

function PersonList({
  label,
  namePlaceholder,
  rolePlaceholder,
  orgPlaceholder,
  showOrg = true,
  showAnonymous = false,
  entries,
  onChange,
}: PersonListProps) {
  function addEntry() {
    onChange([...entries, { id: crypto.randomUUID(), name: '', role: '', organization: '' }]);
  }

  function updateEntry(id: string, patch: Partial<PersonEntry>) {
    onChange(entries.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }

  function removeEntry(id: string) {
    onChange(entries.filter((e) => e.id !== id));
  }

  const INPUT =
    'rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-800 placeholder-zinc-400 outline-none transition focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-orange-400';

  return (
    <div className="space-y-2">
      {entries.map((entry, idx) => (
        <div
          key={entry.id}
          className="rounded-lg border border-zinc-200 p-5 dark:border-zinc-700"
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                {label} {entries.length > 1 ? idx + 1 : ''}
              </span>
              {showAnonymous && (
                <label className="flex cursor-pointer items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                  <input
                    type="checkbox"
                    checked={entry.anonymous ?? false}
                    onChange={(e) => updateEntry(entry.id, { anonymous: e.target.checked })}
                    className="accent-orange-500"
                  />
                  Anoniem
                </label>
              )}
            </div>
            <button
              type="button"
              onClick={() => removeEntry(entry.id)}
              className="rounded p-1 text-zinc-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
              title="Verwijderen"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Naam</label>
              <input
                type="text"
                value={entry.anonymous ? '' : entry.name}
                onChange={(e) => updateEntry(entry.id, { name: e.target.value })}
                placeholder={entry.anonymous ? 'Anoniem' : namePlaceholder}
                disabled={entry.anonymous}
                className={`w-full ${INPUT} ${entry.anonymous ? 'cursor-not-allowed opacity-40' : ''}`}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Functie / rol</label>
              <input
                type="text"
                value={entry.role ?? ''}
                onChange={(e) => updateEntry(entry.id, { role: e.target.value })}
                placeholder={rolePlaceholder}
                className={`w-full ${INPUT}`}
              />
            </div>
            {showOrg && (
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Organisatie</label>
                <input
                  type="text"
                  value={entry.organization ?? ''}
                  onChange={(e) => updateEntry(entry.id, { organization: e.target.value })}
                  placeholder={orgPlaceholder}
                  className={`w-full ${INPUT}`}
                />
              </div>
            )}
            {!entry.anonymous && (
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">E-mailadres</label>
                <input
                  type="email"
                  value={entry.email ?? ''}
                  onChange={(e) => updateEntry(entry.id, { email: e.target.value })}
                  placeholder="naam@bedrijf.nl"
                  className={`w-full ${INPUT}`}
                />
              </div>
            )}
            {!entry.anonymous && (
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Telefoonnummer</label>
                <input
                  type="tel"
                  value={entry.phone ?? ''}
                  onChange={(e) => updateEntry(entry.id, { phone: e.target.value })}
                  placeholder="+31 6 12345678"
                  className={`w-full ${INPUT}`}
                />
              </div>
            )}
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={addEntry}
        className="flex items-center gap-1.5 rounded-lg border border-dashed border-zinc-300 px-4 py-2.5 text-sm text-zinc-500 transition hover:border-orange-400 hover:text-orange-600 dark:border-zinc-600 dark:text-zinc-400 dark:hover:border-orange-500 dark:hover:text-orange-400"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        {label} toevoegen
      </button>
    </div>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-2 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 dark:bg-amber-900/15">
      <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.355a9.727 9.727 0 01-3 0M12 3v1.5M6.22 4.72l1.06 1.06M4.5 12H3m1.72 5.78 1.06-1.06M12 21v-1.5m5.78-1.72-1.06 1.06M21 12h-1.5m-1.72-5.78-1.06 1.06" />
      </svg>
      <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-300">{children}</p>
    </div>
  );
}

export default function Step1_Scope({ investigation, onUpdate }: Props) {
  const scope = investigation.scope;

  function update(patch: Partial<InvestigationScope>) {
    onUpdate({ scope: { ...scope, ...patch } });
  }

  function toggleNorm(id: string) {
    const norms = scope.applicableNorms.includes(id)
      ? scope.applicableNorms.filter((n) => n !== id)
      : [...scope.applicableNorms, id];
    update({ applicableNorms: norms });
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Stap 1 — Opdracht en juridische kaders vaststellen
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          Scherpstellen van de onderzoeksvraag, scope, en de toepasselijke wet- en regelgeving.
          Dit vormt de basis voor de rest van het onderzoek.
        </p>
      </div>

      {/* 1.1 Betrokken personen */}
      <section className="space-y-6">
        <h3 className="border-b border-zinc-100 pb-2 text-sm font-semibold uppercase tracking-wider text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
          1.1 Betrokken personen
        </h3>

        {/* Onderzoekers */}
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Onderzoeker(s)</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Degene(n) die het blootstellingsonderzoek uitvoert.
            </p>
          </div>
          <PersonList
            label="Onderzoeker"
            namePlaceholder="J. de Vries"
            rolePlaceholder="Arbodeskundige (HOVd)"
            orgPlaceholder="ArboAdvies B.V."
            entries={investigation.investigators}
            onChange={(entries) => onUpdate({ investigators: entries })}
          />
        </div>

        {/* Opdrachtgevers */}
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Opdrachtgever(s)</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Bedrijf of persoon die het onderzoek heeft opgedragen.
            </p>
          </div>
          <PersonList
            label="Opdrachtgever"
            namePlaceholder="P. Jansen"
            rolePlaceholder="Hoofd HSE / directeur"
            orgPlaceholder="Schildersbedrijf De Vries B.V."
            entries={investigation.clients}
            onChange={(entries) => onUpdate({ clients: entries })}
          />
        </div>

        {/* Respondenten */}
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Respondenten / betrokken medewerkers</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Medewerkers die zijn geraadpleegd of waarvan de blootstelling is gemeten.
            </p>
          </div>
          <PersonList
            label="Respondent"
            namePlaceholder="A. Bakker"
            rolePlaceholder="Spuiter"
            orgPlaceholder="Afdeling Lakkerij"
            showAnonymous
            entries={investigation.respondents}
            onChange={(entries) => onUpdate({ respondents: entries })}
          />
        </div>
      </section>

      {/* 1.1 Scope */}
      <section className="space-y-4">
        <h3 className="border-b border-zinc-100 pb-2 text-sm font-semibold uppercase tracking-wider text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
          1.2 Scope en vraagstelling
        </h3>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Wat is de onderzoeksvraag? <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2">
            {[
              { value: 'current', label: 'Huidige blootstelling — vaststellen van actuele blootstellingsituatie' },
              { value: 'historical', label: 'Historische blootstelling — reconstructie voor beroepsziekteclaim (TSB/Lexces)' },
              { value: 'both', label: 'Beide — historisch én actueel' },
            ].map((opt) => (
              <label
                key={opt.value}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition ${
                  scope.question === opt.value
                    ? 'border-orange-400 bg-orange-50 dark:border-orange-600 dark:bg-orange-900/20'
                    : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600'
                }`}
              >
                <input
                  type="radio"
                  name="question"
                  value={opt.value}
                  checked={scope.question === opt.value}
                  onChange={() => update({ question: opt.value as InvestigationScope['question'] })}
                  className="accent-orange-500"
                />
                <span className="text-zinc-700 dark:text-zinc-300">{opt.label}</span>
              </label>
            ))}
          </div>
          {scope.question === 'historical' && (
            <Tip>
              Bij historische blootstelling: verzamel oude stoffenregisters, <Abbr id="VIB">VIB</Abbr>&apos;s, foto&apos;s,
              werkbeschrijvingen en onderhoudsrapporten. Overweeg interviews met (oud-)medewerkers.
              Gebruik job-exposure-matrices waar metingen ontbreken (stap 10).
            </Tip>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Naam en adres van de werklocatie <span className="text-xs font-normal text-zinc-400">(§6(b) NEN-EN 689)</span>
          </label>
          <input
            type="text"
            value={scope.workplaceAddress ?? ''}
            onChange={(e) => update({ workplaceAddress: e.target.value })}
            placeholder="Bijv. Schildersbedrijf De Vries B.V. — Industrieweg 12, 1234 AB Amsterdam"
            className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-sm text-zinc-800 placeholder-zinc-400 outline-none transition focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-orange-400"
          />
          <p className="mt-1 text-xs text-zinc-400">
            Naam en adres van de werkplek (locatie waar de werkzaamheden plaatsvinden). Dit kan afwijken van het vestigingsadres van de werkgever.
          </p>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Welke afdelingen / functies vallen binnen scope?
          </label>
          <textarea
            rows={3}
            value={scope.departments}
            onChange={(e) => update({ departments: e.target.value })}
            placeholder="Bijv. Afdeling Lakkerij (spuiter), afdeling Onderhoud (monteur), schoonmaakdienst…"
            className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-sm text-zinc-800 placeholder-zinc-400 outline-none transition focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-orange-400"
          />
        </div>

        <label className={`flex w-full cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition ${
          scope.isPartOfRIE
            ? 'border-orange-400 bg-orange-50 dark:border-orange-600 dark:bg-orange-900/20'
            : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600'
        }`}>
          <input
            type="checkbox"
            checked={scope.isPartOfRIE}
            onChange={(e) => update({ isPartOfRIE: e.target.checked })}
            className="accent-orange-500"
          />
          <span className="text-zinc-700 dark:text-zinc-300">
            Dit onderzoek is onderdeel van de <Abbr id="RIE">RI&amp;E</Abbr> (Arbowet art. 5 + Arbobesluit hfst. 4)
          </span>
        </label>
      </section>

      {/* 1.2 Bijzondere risico's */}
      <section className="space-y-4">
        <h3 className="border-b border-zinc-100 pb-2 text-sm font-semibold uppercase tracking-wider text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
          1.3 Bijzondere juridische kaders
        </h3>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 text-sm transition ${
            scope.atexApplicable ? 'border-orange-400 bg-orange-50 dark:border-orange-600 dark:bg-orange-900/20' : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-700'
          }`}>
            <input
              type="checkbox"
              checked={scope.atexApplicable}
              onChange={(e) => update({ atexApplicable: e.target.checked })}
              className="mt-0.5 accent-orange-500"
            />
            <div>
              <p className="font-medium text-zinc-800 dark:text-zinc-200"><Abbr id="ATEX">ATEX</Abbr> van toepassing</p>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                Explosiegevaar door ontvlambare stoffen (Arbobesluit hfst. 3 par. 2a)
              </p>
            </div>
          </label>

          <label className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 text-sm transition ${
            scope.arieApplicable ? 'border-orange-400 bg-orange-50 dark:border-orange-600 dark:bg-orange-900/20' : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-700'
          }`}>
            <input
              type="checkbox"
              checked={scope.arieApplicable}
              onChange={(e) => update({ arieApplicable: e.target.checked })}
              className="mt-0.5 accent-orange-500"
            />
            <div>
              <p className="font-medium text-zinc-800 dark:text-zinc-200"><Abbr id="ARIE">ARIE</Abbr> van toepassing</p>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                Grote hoeveelheden zeer gevaarlijke stoffen (Arbobesluit hfst. 2 afd. 2)
              </p>
            </div>
          </label>
        </div>

        {(scope.atexApplicable || scope.arieApplicable) && (
          <Tip>
            <Abbr id="ATEX">ATEX</Abbr> en <Abbr id="ARIE">ARIE</Abbr> vereisen aanvullende specifieke beoordelingen buiten dit instrument.
            Neem contact op met een kerndeskundige (HVKS of veiligheidskundige).
          </Tip>
        )}
      </section>

      {/* 1.3 Normen */}
      <section className="space-y-4">
        <h3 className="border-b border-zinc-100 pb-2 text-sm font-semibold uppercase tracking-wider text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
          1.4 Toepasselijke normen en handreikingen
        </h3>
        <div className="space-y-2">
          {NORMS.map((norm) => (
            <label
              key={norm.id}
              className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition ${
                scope.applicableNorms.includes(norm.id)
                  ? 'border-orange-400 bg-orange-50 dark:border-orange-600 dark:bg-orange-900/20'
                  : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600'
              }`}
            >
              <input
                type="checkbox"
                checked={scope.applicableNorms.includes(norm.id)}
                onChange={() => toggleNorm(norm.id)}
                className="accent-orange-500"
              />
              <span className="text-zinc-700 dark:text-zinc-300">{norm.label}</span>
            </label>
          ))}
        </div>
      </section>

      {/* Notes */}
      <section>
        <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Aanvullende opmerkingen / bijzonderheden
        </label>
        <textarea
          rows={3}
          value={scope.notes ?? ''}
          onChange={(e) => update({ notes: e.target.value })}
          placeholder="Bijzondere omstandigheden, contactpersonen, referenties naar eerdere onderzoeken…"
          className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-sm text-zinc-800 placeholder-zinc-400 outline-none transition focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-orange-400"
        />
      </section>
    </div>
  );
}
