'use client';

/**
 * Ontwikkelaarspagina — visueel overzicht van alle UI-componenten.
 * Toegankelijk op /ui-demo (geen auth vereist).
 */

import { useState } from 'react';
import { Alert, Badge, Button, Card, FieldLabel, FormGrid, Input, Select, Textarea } from '@/components/ui';
import type { AlertVariant, BadgeVariant, ButtonVariant, ButtonSize } from '@/components/ui';

// ─── Hulpcomponenten voor de demo ─────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <div className="border-b border-zinc-200 pb-2 dark:border-zinc-700">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-start gap-3">
      <span className="w-28 shrink-0 pt-0.5 font-mono text-xs text-zinc-400">{label}</span>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
      {children}
    </code>
  );
}

// ─── Demo-pagina ──────────────────────────────────────────────────────────────

export default function UiDemoPage() {
  const [inputVal, setInputVal] = useState('');
  const [selectVal, setSelectVal] = useState('');
  const [textareaVal, setTextareaVal] = useState('');

  const alertVariants: AlertVariant[] = ['warning', 'error', 'success', 'info', 'orange', 'neutral'];
  const badgeVariants: BadgeVariant[]  = ['emerald', 'amber', 'orange', 'red', 'blue', 'zinc', 'purple', 'violet'];
  const buttonVariants: ButtonVariant[] = ['primary', 'secondary', 'ghost', 'danger', 'dashed', 'link'];
  const buttonSizes: ButtonSize[] = ['md', 'sm', 'xs'];

  return (
    <div className="mx-auto max-w-3xl space-y-12 px-4 py-10">

      {/* Header */}
      <div>
        <div className="mb-1 flex items-center gap-2">
          <span className="rounded bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
            DEV
          </span>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
            OHSHub — UI componentbibliotheek
          </h1>
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Visuele review van <Code>components/ui/</Code>. Gebruik <Code>import {'{ ... }'} from '@/components/ui'</Code> in alle modules.
        </p>
      </div>

      {/* ── Alert ──────────────────────────────────────────────────────────── */}
      <Section title="Alert — inline waarschuwingen en meldingen">
        <p className="text-xs text-zinc-400">
          <Code>{'<Alert variant="warning|error|success|info|orange|neutral" size="sm|md">'}</Code>
        </p>

        <div className="space-y-2">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">size=&quot;sm&quot; (standaard)</p>
          {alertVariants.map((v) => (
            <Row key={v} label={v}>
              <Alert variant={v} size="sm">
                {v === 'warning' && '⚠ Labkalibratie verouderd — herkeuring aanbevolen (§12.1).'}
                {v === 'error'   && '✕ Kalibratiefout &gt; 0,5 dB — meetserie afgekeurd (§12.2).'}
                {v === 'success' && '✓ 5 geldige metingen — berekening beschikbaar.'}
                {v === 'info'    && 'ℹ Strategie 1 vereist minimaal 3 metingen per taak (§9.3.2).'}
                {v === 'orange'  && 'Gecombineerde APF gebruikt in stap 9 en stap 10.'}
                {v === 'neutral' && 'Geen arbeidsmiddelen geregistreerd.'}
              </Alert>
            </Row>
          ))}
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">size=&quot;md&quot;</p>
          {alertVariants.map((v) => (
            <Row key={v} label={v}>
              <Alert variant={v} size="md" className="flex-1">
                <strong>{v.charAt(0).toUpperCase() + v.slice(1)}:</strong>{' '}
                {v === 'warning' && 'Blootstelling boven actiewaarde — beheersmaatregelen vereist.'}
                {v === 'error'   && 'Grenswaarde van 87 dB(A) overschreden — directe actie vereist.'}
                {v === 'success' && 'Berekening geslaagd — L_EX,8h ligt onder de lagere actiewaarde.'}
                {v === 'info'    && 'NEN-EN-ISO 9612:2025 vereist een uitgebreide onzekerheidsanalyse.'}
                {v === 'orange'  && 'Dubbele gehoorbescherming: maximum 35 dB(A) door botgeleiding.'}
                {v === 'neutral' && 'Geen HEGs gedefinieerd — voeg eerst groepen toe in stap 3.'}
              </Alert>
            </Row>
          ))}
        </div>
      </Section>

      {/* ── Badge ──────────────────────────────────────────────────────────── */}
      <Section title="Badge — statusindicatoren en labels">
        <p className="text-xs text-zinc-400">
          <Code>{'<Badge variant="emerald|amber|orange|red|blue|zinc|purple|violet" shape="pill|square">'}</Code>
        </p>

        <Row label="shape=pill">
          {badgeVariants.map((v) => (
            <Badge key={v} variant={v} shape="pill">
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </Badge>
          ))}
        </Row>

        <Row label="shape=square">
          {badgeVariants.map((v) => (
            <Badge key={v} variant={v} shape="square">
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </Badge>
          ))}
        </Row>

        <Row label="in context">
          <Badge variant="red">Grenswaarde overschreden</Badge>
          <Badge variant="amber">Boven actiewaarde</Badge>
          <Badge variant="emerald">Onder actiewaarde</Badge>
          <Badge variant="zinc">Niet beoordeeld</Badge>
          <Badge variant="blue">Indicatief</Badge>
          <Badge variant="purple" shape="square">⚕ Tinnitus</Badge>
        </Row>
      </Section>

      {/* ── Button ─────────────────────────────────────────────────────────── */}
      <Section title="Button — knoppen">
        <p className="text-xs text-zinc-400">
          <Code>{'<Button variant="primary|secondary|ghost|danger|dashed|link" size="md|sm|xs">'}</Code>
        </p>

        {buttonVariants.map((v) => (
          <Row key={v} label={v}>
            {v === 'link' ? (
              <Button variant="link">Ga naar stap 5</Button>
            ) : v === 'dashed' ? (
              <Button variant="dashed" size="sm" className="max-w-xs py-3">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Meetpunt toevoegen
              </Button>
            ) : (
              buttonSizes.map((s) => (
                <Button key={s} variant={v} size={s}>
                  {v === 'primary'   ? 'Opslaan' :
                   v === 'secondary' ? 'Annuleren' :
                   v === 'ghost'     ? 'Bewerken' :
                                       'Verwijderen'} ({s})
                </Button>
              ))
            )}
          </Row>
        ))}

        <Row label="disabled">
          <Button variant="primary" disabled>Opslaan (disabled)</Button>
          <Button variant="secondary" disabled>Annuleren (disabled)</Button>
        </Row>
      </Section>

      {/* ── Card ───────────────────────────────────────────────────────────── */}
      <Section title="Card — container voor gerelateerde inhoud">
        <p className="text-xs text-zinc-400">
          <Code>{'<Card variant="default|form">'}</Code>
        </p>

        <Row label="default">
          <Card className="flex-1">
            <p className="font-semibold text-zinc-900 dark:text-zinc-50">Geluidniveaumeter klasse 1</p>
            <div className="mt-1 flex flex-wrap gap-3 text-xs text-zinc-500">
              <span>Brüel &amp; Kjær</span>
              <span>Model 2250</span>
              <span>S/N: 12345678</span>
              <span>Kalibratie: 2025-01-15</span>
            </div>
          </Card>
        </Row>

        <Row label="form">
          <Card variant="form" className="flex-1">
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Nieuwe HEG toevoegen</h4>
            <FormGrid>
              <div>
                <FieldLabel>Groepsnaam</FieldLabel>
                <Input placeholder="Bijv. Machinisten productiehal" />
              </div>
              <div>
                <FieldLabel>Aantal medewerkers</FieldLabel>
                <Input type="number" min={1} placeholder="5" />
              </div>
            </FormGrid>
            <div className="flex gap-2">
              <Button variant="primary">Opslaan</Button>
              <Button variant="secondary">Annuleren</Button>
            </div>
          </Card>
        </Row>
      </Section>

      {/* ── FieldLabel ─────────────────────────────────────────────────────── */}
      <Section title="FieldLabel — labels boven formuliervelden">
        <p className="text-xs text-zinc-400">
          <Code>{'<FieldLabel htmlFor="id">Veldnaam</FieldLabel>'}</Code>
        </p>
        <Row label="voorbeeld">
          <div className="w-48">
            <FieldLabel htmlFor="demo-input">Serienummer</FieldLabel>
            <Input id="demo-input" placeholder="12345678" />
          </div>
        </Row>
      </Section>

      {/* ── Input ──────────────────────────────────────────────────────────── */}
      <Section title="Input — tekst-, getal- en datuminvoer">
        <p className="text-xs text-zinc-400">
          <Code>{'<Input type="text|number|date" size="md|sm|xs" />'}</Code>
        </p>

        <Row label="size=md">
          <Input
            type="text"
            size="md"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Bijv. Brüel & Kjær"
            className="w-64"
          />
        </Row>
        <Row label="size=sm">
          <Input type="text" size="sm" placeholder="Bijv. model 2250" className="w-48" />
        </Row>
        <Row label="size=xs">
          <Input type="number" size="xs" placeholder="85.2" className="w-24" />
        </Row>
        <Row label="type=date">
          <Input type="date" size="md" className="w-52" />
        </Row>
        <Row label="disabled">
          <Input type="text" size="md" value="Alleen lezen" disabled className="w-48" />
        </Row>
      </Section>

      {/* ── Select ─────────────────────────────────────────────────────────── */}
      <Section title="Select — keuzelijst">
        <p className="text-xs text-zinc-400">
          <Code>{'<Select size="md|sm|xs"><option>...</option></Select>'}</Code>
        </p>

        <Row label="size=md">
          <Select size="md" value={selectVal} onChange={(e) => setSelectVal(e.target.value)} className="w-64">
            <option value="">— selecteer strategie —</option>
            <option value="task-based">Strategie 1 — Taakgericht (§9)</option>
            <option value="job-based">Strategie 2 — Functiegericht (§10)</option>
            <option value="full-day">Strategie 3 — Volledigedagmeting (§11)</option>
          </Select>
        </Row>
        <Row label="size=sm">
          <Select size="sm" className="w-48">
            <option>— kies instrument —</option>
            <option>Klasse 1 SLM</option>
            <option>Dosimeter</option>
          </Select>
        </Row>
        <Row label="size=xs">
          <Select size="xs" className="w-32">
            <option>Taak A</option>
            <option>Taak B</option>
          </Select>
        </Row>
      </Section>

      {/* ── Textarea ───────────────────────────────────────────────────────── */}
      <Section title="Textarea — meerregelig tekstveld">
        <p className="text-xs text-zinc-400">
          <Code>{'<Textarea rows={3} size="md|sm" placeholder="..." />'}</Code>
        </p>

        <Row label="size=md">
          <Textarea
            size="md"
            rows={3}
            value={textareaVal}
            onChange={(e) => setTextareaVal(e.target.value)}
            placeholder="Context, afspraken met opdrachtgever…"
            className="w-full max-w-md"
          />
        </Row>
        <Row label="size=sm">
          <Textarea size="sm" rows={2} placeholder="Opmerkingen…" className="w-full max-w-md" />
        </Row>
      </Section>

      {/* ── FormGrid ───────────────────────────────────────────────────────── */}
      <Section title="FormGrid — 2- of 3-kolomsraster voor formuliervelden">
        <p className="text-xs text-zinc-400">
          <Code>{'<FormGrid cols={2|3}>'}</Code>
          {' '}— 1 kolom op mobiel, 2 of 3 kolommen op sm+
        </p>

        <Row label="cols=2">
          <FormGrid className="w-full">
            {['Fabrikant', 'Model / type', 'Serienummer', 'Kalibratie'].map((label) => (
              <div key={label}>
                <FieldLabel>{label}</FieldLabel>
                <Input placeholder={`${label}…`} />
              </div>
            ))}
          </FormGrid>
        </Row>

        <Row label="cols=3">
          <FormGrid cols={3} className="w-full">
            {['Naam', 'Functie', 'Afdeling'].map((label) => (
              <div key={label}>
                <FieldLabel>{label}</FieldLabel>
                <Input placeholder={`${label}…`} />
              </div>
            ))}
          </FormGrid>
        </Row>
      </Section>

      {/* ── Gecombineerd voorbeeld ─────────────────────────────────────────── */}
      <Section title="Gecombineerd — formulier zoals het in de app gebruikt wordt">
        <Card variant="form">
          <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Meetapparaat opgeven</h4>

          <Alert variant="info" size="sm">
            ℹ Voer een labkalibratie van maximaal 12 maanden oud in (§12.1 NEN-EN-ISO 9612:2025).
          </Alert>

          <FormGrid>
            <div>
              <FieldLabel>Fabrikant</FieldLabel>
              <Input placeholder="Bijv. Brüel & Kjær" />
            </div>
            <div>
              <FieldLabel>Model / type</FieldLabel>
              <Input placeholder="Bijv. 2250" />
            </div>
            <div>
              <FieldLabel>Serienummer</FieldLabel>
              <Input placeholder="Serienummer" />
            </div>
            <div>
              <FieldLabel>Datum laatste labkalibratie</FieldLabel>
              <Input type="date" />
            </div>
          </FormGrid>

          <div>
            <FieldLabel>Opmerkingen</FieldLabel>
            <Textarea rows={2} placeholder="Bijv. microfoon type 4189, windkap UA 0237" />
          </div>

          <Alert variant="warning" size="sm">
            ⚠ Geen labkalibratie geregistreerd — vereist voor rapportage (§15.c.3).
          </Alert>

          <div className="flex gap-2">
            <Button variant="primary">Opslaan</Button>
            <Button variant="secondary">Annuleren</Button>
          </div>
        </Card>
      </Section>

      {/* Footer */}
      <div className="border-t border-zinc-200 pt-6 text-xs text-zinc-400 dark:border-zinc-700">
        <p>
          Componenten staan in <Code>components/ui/</Code> · importeer via <Code>@/components/ui</Code>
        </p>
        <p className="mt-1">
          Fase 2: migratie van bestaande sound-steps naar deze componenten.
        </p>
      </div>

    </div>
  );
}
