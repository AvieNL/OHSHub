import type { ReactNode } from 'react';

export type CardVariant = 'default' | 'form';

const VARIANTS: Record<CardVariant, string> = {
  /** Lichte zinkkaart — voor read-only datablokken en overzichtskaarten */
  default: 'rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/30',
  /** Oranje formulierkaart — voor edit-formulieren (nieuw/bewerken) */
  form:    'space-y-4 rounded-xl border border-orange-200 bg-orange-50/50 p-5 dark:border-orange-800/50 dark:bg-orange-900/10',
};

interface CardProps {
  variant?:  CardVariant;
  className?: string;
  children:  ReactNode;
}

/**
 * Container voor een groep gerelateerde velden of gegevens.
 *
 * @example
 * <Card variant="form">
 *   <h4>Nieuwe HEG</h4>
 *   <FormGrid>...</FormGrid>
 * </Card>
 *
 * <Card>
 *   <p>{heg.name}</p>
 * </Card>
 */
export function Card({ variant = 'default', className = '', children }: CardProps) {
  return (
    <div className={`${VARIANTS[variant]} ${className}`.trim()}>
      {children}
    </div>
  );
}
