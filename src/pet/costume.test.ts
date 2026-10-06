/**
 * Tests for the single MVP costume: a CSS-filter recolor ("Sunset Onesie"),
 * equippable over any face by construction (the filter applies to whichever
 * face image is showing). Buying spends stars and equips permanently — no
 * unequip in the MVP, so no wardrobe schema is needed.
 */
import { describe, expect, it } from "vitest";
import { DEFAULT_SAVE, type SaveData } from "../save/store";
import { buyCostume, COSTUMES } from "./costume";

function testSave(overrides: Partial<SaveData> = {}): SaveData {
	return { ...DEFAULT_SAVE, ...overrides };
}

describe("COSTUMES", () => {
	it("offers exactly one MVP costume", () => {
		expect(COSTUMES).toHaveLength(1);
	});

	it("prices the costume at the agreed star price", () => {
		expect(COSTUMES[0].price).toBe(10);
	});
});

describe("buyCostume", () => {
	it("deducts the price and equips the costume when affordable", () => {
		const after = buyCostume(testSave({ stars: 12 }), COSTUMES[0].id);
		expect(after.stars).toBe(2);
		expect(after.costume).toBe(COSTUMES[0].id);
	});

	it("leaves the save untouched when stars fall short", () => {
		const before = testSave({ stars: 9 });
		expect(buyCostume(before, COSTUMES[0].id)).toEqual(before);
	});

	it("never charges twice for the already-equipped costume", () => {
		const owned = testSave({ stars: 20, costume: COSTUMES[0].id });
		expect(buyCostume(owned, COSTUMES[0].id)).toEqual(owned);
	});

	it("ignores unknown costume ids", () => {
		const before = testSave({ stars: 20 });
		expect(buyCostume(before, "nope-not-real")).toEqual(before);
	});
});
