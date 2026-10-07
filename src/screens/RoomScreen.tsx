/**
 * Room screen: Teddy's Room — the wander-around home.
 *
 * Screen-level glue over the tested layout model and walk→act controller:
 * picks the layout for the live viewport, runs the walk timer, and fires
 * POI actions on arrival (care boosts, runner navigation, wardrobe panel)
 * with signature feedback per POI plus rug/window easter eggs.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
	playFizz,
	playFootsteps,
	playGiggle,
	playMunch,
	playPop,
	playStar,
	playYawn,
} from "../audio/sound";
import { COSTUMES } from "../pet/costume";
import { deriveMood, FACE_FOR_MOOD } from "../pet/mood";
import { usePetSave } from "../pet/usePetSave";
import { useSettings } from "../pet/useSettings";
import {
	type Poi,
	type RoomLayout,
	resolveLayout,
	resolveTap,
	type TapResult,
} from "../room/layout";
import RoomScene, { type RoomEffect } from "../room/RoomScene";
import { roomObjectState } from "../room/state";
import {
	completeWalk,
	startWalk,
	type Vec2,
	type WalkState,
	walkDuration,
} from "../room/walk";

/** Track `prefers-reduced-motion` live. */
function usePrefersReducedMotion() {
	const [reduced, setReduced] = useState(
		() => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
	);
	useEffect(() => {
		const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
		const onChange = () => setReduced(mq.matches);
		mq.addEventListener("change", onChange);
		return () => mq.removeEventListener("change", onChange);
	}, []);
	return reduced;
}

/** Orientation-tracked room layout. */
function useRoomLayout(): RoomLayout {
	const [layout, setLayout] = useState(() =>
		resolveLayout(window.innerWidth, window.innerHeight),
	);
	useEffect(() => {
		const onResize = () =>
			setLayout(resolveLayout(window.innerWidth, window.innerHeight));
		window.addEventListener("resize", onResize);
		return () => window.removeEventListener("resize", onResize);
	}, []);
	return layout;
}

const INITIAL_WALK: WalkState = {
	phase: "idle",
	target: null,
	pendingAction: null,
	facing: "right",
};

