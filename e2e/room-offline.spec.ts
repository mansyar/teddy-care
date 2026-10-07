/**
 * Airplane-mode proof for Teddy's Room: after the service worker activates
 * and precaches the shell + room art, the room must still render —
 * backgrounds, walk strip and wardrobe art included — with the network off.
 */
import { expect, test } from "@playwright/test";

test("room renders from precache with the network off", async ({
	page,
	context,
}) => {
	// Online first visit: shell renders, SW installs in the background.
	await page.goto("/#/");
	await expect(page.locator(".room-scene")).toBeVisible();
	await page.evaluate(() => navigator.serviceWorker.ready);

	// Second online visit: now SW-controlled, so precache actually fills.
	await page.reload();
	await expect(page.locator(".room-scene")).toBeVisible();
	await page.waitForFunction(
		() =>
			Promise.all([
				caches.match("/teddy/room-portrait.webp"),
				caches.match("/teddy/room-landscape.webp"),
				caches.match("/teddy/teddy-walk.webp"),
				caches.match("/teddy/closet.webp"),
			]).then((hits) => hits.every((hit) => hit !== undefined)),
		null,
		{ timeout: 30000 },
	);

	// Airplane mode: full reload must still stage the whole room.
	await context.setOffline(true);
	await page.reload();
	await expect(page.locator(".room-scene")).toBeVisible({ timeout: 15000 });
	await expect(page.locator(".room-teddy-sprite")).toBeVisible();

	// The background <img> really decoded the precached art, not a broken src.
	await page.waitForFunction(
		() => {
			const bg = document.querySelector<HTMLImageElement>(".room-bg");
			return bg !== null && bg.complete && bg.naturalWidth > 0;
		},
		null,
		{ timeout: 15000 },
	);
});
