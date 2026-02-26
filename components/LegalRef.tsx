/**
 * LegalRef — shows the article text of a Dutch legal provision on hover.
 * Works in server and client components (pure CSS tooltip, no JS).
 *
 * Usage:
 *   <LegalRef id="Art. 6.7">Art. 6.7</LegalRef>
 *   <LegalRef id="Art. 6.6 lid 2" />   ← renders the id as text automatically
 */

export const LEGAL_ARTICLES: Record<string, { title: string; text: string }> = {
  // ── Arbobesluit Hoofdstuk 6, Afdeling 3 — Lawaai ────────────────────────────
  'Art. 6.5': {
    title: 'Arbobesluit art. 6.5 — Beoordeling en meting',
    text: 'De werkgever beoordeelt de risico\'s van geluidblootstelling en laat zo nodig de blootstelling meten door een deskundige (conform NEN-EN-ISO 9612). De beoordeling wordt periodiek herhaald en in ieder geval bij wijzigingen. Resultaten worden schriftelijk gedocumenteerd.',
  },
  'Goede praktijk': {
    title: 'Goede praktijk',
    text: 'Geen wettelijke verplichting, maar aanbevolen werkwijze conform NEN-EN-ISO 9612:2025 en arbeidshygiënische beginselen.',
  },
  'Art. 6.5 lid 1': {
    title: 'Arbobesluit art. 6.5 lid 1 — Actiewaarden',
    text: 'Onderste actiewaarden (LAV): L_EX,8h = 80 dB(A) en L_p,Cpeak = 135 dB(C). Bovenste actiewaarden (UAV): L_EX,8h = 85 dB(A) en L_p,Cpeak = 137 dB(C).',
  },
  'Art. 6.5 lid 2': {
    title: 'Arbobesluit art. 6.5 lid 2 — Grenswaarden',
    text: 'Grenswaarden (GW): L_EX,8h = 87 dB(A) en L_p,Cpeak = 140 dB(C). De grenswaarden mogen nooit worden overschreden.',
  },
  'Art. 6.5 lid 3': {
    title: 'Arbobesluit art. 6.5 lid 3 — Grenswaarde met gehoorbeschermer',
    text: 'Bij het bepalen of de grenswaarden worden overschreden, wordt rekening gehouden met de demping van de gehoorbeschermer die de werknemer daadwerkelijk gebruikt. De actiewaarden worden bepaald zonder PBM.',
  },
  'Art. 6.6 lid 1': {
    title: 'Arbobesluit art. 6.6 lid 1 — Maatregelen bij actiewaarden',
    text: 'Indien de dagelijkse blootstelling de onderste actiewaarden bereikt of overschrijdt, neemt de werkgever maatregelen: (a) een programma van technische en/of organisatorische maatregelen; (b) gehoorbeschermers beschikbaar stellen; (c) geluidzones aanwijzen bij de bovenste actiewaarden.',
  },
  'Art. 6.6 lid 1a': {
    title: 'Arbobesluit art. 6.6 lid 1a — Maatregelenprogramma',
    text: 'De werkgever stelt een programma van technische en/of organisatorische maatregelen op gericht op verlaging van de geluidblootstelling. Bij de bovenste actiewaarde is daadwerkelijke uitvoering verplicht.',
  },
  'Art. 6.6 lid 1b': {
    title: 'Arbobesluit art. 6.6 lid 1b — Gehoorbeschermers',
    text: 'Boven de onderste actiewaarden: gehoorbeschermers beschikbaar stellen op verzoek van de werknemer. Boven de bovenste actiewaarden: gebruik is verplicht en de werkgever zorgt dat ze daadwerkelijk gebruikt worden.',
  },
  'Art. 6.6 lid 1b–c': {
    title: 'Arbobesluit art. 6.6 lid 1b en 1c',
    text: 'Lid 1b: verplicht gebruik gehoorbeschermers bij de bovenste actiewaarden. Lid 1c: aanwijzen van geluidzones met passende signalering; toegang voor niet-betrokkenen beperken.',
  },
  'Art. 6.6 lid 1c': {
    title: 'Arbobesluit art. 6.6 lid 1c — Geluidzone',
    text: 'Indien de bovenste actiewaarden worden overschreden wijst de werkgever de arbeidsplaatsen aan als geluidzones, voorziet deze van passende signalering en beperkt de toegang voor niet-betrokkenen.',
  },
  'Art. 6.6 lid 1–c': {
    title: 'Arbobesluit art. 6.6 lid 1 (a t/m c) — Alle verplichtingen bij actiewaarden',
    text: 'Alle verplichtingen bij de onderste en bovenste actiewaarden gelden: maatregelenprogramma (a), gehoorbescherming (b) en geluidzone-aanwijzing (c) zijn van toepassing.',
  },
  'Art. 6.6 lid 2': {
    title: 'Arbobesluit art. 6.6 lid 2 — Grenswaarde overschreden',
    text: 'Indien de blootstelling de grenswaarden overschrijdt, neemt de werkgever onmiddellijk maatregelen om de blootstelling terug te brengen tot beneden de grenswaarden. De oorzaak wordt vastgesteld en het maatregelenprogramma wordt aangepast om herhaling te voorkomen.',
  },
  'Art. 6.7': {
    title: 'Arbobesluit art. 6.7 — Arbeidsgezondheidskundig onderzoek (bij LAV)',
    text: 'Indien de dagelijkse blootstelling de onderste actiewaarden bereikt of overschrijdt, biedt de werkgever werknemers arbeidsgezondheidskundig onderzoek (audiometrie) aan door of onder toezicht van een bedrijfsarts. De werknemer beslist zelf of hij hieraan deelneemt. Bij de bovenste actiewaarden geldt de aanvullende periodieke verplichting van art. 6.10.',
  },
  'Art. 6.8': {
    title: 'Arbobesluit art. 6.8 — Voorlichting en opleiding (bij LAV)',
    text: 'Werknemers blootgesteld boven de onderste actiewaarden ontvangen voorlichting over: de aard van de risico\'s, de maatregelen, actie- en grenswaarden, meetresultaten, nut en gebruik van gehoorbeschermers, en indicaties voor gehooronderzoek.',
  },
  'Art. 6.9': {
    title: 'Arbobesluit art. 6.9 — Kwaliteitseisen gehoorbescherming',
    text: 'De werkgever zorgt dat de gekozen gehoorbeschermers de blootstelling bij het oor terugbrengen tot beneden de grenswaarden (87 dB(A) / 140 dB(C)). Werknemers worden geïnstrueerd over correct gebruik en onderhoud. Bij de bovenste actiewaarden zorgt de werkgever voor daadwerkelijk gebruik.',
  },
  'Art. 6.10': {
    title: 'Arbobesluit art. 6.10 — Gehooronderzoek (audiometrie)',
    text: 'Werknemers blootgesteld boven de bovenste actiewaarden hebben recht op periodiek preventief gehooronderzoek door of onder toezicht van een bedrijfsarts. Bij de onderste actiewaarden geldt dit recht indien de risicobeoordeling daartoe aanleiding geeft.',
  },
  'Art. 6.10a': {
    title: 'Arbobesluit art. 6.10a — Maatregelen na vastgesteld gehoorverlies',
    text: 'Indien een gehoorschadiging wordt vastgesteld die verband kan houden met lawaaiblootstelling, herziet de werkgever de risicobeoordeling en het maatregelenprogramma. De betrokken werknemer wordt persoonlijk geïnformeerd en zijn blootstelling wordt voortdurend bewaakt.',
  },
  'Art. 6.11': {
    title: 'Arbobesluit art. 6.11 — Informatie en instructie',
    text: 'Werknemers en hun vertegenwoordigers ontvangen informatie over de resultaten van de risicobeoordeling, de geluidmetingen, de getroffen maatregelen, de actie- en grenswaarden en de beschikbaarheid van gehooronderzoek. De informatie is actueel en begrijpelijk.',
  },

  // ── Aanvullende normen & richtlijnen ───────────────────────────────────────
  'NPR 3438': {
    title: 'NPR 3438:2007 — Concentratie en communicatie op de arbeidsplaats',
    text: 'Nederlandse praktijkrichtlijn voor geluid bij concentratie- en communicatietaken (35–80 dB(A)). Geeft activiteitspecifieke streef- en maximumniveaus: hoge concentratie (chirurgie, beleid, onderwijs) max. 45 dB(A); redelijk (beeldschermwerk, lab) max. 55 dB(A); matig (kantoor, receptie) max. 65 dB(A); laag (assemblagen, kassawerk) max. 75 dB(A); zwaar mechanisch werk max. 80 dB(A). Bij complexe communicatietaken aanvullende STI-meting aanbevolen.',
  },
  'RL SHT 2020': {
    title: 'Richtlijn Slechthorendheid en Tinnitus 2020 (NVAB)',
    text: 'Richtlijn voor bedrijfsartsen bij beoordeling van slechthorendheid en tinnitus op het werk. Tinnitusernst via Tinnitus Handicap Inventory (THI): graad 1 licht (0–16), graad 2 mild (18–36), graad 3 matig (38–56), graad 4 ernstig (58–76), graad 5 catastrofaal (78–100). Verwijscriteria naar audiologisch centrum: gehoorverlies > 35 dB of werkgerelateerde tinnitusproblematiek THI ≥ graad 3. Bij vermoede beroepsziekte: melden NCvB B001.',
  },
};

