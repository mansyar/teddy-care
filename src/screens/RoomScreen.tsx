/**
 * Room screen: Teddy's Room — the wander-around home.
 *
 * Screen-level glue over the tested layout model and walk→act controller:
 * picks the layout for the live viewport, runs the walk timer, and fires
 * POI actions on arrival (care boosts, runner navigation, wardrobe panel).
 * Signature feedback visuals land with the feedback task.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { playGiggle } from "../audio/sound";
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
import RoomScene from "../room/RoomScene";
import { arrive, startWalk, type WalkState, walkDuration } from "../room/walk";

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
	const [eating, setEating] = useState(false);
	const walkTimer = useRef<number | undefined>(undefined);

	const stats = save?.stats;
	const mood = stats
		? deriveMood(stats, { eating, bedtime: settings.bedtime })
		: "idle";
	const costumeFilter =
		COSTUMES.find((c) => c.id === save?.costume)?.filter ?? "none";

	useEffect(() => () => window.clearTimeout(walkTimer.current), []);

	/** Fire a POI action once Teddy arrives (or immediately, reduced motion). */
	const performAction = useCallback(
		(action: Poi["action"]) => {
			if (action.kind === "care") {
				if (action.action === "feed") {
					setEating(true);
					window.setTimeout(() => setEating(false), 1500);
				}
				act(action.action);
			} else if (action.kind === "runner") {
				navigate("/runner");
			} else {
				setWardrobeOpen(true);
			}
		},
		[act, navigate],
	);

	/** Consume an arrival: settle Teddy, fire the waiting action. */
	const finishWalk = useCallback(
		(state: WalkState) => {
			const { action, position } = arrive(state);
			setWalk({
				phase: "idle",
				target: null,
				pendingAction: null,
				facing: state.facing,
				position,
			});
			if (action) performAction(action);
		},
		[performAction],
	);

	const beginWalk = useCallback(
		(tap: TapResult) => {
			window.clearTimeout(walkTimer.current);
			const next = startWalk(walk, layout, tap, reducedMotion);
			setWalk(next);
			if (next.phase === "walking" && next.target) {
				const ms = walkDuration(walk.position ?? next.target, next.target);
				walkTimer.current = window.setTimeout(() => finishWalk(next), ms);
			} else if (next.pendingAction) {
				finishWalk(next);
			}
		},
		[walk, layout, reducedMotion, finishWalk],
	);

	const handleFloorTap = useCallback(
		(x: number, y: number) => beginWalk(resolveTap(layout, x, y)),
		[beginWalk, layout],
	);

	const handlePoiTap = useCallback(
		(poi: Poi) => beginWalk({ kind: "poi", poi }),
		[beginWalk],
	);

	const handleTeddyTap = useCallback(() => {
		act("pet");
		playGiggle(settings);
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
				face={FACE_FOR_MOOD[mood]}
				costumeFilter={costumeFilter}
				onRoomTap={handleFloorTap}
				onPoiTap={handlePoiTap}
				onTeddyTap={handleTeddyTap}
				walkMs={
					walking && target
						? walkDuration(walk.position ?? target, target)
						: undefined
				}
			/>
			{wardrobeOpen && (
				<div
					className="wardrobe-panel"
					role="dialog"
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
						onClick={() => setWardrobeOpen(false)}
						aria-label="Close wardrobe"
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
