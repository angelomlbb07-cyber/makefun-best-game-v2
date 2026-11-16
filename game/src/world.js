// DUSKFERRY v2 — the world: ferry physics, river current, hazards,
// lanterns, passengers, combos, grazes, boons and crossings. Pure logic;
// rendering lives in render.js. update() returns the events of the step
// for main to turn into sound and screen changes: pickup, bright, golden,
// graze, hit, deliver, boon, win, lose, wind.

import {
  BRIGHT_SCORE,
  CROSSINGS,
  CROSSING_TABLE,
  DELIVERY_SCORE,
  DIFFICULTIES,
  DOCK_Y,
  DRAG,
  FERRY_RADIUS,
  GOLDEN_SCORE,
  GRAZE_SCORE,
  LANTERN_SCORE,
  LEFT_BANK,
  LIVES,
  LOAD_MAX,
  LOAD_PER_LANTERN,
  MAX_HULL,
  MAX_SPEED,
  RIGHT_BANK,
  THRUST,
  VIEW_H,
  VIEW_W,
  WIN_BONUS,
} from './config.js';
import { steerVector } from './input.js';
import { breakCombo, comboMult, createCombo, scoreGraze, scoreLantern, updatePopups, GRAZE_COOLDOWN, GRAZE_MARGIN } from './combos.js';
import { applyBoon, drawBoons } from './boons.js';
import { deliveryPay, drawPassengers, quotaFor } from './passengers.js';

