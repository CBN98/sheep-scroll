import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { ECONOMY } from '../config';
import { isLucky, rollBox, type BoxResult } from '../economy/boxes';
import { RARITY, STARTER_SKIN, type SeriesId } from '../sheep/skins';
import { storage } from '../platform/storage';

export type SoundMode = 'off' | 'wind' | 'dreamy' | 'lullaby';

export interface Settings {
  sound: SoundMode;
  volume: number;
  chime: boolean;
  haptics: boolean;
  dimmer: number; // 0–0.7 black overlay, since web pages can't change brightness
  idleDimMinutes: number; // 0 = never
  showCounter: boolean;
  parade: 'favorite' | 'shuffle';
}

interface Progress {
  totalSheep: number;
  wool: number;
  owned: Record<string, number>; // skin id → copies
  equipped: string;
  pity: number;
  lastDaily: string | null;
}

interface State extends Progress {
  settings: Settings;
  countSheep: () => void;
  claimDaily: () => number;
  openBox: (series: SeriesId) => BoxResult | null;
  equip: (id: string) => void;
  setSettings: (patch: Partial<Settings>) => void;
  resetProgress: () => void;
}

const freshProgress = (): Progress => ({
  totalSheep: 0,
  wool: ECONOMY.startingWool,
  owned: { [STARTER_SKIN]: 1 },
  equipped: STARTER_SKIN,
  pity: 0,
  lastDaily: null,
});

const defaultSettings: Settings = {
  sound: 'off',
  volume: 0.5,
  chime: false,
  haptics: true,
  dimmer: 0,
  idleDimMinutes: 3,
  showCounter: true,
  parade: 'favorite',
};

const today = () => new Date().toLocaleDateString('en-CA');

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      ...freshProgress(),
      settings: defaultSettings,

      countSheep: () =>
        set((s) => {
          const totalSheep = s.totalSheep + 1;
          return { totalSheep, wool: s.wool + (totalSheep % ECONOMY.woolEvery === 0 ? 1 : 0) };
        }),

      claimDaily: () => {
        if (get().lastDaily === today()) return 0;
        set((s) => ({ wool: s.wool + ECONOMY.dailyBonus, lastDaily: today() }));
        return ECONOMY.dailyBonus;
      },

      openBox: (series) => {
        const s = get();
        if (s.wool < ECONOMY.boxCost) return null;
        const skin = rollBox(series, s.pity);
        const duplicate = (s.owned[skin.id] ?? 0) > 0;
        const refund = duplicate ? RARITY[skin.rarity].refund : 0;
        set({
          wool: s.wool - ECONOMY.boxCost + refund,
          owned: { ...s.owned, [skin.id]: (s.owned[skin.id] ?? 0) + 1 },
          pity: isLucky(skin.rarity) ? 0 : s.pity + 1,
        });
        return { skin, duplicate, refund };
      },

      equip: (id) => {
        if (get().owned[id]) set({ equipped: id });
      },

      setSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),

      resetProgress: () => set(freshProgress()),
    }),
    {
      name: 'doze-scroll',
      version: 1,
      storage: createJSONStorage(() => storage),
      merge: (persisted, current) => {
        const p = persisted as Partial<State>;
        return { ...current, ...p, settings: { ...current.settings, ...p.settings } };
      },
    },
  ),
);
