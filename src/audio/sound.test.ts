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
let sources: number;
/** Simulated audio-clock time; the wiring must read it, never guess it. */
let nowS: number;

/** Fresh module per test (its AudioContext cache is module-scoped). */
async function load(): Promise<typeof Sound> {
	vi.resetModules();
	return await import("./sound");
}

class StubAudioContext {
	state = "running";
	destination = {};
	sampleRate = 48000;

	constructor() {
		constructed++;
	}

	get currentTime(): number {
		return nowS;
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
	createBufferSource() {
		sources++;
		return {
			buffer: null,
			loop: false,
			connect: (node: unknown) => node,
			start: () => undefined,
			stop: () => undefined,
		};
	}
	createBuffer(_channels: number, length: number, sampleRate: number) {
		return {
			sampleRate,
			getChannelData: () => new Float32Array(length),
		};
	}
	createBiquadFilter() {
		return {
			type: "",
			frequency: { value: 0 },
			Q: { value: 0 },
			connect: (node: unknown) => node,
			disconnect: () => undefined,
		};
	}
	createGain() {
		return {
			gain: {
				value: 0,
				setValueAtTime: () => undefined,
				linearRampToValueAtTime: () => undefined,
				exponentialRampToValueAtTime: () => undefined,
				cancelScheduledValues: () => undefined,
			},
			connect: (node: unknown) => node,
			disconnect: () => undefined,
		};
	}
}

function installAudioStub() {
	constructed = 0;
	oscillators = 0;
	sources = 0;
	nowS = 0;
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

/** Advance the simulated audio clock (the wiring reads ctx.currentTime). */
function setNow(seconds: number) {
	nowS = seconds;
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
		expect(oscillators).toBe(6);
	});

	it("audible footsteps schedule several soft ticks", async () => {
		installAudioStub();
		const { playFootsteps } = await load();
		playFootsteps(AUDIBLE);
		expect(oscillators).toBeGreaterThanOrEqual(8);
	});

	it("audible fizz and yawn schedule oscillators", async () => {
		installAudioStub();
		const { playFizz, playYawn } = await load();
		playFizz(AUDIBLE);
		playYawn(AUDIBLE);
		expect(oscillators).toBe(14);
	});
});

describe("sfx textures (richer layers)", () => {
	it("fizz carries an airy noise bed under the bubbles", async () => {
		installAudioStub();
		const { playFizz } = await load();
		playFizz(AUDIBLE);
		expect(sources).toBeGreaterThanOrEqual(1);
	});

	it("star and sparkle leave a shimmer tail", async () => {
		installAudioStub();
		const { playStar, playSparkle } = await load();
		playStar(AUDIBLE);
		expect(sources).toBe(1);
		playSparkle(AUDIBLE);
		expect(sources).toBe(2);
	});

	it("pop, snap and pop-bubble get a tiny noise click", async () => {
		installAudioStub();
		const { playPop, playSnap, playPopBubble } = await load();
		playPop(AUDIBLE);
		playSnap(AUDIBLE);
		playPopBubble(AUDIBLE);
		expect(sources).toBe(3);
	});

	it("munch and footsteps get grainy texture", async () => {
		installAudioStub();
		const { playMunch, playFootsteps } = await load();
		playMunch(AUDIBLE);
		expect(sources).toBe(3);
		playFootsteps(AUDIBLE);
		expect(sources).toBe(7);
	});

	it("silence still creates no noise sources", async () => {
		installAudioStub();
		const { playFizz, playStar } = await load();
		playFizz(MUTED);
		playStar(BEDTIME);
		expect(sources).toBe(0);
		expect(oscillators).toBe(0);
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
		expect(oscillators).toBe(2);
	});
});

describe("puzzle sounds", () => {
	it("exposes the three puzzle SFX", async () => {
		const s = await load();
		expect(typeof s.playPickup).toBe("function");
		expect(typeof s.playSnap).toBe("function");
		expect(typeof s.playBoop).toBe("function");
	});

	it("stays silent under mute and bedtime", async () => {
		for (const settings of [MUTED, BEDTIME]) {
			const s = await load();
			installAudioStub();
			s.playPickup(settings);
			s.playSnap(settings);
			s.playBoop(settings);
			expect(constructed).toBe(0);
			expect(oscillators).toBe(0);
		}
	});

	it("audible pickup, snap, and boop schedule their blips", async () => {
		const s = await load();
		installAudioStub();
		s.playPickup(AUDIBLE);
		expect(oscillators).toBe(2);
		s.playSnap(AUDIBLE);
		expect(oscillators).toBe(6);
		s.playBoop(AUDIBLE);
		expect(oscillators).toBe(10);
	});
});

