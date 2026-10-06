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
		expect(save.settings.muted).toBe(false);
		expect(save.settings.bedtime).toBe(false);
	});
});

describe("save/load round-trip", () => {
	it("persists stats, stars, costume, and settings across a simulated reload", async () => {
		const changed = {
			...DEFAULT_SAVE,
			stats: { hunger: 40, happiness: 55, energy: 70, cleanliness: 90 },
			stars: 7,
			costume: "party-hat",
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
