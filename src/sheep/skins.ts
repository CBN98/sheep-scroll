export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';
export type SeriesId = 'starlight' | 'cozy' | 'pastel';
export type Accessory = 'nightcap' | 'scarf' | 'bow' | 'crown' | 'halo' | 'flower' | 'headphones';
export type PatternKind = 'spots' | 'stripes' | 'stars' | 'hearts';

export interface SheepLook {
  wool: string;
  face: string;
  pattern?: { kind: PatternKind; color: string };
  accessory?: Accessory;
  accessoryColor?: string;
  glow?: string;
}

export interface Skin {
  id: string;
  name: string;
  series: SeriesId | 'starter';
  rarity: Rarity;
  look: SheepLook;
}

export interface Series {
  id: SeriesId;
  name: string;
  blurb: string;
  box: { color: string; ribbon: string };
}

export const RARITY: Record<Rarity, { label: string; color: string; weight: number; refund: number }> = {
  common: { label: 'Common', color: '#cfd6e6', weight: 70, refund: 4 },
  rare: { label: 'Rare', color: '#8fc1ff', weight: 22, refund: 8 },
  epic: { label: 'Epic', color: '#c9a2ff', weight: 7, refund: 15 },
  legendary: { label: 'Legendary', color: '#ffd27a', weight: 1, refund: 30 },
};

export const SERIES: Series[] = [
  {
    id: 'starlight',
    name: 'Starlight',
    blurb: 'Sheep spun from moonbeams and midnight.',
    box: { color: '#2d3a7c', ribbon: '#ffd27a' },
  },
  {
    id: 'cozy',
    name: 'Cozy Knits',
    blurb: 'Warm wool, warmer hearts.',
    box: { color: '#8e4a3c', ribbon: '#f3e6cf' },
  },
  {
    id: 'pastel',
    name: 'Dreamy Pastels',
    blurb: 'Soft colors for softer dreams.',
    box: { color: '#e9a9c0', ribbon: '#b9e4d8' },
  },
];

export const STARTER_SKIN = 'classic';

export const SKINS: Skin[] = [
  { id: 'classic', name: 'Classic', series: 'starter', rarity: 'common', look: { wool: '#f4efe6', face: '#3a3340' } },
  { id: 'midnight', name: 'Midnight', series: 'starter', rarity: 'common', look: { wool: '#4a4558', face: '#e8dccb' } },
  { id: 'honey', name: 'Honey', series: 'starter', rarity: 'common', look: { wool: '#f3d9a0', face: '#6b4a35' } },

  // Starlight
  { id: 'moonbeam', name: 'Moonbeam', series: 'starlight', rarity: 'common', look: { wool: '#e3dcf5', face: '#4a4266' } },
  { id: 'dusk', name: 'Dusk', series: 'starlight', rarity: 'common', look: { wool: '#8d97c9', face: '#2b2a45' } },
  {
    id: 'stardust', name: 'Stardust', series: 'starlight', rarity: 'rare',
    look: { wool: '#3c4a8f', face: '#1d1f3d', pattern: { kind: 'stars', color: '#ffe3a1' } },
  },
  {
    id: 'sleepyhead', name: 'Sleepyhead', series: 'starlight', rarity: 'rare',
    look: { wool: '#ece6f7', face: '#3b3550', accessory: 'nightcap', accessoryColor: '#5868c4' },
  },
  {
    id: 'comet', name: 'Comet', series: 'starlight', rarity: 'epic',
    look: { wool: '#f6fbff', face: '#2e4057', pattern: { kind: 'stripes', color: '#bfe6ff' }, glow: '#8fd3ff' },
  },
  {
    id: 'celestia', name: 'Celestia', series: 'starlight', rarity: 'legendary',
    look: { wool: '#2a2f6b', face: '#151735', pattern: { kind: 'stars', color: '#ffd27a' }, accessory: 'crown', accessoryColor: '#ffd27a', glow: '#ffd27a' },
  },

  // Cozy Knits
  { id: 'oatmeal', name: 'Oatmeal', series: 'cozy', rarity: 'common', look: { wool: '#e8d9bd', face: '#5a4636' } },
  { id: 'cocoa', name: 'Cocoa', series: 'cozy', rarity: 'common', look: { wool: '#7a5541', face: '#e9d5c0' } },
  {
    id: 'candy-cane', name: 'Candy Cane', series: 'cozy', rarity: 'rare',
    look: { wool: '#fbf4ee', face: '#4a3a3a', pattern: { kind: 'stripes', color: '#e98a8a' }, accessory: 'scarf', accessoryColor: '#6fa58a' },
  },
  {
    id: 'sweater-weather', name: 'Sweater Weather', series: 'cozy', rarity: 'rare',
    look: { wool: '#efe4d2', face: '#4b3b33', accessory: 'scarf', accessoryColor: '#c4574b' },
  },
  {
    id: 'fireside', name: 'Fireside', series: 'cozy', rarity: 'epic',
    look: { wool: '#f0a96b', face: '#5a3324', accessory: 'headphones', accessoryColor: '#5a3324', glow: '#ff9a5a' },
  },
  {
    id: 'grandmas-quilt', name: "Grandma's Quilt", series: 'cozy', rarity: 'legendary',
    look: { wool: '#fbe9df', face: '#5b3f45', pattern: { kind: 'hearts', color: '#e67d8f' }, accessory: 'bow', accessoryColor: '#e67d8f', glow: '#ffb3c0' },
  },

  // Dreamy Pastels
  { id: 'peach', name: 'Peach', series: 'pastel', rarity: 'common', look: { wool: '#ffd3bd', face: '#6b4a45' } },
  { id: 'mint', name: 'Mint', series: 'pastel', rarity: 'common', look: { wool: '#c7eedd', face: '#3f5a52' } },
  {
    id: 'bubblegum', name: 'Bubblegum', series: 'pastel', rarity: 'rare',
    look: { wool: '#ffc4dc', face: '#5e3b4e', accessory: 'bow', accessoryColor: '#ff86b4' },
  },
  {
    id: 'lilac-dream', name: 'Lilac Dream', series: 'pastel', rarity: 'rare',
    look: { wool: '#dccbf5', face: '#4b3d63', accessory: 'flower', accessoryColor: '#fff2a8' },
  },
  {
    id: 'cotton-candy', name: 'Cotton Candy', series: 'pastel', rarity: 'epic',
    look: { wool: '#ffd6ea', face: '#5a4060', pattern: { kind: 'spots', color: '#a9dcff' }, glow: '#ffb6e1' },
  },
  {
    id: 'cloud-nine', name: 'Cloud Nine', series: 'pastel', rarity: 'legendary',
    look: { wool: '#ffffff', face: '#7c8bb0', accessory: 'halo', accessoryColor: '#ffe9a8', glow: '#e7f0ff' },
  },
];

export const SKIN_BY_ID: Record<string, Skin> = Object.fromEntries(SKINS.map((s) => [s.id, s]));

// Everyone owns the starter sheep from the beginning.
export const STARTER_OWNED: Record<string, number> = Object.fromEntries(
  SKINS.filter((s) => s.series === 'starter').map((s) => [s.id, 1]),
);
