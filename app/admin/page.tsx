'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type UserRow = {
  id: string;
  email: string;
  role: string;
  privacy_version_accepted: string | null;
  privacy_accepted_at: string | null;
  first_name: string | null;
  tussenvoegsel: string | null;
  last_name: string | null;
  company: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  investigation_count: number;
};

function fmtFullName(u: Pick<UserRow, 'first_name' | 'tussenvoegsel' | 'last_name'>): string {
  return [u.first_name, u.tussenvoegsel, u.last_name].filter(Boolean).join(' ');
}

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
                <th className="px-4 py-3 text-right">Onderzoeken</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 bg-white dark:divide-zinc-800 dark:bg-zinc-950">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div>
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
                      </div>
                      {!user.privacy_version_accepted && (
                        <span
                          title="Privacyverklaring nog niet geregistreerd"
                          className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400"
                        >
                          <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                          </svg>
                        </span>
                      )}
                    </div>
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
