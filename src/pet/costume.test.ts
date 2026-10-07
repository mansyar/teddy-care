/**
 * Tests for the wardrobe: three filter-recolor costumes with tiered prices —
 * the Sunset Onesie plus Mint Dream and Berry Night. Buying spends stars,
 * records ownership, and equips; owned items can be re-equipped at any time
 * (free switching, including back to the default onesie). Every costume tints
 * Teddy scene-wide via its CSS filter, so no per-scene art is needed.
 */
import { describe, expect, it } from "vitest";
import { DEFAULT_SAVE, type SaveData } from "../save/store";
import { buyCostume, COSTUMES, equipCostume } from "./costume";
import {
	BERRY_NIGHT_PRICE,
	FIRST_COSTUME_PRICE,
	MINT_DREAM_PRICE,
} from "./stars";

function testSave(overrides: Partial<SaveData> = {}): SaveData {
	return { ...DEFAULT_SAVE, ...overrides };
}

describe("COSTUMES", () => {
	it("offers three costumes: the sunset onesie and two recolors", () => {
		expect(COSTUMES.map((c) => c.id)).toEqual([
			"sunset-onesie",
			"mint-dream",
			"berry-night",
		]);
	});

	it("prices them in tiers: 10, 20, and 30 stars", () => {
		expect(COSTUMES.map((c) => c.price)).toEqual([10, 20, 30]);
	});

	it("gives every costume a non-empty CSS filter", () => {
		for (const c of COSTUMES) {
			expect(c.filter.trim().length).toBeGreaterThan(0);
		}
	});

	it("keeps prices consistent with the star economy module", () => {
		expect(COSTUMES.map((c) => c.price)).toEqual([
			FIRST_COSTUME_PRICE,
			MINT_DREAM_PRICE,
			BERRY_NIGHT_PRICE,
		]);
	});
});

describe("buyCostume", () => {
	it("deducts the price, records ownership, and equips the costume", () => {
		const after = buyCostume(testSave({ stars: 25 }), "mint-dream");
		expect(after.stars).toBe(5);
		expect(after.owned).toEqual(["mint-dream"]);
		expect(after.costume).toBe("mint-dream");
	});

	it("buys at exactly-enough stars without going negative", () => {
		const after = buyCostume(testSave({ stars: 20 }), "mint-dream");
		expect(after.stars).toBe(0);
		expect(after.costume).toBe("mint-dream");
	});

	it("leaves the save untouched (owned included) when stars fall short", () => {
		const before = testSave({ stars: 19 });
		expect(buyCostume(before, "mint-dream")).toEqual(before);
	});

	it("equips an already-owned costume again for free", () => {
		const owned = testSave({
			stars: 20,
			owned: ["mint-dream", "berry-night"],
			costume: "berry-night",
		});
		const after = buyCostume(owned, "mint-dream");
		expect(after.stars).toBe(20);
		expect(after.costume).toBe("mint-dream");
		expect(after.owned).toEqual(["mint-dream", "berry-night"]);
	});

	it("never charges twice for the already-equipped costume", () => {
		const wearing = testSave({
			stars: 20,
			owned: ["mint-dream"],
			costume: "mint-dream",
		});
		expect(buyCostume(wearing, "mint-dream")).toEqual(wearing);
	});

	it("ignores unknown costume ids", () => {
		const before = testSave({ stars: 20 });
		expect(buyCostume(before, "nope-not-real")).toEqual(before);
	});
});

describe("equipCostume", () => {
	it("switches among owned costumes at any time", () => {
		const owned = testSave({
			stars: 3,
			owned: ["sunset-onesie", "mint-dream", "berry-night"],
			costume: "berry-night",
		});
		expect(equipCostume(owned, "mint-dream").costume).toBe("mint-dream");
	});

	it("returns to the default onesie with null", () => {
		const wearing = testSave({ owned: ["mint-dream"], costume: "mint-dream" });
		const after = equipCostume(wearing, null);
		expect(after.costume).toBeNull();
		expect(after.owned).toEqual(["mint-dream"]);
	});

	it("refuses to equip a costume that is not owned", () => {
		const before = testSave({ stars: 5, owned: [] });
		expect(equipCostume(before, "berry-night")).toEqual(before);
	});
});

describe("default save", () => {
	it("starts with an empty wardrobe and the default onesie worn", () => {
		expect(DEFAULT_SAVE.owned).toEqual([]);
		expect(DEFAULT_SAVE.costume).toBeNull();
	});
});
