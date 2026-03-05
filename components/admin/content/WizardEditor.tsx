'use client';

import { useState } from 'react';
import type { WizardStep } from '@/lib/wizard-types';

interface Props {
  namespace: string;
  steps: WizardStep[];
  /** Initial DB overrides for this wizard namespace */
  initialOverrides: Record<string, string>;
}

/** Build the flat key for a step field */
function stepKey(stepId: string, field: 'title' | 'description') {
  return `step.${stepId}.${field}`;
}
function questionKey(stepId: string, qId: string, field: 'label' | 'tip' | 'placeholder') {
  return `step.${stepId}.q.${qId}.${field}`;
}
function optionKey(stepId: string, qId: string, value: string) {
  return `step.${stepId}.q.${qId}.opt.${value}.label`;
}

interface FieldEditorProps {
  namespace: string;
  contentKey: string;
  /** Huidige waarde: DB-override ?? hardcoded fallback */
  initialValue: string;
  /** Hardcoded standaardwaarde — wordt hersteld na reset */
  fallback: string;
  placeholder?: string;
  multiline?: boolean;
  onSaved: (key: string, value: string) => void;
}

function FieldEditor({
  namespace,
  contentKey,
  initialValue,
  fallback,
  placeholder,
  multiline,
  onSaved,
}: FieldEditorProps) {
  const [value, setValue] = useState(initialValue);
  const [committed, setCommitted] = useState(initialValue);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const isDirty = value !== committed;
  const hasOverride = committed !== fallback;

  async function handleSave() {
    setSaving(true);
    await fetch('/api/admin/content', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ namespace, key: contentKey, value, ctype: 'plain' }),
    });
    setSaving(false);
    setSaved(true);
    setCommitted(value);
    onSaved(contentKey, value);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleReset() {
    await fetch('/api/admin/content', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ namespace, key: contentKey }),
    });
    setValue(fallback);
    setCommitted(fallback);
    onSaved(contentKey, '');
  }

  const inputClass =
    'flex-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-sm text-zinc-800 placeholder-zinc-400 outline-none transition focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-zinc-500';

  return (
    <div className="flex items-start gap-2">
      {multiline ? (
        <textarea
          rows={2}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className={inputClass}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className={inputClass}
        />
      )}
      <div className="flex shrink-0 gap-1">
        <button
          onClick={handleSave}
          disabled={!isDirty || saving}
          className="rounded-lg bg-orange-500 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-orange-600 disabled:opacity-40"
        >
          {saved ? '✓' : saving ? '…' : 'OK'}
        </button>
        {hasOverride && (
          <button
            onClick={handleReset}
            className="rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs text-zinc-400 transition hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
            title="Reset"
          >
            ↺
          </button>
        )}
      </div>
    </div>
  );
}

export default function WizardEditor({ namespace, steps, initialOverrides }: Props) {
  const [overrides, setOverrides] = useState<Record<string, string>>(initialOverrides);
  const [openSteps, setOpenSteps] = useState<Set<string>>(new Set());

  function toggleStep(id: string) {
    setOpenSteps((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleSaved(key: string, value: string) {
    setOverrides((prev) => ({ ...prev, [key]: value }));
  }

  function resolveValue(key: string, fallback: string) {
    return overrides[key] ?? fallback;
  }

  return (
    <div className="space-y-2">
      {steps.map((step, si) => {
        const isOpen = openSteps.has(step.id);
        const titleKey = stepKey(step.id, 'title');
        const descKey = stepKey(step.id, 'description');

        return (
          <div
            key={step.id}
            className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700"
          >
            {/* Step header */}
            <button
              type="button"
              onClick={() => toggleStep(step.id)}
              className="flex w-full items-center justify-between gap-3 bg-zinc-50 px-4 py-3 text-left dark:bg-zinc-800/50"
            >
              <div className="flex items-center gap-2.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-bold text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                  {si + 1}
                </span>
                <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  {resolveValue(titleKey, step.title)}
                </span>
                <span className="text-xs text-zinc-400">({step.questions.length} vragen)</span>
              </div>
              <svg
                className={`h-4 w-4 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Step content */}
            {isOpen && (
              <div className="border-t border-zinc-100 p-4 dark:border-zinc-800">
                {/* Step title & description */}
                <div className="mb-4 space-y-2">
                  <div>
                    <p className="mb-1 text-xs font-medium text-zinc-400">Stap-titel</p>
                    <FieldEditor
                      namespace={namespace}
                      contentKey={titleKey}
                      initialValue={resolveValue(titleKey, step.title)}
                      fallback={step.title}
                      onSaved={handleSaved}
                    />
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-medium text-zinc-400">Stap-omschrijving</p>
                    <FieldEditor
                      namespace={namespace}
                      contentKey={descKey}
                      initialValue={resolveValue(descKey, step.description)}
                      fallback={step.description}
                      multiline
                      onSaved={handleSaved}
                    />
                  </div>
                </div>

                {/* Questions */}
                <div className="space-y-4">
                  {step.questions.map((q) => {
                    const lKey = questionKey(step.id, q.id, 'label');
                    const tKey = questionKey(step.id, q.id, 'tip');
                    const pKey = questionKey(step.id, q.id, 'placeholder');

                    return (
                      <div
                        key={q.id}
                        className="rounded-lg border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/50"
                      >
                        <div className="mb-2 flex items-center gap-2">
                          <span className="rounded bg-zinc-200 px-1.5 py-0.5 font-mono text-xs text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400">
                            {q.id}
                          </span>
                          <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800">
                            {q.type}
                          </span>
                        </div>

                        <div className="space-y-2">
                          <div>
                            <p className="mb-1 text-xs text-zinc-400">Label</p>
                            <FieldEditor
                              namespace={namespace}
                              contentKey={lKey}
                              initialValue={resolveValue(lKey, q.label)}
                              fallback={q.label}
                              onSaved={handleSaved}
                            />
                          </div>

                          {q.tip !== undefined && (
                            <div>
                              <p className="mb-1 text-xs text-zinc-400">Tip</p>
                              <FieldEditor
                                namespace={namespace}
                                contentKey={tKey}
                                initialValue={resolveValue(tKey, q.tip ?? '')}
                                fallback={q.tip ?? ''}
                                multiline
                                onSaved={handleSaved}
                              />
                            </div>
                          )}

                          {q.type === 'text' && (
                            <div>
                              <p className="mb-1 text-xs text-zinc-400">Placeholder</p>
                              <FieldEditor
                                namespace={namespace}
                                contentKey={pKey}
                                initialValue={resolveValue(pKey, q.placeholder ?? '')}
                                fallback={q.placeholder ?? ''}
                                onSaved={handleSaved}
                              />
                            </div>
                          )}

                          {/* Options */}
                          {q.options && q.options.length > 0 && (
                            <div>
                              <p className="mb-1 text-xs text-zinc-400">Antwoordopties</p>
                              <div className="space-y-1">
                                {q.options.map((opt) => {
                                  const oKey = optionKey(step.id, q.id, opt.value);
                                  return (
                                    <div key={opt.value} className="flex items-center gap-2">
                                      <span className="w-24 shrink-0 truncate font-mono text-xs text-zinc-400">
                                        {opt.value}
                                      </span>
                                      <FieldEditor
                                        namespace={namespace}
                                        contentKey={oKey}
                                        initialValue={resolveValue(oKey, opt.label)}
                                        fallback={opt.label}
                                        onSaved={handleSaved}
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
