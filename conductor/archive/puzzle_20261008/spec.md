# Spec: Puzzle Pieces — Jigsaw Mini-Game

**Track:** `puzzle_20261008` · **Type:** Feature · **Branch:** `track/puzzle-minigame`

## Overview

The third and final MVP mini-game: **Puzzle Pieces**, a tap-to-place jigsaw. The
toy box mini-menu gains a third 🧩 button leading to `/puzzle`, where Teddy's
pictures come apart into big pieces that go back together by tapping a piece,
then tapping its shadow outline. Three rounds climb gently from 4 to 6 to 9
pieces across three different simple Teddy pictures. Every finished round banks
a star; nothing is ever lost, nothing can fail.

## Functional Requirements

1. **Entry:** the toy box mini-menu (`mini-menu-panel`) gains a third button
   "🧩 Puzzle!" → `navigate("/puzzle")`, aria-label "Play the puzzle game" —
   same dialog pattern as Runner/Bubbles: focus lands on Close, Escape closes.
2. **Round structure:** each round shows one Teddy picture cut into N pieces
   (4 → 6 → 9). Pieces appear in a tray; the board shows the picture's shadow
   outlines (dimmed silhouette slots) in the correct final arrangement.
3. **Placement:** tap a piece (lift + wiggle highlight), then tap an outline
   slot — correct slot: piece glides in with a click; wrong slot: piece shakes
   and glides back with a soft "boop". Placed pieces are no longer tappable.
4. **Round end:** all pieces placed → small celebrate (sparkle + chime),
   "Round 2 of 3!"-style transition, **⭐1 banked immediately** via the shared
   reward flow (+1 star, +10 happiness, same pattern as `awardRun`/`awardBubbles`).
   Between-round card offers "Next round!" and "Done for now" — quitting keeps
   earned stars.
5. **After round 3:** "All done!" card in the established style with
   "Play again!" restarting at round 1.
6. **Art:** three simple Teddy pictures via the sprite-gen pipeline
   (navy-outline picture-book style) → `assets/teddy/` + `public/teddy/` WebP +
   `PRECACHE_ART`. Pieces are cut from the full pictures at runtime via CSS
   background slicing — no per-piece assets.
7. **Sound:** new WebAudio SFX in `sound.ts` — piece pick-up tick, satisfying
   place click, gentle wrong-slot boop — all gated by `isAudible`
   (parent mute/bedtime).
8. **Accessibility parity:** pieces and slots are real Tab-reachable
   `<button>`s (Enter/Space = select/place), ≥48px targets,
   `prefers-reduced-motion` honored (no glide/wiggle/bounce — instant placement
   or simple highlight).

## Non-Functional Requirements

- Offline-playable from precache; no new dependencies; pure React/DOM.
- TDD: piece/round state machine, slicing math, shuffle, and reward flow in
  pure logic modules with >80% coverage (injectable rng for shuffle tests).
- 360px portrait baseline; portrait + landscape layouts.

## Acceptance Criteria

- Toy box menu → 🧩 → full 3-round climb → 3 stars visible in room star chip (e2e).
- Wrong-slot tap bounces back without penalty; leaving after round 1 keeps ⭐1.
- Muted/bedtime → silent play; keyboard-only completable end-to-end;
  reduced-motion honored.
- Offline reload boots `/puzzle` and decodes all three pictures from precache.

## Out of Scope

- Drag & drop; difficulty settings in the parent panel; new POIs;
  save-schema changes; `usePetSave` refactor.
