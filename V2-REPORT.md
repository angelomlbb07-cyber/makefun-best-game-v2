# DUSKFERRY v2 — build report

## 0. Pre-flight feasibility (done before any game code)

**Gap:** judge 699,775 → 879,643 = **+179,868 (+25.7%)**, win rate 0.6998 → 0.8796.
Only the top 10 pay ($400/$200/$120/$40×7); #20 cutoff 849,123 is not enough.

**Where v1 loses.** The judge decides on the FIRST criterion where two entries
differ (RULES.txt). Criterion 1 (complete game) is already satisfied by v1 —
title, HUD, play, dawn win, game over, restart all shown. So the whole gap sits
on criterion 2 (fun & depth): "a core loop worth repeating, challenge that
grows as the player gets better, choices that matter, and variety in what the
player meets." v1's loop is linear: one passenger, one quota, flat scoring
(lantern 10 / bright 25 / delivery 100 + time), difficulty only scales numbers.
Its visible depth is ~house 3-mid (Sparkward, arena shooter with waves and
pickups); it beats 1-weak and 2-plain, splits with 3-mid, loses to 4-strong
(Mosslight: 4 hand-built levels, 4 enemy kinds, hidden collectibles,
checkpoints, level select) and above.

**What the top 10 advertise (live leaderboard, 2026-11-16):** SUNWRIGHT 0.937
(mirror-and-sunbeam TD), CINDERLINE 0.930 (track-switching train tactics),
MARGINALIA 0.923 (draw ink loops), TIDEGLASS 0.897, Gravity Harbor 0.894,
Lanternfin 0.893, SIDING 0.890, Wickwatch 0.887 (ten nights), CYTOGUARD 0.882,
STORMKEEPER v3 0.880 ("3 difficulties, reroll, boss enrage"). The pattern:
one strong central mechanic + depth systems the title can name (difficulties,
choices, progression, variety).

**Verdict: PASS — plausible, NOT guaranteed.** The levers are the exact feature
classes that separate 4-strong/5-pro from 3-mid, and v1 is thin on precisely
the criterion that decides. A +0.18 win-rate jump is a big ask and judge
verdicts are noisy (no fixed sampling temperature), so top 10 is not promised.
But the changes are real, targeted, and visible in screenshots + source
outline, the build is bounded (~1,000–1,400 lines over ~30 h left), and v1
stays submitted as the fallback. A reskin would not close the gap; this v2
does not reskin — it deepens the loop.

**Reference repos studied at the start (patterns only, no code copied):**
- make.fun kit's own `competition.yaml` house-games ladder (1-weak → 7-ace) —
  the depth ladder the judge is calibrated against. This is the primary
  reference: what separates each rung.
- oscarcferrr/claude-tetris (GitHub, no LICENSE file — **no code copied**):
  pure scoring module pattern (combo multiplier = min(1 + streak, cap);
  ×1.5 for a chained "difficult" play; floating badge texts like "Combo x3!").
  Adapted as DUSKFERRY's own lantern combo + chain bonus + score popups,
  written from scratch in v2's architecture.
- The v1 entry itself (same entry's evolution, not another entrant's work).

**Kit:** re-downloaded 2026-11-16 from https://make.fun/c/best-game-01/kit
(`best-game-01-kit-v2.tar.gz`, 5,501,918 bytes). RULES.txt diff vs the v1 kit
is 14 lines only — CLI help text, a betting paragraph, harness hash; the
judge section, criteria, deliverable caps and heat structure are unchanged.
`vendor/makefun-game.ts` is byte-identical between the two kits (sha256
dc67187521b24025ff952f8c231485a6eb92d6d71d29edd2a08154ffb4376129).

## 1. What changed vs v1 (mechanic by mechanic)

All changes target criterion 2 (fun & depth). Identity kept: river-crossing,
dusk → night → golden dawn, lanterns, Blackwater river, 5 crossings.

### 1.1 Difficulty select (title screen)
Three difficulties, chosen with keys 1/2/3 or a click on the title screen:
- **Calm** — current ×0.8, hazards ×0.8, score ×1. "A gentle dusk."
- **Swift** — current ×1.0, hazards ×1.0, score ×1.5. "The river as it is."
- **Storm** — current ×1.25, hazards ×1.25, score ×2. "The Blackwater at its
  worst."
Visible in shot 1. (Top entries advertise "3 difficulties"; the choice is
also the first thing the judge sees.)

