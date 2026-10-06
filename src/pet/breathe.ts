/**
 * Runtime mirror of the canonical breathe envelope.
 *
 * Accepted idle spec (pre-production): depth 0.06, 2 breaths per 2 seconds.
 * The baked preview kept the face zone rigid; on a flat runtime PNG the
 * mirror scales the whole sprite about its base (feet planted, via
 * `transform-origin: bottom`) at the same small amplitude.
 */

/** Full peak-to-peak swell of the envelope (0.06 = ±3% around neutral). */
export const BREATHE_DEPTH = 0.06;
/** One breath per second: 2 breaths per 2 seconds. */
export const BREATHE_PERIOD_MS = 1000;

/**
 * Vertical scale factor of the breathe envelope at an elapsed time.
 *
 * @param elapsedMs Milliseconds since the breathe loop started (any value).
 * @returns Scale in [1 - depth/2, 1 + depth/2], periodic with the breath period.
 */
export function breathScaleAt(elapsedMs: number): number {
	const phase = (2 * Math.PI * elapsedMs) / BREATHE_PERIOD_MS;
	return 1 + (BREATHE_DEPTH / 2) * Math.sin(phase);
}
