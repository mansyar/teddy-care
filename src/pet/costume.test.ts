/**
 * Tests for the wardrobe: three costumes with tiered prices — the Sunset
 * Onesie (CSS-filter recolor) plus two overlay accessories (Party Hat,
 * Cozy Scarf) drawn over base Teddy. Buying spends stars, records ownership,
 * and equips; owned items can be re-equipped at any time (free switching,
 * including back to the default onesie).
 */
import { describe, expect, it } from "vitest";
import { DEFAULT_SAVE, type SaveData } from "../save/store";
import { buyCostume, COSTUMES, equipCostume } from "./costume";

function testSave(overrides: Partial<SaveData> = {}): SaveData {
	return { ...DEFAULT_SAVE, ...overrides };
}

describe("COSTUMES", () => {
	it("offers three costumes: the sunset onesie and two accessories", () => {
		expect(COSTUMES.map((c) => c.id)).toEqual([
			"sunset-onesie",
			"party-hat",
			"cozy-scarf",
		]);
	});

	it("prices them in tiers: 10, 20, and 30 stars", () => {
		expect(COSTUMES.map((c) => c.price)).toEqual([10, 20, 30]);
	});

	it("marks the sunset onesie as a filter and the accessories as overlays", () => {
		expect(COSTUMES.map((c) => c.kind)).toEqual([
			"filter",
			"overlay",
			"overlay",
		]);
	});
});

describe("buyCostume", () => {
	it("deducts the price, records ownership, and equips the costume", () => {
		const after = buyCostume(testSave({ stars: 25 }), "party-hat");
		expect(after.stars).toBe(5);
		expect(after.owned).toEqual(["party-hat"]);
		expect(after.costume).toBe("party-hat");
	});

	it("buys at exactly-enough stars without going negative", () => {
		const after = buyCostume(testSave({ stars: 20 }), "party-hat");
		expect(after.stars).toBe(0);
		expect(after.costume).toBe("party-hat");
	});

	it("leaves the save untouched (owned included) when stars fall short", () => {
		const before = testSave({ stars: 19 });
		expect(buyCostume(before, "party-hat")).toEqual(before);
	});

	it("equips an already-owned costume again for free", () => {
		const owned = testSave({
			stars: 20,
			owned: ["party-hat", "cozy-scarf"],
			costume: "cozy-scarf",
		});
		const after = buyCostume(owned, "party-hat");
		expect(after.stars).toBe(20);
		expect(after.costume).toBe("party-hat");
		expect(after.owned).toEqual(["party-hat", "cozy-scarf"]);
	});

	it("never charges twice for the already-equipped costume", () => {
		const wearing = testSave({
			stars: 20,
			owned: ["party-hat"],
			costume: "party-hat",
		});
		expect(buyCostume(wearing, "party-hat")).toEqual(wearing);
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
			owned: ["sunset-onesie", "party-hat", "cozy-scarf"],
			costume: "cozy-scarf",
		});
		expect(equipCostume(owned, "party-hat").costume).toBe("party-hat");
	});

	it("returns to the default onesie with null", () => {
		const wearing = testSave({ owned: ["party-hat"], costume: "party-hat" });
		const after = equipCostume(wearing, null);
		expect(after.costume).toBeNull();
		expect(after.owned).toEqual(["party-hat"]);
	});

	it("refuses to equip a costume that is not owned", () => {
		const before = testSave({ stars: 5, owned: [] });
		expect(equipCostume(before, "cozy-scarf")).toEqual(before);
	});
});

describe("default save", () => {
	it("starts with an empty wardrobe and the default onesie worn", () => {
		expect(DEFAULT_SAVE.owned).toEqual([]);
		expect(DEFAULT_SAVE.costume).toBeNull();
	});
});
