# OHSHub — Kennisbank

Referentiedocumenten voor de theoretische onderbouwing van het onderzoeksinstrument gevaarlijke stoffen.
Alle bestanden in deze map zijn leesbaar via het `Read`-gereedschap.

---

## Bestanden

### `NEN-EN 689_2018+C1_2019 en.pdf`
**NEN-EN 689:2018+C1:2019 / EN 689:2018+AC:2019**
Workplace exposure — Measurement of exposure by inhalation to chemical agents — Strategy for testing compliance with occupational exposure limit values.
Vervangt NEN-EN 689:2018. Gepubliceerd april 2019 (Corrigendum 1).

| Hoofdstuk | Onderwerp |
|-----------|-----------|
| §5.1 | Basiskarakterisering: stofidentificatie, werkplekinventarisatie, blootstellingsschatting, beslissing tot meten |
| §5.2 | Meetstrategie: opstellen SEG's (Similar Exposure Groups), meetprocedure specificeren |
| §5.3 | Uitvoeren van metingen (worst-case strategie) |
| §5.4 | Validatie van meetresultaten en SEG's |
| §5.5 | Vergelijking met OELV's: voorlopige toets (§5.5.2) en statistische toets (§5.5.3) |
| §6 | Rapportage-eisen |
| §7 | Periodieke herbeoordeling |
| Bijlage A | Beoordelingsscenario's (constante condities, incidentele blootstelling, buitenlucht, etc.) |
| Bijlage B | OELV's voor compliance-toetsing |
| Bijlage C | Gelijktijdige blootstelling aan meerdere stoffen (Tier-1 index I_E, additief I_AE) |
| Bijlage D | Blootstellingsprofiel en bemonsteringsduur (8u-TGG en STEL) |
| Bijlage E | Controle op log-normale verdeling; uitzonderlijke blootstelling binnen SEG |
| Bijlage F | Statistische compliance-toets (≥6 metingen; GM, GSD, P95, beslissingsregels) |
| Bijlage G | Blootstellingsberekening bij dienst > 8 uur |
| Bijlage H | Metingen onder de detectiegrens (LOQ) |
| Bijlage I | Interval voor periodieke metingen |

**Relevantie voor OHSHub:**
- Basis voor de statistische analyse in `lib/measurement-stats.ts` (GM, GSD, P95, oordeel aanvaardbaar/onzeker/niet-aanvaardbaar)
- Bron voor het SEG-concept in stap 5 van het onderzoeksinstrument
- Bijlage F definieert de beslissingsregels die in `computeStats()` zijn geïmplementeerd
- §5.1 onderbouwt de basiskarakterisering (stap 2–4 in de wizard gevaarlijke stoffen)

---

### `🦺 Chemische factoren (arbeidshygiëne).pdf`
**Collegeaantekeningen — Chemische factoren (arbeidshygiëne)**
Uitgebreide college-uitwerking voor het vak arbeidshygiëne, chemische factoren.

| Sectie | Inhoud |
|--------|--------|
| Inleiding | Mortaliteit NL (~3.000/jaar), CLP-indeling, ADR |
| Wet-/regelgeving | Arbowet art. 3, Arbobesluit (zorgplicht, ARIE, ATEX, RI&E, AHS), REACH (EG 1907/2006), CLP (EG 1272/2008) |
| Normen | NEN-EN 689, NEN-EN 481, NEN-EN 482, NEN-EN 1560 |
| Handelingskader | Inventarisatie → beoordelen → maatregelen → borging (NLA Zelfinspectie) |
| Voorbeeld rapportage | Structuur: managementsamenvatting, inventarisatie, beoordeling, maatregelen, borging, bijlagen |
| Risicobeoordeling | Gevaar ≠ risico; toxicologische eindpunten; GHS/CLP H-zinnen |
| Acute effecten | LD50, LC50, ATE (GHS), "hoe lager hoe giftiger" / "hoe hoger hoe giftiger" |
| Lange termijn | Grenswaarde, drempelwaarde, NAEL, NOAEL |
| Andere effecten | Endocriene disruptors (VO 2023/707), ototoxiciteit (H317, H334) |
| CMR-categorieën | Mutageen (H340/H341), carcinogeen (H350/H351), reproductietoxisch (H360/H361/H362) — cat 1A/1B/2 |
| Wijze van blootstelling | Inhalatie (1.250 L/u), percutaan/dermaal, ingestie; lokale vs. systemische effecten |
| Deeltjesgrootteverdeling | Inhaleerbare/thoracale/respirabele fractie (tabel + NEN-EN 481-grafiek) |
| Etiketten & gevaren | GHS01–GHS09 pictogrammen, signaalwoorden GEVAAR/WAARSCHUWING, H-zinnen, P-zinnen |

**Relevantie voor OHSHub:**
- Onderbouwing van het CMR-concept en de categorie-indeling (1A/1B/2) die in `Step2_Substances.tsx` wordt gebruikt
- Bron voor de H-statement logica (welke H-zinnen leiden tot welke gevaarsklasse)
- Handelingskader sluit aan op de 10-staps structuur van het onderzoeksinstrument
- Rapportagestructuur is de basis voor `lib/pdf-html.ts` (volgorde secties)
- Definities van grenswaarde/drempelwaarde/NOAEL onderbouwen het OELV-veld en de tier-1 beoordeling
- Deeltjesgrootteverdeling relevant voor de stofvraag (inhaleerbaar vs. respirabel) in de blootstellingsschatting

---

## Hoe te gebruiken

Verwijs in een prompt naar het bestand, bijv.:

> "Lees bijlage F van de NEN-EN 689 en controleer of de beslissingsregels in `lib/measurement-stats.ts` correct zijn geïmplementeerd."

> "Welke rapportage-eisen stelt §6 van de NEN-EN 689 en mist `lib/pdf-html.ts` nog iets?"

Claude leest de PDF's via het `Read`-gereedschap (per pagina-bereik).

---

## Gerelateerde bronbestanden in het project

| Bestand | Verband met kennisbank |
|---------|----------------------|
| `lib/measurement-stats.ts` | Implementeert NEN-EN 689 Bijlage F (GM, GSD, P95, oordeel) |
| `lib/pdf-html.ts` | Rapportagestructuur conform collegeaantekeningen + §6 NEN-EN 689 |
| `components/investigation/steps/Step2_Substances.tsx` | CMR-categorieën, H-zinnen, OEL-typen |
| `components/investigation/steps/Step5_SEGs.tsx` | SEG-concept conform NEN-EN 689 §5.2 |
| `data/oels/` | SZW-grenswaardelijst en EU-OEL's |
