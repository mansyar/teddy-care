/**
 * Runner reward proof: finishing the ~30s track banks at least one star
 * (the happy-end guarantee) and the Care screen shows it.
 */
import { expect, test } from "@playwright/test";

test("finishing a run banks stars on the care screen", async ({ page }) => {
	test.setTimeout(120000);
	await page.goto("/#/runner");
	await expect(page.locator(".runner-track canvas")).toBeVisible();

	await expect(page.getByText(/Teddy ran/)).toBeVisible({ timeout: 90000 });
	await expect(page.getByText(/earned ⭐[1-9]/)).toBeVisible();

	await page.goto("/#/");
	await expect(page.locator(".star-chip")).not.toHaveText("⭐ 0");
});
