/**
 * Mood derivation: maps Teddy's stats to the face the care screen shows.
 *
 * Pure function of stats plus two transient flags (bedtime mode, mid-feed),
 * so the UI layer stays a thin renderer over tested logic. Priority order is
 * fixed: eating beats everything (it is momentary feedback), then sleepy,
 * then sad, then happy — anything else is the calm idle face.
 */
import type { PetStats } from "../save/store";

/** The five faces Teddy can wear, one per precached emotion still. */
export type Mood = "happy" | "sad" | "sleepy" | "eating" | "idle";

/** Precached art file for each mood (must stay in sync with the PWA manifest). */
export const FACE_FOR_MOOD: Record<Mood, string> = {
	happy: "/teddy/teddy-happy.png",
	sad: "/teddy/teddy-sad.png",
	sleepy: "/teddy/teddy-sleepy.png",
	eating: "/teddy/teddy-eating.png",
	idle: "/teddy/teddy-base.png",
};

/** Transient UI flags that override the stats-derived mood. */
export interface MoodOptions {
	/** Bedtime mode forces the sleepy face (calm, dimmed Teddy). */
	bedtime?: boolean;
	/** A feed is in progress — show the eating face as instant feedback. */
	eating?: boolean;
}

/** A need stat below this reads as "sad, please care for me". */
const SAD_BELOW = 40;
/** Energy below this (or bedtime) reads as "sleepy". */
const SLEEPY_ENERGY_BELOW = 25;
/** Every stat at or above this reads as "happy". */
const HAPPY_AT_LEAST = 70;

/**
 * Derive Teddy's current mood from stats and transient flags.
 */
export function deriveMood(stats: PetStats, opts: MoodOptions = {}): Mood {
	if (opts.eating) return "eating";
	if (opts.bedtime === true || stats.energy < SLEEPY_ENERGY_BELOW)
		return "sleepy";
	const neediest = Math.min(stats.hunger, stats.happiness, stats.cleanliness);
	if (neediest < SAD_BELOW) return "sad";
	const thriving =
		stats.hunger >= HAPPY_AT_LEAST &&
		stats.happiness >= HAPPY_AT_LEAST &&
		stats.energy >= HAPPY_AT_LEAST &&
		stats.cleanliness >= HAPPY_AT_LEAST;
	if (thriving) return "happy";
	return "idle";
}
