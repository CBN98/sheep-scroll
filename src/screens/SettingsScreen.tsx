import { useState } from 'react';
import { APP_NAME } from '../config';
import { useStore, type SoundMode } from '../state/store';
import { haptics } from '../platform/haptics';
import { ambient } from '../audio/ambient';

const SOUNDS: { id: SoundMode; label: string }[] = [
  { id: 'off', label: 'Off' },
  { id: 'wind', label: 'Wind' },
  { id: 'farm', label: 'Farm' },
  { id: 'lullaby', label: 'Lullaby' },
];
const DIM_OPTIONS = [0, 1, 3, 5, 10];

export function SettingsScreen() {
  const settings = useStore((s) => s.settings);
  const set = useStore((s) => s.setSettings);
  const totalSheep = useStore((s) => s.totalSheep);
  const resetProgress = useStore((s) => s.resetProgress);
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div className="panel-body settings">
      <Row label="Ambient sound">
        <div className="segmented">
          {SOUNDS.map((s) => (
            <button
              key={s.id}
              className={settings.sound === s.id ? 'on' : ''}
              onClick={() => {
                ambient.unlock();
                set({ sound: s.id });
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </Row>

      <Row label="Volume">
        <input
          type="range" min={0} max={1} step={0.05} value={settings.volume}
          onChange={(e) => set({ volume: Number(e.target.value) })}
        />
      </Row>

      <Toggle label="Soft chime when a sheep floats away" checked={settings.chime} onChange={(chime) => set({ chime })} />

      <Toggle
        label="Gentle vibration"
        hint={haptics.supported ? undefined : 'Not supported in this browser'}
        checked={settings.haptics}
        onChange={(v) => set({ haptics: v })}
      />

      <Row label="Night dimmer" hint="Darkens the whole screen">
        <input
          type="range" min={0} max={0.7} step={0.05} value={settings.dimmer}
          onChange={(e) => set({ dimmer: Number(e.target.value) })}
        />
      </Row>

      <Row label="Fade to black when idle" hint="Sound fades out too; touch to wake">
        <div className="segmented">
          {DIM_OPTIONS.map((m) => (
            <button key={m} className={settings.idleDimMinutes === m ? 'on' : ''} onClick={() => set({ idleDimMinutes: m })}>
              {m ? `${m}m` : 'Never'}
            </button>
          ))}
        </div>
      </Row>

      <Toggle label="Show sheep numbers" checked={settings.showCounter} onChange={(showCounter) => set({ showCounter })} />

      <hr />
      <p className="muted">
        {totalSheep.toLocaleString()} sheep counted on this device, all time.
        <br />
        Progress is saved on this device only.
      </p>

      {confirmReset ? (
        <div className="row-actions">
          <button className="btn danger" onClick={() => { resetProgress(); setConfirmReset(false); }}>
            Yes, reset everything
          </button>
          <button className="btn ghost" onClick={() => setConfirmReset(false)}>Cancel</button>
        </div>
      ) : (
        <button className="btn ghost" onClick={() => setConfirmReset(true)}>Reset progress…</button>
      )}

      <p className="muted small center">{APP_NAME} · sweet dreams</p>
    </div>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="setting">
      <div className="setting-label">
        {label}
        {hint && <span className="muted small">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function Toggle({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="setting toggle">
      <span className="setting-label">
        {label}
        {hint && <span className="muted small">{hint}</span>}
      </span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}
