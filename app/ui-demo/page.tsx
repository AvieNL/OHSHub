'use client';

/**
 * Ontwikkelaarspagina — visueel overzicht van alle UI-componenten.
 * Toegankelijk op /ui-demo (geen auth vereist).
 */

import { useState } from 'react';
import { Alert, Badge, Button, Card, FieldLabel, FormGrid, Icon, Input, Select, Textarea } from '@/components/ui';
import type { AlertVariant, BadgeVariant, ButtonVariant, ButtonSize, IconName } from '@/components/ui';
import { Formula } from '@/components/Formula';
import MarkdownContent from '@/components/MarkdownContent';

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
  const allIcons: IconName[] = [
    'plus', 'x', 'check', 'chevron-down', 'chevron-up', 'chevron-left', 'chevron-right',
    'pencil', 'trash', 'arrow-up-tray', 'arrow-down-tray', 'printer', 'menu',
    'warning', 'note', 'refresh', 'sun', 'moon', 'info',
    'document', 'folder', 'user', 'lock', 'logout',
  ];

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
                {v === 'error'   && '✕ Kalibratiefout > 0,5 dB — meetserie afgekeurd (§12.2).'}
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
                {v === 'success' && <span>Berekening geslaagd — <Formula math="L_{EX,8h}" /> ligt onder de lagere actiewaarde.</span>}
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
                <Icon name="plus" size="sm" />
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

        <Row label="met leftIcon">
          <Button variant="primary"   leftIcon={<Icon name="check"  size="sm" />}>Opslaan</Button>
          <Button variant="secondary" leftIcon={<Icon name="x"      size="sm" />}>Annuleren</Button>
          <Button variant="ghost"  size="xs" leftIcon={<Icon name="pencil" size="xs" />}>Bewerken</Button>
          <Button variant="danger" size="xs" leftIcon={<Icon name="trash"  size="xs" />}>Verwijderen</Button>
          <Button variant="primary"   leftIcon={<Icon name="arrow-up-tray"   size="sm" />}>Exporteren</Button>
          <Button variant="secondary" leftIcon={<Icon name="arrow-down-tray" size="sm" />}>Importeren</Button>
        </Row>

        <Row label="met rightIcon">
          <Button variant="secondary" rightIcon={<Icon name="chevron-right" size="sm" />}>Volgende stap</Button>
          <Button variant="secondary" rightIcon={<Icon name="printer" size="sm" />}>Afdrukken</Button>
        </Row>

        <Row label="icon-only">
          <Button variant="ghost"  size="xs" aria-label="Bewerken"><Icon name="pencil" size="xs" /></Button>
          <Button variant="danger" size="xs" aria-label="Verwijderen"><Icon name="trash" size="xs" /></Button>
          <Button variant="secondary" size="sm" aria-label="Vernieuwen"><Icon name="refresh" size="sm" /></Button>
        </Row>

        <Row label="disabled">
          <Button variant="primary"   leftIcon={<Icon name="check" size="sm" />} disabled>Opslaan (disabled)</Button>
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
            <Button variant="primary"   leftIcon={<Icon name="check" size="sm" />}>Opslaan</Button>
            <Button variant="secondary" leftIcon={<Icon name="x"     size="sm" />}>Annuleren</Button>
          </div>
        </Card>
      </Section>

      {/* ── Icon ───────────────────────────────────────────────────────────── */}
      <Section title="Icon — Heroicons v2 outline">
        <p className="text-xs text-zinc-400">
          <Code>{'<Icon name="..." size="xs|sm|md|lg|xl" className="..." />'}</Code>
          {' '}— gebruik altijd via <Code>@/components/ui</Code>
        </p>

        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
          {allIcons.map((name) => (
            <div
              key={name}
              className="flex flex-col items-center gap-1.5 rounded-lg border border-zinc-100 p-3 dark:border-zinc-700"
            >
              <Icon name={name} size="md" className="text-zinc-600 dark:text-zinc-400" />
              <span className="text-center font-mono text-[10px] leading-tight text-zinc-400 dark:text-zinc-500">
                {name}
              </span>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Groottes (xs → xl)</p>
          <Row label="sizes">
            {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((s) => (
              <div key={s} className="flex flex-col items-center gap-1">
                <Icon name="plus" size={s} className="text-zinc-600 dark:text-zinc-400" />
                <span className="font-mono text-[10px] text-zinc-400">{s}</span>
              </div>
            ))}
          </Row>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">In context</p>
          <Row label="met kleur">
            <Icon name="check"   size="md" className="text-emerald-500" />
            <Icon name="warning" size="md" className="text-amber-500" />
            <Icon name="x"       size="md" className="text-red-500" />
            <Icon name="info"    size="md" className="text-blue-500" />
            <Icon name="refresh" size="md" className="text-orange-500" />
          </Row>
        </div>
      </Section>

      {/* ── Formula ────────────────────────────────────────────────────────── */}
      <Section title="Formula — wiskundige notatie (KaTeX)">
        <p className="text-xs text-zinc-400">
          <Code>{'<Formula math="L_{EX,8h}" />'}</Code>{' '}of{' '}
          <Code>{'<Formula math="..." display />'}</Code>{' '}voor blokweergave
        </p>

        <Row label="inline">
          <span className="text-sm text-zinc-700 dark:text-zinc-300">
            Dagelijkse blootstelling <Formula math="L_{EX,8h}" /> mag de grenswaarde van 87 dB(A) niet overschrijden.
          </span>
        </Row>
        <Row label="inline mix">
          <span className="text-sm text-zinc-700 dark:text-zinc-300">
            Gecombineerde onzekerheid{' '}
            <Formula math="u = \sqrt{u_1^2 + u_2^2 + u_3^2}" />{' '}
            met uitgebreide onzekerheid <Formula math="U = 1{,}65 \cdot u" />.
          </span>
        </Row>
        <Row label="display">
          <Formula
            math="L_{EX,8h} = 10 \log\!\left(\frac{1}{T_0}\sum_{i=1}^{n} T_{e,i} \cdot 10^{0.1 L_{p,A,eqT,i}}\right)"
            display
          />
        </Row>
      </Section>

      {/* ── Markdown ──────────────────────────────────────────────────────────── */}
      <Section title="Markdown — CMS-tekstvelden via MarkdownContent">
        <p className="text-xs text-zinc-400">
          <Code>{'<MarkdownContent className="...">{markdownString}</MarkdownContent>'}</Code>{' '}
          · Ondersteunt koppen, lijsten, links, vet/cursief, citaten, scheidingslijnen en formule-/afkortingsmarkers.
        </p>

        {/* Koppen */}
        <div>
          <p className="mb-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">Koppen — # H1 · ## H2 · ### H3</p>
          <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <MarkdownContent>{`# Kop niveau 1\n## Kop niveau 2\n### Kop niveau 3`}</MarkdownContent>
          </div>
        </div>

        {/* Alinea's en nadruk */}
        <div>
          <p className="mb-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">Alinea's · **vet** · *cursief* · ~~doorhaling~~</p>
          <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <MarkdownContent>{`Dit is een gewone alinea met **vette tekst**, *cursieve tekst* en ~~doorgestreepte tekst~~.\n\nEen tweede alinea toont de witruimte tussen alinea's.`}</MarkdownContent>
          </div>
        </div>

        {/* Ongeordende lijst */}
        <div>
          <p className="mb-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">Ongeordende lijst — - item</p>
          <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <MarkdownContent>{`- Eerste item\n- Tweede item\n- Derde item\n  - Genest item A\n  - Genest item B`}</MarkdownContent>
          </div>
        </div>

        {/* Geordende lijst */}
        <div>
          <p className="mb-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">Geordende lijst — 1. item</p>
          <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <MarkdownContent>{`1. Eerste stap\n2. Tweede stap\n3. Derde stap`}</MarkdownContent>
          </div>
        </div>

        {/* Links */}
        <div>
          <p className="mb-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">Links — [tekst](url) · automatische URL · e-mail</p>
          <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <MarkdownContent>{`[Klik hier](https://ohshub.nl) voor een expliciete link.\n\nAutomatische URL: https://ohshub.nl\n\nE-mail: info@diversithijs.nl`}</MarkdownContent>
          </div>
        </div>

        {/* Citaat */}
        <div>
          <p className="mb-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">Citaat — {'> tekst'}</p>
          <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <MarkdownContent>{`> Dit is een citaat of een opvallende toelichting.\n> Meerdere regels zijn mogelijk.`}</MarkdownContent>
          </div>
        </div>

        {/* Scheidingslijn */}
        <div>
          <p className="mb-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">Scheidingslijn — ---</p>
          <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <MarkdownContent>{`Tekst boven de lijn.\n\n---\n\nTekst onder de lijn.`}</MarkdownContent>
          </div>
        </div>

        {/* Formule-markers */}
        <div>
          <p className="mb-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">Formule-marker — {`[[LaTeX]]`}</p>
          <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <MarkdownContent>{`De dagblootstellingswaarde [[L_{EX,8h}]] wordt berekend via de energetisch gemiddelde formule.`}</MarkdownContent>
          </div>
        </div>

        {/* Afkortingsmarkers */}
        <div>
          <p className="mb-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">Afkortings-marker — {`[[abbr:ID]]`} · {`[[abbr:ID:eigen omschrijving]]`}</p>
          <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <MarkdownContent>{`Grenswaarden zijn vastgesteld conform [[abbr:AVG]] art. 6 en de [[abbr:OELV:Occupational Exposure Limit Value]]-systematiek.`}</MarkdownContent>
          </div>
        </div>

        {/* HTML (abbr-tag) */}
        <div>
          <p className="mb-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">Rauwe HTML — {'<abbr title="...">'}tekst{'</abbr>'}</p>
          <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <MarkdownContent>{`Meting conform <abbr title="Nederlandse Norm — Europese Norm" class="cursor-help underline decoration-dotted decoration-zinc-400 underline-offset-2">NEN-EN</abbr>-ISO 9612:2025.`}</MarkdownContent>
          </div>
        </div>

        {/* Volledig voorbeeld */}
        <div>
          <p className="mb-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">Volledig voorbeeld — combinatie van elementen</p>
          <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <MarkdownContent>{`## Toepassingsbereik\n\nDeze methode is van toepassing op werkplekken waar de blootstelling aan [[abbr:OELV]] relevant is.\n\n**Stappen:**\n\n1. Identificeer de blootstellingsgroepen.\n2. Voer een meting uit conform [NEN-EN-ISO 9612](https://www.nen.nl).\n3. Bereken [[L_{EX,8h}]] per groep.\n\n> Bij twijfel over de meetstrategie: raadpleeg eerst de norm.\n\nContact: info@diversithijs.nl`}</MarkdownContent>
          </div>
        </div>
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
