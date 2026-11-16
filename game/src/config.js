// DUSKFERRY v2 — configuration: canvas, tuning, palettes, text, and every
// number the world and renderer share. One place for the values that make
// the loop: difficulties, passengers, boons, combos and crossings.

export const VIEW_W = 1280;
export const VIEW_H = 800;
export const STEP = 1 / 60;
export const LIVES = 3;
export const MAX_HULL = 5;
export const CROSSINGS = 5;
export const BEST_KEY = 'duskferry-best';

// River geometry (side view): banks at both ends, docks on each bank.
export const LEFT_BANK = 90;
export const RIGHT_BANK = 1190;
export const DOCK_Y = 400;

// Ferry physics.
export const FERRY_RADIUS = 22;
export const THRUST = 520;
export const MAX_SPEED = 270;
export const DRAG = 0.86;
// Every lantern aboard weighs the ferry down: slower, heavier, more exposed.
export const LOAD_PER_LANTERN = 0.04;
export const LOAD_MAX = 0.32;

// Scoring.
export const LANTERN_SCORE = 10;
export const BRIGHT_SCORE = 25;
export const GOLDEN_SCORE = 50;
export const DELIVERY_SCORE = 100;
export const WIN_BONUS = 500;
export const GRAZE_SCORE = 5;

// Difficulties: chosen on the title screen (keys 1/2/3 or click).
// Each is a current/hazard scale and a score multiplier.
export const DIFFICULTIES = [
  { key: 'calm', name: 'Calm', mult: 1, current: 0.8, hazards: 0.8, blurb: 'A gentle dusk.' },
  { key: 'swift', name: 'Swift', mult: 1.5, current: 1.0, hazards: 1.0, blurb: 'The river as it is.' },
  { key: 'storm', name: 'Storm', mult: 2, current: 1.25, hazards: 1.25, blurb: 'The Blackwater at its worst.' },
];

// Passengers: three wait at the west dock each crossing; sail to one to
// board them. Each is a trade-off between payout, risk and speed.
export const PASSENGERS = [
  {
    key: 'elder', name: 'Elder Maren', color: '#b48ce8', pay: 200,
    rule: 'Pays 200. Needs the full quota.',
    short: 'Elder · 200 · full quota',
  },
  {
    key: 'courier', name: 'Courier Pip', color: '#ffb347', pay: 150,
    rule: 'Pays 150. A hit ruins the parcel (pays 40).',
    short: 'Courier · 150 · no hits!',
  },
  {
    key: 'keeper', name: 'Lantern-keeper Wren', color: '#5fd8c8', pay: 100,
    rule: 'Pays 100. Lanterns count double toward the quota.',
    short: 'Keeper · 100 · lanterns ×2',
  },
];
// Where the three waiting passengers stand on the west dock (y positions).
export const PASSENGER_SPOTS = [415, 455, 495];

// Boons: after each delivery but the last, pick 1 of 3. Six in the pool,
// drawn without repeat inside a run.
export const BOONS = [
  { key: 'hull', name: 'Sturdy Hull', desc: '+1 hull (max 5).', icon: '♥' },
  { key: 'magnet', name: 'Lantern Magnet', desc: 'Lanterns within 120 px drift to the ferry.', icon: '◎' },
  { key: 'keel', name: 'Swift Keel', desc: 'Thrust +15%, top speed +10%.', icon: '»' },
  { key: 'eyes', name: 'Bright Eyes', desc: 'Bright lanterns appear twice as often.', icon: '✦' },
  { key: 'calm', name: 'Calm Water', desc: 'Current −15% for the rest of the run.', icon: '≈' },
  { key: 'wind', name: 'Second Wind', desc: 'Once: a sinking hit leaves 1 hull.', icon: '✚' },
];

// Difficulty per crossing (1-based): current speed, rocks, whirlpools,
// lanterns afloat, how many lanterns the far dock needs lit, and the one
// new mechanic that crossing introduces.
export const CROSSING_TABLE = [
  { current: 24, rocks: 5, whirls: 0, lanterns: 8, quota: 3, mechanic: 'none' },
  { current: 34, rocks: 7, whirls: 1, lanterns: 9, quota: 4, mechanic: 'fog' },
  { current: 46, rocks: 9, whirls: 2, lanterns: 10, quota: 5, mechanic: 'wander' },
  { current: 58, rocks: 11, whirls: 2, lanterns: 11, quota: 6, mechanic: 'jams' },
  { current: 70, rocks: 13, whirls: 3, lanterns: 12, quota: 7, mechanic: 'golden' },
];

// Sky and water palettes, one per crossing: dusk deepens into night,
// then the fifth crossing breaks into dawn.
export const PALETTES = [
  { sky: '#241a4d', skyTop: '#120e2e', water: '#14224e', waterDeep: '#0b1533', mist: 0.10 },
  { sky: '#1a1440', skyTop: '#0d0a26', water: '#101d44', waterDeep: '#091026', mist: 0.16 },
  { sky: '#141031', skyTop: '#0a0820', water: '#0d1838', waterDeep: '#070d20', mist: 0.22 },
  { sky: '#0e0c26', skyTop: '#070614', water: '#0a142e', waterDeep: '#050a1a', mist: 0.30 },
  { sky: '#7a4a2b', skyTop: '#3d2438', water: '#274b63', waterDeep: '#12283d', mist: 0.12 },
];

export const GOLD = '#ffb347';
export const GOLD_SOFT = '#ffd98a';
export const FOAM = '#9fd8e8';
export const HULL_RED = '#c65b4e';
