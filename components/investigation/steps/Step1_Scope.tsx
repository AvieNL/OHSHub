'use client';

import type { Investigation, InvestigationScope } from '@/lib/investigation-types';
import type { BasePerson, CommonScopeFields } from '@/lib/shared-investigation-types';
import { Abbr } from '@/components/Abbr';
import { Button, Input, Textarea, Alert, Icon } from '@/components/ui';
import { PersonSection } from '@/components/shared/scope/PersonSection';
import { ScopeFields } from '@/components/shared/scope/ScopeFields';
import InlineStepHeader from '@/components/InlineStepHeader';
import InlineEdit from '@/components/InlineEdit';
import MarkdownContent from '@/components/MarkdownContent';

interface Props {
  investigation: Investigation;
  onUpdate: (partial: Partial<Investigation>) => void;
  contentOverrides?: Record<string, string>;
}

const STEP_KEY = 'step.1';
const NS = 'investigation.hazardous-substances';
const FALLBACK_TITLE = 'Stap 2 — Opdracht en juridische kaders vaststellen';
const FALLBACK_DESC = 'Scherpstellen van de onderzoeksvraag, scope, en de toepasselijke wet- en regelgeving. Dit vormt de basis voor de rest van het onderzoek.';

const NORMS: { id: string; label: React.ReactNode }[] = [
  { id: 'nen-en-689', label: 'NEN-EN 689:2018+C1:2019 — Meetstrategie inhalatieblootstelling' },
  { id: 'nen-en-482', label: 'NEN-EN 482 — Algemene eisen aan meetmethoden' },
  { id: 'reach',      label: <><Abbr id="REACH">REACH</Abbr>-verordening (EG 1907/2006) — registratie, <Abbr id="DNEL">DNEL</Abbr>&apos;s</> },
  { id: 'clp',        label: <><Abbr id="CLP">CLP</Abbr>-verordening (EG 1272/2008) — indeling en etikettering</> },
  { id: 'nla',        label: <><Abbr id="NLA">NLA</Abbr>-handelingskader &ldquo;Werken met gevaarlijke stoffen&rdquo;</> },
  { id: 'atex',       label: <><Abbr id="ATEX">ATEX</Abbr> (Arbobesluit hfst. 3 par. 2a) — explosiegevaar</> },
  { id: 'arie',       label: <><Abbr id="ARIE">ARIE</Abbr> (Arbobesluit hfst. 2 afd. 2) — grote hoeveelheden</> },
];

const QUALIFICATION_OPTIONS = [
  { value: 'AH',           label: 'Arbeidshygiënist' },
  { value: 'HVK',          label: "HVK'er (Hoger Veiligheidskundige)" },
  { value: 'toxicoloog',   label: 'Toxicoloog' },
  { value: 'bedrijfsarts', label: 'Bedrijfsarts' },
  { value: 'other',        label: 'Overige' },
];

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <Alert variant="warning" className="mt-2">
      {children}
    </Alert>
  );
}

