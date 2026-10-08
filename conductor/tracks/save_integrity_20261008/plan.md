# Implementation Plan — Save Integrity (`save_integrity_20261008`)

> Follows `conductor/workflow.md`: TDD for logic-bearing tasks, phase
> checkpoints, quality gates. Commands run non-interactive (`CI=true`).

## Phase 1: Single Save Owner — provider unification `[checkpoint: 4f7d60e]`

- [x] Task: Write failing provider tests (Vitest + fake-indexeddb) `67ef376`
  - [x] Exactly one `loadSave` per provider mount-tree (consumers share one fork) `67ef376`
  - [x] A settings patch from one consumer preserves stars/stats written by another consumer `67ef376`
  - [x] Confirm tests fail (Red phase) `67ef376`
- [x] Task: Implement `PetSaveProvider` + `usePetSaveContext()` in `src/pet/` `67ef376`
  - [x] Context wraps the single `usePetSave()` instance `67ef376`
  - [x] Green phase: new tests pass `67ef376`
- [x] Task: Refactor `useSettings` to consume context (no own `usePetSave()`) `4f7d60e`
- [x] Task: Refactor screens to consume context `4f7d60e`
  - [x] `RoomScreen`, `RunnerScreen`, `BubblesScreen`, `PuzzleScreen`, `ParentScreen` `4f7d60e`
  - [x] Mount provider in `App.tsx`; remove the stale-fork comment `4f7d60e`
- [x] Task: Full unit suite + `pnpm check` green `4f7d60e`
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) `[checkpoint: 4f7d60e]`

## Phase 2: Persistence hardening — star clamping `[checkpoint: c88a128]`

- [x] Task: Write failing tests in `store.test.ts` (Red phase) `c88a128`
  - [x] Negative stars clamp to 0 on load and save `c88a128`
  - [x] Fractional stars clamp to integers on load and save `c88a128`
  - [x] NaN/non-finite stars fall back to a safe value `c88a128`
- [x] Task: Implement clamping in `src/save/store.ts` at the load/save boundary `c88a128`
  - [x] Schema stays v2; no migration bump `c88a128`
  - [x] Green phase: tests pass `c88a128`
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
