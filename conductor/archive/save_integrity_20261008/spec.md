# Spec — Save Integrity: single source of truth for pet state

**Track ID:** `save_integrity_20261008` · **Type:** Bug fix / hardening

## Overview & Problem

`usePetSave()` is instantiated independently in five places (`App.tsx` via
`useSettings`, `RoomScreen` directly, and once per mini-game screen). Each
instance loads IndexedDB separately, applies wall-clock decay, and persists
**from its own React state fork**. The Shell's instance keeps a stale
app-start snapshot — toggling mute/bedtime in the parent panel writes that
stale save back (`src/pet/usePetSave.ts:118-125`), erasing stars/stats the
child earned during the session. Additionally, `saveSave` validation accepts
any finite number for `stars` (negatives and floats pass unclamped).

## Functional Requirements

1. **Single save owner:** a `PetSaveProvider` (React context) mounted once in
   `App.tsx` owns the only `usePetSave()` instance; all screens (`Room`,
   `Runner`, `Bubbles`, `Puzzle`, `Parent`) and `useSettings` consume it via
   context — no component creates its own instance.
2. **Star clamping:** `saveSave`/`migrateSave` clamp stars to a non-negative
   integer at the persistence boundary.
3. **Regression proof (e2e):** earn stars in the room → toggle mute in the
   parent panel → reload → stars survive. Plus a parent-panel **two-tap
   reset** e2e (currently an untested destructive flow).

## Non-Functional Requirements

- Zero visual/behavioral change for the child.
- Render-first/persist-background feedback stays under 300ms.
- Offline behavior unchanged; save schema stays v2 (clamping happens at
  load/save; no migration bump required).

## Acceptance Criteria

- Exactly **one** IndexedDB load per app session (no multi-instance decay
  races).
- Parent-panel settings toggles can never revert stats/stars (proven by e2e).
- Stars are always integers ≥ 0 after any load or save.
- Parent reset e2e: two-tap arming → reset wipes progress and settings.
- `pnpm check`, `CI=true pnpm test` (with >80% coverage on touched logic
  modules), and `pnpm test:e2e` all pass.

## Out of Scope

Star economy balance (cooldowns/caps), welcome-back moment, debounced DB
writer, payload slimming — candidates for later tracks.
