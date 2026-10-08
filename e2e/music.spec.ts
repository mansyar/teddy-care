/**
 * Screen-music proof: nothing plays before the child's first tap, one
 * theme keeps flowing across navigation, parent mute silences it (and
 * persists), bedtime swaps in the soft lullaby, and it all works
 * offline — WebAudio synthesizes every note, so airplane mode only
 * needs the app shell. The honest observable for "music is playing"
 * is the count of synthesized audio nodes inside the page.
 */
import { expect, test, type Page } from "@playwright/test";

/** Count oscillators the page has scheduled so far. */
const oscCount = (page: Page) =>
	page.evaluate(
		() => (window as { __audio?: { osc: number } }).__audio?.osc ?? 0,
	);

test.beforeEach(async ({ page }) => {
	// Wrap the two factory methods every synthesized note comes from.
	await page.addInitScript(() => {
		const w = window as { __audio?: { osc: number; sources: number } };
		const probe = { osc: 0, sources: 0 };
		w.__audio = probe;
		const wrap = (
			name: "createOscillator" | "createBufferSource",
			key: "osc" | "sources",
		) => {
			const original = AudioContext.prototype[name];
			AudioContext.prototype[name] = function (...args) {
				probe[key] += 1;
				return original.apply(this, args);
			} as typeof original;
		};
		wrap("createOscillator", "osc");
		wrap("createBufferSource", "sources");
	});
});

test("music waits for the first tap, then the room theme plays", async ({
	page,
}) => {
	await page.goto("/#/");
	await expect(page.locator(".room-scene")).toBeVisible();
	expect(await oscCount(page)).toBe(0);

	// The first gesture anywhere unlocks playback — no UI, no button.
	await page.locator("body").click();
	await expect.poll(() => oscCount(page)).toBeGreaterThan(0);
});

test("one theme keeps flowing across navigation", async ({ page }) => {
	await page.goto("/#/");
	await expect(page.locator(".room-scene")).toBeVisible();
	await page.locator("body").click();
	await expect.poll(() => oscCount(page)).toBeGreaterThan(0);

	// Hash navigation changes screens without ever dropping the music.
	for (const screen of ["runner", "bubbles", "puzzle", "parents"]) {
		const before = await oscCount(page);
		await page.goto(`/#/${screen}`);
		await expect
			.poll(() => oscCount(page), { timeout: 5000 })
			.toBeGreaterThan(before);
	}
});

test("parent mute silences the music and persists", async ({ page }) => {
	await page.goto("/#/");
	await expect(page.locator(".room-scene")).toBeVisible();
	await page.locator("body").click();
	await expect.poll(() => oscCount(page)).toBeGreaterThan(0);

	await page.goto("/#/parents");
	await page.getByRole("button", { name: "Turn sound off" }).click();

	// The counter freezes: no new notes get scheduled while muted.
	const frozen = await oscCount(page);
	await page.waitForTimeout(400);
	expect(await oscCount(page)).toBe(frozen);

	// Mute survives a reload, and the room stays silent after tapping.
	await page.reload();
	await expect(
		page.getByRole("button", { name: "Turn sound on" }),
	).toBeVisible();
	await page.goto("/#/");
	await page.locator("body").click();
	const still = await oscCount(page);
	await page.waitForTimeout(400);
	expect(await oscCount(page)).toBe(still);

	// Unmuting resumes the theme — no extra tap needed. The room loop is
	// sparse (notes every ~1s), so give the lookahead time to top up.
	await page.goto("/#/parents");
	await page.getByRole("button", { name: "Turn sound on" }).click();
	const revived = await oscCount(page);
	await page.waitForTimeout(1200);
	expect(await oscCount(page)).toBeGreaterThan(revived);
});

test("bedtime swaps the theme for a soft lullaby", async ({ page }) => {
	await page.goto("/#/parents");
	// Wait for the app to mount before the "first gesture" — an earlier
	// click fires before the unlock listeners exist.
	await expect(
		page.getByRole("heading", { name: "Grown-ups" }),
	).toBeVisible();
	await page.locator("body").click();
	// Nothing was playing, so the room theme fills in on the parent panel.
	await expect.poll(() => oscCount(page)).toBeGreaterThan(0);
	await page.getByRole("button", { name: "Turn bedtime on" }).click();
	await expect(page.locator("body")).toHaveClass(/bedtime/);

	// Bedtime is a lullaby now, not silence.
	await expect.poll(() => oscCount(page)).toBeGreaterThan(0);

	// The lullaby follows Teddy into the room and keeps looping. Its notes
	// sit ~1.6s apart, so wait long enough for the scheduler to top up.
	await page.goto("/#/");
	await expect(page.locator(".room-teddy-sprite")).toHaveAttribute(
		"src",
		/teddy-sleepy/,
	);
	const flowing = await oscCount(page);
	await page.waitForTimeout(1500);
	expect(await oscCount(page)).toBeGreaterThan(flowing);
});

test("music still plays offline — synthesis needs no network", async ({
	page,
	context,
}) => {
	// Online first visit: shell renders, SW installs in the background.
	await page.goto("/#/");
	await expect(page.locator(".room-scene")).toBeVisible();
	await page.evaluate(() => navigator.serviceWorker.ready);
	await page.reload();
	await expect(page.locator(".room-scene")).toBeVisible();

	// Airplane mode: the theme still starts on the first tap.
	await context.setOffline(true);
	await page.reload();
	await expect(page.locator(".room-scene")).toBeVisible({ timeout: 15000 });
	expect(await oscCount(page)).toBe(0);
	await page.locator("body").click();
	await expect.poll(() => oscCount(page), { timeout: 10000 }).toBeGreaterThan(0);
});
