# Implementation Plan: Deployment Pipeline (teddy care)

> Conventions: `[ ]` todo, `[~]` in progress, `[x]` done. Each completed
> task records its commit SHA. Infra track — verification is observational
> (real runs/URLs), not TDD.

## Phase 1: Public repo & remote

- [x] Task: Pre-push hygiene
  - Secrets scan clean (sprite-gen usage reports only); .gitignore verified
  - Personal email rewritten to mansyar@users.noreply.github.com across all 227 commits (filter-branch, pre-push so safe); 73 git notes re-attached to rewritten SHAs; old objects pruned (verified: pre-rewrite SHAs no longer resolve)
  - [x] History scan for secrets/personal data before going public
  - [x] Verify `.gitignore` covers `dist/`, `coverage/`, local artifacts
- [x] Task: Create public repo `mansyar/teddy-care` via `gh`, wire as
      `origin`, push `main` with full history
  - Repo live at https://github.com/mansyar/teddy-care; `main`, `deploy-pipeline`, and `refs/notes/commits` pushed
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)
  - [ ] Repo live on GitHub; push clean

## Phase 2: CI & deploy workflow

- [x] Task: Write `.github/workflows/ci-deploy.yml`
  - [x] `verify` job: pnpm + Node 24 with lockfile cache→
        `pnpm install --frozen-lockfile` → `pnpm check` → unit → Playwright
        browsers (cached) → e2e → `pnpm build`
  - [x] `deploy` job: `needs: verify`, `main`-push-only, wrangler-action
        `pages deploy dist --project-name teddy-care`
        (deviation: implemented as one sequential job with a conditional
        deploy step — deploy runs only after every verify step passed on a
        push to main; same guarantee, simpler graph. wrangler-action was
        replaced by repo-pinned wrangler 4.148.0 + `pnpm-workspace.yaml`
        allowBuilds after ERR_PNPM_IGNORED_BUILDS on pnpm 12)
  - [x] Concurrency group (cancel superseded runs)
- [x] Task: Push workflow to `main` (before protection is enabled) and
      confirm the run executes
  - 3 CI runs observed: (1) exposed e2e reload-vs-IDB-write race — fixed
    with label-flip waits + 500ms settle; (2) exposed wrangler-action
    pnpm-12 build-approval failure — fixed via repo-pinned wrangler;
    (3) verify fully green, deploy fails loudly with wrangler's missing-
    CLOUDFLARE_API_TOKEN error — the FR5 by-design proof
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)
  - [ ] Actions run visible; deploy job fails loudly on missing secrets
        (FR5 proof)

## Phase 3: Secrets, protection & first production deploy

- [x] Task: Hand the user exact `gh secret set` commands; user creates the
      Cloudflare API token (Pages: Edit) + Account ID
  - Secrets set by user via gh secret set; Pages project created via
    `wrangler pages project create teddy-care --production-branch=main`
    (second attempt — first deploy failed with "project does not exist")
- [x] Task: Enable branch protection on `main` (require `verify` check + PR)
  - strict + context `verify`, 1 approval, force-push/deletion blocked,
    `enforce_admins: false` (solo admin can bypass with `gh pr merge --admin`)
- [x] Task: End-to-end proof — open a real PR (docs tweak) → CI green →
      merge → deploy runs → verify `https://teddy-care.pages.dev` serves the
      playable, installable, offline-capable game
  - PR #1 (docs + e2e settle fix): first CI run exposed the same
    fire-and-forget write race in settings-persist.spec (fixed with the
    proven settle pattern); re-run green; merged with --admin; deploy run
    37751461593 success; site returns 200 with Teddy Care + sw.js
- [x] Task: README — document pipeline + live URL
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md)
  [checkpoint: 77cbd41]
  - Automated: run 37751461593 all steps success (check, 217 unit, 28 e2e,
    build, deploy); site 200 + sw.js served
  - Manual: user confirmed live game plays (care/mini-games/wardrobe), PWA
    installs, offline reload works; duplicate Cloudflare Git integration
    disconnected — Actions+wrangler is the single deploy path
