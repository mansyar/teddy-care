/**
 * Walk→act interaction controller for Teddy's Room.
 *
 * The kindness layer between taps and actions: a tap either walks Teddy
 * somewhere (with a POI action waiting for his arrival) or, under
 * prefers-reduced-motion, repositions and acts instantly so nothing ever
 * feels broken when animations are off. Pure logic — the screen owns timers,
 * sounds, and rendering.
 */
import type { Poi, RoomLayout, TapResult } from "./layout";

export interface Vec2 {
	x: number;
	y: number;
}

/** What Teddy is waiting to do when he arrives. */
export type PendingAction = Poi["action"] | null;

export interface WalkState {
	phase: "idle" | "walking";
	target: Vec2 | null;
	pendingAction: PendingAction;
	facing: "left" | "right";
	/** Where Teddy stands now; defaults to the target once set. */
	position?: Vec2;
}

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
 * below its anchor) so his body doesn't cover it.
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
 * @param state Current controller state.
 * @param layout The active room layout.
 * @param tap Resolved tap from `resolveTap`.
 * @param reducedMotion Whether `prefers-reduced-motion` is active.
 */
export function startWalk(
	state: WalkState,
	_layout: RoomLayout,
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
			};
		}
		return {
			...state,
			phase: "walking",
			target: { x: tap.x, y: tap.y },
			pendingAction: null,
			facing: facingFor(state.position, tap),
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
			facing: facingFor(state.position, { x: target.x, y: target.y }),
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
		facing: facingFor(state.position, target),
	};
}

/** Facing follows walk direction: the strip faces right, flip for left. */
function facingFor(from: Vec2 | undefined, to: Vec2): "left" | "right" {
	if (!from) return "right";
	return to.x < from.x - 0.5 ? "left" : "right";
}

/**
 * Resolve an arrival: fires the pending action and reports Teddy's final
 * position. Exactly-once is owned by the caller — after consuming the
 * arrival it transitions to idle with a cleared pending action.
 */
export function arrive(state: WalkState): Arrival {
	const position = state.position ?? state.target ?? { x: 50, y: 60 };
	return { action: state.pendingAction, position };
}
