import type { LabelHTMLAttributes, ReactNode } from 'react';

interface FieldLabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  children: ReactNode;
}

/**
 * Label boven een formulierveld.
 *
 * @example
 * <FieldLabel htmlFor="name">Naam meetpunt</FieldLabel>
 * <Input id="name" ... />
 */
export function FieldLabel({ className = '', children, ...props }: FieldLabelProps) {
  return (
    <label
      className={`mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300 ${className}`.trim()}
      {...props}
    >
      {children}
    </label>
  );
}
