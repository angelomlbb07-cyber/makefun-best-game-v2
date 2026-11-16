// DUSKFERRY v2 — combos and grazes: the scoring streak. Consecutive
// lantern pickups without a hit multiply each lantern's points; a hit
// resets the streak. A bright lantern chained onto a live streak pays a
// chain bonus. Passing close to a hazard without touching it pays a graze.
// Every scoring event leaves a floating popup for the renderer to draw.
//
// The pattern is the generic arcade combo idea (a streak that multiplies,
// a miss that resets it, a bonus for a chained difficult pickup); the
// formulas and this code are DUSKFERRY's own.

export const COMBO_CAP = 5;
export const CHAIN_MULT = 1.5;
export const GRAZE_MARGIN = 14;
export const GRAZE_COOLDOWN = 2;

export function createCombo() {
  return {
    streak: 0, // lanterns in a row without a hit
    popups: [], // {x, y, text, color, life}
  };
}

// The multiplier on the next lantern: 1st of a streak pays ×1, 2nd ×2, …
// capped at COMBO_CAP.
export function comboMult(combo) {
  return Math.min(Math.max(combo.streak, 1), COMBO_CAP);
}

// Score one lantern pickup. `kind` is 'lantern' | 'bright' | 'golden'.
// Returns the points (before the difficulty multiplier) and records the
// popups. A bright lantern on a live streak (streak ≥ 2 after this pickup)
// also pays the chain bonus.
export function scoreLantern(combo, kind, base, x, y) {
  combo.streak += 1;
  const mult = comboMult(combo);
  let points = base * mult;
  let text = `+${points}`;
  let color = '#ffd98a';
  if (kind === 'bright' && combo.streak >= 2) {
    points = Math.round(points * CHAIN_MULT);
    text = `+${points} CHAIN ×1.5`;
    color = '#ffe9a8';
  } else if (combo.streak >= 3) {
    text = `+${points} COMBO ×${mult}`;
  }
  combo.popups.push({ x, y: y - 18, text, color, life: 1.2, max: 1.2 });
  return points;
}

// Score a graze: the ferry passed within GRAZE_MARGIN of a hazard's edge
// without touching it. `base` is GRAZE_SCORE; the combo multiplier applies.
export function scoreGraze(combo, base, x, y) {
  const mult = comboMult(combo);
  const points = base * mult;
  combo.popups.push({ x, y: y - 18, text: `GRAZE +${points}`, color: '#9fd8e8', life: 1.2, max: 1.2 });
  return points;
}

// A hit ends the streak. Returns true if a live streak was lost (so the
// world can show it).
export function breakCombo(combo, x, y) {
  const lost = combo.streak >= 2;
  if (lost) combo.popups.push({ x, y: y - 18, text: 'COMBO LOST', color: '#ff8a7a', life: 1.2, max: 1.2 });
  combo.streak = 0;
  return lost;
}

// Age the popups; call every step.
export function updatePopups(combo, dt) {
  for (const p of combo.popups) {
    p.life -= dt;
    p.y -= 26 * dt;
  }
  combo.popups = combo.popups.filter((p) => p.life > 0);
}
