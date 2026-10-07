/**
 * Bubbles screen: the Bubble Pop mini-game.
 *
 * A 30s round of rising soap bubbles; every tap pops one with a bright
 * blip and a star burst, and the corner counter counts up. Bubbles that
 * drift past the top simply leave — there is no missing and no losing.
 * When time runs out the round banks stars via the shared reward math
 * and celebrates with an "All done!" card and an "Again!" replay.
 *
 * Screen-level wiring (glue over tested reward/pacing logic) — verified
 * via `pnpm build` plus manual/Playwright runs.
 */
import {
	type CSSProperties,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import { playFanfare, playPopBubble } from "../audio/sound";
import { BUBBLE_ROUND_MS, bubblePace, bubbleReward } from "../pet/bubbles";
import { usePrefersReducedMotion } from "../pet/useMotion";
import { usePetSave } from "../pet/usePetSave";
import { useSettings } from "../pet/useSettings";

/** One floating bubble on the stage. */
interface Bubble {
	/** Monotonic id (React key + repeat-tap safety). */
	id: number;
	/** Horizontal spawn position, % of stage width. */
	x: number;
	/** Diameter in px — shrinks gently as the round warms up. */
	size: number;
	/** Rise duration in s — shortened by the gentle ramp speed. */
	durationS: number;
}

/** Reduced motion: a bubble parked in place instead of rising. */
interface ParkedBubble extends Bubble {
	/** Vertical position, % of stage height. */
	y: number;
}

/** Star burst feedback at a pop point (% of stage). */
interface Burst {
	id: number;
	x: number;
	y: number;
}

const SIZE_START_PX = 88;
const SIZE_END_PX = 60;
/** Rise time for a full screen at speed 1 (s); the ramp shortens it. */
const RISE_S = 9;
/** Reduced-motion bubbles stay poppable; the oldest yields when crowded. */
const PARKED_LIMIT = 12;
/** Where a risen bubble ends up (any vh plus its own size margin). */
const RISE_TO = "calc(-115vh - 120px)";

export default function BubblesScreen() {
	const { awardBubbles } = usePetSave();
	const { settings } = useSettings();
	const reducedMotion = usePrefersReducedMotion();
	const stageRef = useRef<HTMLDivElement>(null);

	const [pops, setPops] = useState(0);
	const [bubbles, setBubbles] = useState<(Bubble | ParkedBubble)[]>([]);
	const [burst, setBurst] = useState<Burst | null>(null);
	const [finished, setFinished] = useState<{
		pops: number;
		reward: number;
	} | null>(null);
	const [roundId, setRoundId] = useState(0);

	// Latest settings for sounds fired from timer callbacks.
	const settingsRef = useRef(settings);
	settingsRef.current = settings;
	const reducedRef = useRef(reducedMotion);
	reducedRef.current = reducedMotion;

	const popCountRef = useRef(0);
	const bubbleSeq = useRef(0);
	const burstSeq = useRef(0);
	const spawnTimer = useRef<number | undefined>(undefined);
	const roundTimer = useRef<number | undefined>(undefined);
	const burstTimer = useRef<number | undefined>(undefined);
	const startedAt = useRef(0);

	/** Spawn one bubble at the current pace. */
	const spawnBubble = useCallback(() => {
		const elapsed = Date.now() - startedAt.current;
		const pace = bubblePace(elapsed);
		const t = Math.min(1, elapsed / BUBBLE_ROUND_MS);
		bubbleSeq.current += 1;
		const bubble: Bubble | ParkedBubble = {
			id: bubbleSeq.current,
			x: 8 + Math.random() * 84,
			size: SIZE_START_PX + t * (SIZE_END_PX - SIZE_START_PX),
			durationS: RISE_S / pace.speed,
		};
		if (reducedRef.current) {
			(bubble as ParkedBubble).y = 15 + Math.random() * 55;
			setBubbles((prev) => {
				const next = [...prev, bubble];
				return next.length > PARKED_LIMIT ? next.slice(1) : next;
			});
		} else {
			setBubbles((prev) => [...prev, bubble]);
		}
	}, []);

	// One round lifecycle per roundId: spawn loop + round timer. roundId is a
	// restart signal (same pattern as RunnerScreen's runId remount).
	// biome-ignore lint/correctness/useExhaustiveDependencies: roundId intentionally triggers a fresh round.
	useEffect(() => {
		popCountRef.current = 0;
		setPops(0);
		setBubbles([]);
		setFinished(null);
		startedAt.current = Date.now();

		const scheduleSpawn = () => {
			const elapsed = Date.now() - startedAt.current;
			const pace = bubblePace(elapsed);
			spawnTimer.current = window.setTimeout(() => {
				spawnBubble();
				scheduleSpawn();
			}, pace.intervalMs);
		};
		scheduleSpawn();
		roundTimer.current = window.setTimeout(() => {
			window.clearTimeout(spawnTimer.current);
			const count = popCountRef.current;
			const reward = bubbleReward(count);
			setFinished({ pops: count, reward });
			awardBubbles(count);
			playFanfare(settingsRef.current);
		}, BUBBLE_ROUND_MS);

		return () => {
			window.clearTimeout(spawnTimer.current);
			window.clearTimeout(roundTimer.current);
		};
	}, [roundId, awardBubbles, spawnBubble]);

	const popBubble = useCallback(
		(id: number, event: React.MouseEvent<HTMLElement>) => {
			const stage = stageRef.current;
			setBubbles((prev) => prev.filter((b) => b.id !== id));
			popCountRef.current += 1;
			setPops(popCountRef.current);
			playPopBubble(settingsRef.current);
			if (stage) {
				const rect = stage.getBoundingClientRect();
				burstSeq.current += 1;
				setBurst({
					id: burstSeq.current,
					x: ((event.clientX - rect.left) / rect.width) * 100,
					y: ((event.clientY - rect.top) / rect.height) * 100,
				});
				window.clearTimeout(burstTimer.current);
				burstTimer.current = window.setTimeout(() => setBurst(null), 600);
			}
		},
		[],
	);

	const playAgain = useCallback(() => {
		setRoundId((id) => id + 1);
	}, []);

	return (
		<section aria-label="Bubble popping game" className="bubbles-page">
			<h1>Bubble Pop!</h1>
			<div className="bubbles-stage" ref={stageRef} data-testid="bubbles-stage">
				{bubbles.map((bubble) => {
					const style: CSSProperties = {
						left: `${bubble.x}%`,
						width: `${bubble.size}px`,
						height: `${bubble.size}px`,
					};
					if (reducedMotion) {
						style.top = `${(bubble as ParkedBubble).y}%`;
					} else {
						style.animationDuration = `${bubble.durationS}s`;
						(style as CSSProperties & Record<string, string>)["--rise-to"] =
							RISE_TO;
					}
					return (
						<button
							key={bubble.id}
							type="button"
							className={
								"bubble-pop-btn" +
								(reducedMotion ? " bubble-parked" : " bubble-rising")
							}
							style={style}
							onClick={(event) => popBubble(bubble.id, event)}
							onAnimationEnd={() =>
								setBubbles((prev) => prev.filter((b) => b.id !== bubble.id))
							}
							aria-label="Pop the bubble"
						>
							<img src="/teddy/bubble.webp" alt="" draggable={false} />
						</button>
					);
				})}
				{burst && (
					<span
						key={burst.id}
						className="bubble-burst"
						style={{ left: `${burst.x}%`, top: `${burst.y}%` }}
						aria-hidden="true"
					>
						✨
					</span>
				)}
			</div>
			<div
				className="bubble-counter"
				role="status"
				aria-label={`${pops} bubbles popped`}
			>
				<span aria-hidden="true">🫧</span> {pops}
			</div>
			{finished && (
				<div className="wardrobe-card" role="status">
					<span>
						<span aria-hidden="true">🎉</span> All done! Teddy popped{" "}
						{finished.pops} {finished.pops === 1 ? "bubble" : "bubbles"} and
						earned ⭐{finished.reward}!
					</span>
					<button
						type="button"
						className="care-btn"
						onClick={playAgain}
						aria-label="Pop bubbles again"
					>
						Again!
					</button>
				</div>
			)}
		</section>
	);
}
