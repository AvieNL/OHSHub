'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';

type Investigation = {
  id: string;
  type: string;
  name: string;
  created_at: string;
  updated_at: string;
  data: Record<string, unknown>;
};

const TYPE_LABELS: Record<string, string> = {
  sound: 'Geluid',
  climate: 'Klimaat',
  physical: 'Fysieke belasting',
  hazardous: 'Gevaarlijke stoffen',
};

const TYPE_COLORS: Record<string, string> = {
  sound: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  climate: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  physical: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  hazardous: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/admin/users/${id}/investigations`)
      .then((r) => r.json())
      .then(setInvestigations)
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <>
      <div className="mb-8 flex items-center gap-4">
        <Link
          href="/admin"
          className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Terug naar overzicht
        </Link>
      </div>

      <h1 className="mb-2 text-xl font-bold text-zinc-900 dark:text-zinc-50">
        Onderzoeken van gebruiker
      </h1>
      <p className="mb-8 font-mono text-xs text-zinc-400">{id}</p>

      {loading ? (
        <div className="flex h-32 items-center justify-center text-sm text-zinc-400">Laden…</div>
      ) : investigations.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Geen onderzoeken gevonden.</p>
      ) : (
        <div className="space-y-3">
          {investigations.map((inv) => (
            <div
              key={inv.id}
              className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-center justify-between gap-4 p-5">
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${TYPE_COLORS[inv.type] ?? ''}`}>
                      {TYPE_LABELS[inv.type] ?? inv.type}
                    </span>
                  </div>
                  <span className="truncate font-semibold text-zinc-900 dark:text-zinc-50">
                    {inv.name || '(naamloos)'}
                  </span>
                  <span className="text-xs text-zinc-400 dark:text-zinc-500">
                    Aangemaakt {fmtDate(inv.created_at)} · Gewijzigd {fmtDate(inv.updated_at)}
                  </span>
                </div>
                <button
                  onClick={() => setExpandedId(expandedId === inv.id ? null : inv.id)}
                  className="shrink-0 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                  {expandedId === inv.id ? 'Verbergen' : 'JSON bekijken'}
                </button>
              </div>

              {expandedId === inv.id && (
                <div className="border-t border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
                  <pre className="max-h-96 overflow-auto rounded-lg bg-white p-4 text-xs text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                    {JSON.stringify(inv.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
