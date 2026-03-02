import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Over de app — OHSHub',
  description: 'Versiehistorie en informatie over OHSHub.',
};

const CURRENT_VERSION = '0.14.1';

const CHANGELOG: {
  version: string;
  date: string;
  type: 'major' | 'minor' | 'patch';
  title: string;
  modules: string[];
  changes: string[];
}[] = [
  {
    version: '0.14.1',
    date: '2026-03-03',
    type: 'patch',
    title: 'Bedrijfsarts als beroepsprofiel + BIG-registratienummer',
    modules: ['Gevaarlijke stoffen', 'Geluid', 'Klimaat', 'Fysieke belasting'],
    changes: [
      'Bedrijfsarts toegevoegd als kwalificatieoptie voor uitvoerend onderzoekers in alle vier modules.',
      'Bij keuze Bedrijfsarts verschijnt een veld voor het BIG-registratienummer (Wet BIG art. 3).',
      'BasePerson uitgebreid met bigNumber?: string.',
    ],
  },
  {
    version: '0.14.0',
    date: '2026-03-03',
    type: 'minor',
    title: 'Pre-survey standaardisatie + gedeelde scope-componenten',
    modules: ['Gevaarlijke stoffen', 'Geluid', 'Klimaat', 'Fysieke belasting'],
    changes: [
      'Nieuw: Step0_PreSurvey voor gevaarlijke stoffen — 15 ja/nee/onbekend vragen (categorie A–E), automatische aanbeveling (volledig/gericht/geen), handmatige override.',
      'Nieuw: lib/shared-investigation-types.ts — BasePerson en CommonScopeFields interfaces.',
      'Nieuw: components/shared/scope/PersonCard.tsx — gedeeld persoonskaartje met kwalificatie, AKD-registratie, anonimiteit.',
      'Nieuw: components/shared/scope/PersonSection.tsx — gedeelde personen-sectie met add/update/remove.',
      'Nieuw: components/shared/scope/ScopeFields.tsx — gedeelde onderzoeksgegevens-sectie (bedrijf, werkplek, medewerkers, doel, periode).',
      'SoundPerson, PhysicalPerson, ClimatePerson, PersonEntry breiden nu BasePerson uit.',
      'SoundInvestigationScope, PhysicalInvestigationScope, ClimateInvestigationScope en InvestigationScope breiden nu CommonScopeFields uit.',
      'InvestigationShell uitgebreid van 10 naar 11 stappen — stap 1 is nu de voorverkenning gevaarlijke stoffen.',
      'Alle vier Step1-bestanden herschreven: PersonSection + ScopeFields + module-specifieke aanvullingen.',
    ],
  },
  {
    version: '0.13.3',
    date: '2026-03-02',
    type: 'patch',
    title: 'Migratie gevaarlijke stoffen stappen naar gedeelde UI-componenten',
    modules: ['Gevaarlijke stoffen'],
    changes: [
      'Alle 10 stap-bestanden in components/investigation/steps/ gemigreerd naar Button, Input, Select, Textarea, Alert en Icon uit @/components/ui.',
      'Raw <button>, <input>, <select> en <textarea> elementen vervangen door gedeelde UI-componenten voor consistente styling.',
      'Button variant="dashed" voor toevoeg-knoppen, variant="ghost"/"danger" size="xs" voor bewerken/verwijderen in stappen 1–10.',
      'Alert variant="warning" vervangt ad-hoc oranje/amber waarschuwingsdivs in stappen 3, 4 en 7.',
    ],
  },
  {
    version: '0.13.2',
    date: '2026-03-02',
    type: 'patch',
    title: 'Migratie climate-investigation stappen naar gedeelde UI-componenten',
    modules: ['Klimaat'],
    changes: [
      'Alle 13 stap-bestanden in components/climate-investigation/steps/ gemigreerd naar Button, Card, FieldLabel, FormGrid, Icon, Input, Select, Textarea en Alert uit @/components/ui.',
      'Raw <input>, <select>, <textarea> en <button> elementen vervangen door gedeelde UI-componenten voor consistente styling.',
      'Alert-component vervangt ad-hoc gekleurde waarschuwingsdivs (warning/neutral/error/success) in Steps 3, 5, 6, 7, 8, 9, 10, 11.',
      'Card variant="form" vervangt oranje formuliercontainers in BGForm en MeasureForm.',
      'Button variant="dashed" voor toevoeg-knoppen, variant="ghost"/"danger" size="xs" voor bewerken/verwijderen.',
    ],
  },
  {
    version: '0.13.1',
    date: '2026-03-02',
    type: 'patch',
    title: 'Migratie physical-investigation stappen naar gedeelde UI-componenten',
    modules: ['Fysieke belasting'],
    changes: [
      'Alle 11 stap-bestanden in components/physical-investigation/steps/ gemigreerd naar Button, Card, FieldLabel, FormGrid, Icon, Input, Select, Textarea en Alert uit @/components/ui.',
      'Raw <input>, <select>, <textarea> en <button> elementen vervangen door gedeelde UI-componenten voor consistente styling.',
      'Alert-component vervangt ad-hoc gekleurde waarschuwingsdivs (amber/warning).',
      'Card variant="form" vervangt oranje formuliercontainers in BGForm, LiftingForm, PushPullForm, RepetitiveForm, PostureForm, ForceForm en MeasureForm.',
    ],
  },
  {
    version: '0.13.0',
    date: '2026-03-02',
    type: 'minor',
    title: 'Gebruikersprofiel: naam & bedrijf',
    modules: ['Platform'],
    changes: [
      'Nieuwe profiles-tabel (voornaam, tussenvoegsel, achternaam, bedrijf) met RLS en auto-aanmaken via trigger.',
      'Mijn gegevens: profielsectie met bewerkbaar formulier (voornaam / tussenvoegsel / achternaam / bedrijf).',
      'Navbar toont voornaam als die ingevuld is; anders het (afgekorte) e-mailadres. Avataarinitaal volgt mee.',
      'Admin-overzicht: naam en bedrijf zichtbaar als tweede regel onder het e-mailadres.',
      'Admin-detailpagina: naam en bedrijf toegevoegd aan de accountinfo-sectie.',
      'JSON-export bevat nu ook het volledige profiel.',
    ],
  },
  {
    version: '0.12.2',
    date: '2026-03-02',
    type: 'patch',
    title: 'Registratie van privacyakkoord per gebruiker',
    modules: ['Platform'],
    changes: [
      'Privacyversie en acceptatiedatum worden bij registratie opgeslagen in user_roles (via Supabase user-metadata + trigger).',
      'Admin-overzicht: waarschuwingsicoontje bij gebruikers zonder geregistreerde privacyversie.',
      'Admin-detailpagina: accountinfo-sectie met e-mail, rol, aanmeldatum, laatste login en privacyakkoord (versie + datum).',
      'Mijn gegevens: privacyversie en acceptatiedatum zichtbaar in accountgegevens.',
      'JSON-export bevat nu ook privacy_version_accepted en privacy_accepted_at.',
    ],
  },
  {
    version: '0.12.1',
    date: '2026-03-02',
    type: 'patch',
    title: 'Bedrijfsgegevens DiversiThijs & privacyverklaring definitief',
    modules: ['Platform'],
    changes: [
      'Over-pagina: DiversiThijs als ontwikkelaar vermeld met KvK-nummer (92899943), vestigingsplaats Breedenbroek, e-mail info@diversithijs.nl en link naar privacyverklaring.',
      'Privacyverklaring volledig bijgewerkt met definitieve bedrijfsnaam, contactgegevens, grondslagen, sub-verwerkers, bewaartermijnen en alle AVG-rechten.',
    ],
  },
  {
    version: '0.12.0',
    date: '2026-03-02',
    type: 'minor',
    title: 'Vergeten wachtwoord & privacyverklaring',
    modules: ['Platform'],
    changes: [
      'Nieuwe flow "Wachtwoord vergeten": e-mailformulier op /auth/forgot-password en wachtwoord-resetpagina op /auth/reset-password (via Supabase PKCE herstelmail).',
      '"Wachtwoord vergeten?"-link toegevoegd aan de inlogpagina naast het wachtwoordveld.',
      'Privacyverklaring-pagina (/privacy) aangemaakt met AVG-conforme structuur (art. 13 informatieplicht).',
      'Registratiepagina: verplichte checkbox waarmee gebruikers de privacyverklaring accepteren voor accountaanmaak.',
    ],
  },
  {
    version: '0.11.0',
    date: '2026-03-02',
    type: 'minor',
    title: 'AVG-pagina "Mijn gegevens"',
    modules: ['Platform'],
    changes: [
      'Nieuwe pagina /account met vier AVG-secties: inzage (accountgegevens), rectificatie (e-mail wijzigen), portabiliteit (JSON-export) en vergetelheid (account verwijderen).',
      'API-route DELETE /api/account verwijdert het eigen account via supabaseAdmin; CASCADE ruimt onderzoeken en rol op.',
      'API-route GET /api/account/export retourneert alle persoonsgegevens als JSON (user-info, rol, onderzoeken).',
      'Navbar: "Mijn gegevens"-link toegevoegd in het gebruikersdropdown (desktop) en in het hamburgermenu (mobiel).',
    ],
  },
  {
    version: '0.10.0',
    date: '2026-03-02',
    type: 'minor',
    title: 'Straling, wetgeving & thema-iconen',
    modules: ['Straling', 'Platform'],
    changes: [
      'Nieuw thema "Straling" toegevoegd als placeholder-pagina (ioniserende straling, UV, IR, laser, EMV).',
      'Risico-inventarisatie wizard voor Straling (3 vragen: stralingstype, stralingswerkerscategorie, vergunning/melding).',
      'Wetgeving, toepasselijke normen en grenswaarden nu zichtbaar op alle 8 thema-pagina\'s — zowel placeholders als uitgewerkte onderzoeken.',
      'Centrale datalaag lib/theme-legal-info.ts met juridische referentiedata voor alle thema\'s; geen dubbele definities meer.',
      'SVG-iconen (Heroicons v2) toegevoegd aan alle themakaarten op de homepagina en aan de pagina-headers.',
    ],
  },
  {
    version: '0.9.6',
    date: '2026-02-27',
    type: 'patch',
    title: 'Meetplan PDF — rijenaantal per taak op basis van HEG-grootte',
    modules: ['Geluid'],
    changes: [
      'HEG met 1 medewerker: 3 genummerde invulrijen per taak (norm-minimum §9.3.2).',
      'HEG met meerdere medewerkers: 5 genummerde invulrijen per taak (aanbevolen aantal).',
      'Altijd 2 extra lege rijen zonder nummer (gestippeld) voor eventuele aanvullende metingen.',
      'Vereistenvak per taak toont nu ook het aanbevolen aantal bij meerdere medewerkers.',
    ],
  },
  {
    version: '0.9.5',
    date: '2026-02-27',
    type: 'patch',
    title: 'Correctie meetduur-berekening (§9.3.2) + inklapbare tabel',
    modules: ['Geluid'],
    changes: [
      'Bugfix: minimale meetduur per meting was omgekeerd berekend. Correct conform §9.3.2 NEN-EN-ISO 9612: T_m ≥ 5 min → min. 5 min per meting; T_m < 5 min → volledige taak meten.',
      'Gecorrigeerd in stap 8 (tabel), stap 9 (HEG-kaarten) en de Meetplan PDF.',
      'Voetnoot aangepast: "* Taakduur < 5 min: meet de volledige taak".',
      'Meetduur-vereistentabel in stap 8 is nu inklapbaar.',
    ],
  },
  {
    version: '0.9.4',
    date: '2026-02-27',
    type: 'patch',
    title: 'Meetduur-vereistentabel in stap 8 (Meetresultaten)',
    modules: ['Geluid'],
    changes: [
      'Tabel "Meetduur-vereisten per HEG" toegevoegd aan stap 8 (Meetresultaten), boven de HEG-accordeons.',
      'Toont per taak (strategie 1) of per HEG (strategie 2/3) de minimale meetduur per meting en het vereiste minimum aantal metingen.',
      'Werkelijk ingevoerd aantal metingen wordt live bijgehouden met groen ✓ zodra aan het minimum is voldaan.',
    ],
  },
  {
    version: '0.9.3',
    date: '2026-02-27',
    type: 'patch',
    title: 'Meetplan PDF — afdrukbaar veldregistratieformulier',
    modules: ['Geluid'],
    changes: [
      'Knop "Meetplan PDF" toegevoegd aan stap 7 (Meetresultaten) van het geluidsonderzoek.',
      'Genereert een afdrukbaar A4-formulier per HEG met lege invulrijen voor L_p,A,eqT, L_p,Cpeak, duur, medewerker en opmerkingen.',
      'Per taak (strategie 1) of per HEG (strategie 2/3) staan de NEN-EN-ISO 9612-minimumeisen vermeld (§9.3.2 / §10.4 / §11.4).',
      'Kalibratiestabel per meetreeks met kolommen voor voor- en nakalibratie, drift en voldoet-check (< 0,5 dB).',
      'Ondertekeningsblok en opmerkingenregels voor afwijkingen van representatieve omstandigheden (§15.d.4).',
    ],
  },
  {
    version: '0.9.2',
    date: '2026-02-27',
    type: 'patch',
    title: 'Meetduur-overzicht per HEG en meetreeks in geluidsonderzoek',
    modules: ['Geluid'],
    changes: [
      'Stap 8 (Statistieken) toont nu per HEG een meetduur-overzicht conform NEN-EN-ISO 9612 §9.3.2 / §10.4 / §11.4.',
      'Strategie 1 (taakgericht): vereiste minimum meetduur en aantal per taak (≥ max(T_m, 5 min) × ≥ 3), met werkelijk n en totaal per taak.',
      'Strategie 2/3 (functiegericht / volledige dag): vereiste minimum steekproeven (≥ 3 × T_e) met werkelijk n.',
      'Per meetreeks: verwachte meetduur per meting en werkelijke totaalduur (indien meetduur ingevoerd in stap 7).',
      'Norm-minimum-markering (*) wanneer taakduur < 5 min.',
    ],
  },
  {
    version: '0.9.1',
    date: '2026-02-27',
    type: 'patch',
    title: 'Meetprocedure-handreiking in geluidsonderzoek',
    modules: ['Geluid'],
    changes: [
      'Informatievak (§9.2 / §9.3 / §12.2 / §15.d NEN-EN-ISO 9612) toegevoegd aan stap 7 (Meetreeksen) en stap 8 (Statistieken) van het geluidsonderzoek.',
      'Handreiking omvat: minimale meetduur (≥ 5 min), stabiliteitcriterium (0,2 dB / 30 s), microfoonpositie, representatieve meetomstandigheden en kalibratie-eisen.',
    ],
  },
  {
    version: '0.9.0',
    date: '2026-02-26',
    type: 'minor',
    title: 'Authenticatie, rollen en server-side opslag',
    modules: ['Platform'],
    changes: [
      'Inloggen en registreren via e-mail en wachtwoord (Supabase Auth).',
      'Drie gebruikersrollen: admin, test-gebruiker en gebruiker — rol automatisch toegewezen bij registratie.',
      'Alle onderzoeken (geluid, klimaat, fysieke belasting, gevaarlijke stoffen) worden voortaan opgeslagen in de cloud (Supabase PostgreSQL) in plaats van localStorage.',
      'Row Level Security: gebruikers zien uitsluitend eigen onderzoeken; admins kunnen alle onderzoeken inzien (alleen-lezen).',
      'Beheerderspaneel (/admin): gebruikersoverzicht met inline rolwijziging, verwijderactie en onderzoekaantallen.',
      'Gebruikersdetailpagina: alle onderzoeken van een gebruiker met uitklapbare JSON-weergave.',
      'Navbar uitgebreid met gebruikersindicator, uitlogknop en admin-link (alleen zichtbaar voor admins).',
      'Routebeveiliging via proxy.ts: niet-ingelogde bezoekers worden doorgestuurd naar de inlogpagina.',
      'Homepagina auth-aware: niet-ingelogde bezoekers zien een welkomstpagina met CTA.',
    ],
  },
  {
    version: '0.8.0',
    date: '2026-02-26',
    type: 'minor',
    title: 'Placeholders: Trillingen, Biologische agentia, Verlichting',
    modules: ['Trillingen', 'Biologische agentia', 'Verlichting'],
    changes: [
      'Nieuw thema "Trillingen" toegevoegd met volledige risico-inventarisatie wizard (HAV/WBV, Richtlijn 2002/44/EG, Arbobesluit art. 6.11a–6.11g).',
      'Placeholder-pagina voor Trillingen-onderzoeksinstrument: grenswaarden HAV/WBV, geplande 11 stappen (ISO 5349-1/2, ISO 2631-1).',
      'Placeholder-pagina voor Biologische agentia-onderzoeksinstrument: risicoklassen 1–4, geplande 10 stappen (Richtlijn 2000/54/EG, Arbobesluit art. 4.85–4.114).',
      'Placeholder-pagina voor Verlichting-onderzoeksinstrument: grenswaarden lux/UGR/Ra, geplande 11 stappen (NEN-EN-12464-1:2021, Arbobesluit art. 6.29–6.32).',
    ],
  },
  {
    version: '0.7.0',
    date: '2026-02-26',
    type: 'minor',
    title: 'Fysieke belasting onderzoek (11 stappen)',
    modules: ['Fysieke belasting'],
    changes: [
      '11-stappen workflow voor fysieke belastingonderzoek conform ISO 11228-1/2/3, EN 1005-3/4 en Arbobesluit art. 5.1–5.6.',
      'Vooronderzoek (18 gewogen vragen) met automatische meetaanbeveling per belastingtype.',
      'Belastingsgroepen (BG): definieer homogene werknemersgroepen met geslacht, uren per dag en aantallen.',
      'NIOSH-methode voor tillen en dragen: volledige RWL-berekening (Hf × Vf × Df × Ff × Af × Cf) met tilverzwaarende-omstandighedenvlaggen.',
      'ISO 11228-2 / DUTCH-methode voor duwen en trekken: referentiekrachten per hendelhoogte en rijbaangesteldheid.',
      'OCRA Checklist (ISO 11228-3) voor repeterende handelingen: CF + FaF × (PF + RF + AddF) met live score-preview.',
      'EN 1005-4 / ISO 11226 houdingsbeoordeling: verdietoets per lichaamsdeel × frequentie × statisch/dynamisch.',
      'EN 1005-3 krachtenbeoordeling: F_Br = F_B × m_v × m_f × m_d met referentiekrachten voor 10 veelvoorkomende handelingen.',
      'Automatisch gegenereerde beheersmaatregelen (TOP-principe) op basis van gevonden risico\'s.',
      'Rapport met Arbeidshygienische Strategie-toelichting en kopieerknop.',
    ],
  },
  {
    version: '0.6.0',
    date: '2026-02-26',
    type: 'minor',
    title: 'Klimaatonderzoek (13 stappen)',
    modules: ['Klimaat'],
    changes: [
      '13-stappen workflow voor klimaatonderzoek conform NEN-EN-27243, ISO 7933 (PHS), ISO 7730 (PMV/PPD) en Arbobesluit art. 3.1g/6.1.',
      'Vooronderzoek met WBGT-schatting en geautomatiseerde meetaanbeveling.',
      'Meetstrategiebepaling: werkplek- of taakgericht conform NEN-EN-27243.',
      'Meetapparatuur registratie (kalibratie, herkalibratie, drift-controle).',
      'WBGT-berekening voor binnen en buiten, met metabole warmteproductie per activiteitsniveau.',
      'PMV/PPD-berekening conform ISO 7730 met comfort-categorie (A/B/C).',
      'Hittestress (PHS-methode): Dsweat, Tre, WBGT-grenswaarden per acclimatisatie en kledingfactor.',
      'Koude-beoordeling: IREQ (vereiste isolatiewaarde) en windchill.',
      'Automatisch gegenereerde beheersmaatregelen (TOP-principe).',
      'PDF-rapport met volledige meetdocumentatie.',
    ],
  },
  {
    version: '0.5.0',
    date: '2026-02-25',
    type: 'minor',
    title: 'Dark mode & app-menu',
    modules: ['Platform', 'Geluid'],
    changes: [
      'Schakelaar in de header voor dag- en nachtmodus (voorkeur wordt opgeslagen).',
      'App-menu met "Over de app" en placeholder voor Instellingen.',
      'Versiebeheerpagina (deze pagina).',
      'Veld "Rol in onderzoek" toegevoegd aan respondenten in Stap 1.',
      'Adres verborgen bij anonieme respondenten (naast e-mail en telefoon).',
    ],
  },
  {
    version: '0.4.0',
    date: '2026-02-20',
    type: 'minor',
    title: 'Arbeidsmiddelen, meetreeksen & respondenten',
    modules: ['Geluid'],
    changes: [
      'Nieuwe Stap 5 — Arbeidsmiddelen: registreer voertuigen, machines en gereedschap met keurings- en onderhoudsstatus (Arbobesluit art. 7.18 / Machinerichtlijn 2006/42/EG).',
      'Taken kunnen nu worden gekoppeld aan een of meer arbeidsmiddelen.',
      'Taken kopiëren van de ene HEG naar een andere met één klik.',
      'Stap 6 (Meetreeksen): meetreeks als eerste-klasse entiteit met voor- en nakalibratie, tussentijdse herkalibratie en automatische uitsluiting bij drift > 0,5 dB.',
      'Respondenten (al dan niet anoniem) toegevoegd aan Stap 1.',
      'E-mailadres en telefoonnummer voor alle personen (uitvoerders, opdrachtgevers, respondenten).',
      'Stap-nummering doorgeschoven naar 11 stappen totaal.',
    ],
  },
  {
    version: '0.3.0',
    date: '2026-01-15',
    type: 'minor',
    title: 'Volledig geluidsonderzoek (10 stappen)',
    modules: ['Geluid'],
    changes: [
      '10-stappen workflow voor geluidsonderzoek conform NEN-EN-ISO 9612:2025.',
      'Taakgebaseerde en functiegerichte meetstrategie.',
      'HEG-beheer, meetdata, statistieken, beoordeling en maatregelen.',
      'PDF-export van het volledige rapport.',
      'Opslagbeheer via localStorage.',
    ],
  },
  {
    version: '0.2.0',
    date: '2025-12-10',
    type: 'minor',
    title: 'Thema-wizards',
    modules: ['Geluid', 'Bio-agentia', 'Gevaarlijke stoffen', 'Verlichting', 'Fysieke belasting', 'Klimaat'],
    changes: [
      '6 risico-inventarisatie wizards: Geluid, Bio-agentia, Gevaarlijke stoffen, Verlichting, Fysieke belasting, Klimaat.',
      'Wizard-engine met conditionele vragen, vertakking en risicobeoordeling.',
      'Volledig uitgewerkte wizard voor Gevaarlijke stoffen (inclusief CMR-branching).',
    ],
  },
  {
    version: '0.1.0',
    date: '2025-11-28',
    type: 'minor',
    title: 'Initiële release',
    modules: ['Platform'],
    changes: [
      'Next.js 16 (App Router, Turbopack) projectstructuur.',
      'Basis navigatie, themaselectie en statische paginastructuur.',
      'Tailwind CSS dark-mode ondersteuning via OS-voorkeur.',
    ],
  },
];

