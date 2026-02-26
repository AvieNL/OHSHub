'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { ClimateInvestigation } from '@/lib/climate-investigation-types';
import ClimateStep0_PreSurvey from './steps/ClimateStep0_PreSurvey';
import ClimateStep1_Scope from './steps/ClimateStep1_Scope';
import ClimateStep2_WorkAnalysis from './steps/ClimateStep2_WorkAnalysis';
import ClimateStep3_Strategy from './steps/ClimateStep3_Strategy';
import ClimateStep4_Equipment from './steps/ClimateStep4_Equipment';
import ClimateStep5_Measurements from './steps/ClimateStep5_Measurements';
import ClimateStep6_PMV from './steps/ClimateStep6_PMV';
import ClimateStep7_WBGT from './steps/ClimateStep7_WBGT';
import ClimateStep8_PHS from './steps/ClimateStep8_PHS';
import ClimateStep9_IREQ from './steps/ClimateStep9_IREQ';
import ClimateStep10_LocalComfort from './steps/ClimateStep10_LocalComfort';
import ClimateStep11_Measures from './steps/ClimateStep11_Measures';
import ClimateStep12_Report from './steps/ClimateStep12_Report';

const TOTAL_STEPS = 13;

const STEPS: { number: number; title: string; short: string }[] = [
  { number: 1,  title: 'Voorverkenning',                          short: 'Voorverkenning' },
  { number: 2,  title: 'Opdracht & kaders',                       short: 'Kaders' },
  { number: 3,  title: 'Werkanalyse',                             short: 'Werkanalyse' },
  { number: 4,  title: 'Meetstrategie & scenario\'s',             short: 'Strategie' },
  { number: 5,  title: 'Meetapparatuur',                          short: 'Apparatuur' },
  { number: 6,  title: 'Meetwaarden',                             short: 'Metingen' },
  { number: 7,  title: 'Thermisch comfort (PMV/PPD)',             short: 'Comfort' },
  { number: 8,  title: 'Hittestress screening (WBGT)',            short: 'WBGT' },
  { number: 9,  title: 'Hittestress gedetailleerd (PHS)',         short: 'PHS' },
  { number: 10, title: 'Koudestress (IREQ)',                      short: 'IREQ' },
  { number: 11, title: 'Lokaal thermisch comfort',                short: 'Lokaal' },
  { number: 12, title: 'Beheersmaatregelen',                      short: 'Maatregelen' },
  { number: 13, title: 'Rapport',                                 short: 'Rapport' },
];

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

interface Props {
  investigation: ClimateInvestigation;
  onUpdate: (updated: ClimateInvestigation) => void;
  onClose: () => void;
}

export default function ClimateInvestigationShell({ investigation, onUpdate, onClose }: Props) {
  const [inv, setInv] = useState<ClimateInvestigation>(investigation);
  const [saving, setSaving] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const titleInputRef = useRef<HTMLInputElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setInv(investigation);
  }, [investigation.id]);

  const scheduleUpdate = useCallback(
    (updated: ClimateInvestigation) => {
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

  function goToStep(step: number) {
    const updated = { ...inv, currentStep: step };
    scheduleUpdate(updated);
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleNext() {
    if (inv.currentStep < TOTAL_STEPS - 1) goToStep(inv.currentStep + 1);
  }

  function handlePrev() {
    if (inv.currentStep > 0) goToStep(inv.currentStep - 1);
  }

  function handleStepUpdate(partial: Partial<ClimateInvestigation>) {
    scheduleUpdate({ ...inv, ...partial });
  }

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

  const stepProps = { investigation: inv, onUpdate: handleStepUpdate };

  const StepComponents = [
    ClimateStep0_PreSurvey,
    ClimateStep1_Scope,
    ClimateStep2_WorkAnalysis,
    ClimateStep3_Strategy,
    ClimateStep4_Equipment,
    ClimateStep5_Measurements,
    ClimateStep6_PMV,
    ClimateStep7_WBGT,
    ClimateStep8_PHS,
    ClimateStep9_IREQ,
    ClimateStep10_LocalComfort,
    ClimateStep11_Measures,
    ClimateStep12_Report,
  ];
  const CurrentStep = StepComponents[inv.currentStep];

  return (
    <div className="mt-8">
      {/* Top bar */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
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
        <aside className={`${sidebarOpen ? 'flex' : 'hidden'} w-56 shrink-0 flex-col lg:flex`}>
          <nav className="sticky top-16 space-y-1">
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
                    ) : s.number}
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
          <div className="sticky top-16 z-10 mb-6 rounded-xl border border-zinc-200 bg-zinc-50 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-sm font-bold text-white">
                  {inv.currentStep + 1}
                </span>
                <div>
                  <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500">
                    Stap {inv.currentStep + 1} van {TOTAL_STEPS}
                  </p>
                  <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                    {STEPS[inv.currentStep].title}
                  </h3>
                </div>
              </div>
              <div className="hidden items-center gap-2 sm:flex">
                <div className="h-1.5 w-32 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                  <div
                    className="h-full rounded-full bg-orange-500 transition-all duration-500"
                    style={{ width: `${((inv.currentStep + 1) / TOTAL_STEPS) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-zinc-400">{Math.round(((inv.currentStep + 1) / TOTAL_STEPS) * 100)}%</span>
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

            {inv.currentStep < TOTAL_STEPS - 1 ? (
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
