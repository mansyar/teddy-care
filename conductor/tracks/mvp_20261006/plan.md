# Track Plan — MVP: Teddy Care Initial Implementation

## Phase 1: Scaffold & PWA Shell
- [x] Task: Init Vite + React + TS app with pnpm, Biome, strict TS (f3a543e)
  - [x] pnpm create vite, TS strict, Biome config, `pnpm check` green
- [x] Task: App shell, routing, base styles (4931060)
  - [x] Routes: care (home), runner, parent panel; 360px portrait baseline, ≥48px targets, pastel theme tokens
- [x] Task: PWA wiring (logic: precache config) (b991512)
  - [x] Write failing test for precache manifest contents (logic-bearing) — then implement
  - [x] vite-plugin-pwa: manifest, icons, offline precache of shell + art + audio
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md)
  - [checkpoint: 55c1a58]

## Phase 2: Persistence & Stats Engine (logic — full TDD)
- [x] Task: IndexedDB wrapper (f6b12c0)
  - [x] Write failing tests (CRUD, reload persistence, corrupted-save safe reset) — then implement
- [x] Task: Stats engine (4 stats, wall-clock deltas, gentle decay, clamps) (ef6e3fe)
  - [x] Write failing tests (decay math, clamps, kindness: never terminal) — then implement
- [x] Task: Mood derivation (stats → face: happy/sad/sleepy/eating/blink-idle) (4d57da7)
  - [x] Write failing tests (threshold mapping incl. bedtime override) — then implement
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md)
  - [checkpoint: 249a5b2]

## Phase 3: Care Screen (presentational + wiring)
- [x] Task: Teddy idle presence (base still, blink swap, ambient float via CSS) (f17e499)
  - [ ] Playwright/manual verification plan noted (exempt from Vitest)
- [x] Task: Runtime breathe (JS mirror of breathe envelope, depth 0.06, 2 breaths/2s, face rigid) (e81cf70)
- [x] Task: Care actions (feed/wash/rest/pet → stat change → face swap → feedback <300ms) (0a8190a)
- [x] Task: Touch reactivity (tap squash + giggle + happy flash; idle events 20–40s) (2b2424d)
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) [checkpoint: ffb932f]

## Phase 4: Stars & First Costume (logic + overlay)
- [x] Task: Star economy (earn from care events; balance persisted) (8ae4b27)
  - [x] Write failing tests (earn rules, persistence) — then implement
- [x] Task: One unlockable costume (accessory overlay or recolor, equippable over any face) (3648c8d)
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) [checkpoint: 2341fa6]

## Phase 5: Runner Mini-Game (Phaser)
- [x] Task: Phaser mount + run strip integration (15-frame strip from side-run-asfilmed) (fbff149)
- [x] Task: One-button auto-run/jump mechanics (logic: distance→stars, no lose state) (fbff149)
  - [x] Write failing tests (reward math, happy-end guarantee) — then implement
- [x] Task: Runner offline from precache (Playwright: airplane-mode run) (be76d52)
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) [checkpoint: 71ab37e]

## Phase 6: Audio & Parent Panel
- [ ] Task: Placeholder music + SFX via WebAudio; mute persisted; bedtime silences+dims
- [ ] Task: Parent panel (mute, bedtime, reset-save; no PIN)
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 7: E2E, PWA Proof & Playtest Prep
- [ ] Task: Playwright flows (install, offline reload, care→star, runner rewards, mute/bedtime persist)
- [ ] Task: Real-phone build + install + airplane-mode pass
- [ ] Task: Son playtest gate (feed→happy→star + runner run unaided)
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)
