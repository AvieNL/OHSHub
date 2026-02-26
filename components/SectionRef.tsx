/**
 * SectionRef — shows the section title and a short Dutch summary on hover.
 * Based on NEN-EN-ISO 9612:2025 (Third edition).
 * Works in server and client components (pure CSS tooltip, no JS).
 *
 * Usage:
 *   <SectionRef id="§7.2" />           ← renders "§7.2" as the visible text
 *   <SectionRef id="§9">Strategie 1</SectionRef>
 */

export const NEN9612_SECTIONS: Record<string, { title: string; text: string }> = {
  // ── Hoofdstuk 5 — Meetinstrumentarium ─────────────────────────────────────
  '§5': {
    title: '§5 — Meetinstrumentarium',
    text: 'Eisen aan meetinstrumenten: geluidniveaumeters klasse 1 (IEC 61672-1), persoonlijke dosimeters (IEC 61252) en kalibrators. Periodieke verificatie door een geaccrediteerd laboratorium vereist.',
  },
  '§5.1': {
    title: '§5.1 — Geluidniveaumeters en dosimeters',
    text: 'Geluidniveaumeter klasse 1 vereist; klasse 2 alleen onder specifieke omstandigheden. Persoonlijke dosimeters (IEC 61252) zijn toegestaan voor strategieën 2 en 3.',
  },

  // ── Hoofdstuk 6 — Methodologie ────────────────────────────────────────────
  '§6': {
    title: '§6 — Methodologie — vijf stappen',
    text: 'Het meetproces bestaat uit vijf chronologische stappen: (1) werkanalyse, (2) selectie meetstrategie, (3) uitvoering metingen, (4) onzekerheidsberekening, (5) presentatie resultaten.',
  },

  // ── Hoofdstuk 7 — Werkanalyse ─────────────────────────────────────────────
  '§7': {
    title: '§7 — Werkanalyse',
    text: 'Definitie van de meetscope: indeling in HEGs, vastleggen van de nominale werkdag en karakterisering van geluidbronnen. Basis voor het bepalen van de juiste meetstrategie en het aantal benodigde metingen.',
  },
  '§7.2': {
    title: '§7.2 — HEG-definitie',
    text: 'Medewerkers met vergelijkbare blootstelling worden ingedeeld in Homogene Blootstellingsgroepen (HEG). Elke HEG krijgt een eigen meetstrategie, meetplan en resultaat.',
  },
  '§7.3': {
    title: '§7.3 — Nominale werkdag',
    text: 'Beschrijving van de typische werkdag: welke taken, in welke volgorde, hoe lang elk. Basis voor taakduurschattingen (T_m) en de totale effectieve werkdag T_e.',
  },

  // ── Hoofdstuk 8 — Keuze meetstrategie ────────────────────────────────────
  '§8': {
    title: '§8 — Keuze meetstrategie',
    text: 'Selectie van strategie 1 (taakgericht), 2 (functiegericht) of 3 (volledige dag) op basis van werkpatroon en taakcomplexiteit. Bijlage B Tabel B.1 biedt een selectiematrix.',
  },

  // ── Hoofdstuk 9 — Strategie 1: Taakgericht ───────────────────────────────
  '§9': {
    title: '§9 — Strategie 1: Taakgericht meten',
    text: 'Blootstelling per afzonderlijke taak meten en optellen via energiemiddeling. Efficiënt wanneer taken goed te onderscheiden zijn met een voorspelbare duur.',
  },
  '§9.2': {
    title: '§9.2 — Taakduur T_m',
    text: 'De effectieve werkdag T_e is de som van alle taakduren T_m. Duurschattingen via observatie, tijdregistratie of interviews. Referentieduur T_0 = 8 uur.',
  },
  '§9.3': {
    title: '§9.3 — Meetplan taakgericht',
    text: 'Minimumaantal metingen per taak (Tabel 1), minimumaantal te bemeten medewerkers per taak (Tabel 2), eisen aan representativiteit van worst-case meetcondities.',
  },
  '§9.3.2': {
    title: '§9.3.2 — Minimumaantal te bemeten medewerkers',
    text: 'Afhankelijk van de HEG-grootte bepaalt Tabel 2 hoeveel medewerkers minimaal per taak moeten worden gemeten.',
  },
  '§9.3.4': {
    title: '§9.3.4 — Formule 3: L_p,A,eqTm',
    text: 'Berekening van L_p,A,eqTm: energiemiddeling van de individuele meetwaarden L_p,A,eqT voor taak m over alle metingen.',
  },
  '§9.7': {
    title: '§9.7 — Herbeoordeling taakgericht',
    text: 'Herbeoordeling vereist bij proceswijzigingen, gewijzigde HEG-samenstelling, klachten van medewerkers of indien de gecombineerde meetonzekerheid te groot wordt.',
  },

  // ── Hoofdstuk 10 — Strategie 2: Functiegericht ───────────────────────────
  '§10': {
    title: '§10 — Strategie 2: Functiegericht meten',
    text: 'Steekproef van volledige functieshiften of -periodes. Geschikt wanneer taken moeilijk te onderscheiden zijn of de dagindeling sterk varieert.',
  },
  '§10.2': {
    title: '§10.2 — Meetplan functiegericht',
    text: 'Minimumaantal te meten periodes en minimumaantal te bemeten medewerkers (Tabel 3 en 4), afhankelijk van HEG-grootte.',
  },
  '§10.4': {
    title: '§10.4 — Berekening functiegericht',
    text: 'Energiemiddeling via Formule 7 (L_p,A,eqTe). c₁u₁ > 3,5 dB is indicatie om het meetplan te herzien: meer metingen of langere meetduur toevoegen.',
  },
  '§10.5': {
    title: '§10.5 — Herbeoordeling functiegericht',
    text: 'Herbeoordeling vereist bij dezelfde triggers als §9.7: proceswijzigingen, klachten, gewijzigde werkomstandigheden of overmatige meetonzekerheid.',
  },

  // ── Hoofdstuk 11 — Strategie 3: Volledige dag ────────────────────────────
  '§11': {
    title: '§11 — Strategie 3: Volledige-dagmeting',
    text: 'Eén meting gedurende de volledige nominale werkdag. Eenvoudigst in uitvoering, maar minder nauwkeurig bij sterk wisselende blootstelling. Loggend instrument aanbevolen.',
  },
  '§11.2': {
    title: '§11.2 — Loggend instrument',
    text: 'Bij strategie 3 is een loggend instrument (dosimeter of logging SLM) sterk aanbevolen. Dit maakt tijdregistratie en controle op piekblootstelling mogelijk.',
  },
  '§11.3': {
    title: '§11.3 — Meetplan volledige dag',
    text: 'Minimumaantal dagmetingen, selectie van representatieve werkdagen, en eisen aan representativiteit van meetcondities voor de volledige werkdag.',
  },
  '§11.4': {
    title: '§11.4 — Formule 9: L_EX,8h',
    text: 'L_EX,8h = L_p,A,eqTe + 10 log(T_e / T_0). Correctie voor het verschil tussen de effectieve werkdag T_e en de referentieduur T_0 = 8 uur.',
  },
  '§11.5': {
    title: '§11.5 — Herbeoordeling volledige dag',
    text: 'Herbeoordeling vereist bij dezelfde triggers als §9.7 en §10.5: proceswijzigingen, klachten van medewerkers of overmatige meetonzekerheid.',
  },

  // ── Hoofdstuk 12 — Uitvoering metingen ───────────────────────────────────
  '§12': {
    title: '§12 — Uitvoering metingen',
    text: 'Eisen aan microfoonplaatsing (§12.3), veldkalibratie vóór en na iedere meetserie (§12.2), en registratie van meetcondities conform §15.d.',
  },
  '§12.2': {
    title: '§12.2 — Veldkalibratie',
    text: 'Akoestische kalibratie met geijkte kalibratiebron vóór en na elke meetserie. Max. toelaatbare afwijking: 0,5 dB. Bij grotere afwijking: meting ongeldig en herhalen.',
  },
  '§12.3': {
    title: '§12.3 — Microfoonplaatsing',
    text: 'Draagbaar instrument: microfoon op de schouder, 0,1 m van de gehooropening, ~0,04 m boven de schouder. Op statief: hoogte van de gehooropening van de medewerker.',
  },

  // ── Hoofdstuk 13 — Onzekerheidsbronnen ───────────────────────────────────
  '§13': {
    title: '§13 — Onzekerheidsbronnen en fouten',
    text: 'Vier hoofdbronnen van meetonzekerheid: (1) geluidsteer u₁ (sampling), (2) meetinstrument u₂, (3) microfoonpositie u₃, (4) overige factoren.',
  },
  '§13.3': {
    title: '§13.3 — Microfoonpositie-onzekerheid (u₃)',
    text: 'Standaardonzekerheid door microfoonpositie: u₃ = 1,0 dB voor draagbare metingen (microfoon op schouder). Hoger bij afwijkende plaatsing of verhoogde reflecties.',
  },

  // ── Hoofdstuk 15 — Te rapporteren informatie ─────────────────────────────
  '§15': {
    title: '§15 — Te rapporteren informatie',
    text: 'Het meetrapport bevat minimaal de gegevens uit §15.a (scope) t/m §15.e (resultaten). Grondslag voor de conformiteitsverklaring (§15.e.7).',
  },
  '§15.a': {
    title: '§15.a — Algemene informatie',
    text: 'Naam opdrachtgever/bedrijf, arbeidsplaats(en), werknemers/groepen, meettijdstippen, doel van het onderzoek en naam uitvoerende deskundige.',
  },
  '§15.a.1': {
    title: '§15.a.1 — Naam opdrachtgever/bedrijf',
    text: 'Naam en adres van de opdrachtgever of het bedrijf waar het onderzoek is uitgevoerd.',
  },
  '§15.a.2': {
    title: '§15.a.2 — Identificatie arbeidsplaats(en)',
    text: 'Naam, adres en specifieke aanduiding van de arbeidsplaats(en) en werkzones waar metingen zijn verricht.',
  },
  '§15.a.3': {
    title: '§15.a.3 — Identificatie werknemers/groepen',
    text: 'Omschrijving van de werknemers of groepen (HEGs) waarop het onderzoek betrekking heeft, inclusief functietitel en taken.',
  },
  '§15.a.4': {
    title: '§15.a.4 — Naam uitvoerende deskundige(n)',
    text: 'Naam, rol en organisatie van de persoon/personen die het onderzoek hebben uitgevoerd. Onderbouwt de deskundigheid en traceerbaarheid van de meting.',
  },
  '§15.a.5': {
    title: '§15.a.5 — Doel van het onderzoek',
    text: 'Beschrijving van het doel: bijv. toetsing Arbobesluit, ontwerp nieuwe installatie, evaluatie van genomen maatregelen of baseline-meting.',
  },
  '§15.b': {
    title: '§15.b — Werkanalyse in rapport',
    text: 'Beschrijving van de HEG-indeling, gekozen meetstrategie met motivering (§15.b.4), werkpatroon, nominale werkdag en takenlijst.',
  },
  '§15.b.4': {
    title: '§15.b.4 — Meetstrategie met normatieve verwijzing',
    text: 'Documentatie van de gekozen strategie (§9/§10/§11) inclusief de normatieve grond. Motiveer waarom de strategie past bij het werkpatroon (Tabel B.1).',
  },
  '§15.c': {
    title: '§15.c — Meetapparatuur',
    text: 'Beschrijving van elk meetinstrument: type, fabrikant, model, serienummer (§15.c.1), datum laatste labkalibratie (§15.c.3) en eventuele verlengkabel (§15.c.2).',
  },
  '§15.c.1': {
    title: '§15.c.1 — Serienummer meetinstrument',
    text: 'Uniek serienummer van de geluidniveaumeter of dosimeter, nodig voor traceerbaarheid van de meting naar de kalibratieketen.',
  },
  '§15.c.2': {
    title: '§15.c.2 — Verlengkabel',
    text: 'Type, lengte en serienummer van een eventueel gebruikte verlengkabel. Verlengkabels kunnen de gevoeligheid beïnvloeden en moeten worden gedocumenteerd.',
  },
  '§15.c.3': {
    title: '§15.c.3 — Datum laboratoriumkalibratie',
    text: 'Datum van de meest recente periodieke laboratoriumkalibratie. Maximaal twee jaar geldig conform IEC 61672-3.',
  },
  '§15.d': {
    title: '§15.d — Meetcondities',
    text: 'Datum, begin- en eindtijd, gemeten medewerker en beschrijving van de meetomstandigheden. Eventuele afwijkingen van normale werkomstandigheden (§15.d.5).',
  },
  '§15.d.5': {
    title: '§15.d.5 — Afwijkingen normale omstandigheden',
    text: 'Elke significante afwijking (bijv. lagere productie, incidentele geluidbron) wordt genoteerd met beschrijving van de mogelijke invloed op het resultaat.',
  },
  '§15.e': {
    title: '§15.e — Meetresultaten en berekeningen',
    text: 'L_EX,8h, L_EX,8h,95%, onzekerheidscomponenten u₁ t/m u₃, uitgebreide onzekerheid U, L_p,Cpeak indien gemeten, toetsing actie- en grenswaarden, conformiteitsverklaring.',
  },
  '§15.e.6': {
    title: '§15.e.6 — Conclusie',
    text: 'Samenvatting van de uitkomsten per HEG; vergelijking met actie- en grenswaarden uit Arbobesluit art. 6.5. Basis voor het plan van aanpak.',
  },
  '§15.e.7': {
    title: '§15.e.7 — Conformiteitsverklaring',
    text: 'Verklaring of de blootstelling de actie- en grenswaarden al dan niet overschrijdt, met verwijzing naar NEN-EN-ISO 9612:2025 en de toegepaste onzekerheidsmethode (k = 1,65).',
  },

  // ── Bijlagen ───────────────────────────────────────────────────────────────
  'Bijlage B': {
    title: 'Bijlage B — Strategie-selectiegids (normatief)',
    text: 'Tabel B.1 biedt een selectiematrix voor de meetstrategie op basis van werkpatroon (stationair/mobiel/onvoorspelbaar) en taakcomplexiteit (enkelvoudig/meervoudig/complex).',
  },
  'Bijlage C': {
    title: 'Bijlage C — Onzekerheidsberekening (normatief)',
    text: 'Formules voor u₁ (geluidsteer, per strategie), u₂ (instrument, Tabel C.5), u₃ (microfoonpositie), gecombineerde onzekerheid u en uitgebreide onzekerheid U = 1,65 × u.',
  },
};

export function SectionRef({
  id,
  children,
}: {
  id: string;
  children?: React.ReactNode;
}) {
  const section = NEN9612_SECTIONS[id];

  if (!section) {
    return <span>{children ?? id}</span>;
  }

  return (
    <span className="group relative inline-block">
      {/* Visible chip */}
      <span className="cursor-help rounded bg-orange-50 px-1 py-0.5 font-mono text-xs text-orange-700 underline decoration-dotted decoration-orange-400 underline-offset-2 dark:bg-orange-900/20 dark:text-orange-300">
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
          {section.title}
        </span>
        <span className="block text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
          {section.text}
        </span>
        {/* Arrow */}
        <span className="absolute -bottom-1.5 left-4 h-3 w-3 rotate-45 border-b border-r border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900" />
      </span>
    </span>
  );
}
