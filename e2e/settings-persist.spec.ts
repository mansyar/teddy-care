/**
 * Parent panel proof: mute and bedtime survive a reload, bedtime dims the
 * app and puts Teddy to sleep, and the two-tap reset returns a fresh Teddy
 * with settings cleared too.
 */
import { expect, test } from "@playwright/test";

test("mute and bedtime persist; reset starts over", async ({ page }) => {
	await page.goto("/#/parents");

	// Mute persists across reloads.
	await page.getByRole("button", { name: "Turn sound off" }).click();
	await expect(
		page.getByRole("button", { name: "Turn sound on" }),
	).toBeVisible();
	await page.reload();
	await expect(
		page.getByRole("button", { name: "Turn sound on" }),
	).toBeVisible();

	// Bedtime dims the app and puts the sleepy face on.
	await page.getByRole("button", { name: "Turn bedtime on" }).click();
	await expect(page.locator("body")).toHaveClass(/bedtime/);
	await page.goto("/#/");
	await expect(page.locator(".teddy-sprite")).toHaveAttribute(
		"src",
		/teddy-sleepy/,
	);
	await page.reload();
	await expect(page.locator("body")).toHaveClass(/bedtime/);

	// Two-tap reset: first tap arms, second erases and reloads fresh.
	await page.goto("/#/parents");
	await page
		.getByRole("button", { name: "Start over with a fresh Teddy" })
		.click();
	await expect(
		page.getByRole("button", { name: "Confirm: erase Teddy and start over" }),
	).toBeVisible();
	await page
		.getByRole("button", { name: "Confirm: erase Teddy and start over" })
		.click();
	await page.waitForLoadState();
	await expect(page.locator("body")).not.toHaveClass(/bedtime/);
	await page.goto("/#/");
	await expect(page.locator(".star-chip")).toHaveText("⭐ 0");
});
