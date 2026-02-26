'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { Investigation } from '@/lib/investigation-types';
import Step1_Scope from './steps/Step1_Scope';
import Step2_Substances from './steps/Step2_Substances';
import Step3_Tasks from './steps/Step3_Tasks';
import Step4_Assessment from './steps/Step4_Assessment';
import Step5_SEGs from './steps/Step5_SEGs';
import Step6_MeasurementPlan from './steps/Step6_MeasurementPlan';
import Step7_Measurements from './steps/Step7_Measurements';
import Step8_Statistics from './steps/Step8_Statistics';
import Step9_Measures from './steps/Step9_Measures';
import Step10_Report from './steps/Step10_Report';

// ─── Step definitions ─────────────────────────────────────────────────────────

const STEPS = [
  { number: 1, title: 'Opdracht & kaders', short: 'Kaders' },
  { number: 2, title: 'Stoffeninventarisatie', short: 'Stoffen' },
  { number: 3, title: 'Werkzaamheden & blootstelling', short: 'Taken' },
  { number: 4, title: 'Eerste risicobeoordeling', short: 'Beoordeling' },
  { number: 5, title: 'SEG-vorming', short: "SEG's" },
  { number: 6, title: 'Meetstrategie', short: 'Meetplan' },
  { number: 7, title: 'Metingen uitvoeren', short: 'Metingen' },
  { number: 8, title: 'Kwantitatieve beoordeling', short: 'Statistieken' },
  { number: 9, title: 'Maatregelen (AHS)', short: 'Maatregelen' },
  { number: 10, title: 'Borging & rapport', short: 'Rapport' },
];

// ─── Save indicator ───────────────────────────────────────────────────────────

function SaveIndicator({ saving }: { saving: boolean }) {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      {saving ? (
        <>
          <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
          <span className="text-zinc-400">Opslaan…</span>
        </>
      ) : (
        <>
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span className="text-zinc-400">Opgeslagen</span>
        </>
      )}
    </div>
  );
}

// ─── InvestigationShell ───────────────────────────────────────────────────────

interface Props {
  investigation: Investigation;
  onUpdate: (updated: Investigation) => void;
  onClose: () => void;
}

