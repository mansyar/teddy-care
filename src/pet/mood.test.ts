/**
 * Tests for mood derivation (TDD — written before implementation).
 *
 * Covers: stats-to-face mapping, the transient eating override during feeds,
 * bedtime forcing sleepy, and recovery (a cared-for Teddy shows happy again).
 */
import { describe, expect, it } from "vitest";
import { deriveMood, FACE_FOR_MOOD } from "./mood";
import { applyCareAction, fullStats } from "./stats";

describe("deriveMood", () => {
	it("shows happy when Teddy is well cared for", () => {
		expect(deriveMood(fullStats())).toBe("happy");
	});

	it("shows sad when any need stat runs low", () => {
		expect(deriveMood({ ...fullStats(), hunger: 20 })).toBe("sad");
		expect(deriveMood({ ...fullStats(), happiness: 10 })).toBe("sad");
		expect(deriveMood({ ...fullStats(), cleanliness: 30 })).toBe("sad");
	});

	it("shows sleepy at low energy even when all else is fine", () => {
		expect(deriveMood({ ...fullStats(), energy: 10 })).toBe("sleepy");
	});

	it("forces sleepy in bedtime mode no matter the stats", () => {
		expect(deriveMood(fullStats(), { bedtime: true })).toBe("sleepy");
	});

	it("shows eating during a feed, beating every other mood", () => {
		const starving = { hunger: 0, happiness: 0, energy: 0, cleanliness: 0 };
		expect(deriveMood(starving, { eating: true })).toBe("eating");
		expect(deriveMood(fullStats(), { eating: true })).toBe("eating");
	});

	it("shows idle for middling stats (neither thriving nor needy)", () => {
		expect(
			deriveMood({ hunger: 55, happiness: 60, energy: 65, cleanliness: 58 }),
		).toBe("idle");
	});

	it("kindness: recovery path ends at happy, never stuck on sad", () => {
		const zero = { hunger: 0, happiness: 0, energy: 0, cleanliness: 0 };
		// Rock bottom reads as sleepy (exhausted) — still a call for care.
		expect(deriveMood(zero)).toBe("sleepy");
		let stats = { ...zero };
		for (let round = 0; round < 2; round++) {
			stats = applyCareAction(stats, "feed");
			stats = applyCareAction(stats, "wash");
			stats = applyCareAction(stats, "rest");
			stats = applyCareAction(stats, "pet");
		}
		// Two rounds of care in one session must lift Teddy off sad.
		expect(deriveMood(stats)).toBe("idle");
	});
});

describe("FACE_FOR_MOOD", () => {
	it("maps every mood to its precached art file", () => {
		expect(FACE_FOR_MOOD.happy).toBe("/teddy/teddy-happy.png");
		expect(FACE_FOR_MOOD.sad).toBe("/teddy/teddy-sad.png");
		expect(FACE_FOR_MOOD.sleepy).toBe("/teddy/teddy-sleepy.png");
		expect(FACE_FOR_MOOD.eating).toBe("/teddy/teddy-eating.png");
		expect(FACE_FOR_MOOD.idle).toBe("/teddy/teddy-base.png");
	});
});
