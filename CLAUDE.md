# OHSHub — Claude-instructies

## Versiebeheer

Na **elke** wijziging die zichtbaar is voor gebruikers (UI, berekeningen, data, routing):
1. Open `app/over/page.tsx`
2. Verhoog `CURRENT_VERSION` volgens semver (`MAJOR.MINOR.PATCH`)
3. Voeg een regel toe aan de changelog-array met datum en korte omschrijving

Kleine fixes/typo's → patch (`0.x.y+1`).
Nieuwe functionaliteit → minor (`0.x+1.0`).
Nooit vragen of dit gedaan moet worden — gewoon doen.

---

## Formules, markdown en afkortingen

Alle wiskundige notatie altijd via KaTeX. Nooit plain tekst (`L_EX,8h`, Unicode-subscripts).

| Situatie | Gebruik |
|---|---|
| Hardcoded tekst in een **server-component** | `<Formula math="L_{EX,8h}" />` |
| Hardcoded **datastring** met formule-marker | `renderWithFormulas('Norm [[L_{EX,8h}]]')` — server-safe |
| **CMS-bewerkte** tekst (markdown + formules + afkortingen) | `<MarkdownContent>` — client-only, vereist `AbbrProvider` |

**Marker-syntax** (voor strings die door `renderWithFormulas` of `MarkdownContent` lopen):
- Formule: `[[L_{EX,8h}]]`
- Afkorting: `[[abbr:CMR]]` of `[[abbr:CMR:Carcinogeen, Mutageen of Reprotoxisch]]`

**Afkortingen in JSX** — altijd omhullen met `<abbr title="...">`:
```tsx
<abbr title="Carcinogeen, Mutageen of Reprotoxisch"
      className="cursor-help underline decoration-dotted decoration-zinc-400 underline-offset-2">
  CMR
</abbr>
```

---

## Kennisbank

Normen en referentiedocumenten staan in `knowledge/<thema>/`.
Bij featurewerk aan een thema: lees de relevante norm(en) via het `Read`-gereedschap als de gebruiker daarnaar verwijst of als normconformiteit relevant is.
