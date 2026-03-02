import type { InputHTMLAttributes } from 'react';

export type InputSize = 'md' | 'sm' | 'xs';

const BASE = 'border border-zinc-200 outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100';

const SIZES: Record<InputSize, string> = {
  md: 'rounded-lg px-4 py-3 text-sm',
  sm: 'rounded-lg px-3 py-1.5 text-sm',
  xs: 'rounded px-2 py-1 text-xs',
};

/** Verwijder HTML `size` attribuut (aantal zichtbare tekens) om naamconflict te vermijden */
interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: InputSize;
}

/**
 * Tekst-, getal- of datuminput met consistente opmaak.
 *
 * @example
 * <Input type="text" value={val} onChange={...} placeholder="Naam…" />
 * <Input type="number" size="sm" className="w-24" value={n} onChange={...} />
 * <Input type="date" value={date} onChange={...} />
 */
export function Input({ size = 'md', className = '', ...props }: InputProps) {
  return (
    <input
      className={`${BASE} ${SIZES[size]} ${className}`.trim()}
      {...props}
    />
  );
}
