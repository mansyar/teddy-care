/**
 * Care screen: feed / wash / rest / pet Teddy, watch his stats move and his
 * face react. Wires the save store, stats engine, and mood derivation into
 * the idle presence (blink + breathe + float), plus touch reactivity (tap
 * squash, happy flashes, idle antics).
 *
 * Screen-level wiring (glue over fully-tested units) — verified via `pnpm
 * build` plus manual/Playwright checks. Star rewards land in Phase 4, and
 * the giggle sound lands with the Phase 6 audio placeholders.
 */
import { useCallback, useEffect, useRef, useState } from "react";
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
/** How long the happy face flashes after a tap or idle antic (ms). */
const JOY_FLASH_MS = 1200;
/** Idle antic schedule: Teddy entertains himself every 20–40s. */
const IDLE_MIN_DELAY_MS = 20000;
const IDLE_MAX_DELAY_MS = 40000;

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
	const [joy, setJoy] = useState(false);
	const spriteRef = useRef<HTMLImageElement>(null);
	const floatRef = useRef<HTMLDivElement>(null);
	const joyTimer = useRef<number | undefined>(undefined);

	// Preload every face so mood swaps never flash.
	useEffect(() => {
		for (const face of Object.values(FACE_FOR_MOOD)) {
			const preload = new Image();
			preload.src = face;
		}
		const blinkPreload = new Image();
		blinkPreload.src = BLINK_FACE;
		return () => window.clearTimeout(joyTimer.current);
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

	const flashJoy = useCallback(() => {
		window.clearTimeout(joyTimer.current);
		setJoy(true);
		joyTimer.current = window.setTimeout(() => setJoy(false), JOY_FLASH_MS);
	}, []);

	/** Squash-and-stretch on the float wrapper (composes with breathe). */
	const squash = () => {
		floatRef.current?.animate(
			[
				{ transform: "scale(1, 1)" },
				{ transform: "scale(1.15, 0.8)", offset: 0.35 },
				{ transform: "scale(0.95, 1.05)", offset: 0.7 },
				{ transform: "scale(1, 1)" },
			],
			{ duration: 320, easing: "ease-out" },
		);
	};

	/** Little hop for idle antics. */
	const hop = useCallback(() => {
		floatRef.current?.animate(
			[
				{ transform: "translateY(0)" },
				{ transform: "translateY(-28px)", offset: 0.45 },
				{ transform: "translateY(0)" },
			],
			{ duration: 480, easing: "ease-out" },
		);
	}, []);

	// Idle antics: every 20–40s Teddy hops and beams to invite play.
	useEffect(() => {
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
		let timer: number | undefined;
		let alive = true;
		const scheduleAntic = () => {
			const delay =
				IDLE_MIN_DELAY_MS +
				Math.random() * (IDLE_MAX_DELAY_MS - IDLE_MIN_DELAY_MS);
			timer = window.setTimeout(() => {
				if (!alive) return;
				hop();
				flashJoy();
				scheduleAntic();
			}, delay);
		};
		scheduleAntic();
		return () => {
			alive = false;
			window.clearTimeout(timer);
		};
	}, [flashJoy, hop]);

	const stats = save?.stats;
	const mood = stats ? deriveMood(stats, { eating }) : "idle";
	const face = blinking
		? BLINK_FACE
		: eating
			? FACE_FOR_MOOD.eating
			: joy
				? FACE_FOR_MOOD.happy
				: FACE_FOR_MOOD[mood];

	const handleAction = (action: CareAction) => {
		act(action);
		if (action === "feed") {
			setEating(true);
			window.setTimeout(() => setEating(false), EATING_FLASH_MS);
		}
		if (action === "pet") {
			squash();
			flashJoy();
		}
	};

	const handleTapTeddy = () => {
		// Phase 6 will add the giggle sound here.
		squash();
		flashJoy();
	};

	return (
		<section aria-label="Care">
			<h1>Teddy Care</h1>
			<div className="teddy-stage">
				<div className="teddy-float" ref={floatRef}>
					<button
						type="button"
						className="teddy-tap"
						onClick={handleTapTeddy}
						aria-label="Say hi to Teddy"
					>
						<img
							ref={spriteRef}
							className="teddy-sprite"
							src={face}
							alt="Teddy the teddy bear"
							draggable={false}
						/>
					</button>
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
