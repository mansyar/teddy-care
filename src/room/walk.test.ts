/**
 * Tests for the walk→act interaction controller.
 *
 * The controller is the kindness layer between taps and actions: a tap
 * either walks Teddy somewhere (with an action waiting for his arrival) or,
 * under prefers-reduced-motion, repositions and acts instantly so nothing
 * ever feels broken when the animation is off. Also covers the pure walk
 * duration model (distance-scaled, clamped) and Teddy's facing.
 */
import { describe, expect, it } from "vitest";
import { LANDSCAPE, PORTRAIT, resolveTap } from "./layout";
import { arrive, startWalk, walkDuration, walkTargetFor } from "./walk";

const LAYOUT = PORTRAIT;
const BOWL = LAYOUT.pois.find((p) => p.id === "bowl")!;
const TOYBOX = LAYOUT.pois.find((p) => p.id === "toybox")!;
const CENTER = { x: LAYOUT.floor.x + LAYOUT.floor.w / 2, y: LAYOUT.floor.y + LAYOUT.floor.h / 2 };

describe("walkTargetFor", () => {
	it("targets the POI anchor itself", () => {
		expect(walkTargetFor(BOWL)).toEqual({ x: BOWL.x, y: BOWL.y });
	});
});

describe("startWalk — animated path", () => {
	it("tap floor: walks to the target and fires no action on arrival", () => {
		const tap = resolveTap(LAYOUT, CENTER.x + 5, CENTER.y);
		expect(tap?.kind).toBe("floor");
		const state = startWalk(
			{ phase: "idle", target: null, pendingAction: null, facing: "right" },
			LAYOUT,
			tap!,
			false,
		);
		expect(state.phase).toBe("walking");
		expect(state.target).toEqual({ x: CENTER.x + 5, y: CENTER.y });
		expect(state.pendingAction).toBeNull();
		const done = arrive(state);
		expect(done.action).toBeNull();
	});

	it("tap POI: walks to the POI with its action waiting for arrival", () => {
		const tap = resolveTap(LAYOUT, BOWL.x, BOWL.y);
		expect(tap?.kind).toBe("poi");
		const state = startWalk(
			{ phase: "idle", target: null, pendingAction: null, facing: "right" },
			LAYOUT,
			tap!,
			false,
		);
		expect(state.phase).toBe("walking");
		expect(state.pendingAction).toEqual(BOWL.action);
		// Arrival fires the pending action exactly once — the caller clears it.
		const done = arrive(state);
		expect(done.action).toEqual(BOWL.action);
		const cleared = { ...state, phase: "idle" as const, pendingAction: null };
		expect(arrive(cleared).action).toBeNull();
	});

	it("tap POI already standing there: acts immediately without walking", () => {
		const tap = resolveTap(LAYOUT, BOWL.x, BOWL.y);
		const state = startWalk(
			{
				phase: "idle",
				target: null,
				pendingAction: null,
				facing: "right",
				position: { x: BOWL.x, y: BOWL.y },
			},
			LAYOUT,
			tap!,
			false,
		);
		expect(state.phase).toBe("idle");
		const done = arrive(state);
		expect(done.action).toEqual(BOWL.action);
	});

	it("facing flips to left when the target is to the left", () => {
		const tap = resolveTap(LAYOUT, BOWL.x, BOWL.y); // bowl is left of center
		const state = startWalk(
			{
				phase: "idle",
				target: null,
				pendingAction: null,
				facing: "right",
				position: CENTER,
			},
			LAYOUT,
			tap!,
			false,
		);
		expect(state.facing).toBe("left");
	});

	it("facing stays right when the target is to the right", () => {
		const tap = resolveTap(LAYOUT, TOYBOX.x, TOYBOX.y);
		const state = startWalk(
			{
				phase: "idle",
				target: null,
				pendingAction: null,
				facing: "right",
				position: CENTER,
			},
			LAYOUT,
			tap!,
			false,
		);
		expect(state.facing).toBe("right");
	});
});

describe("startWalk — reduced motion", () => {
	it("tap POI: fires the action immediately, never enters walking", () => {
		const tap = resolveTap(LAYOUT, BOWL.x, BOWL.y);
		const state = startWalk(
			{
				phase: "idle",
				target: null,
				pendingAction: null,
				facing: "right",
				position: CENTER,
			},
			LAYOUT,
			tap!,
			true,
		);
		expect(state.phase).toBe("idle");
		const done = arrive(state);
		expect(done.action).toEqual(BOWL.action);
		expect(done.position).toEqual({ x: BOWL.x, y: BOWL.y });
	});

	it("tap floor: repositions instantly, no action", () => {
		const tap = resolveTap(LAYOUT, CENTER.x + 5, CENTER.y);
		const state = startWalk(
			{
				phase: "idle",
				target: null,
				pendingAction: null,
				facing: "right",
				position: CENTER,
			},
			LAYOUT,
			tap!,
			true,
		);
		expect(state.phase).toBe("idle");
		const done = arrive(state);
		expect(done.action).toBeNull();
		expect(done.position).toEqual({ x: CENTER.x + 5, y: CENTER.y });
	});
});

describe("walkDuration", () => {
	it("scales with distance", () => {
		const short = walkDuration({ x: 50, y: 60 }, { x: 55, y: 60 });
		const long = walkDuration({ x: 10, y: 60 }, { x: 80, y: 60 });
		expect(long).toBeGreaterThan(short);
	});

	it("clamps to a gentle minimum and maximum", () => {
		expect(walkDuration({ x: 50, y: 60 }, { x: 50.01, y: 60 })).toBeGreaterThanOrEqual(
			300,
		);
		expect(walkDuration({ x: 0, y: 0 }, { x: 100, y: 100 })).toBeLessThanOrEqual(2200);
	});
});

describe("layout sanity for the controller", () => {
	it("both layouts resolve taps for every POI", () => {
		for (const layout of [PORTRAIT, LANDSCAPE]) {
			for (const poi of layout.pois) {
				expect(resolveTap(layout, poi.x, poi.y)?.kind).toBe("poi");
			}
		}
	});
});
