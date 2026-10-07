/**
 * Local-only save system backed by IndexedDB.
 *
 * Holds Teddy's stats, star balance, costume, parent settings, and the last
 * wall-clock timestamp. Corrupted or foreign data is never surfaced to the
 * game — loading falls back to safe fresh-install defaults.
 */

const DB_NAME = "teddy-care";
const STORE_NAME = "saves";
const SAVE_KEY = "save";
const SAVE_VERSION = 2;

/** The four care stats, each clamped to 0–100. */
export interface PetStats {
	hunger: number;
	happiness: number;
	energy: number;
	cleanliness: number;
}

/** Parent-controlled settings, persisted across sessions. */
export interface ParentSettings {
	muted: boolean;
	bedtime: boolean;
}

/** The full persisted save shape (versioned for future migrations). */
export interface SaveData {
	version: number;
	stats: PetStats;
	stars: number;
	/** Equipped costume id, or null when Teddy wears the default onesie. */
	costume: string | null;
	/** Every costume id ever purchased; the wardrobe's free-switching set. */
	owned: string[];
	settings: ParentSettings;
	/** Wall-clock timestamp (ms) of the last save, for decay math. */
	lastSeen: number;
}

/** Fresh-install defaults: a healthy, happy Teddy with zero stars. */
export const DEFAULT_SAVE: SaveData = {
	version: SAVE_VERSION,
	stats: { hunger: 100, happiness: 100, energy: 100, cleanliness: 100 },
	stars: 0,
	costume: null,
	owned: [],
	settings: { muted: false, bedtime: false },
	lastSeen: Date.now(),
};

/** Return a deep copy so callers can never mutate the shared default. */
function freshDefault(): SaveData {
	return JSON.parse(JSON.stringify(DEFAULT_SAVE)) as SaveData;
}

/** Field checks shared by the v1 and v2 save shapes. */
function hasValidCommon(v: Record<string, unknown>): boolean {
	const stats = v.stats as Record<string, unknown> | undefined;
	if (typeof stats !== "object" || stats === null) return false;
	for (const key of ["hunger", "happiness", "energy", "cleanliness"]) {
		if (typeof stats[key] !== "number" || !Number.isFinite(stats[key])) {
			return false;
		}
	}
	if (typeof v.stars !== "number" || !Number.isFinite(v.stars)) return false;
	if (typeof v.costume !== "string" && v.costume !== null) return false;
	const settings = v.settings as Record<string, unknown> | undefined;
	if (typeof settings !== "object" || settings === null) return false;
	if (typeof settings.muted !== "boolean") return false;
	if (typeof settings.bedtime !== "boolean") return false;
	return typeof v.lastSeen === "number" && Number.isFinite(v.lastSeen);
}

/** Type guard: true only when `value` is a usable v2 save object. */
function isSaveData(value: unknown): value is SaveData {
	if (typeof value !== "object" || value === null) return false;
	const v = value as Record<string, unknown>;
	if (v.version !== SAVE_VERSION) return false;
	if (!Array.isArray(v.owned)) return false;
	if (v.owned.some((id) => typeof id !== "string")) return false;
	if (typeof v.costume === "string" && !v.owned.includes(v.costume)) {
		return false;
	}
	return hasValidCommon(v);
}

/** Type guard: true only when `value` is a usable v1 (pre-wardrobe) save. */
function isSaveDataV1(value: unknown): value is Record<string, unknown> {
	if (typeof value !== "object" || value === null) return false;
	const v = value as Record<string, unknown>;
	return v.version === 1 && hasValidCommon(v);
}

/**
 * Lift any stored payload to the current save version: v2 passes through,
 * v1 migrates (a v1 equipped costume implies ownership), and anything else —
 * garbage, unknown versions — falls back to safe fresh-install defaults.
 */
export function migrateSave(value: unknown): SaveData {
	if (isSaveData(value)) return value;
	if (isSaveDataV1(value)) {
		const costume = value.costume as string | null;
		return {
			version: SAVE_VERSION,
			stats: value.stats as SaveData["stats"],
			stars: value.stars as number,
			costume,
			owned: costume ? [costume] : [],
			settings: value.settings as SaveData["settings"],
			lastSeen: value.lastSeen as number,
		};
	}
	return freshDefault();
}

/** Open (or create) the save database. */
function openDb(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, SAVE_VERSION);
		request.onupgradeneeded = () => {
			// Upgrade runs for brand-new databases and for version lifts from
			// older installs — only create the store when it is missing.
			if (!request.result.objectStoreNames.contains(STORE_NAME)) {
				request.result.createObjectStore(STORE_NAME);
			}
		};
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}

/**
 * Load the current save. Returns fresh-install defaults when nothing is
 * stored yet, and safe defaults (never throws) when the stored data is
 * corrupted or from an unknown version.
 */
export async function loadSave(): Promise<SaveData> {
	try {
		const db = await openDb();
		try {
			const value = await new Promise<unknown>((resolve, reject) => {
				const tx = db.transaction(STORE_NAME, "readonly");
				const request = tx.objectStore(STORE_NAME).get(SAVE_KEY);
				request.onsuccess = () => resolve(request.result);
				request.onerror = () => reject(request.error);
			});
			if (value === undefined) return freshDefault();
			return migrateSave(value);
		} finally {
			db.close();
		}
	} catch {
		return freshDefault();
	}
}

/** Persist the given save, stamping the current wall-clock time. */
export async function saveSave(data: SaveData): Promise<void> {
	const db = await openDb();
	try {
		await new Promise<void>((resolve, reject) => {
			const tx = db.transaction(STORE_NAME, "readwrite");
			tx.objectStore(STORE_NAME).put(
				{ ...data, lastSeen: Date.now() },
				SAVE_KEY,
			);
			tx.oncomplete = () => resolve();
			tx.onerror = () => reject(tx.error);
		});
	} finally {
		db.close();
	}
}

/**
 * Wipe all progress and return fresh-install defaults.
 */
export async function resetSave(): Promise<SaveData> {
	const db = await openDb();
	try {
		await new Promise<void>((resolve, reject) => {
			const tx = db.transaction(STORE_NAME, "readwrite");
			tx.objectStore(STORE_NAME).delete(SAVE_KEY);
			tx.oncomplete = () => resolve();
			tx.onerror = () => reject(tx.error);
		});
	} finally {
		db.close();
	}
	return freshDefault();
}

/**
 * Delete the whole save database. Used by tests to simulate a fresh
 * install; the parent panel's reset uses {@link resetSave} instead.
 */
export async function deleteDatabase(): Promise<void> {
	await new Promise<void>((resolve, reject) => {
		const request = indexedDB.deleteDatabase(DB_NAME);
		request.onsuccess = () => resolve();
		request.onerror = () => reject(request.error);
		request.onblocked = () => reject(new Error("deleteDatabase blocked"));
	});
}
