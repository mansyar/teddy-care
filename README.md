# Teddy Care 🐻

An offline-first PWA pet-raising game for young children. Feed, wash, rest,
and pet **Teddy** — a cartoon bear in a blue-and-white striped onesie — and
he loves you back with expressive faces, breathing idle motion, and playful
reactions. Free forever: no ads, no accounts, zero tracking.

- **Audience:** children ages 4+ (tap-first, zero reading) and their parents
- **Screens:** Care (home) · Mini-games: Runner, Bubble Pop & Puzzle · Wardrobe (costume closet) · Parent panel (mute, bedtime, reset)
- **Offline:** full PWA — install it, use airplane mode, everything still works

## Tech Stack

- **React 19 + Vite + TypeScript** (strict) — app shell, care UI, parent panel
- **Phaser 4** — runner mini-game (mounted per run inside the React shell)
- **Pure React/DOM** — Bubble Pop + Puzzle Pieces mini-games (CSS sprites/animations)
- **Plain CSS** with custom properties — pastel theme, tiny payload
- **IndexedDB** (local-only, versioned with migration) — stats, stars, owned + worn costumes, settings
- **vite-plugin-pwa** — installable, offline via precache
- **WebAudio** — synthesized SFX + music loop (zero audio assets)
- **pnpm · Biome · Vitest · Playwright** — tooling & quality

## Getting Started

```sh
pnpm install
pnpm dev        # dev server
pnpm build      # type-check + production build
pnpm preview    # serve the production build
```

## Testing & Checks

```sh
pnpm check      # Biome lint/format + tsc
pnpm test       # Vitest unit tests (logic modules)
pnpm test:e2e   # Playwright flows (care, mini-games, offline, settings)
```

## Live & Deployment

**https://teddy-care.pages.dev** — deployed automatically on every merge to
`main`.

- **Pipeline** (`.github/workflows/ci-deploy.yml`): every push and PR runs
  the full gate — `pnpm check`, unit tests, production build, Playwright
  e2e (serving the freshly built `dist/`). On `main` pushes, a passing
  pipeline deploys `dist/` to Cloudflare Pages (`teddy-care`) via wrangler.
- **Repo hygiene**: `main` is protected — changes land through PRs and only
  with a green `verify` check.
- **Setup (one-time)**: repository secrets `CLOUDFLARE_API_TOKEN`
  (Account → Cloudflare Pages → Edit) and `CLOUDFLARE_ACCOUNT_ID`, plus a
  Pages project `teddy-care` (`wrangler pages project create teddy-care
  --production-branch=main`).
- **pnpm 12 note**: `pnpm-workspace.yaml` `allowBuilds` approves the build
  scripts of `esbuild` and `workerd` (wrangler dependencies); pnpm 12 fails
  installs with `ERR_PNPM_IGNORED_BUILDS` otherwise.

## Project Structure

```
src/
  screens/    RoomScreen, RunnerScreen, BubblesScreen, PuzzleScreen, ParentScreen (React glue)
  room/      layout, walk→act controller, object-state mapping
  pet/        Pure game logic: stats, mood, breathe, stars, costume catalog, bubbles, puzzle, settings
  save/       IndexedDB persistence
  game/       Phaser runner mounting (runGame.ts)
  audio/      WebAudio SFX + music
  pwa/        Manifest / precache list
public/teddy/ Runtime art (stills, run strip, bubble sprite, puzzle pictures)
assets/teddy/ Asset-pipeline outputs (source stills, reports, previews)
conductor/    Project docs & track history (Conductor workflow)
```

## Asset Pipeline

Teddy's art is generated with the local `sprite-gen` tooling. Emotion stills
and the 15-frame run strip land in `assets/teddy/` and are copied into
`public/teddy/` for the app. `bake_breathe_preview.py` bakes the idle
breathing preview GIF; at runtime the same breathe envelope is mirrored in
`src/pet/breathe.ts` so no animation assets are needed.

## Documentation

Product definition, tech stack, guidelines, and the track registry live in
[`conductor/`](conductor/index.md).
