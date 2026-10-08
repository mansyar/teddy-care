/**
 * Save integrity proof: stars earned during a session survive the parent
 * panel's settings toggles and a reload.
 *
 * Guards the single-owner save provider. Before it, the shell kept a stale
 * app-start snapshot and wrote it back on every settings toggle — erasing
 * stars the child earned since app start. This spec reproduces that exact
 * path and fails if the fork ever returns.
 */
import { expect, test } from "@playwright/test";

test("stars earned in the room survive parent-panel toggles and a reload", async ({
	page,
}) => {
	const chip = page.locator(".star-chip");
	await page.goto("/#/");
	await expect(chip).toHaveText("⭐ 0");

	// Earn a star: Teddy walks to the bowl (up to ~2.2s) before eating.
	await page.getByRole("button", { name: "Teddy's food bowl" }).click();
	await page.waitForTimeout(2500);
	await expect(chip).toHaveText("⭐ 1");

	// Toggle mute and bedtime in the parent panel — the old fork bug
	// erased earned stars exactly here (stale snapshot written back).
	await page.goto("/#/parents");
	await page.getByRole("button", { name: "Turn sound off" }).click();
	await expect(
		page.getByRole("button", { name: "Turn sound on" }),
	).toBeVisible();
	await page.getByRole("button", { name: "Turn bedtime on" }).click();
	await expect(
		page.getByRole("button", { name: "Turn bedtime off" }),
	).toBeVisible();

	// saveSave is fire-and-forget; give the IndexedDB write a beat to
	// land before the reload tears the page down.
	await page.waitForTimeout(500);
	await page.reload();
	await page.goto("/#/");
	await expect(chip).toHaveText("⭐ 1");

	// And the settings toggles took effect too — both writes landed.
	await page.goto("/#/parents");
	await expect(
		page.getByRole("button", { name: "Turn sound on" }),
	).toBeVisible();
	await expect(
		page.getByRole("button", { name: "Turn bedtime off" }),
	).toBeVisible();
});
