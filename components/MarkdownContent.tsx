'use client';

import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import { Fragment } from 'react';
import { Formula } from '@/components/Formula';
import { useAbbrTitles } from '@/components/AbbrProvider';

interface Props {
  children: string;
  className?: string;
}

/**
 * Rendert tekst als volledig markdown met formule- en afkortingsmarkers.
 *
 * ✅ Ondersteunt markdown: **vet**, *cursief*, - lijsten, > citaat, ### koppen.
 * ✅ Ondersteunt `[[LaTeX]]`-formule-markers (via KaTeX).
 * ✅ Ondersteunt `[[abbr:ID]]` en `[[abbr:ID:eigen titel]]`-afkortingsmarkers.
 * ❌ Client-only ('use client') — NIET bruikbaar in server-components zonder client-grens.
 * ❌ Vereist `<AbbrProvider>` in de component-tree (staat in app/layout.tsx).
 *
 * Gebruik dit wanneer:
 * - De tekst via InlineEdit/CMS is bewerkt en mogelijk markdown of markers bevat.
 * - Je rijke opmaak nodig hebt (koppen, lijsten, vet/cursief).
 *
 * Gebruik `renderWithFormulas()` wanneer je alleen formule-markers nodig hebt
 * en de component server-side mag blijven (bijv. hardcoded datastrings).
 */
export default function MarkdownContent({ children, className }: Props) {
  const abbrTitles = useAbbrTitles();

  /**
   * Verwerkt [[LaTeX]]- en [[abbr:ID]]- / [[abbr:ID:eigen titel]]-markers binnen een tekst-node.
   */
  function processText(text: string): React.ReactNode {
    const parts = text.split(/(\[\[[^\]]+\]\])/);
    if (parts.length === 1) return text;
    return (
      <>
        {parts.map((part, i) => {
          const match = part.match(/^\[\[(.+)\]\]$/);
          if (!match) return part;
          const inner = match[1];

          // [[abbr:ID]] of [[abbr:ID:Custom title]]
          const abbrMatch = inner.match(/^abbr:([^:]+)(?::(.+))?$/);
          if (abbrMatch) {
            const id = abbrMatch[1].trim();
            const title = abbrMatch[2]?.trim() ?? abbrTitles[id] ?? id;
            return (
              <abbr
                key={i}
                title={title}
                className="cursor-help underline decoration-dotted decoration-zinc-400 underline-offset-2 [font-variant:normal]"
              >
                {id}
              </abbr>
            );
          }

          // [[LaTeX]] formule
          return <Formula key={i} math={inner} />;
        })}
      </>
    );
  }

  /**
   * Loopt recursief door React-children en verwerkt formula/abbr-markers in strings.
   */
  function withFormulas(node: React.ReactNode): React.ReactNode {
    if (typeof node === 'string') return processText(node);
    if (Array.isArray(node)) {
      return node.map((child, i) => <Fragment key={i}>{withFormulas(child)}</Fragment>);
    }
    return node;
  }

  const mdComponents: Components = {
    h1: ({ children: c }) => <h1 className="mb-4 mt-8 text-2xl font-bold text-zinc-900 dark:text-zinc-50 first:mt-0">{withFormulas(c)}</h1>,
    h2: ({ children: c }) => <h2 className="mb-3 mt-8 text-lg font-semibold text-zinc-900 dark:text-zinc-50 first:mt-0">{withFormulas(c)}</h2>,
    h3: ({ children: c }) => <h3 className="mb-2 mt-6 text-base font-semibold text-zinc-800 dark:text-zinc-100 first:mt-0">{withFormulas(c)}</h3>,
    p: ({ children: c }) => <p className="mb-4 leading-relaxed last:mb-0">{withFormulas(c)}</p>,
    ul: ({ children }) => <ul className="mb-4 pl-6 list-disc space-y-1">{children}</ul>,
    ol: ({ children }) => <ol className="mb-4 pl-6 list-decimal space-y-1">{children}</ol>,
    li: ({ children: c }) => <li className="leading-relaxed">{withFormulas(c)}</li>,
    a: ({ href, children }) => (
      <a href={href} className="text-orange-500 hover:underline" target={href?.startsWith('http') ? '_blank' : undefined} rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}>
        {children}
      </a>
    ),
    strong: ({ children: c }) => <strong className="font-semibold text-zinc-900 dark:text-zinc-100">{withFormulas(c)}</strong>,
    em: ({ children: c }) => <em className="italic">{withFormulas(c)}</em>,
    blockquote: ({ children }) => <blockquote className="my-4 border-l-4 border-zinc-300 pl-4 text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">{children}</blockquote>,
    hr: () => <hr className="my-8 border-zinc-200 dark:border-zinc-800" />,
    table: ({ children }) => (
      <div className="my-4 overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="min-w-full border-collapse text-sm">{children}</table>
      </div>
    ),
    thead: ({ children }) => <thead className="bg-zinc-50 dark:bg-zinc-800/60">{children}</thead>,
    tbody: ({ children }) => <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">{children}</tbody>,
    tr: ({ children }) => <tr className="transition-colors hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30">{children}</tr>,
    th: ({ children: c }) => <th className="whitespace-nowrap px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{withFormulas(c)}</th>,
    td: ({ children: c }) => <td className="px-4 py-2.5 align-top text-zinc-700 dark:text-zinc-300">{withFormulas(c)}</td>,
  };

  return (
    <div className={className}>
      <ReactMarkdown components={mdComponents} rehypePlugins={[rehypeRaw]} remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}
