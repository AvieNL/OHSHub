/**
 * Renders a math formula using KaTeX.
 * Works in server and client components — no client-side JS required.
 *
 * Usage:
 *   <Formula math="L_{EX,8h}" />
 *   <Formula math="L_{EX,8h} = L_{EX,8h} + U" display />
 */
import katex from 'katex';

export function Formula({
  math,
  display = false,
  className,
}: {
  math: string;
  display?: boolean;
  className?: string;
}) {
  const html = katex.renderToString(math, {
    throwOnError: false,
    displayMode: display,
    output: 'html',
    strict: false,
  });
  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
