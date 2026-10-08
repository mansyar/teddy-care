/**
 * The theme library: five composed loops as pure data, plus the resolver
 * that picks exactly one active theme from the current route and the
 * parent settings. Bedtime always wins with the lullaby; anything
 * unrouteable lands on the room theme.
 *
 * Voices are named, not wired: `voice` only says which synthesizer plays
 * the note (see `voices.ts`), so this module stays testable without
 * WebAudio. Tempo lives in the note grid itself — a theme's `loopS` is
 * the bar length its notes tile over, and the scheduler loops them
 * seamlessly.
 */
import type { ScheduledNote } from "./scheduler";

/** Which synthesizer voice plays a note. */
export type VoiceName =
	| "pluck"
	| "pad"
	| "arpeggio"
	| "shimmer"
	| "percussion"
	| "marimba";

/** A theme note: when it lands in the loop, and how its voice plays it. */
export type ThemeNote = ScheduledNote & { voice: VoiceName };

import type { Theme } from "./scheduler";

/** A composed loop: notes tile over `loopS` seconds, forever. */
export type ComposedTheme = Theme & { notes: ThemeNote[] };

const p = (
	offsetS: number,
	frequency: number,
	durationS: number,
	volume: number,
	voice: VoiceName,
): ThemeNote => ({ offsetS, frequency, durationS, volume, voice });

/** The room's own theme: gentle music-box plucks over a soft pad. */
const room: ComposedTheme = {
	id: "room",
	loopS: 7.68,
	gain: 1,
	notes: [
		p(0, 523.25, 0.9, 0.05, "pluck"),
		p(0.96, 659.25, 0.9, 0.05, "pluck"),
		p(1.92, 783.99, 0.9, 0.05, "pluck"),
		p(2.88, 659.25, 0.9, 0.05, "pluck"),
		p(3.84, 587.33, 0.9, 0.05, "pluck"),
		p(4.8, 523.25, 0.9, 0.05, "pluck"),
		p(5.76, 659.25, 0.9, 0.05, "pluck"),
		p(6.72, 523.25, 0.9, 0.05, "pluck"),
		p(0, 261.63, 3.6, 0.02, "pad"),
		p(0, 196, 3.6, 0.02, "pad"),
		p(3.84, 349.23, 3.6, 0.02, "pad"),
		p(3.84, 261.63, 3.6, 0.02, "pad"),
	],
};

/** The runner's theme: a bouncy staccato arpeggio with light ticks. */
const runner: ComposedTheme = {
	id: "runner",
	loopS: 2.4,
	gain: 0.9,
	notes: [
		p(0, 440, 0.15, 0.06, "arpeggio"),
		p(0.3, 523.25, 0.15, 0.06, "arpeggio"),
		p(0.6, 659.25, 0.15, 0.06, "arpeggio"),
		p(0.9, 523.25, 0.15, 0.06, "arpeggio"),
		p(1.2, 440, 0.15, 0.06, "arpeggio"),
		p(1.5, 659.25, 0.15, 0.06, "arpeggio"),
		p(1.8, 783.99, 0.15, 0.06, "arpeggio"),
		p(2.1, 659.25, 0.15, 0.06, "arpeggio"),
		p(0, 98, 0.08, 0.05, "percussion"),
		p(1.2, 98, 0.08, 0.05, "percussion"),
	],
};

/** The bubbles theme: watery pentatonic blips under an airy shimmer. */
const bubbles: ComposedTheme = {
	id: "bubbles",
	loopS: 4.8,
	gain: 0.9,
	notes: [
		p(0, 523.25, 0.25, 0.05, "pluck"),
		p(0.7, 587.33, 0.25, 0.05, "pluck"),
		p(1.3, 659.25, 0.25, 0.05, "pluck"),
		p(2.1, 783.99, 0.25, 0.05, "pluck"),
		p(2.9, 880, 0.25, 0.05, "pluck"),
		p(3.4, 783.99, 0.25, 0.05, "pluck"),
		p(4.1, 659.25, 0.25, 0.05, "pluck"),
		p(0, 2093, 4.8, 0.015, "shimmer"),
	],
};

/** The puzzle theme: calm, mellow marimba, unhurried. */
const puzzle: ComposedTheme = {
	id: "puzzle",
	loopS: 6.4,
	gain: 0.9,
	notes: [
		p(0, 392, 0.8, 0.045, "marimba"),
		p(1.6, 440, 0.8, 0.045, "marimba"),
		p(3.2, 349.23, 0.8, 0.045, "marimba"),
		p(4.8, 523.25, 1.2, 0.045, "marimba"),
		p(0, 196, 6.4, 0.015, "pad"),
	],
};

/** The lullaby: a lone, very soft music box for bedtime. */
const lullaby: ComposedTheme = {
	id: "lullaby",
	loopS: 9.6,
	gain: 0.5,
	notes: [
		p(0, 523.25, 1.6, 0.03, "pluck"),
		p(1.6, 392, 1.6, 0.03, "pluck"),
		p(3.2, 440, 1.6, 0.03, "pluck"),
		p(4.8, 392, 1.6, 0.03, "pluck"),
		p(6.4, 329.63, 1.6, 0.03, "pluck"),
		p(8, 293.66, 1.6, 0.03, "pluck"),
	],
};

/** Every composed theme, by id. */
export const THEMES: Record<string, ComposedTheme> = {
	room,
	runner,
	bubbles,
	puzzle,
	lullaby,
};

const THEME_BY_ROUTE: Record<string, string> = {
	"/": "room",
	"/runner": "runner",
	"/bubbles": "bubbles",
	"/puzzle": "puzzle",
};

/**
 * Resolve exactly one active theme: bedtime always swaps in the lullaby;
 * unknown routes fall back to the room theme.
 */
export function themeFor(route: string, bedtime: boolean): Theme {
	if (bedtime) return THEMES.lullaby;
	return THEMES[THEME_BY_ROUTE[route] ?? "room"];
}
