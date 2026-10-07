# Spec: Wardrobe Expansion — tiered costume closet with free switching

**Track:** `wardrobe_20261008` · Type: Feature · Branch: `track/wardrobe-expansion`

## Overview

Grow the closet from a single permanent costume into a small, joyful wardrobe:
Teddy's blue-striped onesie (default), the existing **Sunset Onesie** (10⭐,
CSS-filter recolor), and two **new accessory costumes** — 🎉 **Party Hat**
(20⭐) and 🧣 **Cozy Scarf** (30⭐) — rendered as overlay art worn over base
Teddy. After purchase, any owned item can be worn again at any time (free
switching, including back to the default onesie). Accessories follow Teddy
everywhere he moves in-app: idle room, walk cycle, and the runner.

## Functional Requirements

- **FR1 — Costume catalog.** `COSTUMES` grows to three entries with tiered
  prices: `sunset-onesie` 10⭐ (existing filter type), `party-hat` 20⭐,
  `cozy-scarf` 30⭐ (overlay type, `kind: "filter" | "overlay"`). Pure data in
  `costume.ts`, TDD-covered.
- **FR2 — Ownership & free switching (save v2).** Save schema gains
  `owned: string[]`. Buying deducts stars, adds to `owned`, and equips. Equip
  switches at any time among owned items or the default (`costume: null`).
  Migration: v1 saves load as v2 — a v1 `costume` value implies ownership;
  `costume: null` → empty `owned`. Corrupted/foreign saves still fall back to
  fresh defaults.
- **FR3 — Live preview wardrobe.** The closet modal becomes a horizontal
  preview strip: one card per costume plus a **default onesie card**. Tapping
  an **owned** card (or default) equips it instantly — Teddy in the room
  behind updates live. Tapping an **unowned affordable** card buys + equips
  with a small celebration. Tapping an **unowned unaffordable** card plays a
  gentle wiggle + soft boop with no other effect. All cards are real buttons;
  Escape still closes the modal; worn item is visually highlighted.
- **FR4 — Buy celebration.** Purchasing fires a sparkle burst on Teddy and a
  happy sound (respecting parent mute and bedtime), and the item is worn
  immediately.
- **FR5 — Overlay consistency (idle room).** The accessory overlay renders
  inside Teddy's transformed sprite container in `RoomScene`, so breathing
  scale and blink face-swaps carry it.
- **FR6 — Overlay consistency (walk).** Each accessory ships a companion
  34-cell strip aligned to the walk grid, animated with the same `steps()`
  timing and facing mirroring as the walk strip, so the hat/scarf tracks the
  bob without jitter.
- **FR7 — Overlay consistency (runner).** The Phaser runner layers the
  accessory sprite over Teddy with frame-synced animation using the accessory
  run-strip; no accessory shows for the default onesie or filter-type costume
  (filter applies scene-wide as today).
- **FR8 — Offline.** All new accessory stills and strips are precached
  (manifest updated); the full wardrobe works in airplane mode.

## Non-Functional Requirements

- Zero reading required: icons + live preview carry meaning; no failure
  language on unaffordable taps.
- Touch targets ≥48px; feedback within 300ms; 360px portrait baseline;
  reduced-motion path skips wiggle/celebration motion but keeps sound and
  equip.
- Strict TypeScript; >80% coverage on new/changed logic (`costume.ts`, save
  migration); Biome clean; no network calls.
- Payload stays tiny: WebP strips, sensible precache.

## Acceptance Criteria

1. Fresh install: wardrobe shows 3 locked/affordable states correctly; default
   onesie worn.
2. v1 save (equipped costume) loads as v2 with that costume owned and
   equipped; v1 default loads with empty `owned`. Unit-tested.
3. Buying at exactly-enough stars succeeds; 1 star short leaves the save
   untouched (no negative, no double-charge). Unit-tested.
4. Equip switching among owned items + default works and persists across
   reload.
5. Party Hat and Cozy Scarf visible and stable over idle stills, blink,
   breathing, the walk cycle (both directions), and in the runner.
6. Unaffordable tap: wiggle + boop only; affordable tap: buy + sparkle +
   equip; both respect mute/bedtime.
7. `pnpm check`, `CI=true pnpm test`, e2e wardrobe + offline specs pass.

## Out of Scope

- More costumes, stacking multiple accessories, or accessory + filter combos
  (one item worn at a time)
- Accessories in Bubbles/Puzzle screens (Teddy doesn't appear there)
- Milestone unlocks or any pricing economy changes beyond the two new tiers
- Any backend/accounts/analytics (never)
