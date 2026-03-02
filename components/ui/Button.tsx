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
  md: 'px-4 py-2 text-sm gap-2',
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  xs: 'px-2 py-1 text-xs gap-1.5',
};

/** Varianten waarvoor het size-systeem niet van toepassing is */
const NO_SIZE: ButtonVariant[] = ['link'];

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:   ButtonVariant;
  size?:      ButtonSize;
  /** Icoon vóór de tekst */
  leftIcon?:  ReactNode;
  /** Icoon ná de tekst */
  rightIcon?: ReactNode;
  children?:  ReactNode;
}

/**
 * Knop met vaste stijlvarianten en optionele iconen.
 *
 * @example
 * <Button variant="primary" leftIcon={<Icon name="plus" size="sm" />}>Toevoegen</Button>
 * <Button variant="danger" size="xs" leftIcon={<Icon name="trash" size="xs" />}>Verwijderen</Button>
 * <Button variant="ghost" size="xs" leftIcon={<Icon name="pencil" size="xs" />}>Bewerken</Button>
 * <Button variant="link" onClick={() => onGoToStep(4)}>stap 5</Button>
 * <Button variant="dashed"><Icon name="plus" size="sm" />Meting toevoegen</Button>
 */
export function Button({
  variant   = 'secondary',
  size      = 'md',
  leftIcon,
  rightIcon,
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
      {leftIcon}
      {children}
      {rightIcon}
    </button>
  );
}
