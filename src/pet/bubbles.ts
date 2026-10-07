/**
 * Bubble Pop game logic (pure logic — the screen only reports taps and
 * elapsed time). Happy-end guarantee: every finished round banks at least
 * 1 star, because there is no losing at age 4.
 */
import type { SaveData } from "../save/store";

/** Round length in ms — a ~30s round at toddler pace, like the runner. */
export const BUBBLE_ROUND_MS = 30_000;
/** Pops worth one bonus star. */
export const BUBBLE_POPS_PER_STAR = 8;
/** Max stars banked from a single round (wardrobe-flood guard). */
export const BUBBLE_MAX_STARS = 5;
/** Happiness boost from a finished round, clamped at 100 downstream. */
export const BUBBLE_HAPPINESS_BOOST = 10;

/** How often a new bubble spawns (ms) and how fast it rises, over time. */
export interface BubblePace {
	/** Ms between bubble spawns — shrinks gently across the round. */
	intervalMs: number;
	/** Rise-speed multiplier — grows gently across the round. */
	speed: number;
}

const START_INTERVAL_MS = 900;
const END_INTERVAL_MS = 450;
const END_SPEED = 1.6;

/**
 * Convert pops into bankable stars: [1, BUBBLE_MAX_STARS].
 * 1 star for finishing + 1 per BUBBLE_POPS_PER_STAR pops, clamped.
 */
export function bubbleReward(pops: number): number {
	const reward = 1 + Math.floor(Math.max(0, pops) / BUBBLE_POPS_PER_STAR);
	return Math.min(BUBBLE_MAX_STARS, reward);
}

/** Bank a finished round: add stars and lift happiness. Stats never drop. */
export function awardBubbles(save: SaveData, pops: number): SaveData {
	return {
		...save,
		stars: save.stars + bubbleReward(pops),
		stats: {
			...save.stats,
			happiness: Math.min(
				100,
				save.stats.happiness + BUBBLE_HAPPINESS_BOOST,
			),
		},
	};
}

/**
 * Gentle ramp: spawn interval shrinks and rise speed grows linearly from
 * the calm start to the end-of-round pace, then holds. Negative elapsed
 * time clamps to the calm start.
 */
export function bubblePace(elapsedMs: number): BubblePace {
	const t = Math.min(1, Math.max(0, elapsedMs / BUBBLE_ROUND_MS));
	return {
		intervalMs: START_INTERVAL_MS + t * (END_INTERVAL_MS - START_INTERVAL_MS),
		speed: 1 + t * (END_SPEED - 1),
	};
}
