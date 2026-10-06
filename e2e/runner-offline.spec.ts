/**
 * Airplane-mode proof for the runner: after visits that let the service
 * worker activate and precache the shell + run strip, the track must still
 * boot with the network fully off.
 */
import { expect, test } from "@playwright/test";

test("runner boots from precache with the network off", async ({
	page,
	context,
}) => {
	// Online first visit: shell renders, SW installs in the background.
	await page.goto("/#/runner");
	await expect(page.locator(".runner-track canvas")).toBeVisible();
	await page.evaluate(() => navigator.serviceWorker.ready);

	// Second online visit: now SW-controlled, so precache actually fills.
	await page.reload();
	await expect(page.locator(".runner-track canvas")).toBeVisible();
	await page.waitForFunction(
		() =>
			caches
				.match("/teddy/side-run-asfilmed.strip.png")
				.then((hit) => hit !== undefined),
		null,
		{ timeout: 30000 },
	);

	// Airplane mode: full reload must still boot the track.
	await context.setOffline(true);
	await page.reload();
	await expect(page.locator(".runner-track canvas")).toBeVisible({
		timeout: 15000,
	});

	// The canvas is actually drawing Teddy's world, not a blank box.
	const shot = await page.locator(".runner-track canvas").screenshot();
	expect(shot.length).toBeGreaterThan(10_000);
});
