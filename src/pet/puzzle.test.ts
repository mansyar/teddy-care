/**
 * Tests for the puzzle game's pure logic: round configs, board slicing,
 * the select/place state machine, tray shuffling, and round rewards.
 */
import { describe, expect, it } from "vitest";
import { DEFAULT_SAVE } from "../save/store";
import {
	awardPuzzleRound,
	createRound,
	isRoundComplete,
	PUZZLE_HAPPINESS_BOOST,
	PUZZLE_ROUNDS,
	type PuzzleState,
	placeSelected,
	selectPiece,
	sliceBoard,
} from "./puzzle";

/** Build a save fixture by spreading the defaults. */
function testSave(
	overrides: Partial<typeof DEFAULT_SAVE> = {},
): typeof DEFAULT_SAVE {
	return {
		...DEFAULT_SAVE,
		...overrides,
		stats: { ...DEFAULT_SAVE.stats, ...overrides.stats },
	};
}

describe("puzzle round configs", () => {
	it("climbs 4, 6, 9 pieces across three rounds", () => {
		expect(PUZZLE_ROUNDS.map((round) => round.rows * round.cols)).toEqual([
			4, 6, 9,
		]);
	});

	it("gives every round its own picture", () => {
		const srcs = PUZZLE_ROUNDS.map((round) => round.src);
		expect(new Set(srcs).size).toBe(PUZZLE_ROUNDS.length);
		for (const src of srcs) {
			expect(src).toMatch(/^\/teddy\//);
		}
	});
});

describe("sliceBoard", () => {
	it("cuts a round's grid into percent-sized pieces", () => {
		const slots = sliceBoard(1); // 3 rows x 2 cols
		expect(slots).toHaveLength(6);
		expect(slots[0]).toEqual({
			leftPct: 0,
			topPct: 0,
			widthPct: 50,
			heightPct: 100 / 3,
		});
		expect(slots[5]).toEqual({
			leftPct: 50,
			topPct: (100 / 3) * 2,
			widthPct: 50,
			heightPct: 100 / 3,
		});
	});

	it("covers the whole board across every round", () => {
		for (let roundIndex = 0; roundIndex < PUZZLE_ROUNDS.length; roundIndex++) {
			const slots = sliceBoard(roundIndex);
			const rightEdge = Math.max(...slots.map((s) => s.leftPct + s.widthPct));
			const bottomEdge = Math.max(...slots.map((s) => s.topPct + s.heightPct));
			expect(rightEdge).toBeCloseTo(100, 5);
			expect(bottomEdge).toBeCloseTo(100, 5);
		}
	});
});

describe("createRound", () => {
	it("deals every slot exactly once in a shuffled tray", () => {
		const state = createRound(2, () => 0.999);
		expect(state.roundIndex).toBe(2);
		expect(state.pieces).toHaveLength(9);
		expect(state.placed).toEqual({});
		expect(state.selected).toBeNull();
		const slots = state.pieces.map((piece) => piece.slot).sort((a, b) => a - b);
		expect(slots).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
	});

	it("respects an injected rng so tests are deterministic", () => {
		const alwaysFirst = createRound(0, () => 0);
		const alwaysLast = createRound(0, () => 0.999);
		expect(alwaysFirst.pieces[0].id).not.toBe(alwaysLast.pieces[0].id);
	});

	it("each piece's home slot is its own id", () => {
		const state = createRound(0);
		for (const piece of state.pieces) {
			expect(piece.slot).toBe(piece.id);
		}
	});
});

describe("selectPiece", () => {
	it("selects an unplaced tray piece", () => {
		const state = createRound(0);
		const next = selectPiece(state, state.pieces[1].id);
		expect(next.selected).toBe(state.pieces[1].id);
	});

	it("ignores taps on already-placed pieces", () => {
		let state = createRound(0);
		const piece = state.pieces[0];
		state = placeSelected(selectPiece(state, piece.id), piece.slot).state;
		const next = selectPiece(state, piece.id);
		expect(next.selected).toBeNull();
	});
});

describe("placeSelected", () => {
	function selectedState(roundIndex = 0): {
		state: PuzzleState;
		id: number;
		slot: number;
	} {
		const state = createRound(roundIndex);
		const piece = state.pieces[0];
		return {
			state: selectPiece(state, piece.id),
			id: piece.id,
			slot: piece.slot,
		};
	}

	it("places a piece on its own outline and reports success", () => {
		const { state, id, slot } = selectedState();
		const result = placeSelected(state, slot);
		expect(result.outcome).toBe("placed");
		expect(result.state.placed[id]).toBe(true);
		expect(result.state.selected).toBeNull();
	});

	it("bounces a piece off a wrong outline without placing it", () => {
		const { state, id } = selectedState(0);
		const wrongSlot = (state.pieces[0].slot + 1) % 4;
		const result = placeSelected(state, wrongSlot);
		expect(result.outcome).toBe("wrong");
		expect(result.state.placed[id]).toBeUndefined();
		expect(result.state.selected).toBeNull();
	});

	it("does nothing when nothing is selected", () => {
		const state = createRound(0);
		const result = placeSelected(state, 0);
		expect(result.outcome).toBe("none");
		expect(result.state).toBe(state);
	});
});

describe("isRoundComplete", () => {
	it("is false while pieces remain and true when the last one lands", () => {
		let state = createRound(0);
		expect(isRoundComplete(state)).toBe(false);
		for (const piece of state.pieces) {
			state = placeSelected(selectPiece(state, piece.id), piece.slot).state;
		}
		expect(isRoundComplete(state)).toBe(true);
	});
});

describe("awardPuzzleRound", () => {
	it("banks exactly one star and lifts happiness", () => {
		const save = testSave({
			stars: 2,
			stats: { hunger: 50, happiness: 80, energy: 50, cleanliness: 50 },
		});
		const next = awardPuzzleRound(save);
		expect(next.stars).toBe(3);
		expect(next.stats.happiness).toBe(80 + PUZZLE_HAPPINESS_BOOST);
		expect(next.stats.hunger).toBe(50);
	});

	it("clamps happiness at 100 and never drops stats", () => {
		const save = testSave({
			stats: { hunger: 10, happiness: 97, energy: 10, cleanliness: 10 },
		});
		const next = awardPuzzleRound(save);
		expect(next.stats.happiness).toBe(100);
		expect(next.stats.hunger).toBe(10);
	});
});
