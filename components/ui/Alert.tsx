import type { ReactNode } from 'react';

export type AlertVariant = 'warning' | 'error' | 'success' | 'info' | 'orange' | 'neutral';
export type AlertSize    = 'sm' | 'md';

const VARIANTS: Record<AlertVariant, string> = {
  warning: 'border-amber-200   bg-amber-50   text-amber-700   dark:border-amber-800/30  dark:bg-amber-900/10  dark:text-amber-400',
  error:   'border-red-200     bg-red-50     text-red-700     dark:border-red-800/50    dark:bg-red-900/15    dark:text-red-400',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/30 dark:bg-emerald-900/15 dark:text-emerald-400',
  info:    'border-blue-200    bg-blue-50    text-blue-700    dark:border-blue-800/50   dark:bg-blue-900/15   dark:text-blue-300',
  orange:  'border-orange-200  bg-orange-50  text-orange-700  dark:border-orange-800/40 dark:bg-orange-900/15 dark:text-orange-400',
  neutral: 'border-zinc-200    bg-zinc-50    text-zinc-600    dark:border-zinc-700      dark:bg-zinc-800/50   dark:text-zinc-400',
};

const SIZES: Record<AlertSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-3 text-sm',
};

interface AlertProps {
  variant?:  AlertVariant;
  size?:     AlertSize;
  className?: string;
  children:  ReactNode;
}

/**
 * Inline alert banner.
 *
 * @example
 * <Alert variant="warning">Kalibratie verouderd — herkeuring aanbevolen.</Alert>
 * <Alert variant="error" size="md">Grenswaarde overschreden.</Alert>
 */
export function Alert({ variant = 'warning', size = 'sm', className = '', children }: AlertProps) {
  return (
    <div
      role="alert"
      className={`rounded-lg border leading-relaxed ${VARIANTS[variant]} ${SIZES[size]} ${className}`.trim()}
    >
      {children}
    </div>
  );
}
