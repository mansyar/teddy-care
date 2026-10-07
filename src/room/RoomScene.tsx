/**
 * RoomScene: the presentational stage for Teddy's Room.
 *
 * Renders the generated room art for the active orientation, tappable POI
 * hotspots anchored in scene percentages, and Teddy himself (idle presence:
 * blink + breathe, mood face, costume filter) plus the walk-strip animation
 * while he moves. The scene reports raw taps upward in scene coordinates;
 * the interaction controller (walk→act) owns resolution and actions.
 *
 * Presentational — verified via Playwright render checks + manual pass.
 */
import { type CSSProperties, useEffect, useRef, useState } from "react";
import { breathScaleAt } from "../pet/breathe";
import type { Poi, RoomLayout } from "./layout";
import type { RoomObjectState } from "./state";

/** A floating feedback burst on the room (FR6 signature feedback). */
export interface RoomEffect {
	/** Monotonic id so repeat taps restart the animation. */
	id: number;
	kind: "bubbles" | "zzz" | "sparkle" | "hearts" | "sun";
	x: number;
	y: number;
}

const BLINK_FACE = "/teddy/teddy-blink.png";
/** How long the blink face stays visible (ms). */
const BLINK_DURATION_MS = 180;
/** Idle delay range between blinks (ms) — relaxed, lifelike rhythm. */
const BLINK_MIN_DELAY_MS = 3000;
const BLINK_MAX_DELAY_MS = 5000;

/** Walk-strip cycle metadata lives in CSS (34 cells of 417x520, 1.4167s). */

export interface RoomSceneProps {
	/** The active layout (matches the current orientation). */
	layout: RoomLayout;
	/** Teddy's position in scene percentages. */
	teddyX: number;
	teddyY: number;
	/** Whether Teddy is walking between targets (plays the walk strip). */
	walking: boolean;
	/** Face right (default) or mirrored to face left while walking. */
	facing: "right" | "left";
	/** Mood face image src shown when idle (blink overrides briefly). */
	face: string;
	/** CSS filter for the equipped costume. */
	costumeFilter?: string;
	/** Stat-driven object states (bowl fill, groom, droop). */
	objectState?: RoomObjectState;
	/** Bedtime staging: night tint, glowing bed, sleeping Teddy. */
	bedtime?: boolean;
	/** Live `prefers-reduced-motion` state from the screen (gates breathe). */
	reducedMotion?: boolean;
	/** POI tap (fired by the real hotspot buttons, for a11y + keyboard). */
	onPoiTap?: (poi: Poi) => void;
	/** Raw room tap in scene percentages (floor, walls, everything). */
	onRoomTap?: (x: number, y: number) => void;
	/** Tap on Teddy himself: pet action. */
	onTeddyTap?: () => void;
	/** Walk duration for the current leg; drives the CSS transition. */
	walkMs?: number;
	/** Floating feedback burst (bubbles, Zzz, sparkles…). */
	effect?: RoomEffect | null;
	/** Brief squash-and-stretch when Teddy is petted. */
	petting?: boolean;
}

