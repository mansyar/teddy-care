/**
 * Tests for the runtime breathe mirror.
 *
 * Mirrors the canonical idle spec accepted in pre-production: depth 0.06,
 * 2 breaths per 2 seconds. Face rigidity from the baked preview cannot be
 * reproduced on a flat PNG at runtime, so the mirror scales the whole sprite
 * about its base (feet planted) at a small amplitude.
 */
import { describe, expect, it } from "vitest";
import { BREATHE_DEPTH, BREATHE_PERIOD_MS, breathScaleAt } from "./breathe";

describe("breathScaleAt", () => {
	it("starts at neutral scale (1)", () => {
		expect(breathScaleAt(0)).toBeCloseTo(1, 6);
	});

	it("swells to 1 + depth/2 at the quarter period", () => {
		expect(breathScaleAt(BREATHE_PERIOD_MS / 4)).toBeCloseTo(
			1 + BREATHE_DEPTH / 2,
			6,
		);
	});

	it("returns to neutral at the half period", () => {
		expect(breathScaleAt(BREATHE_PERIOD_MS / 2)).toBeCloseTo(1, 6);
	});

	it("contracts to 1 - depth/2 at the three-quarter period", () => {
		expect(breathScaleAt((3 * BREATHE_PERIOD_MS) / 4)).toBeCloseTo(
			1 - BREATHE_DEPTH / 2,
			6,
		);
	});

	it("is periodic with the breath period", () => {
		expect(breathScaleAt(BREATHE_PERIOD_MS)).toBeCloseTo(breathScaleAt(0), 6);
		expect(breathScaleAt(BREATHE_PERIOD_MS + 123)).toBeCloseTo(
			breathScaleAt(123),
			6,
		);
	});

	it("always stays within the depth envelope", () => {
		for (let t = 0; t < BREATHE_PERIOD_MS; t += 17) {
			const scale = breathScaleAt(t);
			expect(scale).toBeGreaterThanOrEqual(1 - BREATHE_DEPTH / 2 - 1e-9);
			expect(scale).toBeLessThanOrEqual(1 + BREATHE_DEPTH / 2 + 1e-9);
		}
	});
});
