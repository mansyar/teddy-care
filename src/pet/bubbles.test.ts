/**
 * Tests for the bubble game logic: reward math with a happy-end guarantee
 * (every finished round banks at least 1 star — there is no losing for a
 * 4-year-old) and the gentle difficulty ramp for the rising bubbles.
 */
import { describe, expect, it } from "vitest";
import { DEFAULT_SAVE, type SaveData } from "../save/store";
import {
	awardBubbles,
	BUBBLE_MAX_STARS,
	BUBBLE_POPS_PER_STAR,
	BUBBLE_ROUND_MS,
	type BubblePace,
	bubblePace,
	bubbleReward,
} from "./bubbles";

function testSave(overrides: Partial<SaveData> = {}): SaveData {
	return { ...DEFAULT_SAVE, ...overrides };
}

describe("bubbleReward", () => {
	it("guarantees at least 1 star even for a zero-pop round", () => {
		expect(bubbleReward(0)).toBe(1);
	});

	it("adds 1 star per 8 pops", () => {
		expect(bubbleReward(BUBBLE_POPS_PER_STAR - 1)).toBe(1);
		expect(bubbleReward(BUBBLE_POPS_PER_STAR)).toBe(2);
		expect(bubbleReward(BUBBLE_POPS_PER_STAR * 2)).toBe(3);
	});

	it("ignores negative pops", () => {
		expect(bubbleReward(-5)).toBe(1);
	});

	it("caps the payout so one round cannot flood the wardrobe", () => {
		expect(bubbleReward(9999)).toBe(BUBBLE_MAX_STARS);
	});
});

describe("awardBubbles", () => {
	it("banks the reward and leaves other stats untouched", () => {
		const after = awardBubbles(testSave({ stars: 3 }), 10);
		expect(after.stars).toBe(3 + bubbleReward(10));
		expect(after.stats.hunger).toBe(DEFAULT_SAVE.stats.hunger);
	});

	it("boosts happiness because popping bubbles is fun, clamped at 100", () => {
		expect(
			awardBubbles(
				testSave({ stats: { ...DEFAULT_SAVE.stats, happiness: 90 } }),
				4,
			).stats.happiness,
		).toBe(100);
		expect(
			awardBubbles(
				testSave({ stats: { ...DEFAULT_SAVE.stats, happiness: 40 } }),
				4,
			).stats.happiness,
		).toBe(50);
	});
});

describe("bubblePace", () => {
	it("starts calm at the beginning of the round", () => {
		const pace = bubblePace(0);
		expect(pace.intervalMs).toBeGreaterThan(0);
		expect(pace.speed).toBe(1);
	});

	it("ramps up gently: later in the round means faster and more frequent", () => {
		const early: BubblePace = bubblePace(0);
		const late: BubblePace = bubblePace(BUBBLE_ROUND_MS - 1);
		expect(late.intervalMs).toBeLessThan(early.intervalMs);
		expect(late.speed).toBeGreaterThan(early.speed);
	});

	it("stays at end-of-round pace once the round is over", () => {
		const atEnd = bubblePace(BUBBLE_ROUND_MS);
		const past = bubblePace(BUBBLE_ROUND_MS * 3);
		expect(past).toEqual(atEnd);
	});

	it("clamps negative elapsed time to the calm start", () => {
		expect(bubblePace(-100)).toEqual(bubblePace(0));
	});
});

describe("BUBBLE_ROUND_MS", () => {
	it("is a 30-second round, like the runner", () => {
		expect(BUBBLE_ROUND_MS).toBe(30_000);
	});
});
