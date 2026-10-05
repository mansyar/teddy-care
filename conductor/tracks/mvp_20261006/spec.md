# Track Spec — MVP: Teddy Care Initial Implementation

## Overview
Scaffold the full offline-first PWA and ship the first playable: single-screen
care loop for Teddy plus the runner mini-game. Tap + puzzle games, Teddy's
Room, and collection are explicitly follow-up tracks. Success = installed on a
real phone, playable offline, and the son completes the care loop + a runner
run unaided.

## Functional Requirements

### PWA Shell & Scaffold
- Vite + React + TS app, pnpm, Biome, strict TS; latest compatible versions
- `vite-plugin-pwa`: installable, full offline (shell + art + audio precached)
- Routing: care screen (home), runner, parent panel
- Responsive 360px portrait baseline → desktop; touch-first, ≥48px targets

### Care Loop
- Teddy centered: base still + blink swap (3–5s), runtime breathe (depth 0.06,
  2 breaths / 2s), ambient float, tap → squash + giggle + happy flash
- 4 stats (hunger, happiness, energy, cleanliness), gentle default decay over
  hours (wall-clock deltas on load; kind — sad face, never punishment)
- 4 care actions (feed / wash / rest / pet): icon buttons, visible feedback
  <300ms, face swaps (eating during feed, happy after, sad when low, sleepy in
  bedtime/low energy)
- Idle events every 20–40s (hop/spin/sneeze via transform + face flash)

### Progression
- Stars earned from care + runner; ONE unlockable costume proving the loop
  (accessory overlay or recolor — no per-face redraws)
- Star balance persisted in IndexedDB

### Runner Mini-Game (Phaser)
- Embedded Phaser scene consuming the accepted 15-frame run strip
  (`assets/teddy/run-set/side-run-asfilmed/`)
- Simple auto-run/jump (one-button, toddler-safe), stars for distance; no lose
  state — run ends happily, rewards always
- Works offline from precache

### Audio
- Placeholder music loop + SFX set (WebAudio), parent mute persisted,
  bedtime silences + dims everything

### Parent Panel
- Mute toggle, bedtime mode toggle, reset-save; no PIN in MVP

### Persistence
- IndexedDB local-only: stats, stars, costume, settings, wall-clock timestamp
- Fresh install → healthy happy Teddy; corrupted save → safe reset, never crash

## Non-Functional Requirements
- 60fps care UI on mid-range phones; tiny install payload (art as-is)
- Zero network calls at runtime; zero analytics (COPPA-safe)
- Vitest for logic-bearing code (>80% on touched logic modules);
  presentational verified via Playwright + manual
- Biome clean, strict TS, JSDoc on public functions

## Acceptance Criteria
1. `pnpm check && CI=true pnpm test` green; Playwright offline/install flows pass
2. Installed on a real phone; airplane mode → full care loop + runner work
3. Son (4) completes feed→happy→star and one runner run unaided
4. Bedtime: one tap silences + dims; mute persists across reloads
5. Neglect for hours → sad Teddy, still fully recoverable in one session

## Out of Scope
- Tap + puzzle mini-games (follow-up tracks)
- Teddy's Room wander mode, pet collection, extra costumes
- PIN gate, accounts, backend, analytics, ads/IAP
