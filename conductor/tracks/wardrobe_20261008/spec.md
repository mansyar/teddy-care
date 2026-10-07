# Spec: Wardrobe Expansion — tiered costume closet with free switching

**Track:** `wardrobe_20261008` · Type: Feature · Branch: `track/wardrobe-expansion`
**Rev 2 (2026-10-08):** accessory-overlay direction replaced by CSS-filter
recolors after user review rejected the generated overlay art. See History.

## Overview

Grow the closet from a single permanent costume into a small, joyful wardrobe:
Teddy's blue-striped onesie (default), the existing **Sunset Onesie** (10⭐),
and two **new filter recolors** — 🌿 **Mint Dream** (20⭐) and 🫐 **Berry
Night** (30⭐) — rendered with CSS filters, exactly like the Sunset Onesie.
After purchase, any owned item can be worn again at any time (free switching,
including back to the default onesie). Because a filter recolor tints Teddy
scene-wide, every costume is automatically consistent across the idle room,
the walk cycle, and the runner with no extra art.

## Functional Requirements

- **FR1 — Costume catalog.** `COSTUMES` grows to three entries, all
  `kind: "filter"`: `sunset-onesie` 10⭐ (existing), `mint-dream` 20⭐,
  `berry-night` 30⭐. Pure data in `costume.ts`, prices centralized in
  `stars.ts`, TDD-covered.
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
- **FR5 — Scene-wide consistency.** The equipped costume's CSS filter applies
  to the Teddy sprite everywhere it appears (idle room, walk cycle, runner),
  reusing the existing Sunset Onesie mechanism. No per-scene overlay work.
- **FR6 — Offline.** No new art assets are required; the existing precache
  list is unchanged and the full wardrobe works in airplane mode.

## Non-Functional Requirements

- Zero reading required: icons + live preview carry meaning; no failure
  language on unaffordable taps.
- Touch targets ≥48px; feedback within 300ms; 360px portrait baseline;
  reduced-motion path skips wiggle/celebration motion but keeps sound and
  equip.
- Strict TypeScript; >80% coverage on new/changed logic (`costume.ts`, save
  migration); Biome clean; no network calls.
- Payload stays tiny: this revision adds zero bytes of art.

## Acceptance Criteria

1. Fresh install: wardrobe shows 3 locked/affordable states correctly; default
   onesie worn.
2. v1 save (equipped costume) loads as v2 with that costume owned and
   equipped; v1 default loads with empty `owned`. Unit-tested.
3. Buying at exactly-enough stars succeeds; 1 star short leaves the save
   untouched (no negative, no double-charge). Unit-tested.
4. Equip switching among owned items + default works and persists across
   reload.
5. Mint Dream and Berry Night tint Teddy consistently in the idle room, walk
   cycle (both directions), and the runner; the default onesie applies no
   filter.
6. Unaffordable tap: wiggle + boop only; affordable tap: buy + sparkle +
   equip; both respect mute/bedtime.
7. `pnpm check`, `CI=true pnpm test`, e2e wardrobe + offline specs pass.

## Out of Scope

- More costumes, stacking multiple accessories, or accessory + filter combos
  (one item worn at a time)
- Overlay/accessory sprite art (rejected in user review; may return as its own
  future track with a different art direction)
- Milestone unlocks or any pricing economy changes beyond the two new tiers
- Any backend/accounts/analytics (never)

## History

- Rev 1: accessory overlay art (Party Hat 20⭐, Cozy Scarf 30⭐) with companion
  walk/run strips. Art was generated and baked end-to-end, then rejected at
  the Phase 3 checkpoint ("accessories path will not work"); reverted in
  `c653d77` and re-scoped to filter recolors with user approval.
