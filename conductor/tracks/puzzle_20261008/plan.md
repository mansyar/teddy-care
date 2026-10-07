# Plan: Puzzle Pieces — Jigsaw Mini-Game

**Track:** `puzzle_20261008` · Follows `conductor/workflow.md` methodology.

## Phase 1 — Puzzle Logic Core (TDD)

- [ ] Task: Write failing tests first (`src/pet/puzzle.test.ts`) — round
  configs (4/6/9 pieces; grids 2×2, 3×2, 3×3), slicing math (grid → percent
  position/size), placement state machine (select → place → correct/wrong →
  round complete), shuffle via injectable rng, round reward (⭐1/round +
  happiness boost, `awardRun`-pattern clone)
- [ ] Task: Implement `src/pet/puzzle.ts` minimum to pass; refactor if needed
- [ ] Task: Coverage check (`pnpm vitest run --coverage`, >80% on the module)
- [ ] Task: Commit code changes + attach git note + update plan task status
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 2 — Sounds (TDD)

- [ ] Task: Write failing tests in `src/audio/sound.test.ts` (piece pick-up
  tick, place click, wrong-slot boop — silent under MUTED/BEDTIME fixtures)
- [ ] Task: Implement the three SFX in `src/audio/sound.ts` gated via shared
  `play()`/`isAudible`
- [ ] Task: Commit code changes + attach git note + update plan task status
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 3 — Puzzle Art (asset pipeline)

- [ ] Task: sprite-gen three simple Teddy pictures (navy-outline picture-book
  style) → `assets/teddy/` + WebP → `public/teddy/`; vision-QA each
- [ ] Task: Add all three to `PRECACHE_ART` + extend `src/pwa/manifest.test.ts`
  (TDD: extend the test first)
- [ ] Task: Commit assets + attach git note + update plan task status
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 4 — Puzzle Screen & Route (presentational + e2e)

- [ ] Task: `/puzzle` route + `src/screens/PuzzleScreen.tsx` — board with
  shadow outlines, piece tray, tap-select/tap-place flow, round transitions +
  between-round cards, "All done!" end card
- [ ] Task: Mini-menu third button 🧩 → `/puzzle` (RoomScreen)
- [ ] Task: Juice + a11y parity — select wiggle, place glide, gentle
  bounce-back, reduced-motion instant placement, keyboard Enter/Space
  select/place, ≥48px targets
- [ ] Task: Reward wiring — `awardPuzzleRound` via `usePetSave` pattern; quit
  after any round keeps earned stars
- [ ] Task: Commit code changes + attach git note + update plan task status
  (full-flow e2e noted in Phase 5)
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 5 — E2E, Offline & Docs

- [ ] Task: Playwright `puzzle.spec.ts` — menu entry → full climb → 3 stars
  banked; wrong-slot bounce-back; quit after round 1 keeps ⭐1; muted path;
  reduced-motion mode
- [ ] Task: Extend offline coverage — all three pictures precached, `/puzzle`
  boots after offline reload
- [ ] Task: Update README + `product.md` (Shipped section)
- [ ] Task: Commit code changes + attach git note + update plan task status
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)