export default function RoomScreen() {
	const { save, loading, act, buy } = usePetSave();
	const { settings } = useSettings();
	const navigate = useNavigate();
	const layout = useRoomLayout();
	const reducedMotion = usePrefersReducedMotion();

	const [walk, setWalk] = useState<WalkState>(() => ({
		...INITIAL_WALK,
		position: centerOf(layout),
	}));
	const [wardrobeOpen, setWardrobeOpen] = useState(false);
	const [menuOpen, setMenuOpen] = useState(false);
	const [eating, setEating] = useState(false);
	const [sleepyFlash, setSleepyFlash] = useState(false);
	const [effect, setEffect] = useState<RoomEffect | null>(null);
	const [petting, setPetting] = useState(false);
	const closeWardrobeRef = useRef<HTMLButtonElement>(null);
	const closeMenuRef = useRef<HTMLButtonElement>(null);
	const walkTimer = useRef<number | undefined>(undefined);
	const stepTimer = useRef<number | undefined>(undefined);
	const effectTimer = useRef<number | undefined>(undefined);
	const effectSeq = useRef(0);

	const stats = save?.stats;
	const mood = stats
		? deriveMood(stats, { eating, bedtime: settings.bedtime })
		: "idle";
	const face = sleepyFlash ? FACE_FOR_MOOD.sleepy : FACE_FOR_MOOD[mood];
	const costumeFilter =
		COSTUMES.find((c) => c.id === save?.costume)?.filter ?? "none";
	const objectState = stats ? roomObjectState(stats) : undefined;

	useEffect(
		() => () => {
			window.clearTimeout(walkTimer.current);
			window.clearInterval(stepTimer.current);
			window.clearTimeout(effectTimer.current);
		},
		[],
	);

	// The wardrobe and the mini-game menu are modal dialogs: focus lands on
	// Close when either opens, and Escape closes it — kindness for keyboard
	// and switch users.
	useEffect(() => {
		if (!wardrobeOpen && !menuOpen) return;
		const closeRef = wardrobeOpen ? closeWardrobeRef : closeMenuRef;
		closeRef.current?.focus();
		const onKey = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				setWardrobeOpen(false);
				setMenuOpen(false);
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [wardrobeOpen, menuOpen]);

	/** Signature feedback per POI, plus rug/window easter eggs (FR6). */
	const showEffect = useCallback(
		(kind: RoomEffect["kind"], x: number, y: number) => {
			window.clearTimeout(effectTimer.current);
			effectSeq.current += 1;
			setEffect({ id: effectSeq.current, kind, x, y });
			effectTimer.current = window.setTimeout(() => setEffect(null), 1600);
		},
		[],
	);

	/** Fire a POI action once Teddy arrives (or immediately, reduced motion). */
	const performAction = useCallback(
		(action: Poi["action"], at: Vec2) => {
			if (action.kind === "care") {
				if (action.action === "feed") {
					setEating(true);
					window.setTimeout(() => setEating(false), 1500);
					playMunch(settings);
				} else if (action.action === "wash") {
					showEffect("bubbles", at.x, at.y - 12);
					playFizz(settings);
				} else {
					setSleepyFlash(true);
					window.setTimeout(() => setSleepyFlash(false), 1800);
					showEffect("zzz", at.x, at.y - 22);
					playYawn(settings);
				}
				act(action.action);
			} else if (action.kind === "runner") {
				showEffect("sparkle", at.x, at.y - 25);
				playStar(settings);
				// The toy box now opens the mini-game menu — the sparkle lands
				// while the chooser pops up over the room.
				setMenuOpen(true);
			} else {
				showEffect("sparkle", at.x, at.y - 25);
				playGiggle(settings);
				setWardrobeOpen(true);
			}
		},
		[act, settings, showEffect],
	);

	/** Consume an arrival: settle Teddy, fire the waiting action. */
	const finishWalk = useCallback(
		(state: WalkState) => {
			window.clearInterval(stepTimer.current);
			const { state: settled, arrival } = completeWalk(state);
			setWalk(settled);
			if (arrival.action) performAction(arrival.action, arrival.position);
		},
		[performAction],
	);

	const beginWalk = useCallback(
		(tap: TapResult) => {
			window.clearTimeout(walkTimer.current);
			window.clearInterval(stepTimer.current);
			const next = startWalk(walk, tap, reducedMotion);
			setWalk(next);
			if (next.phase === "walking" && next.target) {
				// Soft footstep ticks for as long as the stroll lasts.
				stepTimer.current = window.setInterval(
					() => playFootsteps(settings),
					500,
				);
				const ms = walkDuration(walk.position ?? next.target, next.target);
				walkTimer.current = window.setTimeout(() => finishWalk(next), ms);
			} else if (next.pendingAction) {
				finishWalk(next);
			}
		},
		[walk, reducedMotion, settings, finishWalk],
	);

	const handleRoomTap = useCallback(
		(x: number, y: number) => {
			// Easter eggs first: the rug and the window answer taps with
			// delight, even though the rug lies inside the walkable floor.
			const rug =
				layout.orientation === "portrait" ? { x: 46, y: 67 } : { x: 48, y: 80 };
			const win = { x: 50, y: layout.orientation === "portrait" ? 10 : 22 };
			if (Math.hypot(rug.x - x, rug.y - y) < 10) {
				showEffect("hearts", x, y);
				playPop(settings);
				return;
			}
			if (Math.hypot(win.x - x, win.y - y) < 10) {
				showEffect("sun", x, y);
				playStar(settings);
				return;
			}
			const tap = resolveTap(layout, x, y);
			if (tap) beginWalk(tap);
		},
		[beginWalk, layout, settings, showEffect],
	);

	const handlePoiTap = useCallback(
		(poi: Poi) => beginWalk({ kind: "poi", poi }),
		[beginWalk],
	);

	const handleTeddyTap = useCallback(() => {
		act("pet");
		playGiggle(settings);
		setPetting(true);
		window.setTimeout(() => setPetting(false), 420);
	}, [act, settings]);

	// While walking Teddy heads for the target; idle he stands where he arrived.
	const walking = walk.phase === "walking";
	const target = walk.target;
	const displayX = walking && target ? target.x : (walk.position?.x ?? 50);
	const displayY = walking && target ? target.y : (walk.position?.y ?? 60);

	return (
		<section aria-label="Teddy's Room" className="room-page">
			<RoomScene
				layout={layout}
				teddyX={displayX}
				teddyY={displayY}
				walking={walking}
				facing={walk.facing}
				face={face}
				costumeFilter={costumeFilter}
				objectState={objectState}
				bedtime={settings.bedtime}
				reducedMotion={reducedMotion}
				onRoomTap={handleRoomTap}
				onPoiTap={handlePoiTap}
				onTeddyTap={handleTeddyTap}
				walkMs={
					walking && target
						? walkDuration(walk.position ?? target, target)
						: undefined
				}
				effect={effect}
				petting={petting}
			/>
			{save && (
				<div
					className="star-chip room-star-chip"
					role="status"
					aria-label={`${save.stars} stars`}
				>
					<span aria-hidden="true">⭐</span> {save.stars}
				</div>
			)}
			{wardrobeOpen && (
				<div
					className="wardrobe-panel"
					role="dialog"
					aria-modal="true"
					aria-label="Teddy's wardrobe"
				>
					<img src="/teddy/closet.webp" alt="" className="wardrobe-art" />
					{COSTUMES.map((costume) => {
						const owned = save?.costume === costume.id;
						const affordable = (save?.stars ?? 0) >= costume.price;
						return (
							<div className="wardrobe-card" key={costume.id}>
								<span aria-hidden="true">{costume.icon}</span>{" "}
								{owned
									? `Teddy loves his ${costume.name}!`
									: `${costume.name} — ⭐${costume.price}`}
								{!owned && (
									<button
										type="button"
										className="care-btn"
										disabled={!affordable}
										onClick={() => buy(costume.id)}
										aria-label={
											affordable
												? `Buy ${costume.name} for ${costume.price} stars`
												: `${costume.name} costs ${costume.price} stars, keep caring for Teddy`
										}
									>
										{affordable
											? "Get it!"
											: `⭐${costume.price - (save?.stars ?? 0)} to go`}
									</button>
								)}
							</div>
						);
					})}
					<button
						type="button"
						className="care-btn"
						ref={closeWardrobeRef}
						onClick={() => setWardrobeOpen(false)}
						aria-label="Close wardrobe"
					>
						Close
					</button>
				</div>
			)}
			{menuOpen && (
				<div
					className="mini-menu-panel"
					role="dialog"
					aria-modal="true"
					aria-label="Teddy's games"
				>
					<button
						type="button"
						className="mini-menu-btn"
						onClick={() => navigate("/runner")}
						aria-label="Play the running game"
					>
						<span aria-hidden="true">🏃</span> Run!
					</button>
					<button
						type="button"
						className="mini-menu-btn"
						onClick={() => navigate("/bubbles")}
						aria-label="Play the bubble popping game"
					>
						<span aria-hidden="true">🫧</span> Bubbles!
					</button>
					<button
						type="button"
						className="care-btn"
						ref={closeMenuRef}
						onClick={() => setMenuOpen(false)}
						aria-label="Close game menu"
					>
						Close
					</button>
				</div>
			)}
			{loading && <div className="placeholder-card">Waking Teddy up…</div>}
		</section>
	);
}

function centerOf(layout: RoomLayout) {
	return {
		x: layout.floor.x + layout.floor.w / 2,
		y: layout.floor.y + layout.floor.h * 0.8,
	};
}
