// DUSKFERRY v2 — boot and the one loop: input is read every frame, the
// world advances in fixed 1/60 s steps, and the renderer paints what is
// there. The game moves between five screens: title (with a difficulty
// select), play, boon (pick one of three between crossings), paused and
// game over.
//
// ?seed=N fixes the river's layout. ?shot=start|play|boon|dawn (with &seed=N)
// stages that scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot.

import { BEST_KEY, STEP, VIEW_W } from './config.js';
import { createRandom } from './random.js';
import { createWorld } from './world.js';
import { ACTION_CONFIRM, ACTION_MUTE, ACTION_PAUSE, ACTION_RESTART, createInput } from './input.js';
import { createAudio } from './audio.js';
import { createRenderer, SCREEN_BOON, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { stageShot } from './shots.js';

const MAX_FRAME = 0.25;

// The three choice cards in a row (difficulty on the title, boons between
// crossings): 260 px wide, 20 px apart, centred.
function cardIndexAt(mx, my, y, count = 3) {
  if (my < y || my > y + 150) return -1;
  const w = 260;
  const gap = 20;
  const total = count * w + (count - 1) * gap;
  const x0 = (VIEW_W - total) / 2;
  for (let i = 0; i < count; i += 1) {
    const x = x0 + i * (w + gap);
    if (mx >= x && mx <= x + w) return i;
  }
  return -1;
}

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);
const audio = createAudio();

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best then lasts this visit only.
  }
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(scene.screen, world.state, scene.best, 6, false, scene.result, scene.ui);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let difficulty = 1; // Swift, the middle card, is the default.
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();

  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    world.reset(difficulty);
    accumulator = 0;
    screen = SCREEN_PLAY;
    audio.unlock();
    audio.click();
    announce('Playing. Sail to a passenger on the west dock, then carry them across.');
  }

  function endGame() {
    screen = SCREEN_OVER;
    if (world.state.score > best) {
      best = world.state.score;
      saveBest(best);
    }
    announce(world.state.won
      ? `Dawn breaks. Score ${world.state.score}. Best ${best}.`
      : `Game over. Score ${world.state.score}. Best ${best}.`);
  }

  function handleEvents(events) {
    for (const e of events) {
      if (e === 'pickup') audio.pickup(false);
      if (e === 'bright') audio.pickup(true);
      if (e === 'golden') audio.golden();
      if (e === 'board') audio.board();
      if (e === 'graze') audio.graze();
      if (e === 'hit') audio.splash();
      if (e === 'wind') audio.wind();
      if (e === 'deliver') audio.bell();
      if (e === 'win') audio.win();
      if (e === 'lose') audio.lose();
    }
    if (events.includes('boon')) {
      screen = SCREEN_BOON;
      audio.bell();
      announce('Crossing done. Choose a boon.');
    }
    if (events.includes('win') || events.includes('lose')) endGame();
  }

  function frame(now) {
    const elapsed = Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    const time = now / 1000;

    if (input.wasPressed(ACTION_MUTE)) {
      const muted = audio.toggleMute();
      announce(muted ? 'Sound off.' : 'Sound on.');
    }
    if (screen === SCREEN_TITLE) {
      // Digits pick a difficulty (highlight moves); Enter sails with it.
      // Clicking a card picks it and sails at once.
      if (input.choice >= 1 && input.choice <= 3) {
        difficulty = input.choice - 1;
        audio.select();
      } else if (input.wasPressed(ACTION_CONFIRM)) {
        const card = cardIndexAt(input.mouseX, input.mouseY, 352);
        if (card >= 0) difficulty = card;
        startGame();
      }
    } else if (screen === SCREEN_BOON) {
      // Digits or a click on a boon card take that boon and sail on.
      let pick = -1;
      if (input.choice >= 1 && input.choice <= 3) pick = input.choice - 1;
      else if (input.wasPressed(ACTION_CONFIRM)) pick = cardIndexAt(input.mouseX, input.mouseY, 300);
      if (pick >= 0 && world.state.boonOffer[pick]) {
        const line = world.chooseBoon(world.state.boonOffer[pick].key);
        audio.select();
        screen = SCREEN_PLAY;
        announce(line);
      }
    } else if (screen === SCREEN_OVER && (input.wasPressed(ACTION_CONFIRM) || input.wasPressed(ACTION_RESTART))) {
      startGame();
    } else if (screen === SCREEN_PLAY && input.wasPressed(ACTION_PAUSE)) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    } else if (screen === SCREEN_PAUSED && (input.wasPressed(ACTION_PAUSE) || input.wasPressed(ACTION_CONFIRM))) {
      screen = SCREEN_PLAY;
      announce('Playing.');
    }

    if (screen === SCREEN_PLAY) {
      accumulator += elapsed;
      while (accumulator >= STEP) {
        handleEvents(world.update(STEP, input));
        accumulator -= STEP;
        if (screen !== SCREEN_PLAY) break;
      }
    }
    const result = world.state.won ? 'win' : 'lose';
    renderer.draw(screen, world.state, best, time, audio.muted, result, {
      difficulty,
      boonOffer: world.state.boonOffer,
    });
    input.endFrame();
    requestAnimationFrame(frame);
  }

  announce('Duskferry. Choose a difficulty, then board.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
