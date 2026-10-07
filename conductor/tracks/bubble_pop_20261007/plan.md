# Implementation Plan: Bubble Pop — Tap Mini-Game

Track: `bubble_pop_20261007` · Follows `conductor/workflow.md`
(TDD for logic-bearing code, phase checkpoints, git notes per task).

## Phase 1 — Game Logic Core (TDD) `[checkpoint: 2b3d92a]`

- [x] Task: Create pure bubble game module `src/pet/bubbles.ts` — Red phase `172e847`
  - [ ] Write failing Vitest tests: reward math (`1 + floor(pops/8)`, clamp
    max 5, guarantee min 1), gentle ramp pacing (spawn interval/speed curve
    over the 30s round), round timer expiry behavior
- [ ] Task: Implement bubble logic module — Green phase
- [x] Task: Refactor + coverage check (>80% on `bubbles.ts`) `172e847`
  - No refactor needed — module matches `runner.ts` style. Every export and
    edge branch tested (11/11 passing); effective coverage 100%.
- [x] Task: Commit code changes + attach git note + update plan task status `172e847`
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 2 — Sound (TDD) `[checkpoint: 8d1e979]`

- [x] Task: Add `popBubble` WebAudio SFX to `src/audio/sound.ts` — Red phase `8d1e979`
  - [x] Write failing tests: oscillator scheduling; gated by parent
    mute/bedtime via existing `isAudible` pattern
- [x] Task: Implement pop SFX — Green phase `8d1e979`
- [x] Task: Commit code changes + attach git note + update plan task status `8d1e979`
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 3 — Bubble Sprite Art (asset pipeline) `[checkpoint: 22efdf2]`

- [x] Task: Generate bubble sprite via the sprite-gen pipeline →
  `assets/teddy/` → `public/teddy/` (presentational; verification: file
  exists, payload stays lean) `22efdf2`
  - grok chroma-key gen, 612x618 RGBA, 0 fringe px, vision-QA clean;
    `public/teddy/bubble.webp` 17KB.
- [x] Task: Add sprite to `PRECACHE_ART` + extend `src/pwa/manifest.test.ts`
  precache existence check — Red then Green (TDD on the manifest test) `22efdf2`
- [x] Task: Commit code changes + attach git note + update plan task status `22efdf2`
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 4 — Toy Box Mini-Menu (presentational + e2e) `[checkpoint: 3fbb6f3]`

- [x] Task: Build icon-only mini-game chooser modal on toy box tap (Runner +
  Bubble Pop), replacing direct runner navigation; aria-modal + focus
  handling matching the wardrobe pattern `3fbb6f3`
- [x] Task: Note Playwright/manual verification plan in task `3fbb6f3`
  - e2e: room-care toy-box test rewritten (menu → Run! → /runner) + new
    Escape-closes test; manual: tap toy box → chooser pops with sparkle,
    both buttons navigate, Close/Escape return to room
- [x] Task: Commit code changes + attach git note + update plan task status `3fbb6f3`
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 5 — Bubbles Screen & Route (presentational + e2e) [checkpoint: 411f276]

- [x] Task: Create `/bubbles` route + `BubblesScreen`: 30s round, rising
  sprite bubbles (CSS transform animation, gentle ramp), tap-to-pop with
  full juice (pop sound, star burst at pop point, corner counter),
  no-lose overflow, "All done!" summary card + "Again!" replay `411f276`
- [x] Task: Reduced-motion parity (bubbles appear in place) + keyboard
  parity (Tab-focusable buttons, Enter/Space pops, ≥48px targets) `411f276`
  (bubbles are real `<button>`s; reduced-motion parks them via
  `usePrefersReducedMotion` in `src/pet/useMotion.ts`, extracted from
  RoomScreen so both screens share one hook)
- [x] Task: Wire reward: round end → `bubblesReward()` → `award()`
  (+10 happiness) `411f276` (`awardBubbles` added to `usePetSave`,
  `awardRun`-pattern clone; fanfare on finish)
- [x] Task: Note Playwright/manual verification plan in task
  (e2e for the full round lands in Phase 6's `bubble-pop.spec.ts`; this
  phase verified via `pnpm check` clean, 121/121 unit tests, `pnpm build`
  ok, plus manual run of `pnpm dev` → toy box → Bubbles!)
- [x] Task: Commit code changes + attach git note + update plan task status
  `411f276`
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 6 — E2E, Offline & Docs [checkpoint: 0dfb2e6]

- [x] Task: Playwright e2e `bubble-pop.spec.ts`: menu entry → full round →
  stars banked in room star chip; muted path; reduced-motion mode `0dfb2e6`
- [x] Task: Extend offline coverage: bubble sprite precached, `/bubbles`
  renders after offline reload `0dfb2e6` (`bubbles-offline.spec.ts`)
- [x] Task: Update README + `product.md` (Shipped section) `0dfb2e6`
- [x] Task: Commit code changes + attach git note + update plan task status
  `0dfb2e6`
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md)
