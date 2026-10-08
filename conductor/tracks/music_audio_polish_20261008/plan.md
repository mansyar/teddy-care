# Plan — Real Music & Audio Polish

> Spec: [spec.md](./spec.md) · Workflow: [`conductor/workflow.md`](../../workflow.md)
> TDD for all logic-bearing tasks (Red → Green → Refactor). Presentational
> composition details verified via Playwright/manual checks.

## Phase 1: Audio Engine Core (scheduler + switching state) [checkpoint: fc9540d]

- [x] Task: Write failing tests for the pure music scheduler (Red) (3c17871)
  - Scheduler starts/stops loops; rapid theme switches never stack two loops
  - Fade-in/fade-out state machine (~1s crossfade, no gap)
  - Suspend/clean-restart behavior (mute → unmute resumes in sync)
- [x] Task: Implement the pure `MusicScheduler` engine (Green) — clock-agnostic, callbacks injected, no WebAudio dependency (3c17871)
- [x] Task: Wire the engine into WebAudio (`startMusic`/`stopMusic` preserve their signatures; lookahead scheduling on the AudioContext clock, no `setInterval` timing loop) (fc9540d)
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 2: Theme Library (five composed loops) [checkpoint: cc03560]

- [x] Task: Write failing tests for theme resolution (Red) — route → theme mapping, bedtime → lullaby override, unknown routes → room theme (9862d0a)
- [x] Task: Implement pure theme definitions (note sequences, chords, tempos, per-voice volumes as data) (9862d0a)
- [x] Task: Write failing tests + implement synthesis voices (pluck/pad, arpeggio, noise shimmer, percussion) — envelope/clamp logic unit-tested (cc03560)
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 3: App Integration (hook, crossfade, unlock)

- [x] Task: Write failing tests for the `useScreenMusic` hook (Red) — current route + bedtime + settings resolve to exactly one active theme; mute silences without tearing down state (00f207b)
- [x] Task: Implement the hook and mount it in `App.tsx` (Parent panel keeps last theme — FR3) (2757218, 39aebb8)
- [x] Task: Wire first-gesture unlock (one-time tap/keydown listener; no UI) — realized inside the hook from Task 3.1; verified in e2e (2757218)
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 4: SFX Richness & Docs

- [ ] Task: Layer richer textures into existing SFX (call sites untouched; recognizable signatures kept; mute/bedtime gating unchanged)
- [ ] Task: Sync docs — `product.md` shipped section, `tech-stack.md` audio note
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 5: E2E, Quality Gates & Polish

- [ ] Task: Playwright e2e — mute silences all + persists; bedtime plays soft lullaby; theme continuity across navigation; offline parity
- [ ] Task: Full quality gates — `pnpm check`, `CI=true pnpm test`, coverage >80% on new logic modules, 360px portrait manual pass
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)