describe("wardrobe buy celebration", () => {
	it("playSparkle exists as a function", async () => {
		const s = await load();
		expect(typeof s.playSparkle).toBe("function");
	});

	it("playSparkle stays silent under mute and bedtime — no context is created", async () => {
		installAudioStub();
		const { playSparkle } = await load();
		playSparkle(MUTED);
		playSparkle(BEDTIME);
		expect(constructed).toBe(0);
		expect(oscillators).toBe(0);
	});

	it("audible playSparkle schedules a shimmering run of notes", async () => {
		installAudioStub();
		const { playSparkle } = await load();
		playSparkle(AUDIBLE);
		expect(constructed).toBe(1);
		expect(oscillators).toBeGreaterThanOrEqual(8);
	});
});

describe("placeholder sounds and music loop", () => {
	it("giggle, star and fanfare schedule their notes when audible", async () => {
		installAudioStub();
		const { playGiggle, playStar, playFanfare } = await load();
		playGiggle(AUDIBLE);
		playStar(AUDIBLE);
		playFanfare(AUDIBLE);
		expect(oscillators).toBe(6 + 4 + 8);
	});
});

describe("music wiring (scheduler-driven)", () => {
	it("startMusic schedules a lookahead burst of notes on the audio clock", async () => {
		installAudioStub();
		setNow(10);
		const { startMusic } = await load();
		startMusic(AUDIBLE);
		expect(constructed).toBe(1);
		// More than one note lands inside the lookahead window up front.
		expect(oscillators).toBeGreaterThanOrEqual(2);
	});

	it("startMusic is idempotent — restarting the same theme never doubles the band", async () => {
		installAudioStub();
		setNow(10);
		const { startMusic } = await load();
		startMusic(AUDIBLE);
		const afterStart = oscillators;
		startMusic(AUDIBLE);
		expect(oscillators).toBe(afterStart);
	});

	it("the pump driver keeps the loop flowing as the audio clock advances", async () => {
		vi.useFakeTimers();
		installAudioStub();
		setNow(10);
		const { startMusic } = await load();
		startMusic(AUDIBLE);
		const afterStart = oscillators;
		for (let step = 0; step < 5; step++) {
			setNow(10.5 + step * 0.4);
			vi.advanceTimersByTime(200);
		}
		expect(oscillators).toBeGreaterThan(afterStart);
	});

	it("music stops cleanly — no further notes after stopMusic", async () => {
		vi.useFakeTimers();
		installAudioStub();
		setNow(10);
		const { startMusic, stopMusic } = await load();
		startMusic(AUDIBLE);
		stopMusic();
		const afterStop = oscillators;
		for (let step = 0; step < 5; step++) {
			setNow(10.5 + step * 0.4);
			vi.advanceTimersByTime(200);
		}
		expect(oscillators).toBe(afterStop);
	});

	it("music stops itself when bedtime arrives mid-phrase", async () => {
		vi.useFakeTimers();
		installAudioStub();
		setNow(10);
		const { startMusic } = await load();
		const settings = { ...AUDIBLE };
		startMusic(settings);
		const afterStart = oscillators;
		settings.bedtime = true;
		for (let step = 0; step < 3; step++) {
			setNow(10.5 + step * 0.4);
			vi.advanceTimersByTime(200);
		}
		expect(oscillators).toBe(afterStart);
	});

	it("startMusic stays silent when muted or at bedtime — no context is created", async () => {
		installAudioStub();
		const { startMusic } = await load();
		startMusic(MUTED);
		startMusic(BEDTIME);
		expect(constructed).toBe(0);
		expect(oscillators).toBe(0);
	});

	it("voice routing: a shimmer note plays as a noise band, not an oscillator", async () => {
		installAudioStub();
		const { startMusic } = await load();
		const shimmerTheme = {
			id: "test-shimmer",
			loopS: 2,
			gain: 1,
			notes: [
				{
					offsetS: 0,
					frequency: 2093,
					durationS: 2,
					volume: 0.015,
					voice: "shimmer",
				},
			],
		};
		startMusic(AUDIBLE, shimmerTheme);
		expect(sources).toBe(1);
		expect(oscillators).toBe(0);
	});

	it("voice routing: a pluck note plays as an oscillator", async () => {
		installAudioStub();
		const { startMusic } = await load();
		const pluckTheme = {
			id: "test-pluck",
			loopS: 2,
			gain: 1,
			notes: [
				{
					offsetS: 0,
					frequency: 523.25,
					durationS: 0.9,
					volume: 0.05,
					voice: "pluck",
				},
			],
		};
		startMusic(AUDIBLE, pluckTheme);
		expect(oscillators).toBe(1);
		expect(sources).toBe(0);
	});

	it("sounds degrade gracefully without any AudioContext", async () => {
		installAudioStub();
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
