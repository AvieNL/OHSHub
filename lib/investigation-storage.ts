import type { Investigation, InvestigationScope, InvestigationReport } from './investigation-types';

const TYPE = 'hazardous';

function toInvestigation(row: { id: string; name: string; data: Record<string, unknown>; created_at: string; updated_at: string }): Investigation {
  const inv = {
    ...(row.data as Omit<Investigation, 'id' | 'name' | 'createdAt' | 'updatedAt'>),
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  } as Investigation;
  // Normalize legacy fields
  return {
    ...inv,
    investigators: inv.investigators ?? ((inv as unknown as { investigator?: string }).investigator ? [{ id: 'legacy', name: (inv as unknown as { investigator: string }).investigator }] : []),
    clients: inv.clients ?? ((inv as unknown as { company?: string }).company ? [{ id: 'legacy', organization: (inv as unknown as { company: string }).company, name: '' }] : []),
    respondents: inv.respondents ?? [],
  };
}

export async function getAllInvestigations(): Promise<Investigation[]> {
  const res = await fetch(`/api/investigations?type=${TYPE}`);
  if (!res.ok) return [];
  const rows = await res.json();
  return (rows as Parameters<typeof toInvestigation>[0][]).map(toInvestigation);
}

export async function getInvestigation(id: string): Promise<Investigation | undefined> {
  const res = await fetch(`/api/investigations/${id}`);
  if (!res.ok) return undefined;
  const row = await res.json();
  return toInvestigation(row);
}

export async function saveInvestigation(inv: Investigation): Promise<void> {
  const { id, name, createdAt, updatedAt, ...rest } = inv;
  await fetch('/api/investigations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id,
      type: TYPE,
      name,
      data: rest,
      created_at: createdAt,
      updated_at: new Date().toISOString(),
    }),
  });
}

export async function deleteInvestigation(id: string): Promise<void> {
  await fetch(`/api/investigations/${id}`, { method: 'DELETE' });
}

export function createInvestigation(name: string): Investigation {
  const now = new Date().toISOString();
  const emptyScope: InvestigationScope = {
    question: '',
    departments: '',
    isPartOfRIE: false,
    atexApplicable: false,
    arieApplicable: false,
    applicableNorms: ['nen-en-689', 'reach', 'clp'],
    notes: '',
  };
  const emptyReport: InvestigationReport = {
    conclusion: '',
    nextReviewDate: '',
    nextReviewTriggers: [],
    historicalNotes: '',
  };
  return {
    id: crypto.randomUUID(),
    name,
    investigators: [],
    clients: [],
    respondents: [],
    createdAt: now,
    updatedAt: now,
    currentStep: 0,
    scope: emptyScope,
    substances: [],
    tasks: [],
    initialEstimates: [],
    segs: [],
    measurementPlans: [],
    measurementSeries: [],
    controlMeasures: [],
    report: emptyReport,
  };
}

export function newId(): string {
  return crypto.randomUUID();
}
