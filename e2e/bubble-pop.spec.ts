/**
 * Bubble Pop proof: the toy box mini-menu leads to the bubble round, a
 * full 30s round always ends happy with at least one star, and the reward
 * lands on the Care screen's star chip. Mute and reduced-motion get parity
 * coverage too.
 */
import { expect, test } from "@playwright/test";

test("menu entry leads to a full round that banks stars", async ({ page }) => {
	test.setTimeout(120000);
	await page.goto("/#/");
	await page.getByRole("button", { name: "Teddy's toy box" }).click();
	const menu = page.getByRole("dialog", { name: "Teddy's games" });
	await expect(menu).toBeVisible();
	await menu
		.getByRole("button", { name: "Play the bubble popping game" })
		.click();
	await expect(page).toHaveURL(/#\/bubbles/);
	await expect(page.locator(".bubbles-stage")).toBeVisible();

	// Pop bubbles until the corner counter counts one up.
	await expect(async () => {
		await page.locator(".bubble-pop-btn").first().click({ force: true });
		await expect(page.locator(".bubble-counter")).toHaveText(/🫧\s*[1-9]/);
	}).toPass({ timeout: 15000 });

	// The 30s round always ends in a joyful summary, never a failure.
	await expect(page.getByText(/Teddy popped/)).toBeVisible({
		timeout: 60000,
	});
	await expect(page.getByText(/earned ⭐[1-9]/)).toBeVisible();

	await page.goto("/#/");
	await expect(page.locator(".star-chip")).not.toHaveText("⭐ 0");
});

test("the round stays playable with sound off", async ({ page }) => {
	test.setTimeout(120000);
	await page.goto("/#/parents");
	await page.getByRole("button", { name: "Turn sound off" }).click();

	await page.goto("/#/bubbles");
	await expect(page.locator(".bubbles-stage")).toBeVisible();
	await expect(async () => {
		await page.locator(".bubble-pop-btn").first().click({ force: true });
		await expect(page.locator(".bubble-counter")).toHaveText(/🫧\s*[1-9]/);
	}).toPass({ timeout: 15000 });

	await expect(page.getByText(/earned ⭐[1-9]/)).toBeVisible({
		timeout: 60000,
	});
});

test("reduced motion parks bubbles in place and pops still work", async ({
	page,
}) => {
	await page.emulateMedia({ reducedMotion: "reduce" });
	await page.goto("/#/bubbles");
	const parked = page.locator(".bubble-parked");
	await expect(parked.first()).toBeVisible();

	await parked.first().click();
	await expect(page.locator(".bubble-counter")).toHaveText(/🫧\s*[1-9]/);
});