export default function RoomScene({
	layout,
	teddyX,
	teddyY,
	walking,
	facing,
	face,
	costumeFilter = "none",
	objectState,
	bedtime = false,
	reducedMotion = false,
	onPoiTap,
	onRoomTap,
	onTeddyTap,
	walkMs,
	effect,
	petting = false,
}: RoomSceneProps) {
	const [blinking, setBlinking] = useState(false);
	const spriteRef = useRef<HTMLImageElement>(null);

	// Preload the blink face so swaps never flash.
	useEffect(() => {
		const preload = new Image();
		preload.src = BLINK_FACE;
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

	// Runtime breathe mirror: scaleY oscillation, feet planted.
	useEffect(() => {
		if (reducedMotion) return;
		if (walking) return;
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
	}, [reducedMotion, walking]);

	const background =
		layout.orientation === "portrait"
			? "/teddy/room-portrait.webp"
			: "/teddy/room-landscape.webp";

	const sceneRef = useRef<HTMLDivElement>(null);

	/** Translate a pointer event into scene percentages for the controller. */
	const sceneCoords = (event: React.MouseEvent<HTMLElement>) => {
		const scene = sceneRef.current;
		if (!scene) return null;
		const rect = scene.getBoundingClientRect();
		return {
			x: ((event.clientX - rect.left) / rect.width) * 100,
			y: ((event.clientY - rect.top) / rect.height) * 100,
		};
	};

	const teddyStyle: CSSProperties = {
		left: `${teddyX}%`,
		top: `${teddyY}%`,
		transitionDuration: walkMs !== undefined ? `${walkMs}ms` : undefined,
	};

	// Object-state look: a subtle scruffy tint joins the costume filter, and
	// tired Teddy droops (via the independent `rotate`/`scale` properties so
	// the breathe rAF transform keeps working).
	const groomTint =
		objectState?.groom === "messy"
			? " sepia(0.3) saturate(0.8)"
			: objectState?.groom === "scruffy"
				? " sepia(0.18) saturate(0.9)"
				: "";
	const spriteFilter =
		`${costumeFilter === "none" ? "" : costumeFilter}${groomTint}`.trim();
	const droopClass =
		objectState?.droop === "exhausted"
			? " exhausted"
			: objectState?.droop === "droopy"
				? " droopy"
				: "";

	// The bowl hints when it needs care — gently, never alarmingly.
	const bowl = layout.pois.find((poi) => poi.id === "bowl");
	const bowlHint =
		objectState?.bowl === "empty"
			? "empty"
			: objectState?.bowl === "low"
				? "low"
				: null;

	return (
		// Backdrop tap catch-all (window/walls). Pointer-only by design:
		// keyboard users navigate via the floor, POI, and Teddy buttons.
		// biome-ignore lint/a11y/noStaticElementInteractions: pointer-only backdrop target
		// biome-ignore lint/a11y/useKeyWithClickEvents: keyboard users have the floor button
		<div
			className={`room-scene${bedtime ? " night" : ""}`}
			ref={sceneRef}
			onClick={(event) => {
				// Taps on the bare backdrop (walls, window) bubble here; POIs,
				// floor, and Teddy stop propagation below.
				const coords = sceneCoords(event);
				if (coords) onRoomTap?.(coords.x, coords.y);
			}}
		>
			{" "}
			<img className="room-bg" src={background} alt="" draggable={false} />
			<button
				type="button"
				className="room-floor"
				style={{
					left: `${layout.floor.x}%`,
					top: `${layout.floor.y}%`,
					width: `${layout.floor.w}%`,
					height: `${layout.floor.h}%`,
				}}
				aria-label="Room floor"
				onClick={(event) => {
					event.stopPropagation();
					// Keyboard activation has no pointer position — head for the
					// middle of the floor so Enter still walks Teddy somewhere.
					const coords =
						event.detail === 0
							? {
									x: layout.floor.x + layout.floor.w / 2,
									y: layout.floor.y + layout.floor.h / 2,
								}
							: sceneCoords(event);
					if (coords) onRoomTap?.(coords.x, coords.y);
				}}
			/>
			{layout.pois.map((poi) => (
				<button
					key={poi.id}
					type="button"
					className="room-poi"
					style={{ left: `${poi.x}%`, top: `${poi.y}%` }}
					data-poi={poi.id}
					aria-label={POI_LABELS[poi.id]}
					onClick={(event) => {
						event.stopPropagation();
						onPoiTap?.(poi);
					}}
				/>
			))}
			<div
				className={`room-teddy${walking ? " walking" : ""}${droopClass}`}
				style={teddyStyle}
			>
				{walking ? (
					<div
						className={`room-teddy-walk${facing === "left" ? " flipped" : ""}`}
						role="img"
						aria-label="Teddy walking"
					/>
				) : (
					<button
						type="button"
						className="room-teddy-idle"
						aria-label="Teddy"
						onClick={(event) => {
							event.stopPropagation();
							onTeddyTap?.();
						}}
					>
						<img
							ref={spriteRef}
							className={`room-teddy-sprite${petting ? " petting" : ""}`}
							src={blinking ? BLINK_FACE : face}
							alt=""
							draggable={false}
							style={{ filter: spriteFilter }}
						/>
					</button>
				)}
				{bedtime && (
					<span className="room-sleep" aria-hidden="true">
						💤
					</span>
				)}
			</div>
			{bowlHint && bowl && (
				<span
					className={`room-bowl-hint ${bowlHint}`}
					style={{ left: `${bowl.x}%`, top: `${bowl.y}%` }}
					aria-hidden="true"
				>
					🥣
				</span>
			)}
			{effect && (
				<span
					key={effect.id}
					className={`room-fx room-fx-${effect.kind}`}
					style={{ left: `${effect.x}%`, top: `${effect.y}%` }}
					aria-hidden="true"
				>
					{EFFECT_EMOJI[effect.kind]}
				</span>
			)}
		</div>
	);
}

const POI_LABELS: Record<Poi["id"], string> = {
	bowl: "Teddy's food bowl",
	bed: "Teddy's bed",
	tub: "Teddy's bathtub",
	toybox: "Teddy's toy box",
	closet: "Teddy's wardrobe",
};

const EFFECT_EMOJI: Record<RoomEffect["kind"], string> = {
	bubbles: "🫧",
	zzz: "💤",
	sparkle: "✨",
	hearts: "💕",
	sun: "☀️",
};
