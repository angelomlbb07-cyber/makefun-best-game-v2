// DUSKFERRY v2 — boons: the pick-one-of-three reward between crossings.
// After each delivery but the last, the player chooses one boon; each is a
// real, understandable effect on the run. Drawn without repeat inside a run.

import { BOONS } from './config.js';

// Draw three distinct boons from the pool that have not been taken yet.
// Returns the three boon objects (in the order to show them).
export function drawBoons(random, taken) {
  const pool = BOONS.filter((b) => !taken.has(b.key));
  const out = [];
  while (out.length < 3 && pool.length > 0) {
    const i = Math.floor(random.next() * pool.length);
    out.push(pool.splice(i, 1)[0]);
  }
  return out;
}

// Apply a boon to the world's boon state. `boons` is the mutable state the
// world keeps: { hull: taken?, magnet, keel, eyes, calm, wind, taken:Set }.
// Returns a line for the announcement.
export function applyBoon(boons, key, state) {
  boons.taken.add(key);
  if (key === 'hull') {
    state.hull = Math.min(state.hull + 1, 5);
    return 'Sturdy Hull: +1 hull.';
  }
  if (key === 'magnet') {
    boons.magnet = true;
    return 'Lantern Magnet: lanterns drift to the ferry.';
  }
  if (key === 'keel') {
    boons.keel = true;
    return 'Swift Keel: +15% thrust, +10% top speed.';
  }
  if (key === 'eyes') {
    boons.eyes = true;
    return 'Bright Eyes: bright lanterns appear twice as often.';
  }
  if (key === 'calm') {
    boons.calm = true;
    return 'Calm Water: the current eases for the rest of the run.';
  }
  if (key === 'wind') {
    boons.wind = true;
    return 'Second Wind: one sinking hit will leave 1 hull.';
  }
  return '';
}
