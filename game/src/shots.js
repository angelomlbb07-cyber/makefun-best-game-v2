// Staged scenes for screenshots: ?shot=start|play|boon|dawn&seed=N paints one
// fixed moment and sets window.__shotReady. The game itself never uses these.

import { BOONS } from './config.js';
import { SCREEN_BOON, SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { DOCK_Y, RIGHT_BANK } from './config.js';

export function stageShot(name, world) {
  const s = world.state;
  if (name === 'start') {
    world.reset(1); // Swift, the middle card, highlighted.
    s.time = 6;
    return { screen: SCREEN_TITLE, best: 1230, ui: { difficulty: 1 } };
  }
  if (name === 'play') {
    world.reset(1);
    world.startCrossing(2); // Crossing II: fog banks, and a live combo.
    const courier = s.waiting.find((p) => p.key === 'courier') || s.waiting[0];
    s.aboard = courier;
    s.passenger = 'aboard';
    s.lanterns = 4;
    s.score = 560;
    s.hull = 3;
    s.time = 24;
    s.ferry.x = 640;
    s.ferry.y = 380;
    s.ferry.vx = 90;
    s.ferry.vy = 40;
    s.combo.streak = 3;
    s.combo.popups.push({ x: 640, y: 340, text: 'GRAZE +15', color: '#9fd8e8', life: 1.0, max: 1.2 });
    // A few lanterns already collected so the HUD reads mid-crossing.
    s.floats[0].taken = true;
    s.floats[1].taken = true;
    s.floats[2].taken = true;
    s.floats[3].taken = true;
    return { screen: SCREEN_PLAY, best: 1230, ui: {} };
  }
  if (name === 'boon') {
    world.reset(1);
    world.startCrossing(1);
    s.passenger = 'delivered';
    s.lanterns = 3;
    s.score = 480;
    s.hull = 3;
    s.time = 28;
    s.ferry.x = RIGHT_BANK - 110;
    s.ferry.y = DOCK_Y;
    s.awaitingBoon = true;
    s.boonOffer = [BOONS[0], BOONS[1], BOONS[2]]; // Hull, Magnet, Keel.
    return { screen: SCREEN_BOON, best: 1230, ui: { boonOffer: s.boonOffer } };
  }
  // dawn: the fifth crossing is done and the sun is up. A real win always
  // took four boons (one after each of the first four deliveries), so the
  // staged state marks four as taken.
  world.reset(1);
  world.startCrossing(5);
  s.boons.taken = new Set(['hull', 'magnet', 'keel', 'calm']);
  s.passenger = 'delivered';
  s.lanterns = 7;
  s.score = 1480;
  s.hull = 2;
  s.time = 31;
  s.ferry.x = RIGHT_BANK - 110;
  s.ferry.y = DOCK_Y;
  s.won = true;
  return { screen: SCREEN_OVER, best: 1480, result: 'win', ui: {} };
}
