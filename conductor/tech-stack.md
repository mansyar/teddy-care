# Technology Stack — Teddy Care

## Architecture: Hybrid
**React PWA shell + embedded mini-games.** React owns care UI, stats,
persistence, parent panel; Phaser mounts inside the runner route, while the
Bubble Pop tap and Puzzle Pieces jigsaw mini-games are pure React/DOM
(2026-10-08, Tracks 3–4).

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
- **IndexedDB (local-only)** via lightweight wrapper — stats, stars, owned +
  worn costumes, settings; versioned save schema with migration on load;
  no backend, no login
- Timers computed from wall-clock deltas on load (kind offline progression)
- Single save owner: one `PetSaveProvider` React context owns the sole
  `usePetSave()` instance for the whole tree (screens + settings consume
  context — no per-screen forks); stars clamped to non-negative integers
  at the persistence boundary (added 2026-10-08, Save Integrity track)

## PWA
- **vite-plugin-pwa** — installable, full offline via precached shell +
  assets (stills, strips, audio)
- Responsive 360px portrait baseline → desktop; touch-first

## Audio
- WebAudio: composed per-screen music themes + SFX, all synthesized (zero
  audio assets, fully offline); a pure lookahead `MusicScheduler` loops
  8–16 bar themes on the AudioContext clock with ~1s crossfades between
  screens; richer SFX via sub-octave shadows + noise textures; first
  tap/keypress unlocks playback (no UI); parent mute persisted (silences
  all), bedtime swaps in a soft lullaby instead of silencing

## Tooling & Quality
- **pnpm** — package manager
- **Biome** — lint + format (single binary, replaces ESLint/Prettier)
- **Vitest + Playwright** — component tests + PWA install/offline flows
- **jsdom + @testing-library/react** (dev-only, added 2026-10-08 for the
  Save Integrity track) — lets Vitest render React trees so provider/context
  wiring can be unit-tested (single save owner across consumers)
- Strict TypeScript
- Asset pipeline: sprite-gen outputs land in `assets/teddy/` (strips, WebP,
  stills)

## Deployment
- **Hosting:** Cloudflare Pages (project `teddy-care` →
  https://teddy-care.pages.dev), deployed via wrangler direct upload — the
  only deploy path (duplicate Cloudflare Git integration disconnected
  2026-10-08)
- **CI/CD:** GitHub Actions (`.github/workflows/ci-deploy.yml`, repo
  github.com/mansyar/teddy-care) — every push/PR runs the full gate
  (`pnpm check`, unit, build, Playwright e2e serving the fresh `dist/`);
  a green `main` push auto-deploys; `main` is protected (PR + `verify`
  check required)
- **Secrets:** repo secrets `CLOUDFLARE_API_TOKEN` (Pages: Edit) +
  `CLOUDFLARE_ACCOUNT_ID`; the deploy step fails loudly if either is
  missing
- **pnpm 12 builds:** `pnpm-workspace.yaml` `allowBuilds` approves the
  `esbuild`/`workerd` install scripts (wrangler deps) — otherwise pnpm 12
  fails installs with `ERR_PNPM_IGNORED_BUILDS`

## Explicit Non-Goals
No backend, no accounts, no analytics, no ads/IAP SDKs, no server push.
