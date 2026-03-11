'use client';

import { useState } from 'react';
import type { SoundInvestigation, SoundInstrument, InstrumentType } from '@/lib/sound-investigation-types';
import { newSoundId } from '@/lib/sound-investigation-storage';
import { u2FromInstrumentType } from '@/lib/sound-stats';
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

const STEP_KEY = 'step.4';
const NS = 'investigation.sound';
const FALLBACK_TITLE = 'Stap 5 — Meetapparatuur';
const FALLBACK_DESC = 'Registreer het gebruikte meetapparaat inclusief kalibratiegegevens. Dit is verplicht onderdeel van het meetrapport.';

const INSTRUMENT_TYPES: { value: InstrumentType; label: string; u2: number; norm: string }[] = [
  { value: 'slm-class1', label: 'Geluidniveaumeter klasse 1 (IEC 61672-1)', u2: 0.7, norm: 'IEC 61672-1, klasse 1' },
  { value: 'dosimeter',  label: 'Persoonlijke dosimeter (IEC 61252)',        u2: 1.5, norm: 'IEC 61252' },
  { value: 'slm-class2', label: 'Geluidniveaumeter klasse 2 (IEC 61672-1)', u2: 1.5, norm: 'IEC 61672-1, klasse 2' },
];

function InstrumentForm({
  instrument,
  onSave,
  onCancel,
}: {
  instrument: SoundInstrument;
  onSave: (i: SoundInstrument) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState(instrument);

  function upd(partial: Partial<SoundInstrument>) {
    setForm((prev) => ({ ...prev, ...partial }));
  }

  const u2 = u2FromInstrumentType(form.type);

  return (
    <Card variant="form">
      <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        Meetapparaat opgeven
      </h4>

      {/* Instrument type */}
      <div>
        <FieldLabel>Type instrument</FieldLabel>
        <div className="space-y-2">
          {INSTRUMENT_TYPES.map((it) => (
            <label key={it.value} className="flex cursor-pointer items-start gap-3">
              <input
                type="radio"
                checked={form.type === it.value}
                onChange={() => upd({ type: it.value })}
                className="mt-0.5 accent-orange-500"
              />
              <div>
                <p className="text-sm text-zinc-800 dark:text-zinc-200">{it.label}</p>
                <p className="text-xs text-zinc-400">
                  <Formula math="u_2" /> = {it.u2} dB
                </p>
              </div>
            </label>
          ))}
        </div>
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          Standaardonzekerheid instrumentering <Formula math="u_2" /> = <strong>{u2} dB</strong>
        </p>
        {form.type === 'slm-class2' && (
          <Alert variant="warning" size="sm" className="mt-2">
            Klasse 1 is aanbevolen. Klasse 2 is acceptabel maar minder geschikt bij lage temperaturen (&lt;0 °C) of bij geluid met dominante hoge frequenties (&gt;4 kHz).
          </Alert>
        )}
      </div>

      {/* Instrument identification */}
      <FormGrid>
        <div>
          <FieldLabel>Fabrikant</FieldLabel>
          <Input
            type="text"
            value={form.manufacturer ?? ''}
            onChange={(e) => upd({ manufacturer: e.target.value })}
            placeholder="Bijv. Brüel & Kjær"
            className="w-full"
          />
        </div>
        <div>
          <FieldLabel>Model / type</FieldLabel>
          <Input
            type="text"
            value={form.model ?? ''}
            onChange={(e) => upd({ model: e.target.value })}
            placeholder="Bijv. 2250"
            className="w-full"
          />
        </div>
        <div>
          <FieldLabel>Serienummer</FieldLabel>
          <Input
            type="text"
            value={form.serialNumber ?? ''}
            onChange={(e) => upd({ serialNumber: e.target.value })}
            placeholder="Serienummer"
            className="w-full"
          />
        </div>
      </FormGrid>

      {/* Periodic verification */}
      <div className="border-t border-zinc-200 pt-4 dark:border-zinc-700">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">
          Periodieke verificatie (max. 2 jaar)
        </p>
        <FormGrid>
          <div>
            <FieldLabel>Datum laatste labkalibratie</FieldLabel>
            <Input
              type="date"
              value={form.lastLabCalibration ?? ''}
              onChange={(e) => upd({ lastLabCalibration: e.target.value })}
              className="w-full"
            />
          </div>
          <div>
            <FieldLabel>Naam kalibratie­laboratorium</FieldLabel>
            <Input
              type="text"
              value={form.calibrationLabName ?? ''}
              onChange={(e) => upd({ calibrationLabName: e.target.value })}
              placeholder="Bijv. NMi Van Swinden Laboratorium"
              className="w-full"
            />
          </div>
          <div>
            <FieldLabel>Certificaatnummer</FieldLabel>
            <Input
              type="text"
              value={form.calibrationRef ?? ''}
              onChange={(e) => upd({ calibrationRef: e.target.value })}
              placeholder="Cert. nr."
              className="w-full"
            />
          </div>
          <div>
            <FieldLabel>Uitkomst verificatie</FieldLabel>
            <Input
              type="text"
              value={form.calibrationOutcome ?? ''}
              onChange={(e) => upd({ calibrationOutcome: e.target.value })}
              placeholder="Bijv. Voldoet aan IEC 61672-1 klasse 1"
              className="w-full"
            />
          </div>
        </FormGrid>
      </div>

      {/* Calibrator */}
      <div className="border-t border-zinc-200 pt-4 dark:border-zinc-700">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">
          Kalibrator
        </p>
        <FormGrid>
          <div>
            <FieldLabel>Type / model kalibrator</FieldLabel>
            <Input
              type="text"
              value={form.calibratorType ?? ''}
              onChange={(e) => upd({ calibratorType: e.target.value })}
              placeholder="Bijv. Brüel & Kjær 4231"
              className="w-full"
            />
          </div>
          <div>
            <FieldLabel>Serienummer kalibrator</FieldLabel>
            <Input
              type="text"
              value={form.calibratorSerialNumber ?? ''}
              onChange={(e) => upd({ calibratorSerialNumber: e.target.value })}
              placeholder="Serienummer"
              className="w-full"
            />
          </div>
        </FormGrid>
      </div>

      {/* Accessories & notes */}
      <div className="border-t border-zinc-200 pt-4 dark:border-zinc-700">
        <div className="flex gap-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.windscreen ?? false}
              onChange={(e) => upd({ windscreen: e.target.checked })}
              className="accent-orange-500"
            />
            <span className="text-zinc-700 dark:text-zinc-300">Windkap aanwezig</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.extensionCable ?? false}
              onChange={(e) => upd({ extensionCable: e.target.checked })}
              className="accent-orange-500"
            />
            <span className="text-zinc-700 dark:text-zinc-300">Verlengkabel</span>
          </label>
        </div>
        <div className="mt-3">
          <FieldLabel>Opmerkingen</FieldLabel>
          <Input
            type="text"
            value={form.notes ?? ''}
            onChange={(e) => upd({ notes: e.target.value })}
            placeholder="Bijv. microfoon type 4189, windkap UA 0237"
            className="w-full"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="primary" onClick={() => onSave(form)}>Opslaan</Button>
        <Button variant="secondary" onClick={onCancel}>Annuleren</Button>
      </div>
    </Card>
  );
}

