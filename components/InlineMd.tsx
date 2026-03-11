'use client';

import { Fragment } from 'react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Formula } from '@/components/Formula';

interface Props {
  children: string;
  className?: string;
}

/**
 * Rendert inline markdown + [[LaTeX]]-formulemakers.
 *
 * ✅ Ondersteunt **vet**, *cursief*, <u>onderstreept</u>, links (GFM + raw HTML).
 * ✅ Ondersteunt [[LaTeX]]-markers als KaTeX-formule (zelfde syntax als MarkdownContent).
 * ✅ Produceert inline output — geen <p>-blokken rondom de tekst.
 * ✅ Client-only ('use client').
 */
export default function InlineMd({ children, className }: Props) {

  function processFormulaMarkers(text: string): React.ReactNode {
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

  function withFormulas(node: React.ReactNode): React.ReactNode {
    if (typeof node === 'string') return processFormulaMarkers(node);
    if (Array.isArray(node)) {
      return node.map((child, i) => <Fragment key={i}>{withFormulas(child)}</Fragment>);
    }
    return node;
  }

  const components: Components = {
    p:      ({ children: c }) => <>{withFormulas(c)}</>,
    strong: ({ children: c }) => <strong className="font-semibold">{withFormulas(c)}</strong>,
    em:     ({ children: c }) => <em className="italic">{withFormulas(c)}</em>,
  };

  return (
    <span className={className}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={components}>
        {children}
      </ReactMarkdown>
    </span>
  );
}
