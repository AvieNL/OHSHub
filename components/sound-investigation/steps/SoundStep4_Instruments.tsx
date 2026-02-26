'use client';

import { useState } from 'react';
import type { SoundInvestigation, SoundInstrument, InstrumentType } from '@/lib/sound-investigation-types';
import { newSoundId } from '@/lib/sound-investigation-storage';
import { u2FromInstrumentType } from '@/lib/sound-stats';
import { Abbr } from '@/components/Abbr';
import { Formula } from '@/components/Formula';
import { SectionRef } from '@/components/SectionRef';
import { InfoBox } from '@/components/InfoBox';

interface Props {
  investigation: SoundInvestigation;
  onUpdate: (partial: Partial<SoundInvestigation>) => void;
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
    <div className="space-y-4 rounded-xl border border-orange-200 bg-orange-50/50 p-5 dark:border-orange-800/50 dark:bg-orange-900/10">
      <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        Meetapparaat opgeven
      </h4>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Type instrument (<SectionRef id="§5.1">§5.1</SectionRef>, <SectionRef id="Bijlage C">Tabel C.5</SectionRef>)
        </label>
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

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Fabrikant</label>
          <input
            type="text"
            value={form.manufacturer ?? ''}
            onChange={(e) => upd({ manufacturer: e.target.value })}
            placeholder="Bijv. Brüel & Kjær"
            className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Model / type</label>
          <input
            type="text"
            value={form.model ?? ''}
            onChange={(e) => upd({ model: e.target.value })}
            placeholder="Bijv. 2250"
            className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Serienummer (<SectionRef id="§15.c.1">§15.c.1</SectionRef>)
          </label>
          <input
            type="text"
            value={form.serialNumber ?? ''}
            onChange={(e) => upd({ serialNumber: e.target.value })}
            placeholder="Serienummer"
            className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Datum laatste labkalibratie (<SectionRef id="§15.c.3">§15.c.3</SectionRef>)
          </label>
          <input
            type="date"
            value={form.lastLabCalibration ?? ''}
            onChange={(e) => upd({ lastLabCalibration: e.target.value })}
            className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Kalibratiecertificaatnummer
          </label>
          <input
            type="text"
            value={form.calibrationRef ?? ''}
            onChange={(e) => upd({ calibrationRef: e.target.value })}
            placeholder="Cert. nr."
            className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
      </div>

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
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Opmerkingen</label>
        <input
          type="text"
          value={form.notes ?? ''}
          onChange={(e) => upd({ notes: e.target.value })}
          placeholder="Bijv. microfoon type 4189, windkap UA 0237"
          className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>

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
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/30">
                {(() => {
                  const today = new Date();
                  const calDate = inst.lastLabCalibration ? new Date(inst.lastLabCalibration) : null;
                  const calAgeMonths = calDate
                    ? (today.getTime() - calDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
                    : null;
                  const calOutdated = calAgeMonths !== null && calAgeMonths > 12;
                  const calMissing = !inst.lastLabCalibration;
                  return (calOutdated || calMissing) ? (
                    <div className="mb-2 rounded-lg bg-amber-50 px-3 py-1.5 text-xs text-amber-700 dark:bg-amber-900/15 dark:text-amber-400">
                      ⚠ {calMissing
                        ? 'Geen labkalibratie geregistreerd — vereist voor rapportage (§15.c.3 NEN-EN-ISO 9612:2025)'
                        : `Labkalibratie verouderd (${Math.round(calAgeMonths!)} maanden geleden) — herkeuring aanbevolen (jaarlijks, §12.1)`}
                    </div>
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
                    <button
                      onClick={() => setEditingId(inst.id)}
                      className="rounded border border-zinc-200 px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-700"
                    >
                      Bewerken
                    </button>
                    <button
                      onClick={() => removeInstrument(inst.id)}
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
        <InstrumentForm
          instrument={{ id: newSoundId(), type: 'slm-class1' }}
          onSave={saveInstrument}
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
          Meetapparaat toevoegen
        </button>
      )}

      {/* u3 reminder */}
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-xs text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-400">
        <p><strong>Vaste onzekerheden (Bijlage C):</strong></p>
        <ul className="mt-1 space-y-0.5">
          <li><Formula math="u_3" /> = 1,0 dB — onzekerheid door microfoonplaatsing (§C.6)</li>
          <li>Uitgebreide onzekerheid <Formula math="U" /> = 1,65 × <Formula math="u" /> (eenzijdig 95% betrouwbaarheidsinterval, k=1,65)</li>
        </ul>
      </div>
    </div>
  );
}
