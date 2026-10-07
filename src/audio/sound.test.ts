/**
 * Tests for room sound gating (track teddys_room_20261007 Phase 4).
 *
 * The kindness invariant: every room sound — footsteps, munch, water fizz,
 * yawn — stays silent when the parent muted the app or it is bedtime.
 * Silence is observable as "no AudioContext was ever created", and audible
 * play as "oscillators were scheduled". Runs in node: `window` is stubbed
 * with a counting AudioContext, and the module is re-imported per test so
 * its cached context never leaks between cases.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import type * as Sound from "./sound";

const AUDIBLE = { muted: false, bedtime: false };
const MUTED = { muted: true, bedtime: false };
const BEDTIME = { muted: false, bedtime: true };

let constructed: number;
let oscillators: number;

/** Fresh module per test (its AudioContext cache is module-scoped). */
async function load(): Promise<typeof Sound> {
	vi.resetModules();
	return await import("./sound");
}

class StubAudioContext {
	state = "running";
	destination = {};
	currentTime = 0;

	constructor() {
		constructed++;
	}

	resume(): Promise<void> {
		return Promise.resolve();
	}
	createOscillator() {
		oscillators++;
		return {
			type: "",
			frequency: { value: 0 },
			// connect returns the destination node so chains keep working.
			connect: (node: unknown) => node,
			start: () => undefined,
			stop: () => undefined,
		};
	}
	createGain() {
		return {
			gain: {
				setValueAtTime: () => undefined,
				linearRampToValueAtTime: () => undefined,
				exponentialRampToValueAtTime: () => undefined,
			},
			connect: (node: unknown) => node,
		};
	}
}

function installAudioStub() {
	constructed = 0;
	oscillators = 0;
	const timers = globalThis as unknown as {
		setInterval: typeof setInterval;
		clearInterval: typeof clearInterval;
	};
	vi.stubGlobal("window", {
		AudioContext: StubAudioContext,
		// Keep timers reachable through the stubbed window; under
		// vi.useFakeTimers these are the faked versions, as intended.
		setInterval: timers.setInterval,
		clearInterval: timers.clearInterval,
	});
	vi.stubGlobal("AudioContext", StubAudioContext);
}

afterEach(() => {
	vi.unstubAllGlobals();
	vi.useRealTimers();
});

describe("room sound gating", () => {
	it("each room sound exists as a function", async () => {
		const s = await load();
		expect(typeof s.playFootsteps).toBe("function");
		expect(typeof s.playMunch).toBe("function");
		expect(typeof s.playFizz).toBe("function");
		expect(typeof s.playYawn).toBe("function");
	});

	it("footsteps stay silent under mute and bedtime — no context is created", async () => {
		installAudioStub();
		const { playFootsteps } = await load();
		playFootsteps(MUTED);
		playFootsteps(BEDTIME);
		expect(constructed).toBe(0);
	});

	it("munch stays silent under mute and bedtime", async () => {
		installAudioStub();
		const { playMunch } = await load();
		playMunch(MUTED);
		playMunch(BEDTIME);
		expect(constructed).toBe(0);
	});

	it("water fizz stays silent under mute and bedtime", async () => {
		installAudioStub();
		const { playFizz } = await load();
		playFizz(MUTED);
		playFizz(BEDTIME);
		expect(constructed).toBe(0);
	});

	it("yawn stays silent under mute and bedtime", async () => {
		installAudioStub();
		const { playYawn } = await load();
		playYawn(MUTED);
		playYawn(BEDTIME);
		expect(constructed).toBe(0);
	});

	it("audible munch schedules oscillators", async () => {
		installAudioStub();
		const { playMunch } = await load();
		playMunch(AUDIBLE);
		expect(constructed).toBe(1);
		expect(oscillators).toBe(3);
	});

	it("audible footsteps schedule several soft ticks", async () => {
		installAudioStub();
		const { playFootsteps } = await load();
		playFootsteps(AUDIBLE);
		expect(oscillators).toBeGreaterThanOrEqual(2);
	});

	it("audible fizz and yawn schedule oscillators", async () => {
		installAudioStub();
		const { playFizz, playYawn } = await load();
		playFizz(AUDIBLE);
		playYawn(AUDIBLE);
		expect(oscillators).toBe(7);
	});
});

describe("bubble pop sound", () => {
	it("playPopBubble exists as a function", async () => {
		const s = await load();
		expect(typeof s.playPopBubble).toBe("function");
	});

	it("playPopBubble stays silent under mute and bedtime — no context is created", async () => {
		installAudioStub();
		const { playPopBubble } = await load();
		playPopBubble(MUTED);
		playPopBubble(BEDTIME);
		expect(constructed).toBe(0);
		expect(oscillators).toBe(0);
	});

	it("audible playPopBubble schedules one bright blip", async () => {
		installAudioStub();
		const { playPopBubble } = await load();
		playPopBubble(AUDIBLE);
		expect(constructed).toBe(1);
		expect(oscillators).toBe(1);
	});
});

describe("placeholder sounds and music loop", () => {
	it("giggle, star and fanfare schedule their notes when audible", async () => {
		installAudioStub();
		const { playGiggle, playStar, playFanfare } = await load();
		playGiggle(AUDIBLE);
		playStar(AUDIBLE);
		playFanfare(AUDIBLE);
		expect(oscillators).toBe(3 + 2 + 4);
	});

	it("startMusic plays the lullaby on an interval", async () => {
		vi.useFakeTimers();
		installAudioStub();
		const { startMusic } = await load();
		startMusic(AUDIBLE);
		expect(constructed).toBe(1);
		vi.advanceTimersByTime(480 * 3);
		expect(oscillators).toBe(3);
	});

	it("startMusic is idempotent — a second call never doubles the band", async () => {
		vi.useFakeTimers();
		installAudioStub();
		const { startMusic } = await load();
		startMusic(AUDIBLE);
		startMusic(AUDIBLE);
		vi.advanceTimersByTime(480 * 2);
		expect(oscillators).toBe(2);
		expect(constructed).toBe(1);
	});

	it("music stops itself when bedtime arrives mid-phrase", async () => {
		vi.useFakeTimers();
		installAudioStub();
		const { startMusic } = await load();
		const settings = { ...AUDIBLE };
		startMusic(settings);
		vi.advanceTimersByTime(480);
		expect(oscillators).toBe(1);
		settings.bedtime = true;
		vi.advanceTimersByTime(480 * 2);
		// The interval cleared itself: no further notes get scheduled.
		expect(oscillators).toBe(1);
	});

	it("startMusic stays silent when muted", async () => {
		installAudioStub();
		const { startMusic } = await load();
		startMusic(MUTED);
		expect(constructed).toBe(0);
		expect(oscillators).toBe(0);
	});

	it("sounds degrade gracefully without any AudioContext", async () => {
		const timers = globalThis as unknown as {
			setInterval: typeof setInterval;
			clearInterval: typeof clearInterval;
		};
		vi.stubGlobal("window", {
			setInterval: timers.setInterval,
			clearInterval: timers.clearInterval,
		});
		const { playGiggle, stopMusic, startMusic } = await load();
		expect(() => playGiggle(AUDIBLE)).not.toThrow();
		expect(() => startMusic(AUDIBLE)).not.toThrow();
		expect(() => stopMusic()).not.toThrow();
		expect(constructed).toBe(0);
	});
});
