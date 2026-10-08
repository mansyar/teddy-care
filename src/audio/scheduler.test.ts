/**
 * Tests for the pure music scheduler (track music_audio_polish_20261008
 * Phase 1).
 *
 * The scheduler owns the tricky looping logic — lookahead scheduling,
 * seamless loop repetition, crossfade hand-off between themes, and clean
 * stop/restart — while WebAudio stays behind an injected host. The kindness
 * invariant here: no matter how fast screens switch or how often start/stop
 * fire, exactly one loop is ever active, notes never drift or double, and a
 * restart lands back on the loop's first beat.
 */
import { describe, expect, it } from "vitest";
import {
	FADE_S,
	LOOKAHEAD_S,
	MusicScheduler,
	type ScheduledNote,
	type SchedulerHost,
	type Theme,
} from "./scheduler";

interface NoteCall {
	atS: number;
	note: ScheduledNote;
	theme: Theme;
}

interface FadeCall {
	prev: string | null;
	next: string;
	atS: number;
}

function makeHost(): {
	host: SchedulerHost;
	notes: NoteCall[];
	fades: FadeCall[];
} {
	const notes: NoteCall[] = [];
	const fades: FadeCall[] = [];
	return {
		notes,
		fades,
		host: {
			note: (atS, note, theme) => notes.push({ atS, note, theme }),
			fade: (prev, next, atS) => fades.push({ prev, next, atS }),
		},
	};
}

/** Two-note loop: a note at the top of the loop and one halfway through. */
function theme(id: string, baseFrequency: number): Theme {
	return {
		id,
		loopS: 2,
		gain: 0.5,
		notes: [
			{ offsetS: 0, frequency: baseFrequency, durationS: 0.5, volume: 0.05 },
			{
				offsetS: 1,
				frequency: baseFrequency * 1.25,
				durationS: 0.5,
				volume: 0.05,
			},
		],
	};
}

describe("music scheduler — starting and looping", () => {
	it("start schedules exactly the first loop iteration within the lookahead", () => {
		const { host, notes } = makeHost();
		const scheduler = new MusicScheduler(host);
		scheduler.start(theme("room", 523), 10);
		expect(scheduler.active).toBe("room");
		expect(notes.map((call) => call.atS)).toEqual([10, 11]);
	});

	it("pump schedules each following iteration exactly once — no doubles, no drift", () => {
		const { host, notes } = makeHost();
		const scheduler = new MusicScheduler(host);
		scheduler.start(theme("room", 523), 10);
		// The lookahead fills note-by-note: 13 waits until the window reaches it.
		scheduler.pump(10.5);
		expect(notes.map((call) => call.atS)).toEqual([10, 11, 12]);
		// Repeated pumps never double the band.
		scheduler.pump(10.6);
		expect(notes.map((call) => call.atS)).toEqual([10, 11, 12]);
		scheduler.pump(11.1);
		expect(notes.map((call) => call.atS)).toEqual([10, 11, 12, 13]);
	});

	it("loops seamlessly — the next iteration starts exactly where the previous one ends", () => {
		const { host, notes } = makeHost();
		const scheduler = new MusicScheduler(host);
		scheduler.start(theme("room", 523), 10);
		scheduler.pump(10.5);
		// Iteration 0 spans 10→12, iteration 1 begins at 12 — no gap.
		expect(notes.some((call) => call.atS === 12)).toBe(true);
		// Nothing is scheduled beyond the lookahead window.
		expect(notes.every((call) => call.atS < 10.5 + LOOKAHEAD_S)).toBe(true);
	});

	it("start is idempotent — restarting the same theme never doubles the notes", () => {
		const { host, notes } = makeHost();
		const scheduler = new MusicScheduler(host);
		scheduler.start(theme("room", 523), 10);
		scheduler.start(theme("room", 523), 10);
		expect(notes).toHaveLength(2);
	});
});

describe("music scheduler — crossfade switches", () => {
	it("switchTo hands off with one fade and only the new theme keeps looping", () => {
		const { host, notes, fades } = makeHost();
		const scheduler = new MusicScheduler(host);
		scheduler.start(theme("room", 523), 10);
		const before = notes.length;
		scheduler.switchTo(theme("arcade", 660), 11);
		// Two fades: the fade-in on start, then the crossfade hand-off.
		expect(fades).toEqual([
			{ prev: null, next: "room", atS: 10 },
			{ prev: "room", next: "arcade", atS: 11 },
		]);
		scheduler.pump(11);
		scheduler.pump(11.4);
		// Everything scheduled after the hand-off belongs to the new theme;
		// the old loop's already-scheduled notes taper under the fade-out.
		const after = notes.slice(before);
		expect(after.length).toBeGreaterThan(0);
		expect(after.every((call) => call.theme.id === "arcade")).toBe(true);
	});

	it("rapid double switches coalesce — the newest theme wins, no stacked loops", () => {
		const { host, notes, fades } = makeHost();
		const scheduler = new MusicScheduler(host);
		scheduler.start(theme("room", 523), 10);
		scheduler.switchTo(theme("arcade", 660), 11);
		const before = notes.length;
		scheduler.switchTo(theme("puzzle", 440), 11.5);
		expect(scheduler.active).toBe("puzzle");
		scheduler.pump(11.5);
		scheduler.pump(12);
		const after = notes.slice(before);
		expect(after.length).toBeGreaterThan(0);
		expect(after.every((call) => call.theme.id === "puzzle")).toBe(true);
		// Three fades: fade-in on start, then one per hand-off.
		expect(fades).toHaveLength(3);
		expect(fades[2]).toEqual({ prev: "arcade", next: "puzzle", atS: 11.5 });
	});

	it("switchTo on a stopped scheduler starts the theme instead of failing", () => {
		const { host, notes } = makeHost();
		const scheduler = new MusicScheduler(host);
		scheduler.switchTo(theme("arcade", 660), 5);
		expect(scheduler.active).toBe("arcade");
		expect(notes.map((call) => call.atS)).toEqual([5, 6]);
	});
});

describe("music scheduler — stop and restart", () => {
	it("stop halts scheduling — pumps after stop schedule nothing", () => {
		const { host, notes } = makeHost();
		const scheduler = new MusicScheduler(host);
		scheduler.start(theme("room", 523), 10);
		scheduler.stop();
		expect(scheduler.active).toBeNull();
		const count = notes.length;
		scheduler.pump(11);
		scheduler.pump(12);
		expect(notes).toHaveLength(count);
	});

	it("restart lands back on the first beat in sync", () => {
		const { host, notes } = makeHost();
		const scheduler = new MusicScheduler(host);
		scheduler.start(theme("room", 523), 10);
		scheduler.pump(10.5);
		scheduler.stop();
		scheduler.start(theme("room", 523), 20);
		// The restart begins a fresh loop at 20, not mid-phrase.
		const after = notes.filter((call) => call.atS >= 20);
		expect(after.map((call) => call.atS)).toEqual([20, 21]);
		scheduler.pump(20.5);
		expect(notes.some((call) => call.atS === 22)).toBe(true);
	});
});

describe("music scheduler — tuning constants", () => {
	it("crossfade is a gentle one-second hand-off", () => {
		expect(FADE_S).toBe(1);
	});

	it("lookahead stays ahead of the crossfade so loops never run dry", () => {
		expect(LOOKAHEAD_S).toBeGreaterThanOrEqual(FADE_S * 2);
	});
});
