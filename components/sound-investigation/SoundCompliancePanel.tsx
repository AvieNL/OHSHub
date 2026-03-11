'use client';

import type { SoundComplianceCheck } from '@/lib/sound-investigation-types';

interface Props {
  checks: SoundComplianceCheck[];
  className?: string;
}

const STATUS_ICON: Record<SoundComplianceCheck['status'], string> = {
  pass: '✓',
  warning: '⚠',
  fail: '✗',
};

const STATUS_ICON_CLS: Record<SoundComplianceCheck['status'], string> = {
  pass: 'text-emerald-600 dark:text-emerald-400',
  warning: 'text-amber-600 dark:text-amber-400',
  fail: 'text-red-600 dark:text-red-400',
};

export default function SoundCompliancePanel({ checks, className = '' }: Props) {
  if (checks.length === 0) return null;

  const hasFail    = checks.some((c) => c.status === 'fail');
  const hasWarning = checks.some((c) => c.status === 'warning');

  const overallBg = hasFail
    ? 'bg-red-50 border-red-200 dark:bg-red-900/15 dark:border-red-800'
    : hasWarning
      ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/15 dark:border-amber-800'
      : 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/15 dark:border-emerald-800';

  const overallText = hasFail
    ? 'text-red-800 dark:text-red-300'
    : hasWarning
      ? 'text-amber-800 dark:text-amber-300'
      : 'text-emerald-800 dark:text-emerald-300';

  const overallDivide = hasFail
    ? 'border-red-200 dark:border-red-800'
    : hasWarning
      ? 'border-amber-200 dark:border-amber-800'
      : 'border-emerald-200 dark:border-emerald-800';

  const overallLabel = hasFail
    ? 'Niet conform NEN-EN-ISO 9612:2025'
    : hasWarning
      ? 'Voldoet met aandachtspunten'
      : 'Voldoet aan NEN-EN-ISO 9612:2025';

  const overallIcon = hasFail ? '✗' : hasWarning ? '⚠' : '✓';

  return (
    <div className={`rounded-lg border border-zinc-200 text-sm dark:border-zinc-700 ${className}`}>
      <div className={`flex items-center gap-2 rounded-t-lg px-4 py-2.5 font-semibold ${overallBg} ${overallText}`}>
        <span className="shrink-0">{overallIcon}</span>
        <span>Normconformiteit — {overallLabel}</span>
      </div>
      <ul className="divide-y divide-zinc-100/60 dark:divide-zinc-700/20">
        {checks.map((check) => (
          <li key={check.id} className="flex items-start gap-3 px-4 py-2">
            <span className={`mt-0.5 shrink-0 font-bold ${STATUS_ICON_CLS[check.status]}`}>
              {STATUS_ICON[check.status]}
            </span>
            <div className="min-w-0">
              <span className="font-medium text-zinc-800 dark:text-zinc-200">{check.label}</span>
              {check.ref && (
                <span className="ml-1.5 text-[11px] text-zinc-400">({check.ref})</span>
              )}
              <p className="mt-0.5 text-zinc-600 dark:text-zinc-400">{check.detail}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
