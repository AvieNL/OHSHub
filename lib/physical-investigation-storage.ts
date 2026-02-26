import type { PhysicalInvestigation } from './physical-investigation-types';

const TYPE = 'physical';

function toInvestigation(row: { id: string; name: string; data: Record<string, unknown>; created_at: string; updated_at: string }): PhysicalInvestigation {
  return {
    ...(row.data as Omit<PhysicalInvestigation, 'id' | 'name' | 'createdAt' | 'updatedAt'>),
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  } as PhysicalInvestigation;
}

export async function getAllPhysicalInvestigations(): Promise<PhysicalInvestigation[]> {
  const res = await fetch(`/api/investigations?type=${TYPE}`);
  if (!res.ok) return [];
  const rows = await res.json();
  return (rows as Parameters<typeof toInvestigation>[0][]).map(toInvestigation);
}

export async function savePhysicalInvestigation(inv: PhysicalInvestigation): Promise<void> {
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

export async function deletePhysicalInvestigation(id: string): Promise<void> {
  await fetch(`/api/investigations/${id}`, { method: 'DELETE' });
}

export function createPhysicalInvestigation(name: string): PhysicalInvestigation {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name,
    createdAt: now,
    updatedAt: now,
    currentStep: 0,
    methods: [],
    preSurvey: { responses: {} },
    investigators: [],
    clients: [],
    respondents: [],
    scope: {},
    bgs: [],
    liftingTasks: [],
    carryingTasks: [],
    pushPullTasks: [],
    repetitiveTasks: [],
    postureObservations: [],
    forceTasks: [],
    statistics: [],
    measures: [],
    report: { reviewTriggers: [] },
  };
}

export function newPhysicalId(): string {
  return crypto.randomUUID();
}
