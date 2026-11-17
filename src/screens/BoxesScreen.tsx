import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ECONOMY } from '../config';
import { useStore } from '../state/store';
import { oddsText, type BoxResult } from '../economy/boxes';
import { GiftBox } from '../components/GiftBox';
import { Sheep } from '../sheep/Sheep';
import { RARITY, SERIES, SKINS, type Series } from '../sheep/skins';

export function BoxesScreen() {
  const wool = useStore((s) => s.wool);
  const owned = useStore((s) => s.owned);
  const pity = useStore((s) => s.pity);
  const openBox = useStore((s) => s.openBox);
  const [opening, setOpening] = useState<{ series: Series; result: BoxResult } | null>(null);

  const open = (series: Series) => {
    const result = openBox(series.id);
    if (result) setOpening({ series, result });
  };

  return (
    <div className="panel-body">
      <p className="muted">
        You have <strong>🧶 {wool}</strong> wool. Earn 1 for every {ECONOMY.woolEvery} sheep you count, plus{' '}
        {ECONOMY.dailyBonus} each day.
      </p>

      <div className="box-list">
        {SERIES.map((series) => {
          const skins = SKINS.filter((s) => s.series === series.id);
          const got = skins.filter((s) => owned[s.id]).length;
          return (
            <div key={series.id} className="box-card">
              <GiftBox color={series.box.color} ribbon={series.box.ribbon} className="box-card-art" />
              <div className="box-card-info">
                <h3>{series.name}</h3>
                <p className="muted">{series.blurb}</p>
                <p className="muted small">{got}/{skins.length} collected</p>
              </div>
              <button className="btn" disabled={wool < ECONOMY.boxCost} onClick={() => open(series)}>
                Open · 🧶 {ECONOMY.boxCost}
              </button>
            </div>
          );
        })}
      </div>

      <p className="muted small center">
        Odds: {oddsText()}
        <br />
        An Epic or better is guaranteed within {ECONOMY.pityAfter - pity} more box{ECONOMY.pityAfter - pity === 1 ? '' : 'es'}.
        Duplicates give some wool back.
      </p>

      <AnimatePresence>
        {opening && <BoxOpening key="opening" {...opening} onDone={() => setOpening(null)} />}
      </AnimatePresence>
    </div>
  );
}

function BoxOpening({ series, result, onDone }: { series: Series; result: BoxResult; onDone: () => void }) {
  const [opened, setOpened] = useState(false);
  const rarity = RARITY[result.skin.rarity];

  return (
    <motion.div
      className="opening"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      onClick={() => (opened ? onDone() : setOpened(true))}
    >
      <motion.div
        className="opening-glow"
        style={{ background: `radial-gradient(circle, ${rarity.color}55 0%, transparent 65%)` }}
        animate={{ scale: opened ? 1.4 : 0.6, opacity: opened ? 1 : 0.3 }}
        transition={{ duration: 2.2, ease: 'easeOut' }}
      />

      <div className="opening-stage">
        <motion.div
          className="opening-sheep"
          initial={{ opacity: 0, y: 60, scale: 0.6 }}
          animate={opened ? { opacity: 1, y: -40, scale: 1 } : {}}
          transition={{ duration: 2, delay: 0.6, ease: 'easeOut' }}
        >
          <Sheep look={result.skin.look} />
        </motion.div>
        <motion.div
          className="opening-box"
          animate={opened ? { y: 60, opacity: 0.0 } : { rotate: [0, -3, 3, -2, 0] }}
          transition={opened ? { duration: 1.8, delay: 0.8 } : { duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <GiftBox color={series.box.color} ribbon={series.box.ribbon} open={opened} />
        </motion.div>
      </div>

      <motion.div
        className="opening-text"
        animate={{ opacity: 1 }}
        initial={{ opacity: 0 }}
        key={opened ? 'after' : 'before'}
        transition={{ duration: 1, delay: opened ? 1.8 : 0.4 }}
      >
        {opened ? (
          <>
            <div className="opening-rarity" style={{ color: rarity.color }}>{rarity.label}</div>
            <div className="opening-name">{result.skin.name}</div>
            <div className="muted">{result.duplicate ? `Duplicate · +${result.refund} wool back` : 'New sheep!'}</div>
            <div className="muted small">tap to close</div>
          </>
        ) : (
          <div className="muted">tap to open</div>
        )}
      </motion.div>
    </motion.div>
  );
}
