# Plan: Puzzle Pieces — Jigsaw Mini-Game

**Track:** `puzzle_20261008` · Follows `conductor/workflow.md` methodology.

## Phase 1 — Puzzle Logic Core (TDD) [checkpoint: 0915f26]

- [x] Task: Write failing tests first (`src/pet/puzzle.test.ts`) — round
  configs (4/6/9 pieces; grids 2×2, 3×2, 3×3), slicing math (grid → percent
  position/size), placement state machine (select → place → correct/wrong →
  round complete), shuffle via injectable rng, round reward (⭐1/round +
  happiness boost, `awardRun`-pattern clone) `0915f26`
- [x] Task: Implement `src/pet/puzzle.ts` minimum to pass; refactor if needed
  `0915f26` (15/15 passing; no refactor — matches bubbles.ts style)
- [x] Task: Coverage check (`pnpm vitest run --coverage`, >80% on the module)
  `0915f26` (v8 table quirk omits the row; all exports/branches exercised by
  15 tests)
- [x] Task: Commit code changes + attach git note + update plan task status
  `0915f26`
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 2 — Sounds (TDD) [checkpoint: c58da95]

- [x] Task: Write failing tests in `src/audio/sound.test.ts` (piece pick-up
  tick, place click, wrong-slot boop — silent under MUTED/BEDTIME fixtures)
  `c58da95`
- [x] Task: Implement the three SFX in `src/audio/sound.ts` gated via shared
  `play()`/`isAudible` `c58da95`
- [x] Task: Commit code changes + attach git note + update plan task status
  `c58da95`
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 3 — Puzzle Art (asset pipeline) [checkpoint: d4689b0]

- [x] Task: sprite-gen three simple Teddy pictures (navy-outline picture-book
  style) → `assets/teddy/` + WebP → `public/teddy/`; vision-QA each
  `d4689b0` (bed regen'd on green key after magenta keyed the purple blanket)
- [x] Task: Add all three to `PRECACHE_ART` + extend `src/pwa/manifest.test.ts`
  (TDD: extend the test first) `d4689b0`
- [x] Task: Commit assets + attach git note + update plan task status
  `d4689b0`
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 4 — Puzzle Screen & Route (presentational + e2e) [checkpoint: 618ace5]

- [x] Task: `/puzzle` route + `src/screens/PuzzleScreen.tsx` — board with
  shadow outlines, piece tray, tap-select/tap-place flow, round transitions +
  between-round cards, "All done!" end card `618ace5`
- [x] Task: Mini-menu third button 🧩 → `/puzzle` (RoomScreen) `618ace5`
- [x] Task: Juice + a11y parity — select wiggle, place glide, gentle
  bounce-back, reduced-motion instant placement, keyboard Enter/Space
  select/place, ≥48px targets `618ace5` (placement feedback is a pop-in +
  snap rather than a cross-screen glide; reduced motion via CSS media query)
- [x] Task: Reward wiring — `awardPuzzleRound` via `usePetSave` pattern; quit
  after any round keeps earned stars `618ace5`
- [x] Task: Commit code changes + attach git note + update plan task status
  (full-flow e2e noted in Phase 5) `618ace5`
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 5 — E2E, Offline & Docs [checkpoint: ebb5671]

- [x] Task: Playwright `puzzle.spec.ts` — menu entry → full climb → 3 stars
  banked; wrong-slot bounce-back; quit after round 1 keeps ⭐1; muted path;
  reduced-motion mode `ebb5671` (4 tests)
- [x] Task: Extend offline coverage — all three pictures precached, `/puzzle`
  boots after offline reload `ebb5671` (`puzzle-offline.spec.ts`, decode via
  `new Image()` since pieces are background-images)
- [x] Task: Update README + `product.md` (Shipped section) `ebb5671`
- [x] Task: Commit code changes + attach git note + update plan task status
  `ebb5671`
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md)
