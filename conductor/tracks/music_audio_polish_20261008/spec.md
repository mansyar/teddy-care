# Spec — Real Music & Audio Polish

## Overview
Replace the placeholder audio layer with a real, fully synthesized soundtrack.
Each screen gets its own composed WebAudio loop matching its mood, a soft
lullaby scores bedtime, transitions crossfade gently, and existing SFX layer
on top. Zero audio assets, zero payload growth, offline forever. Call sites
(`play*`, `startMusic`, `stopMusic`) keep working unchanged.

## Functional Requirements

**FR1 — Five composed themes (pure WebAudio):**

| Context | Mood | Character |
|---|---|---|
| Room (home) | Gentle | Soft music-box: plucks + warm pad, slow tempo |
| Runner | Bouncy | Upbeat staccato arpeggio, light percussion |
| Bubbles | Watery sparkle | Light pentatonic blips, airy noise shimmer |
| Puzzle | Calm curious | Mellow marimba-like tones, unhurried |
| Bedtime | Lullaby | Very soft, slow; quietest of all themes |

**FR2 — Seamless looping:** each theme is a composed 8–16 bar phrase, looped
via a lookahead scheduler (scheduled ahead on the AudioContext clock — no
`setInterval`-in-the-loop timing, no drift, no gaps).

**FR3 — Per-screen playback:** exactly one theme plays per screen: Room ↔
room/bedtime; `/runner`, `/bubbles`, `/puzzle` ↔ their themes; the Parent
panel keeps whatever theme was last playing (no jarring switch in a settings
screen).

**FR4 — Crossfade transitions:** switching themes fades out the old (~1s)
while fading in the new — no clicks, no abrupt cuts, no silence gap.

**FR5 — Autoplay unlock:** music starts on the child's first tap/keypress
anywhere (browser gesture requirement); no prompts, no extra UI. Before
unlock, the app is simply quiet.

**FR6 — SFX layering:** all existing SFX play on top of the theme, unchanged
call sites; themes keep playing underneath (no ducking in this track).
Existing SFX may gain richer layering (harmonics/noise texture) while staying
recognizable.

**FR7 — Parent controls unchanged:** the existing single `muted` switch
silences music + SFX; `bedtime` swaps the theme for the lullaby (in the room)
and keeps everything soft. Both still persist via the save. `isAudible`
remains the single authoritative gate.

**FR8 — Suspend behavior:** when muted or backgrounded, loops stop cleanly
and restart in sync when audible again; no orphaned scheduled notes.

## Non-Functional Requirements
- **Zero assets:** all sound synthesized at runtime; no audio files, no
  network, no payload growth.
- **Performance:** scheduling work is negligible (a few seconds of lookahead);
  no jank on 360px mid-range devices; no audible glitches.
- **Volume discipline:** music sits under SFX in the mix; lullaby noticeably
  quieter than the room theme; nothing startles a 4-year-old.
- **Offline honesty:** works identically offline and online.
- **Architecture:** pure/testable scheduler + theme-selection logic separated
  from WebAudio wiring (mirrors the codebase's pure-engine pattern); strict
  TypeScript, JSDoc on public functions, Biome-clean.

## Acceptance Criteria
1. Each screen plays its own distinct theme; navigating crossfades between
   them (~1s).
2. Bedtime plays a very soft lullaby instead of silencing; toggling bedtime
   off restores the normal theme.
3. Parent mute silences everything, persists across reloads; unmuting
   restores the current screen's theme.
4. Music begins on the first user gesture without any visible UI.
5. Loops run continuously without drift, gaps, or overlapping notes;
   switching screens rapidly never stacks themes.
6. Existing SFX unchanged in call sites and still respect mute/bedtime.
7. Unit tests cover theme selection, crossfade/scheduler state logic, and
   mute/bedtime gating (>80% on new logic modules); Playwright e2e verifies
   mute/bedtime behavior and theme continuity across navigation.
8. `pnpm check` and the full test suite pass.

## Out of Scope
- Per-POI or event-specific musical stingers (beyond existing SFX).
- Ducking/sidechain behavior for SFX moments.
- Separate music/SFX toggles or volume sliders in the parent panel.
- Audio asset files, external music libraries, or licensing.
- Day/night real-clock theming (candidate for a future Day-Night track).
