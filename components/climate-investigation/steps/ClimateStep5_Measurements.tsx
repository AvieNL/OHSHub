'use client';

import { useState } from 'react';
import type { ClimateInvestigation, ClimateMeasurement, ClimateBG } from '@/lib/climate-investigation-types';
import { newClimateId } from '@/lib/climate-investigation-storage';
import { computeMeanRadiantFromGlobe, computeVapourPressure } from '@/lib/climate-stats';
import { Abbr } from '@/components/Abbr';
import { Formula } from '@/components/Formula';
import { InfoBox } from '@/components/InfoBox';

interface Props {
  investigation: ClimateInvestigation;
  onUpdate: (partial: Partial<ClimateInvestigation>) => void;
}

function fmt1(v: number | undefined): string {
  return v != null ? v.toFixed(1) : '—';
}

function MeasurementForm({
  measurement,
  scenarios,
  onSave,
  onCancel,
}: {
  measurement: ClimateMeasurement;
  scenarios: string[];
  onSave: (m: ClimateMeasurement) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState(measurement);

  function upd(partial: Partial<ClimateMeasurement>) {
    setForm((prev) => ({ ...prev, ...partial }));
  }

  // Auto-bereken t_r uit t_g als beschikbaar
  const computedTr = form.t_g != null ? computeMeanRadiantFromGlobe(form.t_g, form.t_a, form.v_ar) : null;
  const computedPa = computeVapourPressure(form.t_a, form.RH);

  const INPUT = 'w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-orange-400';
  const needsHeat = scenarios.includes('heat');
  const needsComfort = scenarios.includes('comfort');
  const needsCold = scenarios.includes('cold');
  const needsLocal = scenarios.includes('local');

  return (
    <div className="space-y-4 rounded-xl border border-orange-200 bg-orange-50/50 p-4 dark:border-orange-800/50 dark:bg-orange-900/10">
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Datum</label>
          <input type="date" value={form.date ?? ''} onChange={(e) => upd({ date: e.target.value })} className={INPUT} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Starttijd</label>
          <input type="time" value={form.startTime ?? ''} onChange={(e) => upd({ startTime: e.target.value })} className={INPUT} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Meetronde #</label>
          <input type="number" min={1} value={form.measurementRound ?? ''} onChange={(e) => upd({ measurementRound: parseInt(e.target.value) || undefined })} placeholder="1" className={INPUT} />
        </div>
      </div>

      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Primaire meetwaarden</p>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
            t_a — Luchttemperatuur (°C) <span className="text-red-400">*</span>
          </label>
          <input type="number" step={0.1} value={form.t_a || ''} onChange={(e) => upd({ t_a: parseFloat(e.target.value) || 0 })} placeholder="22.5" className={INPUT} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
            t_g — Globetemperatuur (°C)
          </label>
          <input type="number" step={0.1} value={form.t_g ?? ''} onChange={(e) => upd({ t_g: parseFloat(e.target.value) || undefined })} placeholder="—" className={INPUT} />
          {computedTr != null && (
            <p className="mt-0.5 text-xs text-zinc-400">→ t_r ≈ {fmt1(computedTr)} °C (berekend)</p>
          )}
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
            t_r — Stralingstemperatuur (°C) <span className="text-zinc-400">(of gebruik t_g)</span>
          </label>
          <input type="number" step={0.1} value={form.t_r ?? ''} onChange={(e) => upd({ t_r: parseFloat(e.target.value) || undefined })} placeholder={computedTr != null ? fmt1(computedTr) : '—'} className={INPUT} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
            v_ar — Luchtsnelheid (m/s) <span className="text-red-400">*</span>
          </label>
          <input type="number" min={0} step={0.01} value={form.v_ar || ''} onChange={(e) => upd({ v_ar: parseFloat(e.target.value) || 0 })} placeholder="0.15" className={INPUT} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
            RH — Relatieve vochtigheid (%) <span className="text-red-400">*</span>
          </label>
          <input type="number" min={0} max={100} step={1} value={form.RH || ''} onChange={(e) => upd({ RH: parseFloat(e.target.value) || 50 })} placeholder="50" className={INPUT} />
          <p className="mt-0.5 text-xs text-zinc-400">p_a ≈ {Math.round(computedPa)} Pa</p>
        </div>
        {needsHeat && (
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
              t_nw — Natte boltemperatuur (°C) <span className="text-xs text-amber-500">(WBGT)</span>
            </label>
            <input type="number" step={0.1} value={form.t_nw ?? ''} onChange={(e) => upd({ t_nw: parseFloat(e.target.value) || undefined })} placeholder="—" className={INPUT} />
          </div>
        )}
      </div>

      {needsHeat && (
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.solarLoad ?? false}
            onChange={(e) => upd({ solarLoad: e.target.checked })}
            className="accent-orange-500"
          />
          <span className="text-zinc-700 dark:text-zinc-300">
            Zonlast aanwezig <span className="text-zinc-400">(WBGT = 0,7·t_nw + 0,2·t_g + 0,1·t_a)</span>
          </span>
        </label>
      )}

      {/* Lokaal comfort */}
      {needsLocal && (
        <>
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Lokaal thermisch comfort (§6 ISO 7730)</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">t_a enkelhoogte (0,1 m, °C)</label>
              <input type="number" step={0.1} value={form.t_a_ankle ?? ''} onChange={(e) => upd({ t_a_ankle: parseFloat(e.target.value) || undefined })} placeholder="—" className={INPUT} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">t_a hoofdhoogte (1,1–1,7 m, °C)</label>
              <input type="number" step={0.1} value={form.t_a_head ?? ''} onChange={(e) => upd({ t_a_head: parseFloat(e.target.value) || undefined })} placeholder="—" className={INPUT} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Vloertemperatuur (°C)</label>
              <input type="number" step={0.1} value={form.t_floor ?? ''} onChange={(e) => upd({ t_floor: parseFloat(e.target.value) || undefined })} placeholder="—" className={INPUT} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Stralingsasymmetrie warm plafond Δt_pr (K)</label>
              <input type="number" step={0.5} value={form.radAsymmetryWarmCeiling ?? ''} onChange={(e) => upd({ radAsymmetryWarmCeiling: parseFloat(e.target.value) || undefined })} placeholder="—" className={INPUT} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Stralingsasymmetrie koude wand Δt_pr (K)</label>
              <input type="number" step={0.5} value={form.radAsymmetryColdWall ?? ''} onChange={(e) => upd({ radAsymmetryColdWall: parseFloat(e.target.value) || undefined })} placeholder="—" className={INPUT} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Stralingsasymmetrie warm raam Δt_pr (K)</label>
              <input type="number" step={0.5} value={form.radAsymmetryWarmWindow ?? ''} onChange={(e) => upd({ radAsymmetryWarmWindow: parseFloat(e.target.value) || undefined })} placeholder="—" className={INPUT} />
            </div>
          </div>
        </>
      )}

      {/* Opmerkingen */}
      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Opmerkingen / afwijkingen</label>
        <input type="text" value={form.notes ?? ''} onChange={(e) => upd({ notes: e.target.value })} placeholder="Bijv. oven actief, ramen open, hittegolf…" className={INPUT} />
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.excluded ?? false}
          onChange={(e) => upd({ excluded: e.target.checked })}
          className="accent-orange-500"
        />
        <span className="text-zinc-700 dark:text-zinc-300">Meting uitsluiten van berekeningen</span>
      </label>

      {form.excluded && (
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Reden uitsluiting</label>
          <input type="text" value={form.exclusionReason ?? ''} onChange={(e) => upd({ exclusionReason: e.target.value })} placeholder="Bijv. niet-representatieve omstandigheden" className={INPUT} />
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => onSave(form)}
          className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600"
        >
          Opslaan
        </button>
        <button
          onClick={onCancel}
          className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          Annuleren
        </button>
      </div>
    </div>
  );
}

