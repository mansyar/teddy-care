/**
 * Airplane-mode proof for the wardrobe: after the service worker activates
 * and precaches the shell, the room boots and the wardrobe opens with live
 * preview cards fully offline — the closet costs no network at all.
 */
import { expect, test } from "@playwright/test";

test("wardrobe opens from precache with the network off", async ({
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
				caches.match("/teddy/teddy-base.png"),
				caches.match("/teddy/closet.webp"),
			]).then((hits) => hits.every((hit) => hit !== undefined)),
		null,
		{ timeout: 30000 },
	);

	// Airplane mode: the room boots, the closet still opens the wardrobe.
	await context.setOffline(true);
	await page.reload();
	await expect(page.locator(".room-scene")).toBeVisible({ timeout: 15000 });
	await page.getByRole("button", { name: "Teddy's wardrobe" }).click();
	await page.waitForTimeout(2500);
	await expect(page.locator(".wardrobe-panel")).toBeVisible();

	// A preview card really decoded the precached base sprite.
	await page.waitForFunction(
		() => {
			const img = document.querySelector<HTMLImageElement>(
				".wardrobe-item img",
			);
			return img !== null && img.complete && img.naturalWidth > 0;
		},
		null,
		{ timeout: 15000 },
	);
});
