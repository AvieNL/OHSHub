import type { ReactNode } from 'react';

interface FormGridProps {
  cols?:     2 | 3;
  className?: string;
  children:  ReactNode;
}

/**
 * Responsief raster voor formuliervelden — 1 kolom op mobiel, 2 of 3 kolommen op sm+.
 *
 * @example
 * <FormGrid>
 *   <div><FieldLabel>Fabrikant</FieldLabel><Input ... /></div>
 *   <div><FieldLabel>Model</FieldLabel><Input ... /></div>
 * </FormGrid>
 */
export function FormGrid({ cols = 2, className = '', children }: FormGridProps) {
  const colClass = cols === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2';
  return (
    <div className={`grid gap-3 ${colClass} ${className}`.trim()}>
      {children}
    </div>
  );
}
