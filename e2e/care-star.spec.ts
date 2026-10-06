/**
 * Care loop proof: feeding earns a star, ten feeds afford the Sunset
 * Onesie, and buying equips it — the full toddler economy in one pass.
 */
import { expect, test } from "@playwright/test";

test("feed earns stars and ten stars buy the costume", async ({ page }) => {
	const chip = page.locator(".star-chip");
	await page.goto("/#/");
	await expect(chip).toHaveText("⭐ 0");

	await page.getByRole("button", { name: /Feed/ }).click();
	await expect(chip).toHaveText("⭐ 1");

	for (let i = 0; i < 9; i++) {
		await page.getByRole("button", { name: /Feed/ }).click();
	}
	await expect(chip).toHaveText("⭐ 10");

	await page
		.getByRole("button", { name: "Buy Sunset Onesie for 10 stars" })
		.click();
	await expect(page.getByText(/Teddy loves his/)).toBeVisible();
	await expect(chip).toHaveText("⭐ 0");
});