const MODULE_BADGE: Record<string, string> = {
  'Geluid':              'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400',
  'Klimaat':             'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400',
  'Fysieke belasting':   'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400',
  'Gevaarlijke stoffen': 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400',
  'Trillingen':          'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400',
  'Biologische agentia': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400',
  'Verlichting':         'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400',
  'Straling':            'bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400',
  'Bio-agentia':         'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400',
  'Platform':            'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
};

const TYPE_BADGE: Record<'major' | 'minor' | 'patch', string> = {
  major: 'bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400',
  minor: 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400',
  patch: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
};

export default function OverPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      {/* Header */}
      <div className="mb-10">
        <div className="mb-1 flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            OHS<span className="text-orange-500">Hub</span>
          </h1>
          <span className="rounded-full bg-orange-100 px-3 py-0.5 text-sm font-semibold text-orange-700 dark:bg-orange-950/50 dark:text-orange-400">
            v{CURRENT_VERSION}
          </span>
        </div>
        <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          Kennisplatform voor arbeidshygiënisten, hogere veiligheidskundigen en{' '}
          <abbr
            title="Arbeids- en Organisatiedeskundige"
            className="cursor-help underline decoration-dotted decoration-zinc-400 underline-offset-2"
          >
            A&amp;O
          </abbr>
          -deskundigen. Onderzoeksgegevens worden beveiligd opgeslagen in de cloud. Inloggen is vereist voor toegang.
        </p>
      </div>

      {/* Over de ontwikkelaar */}
      <section className="mb-10">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Over de ontwikkelaar
        </h2>
        <p className="mb-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          OHSHub wordt ontwikkeld door <strong className="text-zinc-800 dark:text-zinc-200">DiversiThijs</strong>, gevestigd te Breedenbroek. Het platform is ontstaan vanuit de praktijk: een behoefte aan toegankelijke, gestructureerde ondersteuning bij arbeidshygiënisch onderzoek conform de geldende wet- en regelgeving en normen.
        </p>
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-sm">
          <dt className="text-zinc-400 dark:text-zinc-500">
            <abbr title="Kamer van Koophandel" className="cursor-help underline decoration-dotted decoration-zinc-400 underline-offset-2">KvK</abbr>
          </dt>
          <dd className="text-zinc-700 dark:text-zinc-300">92899943</dd>
          <dt className="text-zinc-400 dark:text-zinc-500">Vestigingsplaats</dt>
          <dd className="text-zinc-700 dark:text-zinc-300">Breedenbroek</dd>
          <dt className="text-zinc-400 dark:text-zinc-500">E-mail</dt>
          <dd>
            <a href="mailto:info@diversithijs.nl" className="text-orange-500 hover:underline">
              info@diversithijs.nl
            </a>
          </dd>
          <dt className="text-zinc-400 dark:text-zinc-500">Privacyverklaring</dt>
          <dd>
            <Link href="/privacy" className="text-orange-500 hover:underline">
              /privacy
            </Link>
          </dd>
        </dl>
      </section>

      {/* Disclaimer */}
      <section className="mb-10 rounded-xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-800/50 dark:bg-amber-900/10">
        <div className="flex items-start gap-3">
          <svg className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <div>
            <p className="mb-1 text-sm font-semibold text-amber-800 dark:text-amber-300">
              Vroege ontwikkelfase — maak altijd een eigen back-up
            </p>
            <p className="text-sm leading-relaxed text-amber-700 dark:text-amber-400">
              OHSHub is volop in ontwikkeling. In deze fase kan niet worden gegarandeerd dat opgeslagen onderzoeken bewaard blijven bij updates of technische problemen. Zorg daarom altijd voor een eigen back-up via de exportfunctie (JSON) binnen een onderzoek. De ontwikkelaar aanvaardt geen aansprakelijkheid voor verlies van gegevens.
            </p>
          </div>
        </div>
      </section>

      {/* Changelog */}
      <section>
        <h2 className="mb-6 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Versiehistorie
        </h2>

        <div className="relative border-l-2 border-zinc-200 pl-6 dark:border-zinc-800">
          {CHANGELOG.map((release, i) => (
            <div key={release.version} className={`relative pb-10 ${i === CHANGELOG.length - 1 ? 'pb-0' : ''}`}>
              {/* Timeline dot */}
              <span
                className={`absolute -left-[9px] top-1 h-4 w-4 rounded-full border-2 border-white dark:border-zinc-950 ${
                  i === 0
                    ? 'bg-orange-500'
                    : 'bg-zinc-300 dark:bg-zinc-700'
                }`}
              />

              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  v{release.version}
                </span>
                <span className={`rounded px-2 py-0.5 text-xs font-medium ${TYPE_BADGE[release.type]}`}>
                  {release.type}
                </span>
                <span className="text-xs text-zinc-400">{release.date}</span>
                {release.modules.map((mod) => (
                  <span
                    key={mod}
                    className={`rounded px-2 py-0.5 text-xs font-medium ${MODULE_BADGE[mod] ?? 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'}`}
                  >
                    {mod}
                  </span>
                ))}
              </div>

              <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {release.title}
              </p>

              <ul className="space-y-1">
                {release.changes.map((change, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                    <svg
                      className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-zinc-300 dark:text-zinc-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                    {change}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Back link */}
      <div className="mt-12 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <Link
          href="/"
          className="text-sm text-zinc-500 hover:text-orange-600 dark:text-zinc-400 dark:hover:text-orange-400"
        >
          ← Terug naar home
        </Link>
      </div>
    </main>
  );
}
