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
	/** POI tap (fired by the real hotspot buttons, for a11y + keyboard). */
	onPoiTap?: (poi: Poi) => void;
	/** Raw room tap in scene percentages (floor, walls, everything). */
	onRoomTap?: (x: number, y: number) => void;
}

export default function RoomScene({
	layout,
	teddyX,
	teddyY,
	walking,
	facing,
	face,
	costumeFilter = "none",
	onPoiTap,
	onRoomTap,
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
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
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
	}, [walking]);

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
	};

	return (
		<div className="room-scene" ref={sceneRef}>
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
					const coords = sceneCoords(event);
					if (coords) onRoomTap?.(coords.x, coords.y);
				}}
			/>
			{layout.pois.map((poi) => (
				<button
					key={poi.id}
					type="button"
					className="room-poi"
					style={{ left: `${poi.x}%`, top: `${poi.y}%` }}
					aria-label={POI_LABELS[poi.id]}
					onClick={(event) => {
						event.stopPropagation();
						onPoiTap?.(poi);
					}}
				/>
			))}
			<div
				className={`room-teddy${walking ? " walking" : ""}`}
				style={teddyStyle}
			>
				{walking ? (
					<div
						className={`room-teddy-walk${facing === "left" ? " flipped" : ""}`}
						role="img"
						aria-label="Teddy walking"
					/>
				) : (
					<button type="button" className="room-teddy-idle" aria-label="Teddy">
						<img
							ref={spriteRef}
							className="room-teddy-sprite"
							src={blinking ? BLINK_FACE : face}
							alt=""
							draggable={false}
							style={{ filter: costumeFilter }}
						/>
					</button>
				)}
			</div>
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
