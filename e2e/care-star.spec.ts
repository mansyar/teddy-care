/**
 * Care loop proof: feeding earns a star, ten feeds afford the Sunset
 * Onesie, and buying equips it — the full toddler economy in one pass.
 *
 * Updated for Teddy's Room: feeding is a tap on the food-bowl POI that
 * sends Teddy walking to it, and the wardrobe opens from the closet POI.
 */
import { expect, test } from "@playwright/test";

test("feed earns stars and ten stars buy the costume", async ({ page }) => {
	const chip = page.locator(".star-chip");
	await page.goto("/#/");
	await expect(chip).toHaveText("⭐ 0");

	// First feed: Teddy walks to the bowl (up to ~2.2s) before eating.
	await page.getByRole("button", { name: "Teddy's food bowl" }).click();
	await page.waitForTimeout(2500);
	await expect(chip).toHaveText("⭐ 1");

	// Now he stands beside the bowl — every further tap acts immediately.
	for (let i = 0; i < 9; i++) {
		await page.getByRole("button", { name: "Teddy's food bowl" }).click();
	}
	await expect(chip).toHaveText("⭐ 10");

	await page.getByRole("button", { name: "Teddy's wardrobe" }).click();
	await page.waitForTimeout(2500);
	await page
		.getByRole("button", { name: "Buy Sunset Onesie for 10 stars" })
		.click();
	await expect(page.getByText(/Teddy loves his/)).toBeVisible();
	await expect(chip).toHaveText("⭐ 0");
});
