'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ThemeLegalData, ThemeLimitGroup } from '@/lib/theme-legal-info';
import { renderWithFormulas } from '@/lib/render-with-formulas';
import { useIsAdmin } from '@/components/AdminContext';
import JsonArrayEditor from '@/components/admin/content/JsonArrayEditor';
import NormsEditorClient from '@/components/admin/content/NormsEditorClient';
import StructuredLimitEditor from '@/components/admin/content/StructuredLimitEditor';

interface ThemeLegalInfoProps extends ThemeLegalData {
  className?: string;
  /**
   * DB content overrides for this theme's legal namespace.
   * Keys: 'legislation', 'norms', 'limitGroups', 'adminObligations' (JSON strings).
   */
  contentOverrides?: Record<string, string>;
  /**
   * Supabase namespace for inline editing, e.g. 'theme-legal.sound'.
   * When set, admin sees pencil icons on each sub-panel.
   */
  namespace?: string;
}

function parseOrFallback<T>(raw: string | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

type EditSection = 'legislation' | 'norms' | 'limitGroups' | 'adminObligations';

function PencilBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="Bewerken"
      className="rounded p-0.5 text-zinc-300 opacity-0 transition group-hover/section:opacity-100 hover:bg-orange-50 hover:text-orange-500 dark:text-zinc-600 dark:hover:bg-orange-900/20 dark:hover:text-orange-400"
    >
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    </button>
  );
}

function CancelBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-2 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
    >
      Annuleren
    </button>
  );
}

export default function ThemeLegalInfo({
  color,
  legislation: fallbackLegislation,
  norms: fallbackNorms,
  limitGroups: fallbackLimitGroups,
  adminObligations: fallbackAdminObligations,
  className = '',
  contentOverrides,
  namespace,
}: ThemeLegalInfoProps) {
  const [open, setOpen] = useState(false);
  const [editSection, setEditSection] = useState<EditSection | null>(null);
  const isAdmin = useIsAdmin();
  const router = useRouter();

  const legislation = parseOrFallback(contentOverrides?.['legislation'], fallbackLegislation);
  const norms = parseOrFallback(contentOverrides?.['norms'], fallbackNorms);
  const limitGroups = parseOrFallback<ThemeLimitGroup[] | undefined>(
    contentOverrides?.['limitGroups'],
    fallbackLimitGroups,
  );
  const adminObligations = parseOrFallback(
    contentOverrides?.['adminObligations'],
    fallbackAdminObligations,
  );

  const canEdit = isAdmin && !!namespace;

  function onSaved() {
    setEditSection(null);
    router.refresh();
  }

  const showLimitGroups =
    (limitGroups && limitGroups.length > 0) || (canEdit && fallbackLimitGroups !== undefined);
  const showAdminObligations = adminObligations.length > 0 || canEdit;

  return (
    <div className={className}>
      <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        {/* Inklapbare header */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
        >
          <div className="flex items-center gap-2.5">
            <span className={`h-2 w-2 flex-shrink-0 rounded-full ${color.dot}`} />
            <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
              Wettelijk kader &amp; normen
            </span>
          </div>
          <svg
            className={`h-4 w-4 flex-shrink-0 text-zinc-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {open && (
          <div className="border-t border-zinc-100 p-4 dark:border-zinc-800">
            <div className="grid gap-3 sm:grid-cols-2">

              {/* Wetgeving */}
              <div className="group/section rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
                <div className="mb-2.5 flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Wetgeving
                  </h3>
                  {canEdit && editSection !== 'legislation' && (
                    <PencilBtn onClick={() => setEditSection('legislation')} />
                  )}
                </div>
                {editSection === 'legislation' ? (
                  <>
                    <JsonArrayEditor
                      namespace={namespace!}
                      contentKey="legislation"
                      initialItems={legislation}
                      itemLabel="Wetsbepaling"
                      onSaved={onSaved}
                    />
                    <CancelBtn onClick={() => setEditSection(null)} />
                  </>
                ) : (
                  <ul className="space-y-1.5">
                    {legislation.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                        <span className={`mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full ${color.dot}`} />
                        {renderWithFormulas(item)}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Toepasselijke normen */}
              <div className="group/section rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
                <div className="mb-2.5 flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Toepasselijke normen
                  </h3>
                  {canEdit && editSection !== 'norms' && (
                    <PencilBtn onClick={() => setEditSection('norms')} />
                  )}
                </div>
                {editSection === 'norms' ? (
                  <>
                    <NormsEditorClient
                      namespace={namespace!}
                      initialNorms={norms}
                      onSaved={onSaved}
                    />
                    <CancelBtn onClick={() => setEditSection(null)} />
                  </>
                ) : (
                  <ul className="space-y-3">
                    {norms.map((n, i) => (
                      <li key={i}>
                        <div className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                          {renderWithFormulas(n.name)}
                        </div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400">
                          {renderWithFormulas(n.desc)}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Grenswaarden */}
              {showLimitGroups && (
                <div className="group/section rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
                  <div className="mb-2.5 flex items-center justify-between">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                      Grenswaarden
                    </h3>
                    {canEdit && editSection !== 'limitGroups' && (
                      <PencilBtn onClick={() => setEditSection('limitGroups')} />
                    )}
                  </div>
                  {editSection === 'limitGroups' ? (
                    <>
                      <StructuredLimitEditor
                        namespace={namespace!}
                        contentKey="limitGroups"
                        initialGroups={limitGroups ?? []}
                        onSaved={onSaved}
                      />
                      <CancelBtn onClick={() => setEditSection(null)} />
                    </>
                  ) : (
                    <div className="space-y-4">
                      {(limitGroups ?? []).map((group, gi) => (
                        <div key={gi}>
                          <div className="mb-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                            {renderWithFormulas(group.title)}
                          </div>
                          <div className="space-y-1.5">
                            {group.limits.map((lim, li) => (
                              <div
                                key={li}
                                className={`flex items-center justify-between rounded-lg border px-3 py-2 ${color.limitBg} ${color.limitBorder}`}
                              >
                                <span className="text-xs text-zinc-600 dark:text-zinc-400">
                                  {renderWithFormulas(lim.label)}
                                  {lim.sublabel && (
                                    <span className="ml-1 text-zinc-400 dark:text-zinc-500">
                                      ({renderWithFormulas(lim.sublabel)})
                                    </span>
                                  )}
                                </span>
                                <span className="font-mono text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                                  {renderWithFormulas(lim.value)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Administratieve verplichtingen */}
              {showAdminObligations && (
                <div className="group/section rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
                  <div className="mb-2.5 flex items-center justify-between">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                      Administratieve verplichtingen
                    </h3>
                    {canEdit && editSection !== 'adminObligations' && (
                      <PencilBtn onClick={() => setEditSection('adminObligations')} />
                    )}
                  </div>
                  {editSection === 'adminObligations' ? (
                    <>
                      <JsonArrayEditor
                        namespace={namespace!}
                        contentKey="adminObligations"
                        initialItems={adminObligations}
                        itemLabel="Verplichting"
                        onSaved={onSaved}
                      />
                      <CancelBtn onClick={() => setEditSection(null)} />
                    </>
                  ) : (
                    <ul className="space-y-1.5">
                      {adminObligations.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                          <span className={`mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full ${color.dot}`} />
                          {renderWithFormulas(item)}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