### 1.2 Passenger choice (the core decision, every crossing)
Three passengers wait at the west dock at different heights; sail to one to
board them. Each is a real trade-off:
- **Elder Maren** (violet) — pays 200 + time bonus. Needs the full lantern
  quota. Safe, big payout.
- **Courier Pip** (amber) — pays 150 + time bonus. Fragile parcel: if the
  ferry takes a hit while Pip is aboard, the parcel is ruined and delivery
  pays only 40. Risky, medium payout.
- **Lantern-keeper Wren** (teal) — pays 100 + time bonus. Wren lights
  lanterns: each lantern counts double toward the quota (effective quota is
  halved). Fast, small payout.
The HUD names the passenger aboard and their rule. (v1 had one passenger
with one rule; v2 makes every crossing start with a choice that matters.)

### 1.3 Lantern load (risk / reward)
Every lantern aboard weighs the ferry down: max speed and thrust fall 4% per
lantern carried (cap −32%). Collecting past the quota pays more but makes the
ferry slower and more exposed. Shown in the HUD as "Load −x%".

### 1.4 Combo + graze (scoring with feedback)
- **Combo:** consecutive lantern pickups without a hit multiply the lantern's
  points: 1st ×1, 2nd ×2, … up to ×5. A hit resets the combo to 0.
- **Chain:** a bright lantern collected while the combo is ≥ 2 also applies a
  ×1.5 chain bonus (the "difficult play, chained" idea).
- **Graze:** passing within a small margin of a hazard without hitting it
  pays +5 × combo multiplier and shows a "GRAZE +n" popup. Each hazard can
  pay a graze at most once per 2 s.
- **Popups:** floating score texts ("+20", "COMBO ×3", "CHAIN ×1.5",
  "GRAZE +15") rise and fade at the event position; the HUD shows the live
  combo multiplier next to the score.
- **Delivery:** delivery pays (base + time bonus + combo × 10) × difficulty
  multiplier, so a hot streak at the dock is worth protecting.

### 1.5 One new mechanic per crossing (not just bigger numbers)
- **Crossing I — First Light:** rocks + logs (baseline, as v1).
- **Crossing II — Fog Banks:** fog banks drift down the river; inside one,
  hazards are dimmed and hidden, but lanterns shine through. The ferry is
  always visible.
- **Crossing III — Wandering Whirls:** whirlpools drift across the river
  (sideways sine motion), so their lanes change — timing matters.
- **Crossing IV — Log Jams:** rows of logs span part of the river with one
  gap; the gap drifts slowly. The ferry must find the gap.
- **Crossing V — Golden Dawn:** golden lanterns appear (worth double, count
  double toward the quota) alongside one fog bank, one wandering whirl and
  one jam, at the strongest current.

### 1.6 Boon choice between crossings
After each delivery except the last, the game pauses on a "Choose a boon"
screen: pick 1 of 3 (keys 1/2/3 or click). Six boons, drawn without repeat
inside a run:
- **Sturdy Hull** — +1 hull (max 5).
- **Lantern Magnet** — lanterns within 120 px drift toward the ferry.
- **Swift Keel** — thrust +15%, max speed +10%.
- **Bright Eyes** — bright lanterns appear twice as often.
- **Calm Water** — current −15% for the rest of the run.
- **Second Wind** — once per run, a hit that would sink the ferry leaves 1
  hull instead.
Visible in shot 3. (The "relics with trade-offs" pattern, adapted.)

### 1.7 What did NOT change
Identity, palette arc (dusk → night → golden dawn), controls (Arrows/WASD or
hold-mouse), fixed 1/60 s step, seeded RNG, WebAudio synth sound (new sounds
added for combo/graze/boon/select), procedural canvas art, no image or audio
files, no network. File-per-concern structure kept and extended with three
new files whose names show the depth in the source outline:
`passengers.js`, `combos.js`, `boons.js`.

## 2. Balance (headless autopilot, measured)

Method: a bot in /tmp (not part of the entry) imports the entry's own
`world.js` / `config.js` / `input.js` and plays full runs. Two bots:
- **Evasive** (mouse-steering, predictive hazard avoidance — hazards drift
  downstream so it avoids where they will be in 0.6 s — smoothed steering,
  wider whirl berth; picks keeper → courier → elder at the dock; picks hull
  when hurt, else magnet / keel / calm / eyes / wind).
