/**
 * Walk→act interaction controller for Teddy's Room.
 *
 * The kindness layer between taps and actions: a tap either walks Teddy
 * somewhere (with a POI action waiting for his arrival) or, under
 * prefers-reduced-motion, repositions and acts instantly so nothing ever
 * feels broken when animations are off. Pure logic — the screen owns timers,
 * sounds, and rendering.
 */
import type { Poi, TapResult } from "./layout";

/** A point in scene percentages (0–100 per axis). */
export interface Vec2 {
	x: number;
	y: number;
}

/** What Teddy is waiting to do when he arrives. */
export type PendingAction = Poi["action"] | null;

/**
 * The controller's full state. `position` is where Teddy stands once it has
 * been set; while `phase` is "walking" it still holds the walk's START point
 * and the destination lives in `target`.
 */
export interface WalkState {
	phase: "idle" | "walking";
	target: Vec2 | null;
	pendingAction: PendingAction;
	facing: "left" | "right";
	/** Where Teddy stands now; defaults to the target once set. */
	position?: Vec2;
}

/** What one arrival produced: the action to fire (if any) and where Teddy stands. */
export interface Arrival {
	action: PendingAction;
	position: Vec2;
}

/** Walk speed in scene-percent per second — a gentle trot. */
const WALK_SPEED_PCT_PER_S = 90;
/** Duration clamps so hops feel snappy and crossings never drag. */
const MIN_WALK_MS = 300;
const MAX_WALK_MS = 2200;

/**
 * The point Teddy walks to for a POI: just in front of the object (a bit
 * below its anchor) so his body doesn't cover it. For wall-mounted POIs
 * (portrait bed/closet) the target sits deliberately below the anchor and
 * may lie outside the floor zone — Teddy stands against the wall art.
 */
export function walkTargetFor(poi: Poi): Vec2 {
	return { x: poi.x, y: poi.y + STAND_OFFSET_Y };
}

/** How far in front of an object Teddy plants his feet (scene %). */
const STAND_OFFSET_Y = 6;

/** Straight-line scene distance between two points. */
function distance(a: Vec2, b: Vec2): number {
	return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * Walk duration for a leg, distance-scaled and clamped to gentle bounds.
 * @param from Start in scene percentages.
 * @param to Destination in scene percentages.
 */
export function walkDuration(from: Vec2, to: Vec2): number {
	const ms = (distance(from, to) / WALK_SPEED_PCT_PER_S) * 1000;
	return Math.min(MAX_WALK_MS, Math.max(MIN_WALK_MS, ms));
}

/**
 * Begin a walk from a tap. POI taps target the object with its action
 * waiting; floor taps just roam. Under reduced motion Teddy repositions
 * instantly and any action fires immediately — never a stuck walk.
 *
 * The caller owns timers: clear any pending walk timer before replacing a
 * walk, or the stale timer's arrival would consume the NEW state.
 *
 * @param state Current controller state.
 * @param tap Resolved tap from `resolveTap`.
 * @param reducedMotion Whether `prefers-reduced-motion` is active.
 */
export function startWalk(
	state: WalkState,
	tap: TapResult,
	reducedMotion: boolean,
): WalkState {
	if (!tap) return state;

	if (tap.kind === "floor") {
		if (reducedMotion) {
			return {
				...state,
				phase: "idle",
				target: null,
				pendingAction: null,
				position: { x: tap.x, y: tap.y },
				facing: facingFor(state.position, tap, state.facing),
			};
		}
		return {
			...state,
			phase: "walking",
			target: { x: tap.x, y: tap.y },
			pendingAction: null,
			facing: facingFor(state.position, tap, state.facing),
		};
	}

	const target = walkTargetFor(tap.poi);
	if (reducedMotion) {
		return {
			...state,
			phase: "idle",
			target: null,
			pendingAction: tap.poi.action,
			position: target,
			facing: facingFor(state.position, target, state.facing),
		};
	}
	// Already standing at the object? Act on the spot.
	if (state.position && distance(state.position, target) < 0.5) {
		return {
			...state,
			phase: "idle",
			target: null,
			pendingAction: tap.poi.action,
		};
	}
	return {
		...state,
		phase: "walking",
		target,
		pendingAction: tap.poi.action,
		facing: facingFor(state.position, target, state.facing),
	};
}

/**
 * Facing follows walk direction: the strip faces right, flip for left.
 * Near-vertical moves (|dx| within the dead zone) keep the current facing
 * so tiny hops never make Teddy twitch sideways.
 */
function facingFor(
	from: Vec2 | undefined,
	to: Vec2,
	current: "left" | "right",
): "left" | "right" {
	if (!from) return current;
	if (to.x < from.x - 0.5) return "left";
	if (to.x > from.x + 0.5) return "right";
	return current;
}

/**
 * Resolve an arrival: fires the pending action and reports Teddy's final
 * position. A primitive — prefer `completeWalk`, which also produces the
 * settled idle state.
 */
export function arrive(state: WalkState): Arrival {
	// A walking state has just reached its target — the stale `position`
	// field is where the walk STARTED, never where Teddy stands now.
	const position = state.target ?? state.position ?? { x: 50, y: 60 };
	return { action: state.pendingAction, position };
}

/**
 * Consume an arrival: fires the pending action exactly once and returns the
 * settled idle state plus what fired. The canonical way to finish both
 * animated walks and reduced-motion/in-place actions.
 */
export function completeWalk(state: WalkState): {
	state: WalkState;
	arrival: Arrival;
} {
	const arrival = arrive(state);
	return {
		state: {
			...state,
			phase: "idle",
			target: null,
			pendingAction: null,
			position: arrival.position,
		},
		arrival,
	};
}
