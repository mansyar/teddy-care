/**
 * `useScreenMusic`: one theme, always, for the whole app.
 *
 * The pure heart is `decideMusic` — given the desired theme, whether the
 * engine is playing, the parent settings, the current route, and whether
 * the user has made their first gesture, it resolves exactly one active
 * theme (or a clean stop that keeps the desired theme, so unmuting
 * restores the right music). The hook itself is thin wiring: it listens
 * for the first gesture, re-evaluates on settings/route changes, and
 * drives `startMusic`/`stopMusic`. Bedtime swaps the theme to the
 * lullaby instead of silencing; only mute silences music.
 */
import { useCallback, useEffect, useRef } from "react";
import type { ParentSettings } from "../save/store";
import { startMusic, stopMusic } from "./sound";
import { THEMES, themeFor } from "./themes";

/** What the hook should do right now, and which theme it wants. */
export interface MusicDecision {
	/** The theme the hook wants playing (kept across mute). */
	themeId: string;
	/** play = start or crossfade to it; stop = silence, keep the theme. */
	command: "play" | "stop" | "none";
}

/**
 * Resolve exactly one active theme. `previous` is the desired theme id
 * (kept even while muted); `playing` is whether the engine is actually
 * sounding; `unlocked` is whether the first gesture happened yet.
 */
export function decideMusic(
	previous: string | null,
	playing: boolean,
	settings: ParentSettings,
	route: string,
	unlocked: boolean,
): MusicDecision {
	if (!unlocked) return { themeId: previous ?? "", command: "none" };
	if (settings.muted) {
		return { themeId: previous ?? "", command: playing ? "stop" : "none" };
	}
	const theme = themeFor(route, settings.bedtime);
	if (playing && theme.id === previous) {
		return { themeId: theme.id, command: "none" };
	}
	return { themeId: theme.id, command: "play" };
}

/** Keep exactly one theme playing across routes, settings, and gestures. */
export function useScreenMusic(settings: ParentSettings, route: string): void {
	const themeId = useRef<string | null>(null);
	const playing = useRef(false);
	const unlocked = useRef(false);

	const evaluate = useCallback(() => {
		const decision = decideMusic(
			themeId.current,
			playing.current,
			settings,
			route,
			unlocked.current,
		);
		if (decision.command === "play") {
			// Bedtime steers the theme, not the gate: `isAudible` stays the
			// single authoritative gate, so hand it a bedtime-neutral copy.
			startMusic({ ...settings, bedtime: false }, THEMES[decision.themeId]);
			themeId.current = decision.themeId;
			playing.current = true;
		} else if (decision.command === "stop") {
			stopMusic();
			playing.current = false;
		}
	}, [settings, route]);

	useEffect(() => {
		evaluate();
	}, [evaluate]);

	useEffect(() => {
		const unlock = () => {
			if (unlocked.current) return;
			unlocked.current = true;
			evaluate();
		};
		window.addEventListener("pointerdown", unlock);
		window.addEventListener("keydown", unlock);
		return () => {
			window.removeEventListener("pointerdown", unlock);
			window.removeEventListener("keydown", unlock);
		};
	}, [evaluate]);
}
