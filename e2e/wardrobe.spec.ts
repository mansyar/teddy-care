/**
 * Wardrobe proof: twenty cares afford Mint Dream, buying celebrates with a
 * sparkle and wears it immediately, an unaffordable tap only wiggles, and
 * switching plus ownership survive a reload — free switching, no failure.
 */
import { expect, test } from "@playwright/test";

test("buying Mint Dream celebrates, wiggle guards the pricey one", async ({
	page,
}) => {
	const chip = page.locator(".star-chip");
	await page.goto("/#/");
	await expect(chip).toHaveText("⭐ 0");

	// First feed: Teddy walks to the bowl (up to ~2.2s) before eating.
	await page.getByRole("button", { name: "Teddy's food bowl" }).click();
	await page.waitForTimeout(2500);
	await expect(chip).toHaveText("⭐ 1");

	// Now he stands beside the bowl — every further tap acts immediately.
	for (let i = 0; i < 19; i++) {
		await page.getByRole("button", { name: "Teddy's food bowl" }).click();
	}
	await expect(chip).toHaveText("⭐ 20");

	// Walk to the closet, then the wardrobe bottom sheet opens.
	await page.getByRole("button", { name: "Teddy's wardrobe" }).click();
	await page.waitForTimeout(2500);
	const panel = page.locator(".wardrobe-panel");
	await expect(panel).toBeVisible();

	// Buying Mint Dream (20⭐): sparkle celebration, worn immediately.
	await page
		.getByRole("button", { name: "Get Mint Dream for 20 stars" })
		.click();
	await expect(page.locator(".room-fx-sparkle")).toBeVisible();
	await expect(chip).toHaveText("⭐ 0");
	const mint = page.getByRole("button", { name: /Mint Dream/ });
	await expect(mint).toHaveAttribute("aria-pressed", "true");

	// Berry Night costs 30⭐: a gentle wiggle and nothing changes.
	const berry = page.getByRole("button", { name: /Berry Night/ });
	await berry.click();
	await expect(berry).toHaveClass(/wiggle/, { timeout: 250 });
	await expect(chip).toHaveText("⭐ 0");
	await expect(berry).toHaveAttribute("aria-pressed", "false");

	// Switching between owned looks is free — default and back again.
	const comfy = page.getByRole("button", { name: /Comfy Onesie/ });
	await comfy.click();
	await expect(comfy).toHaveAttribute("aria-pressed", "true");
	await expect(mint).toHaveAttribute("aria-pressed", "false");
	await mint.click();
	await expect(mint).toHaveAttribute("aria-pressed", "true");

	// The save write is backgrounded — wait until it has actually landed in
	// IndexedDB before reloading, or the reload reads the pre-switch save.
	await expect
		.poll(async () =>
			page.evaluate(async () => {
				const db = await new Promise<IDBDatabase>((resolve, reject) => {
					const req = indexedDB.open("teddy-care");
					req.onsuccess = () => resolve(req.result);
					req.onerror = () => reject(req.error);
				});
				const value = await new Promise<{ costume: string | null }>(
					(resolve, reject) => {
						const req = db
							.transaction("saves", "readonly")
							.objectStore("saves")
							.get("save");
						req.onsuccess = () => resolve(req.result);
						req.onerror = () => reject(req.error);
					},
				);
				db.close();
				return value.costume;
			}),
		)
		.toBe("mint-dream");

	// Reload: the wardrobe choice survives the session.
	await page.reload();
	await expect(page.locator(".room-teddy-sprite")).toHaveCSS(
		"filter",
		/hue-rotate\(-60deg\)/,
	);
});
