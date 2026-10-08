/**
 * Tests for the synthesis voices: each theme note names a voice, and a
 * voice is pure data (waveform, envelope shape, optional noise/filter)
 * plus a pure envelope function that clamps to the note's duration. No
 * WebAudio here — the wiring layer turns these specs into nodes.
 */
import { describe, expect, it } from "vitest";
import type { VoiceName } from "./themes";
import { envelopeFor, VOICES, voiceFor } from "./voices";

const NAMES: VoiceName[] = [
	"pluck",
	"pad",
	"arpeggio",
	"shimmer",
	"percussion",
	"marimba",
];

describe("voice specs", () => {
	it("defines a spec for every voice name", () => {
		expect(Object.keys(VOICES).sort()).toEqual([...NAMES].sort());
		for (const name of NAMES) {
			const spec = voiceFor(name);
			expect(spec.attackS, name).toBeGreaterThanOrEqual(0);
			expect(spec.releaseS, name).toBeGreaterThan(0);
			expect(spec.gainScale, name).toBeGreaterThan(0);
		}
	});

	it("falls back to the pluck voice for unknown names", () => {
		const pluck = voiceFor("pluck");
		const mystery = voiceFor("kazoo" as VoiceName);
		expect(mystery.wave).toBe(pluck.wave);
		expect(mystery.attackS).toBe(pluck.attackS);
	});

	it("the pluck is the fast music-box voice", () => {
		const spec = voiceFor("pluck");
		expect(spec.attackS).toBeLessThan(0.05);
		expect(spec.wave).toBe("triangle");
	});

	it("the pad swells slowly", () => {
		expect(voiceFor("pad").attackS).toBeGreaterThan(0.3);
	});

	it("the shimmer is the noise-based voice", () => {
		expect(voiceFor("shimmer").noise).toBe(true);
	});

	it("percussion strikes almost instantly", () => {
		expect(voiceFor("percussion").attackS).toBeLessThan(0.01);
	});

	it("every voice other than the shimmer is oscillator-based", () => {
		for (const name of NAMES) {
			if (name === "shimmer") continue;
			expect(voiceFor(name).noise ?? false, name).toBe(false);
		}
	});
});

describe("envelope clamping", () => {
	it("generous durations keep the natural envelope", () => {
		const env = envelopeFor(voiceFor("pluck"), 1.5);
		expect(env.attackS).toBe(voiceFor("pluck").attackS);
		expect(env.holdS).toBeCloseTo(
			1.5 - voiceFor("pluck").attackS - voiceFor("pluck").releaseS,
			5,
		);
		expect(env.releaseS).toBe(voiceFor("pluck").releaseS);
	});

	it("short notes shrink the envelope to fit", () => {
		const spec = voiceFor("pad"); // attack 0.8 + release 1.2 >> 0.5
		const env = envelopeFor(spec, 0.5);
		expect(env.attackS).toBeGreaterThanOrEqual(0);
		expect(env.releaseS).toBeGreaterThan(0);
		expect(env.attackS + env.holdS + env.releaseS).toBeLessThanOrEqual(
			0.5 + 1e-9,
		);
	});

	it("envelopes never go negative, even for near-zero notes", () => {
		for (const name of NAMES) {
			const env = envelopeFor(voiceFor(name), 0.001);
			expect(env.attackS, name).toBeGreaterThanOrEqual(0);
			expect(env.holdS, name).toBeGreaterThanOrEqual(0);
			expect(env.releaseS, name).toBeGreaterThanOrEqual(0);
		}
	});
});
