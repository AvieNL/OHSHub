'use client';

import { useState } from 'react';
import type { ThemeLimitGroup } from '@/lib/theme-legal-info';

interface Props {
  namespace: string;
  contentKey: string;
  initialGroups: ThemeLimitGroup[];
  onSaved?: (groups: ThemeLimitGroup[]) => void;
  valueLabel?: string;
}

export default function StructuredLimitEditor({
  namespace,
  contentKey,
  initialGroups,
  onSaved,
  valueLabel = 'Waarde',
}: Props) {
  const [groups, setGroups] = useState<ThemeLimitGroup[]>(
    JSON.parse(JSON.stringify(initialGroups)), // deep clone
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const isDirty = JSON.stringify(groups) !== JSON.stringify(initialGroups);

  async function persist(next: ThemeLimitGroup[]) {
    setSaving(true);
    await fetch('/api/admin/content', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        namespace,
        key: contentKey,
        value: JSON.stringify(next),
        ctype: 'json',
      }),
    });
    setSaving(false);
    setSaved(true);
    onSaved?.(next);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleReset() {
    await fetch('/api/admin/content', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ namespace, key: contentKey }),
    });
    setGroups(JSON.parse(JSON.stringify(initialGroups)));
    onSaved?.(initialGroups);
  }

  function updateGroupTitle(gi: number, title: string) {
    setGroups((prev) => prev.map((g, i) => (i === gi ? { ...g, title } : g)));
  }

  function addGroup() {
    setGroups((prev) => [...prev, { title: 'Nieuwe groep', limits: [] }]);
  }

  function removeGroup(gi: number) {
    setGroups((prev) => prev.filter((_, i) => i !== gi));
  }

  function addLimit(gi: number) {
    setGroups((prev) =>
      prev.map((g, i) =>
        i === gi ? { ...g, limits: [...g.limits, { label: '', value: '' }] } : g,
      ),
    );
  }

  function removeLimit(gi: number, li: number) {
    setGroups((prev) =>
      prev.map((g, i) =>
        i === gi ? { ...g, limits: g.limits.filter((_, j) => j !== li) } : g,
      ),
    );
  }

  function updateLimit(
    gi: number,
    li: number,
    field: 'label' | 'value' | 'sublabel' | 'targetValue',
    val: string,
  ) {
    setGroups((prev) =>
      prev.map((g, i) =>
        i === gi
          ? {
              ...g,
              limits: g.limits.map((lim, j) =>
                j === li ? { ...lim, [field]: val || undefined } : lim,
              ),
            }
          : g,
      ),
    );
  }

  return (
    <div className="space-y-4">
      {groups.map((group, gi) => (
        <div
          key={gi}
          className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50"
        >
          <div className="mb-3 flex items-center gap-2">
            <input
              type="text"
              value={group.title}
              onChange={(e) => updateGroupTitle(gi, e.target.value)}
              className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
              placeholder="Groepstitel"
            />
            <button
              onClick={() => removeGroup(gi)}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
              title="Groep verwijderen"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-2">
            {group.limits.map((lim, li) => (
              <div
                key={li}
                className="rounded-lg border border-zinc-100 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-900"
              >
                {/* Regel 1: label + verwijderknop */}
                <div className="mb-1.5 flex items-center gap-1.5">
                  <input
                    type="text"
                    value={lim.label}
                    onChange={(e) => updateLimit(gi, li, 'label', e.target.value)}
                    placeholder="Label"
                    className="min-w-0 flex-1 rounded border border-zinc-200 bg-zinc-50 px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                  <button
                    onClick={() => removeLimit(gi, li)}
                    className="shrink-0 rounded p-1 text-zinc-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                {/* Regel 2: sublabel + waarde + streefwaarde */}
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={lim.sublabel ?? ''}
                    onChange={(e) => updateLimit(gi, li, 'sublabel', e.target.value)}
                    placeholder="Sublabel (opt.)"
                    className="min-w-0 flex-1 rounded border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                  <input
                    type="text"
                    value={lim.targetValue ?? ''}
                    onChange={(e) => updateLimit(gi, li, 'targetValue', e.target.value)}
                    placeholder="Streefwaarde (opt.)"
                    className="w-24 shrink-0 rounded border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-mono dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-zinc-100"
                  />
                  <input
                    type="text"
                    value={lim.value}
                    onChange={(e) => updateLimit(gi, li, 'value', e.target.value)}
                    placeholder={valueLabel}
                    className="w-24 shrink-0 rounded border border-sky-200 bg-sky-50 px-2 py-1 text-xs font-mono dark:border-sky-800 dark:bg-sky-950/30 dark:text-zinc-100"
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => addLimit(gi)}
            className="mt-2 rounded-lg border border-dashed border-zinc-300 px-3 py-1 text-xs text-zinc-500 hover:border-zinc-400 hover:text-zinc-700 dark:border-zinc-600 dark:hover:border-zinc-500"
          >
            + Limiet
          </button>
        </div>
      ))}

      <button
        onClick={addGroup}
        className="w-full rounded-xl border border-dashed border-zinc-300 py-2.5 text-sm text-zinc-500 hover:border-zinc-400 hover:text-zinc-700 dark:border-zinc-600 dark:hover:border-zinc-500"
      >
        + Groep toevoegen
      </button>

      <div className="flex items-center gap-2">
        <button
          onClick={() => persist(groups)}
          disabled={!isDirty || saving}
          className="rounded-lg bg-orange-500 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saved ? '✓ Opgeslagen' : saving ? 'Opslaan…' : 'Opslaan'}
        </button>
        <button
          onClick={handleReset}
          className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-500 transition hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          ↺ Reset
        </button>
        {isDirty && <span className="text-xs text-zinc-400">Niet-opgeslagen wijzigingen</span>}
      </div>
    </div>
  );
}
