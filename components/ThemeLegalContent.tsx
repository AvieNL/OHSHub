'use client';

import { useState } from 'react';
import type { ThemeLegalItem, ThemeLimitGroup } from '@/lib/theme-legal-info';
import { renderWithFormulas } from '@/lib/render-with-formulas';
import InlineMd from '@/components/InlineMd';
import { useIsAdmin } from '@/components/AdminContext';
import LegalItemsEditor from '@/components/admin/content/LegalItemsEditor';
import StructuredLimitEditor from '@/components/admin/content/StructuredLimitEditor';

interface ColorProps {
  dot: string;
  limitBg: string;
  limitBorder: string;
}

type EditSection = 'legislation' | 'norms' | 'limitGroups' | 'comfortGroups';

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

// ─── Named section sub-components (pure display) ─────────────────────────────
// Exported so ThemeLegalInfo and other consumers can use them individually.

export function LegislationList({ items }: { items: ThemeLegalItem[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item, i) => (
        <li key={i} style={{ paddingLeft: `${(item.indent ?? 0) * 16}px` }}>
          <div className="text-sm text-zinc-700 dark:text-zinc-300">
            <InlineMd>{item.name}</InlineMd>
          </div>
          {item.desc && (
            <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              <InlineMd>{item.desc}</InlineMd>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

export function NormsList({ items }: { items: ThemeLegalItem[] }) {
  return (
    <ul className="space-y-3">
      {items.map((n, i) => (
        <li key={i} style={{ paddingLeft: `${(n.indent ?? 0) * 16}px` }}>
          <div className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
            <InlineMd>{n.name}</InlineMd>
          </div>
          {n.desc && (
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              <InlineMd>{n.desc}</InlineMd>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

export function LimitGroupsList({
  groups,
  color,
}: {
  groups: ThemeLimitGroup[];
  color: ColorProps;
}) {
  return (
    <div className="space-y-4">
      {groups.map((group, gi) => (
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
                <span className="flex items-center gap-2">
                  <span className="font-mono text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                    {renderWithFormulas(lim.value)}
                  </span>
                  {lim.targetValue && (
                    <span className="font-mono text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                      {renderWithFormulas(lim.targetValue)}
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ComfortGroupsList({ groups }: { groups: ThemeLimitGroup[] }) {
  const hasTargetValues = groups.some((g) => g.limits.some((l) => l.targetValue));
  return (
    <div className="space-y-4">
      {groups.map((group, gi) => (
        <div key={gi}>
          <div className="mb-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400">
            {renderWithFormulas(group.title)}
          </div>
          {hasTargetValues && (
            <div className="mb-1 flex justify-end gap-4 pr-3 text-xs text-zinc-400 dark:text-zinc-500">
              <span className="w-20 text-right">Streefwaarde</span>
              <span className="w-20 text-right">Max. toelaatbaar</span>
            </div>
          )}
          <div className="space-y-1.5">
            {group.limits.map((lim, li) => (
              <div
                key={li}
                className="flex items-center justify-between rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 dark:border-sky-900/60 dark:bg-sky-950/20"
              >
                <span className="text-xs text-zinc-600 dark:text-zinc-400">
                  {renderWithFormulas(lim.label)}
                  {lim.sublabel && (
                    <span className="ml-1 text-zinc-400 dark:text-zinc-500">
                      ({renderWithFormulas(lim.sublabel)})
                    </span>
                  )}
                </span>
                <span className="flex items-center gap-4">
                  {lim.targetValue ? (
                    <span className="w-20 text-right font-mono text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                      {renderWithFormulas(lim.targetValue)}
                    </span>
                  ) : hasTargetValues ? (
                    <span className="w-20" />
                  ) : null}
                  <span className="w-20 text-right font-mono text-sm font-semibold text-sky-700 dark:text-sky-300">
                    {renderWithFormulas(lim.value)}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Composite component ──────────────────────────────────────────────────────
// Renders all four sections in a 2-column grid.
// Pass `namespace` to enable admin pencil-edit buttons (shared logic for both
// the kennisportaal and the investigation tab ThemeLegalInfo panel).

interface ThemeLegalContentProps {
  legislation: ThemeLegalItem[];
  norms: ThemeLegalItem[];
  limitGroups?: ThemeLimitGroup[];
  comfortGroups?: ThemeLimitGroup[];
  color: ColorProps;
  /** Supabase namespace, e.g. 'theme-legal.sound'. Enables admin edit UI when set. */
  namespace?: string;
  className?: string;
}

export default function ThemeLegalContent({
  legislation,
  norms,
  limitGroups,
  comfortGroups,
  color,
  namespace,
  className = '',
}: ThemeLegalContentProps) {
  const isAdmin = useIsAdmin();
  const canEdit = isAdmin && !!namespace;
  const [editSection, setEditSection] = useState<EditSection | null>(null);

  function onSaved() {
    setEditSection(null);
    window.location.reload();
  }

  const showLimitGroups = limitGroups && limitGroups.length > 0;
  const showComfortGroups = comfortGroups && comfortGroups.length > 0;

  return (
    <div className={`grid gap-3 sm:grid-cols-2 ${className}`}>

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
            <LegalItemsEditor
              namespace={namespace!}
              contentKey="legislation"
              initialItems={legislation}
              addLabel="Wetsbepaling"
              onSaved={onSaved}
            />
            <CancelBtn onClick={() => setEditSection(null)} />
          </>
        ) : (
          <LegislationList items={legislation} />
        )}
      </div>

      {/* Normen en richtlijnen */}
      <div className="group/section rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
        <div className="mb-2.5 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Normen en richtlijnen
          </h3>
          {canEdit && editSection !== 'norms' && (
            <PencilBtn onClick={() => setEditSection('norms')} />
          )}
        </div>
        {editSection === 'norms' ? (
          <>
            <LegalItemsEditor
              namespace={namespace!}
              contentKey="norms"
              initialItems={norms}
              addLabel="Norm"
              onSaved={onSaved}
            />
            <CancelBtn onClick={() => setEditSection(null)} />
          </>
        ) : (
          <NormsList items={norms} />
        )}
      </div>

      {/* Grenswaarden — full width */}
      {(showLimitGroups || (canEdit && limitGroups !== undefined)) && (
        <div className="group/section sm:col-span-2 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
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
            <LimitGroupsList groups={limitGroups ?? []} color={color} />
          )}
        </div>
      )}

      {/* Comfortwaarden — full width */}
      {(showComfortGroups || (canEdit && comfortGroups !== undefined)) && (
        <div className="group/section sm:col-span-2 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
          <div className="mb-2.5 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Comfortwaarden
            </h3>
            {canEdit && editSection !== 'comfortGroups' && (
              <PencilBtn onClick={() => setEditSection('comfortGroups')} />
            )}
          </div>
          {editSection === 'comfortGroups' ? (
            <>
              <StructuredLimitEditor
                namespace={namespace!}
                contentKey="comfortGroups"
                initialGroups={comfortGroups ?? []}
                onSaved={onSaved}
                valueLabel="Max. toelaatbaar"
              />
              <CancelBtn onClick={() => setEditSection(null)} />
            </>
          ) : (
            <ComfortGroupsList groups={comfortGroups ?? []} />
          )}
        </div>
      )}


    </div>
  );
}
