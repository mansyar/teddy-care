/**
 * Parent settings helpers: pure updates over the save's settings block plus
 * the audibility rule. Settings live INSIDE the save (IndexedDB) as the
 * single source of truth — resetting Teddy therefore resets them too, which
 * guarantees no stuck bedtime dim or mute survives a fresh start.
 */
import type { ParentSettings, SaveData } from "../save/store";

/** Merge a settings patch into the save (immutably). */
export function withSettings(
	save: SaveData,
	patch: Partial<ParentSettings>,
): SaveData {
	return { ...save, settings: { ...save.settings, ...patch } };
}

/** Audible only when the parent allows sound AND it is not bedtime. */
export function isAudible(settings: ParentSettings): boolean {
	return !settings.muted && !settings.bedtime;
}
