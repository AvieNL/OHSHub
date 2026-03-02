import type { TextareaHTMLAttributes } from 'react';

export type TextareaSize = 'md' | 'sm';

const BASE = 'w-full resize-none border border-zinc-200 outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100';

const SIZES: Record<TextareaSize, string> = {
  md: 'rounded-lg px-4 py-3 text-sm',
  sm: 'rounded-lg px-3 py-1.5 text-sm',
};

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  size?: TextareaSize;
}

/**
 * Meerregelig tekstveld met consistente opmaak.
 *
 * @example
 * <Textarea rows={3} value={notes} onChange={...} placeholder="Opmerkingen…" />
 */
export function Textarea({ size = 'md', className = '', ...props }: TextareaProps) {
  return (
    <textarea
      className={`${BASE} ${SIZES[size]} ${className}`.trim()}
      {...props}
    />
  );
}
