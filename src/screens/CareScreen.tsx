/**
 * Care screen: feed / wash / rest / pet Teddy, watch his stats move and his
 * face react. Wires the save store, stats engine, and mood derivation into
 * the idle presence (blink + breathe + float).
 *
 * Screen-level wiring (glue over fully-tested units) — verified via `pnpm
 * build` plus manual/Playwright checks. Star rewards land in Phase 4.
 */
import { useEffect, useRef, useState } from "react";
import StatBar from "../components/StatBar";
import { breathScaleAt } from "../pet/breathe";
import { deriveMood, FACE_FOR_MOOD } from "../pet/mood";
import type { CareAction } from "../pet/stats";
import { usePetSave } from "../pet/usePetSave";

const BLINK_FACE = "/teddy/teddy-blink.png";
/** How long the blink face stays visible (ms). */
const BLINK_DURATION_MS = 180;
/** Idle delay range between blinks (ms) — relaxed, lifelike rhythm. */
const BLINK_MIN_DELAY_MS = 3000;
const BLINK_MAX_DELAY_MS = 5000;
/** How long the eating face shows after a feed (ms). */
const EATING_FLASH_MS = 1500;

const ACTIONS: { action: CareAction; icon: string; label: string }[] = [
	{ action: "feed", icon: "🍎", label: "Feed" },
	{ action: "wash", icon: "🧼", label: "Wash" },
	{ action: "rest", icon: "😴", label: "Rest" },
	{ action: "pet", icon: "💕", label: "Pet" },
];

const STAT_META = [
	{ key: "hunger", icon: "🍎", label: "Food" },
	{ key: "happiness", icon: "😊", label: "Happy" },
	{ key: "energy", icon: "⚡", label: "Energy" },
	{ key: "cleanliness", icon: "🧼", label: "Clean" },
] as const;

export default function CareScreen() {
	const { save, loading, act } = usePetSave();
	const [blinking, setBlinking] = useState(false);
	const [eating, setEating] = useState(false);
	const spriteRef = useRef<HTMLImageElement>(null);

	// Preload every face so mood swaps never flash.
	useEffect(() => {
		for (const face of Object.values(FACE_FOR_MOOD)) {
			const preload = new Image();
			preload.src = face;
		}
		const blinkPreload = new Image();
		blinkPreload.src = BLINK_FACE;
	}, []);

	useEffect(() => {
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

	useEffect(() => {
		// Runtime breathe mirror: scaleY oscillation, feet planted.
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
		let frame = 0;
		const start = performance.now();
		const tick = (now: number) => {
			const sprite = spriteRef.current;
			if (sprite) {
				sprite.style.transform = `scaleY(${breathScaleAt(now - start)})`;
			}
			frame = requestAnimationFrame(tick);
		};
		frame = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(frame);
	}, []);

	const stats = save?.stats;
	const mood = stats ? deriveMood(stats, { eating }) : "idle";
	const face = blinking ? BLINK_FACE : FACE_FOR_MOOD[mood];

	const handleAction = (action: CareAction) => {
		act(action);
		if (action === "feed") {
			setEating(true);
			window.setTimeout(() => setEating(false), EATING_FLASH_MS);
		}
	};

	return (
		<section aria-label="Care">
			<h1>Teddy Care</h1>
			<div className="teddy-stage">
				<div className="teddy-float">
					<img
						ref={spriteRef}
						className="teddy-sprite"
						src={face}
						alt="Teddy the teddy bear"
						draggable={false}
					/>
				</div>
			</div>
			{loading || !stats ? (
				<div className="placeholder-card">Waking Teddy up…</div>
			) : (
				<>
					<div className="stat-list">
						{STAT_META.map(({ key, icon, label }) => (
							<StatBar key={key} label={label} icon={icon} value={stats[key]} />
						))}
					</div>
					<div className="care-buttons">
						{ACTIONS.map(({ action, icon, label }) => (
							<button
								key={action}
								type="button"
								className="care-btn"
								onClick={() => handleAction(action)}
								aria-label={label}
							>
								<span aria-hidden="true">{icon}</span> {label}
							</button>
						))}
					</div>
				</>
			)}
		</section>
	);
}
