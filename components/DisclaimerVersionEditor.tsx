'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useIsAdmin } from '@/components/AdminContext';

interface Props {
  currentBody: string;
  latestVersion: string | null;
}

const TYPE_LABELS: Record<string, string> = {
  patch: 'Patch — typefout, kleine correctie',
  minor: 'Minor — nieuwe sectie of inhoudelijke uitbreiding',
  major: 'Major — ingrijpende wijziging, herziening',
};

function nextVersion(latest: string | null, type: 'major' | 'minor' | 'patch'): string {
  if (!latest) return '1.0.0';
  const parts = latest.split('.').map(Number);
  const major = parts[0] ?? 1;
  const minor = parts[1] ?? 0;
  const patch = parts[2] ?? 0;
  if (type === 'major') return `${major + 1}.0.0`;
  if (type === 'minor') return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

export default function DisclaimerVersionEditor({ currentBody, latestVersion }: Props) {
  const isAdmin = useIsAdmin();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [body, setBody] = useState(currentBody);
  const [versionType, setVersionType] = useState<'major' | 'minor' | 'patch'>(
    latestVersion ? 'patch' : 'major'
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!isAdmin) return null;

  const preview = nextVersion(latestVersion, versionType);

  async function handleSave() {
    setError('');
    setSaving(true);
    const res = await fetch('/api/admin/disclaimer-versions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body, version_type: versionType }),
    });
    setSaving(false);
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError((json as { error?: string }).error ?? 'Onbekende fout');
      return;
    }
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <div className="mt-8 flex justify-end">
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-medium text-orange-700 transition hover:bg-orange-100 dark:border-orange-800/50 dark:bg-orange-900/10 dark:text-orange-400 dark:hover:bg-orange-900/20"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          Nieuwe versie publiceren
        </button>
      </div>
    );
  }

  return (
    <div className="mt-8 rounded-xl border border-orange-200 bg-orange-50 p-5 dark:border-orange-800/50 dark:bg-orange-900/10">
      <h3 className="mb-4 text-sm font-semibold text-orange-800 dark:text-orange-300">
        Nieuwe versie disclaimer
      </h3>

      <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
        Inhoud (markdown)
      </label>
      <textarea
        rows={16}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        className="mb-1 w-full rounded-lg border border-orange-300 bg-white px-3 py-2 font-mono text-xs text-zinc-800 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 dark:border-orange-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-orange-900/30"
        spellCheck={false}
      />
      <p className="mb-4 text-xs text-zinc-400">
        <strong className="font-medium text-zinc-500">Markdown:</strong>{' '}
        <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">**vet**</code>{' '}
        <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">*cursief*</code>{' '}
        <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">## Kop</code>{' '}
        <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">- lijst</code>
      </p>

      <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
        Type wijziging
      </label>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        {(['patch', 'minor', 'major'] as const).map((t) => (
          <label key={t} className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="disclaimer-version-type"
              value={t}
              checked={versionType === t}
              onChange={() => setVersionType(t)}
              className="accent-orange-500"
            />
            <span className="text-sm text-zinc-700 dark:text-zinc-300">{TYPE_LABELS[t]}</span>
          </label>
        ))}
      </div>

      <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
        Huidig:{' '}
        <code className="font-mono text-zinc-800 dark:text-zinc-200">
          {latestVersion ?? '(geen)'}
        </code>
        {' → '}
        Nieuw:{' '}
        <code className="font-mono font-semibold text-orange-600 dark:text-orange-400">
          {preview}
        </code>
      </p>

      {error && (
        <p className="mb-3 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleSave}
          disabled={saving || !body.trim()}
          className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-orange-600 disabled:opacity-50"
        >
          {saving ? 'Opslaan…' : `Publiceer v${preview}`}
        </button>
        <button
          onClick={() => { setOpen(false); setError(''); }}
          className="rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          Annuleren
        </button>
      </div>
    </div>
  );
}
