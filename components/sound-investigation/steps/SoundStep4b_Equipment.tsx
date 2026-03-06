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
import { InfoBox } from '@/components/InfoBox';
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
const FALLBACK_TITLE = 'Stap 6 — Arbeidsmiddelen (art. 7.4a Arbobesluit)';
const FALLBACK_DESC = 'Registreer voertuigen, machines en gereedschappen die gebruikt worden bij de beoordeelde werkzaamheden.';
const FALLBACK_IB0_TITLE = 'Wettelijke basis — art. 7.4a Arbobesluit / Machinerichtlijn 2006/42/EG';
const FALLBACK_IB1_TITLE = 'Wettelijke basis — art. 6.6 lid 1b & 6.9 Arbobesluit / EN 458:2025';

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
            Keuring vereist (<abbr title="Arbeidsbesluit" className="cursor-help underline decoration-dotted decoration-zinc-400 underline-offset-2">Arbobesluit</abbr> art. 7.4a)
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
        ✖ Keuring vereist maar geen keuringsdatum vastgelegd (Arbobesluit art. 7.4a)
      </Alert>
    );
  }

  if (eq.inspectionExpiry) {
    const expiry = new Date(eq.inspectionExpiry + 'T00:00:00');
    const daysLeft = Math.round((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) {
      return (
        <Alert variant="error" size="sm" className="mb-2">
          ✖ Keuring verlopen op {new Date(eq.inspectionExpiry + 'T12:00:00').toLocaleDateString('nl-NL')} — arbeidsmiddel mag niet worden gebruikt (art. 7.4a Arbobesluit)
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
    return {
      snr:         heg.ppeSNR,
      snrUnknown:  heg.ppeSNRUnknown ?? false,
      attenuation: heg.ppeAttenuation,
      notes:       heg.ppeNotes,
    };
  }
  return {
    snr:         heg.ppe2SNR,
    snrUnknown:  heg.ppe2SNRUnknown ?? false,
    attenuation: heg.ppe2Attenuation,
    notes:       heg.ppe2Notes,
  };
}

function setPPEFields(heg: SoundHEG, slot: PPESlot, partial: Partial<ReturnType<typeof getPPEFields>>): Partial<SoundHEG> {
  if (slot === 1) {
    return {
      ppeSNR:        partial.snr,
      ppeSNRUnknown: partial.snrUnknown,
      ppeAttenuation: partial.attenuation,
      ppeNotes:      partial.notes,
    };
  }
  return {
    ppe2SNR:        partial.snr,
    ppe2SNRUnknown: partial.snrUnknown,
    ppe2Attenuation: partial.attenuation,
    ppe2Notes:      partial.notes,
  };
}

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
  const computedAPF = !fields.snrUnknown && fields.snr != null
    ? parseFloat((fields.snr / 2).toFixed(1))
    : null;
  const isOverridden = computedAPF !== null && fields.attenuation != null
    && Math.abs(fields.attenuation - computedAPF) > 0.05;

  const inputCls = 'rounded-lg border border-blue-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-orange-500 dark:border-blue-700 dark:bg-zinc-800 dark:text-zinc-100';

  function upd(partial: Partial<ReturnType<typeof getPPEFields>>) {
    const merged = { ...fields, ...partial };
    // Auto-compute APF = SNR÷2 when SNR changes (unless user has manually overridden)
    if (!merged.snrUnknown && merged.snr != null && !isOverridden) {
      const apf = parseFloat((merged.snr / 2).toFixed(1));
      onUpdate(setPPEFields(heg, slot, { ...merged, attenuation: apf }));
      return;
    }
    onUpdate(setPPEFields(heg, slot, merged));
  }

  return (
    <div className="space-y-3">
      {/* SNR unknown checkbox */}
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
        <div className="flex flex-wrap items-end gap-3">
          {/* SNR input */}
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

          {/* APF result */}
          {computedAPF !== null && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs dark:border-amber-700/50 dark:bg-amber-900/10">
              <span className="text-amber-600 dark:text-amber-400">
                Berekende <Abbr id="APF">APF</Abbr> (SNR÷2):
              </span>
              <span className="ml-2 font-mono font-semibold text-amber-800 dark:text-amber-200">
                {computedAPF} dB
              </span>
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
              {isOverridden && computedAPF !== null && (
                <button
                  onClick={() => onUpdate(setPPEFields(heg, slot, { ...fields, attenuation: computedAPF }))}
                  className="text-xs text-blue-500 hover:text-blue-800 dark:hover:text-blue-100"
                >
                  Reset naar {computedAPF} dB
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
          {/* PFRE disclaimer */}
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs dark:border-amber-700/40 dark:bg-amber-900/10">
            <p className="font-medium text-amber-800 dark:text-amber-300">
              Praktijkdemping (<abbr title="Performance of Field Real-world use: werkelijke demping in de praktijk" className="cursor-help underline decoration-dotted decoration-amber-500 underline-offset-2">PFRE</abbr>)
            </p>
            <p className="mt-0.5 text-amber-700 dark:text-amber-400">
              De werkelijke demping in de praktijk is gemiddeld 50–60% van de nominale SNR-waarde (EN 458:2025 Annex B).
              SNR÷2 wordt hier als standaard gebruikt — een conservatieve en in de praktijk realistische benadering.
              Dit sluit aan bij de strekking van <abbr title="ISO 9612:2009: Acoustics — Determination of occupational noise exposure" className="cursor-help underline decoration-dotted decoration-amber-500 underline-offset-2">ISO 9612</abbr>{' '}
              dat <abbr title="Persoonlijk beschermingsmiddel" className="cursor-help underline decoration-dotted decoration-amber-500 underline-offset-2">PBM</abbr> buiten de meetmethode houdt (§4.1).
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
                <InfoBox title="Dubbele gehoorbescherming — EN 458:2025 §6.2.4" variant="blue">
                  <div className="space-y-1.5">
                    <p>
                      <strong>EN 458:2025 §6.2.4</strong> schrijft het gebruik van <strong>fabricantcombinaties</strong> voor.
                      De norm geeft geen rekenformule; gemeten bonuswaarden liggen typisch tussen <strong>1 en 12 dB</strong>{' '}
                      boven de demping van de betere beschermer.
                    </p>
                    <p className="text-amber-600 dark:text-amber-400">
                      <strong>Afwijking:</strong> bij ontbrekende fabricantdata schat de app de gecombineerde{' '}
                      <Abbr id="APF">APF</Abbr> als max(APF₁, APF₂) + 5 dB (gemiddelde van praktijkwaarden),
                      begrensd op <strong>35 dB(A)</strong> (botgeleiding; informatieve grens,
                      niet als vaste waarde in EN 458:2025).
                    </p>
                  </div>
                </InfoBox>

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
                        ⚠ Maximum van 35 dB(A) bereikt (informatieve botgeleidingsgrens — EN 458:2025 §6.2.4).
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

export default function SoundStep4b_Equipment({ investigation, onUpdate, onGoToStep, contentOverrides }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const equipment = investigation.equipment ?? [];

  const title = contentOverrides?.[`${STEP_KEY}.title`] ?? FALLBACK_TITLE;
  const desc = contentOverrides?.[`${STEP_KEY}.desc`];
  const ib0Title = contentOverrides?.[`${STEP_KEY}.infobox.0.title`] ?? FALLBACK_IB0_TITLE;
  const ib0Content = contentOverrides?.[`${STEP_KEY}.infobox.0.content`];
  const ib1Title = contentOverrides?.[`${STEP_KEY}.infobox.1.title`] ?? FALLBACK_IB1_TITLE;
  const ib1Content = contentOverrides?.[`${STEP_KEY}.infobox.1.content`];

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

      {/* Infobox */}
      <InfoBox title={
        <InlineEdit namespace={NS} contentKey={`${STEP_KEY}.infobox.0.title`}
          initialValue={ib0Title} fallback={FALLBACK_IB0_TITLE}>
          {ib0Title}
        </InlineEdit>
      }>
        <InlineEdit namespace={NS} contentKey={`${STEP_KEY}.infobox.0.content`}
          initialValue={ib0Content ?? ''} fallback="" multiline markdown>
          {ib0Content
            ? <MarkdownContent>{ib0Content}</MarkdownContent>
            : <div className="space-y-1.5">
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
          }
        </InlineEdit>
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
              De demping (<Abbr id="APF">APF</Abbr>) wordt meegenomen in de grenswaarde-toetsing ({' '}
              <button type="button" onClick={() => onGoToStep(9)} className="cursor-pointer underline decoration-dotted underline-offset-2 hover:no-underline">stap 10</button>{' '}
              — art. 6.6 lid 2 Arbobesluit).
            </p>
          </div>

          <InfoBox title={
            <InlineEdit namespace={NS} contentKey={`${STEP_KEY}.infobox.1.title`}
              initialValue={ib1Title} fallback={FALLBACK_IB1_TITLE}>
              {ib1Title}
            </InlineEdit>
          }>
            <InlineEdit namespace={NS} contentKey={`${STEP_KEY}.infobox.1.content`}
              initialValue={ib1Content ?? ''} fallback="" multiline markdown>
              {ib1Content
                ? <MarkdownContent>{ib1Content}</MarkdownContent>
                : <div className="space-y-1.5">
                    <p>
                      <strong>Art. 6.6 lid 1b:</strong> Bij de onderste actiewaarde (80 dB(A)) zijn gehoorbeschermers beschikbaar op verzoek.
                      Boven de bovenste actiewaarde (85 dB(A)) is het gebruik verplicht.
                    </p>
                    <p>
                      <strong>Art. 6.9:</strong> Gehoorbescherming moet de blootstelling aan het oor (<Formula math="L_{EX,8h,oor}" />) terugbrengen tot onder de grenswaarde (87 dB(A)).
                    </p>
                    <p>
                      <strong>SNR÷2 methode:</strong> De <abbr title="Assumed Protection Factor: nominale dempingswaarde conform EN 458" className="cursor-help underline decoration-dotted decoration-zinc-400 underline-offset-2">APF</abbr> wordt berekend als SNR÷2 —
                      een conservatieve benadering die rekening houdt met de <abbr title="Performance of Field Real-world use: werkelijke demping in de praktijk" className="cursor-help underline decoration-dotted decoration-zinc-400 underline-offset-2">PFRE</abbr> (praktijkdemping ≈ 50–60% van nominale SNR, EN 458:2025 Annex B).
                      Voor een formele selectierapportage conform EN 458:2025 (§A.5 SNR-methode, §A.4 HML of §A.2 octaafband) is een apart EN 458-rapport vereist.
                    </p>
                  </div>
              }
            </InlineEdit>
          </InfoBox>

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
