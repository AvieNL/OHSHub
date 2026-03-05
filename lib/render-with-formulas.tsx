import { Formula } from '@/components/Formula';

/**
 * Rendert `[[LaTeX]]`-markers in een string als KaTeX-formules.
 *
 * ✅ Server- én client-compatible (geen 'use client' vereist).
 * ✅ Snel — geen markdown-parser, geen React-context nodig.
 * ❌ Ondersteunt GEEN markdown-opmaak.
 * ❌ Ondersteunt GEEN `[[abbr:ID]]`-afkortingsmarkers.
 *
 * Gebruik dit wanneer:
 * - Je een hardcoded datastring hebt (bijv. in lib/theme-legal-info.ts) met formule-markers.
 * - De component een server-component is (of AbbrProvider-context ontbreekt).
 *
 * Gebruik `<MarkdownContent>` wanneer je ook markdown-opmaak of [[abbr:ID]]-markers
 * nodig hebt, bijv. voor CMS-bewerkte tekst.
 *
 * @example 'Dagblootstelling [[L_{EX,8h}]] — art. 6.5'
 */
export function renderWithFormulas(text: string) {
  const parts = text.split(/(\[\[[^\]]+\]\])/);
  if (parts.length === 1) return text;
  return (
    <>
      {parts.map((part, i) => {
        const match = part.match(/^\[\[(.+)\]\]$/);
        return match ? <Formula key={i} math={match[1]} /> : part;
      })}
    </>
  );
}
