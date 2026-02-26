'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { PhysicalInvestigation } from '@/lib/physical-investigation-types';
import {
  getAllPhysicalInvestigations,
  createPhysicalInvestigation,
  savePhysicalInvestigation,
  deletePhysicalInvestigation,
} from '@/lib/physical-investigation-storage';
import PhysicalInvestigationShell from './PhysicalInvestigationShell';

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function exportAll(investigations: PhysicalInvestigation[]) {
  const blob = new Blob([JSON.stringify(investigations, null, 2)], { type: 'application/json' });
  triggerDownload(blob, `ohshub-fysieke-belasting-${new Date().toISOString().slice(0, 10)}.json`);
}

function exportOne(inv: PhysicalInvestigation) {
  const blob = new Blob([JSON.stringify([inv], null, 2)], { type: 'application/json' });
  const slug = inv.name.replace(/\s+/g, '-').toLowerCase().slice(0, 40);
  triggerDownload(blob, `ohshub-fysiek-${slug}-${new Date().toISOString().slice(0, 10)}.json`);
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function NewInvestigationDialog({
  onConfirm,
  onCancel,
}: {
  onConfirm: (name: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onConfirm(name.trim());
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
        <h2 className="mb-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Nieuw fysieke belasting onderzoek starten
        </h2>
        <p className="mb-5 text-sm text-zinc-500 dark:text-zinc-400">
          Geef het onderzoek een naam (bijv. &ldquo;Tilanalyse magazijn 2025&rdquo;). Opdrachtgever en locatie vult u in stap 2.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Naam onderzoek <span className="text-red-500">*</span>
            </label>
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Bijv. Fysieke belasting assemblage Q2 2025"
              className="w-full rounded-lg border border-zinc-200 px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-zinc-400"
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              Annuleren
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="rounded-lg bg-orange-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-40"
            >
              Starten
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const METHOD_LABELS: Record<string, string> = {
  'lifting': 'Tillen',
  'carrying': 'Dragen',
  'push-pull': 'Duwen/trekken',
  'repetitive': 'Repetitief',
  'posture': 'Houdingen',
  'forces': 'Krachten',
};

export default function PhysicalInvestigationApp() {
  const [investigations, setInvestigations] = useState<PhysicalInvestigation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [importMsg, setImportMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getAllPhysicalInvestigations()
      .then(setInvestigations)
      .finally(() => setLoading(false));
  }, []);

  const activeInvestigation = investigations.find((i) => i.id === activeId) ?? null;

  const handleUpdate = useCallback((updated: PhysicalInvestigation) => {
    setInvestigations((prev) =>
      prev.map((i) => (i.id === updated.id ? updated : i)).sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      ),
    );
    savePhysicalInvestigation(updated).catch(console.error);
  }, []);

  function handleCreate(name: string) {
    const inv = createPhysicalInvestigation(name);
    savePhysicalInvestigation(inv).catch(console.error);
    setInvestigations((prev) =>
      [inv, ...prev].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      ),
    );
    setActiveId(inv.id);
    setShowNewDialog(false);
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        const arr: PhysicalInvestigation[] = Array.isArray(parsed) ? parsed : [parsed];
        const valid = arr.filter(
          (item) => item && typeof item.id === 'string' && typeof item.name === 'string',
        );
        if (valid.length === 0) {
          setImportMsg({ type: 'err', text: 'Geen geldige fysieke belasting onderzoeken gevonden.' });
          return;
        }
        await Promise.all(valid.map((inv) => savePhysicalInvestigation(inv)));
        const refreshed = await getAllPhysicalInvestigations();
        setInvestigations(refreshed);
        setImportMsg({ type: 'ok', text: `${valid.length} onderzoek${valid.length !== 1 ? 'en' : ''} geïmporteerd.` });
      } catch {
        setImportMsg({ type: 'err', text: 'Ongeldig bestand. Gebruik een eerder geëxporteerd OHSHub-bestand.' });
      }
      e.target.value = '';
      setTimeout(() => setImportMsg(null), 4000);
    };
    reader.readAsText(file);
  }

  function handleDelete(id: string) {
    deletePhysicalInvestigation(id).catch(console.error);
    setInvestigations((prev) => prev.filter((i) => i.id !== id));
    if (activeId === id) setActiveId(null);
    setDeleteConfirm(null);
  }

  if (activeInvestigation) {
    return (
      <PhysicalInvestigationShell
        investigation={activeInvestigation}
        onUpdate={handleUpdate}
        onClose={() => setActiveId(null)}
      />
    );
  }

  return (
    <>
      {showNewDialog && (
        <NewInvestigationDialog
          onConfirm={handleCreate}
          onCancel={() => setShowNewDialog(false)}
        />
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
            <h2 className="mb-2 text-base font-semibold text-zinc-900 dark:text-zinc-50">
              Onderzoek verwijderen?
            </h2>
            <p className="mb-5 text-sm text-zinc-500 dark:text-zinc-400">
              Dit kan niet ongedaan worden gemaakt. Alle gegevens worden permanent verwijderd.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                Annuleren
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
              >
                Verwijderen
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-10">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Opgeslagen onderzoeken fysieke belasting
            </h2>
            {!loading && (
              <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                {investigations.length === 0
                  ? 'Nog geen onderzoeken — start uw eerste.'
                  : `${investigations.length} onderzoek${investigations.length === 1 ? '' : 'en'} opgeslagen.`}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={handleImport}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg border border-zinc-200 px-5 py-2.5 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              Importeren
            </button>
            {!loading && investigations.length > 0 && (
              <button
                onClick={() => exportAll(investigations)}
                className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg border border-zinc-200 px-5 py-2.5 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Exporteer alles
              </button>
            )}
            <button
              onClick={() => setShowNewDialog(true)}
              className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Nieuw onderzoek
            </button>
          </div>
        </div>

        {importMsg && (
          <div className={`mb-4 flex items-center gap-2 rounded-lg px-4 py-3 text-sm ${
            importMsg.type === 'ok'
              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300'
              : 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300'
          }`}>
            {importMsg.type === 'ok'
              ? <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
              : <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" /></svg>
            }
            {importMsg.text}
          </div>
        )}

        {loading ? (
          <div className="flex h-32 items-center justify-center text-sm text-zinc-400">Laden…</div>
        ) : investigations.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-zinc-300 py-16 dark:border-zinc-700">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
              <svg className="h-6 w-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Nog geen onderzoeken fysieke belasting</p>
              <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">Klik op &ldquo;Nieuw onderzoek&rdquo; om te beginnen.</p>
            </div>
            <button
              onClick={() => setShowNewDialog(true)}
              className="rounded-lg bg-orange-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-orange-600"
            >
              Nieuw onderzoek starten
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {investigations.map((inv) => (
              <div
                key={inv.id}
                className="group flex items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-zinc-300 hover:shadow dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
              >
                <button
                  className="flex min-w-0 flex-1 flex-col items-start gap-1 text-left"
                  onClick={() => setActiveId(inv.id)}
                >
                  <span className="truncate text-base font-semibold text-zinc-900 dark:text-zinc-50">
                    {inv.name}
                  </span>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 dark:text-zinc-500">
                    {inv.clients[0]?.organization && <span>{inv.clients[0].organization}</span>}
                    {inv.clients[0]?.organization && <span>·</span>}
                    <span>{inv.bgs.length} BG{inv.bgs.length !== 1 ? '\'s' : ''}</span>
                    {inv.methods.length > 0 && (
                      <>
                        <span>·</span>
                        <span>{inv.methods.map((m) => METHOD_LABELS[m] ?? m).join(', ')}</span>
                      </>
                    )}
                    <span>·</span>
                    <span>Stap {inv.currentStep + 1} / 11</span>
                    <span>·</span>
                    <span>Gewijzigd {fmtDate(inv.updatedAt)}</span>
                  </div>
                </button>

                <div className="hidden shrink-0 items-center gap-1 sm:flex">
                  {Array.from({ length: 11 }, (_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 w-1.5 rounded-full ${
                        i < inv.currentStep
                          ? 'bg-orange-400'
                          : i === inv.currentStep
                            ? 'bg-orange-500'
                            : 'bg-zinc-200 dark:bg-zinc-700'
                      }`}
                    />
                  ))}
                </div>

                <button
                  onClick={(e) => { e.stopPropagation(); exportOne(inv); }}
                  className="shrink-0 rounded-lg p-2 text-zinc-400 opacity-0 transition hover:bg-zinc-100 hover:text-zinc-700 group-hover:opacity-100 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                  title="Exporteren als JSON"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setDeleteConfirm(inv.id); }}
                  className="shrink-0 rounded-lg p-2 text-zinc-400 opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                  title="Verwijderen"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>

                <button
                  onClick={() => setActiveId(inv.id)}
                  className="shrink-0 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Openen →
                </button>
              </div>
            ))}
          </div>
        )}

        {!loading && investigations.length > 0 && (
          <p className="mt-4 text-center text-xs text-zinc-400 dark:text-zinc-500">
            Gegevens worden opgeslagen in de cloud.
          </p>
        )}
      </div>
    </>
  );
}
