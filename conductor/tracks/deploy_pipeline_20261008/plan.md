# Implementation Plan: Deployment Pipeline (teddy care)

> Conventions: `[ ]` todo, `[~]` in progress, `[x]` done. Each completed
> task records its commit SHA. Infra track — verification is observational
> (real runs/URLs), not TDD.

## Phase 1: Public repo & remote

- [ ] Task: Pre-push hygiene
  - [ ] History scan for secrets/personal data before going public
  - [ ] Verify `.gitignore` covers `dist/`, `coverage/`, local artifacts
- [ ] Task: Create public repo `mansyar/teddy-care` via `gh`, wire as
      `origin`, push `main` with full history
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)
  - [ ] Repo live on GitHub; push clean

## Phase 2: CI & deploy workflow

- [ ] Task: Write `.github/workflows/ci-deploy.yml`
  - [ ] `verify` job: pnpm + Node 24 with lockfile cache →
        `pnpm install --frozen-lockfile` → `pnpm check` → unit → Playwright
        browsers (cached) → e2e → `pnpm build`
  - [ ] `deploy` job: `needs: verify`, `main`-push-only, wrangler-action
        `pages deploy dist --project-name teddy-care`
  - [ ] Concurrency group (cancel superseded runs)
- [ ] Task: Push workflow to `main` (before protection is enabled) and
      confirm the run executes
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)
  - [ ] Actions run visible; deploy job fails loudly on missing secrets
        (FR5 proof)

## Phase 3: Secrets, protection & first production deploy

- [ ] Task: Hand the user exact `gh secret set` commands; user creates the
      Cloudflare API token (Pages: Edit) + Account ID
- [ ] Task: Enable branch protection on `main` (require `verify` check + PR)
- [ ] Task: End-to-end proof — open a real PR (docs tweak) → CI green →
      merge → deploy runs → verify `https://teddy-care.pages.dev` serves the
      playable, installable, offline-capable game
- [ ] Task: README — document pipeline + live URL
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)
