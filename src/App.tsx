import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useStore } from './state/store';
import { ambient } from './audio/ambient';
import { SleepScreen } from './screens/SleepScreen';
import { ClosetScreen } from './screens/ClosetScreen';
import { BoxesScreen } from './screens/BoxesScreen';
import { SettingsScreen } from './screens/SettingsScreen';

type Tab = 'closet' | 'boxes' | 'settings';
const TABS: { id: Tab; label: string }[] = [
  { id: 'closet', label: 'Closet' },
  { id: 'boxes', label: 'Blind Boxes' },
  { id: 'settings', label: 'Settings' },
];

export function App() {
  const [tab, setTab] = useState<Tab | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const sound = useStore((s) => s.settings.sound);
  const volume = useStore((s) => s.settings.volume);
  const dimmer = useStore((s) => s.settings.dimmer);

  useEffect(() => ambient.configure(sound, volume), [sound, volume]);

  useEffect(() => {
    const bonus = useStore.getState().claimDaily();
    if (bonus) setToast(`+${bonus} wool · daily gift`);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(id);
  }, [toast]);

  return (
    <>
      <SleepScreen active={tab === null} onOpenMenu={() => setTab('closet')} />

      <AnimatePresence>
        {tab && (
          <motion.div
            className="panel"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.6, ease: [0.3, 0, 0.2, 1] }}
          >
            <div className="panel-head">
              <nav className="tabs">
                {TABS.map((t) => (
                  <button key={t.id} className={tab === t.id ? 'on' : ''} onClick={() => setTab(t.id)}>
                    {t.label}
                  </button>
                ))}
              </nav>
              <button className="icon-btn" aria-label="Back to sheep" onClick={() => setTab(null)}>✕</button>
            </div>
            <div className="panel-scroll">
              {tab === 'closet' && <ClosetScreen />}
              {tab === 'boxes' && <BoxesScreen />}
              {tab === 'settings' && <SettingsScreen />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div className="toast" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.2 }}>
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="night-dimmer" style={{ opacity: dimmer }} />
    </>
  );
}
