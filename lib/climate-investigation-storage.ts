import type { ClimateInvestigation } from './climate-investigation-types';

const TYPE = 'climate';

function toInvestigation(row: { id: string; name: string; data: Record<string, unknown>; created_at: string; updated_at: string }): ClimateInvestigation {
  return {
    ...(row.data as Omit<ClimateInvestigation, 'id' | 'name' | 'createdAt' | 'updatedAt'>),
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  } as ClimateInvestigation;
}

export async function getAllClimateInvestigations(): Promise<ClimateInvestigation[]> {
  const res = await fetch(`/api/investigations?type=${TYPE}`);
  if (!res.ok) return [];
  const rows = await res.json();
  return (rows as Parameters<typeof toInvestigation>[0][]).map(toInvestigation);
}

export async function saveClimateInvestigation(inv: ClimateInvestigation): Promise<void> {
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

export async function deleteClimateInvestigation(id: string): Promise<void> {
  await fetch(`/api/investigations/${id}`, { method: 'DELETE' });
}

export function createClimateInvestigation(name: string): ClimateInvestigation {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name,
    createdAt: now,
    updatedAt: now,
    currentStep: 0,
    scenarios: [],
    preSurvey: { responses: {} },
    investigators: [],
    clients: [],
    respondents: [],
    scope: {},
    bgs: [],
    instruments: [],
    measurements: [],
    statistics: [],
    measures: [],
    report: { reviewTriggers: [] },
  };
}

export function newClimateId(): string {
  return crypto.randomUUID();
}
