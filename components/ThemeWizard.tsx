'use client';

import { useState, useEffect } from 'react';
import type {
  WizardStep,
  WizardQuestion,
  WizardAnswers,
  RiskAssessmentResult,
  RiskLevel,
  RiskFinding,
  Recommendation,
} from '@/lib/wizard-types';
import { getWizardConfig } from '@/lib/wizard-configs';
import type { ThemeSlug } from '@/lib/themes';

// ─── Module-level helpers ─────────────────────────────────────────────────────

function isRequired(question: WizardQuestion): boolean {
  if (question.required !== undefined) return question.required;
  return question.type !== 'text';
}

function isAnswered(question: WizardQuestion, answers: WizardAnswers): boolean {
  if (!isRequired(question)) return true;
  const answer = answers[question.id];
  if (question.type === 'checkbox') return Array.isArray(answer) && answer.length > 0;
  return typeof answer === 'string' && answer.length > 0;
}

function isStepValid(step: WizardStep, answers: WizardAnswers): boolean {
  const visible = visibleQuestionsOf(step, answers);
  return visible.every((q) => isAnswered(q, answers));
}

function visibleQuestionsOf(step: WizardStep, answers: WizardAnswers): WizardQuestion[] {
  return step.questions.filter((q) => !q.visibleWhen || q.visibleWhen(answers));
}

function resolveAnswerText(question: WizardQuestion, answers: WizardAnswers): string {
  const answer = answers[question.id];
  if (!answer || (Array.isArray(answer) && answer.length === 0)) return '(niet ingevuld)';
  if (Array.isArray(answer)) {
    return answer
      .map((v) => question.options?.find((o) => o.value === v)?.label ?? v)
      .join(', ');
  }
  return question.options?.find((o) => o.value === answer)?.label ?? answer;
}

// ─── Risk level colors ────────────────────────────────────────────────────────

const RISK_COLORS: Record<RiskLevel, { bg: string; text: string; border: string; dot: string }> = {
  critical: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    text: 'text-red-700 dark:text-red-400',
    border: 'border-red-200 dark:border-red-800/50',
    dot: 'bg-red-500',
  },
  high: {
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    text: 'text-orange-700 dark:text-orange-400',
    border: 'border-orange-200 dark:border-orange-800/50',
    dot: 'bg-orange-500',
  },
  medium: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    text: 'text-amber-700 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800/50',
    dot: 'bg-amber-500',
  },
  low: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    text: 'text-emerald-700 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-800/50',
    dot: 'bg-emerald-500',
  },
  unknown: {
    bg: 'bg-zinc-50 dark:bg-zinc-800/50',
    text: 'text-zinc-600 dark:text-zinc-400',
    border: 'border-zinc-200 dark:border-zinc-700',
    dot: 'bg-zinc-400',
  },
};

const RISK_LABELS: Record<RiskLevel, string> = {
  critical: 'Kritisch',
  high: 'Hoog',
  medium: 'Middel',
  low: 'Laag',
  unknown: 'Onbekend',
};

// ─── Report text generator ────────────────────────────────────────────────────

