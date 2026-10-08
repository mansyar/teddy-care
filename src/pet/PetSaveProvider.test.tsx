/**
 * Tests for the PetSaveProvider: the single owner of the pet save in the
 * React tree (TDD — written before implementation).
 *
 * Regression guard for the save-forking bug: every `usePetSave()` instance
 * used to load IndexedDB separately and persist from its own stale fork,
 * so a parent-panel mute toggle could erase stars earned during the
 * session. These tests pin the provider contract: one load for the whole
 * tree, one shared fork, and settings patches that never revert stars.
 */
import "fake-indexeddb/auto";
// @vitest-environment jsdom
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let loadCalls = 0;

vi.mock("../save/store", async (importOriginal) => {
	const actual = await importOriginal<typeof import("../save/store")>();
	return {
		...actual,
		loadSave: async () => {
			loadCalls += 1;
			return actual.loadSave();
		},
	};
});

import { PetSaveProvider, usePetSaveContext } from "./PetSaveProvider";

function Stars({ id }: { id: string }) {
	const { save } = usePetSaveContext();
	return (
		<p data-testid={`stars-${id}`}>{save === null ? "loading" : save.stars}</p>
	);
}

function FeedButton() {
	const { act } = usePetSaveContext();
	return (
		<button type="button" onClick={() => act("feed")}>
			feed
		</button>
	);
}

function MuteButton() {
	const { updateSettings } = usePetSaveContext();
	return (
		<button type="button" onClick={() => updateSettings({ muted: true })}>
			mute
		</button>
	);
}

function AwardAllButton() {
	const { award, awardBubbles, awardPuzzleRound } = usePetSaveContext();
	return (
		<button
			type="button"
			onClick={() => {
				award({ distanceM: 0, starsGrabbed: 0 });
				awardBubbles(9999);
				awardPuzzleRound();
			}}
		>
			award all
		</button>
	);
}

afterEach(() => {
	cleanup();
});

beforeEach(async () => {
	const { deleteDatabase } = await import("../save/store");
	await deleteDatabase();
	loadCalls = 0;
});

describe("PetSaveProvider", () => {
	it("shares one save fork across consumers: a care action in one updates the other", async () => {
		render(
			<PetSaveProvider>
				<Stars id="a" />
				<Stars id="b" />
				<FeedButton />
			</PetSaveProvider>,
		);

		await waitFor(() => {
			expect(screen.getByTestId("stars-a").textContent).toBe("0");
		});
		expect(screen.getByTestId("stars-b").textContent).toBe("0");

		await act(async () => {
			screen.getByRole("button", { name: "feed" }).click();
		});

		// Care earns a star, and both consumers see the same single fork.
		expect(screen.getByTestId("stars-a").textContent).toBe("1");
		expect(screen.getByTestId("stars-b").textContent).toBe("1");
	});

	it("loads the save exactly once for the whole tree", async () => {
		render(
			<PetSaveProvider>
				<Stars id="a" />
				<Stars id="b" />
			</PetSaveProvider>,
		);

		await waitFor(() => {
			expect(screen.getByTestId("stars-a").textContent).toBe("0");
		});
		expect(loadCalls).toBe(1);
	});

	it("award mutators from mini-games flow through the shared context", async () => {
		render(
			<PetSaveProvider>
				<Stars id="a" />
				<Stars id="b" />
				<AwardAllButton />
			</PetSaveProvider>,
		);
		await waitFor(() => {
			expect(screen.getByTestId("stars-a").textContent).toBe("0");
		});

		await act(async () => {
			screen.getByRole("button", { name: "award all" }).click();
		});

		// Runner (worst run = 1) + bubbles (9999 pops clamp at 5) + puzzle
		// round (1) — and both consumers see the same single fork.
		expect(screen.getByTestId("stars-a").textContent).toBe("7");
		expect(screen.getByTestId("stars-b").textContent).toBe("7");

		const { loadSave } = await import("../save/store");
		const persisted = await loadSave();
		expect(persisted.stars).toBe(7);
	});

	it("a settings patch from one consumer preserves stars earned by another", async () => {
		render(
			<PetSaveProvider>
				<Stars id="a" />
				<Stars id="b" />
				<FeedButton />
				<MuteButton />
			</PetSaveProvider>,
		);

		await waitFor(() => {
			expect(screen.getByTestId("stars-a").textContent).toBe("0");
		});

		// The child earns stars…
		await act(async () => {
			screen.getByRole("button", { name: "feed" }).click();
		});
		expect(screen.getByTestId("stars-a").textContent).toBe("1");

		// …then a parent toggles mute — the stars must survive.
		await act(async () => {
			screen.getByRole("button", { name: "mute" }).click();
		});
		expect(screen.getByTestId("stars-a").textContent).toBe("1");
		expect(screen.getByTestId("stars-b").textContent).toBe("1");

		// And the mute itself persists across a simulated reload.
		const { loadSave } = await import("../save/store");
		const reloaded = await loadSave();
		expect(reloaded.settings.muted).toBe(true);
		expect(reloaded.stars).toBe(1);
	});
});
