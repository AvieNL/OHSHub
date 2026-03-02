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

## Formules en wiskunde

Alle wiskundige notatie in de UI altijd via KaTeX renderen.

**In JSX/TSX (componenten en pagina's):**
```tsx
import { Formula } from '@/components/Formula';
<Formula math="L_{EX,8h}" />
```

**In datastrings (bijv. `lib/theme-legal-info.ts`) die via `renderWithFormulas()` lopen:**
```ts
'Dagblootstelling [[L_{EX,8h}]] — art. 6.5'
```
De `[[...]]`-markers worden door `renderWithFormulas()` in `components/ThemeLegalInfo.tsx` omgezet naar `<Formula>`-elementen.

Nooit plain tekst gebruiken voor formules (geen `L_EX,8h`, geen Unicode-subscripts).

---

## Afkortingen

Alle afkortingen in de UI omhullen met `<abbr title="...">` (of de projecteigen `<Abbr>`-component).
Styling: `className="cursor-help underline decoration-dotted decoration-zinc-400 underline-offset-2"`.

---

## Kennisbank

Normen en referentiedocumenten staan in `knowledge/<thema>/`.
Bij featurewerk aan een thema: lees de relevante norm(en) via het `Read`-gereedschap als de gebruiker daarnaar verwijst of als normconformiteit relevant is.
