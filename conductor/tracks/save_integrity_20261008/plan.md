# Implementation Plan — Save Integrity (`save_integrity_20261008`)

> Follows `conductor/workflow.md`: TDD for logic-bearing tasks, phase
> checkpoints, quality gates. Commands run non-interactive (`CI=true`).

## Phase 1: Single Save Owner — provider unification

- [ ] Task: Write failing provider tests (Vitest + fake-indexeddb)
  - [ ] Exactly one `loadSave` per provider mount-tree (consumers share one fork)
  - [ ] A settings patch from one consumer preserves stars/stats written by another consumer
  - [ ] Confirm tests fail (Red phase)
- [ ] Task: Implement `PetSaveProvider` + `usePetSaveContext()` in `src/pet/`
  - [ ] Context wraps the single `usePetSave()` instance
  - [ ] Green phase: new tests pass
- [ ] Task: Refactor `useSettings` to consume context (no own `usePetSave()`)
- [ ] Task: Refactor screens to consume context
  - [ ] `RoomScreen`, `RunnerScreen`, `BubblesScreen`, `PuzzleScreen`, `ParentScreen`
  - [ ] Mount provider in `App.tsx`; remove the stale-fork comment
- [ ] Task: Full unit suite + `pnpm check` green
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 2: Persistence hardening — star clamping

- [ ] Task: Write failing tests in `store.test.ts` (Red phase)
  - [ ] Negative stars clamp to 0 on load and save
  - [ ] Fractional stars clamp to integers on load and save
  - [ ] NaN/non-finite stars fall back to a safe value
- [ ] Task: Implement clamping in `src/save/store.ts` at the load/save boundary
  - [ ] Schema stays v2; no migration bump
  - [ ] Green phase: tests pass
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 3: E2E regression proof & quality gates

- [ ] Task: Playwright e2e — fork regression
  - [ ] Earn stars in room → toggle mute in parent panel → reload → stars survive
- [ ] Task: Playwright e2e — parent reset flow
  - [ ] Two-tap arming reset wipes progress and settings
- [ ] Task: Full quality gates
  - [ ] `pnpm check`
  - [ ] `CI=true pnpm test` with coverage (>80% touched logic modules)
  - [ ] `pnpm test:e2e`
- [ ] Task: Docs sync
  - [ ] product.md shipped entry
  - [ ] tech-stack.md note if the save architecture line changes
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)
