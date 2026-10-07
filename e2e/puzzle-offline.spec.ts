/**
 * Puzzle Pieces offline proof: all three round pictures are precached by
 * the service worker, and the puzzle screen boots and decodes them while
 * the network is cut off.
 */
import { expect, test } from "@playwright/test";

const PICTURES = [
	"/teddy/puzzle-ball.webp",
	"/teddy/puzzle-tub.webp",
	"/teddy/puzzle-bed.webp",
];

test("the puzzle climb plays fully offline", async ({ page, context }) => {
	// Warm visit so the service worker installs and precaches everything.
	await page.goto("/#/puzzle");
	await expect(page.locator(".puzzle-board")).toBeVisible();
	await page.evaluate(() => navigator.serviceWorker.ready);

	await page.reload();
	await page.waitForFunction(
		async (urls) => {
			const matches = await Promise.all(
				urls.map((url) => caches.match(url)),
			);
			return matches.every(Boolean);
		},
		PICTURES,
		{ timeout: 30000 },
	);

	await context.setOffline(true);
	await page.reload();
	await expect(page.locator(".puzzle-board")).toBeVisible({
		timeout: 15000,
	});

	// Every picture decodes from the cache with real pixels.
	await page.waitForFunction(
		async (urls) => {
			const decoded = await Promise.all(
				urls.map(
					(url) =>
						new Promise<boolean>((resolve) => {
							const image = new Image();
							image.onload = () => resolve(image.naturalWidth > 0);
							image.onerror = () => resolve(false);
							image.src = url;
						}),
				),
			);
			return decoded.every(Boolean);
		},
		PICTURES,
		{ timeout: 15000 },
	);
});
