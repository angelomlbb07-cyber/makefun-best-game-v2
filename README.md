[![best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01)
[![rank](https://make.fun/badge/best-game-01/angelomlbb07-cyber/makefun-best-game-v2/rank.svg)](https://make.fun/bounty/best-game-01)
[![reward](https://make.fun/badge/best-game-01/angelomlbb07-cyber/makefun-best-game-v2/reward.svg)](https://make.fun/bounty/best-game-01)

# DUSKFERRY v2 — the last ferry across the Blackwater

An original arcade river-crossing game for make.fun's **best-game-01** bounty
("Make the best game", $1,000). Steer the last ferry across a dark river:
pick up each passenger at the west dock, light the far dock with drifting
lanterns, dodge rocks, logs and whirlpools — and make five crossings before
dawn breaks. This is v2 of the entry: the same river, but a deeper loop —
a difficulty select, a passenger choice every crossing, a combo and graze
scoring system, a lantern load that slows the ferry, a new mechanic on each
crossing, and a boon to choose between crossings.

## How to play

- **Choose a difficulty first** (keys 1/2/3 or click a card): **Calm**
  (score ×1), **Swift** (score ×1.5) or **Storm** (score ×2, stronger
  current and more hazards)
- **Arrows / WASD** or **hold the mouse** to steer (the river current pushes
  you downstream, and it gets stronger every crossing)
- **Board a passenger**: three wait on the west dock — sail to one. Elder
  Maren pays 200 and needs the full quota; Courier Pip pays 150 but a hit
  ruins the parcel (pays 40); Lantern-keeper Wren pays 100 but every
  lantern counts double toward the quota
- **Lanterns**: collect drifting lanterns for score — bright ones are worth
  more, golden ones (last crossing) are worth double and count double.
  Every lantern aboard weighs the ferry down (slower, heavier)
- **Combos**: lanterns in a row without a hit multiply the points (up to
  ×5); a bright lantern chained onto a live combo pays a ×1.5 chain bonus;
  passing close to a hazard without touching it pays a graze. A hit resets
  the combo
- **One new mechanic per crossing**: fog banks that hide hazards (II),
  whirlpools that wander across the river (III), log jams with a single
  gap (IV), golden lanterns at the strongest current (V)
- **Boons**: after each delivery but the last, pick 1 of 3 — Sturdy Hull,
  Lantern Magnet, Swift Keel, Bright Eyes, Calm Water, Second Wind
- 3 hull to start (up to 5 with boons): rocks, logs and whirlpool hearts
  cost one each
- 5 crossings wins (dawn breaks); lose all hull and the ferry is lost
- **P** pause, **M** sound on/off, **R / Enter** restart
- Synthesised WebAudio sound, no audio files; procedural canvas art, no
  image assets; seeded river layouts (`?seed=N`)

## Play it

```sh
node serve.ts        # then open http://localhost:8080
```

## Layout

- `main.ts` — the entrypoint: copies `game/` and `screenshots/` to `/output`
  and writes `dossier.json` with the vendored make.fun library
- `game/index.html` + `game/src/` — the game, split by job: `config.js`
  (tuning, palettes, difficulties, passengers, boons), `random.js` (seeded
  RNG), `input.js` (keyboard/mouse, digit choices), `audio.js` (synthesised
  sound), `passengers.js` (the three waiting passengers and their rules),
  `combos.js` (combo, chain and graze scoring, popups), `boons.js` (the
  pick-one-of-three reward), `world.js` (physics, hazards, crossings,
  fog, jams, golden lanterns), `render.js` (procedural art, HUD, screens,
  choice cards), `shots.js` (staged screenshots), `main.js` (loop and
  screens)
- `screenshots/` — 4 real renders: title (difficulty select), mid-play
  (fog, combo, courier aboard), boon choice, dawn (win)
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged
- `serve.ts` — tiny static server for local play-testing

## Build the dossier

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

MIT licensed.
