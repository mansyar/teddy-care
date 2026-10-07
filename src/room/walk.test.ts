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
import {
	LANDSCAPE,
	PORTRAIT,
	type Poi,
	type PoiId,
	type RoomLayout,
	resolveTap,
	type TapResult,
} from "./layout";
import {
	arrive,
	completeWalk,
	startWalk,
	walkDuration,
	walkTargetFor,
} from "./walk";

const LAYOUT = PORTRAIT;
const BOWL = poiOrThrow(LAYOUT, "bowl");
const TOYBOX = poiOrThrow(LAYOUT, "toybox");
const CENTER = {
	x: LAYOUT.floor.x + LAYOUT.floor.w / 2,
	y: LAYOUT.floor.y + LAYOUT.floor.h / 2,
};

function poiOrThrow(layout: RoomLayout, id: PoiId): Poi {
	const found = layout.pois.find((p) => p.id === id);
	if (!found) throw new Error(`missing POI ${id}`);
	return found;
}

function tapOrThrow(tap: TapResult | null): TapResult {
	if (!tap) throw new Error("tap resolved to nothing");
	return tap;
}

describe("walkTargetFor", () => {
	it("targets a point just in front of the POI anchor", () => {
		expect(walkTargetFor(BOWL)).toEqual({ x: BOWL.x, y: BOWL.y + 6 });
	});
});

describe("startWalk — animated path", () => {
	it("tap floor: walks to the target and fires no action on arrival", () => {
		const tap = resolveTap(LAYOUT, CENTER.x + 5, CENTER.y);
		expect(tap?.kind).toBe("floor");
		const state = startWalk(
			{ phase: "idle", target: null, pendingAction: null, facing: "right" },
			tapOrThrow(tap),
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
			tapOrThrow(tap),
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
				position: { x: BOWL.x, y: BOWL.y + 6 },
			},
			tapOrThrow(tap),
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
			tapOrThrow(tap),
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
			tapOrThrow(tap),
			false,
		);
		expect(state.facing).toBe("right");
	});

	it("facing is preserved for near-vertical hops (dead zone)", () => {
		const tap = resolveTap(LAYOUT, CENTER.x - 0.4, CENTER.y);
		expect(tap?.kind).toBe("floor");
		const state = startWalk(
			{
				phase: "idle",
				target: null,
				pendingAction: null,
				facing: "left",
				position: CENTER,
			},
			tapOrThrow(tap),
			false,
		);
		expect(state.facing).toBe("left");
	});

	it("retargeting mid-walk replaces the pending action", () => {
		const bed = poiOrThrow(LAYOUT, "bed");
		const walking = startWalk(
			{ phase: "idle", target: null, pendingAction: null, facing: "right" },
			{ kind: "poi", poi: BOWL },
			false,
		);
		const retargeted = startWalk(walking, { kind: "poi", poi: bed }, false);
		expect(retargeted.pendingAction).toBe(bed.action);
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
			tapOrThrow(tap),
			true,
		);
		expect(state.phase).toBe("idle");
		const done = arrive(state);
		expect(done.action).toEqual(BOWL.action);
		expect(done.position).toEqual({ x: BOWL.x, y: BOWL.y + 6 });
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
			tapOrThrow(tap),
			true,
		);
		expect(state.phase).toBe("idle");
		const done = arrive(state);
		expect(done.action).toBeNull();
		expect(done.position).toEqual({ x: CENTER.x + 5, y: CENTER.y });
	});

	it("tap floor under reduced motion: still turns toward the destination", () => {
		const tap = resolveTap(LAYOUT, CENTER.x + 5, CENTER.y);
		const state = startWalk(
			{
				phase: "idle",
				target: null,
				pendingAction: null,
				facing: "right",
				position: CENTER,
			},
			tapOrThrow(tap),
			true,
		);
		expect(state.facing).toBe("right");
	});

	it("tap floor left under reduced motion: flips to face left", () => {
		const tap = resolveTap(LAYOUT, CENTER.x - 5, CENTER.y);
		const state = startWalk(
			{
				phase: "idle",
				target: null,
				pendingAction: null,
				facing: "right",
				position: CENTER,
			},
			tapOrThrow(tap),
			true,
		);
		expect(state.facing).toBe("left");
	});
});

describe("walkDuration", () => {
	it("scales with distance", () => {
		const short = walkDuration({ x: 50, y: 60 }, { x: 55, y: 60 });
		const long = walkDuration({ x: 10, y: 60 }, { x: 80, y: 60 });
		expect(long).toBeGreaterThan(short);
	});

	it("clamps to a gentle minimum and maximum", () => {
		expect(
			walkDuration({ x: 50, y: 60 }, { x: 50.01, y: 60 }),
		).toBeGreaterThanOrEqual(300);
		expect(
			walkDuration({ x: 0, y: 0 }, { x: 100, y: 100 }),
		).toBeLessThanOrEqual(2200);
	});
});

describe("arrive", () => {
	it("an animated walk lands on the target, not the old position", () => {
		const tap = resolveTap(LAYOUT, CENTER.x + 5, CENTER.y);
		expect(tap?.kind).toBe("floor");
		const state = startWalk(
			{
				phase: "idle",
				target: null,
				pendingAction: null,
				facing: "right",
				position: CENTER,
			},
			tapOrThrow(tap),
			false,
		);
		const done = arrive(state);
		expect(done.action).toBeNull();
		expect(done.position).toEqual({ x: CENTER.x + 5, y: CENTER.y });
	});

	it("an already-standing arrival keeps the current position", () => {
		const poi = poiOrThrow(LAYOUT, "bowl");
		const target = walkTargetFor(poi);
		const state = startWalk(
			{
				phase: "idle",
				target: null,
				pendingAction: null,
				facing: "right",
				position: target,
			},
			{ kind: "poi", poi },
			false,
		);
		const done = arrive(state);
		expect(done.position).toEqual(target);
		expect(done.action).toBe(poi.action);
	});
});

describe("completeWalk", () => {
	it("settles an animated walk: idle at the target, action surfaced once", () => {
		const tap = resolveTap(LAYOUT, BOWL.x, BOWL.y);
		const state = startWalk(
			{ phase: "idle", target: null, pendingAction: null, facing: "right" },
			tapOrThrow(tap),
			false,
		);
		const { state: settled, arrival } = completeWalk(state);
		expect(settled.phase).toBe("idle");
		expect(settled.target).toBeNull();
		expect(settled.pendingAction).toBeNull();
		expect(settled.position).toEqual(walkTargetFor(BOWL));
		expect(arrival.action).toEqual(BOWL.action);
	});

	it("settles a plain floor roam with no action", () => {
		const tap = resolveTap(LAYOUT, CENTER.x + 5, CENTER.y);
		const state = startWalk(
			{ phase: "idle", target: null, pendingAction: null, facing: "right" },
			tapOrThrow(tap),
			false,
		);
		const { state: settled, arrival } = completeWalk(state);
		expect(arrival.action).toBeNull();
		expect(settled.position).toEqual({ x: CENTER.x + 5, y: CENTER.y });
	});
});

describe("walkTargetFor — wall POIs", () => {
	it("wall-mounted POIs sit just below their anchors (Teddy stands against the wall)", () => {
		// Portrait bed/closet anchors sit above the floor line by design;
		// the target overlaps the wall art deliberately.
		for (const id of ["bed", "closet"] as const) {
			const poi = poiOrThrow(LAYOUT, id);
			expect(walkTargetFor(poi)).toEqual({ x: poi.x, y: poi.y + 6 });
		}
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