export default function Step1_Scope({ investigation, onUpdate, contentOverrides }: Props) {
  const scope = investigation.scope;

  const title = contentOverrides?.[`${STEP_KEY}.title`] ?? FALLBACK_TITLE;
  const desc = contentOverrides?.[`${STEP_KEY}.desc`];

  function updateScope(patch: Partial<InvestigationScope>) {
    onUpdate({ scope: { ...scope, ...patch } });
  }

  function updateCommonScope(patch: Partial<CommonScopeFields>) {
    onUpdate({ scope: { ...scope, ...patch } });
  }

  function toggleNorm(id: string) {
    const norms = scope.applicableNorms.includes(id)
      ? scope.applicableNorms.filter((n) => n !== id)
      : [...scope.applicableNorms, id];
    updateScope({ applicableNorms: norms });
  }

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
                Scherpstellen van de onderzoeksvraag, scope, en de toepasselijke wet- en regelgeving.
                Dit vormt de basis voor de rest van het onderzoek.
              </p>
          }
        </InlineEdit>
      </div>

      {/* 1.1 Betrokken personen */}
      <section className="space-y-6">
        <h3 className="border-b border-zinc-100 pb-2 text-sm font-semibold uppercase tracking-wider text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
          2.1 Betrokken personen
        </h3>

        <PersonSection
          title="Onderzoeker(s)"
          description="Degene(n) die het blootstellingsonderzoek uitvoert."
          persons={investigation.investigators as BasePerson[]}
          onAdd={() =>
            onUpdate({
              investigators: [
                ...investigation.investigators,
                { id: crypto.randomUUID(), name: '' },
              ],
            })
          }
          onUpdate={(id, patch) =>
            onUpdate({
              investigators: investigation.investigators.map((p) =>
                p.id === id ? { ...p, ...patch } as typeof p : p,
              ),
            })
          }
          onRemove={(id) =>
            onUpdate({
              investigators: investigation.investigators.filter((p) => p.id !== id),
            })
          }
          cardLabel="Onderzoeker"
          showQualification
          qualificationOptions={QUALIFICATION_OPTIONS}
        />

        <PersonSection
          title="Opdrachtgever(s)"
          description="Bedrijf of persoon die het onderzoek heeft opgedragen."
          persons={investigation.clients as BasePerson[]}
          onAdd={() =>
            onUpdate({
              clients: [...investigation.clients, { id: crypto.randomUUID(), name: '' }],
            })
          }
          onUpdate={(id, patch) =>
            onUpdate({
              clients: investigation.clients.map((p) =>
                p.id === id ? { ...p, ...patch } as typeof p : p,
              ),
            })
          }
          onRemove={(id) =>
            onUpdate({ clients: investigation.clients.filter((p) => p.id !== id) })
          }
          cardLabel="Opdrachtgever"
        />

        <PersonSection
          title="Respondenten / betrokken medewerkers"
          description="Medewerkers die zijn geraadpleegd of waarvan de blootstelling is gemeten. Anonimisering mogelijk."
          persons={investigation.respondents as BasePerson[]}
          onAdd={() =>
            onUpdate({
              respondents: [
                ...investigation.respondents,
                { id: crypto.randomUUID(), name: '' },
              ],
            })
          }
          onUpdate={(id, patch) =>
            onUpdate({
              respondents: investigation.respondents.map((p) =>
                p.id === id ? { ...p, ...patch } as typeof p : p,
              ),
            })
          }
          onRemove={(id) =>
            onUpdate({
              respondents: investigation.respondents.filter((p) => p.id !== id),
            })
          }
          cardLabel="Respondent"
          showAnonymous
          showInvestigationRole
        />
      </section>

      {/* 2.2 Onderzoeksgegevens */}
      <section className="space-y-4">
        <h3 className="border-b border-zinc-100 pb-2 text-sm font-semibold uppercase tracking-wider text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
          2.2 Onderzoeksgegevens
        </h3>
        <ScopeFields scope={scope} onChange={updateCommonScope} />
      </section>

      {/* 2.3 Scope en vraagstelling */}
      <section className="space-y-4">
        <h3 className="border-b border-zinc-100 pb-2 text-sm font-semibold uppercase tracking-wider text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
          2.3 Scope en vraagstelling
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
                  onChange={() => updateScope({ question: opt.value as InvestigationScope['question'] })}
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
            Welke afdelingen / functies vallen binnen scope?
          </label>
          <Textarea
            rows={3}
            value={scope.departments}
            onChange={(e) => updateScope({ departments: e.target.value })}
            placeholder="Bijv. Afdeling Lakkerij (spuiter), afdeling Onderhoud (monteur), schoonmaakdienst…"
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
            onChange={(e) => updateScope({ isPartOfRIE: e.target.checked })}
            className="accent-orange-500"
          />
          <span className="text-zinc-700 dark:text-zinc-300">
            Dit onderzoek is onderdeel van de <Abbr id="RIE">RI&amp;E</Abbr> (Arbowet art. 5 + Arbobesluit hfst. 4)
          </span>
        </label>
      </section>

      {/* 2.4 Bijzondere juridische kaders */}
      <section className="space-y-4">
        <h3 className="border-b border-zinc-100 pb-2 text-sm font-semibold uppercase tracking-wider text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
          2.4 Bijzondere juridische kaders
        </h3>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 text-sm transition ${
            scope.atexApplicable ? 'border-orange-400 bg-orange-50 dark:border-orange-600 dark:bg-orange-900/20' : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-700'
          }`}>
            <input
              type="checkbox"
              checked={scope.atexApplicable}
              onChange={(e) => updateScope({ atexApplicable: e.target.checked })}
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
              onChange={(e) => updateScope({ arieApplicable: e.target.checked })}
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
            Neem contact op met een kerndeskundige (<Abbr id="HVK">HVK'er</Abbr> of veiligheidskundige).
          </Tip>
        )}
      </section>

      {/* 2.5 Toepasselijke normen */}
      <section className="space-y-4">
        <h3 className="border-b border-zinc-100 pb-2 text-sm font-semibold uppercase tracking-wider text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
          2.5 Toepasselijke normen en handreikingen
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
    </div>
  );
}
