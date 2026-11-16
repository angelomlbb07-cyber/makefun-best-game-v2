// DUSKFERRY v2 — the renderer: one canvas, procedural art, no image files.
// Palette shifts with the crossing: dusk deepens into night, the fifth
// crossing breaks into dawn. Screens are drawn over the live river.

import {
  CROSSINGS,
  DIFFICULTIES,
  DOCK_Y,
  FOAM,
  GOLD,
  GOLD_SOFT,
  HULL_RED,
  LEFT_BANK,
  MAX_HULL,
  PALETTES,
  RIGHT_BANK,
  VIEW_H,
  VIEW_W,
} from './config.js';
import { createRandom } from './random.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_BOON = 'boon';
export const SCREEN_OVER = 'over';

const ROMAN = ['I', 'II', 'III', 'IV', 'V'];

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  const rng = createRandom(20261116);
  const stars = [];
  for (let i = 0; i < 90; i += 1) {
    stars.push({ x: rng.range(0, VIEW_W), y: rng.range(0, 320), r: rng.range(0.6, 2), tw: rng.range(0, Math.PI * 2) });
  }
  const streaks = [];
  for (let i = 0; i < 46; i += 1) {
    streaks.push({ x: rng.range(LEFT_BANK + 30, RIGHT_BANK - 30), y: rng.range(0, VIEW_H), len: rng.range(30, 110), sp: rng.range(0.7, 1.4) });
  }
  const reeds = [];
  for (let i = 0; i < 26; i += 1) {
    reeds.push({ x: rng.range(8, LEFT_BANK - 12), y: rng.range(60, VIEW_H - 40), h: rng.range(24, 64), lean: rng.range(-8, 8) });
  }
  for (let i = 0; i < 26; i += 1) {
    reeds.push({ x: rng.range(RIGHT_BANK + 12, VIEW_W - 8), y: rng.range(60, VIEW_H - 40), h: rng.range(24, 64), lean: rng.range(-8, 8) });
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function glow(x, y, radius, color, alpha) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
    g.addColorStop(0, color);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = alpha;
    ctx.fillStyle = g;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    ctx.globalAlpha = 1;
  }

  function wrapLines(text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let line = '';
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = w;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  function drawSky(palette, time, dawn) {
    const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
    g.addColorStop(0, palette.skyTop);
    g.addColorStop(0.55, palette.sky);
    g.addColorStop(1, palette.waterDeep);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    if (!dawn) {
      for (const s of stars) {
        ctx.globalAlpha = 0.35 + 0.4 * Math.abs(Math.sin(time * 0.7 + s.tw));
        ctx.fillStyle = '#dfe8ff';
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      glow(1080, 110, 130, '#e8ecff', 0.5);
      ctx.fillStyle = '#f2f4ff';
      ctx.beginPath();
      ctx.arc(1080, 110, 34, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#d5dcf5';
      ctx.beginPath();
      ctx.arc(1068, 102, 8, 0, Math.PI * 2);
      ctx.arc(1090, 120, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Golden dawn light on the water: the sun over the far bank, a warm wash
  // from the top, and the sun's reflection shimmering down the river.
  function drawDawnLight(time) {
    glow(1140, 210, 300, '#ffcf7a', 0.85);
    ctx.fillStyle = '#ffe9a8';
    ctx.beginPath();
    ctx.arc(1140, 210, 64, 0, Math.PI * 2);
    ctx.fill();
    const wash = ctx.createLinearGradient(0, 0, 0, 520);
    wash.addColorStop(0, 'rgba(255,176,92,0.22)');
    wash.addColorStop(1, 'rgba(255,176,92,0)');
    ctx.fillStyle = wash;
    ctx.fillRect(LEFT_BANK, 0, RIGHT_BANK - LEFT_BANK, 520);
    ctx.fillStyle = 'rgba(255,205,120,0.35)';
    for (let i = 0; i < 12; i += 1) {
      const y = 300 + i * 38;
      const w = 60 + 70 * Math.abs(Math.sin(time * 0.9 + i * 1.7));
      const x = 1140 - w / 2 + Math.sin(time * 0.6 + i) * 8;
      ctx.globalAlpha = 0.28 - i * 0.015;
      ctx.fillRect(x, y, w, 5);
    }
    ctx.globalAlpha = 1;
  }

  function drawBanks(palette, state) {
    ctx.fillStyle = '#0a0d1f';
    ctx.fillRect(0, 0, LEFT_BANK, VIEW_H);
    ctx.fillRect(RIGHT_BANK, 0, VIEW_W - RIGHT_BANK, VIEW_H);
    ctx.fillStyle = '#10152e';
    ctx.fillRect(LEFT_BANK - 6, 0, 6, VIEW_H);
    ctx.fillRect(RIGHT_BANK, 0, 6, VIEW_H);
    ctx.strokeStyle = 'rgba(159,216,232,0.25)';
    ctx.lineWidth = 2;
    for (const r of reeds) {
      ctx.beginPath();
      ctx.moveTo(r.x, r.y);
      ctx.quadraticCurveTo(r.x + r.lean, r.y - r.h * 0.6, r.x + r.lean * 1.4, r.y - r.h);
      ctx.stroke();
    }
    // Docks: wooden piers with a lamp each.
    for (const [bx, lit] of [[LEFT_BANK, true], [RIGHT_BANK, false]]) {
      const x0 = bx === LEFT_BANK ? bx - 58 : bx;
      ctx.fillStyle = '#3a2c22';
      ctx.fillRect(x0, DOCK_Y - 16, 58, 120);
      ctx.fillStyle = '#4a382a';
      for (let i = 0; i < 4; i += 1) ctx.fillRect(x0, DOCK_Y - 16 + i * 30, 58, 3);
      ctx.fillStyle = '#2c2118';
      ctx.fillRect(x0 + 8, DOCK_Y - 52, 6, 40);
      if (lit) {
        glow(x0 + 11, DOCK_Y - 56, 42, GOLD, 0.85);
        ctx.fillStyle = GOLD;
        ctx.beginPath();
        ctx.arc(x0 + 11, DOCK_Y - 56, 7, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // The three waiting passengers stand on the west dock, each in their
    // own colour, name beneath. Sail to one to board them.
    if (state.passenger === 'waiting') {
      for (const p of state.waiting) {
        const x = LEFT_BANK - 29;
        ctx.fillStyle = p.color;
        roundRect(x - 9, p.y - 16, 18, 22, 6);
        ctx.fill();
        ctx.fillStyle = '#e8dcc8';
        ctx.beginPath();
        ctx.arc(x, p.y - 20, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = p.color;
        ctx.font = '700 12px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.name.split(' ').pop(), x, p.y + 14);
      }
      ctx.textAlign = 'left';
    }
  }

  function drawRiver(palette, state, time) {
    const g = ctx.createLinearGradient(LEFT_BANK, 0, RIGHT_BANK, 0);
    g.addColorStop(0, palette.water);
    g.addColorStop(0.5, palette.waterDeep);
    g.addColorStop(1, palette.water);
    ctx.fillStyle = g;
    ctx.fillRect(LEFT_BANK, 0, RIGHT_BANK - LEFT_BANK, VIEW_H);
    const table = state.crossing;
    ctx.strokeStyle = 'rgba(159,216,232,0.20)';
    ctx.lineWidth = 2;
    for (const s of streaks) {
      const y = (s.y + time * (24 + table * 9) * s.sp) % (VIEW_H + 120) - 60;
      ctx.beginPath();
      ctx.moveTo(s.x, y);
      ctx.lineTo(s.x, y + s.len);
      ctx.stroke();
    }
    // Far dock lamp: dark until the crossing's lantern quota is lit.
    const lit = state.lanterns >= state.quota && state.passenger === 'aboard';
    const dockX = RIGHT_BANK + 11;
    if (lit || state.passenger === 'delivered') {
      glow(dockX, DOCK_Y - 56, 56, GOLD, 0.9);
      ctx.fillStyle = GOLD;
    } else {
      ctx.fillStyle = '#5a5346';
    }
    ctx.beginPath();
    ctx.arc(dockX, DOCK_Y - 56, 7, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawFerry(state, time) {
    const f = state.ferry;
    const blink = f.invuln > 0 && Math.floor(time * 12) % 2 === 0;
    ctx.save();
    ctx.translate(f.x, f.y);
    if (state.shake > 0) ctx.translate((Math.random() - 0.5) * state.shake, (Math.random() - 0.5) * state.shake);
    ctx.rotate(Math.max(-0.18, Math.min(0.18, f.vy * 0.0006)));
    if (blink) ctx.globalAlpha = 0.35;
    // Wake.
    ctx.strokeStyle = 'rgba(159,216,232,0.35)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-26, 10);
    ctx.quadraticCurveTo(-44, 16, -58, 10);
    ctx.moveTo(-26, -6);
    ctx.quadraticCurveTo(-44, -12, -58, -6);
    ctx.stroke();
    // Hull.
    ctx.fillStyle = '#5b3a2e';
    ctx.beginPath();
    ctx.moveTo(-30, -8);
    ctx.lineTo(26, -8);
    ctx.quadraticCurveTo(36, 0, 26, 10);
    ctx.lineTo(-26, 10);
    ctx.quadraticCurveTo(-34, 0, -30, -8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = HULL_RED;
    ctx.fillRect(-28, -8, 54, 5);
    // The load: a tiny lantern dot on the deck for every two lanterns aboard.
    const loadDots = Math.min(4, Math.floor(state.lanterns / 2));
    for (let i = 0; i < loadDots; i += 1) {
      ctx.fillStyle = GOLD;
      ctx.beginPath();
      ctx.arc(-18 + i * 10, -12, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    // Cabin and lamp.
    ctx.fillStyle = '#2e2118';
    roundRect(-12, -22, 26, 16, 4);
    ctx.fill();
    glow(4, -26, 34, GOLD, 0.9);
    ctx.fillStyle = GOLD;
    ctx.beginPath();
    ctx.arc(4, -26, 5, 0, Math.PI * 2);
    ctx.fill();
    // Passenger aboard: a small hooded figure by the lamp, in their colour.
    if (state.passenger === 'aboard' && state.aboard) {
      ctx.fillStyle = '#e8dcc8';
      ctx.beginPath();
      ctx.arc(-6, -14, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = state.aboard.color;
      ctx.fillRect(-10, -10, 9, 8);
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  function drawLog(x, y, angle) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = '#4a3524';
    roundRect(-26, -6, 52, 12, 6);
    ctx.fill();
    ctx.fillStyle = '#5d4630';
    ctx.fillRect(-26, -6, 52, 4);
    ctx.restore();
  }

  function drawHazards(state, time) {
    for (const r of state.rocks) {
      ctx.fillStyle = '#1c2438';
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#2c3854';
      ctx.beginPath();
      ctx.arc(r.x - r.r * 0.25, r.y - r.r * 0.3, r.r * 0.55, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(159,216,232,0.35)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(r.x, r.y + r.r * 0.4, r.r * 0.9, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
    }
    for (const l of state.logs) drawLog(l.x, l.y, l.angle);
    for (const j of state.jams) {
      for (const l of j.logs) drawLog(l.x, j.y, l.angle);
      // The gap: a faint gold shimmer where the jam can be passed.
      ctx.fillStyle = 'rgba(255,179,71,0.20)';
      ctx.fillRect(j.gapX - j.gapW / 2, j.y - 10, j.gapW, 20);
    }
    for (const w of state.whirls) {
      const pulse = 1 + 0.12 * Math.sin(time * 2 + w.phase);
      ctx.strokeStyle = 'rgba(159,216,232,0.55)';
      ctx.lineWidth = 3;
      for (let k = 0; k < 3; k += 1) {
        const rr = w.r * pulse * (0.45 + k * 0.28);
        ctx.beginPath();
        ctx.arc(w.x, w.y, rr, time * 1.5 + k, time * 1.5 + k + Math.PI * 1.3);
        ctx.stroke();
      }
      ctx.fillStyle = '#04101f';
      ctx.beginPath();
      ctx.arc(w.x, w.y, w.r * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Fog banks drift over the river and dim whatever is under them — but
  // lanterns (drawn after the fog) still shine through.
  function drawFog(state) {
    for (const f of state.fog) {
      ctx.fillStyle = 'rgba(198,208,232,0.30)';
      ctx.beginPath();
      ctx.ellipse(f.x, f.y, f.rx, f.ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(198,208,232,0.22)';
      ctx.beginPath();
      ctx.ellipse(f.x - f.rx * 0.4, f.y + f.ry * 0.3, f.rx * 0.6, f.ry * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawFloats(state, time) {
    for (const f of state.floats) {
      if (f.taken) continue;
      const bobY = f.y + Math.sin(time * 1.4 + f.bob) * 5;
      if (f.golden) {
        glow(f.x, bobY, 56, '#ffe9a8', 0.9);
        ctx.fillStyle = '#ffe9a8';
        ctx.beginPath();
        ctx.arc(f.x, bobY, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = GOLD;
        ctx.font = '700 16px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('✦', f.x, bobY - 20);
      } else {
        const col = f.bright ? '#ffe9a8' : GOLD;
        glow(f.x, bobY, f.bright ? 46 : 32, col, 0.75);
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(f.x, bobY, f.bright ? 9 : 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.beginPath();
        ctx.arc(f.x, bobY + 2, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    for (const p of state.particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawPopups(state) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '800 19px system-ui, sans-serif';
    for (const p of state.combo.popups) {
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life / p.max));
      ctx.fillStyle = p.color;
      ctx.fillText(p.text, p.x, p.y);
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';
  }

  function drawMist(palette, time) {
    if (palette.mist <= 0) return;
    ctx.fillStyle = `rgba(190,205,235,${palette.mist * 0.28})`;
    for (let i = 0; i < 3; i += 1) {
      const y = 150 + i * 230 + Math.sin(time * 0.3 + i * 2) * 20;
      const x = ((time * (12 + i * 7)) % 500) - 250;
      ctx.beginPath();
      ctx.ellipse(320 + x, y, 420, 16, 0, 0, Math.PI * 2);
      ctx.ellipse(900 - x, y + 90, 460, 19, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function lanternIcon(x, y, lit, scale = 1) {
    if (lit) glow(x, y, 22 * scale, GOLD, 0.8);
    ctx.fillStyle = lit ? GOLD : '#4a4438';
    ctx.beginPath();
    ctx.arc(x, y, 7 * scale, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawHud(state, best, muted) {
    const diff = DIFFICULTIES[state.difficulty] || DIFFICULTIES[1];
    const loadPct = Math.round(Math.min(0.04 * state.lanterns, 0.32) * 100);
    ctx.fillStyle = 'rgba(5,8,20,0.55)';
    roundRect(12, 12, 500, 78, 10);
    ctx.fill();
    roundRect(VIEW_W - 262, 12, 250, 78, 10);
    ctx.fill();
    ctx.textBaseline = 'middle';
    // Lantern quota + score.
    for (let i = 0; i < state.quota; i += 1) {
      lanternIcon(38 + i * 26, 36, i < state.lanterns);
    }
    ctx.fillStyle = '#e8e4d8';
    ctx.font = '700 22px system-ui, sans-serif';
    ctx.textAlign = 'left';
    const quotaEnd = 38 + state.quota * 26;
    ctx.fillText(`${state.lanterns}/${state.quota}`, quotaEnd + 8, 36);
    ctx.fillText(`Score ${state.score}`, quotaEnd + 78, 36);
    // Combo + load, second line.
    let lx = 38;
    ctx.font = '700 17px system-ui, sans-serif';
    if (state.combo.streak >= 2) {
      ctx.fillStyle = GOLD_SOFT;
      const t = `COMBO ×${Math.min(state.combo.streak, 5)}`;
      ctx.fillText(t, lx, 68);
      lx += ctx.measureText(t).width + 18;
    }
    if (state.lanterns > 0) {
      ctx.fillStyle = '#b9c2d8';
      const t = `Load −${loadPct}%`;
      ctx.fillText(t, lx, 68);
      lx += ctx.measureText(t).width + 18;
    }
    if (state.parcelRuined) {
      ctx.fillStyle = '#ff8a7a';
      ctx.fillText('Parcel ruined', lx, 68);
    }
    // Crossing + passenger, centred between the panels.
    ctx.textAlign = 'center';
    ctx.font = '700 20px system-ui, sans-serif';
    ctx.fillStyle = GOLD_SOFT;
    ctx.fillText(`Crossing ${ROMAN[state.crossing - 1]} of ${ROMAN[CROSSINGS - 1]}`, VIEW_W / 2, 36);
    ctx.fillStyle = '#e8e4d8';
    ctx.font = '600 17px system-ui, sans-serif';
    const pass = state.passenger === 'waiting'
      ? 'Sail to a passenger on the west dock'
      : state.passenger === 'aboard' && state.aboard
        ? state.aboard.short
        : 'Delivered';
    ctx.fillText(pass, VIEW_W / 2, 68);
    // Hull hearts + best + difficulty.
    ctx.textAlign = 'right';
    ctx.font = '700 22px system-ui, sans-serif';
    ctx.fillStyle = '#ff8a7a';
    ctx.fillText('♥'.repeat(Math.max(0, state.hull)) + '♡'.repeat(Math.max(0, MAX_HULL - state.hull)), VIEW_W - 30, 36);
    ctx.fillStyle = '#b9c2d8';
    ctx.font = '600 16px system-ui, sans-serif';
    ctx.fillText(`Best ${best}  ·  ${diff.name} ×${diff.mult}${muted ? '  ·  Muted (M)' : ''}`, VIEW_W - 30, 68);
    ctx.textAlign = 'left';
  }

  function panel(title, lines, accent) {
    ctx.fillStyle = 'rgba(5,8,20,0.72)';
    roundRect(VIEW_W / 2 - 330, 190, 660, 420, 18);
    ctx.fill();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    roundRect(VIEW_W / 2 - 330, 190, 660, 420, 18);
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.fillStyle = accent;
    ctx.font = '800 54px system-ui, sans-serif';
    ctx.fillText(title, VIEW_W / 2, 268);
    ctx.fillStyle = '#e8e4d8';
    ctx.font = '400 21px system-ui, sans-serif';
    lines.forEach((line, i) => {
      ctx.fillText(line, VIEW_W / 2, 330 + i * 34);
    });
  }

  // Three choice cards in a row (difficulty on the title, boons between
  // crossings). `cards` is [{key, icon, name, sub, desc, accent}];
  // `selected` is the highlighted index (-1 for none). Cards with an icon
  // use the compact layout so two description lines stay inside the card.
  function drawCards(cards, y, selected) {
    const w = 260;
    const h = 150;
    const gap = 20;
    const total = cards.length * w + (cards.length - 1) * gap;
    let x = (VIEW_W - total) / 2;
    for (let i = 0; i < cards.length; i += 1) {
      const c = cards[i];
      const hot = i === selected;
      ctx.fillStyle = hot ? 'rgba(255,179,71,0.16)' : 'rgba(5,8,20,0.72)';
      roundRect(x, y, w, h, 14);
      ctx.fill();
      ctx.strokeStyle = hot ? GOLD : (c.accent || 'rgba(185,194,216,0.5)');
      ctx.lineWidth = hot ? 3 : 2;
      roundRect(x, y, w, h, 14);
      ctx.stroke();
      ctx.textAlign = 'center';
      ctx.fillStyle = '#b9c2d8';
      ctx.font = '700 18px system-ui, sans-serif';
      ctx.fillText(c.key, x + w / 2, y + (c.icon ? 24 : 28));
      if (c.icon) {
        ctx.fillStyle = c.accent || GOLD_SOFT;
        ctx.font = '700 30px system-ui, sans-serif';
        ctx.fillText(c.icon, x + w / 2, y + 56);
        ctx.fillStyle = '#ffffff';
        ctx.font = '800 23px system-ui, sans-serif';
        ctx.fillText(c.name, x + w / 2, y + 92);
        if (c.desc) {
          ctx.fillStyle = '#e8e4d8';
          ctx.font = '400 15px system-ui, sans-serif';
          const lines = wrapLines(c.desc, w - 28);
          lines.forEach((line, li) => {
            ctx.fillText(line, x + w / 2, y + 118 + li * 19);
          });
        }
      } else {
        ctx.fillStyle = '#ffffff';
        ctx.font = '800 26px system-ui, sans-serif';
        ctx.fillText(c.name, x + w / 2, y + 72);
        if (c.sub) {
          ctx.fillStyle = GOLD_SOFT;
          ctx.font = '700 17px system-ui, sans-serif';
          ctx.fillText(c.sub, x + w / 2, y + 102);
        }
        if (c.desc) {
          ctx.fillStyle = '#e8e4d8';
          ctx.font = '400 15px system-ui, sans-serif';
          const lines = wrapLines(c.desc, w - 28);
          lines.forEach((line, li) => {
            ctx.fillText(line, x + w / 2, y + 128 + li * 19);
          });
        }
      }
      x += w + gap;
    }
    ctx.textAlign = 'left';
  }

  function draw(screen, state, best, time, muted, result, ui) {
    const palette = PALETTES[Math.min(state.crossing, CROSSINGS) - 1];
    const dawn = state.won || (screen === SCREEN_OVER && result === 'win');
    drawSky(palette, time, dawn);
    drawRiver(palette, state, time);
    if (dawn) drawDawnLight(time);
    drawBanks(palette, state);
    drawHazards(state, time);
    drawFog(state);
    drawFloats(state, time);
    drawFerry(state, time);
    drawPopups(state);
    drawMist(palette, time);

    if (screen === SCREEN_PLAY || screen === SCREEN_PAUSED || screen === SCREEN_BOON) {
      drawHud(state, best, muted);
      if (screen === SCREEN_BOON) {
        ctx.fillStyle = 'rgba(5,8,20,0.45)';
        ctx.fillRect(0, 0, VIEW_W, VIEW_H);
        ctx.textAlign = 'center';
        ctx.fillStyle = GOLD;
        ctx.font = '800 52px system-ui, sans-serif';
        ctx.fillText('CHOOSE A BOON', VIEW_W / 2, 200);
        ctx.fillStyle = '#e8e4d8';
        ctx.font = '400 21px system-ui, sans-serif';
        ctx.fillText('The crossing is done. Take one gift before the next.', VIEW_W / 2, 246);
        const offer = (ui && ui.boonOffer) || state.boonOffer || [];
        drawCards(offer.map((b, i) => ({
          key: `${i + 1}`,
          icon: b.icon,
          name: b.name,
          sub: '',
          desc: b.desc,
          accent: GOLD_SOFT,
        })), 300, -1);
        // drawCards leaves textAlign at 'left'; the line below is centred.
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.font = '700 22px system-ui, sans-serif';
        ctx.fillText(Math.floor(time * 1.4) % 2 === 0 ? 'Press 1, 2 or 3 — or click a card' : ' ', VIEW_W / 2, 520);
        ctx.textAlign = 'left';
        return;
      }
      if (state.crossing === 1 && state.time < 9 && state.passenger === 'waiting') {
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(232,228,216,0.9)';
        ctx.font = '600 20px system-ui, sans-serif';
        ctx.fillText('Steer with Arrow keys / WASD — or hold the mouse — and mind the current', VIEW_W / 2, VIEW_H - 28);
      }
      if (screen === SCREEN_PAUSED) {
        panel('PAUSED', ['The river waits.', 'Press P or Enter to keep sailing.'], GOLD_SOFT);
      }
      return;
    }
    if (screen === SCREEN_TITLE) {
      ctx.fillStyle = 'rgba(5,8,20,0.45)';
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      ctx.textAlign = 'center';
      ctx.fillStyle = GOLD;
      ctx.font = '800 80px system-ui, sans-serif';
      ctx.fillText('DUSKFERRY', VIEW_W / 2, 170);
      ctx.fillStyle = '#e8e4d8';
      ctx.font = '400 26px system-ui, sans-serif';
      ctx.fillText('The last ferry across the Blackwater.', VIEW_W / 2, 216);
      ctx.font = '400 21px system-ui, sans-serif';
      ctx.fillText('Pick up each passenger, light the far dock with drifting lanterns,', VIEW_W / 2, 252);
      ctx.fillText('dodge rocks, logs and whirlpools — and make five crossings before dawn.', VIEW_W / 2, 284);
      ctx.fillStyle = GOLD_SOFT;
      ctx.font = '700 22px system-ui, sans-serif';
      ctx.fillText('Choose how wild the river is:', VIEW_W / 2, 330);
      const sel = ui && Number.isInteger(ui.difficulty) ? ui.difficulty : 1;
      drawCards(DIFFICULTIES.map((d, i) => ({
        key: `${i + 1}`,
        icon: null,
        name: d.name,
        sub: `Score ×${d.mult}`,
        desc: d.blurb,
        accent: GOLD_SOFT,
      })), 352, sel);
      // drawCards leaves textAlign at 'left'; the lines below are centred.
      ctx.textAlign = 'center';
      ctx.fillStyle = GOLD_SOFT;
      ctx.font = '700 22px system-ui, sans-serif';
      ctx.fillText('Arrows / WASD or hold the mouse to steer  ·  P pause  ·  M sound', VIEW_W / 2, 552);
      ctx.fillStyle = '#ffffff';
      ctx.font = '800 26px system-ui, sans-serif';
      ctx.fillText(Math.floor(time * 1.4) % 2 === 0 ? 'Press 1, 2 or 3 to choose, Enter to sail — or click a card' : ' ', VIEW_W / 2, 596);
      ctx.fillStyle = '#b9c2d8';
      ctx.font = '400 18px system-ui, sans-serif';
      ctx.fillText(`Best score ${best}`, VIEW_W / 2, 640);
      ctx.textAlign = 'left';
      return;
    }
    // Game over: win or loss.
    const diff = DIFFICULTIES[state.difficulty] || DIFFICULTIES[1];
    if (result === 'win') {
      const boonCount = state.boons ? state.boons.taken.size : 0;
      panel('DAWN BREAKS', [
        'Five crossings. Every passenger home.',
        `Score ${state.score}   ·   Best ${best}`,
        `${diff.name} river   ·   ${boonCount} boon${boonCount === 1 ? '' : 's'} taken`,
        'The Blackwater is gold again.',
        'Press Enter or R to sail again.',
      ], GOLD);
    } else {
      panel('THE FERRY IS LOST', [
        'The river keeps its lanterns tonight.',
        `Score ${state.score}   ·   Best ${best}`,
        `Crossing ${ROMAN[state.crossing - 1]}   ·   ${diff.name} river`,
        'Press Enter or R to try the crossing again.',
      ], '#ff8a7a');
    }
  }

  return { draw };
}
