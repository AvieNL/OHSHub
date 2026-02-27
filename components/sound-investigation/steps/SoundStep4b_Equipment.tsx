'use client';

import { useState } from 'react';
import type {
  SoundInvestigation,
  SoundEquipment,
  SoundHEG,
  EquipmentCategory,
} from '@/lib/sound-investigation-types';
import { newSoundId } from '@/lib/sound-investigation-storage';
import {
  OCTAVE_BANDS,
  averageOctaveBands,
  buildMergedBands,
  calcOctaveAPF,
  computeCombinedAttenuation,
} from '@/lib/sound-ppe';
import { Abbr } from '@/components/Abbr';
import { Formula } from '@/components/Formula';
import { InfoBox } from '@/components/InfoBox';

interface Props {
  investigation: SoundInvestigation;
  onUpdate: (partial: Partial<SoundInvestigation>) => void;
  onGoToStep: (step: number) => void;
}

const CATEGORY_OPTIONS: { value: EquipmentCategory; label: string; short: string }[] = [
  { value: 'voertuig',        label: 'Voertuig (auto, heftruck, tractor)',      short: 'Voertuig' },
  { value: 'machine',         label: 'Machine (niet-handgedragen)',              short: 'Machine' },
  { value: 'handgereedschap', label: 'Handgereedschap (elektrisch/handmatig)',   short: 'Handgereedsch.' },
  { value: 'pneumatisch',     label: 'Pneumatisch gereedschap',                  short: 'Pneumatisch' },
  { value: 'anders',          label: 'Anders',                                   short: 'Anders' },
];

const MAINTENANCE_OPTIONS: { value: 'goed' | 'matig' | 'slecht'; label: string }[] = [
  { value: 'goed',   label: 'Goed' },
  { value: 'matig',  label: 'Matig' },
  { value: 'slecht', label: 'Slecht' },
];

