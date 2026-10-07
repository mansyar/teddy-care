/**
 * Tests for the IndexedDB save wrapper (TDD — written before implementation).
 *
 * Covers: fresh-install defaults, save/load round-trip persistence across a
 * simulated reload, and safe reset when the stored save is corrupted.
 */
import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import {
	DEFAULT_SAVE,
	deleteDatabase,
	loadSave,
	migrateSave,
	resetSave,
	saveSave,
} from "./store";

beforeEach(async () => {
	await deleteDatabase();
});

describe("loadSave on a fresh install", () => {
	it("returns a healthy, happy Teddy with zero stars", async () => {
		const save = await loadSave();
		expect(save.stats.hunger).toBeGreaterThanOrEqual(80);
		expect(save.stats.happiness).toBeGreaterThanOrEqual(80);
		expect(save.stats.energy).toBeGreaterThanOrEqual(80);
		expect(save.stats.cleanliness).toBeGreaterThanOrEqual(80);
		expect(save.stars).toBe(0);
		expect(save.costume).toBeNull();
		expect(save.owned).toEqual([]);
		expect(save.settings.muted).toBe(false);
		expect(save.settings.bedtime).toBe(false);
	});
});

describe("save/load round-trip", () => {
	it("persists stats, stars, costume, owned, and settings across a simulated reload", async () => {
		const changed = {
			...DEFAULT_SAVE,
			stats: { hunger: 40, happiness: 55, energy: 70, cleanliness: 90 },
			stars: 7,
			costume: "mint-dream",
			owned: ["mint-dream", "berry-night"],
			settings: { muted: true, bedtime: false },
			lastSeen: 1234567890,
		};
		await saveSave(changed);

		// Simulate a reload: the next load must reflect what was saved.
		const reloaded = await loadSave();
		// Saving re-stamps the wall-clock time, so compare everything else.
		expect(reloaded.lastSeen).toBeGreaterThanOrEqual(changed.lastSeen);
		expect({ ...reloaded, lastSeen: 0 }).toEqual({ ...changed, lastSeen: 0 });
	});
});

describe("corrupted saves", () => {
	it("returns safe defaults instead of throwing when stored data is garbage", async () => {
		// Write raw garbage straight into the underlying IndexedDB.
		const open = indexedDB.open("teddy-care", 1);
		await new Promise<void>((resolve, reject) => {
			open.onupgradeneeded = () => {
				open.result.createObjectStore("saves");
			};
			open.onsuccess = () => resolve();
			open.onerror = () => reject(open.error);
		});
		const db = open.result;
		const tx = db.transaction("saves", "readwrite");
		tx.objectStore("saves").put("not-a-save-object", "save");
		await new Promise<void>((resolve, reject) => {
			tx.oncomplete = () => resolve();
			tx.onerror = () => reject(tx.error);
		});
		db.close();

		const save = await loadSave();
		expect(save).toEqual(DEFAULT_SAVE);
	});
});

describe("resetSave", () => {
	it("wipes progress back to fresh-install defaults", async () => {
		await saveSave({ ...DEFAULT_SAVE, stars: 99 });
		const reset = await resetSave();
		expect(reset).toEqual(DEFAULT_SAVE);
		expect(await loadSave()).toEqual(DEFAULT_SAVE);
	});
});

describe("v1 → v2 migration", () => {
	/** Write a raw (pre-migration) payload straight into IndexedDB. */
	async function writeRaw(value: unknown): Promise<void> {
		const open = indexedDB.open("teddy-care", 1);
		await new Promise<void>((resolve, reject) => {
			open.onupgradeneeded = () => {
				open.result.createObjectStore("saves");
			};
			open.onsuccess = () => resolve();
			open.onerror = () => reject(open.error);
		});
		const db = open.result;
		const tx = db.transaction("saves", "readwrite");
		tx.objectStore("saves").put(value, "save");
		await new Promise<void>((resolve, reject) => {
			tx.oncomplete = () => resolve();
			tx.onerror = () => reject(tx.error);
		});
		db.close();
	}

	it("migrates a v1 save with an equipped costume: owned implies it", async () => {
		await writeRaw({
			version: 1,
			stats: { hunger: 50, happiness: 60, energy: 70, cleanliness: 80 },
			stars: 4,
			costume: "sunset-onesie",
			settings: { muted: false, bedtime: true },
			lastSeen: 1000,
		});
		const save = await loadSave();
		expect(save.version).toBe(2);
		expect(save.owned).toEqual(["sunset-onesie"]);
		expect(save.costume).toBe("sunset-onesie");
		expect(save.stars).toBe(4);
		expect(save.stats.hunger).toBe(50);
		expect(save.settings.bedtime).toBe(true);
	});

	it("migrates a v1 save with the default onesie: empty wardrobe", async () => {
		await writeRaw({
			version: 1,
			stats: { hunger: 50, happiness: 60, energy: 70, cleanliness: 80 },
			stars: 2,
			costume: null,
			settings: { muted: true, bedtime: false },
			lastSeen: 1000,
		});
		const save = await loadSave();
		expect(save.version).toBe(2);
		expect(save.owned).toEqual([]);
		expect(save.costume).toBeNull();
	});

	it("migrates v1 through migrateSave without any storage", () => {
		const migrated = migrateSave({
			version: 1,
			stats: { hunger: 50, happiness: 60, energy: 70, cleanliness: 80 },
			stars: 4,
			costume: "sunset-onesie",
			settings: { muted: false, bedtime: true },
			lastSeen: 1000,
		});
		expect(migrated.version).toBe(2);
		expect(migrated.owned).toEqual(["sunset-onesie"]);
	});

	it("still falls back to fresh defaults for garbage input", () => {
		expect(migrateSave("not-a-save-object")).toEqual(DEFAULT_SAVE);
		expect(migrateSave({ version: 99, stats: {} })).toEqual(DEFAULT_SAVE);
	});

	it("falls back to fresh defaults for a v2 save wearing an unowned costume", () => {
		expect(
			migrateSave({
				...DEFAULT_SAVE,
				owned: [],
				costume: "sunset-onesie",
			}),
		).toEqual(DEFAULT_SAVE);
	});
});
