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

## Phase 2 — Purchase Sound (TDD) [checkpoint: 7558d1c]

- [x] Task: Write failing tests in `src/audio/sound.test.ts` — buy-celebration
  sparkle sound (silent under MUTED/BEDTIME fixtures); reuse existing boop for
  the unaffordable wiggle `7558d1c`
- [x] Task: Implement in `src/audio/sound.ts` via the shared
  `play()`/`isAudible` gate `7558d1c` (4-note ascending shimmer)
- [x] Task: Commit code changes + attach git note + update plan task status
  `7558d1c`
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 3 — Accessory Art (asset pipeline) — SUPERSEDED

> Rev 2 re-scoped the track to filter recolors after the user rejected the
> generated overlay art at this phase's checkpoint. Work was reverted in
> `c653d77`; the tasks below are historical record, not pending work.

- [x] Task: sprite-gen the Party Hat 🎉 and Cozy Scarf 🧣 overlay PNGs
  (navy-outline style, anchored to head/neck) → `assets/teddy/` + runtime
  copies → `public/teddy/`; vision-QA alignment over base Teddy <fb13195>
  (front + side views; magenta-family subjects need a green chroma key)
- [x] Task: Bake companion 34-cell walk strips per accessory aligned to the
  walk grid (same cell size/timing contract) + run strips for the runner;
  verify frame-by-frame alignment (no jitter) via preview bake <fb13195>
  (hand bake stage `assets/teddy/bake_companion.py`: per-cell head-top
  tracking; strip hat shrunk to 84.5% since strips have no crown headroom;
  9-cell vision QA all good)
- [x] Task: Add all new assets to `PRECACHE_ART` + extend
  `src/pwa/manifest.test.ts` (TDD: extend the test first) <fb13195>
- [x] Task: Commit assets + attach git note + update plan task status <fb13195>
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) — REJECTED
  by user; track re-scoped (Rev 2)

## Phase 4 — Filter Catalog Revision (TDD)

- [ ] Task: Update `src/pet/costume.test.ts` first — catalog becomes
  `sunset-onesie` 10⭐, `mint-dream` 20⭐, `berry-night` 30⭐, all
  `kind: "filter"`; drop the overlay variant from the interface
- [ ] Task: Implement the new catalog entries + filters in `costume.ts`
  (Mint Dream / Berry Night filter values; tune visually at the phase
  checkpoint); keep prices centralized in `stars.ts`
- [ ] Task: Commit code changes + attach git note + update plan task status
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 5 — Wardrobe UI (presentational)

- [ ] Task: Closet modal → live preview strip: card per costume +
  default-onesie card; owned = tap-to-equip (worn card highlighted);
  unowned+affordable = buy + sparkle celebration + equip; unowned+unaffordable
  = gentle wiggle + soft boop, nothing else; Escape-close + focus management
  preserved; ≥48px targets; card thumbnails preview the filter live
- [ ] Task: RoomScene shows the equipped filter as today (scene-wide);
  reduced-motion path keeps equip + sound, skips wiggle/celebration motion
- [ ] Task: Verify at 360px portrait and desktop; tune Mint Dream / Berry
  Night filter values live with the user
- [ ] Task: Commit code changes + attach git note + update plan task status
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 6 — E2E, Offline & Docs

- [ ] Task: Playwright `wardrobe.spec.ts` — open closet → buy Mint Dream at
  enough stars → sparkle + worn; unaffordable Berry Night → wiggle, stars
  unchanged; switch to default and back; persists across reload
- [ ] Task: Offline coverage — wardrobe + room boot after offline reload
  (`wardrobe-offline.spec.ts`); confirm precache list unchanged
- [ ] Task: Update README + `product.md` (Shipped section: Wardrobe Expansion)
  + docs sync
- [ ] Task: Commit code changes + attach git note + update plan task status
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)
