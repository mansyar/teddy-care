# Plan: Wardrobe Expansion — tiered costume closet with free switching

**Track:** `wardrobe_20261008` · Follows `conductor/workflow.md` methodology.

## Phase 1 — Wardrobe Logic Core (TDD) [checkpoint: 9380764]

- [x] Task: Write failing tests first — costume catalog (3 items:
  `sunset-onesie` 10⭐ filter, `party-hat` 20⭐ overlay, `cozy-scarf` 30⭐
  overlay; `kind: "filter" | "overlay"`), ownership model (`buy` →
  owned+equipped, `equip` among owned + default `null`, no negative/no
  double-charge), save **v2** schema (`owned: string[]`) and v1→v2 migration
  (v1 `costume` implies ownership; `costume: null` → `owned: []`; corrupted
  saves → fresh defaults) `9380764`
- [x] Task: Implement `src/pet/costume.ts` + `src/save/store.ts` minimum to
  pass; refactor if needed `9380764` (prices centralized in `stars.ts`;
  migration via exported `migrateSave`)
- [x] Task: Coverage check (`pnpm vitest run --coverage`, >80% on touched
  modules) `9380764` (store.ts 83.8% stmts; full suite 154/154)
- [x] Task: Commit code changes + attach git note + update plan task status
  `9380764`
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 2 — Purchase Sound (TDD)

- [x] Task: Write failing tests in `src/audio/sound.test.ts` — buy-celebration
  sparkle sound (silent under MUTED/BEDTIME fixtures); reuse existing boop for
  the unaffordable wiggle `7558d1c`
- [x] Task: Implement in `src/audio/sound.ts` via the shared
  `play()`/`isAudible` gate `7558d1c` (4-note ascending shimmer)
- [x] Task: Commit code changes + attach git note + update plan task status
  `7558d1c`
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 3 — Accessory Art (asset pipeline)

- [ ] Task: sprite-gen the Party Hat 🎉 and Cozy Scarf 🧣 overlay PNGs
  (navy-outline style, anchored to head/neck) → `assets/teddy/` + runtime
  copies → `public/teddy/`; vision-QA alignment over base Teddy
- [ ] Task: Bake companion 34-cell walk strips per accessory aligned to the
  walk grid (same cell size/timing contract) + run strips for the runner;
  verify frame-by-frame alignment (no jitter) via preview bake
- [ ] Task: Add all new assets to `PRECACHE_ART` + extend
  `src/pwa/manifest.test.ts` (TDD: extend the test first)
- [ ] Task: Commit assets + attach git note + update plan task status
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 4 — Wardrobe UI & Room Overlay (presentational)

- [ ] Task: Closet modal → live preview strip: card per costume +
  default-onesie card; owned = tap-to-equip (worn card highlighted);
  unowned+affordable = buy + sparkle celebration + equip; unowned+unaffordable
  = gentle wiggle + soft boop, nothing else; Escape-close + focus management
  preserved; ≥48px targets
- [ ] Task: RoomScene overlay rendering — accessory PNG inside Teddy's
  transformed container so breathe scale + blink carry it; reduced-motion path
  keeps equip + sound, skips wiggle/celebration motion
- [ ] Task: Walk-strip sync — companion strip animated with identical
  `steps()` timing and facing mirroring alongside the walk strip
- [ ] Task: Commit code changes + attach git note + update plan task status
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 5 — Runner Overlay (Phaser)

- [ ] Task: `src/game/runGame.ts` — layer accessory sprite over Teddy,
  frame-synced to the run animation via the accessory run strip; no overlay
  for default/filter costumes (filter applies scene-wide as today)
- [ ] Task: Verify at 360px and desktop; frame-walk the run loop for alignment
- [ ] Task: Commit code changes + attach git note + update plan task status
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 6 — E2E, Offline & Docs

- [ ] Task: Playwright `wardrobe.spec.ts` — open closet → buy hat at enough
  stars → sparkle + worn; unaffordable scarf → wiggle, stars unchanged;
  switch to default and back; persists across reload
- [ ] Task: Offline coverage — accessory stills + strips precached; wardrobe +
  accessory-visible room boots after offline reload (`wardrobe-offline.spec.ts`)
- [ ] Task: Update README + `product.md` (Shipped section: Wardrobe Expansion)
  + docs sync
- [ ] Task: Commit code changes + attach git note + update plan task status
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)
