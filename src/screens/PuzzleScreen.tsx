/**
 * Puzzle Pieces screen — a tap-to-place jigsaw: tap a piece, tap its
 * outline. Screen-level glue over the tested round/placement logic in
 * ../pet/puzzle; sounds and reduced-motion follow the app-wide settings.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { playBoop, playPickup, playSnap, playStar } from "../audio/sound";
import { usePetSaveContext } from "../pet/PetSaveProvider";
import {
	createRound,
	isRoundComplete,
	PUZZLE_ROUNDS,
	type PuzzleState,
	placeSelected,
	selectPiece,
	sliceBoard,
	slotBackgroundPosition,
} from "../pet/puzzle";
import { useSettings } from "../pet/useSettings";

/** Where the round flow stands: playing, between rounds, or all done. */
type Phase = "play" | "break" | "done";

/** A piece briefly shakes after a wrong-slot bounce-back. */
interface Shake {
	id: number;
	seq: number;
}

/** Pause so the final piece's pop is seen before the between-round card. */
const CARD_DELAY_MS = 900;

/** Percentage-based background-size that stretches the picture rows×cols. */
function backgroundSize(roundIndex: number): string {
	const { rows, cols } = PUZZLE_ROUNDS[roundIndex];
	return `${cols * 100}% ${rows * 100}%`;
}

export default function PuzzleScreen() {
	const { awardPuzzleRound } = usePetSaveContext();
	const { settings } = useSettings();
	const navigate = useNavigate();
	const [state, setState] = useState<PuzzleState>(() => createRound(0));
	const [phase, setPhase] = useState<Phase>("play");
	const [shake, setShake] = useState<Shake | null>(null);
	const shakeTimer = useRef<number | undefined>(undefined);
	const cardTimer = useRef<number | undefined>(undefined);

	const slots = sliceBoard(state.roundIndex);
	const round = PUZZLE_ROUNDS[state.roundIndex];

	useEffect(
		() => () => {
			window.clearTimeout(shakeTimer.current);
			window.clearTimeout(cardTimer.current);
		},
		[],
	);

	const tapPiece = useCallback(
		(id: number) => {
			if (phase !== "play") return;
			const next = selectPiece(state, id);
			if (next !== state) {
				playPickup(settings);
				setState(next);
			}
		},
		[phase, state, settings],
	);

	const tapSlot = useCallback(
		(slot: number) => {
			if (phase !== "play" || state.selected === null) return;
			const { state: next, outcome } = placeSelected(state, slot);
			if (outcome === "none") return;
			setState(next);
			if (outcome === "wrong") {
				playBoop(settings);
				const id = state.selected;
				setShake({ id, seq: (shake?.seq ?? 0) + 1 });
				window.clearTimeout(shakeTimer.current);
				shakeTimer.current = window.setTimeout(() => setShake(null), 500);
				return;
			}
			playSnap(settings);
			if (!isRoundComplete(next)) return;
			// Round complete: bank the star right away, then celebrate.
			awardPuzzleRound();
			playStar(settings);
			const finished = state.roundIndex + 1 >= PUZZLE_ROUNDS.length;
			window.clearTimeout(cardTimer.current);
			cardTimer.current = window.setTimeout(
				() => setPhase(finished ? "done" : "break"),
				CARD_DELAY_MS,
			);
		},
		[phase, state, shake, settings, awardPuzzleRound],
	);

	const nextRound = useCallback(() => {
		const upcoming = state.roundIndex + 1;
		setState(createRound(Math.min(upcoming, PUZZLE_ROUNDS.length - 1)));
		setPhase("play");
	}, [state.roundIndex]);

	const playAgain = useCallback(() => {
		setState(createRound(0));
		setPhase("play");
	}, []);

	const trayPieces = state.pieces.filter((piece) => !state.placed[piece.id]);

	return (
		<section className="puzzle-page" aria-label="Puzzle game">
			<h1>Puzzle Time!</h1>
			<div className="puzzle-pips" aria-hidden="true">
				{PUZZLE_ROUNDS.map((round, index) => (
					<span
						key={round.src}
						className={
							index < state.roundIndex || phase === "done"
								? "pip done-pip"
								: index === state.roundIndex
									? "pip current-pip"
									: "pip"
						}
					/>
				))}
			</div>
			<div className="puzzle-board" data-testid="puzzle-board">
				{slots.map((slot, index) => (
					<button
						type="button"
						key={`${slot.leftPct}-${slot.topPct}`}
						className={
							state.placed[index]
								? "puzzle-slot puzzle-slot-filled"
								: "puzzle-slot"
						}
						style={{
							left: `${slot.leftPct}%`,
							top: `${slot.topPct}%`,
							width: `${slot.widthPct}%`,
							height: `${slot.heightPct}%`,
							backgroundImage: `url(${round.src})`,
							backgroundSize: backgroundSize(state.roundIndex),
							backgroundPosition: slotBackgroundPosition(slot),
						}}
						disabled={state.placed[index] === true}
						onClick={() => tapSlot(index)}
						aria-label={
							state.placed[index]
								? `Puzzle piece ${index + 1} placed`
								: "Puzzle outline"
						}
					/>
				))}
			</div>
			{phase === "play" ? (
				<fieldset className="puzzle-tray" aria-label="Puzzle pieces">
					{trayPieces.map((piece) => {
						const slot = slots[piece.id];
						const shaking = shake?.id === piece.id;
						return (
							<button
								type="button"
								key={piece.id}
								className={
									state.selected === piece.id
										? "puzzle-piece-btn puzzle-piece-selected"
										: shaking
											? "puzzle-piece-btn puzzle-piece-shake"
											: "puzzle-piece-btn"
								}
								style={{
									backgroundImage: `url(${round.src})`,
									backgroundSize: backgroundSize(state.roundIndex),
									backgroundPosition: slotBackgroundPosition(slot),
								}}
								onClick={() => tapPiece(piece.id)}
								aria-label="Puzzle piece"
							/>
						);
					})}
				</fieldset>
			) : phase === "break" ? (
				<div className="wardrobe-card puzzle-card" role="status">
					<p aria-hidden="true">🎉 Round {state.roundIndex + 1} done!</p>
					<button
						type="button"
						className="care-btn"
						onClick={nextRound}
						aria-label="Next round"
					>
						Next round!
					</button>
					<button
						type="button"
						className="care-btn"
						onClick={() => navigate("/")}
						aria-label="Done for now"
					>
						Done for now
					</button>
				</div>
			) : (
				<div className="wardrobe-card puzzle-card" role="status">
					<p aria-hidden="true">
						🎉 All done! Teddy built {PUZZLE_ROUNDS.length} puzzles!
					</p>
					<button
						type="button"
						className="care-btn"
						onClick={playAgain}
						aria-label="Play again"
					>
						Play again!
					</button>
				</div>
			)}
		</section>
	);
}
