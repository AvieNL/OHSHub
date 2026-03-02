import type { ReactNode } from 'react';

export type BadgeVariant = 'emerald' | 'amber' | 'orange' | 'red' | 'blue' | 'zinc' | 'purple' | 'violet';
export type BadgeShape   = 'pill' | 'square';

const VARIANTS: Record<BadgeVariant, string> = {
  emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  amber:   'bg-amber-100   text-amber-700   dark:bg-amber-900/30   dark:text-amber-300',
  orange:  'bg-orange-100  text-orange-700  dark:bg-orange-900/30  dark:text-orange-400',
  red:     'bg-red-100     text-red-700     dark:bg-red-900/30     dark:text-red-400',
  blue:    'bg-blue-100    text-blue-700    dark:bg-blue-900/30    dark:text-blue-300',
  zinc:    'bg-zinc-100    text-zinc-600    dark:bg-zinc-700       dark:text-zinc-300',
  purple:  'bg-purple-100  text-purple-700  dark:bg-purple-900/30  dark:text-purple-300',
  violet:  'bg-violet-100  text-violet-700  dark:bg-violet-900/30  dark:text-violet-400',
};

const SHAPES: Record<BadgeShape, string> = {
  pill:   'rounded-full px-2.5 py-0.5',
  square: 'rounded px-1.5 py-0.5',
};

interface BadgeProps {
  variant?:  BadgeVariant;
  shape?:    BadgeShape;
  className?: string;
  children:  ReactNode;
}

/**
 * Inline status label / pill.
 *
 * @example
 * <Badge variant="red">Grenswaarde overschreden</Badge>
 * <Badge variant="emerald" shape="square">✓ Compleet</Badge>
 */
export function Badge({ variant = 'zinc', shape = 'pill', className = '', children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center text-xs font-medium ${VARIANTS[variant]} ${SHAPES[shape]} ${className}`.trim()}
    >
      {children}
    </span>
  );
}
