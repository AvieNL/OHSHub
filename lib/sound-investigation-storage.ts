import type { SoundInvestigation } from './sound-investigation-types';

const TYPE = 'sound';

function toInvestigation(row: { id: string; name: string; data: Record<string, unknown>; created_at: string; updated_at: string }): SoundInvestigation {
  return {
    ...(row.data as Omit<SoundInvestigation, 'id' | 'name' | 'createdAt' | 'updatedAt'>),
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  } as SoundInvestigation;
}

export async function getAllSoundInvestigations(): Promise<SoundInvestigation[]> {
  const res = await fetch(`/api/investigations?type=${TYPE}`);
  if (!res.ok) return [];
  const rows = await res.json();
  return (rows as Parameters<typeof toInvestigation>[0][]).map(toInvestigation);
}

export async function saveSoundInvestigation(inv: SoundInvestigation): Promise<void> {
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

export async function deleteSoundInvestigation(id: string): Promise<void> {
  await fetch(`/api/investigations/${id}`, { method: 'DELETE' });
}

export function createSoundInvestigation(name: string): SoundInvestigation {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name,
    createdAt: now,
    updatedAt: now,
    currentStep: 0,
    preSurvey: { responses: {} },
    investigators: [],
    clients: [],
    respondents: [],
    scope: {},
    hegs: [],
    tasks: [],
    equipment: [],
    instruments: [],
    measurementSeries: [],
    measurements: [],
    statistics: [],
    measures: [],
    report: { reviewTriggers: [] },
  };
}

export function newSoundId(): string {
  return crypto.randomUUID();
}
