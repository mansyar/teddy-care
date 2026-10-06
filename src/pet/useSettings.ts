/**
 * Parent settings binding, backed by the save (single source of truth).
 * Reads mute/bedtime from the loaded save, persists patches through the
 * store, silences music the moment sound stops being allowed, and toggles
 * the bedtime dim on the page body.
 *
 * Glue over tested settings logic — verified via `pnpm check` + build.
 */
import { useEffect } from "react";
import { stopMusic } from "../audio/sound";
import type { ParentSettings } from "../save/store";
import { isAudible } from "./settings";
import { usePetSave } from "./usePetSave";

export interface SettingsState {
	settings: ParentSettings;
	updateSettings: (patch: Partial<ParentSettings>) => void;
}

const FALLBACK: ParentSettings = { muted: false, bedtime: false };

export function useSettings(): SettingsState {
	const { save, updateSettings: persist } = usePetSave();
	const settings = save?.settings ?? FALLBACK;

	// Bedtime dims the whole app (calm night tint).
	useEffect(() => {
		document.body.classList.toggle("bedtime", settings.bedtime);
		if (!isAudible(settings)) stopMusic();
	}, [settings]);

	return { settings, updateSettings: persist };
}
