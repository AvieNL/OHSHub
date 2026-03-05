'use client';

import InlineEdit from '@/components/InlineEdit';

interface Props {
  /** Namespace, bijv. 'investigation.sound' */
  namespace: string;
  /** Stapsleutel, bijv. 'step.1' */
  stepKey: string;
  /** Hardcoded originele titel als fallback */
  fallbackTitle: string;
  /** Huidige waarde: DB-override ?? fallbackTitle */
  title: string;
}

/**
 * Herbruikbare bewerkbare staptitel (h2) voor alle onderzoeksstap-componenten.
 * Admins zien een zweef-potlood; niet-admins zien alleen de h2.
 */
export default function InlineStepHeader({ namespace, stepKey, fallbackTitle, title }: Props) {
  return (
    <InlineEdit
      namespace={namespace}
      contentKey={`${stepKey}.title`}
      initialValue={title}
      fallback={fallbackTitle}
    >
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{title}</h2>
    </InlineEdit>
  );
}
