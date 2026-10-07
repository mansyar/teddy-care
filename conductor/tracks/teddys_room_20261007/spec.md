# Specification: Teddy's Room

**Track ID:** `teddys_room_20261007` · **Type:** Feature · **Status:** draft

## Overview

Replace the button-based Care screen with **Teddy's Room**: a cozy, explorable
scene where care happens through tappable objects instead of abstract buttons.
Teddy lives in the room, walks to whatever the child taps, and performs the
action on arrival. The room becomes the single home screen for the child —
one warm world, zero reading, everything reachable by tap.

This is the "Track 2" envisioned in `product.md`.

## Functional Requirements

### FR1 — Room replaces the Care screen
- The Care tab becomes Teddy's Room; the button row (feed/wash/rest/pet) is removed.
- Care actions are triggered exclusively through room POIs and tapping Teddy.
- All existing stat logic (`stats.ts`), save persistence, decay, and mood
  derivation are reused unchanged.

### FR2 — Points of interest (POIs)
| POI | Action | Effect |
|---|---|---|
| 🍲 Bowl | Feed | hunger +30, eating face + munch sound |
| 🛏️ Bed | Rest | energy +35, sleepy face + yawn sound |
| 🛁 Tub | Wash | cleanliness +30, bubbles + giggle/water sound |
| 📦 Toy box | Play | navigates to the Runner mini-game |
| 🪞 Closet/mirror | Wardrobe | opens the costume buy/equip UI |

### FR3 — Tap Teddy to pet
- Tapping Teddy himself pets him: squash animation, giggle, happiness +25
  (carries over the MVP's tap interaction).

### FR4 — Movement model: tap floor to roam, tap POI to act
- Tapping open floor walks Teddy to that spot (walk cycle plays).
- Tapping a POI walks Teddy to it, then the action performs automatically on
  arrival (walk → act, one gesture).
- Under `prefers-reduced-motion`, the walk is skipped: Teddy repositions
  instantly but all feedback (face, sound, stat boost) still plays.

### FR5 — The room shows state (mood is the UI)
- Objects reflect stats instead of numeric meters: the bowl visibly empties
  as hunger rises, Teddy looks scruffy when cleanliness is low, droops when
  tired.
- A small star-count chip stays in the top corner (visible progression,
  zero reading).

### FR6 — Signature feedback per POI
- Each POI has distinct arrival feedback reusing existing stills/sounds where
  possible: eating face + munch (bowl), bubbles + water fizz (tub), Zzz +
  sleepy face (bed), hop + star sparkle (toy box), sparkle + giggle (closet).
- New synthesized sounds added to the WebAudio engine: soft footstep ticks
  while walking, munch, water fizz, yawn. All gated by the existing
  `isAudible(settings)` mute/bedtime rules.

### FR7 — Bedtime in the room
- Bed = the existing rest action. When bedtime mode is on, the room dims
  (existing `body.bedtime` staging), the bed glows, Teddy sleeps, and sound
  is silenced — same kindness rules as the MVP, staged in the room.

### FR8 — Navigation simplifies to 2 tabs
- Tab bar: 🐻 Room + 🌙 Parents. The 🏃 Runner tab is removed; the toy box
  navigates to `/runner`.
- Parent screen, routes, and runner screen itself are unchanged.

### FR9 — Responsive portrait + landscape (two art layouts)
- Two generated room backgrounds: a tall portrait composition (360px
  baseline) and a wide landscape composition, selected via orientation.
- POI hit areas and Teddy's walkable floor zone adapt per orientation; walk
  targets use scene coordinates resolved per layout.

### FR10 — Small extras (in scope, low priority)
- Window day/night tint following bedtime mode.
- 1–2 tap easter eggs (rug or toy scatter → wiggle + giggle).

## Non-Functional Requirements

- Tap targets ≥ 48px; POIs tappable by small hands.
- Fully offline after install (PWA precache covers new art).
- `prefers-reduced-motion` respected (FR4).
- No lose states, no timers that punish — decay/care rules untouched.
- Art via the established sprite-gen pipeline; finals + reports committed
  under `assets/teddy/`, runtime copies in `public/teddy/`.
- **Art budget:** 3–4 sprite-gen generations (portrait room, landscape room,
  walk cycle, closet/mirror POI) — approved.

## Acceptance Criteria

1. Room renders as the home tab with bowl, bed, tub, toy box, closet, and
   tap-able Teddy; the old button row is gone.
2. Tapping the bowl walks Teddy there (or instant under reduced motion) and
   hunger increases by the feed boost, with eating face + munch sound.
3. Tapping the bed applies the rest boost; the tub applies wash.
4. Tapping the toy box opens the Runner mini-game; stars earned return to
   the room's star chip.
5. Tapping Teddy pets him (squash + giggle + happiness boost).
6. The closet/mirror opens the wardrobe; buying/equipping a costume still
   works and shows on Teddy.
7. With bedtime on, the room dims, Teddy sleeps, and audio silences.
8. Object-state visuals respond to stat levels (bowl empties as hunger
   falls).
9. Portrait and landscape orientations both render a coherent room layout.
10. Playwright e2e covers: bowl→boost, toy box→runner, bedtime dim, pet
    boost, wardrobe open, both orientations; unit tests cover new logic
    (POI mapping, walk-target resolution, orientation layout choice).
11. App remains fully functional offline (airplane-mode e2e still passes).

## Out of Scope

- Scrollable/pannable rooms, multiple rooms, drag interactions.
- New costumes or a deeper wardrobe (separate track).
- Real music compositions (placeholder loop remains; separate track).
- Puzzle mini-game (separate track).
- Pet collection / additional pets.
