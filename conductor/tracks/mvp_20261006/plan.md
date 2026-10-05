# Track Plan — MVP: Teddy Care Initial Implementation

## Phase 1: Scaffold & PWA Shell
- [x] Task: Init Vite + React + TS app with pnpm, Biome, strict TS (f3a543e)
  - [x] pnpm create vite, TS strict, Biome config, `pnpm check` green
- [ ] Task: App shell, routing, base styles
  - [ ] Routes: care (home), runner, parent panel; 360px portrait baseline, ≥48px targets, pastel theme tokens
- [ ] Task: PWA wiring (logic: precache config)
  - [ ] Write failing test for precache manifest contents (logic-bearing) — then implement
  - [ ] vite-plugin-pwa: manifest, icons, offline precache of shell + art + audio
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 2: Persistence & Stats Engine (logic — full TDD)
- [ ] Task: IndexedDB wrapper
  - [ ] Write failing tests (CRUD, reload persistence, corrupted-save safe reset) — then implement
- [ ] Task: Stats engine (4 stats, wall-clock deltas, gentle decay, clamps)
  - [ ] Write failing tests (decay math, clamps, kindness: never terminal) — then implement
- [ ] Task: Mood derivation (stats → face: happy/sad/sleepy/eating/blink-idle)
  - [ ] Write failing tests (threshold mapping incl. bedtime override) — then implement
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 3: Care Screen (presentational + wiring)
- [ ] Task: Teddy idle presence (base still, blink swap, ambient float via CSS)
  - [ ] Playwright/manual verification plan noted (exempt from Vitest)
- [ ] Task: Runtime breathe (JS mirror of breathe envelope, depth 0.06, 2 breaths/2s, face rigid)
- [ ] Task: Care actions (feed/wash/rest/pet → stat change → face swap → feedback <300ms)
- [ ] Task: Touch reactivity (tap squash + giggle + happy flash; idle events 20–40s)
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 4: Stars & First Costume (logic + overlay)
- [ ] Task: Star economy (earn from care events; balance persisted)
  - [ ] Write failing tests (earn rules, persistence) — then implement
- [ ] Task: One unlockable costume (accessory overlay or recolor, equippable over any face)
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 5: Runner Mini-Game (Phaser)
- [ ] Task: Phaser mount + run strip integration (15-frame strip from side-run-asfilmed)
- [ ] Task: One-button auto-run/jump mechanics (logic: distance→stars, no lose state)
  - [ ] Write failing tests (reward math, happy-end guarantee) — then implement
- [ ] Task: Runner offline from precache (Playwright: airplane-mode run)
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 6: Audio & Parent Panel
- [ ] Task: Placeholder music + SFX via WebAudio; mute persisted; bedtime silences+dims
- [ ] Task: Parent panel (mute, bedtime, reset-save; no PIN)
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 7: E2E, PWA Proof & Playtest Prep
- [ ] Task: Playwright flows (install, offline reload, care→star, runner rewards, mute/bedtime persist)
- [ ] Task: Real-phone build + install + airplane-mode pass
- [ ] Task: Son playtest gate (feed→happy→star + runner run unaided)
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)
