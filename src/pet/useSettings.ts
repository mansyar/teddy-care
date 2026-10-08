/**
 * Parent settings binding, backed by the save (single source of truth).
 * Reads mute/bedtime from the loaded save, persists patches through the
 * store, and toggles the bedtime dim on the page body. Music itself is
 * owned by the screen-music hook: it stops on mute and swaps in the
 * lullaby at bedtime, so this hook never touches the audio engine
 * directly (a bypass would desync the hook's playing state).
 *
 * Glue over tested settings logic — verified via `pnpm check` + build.
 */
import { useEffect } from "react";
import type { ParentSettings } from "../save/store";
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
	}, [settings]);

	return { settings, updateSettings: persist };
}
