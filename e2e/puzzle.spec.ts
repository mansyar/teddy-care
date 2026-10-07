/**
 * Puzzle Pieces proof: the toy box mini-menu leads to the three-round
 * climb, every finished round banks exactly one star, quitting early keeps
 * earned stars, and mute/reduced-motion get parity coverage.
 */
import { expect, type Page, test } from "@playwright/test";

/**
 * Place the tray's first piece by trying every empty outline until one
 * accepts it (a wrong outline bounces the piece back, so we move on).
 */
async function placeFirstPiece(page: Page) {
	await expect(async () => {
		const tray = page.locator(".puzzle-piece-btn");
		const trayCount = await tray.count();
		if (trayCount === 0) return;
		const empty = page.locator(".puzzle-slot:not(.puzzle-slot-filled)");
		const emptyCount = await empty.count();
		for (let i = 0; i < emptyCount; i++) {
			await tray.first().click();
			await empty.nth(i).click();
			if ((await tray.count()) < trayCount) return;
		}
	}).toPass({ timeout: 30000 });
}

/** Solve the current round: one piece per pass, until the board is full. */
async function solveRound(page: Page) {
	const total = await page.locator(".puzzle-slot").count();
	for (let placed = 0; placed < total; placed++) {
		await placeFirstPiece(page);
	}
	await expect(page.locator(".puzzle-slot-filled")).toHaveCount(total);
}

async function openPuzzle(page: Page) {
	await page.goto("/#/");
	await page.getByRole("button", { name: "Teddy's toy box" }).click();
	const menu = page.getByRole("dialog", { name: "Teddy's games" });
	await expect(menu).toBeVisible();
	await menu.getByRole("button", { name: "Play the puzzle game" }).click();
	await expect(page).toHaveURL(/#\/puzzle/);
	await expect(page.locator(".puzzle-board")).toBeVisible();
}

test("menu entry leads to the full climb and banks three stars", async ({
	page,
}) => {
	test.setTimeout(120000);
	await openPuzzle(page);

	// Round 1: a wrong outline bounces back without penalty.
	await solveRound(page);
	await expect(page.getByText(/Round 1 done!/)).toBeVisible();
	await page.getByRole("button", { name: "Next round" }).click();

	await solveRound(page);
	await expect(page.getByText(/Round 2 done!/)).toBeVisible();
	await page.getByRole("button", { name: "Next round" }).click();

	await solveRound(page);
	await expect(page.getByText(/All done!/)).toBeVisible();

	// One star per round, visible on the Care screen's star chip.
	await page.goto("/#/");
	await expect(page.locator(".star-chip")).toHaveText("⭐ 3");
});

test("leaving after round one keeps the earned star", async ({ page }) => {
	test.setTimeout(60000);
	await openPuzzle(page);
	await solveRound(page);
	await page.getByRole("button", { name: "Done for now" }).click();
	await page.goto("/#/");
	await expect(page.locator(".star-chip")).toHaveText("⭐ 1");
});

test("the climb stays playable with sound off", async ({ page }) => {
	test.setTimeout(60000);
	await page.goto("/#/parents");
	await page.getByRole("button", { name: "Turn sound off" }).click();

	await openPuzzle(page);
	await solveRound(page);
	await expect(page.getByText(/Round 1 done!/)).toBeVisible();
});

test("reduced motion still selects and places pieces", async ({ page }) => {
	await page.emulateMedia({ reducedMotion: "reduce" });
	await openPuzzle(page);
	await placeFirstPiece(page);
	await expect(page.locator(".puzzle-slot-filled")).toHaveCount(1);
});