export default function SoundStep4_Instruments({ investigation, onUpdate, contentOverrides }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const { instruments } = investigation;

  // Reference date for calibration validity check: use investigation creation date,
  // not today — calibration must be valid on the day measurements are conducted.
  const refDate = new Date(investigation.createdAt);

  const title = contentOverrides?.[`${STEP_KEY}.title`] ?? FALLBACK_TITLE;
  const desc  = contentOverrides?.[`${STEP_KEY}.desc`];

  function saveInstrument(updated: SoundInstrument) {
    const exists = instruments.some((i) => i.id === updated.id);
    const newList = exists
      ? instruments.map((i) => (i.id === updated.id ? updated : i))
      : [...instruments, updated];
    onUpdate({ instruments: newList });
    setEditingId(null);
    setShowNew(false);
  }

  function removeInstrument(id: string) {
    onUpdate({ instruments: instruments.filter((i) => i.id !== id) });
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
                Registreer het gebruikte meetapparaat inclusief kalibratiegegevens. Dit is verplicht
                onderdeel van het meetrapport.
              </p>
          }
        </InlineEdit>
      </div>

      {/* Instrument list */}
      <div className="space-y-3">
        {instruments.map((inst) => (
          <div key={inst.id}>
            {editingId === inst.id ? (
              <InstrumentForm
                instrument={inst}
                onSave={saveInstrument}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <Card>
                {(() => {
                  const calDate = inst.lastLabCalibration ? new Date(inst.lastLabCalibration) : null;
                  const calAgeMonths = calDate
                    ? (refDate.getTime() - calDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
                    : null;
                  const calOutdated = calAgeMonths !== null && calAgeMonths > 24;
                  const calMissing  = !inst.lastLabCalibration;
                  return (calOutdated || calMissing) ? (
                    <Alert variant="warning" className="mb-2">
                      {calMissing
                        ? 'Geen labkalibratie geregistreerd — vereist voor rapportage.'
                        : `Labkalibratie meer dan 2 jaar oud op datum onderzoek (${Math.round(calAgeMonths!)} maanden) — herkeuring vereist.`}
                    </Alert>
                  ) : null;
                })()}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-zinc-900 dark:text-zinc-50">
                      {INSTRUMENT_TYPES.find((t) => t.value === inst.type)?.label ?? inst.type}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-3 text-xs text-zinc-500">
                      {inst.manufacturer && <span>{inst.manufacturer}</span>}
                      {inst.model && <span>{inst.model}</span>}
                      {inst.serialNumber && <span>S/N: {inst.serialNumber}</span>}
                      {inst.lastLabCalibration && <span>Kalibratie: {inst.lastLabCalibration}</span>}
                      {inst.calibrationLabName && <span>{inst.calibrationLabName}</span>}
                      <span className="font-medium text-zinc-600 dark:text-zinc-400">
                        <Formula math="u_2" /> = {u2FromInstrumentType(inst.type)} dB
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-3 text-xs text-zinc-400">
                      {inst.windscreen && <span>✓ Windkap</span>}
                      {inst.extensionCable && <span>✓ Verlengkabel</span>}
                      {inst.calibratorType && <span>Kalibrator: {inst.calibratorType}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="xs" onClick={() => setEditingId(inst.id)}>
                      Bewerken
                    </Button>
                    <Button variant="danger" size="xs" onClick={() => removeInstrument(inst.id)}>
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
        <InstrumentForm
          instrument={{ id: newSoundId(), type: 'slm-class1' }}
          onSave={saveInstrument}
          onCancel={() => setShowNew(false)}
        />
      ) : (
        <Button
          variant="dashed"
          onClick={() => setShowNew(true)}
          className="py-4"
          leftIcon={<Icon name="plus" size="sm" />}
        >
          Meetapparaat toevoegen
        </Button>
      )}

      {/* Fixed uncertainty reminder */}
      <Alert variant="neutral">
        <p><strong>Vaste onzekerheden:</strong></p>
        <ul className="mt-1 space-y-0.5">
          <li><Formula math="u_3" /> = 1,0 dB — onzekerheid door microfoonplaatsing</li>
          <li>Uitgebreide onzekerheid <Formula math="U" /> = 1,65 × <Formula math="u" /> (eenzijdig 95% betrouwbaarheidsinterval, k = 1,65)</li>
        </ul>
      </Alert>
    </div>
  );
}
