'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type ExportData = {
  user: {
    id: string;
    email: string;
    created_at: string;
    last_sign_in_at: string | null;
  };
  role: string;
  privacy_version_accepted: string | null;
  privacy_accepted_at: string | null;
  investigations: unknown[];
};

type Profile = {
  first_name: string;
  tussenvoegsel: string;
  last_name: string;
  company: string;
};

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
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

const inputClass =
  'w-full rounded-lg border border-zinc-200 px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-zinc-400';

export default function AccountPage() {
  const router = useRouter();
  const [exportData, setExportData] = useState<ExportData | null>(null);
  const [loading, setLoading] = useState(true);

  // Profiel
  const [profile, setProfile] = useState<Profile>({ first_name: '', tussenvoegsel: '', last_name: '', company: '' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  // E-mail wijzigen
  const [newEmail, setNewEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState('');

  // Account verwijderen
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/account/export').then((r) => r.json()),
      fetch('/api/account/profile').then((r) => r.json()),
    ]).then(([exportJson, profileJson]) => {
      setExportData(exportJson);
      setProfile({
        first_name: profileJson.first_name ?? '',
        tussenvoegsel: profileJson.tussenvoegsel ?? '',
        last_name: profileJson.last_name ?? '',
        company: profileJson.company ?? '',
      });
    }).finally(() => setLoading(false));
  }, []);

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    setProfileLoading(true);

    const res = await fetch('/api/account/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });

    if (!res.ok) {
      const json = await res.json();
      setProfileError(json.error ?? 'Opslaan mislukt.');
    } else {
      setProfileSuccess('Profiel opgeslagen.');
    }
    setProfileLoading(false);
  }

  async function handleEmailChange(e: React.FormEvent) {
    e.preventDefault();
    setEmailError('');
    setEmailSuccess('');
    setEmailLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ email: newEmail });

    if (error) {
      setEmailError(error.message);
    } else {
      setEmailSuccess(`Bevestigingslink verstuurd naar ${newEmail}`);
      setNewEmail('');
    }
    setEmailLoading(false);
  }

  async function handleDownload() {
    const res = await fetch('/api/account/export');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const today = new Date().toISOString().slice(0, 10);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ohshub-export-${today}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleDelete() {
    setDeleteLoading(true);
    const supabase = createClient();
    await fetch('/api/account', { method: 'DELETE' });
    await supabase.auth.signOut();
    router.replace('/');
    router.refresh();
  }

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-zinc-400">
        Laden…
      </div>
    );
  }

  return (
    <>
      {/* Bevestigingsdialoog account verwijderen */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
            <h2 className="mb-2 text-base font-semibold text-zinc-900 dark:text-zinc-50">Account verwijderen?</h2>
            <p className="mb-5 text-sm text-zinc-500 dark:text-zinc-400">
              Dit verwijdert uw account en alle onderzoeken permanent. Dit kan niet ongedaan worden gemaakt.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(false)}
                disabled={deleteLoading}
                className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                Annuleren
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50"
              >
                {deleteLoading ? 'Bezig…' : 'Definitief verwijderen'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Mijn gegevens</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Inzage, correctie en verwijdering conform de{' '}
          <abbr title="Algemene Verordening Gegevensbescherming" className="cursor-help underline decoration-dotted decoration-zinc-400 underline-offset-2">AVG</abbr>
          {' '}·{' '}
          <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:underline">
            Privacyverklaring
          </a>
        </p>
      </div>

      <div className="space-y-6">

        {/* A — Accountgegevens */}
        <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Accountgegevens
          </h2>
          <dl className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-zinc-500 dark:text-zinc-400">E-mailadres</dt>
              <dd className="font-medium text-zinc-900 dark:text-zinc-100">{exportData?.user.email ?? '—'}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-zinc-500 dark:text-zinc-400">Rol</dt>
              <dd>{exportData ? <RoleBadge role={exportData.role} /> : '—'}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-zinc-500 dark:text-zinc-400">Aangemeld op</dt>
              <dd className="text-zinc-700 dark:text-zinc-300">{fmtDate(exportData?.user.created_at ?? null)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-zinc-500 dark:text-zinc-400">Laatste login</dt>
              <dd className="text-zinc-700 dark:text-zinc-300">{fmtDate(exportData?.user.last_sign_in_at ?? null)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-zinc-500 dark:text-zinc-400">Onderzoeken opgeslagen</dt>
              <dd className="text-zinc-700 dark:text-zinc-300">{exportData?.investigations.length ?? 0}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-zinc-500 dark:text-zinc-400">Privacyverklaring geaccepteerd</dt>
              <dd className="text-zinc-700 dark:text-zinc-300">
                {exportData?.privacy_version_accepted
                  ? `v${exportData.privacy_version_accepted} — ${fmtDate(exportData.privacy_accepted_at)}`
                  : '—'}
              </dd>
            </div>
          </dl>
        </section>

        {/* B — Profiel */}
        <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Profiel
          </h2>
          <p className="mb-4 text-xs text-zinc-400 dark:text-zinc-500">
            Uw naam wordt getoond in de navigatiebalk als u die invult.
          </p>
          <form onSubmit={handleProfileSave} className="space-y-4">
            <div className="grid grid-cols-[1fr_auto_1fr] gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Voornaam
                </label>
                <input
                  type="text"
                  value={profile.first_name}
                  onChange={(e) => setProfile((p) => ({ ...p, first_name: e.target.value }))}
                  className={inputClass}
                  placeholder="Jan"
                />
              </div>
              <div className="w-24">
                <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Tussenvoegsel
                </label>
                <input
                  type="text"
                  value={profile.tussenvoegsel}
                  onChange={(e) => setProfile((p) => ({ ...p, tussenvoegsel: e.target.value }))}
                  className={inputClass}
                  placeholder="van"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Achternaam
                </label>
                <input
                  type="text"
                  value={profile.last_name}
                  onChange={(e) => setProfile((p) => ({ ...p, last_name: e.target.value }))}
                  className={inputClass}
                  placeholder="Doe"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Bedrijfsnaam
              </label>
              <input
                type="text"
                value={profile.company}
                onChange={(e) => setProfile((p) => ({ ...p, company: e.target.value }))}
                className={inputClass}
                placeholder="Uw organisatie"
              />
            </div>

            {profileError && (
              <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
                {profileError}
              </p>
            )}
            {profileSuccess && (
              <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
                {profileSuccess}
              </p>
            )}

            <button
              type="submit"
              disabled={profileLoading}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              {profileLoading ? 'Opslaan…' : 'Profiel opslaan'}
            </button>
          </form>
        </section>

        {/* C — E-mailadres wijzigen */}
        <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            E-mailadres wijzigen
          </h2>
          <p className="mb-4 text-xs text-zinc-400 dark:text-zinc-500">
            Na het opslaan ontvangt u een bevestigingslink op het nieuwe adres.
          </p>
          <form onSubmit={handleEmailChange} className="space-y-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Nieuw e-mailadres
              </label>
              <input
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className={inputClass}
                placeholder="nieuw@voorbeeld.nl"
              />
            </div>

            {emailError && (
              <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
                {emailError}
              </p>
            )}
            {emailSuccess && (
              <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
                {emailSuccess}
              </p>
            )}

            <button
              type="submit"
              disabled={emailLoading}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              {emailLoading ? 'Bezig…' : 'Bevestigingslink sturen'}
            </button>
          </form>
        </section>

        {/* D — Gegevens exporteren */}
        <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Gegevens exporteren
          </h2>
          <p className="mb-4 text-xs text-zinc-400 dark:text-zinc-500">
            Download al uw gegevens als{' '}
            <abbr title="JavaScript Object Notation — machineleesbaar gegevensformaat" className="cursor-help underline decoration-dotted decoration-zinc-400 underline-offset-2">JSON</abbr>-bestand,
            inclusief accountinfo, profiel en alle opgeslagen onderzoeken.
          </p>
          <button
            onClick={handleDownload}
            className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Download mijn gegevens (JSON)
          </button>
        </section>

        {/* E — Account verwijderen */}
        <section className="rounded-xl border border-red-200 bg-red-50/50 p-6 dark:border-red-900/40 dark:bg-red-950/20">
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">
            Account verwijderen
          </h2>
          <p className="mb-4 text-xs text-red-500/80 dark:text-red-400/70">
            Verwijdert uw account en alle bijbehorende onderzoeken permanent. Dit kan niet ongedaan worden gemaakt.
          </p>
          <button
            onClick={() => setDeleteConfirm(true)}
            className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
          >
            Account verwijderen
          </button>
        </section>

      </div>
    </>
  );
}
