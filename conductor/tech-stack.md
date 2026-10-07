# Technology Stack — Teddy Care

## Architecture: Hybrid
**React PWA shell + embedded mini-games.** React owns care UI, stats,
persistence, parent panel; Phaser mounts inside the runner route, while
the Bubble Pop tap mini-game is pure React/DOM (2026-10-08, Track 3).

> Versions: use the latest mutually-compatible releases at scaffold time
> (recorded in Track 1's plan). No pinned versions in this doc.

## Frontend
- **React + Vite + TypeScript** — shell, care screen, parent panel
- **Phaser 4** — runner/platformer (consumes `side-run` strip + WebP)
- **CSS:** plain CSS + custom properties (no framework — tiny payload, pastel
  theme); squash/stretch, crossfades, ambient float in CSS/React
- **Idle breathing:** JS mirror of the breathe envelope (`breathe.js`
  algorithm) applied at runtime to emotion stills — zero animation assets

## Game Data & Persistence
- **IndexedDB (local-only)** via lightweight wrapper — stats, stars, costumes,
  settings; no backend, no login
- Timers computed from wall-clock deltas on load (kind offline progression)

## PWA
- **vite-plugin-pwa** — installable, full offline via precached shell +
  assets (stills, strips, audio)
- Responsive 360px portrait baseline → desktop; touch-first

## Audio
- WebAudio: generated/royalty-free music loop + SFX; parent mute persisted;
  bedtime silences

## Tooling & Quality
- **pnpm** — package manager
- **Biome** — lint + format (single binary, replaces ESLint/Prettier)
- **Vitest + Playwright** — component tests + PWA install/offline flows
- Strict TypeScript
- Asset pipeline: sprite-gen outputs land in `assets/teddy/` (strips, WebP,
  stills)

## Explicit Non-Goals
No backend, no accounts, no analytics, no ads/IAP SDKs, no server push.
