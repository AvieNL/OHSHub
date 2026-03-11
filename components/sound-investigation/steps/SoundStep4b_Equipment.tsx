'use client';

import { useState } from 'react';
import type {
  SoundInvestigation,
  SoundEquipment,
  SoundHEG,
  EquipmentCategory,
} from '@/lib/sound-investigation-types';
import { newSoundId } from '@/lib/sound-investigation-storage';
import { computeCombinedAttenuation } from '@/lib/sound-ppe';
import { Abbr } from '@/components/Abbr';
import { Formula } from '@/components/Formula';
import { Alert, Button, Card, FieldLabel, FormGrid, Icon, Input } from '@/components/ui';
import InlineStepHeader from '@/components/InlineStepHeader';
import InlineEdit from '@/components/InlineEdit';
import MarkdownContent from '@/components/MarkdownContent';

interface Props {
  investigation: SoundInvestigation;
  onUpdate: (partial: Partial<SoundInvestigation>) => void;
  onGoToStep: (step: number) => void;
  contentOverrides?: Record<string, string>;
}

const STEP_KEY = 'step.5';
const NS = 'investigation.sound';
const FALLBACK_TITLE = 'Stap 6 — Arbeidsmiddelen';
const FALLBACK_DESC = 'Registreer voertuigen, machines en gereedschappen die gebruikt worden bij de beoordeelde werkzaamheden.';

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
    <Card variant="form">
      <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        Arbeidsmiddel vastleggen
      </h4>

      {/* Name */}
      <div>
        <FieldLabel>Naam / omschrijving <span className="text-red-500">*</span></FieldLabel>
        <Input
          type="text"
          value={form.name}
          onChange={(e) => upd({ name: e.target.value })}
          placeholder="Bijv. Heftruck Toyota 8FBN25"
          className="w-full"
        />
      </div>

      {/* Category */}
      <div>
        <FieldLabel>Categorie</FieldLabel>
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
      <FormGrid>
        <div>
          <FieldLabel>Fabrikant</FieldLabel>
          <Input
            type="text"
            value={form.manufacturer ?? ''}
            onChange={(e) => upd({ manufacturer: e.target.value })}
            placeholder="Bijv. Toyota"
            className="w-full"
          />
        </div>
        <div>
          <FieldLabel>Model / type</FieldLabel>
          <Input
            type="text"
            value={form.model ?? ''}
            onChange={(e) => upd({ model: e.target.value })}
            placeholder="Bijv. 8FBN25"
            className="w-full"
          />
        </div>
        <div>
          <FieldLabel>Serienummer</FieldLabel>
          <Input
            type="text"
            value={form.serialNumber ?? ''}
            onChange={(e) => upd({ serialNumber: e.target.value })}
            placeholder="S/N"
            className="w-full"
          />
        </div>
        <div>
          <FieldLabel>Bouwjaar</FieldLabel>
          <Input
            type="number"
            min={1900}
            max={currentYear}
            value={form.yearOfManufacture ?? ''}
            onChange={(e) => {
              const n = parseInt(e.target.value, 10);
              upd({ yearOfManufacture: isFinite(n) ? n : undefined });
            }}
            placeholder="Bijv. 2018"
            className="w-full"
          />
        </div>
        <div className="sm:col-span-2">
          <FieldLabel>{regNrLabel}</FieldLabel>
          <Input
            type="text"
            value={form.registrationNumber ?? ''}
            onChange={(e) => upd({ registrationNumber: e.target.value })}
            placeholder={isVoertuig ? 'Bijv. AB-123-C' : 'Intern registratienummer'}
            className="w-full"
          />
        </div>
      </FormGrid>

      {/* Geluidemissie fabrikant */}
      <div>
        <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Geluidemissie fabrikant (<Abbr id="MRL">Machinerichtlijn</Abbr> 2006/42/<abbr title="Europese Gemeenschap" className="cursor-help underline decoration-dotted decoration-zinc-400 underline-offset-2">EG</abbr>)
        </p>
        <FormGrid>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
              <abbr title="Gegarandeerd geluidsvermogensniveau (A-gewogen)" className="cursor-help underline decoration-dotted decoration-zinc-400 underline-offset-2">L<sub>WA</sub></abbr> gegarandeerd (dB)
            </label>
            <Input
              type="number"
              step={0.5}
              value={form.lwaGuaranteed ?? ''}
              onChange={(e) => {
                const n = parseFloat(e.target.value);
                upd({ lwaGuaranteed: isFinite(n) ? n : undefined });
              }}
              placeholder="Bijv. 98"
              className="w-full"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
              <abbr title="Gewogen geluidsdrukniveau op de werkplek, fabrieksopgave" className="cursor-help underline decoration-dotted decoration-zinc-400 underline-offset-2">L<sub>pA</sub></abbr> werkplek fabrieksopgave (dB)
            </label>
            <Input
              type="number"
              step={0.5}
              value={form.lpaManufacturer ?? ''}
              onChange={(e) => {
                const n = parseFloat(e.target.value);
                upd({ lpaManufacturer: isFinite(n) ? n : undefined });
              }}
              placeholder="Bijv. 78"
              className="w-full"
            />
          </div>
        </FormGrid>
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
            Keuring vereist
          </span>
        </label>

        {form.inspectionRequired && (
          <FormGrid className="mt-3">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Type keuring</label>
              <Input
                type="text"
                value={form.inspectionType ?? ''}
                onChange={(e) => upd({ inspectionType: e.target.value })}
                placeholder="Bijv. periodieke keuring heftrucks (NEN-EN 1726)"
                className="w-full"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Datum keuring</label>
              <Input
                type="date"
                value={form.inspectionDate ?? ''}
                onChange={(e) => upd({ inspectionDate: e.target.value })}
                className="w-full"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Keuring geldig t/m</label>
              <Input
                type="date"
                value={form.inspectionExpiry ?? ''}
                onChange={(e) => upd({ inspectionExpiry: e.target.value })}
                className="w-full"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Keurende instantie</label>
              <Input
                type="text"
                value={form.inspectionBody ?? ''}
                onChange={(e) => upd({ inspectionBody: e.target.value })}
                placeholder="Bijv. TÜV, Kiwa, Lloyds"
                className="w-full"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Keuringscertificaatnummer</label>
              <Input
                type="text"
                value={form.inspectionCertNumber ?? ''}
                onChange={(e) => upd({ inspectionCertNumber: e.target.value })}
                placeholder="Cert. nr."
                className="w-full"
              />
            </div>
          </FormGrid>
        )}
      </div>

      {/* Maintenance */}
      <div>
        <FieldLabel>Onderhoudsstatus</FieldLabel>
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
        <FieldLabel>Opmerkingen</FieldLabel>
        <Input
          type="text"
          value={form.notes ?? ''}
          onChange={(e) => upd({ notes: e.target.value })}
          placeholder="Bijv. specifieke gebruiksomstandigheden, aanpassingen"
          className="w-full"
        />
      </div>

      <div className="flex gap-2">
        <Button
          variant="primary"
          onClick={() => { if (form.name.trim()) onSave(form); }}
          disabled={!form.name.trim()}
        >
          Opslaan
        </Button>
        <Button variant="secondary" onClick={onCancel}>Annuleren</Button>
      </div>
    </Card>
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
      <Alert variant="error" size="sm" className="mb-2">
        ✖ Keuring vereist maar geen keuringsdatum vastgelegd
      </Alert>
    );
  }

  if (eq.inspectionExpiry) {
    const expiry = new Date(eq.inspectionExpiry + 'T00:00:00');
    const daysLeft = Math.round((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) {
      return (
        <Alert variant="error" size="sm" className="mb-2">
          ✖ Keuring verlopen op {new Date(eq.inspectionExpiry + 'T12:00:00').toLocaleDateString('nl-NL')} — arbeidsmiddel mag niet worden gebruikt
        </Alert>
      );
    }

    if (daysLeft <= 30) {
      return (
        <Alert variant="warning" size="sm" className="mb-2">
          ⚠ Keuring verloopt over {daysLeft} dag{daysLeft === 1 ? '' : 'en'} ({new Date(eq.inspectionExpiry + 'T12:00:00').toLocaleDateString('nl-NL')}) — plan herkeuring in
        </Alert>
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
    // Infer method from stored data when not explicitly set (backward compat)
    const method = heg.ppeMethod ??
      (heg.ppeM != null || heg.ppeL != null ? 'hml' as const :
       heg.ppeSNR != null ? 'snr' as const : 'manual' as const);
    return {
      method,
      snr:         heg.ppeSNR,
      /** Spectral correction Lp,C − Lp,A (dB) — used for SNR method APV calculation */
      lpC:         heg.ppeLpC,
      hmlH:        heg.ppeH,
      hmlM:        heg.ppeM,
      hmlL:        heg.ppeL,
      spectralChar: heg.ppeSpectralChar,
      attenuation: heg.ppeAttenuation,
      notes:       heg.ppeNotes,
    };
  }
  const method2 = heg.ppe2Method ??
    (heg.ppe2M != null || heg.ppe2L != null ? 'hml' as const :
     heg.ppe2SNR != null ? 'snr' as const : 'manual' as const);
  return {
    method:      method2,
    snr:         heg.ppe2SNR,
    lpC:         heg.ppe2LpC,
    hmlH:        heg.ppe2H,
    hmlM:        heg.ppe2M,
    hmlL:        heg.ppe2L,
    spectralChar: heg.ppe2SpectralChar,
    attenuation: heg.ppe2Attenuation,
    notes:       heg.ppe2Notes,
  };
}

function setPPEFields(heg: SoundHEG, slot: PPESlot, partial: Partial<ReturnType<typeof getPPEFields>>): Partial<SoundHEG> {
  if (slot === 1) {
    return {
      ppeMethod:       partial.method,
      ppeSNR:          partial.snr,
      ppeLpC:          partial.lpC,
      ppeH:            partial.hmlH,
      ppeM:            partial.hmlM,
      ppeL:            partial.hmlL,
      ppeSpectralChar: partial.spectralChar,
      ppeSNRUnknown:   false, // always clear when updated via new UI
      ppeAttenuation:  partial.attenuation,
      ppeNotes:        partial.notes,
    };
  }
  return {
    ppe2Method:       partial.method,
    ppe2SNR:          partial.snr,
    ppe2LpC:          partial.lpC,
    ppe2H:            partial.hmlH,
    ppe2M:            partial.hmlM,
    ppe2L:            partial.hmlL,
    ppe2SpectralChar: partial.spectralChar,
    ppe2SNRUnknown:   false,
    ppe2Attenuation:  partial.attenuation,
    ppe2Notes:        partial.notes,
  };
}

const PPE_METHODS = [
  { value: 'hml'    as const, label: 'HML-check',  desc: 'H/M/L-waarden van datablad' },
  { value: 'snr'    as const, label: 'SNR-methode', desc: 'SNR + spectraalcorrectie' },
  { value: 'manual' as const, label: 'Handmatig',   desc: 'APV direct invoeren' },
];

function PPEDeviceForm({
  heg,
  slot,
  onUpdate,
}: {
  heg: SoundHEG;
  slot: PPESlot;
  onUpdate: (partial: Partial<SoundHEG>) => void;
}) {
  const fields = getPPEFields(heg, slot);
  const { method } = fields;

  const inputCls = 'rounded-lg border border-blue-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-orange-500 dark:border-blue-700 dark:bg-zinc-800 dark:text-zinc-100';

  /** Compute APV from current method + inputs. Returns null when data is incomplete. */
  function computeAPV(f: ReturnType<typeof getPPEFields>): number | null {
    if (f.method === 'hml') {
      const val = f.spectralChar === 'high' ? f.hmlH : f.spectralChar === 'low' ? f.hmlL : f.hmlM;
      return val != null ? val : null;
    }
    if (f.method === 'snr' && f.snr != null && f.lpC != null) {
      return parseFloat((f.snr - f.lpC).toFixed(1));
    }
    if (f.method === 'manual' && f.snr != null && f.spectralChar != null) {
      const offset = f.spectralChar === 'high' ? 10 : f.spectralChar === 'medium' ? 7 : 3;
      return parseFloat((f.snr - offset).toFixed(1));
    }
    return null;
  }

  /** Update fields and auto-populate attenuation for HML, SNR, and manual-preset methods. */
  function setFields(partial: Partial<ReturnType<typeof getPPEFields>>) {
    const merged = { ...fields, ...partial };
    const computed = computeAPV(merged);
    if (computed !== null) merged.attenuation = computed;
    onUpdate(setPPEFields(heg, slot, merged));
  }

  function switchMethod(newMethod: typeof method) {
    onUpdate(setPPEFields(heg, slot, {
      method: newMethod,
      snr: undefined, lpC: undefined,
      hmlH: undefined, hmlM: undefined, hmlL: undefined,
      spectralChar: undefined,
      attenuation: undefined,
      notes: fields.notes,
    }));
  }

  const computedAPV = computeAPV(fields);

  return (
    <div className="space-y-4">
      {/* Method selector */}
      <div>
        <p className="mb-2 text-xs font-medium text-blue-800 dark:text-blue-300">Selectiemethode (EN 458)</p>
        <div className="grid grid-cols-3 gap-2">
          {PPE_METHODS.map((pm) => (
            <button
              key={pm.value}
              type="button"
              onClick={() => method !== pm.value && switchMethod(pm.value)}
              className={`rounded-lg border px-3 py-1.5 text-left text-xs transition ${
                method === pm.value
                  ? 'border-blue-400 bg-blue-100 font-semibold text-blue-800 dark:border-blue-600 dark:bg-blue-900/30 dark:text-blue-200'
                  : 'border-zinc-200 text-zinc-600 hover:border-blue-300 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-blue-700'
              }`}
            >
              {pm.label}
              <span className={`ml-1 font-normal ${method === pm.value ? 'text-blue-500 dark:text-blue-400' : 'text-zinc-400'}`}>
                — {pm.desc}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── HML-check (A.4) ── */}
      {method === 'hml' && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-blue-800 dark:text-blue-300">
                H-waarde (datablad)
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number" min={0} max={50} step={1}
                  value={fields.hmlH ?? ''}
                  onChange={(e) => setFields({ hmlH: parseFloat(e.target.value) || undefined })}
                  placeholder="bijv. 32"
                  className={`w-20 ${inputCls}`}
                />
                <span className="text-xs text-blue-600 dark:text-blue-400">dB</span>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-blue-800 dark:text-blue-300">
                M-waarde (datablad)
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number" min={0} max={50} step={1}
                  value={fields.hmlM ?? ''}
                  onChange={(e) => setFields({ hmlM: parseFloat(e.target.value) || undefined })}
                  placeholder="bijv. 26"
                  className={`w-20 ${inputCls}`}
                />
                <span className="text-xs text-blue-600 dark:text-blue-400">dB</span>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-blue-800 dark:text-blue-300">
                L-waarde (datablad)
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number" min={0} max={50} step={1}
                  value={fields.hmlL ?? ''}
                  onChange={(e) => setFields({ hmlL: parseFloat(e.target.value) || undefined })}
                  placeholder="bijv. 16"
                  className={`w-20 ${inputCls}`}
                />
                <span className="text-xs text-blue-600 dark:text-blue-400">dB</span>
              </div>
            </div>
          </div>

          {/* Noise class */}
          <div>
            <p className="mb-1.5 text-xs font-medium text-blue-800 dark:text-blue-300">Geluidskarakter</p>
            <div className="space-y-1.5">
              <label className="flex cursor-pointer items-start gap-2 text-xs">
                <input
                  type="radio"
                  checked={fields.spectralChar === 'high'}
                  onChange={() => setFields({ spectralChar: 'high' })}
                  className="mt-0.5 accent-orange-500"
                />
                <span className="text-blue-700 dark:text-blue-300">
                  <strong>H-klasse</strong> — hoogfrequent
                  <span className="ml-1 text-zinc-400">(L<sub>p,C</sub> − L<sub>p,A</sub> &lt; 2 dB)</span>
                  {fields.hmlH != null && fields.spectralChar === 'high' && (
                    <span className="ml-2 font-semibold text-emerald-600 dark:text-emerald-400">→ APV = H = {fields.hmlH} dB</span>
                  )}
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-2 text-xs">
                <input
                  type="radio"
                  checked={fields.spectralChar === 'medium' || fields.spectralChar == null}
                  onChange={() => setFields({ spectralChar: 'medium' })}
                  className="mt-0.5 accent-orange-500"
                />
                <span className="text-blue-700 dark:text-blue-300">
                  <strong>M-klasse</strong> — middenfrequent
                  <span className="ml-1 text-zinc-400">(2 dB ≤ L<sub>p,C</sub> − L<sub>p,A</sub> &lt; 5 dB)</span>
                  {fields.hmlM != null && (fields.spectralChar === 'medium' || fields.spectralChar == null) && (
                    <span className="ml-2 font-semibold text-emerald-600 dark:text-emerald-400">→ APV = M = {fields.hmlM} dB</span>
                  )}
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-2 text-xs">
                <input
                  type="radio"
                  checked={fields.spectralChar === 'low'}
                  onChange={() => setFields({ spectralChar: 'low' })}
                  className="mt-0.5 accent-orange-500"
                />
                <span className="text-blue-700 dark:text-blue-300">
                  <strong>L-klasse</strong> — laagfrequent
                  <span className="ml-1 text-zinc-400">(L<sub>p,C</sub> − L<sub>p,A</sub> ≥ 5 dB)</span>
                  {fields.hmlL != null && fields.spectralChar === 'low' && (
                    <span className="ml-2 font-semibold text-emerald-600 dark:text-emerald-400">→ APV = L = {fields.hmlL} dB</span>
                  )}
                </span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ── SNR-methode (A.5) ── */}
      {method === 'snr' && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-blue-800 dark:text-blue-300">
                <Abbr id="SNR">SNR</Abbr>-waarde (datablad)
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number" min={0} max={50} step={1}
                  value={fields.snr ?? ''}
                  onChange={(e) => setFields({ snr: parseFloat(e.target.value) || undefined })}
                  placeholder="bijv. 33"
                  className={`w-20 ${inputCls}`}
                />
                <span className="text-xs text-blue-600 dark:text-blue-400">dB</span>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-blue-800 dark:text-blue-300">
                L<sub>p,C</sub> − L<sub>p,A</sub> <span className="font-normal">(spectraalcorrectie)</span>
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number" min={0} max={20} step={0.5}
                  value={fields.lpC ?? ''}
                  onChange={(e) => setFields({ lpC: parseFloat(e.target.value) || undefined })}
                  placeholder="bijv. 2"
                  className={`w-20 ${inputCls}`}
                />
                <span className="text-xs text-blue-600 dark:text-blue-400">dB</span>
              </div>
            </div>
          </div>
          {computedAPV !== null && (
            <p className="text-xs text-emerald-700 dark:text-emerald-400">
              APV = SNR − (L<sub>p,C</sub> − L<sub>p,A</sub>) = {fields.snr} − {fields.lpC} = <strong>{computedAPV} dB</strong>
            </p>
          )}
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            Meet L<sub>p,C</sub> − L<sub>p,A</sub> op de werkplek of schat op basis van het geluidskarakter
            (typisch 1–4 dB voor industrieel geluid; hoger bij laagfrequente machines).
          </p>
        </div>
      )}

      {/* ── Handmatig ── */}
      {method === 'manual' && (
        <div className="space-y-3">
          {/* SNR from datashett (optional, enables presets) */}
          <div>
            <label className="mb-1 block text-xs font-medium text-blue-800 dark:text-blue-300">
              <Abbr id="SNR">SNR</Abbr>-waarde datablad <span className="font-normal text-zinc-400">(optioneel — maakt schattingen mogelijk)</span>
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="number" min={0} max={50} step={1}
                value={fields.snr ?? ''}
                onChange={(e) => setFields({ snr: parseFloat(e.target.value) || undefined, spectralChar: undefined })}
                placeholder="bijv. 33"
                className={`w-20 ${inputCls}`}
              />
              <span className="text-xs text-blue-600 dark:text-blue-400">dB</span>
            </div>
          </div>

          {/* Preset options — only when SNR entered */}
          {fields.snr != null && (
            <div>
              <p className="mb-1.5 text-xs font-medium text-blue-800 dark:text-blue-300">Aanname effectieve demping</p>
              <div className="space-y-1.5">
                {([
                  { key: 'low'    as const, label: 'Optimistisch',  offset: 3,  desc: 'SNR − 3 dB' },
                  { key: 'medium' as const, label: 'Realistisch',   offset: 7,  desc: 'SNR − 7 dB' },
                  { key: 'high'   as const, label: 'Conservatief',  offset: 10, desc: 'SNR − 10 dB — conform AI-04 aanbeveling' },
                ] as const).map(({ key, label, offset, desc }) => (
                  <label key={key} className="flex cursor-pointer items-start gap-2 text-xs">
                    <input
                      type="radio"
                      checked={fields.spectralChar === key}
                      onChange={() => setFields({ spectralChar: key })}
                      className="mt-0.5 accent-orange-500"
                    />
                    <span className="text-blue-700 dark:text-blue-300">
                      <strong>{label}</strong> — {desc}
                      <span className="ml-2 font-semibold text-emerald-600 dark:text-emerald-400">
                        → APV = {(fields.snr! - offset).toFixed(1)} dB
                      </span>
                    </span>
                  </label>
                ))}
                <label className="flex cursor-pointer items-start gap-2 text-xs">
                  <input
                    type="radio"
                    checked={fields.spectralChar == null}
                    onChange={() => setFields({ spectralChar: undefined })}
                    className="mt-0.5 accent-orange-500"
                  />
                  <span className="text-blue-700 dark:text-blue-300">
                    <strong>Handmatig</strong> — APV direct invoeren
                  </span>
                </label>
              </div>
              {fields.spectralChar != null && (
                <Alert variant="warning" size="sm" className="mt-2">
                  <strong>Schatting — geen gemeten waarde.</strong>{' '}
                  AI-04 toont aan dat de werkelijke demping in de praktijk doorgaans 30–60% onder de nominale SNR-waarde ligt.
                  Voor formele rapportage is een meting conform EN 458 methode A.2 (octaafband), A.3 (HML) of A.4 (HML-check) aanbevolen.
                </Alert>
              )}
            </div>
          )}

          {/* Direct APV input — shown when no SNR or "handmatig" selected */}
          {(fields.snr == null || fields.spectralChar == null) && (
            <div>
              <label className="mb-1 block text-xs font-medium text-blue-800 dark:text-blue-300">
                Effectieve demping (<Abbr id="APV">APV</Abbr>)
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number" min={0} max={40} step={0.5}
                  value={fields.attenuation ?? ''}
                  onChange={(e) => setFields({ attenuation: parseFloat(e.target.value) || undefined, spectralChar: undefined })}
                  placeholder="dB"
                  className={`w-20 ${inputCls}`}
                />
                <span className="text-xs text-blue-600 dark:text-blue-400">dB</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Computed APV result (HML / SNR / manual-preset methods) */}
      {computedAPV !== null && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs dark:border-emerald-700/40 dark:bg-emerald-900/10">
          <span className="text-emerald-700 dark:text-emerald-300">
            Berekende <Abbr id="APV">APV</Abbr>:
          </span>
          <span className="font-mono font-semibold text-emerald-800 dark:text-emerald-200">
            {computedAPV} dB
          </span>
        </div>
      )}

      {/* Type / model */}
      <div>
        <label className="mb-1 block text-xs font-medium text-blue-800 dark:text-blue-300">
          Type / merk / model gehoorbeschermer
        </label>
        <input
          type="text"
          value={fields.notes ?? ''}
          onChange={(e) => setFields({ notes: e.target.value || undefined })}
          placeholder="bijv. 3M Peltor X4A, SNR 33 dB"
          className={`w-full ${inputCls}`}
        />
      </div>
    </div>
  );
}

/** Returns true when PPE has been added for this HEG (form is open) */
function hasPPEConfigured(heg: SoundHEG): boolean {
  return !!(
    heg.ppeSNRUnknown ||
    heg.ppeSNR != null ||
    heg.ppeAttenuation != null ||
    heg.ppeNotes ||
    // Legacy: also detect old HEGs configured with HML/octave methods
    heg.ppeMethod != null ||
    heg.ppeH != null || heg.ppeM != null || heg.ppeL != null ||
    (heg.ppeOctaveBands ?? []).some((b) => b.m != null || b.s != null)
  );
}

/** Clear all PPE fields (both slots) on a HEG */
function clearPPE(): Partial<SoundHEG> {
  return {
    ppeMethod: undefined, ppeSNR: undefined, ppeLpC: undefined, ppeSNRUnknown: undefined,
    ppeOctaveBands: undefined, ppeH: undefined, ppeM: undefined, ppeL: undefined,
    ppeSpectralChar: undefined, ppeAttenuation: undefined, ppeNotes: undefined,
    ppeDouble: undefined,
    ppe2Method: undefined, ppe2SNR: undefined, ppe2LpC: undefined, ppe2SNRUnknown: undefined,
    ppe2OctaveBands: undefined, ppe2H: undefined, ppe2M: undefined, ppe2L: undefined,
    ppe2SpectralChar: undefined, ppe2Attenuation: undefined, ppe2Notes: undefined,
  };
}

function HEGPPESection({
  heg,
  onUpdateHEG,
  onGoToStep,
}: {
  heg: SoundHEG;
  onUpdateHEG: (partial: Partial<SoundHEG>) => void;
  onGoToStep: (step: number) => void;
}) {
  const configured = hasPPEConfigured(heg);
  const combined = computeCombinedAttenuation(heg, null);
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
          <Button variant="danger" size="xs" onClick={() => onUpdateHEG(clearPPE())}>
            Verwijderen
          </Button>
        ) : (
          <button
            onClick={() => onUpdateHEG({ ppeMethod: 'hml' })}
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
          {/* APV toelichting */}
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs dark:border-amber-700/40 dark:bg-amber-900/10">
            <p className="font-medium text-amber-800 dark:text-amber-300">
              Effectieve demping (<Abbr id="APV">APV</Abbr>) — bepaling conform EN 458
            </p>
            <p className="mt-0.5 text-amber-700 dark:text-amber-400">
              Gebruik bij voorkeur de HML-check (H/M/L-waarden van datablad) of SNR-methode (SNR + spectraalcorrectie).
              Als deze gegevens niet beschikbaar zijn, kan via <strong>Handmatig</strong> een APV worden ingeschat op basis van
              de SNR-waarde met een aanname-correctie (conservatief, realistisch of optimistisch).
              Zonder APV-waarde kan de grenswaarde-toetsing in stap 10 niet worden uitgevoerd.
            </p>
          </div>

          {/* Gehoorbeschermer 1 */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-400">
              Gehoorbeschermer 1
            </p>
            <PPEDeviceForm heg={heg} slot={1} onUpdate={(partial) => onUpdateHEG(partial)} />
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
                <div className="space-y-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5 text-xs dark:border-blue-700/40 dark:bg-blue-900/10">
                  <p className="text-blue-800 dark:text-blue-300">
                    Bij dubbele gehoorbescherming schrijft de norm het gebruik van <strong>fabricantcombinaties</strong> voor.
                    Gemeten bonuswaarden liggen typisch tussen <strong>1 en 12 dB</strong>{' '}
                    boven de demping van de betere beschermer.
                  </p>
                  <p className="text-amber-600 dark:text-amber-400">
                    <strong>Schatting:</strong> bij ontbrekende fabricantdata schat de app de gecombineerde{' '}
                    <Abbr id="APV">APV</Abbr> als max(APV₁, APV₂) + 5 dB (gemiddelde van praktijkwaarden),
                    begrensd op <strong>35 dB(A)</strong> (informatieve botgeleidingsgrens).
                  </p>
                </div>

                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-400">
                    Gehoorbeschermer 2
                  </p>
                  <PPEDeviceForm heg={heg} slot={2} onUpdate={(partial) => onUpdateHEG(partial)} />
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
                        Gecombineerde <Abbr id="APV">APV</Abbr>:{' '}
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
                        ⚠ Maximum van 35 dB(A) bereikt (informatieve botgeleidingsgrens).
                      </p>
                    )}
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      Gecombineerde <Abbr id="APV">APV</Abbr> wordt gebruikt in{' '}
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

export default function SoundStep4b_Equipment({ investigation, onUpdate, onGoToStep, contentOverrides }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const equipment = investigation.equipment ?? [];

  const title = contentOverrides?.[`${STEP_KEY}.title`] ?? FALLBACK_TITLE;
  const desc = contentOverrides?.[`${STEP_KEY}.desc`];

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
        <InlineStepHeader namespace={NS} stepKey={STEP_KEY} fallbackTitle={FALLBACK_TITLE} title={title} />
        <InlineEdit namespace={NS} contentKey={`${STEP_KEY}.desc`}
          initialValue={desc ?? FALLBACK_DESC} fallback={FALLBACK_DESC} multiline markdown>
          {desc
            ? <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                <MarkdownContent>{desc}</MarkdownContent>
              </p>
            : <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                Registreer voertuigen, machines en gereedschappen die gebruikt worden bij de beoordeelde werkzaamheden.
                Arbeidsmiddelen kunnen per taak worden geselecteerd in{' '}
                <button type="button" onClick={() => onGoToStep(6)} className="cursor-pointer underline decoration-dotted underline-offset-2 hover:no-underline">stap 7</button>.
              </p>
          }
        </InlineEdit>
      </div>

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
              <Card>
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
                    <Button variant="ghost" size="xs" onClick={() => setEditingId(eq.id)}>
                      Bewerken
                    </Button>
                    <Button variant="danger" size="xs" onClick={() => removeEquipment(eq.id)}>
                      Verwijderen
                    </Button>
                  </div>
                </div>
              </Card>
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
        <Button
          variant="dashed"
          onClick={() => setShowNew(true)}
          className="py-4"
          leftIcon={<Icon name="plus" size="sm" />}
        >
          Arbeidsmiddel toevoegen
        </Button>
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
              De demping (<Abbr id="APV">APV</Abbr>) wordt meegenomen in de grenswaarde-toetsing in{' '}
              <button type="button" onClick={() => onGoToStep(9)} className="cursor-pointer underline decoration-dotted underline-offset-2 hover:no-underline">stap 10</button>.
            </p>
          </div>

          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            De <Abbr id="APV">APV</Abbr> wordt bepaald via de EN 458-selectieprocedure (SNR-, HML-check- of octaafbandmethode)
            en handmatig ingevoerd. De werkelijke demping hangt af van het geluidstype, de pasvorm en het gebruikspatroon.
          </p>

          {investigation.hegs.map((heg) => (
            <HEGPPESection
              key={heg.id}
              heg={heg}
              onUpdateHEG={(partial) => updateHEG(partial, heg.id)}
              onGoToStep={onGoToStep}
            />
          ))}
        </div>
      )}
    </div>
  );
}
