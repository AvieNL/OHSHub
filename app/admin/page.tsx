'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fmtFullName } from '@/lib/utils';

type UserRow = {
  id: string;
  email: string;
  role: string;
  privacy_version_accepted: string | null;
  privacy_accepted_at: string | null;
  privacy_required_version: string | null;
  first_name: string | null;
  tussenvoegsel: string | null;
  last_name: string | null;
  company: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  investigation_count: number;
};


const ROLES = ['gebruiker', 'test-gebruiker', 'admin'] as const;

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' });
}

function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    admin: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    'test-gebruiker': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    gebruiker: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[role] ?? colors.gebruiker}`}>
      {role}
    </span>
  );
}

export default function AdminPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [privacyLoading, setPrivacyLoading] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/users')
      .then((r) => r.json())
      .then(setUsers)
      .finally(() => setLoading(false));
  }, []);

  async function handleRoleChange(userId: string, newRole: string) {
    setSaving(userId);
    await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
    });
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
    setSaving(null);
  }

  async function handleDelete(userId: string) {
    await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    setDeleteConfirm(null);
  }

  async function handlePrivacyPush(userId: string, hasPending: boolean) {
    setPrivacyLoading(userId);
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: hasPending ? 'privacy-clear' : 'privacy-push' }),
    });
    const json = await res.json().catch(() => ({}));
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, privacy_required_version: hasPending ? null : ((json as { version?: string }).version ?? null) }
          : u
      )
    );
    setPrivacyLoading(null);
  }

  return (
    <>
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
            <h2 className="mb-2 text-base font-semibold text-zinc-900 dark:text-zinc-50">Gebruiker verwijderen?</h2>
            <p className="mb-5 text-sm text-zinc-500 dark:text-zinc-400">
              Het account en alle onderzoeken worden permanent verwijderd. Dit kan niet ongedaan worden gemaakt.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                Annuleren
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
              >
                Verwijderen
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Beheerderspaneel</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Gebruikersbeheer — {users.length} account{users.length !== 1 ? 's' : ''}
        </p>
      </div>

      {loading ? (
        <div className="flex h-32 items-center justify-center text-sm text-zinc-400">Laden…</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
              <tr>
                <th className="px-6 py-3 text-left">E-mail</th>
                <th className="px-4 py-3 text-left">Rol</th>
                <th className="px-4 py-3 text-left">Aangemeld</th>
                <th className="px-4 py-3 text-left">Laatste login</th>
                <th className="px-4 py-3 text-left">Privacy</th>
                <th className="px-4 py-3 text-right">Onderzoeken</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 bg-white dark:divide-zinc-800 dark:bg-zinc-950">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40">
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="font-medium text-zinc-900 hover:underline dark:text-zinc-100"
                    >
                      {user.email}
                    </Link>
                    {fmtFullName(user) && (
                      <p className="text-xs text-zinc-400 dark:text-zinc-500">
                        {fmtFullName(user)}{user.company ? ` · ${user.company}` : ''}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <select
                      value={user.role}
                      disabled={saving === user.id}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-700 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-4 text-zinc-500 dark:text-zinc-400">{fmtDate(user.created_at)}</td>
                  <td className="px-4 py-4 text-zinc-500 dark:text-zinc-400">{fmtDate(user.last_sign_in_at)}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div>
                        {user.privacy_version_accepted ? (
                          <span className="font-mono text-xs text-zinc-700 dark:text-zinc-300">
                            v{user.privacy_version_accepted}
                          </span>
                        ) : (
                          <span className="text-xs text-amber-600 dark:text-amber-400" title="Privacyverklaring nog niet geregistreerd">—</span>
                        )}
                        {user.privacy_accepted_at && (
                          <p className="text-xs text-zinc-400 dark:text-zinc-500">{fmtDate(user.privacy_accepted_at)}</p>
                        )}
                        {user.privacy_required_version && (
                          <p className="text-xs font-medium text-orange-600 dark:text-orange-400">
                            herbevestiging vereist
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handlePrivacyPush(user.id, !!user.privacy_required_version)}
                        disabled={privacyLoading === user.id}
                        title={user.privacy_required_version
                          ? `Verzoek intrekken (v${user.privacy_required_version})`
                          : 'Herbevestiging privacyverklaring verplichten'}
                        className={`shrink-0 rounded-lg p-1.5 disabled:opacity-50 ${
                          user.privacy_required_version
                            ? 'text-orange-500 hover:bg-orange-50 hover:text-orange-700 dark:hover:bg-orange-900/20'
                            : 'text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800'
                        }`}
                      >
                        {user.privacy_required_version ? (
                          // X icon — intrekken
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        ) : (
                          // Bell icon — push
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right text-zinc-700 dark:text-zinc-300">{user.investigation_count}</td>
                  <td className="px-4 py-4 text-right">
                    <button
                      onClick={() => setDeleteConfirm(user.id)}
                      className="rounded-lg p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                      title="Gebruiker verwijderen"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
