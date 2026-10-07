# Implementation Plan: Teddy's Room

**Track ID:** `teddys_room_20261007` · **Type:** Feature
**Spec:** [spec.md](./spec.md) · **Workflow:** [conductor/workflow.md](../../workflow.md)

> TDD applies to all logic-bearing tasks (Red → Green → Refactor).
> Presentational/asset tasks note their Playwright/manual verification plan.

## Phase 1: Room Foundation — Layout Logic & Art Assets [checkpoint: 9e3963]

- [x] Task: Write failing tests for room layout module (Red) — baaa4cd
  - [x] POI registry: ids, action mapping, per-orientation anchor positions
  - [x] Orientation layout selection (portrait vs landscape breakpoint)
  - [x] Walk-target resolution (tap → floor point or POI anchor)
- [x] Task: Implement `src/room/layout.ts` to pass tests (Green) — baaa4cd
- [x] Task: Generate portrait room background (sprite-gen, finals →
  `assets/teddy/`, runtime copy → `public/teddy/`) — presentational;
  verify via visual review + later e2e render checks — f29a49c
- [x] Task: Generate landscape room background (sprite-gen) — presentational — 1e4c693
- [x] Task: Generate walk cycle strip (sprite-gen, gentle gait) — presentational — 7949363, 9e39631 (take 3 accepted after gait review)
- [x] Task: Generate closet/mirror POI art (sprite-gen) — presentational — 05d8ee8
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 2: Room Scene UI (Presentational) [checkpoint: d97c493]

- [x] Task: Build `RoomScene` component: layered background, POI hotspots
  (≥48px targets), floor tap zones, Teddy sprite staging reusing
  breathe/blink/eat/joy/sad/sleepy stills - presentational; verify via
  Playwright render checks + manual pass — 07853df
- [x] Task: Responsive two-layout CSS: portrait 360px baseline + landscape
  repositioning of POIs and floor zones - presentational; verify both
  orientations via Playwright viewport matrix — d97c493
- [x] Task: Reduced-motion behavior: skip walk animation, instant
  reposition, keep feedback - presentational; verify via Playwright
  reduced-motion emulation — d97c493 (walk anim + breathe verified off; the
  instant-reposition path itself is the Phase 3 controller test)
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 3: Interaction — Walk → Act Controller

- [~] Task: Write failing tests for interaction controller (Red)
  - [ ] Tap floor → walk target, no action
  - [ ] Tap POI → walk → action fires on arrival (feed/rest/wash boosts via
    existing `stats.ts` semantics)
  - [ ] Tap Teddy → pet action (happiness +25, squash/giggle)
  - [ ] Toy box → navigation to `/runner`
  - [ ] Closet → wardrobe panel opens
  - [ ] Reduced-motion path fires action immediately
- [ ] Task: Implement walk→act controller + POI action wiring (Green)
- [ ] Task: Signature feedback per POI: eating face, bubbles, Zzz, hop +
  star sparkle, closet sparkle; rug/toy easter eggs — presentational
- [ ] Task: Replace CareScreen with Room; update App routes and tab bar to
  2 tabs (🐻 Room / 🌙 Parents); star chip in top corner — presentational
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 4: Room Audio

- [ ] Task: Write failing tests for new sound gating (Red): footsteps,
  munch, water fizz, yawn all silent under mute/bedtime via `isAudible`
- [ ] Task: Implement synthesized sounds in `src/audio/sound.ts` (Green)
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 5: Object-State Visuals & Bedtime Staging

- [ ] Task: Write failing tests for stat→object-state mapping (Red):
  bowl fill level vs hunger, scruffiness vs cleanliness, droop vs energy
- [ ] Task: Implement object-state visuals + bedtime staging: room dim,
  glowing bed, sleeping Teddy (Green) — visuals themselves verified via
  Playwright/manual
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 6: E2E, Offline & Polish

- [ ] Task: Playwright e2e additions: bowl→hunger boost, bed→energy,
  tub→cleanliness, pet boost, toy box→runner opens, wardrobe opens,
  bedtime dims room, both orientations render
- [ ] Task: PWA precache includes new art; verify full offline
  (airplane-mode flow still passes)
- [ ] Task: Payload/perf check: WebP where sensible, 60fps room on
  mid-range device profile; manual 360px + real-phone pass
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)
