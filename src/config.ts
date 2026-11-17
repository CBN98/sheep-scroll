// Rename the app here — the page title and install manifest pick it up too.
export const APP_NAME = 'Doze Scroll';
export const SHORT_NAME = 'Doze Scroll';
export const TAGLINE = 'Scroll yourself to sleep';

// All durations in seconds. Slow on purpose.
export const TIMING = {
  enter: 1.8, // a new sheep fades in
  float: 5, // a sheep drifts up and away
  spawnAt: 0.45, // fraction of the float before the next sheep appears
  maxQueue: 1, // extra swipes remembered while a sheep is still arriving
};

export const ECONOMY = {
  woolEvery: 3, // 1 wool per N sheep counted
  startingWool: 15,
  dailyBonus: 10,
  boxCost: 15,
  pityAfter: 20, // an Epic+ is guaranteed within this many boxes
};