function EquipmentForm({
  equipment,
  onSave,
  onCancel,
}: {
  equipment: SoundEquipment;
  onSave: (e: SoundEquipment) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState(equipment);

  function upd(partial: Partial<SoundEquipment>) {
    setForm((prev) => ({ ...prev, ...partial }));
  }

  const isVoertuig = form.category === 'voertuig';
  const regNrLabel = isVoertuig ? 'Kenteken' : 'Registratienummer';
  const currentYear = new Date().getFullYear();

  return (
    <div className="space-y-4 rounded-xl border border-orange-200 bg-orange-50/50 p-5 dark:border-orange-800/50 dark:bg-orange-900/10">
      <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        Arbeidsmiddel vastleggen
      </h4>

      {/* Name */}
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Naam / omschrijving <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => upd({ name: e.target.value })}
          placeholder="Bijv. Heftruck Toyota 8FBN25"
          className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>

      {/* Category */}
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Categorie
        </label>
        <div className="space-y-1.5">
          {CATEGORY_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex cursor-pointer items-center gap-3">
              <input
                type="radio"
                checked={form.category === opt.value}
                onChange={() => upd({ category: opt.value })}
                className="accent-orange-500"
              />
              <span className="text-sm text-zinc-800 dark:text-zinc-200">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Manufacturer / Model / Serial / Year */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Fabrikant</label>
          <input
            type="text"
            value={form.manufacturer ?? ''}
            onChange={(e) => upd({ manufacturer: e.target.value })}
            placeholder="Bijv. Toyota"
            className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Model / type</label>
          <input
            type="text"
            value={form.model ?? ''}
            onChange={(e) => upd({ model: e.target.value })}
            placeholder="Bijv. 8FBN25"
            className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Serienummer</label>
          <input
            type="text"
            value={form.serialNumber ?? ''}
            onChange={(e) => upd({ serialNumber: e.target.value })}
            placeholder="S/N"
            className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Bouwjaar
          </label>
          <input
            type="number"
            min={1900}
            max={currentYear}
            value={form.yearOfManufacture ?? ''}
            onChange={(e) => {
              const n = parseInt(e.target.value, 10);
              upd({ yearOfManufacture: isFinite(n) ? n : undefined });
            }}
            placeholder="Bijv. 2018"
            className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {regNrLabel}
          </label>
          <input
            type="text"
            value={form.registrationNumber ?? ''}
            onChange={(e) => upd({ registrationNumber: e.target.value })}
            placeholder={isVoertuig ? 'Bijv. AB-123-C' : 'Intern registratienummer'}
            className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
      </div>

      {/* Geluidemissie fabrikant */}
      <div>
        <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Geluidemissie fabrikant (<Abbr id="MRL">Machinerichtlijn</Abbr> 2006/42/<abbr title="Europese Gemeenschap" className="cursor-help underline decoration-dotted decoration-zinc-400 underline-offset-2">EG</abbr>)
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
              <abbr title="Gegarandeerd geluidsvermogensniveau (A-gewogen)" className="cursor-help underline decoration-dotted decoration-zinc-400 underline-offset-2">L<sub>WA</sub></abbr> gegarandeerd (dB)
            </label>
            <input
              type="number"
              step={0.5}
              value={form.lwaGuaranteed ?? ''}
              onChange={(e) => {
                const n = parseFloat(e.target.value);
                upd({ lwaGuaranteed: isFinite(n) ? n : undefined });
              }}
              placeholder="Bijv. 98"
              className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
              <abbr title="Gewogen geluidsdrukniveau op de werkplek, fabrieksopgave" className="cursor-help underline decoration-dotted decoration-zinc-400 underline-offset-2">L<sub>pA</sub></abbr> werkplek fabrieksopgave (dB)
            </label>
            <input
              type="number"
              step={0.5}
              value={form.lpaManufacturer ?? ''}
              onChange={(e) => {
                const n = parseFloat(e.target.value);
                upd({ lpaManufacturer: isFinite(n) ? n : undefined });
              }}
              placeholder="Bijv. 78"
              className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
        </div>
      </div>

      {/* Keuring */}
      <div>
        <label className="flex cursor-pointer items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={form.inspectionRequired ?? false}
            onChange={(e) => upd({ inspectionRequired: e.target.checked })}
            className="accent-orange-500"
          />
          <span className="font-medium text-zinc-700 dark:text-zinc-300">
            Keuring vereist (<abbr title="Arbeidsbesluit" className="cursor-help underline decoration-dotted decoration-zinc-400 underline-offset-2">Arbobesluit</abbr> art. 7.4a)
          </span>
        </label>

        {form.inspectionRequired && (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Type keuring</label>
              <input
                type="text"
                value={form.inspectionType ?? ''}
                onChange={(e) => upd({ inspectionType: e.target.value })}
                placeholder="Bijv. periodieke keuring heftrucks (NEN-EN 1726)"
                className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Datum keuring</label>
              <input
                type="date"
                value={form.inspectionDate ?? ''}
                onChange={(e) => upd({ inspectionDate: e.target.value })}
                className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Keuring geldig t/m</label>
              <input
                type="date"
                value={form.inspectionExpiry ?? ''}
                onChange={(e) => upd({ inspectionExpiry: e.target.value })}
                className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Keurende instantie</label>
              <input
                type="text"
                value={form.inspectionBody ?? ''}
                onChange={(e) => upd({ inspectionBody: e.target.value })}
                placeholder="Bijv. TÜV, Kiwa, Lloyds"
                className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Keuringscertificaatnummer</label>
              <input
                type="text"
                value={form.inspectionCertNumber ?? ''}
                onChange={(e) => upd({ inspectionCertNumber: e.target.value })}
                placeholder="Cert. nr."
                className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
          </div>
        )}
      </div>

      {/* Maintenance */}
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Onderhoudsstatus</label>
        <div className="flex gap-4">
          {MAINTENANCE_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="radio"
                checked={form.maintenanceStatus === opt.value}
                onChange={() => upd({ maintenanceStatus: opt.value })}
                className="accent-orange-500"
              />
              <span className="text-zinc-700 dark:text-zinc-300">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Opmerkingen</label>
        <input
          type="text"
          value={form.notes ?? ''}
          onChange={(e) => upd({ notes: e.target.value })}
          placeholder="Bijv. specifieke gebruiksomstandigheden, aanpassingen"
          className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => {
            if (!form.name.trim()) return;
            onSave(form);
          }}
          disabled={!form.name.trim()}
          className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-40"
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

function categoryLabel(cat: EquipmentCategory): string {
  return CATEGORY_OPTIONS.find((o) => o.value === cat)?.short ?? cat;
}

function InspectionBadge({ eq }: { eq: SoundEquipment }) {
  if (!eq.inspectionRequired) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!eq.inspectionDate && !eq.inspectionExpiry) {
    return (
      <div className="mb-2 rounded-lg bg-red-50 px-3 py-1.5 text-xs text-red-700 dark:bg-red-900/15 dark:text-red-400">
        ✖ Keuring vereist maar geen keuringsdatum vastgelegd (Arbobesluit art. 7.4a)
      </div>
    );
  }

  if (eq.inspectionExpiry) {
    const expiry = new Date(eq.inspectionExpiry + 'T00:00:00');
    const daysLeft = Math.round((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) {
      return (
        <div className="mb-2 rounded-lg bg-red-50 px-3 py-1.5 text-xs text-red-700 dark:bg-red-900/15 dark:text-red-400">
          ✖ Keuring verlopen op {new Date(eq.inspectionExpiry + 'T12:00:00').toLocaleDateString('nl-NL')} — arbeidsmiddel mag niet worden gebruikt (art. 7.4a Arbobesluit)
        </div>
      );
    }

    if (daysLeft <= 30) {
      return (
        <div className="mb-2 rounded-lg bg-amber-50 px-3 py-1.5 text-xs text-amber-700 dark:bg-amber-900/15 dark:text-amber-400">
          ⚠ Keuring verloopt over {daysLeft} dag{daysLeft === 1 ? '' : 'en'} ({new Date(eq.inspectionExpiry + 'T12:00:00').toLocaleDateString('nl-NL')}) — plan herkeuring in
        </div>
      );
    }
  }

  return null;
}

// ─── Hearing protection per HEG ───────────────────────────────────────────────

type PPESlot = 1 | 2;

/** Extract PPE fields for slot 1 or 2 from a HEG */
function getPPEFields(heg: SoundHEG, slot: PPESlot) {
  if (slot === 1) {
    return {
      method:       heg.ppeMethod ?? 'snr' as const,
      snr:          heg.ppeSNR,
      snrUnknown:   heg.ppeSNRUnknown ?? false,
      octaveBands:  heg.ppeOctaveBands,
      h:            heg.ppeH,
      m:            heg.ppeM,
      l:            heg.ppeL,
      spectralChar: heg.ppeSpectralChar ?? 'medium' as const,
      attenuation:  heg.ppeAttenuation,
      notes:        heg.ppeNotes,
    };
  }
  return {
    method:       heg.ppe2Method ?? 'snr' as const,
    snr:          heg.ppe2SNR,
    snrUnknown:   heg.ppe2SNRUnknown ?? false,
    octaveBands:  heg.ppe2OctaveBands,
    h:            heg.ppe2H,
    m:            heg.ppe2M,
    l:            heg.ppe2L,
    spectralChar: heg.ppe2SpectralChar ?? 'medium' as const,
    attenuation:  heg.ppe2Attenuation,
    notes:        heg.ppe2Notes,
  };
}

function setPPEFields(heg: SoundHEG, slot: PPESlot, partial: Partial<ReturnType<typeof getPPEFields>>): Partial<SoundHEG> {
  if (slot === 1) {
    return {
      ppeMethod:       partial.method as SoundHEG['ppeMethod'],
      ppeSNR:          partial.snr,
      ppeSNRUnknown:   partial.snrUnknown,
      ppeOctaveBands:  partial.octaveBands,
      ppeH:            partial.h,
      ppeM:            partial.m,
      ppeL:            partial.l,
      ppeSpectralChar: partial.spectralChar as SoundHEG['ppeSpectralChar'],
      ppeAttenuation:  partial.attenuation,
      ppeNotes:        partial.notes,
    };
  }
  return {
    ppe2Method:       partial.method as SoundHEG['ppe2Method'],
    ppe2SNR:          partial.snr,
    ppe2SNRUnknown:   partial.snrUnknown,
    ppe2OctaveBands:  partial.octaveBands,
    ppe2H:            partial.h,
    ppe2M:            partial.m,
    ppe2L:            partial.l,
    ppe2SpectralChar: partial.spectralChar as SoundHEG['ppe2SpectralChar'],
    ppe2Attenuation:  partial.attenuation,
    ppe2Notes:        partial.notes,
  };
}

type PPEMethod = 'snr' | 'hml' | 'octave' | 'manual';

function computeAPFFromFields(
  fields: ReturnType<typeof getPPEFields>,
  avgLp: number[] | null,
): { apf: number; label: string } | null {
  switch (fields.method) {
    case 'snr': {
      if (!fields.snr) return null;
      const apf = parseFloat((fields.snr / 2).toFixed(1));
      return { apf, label: `SNR ${fields.snr} ÷ 2 = ${apf} dB` };
    }
    case 'hml': {
      const char = fields.spectralChar;
      const val  = char === 'high' ? fields.h : char === 'low' ? fields.l : fields.m;
      const key  = char === 'high' ? 'H' : char === 'low' ? 'L' : 'M';
      if (!val) return null;
      const apf = parseFloat((val / 2).toFixed(1));
      return { apf, label: `${key} ${val} ÷ 2 = ${apf} dB` };
    }
    case 'octave': {
      const merged = buildMergedBands(fields.octaveBands, avgLp);
      const result = calcOctaveAPF(merged);
      if (!result) return null;
      return { apf: result.apf, label: `Octaafband: L_A ${result.lA.toFixed(1)} − L′_A ${result.lPrime.toFixed(1)} = ${result.apf.toFixed(1)} dB` };
    }
    default:
      return null;
  }
}

function PPEDeviceForm({
  heg,
  slot,
  measurements,
  onUpdate,
}: {
  heg: SoundHEG;
  slot: PPESlot;
  measurements: SoundInvestigation['measurements'];
  onUpdate: (partial: Partial<SoundHEG>) => void;
}) {
  const fields = getPPEFields(heg, slot);
  const avgLp = averageOctaveBands(measurements.filter((m) => m.hegId === heg.id && !m.excluded));

  const computed = fields.snrUnknown ? null : computeAPFFromFields(fields, avgLp);
  const isOverridden = !fields.snrUnknown && computed !== null && fields.attenuation != null
    && Math.abs(fields.attenuation - computed.apf) > 0.05;

  const octaveMerged = buildMergedBands(fields.octaveBands, avgLp);
  const octaveResult = fields.method === 'octave' ? calcOctaveAPF(octaveMerged) : null;

  const inputCls = 'rounded-lg border border-blue-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-orange-500 dark:border-blue-700 dark:bg-zinc-800 dark:text-zinc-100';

  function upd(partial: Partial<ReturnType<typeof getPPEFields>>) {
    const merged = { ...fields, ...partial };
    // Auto-compute APF when method inputs change
    if (!merged.snrUnknown) {
      const newComputed = computeAPFFromFields(merged, avgLp);
      if (newComputed && !isOverridden) {
        onUpdate(setPPEFields(heg, slot, { ...merged, attenuation: newComputed.apf }));
        return;
      }
    }
    onUpdate(setPPEFields(heg, slot, merged));
  }

  function setMethod(m: PPEMethod) {
    const merged = { ...fields, method: m };
    const newComputed = computeAPFFromFields(merged, avgLp);
    onUpdate(setPPEFields(heg, slot, newComputed ? { ...merged, attenuation: newComputed.apf } : merged));
  }

  function updateBand(index: number, partial: { lp?: number | undefined; m?: number | undefined; s?: number | undefined }) {
    const current = (fields.octaveBands ?? Array.from({ length: 8 }, () => ({}))) as { lp?: number; m?: number; s?: number }[];
    upd({ octaveBands: current.map((b, i) => i === index ? { ...b, ...partial } : b) });
  }

  const methods: PPEMethod[] = ['snr', 'hml', 'octave', 'manual'];
  const methodLabels: Record<PPEMethod, string> = {
    snr: 'Methode 1 — SNR/2', hml: 'Methode 2 — HML',
    octave: 'Methode 3 — Octaafband', manual: 'Handmatig',
  };

  return (
    <div className="space-y-3">
      {/* Method tabs */}
      <div className="flex flex-wrap gap-1.5">
        {methods.map((m) => (
          <button
            key={m}
            onClick={() => setMethod(m)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              fields.method === m
                ? 'bg-blue-600 text-white dark:bg-blue-500'
                : 'border border-blue-200 bg-white text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:bg-zinc-800 dark:text-blue-300'
            }`}
          >
            {methodLabels[m]}
          </button>
        ))}
      </div>

      {/* ── SNR/2 ── */}
      {fields.method === 'snr' && (
        <div className="space-y-2">
          <label className="flex cursor-pointer items-center gap-2 text-xs text-blue-700 dark:text-blue-300">
            <input
              type="checkbox"
              checked={fields.snrUnknown}
              onChange={(e) => {
                if (e.target.checked) {
                  onUpdate(setPPEFields(heg, slot, { ...fields, snrUnknown: true, snr: undefined, attenuation: undefined }));
                } else {
                  onUpdate(setPPEFields(heg, slot, { ...fields, snrUnknown: false }));
                }
              }}
              className="accent-orange-500"
            />
            <Abbr id="SNR">SNR</Abbr>-waarde nog onbekend (datablad niet beschikbaar)
          </label>
          {!fields.snrUnknown && (
            <div className="flex items-end gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-blue-800 dark:text-blue-300">
                  <Abbr id="SNR">SNR</Abbr>-waarde van datablad
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number" min={0} max={50} step={1}
                    value={fields.snr ?? ''}
                    onChange={(e) => upd({ snr: parseFloat(e.target.value) || undefined })}
                    placeholder="bijv. 33"
                    className={`w-20 ${inputCls}`}
                  />
                  <span className="text-xs text-blue-600 dark:text-blue-400">dB</span>
                </div>
              </div>
              {computed && (
                <div className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs dark:border-blue-700 dark:bg-zinc-800">
                  <span className="text-blue-500 dark:text-blue-400">Berekende <Abbr id="APF">APF</Abbr>:</span>
                  <span className="ml-2 font-mono font-semibold text-blue-800 dark:text-blue-200">{computed.apf} dB</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── HML ── */}
      {fields.method === 'hml' && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-3">
            {(['H', 'M', 'L'] as const).map((letter) => {
              const val  = letter === 'H' ? fields.h : letter === 'M' ? fields.m : fields.l;
              const desc = letter === 'H' ? 'hoogfrequent' : letter === 'M' ? 'middenfrequent' : 'laagfrequent';
              return (
                <div key={letter}>
                  <label className="mb-1 block text-xs font-medium text-blue-800 dark:text-blue-300">
                    {letter} <span className="font-normal text-blue-500">({desc})</span>
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number" min={0} max={60} step={0.5}
                      value={val ?? ''}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value) || undefined;
                        upd(letter === 'H' ? { h: v } : letter === 'M' ? { m: v } : { l: v });
                      }}
                      placeholder="dB"
                      className={`w-16 ${inputCls}`}
                    />
                    <span className="text-xs text-blue-500">dB</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-blue-800 dark:text-blue-300">Spectraal karakter</label>
            <div className="flex flex-wrap gap-1.5">
              {([
                ['low',    'Laagfrequent (L<sub>p,C</sub>−L<sub>p,A</sub> &gt; 2 dB)'],
                ['medium', 'Middenfrequent (≤ 2 dB)'],
                ['high',   'Hoogfrequent (&gt; 1 kHz)'],
              ] as const).map(([v, html]) => (
                <button
                  key={v}
                  onClick={() => upd({ spectralChar: v })}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    fields.spectralChar === v
                      ? 'bg-blue-600 text-white dark:bg-blue-500'
                      : 'border border-blue-200 bg-white text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:bg-zinc-800 dark:text-blue-300'
                  }`}
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              ))}
            </div>
          </div>
          {computed && (
            <div className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs dark:border-blue-700 dark:bg-zinc-800">
              <span className="text-blue-500">Berekende <Abbr id="APF">APF</Abbr>:</span>
              <span className="ml-2 font-mono font-semibold text-blue-800 dark:text-blue-200">{computed.apf} dB</span>
              <span className="ml-2 text-blue-400">({computed.label})</span>
            </div>
          )}
        </div>
      )}

      {/* ── Octave band ── */}
      {fields.method === 'octave' && (
        <div className="space-y-3">
          {avgLp !== null ? (
            <p className="text-xs text-blue-600 dark:text-blue-400">
              L<sub>p,i</sub> is automatisch ingevuld vanuit de gemiddelde octaafbandanalyses van de metingen.
              Voer de gemiddelde demping <em>m</em> en standaardafwijking <em>s</em> van het datablad in.
            </p>
          ) : (
            <p className="text-xs text-blue-600 dark:text-blue-400">
              Voer per octaafband het gemeten geluidniveau L<sub>p,i</sub>, de gemiddelde demping <em>m</em> en
              standaardafwijking <em>s</em> van het datablad in. Minimaal 3 banden vereist.
            </p>
          )}
          <div className="overflow-x-auto rounded-lg border border-blue-200 dark:border-blue-700">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-blue-200 bg-blue-50/80 dark:border-blue-700 dark:bg-blue-900/20">
                  <th className="px-2 py-2 text-left font-medium text-blue-700 dark:text-blue-300">Band (Hz)</th>
                  <th className="px-2 py-2 text-right font-medium text-blue-700 dark:text-blue-300">L<sub>p,i</sub></th>
                  <th className="px-2 py-2 text-right font-medium text-blue-700 dark:text-blue-300"><em>m</em></th>
                  <th className="px-2 py-2 text-right font-medium text-blue-700 dark:text-blue-300"><em>s</em></th>
                  <th className="px-2 py-2 text-right font-medium text-blue-500 dark:text-blue-400">L′<sub>A,i</sub></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-100 dark:divide-blue-800/50">
                {OCTAVE_BANDS.map((freq, i) => {
                  const bands = (fields.octaveBands ?? Array.from({ length: 8 }, () => ({}))) as { lp?: number; m?: number; s?: number }[];
                  const b  = bands[i] ?? {};
                  const br = octaveResult?.bandResults[i];
                  const numCls = 'w-14 rounded border border-blue-200 bg-white px-1.5 py-1 text-right font-mono text-xs outline-none focus:border-orange-400 dark:border-blue-700 dark:bg-zinc-800 dark:text-zinc-100';
                  return (
                    <tr key={freq} className="bg-white dark:bg-zinc-900">
                      <td className="px-2 py-1.5 font-mono font-medium text-blue-600 dark:text-blue-400">{freq}</td>
                      <td className="px-2 py-1">
                        <input type="number" step={0.1} value={b.lp ?? ''}
                          onChange={(e) => updateBand(i, { lp: e.target.value === '' ? undefined : parseFloat(e.target.value) })}
                          className={numCls} />
                      </td>
                      <td className="px-2 py-1">
                        <input type="number" step={0.1} min={0} value={b.m ?? ''}
                          onChange={(e) => updateBand(i, { m: e.target.value === '' ? undefined : parseFloat(e.target.value) })}
                          className={numCls} />
                      </td>
                      <td className="px-2 py-1">
                        <input type="number" step={0.1} min={0} value={b.s ?? ''}
                          onChange={(e) => updateBand(i, { s: e.target.value === '' ? undefined : parseFloat(e.target.value) })}
                          className={numCls} />
                      </td>
                      <td className="px-2 py-1.5 text-right font-mono font-medium text-blue-700 dark:text-blue-200">
                        {br != null ? br.lProtectedA.toFixed(1) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {octaveResult && (
                <tfoot>
                  <tr className="border-t border-blue-200 bg-blue-50/80 dark:border-blue-700 dark:bg-blue-900/20 font-medium">
                    <td className="px-2 py-2 text-blue-700 dark:text-blue-300">Totaal</td>
                    <td colSpan={3} className="px-2 py-2 text-right font-mono text-blue-700 dark:text-blue-200">
                      L<sub>p,A</sub> = {octaveResult.lA.toFixed(1)} dB(A)
                    </td>
                    <td className="px-2 py-2 text-right font-mono text-blue-700 dark:text-blue-200">
                      L′<sub>A</sub> = {octaveResult.lPrime.toFixed(1)} dB(A)
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
          {octaveResult && (
            <div className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs dark:border-blue-700 dark:bg-zinc-800">
              <span className="text-blue-500">Berekende <Abbr id="APF">APF</Abbr>:</span>
              <span className="ml-2 font-mono font-semibold text-blue-800 dark:text-blue-200">{octaveResult.apf.toFixed(1)} dB</span>
            </div>
          )}
        </div>
      )}

      {/* Effective APF + notes */}
      {!fields.snrUnknown && (
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-blue-800 dark:text-blue-300">
              Effectieve demping (<Abbr id="APF">APF</Abbr>)
              {isOverridden && <span className="ml-2 text-[10px] font-normal text-orange-500">handmatig overschreven</span>}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number" min={0} max={40} step={0.5}
                value={fields.attenuation ?? ''}
                onChange={(e) => onUpdate(setPPEFields(heg, slot, { ...fields, attenuation: parseFloat(e.target.value) || undefined }))}
                placeholder="dB"
                className={`w-20 ${inputCls}`}
              />
              <span className="text-xs text-blue-600 dark:text-blue-400">dB</span>
              {isOverridden && computed && (
                <button
                  onClick={() => onUpdate(setPPEFields(heg, slot, { ...fields, attenuation: computed.apf }))}
                  className="text-xs text-blue-500 hover:text-blue-800 dark:hover:text-blue-100"
                >
                  Reset naar {computed.apf} dB
                </button>
              )}
            </div>
          </div>
          <div className="flex-1 min-w-48">
            <label className="mb-1 block text-xs font-medium text-blue-800 dark:text-blue-300">
              Type / merk / model gehoorbeschermer
            </label>
            <input
              type="text"
              value={fields.notes ?? ''}
              onChange={(e) => onUpdate(setPPEFields(heg, slot, { ...fields, notes: e.target.value || undefined }))}
              placeholder="bijv. 3M Peltor X4A, SNR 33 dB"
              className={`w-full ${inputCls}`}
            />
          </div>
        </div>
      )}
      {fields.snrUnknown && (
        <div>
          <label className="mb-1 block text-xs font-medium text-blue-800 dark:text-blue-300">
            Type / merk / model gehoorbeschermer
          </label>
          <input
            type="text"
            value={fields.notes ?? ''}
            onChange={(e) => onUpdate(setPPEFields(heg, slot, { ...fields, notes: e.target.value || undefined }))}
            placeholder="bijv. 3M Peltor X4A (datablad aangevraagd)"
            className={`w-full ${inputCls}`}
          />
        </div>
      )}
    </div>
  );
}

/** Returns true when PPE has been added for this HEG (form is open) */
function hasPPEConfigured(heg: SoundHEG): boolean {
  return !!(
    heg.ppeMethod != null ||
    heg.ppeSNRUnknown ||
    heg.ppeSNR != null ||
    heg.ppeAttenuation != null ||
    heg.ppeNotes ||
    heg.ppeH != null || heg.ppeM != null || heg.ppeL != null ||
    (heg.ppeOctaveBands ?? []).some((b) => b.m != null || b.s != null)
  );
}

/** Clear all PPE fields (both slots) on a HEG */
function clearPPE(): Partial<SoundHEG> {
  return {
    ppeMethod: undefined, ppeSNR: undefined, ppeSNRUnknown: undefined,
    ppeOctaveBands: undefined, ppeH: undefined, ppeM: undefined, ppeL: undefined,
    ppeSpectralChar: undefined, ppeAttenuation: undefined, ppeNotes: undefined,
    ppeDouble: undefined,
    ppe2Method: undefined, ppe2SNR: undefined, ppe2SNRUnknown: undefined,
    ppe2OctaveBands: undefined, ppe2H: undefined, ppe2M: undefined, ppe2L: undefined,
    ppe2SpectralChar: undefined, ppe2Attenuation: undefined, ppe2Notes: undefined,
  };
}

function HEGPPESection({
  heg,
  measurements,
  onUpdateHEG,
  onGoToStep,
}: {
  heg: SoundHEG;
  measurements: SoundInvestigation['measurements'];
  onUpdateHEG: (partial: Partial<SoundHEG>) => void;
  onGoToStep: (step: number) => void;
}) {
  const configured = hasPPEConfigured(heg);
  const hegMeasurements = measurements.filter((m) => m.hegId === heg.id && !m.excluded);
  const avgLp = averageOctaveBands(hegMeasurements);
  const combined = computeCombinedAttenuation(heg, avgLp);
  const methodLabel: Record<string, string> = {
    'single':        'Enkelvoudig',
    'double-snr':    'Dubbel — SNR-methode',
    'double-hml':    'Dubbel — HML-methode',
    'double-octave': 'Dubbel — Octaafbandmethode',
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/30">
      {/* Header row */}
      <div className="flex items-center justify-between gap-4 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{heg.name}</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {heg.workerCount} medewerker{heg.workerCount !== 1 ? 's' : ''}
            {configured && (
              <span className="ml-2 inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                {heg.ppeDouble ? 'Dubbele gehoorbescherming' : 'Gehoorbescherming ingevoerd'}
              </span>
            )}
          </p>
        </div>
        {configured ? (
          <button
            onClick={() => onUpdateHEG(clearPPE())}
            className="rounded border border-zinc-200 px-2 py-1 text-xs text-zinc-500 hover:bg-red-50 hover:text-red-500 dark:border-zinc-700 dark:hover:bg-red-900/10 dark:hover:text-red-400"
          >
            Verwijderen
          </button>
        ) : (
          <button
            onClick={() => onUpdateHEG({ ppeMethod: 'snr' })}
            className="inline-flex items-center gap-1.5 rounded border border-blue-200 px-2.5 py-1 text-xs font-medium text-blue-600 transition hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/20"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Gehoorbescherming toevoegen
          </button>
        )}
      </div>

      {/* PPE form — only when configured */}
      {configured && (
        <div className="space-y-4 border-t border-zinc-200 bg-blue-50/40 px-4 pb-5 pt-4 dark:border-zinc-700 dark:bg-blue-900/10">
          {/* Gehoorbeschermer 1 */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-400">
              Gehoorbeschermer 1
            </p>
            <PPEDeviceForm heg={heg} slot={1} measurements={measurements} onUpdate={(partial) => onUpdateHEG(partial)} />
          </div>

          {/* Dubbele gehoorbescherming */}
          <div className="border-t border-blue-100 pt-4 dark:border-blue-800/40">
            <label className="flex cursor-pointer items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={heg.ppeDouble ?? false}
                onChange={(e) => onUpdateHEG({ ppeDouble: e.target.checked })}
                className="accent-orange-500"
              />
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                Dubbele gehoorbescherming (kap + dop gecombineerd)
              </span>
            </label>

            {heg.ppeDouble && (
              <div className="mt-4 space-y-4">
                <InfoBox title="Dubbele gehoorbescherming — EN 458:2016" variant="blue">
                  <p>
                    Dempingswaarden worden <strong>niet opgeteld</strong>. De gecombineerde demping is begrensd op{' '}
                    <strong>35 dB(A)</strong> vanwege de bijdrage van botgeleiding (EN 458:2016).
                    Bij dubbele bescherming wordt de hoogste individuele demping gebruikt als basis,
                    met een praktijkbonus van 5 dB — tot het maximum van 35 dB(A).
                  </p>
                </InfoBox>

                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-400">
                    Gehoorbeschermer 2
                  </p>
                  <PPEDeviceForm heg={heg} slot={2} measurements={measurements} onUpdate={(partial) => onUpdateHEG(partial)} />
                </div>

                {/* Combined result */}
                {combined && (
                  <div className={`rounded-lg px-4 py-3 text-sm ${
                    combined.capped
                      ? 'border border-amber-200 bg-amber-50 dark:border-amber-700/50 dark:bg-amber-900/15'
                      : 'border border-emerald-200 bg-emerald-50 dark:border-emerald-700/50 dark:bg-emerald-900/15'
                  }`}>
                    <div className="flex items-center justify-between gap-2">
                      <p className={`font-semibold ${combined.capped ? 'text-amber-800 dark:text-amber-300' : 'text-emerald-800 dark:text-emerald-300'}`}>
                        Gecombineerde <Abbr id="APF">APF</Abbr>:{' '}
                        <span className="font-mono">{combined.attenuation} dB</span>
                      </p>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        combined.capped
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                      }`}>
                        {methodLabel[combined.method]}
                      </span>
                    </div>
                    {combined.capped && (
                      <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                        ⚠ Maximum van 35 dB(A) bereikt (botgeleiding — EN 458:2016).
                      </p>
                    )}
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      Gecombineerde <Abbr id="APF">APF</Abbr> wordt gebruikt in{' '}
                      <button type="button" onClick={() => onGoToStep(8)} className="cursor-pointer underline decoration-dotted underline-offset-2 hover:no-underline">stap 9 (berekeningen)</button>{' '}
                      en{' '}
                      <button type="button" onClick={() => onGoToStep(9)} className="cursor-pointer underline decoration-dotted underline-offset-2 hover:no-underline">stap 10 (beoordeling)</button>.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SoundStep4b_Equipment({ investigation, onUpdate, onGoToStep }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const equipment = investigation.equipment ?? [];

  function saveEquipment(updated: SoundEquipment) {
    const exists = equipment.some((e) => e.id === updated.id);
    const newList = exists
      ? equipment.map((e) => (e.id === updated.id ? updated : e))
      : [...equipment, updated];
    onUpdate({ equipment: newList });
    setEditingId(null);
    setShowNew(false);
  }

  function removeEquipment(id: string) {
    onUpdate({
      equipment: equipment.filter((e) => e.id !== id),
      // Clean up references in tasks
      tasks: investigation.tasks.map((t) =>
        t.equipmentIds
          ? { ...t, equipmentIds: t.equipmentIds.filter((eid) => eid !== id) }
          : t,
      ),
    });
  }

  function updateHEG(updated: Partial<SoundHEG> & { id?: string }, hegId: string) {
    onUpdate({
      hegs: investigation.hegs.map((h) => h.id === hegId ? { ...h, ...updated } : h),
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Stap 6 — Arbeidsmiddelen (art. 7.4a <abbr title="Arbeidsbesluit" className="cursor-help underline decoration-dotted decoration-zinc-400 underline-offset-2">Arbobesluit</abbr>)
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          Registreer voertuigen, machines en gereedschappen die gebruikt worden bij de beoordeelde werkzaamheden.
          Arbeidsmiddelen kunnen per taak worden geselecteerd in{' '}
          <button type="button" onClick={() => onGoToStep(6)} className="cursor-pointer underline decoration-dotted underline-offset-2 hover:no-underline">stap 7</button>.
        </p>
      </div>

      {/* Infobox */}
      <InfoBox title="Wettelijke basis — art. 7.4a Arbobesluit / Machinerichtlijn 2006/42/EG">
        <div className="space-y-1.5">
          <p>
            <strong>Art. 7.4a Arbobesluit</strong> — Arbeidsmiddelen die aan bijzondere gevaren onderhevig zijn,
            worden periodiek gekeurd door een deskundige persoon of instelling.
          </p>
          <p>
            <strong><Abbr id="MRL">Machinerichtlijn</Abbr> 2006/42/<abbr title="Europese Gemeenschap" className="cursor-help underline decoration-dotted decoration-zinc-400 underline-offset-2">EG</abbr></strong> —
            De fabrikant vermeldt het gegarandeerde geluidsvermogensniveau{' '}
            <abbr title="Gegarandeerd geluidsvermogensniveau (A-gewogen)" className="cursor-help underline decoration-dotted decoration-zinc-400 underline-offset-2">L<sub>WA</sub></abbr> en het{' '}
            <abbr title="Gewogen geluidsdrukniveau op de werkplek, fabrieksopgave" className="cursor-help underline decoration-dotted decoration-zinc-400 underline-offset-2">L<sub>pA</sub></abbr> op de werkplek in de handleiding en{' '}
            <abbr title="CE-conformiteitsverklaring" className="cursor-help underline decoration-dotted decoration-zinc-400 underline-offset-2">CE</abbr>-verklaring.
          </p>
        </div>
      </InfoBox>

      {/* Equipment list */}
      <div className="space-y-3">
        {equipment.map((eq) => (
          <div key={eq.id}>
            {editingId === eq.id ? (
              <EquipmentForm
                equipment={eq}
                onSave={saveEquipment}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/30">
                <InspectionBadge eq={eq} />
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-zinc-900 dark:text-zinc-50">{eq.name}</p>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-zinc-500">
                      <span className="rounded bg-zinc-100 px-1.5 py-0.5 font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                        {categoryLabel(eq.category)}
                      </span>
                      {eq.manufacturer && <span>{eq.manufacturer}</span>}
                      {eq.model && <span>{eq.model}</span>}
                      {eq.serialNumber && <span>S/N: {eq.serialNumber}</span>}
                      {eq.yearOfManufacture && <span>Bouwjaar: {eq.yearOfManufacture}</span>}
                      {eq.registrationNumber && (
                        <span>{eq.category === 'voertuig' ? 'Kenteken' : 'Regnr'}: {eq.registrationNumber}</span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-zinc-400">
                      {eq.lwaGuaranteed != null && (
                        <span>L<sub>WA</sub>: {eq.lwaGuaranteed} dB</span>
                      )}
                      {eq.lpaManufacturer != null && (
                        <span>L<sub>pA</sub>: {eq.lpaManufacturer} dB</span>
                      )}
                      {eq.inspectionRequired && eq.inspectionExpiry && (
                        <span>
                          Keuring t/m:{' '}
                          {new Date(eq.inspectionExpiry + 'T12:00:00').toLocaleDateString('nl-NL')}
                        </span>
                      )}
                      {eq.maintenanceStatus && (
                        <span>
                          Onderhoud:{' '}
                          <span className={
                            eq.maintenanceStatus === 'goed'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : eq.maintenanceStatus === 'matig'
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-red-600 dark:text-red-400'
                          }>
                            {eq.maintenanceStatus}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingId(eq.id)}
                      className="rounded border border-zinc-200 px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-700"
                    >
                      Bewerken
                    </button>
                    <button
                      onClick={() => removeEquipment(eq.id)}
                      className="rounded border border-zinc-200 px-2 py-1 text-xs text-zinc-500 hover:bg-red-50 hover:text-red-500 dark:border-zinc-700"
                    >
                      Verwijderen
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {showNew ? (
        <EquipmentForm
          equipment={{ id: newSoundId(), name: '', category: 'machine' }}
          onSave={saveEquipment}
          onCancel={() => setShowNew(false)}
        />
      ) : (
        <button
          onClick={() => setShowNew(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 py-4 text-sm text-zinc-500 transition hover:border-orange-400 hover:text-orange-600 dark:border-zinc-600 dark:text-zinc-400 dark:hover:border-orange-500 dark:hover:text-orange-400"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Arbeidsmiddel toevoegen
        </button>
      )}

      {/* ── Gehoorbescherming per HEG ── */}
      {investigation.hegs.length > 0 && (
        <div className="space-y-4">
          <div className="border-t border-zinc-200 pt-6 dark:border-zinc-700">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
              Gehoorbescherming per <Abbr id="HEG">HEG</Abbr>
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
              Leg de gehoorbescherming vast die werknemers gebruiken.
              De demping (<Abbr id="APF">APF</Abbr>) wordt meegenomen in de grenswaarde-toetsing ({' '}
              <button type="button" onClick={() => onGoToStep(9)} className="cursor-pointer underline decoration-dotted underline-offset-2 hover:no-underline">stap 10</button>{' '}
              — art. 6.6 lid 2 Arbobesluit).
            </p>
          </div>

          <InfoBox title="Wettelijke basis — art. 6.6 lid 1b &amp; 6.9 Arbobesluit / EN 458:2016">
            <div className="space-y-1.5">
              <p>
                <strong>Art. 6.6 lid 1b:</strong> Bij de onderste actiewaarde (80 dB(A)) zijn gehoorbeschermers beschikbaar op verzoek.
                Boven de bovenste actiewaarde (85 dB(A)) is het gebruik verplicht.
              </p>
              <p>
                <strong>Art. 6.9:</strong> Gehoorbescherming moet de blootstelling aan het oor (<Formula math="L_{EX,8h,oor}" />) terugbrengen tot onder de grenswaarde (87 dB(A)).
              </p>
              <p>
                <strong>EN 458:2016:</strong> Drie rekenmethoden, oplopend in nauwkeurigheid:{' '}
                SNR/2 (methode 1) · HML (methode 2) · octaafband (methode 3).
              </p>
            </div>
          </InfoBox>

          {investigation.hegs.map((heg) => (
            <HEGPPESection
              key={heg.id}
              heg={heg}
              measurements={investigation.measurements}
              onUpdateHEG={(partial) => updateHEG(partial, heg.id)}
              onGoToStep={onGoToStep}
            />
          ))}
        </div>
      )}
    </div>
  );
}
