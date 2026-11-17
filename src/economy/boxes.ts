import { ECONOMY } from '../config';
import { RARITY, SKINS, type Rarity, type SeriesId, type Skin } from '../sheep/skins';

export interface BoxResult {
  skin: Skin;
  duplicate: boolean;
  refund: number;
}

const ORDER: Rarity[] = ['common', 'rare', 'epic', 'legendary'];

function pickWeighted(rarities: Rarity[], rand: () => number): Rarity {
  const total = rarities.reduce((sum, r) => sum + RARITY[r].weight, 0);
  let roll = rand() * total;
  for (const r of rarities) {
    roll -= RARITY[r].weight;
    if (roll < 0) return r;
  }
  return rarities[rarities.length - 1];
}

// `pity` = boxes opened since the last Epic or better.
export function rollBox(series: SeriesId, pity: number, rand: () => number = Math.random): Skin {
  const guaranteed = pity + 1 >= ECONOMY.pityAfter;
  const rarity = pickWeighted(guaranteed ? ['epic', 'legendary'] : ORDER, rand);
  const pool = SKINS.filter((s) => s.series === series && s.rarity === rarity);
  return pool[Math.floor(rand() * pool.length)];
}

export function isLucky(rarity: Rarity) {
  return rarity === 'epic' || rarity === 'legendary';
}

export function oddsText() {
  return ORDER.map((r) => `${RARITY[r].label} ${RARITY[r].weight}%`).join(' · ');
}