export function LegalRef({
  id,
  children,
}: {
  id: string;
  children?: React.ReactNode;
}) {
  const article = LEGAL_ARTICLES[id];

  // If no article found, render plain text
  if (!article) {
    return <span>{children ?? id}</span>;
  }

  return (
    <span className="group relative inline-block">
      {/* The visible chip / text */}
      <span className="cursor-help rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-xs text-zinc-600 underline decoration-dotted decoration-zinc-400 underline-offset-2 dark:bg-zinc-800 dark:text-zinc-300">
        {children ?? id}
      </span>

      {/* Tooltip */}
      <span
        className="
          pointer-events-none absolute bottom-full left-0 z-50 mb-2
          w-72 max-w-[min(18rem,90vw)]
          rounded-lg border border-zinc-200 bg-white px-3 py-2.5 shadow-lg
          dark:border-zinc-700 dark:bg-zinc-900
          opacity-0 transition-opacity duration-150 group-hover:opacity-100
        "
        role="tooltip"
      >
        <span className="mb-1 block text-xs font-semibold text-zinc-800 dark:text-zinc-100">
          {article.title}
        </span>
        <span className="block text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
          {article.text}
        </span>
        {/* Arrow */}
        <span className="absolute -bottom-1.5 left-4 h-3 w-3 rotate-45 border-b border-r border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900" />
      </span>
    </span>
  );
}
