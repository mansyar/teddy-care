/**
 * Care screen: Teddy's idle presence.
 *
 * Presentational component (exempt from Vitest per workflow.md — verified via
 * `pnpm build` plus manual/Playwright checks). Shows the base still with a
 * periodic blink swap and a gentle CSS float, so Teddy feels alive before any
 * game logic is wired up.
 */
import { useEffect, useState } from "react";

const BASE_FACE = "/teddy/teddy-base.png";
const BLINK_FACE = "/teddy/teddy-blink.png";
/** How long the blink face stays visible (ms). */
const BLINK_DURATION_MS = 180;
/** Idle delay range between blinks (ms) — relaxed, lifelike rhythm. */
const BLINK_MIN_DELAY_MS = 3000;
const BLINK_MAX_DELAY_MS = 5000;

export default function CareScreen() {
	const [blinking, setBlinking] = useState(false);

	useEffect(() => {
		// Preload the blink still so the swap never flashes.
		const preload = new Image();
		preload.src = BLINK_FACE;

		let blinkTimer: number | undefined;
		let delayTimer: number | undefined;
		let alive = true;

		const scheduleBlink = () => {
			const delay =
				BLINK_MIN_DELAY_MS +
				Math.random() * (BLINK_MAX_DELAY_MS - BLINK_MIN_DELAY_MS);
			delayTimer = window.setTimeout(() => {
				if (!alive) return;
				setBlinking(true);
				blinkTimer = window.setTimeout(() => {
					if (!alive) return;
					setBlinking(false);
					scheduleBlink();
				}, BLINK_DURATION_MS);
			}, delay);
		};
		scheduleBlink();

		return () => {
			alive = false;
			window.clearTimeout(delayTimer);
			window.clearTimeout(blinkTimer);
		};
	}, []);

	return (
		<section aria-label="Care">
			<h1>Teddy Care</h1>
			<div className="teddy-stage">
				<img
					className="teddy-sprite"
					src={blinking ? BLINK_FACE : BASE_FACE}
					alt="Teddy the teddy bear"
					draggable={false}
				/>
			</div>
		</section>
	);
}
