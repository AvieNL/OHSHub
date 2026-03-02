'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';

type UserDetail = {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  role: string;
  privacy_version_accepted: string | null;
  privacy_accepted_at: string | null;
  first_name: string | null;
  tussenvoegsel: string | null;
  last_name: string | null;
  company: string | null;
};

function fmtFullName(u: Pick<UserDetail, 'first_name' | 'tussenvoegsel' | 'last_name'>): string {
  return [u.first_name, u.tussenvoegsel, u.last_name].filter(Boolean).join(' ');
}

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
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/admin/users/${id}`).then((r) => r.json()),
      fetch(`/api/admin/users/${id}/investigations`).then((r) => r.json()),
    ]).then(([detail, invs]) => {
      setUserDetail(detail);
      setInvestigations(invs);
    }).finally(() => setLoading(false));
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
        Gebruikersdetail
      </h1>
      <p className="mb-6 font-mono text-xs text-zinc-400">{id}</p>

      {userDetail && (
        <div className="mb-8 overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="border-b border-zinc-100 px-5 py-3 dark:border-zinc-800">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Accountinfo</p>
          </div>
          <dl className="grid grid-cols-[auto_1fr] gap-x-8 gap-y-2 px-5 py-4 text-sm">
            <dt className="text-zinc-400 dark:text-zinc-500">E-mail</dt>
            <dd className="font-medium text-zinc-900 dark:text-zinc-100">{userDetail.email}</dd>
            <dt className="text-zinc-400 dark:text-zinc-500">Naam</dt>
            <dd className="text-zinc-700 dark:text-zinc-300">{fmtFullName(userDetail) || '—'}</dd>
            <dt className="text-zinc-400 dark:text-zinc-500">Bedrijf</dt>
            <dd className="text-zinc-700 dark:text-zinc-300">{userDetail.company || '—'}</dd>
            <dt className="text-zinc-400 dark:text-zinc-500">Rol</dt>
            <dd className="text-zinc-700 dark:text-zinc-300">{userDetail.role}</dd>
            <dt className="text-zinc-400 dark:text-zinc-500">Aangemeld op</dt>
            <dd className="text-zinc-700 dark:text-zinc-300">{fmtDate(userDetail.created_at)}</dd>
            <dt className="text-zinc-400 dark:text-zinc-500">Laatste login</dt>
            <dd className="text-zinc-700 dark:text-zinc-300">{userDetail.last_sign_in_at ? fmtDate(userDetail.last_sign_in_at) : '—'}</dd>
            <dt className="text-zinc-400 dark:text-zinc-500">Privacyverklaring</dt>
            <dd>
              {userDetail.privacy_version_accepted ? (
                <span className="inline-flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                  <svg className="h-3.5 w-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  v{userDetail.privacy_version_accepted} — geaccepteerd op {userDetail.privacy_accepted_at ? fmtDate(userDetail.privacy_accepted_at) : '—'}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                  <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                  Niet geregistreerd (account aangemaakt voor implementatie)
                </span>
              )}
            </dd>
          </dl>
        </div>
      )}

      <h2 className="mb-4 text-base font-semibold text-zinc-900 dark:text-zinc-50">
        Onderzoeken
      </h2>

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