export function createWorld(random) {
  const state = {
    crossing: 1,
    score: 0,
    lanterns: 0,
    quota: 3,
    hull: LIVES,
    passenger: 'waiting', // 'waiting' | 'aboard' | 'delivered'
    aboard: null, // the passenger object aboard, or null
    waiting: [], // the three passengers on the west dock
    parcelRuined: false,
    difficulty: 1, // index into DIFFICULTIES (Swift default)
    combo: createCombo(),
    boons: { magnet: false, keel: false, eyes: false, calm: false, wind: false, taken: new Set() },
    windUsed: false,
    boonOffer: [], // the three boons on offer right now
    awaitingBoon: false,
    ferry: { x: LEFT_BANK + 220, y: DOCK_Y, vx: 0, vy: 0, invuln: 0 },
    rocks: [],
    whirls: [],
    logs: [],
    floats: [],
    fog: [], // fog banks {x, y, rx, ry}
    jams: [], // log jams {y, gapX, gapW, logs:[{x, angle, spin}]}
    particles: [],
    time: 0,
    shake: 0,
    won: false,
    lost: false,
  };

  function currentSpeed(table) {
    const diff = DIFFICULTIES[state.difficulty];
    let c = table.current * diff.current;
    if (state.boons.calm) c *= 0.85;
    return c;
  }

  // How much the lanterns aboard weigh the ferry down (0..LOAD_MAX).
  function loadFactor() {
    return Math.min(LOAD_PER_LANTERN * state.lanterns, LOAD_MAX);
  }

  function placeHazards(table) {
    const diff = DIFFICULTIES[state.difficulty];
    const mechanic = table.mechanic;
    const rockCount = Math.round(table.rocks * diff.hazards);
    const whirlCount = Math.round(table.whirls * diff.hazards);
    state.rocks = [];
    state.whirls = [];
    state.logs = [];
    state.fog = [];
    state.jams = [];
    for (let i = 0; i < rockCount; i += 1) {
      state.rocks.push({
        x: random.range(LEFT_BANK + 120, RIGHT_BANK - 120),
        y: random.range(60, VIEW_H - 60),
        r: random.range(15, 30),
        seed: random.range(0, Math.PI * 2),
        grazeAt: -99,
      });
    }
    for (let i = 0; i < whirlCount; i += 1) {
      const wander = mechanic === 'wander' || mechanic === 'golden';
      state.whirls.push({
        x: random.range(LEFT_BANK + 220, RIGHT_BANK - 220),
        y: random.range(140, VIEW_H - 140),
        r: random.range(34, 46),
        phase: random.range(0, Math.PI * 2),
        grazeAt: -99,
        wander,
        baseX: 0,
        amp: wander ? random.range(60, 130) : 0,
      });
      const w = state.whirls[state.whirls.length - 1];
      w.baseX = w.x;
    }
    for (let i = 0; i < 3; i += 1) {
      state.logs.push({
        x: random.range(LEFT_BANK + 120, RIGHT_BANK - 120),
        y: random.range(60, VIEW_H - 60),
        r: 12,
        angle: random.range(0, Math.PI),
        spin: random.range(-0.3, 0.3),
        grazeAt: -99,
      });
    }
    // Fog banks (crossing II, and one on the last crossing): they drift
    // downstream and hide whatever is under them.
    if (mechanic === 'fog' || mechanic === 'golden') {
      const count = mechanic === 'fog' ? 2 : 1;
      for (let i = 0; i < count; i += 1) {
        state.fog.push({
          x: random.range(LEFT_BANK + 260, RIGHT_BANK - 260),
          y: random.range(160, VIEW_H - 160),
          rx: random.range(200, 300),
          ry: random.range(70, 110),
        });
      }
    }
    // Log jams (crossing IV, and one on the last crossing): a row of logs
    // across the river with a single gap the ferry must find.
    if (mechanic === 'jams' || mechanic === 'golden') {
      const gapX = random.range(LEFT_BANK + 300, RIGHT_BANK - 300);
      const gapW = 150;
      const logs = [];
      for (let x = LEFT_BANK + 60; x < RIGHT_BANK - 40; x += 54) {
        if (Math.abs(x - gapX) < gapW / 2 + 20) continue;
        logs.push({ x, angle: random.range(-0.08, 0.08), spin: random.range(-0.05, 0.05), grazeAt: -99 });
      }
      state.jams.push({ y: random.range(180, 420), gapX, gapW, logs });
    }
    // Lanterns afloat. On the last crossing three of them are golden:
    // worth double, and they count double toward the quota.
    state.floats = [];
    const goldenCount = mechanic === 'golden' ? 3 : 0;
    for (let i = 0; i < table.lanterns; i += 1) {
      const golden = i < goldenCount;
      const bright = !golden && (i % 4 === 0 || (state.boons.eyes && i % 2 === 0));
      state.floats.push({
        x: random.range(LEFT_BANK + 120, RIGHT_BANK - 120),
        y: random.range(60, VIEW_H - 60),
        bright,
        golden,
        bob: random.range(0, Math.PI * 2),
        taken: false,
      });
    }
  }

  function startCrossing(n) {
    const table = CROSSING_TABLE[n - 1];
    state.crossing = n;
    state.quota = table.quota;
    state.lanterns = 0;
    state.passenger = 'waiting';
    state.aboard = null;
    state.parcelRuined = false;
    state.awaitingBoon = false;
    state.boonOffer = [];
    state.time = 0;
    state.ferry.x = LEFT_BANK + 220;
    state.ferry.y = DOCK_Y;
    state.ferry.vx = 0;
    state.ferry.vy = 0;
    state.ferry.invuln = 0;
    state.waiting = drawPassengers(random);
    placeHazards(table);
  }

  function reset(difficultyIdx) {
    state.difficulty = Number.isInteger(difficultyIdx) ? difficultyIdx : 1;
    state.score = 0;
    state.hull = LIVES;
    state.won = false;
    state.lost = false;
    state.particles = [];
    state.shake = 0;
    state.combo = createCombo();
    state.boons = { magnet: false, keel: false, eyes: false, calm: false, wind: false, taken: new Set() };
    state.windUsed = false;
    startCrossing(1);
  }

  // The player picked a boon: apply it, then sail the next crossing.
  // Returns the announcement line for the boon.
  function chooseBoon(key) {
    const line = applyBoon(state.boons, key, state);
    startCrossing(state.crossing + 1);
    return line;
  }

  function burst(x, y, color, count, speed) {
    for (let i = 0; i < count; i += 1) {
      const a = random.range(0, Math.PI * 2);
      const v = random.range(speed * 0.4, speed);
      state.particles.push({
        x, y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        life: random.range(0.4, 0.9),
        max: 0.9,
        color,
        r: random.range(2, 4.5),
      });
    }
  }

  function update(dt, input) {
    const events = [];
    if (state.won || state.lost || state.awaitingBoon) return events;
    const table = CROSSING_TABLE[state.crossing - 1];
    const diff = DIFFICULTIES[state.difficulty];
    const current = currentSpeed(table);
    const ferry = state.ferry;
    state.time += dt;
    if (ferry.invuln > 0) ferry.invuln -= dt;
    if (state.shake > 0) state.shake = Math.max(0, state.shake - dt * 30);
    updatePopups(state.combo, dt);

    // Steering: keys win; otherwise hold the mouse to sail toward it.
    // The load slows the ferry: each lantern aboard costs thrust and speed.
    const load = loadFactor();
    const thrust = THRUST * (1 - load) * (state.boons.keel ? 1.15 : 1);
    const maxSpeed = MAX_SPEED * (1 - load) * (state.boons.keel ? 1.10 : 1);
    const keys = steerVector(input);
    let ax = keys.x * thrust;
    let ay = keys.y * thrust;
    if (keys.x === 0 && keys.y === 0 && input.mouseDown) {
      const dx = input.mouseX - ferry.x;
      const dy = input.mouseY - ferry.y;
      const d = Math.hypot(dx, dy);
      if (d > 12) {
        ax = (dx / d) * thrust;
        ay = (dy / d) * thrust;
      }
    }
    ferry.vx += ax * dt;
    // The river itself pushes everything downstream.
    ferry.vy += (ay + current) * dt;

    // Whirlpools drag the ferry toward their centres; wandering whirls
    // also slide sideways across the river.
    for (const w of state.whirls) {
      if (w.wander) w.x = w.baseX + Math.sin(state.time * 0.35 + w.phase) * w.amp;
      const dx = w.x - ferry.x;
      const dy = w.y - ferry.y;
      const d = Math.hypot(dx, dy);
      if (d > 1 && d < 170) {
        const pull = (1 - d / 170) * 300;
        ferry.vx += (dx / d) * pull * dt;
        ferry.vy += (dy / d) * pull * dt;
      }
    }

    const drag = Math.pow(DRAG, dt * 60);
    ferry.vx *= drag;
    ferry.vy *= drag;
    const speed = Math.hypot(ferry.vx, ferry.vy);
    if (speed > maxSpeed) {
      ferry.vx = (ferry.vx / speed) * maxSpeed;
      ferry.vy = (ferry.vy / speed) * maxSpeed;
    }
    ferry.x += ferry.vx * dt;
    ferry.y += ferry.vy * dt;
    ferry.x = Math.max(LEFT_BANK + FERRY_RADIUS, Math.min(RIGHT_BANK - FERRY_RADIUS, ferry.x));
    if (ferry.y < 34) {
      ferry.y = 34;
      ferry.vy = Math.abs(ferry.vy) * 0.3;
    }
    if (ferry.y > VIEW_H - 34) {
      ferry.y = VIEW_H - 34;
      ferry.vy = -Math.abs(ferry.vy) * 0.3;
    }

    // Everything afloat drifts downstream and wraps to the top.
    const drift = (list, factor) => {
      for (const o of list) {
        o.y += current * factor * dt;
        if (o.y > VIEW_H + 40) {
          o.y = -30;
          o.x = random.range(LEFT_BANK + 120, RIGHT_BANK - 120);
        }
      }
    };
    drift(state.rocks, 0.9);
    drift(state.logs, 1.1);
    drift(state.floats, 0.5);
    for (const w of state.whirls) {
      w.y += current * 0.35 * dt;
      if (w.y > VIEW_H + 60) {
        w.y = -40;
        w.baseX = random.range(LEFT_BANK + 220, RIGHT_BANK - 220);
        w.x = w.baseX;
      }
    }
    for (const l of state.logs) l.angle += l.spin * dt;
    for (const f of state.fog) {
      f.y += current * 0.4 * dt;
      if (f.y > VIEW_H + 140) {
        f.y = -120;
        f.x = random.range(LEFT_BANK + 260, RIGHT_BANK - 260);
      }
    }
    for (const j of state.jams) {
      j.y += current * 0.5 * dt;
      if (j.y > VIEW_H + 40) {
        j.y = -30;
        j.gapX = random.range(LEFT_BANK + 300, RIGHT_BANK - 300);
        // Rebuild the row around the new gap.
        const logs = [];
        for (let x = LEFT_BANK + 60; x < RIGHT_BANK - 40; x += 54) {
          if (Math.abs(x - j.gapX) < j.gapW / 2 + 20) continue;
          logs.push({ x, angle: random.range(-0.08, 0.08), spin: random.range(-0.05, 0.05), grazeAt: -99 });
        }
        j.logs = logs;
      }
      for (const l of j.logs) l.angle += l.spin * dt;
    }
    // The Lantern Magnet boon pulls nearby lanterns toward the ferry.
    if (state.boons.magnet) {
      for (const f of state.floats) {
        if (f.taken) continue;
        const dx = ferry.x - f.x;
        const dy = ferry.y - f.y;
        const d = Math.hypot(dx, dy);
        if (d > 1 && d < 120) {
          f.x += (dx / d) * 60 * dt;
          f.y += (dy / d) * 60 * dt;
        }
      }
    }

    // Boarding: sail to the west dock and the nearest waiting passenger
    // climbs on. The ferry starts away from the dock so the choice is real.
    if (state.passenger === 'waiting' && ferry.x < LEFT_BANK + 80 && ferry.y > DOCK_Y - 16 && ferry.y < DOCK_Y + 104) {
      let bestP = null;
      let bestD = Infinity;
      for (const p of state.waiting) {
        const d = Math.abs(p.y - ferry.y);
        if (d < bestD) {
          bestD = d;
          bestP = p;
        }
      }
      if (bestP) {
        state.aboard = bestP;
        state.passenger = 'aboard';
        state.quota = quotaFor(bestP, table.quota);
        burst(ferry.x, ferry.y - 20, '#ffd98a', 10, 70);
        events.push('board');
      }
    }

    // Lanterns: touch one and it is yours. The combo multiplies the points;
    // a golden lantern counts double toward the quota.
    for (const f of state.floats) {
      if (f.taken) continue;
      const d = Math.hypot(f.x - ferry.x, f.y - ferry.y);
      if (d < FERRY_RADIUS + 16) {
        f.taken = true;
        const kind = f.golden ? 'golden' : (f.bright ? 'bright' : 'lantern');
        const base = f.golden ? GOLDEN_SCORE : (f.bright ? BRIGHT_SCORE : LANTERN_SCORE);
        const points = Math.round(scoreLantern(state.combo, kind, base, f.x, f.y) * diff.mult);
        state.score += points;
        state.lanterns += f.golden ? 2 : 1;
        burst(f.x, f.y, f.golden ? '#ffe9a8' : (f.bright ? '#ffe9a8' : '#ffb347'), f.bright || f.golden ? 16 : 10, 90);
        events.push(kind === 'lantern' ? 'pickup' : kind);
      }
    }

    // Hitting rock, log or a whirlpool's heart costs hull — unless just hit.
    // A hit breaks the combo, and ruins the courier's parcel if one is aboard.
    // Second Wind saves the ferry once from a sinking hit.
    function hazardHit(x, y, r) {
      if (ferry.invuln > 0) return false;
      const d = Math.hypot(x - ferry.x, y - ferry.y);
      if (d >= r + FERRY_RADIUS - 4) return false;
      state.hull -= 1;
      ferry.invuln = 1.6;
      state.shake = 14;
      const dx = ferry.x - x;
      const dy = ferry.y - y;
      const dd = Math.hypot(dx, dy) || 1;
      ferry.vx = (dx / dd) * 260;
      ferry.vy = (dy / dd) * 260;
      burst(ferry.x, ferry.y, '#9fd8e8', 18, 160);
      breakCombo(state.combo, ferry.x, ferry.y);
      if (state.aboard && state.aboard.key === 'courier') state.parcelRuined = true;
      events.push('hit');
      if (state.hull <= 0) {
        if (state.boons.wind && !state.windUsed) {
          state.windUsed = true;
          state.hull = 1;
          ferry.invuln = 2.5;
          events.push('wind');
        } else {
          state.lost = true;
          events.push('lose');
        }
      }
      return true;
    }
    for (const r of state.rocks) hazardHit(r.x, r.y, r.r);
    for (const l of state.logs) hazardHit(l.x, l.y, l.r);
    for (const w of state.whirls) hazardHit(w.x, w.y, w.r * 0.55);
    for (const j of state.jams) {
      for (const l of j.logs) hazardHit(l.x, j.y, 12);
    }

    // Grazes: passing close to a hazard without touching it pays the
    // combo-multiplied graze, at most once per hazard every 2 seconds.
    function hazardGraze(x, y, r, hazard) {
      if (ferry.invuln > 0) return;
      const d = Math.hypot(x - ferry.x, y - ferry.y);
      if (d < r + FERRY_RADIUS - 4) return; // overlapping: a hit, not a graze
      if (d >= r + FERRY_RADIUS + GRAZE_MARGIN) return;
      if (state.time - hazard.grazeAt < GRAZE_COOLDOWN) return;
      hazard.grazeAt = state.time;
      const points = Math.round(scoreGraze(state.combo, GRAZE_SCORE, x, y) * diff.mult);
      state.score += points;
      events.push('graze');
    }
    for (const r of state.rocks) hazardGraze(r.x, r.y, r.r, r);
    for (const l of state.logs) hazardGraze(l.x, l.y, l.r, l);
    for (const w of state.whirls) hazardGraze(w.x, w.y, w.r * 0.55, w);
    for (const j of state.jams) {
      for (const l of j.logs) hazardGraze(l.x, j.y, 12, l);
    }

    // Delivery: reach the east dock with a passenger and a lit quota.
    // The delivery pays the passenger's price (or the ruined-parcel price),
    // a time bonus, and the live combo — all times the difficulty multiplier.
    if (!state.lost && state.passenger === 'aboard' && ferry.x > RIGHT_BANK - 80) {
      if (state.lanterns >= state.quota) {
        const timeBonus = Math.max(0, Math.round(45 - state.time)) * 2;
        const pay = deliveryPay(state.aboard, state.parcelRuined);
        const points = Math.round((pay + timeBonus + state.combo.streak * 10) * diff.mult);
        state.score += points;
        state.passenger = 'delivered';
        state.combo.popups.push({ x: ferry.x, y: ferry.y - 30, text: `DELIVERED +${points}`, color: '#ffd98a', life: 1.6, max: 1.6 });
        state.combo.streak = 0;
        burst(ferry.x, ferry.y - 20, '#ffd98a', 26, 130);
        events.push('deliver');
        if (state.crossing >= CROSSINGS) {
          state.score += Math.round(WIN_BONUS * diff.mult);
          state.won = true;
          events.push('win');
        } else {
          state.boonOffer = drawBoons(random, state.boons.taken);
          state.awaitingBoon = true;
          events.push('boon');
        }
      }
    }

    // Particles fade.
    for (const p of state.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.life -= dt;
    }
    state.particles = state.particles.filter((p) => p.life > 0);
    return events;
  }

  return { state, reset, startCrossing, chooseBoon, update, loadFactor, comboMult: () => comboMult(state.combo) };
}
