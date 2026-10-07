/**
 * Stat→object-state mapping for Teddy's Room (track teddys_room_20261007).
 *
 * The room tells the truth about Teddy's care without numbers or scare
 * tactics: the bowl visibly empties as hunger decays, Teddy looks scruffier
 * as cleanliness drops, and he droops as energy drains. Thresholds are kind —
 * the worst states only appear when care is genuinely overdue.
 */
import type { PetStats } from "../save/store";

/** How full Teddy's bowl looks. */
export type BowlState = "full" | "half" | "low" | "empty";

/** How groomed Teddy looks. */
export type GroomState = "clean" | "scruffy" | "messy";

/** How energetic Teddy's posture looks. */
export type DroopState = "perky" | "droopy" | "exhausted";

export interface RoomObjectState {
	bowl: BowlState;
	groom: GroomState;
	droop: DroopState;
}

/**
 * Map Teddy's stats to the room's object states.
 * @param stats Teddy's current stats (each clamped 0–100 upstream).
 */
export function roomObjectState(stats: PetStats): RoomObjectState {
	return {
		bowl: bowlFor(stats.hunger),
		groom: groomFor(stats.cleanliness),
		droop: droopFor(stats.energy),
	};
}

function bowlFor(hunger: number): BowlState {
	if (hunger >= 70) return "full";
	if (hunger >= 40) return "half";
	if (hunger >= 15) return "low";
	return "empty";
}

function groomFor(cleanliness: number): GroomState {
	if (cleanliness >= 70) return "clean";
	if (cleanliness >= 35) return "scruffy";
	return "messy";
}

function droopFor(energy: number): DroopState {
	if (energy >= 40) return "perky";
	if (energy >= 15) return "droopy";
	return "exhausted";
}
