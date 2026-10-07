/**
 * Tests for the room layout module (TDD — written before implementation).
 *
 * Covers: the POI registry (five objects and their actions), orientation
 * layout selection (portrait vs landscape), and tap resolution (POI vs floor
 * vs nothing). Scene coordinates are percentages (0–100) so CSS reflow stays
 * art-agnostic.
 */
import { describe, expect, it } from "vitest";
import {
	HOTSPOT_RADIUS_PCT,
	type PoiId,
	resolveLayout,
	resolveTap,
} from "./layout";

const POI_IDS: PoiId[] = ["bowl", "bed", "tub", "toybox", "closet"];

describe("resolveLayout", () => {
	it("returns a portrait layout when the viewport is taller than wide", () => {
		expect(resolveLayout(360, 640).orientation).toBe("portrait");
		expect(resolveLayout(360, 360).orientation).toBe("portrait");
	});

	it("returns a landscape layout when the viewport is wider than tall", () => {
		expect(resolveLayout(640, 360).orientation).toBe("landscape");
	});

	it("contains all five POIs with unique ids and correct actions", () => {
		const layout = resolveLayout(360, 640);
		const ids = layout.pois.map((p) => p.id);
		expect(new Set(ids).size).toBe(5);
		expect(ids.sort()).toEqual([...POI_IDS].sort());

		const byId = Object.fromEntries(layout.pois.map((p) => [p.id, p]));
		expect(byId.bowl.action).toEqual({ kind: "care", action: "feed" });
		expect(byId.bed.action).toEqual({ kind: "care", action: "rest" });
		expect(byId.tub.action).toEqual({ kind: "care", action: "wash" });
		expect(byId.toybox.action).toEqual({ kind: "runner" });
		expect(byId.closet.action).toEqual({ kind: "wardrobe" });
	});

	it("keeps every POI anchor inside the scene bounds", () => {
		for (const [w, h] of [
			[360, 640],
			[640, 360],
		]) {
			for (const poi of resolveLayout(w, h).pois) {
				expect(poi.x).toBeGreaterThanOrEqual(0);
				expect(poi.x).toBeLessThanOrEqual(100);
				expect(poi.y).toBeGreaterThanOrEqual(0);
				expect(poi.y).toBeLessThanOrEqual(100);
			}
		}
	});

	it("places POIs differently per orientation (two real art layouts)", () => {
		const portrait = resolveLayout(360, 640);
		const landscape = resolveLayout(640, 360);
		const same = POI_IDS.every((id) => {
			const a = portrait.pois.find((p) => p.id === id);
			const b = landscape.pois.find((p) => p.id === id);
			return a && b && a.x === b.x && a.y === b.y;
		});
		expect(same).toBe(false);
	});

	it("defines a walkable floor zone inside the scene bounds", () => {
		const floor = resolveLayout(360, 640).floor;
		expect(floor.x).toBeGreaterThanOrEqual(0);
		expect(floor.y).toBeGreaterThanOrEqual(0);
		expect(floor.x + floor.w).toBeLessThanOrEqual(100);
		expect(floor.y + floor.h).toBeLessThanOrEqual(100);
		expect(floor.w).toBeGreaterThan(0);
		expect(floor.h).toBeGreaterThan(0);
	});
});

describe("resolveTap", () => {
	const layout = resolveLayout(360, 640);

	it("resolves a tap on a POI anchor to that POI", () => {
		for (const poi of layout.pois) {
			const tap = resolveTap(layout, poi.x, poi.y);
			expect(tap).toEqual({ kind: "poi", poi });
		}
	});

	it("resolves a tap on open floor to a floor target", () => {
		const floor = layout.floor;
		const cx = floor.x + floor.w / 2;
		const cy = floor.y + floor.h / 2;
		// Centre of the floor must not coincide with any POI hotspot.
		const hit = layout.pois.some(
			(p) =>
				Math.abs(p.x - cx) < HOTSPOT_RADIUS_PCT &&
				Math.abs(p.y - cy) < HOTSPOT_RADIUS_PCT,
		);
		expect(hit).toBe(false);
		expect(resolveTap(layout, cx, cy)).toEqual({
			kind: "floor",
			x: cx,
			y: cy,
		});
	});

	it("ignores taps outside both POIs and the floor", () => {
		expect(resolveTap(layout, 50, 0.5)).toBeNull();
	});
});

describe("touch target size", () => {
	it("hotspot diameter meets the 48px guideline at the 360px baseline", () => {
		// Diameter in CSS px = HOTSPOT_RADIUS_PCT * 2% of 360px.
		const diameterPx = ((HOTSPOT_RADIUS_PCT * 2) / 100) * 360;
		expect(diameterPx).toBeGreaterThanOrEqual(48);
	});
});