- **Straight-line** (holds Right only, never steers vertically; still picks
  a boon when offered so it is not stuck on the boon screen).

| Difficulty | Evasive wins | Mean score | Mean hits | Mean grazes | Mean time |
|---|---|---|---|---|---|
| Calm (×1) | 8/8 (100%) | 2,877 | 2.3 | 5.5 | 171 s |
| Swift (×1.5) | 9/12 (75%) | 3,923 | 2.7 | 7.3 | 162 s |
| Storm (×2) | 2/8 (25%) | 3,831 | 3.1 | 7.6 | 141 s |
| Straight-line, Swift | 0/12 (0%) | 31 | 1.2 | 1.3 | — |

Swift detail (seeds 1–12): wins on 1, 2, 3, 4, 5, 6, 7, 8, 10 (scores
3,381–5,420, 1–2 hull left); losses on 9, 11, 12, all on crossing V with
4 hits and 4 deliveries (scores 2,450–3,439). The final crossing is the
filter, as designed. Storm wins scored 5,228 and 6,212 — the multiplier
pays for the risk. The straight-line bot never wins: 11 runs timed out
stuck at crossing 1 (it never sails to the west dock to board), 1 lost.
A first naive bot (no prediction, no smoothing) measured only 1/12 on
Swift; the reported numbers are the improved bot — the game rewards
anticipation, not just reaction. v1's bot won 5/6 with scores ~1,340–1,461
and 0–2 hits; v2 is harder but fair, and scores run far higher from
combos, grazes and the difficulty multiplier. Clean difficulty curve:
Calm easy, Swift challenging-but-winnable, Storm hard; a mindless bot
never wins.

## 3. Screenshots

Four JPGs, 1280×720, taken in Falkon headless under Xvfb
(`take-shots.sh`, `?shot=…&seed=7`); Falkon was restored from the cached
apt .debs first (it was absent after a VM replacement).
- `1-start.jpg` (86,626 B) — title, three difficulty cards (Swift
  highlighted), the three waiting passengers on the west dock.
- `2-play.jpg` (43,095 B) — Crossing II in fog, Courier Pip aboard,
  COMBO ×3, Load −16%, GRAZE +15 popup, full HUD.
- `3-boon.jpg` (61,748 B) — CHOOSE A BOON, Sturdy Hull / Lantern Magnet /
  Swift Keel cards.
- `4-dawn.jpg` (64,198 B) — DAWN BREAKS panel over the golden dawn, sun
  and reflection, "4 boons taken".
All ≤ 256 KiB, long side 1280, short side 720. Each was visually
inspected. Two legibility defects were found and fixed, then re-shot:
- **Cut-off title/boon lines (real bug):** `drawCards` leaves
  `textAlign='left'`, so the lines drawn after it were left-aligned at
  x=640 and ran off the right edge — pixel-verified on the first shots
  (title "Arrows / WASD…" started at x≈645 and ran to 1260; "Press 1,
  2 or 3…" ran to 1279; "Best score" and the boon "Press 1…" were
  shifted right of centre). Fixed in `render.js` by resetting
  `textAlign='center'` after each `drawCards` call; re-measured all
  four lines centred at x=640 and re-inspected visually.
- **Dawn scene said "0 boons taken":** a real win always takes four
  boons (one after each of the first four deliveries). Fixed in
  `shots.js` to mark four boons as taken; the panel now reads "4 boons
  taken".

## 4. Verification

- `node --check`: all 11 `game/src/*.js` + `main.ts` + `serve.ts` pass.
  `vendor/makefun-game.ts` is TypeScript and fails plain `node --check`
  on `as const`, as expected — it runs under the kit's type-stripping,
  and `main.ts` executes fine.
- Two `main.ts` runs (`MAKEFUN_OUTPUT_DIR=out1/out2`): `dossier.json`
  sha256 identical (`b754a58d…`), full output trees byte-identical
  (`diff -r` clean). Deterministic.
- Caps: total output 736,630 bytes (cap 64 MiB); `game/` 68,293 bytes,
  12 files (caps 48 MiB / 993 files); `dossier.json` 412,670 bytes (cap
  1.5 MiB); dossier text 69,130 bytes (cap 160 KiB — all source fits
  whole); screenshots 4 × 1280×720 JPEG, 43–87 KB each (caps 4 files /
  256 KiB / long side ≤ 1280 / short side ≥ 480).
## 5. Kit check (TO BE FILLED)
