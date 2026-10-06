/**
 * Runner reward math (pure logic — the Phaser scene only reports what
 * happened on the track). Happy-end guarantee: every finished run banks at
 * least 1 star, because there is no losing at age 4.
 */
import type { SaveData } from "../save/store";

/** Track length in meters — a ~30s run at toddler pace. */
export const RUN_FINISH_M = 120;
/** Meters of distance worth one bonus star. */
export const RUN_METERS_PER_STAR = 50;
/** Max stars banked from a single run (wardrobe-flood guard). */
export const RUN_MAX_STARS = 5;
/** Happiness boost from a finished run, clamped at 100 downstream. */
export const RUN_HAPPINESS_BOOST = 10;

export interface RunResult {
	distanceM: number;
	starsGrabbed: number;
}

/** Convert a finished run into bankable stars: [1, RUN_MAX_STARS]. */
export function runReward(result: RunResult): number {
	const reward =
		1 +
		Math.floor(Math.max(0, result.distanceM) / RUN_METERS_PER_STAR) +
		Math.max(0, result.starsGrabbed);
	return Math.min(RUN_MAX_STARS, reward);
}

/** Bank a finished run: add stars and lift happiness. Stats never drop. */
export function awardRun(save: SaveData, result: RunResult): SaveData {
	return {
		...save,
		stars: save.stars + runReward(result),
		stats: {
			...save.stats,
			happiness: Math.min(100, save.stats.happiness + RUN_HAPPINESS_BOOST),
		},
	};
}
