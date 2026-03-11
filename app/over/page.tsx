import type { Metadata } from 'next';
import Link from 'next/link';
import { getNamespaceContent } from '@/lib/content';
import InlineChangelogEditor from '@/components/InlineChangelogEditor';
import InlineEdit from '@/components/InlineEdit';
import MarkdownContent from '@/components/MarkdownContent';

export const metadata: Metadata = {
  title: 'Over de app — OHSHub',
  description: 'Versiehistorie en informatie over OHSHub.',
};

const HARDCODED_VERSION = '0.30.10';

const CHANGELOG: {
  version: string;
  date: string;
  type: 'major' | 'minor' | 'patch';
  title: string;
  modules: string[];
  changes: string[];
}[] = [
  {
    version: '0.30.10',
    date: '2026-03-07',
    type: 'patch',
    title: 'Geluid PDF: correcte Arbobesluit-artikelen + eerlijke conformiteitsverklaring',
    modules: ['Geluid'],
    changes: [
      'Alle foutieve art. 6.6-verwijzingen in PDF gecorrigeerd naar de juiste lids van art. 6.8.',
      'Conformiteitsverklaring toont "met afwijkingen" als er normafwijkingen of ontbrekende HEG\'s zijn.',
      'Managementsamenvatting toont ontbrekende HEG\'s en normafwijkingen (complianceChecks).',
      'Normtitel cover pagina: "werkplek" gecorrigeerd naar "arbeidsplaats"; art. 6.5 → art. 6.7.',
      'PPE-referenties gecorrigeerd: art. 6.5 lid 3 / art. 6.9 → art. 6.8 lid 9 / art. 6.8.',
    ],
  },
  {
    version: '0.30.9',
    date: '2026-03-07',
    type: 'patch',
    title: 'Geluid stap 12: automatisch gegenereerde conclusie',
    modules: ['Geluid'],
    changes: [
      'Knop "Genereer op basis van onderzoek" toegevoegd bij het conclusieveld.',
      'generateConclusion: resultaten per HEG (L_EX,8h,95%, verdict, piekgeluid, PBM-gecorrigeerd niveau).',
      'Normafwijkingen (fail-checks) en ontbrekende HEG\'s worden in de conclusie benoemd.',
      'Eindoordeel met actie-omschrijving per verdichtniveau (LAV/UAV/GW/voldoet).',
      'Openstaande maatregelen worden vermeld met verwijzing naar herbeoordeling.',
    ],
  },
  {
    version: '0.30.8',
    date: '2026-03-07',
    type: 'patch',
    title: 'Geluid stap 12: conformiteitsverklaring weerspiegelt normafwijkingen en ontbrekende HEG\'s',
    modules: ['Geluid'],
    changes: [
      'generateComplianceStatement: "conform" → "met afwijkingen" wanneer er fail-checks of onbeoordeelde HEG\'s zijn.',
      'Normafwijkingen (fail/warning uit stap 9) nu inline per HEG-regel en als aparte sectie in de verklaring.',
      'Onbeoordeelde HEG\'s (onvoldoende meetdata) expliciet benoemd in resultatenlijst en eindoordeel.',
      'Eindoordeel in verklaring: "niet alle HEG\'s beoordeeld" wanneer data ontbreekt.',
      'Completeness check "Berekeningen uitgevoerd" vereist nu resultaten voor álle HEG\'s.',
      'Waarschuwingsbanner boven conformiteitsverklaring bij bekende afwijkingen of ontbrekende HEG\'s.',
    ],
  },
  {
    version: '0.30.7',
    date: '2026-03-07',
    type: 'patch',
    title: 'Geluid stap 10: alle Arbobesluit-artikelverwijzingen gecorrigeerd',
    modules: ['Geluid'],
    changes: [
      'OBLIGATIONS en PEAK_OBLIGATIONS: Art. 6.6 (definities) vervangen door correcte Art. 6.8 leden (maatregelen).',
      'Art. 6.7 correct beschreven als RI&E/meting (niet audiometrie); audiometrie verwijst nu naar Art. 6.10 lid 2/3.',
      'Art. 6.8 correct beschreven als bronmaatregelen (niet voorlichting); voorlichting verwijst naar Art. 6.11.',
      'Art. 6.9 (weekgemiddelde) verwijderd uit verplichtingenlijsten; was onterecht gebruikt voor PBM-effectiviteit.',
      'Grenswaarde-verplichting (GW bij overschrijding) verwijst nu naar Art. 6.8 lid 11a/b/c.',
      'Threshold-tabel: grondslagen LAV/UAV/GW gecorrigeerd (Art. 6.8 lid 7, 9, 10).',
      'Voetnoot threshold-tabel: niet-bestaand Art. 6.5 lid 3 vervangen door Art. 6.8 lid 10.',
      'Titel en verplichtingentabel-kop: art. 6.6–6.8 → art. 6.7–6.11.',
      'AudiometrySection: art. 6.7/6.10 → art. 6.10 lid 3 (LAV); art. 6.10 lid 1 → art. 6.10 lid 2 (UAV).',
    ],
  },
  {
    version: '0.30.6',
    date: '2026-03-07',
    type: 'patch',
    title: 'Geluid stap 9: normcorrecties berekening en paragraafverwijzingen',
    modules: ['Geluid'],
    changes: [
      'u1b-formule gecorrigeerd: deelt nu door 2×Tm (norm §C.7 Noot: u1b=0,5(Tmax−Tmin)) i.p.v. 2√3×Tm.',
      '§9.3.1 → §9.3.2 in alle compliance-checks en taakmeldingen (minimum metingen per taak).',
      'Job-based minimum N=5 i.p.v. 3; N=3 en N=4 zijn per Tabel C.4 Noot 1 uitsluitend geldig voor dagmetingen.',
      'Meetplan task-based: "Tabel 2" → "Tabel 1" (Tabel 1 = taakgericht nmin; Tabel 2 = functiegericht nmin).',
      'Meetplan job-based: §10.4 → §10.2; min. duur per steekproef 15–60 min (aanbevolen 45 min) i.p.v. volledige Te.',
      'Meetplan full-day: min. duur per meting = 75% van Te (i.p.v. 100%).',
      'Onzekerheidsrij: "Formule C.1" → "Formule C.3" (taakgericht) / "Formule C.9" (functie-/dagmeting).',
      'Energiegemiddelde label: full-day toont nu "Formule (7) → Formule (9)" i.p.v. "Formule 7".',
    ],
  },
  {
    version: '0.30.5',
    date: '2026-03-07',
    type: 'minor',
    title: 'Geluid: normconformiteit per HEG in stap 9 en stap 10',
    modules: ['Geluid'],
    changes: [
      'Nieuw SoundCompliancePanel toont per HEG of het onderzoek voldoet aan NEN-EN-ISO 9612:2025.',
      'Checks: min. metingen per taak (§9.3.2), spreiding (Bijlage E), dagmeting dekking ≥ 75% (§9.4), representativiteit (§15.d.4), onzekerheid c₁u₁ (§10.4).',
      'Panel zichtbaar in zowel stap 9 (berekening) als stap 10 (beoordeling/conclusie).',
      'Baangerichte en dagmeting HEGs met 1–2 metingen produceren nu altijd een indicatief resultaat i.p.v. geen resultaat.',
    ],
  },
  {
    version: '0.30.4',
    date: '2026-03-07',
    type: 'patch',
    title: 'Stap 8 geluid: duur weergave als HH:MM:SS (enkelveld)',
    modules: ['Geluid'],
    changes: [
      'Duurveld in meetregistratie toont en accepteert HH:MM:SS in plaats van aparte m/s-invoervelden.',
    ],
  },
  {
    version: '0.30.3',
    date: '2026-03-07',
    type: 'patch',
    title: 'Stap 8 geluid: begintijd/eindtijd in seconden, bewerkbaar duurveld (m + s)',
    modules: ['Geluid'],
    changes: [
      'Begintijd en eindtijd invoerbaar met secondenprecisie (HH:MM:SS).',
      'Duurveld nu direct bewerkbaar als aparte m- en s-invoer, naast auto-berekening uit begin/eindtijd.',
      'Automatische duurberekening gebruikt seconden-precisie.',
    ],
  },
  {
    version: '0.30.2',
    date: '2026-03-07',
    type: 'patch',
    title: 'Stap 8 geluid: datum, begintijd, eindtijd en duur per meting (ISO 9612 §15.d.2/3)',
    modules: ['Geluid'],
    changes: [
      'Datum / tijdstip kolom toegevoegd aan meetresultatentabel (taakgericht en functie-/volledigedag).',
      'Begintijd en eindtijd invoerbaar per meting; duur wordt automatisch berekend.',
      '"Medewerker / datum" kolom hernoemd naar "Medewerker" — datum staat nu in de nieuwe tijdstip-kolom.',
    ],
  },
  {
    version: '0.30.1',
    date: '2026-03-07',
    type: 'patch',
    title: 'Stap 8 geluid: medewerkerkolom conditioneel, opmerking per meting',
    modules: ['Geluid'],
    changes: [
      '"Medewerker / datum" kolom alleen zichtbaar wanneer de HEG meer dan 1 medewerker heeft.',
      'Opmerking-veld toegevoegd per meting (taakgericht en functie-/volledigedagmeting).',
    ],
  },
  {
    version: '0.30.0',
    date: '2026-03-07',
    type: 'patch',
    title: 'PDF meetplan: opschoning §-refs, URL, handtekeningen en oranje HEG-boxes',
    modules: ['Geluid'],
    changes: [
      'Oranje req-box per HEG verwijderd — werkinstructies staan al volledig uitgeschreven in de sectie bovenaan het document.',
      'Functie- en volledigedagmeting: HEG-specifieke aantallen (min. steekproeven, min. cumulatief, min. meting-duur) verhuisd naar de HEG-meta tabel.',
      'Handtekeningblok verwijderd uit meetplan-PDF.',
      'URL bijgewerkt: ohs-hub.vercel.app → ohshub.app.',
      'Onnodige §-verwijzingen verwijderd: §9/10/11 uit strategielabel, §12.2 uit calibratie-header, §15.d.4 uit opmerkingenveld, Arbobesluit art. uit footer.',
    ],
  },
  {
    version: '0.29.0',
    date: '2026-03-07',
    type: 'minor',
    title: 'Meetplan PDF: werkinstructies, kolom-fix, isCyclic; PDF-knop in stap 7; meetduur-tabel verwijderd',
    modules: ['Geluid'],
    changes: [
      'PDF meetplan: "Meetprocedure & werkinstructies" sectie toegevoegd met 4 velden (Kalibratie & aantallen, Meetduur, Meetpositie, Omstandigheden).',
      'PDF meetplan: kolomtelling-bug opgelost — meetrijen hadden 9 cellen, koptekst 10 kolommen.',
      'PDF meetplan: typo "Functiomschrijving" hersteld naar "Functiebeschrijving".',
      'PDF meetplan: cyclische taken (isCyclic) tonen nu eigen duratie-eis (≥ 3 volledige cycli, min. 3 min) in de per-taak req-box.',
      'PDF meetplan: dode code `includeTask`-parameter verwijderd uit meetkoptabel.',
      'Meetplan PDF-knop beschikbaar in stap 7 (meetplan & taken), naast de bestaande knop in stap 8.',
      'Meetduur-vereisten tabel verwijderd uit stap 8; min. eisen zijn zichtbaar in het PDF-meetplan en via per-taak feedback.',
    ],
  },
  {
    version: '0.28.0',
    date: '2026-03-07',
    type: 'minor',
    title: 'Stap 8 geluid: norm-review ISO 9612:2025 — tabelbugs, deviations, §-opschoning',
    modules: ['Geluid'],
    changes: [
      'Bug fix: meetduur-vereisten tabel toonde voor functiegerichte strategie de volledige werkdag als min. meetduur (was ≥ Te); nu correct: 15–60 min per steekproef, min. n uit Tabel 3.',
      'Bug fix: volledigedag-tabel toonde 3 × Te als min. totaal; nu: ≥ 75% per meting, min. 3 metingen.',
      'PDF meetplan functiegericht herschreven: juiste steekproefduur (45 min), berekend min. aantal steekproeven en cumulatieve duur uit Tabel 3.',
      'PDF volledigedag: spreiding- en c₁u₁-conditie voor extra metingen toegevoegd.',
      '≥ 5 metingen: "aanbevolen" gecorrigeerd naar "verplicht" indien meerdere medewerkers bemeten worden (ISO 9612 §9.3.2 shall).',
      'isCyclic-vlag in meetduur-tabel: cyclische taken tonen ≥ 3 cycli / min. 3 min i.p.v. ≥ 5 min.',
      'Afwijkingen van representatieve omstandigheden: eigen sub-rij direct zichtbaar wanneer Rep. wordt uitgevinkt; niet meer verstopt achter OB-knop.',
      'Alle §-paragraafverwijzingen verwijderd uit de UI (labels, tooltips, tabelheaders, InfoBox). In het PDF-meetplan blijven ze staan.',
      'InfoBox vereenvoudigd: "aanlooptijd"-bullet verwijderd (niet normatief), subsectie-headers zonder §-nummers, volgorde logischer.',
    ],
  },
  {
    version: '0.27.0',
    date: '2026-03-07',
    type: 'minor',
    title: 'Stap 7 geluid: ISO 9612:2025 norm-review verbeteringen (§9.1, §9.3.3, §10.4)',
    modules: ['Geluid'],
    changes: [
      'Cyclisch geluid: taak markeerbaar als cyclisch; toont ≥ 3 cycli / min. 3 min-waarschuwing bij T_m-invoer (§9.3.3).',
      'Uitgebreide InfoBox taakgericht: §9.1 guidance (handgereedschap = aparte taak), min. meetduur ≥ 5 min, verduidelijking spreiding op meetresultaten L_p,A,eqT.',
      'Functiegericht meetplan: §10.4-eis toegevoegd (c₁u₁ > 3,5 dB → verfijn HEG of extra steekproeven) — nieuw in ISO 9612:2025.',
      'Bug fix: min. cumulatieve meetduur tabel 3 (15–40 mw.) toont nu het berekende resultaat in uren.',
    ],
  },
  {
    version: '0.26.0',
    date: '2026-03-07',
    type: 'minor',
    title: 'Disclaimer — volledig versiebeheer en admin push (spiegeling privacysysteem)',
    modules: ['Algemeen', 'Beheer'],
    changes: [
      'Disclaimer-versiebeheer toegevoegd: admins kunnen nieuwe versies publiceren via de disclaimerpagina.',
      'Admin push per gebruiker: op de gebruikersdetailpagina kan een admin herbevestiging verplichten (bell-knop) of intrekken (X-knop).',
      'Admin push voor alle gebruikers: knop op /disclaimer om herbevestiging voor alle gebruikers tegelijk in te stellen.',
      'Gebruikersmodal: bij openstaand verzoek verschijnt de disclaimertekst als sessie-modal met "Accepteren" en "Later".',
      'Registratie: nieuwe gebruikers moeten bij aanmaken de disclaimer accepteren (checkbox naast privacyverklaring).',
      'Mijn gegevens: geaccepteerde disclaimerversie en datum worden getoond.',
      'DisclaimerModal omgezet van localStorage-based naar DB-driven (sessionStorage voor "Later").',
    ],
  },
  {
    version: '0.25.0',
    date: '2026-03-07',
    type: 'minor',
    title: 'Disclaimer — pagina, eenmalige modal en footer',
    modules: ['Algemeen'],
    changes: [
      'Disclaimerpagina toegevoegd (/disclaimer) met volledige aansprakelijkheidsbeperking.',
      'Eenmalige onboarding-modal: nieuwe gebruikers moeten de disclaimer bevestigen voordat ze verdergaan (localStorage, geen DB).',
      'Footer toegevoegd op elke pagina met links naar Disclaimer, Privacyverklaring en Over OHSHub.',
    ],
  },
  {
    version: '0.24.7',
    date: '2026-03-07',
    type: 'patch',
    title: 'Stap 6/10 geluid: APF→APV, H-klasse HML-check, handmatige presets, 80–87 dB waarschuwing',
    modules: ['Geluid'],
    changes: [
      'APF overal vervangen door APV (Assumed Protection Value, conform EN 458:2026 terminologie).',
      'HML-check (A.4): H-waarde invoerveld en H-klasse radioknop toegevoegd; klasse-omschrijvingen bijgewerkt (H < 2 dB, M 2–5 dB, L ≥ 5 dB).',
      'Handmatige methode: SNR-invoer + drie aanname-presets toegevoegd (Optimistisch SNR−3, Realistisch SNR−7, Conservatief SNR−10 conform AI-04); schatting-waarschuwing getoond wanneer preset actief is.',
      'Stap 10: PFRE-paragraaf en (SNR÷2)-annotatie verwijderd.',
      'Stap 10: waarschuwing toegevoegd wanneer L_EX,8h,oor in de band 80–87 dB(A) valt.',
    ],
  },
  {
    version: '0.24.6',
    date: '2026-03-07',
    type: 'patch',
    title: 'Stap 6 geluid: EN 458 selectiemethoden gehoorbescherming',
    modules: ['Geluid'],
    changes: [
      'PPE-formulier uitgebreid met EN 458-selectiemethoden: HML-check (A.4), SNR-methode (A.5) en handmatig.',
      'HML-check: M- en L-waarden invoeren + geluidskarakter (M-klasse / L-klasse) → APF auto-berekend.',
      'SNR-methode: SNR + spectraalcorrectie (Lp,C − Lp,A) → APF = SNR − correctie.',
      'Berekende APF wordt direct opgeslagen in ppeAttenuation voor gebruik in stap 10.',
      'Standaard selectiemethode bij nieuw toe te voegen gehoorbescherming gewijzigd naar HML-check.',
    ],
  },
  {
    version: '0.24.5',
    date: '2026-03-06',
    type: 'patch',
    title: 'Stap 6 geluid: SNR÷2 APF-berekening verwijderd',
    modules: ['Geluid'],
    changes: [
      'SNR÷2 auto-berekening van APF verwijderd — methode heeft geen normatieve basis in EN 458:2026 of Nederlandse richtlijnen.',
      'APF is nu een handmatig invoerveld; gebruiker bepaalt waarde zelf via EN 458-selectieprocedure (SNR-, HML- of octaafbandmethode).',
      'SNR-veld blijft als documentatieveld (waarde van datablad).',
      'PFRE-disclaimer vervangen door instructietekst: APF invoeren op basis van EN 458-selectie.',
    ],
  },
  {
    version: '0.24.4',
    date: '2026-03-06',
    type: 'patch',
    title: 'Stap 6 geluid: normreferenties en InfoBoxen verwijderd',
    modules: ['Geluid'],
    changes: [
      'Staptitel "(art. 7.4a Arbobesluit)" verwijderd.',
      'InfoBox arbeidsmiddelen (Arbobesluit / Machinerichtlijn) verwijderd.',
      'InfoBox gehoorbescherming (wettelijke basis EN 458) vervangen door beknopte plaintekst.',
      'InfoBox dubbele gehoorbescherming vervangen door plain notitieblok; normcitaten verwijderd.',
      'Normreferenties verwijderd uit keuringsalerts, PFRE-disclaimer, capped-melding en sub-header gehoorbescherming.',
    ],
  },
  {
    version: '0.24.3',
    date: '2026-03-06',
    type: 'patch',
    title: 'Stap 5 geluid: meetapparatuur uitgebreid en kalibratiecontrole gecorrigeerd',
    modules: ['Geluid'],
    changes: [
      'Kalibratietermijn gecorrigeerd: waarschuwing nu bij >24 maanden (was 12) conform §5.3; referentiedatum is aanmaakdatum onderzoek i.p.v. vandaag.',
      'Foutieve normreferentie §12.1 vervangen door §5.3 in kalibratiemeldingstekst.',
      'Nieuwe velden: naam kalibratie­laboratorium en uitkomst verificatie (§5.3 / §15.c.3).',
      'Kalibratorsectie toegevoegd: type/model en serienummer kalibrator (§5.2 — IEC 60942).',
      'Waarschuwing bij selectie klasse-2 instrument toegevoegd (§5.1 — minder geschikt bij lage T of hoge freq.).',
      'InfoBox, SectionRef-chips en normreferentie in staptitel verwijderd.',
    ],
  },
  {
    version: '0.24.2',
    date: '2026-03-06',
    type: 'patch',
    title: 'Stap 4 geluid: strategie-aanbevelingen gecorrigeerd conform Tabel B.1',
    modules: ['Geluid'],
    changes: [
      'STRATEGY_GUIDANCE herschreven: onderscheid tussen ✓ᵃ (Aanbevolen), ✓ (Acceptabel) en — (Niet aanbevolen) conform Tabel B.1 NEN-EN-ISO 9612:2025.',
      'Twee ontbrekende werkpatronen toegevoegd: "Meerdere taken — taaklengtes onbekend" en "Geen taken toegewezen" (beide S2=✓ᵃ, S3=✓).',
      'InfoBox §6 en SectionRef-chips verwijderd; staptitel ontdaan van §8-referentie.',
      'Strategie-titels vereenvoudigd (§9/§10/§11 verwijderd uit weergavetitels).',
      'Motivering-label ontdaan van §15.b.4-chip.',
    ],
  },
  {
    version: '0.24.1',
    date: '2026-03-06',
    type: 'patch',
    title: 'Stap 3 geluid: werkanalyse uitgebreid conform §7 / §15.b NEN-EN-ISO 9612:2025',
    modules: ['Geluid'],
    changes: [
      'Staptitel en beschrijving ontdaan van §7-paragraafverwijzingen; "HBG" verwijderd (niet ISO 9612 terminologie).',
      'InfoBox verwijderd; SectionRef-chips (§8, Bijlage B) uit het werkpatroon-label verwijderd.',
      '"Geluidsbronnen & werkomschrijving" gesplitst in twee aparte velden: "Beschrijving werkzaamheden" (§7.1.a) en "Geluidsbronnen" (§7.3.b).',
      'Nieuw veld "Beschrijving nominale werkdag" per HEG toegevoegd (§7.3 / §15.b.3).',
      'Nieuw veld "Indelingscriterium HEG" toegevoegd (§7.2 — functietitel, werkzone, productieproces, beroep, anders).',
      'Nieuwe checkbox "Significante piekgebeurtenissen" + beschrijvingsveld toegevoegd (§7.1.e / §7.3.c); amber badge in samenvatting.',
    ],
  },
  {
    version: '0.24.0',
    date: '2026-03-06',
    type: 'minor',
    title: 'Stap 2 geluid: normreferentie, opgeruimde sectietitels',
    modules: ['Geluid'],
    changes: [
      'Toegepaste norm (NEN-EN-ISO 9612:2025) vastgelegd als zichtbaar veld in stap 2 conform §15.a.6.',
      'Optioneel veld "Afwijkingen / aanvullende normen" toegevoegd naast de normvermelding.',
      'Infokader met normtitel verwijderd (was redundant naast het nieuwe normveld).',
      'Paragraafverwijzingen (§15.a.1 enz.) uit sectietitels en beschrijvingstekst verwijderd.',
    ],
  },
  {
    version: '0.23.9',
    date: '2026-03-06',
    type: 'patch',
    title: 'Q14/Q15 uitgeschakeld bij ontbrekende RI&E; Q13=Nee weegt mee in aanbeveling',
    modules: ['Geluid'],
    changes: [
      'Q14 en Q15 worden uitgeschakeld (N.v.t.) wanneer Q13 op Nee staat — vragen zijn dan niet beantwoordbaar.',
      'Uitgeschakelde vragen tellen niet mee in de voortgangsteller.',
      'Q13=Nee is nu een expliciete trigger: altijd indicatief onderzoek; gecombineerd met geluidsklachten of blootstellingsduur ≥ 2u → volledig onderzoek.',
    ],
  },
  {
    version: '0.23.8',
    date: '2026-03-06',
    type: 'minor',
    title: 'Voorverkennende vragen geluid verbeterd (normatief)',
    modules: ['Geluid'],
    changes: [
      'Cat. A — drempel verlaagd van > 85 naar ≥ 80 dB(A), conform de wettelijke ondergrens voor de beoordelingsplicht (Arbobesluit art. 6.6 lid 1).',
      'Cat. B — wetsreferentie gecorrigeerd: grenswaarde 87 dB(A) staat in lid 2, niet lid 1.',
      'Q8 (was Q9) — drempel voor arbeidsmiddelenvermogen gewijzigd van > 100 dB(A) naar L_pA ≥ 85 dB(A) op de werkpost.',
      'Q9 (was Q10) — PPE-vraag uitgebreid: ook geschiktheid en attenuatiewaarde (SNR/HML).',
      'Cat. E — Q19 (medezeggenschap, geen risico-indicator) vervangen door Q17: audiometrisch programma aanwezig (Arbobesluit art. 6.10).',
      'Vraagnummers hernummerd Q1–Q17 in logische volgorde per categorie.',
    ],
  },
  {
    version: '0.23.7',
    date: '2026-03-06',
    type: 'patch',
    title: 'Stapvoortgang blijft zichtbaar bij terugnavigeren',
    modules: ['Geluid', 'Gevaarlijke stoffen', 'Fysieke belasting', 'Klimaat'],
    changes: [
      'Afgeronde stappen blijven groen gemarkeerd wanneer je terugnavigert naar een eerdere stap.',
      'Voortgang is nu gebaseerd op de hoogst bereikte stap in de sessie, niet de huidige positie.',
    ],
  },
  {
    version: '0.23.6',
    date: '2026-03-06',
    type: 'patch',
    title: 'Afkortingen volledig uit code — beheer via database',
    modules: ['Admin'],
    changes: [
      'Alle ingebakken afkortingen gemigreerd naar de database (migration 007_abbr_seed.sql).',
      'Afkortingenbeheer toont nu één vlakke lijst — geen onderscheid meer tussen standaard en eigen.',
      'Alle afkortingen zijn gelijkwaardig bewerkbaar en verwijderbaar via het beheerderspaneel.',
    ],
  },
  {
    version: '0.23.5',
    date: '2026-03-06',
    type: 'patch',
    title: 'Afkortingenbeheer: één gecombineerde tabel',
    modules: ['Admin'],
    changes: [
      'Eigen en standaard afkortingen samengevoegd in één alfabetische tabel.',
      'Badge per rij: "standaard" (grijs), "eigen" (blauw), "aangepast" (oranje).',
      'Alle rijen bewerkbaar; verwijderen/terugzetten alleen voor DB-vermeldingen.',
    ],
  },
  {
    version: '0.23.4',
    date: '2026-03-06',
    type: 'minor',
    title: 'FAQ zoekfunctie op /kennisportaal/faq',
    modules: ['Kennisportaal'],
    changes: [
      'Zoekbalk op /kennisportaal/faq doorzoekt alle vragen en antwoorden over alle thema\'s.',
      'Zoekresultaten tonen thema-badge en inklapbaar antwoord; wis-knop in het zoekveld.',
      'Gegroepeerde weergave verdwijnt tijdens het zoeken en verschijnt terug zodra het zoekveld leeg is.',
      'Zoekbalk verwijderd uit de per-thema FAQ op de kennisportaal-themapagina\'s.',
    ],
  },
  {
    version: '0.23.3',
    date: '2026-03-06',
    type: 'minor',
    title: 'Zoekfunctie in kennisportaal FAQ per thema',
    modules: ['Kennisportaal'],
    changes: [
      'Zoekveld toegevoegd bovenaan de veelgestelde vragen per thema — filtert live op vraag én antwoord.',
      '"Geen resultaten"-melding bij zoekopdrachten zonder treffer.',
    ],
  },
  {
    version: '0.23.2',
    date: '2026-03-06',
    type: 'patch',
    title: 'Streefwaarden op dezelfde rij als comfortwaarden',
    modules: ['Wettelijk kader & normen'],
    changes: [
      'ThemeLimit krijgt optioneel veld `targetValue` — streefwaarde naast de richtwaarde op dezelfde rij.',
      'Comfortwaarden-sectie toont kolomkoppen "Richtwaarde" / "Streefwaarde" wanneer streefwaarden aanwezig zijn.',
      'NPR 3438 geluid: streefwaarden toegevoegd (≤40 / ≤50 / ≤65 dB(A)) naast de richtwaarden.',
      'StructuredLimitEditor: streefwaarde-invoerveld (groen) toegevoegd per limietregel.',
    ],
  },
  {
    version: '0.23.1',
    date: '2026-03-06',
    type: 'patch',
    title: 'Streefwaarden toegevoegd aan wettelijk kader',
    modules: ['Wettelijk kader & normen'],
    changes: [
      'Nieuw veld "Streefwaarden" toegevoegd naast grenswaarden en comfortwaarden — volle breedte, groen (emerald) kleuraccent, via CMS aanpasbaar per thema.',
    ],
  },
  {
    version: '0.23.0',
    date: '2026-03-06',
    type: 'minor',
    title: 'Comfortwaarden + vereenvoudiging wettelijk kader',
    modules: ['Wettelijk kader & normen'],
    changes: [
      'Nieuw veld "Comfortwaarden (richtwaarden)" toegevoegd aan wettelijk kader — gebaseerd op NPR 3438 voor geluid, via CMS aanpasbaar per thema.',
      'Grenswaarden worden nu over de volle breedte weergegeven; comfortwaarden eveneens.',
      '"Administratieve verplichtingen" verwijderd uit het wettelijk kader-paneel.',
      'Grenswaarden-bewerker: invoervelden vallen niet meer buiten het kader (fix gestapeld layout).',
    ],
  },
  {
    version: '0.22.9',
    date: '2026-03-06',
    type: 'patch',
    title: 'Grenswaarden-editor layout fix',
    modules: ['Wettelijk kader & normen'],
    changes: [
      'Grenswaarden-bewerker: invoervelden vallen niet meer buiten het kader — gestapeld layout (label + verwijderknop, sublabel + waarde).',
    ],
  },
  {
    version: '0.22.8',
    date: '2026-03-06',
    type: 'minor',
    title: 'Wettelijk kader bewerken vanuit kennisportaal + formuleherstel in InlineMd',
    modules: ['Kennisportaal', 'Wettelijk kader & normen'],
    changes: [
      'Admins kunnen wettelijk kader & normen nu direct vanuit de kennisportaal-pagina bewerken via potloodknoppen.',
      'Edit-logica geconsolideerd in ThemeLegalContent (namespace-prop); ThemeLegalInfo is nu een slanke collapsible wrapper.',
      'InlineMd ondersteunt nu [[LaTeX]]-formulemakers (KaTeX) — formules in wetgeving- en normbeschrijvingen renderen correct.',
    ],
  },
  {
    version: '0.22.7',
    date: '2026-03-06',
    type: 'minor',
    title: 'Kennisportaal — wettelijk kader & normen uit gedeelde bron',
    modules: ['Kennisportaal', 'Wettelijk kader & normen'],
    changes: [
      'Nieuw `ThemeLegalContent`-component: pure weergave van wetgeving, normen, grenswaarden en administratieve verplichtingen.',
      'Named section-exports (`LegislationList`, `NormsList`, `LimitGroupsList`, `AdminObligationsList`) gedeeld door ThemeLegalInfo en ThemeLegalContent — geen code-duplicatie.',
      'Kennisportaal-themapagina\'s tonen nu "Wettelijk kader & normen" vanuit dezelfde databron als de investigation tab (`theme-legal.{slug}` namespace).',
      'Admin bewerkt juridische inhoud één keer (via investigation tab), beide pagina\'s worden automatisch bijgewerkt.',
      'Kennisportaal-secties "Normen & grenswaarden" en "Wetgeving & regelgeving" (vrije markdown) verwijderd; "Meetmethoden", "Praktische tips" en "Bronnen" blijven als vrije CMS-secties.',
      'Parse-helpers `parseLegalItems` en `parseLegalJson` verplaatst naar `lib/theme-legal-info.ts` voor hergebruik in server- én client-components.',
    ],
  },
  {
    version: '0.22.6',
    date: '2026-03-06',
    type: 'minor',
    title: 'Wettelijk kader & normen — gelijkgetrokken structuur, herordening en markdown',
    modules: ['Wettelijk kader & normen'],
    changes: [
      'Wetgeving-items hebben nu dezelfde structuur als normen: naam + optionele beschrijving + inspring-niveau.',
      'Beide secties (Wetgeving én Toepasselijke normen) ondersteunen herordening via omhoog/omlaag-knoppen.',
      'Beide secties ondersteunen inspring-niveaus (0–2) voor hiërarchische weergave.',
      'Alle tekstvelden (naam en beschrijving) ondersteunen markdown-opmaak: **vet**, *cursief*, <u>onderstreept</u>.',
      'Nieuwe editor-component `LegalItemsEditor` vervangt `JsonArrayEditor` (wetgeving) en `NormsEditorClient` (normen).',
      'Nieuwe `InlineMd`-component voor inline markdown-rendering zonder block-level wrappers.',
    ],
  },
  {
    version: '0.22.5',
    date: '2026-03-06',
    type: 'patch',
    title: 'Onderzoekstegels: geluid actief, overige thema\'s gedeactiveerd voor gebruikers',
    modules: ['Algemeen'],
    changes: [
      'Alle onderzoeksthema\'s behalve Geluid zijn gemarkeerd als inactief (`active: false` in lib/themes.ts).',
      'Niet-admins zien inactieve tegels als greyed-out (opacity-40) met "Binnenkort"-badge; tegels zijn niet klikbaar.',
      'Admins zien alle tegels als links met een subtiel "inactief"-label.',
      'Directe URL-navigatie naar een inactief thema (/themes/climate etc.) leidt niet-admins terug naar de homepagina.',
    ],
  },
  {
    version: '0.22.4',
    date: '2026-03-06',
    type: 'patch',
    title: 'Vereenvoudiging PPE-module geluid — SNR÷2 als standaard, PFRE-disclaimer',
    modules: ['Geluid'],
    changes: [
      'Geluid: PPE-invoerformulier (stap 6) vereenvoudigd tot SNR-only — methode-tabs (SNR §A.5, HML §A.4, octaafband §A.2, handmatig) verwijderd.',
      'Geluid: APF wordt altijd berekend als SNR÷2 (conservatieve PFRE-benadering); handmatige override blijft mogelijk.',
      'Geluid: PFRE-disclaimer toegevoegd in stap 6 en stap 10 — legt uit dat werkelijke demping ≈ 50–60% van nominale SNR is (EN 458:2025 Annex B) en waarom SNR÷2 aansluit bij ISO 9612.',
      'Geluid: piekgeluid-correctie (L_p,Cpeak,oor) is niet meer berekend — SNR beschrijft de spectrale samenstelling van piekgeluid niet; uitleg toegevoegd.',
      'Geluid: beoordeling (stap 10) vereenvoudigd — apfFreqBased-logica verwijderd; PBM-samenvatting toont SNR÷2 als methode-label.',
      'Geluid: bestaande onderzoekdata met HML/octaafband-methode blijft geldig (velden worden bewaard in de database; PDF-export en rapport ongewijzigd).',
    ],
  },
  {
    version: '0.22.3',
    date: '2026-03-06',
    type: 'patch',
    title: 'SNR-methode fix + normatieve verwijzingen gehoorbescherming (EN 458:2025)',
    modules: ['Geluid'],
    changes: [
      'Geluid: SNR-methode aangepast conform EN 458:2025 §A.5 — exacte formule L′_p,A = L_p,C − SNR; invoerveld voor C-gewogen niveau L_p,C toegevoegd. Zonder L_p,C wordt SNR÷2 als benadering gebruikt (niet conform norm, duidelijk aangegeven).',
      'Geluid: normatieve verwijzingen (EN 458:2025 §A.2/§A.4/§A.5/§6.2.4) toegevoegd aan alle PPE-methode-secties in stap 6 en stap 10.',
      'Geluid: afwijkingen van EN 458:2025 expliciet gedocumenteerd — HML check-methode (§A.4 i.p.v. §A.3), dubbele bescherming (schatting vs. fabricantcombinaties), 35 dB-cap (informatief).',
      'Geluid: code-commentaar en infoboxen bijgewerkt van EN 458:2016 naar EN 458:2025.',
    ],
  },
  {
    version: '0.22.2',
    date: '2026-03-06',
    type: 'patch',
    title: 'Fix: HML-methode gehoorbescherming (EN 458)',
    modules: ['Geluid'],
    changes: [
      'Geluid: HML-waarden (H, M, L) worden nu direct als PNR gebruikt conform EN 458:2016, i.p.v. onterecht gedeeld door 2. Geldt voor enkelvoudige én dubbele bescherming.',
    ],
  },
  {
    version: '0.22.1',
    date: '2026-03-06',
    type: 'patch',
    title: 'Volledige onderzoekstegels klikbaar',
    modules: ['Home'],
    changes: [
      'Home: volledige onderzoekstegel is klikbaar (niet alleen het kleine pijltje voor admins).',
    ],
  },
  {
    version: '0.22.0',
    date: '2026-03-05',
    type: 'minor',
    title: 'Landingspagina + naamwijziging navbar',
    modules: ['Platform'],
    changes: [
      'Home: generieke landingspagina met hero, drie feature-pillars (Kennisportaal, Onderzoeksinstrumenten, Abonnementen/binnenkort) en onderzoekengrid.',
      'Navbar: "Thema\'s" hernoemd naar "Onderzoeken".',
    ],
  },
  {
    version: '0.21.1',
    date: '2026-03-05',
    type: 'patch',
    title: 'Fix: [[formule]]-markers renderen nu correct in FAQ-vraagkoppen',
    modules: ['Platform'],
    changes: [
      'FaqAccordion + FaqInlineManager: vraagkop doorgestuurd via renderWithFormulas zodat [[L_{EX,8h}]] als KaTeX-formule verschijnt.',
    ],
  },
  {
    version: '0.21.0',
    date: '2026-03-05',
    type: 'minor',
    title: 'Kennisportaal — theoretische achtergrond, normen en FAQ per thema',
    modules: ['Platform'],
    changes: [
      'Nieuw: /kennisportaal — openbare sectie met theoretische kennisbladen per arbeidshygiënisch thema.',
      'Kennisblad per thema (/kennisportaal/[slug]): introductie, CMS-secties (normen, methoden, wetgeving, praktijk) inline bewerkbaar voor admins, thema-FAQ en CTA naar het onderzoeksinstrument.',
      'FAQ-overzicht (/kennisportaal/faq): alle gepubliceerde vragen gegroepeerd per thema.',
      'Kennisportaal-landing: themakaarten + teaser met 5 algemene FAQ-vragen.',
      'DB: faq_items-tabel met RLS (public read voor gepubliceerde items, admin schrijf) — migration 007.',
      'API: GET /api/faq (publiek), GET+POST /api/admin/faq, PATCH+DELETE /api/admin/faq/[id].',
      'Admin FAQ-beheer (/admin/faq): items toevoegen, bewerken, verwijderen, volgorde instellen en publicatiestatus togglen.',
      'Navbar: "Kennisportaal"-link toegevoegd tussen Home en Thema\'s.',
      'AdminNav: "FAQ"-tab toegevoegd.',
    ],
  },
  {
    version: '0.20.4',
    date: '2026-03-05',
    type: 'patch',
    title: 'Admin: één scrollbare tabel voor alle schermformaten',
    modules: ['Platform'],
    changes: [
      'Kaartweergave verwijderd; alle gebruikers staan nu in één tabel die horizontaal scrollt op smalle schermen.',
    ],
  },
  {
    version: '0.20.3',
    date: '2026-03-05',
    type: 'patch',
    title: 'Admin gebruikersoverzicht: responsieve opmaak',
    modules: ['Platform'],
    changes: [
      'Beheerderspaneel: tabel is nu horizontaal scrollbaar op smalle schermen (overflow-x-auto + min-breedte).',
      'Mobiele weergave (< 768px): kaartweergave per gebruiker met alle velden overzichtelijk gestapeld.',
    ],
  },
  {
    version: '0.20.2',
    date: '2026-03-05',
    type: 'patch',
    title: 'Fix: privacy modal toont na client-side inloggen',
    modules: ['Platform'],
    changes: [
      'PrivacyAcceptModal luistert nu via onAuthStateChange (SIGNED_IN) naar inloggen — de modal werkte niet na client-side navigatie via router.replace omdat de root layout niet herstartte.',
    ],
  },
  {
    version: '0.20.1',
    date: '2026-03-05',
    type: 'patch',
    title: 'Privacy-kolom in gebruikersoverzicht',
    modules: ['Platform'],
    changes: [
      'Beheerderspaneel: aparte "Privacy"-kolom in de gebruikerslijst met geaccepteerde versie, acceptatiedatum, "herbevestiging vereist"-melding én bell-/X-knop per rij.',
    ],
  },
  {
    version: '0.20.0',
    date: '2026-03-05',
    type: 'minor',
    title: 'Privacy herbevestiging — admin push + gebruikersmodal',
    modules: ['Platform'],
    changes: [
      'Admin kan per gebruiker (detailpagina) of voor alle gebruikers tegelijk een herbevestiging van de privacyverklaring verplichten.',
      'Gebruikers zien bij de volgende sessie een modal met de privacytekst; "Later" slaat de herinnering tot de volgende sessie op via sessionStorage.',
      '"Accepteren en doorgaan" slaat de versie op in user_roles en wist het verzoek.',
      'Beheerderspaneel: bell-icoon per gebruiker in de lijst (oranje stip) en op de detailpagina (bell- of X-knop + amber badge).',
      'DB: kolom privacy_required_version toegevoegd aan user_roles (migration 006).',
    ],
  },
  {
    version: '0.19.0',
    date: '2026-03-05',
    type: 'minor',
    title: 'Privacyversiegeschiedenis + inline bewerken "Over de app"',
    modules: ['Platform'],
    changes: [
      'Privacyverklaring: admin kan nu een nieuwe versie publiceren met type (major/minor/patch) en versienummer; eerdere versies zijn inklapbaar zichtbaar op /privacy.',
      'Versionering: semantic versioning voor privacyverklaring (1.0.0 → 1.0.1 → 1.1.0 → 2.0.0).',
      'Registratie: nieuw aangemaakte accounts accepteren automatisch de actuele live-versie van de privacyverklaring.',
      '"Over de app" pagina: ondertitel, ontwikkelaarsbeschrijving, contactgegevens (KvK, vestigingsplaats, e-mail) en disclaimer nu volledig inline bewerkbaar.',
      'Fix: onderzoekenaantal stond op 0 voor alle gebruikers in het beheerderspaneel — PostgREST aggregate-syntax vervangen door JS-telling.',
    ],
  },
  {
    version: '0.18.12',
    date: '2026-03-05',
    type: 'patch',
    title: 'UI-opruiming: placeholder badge + hamburgermenu vereenvoudigd',
    modules: ['Platform'],
    changes: [
      'Placeholder-pagina\'s: subtitel-badge verwijderd, "In ontwikkeling" badge staat nu inline naast de paginatitel.',
      'color.badge en color.border props verwijderd uit InvestigationPlaceholder (waren overbodig).',
      'Hamburgermenu: "Afkortingen beheren" en "UI-componentenbibliotheek" verwijderd — beide zijn bereikbaar via het beheerderspaneel.',
      'AdminNav: "UI-bibliotheek" tab toegevoegd als derde tab in het beheerderspaneel.',
    ],
  },
  {
    version: '0.18.11',
    date: '2026-03-05',
    type: 'patch',
    title: 'Placeholder stappen-layout: uitlijning cijfer en tekst gecorrigeerd',
    modules: ['Platform'],
    changes: [
      'InvestigationPlaceholder: absolute positionering van stapnummers vervangen door flex-layout — tekst staat nu correct naast het getal in plaats van erachter.',
      'Stapnummering gewijzigd van 0-gebaseerd naar 1-gebaseerd.',
    ],
  },
  {
    version: '0.18.10',
    date: '2026-03-05',
    type: 'patch',
    title: 'Documentatie: renderWithFormulas vs MarkdownContent keuzegids',
    modules: ['Platform'],
    changes: [
      'CLAUDE.md: formules/markdown/afkortingen sectie samengevoegd tot een keuzegids met tabel — wanneer Formula, renderWithFormulas of MarkdownContent te gebruiken.',
      'lib/render-with-formulas.tsx: JSDoc uitgebreid met mogelijkheden, beperkingen en gebruiksadvies.',
      'components/MarkdownContent.tsx: JSDoc uitgebreid met mogelijkheden, beperkingen en gebruiksadvies.',
    ],
  },
  {
    version: '0.18.9',
    date: '2026-03-05',
    type: 'patch',
    title: 'Placeholder-thema\'s: dode wizard-imports verwijderd + CMS inline bewerken',
    modules: ['Platform'],
    changes: [
      'wizard-configs.ts: dead imports voor bio-agents, verlichting, trillingen en straling wizards verwijderd — vervangen door lege stub-configs. Wizard-bestanden blijven bewaard als draft voor toekomstige implementatie.',
      'wizardConfigs export-shim verwijderd (was nergens geïmporteerd).',
      'InvestigationPlaceholder: InlineEdit toegevoegd voor paginatitel en -beschrijving; ThemeLegalInfo ontvangt nu ook namespace + contentOverrides.',
      'Placeholder-pagina\'s (bio-agents, verlichting, trillingen, straling): geconverteerd naar async server components; fetchen theme.{slug} en theme-legal.{slug} content — admin kan titels en beschrijvingen nu inline bewerken.',
    ],
  },
  {
    version: '0.18.8',
    date: '2026-03-05',
    type: 'patch',
    title: 'Deduplicatie: gedeelde InvestigationThemePage layout voor de 4 modules',
    modules: ['Platform'],
    changes: [
      'Nieuw: components/InvestigationThemePage.tsx — gedeelde server-component voor de layout van alle onderzoeksmodule-pagina\'s (back-link, header, icon, InlineEdit-titel, InlineEdit-beschrijving, ThemeLegalInfo).',
      'app/themes/sound, hazardous-substances, physical-load en climate page.tsx gereduceerd van 107 naar ~45 regels elk — alleen unieke metadata, fallback-strings en de module-app-component blijven per pagina.',
    ],
  },
  {
    version: '0.18.7',
    date: '2026-03-05',
    type: 'patch',
    title: 'Efficiëntie: DB-aggregaat tellling onderzoeken + gedeelde fmtFullName helper',
    modules: ['Platform'],
    changes: [
      'Admin gebruikerslijst: onderzoeken worden nu via DB COUNT-aggregaat geteld i.p.v. alle rijen op te halen — minder dataoverdracht bij grote datasets.',
      'fmtFullName() geëxtraheerd naar lib/utils.ts — was gedupliceerd in admin/page.tsx en admin/users/[id]/page.tsx.',
    ],
  },
  {
    version: '0.18.6',
    date: '2026-03-05',
    type: 'patch',
    title: 'Code-kwaliteit: gedeelde auth-helper, dode imports, revalidateTag-fix',
    modules: ['Platform'],
    changes: [
      'requireAdmin() geëxtraheerd naar lib/auth.ts — centrale definitie voor alle API-routes (was 4× gedupliceerd).',
      'generateStaticParams in app/themes/[slug]/page.tsx geeft nu [] terug — alle thema\'s hebben eigen pagina\'s, fallback-route heeft geen statische params nodig.',
      'Ongebruikte ReactMarkdown-import verwijderd uit app/privacy/page.tsx.',
      'revalidateTag(\'content\', {}) hersteld — tweede argument is vereist in Next.js 16 (CacheLifeConfig).',
    ],
  },
  {
    version: '0.18.5',
    date: '2026-03-05',
    type: 'patch',
    title: 'Admin Content-sectie verwijderd — opruimen dode code',
    modules: ['Platform'],
    changes: [
      'Volledige /admin/content-sectie (7 pagina\'s) verwijderd — alle bewerkfunctionaliteit is al inline op de betreffende pagina\'s beschikbaar.',
      'Verwijderd: editor-componenten PlainEditor, TextareaEditor, MarkdownEditor (niet meer in gebruik).',
      'Verwijderd: AdminEditButton-component (was al dode code — nergens geïmporteerd).',
      'AdminNav: "Content"-tab verwijderd; navigatiebalk toont nu "Gebruikers" en "Afkortingen".',
    ],
  },
  {
    version: '0.18.4',
    date: '2026-03-05',
    type: 'patch',
    title: 'Veiligheidsfixes: datalek onderzoeken + inputvalidatie + AdminNav',
    modules: ['Platform'],
    changes: [
      'Fix: GET /api/investigations/[id] filtert nu op user_id — onderzoeken van andere gebruikers waren opvraagbaar voor ingelogde gebruikers.',
      'Fix: POST /api/investigations valideert nu het type-veld (toegestaan: hazardous, sound, physical, climate), het id-formaat (UUID) en de naamlengte (max 500); updated_at wordt altijd server-side gegenereerd.',
      'Fix: AdminNav wordt nu ingeladen in admin/layout.tsx — navigatietabs Gebruikers, Content en Afkortingen zijn nu zichtbaar op alle beheerpagina\'s.',
    ],
  },
  {
    version: '0.18.3',
    date: '2026-03-05',
    type: 'patch',
    title: 'Afkortingenbeheer — eigen afkortingen toevoegen en beheren via admin',
    modules: ['Platform'],
    changes: [
      'Nieuwe beheerpagina /admin/abbreviations: eigen afkortingen toevoegen, bewerken en verwijderen.',
      'Eigen afkortingen worden via React Context gemerged met de hardcoded tabel — beschikbaar voor [[abbr:ID]]-markers in alle CMS-tekstvelden.',
      'Navigatie: link in hamburgermenu + tab in AdminNav.',
      'Overzicht van alle standaard (hardcoded) afkortingen als referentie — overschreven entries krijgen badge.',
    ],
  },
  {
    version: '0.18.2',
    date: '2026-03-05',
    type: 'patch',
    title: '[[abbr:ID]]-marker voor afkortingen in CMS-tekstvelden',
    modules: ['Platform'],
    changes: [
      '[[abbr:CMR]] rendert automatisch <abbr title="…"> via de gedeelde ABBR_TITLES-tabel — geen HTML meer nodig.',
      '[[abbr:OELV:Eigen omschrijving]] voor een afwijkende toelichting.',
      'InlineEdit-hint toont de abbr-markersyntax.',
    ],
  },
  {
    version: '0.18.1',
    date: '2026-03-05',
    type: 'patch',
    title: 'HTML-tags (abbr) en betere voorinvulling in inline CMS-velden',
    modules: ['Platform'],
    changes: [
      'MarkdownContent ondersteunt nu rauwe HTML via rehype-raw — <abbr title="voluit">afkorting</abbr> werkt in alle bewerkbare tekstvelden.',
      'Bewerkingsveld toont nu de huidige live-tekst als beginwaarde (i.p.v. leeg) wanneer er nog geen DB-override bestaat.',
      'InlineEdit-hint uitgebreid met abbr-voorbeeld.',
    ],
  },
  {
    version: '0.18.0',
    date: '2026-03-05',
    type: 'minor',
    title: 'Inline bewerkbare staptitels, beschrijvingen en InfoBox-inhoud in alle onderzoeksmodules',
    modules: ['Geluid', 'Gevaarlijke stoffen', 'Fysieke belasting', 'Klimaat'],
    changes: [
      'Staptitels, intro-beschrijvingen en InfoBox-inhoud zijn nu inline bewerkbaar in alle 4 onderzoeksmodules (47 stapcomponenten).',
      'Admin: hover boven staptitel of beschrijving → potloodje → bewerk direct op de pagina.',
      'Nieuwe InlineStepHeader-component herbruikbaar voor h2-titels in alle stap-componenten.',
      'Namespaces: investigation.sound, investigation.hazardous-substances, investigation.physical-load, investigation.climate.',
      'Shell-headers tonen ook de bewerkbare staptitel (InlineEdit op de stap-nummerbalk).',
      'Bij InfoBox-override: markdown-rendering; bij geen override: originele JSX-opmaak (Abbr, Formula, SectionRef) als fallback.',
    ],
  },
  {
    version: '0.17.0',
    date: '2026-03-05',
    type: 'minor',
    title: 'Volledig inline CMS — alle teksten direct op de pagina bewerkbaar',
    modules: ['Platform'],
    changes: [
      'Wettelijk kader & normen bij thema\'s zijn nu per sectie inline bewerkbaar (potloodje per sectie: wetgeving, normen, grenswaarden, beheersverplichtingen).',
      'Wizardteksten (staptitels, beschrijvingen, vraagopties) inline bewerkbaar via uitvouwbaar bewerkpaneel per stap.',
      'Privacyverklaring inline bewerkbaar als markdown direct op /privacy.',
      'Versiehistorie (changelog) inline bewerkbaar op /over via admin-toggle.',
      'AdminEditButton-component volledig verwijderd — geen doorverwijzingen naar aparte beheerroutes meer.',
    ],
  },
  {
    version: '0.16.2',
    date: '2026-03-05',
    type: 'patch',
    title: 'Admin contentbeheer-tab verwijderd',
    modules: ['Platform'],
    changes: [
      'Content-tab verwijderd uit het admin-paneel — alle teksten zijn nu inline bewerkbaar direct op de pagina.',
      'Admin-layout vereenvoudigd: tabnavigatie verwijderd (niet meer nodig met één sectie).',
    ],
  },
  {
    version: '0.16.1',
    date: '2026-03-05',
    type: 'patch',
    title: 'Homepage ondertitel inline bewerkbaar',
    modules: ['Platform'],
    changes: [
      'Homepage ondertitel ("Kennisplatform voor...") is nu inline bewerkbaar voor admins via namespace page.home, key subtitle.',
      'Uitgelogde gebruikers zien de actuele (DB-)tekst; de standaardtekst dient als fallback.',
    ],
  },
  {
    version: '0.16.0',
    date: '2026-03-05',
    type: 'minor',
    title: 'Inline bewerken op homepage-themakaarten + markdown in beschrijvingen',
    modules: ['Platform'],
    changes: [
      'Nieuw: HomeThemesGrid-component — admins zien potloodje op naam en beschrijving van elke themakaart op de homepage; bewerken direct op de pagina zonder doorverwijzing.',
      'Niet-admins zien de homepage ongewijzigd: themakaarten zijn volledig klikbaar als Link.',
      'Alle vier thema-paginabeschrijvingen (geluid, klimaat, fysieke belasting, gevaarlijke stoffen) renderen nu als markdown via MarkdownContent.',
      'InlineEdit-velden voor beschrijvingen hebben nu markdown-prop: admin ziet syntaxhint bij bewerken.',
      'Bugfix: sound/page.tsx — onjuiste ReactMarkdown/renderWithFormulas-aanroep vervangen door MarkdownContent.',
    ],
  },
  {
    version: '0.15.2',
    date: '2026-03-05',
    type: 'patch',
    title: 'Inline bewerken direct op de pagina',
    modules: ['Platform'],
    changes: [
      'Nieuw: InlineEdit-component — hover over bewerkbare tekst en klik het potloodje om direct op de pagina te wijzigen.',
      'Thema-pagina\'s (geluid, klimaat, fysieke belasting, gevaarlijke stoffen): titel en beschrijving inline bewerkbaar via namespace theme.{slug}, keys pageTitle en pageDesc.',
      'Generieke thema-pagina (/themes/[slug]): naam en intro inline bewerkbaar.',
      'Na opslaan: router.refresh() herlaadt de server-data zonder volledige herlaad van de pagina.',
      'Nieuw: lib/render-with-formulas.tsx — gedeelde [[formule]]-rendering voor server- en client-componenten.',
      'ThemeLegalInfo importeert renderWithFormulas nu uit gedeelde lib.',
    ],
  },
  {
    version: '0.15.1',
    date: '2026-03-05',
    type: 'patch',
    title: 'Admin potloodje op alle bewerkbare UI-elementen',
    modules: ['Platform'],
    changes: [
      'AdminEditButton (potloodje) toegevoegd naast alle bewerkbare koppen en secties voor admins.',
      'ThemeLegalInfo: adminEditHref prop + potloodje in de inklapbare header.',
      'ThemeWizard: potloodje in de progress-header naast de thema-naam.',
      'Specifieke thema-pagina\'s (geluid, klimaat, fysieke belasting, gevaarlijke stoffen): potloodje naast de h1.',
      'Generieke thema-pagina (/themes/[slug]): potloodje naast de h1.',
    ],
  },
  {
    version: '0.15.0',
    date: '2026-03-05',
    type: 'minor',
    title: 'Admin CMS — webteksten bewerken zonder deployment',
    modules: ['Platform'],
    changes: [
      'Nieuw: content-tabel in Supabase met namespace/key/value/ctype en RLS (alleen admin mag schrijven).',
      'Nieuw: lib/content.ts — getNamespaceContent() en getContent() met Next.js unstable_cache en tag "content".',
      'Nieuw: API-route GET/PUT/DELETE /api/admin/content met admin-authenticatie en revalidateTag na mutatie.',
      'Nieuw: Admin tab-navigatie — "Gebruikers" en "Content" als horizontale tabs in de admin-layout.',
      'Nieuw: /admin/content — overzichtspagina met drie categorieën: Pagina\'s, Thema\'s, Wizards.',
      'Nieuw: /admin/content/pages — Privacyverklaring (MarkdownEditor) en Changelog (ChangelogEditor).',
      "Nieuw: /admin/content/themes — naam, beschrijving en intro per thema met PlainEditor/TextareaEditor.",
      "Nieuw: /admin/content/themes/[slug]/legal — wetgeving, normen, grenswaarden en administratieve verplichtingen.",
      'Nieuw: /admin/content/wizards + /admin/content/wizards/[slug] — WizardEditor met boom-view: stap → vraag → optie.',
      'Integratie: privacy/page.tsx laadt body uit DB; fallback naar hardcoded JSX.',
      'Integratie: over/page.tsx laadt changelog-array uit DB; fallback naar hardcoded array.',
      'Integratie: app/page.tsx laadt thema-naam/beschrijving uit DB.',
      'Integratie: ThemeLegalInfo accepteert contentOverrides prop; alle vier thema-pagina\'s laden legal-overrides.',
      'Integratie: ThemeWizard accepteert contentOverrides prop; applyWizardOverrides() past stap/vraag/optie-teksten toe.',
      'Installatie: react-markdown voor MarkdownEditor preview en privacy-rendering.',
    ],
  },
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

// ── Fallback strings (used when no DB override exists) ────────────────────────

const FB_SUBTITLE =
  'Kennisplatform voor arbeidshygiënisten, hogere veiligheidskundigen en ' +
  '[[abbr:AO:Arbeids- en Organisatiedeskundige]]-deskundigen. ' +
  'Onderzoeksgegevens worden beveiligd opgeslagen in de cloud. ' +
  'Inloggen is vereist voor toegang.';

const FB_DEV_DESC =
  'OHSHub wordt ontwikkeld door **DiversiThijs**, gevestigd te Breedenbroek. ' +
  'Het platform is ontstaan vanuit de praktijk: een behoefte aan toegankelijke, ' +
  'gestructureerde ondersteuning bij arbeidshygiënisch onderzoek conform de ' +
  'geldende wet- en regelgeving en normen.';

const FB_DISCLAIMER_TITLE = 'Vroege ontwikkelfase — maak altijd een eigen back-up';

const FB_DISCLAIMER_BODY =
  'OHSHub is volop in ontwikkeling. In deze fase kan niet worden gegarandeerd dat ' +
  'opgeslagen onderzoeken bewaard blijven bij updates of technische problemen. ' +
  'Zorg daarom altijd voor een eigen back-up via de exportfunctie (JSON) binnen een onderzoek. ' +
  'De ontwikkelaar aanvaardt geen aansprakelijkheid voor verlies van gegevens.';

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function OverPage() {
  const content = await getNamespaceContent('page.over');
  const changelogRaw = content['changelog'] ?? '';
  let activeChangelog = CHANGELOG;
  if (changelogRaw) {
    try {
      activeChangelog = JSON.parse(changelogRaw);
    } catch { /* use hardcoded */ }
  }
  const CURRENT_VERSION = activeChangelog[0]?.version ?? HARDCODED_VERSION;

  const subtitle         = content['subtitle'];
  const devDesc          = content['developer.description'];
  const devKvk           = content['developer.kvk'] ?? '92899943';
  const devCity          = content['developer.city'] ?? 'Breedenbroek';
  const devEmail         = content['developer.email'] ?? 'info@diversithijs.nl';
  const disclaimerTitle  = content['disclaimer.title'] ?? FB_DISCLAIMER_TITLE;
  const disclaimerBody   = content['disclaimer.body'];

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
        <InlineEdit namespace="page.over" contentKey="subtitle"
          initialValue={subtitle ?? FB_SUBTITLE} fallback={FB_SUBTITLE} multiline markdown>
          {subtitle
            ? <MarkdownContent className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">{subtitle}</MarkdownContent>
            : (
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
            )
          }
        </InlineEdit>
      </div>

      {/* Over de ontwikkelaar */}
      <section className="mb-10">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Over de ontwikkelaar
        </h2>
        <div className="mb-3">
          <InlineEdit namespace="page.over" contentKey="developer.description"
            initialValue={devDesc ?? FB_DEV_DESC} fallback={FB_DEV_DESC} multiline markdown>
            {devDesc
              ? <MarkdownContent className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{devDesc}</MarkdownContent>
              : (
                <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  OHSHub wordt ontwikkeld door <strong className="text-zinc-800 dark:text-zinc-200">DiversiThijs</strong>, gevestigd te Breedenbroek. Het platform is ontstaan vanuit de praktijk: een behoefte aan toegankelijke, gestructureerde ondersteuning bij arbeidshygiënisch onderzoek conform de geldende wet- en regelgeving en normen.
                </p>
              )
            }
          </InlineEdit>
        </div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-sm">
          <dt className="text-zinc-400 dark:text-zinc-500">
            <abbr title="Kamer van Koophandel" className="cursor-help underline decoration-dotted decoration-zinc-400 underline-offset-2">KvK</abbr>
          </dt>
          <dd className="text-zinc-700 dark:text-zinc-300">
            <InlineEdit namespace="page.over" contentKey="developer.kvk"
              initialValue={devKvk} fallback="92899943">
              {devKvk}
            </InlineEdit>
          </dd>
          <dt className="text-zinc-400 dark:text-zinc-500">Vestigingsplaats</dt>
          <dd className="text-zinc-700 dark:text-zinc-300">
            <InlineEdit namespace="page.over" contentKey="developer.city"
              initialValue={devCity} fallback="Breedenbroek">
              {devCity}
            </InlineEdit>
          </dd>
          <dt className="text-zinc-400 dark:text-zinc-500">E-mail</dt>
          <dd>
            <InlineEdit namespace="page.over" contentKey="developer.email"
              initialValue={devEmail} fallback="info@diversithijs.nl">
              <a href={`mailto:${devEmail}`} className="text-orange-500 hover:underline">
                {devEmail}
              </a>
            </InlineEdit>
          </dd>
          <dt className="text-zinc-400 dark:text-zinc-500">Privacyverklaring</dt>
          <dd>
            <Link href="/privacy" className="text-orange-500 hover:underline">
              /privacy
            </Link>
          </dd>
          <dt className="text-zinc-400 dark:text-zinc-500">Disclaimer</dt>
          <dd>
            <Link href="/disclaimer" className="text-orange-500 hover:underline">
              /disclaimer
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
          <div className="min-w-0 flex-1">
            <InlineEdit namespace="page.over" contentKey="disclaimer.title"
              initialValue={disclaimerTitle} fallback={FB_DISCLAIMER_TITLE}>
              <p className="mb-1 text-sm font-semibold text-amber-800 dark:text-amber-300">
                {disclaimerTitle}
              </p>
            </InlineEdit>
            <InlineEdit namespace="page.over" contentKey="disclaimer.body"
              initialValue={disclaimerBody ?? FB_DISCLAIMER_BODY} fallback={FB_DISCLAIMER_BODY}
              multiline>
              {disclaimerBody
                ? <p className="text-sm leading-relaxed text-amber-700 dark:text-amber-400">{disclaimerBody}</p>
                : (
                  <p className="text-sm leading-relaxed text-amber-700 dark:text-amber-400">
                    OHSHub is volop in ontwikkeling. In deze fase kan niet worden gegarandeerd dat opgeslagen onderzoeken bewaard blijven bij updates of technische problemen. Zorg daarom altijd voor een eigen back-up via de exportfunctie (JSON) binnen een onderzoek. De ontwikkelaar aanvaardt geen aansprakelijkheid voor verlies van gegevens.
                  </p>
                )
              }
            </InlineEdit>
          </div>
        </div>
      </section>

      {/* Changelog */}
      <section>
        <div className="mb-6 flex items-center gap-2">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Versiehistorie
          </h2>
        </div>

        <div className="relative border-l-2 border-zinc-200 pl-6 dark:border-zinc-800">
          {activeChangelog.map((release, i) => (
            <div key={release.version} className={`relative pb-10 ${i === activeChangelog.length - 1 ? 'pb-0' : ''}`}>
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

        <InlineChangelogEditor initialEntries={activeChangelog} />
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
