/**
 * Tests for runner rewards: distance + grabbed stars convert to save stars
 * with a happy-end guarantee (every finished run earns at least 1 star —
 * there is no losing for a 4-year-old).
 */
import { describe, expect, it } from "vitest";
import { DEFAULT_SAVE, type SaveData } from "../save/store";
import {
	awardRun,
	RUN_FINISH_M,
	RUN_MAX_STARS,
	type RunResult,
	runReward,
} from "./runner";

function testSave(overrides: Partial<SaveData> = {}): SaveData {
	return { ...DEFAULT_SAVE, ...overrides };
}

describe("runReward", () => {
	it("guarantees at least 1 star even for a zero-distance run", () => {
		const result: RunResult = { distanceM: 0, starsGrabbed: 0 };
		expect(runReward(result)).toBe(1);
	});

	it("adds 1 star per 50m finished", () => {
		expect(runReward({ distanceM: 49, starsGrabbed: 0 })).toBe(1);
		expect(runReward({ distanceM: 50, starsGrabbed: 0 })).toBe(2);
		expect(runReward({ distanceM: RUN_FINISH_M, starsGrabbed: 0 })).toBe(3);
	});

	it("adds every star grabbed on the track", () => {
		expect(runReward({ distanceM: 0, starsGrabbed: 2 })).toBe(3);
	});

	it("caps the payout so one run cannot flood the wardrobe", () => {
		expect(runReward({ distanceM: 10000, starsGrabbed: 99 })).toBe(
			RUN_MAX_STARS,
		);
	});
});

describe("awardRun", () => {
	it("banks the reward and leaves other stats untouched", () => {
		const result: RunResult = { distanceM: 60, starsGrabbed: 1 };
		const after = awardRun(testSave({ stars: 2 }), result);
		expect(after.stars).toBe(2 + runReward(result));
		expect(after.stats.hunger).toBe(DEFAULT_SAVE.stats.hunger);
	});

	it("boosts happiness because running is fun, clamped at 100", () => {
		const result: RunResult = { distanceM: 10, starsGrabbed: 0 };
		expect(
			awardRun(
				testSave({ stats: { ...DEFAULT_SAVE.stats, happiness: 90 } }),
				result,
			).stats.happiness,
		).toBe(100);
		expect(
			awardRun(
				testSave({ stats: { ...DEFAULT_SAVE.stats, happiness: 40 } }),
				result,
			).stats.happiness,
		).toBe(50);
	});
});
