/**
 * Puzzle Pieces game logic (pure logic — the screen only reports taps).
 * A three-round climb: each round cuts one Teddy picture into a bigger
 * grid (4 → 6 → 9 pieces). Every finished round banks exactly one star,
 * because there is no losing at age 4.
 */
import type { SaveData } from "../save/store";

/** One round's picture and how finely it is cut. */
export interface PuzzleRoundConfig {
	/** Runtime picture, sliced by CSS background positioning. */
	src: string;
	/** Grid rows — piece count is rows * cols. */
	rows: number;
	/** Grid columns. */
	cols: number;
}

/** Happiness boost from a finished round, clamped at 100 downstream. */
export const PUZZLE_HAPPINESS_BOOST = 10;
/** Stars banked per finished round — fixed, so quitting early is safe. */
export const PUZZLE_STAR_PER_ROUND = 1;

/** The three-round climb: gentle piece-count ramp, one picture each. */
export const PUZZLE_ROUNDS: readonly PuzzleRoundConfig[] = [
	{ src: "/teddy/puzzle-ball.webp", rows: 2, cols: 2 },
	{ src: "/teddy/puzzle-tub.webp", rows: 3, cols: 2 },
	{ src: "/teddy/puzzle-bed.webp", rows: 3, cols: 3 },
];

/** One outline slot on the board, in percent of the board box. */
export interface BoardSlot {
	leftPct: number;
	topPct: number;
	widthPct: number;
	heightPct: number;
}

/** One jigsaw piece in the tray. Its home outline is its own id. */
export interface PuzzlePiece {
	/** Stable id — also the index of the piece's correct outline slot. */
	id: number;
	/** The id of the outline this piece belongs to. */
	slot: number;
}

/** Immutable per-round placement state; screens thread it through taps. */
export interface PuzzleState {
	roundIndex: number;
	/** Tray order — shuffled at round start. */
	pieces: PuzzlePiece[];
	/** piece id → true once placed on its outline. */
	placed: Record<number, true>;
	/** Currently selected tray piece id, if any. */
	selected: number | null;
}

/** Cut a round's picture into its grid of board slots (row-major). */
export function sliceBoard(roundIndex: number): BoardSlot[] {
	const { rows, cols } = PUZZLE_ROUNDS[roundIndex];
	const slots: BoardSlot[] = [];
	for (let row = 0; row < rows; row++) {
		for (let col = 0; col < cols; col++) {
			slots.push({
				leftPct: col * (100 / cols),
				topPct: row * (100 / rows),
				widthPct: 100 / cols,
				heightPct: 100 / rows,
			});
		}
	}
	return slots;
}

/** Deal a shuffled tray: each piece's home slot is its own id. */
export function createRound(
	roundIndex: number,
	rng: () => number = Math.random,
): PuzzleState {
	const count = PUZZLE_ROUNDS[roundIndex].rows * PUZZLE_ROUNDS[roundIndex].cols;
	const pieces: PuzzlePiece[] = Array.from({ length: count }, (_, id) => ({
		id,
		slot: id,
	}));
	// Fisher-Yates with the injected rng so tests stay deterministic.
	for (let i = pieces.length - 1; i > 0; i--) {
		const j = Math.floor(rng() * (i + 1));
		[pieces[i], pieces[j]] = [pieces[j], pieces[i]];
	}
	return { roundIndex, pieces, placed: {}, selected: null };
}

/** Select a tray piece; taps on placed pieces are politely ignored. */
export function selectPiece(state: PuzzleState, id: number): PuzzleState {
	if (state.placed[id]) {
		return state;
	}
	return { ...state, selected: id };
}

/** What happened when the selected piece met an outline. */
export type PlaceOutcome = "placed" | "wrong" | "none";

/**
 * Place the selected piece on an outline. Correct outlines keep the piece;
 * wrong ones bounce it back (deselected, unplaced) — no penalty, no shame.
 */
export function placeSelected(
	state: PuzzleState,
	slot: number,
): { state: PuzzleState; outcome: PlaceOutcome } {
	if (state.selected === null) {
		return { state, outcome: "none" };
	}
	const id = state.selected;
	if (id !== slot) {
		return { state: { ...state, selected: null }, outcome: "wrong" };
	}
	return {
		state: {
			...state,
			placed: { ...state.placed, [id]: true },
			selected: null,
		},
		outcome: "placed",
	};
}

/** A round is complete once every piece sits on its own outline. */
export function isRoundComplete(state: PuzzleState): boolean {
	return state.pieces.every((piece) => state.placed[piece.id]);
}

/** Bank a finished round: exactly one star and a happiness lift. */
export function awardPuzzleRound(save: SaveData): SaveData {
	return {
		...save,
		stars: save.stars + PUZZLE_STAR_PER_ROUND,
		stats: {
			...save.stats,
			happiness: Math.min(100, save.stats.happiness + PUZZLE_HAPPINESS_BOOST),
		},
	};
}
