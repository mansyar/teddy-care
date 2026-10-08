# Plan — Real Music & Audio Polish

> Spec: [spec.md](./spec.md) · Workflow: [`conductor/workflow.md`](../../workflow.md)
> TDD for all logic-bearing tasks (Red → Green → Refactor). Presentational
> composition details verified via Playwright/manual checks.

## Phase 1: Audio Engine Core (scheduler + switching state)

- [x] Task: Write failing tests for the pure music scheduler (Red) (3c17871)
  - Scheduler starts/stops loops; rapid theme switches never stack two loops
  - Fade-in/fade-out state machine (~1s crossfade, no gap)
  - Suspend/clean-restart behavior (mute → unmute resumes in sync)
- [x] Task: Implement the pure `MusicScheduler` engine (Green) — clock-agnostic, callbacks injected, no WebAudio dependency (3c17871)
- [ ] Task: Wire the engine into WebAudio (`startMusic`/`stopMusic` preserve their signatures; lookahead scheduling on the AudioContext clock, no `setInterval` timing loop)
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 2: Theme Library (five composed loops)

- [ ] Task: Write failing tests for theme resolution (Red) — route → theme mapping, bedtime → lullaby override, unknown routes → room theme
- [ ] Task: Implement pure theme definitions (note sequences, chords, tempos, per-voice volumes as data)
- [ ] Task: Write failing tests + implement synthesis voices (pluck/pad, arpeggio, noise shimmer, percussion) — envelope/clamp logic unit-tested
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 3: App Integration (hook, crossfade, unlock)

- [ ] Task: Write failing tests for the `useScreenMusic` hook (Red) — current route + bedtime + settings resolve to exactly one active theme; mute silences without tearing down state
- [ ] Task: Implement the hook and mount it in `App.tsx` (Parent panel keeps last theme — FR3)
- [ ] Task: Wire first-gesture unlock (one-time tap/keydown listener; no UI)
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 4: SFX Richness & Docs

- [ ] Task: Layer richer textures into existing SFX (call sites untouched; recognizable signatures kept; mute/bedtime gating unchanged)
- [ ] Task: Sync docs — `product.md` shipped section, `tech-stack.md` audio note
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 5: E2E, Quality Gates & Polish

- [ ] Task: Playwright e2e — mute silences all + persists; bedtime plays soft lullaby; theme continuity across navigation; offline parity
- [ ] Task: Full quality gates — `pnpm check`, `CI=true pnpm test`, coverage >80% on new logic modules, 360px portrait manual pass
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)
