/**
 * Tests for the star economy: generous by design (a 4-year-old should unlock
 * the first costume in one or two sittings). Stars only ever go up by care;
 * spending never drops below zero — insufficient funds leave the save
 * untouched instead of failing.
 */
import { describe, expect, it } from "vitest";
import { DEFAULT_SAVE, type SaveData } from "../save/store";
import {
	canAfford,
	earnCareStar,
	FIRST_COSTUME_PRICE,
	STARS_PER_CARE,
	spendStars,
} from "./stars";

function testSave(overrides: Partial<SaveData> = {}): SaveData {
	return { ...DEFAULT_SAVE, ...overrides };
}

describe("earnCareStar", () => {
	it(`adds ${STARS_PER_CARE} star(s) per care action`, () => {
		expect(earnCareStar(testSave({ stars: 0 })).stars).toBe(STARS_PER_CARE);
		expect(earnCareStar(testSave({ stars: 4 })).stars).toBe(4 + STARS_PER_CARE);
	});

	it("does not touch stats or settings", () => {
		const before = testSave();
		const after = earnCareStar(before);
		expect(after.stats).toEqual(before.stats);
		expect(after.settings).toEqual(before.settings);
	});
});

describe("first costume price", () => {
	it("is reachable within a single play sitting", () => {
		// Generous: a dozen care actions unlock it.
		expect(FIRST_COSTUME_PRICE).toBeLessThanOrEqual(12);
	});
});

describe("canAfford", () => {
	it("is true when the balance covers the price", () => {
		expect(canAfford(testSave({ stars: 10 }), 10)).toBe(true);
		expect(canAfford(testSave({ stars: 11 }), 10)).toBe(true);
	});

	it("is false when the balance falls short", () => {
		expect(canAfford(testSave({ stars: 9 }), 10)).toBe(false);
	});
});

describe("spendStars", () => {
	it("deducts the price when affordable", () => {
		expect(spendStars(testSave({ stars: 12 }), 10).stars).toBe(2);
	});

	it("leaves the save untouched when unaffordable (never negative)", () => {
		const before = testSave({ stars: 3 });
		const after = spendStars(before, 10);
		expect(after.stars).toBe(3);
		expect(after).toEqual(before);
	});
});
