/**
 * Pure stats engine for Teddy's four care stats.
 *
 * All functions are pure (no I/O, no clock reads) so the wall-clock delta is
 * always injected by the caller — this keeps decay math fully testable and
 * the game fully offline. Decay is deliberately gentle: hours of neglect make
 * Teddy sad, never broken — care actions always recover him in one session.
 */
import type { PetStats, SaveData } from "../save/store";

/** Points lost per hour of wall-clock absence, per stat. */
const DECAY_PER_HOUR: PetStats = {
	hunger: 12,
	happiness: 8,
	energy: 6,
	cleanliness: 8,
};

/** Points restored by each care action. */
const CARE_BOOST = {
	feed: { stat: "hunger", amount: 30 },
	wash: { stat: "cleanliness", amount: 30 },
	rest: { stat: "energy", amount: 35 },
	pet: { stat: "happiness", amount: 25 },
} as const;

/** The four toddler-safe care actions. */
export type CareAction = keyof typeof CARE_BOOST;

const MIN_STAT = 0;
const MAX_STAT = 100;

/** Clamp a stat value into the valid 0–100 range. */
function clamp(value: number): number {
	return Math.min(MAX_STAT, Math.max(MIN_STAT, value));
}

/** A full, healthy set of stats (fresh-install / fully-recovered Teddy). */
export function fullStats(): PetStats {
	return { hunger: 100, happiness: 100, energy: 100, cleanliness: 100 };
}

/**
 * Decay stats for the given elapsed wall-clock time.
 * Never drops below zero — neglect is sad, never terminal.
 */
export function applyDecay(stats: PetStats, elapsedMs: number): PetStats {
	const hours = Math.max(0, elapsedMs) / (60 * 60 * 1000);
	return {
		hunger: clamp(stats.hunger - DECAY_PER_HOUR.hunger * hours),
		happiness: clamp(stats.happiness - DECAY_PER_HOUR.happiness * hours),
		energy: clamp(stats.energy - DECAY_PER_HOUR.energy * hours),
		cleanliness: clamp(stats.cleanliness - DECAY_PER_HOUR.cleanliness * hours),
	};
}

/**
 * Apply one care action, boosting its stat (clamped at 100).
 * Works from any state, including all-zero — recovery is always possible.
 */
export function applyCareAction(stats: PetStats, action: CareAction): PetStats {
	const { stat, amount } = CARE_BOOST[action];
	return { ...stats, [stat]: clamp(stats[stat] + amount) };
}

/**
 * Decay a save's stats from its `lastSeen` timestamp to `now`, and stamp
 * `lastSeen = now`. Clock skew (now before lastSeen) counts as zero elapsed.
 */
export function applyWallClockDecay(save: SaveData, now: number): SaveData {
	const elapsed = Math.max(0, now - save.lastSeen);
	return { ...save, stats: applyDecay(save.stats, elapsed), lastSeen: now };
}
