import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'dashed' | 'link';
export type ButtonSize    = 'md' | 'sm' | 'xs';

const VARIANTS: Record<ButtonVariant, string> = {
  /** Gevulde oranje knop — hoofd-actie (opslaan, bevestigen) */
  primary:
    'inline-flex items-center justify-center rounded-lg bg-orange-500 font-semibold text-white transition hover:bg-orange-600 disabled:opacity-40',
  /** Omrande neutrale knop — secundaire actie (annuleren) */
  secondary:
    'inline-flex items-center justify-center rounded-lg border border-zinc-200 font-medium text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800',
  /** Kleine omrande knop — bewerkacties (Bewerken) */
  ghost:
    'inline-flex items-center justify-center rounded border border-zinc-200 text-zinc-500 transition hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-700',
  /** Kleine omrande knop met rode hover — destructieve acties (Verwijderen) */
  danger:
    'inline-flex items-center justify-center rounded border border-zinc-200 text-zinc-500 transition hover:bg-red-50 hover:text-red-500 dark:border-zinc-700',
  /** Stippellijn brede knop — iets toevoegen */
  dashed:
    'inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 text-zinc-500 transition hover:border-orange-400 hover:text-orange-600 dark:border-zinc-600 dark:text-zinc-400 dark:hover:border-orange-500 dark:hover:text-orange-400',
  /** Inline tekstlink — navigatie naar een andere stap */
  link:
    'cursor-pointer underline decoration-dotted underline-offset-2 hover:no-underline',
};

const SIZES: Record<ButtonSize, string> = {
  md: 'px-4 py-2 text-sm',
  sm: 'px-3 py-1.5 text-xs',
  xs: 'px-2 py-1 text-xs',
};

/** Varianten waarvoor het size-systeem niet van toepassing is */
const NO_SIZE: ButtonVariant[] = ['link'];

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?:    ButtonSize;
  children: ReactNode;
}

/**
 * Knop met vaste stijlvarianten.
 *
 * @example
 * <Button variant="primary" onClick={save}>Opslaan</Button>
 * <Button variant="danger" size="xs" onClick={() => remove(id)}>Verwijderen</Button>
 * <Button variant="link" onClick={() => onGoToStep(4)}>stap 5</Button>
 * <Button variant="dashed" size="sm">+ Meting toevoegen</Button>
 */
export function Button({
  variant  = 'secondary',
  size     = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  const sizeClass = NO_SIZE.includes(variant) ? '' : SIZES[size];
  return (
    <button
      type="button"
      className={`${VARIANTS[variant]} ${sizeClass} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}
