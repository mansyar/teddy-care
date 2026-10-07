/**
 * Tests for the stat→object-state mapping (track teddys_room_20261007
 * Phase 5).
 *
 * The room tells the truth about Teddy's stats without numbers or scare
 * tactics: the bowl empties as hunger decays, Teddy looks scruffier as
 * cleanliness drops, and he droops as energy drains. Boundaries are tested
 * at the exact thresholds and just across them — kindness means the worst
 * states only appear when care is genuinely overdue.
 */
import { describe, expect, it } from "vitest";
import type { PetStats } from "../save/store";
import { roomObjectState } from "./state";

const stats = (over: Partial<PetStats>): PetStats => ({
	hunger: 100,
	happiness: 100,
	energy: 100,
	cleanliness: 100,
	...over,
});

describe("roomObjectState — bowl vs hunger", () => {
	it("a full bowl while hunger is high", () => {
		expect(roomObjectState(stats({ hunger: 100 })).bowl).toBe("full");
		expect(roomObjectState(stats({ hunger: 70 })).bowl).toBe("full");
	});

	it("half and low as hunger decays", () => {
		expect(roomObjectState(stats({ hunger: 69 })).bowl).toBe("half");
		expect(roomObjectState(stats({ hunger: 40 })).bowl).toBe("half");
		expect(roomObjectState(stats({ hunger: 39 })).bowl).toBe("low");
		expect(roomObjectState(stats({ hunger: 15 })).bowl).toBe("low");
	});

	it("empty only when care is genuinely overdue", () => {
		expect(roomObjectState(stats({ hunger: 14 })).bowl).toBe("empty");
		expect(roomObjectState(stats({ hunger: 0 })).bowl).toBe("empty");
	});
});

describe("roomObjectState — groom vs cleanliness", () => {
	it("clean while cleanliness is high", () => {
		expect(roomObjectState(stats({ cleanliness: 100 })).groom).toBe("clean");
		expect(roomObjectState(stats({ cleanliness: 70 })).groom).toBe("clean");
	});

	it("scruffy then messy as cleanliness drops", () => {
		expect(roomObjectState(stats({ cleanliness: 69 })).groom).toBe("scruffy");
		expect(roomObjectState(stats({ cleanliness: 35 })).groom).toBe("scruffy");
		expect(roomObjectState(stats({ cleanliness: 34 })).groom).toBe("messy");
		expect(roomObjectState(stats({ cleanliness: 0 })).groom).toBe("messy");
	});
});

describe("roomObjectState — droop vs energy", () => {
	it("perky while energy is fine", () => {
		expect(roomObjectState(stats({ energy: 100 })).droop).toBe("perky");
		expect(roomObjectState(stats({ energy: 40 })).droop).toBe("perky");
	});

	it("droopy then exhausted as energy drains", () => {
		expect(roomObjectState(stats({ energy: 39 })).droop).toBe("droopy");
		expect(roomObjectState(stats({ energy: 15 })).droop).toBe("droopy");
		expect(roomObjectState(stats({ energy: 14 })).droop).toBe("exhausted");
		expect(roomObjectState(stats({ energy: 0 })).droop).toBe("exhausted");
	});
});

describe("roomObjectState — independence", () => {
	it("each state reads only its own stat", () => {
		const s = roomObjectState(
			stats({ hunger: 0, cleanliness: 100, energy: 100 }),
		);
		expect(s.bowl).toBe("empty");
		expect(s.groom).toBe("clean");
		expect(s.droop).toBe("perky");
	});
});
