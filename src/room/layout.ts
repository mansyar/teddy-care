/**
 * Room layout: the scene-coordinate model for Teddy's Room.
 *
 * Scene coordinates are percentages (0–100) of the room area, so the same
 * layout data drives both generated art layouts via CSS positioning.
 * Two compositions exist (portrait and landscape, per the spec) and POI
 * anchors differ between them. Tap resolution decides whether a touch hit a
 * POI hotspot (≥48px at the 360px baseline), open floor (walk target), or
 * nothing.
 */
import type { CareAction } from "../pet/stats";

/** The five tappable objects in Teddy's Room. */
export type PoiId = "bowl" | "bed" | "tub" | "toybox" | "closet";

/** What a POI does when Teddy arrives and acts. */
export type PoiAction =
	| { kind: "care"; action: CareAction }
	| { kind: "runner" }
	| { kind: "wardrobe" };

/** A room object, anchored in scene percentages. */
export interface Poi {
	id: PoiId;
	action: PoiAction;
	x: number;
	y: number;
}

/** Walkable floor zone in scene percentages. */
export interface FloorZone {
	x: number;
	y: number;
	w: number;
	h: number;
}

/** One of the two generated room art layouts. */
export interface RoomLayout {
	orientation: "portrait" | "landscape";
	pois: Poi[];
	floor: FloorZone;
}

/** POI hotspot half-width in scene percentages. 8% of 360px ⇒ 57.6px
 * diameter, comfortably above the 48px touch-target guideline. */
export const HOTSPOT_RADIUS_PCT = 8;

/** Portrait composition: a cozy vertical room (360px baseline). */
const PORTRAIT: RoomLayout = {
	orientation: "portrait",
	pois: [
		{ id: "bed", action: { kind: "care", action: "rest" }, x: 24, y: 38 },
		{ id: "closet", action: { kind: "wardrobe" }, x: 83, y: 31 },
		{ id: "tub", action: { kind: "care", action: "wash" }, x: 81, y: 52 },
		{ id: "bowl", action: { kind: "care", action: "feed" }, x: 14, y: 83 },
		{ id: "toybox", action: { kind: "runner" }, x: 81, y: 79 },
	],
	floor: { x: 0, y: 55, w: 100, h: 45 },
};

/** Landscape composition: the same room spread wide. */
const LANDSCAPE: RoomLayout = {
	orientation: "landscape",
	pois: [
		{ id: "bed", action: { kind: "care", action: "rest" }, x: 16, y: 58 },
		{ id: "closet", action: { kind: "wardrobe" }, x: 30, y: 38 },
		{ id: "tub", action: { kind: "care", action: "wash" }, x: 69, y: 53 },
		{ id: "bowl", action: { kind: "care", action: "feed" }, x: 73, y: 78 },
		{ id: "toybox", action: { kind: "runner" }, x: 88, y: 65 },
	],
	floor: { x: 0, y: 40, w: 100, h: 60 },
};

/**
 * Pick the room layout matching the viewport's orientation.
 * @param width Viewport width in px.
 * @param height Viewport height in px.
 */
export function resolveLayout(width: number, height: number): RoomLayout {
	return height >= width ? PORTRAIT : LANDSCAPE;
}

/** The result of interpreting a tap on the room. */
export type TapResult =
	| { kind: "poi"; poi: Poi }
	| { kind: "floor"; x: number; y: number }
	| null;

/**
 * Resolve a scene-coordinate tap into a POI hit, a floor walk target, or
 * nothing. POI hotspots win over the floor so objects are always grabbable.
 * @param layout The active room layout.
 * @param x Tap x in scene percentages.
 * @param y Tap y in scene percentages.
 */
export function resolveTap(
	layout: RoomLayout,
	x: number,
	y: number,
): TapResult {
	for (const poi of layout.pois) {
		if (
			Math.abs(poi.x - x) <= HOTSPOT_RADIUS_PCT &&
			Math.abs(poi.y - y) <= HOTSPOT_RADIUS_PCT
		) {
			return { kind: "poi", poi };
		}
	}
	const { floor } = layout;
	if (
		x >= floor.x &&
		x <= floor.x + floor.w &&
		y >= floor.y &&
		y <= floor.y + floor.h
	) {
		return { kind: "floor", x, y };
	}
	return null;
}