function generateReportText(
  steps: WizardStep[],
  answers: WizardAnswers,
  themeName: string,
  result?: RiskAssessmentResult,
): string {
  const date = new Date().toLocaleDateString('nl-NL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const sep = '═'.repeat(55);
  const subSep = '─'.repeat(45);

  const lines: string[] = [
    `RISICOBEOORDELING RI&E — ${themeName.toUpperCase()}`,
    `Datum: ${date}`,
    sep,
    '',
  ];

  if (result) {
    lines.push(`ALGEHEEL RISICONIVEAU: ${RISK_LABELS[result.overallLevel].toUpperCase()}`);
    lines.push('');

    if (result.dataGaps.length > 0) {
      lines.push('ONTBREKENDE GEGEVENS:');
      result.dataGaps.forEach((g) => lines.push(`  • ${g}`));
      lines.push('');
    }

    lines.push('BEVINDINGEN:');
    lines.push(subSep);
    result.findings.forEach((f) => {
      lines.push(`[${RISK_LABELS[f.level].toUpperCase()}] ${f.topic}`);
      lines.push(`  ${f.summary}`);
      if (f.detail) lines.push(`  ${f.detail}`);
      if (f.legalBasis) lines.push(`  Juridische basis: ${f.legalBasis}`);
      lines.push('');
    });

    lines.push('AANBEVELINGEN:');
    lines.push(subSep);
    result.recommendations.forEach((r) => {
      lines.push(`${r.priority}. [${r.ahsStep}] ${r.action}`);
      lines.push(`   Waarom: ${r.why}`);
      if (r.deadline) lines.push(`   Termijn: ${r.deadline}`);
      if (r.legalBasis) lines.push(`   Juridische basis: ${r.legalBasis}`);
      lines.push('');
    });

    lines.push(sep);
    lines.push('');
  }

  lines.push('ANTWOORDEN:');
  lines.push(subSep);

  const visibleSteps = steps.filter((s) => !s.visibleWhen || s.visibleWhen(answers));
  visibleSteps.forEach((step, index) => {
    lines.push(`Stap ${index + 1} — ${step.title}`);
    visibleQuestionsOf(step, answers).forEach((q) => {
      lines.push(`• ${q.label}`);
      lines.push(`  → ${resolveAnswerText(q, answers)}`);
      lines.push('');
    });
    lines.push('');
  });

  lines.push(sep);
  lines.push('Gegenereerd via OHSHub');

  return lines.join('\n');
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  slug: ThemeSlug;
  themeName: string;
}

export default function ThemeWizard({ slug, themeName }: Props) {
  const config = getWizardConfig(slug);
  const { steps, assessRisk } = config;

  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<WizardAnswers>({});
  const [showValidation, setShowValidation] = useState(false);

  // Compute visible steps based on current answers
  const visibleSteps = steps.filter((s) => !s.visibleWhen || s.visibleWhen(answers));
  const isSummary = currentStep === visibleSteps.length;
  const step = visibleSteps[currentStep];
  const progress = isSummary ? 100 : Math.round((currentStep / visibleSteps.length) * 100);

  // Clamp currentStep if visible steps shrink due to answer changes
  useEffect(() => {
    if (currentStep > visibleSteps.length) {
      setCurrentStep(visibleSteps.length);
    }
  }, [currentStep, visibleSteps.length]);

  function handleRadio(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  function handleCheckbox(questionId: string, value: string, isChecked: boolean) {
    setAnswers((prev) => {
      const current = (prev[questionId] as string[]) ?? [];
      return {
        ...prev,
        [questionId]: isChecked ? [...current, value] : current.filter((v) => v !== value),
      };
    });
  }

  function handleText(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  function handleNext() {
    if (!isStepValid(step, answers)) {
      setShowValidation(true);
      return;
    }
    setShowValidation(false);
    setCurrentStep((s) => s + 1);
  }

  function handlePrev() {
    setShowValidation(false);
    setCurrentStep((s) => s - 1);
  }

  function reset() {
    setCurrentStep(0);
    setAnswers({});
    setShowValidation(false);
  }

  function resolveAnswer(s: WizardStep, questionId: string): string {
    const question = s.questions.find((q) => q.id === questionId);
    const answer = answers[questionId];
    if (!answer || (Array.isArray(answer) && answer.length === 0)) return 'Niet ingevuld';
    if (Array.isArray(answer)) {
      return answer
        .map((v) => question?.options?.find((o) => o.value === v)?.label ?? v)
        .join(', ');
    }
    return question?.options?.find((o) => o.value === answer)?.label ?? answer;
  }

  const stepInvalid = !isSummary && showValidation && step && !isStepValid(step, answers);
  const riskResult = isSummary && assessRisk ? assessRisk(answers) : undefined;

  return (
    <div className="mt-10 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      {/* Progress header */}
      <div className="border-b border-zinc-100 px-8 py-5 dark:border-zinc-800">
        <div className="mb-3 flex items-center justify-between text-sm">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">
            {isSummary
              ? assessRisk
                ? 'Risicobeoordeling'
                : 'Samenvatting'
              : `Stap ${currentStep + 1} van ${visibleSteps.length}`}
          </span>
          <span className="text-zinc-400 dark:text-zinc-500">{themeName}</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div
            className="h-full rounded-full bg-zinc-900 transition-all duration-300 dark:bg-zinc-100"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="px-8 py-8">
        {stepInvalid && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-400">
            <svg
              className="mt-0.5 h-4 w-4 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
            <span>Vul alle verplichte vragen in voordat je verdergaat.</span>
          </div>
        )}

        {isSummary ? (
          riskResult ? (
            <RiskReport
              steps={visibleSteps}
              answers={answers}
              themeName={themeName}
              result={riskResult}
              resolveAnswer={resolveAnswer}
              allSteps={steps}
            />
          ) : (
            <Summary
              steps={visibleSteps}
              answers={answers}
              themeName={themeName}
              resolveAnswer={resolveAnswer}
              allSteps={steps}
            />
          )
        ) : (
          step && (
            <StepContent
              step={step}
              answers={answers}
              showValidation={showValidation}
              onRadio={handleRadio}
              onCheckbox={handleCheckbox}
              onText={handleText}
            />
          )
        )}
      </div>

      {/* Footer navigation */}
      <div className="flex items-center justify-between border-t border-zinc-100 px-8 py-5 dark:border-zinc-800">
        {isSummary ? (
          <>
            <button
              onClick={() => {
                setShowValidation(false);
                setCurrentStep(visibleSteps.length - 1);
              }}
              className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              <ChevronLeft />
              Vorige
            </button>
            <button
              onClick={reset}
              className="rounded-lg border border-zinc-200 px-5 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Opnieuw starten
            </button>
          </>
        ) : (
          <>
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 disabled:pointer-events-none disabled:opacity-30 dark:hover:text-zinc-100"
            >
              <ChevronLeft />
              Vorige
            </button>
            <button
              onClick={handleNext}
              className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              {currentStep === visibleSteps.length - 1 ? 'Bekijk rapport' : 'Volgende'}
              <ChevronRight />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── StepContent ──────────────────────────────────────────────────────────────

interface StepContentProps {
  step: WizardStep;
  answers: WizardAnswers;
  showValidation: boolean;
  onRadio: (id: string, value: string) => void;
  onCheckbox: (id: string, value: string, checked: boolean) => void;
  onText: (id: string, value: string) => void;
}

function StepContent({ step, answers, showValidation, onRadio, onCheckbox, onText }: StepContentProps) {
  const visibleQuestions = visibleQuestionsOf(step, answers);

  return (
    <div>
      <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">{step.title}</h2>
      <p className="mt-1.5 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
        {step.description}
      </p>

      <div className="mt-8 space-y-8">
        {visibleQuestions.map((question) => {
          const hasError = showValidation && isRequired(question) && !isAnswered(question, answers);
          return (
            <fieldset key={question.id}>
              <legend
                className={`mb-3 flex items-start gap-1 text-sm font-medium ${
                  hasError ? 'text-red-600 dark:text-red-400' : 'text-zinc-800 dark:text-zinc-200'
                }`}
              >
                {isRequired(question) && (
                  <span className="mt-px shrink-0 text-red-500" aria-hidden="true">*</span>
                )}
                {question.label}
              </legend>

              {/* Tip */}
              {question.tip && (
                <div className="mb-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2.5 dark:bg-amber-900/15">
                  <svg
                    className="mt-px h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.355a9.727 9.727 0 01-3 0M12 3v1.5M6.22 4.72l1.06 1.06M4.5 12H3m1.72 5.78 1.06-1.06M12 21v-1.5m5.78-1.72-1.06 1.06M21 12h-1.5m-1.72-5.78-1.06 1.06"
                    />
                  </svg>
                  <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-300">
                    {question.tip}
                  </p>
                </div>
              )}

              {/* Radio */}
              {question.type === 'radio' && question.options && (
                <div className="space-y-2">
                  {question.options.map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition ${
                        answers[question.id] === opt.value
                          ? 'border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-800'
                          : hasError
                          ? 'border-red-300 hover:border-red-400 dark:border-red-700 dark:hover:border-red-500'
                          : 'border-zinc-200 hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-500'
                      }`}
                    >
                      <input
                        type="radio"
                        name={question.id}
                        value={opt.value}
                        checked={answers[question.id] === opt.value}
                        onChange={() => onRadio(question.id, opt.value)}
                        className="accent-zinc-900 dark:accent-zinc-100"
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              )}

              {/* Checkbox */}
              {question.type === 'checkbox' && question.options && (
                <div className="space-y-2">
                  {question.options.map((opt) => {
                    const isChecked = ((answers[question.id] as string[]) ?? []).includes(opt.value);
                    return (
                      <label
                        key={opt.value}
                        className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition ${
                          isChecked
                            ? 'border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-800'
                            : hasError
                            ? 'border-red-300 hover:border-red-400 dark:border-red-700 dark:hover:border-red-500'
                            : 'border-zinc-200 hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-500'
                        }`}
                      >
                        <input
                          type="checkbox"
                          value={opt.value}
                          checked={isChecked}
                          onChange={(e) => onCheckbox(question.id, opt.value, e.target.checked)}
                          className="accent-zinc-900 dark:accent-zinc-100"
                        />
                        {opt.label}
                      </label>
                    );
                  })}
                </div>
              )}

              {/* Text */}
              {question.type === 'text' && (
                <textarea
                  rows={3}
                  value={(answers[question.id] as string) ?? ''}
                  onChange={(e) => onText(question.id, e.target.value)}
                  placeholder={question.placeholder}
                  className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-sm text-zinc-800 placeholder-zinc-400 outline-none transition focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-zinc-400"
                />
              )}

              {hasError && (
                <p className="mt-2 text-xs font-medium text-red-500 dark:text-red-400">
                  Maak een keuze voordat je verdergaat.
                </p>
              )}
            </fieldset>
          );
        })}
      </div>
    </div>
  );
}

// ─── Risk UI components ───────────────────────────────────────────────────────

function OverallRiskBadge({ level }: { level: RiskLevel }) {
  const c = RISK_COLORS[level];
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-xl border px-5 py-3 ${c.bg} ${c.border}`}
    >
      <span className={`h-3 w-3 rounded-full ${c.dot}`} />
      <span className={`text-lg font-bold ${c.text}`}>{RISK_LABELS[level]}</span>
    </div>
  );
}

function RiskLevelBadge({ level }: { level: RiskLevel }) {
  const c = RISK_COLORS[level];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${c.bg} ${c.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
      {RISK_LABELS[level]}
    </span>
  );
}

function AhsBadge({ label }: { label: string }) {
  return (
    <span className="inline-block rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
      {label}
    </span>
  );
}

function DataGapsWarning({ gaps }: { gaps: string[] }) {
  return (
    <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800/50 dark:bg-amber-900/15">
      <p className="mb-2 text-sm font-semibold text-amber-800 dark:text-amber-300">
        Ontbrekende gegevens
      </p>
      <ul className="space-y-1">
        {gaps.map((g, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400">
            <span className="mt-1 shrink-0">•</span>
            {g}
          </li>
        ))}
      </ul>
    </div>
  );
}

function FindingsTable({ findings }: { findings: RiskFinding[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50">
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Onderwerp
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Risico
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Bevinding
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {findings.map((f, i) => (
            <tr key={i} className="align-top">
              <td className="px-4 py-3 font-medium text-zinc-800 dark:text-zinc-200 whitespace-nowrap">
                {f.topic}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <RiskLevelBadge level={f.level} />
              </td>
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                {f.summary}
                {f.legalBasis && (
                  <span className="mt-1 block text-xs text-zinc-400 dark:text-zinc-500">
                    {f.legalBasis}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RecommendationCard({ rec }: { rec: Recommendation }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-bold text-white dark:bg-zinc-100 dark:text-zinc-900">
          {rec.priority}
        </span>
        <AhsBadge label={rec.ahsStep} />
        {rec.deadline && (
          <span className="ml-auto text-xs text-zinc-400 dark:text-zinc-500">
            ⏱ {rec.deadline}
          </span>
        )}
      </div>
      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{rec.action}</p>
      <p className="mt-1.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">{rec.why}</p>
      {rec.legalBasis && (
        <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">{rec.legalBasis}</p>
      )}
    </div>
  );
}

// ─── RiskReport ───────────────────────────────────────────────────────────────

interface RiskReportProps {
  steps: WizardStep[];
  answers: WizardAnswers;
  themeName: string;
  result: RiskAssessmentResult;
  resolveAnswer: (step: WizardStep, questionId: string) => string;
  allSteps: WizardStep[];
}

function RiskReport({ steps, answers, themeName, result, resolveAnswer, allSteps }: RiskReportProps) {
  const [copied, setCopied] = useState(false);
  const [answersOpen, setAnswersOpen] = useState(false);

  async function handleCopy() {
    const text = generateReportText(allSteps, answers, themeName, result);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const el = document.createElement('textarea');
      el.value = text;
      el.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
      document.body.appendChild(el);
      el.focus();
      el.select();
      try { document.execCommand('copy'); } catch { /* silent */ }
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  const date = new Date().toLocaleDateString('nl-NL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Risicobeoordeling — {themeName}
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{date}</p>
        </div>
        <button
          onClick={handleCopy}
          className={`inline-flex shrink-0 items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition ${
            copied
              ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700/50 dark:bg-emerald-900/20 dark:text-emerald-400'
              : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
          }`}
        >
          {copied ? <><CheckIcon /> Gekopieerd!</> : <><ClipboardIcon /> Kopieer rapport</>}
        </button>
      </div>

      {/* Overall risk badge */}
      <div className="mt-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          Algeheel risiconiveau
        </p>
        <OverallRiskBadge level={result.overallLevel} />
      </div>

      {/* Data gaps */}
      {result.dataGaps.length > 0 && (
        <div className="mt-6">
          <DataGapsWarning gaps={result.dataGaps} />
        </div>
      )}

      {/* Findings */}
      {result.findings.length > 0 && (
        <div className="mt-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
            Bevindingen
          </p>
          <FindingsTable findings={result.findings} />
        </div>
      )}

      {/* Recommendations */}
      {result.recommendations.length > 0 && (
        <div className="mt-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
            Aanbevelingen — gesorteerd op prioriteit
          </p>
          <div className="space-y-3">
            {result.recommendations.map((r) => (
              <RecommendationCard key={r.priority} rec={r} />
            ))}
          </div>
        </div>
      )}

      {/* Answers (collapsible) */}
      <div className="mt-6 border-t border-zinc-100 pt-4 dark:border-zinc-800">
        <button
          onClick={() => setAnswersOpen((o) => !o)}
          className="flex w-full items-center justify-between text-sm font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
        >
          <span>Ingevulde antwoorden</span>
          <span className="text-xs">{answersOpen ? '▲ Inklappen' : '▼ Uitklappen'}</span>
        </button>

        {answersOpen && (
          <div className="mt-4 space-y-4">
            {steps.map((s, index) => (
              <div
                key={s.id}
                className="rounded-xl border border-zinc-100 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-800/50"
              >
                <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                  Stap {index + 1}
                </p>
                <h3 className="mb-4 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                  {s.title}
                </h3>
                <dl className="space-y-3">
                  {visibleQuestionsOf(s, answers).map((q) => {
                    const answer = resolveAnswer(s, q.id);
                    const isEmpty = answer === 'Niet ingevuld';
                    return (
                      <div key={q.id} className="text-sm">
                        <dt className="text-zinc-500 dark:text-zinc-400">{q.label}</dt>
                        <dd
                          className={`mt-0.5 font-medium ${
                            isEmpty
                              ? 'italic text-zinc-400 dark:text-zinc-600'
                              : 'text-zinc-800 dark:text-zinc-200'
                          }`}
                        >
                          {answer}
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Summary (no assessRisk) ──────────────────────────────────────────────────

interface SummaryProps {
  steps: WizardStep[];
  answers: WizardAnswers;
  themeName: string;
  resolveAnswer: (step: WizardStep, questionId: string) => string;
  allSteps: WizardStep[];
}

function Summary({ steps, answers, themeName, resolveAnswer, allSteps }: SummaryProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const text = generateReportText(allSteps, answers, themeName);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const el = document.createElement('textarea');
      el.value = text;
      el.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
      document.body.appendChild(el);
      el.focus();
      el.select();
      try { document.execCommand('copy'); } catch { /* silent */ }
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Samenvatting</h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Overzicht van alle antwoorden — klaar om te gebruiken in uw RI&E of rapport.
          </p>
        </div>
        <button
          onClick={handleCopy}
          className={`inline-flex shrink-0 items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition ${
            copied
              ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700/50 dark:bg-emerald-900/20 dark:text-emerald-400'
              : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
          }`}
        >
          {copied ? <><CheckIcon /> Gekopieerd!</> : <><ClipboardIcon /> Kopieer tekst voor rapport</>}
        </button>
      </div>

      <div className="mt-8 space-y-4">
        {steps.map((s, index) => (
          <div
            key={s.id}
            className="rounded-xl border border-zinc-100 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-800/50"
          >
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
              Stap {index + 1}
            </p>
            <h3 className="mb-4 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              {s.title}
            </h3>
            <dl className="space-y-3">
              {visibleQuestionsOf(s, answers).map((q) => {
                const answer = resolveAnswer(s, q.id);
                const isEmpty = answer === 'Niet ingevuld';
                return (
                  <div key={q.id} className="text-sm">
                    <dt className="text-zinc-500 dark:text-zinc-400">{q.label}</dt>
                    <dd
                      className={`mt-0.5 font-medium ${
                        isEmpty
                          ? 'italic text-zinc-400 dark:text-zinc-600'
                          : 'text-zinc-800 dark:text-zinc-200'
                      }`}
                    >
                      {answer}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function ChevronLeft() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}