function BGSection({
  bg,
  measurements,
  scenarios,
  onAddMeasurement,
  onUpdateMeasurement,
  onDeleteMeasurement,
}: {
  bg: ClimateBG;
  measurements: ClimateMeasurement[];
  scenarios: string[];
  onAddMeasurement: (bgId: string) => void;
  onUpdateMeasurement: (m: ClimateMeasurement) => void;
  onDeleteMeasurement: (id: string) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const bgMeasurements = measurements.filter((m) => m.bgId === bg.id);

  function saveEdit(updated: ClimateMeasurement) {
    onUpdateMeasurement(updated);
    setEditingId(null);
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/30">
      <div className="border-b border-zinc-200 px-5 py-3 dark:border-zinc-700">
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{bg.name}</p>
        <p className="text-xs text-zinc-400">
          {bg.workerCount} medewerker{bg.workerCount !== 1 ? 's' : ''} · M = {bg.metabolicRateOverride ?? (bg.metabolicClass !== undefined ? [115, 180, 300, 415, 520][bg.metabolicClass] : 180)} W/m² · I_cl = {bg.clothingInsulation} clo
        </p>
      </div>

      <div className="p-4 space-y-3">
        {bgMeasurements.map((m) =>
          editingId === m.id ? (
            <MeasurementForm
              key={m.id}
              measurement={m}
              scenarios={scenarios}
              onSave={saveEdit}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <div
              key={m.id}
              className={`rounded-lg border px-4 py-3 text-xs ${
                m.excluded
                  ? 'border-zinc-200 bg-zinc-100/50 opacity-60 dark:border-zinc-700 dark:bg-zinc-700/20'
                  : 'border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900/40'
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3 text-zinc-600 dark:text-zinc-400">
                  {m.date && <span>{new Date(m.date).toLocaleDateString('nl-NL')}</span>}
                  {m.startTime && <span>{m.startTime}</span>}
                  <span>t_a = {m.t_a}°C</span>
                  <span>v_ar = {m.v_ar} m/s</span>
                  <span>RH = {m.RH}%</span>
                  {m.t_g != null && <span>t_g = {m.t_g}°C</span>}
                  {m.t_nw != null && <span>t_nw = {m.t_nw}°C</span>}
                  {m.excluded && <span className="rounded bg-zinc-200 px-1.5 py-0.5 text-zinc-500 dark:bg-zinc-700">Uitgesloten</span>}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => setEditingId(m.id)} className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200">Bewerken</button>
                  <button onClick={() => onDeleteMeasurement(m.id)} className="text-zinc-400 hover:text-red-500">×</button>
                </div>
              </div>
              {m.notes && <p className="mt-1 text-zinc-400">{m.notes}</p>}
            </div>
          )
        )}

        <button
          onClick={() => onAddMeasurement(bg.id)}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-300 py-3 text-xs text-zinc-500 transition hover:border-orange-400 hover:text-orange-600 dark:border-zinc-600 dark:text-zinc-400 dark:hover:border-orange-500 dark:hover:text-orange-400"
        >
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Meting toevoegen voor {bg.name}
        </button>
      </div>
    </div>
  );
}

export default function ClimateStep5_Measurements({ investigation, onUpdate }: Props) {
  const { bgs, measurements, scenarios } = investigation;
  const [addingForBg, setAddingForBg] = useState<string | null>(null);

  function newMeasurement(bgId: string): ClimateMeasurement {
    return {
      id: newClimateId(),
      bgId,
      t_a: 20,
      v_ar: 0.1,
      RH: 50,
    };
  }

  function handleAddMeasurement(bgId: string) {
    setAddingForBg(bgId);
  }

  function saveNewMeasurement(m: ClimateMeasurement) {
    onUpdate({ measurements: [...measurements, m] });
    setAddingForBg(null);
  }

  function updateMeasurement(updated: ClimateMeasurement) {
    onUpdate({ measurements: measurements.map((m) => (m.id === updated.id ? updated : m)) });
  }

  function deleteMeasurement(id: string) {
    onUpdate({ measurements: measurements.filter((m) => m.id !== id) });
  }

  if (bgs.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Stap 6 — Meetwaarden</h2>
        <div className="rounded-lg bg-amber-50 px-4 py-4 text-sm text-amber-700 dark:bg-amber-900/15 dark:text-amber-400">
          Definieer eerst blootstellingsgroepen in stap 3, dan kunt u hier meetwaarden invoeren.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Stap 6 — Meetwaarden</h2>
        <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          Voer de klimaatmeetwaarden in per blootstellingsgroep. Minimaal t_a, v_ar en RH zijn vereist.
          Voor <Abbr id="PMV">PMV</Abbr>/<Abbr id="PPD">PPD</Abbr>: ook t_g of t_r.
          Voor <Abbr id="WBGT">WBGT</Abbr>: ook t_nw en t_g.
        </p>
      </div>

      <InfoBox title="ISO 7726:1998 — Meetposities en omstandigheden">
        Meet op relevante posities: buikhoogte (1,1 m) voor algemeen klimaat. Voeg metingen toe bij
        enkels (0,1 m) en hoofd (1,7 m staand / 1,1 m zittend) voor lokaal comfort.
        Meting minimaal 30 minuten na stabilisering meetapparatuur. Representatieve werkomstandigheden.
      </InfoBox>

      <div className="space-y-4">
        {bgs.map((bg) => (
          <div key={bg.id}>
            {addingForBg === bg.id ? (
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/30">
                <div className="border-b border-zinc-200 px-5 py-3 dark:border-zinc-700">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{bg.name} — Nieuwe meting</p>
                </div>
                <div className="p-4">
                  <MeasurementForm
                    measurement={newMeasurement(bg.id)}
                    scenarios={scenarios}
                    onSave={saveNewMeasurement}
                    onCancel={() => setAddingForBg(null)}
                  />
                </div>
              </div>
            ) : (
              <BGSection
                bg={bg}
                measurements={measurements}
                scenarios={scenarios}
                onAddMeasurement={handleAddMeasurement}
                onUpdateMeasurement={updateMeasurement}
                onDeleteMeasurement={deleteMeasurement}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
