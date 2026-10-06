/**
 * Tests for the pet stats engine (TDD — written before implementation).
 *
 * Covers: gentle hourly decay math, wall-clock deltas on load, clamping at
 * 0/100, and the kindness rule (neglect can never brick Teddy — care actions
 * always work, even from rock bottom).
 */
import { describe, expect, it } from "vitest";
import type { SaveData } from "../save/store";
import { DEFAULT_SAVE } from "../save/store";
import {
	applyCareAction,
	applyDecay,
	applyWallClockDecay,
	fullStats,
} from "./stats";

describe("applyDecay", () => {
	it("decays each stat gently over one hour", () => {
		const decayed = applyDecay(fullStats(), 60 * 60 * 1000);
		expect(decayed.hunger).toBeLessThan(100);
		expect(decayed.happiness).toBeLessThan(100);
		expect(decayed.energy).toBeLessThan(100);
		expect(decayed.cleanliness).toBeLessThan(100);
		// Gentle: no stat may lose more than a quarter in a single hour.
		expect(decayed.hunger).toBeGreaterThanOrEqual(75);
		expect(decayed.happiness).toBeGreaterThanOrEqual(75);
		expect(decayed.energy).toBeGreaterThanOrEqual(75);
		expect(decayed.cleanliness).toBeGreaterThanOrEqual(75);
	});

	it("leaves stats untouched when no time has passed", () => {
		expect(applyDecay(fullStats(), 0)).toEqual(fullStats());
	});

	it("clamps at zero after a full day of neglect (never negative)", () => {
		const decayed = applyDecay(fullStats(), 24 * 60 * 60 * 1000);
		expect(decayed.hunger).toBe(0);
		expect(decayed.happiness).toBe(0);
		expect(decayed.energy).toBe(0);
		expect(decayed.cleanliness).toBe(0);
	});
});

describe("applyCareAction", () => {
	it("feed restores hunger", () => {
		const stats = applyCareAction({ ...fullStats(), hunger: 40 }, "feed");
		expect(stats.hunger).toBeGreaterThan(40);
	});

	it("wash restores cleanliness, rest restores energy, pet restores happiness", () => {
		const low = { hunger: 10, happiness: 10, energy: 10, cleanliness: 10 };
		expect(applyCareAction(low, "wash").cleanliness).toBeGreaterThan(10);
		expect(applyCareAction(low, "rest").energy).toBeGreaterThan(10);
		expect(applyCareAction(low, "pet").happiness).toBeGreaterThan(10);
	});

	it("clamps restored stats at 100", () => {
		const stats = applyCareAction(fullStats(), "feed");
		expect(stats.hunger).toBe(100);
	});

	it("kindness: care actions fully work from all-zero stats", () => {
		const zero = { hunger: 0, happiness: 0, energy: 0, cleanliness: 0 };
		expect(applyCareAction(zero, "feed").hunger).toBeGreaterThan(0);
		expect(applyCareAction(zero, "wash").cleanliness).toBeGreaterThan(0);
		expect(applyCareAction(zero, "rest").energy).toBeGreaterThan(0);
		expect(applyCareAction(zero, "pet").happiness).toBeGreaterThan(0);
	});
});

describe("applyWallClockDecay", () => {
	it("decays stats from lastSeen and stamps the new timestamp", () => {
		const now = 2_000_000_000_000;
		const save: SaveData = {
			...DEFAULT_SAVE,
			lastSeen: now - 60 * 60 * 1000,
		};
		const next = applyWallClockDecay(save, now);
		expect(next.stats.hunger).toBeLessThan(100);
		expect(next.lastSeen).toBe(now);
	});

	it("treats clock skew (now before lastSeen) as zero elapsed", () => {
		const save: SaveData = { ...DEFAULT_SAVE, lastSeen: 9999 };
		const next = applyWallClockDecay(save, 1000);
		expect(next.stats).toEqual(DEFAULT_SAVE.stats);
		expect(next.lastSeen).toBe(1000);
	});
});
