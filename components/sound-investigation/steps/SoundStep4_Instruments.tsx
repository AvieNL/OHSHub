'use client';

import { useState } from 'react';
import type { SoundInvestigation, SoundInstrument, InstrumentType } from '@/lib/sound-investigation-types';
import { newSoundId } from '@/lib/sound-investigation-storage';
import { u2FromInstrumentType } from '@/lib/sound-stats';
import { Abbr } from '@/components/Abbr';
import { Formula } from '@/components/Formula';
import { SectionRef } from '@/components/SectionRef';
import { InfoBox } from '@/components/InfoBox';
import { Alert, Button, Card, FieldLabel, FormGrid, Icon, Input } from '@/components/ui';

interface Props {
  investigation: SoundInvestigation;
  onUpdate: (partial: Partial<SoundInvestigation>) => void;
  onGoToStep: (step: number) => void;
}

const INSTRUMENT_TYPES: { value: InstrumentType; label: string; u2: number; norm: string }[] = [
  { value: 'slm-class1',  label: 'Geluidniveaumeter klasse 1 (IEC 61672-1)',  u2: 0.7, norm: 'IEC 61672-1, klasse 1' },
  { value: 'dosimeter',   label: 'Persoonlijke dosimeter (IEC 61252)',          u2: 1.5, norm: 'IEC 61252' },
  { value: 'slm-class2',  label: 'Geluidniveaumeter klasse 2 (IEC 61672-1)',  u2: 1.5, norm: 'IEC 61672-1, klasse 2' },
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

      <div>
        <FieldLabel>
          Type instrument (<SectionRef id="§5.1">§5.1</SectionRef>, <SectionRef id="Bijlage C">Tabel C.5</SectionRef>)
        </FieldLabel>
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
                  Norm: {it.norm} · <Formula math="u_2" /> = {it.u2} dB (Tabel C.5)
                </p>
              </div>
            </label>
          ))}
        </div>
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          Standaardonzekerheid instrumentering <Formula math="u_2" /> = <strong>{u2} dB</strong> (Tabel C.5 <Abbr id="NEN9612">NEN-EN-ISO 9612</Abbr>:2025)
        </p>
      </div>

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
          <FieldLabel>
            Serienummer (<SectionRef id="§15.c.1">§15.c.1</SectionRef>)
          </FieldLabel>
          <Input
            type="text"
            value={form.serialNumber ?? ''}
            onChange={(e) => upd({ serialNumber: e.target.value })}
            placeholder="Serienummer"
            className="w-full"
          />
        </div>
        <div>
          <FieldLabel>
            Datum laatste labkalibratie (<SectionRef id="§15.c.3">§15.c.3</SectionRef>)
          </FieldLabel>
          <Input
            type="date"
            value={form.lastLabCalibration ?? ''}
            onChange={(e) => upd({ lastLabCalibration: e.target.value })}
            className="w-full"
          />
        </div>
        <div>
          <FieldLabel>Kalibratiecertificaatnummer</FieldLabel>
          <Input
            type="text"
            value={form.calibrationRef ?? ''}
            onChange={(e) => upd({ calibrationRef: e.target.value })}
            placeholder="Cert. nr."
            className="w-full"
          />
        </div>
      </FormGrid>

      <div className="flex gap-4">
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.windscreen ?? false}
            onChange={(e) => upd({ windscreen: e.target.checked })}
            className="accent-orange-500"
          />
          <span className="text-zinc-700 dark:text-zinc-300">Windkap aanwezig (<SectionRef id="§13.3">§13.3</SectionRef>)</span>
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.extensionCable ?? false}
            onChange={(e) => upd({ extensionCable: e.target.checked })}
            className="accent-orange-500"
          />
          <span className="text-zinc-700 dark:text-zinc-300">Verlengkabel (<SectionRef id="§15.c.2">§15.c.2</SectionRef>)</span>
        </label>
      </div>

      <div>
        <FieldLabel>Opmerkingen</FieldLabel>
        <Input
          type="text"
          value={form.notes ?? ''}
          onChange={(e) => upd({ notes: e.target.value })}
          placeholder="Bijv. microfoon type 4189, windkap UA 0237"
          className="w-full"
        />
      </div>

      <div className="flex gap-2">
        <Button variant="primary" onClick={() => onSave(form)}>Opslaan</Button>
        <Button variant="secondary" onClick={onCancel}>Annuleren</Button>
      </div>
    </Card>
  );
}

export default function SoundStep4_Instruments({ investigation, onUpdate }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const { instruments } = investigation;

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
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Stap 5 — Meetapparatuur (<SectionRef id="§5">§5</SectionRef>, <SectionRef id="§12">§12</SectionRef> <Abbr id="NEN9612">NEN-EN-ISO 9612</Abbr>:2025)
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          Registreer het gebruikte meetapparaat inclusief kalibratiegegevens. Dit is verplicht
          onderdeel van het meetrapport (<SectionRef id="§15.c">§15.c</SectionRef>).
        </p>
      </div>

      <InfoBox title="§12.2 / §12.3 — Veldkalibratie & microfoonplaatsing">
        <div className="space-y-2">
          <p><SectionRef id="§12.2">§12.2 Veldkalibratie</SectionRef>: Voer voor én na elke meetserie een akoestische kalibratie uit.
            Als de afwijking voor een bepaalde frequentie meer dan 0,5 dB bedraagt, moeten de meetresultaten worden afgekeurd.</p>
          <p><SectionRef id="§12.3">§12.3 Microfoonplaatsing</SectionRef>: Draagbaar instrument: microfoon op de schouder, 0,1 m van de gehooropening, ~0,04 m boven de schouder.</p>
        </div>
      </InfoBox>

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
                  const today = new Date();
                  const calDate = inst.lastLabCalibration ? new Date(inst.lastLabCalibration) : null;
                  const calAgeMonths = calDate
                    ? (today.getTime() - calDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
                    : null;
                  const calOutdated = calAgeMonths !== null && calAgeMonths > 12;
                  const calMissing = !inst.lastLabCalibration;
                  return (calOutdated || calMissing) ? (
                    <Alert variant="warning" className="mb-2">
                      {calMissing
                        ? 'Geen labkalibratie geregistreerd — vereist voor rapportage (§15.c.3 NEN-EN-ISO 9612:2025)'
                        : `Labkalibratie verouderd (${Math.round(calAgeMonths!)} maanden geleden) — herkeuring aanbevolen (jaarlijks, §12.1)`}
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
                      <span className="font-medium text-zinc-600 dark:text-zinc-400">
                        <Formula math="u_2" /> = {u2FromInstrumentType(inst.type)} dB
                      </span>
                    </div>
                    <div className="mt-1 flex gap-3 text-xs text-zinc-400">
                      {inst.windscreen && <span>✓ Windkap</span>}
                      {inst.extensionCable && <span>✓ Verlengkabel</span>}
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

      {/* u3 reminder */}
      <Alert variant="neutral">
        <p><strong>Vaste onzekerheden (Bijlage C):</strong></p>
        <ul className="mt-1 space-y-0.5">
          <li><Formula math="u_3" /> = 1,0 dB — onzekerheid door microfoonplaatsing (§C.6)</li>
          <li>Uitgebreide onzekerheid <Formula math="U" /> = 1,65 × <Formula math="u" /> (eenzijdig 95% betrouwbaarheidsinterval, k=1,65)</li>
        </ul>
      </Alert>
    </div>
  );
}
