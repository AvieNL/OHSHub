'use client';

import { useState } from 'react';
import { useIsAdmin } from '@/components/AdminContext';

export default function DisclaimerPushAllButton() {
  const isAdmin = useIsAdmin();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ count: number; version: string } | null>(null);
  const [error, setError] = useState('');

  if (!isAdmin) return null;

  async function handleClick() {
    setLoading(true);
    setError('');
    setResult(null);
    const res = await fetch('/api/admin/disclaimer-push-all', { method: 'POST' });
    const json = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError((json as { error?: string }).error ?? 'Onbekende fout');
      return;
    }
    setResult(json as { count: number; version: string });
  }

  return (
    <div className="mt-6 rounded-xl border border-orange-200 bg-orange-50 p-4 dark:border-orange-800/50 dark:bg-orange-900/10">
      <p className="mb-3 text-sm text-orange-800 dark:text-orange-300">
        <strong>Beheerdersactie:</strong> Vereis herbevestiging van de disclaimer voor alle gebruikers. De modal verschijnt bij hun volgende sessie.
      </p>
      <button
        onClick={handleClick}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-orange-600 disabled:opacity-50"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
        {loading ? 'Bezig…' : 'Vereis herbevestiging voor alle gebruikers'}
      </button>
      {result && (
        <p className="mt-2 text-sm text-orange-700 dark:text-orange-300">
          {result.count} gebruiker{result.count !== 1 ? 's' : ''} verplicht gesteld (v{result.version})
        </p>
      )}
      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
