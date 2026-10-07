/**
 * Airplane-mode proof for Bubble Pop: after visits that let the service
 * worker activate and precache the shell + bubble sprite, the game still
 * renders rising bubbles with the network fully off.
 */
import { expect, test } from "@playwright/test";

test("bubbles render from precache with the network off", async ({
	page,
	context,
}) => {
	// Online first visit: shell renders, SW installs in the background.
	await page.goto("/#/bubbles");
	await expect(page.locator(".bubbles-stage")).toBeVisible();
	await page.evaluate(() => navigator.serviceWorker.ready);

	// Second online visit: now SW-controlled, so precache actually fills.
	await page.reload();
	await expect(page.locator(".bubbles-stage")).toBeVisible();
	await page.waitForFunction(
		() =>
			caches
				.match("/teddy/bubble.webp")
				.then((hit) => hit !== undefined),
		null,
		{ timeout: 30000 },
	);

	// Airplane mode: full reload must still stage the game.
	await context.setOffline(true);
	await page.reload();
	await expect(page.locator(".bubbles-stage")).toBeVisible({
		timeout: 15000,
	});

	// A bubble really decoded the precached sprite, not a broken src.
	await page.waitForFunction(
		() => {
			const img = document.querySelector<HTMLImageElement>(
				".bubble-pop-btn img",
			);
			return img !== null && img.complete && img.naturalWidth > 0;
		},
		null,
		{ timeout: 15000 },
	);
});
