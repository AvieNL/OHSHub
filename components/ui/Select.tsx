import type { SelectHTMLAttributes, ReactNode } from 'react';

export type SelectSize = 'md' | 'sm' | 'xs';

const BASE = 'border border-zinc-200 outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100';

const SIZES: Record<SelectSize, string> = {
  md: 'rounded-lg px-4 py-3 text-sm',
  sm: 'rounded-lg px-3 py-1.5 text-sm',
  xs: 'rounded px-2 py-1 text-xs',
};

/** Verwijder HTML `size` attribuut (zichtbare opties) om naamconflict te vermijden */
interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  size?:    SelectSize;
  children: ReactNode;
}

/**
 * Keuzelijst (dropdown) met consistente opmaak.
 *
 * @example
 * <Select value={strategy} onChange={...}>
 *   <option value="task-based">Strategie 1 — Taakgericht</option>
 * </Select>
 */
export function Select({ size = 'md', className = '', children, ...props }: SelectProps) {
  return (
    <select
      className={`${BASE} ${SIZES[size]} ${className}`.trim()}
      {...props}
    >
      {children}
    </select>
  );
}
