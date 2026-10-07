# Specification: Bubble Pop — Tap Mini-Game

Track: `bubble_pop_20261007` · Type: Feature · Branch: `track/tap-minigame`

## Overview
A second mini-game, **Bubble Pop**, fulfilling the tap-game item deferred from
the MVP core loop. Bubbles rise from the tub into a playful tap area; the
child pops them by tapping for stars and joy. Pure React/DOM (no Phaser),
consistent with the existing runner reward pattern and toddler-first design
principles (`product-guidelines.md`).

## Functional Requirements

1. **Entry — toy box mini-menu:** Tapping the toy box POI opens an icon-only
   mini-game chooser (aria-modal, matching the wardrobe dialog pattern)
   listing **Runner** (🏃, existing) and **Bubble Pop** (🫧). Choosing one
   navigates to its route. The existing sparkle-delay/handoff behavior moves
   into the chooser selection.
2. **Gameplay (`/bubbles` route):**
   - Timed round: **30 seconds**, with a gentle icon-based end-of-round cue
     (dimming, no readable countdown required).
   - Bubbles rise from the bottom of the play area at a pace that **gently
     ramps** (slightly faster/smaller as the round progresses).
   - Tapping a bubble **pops** it: pop sound, star burst at the pop point,
     pop counter in the corner.
   - Bubbles that float past the top simply leave — no miss penalty, no lose
     state (kindness principle).
3. **Rewards:** Mirrors the runner model — a pure reward function
   (`1 + floor(pops/8)`, clamped to max **5**, guaranteed minimum 1) applied
   via the existing `award()` flow (+10 happiness), with a joyful
   "All done!" summary card and "Again!" replay button.
4. **Art:** Bubble sprite via the **sprite-gen pipeline**, landing in
   `assets/teddy/` → `public/teddy/`, and added to `PRECACHE_ART`.
5. **Sound:** New WebAudio-synthesized **pop** SFX added to `sound.ts`,
   gated by the existing parent mute/bedtime rules.
6. **Accessibility (full parity):**
   - `prefers-reduced-motion`: bubbles appear in place (no rising
     animation); taps still pop.
   - Bubbles are real `<button>` targets reachable by Tab; Enter/Space pops;
     hit targets ≥ 48px.

## Non-Functional Requirements
- **Offline:** fully playable from precache; no network calls.
- **Payload:** one small sprite sheet (WebP where possible); no new
  dependencies.
- **Performance:** 60fps via CSS transforms; rAF/CSS animation only.
- **TDD:** reward math, ramp pacing, and round-timer logic unit-tested
  (>80% coverage); screens verified via Playwright + manual checks per
  `workflow.md`.

## Acceptance Criteria
- Toy box opens the mini-menu; both games reachable; back-navigation works.
- A full 30s round completes → summary card → stars banked → visible in the
  room's star chip (e2e-verified).
- Muted/bedtime: no sounds. Reduced-motion: no rising animation.
- A keyboard-only user can play a round end-to-end.

## Out of Scope
- Puzzle mini-game (future track).
- Any save-schema changes; `usePetSave` refactor.
- New POIs or room art changes beyond the chooser.
- Difficulty settings in the parent panel.
