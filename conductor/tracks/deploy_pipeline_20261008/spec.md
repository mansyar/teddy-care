# Spec: Deployment Pipeline (teddy-care)

## Overview

Ship Teddy Care from a local-only repo to a continuously-deployed public site:
a public GitHub repo, Actions CI on every PR and push to `main`, and automatic
deployment of green `main` builds to Cloudflare Pages at
`https://teddy-care.pages.dev`. No game code changes — everything ships as-is.

## Decisions (locked with user)

- Hosting: **Cloudflare Pages**, project `teddy-care`, `pages.dev` only, no
  custom domain, **no PR preview deploys**
- Repo: **public** `mansyar/teddy-care` (conductor/ planning docs ship
  publicly too — accepted)
- Guard: `main` requires **PR + green CI** (branch protection, no direct
  pushes)
- Deploy wiring: **wrangler-action** in the workflow; secrets set by the user
  via `gh secret set` so the token never touches chat or the repo
- CI runs the full gate: `pnpm check`, unit tests, Playwright e2e, build
- No Cloudflare account setup needed (user has one, ready)

## Functional Requirements

1. **FR1 — Remote**: create public repo `mansyar/teddy-care`, add as
   `origin`, push `main` with full history.
2. **FR2 — Workflow** (`.github/workflows/ci-deploy.yml`), triggered on
   `pull_request` + `push` to `main`:
   - **verify job**: checkout → pnpm + Node 24 (cached) →
     `pnpm install --frozen-lockfile` → `pnpm check` → unit tests → Playwright
     browsers (cached) → e2e → `pnpm build`
   - **deploy job**: `needs: verify`, runs **only on `main` pushes** →
     wrangler-action `pages deploy dist --project-name teddy-care`
3. **FR3 — Concurrency**: new pushes cancel superseded in-progress runs.
4. **FR4 — Branch protection**: `main` requires the `verify` check to pass
   before merge; direct pushes rejected.
5. **FR5 — Secrets**: `CLOUDFLARE_API_TOKEN` (Pages: Edit scope) +
   `CLOUDFLARE_ACCOUNT_ID` set via `gh secret set` commands handed to the
   user; if secrets are missing, CI still passes but the deploy job fails
   loudly with a clear message.
6. **FR6 — Docs**: README documents the pipeline + live URL; repo hygiene
   check (nothing sensitive in history) before the first public push.

## Non-Functional Requirements

- Zero game-source changes; the deployed bundle is exactly what
  `pnpm build` produces locally today.
- Pipeline duration target: under ~8 minutes end-to-end.
- PWA/offline behavior unaffected (root base path on `pages.dev`; HashRouter
  already avoids SPA-routing issues).

## Acceptance Criteria

- [ ] A PR against `main` runs the `verify` job and reports green.
- [ ] Direct pushes to `main` are rejected by branch protection.
- [ ] Merging a PR → pipeline green → `https://teddy-care.pages.dev` serves
      the game (installable, works offline).
- [ ] A red pipeline never deploys.
- [ ] README documents the pipeline and live URL.

## Out of Scope

PR preview deploys, custom domains, release tags/versioning, staging
environment, Lighthouse/budget checks, issue templates.