export default function InvestigationShell({ investigation, onUpdate, onClose }: Props) {
  const [inv, setInv] = useState<Investigation>(investigation);
  const [saving, setSaving] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const titleInputRef = useRef<HTMLInputElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync from parent (e.g. initial load)
  useEffect(() => {
    setInv(investigation);
  }, [investigation.id]); // only re-sync when ID changes

  // Debounced auto-save
  const scheduleUpdate = useCallback(
    (updated: Investigation) => {
      setInv(updated);
      setSaving(true);
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        onUpdate(updated);
        setSaving(false);
      }, 600);
    },
    [onUpdate],
  );

  // Navigation helpers
  function goToStep(step: number) {
    const updated = { ...inv, currentStep: step };
    scheduleUpdate(updated);
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleNext() {
    if (inv.currentStep < 9) goToStep(inv.currentStep + 1);
  }

  function handlePrev() {
    if (inv.currentStep > 0) goToStep(inv.currentStep - 1);
  }

  // Each step calls this to update the investigation
  function handleStepUpdate(partial: Partial<Investigation>) {
    scheduleUpdate({ ...inv, ...partial });
  }

  // Title inline edit
  function startEditTitle() {
    setTitleDraft(inv.name);
    setEditingTitle(true);
    setTimeout(() => titleInputRef.current?.select(), 0);
  }

  function commitTitle() {
    const trimmed = titleDraft.trim();
    if (trimmed && trimmed !== inv.name) {
      scheduleUpdate({ ...inv, name: trimmed });
    }
    setEditingTitle(false);
  }

  function handleTitleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') { e.preventDefault(); commitTitle(); }
    if (e.key === 'Escape') { setEditingTitle(false); }
  }

  const stepProps = {
    investigation: inv,
    onUpdate: handleStepUpdate,
  };

  const CurrentStep = [
    Step1_Scope,
    Step2_Substances,
    Step3_Tasks,
    Step4_Assessment,
    Step5_SEGs,
    Step6_MeasurementPlan,
    Step7_Measurements,
    Step8_Statistics,
    Step9_Measures,
    Step10_Report,
  ][inv.currentStep];

  return (
    <div className="mt-8">
      {/* Top bar */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Mobile menu toggle */}
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            className="rounded-lg border border-zinc-200 p-2 text-zinc-500 lg:hidden dark:border-zinc-700 dark:text-zinc-400"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div>
            {editingTitle ? (
              <input
                ref={titleInputRef}
                type="text"
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onBlur={commitTitle}
                onKeyDown={handleTitleKeyDown}
                className="rounded border border-orange-400 bg-white px-2 py-0.5 text-sm font-semibold text-zinc-900 outline-none focus:ring-1 focus:ring-orange-400 dark:bg-zinc-800 dark:text-zinc-50"
              />
            ) : (
              <button
                onClick={startEditTitle}
                title="Klik om de titel te wijzigen"
                className="group flex items-center gap-1.5 text-left"
              >
                <h2 className="text-sm font-semibold text-zinc-900 group-hover:text-orange-600 dark:text-zinc-50 dark:group-hover:text-orange-400">
                  {inv.name}
                </h2>
                <svg className="h-3.5 w-3.5 shrink-0 text-zinc-300 opacity-0 transition group-hover:opacity-100 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                </svg>
              </button>
            )}
            {(inv.clients[0]?.organization || inv.clients[0]?.name) && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {inv.clients[0].organization || inv.clients[0].name}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <SaveIndicator saving={saving} />
          <button
            onClick={onClose}
            className="text-sm text-zinc-500 transition hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            ← Alle onderzoeken
          </button>
        </div>
      </div>

      {/* Layout */}
      <div className="flex gap-6">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? 'flex' : 'hidden'
          } w-56 shrink-0 flex-col lg:flex`}
        >
          <nav className="sticky top-6 space-y-1">
            {STEPS.map((s, idx) => {
              const isActive = idx === inv.currentStep;
              const isComplete = idx < inv.currentStep;
              return (
                <button
                  key={idx}
                  onClick={() => goToStep(idx)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${
                    isActive
                      ? 'bg-orange-50 font-semibold text-orange-700 dark:bg-orange-900/20 dark:text-orange-400'
                      : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      isActive
                        ? 'bg-orange-500 text-white'
                        : isComplete
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                    }`}
                  >
                    {isComplete ? (
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    ) : (
                      s.number
                    )}
                  </span>
                  <span className="truncate">{s.title}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main content */}
        <div className="min-w-0 flex-1">
          {/* Step header */}
          <div className="mb-6 rounded-xl border border-zinc-200 bg-zinc-50 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-sm font-bold text-white">
                  {inv.currentStep + 1}
                </span>
                <div>
                  <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500">
                    Stap {inv.currentStep + 1} van 10
                  </p>
                  <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                    {STEPS[inv.currentStep].title}
                  </h3>
                </div>
              </div>
              {/* Progress bar */}
              <div className="hidden items-center gap-2 sm:flex">
                <div className="h-1.5 w-32 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                  <div
                    className="h-full rounded-full bg-orange-500 transition-all duration-500"
                    style={{ width: `${((inv.currentStep + 1) / 10) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-zinc-400">{Math.round(((inv.currentStep + 1) / 10) * 100)}%</span>
              </div>
            </div>
          </div>

          {/* Step content */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            {CurrentStep && <CurrentStep {...stepProps} />}
          </div>

          {/* Navigation footer */}
          <div className="mt-4 flex items-center justify-between">
            <button
              onClick={handlePrev}
              disabled={inv.currentStep === 0}
              className="inline-flex items-center gap-1.5 text-sm text-zinc-500 transition hover:text-zinc-900 disabled:pointer-events-none disabled:opacity-30 dark:hover:text-zinc-100"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Vorige stap
            </button>

            {inv.currentStep < 9 ? (
              <button
                onClick={handleNext}
                className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-orange-600"
              >
                Volgende stap
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                ✓ Onderzoek volledig
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
