/**
 * Teddy's Room e2e proof: care POIs boost the right stats after Teddy
 * walks there, petting is a tap on Teddy himself, the toy box hands off
 * to the runner, the closet opens the wardrobe, bedtime stages the room,
 * and both orientations render.
 */
import { expect, test, type Page } from "@playwright/test";

/** Seed a low-stat fresh save before the app boots. */
async function seedLowStats(page: Page) {
	await page.addInitScript(() => {
		const seed = () =>
			new Promise<void>((resolve, reject) => {
				const open = indexedDB.open("teddy-care");
				open.onupgradeneeded = () => {
					open.result.createObjectStore("saves");
				};
				open.onsuccess = () => {
					const db = open.result;
					const tx = db.transaction("saves", "readwrite");
					tx.objectStore("saves").put(
						{
							version: 1,
							stats: {
								hunger: 20,
								happiness: 20,
								energy: 20,
								cleanliness: 20,
							},
							stars: 0,
							costume: null,
							settings: { muted: false, bedtime: false },
							lastSeen: Date.now(),
						},
						"save",
					);
					tx.oncomplete = () => {
						db.close();
						resolve();
					};
					tx.onerror = () => reject(tx.error);
				};
				open.onerror = () => reject(open.error);
			});
		return seed();
	});
}

async function readStats(page: Page) {
	return page.evaluate(
		() =>
			new Promise<Record<string, number> | null>((resolve) => {
				const open = indexedDB.open("teddy-care");
				open.onsuccess = () => {
					const db = open.result;
					const get = db
						.transaction("saves")
						.objectStore("saves")
						.get("save");
					get.onsuccess = () => resolve(get.result?.stats ?? null);
				};
			}),
	);
}

/** Tap a POI and wait out the longest possible walk (2200ms). */
async function tapPoi(page: Page, name: string) {
	await page.getByRole("button", { name, exact: true }).click();
	await page.waitForTimeout(2500);
}

test("care POIs boost the matching stats", async ({ page }) => {
	await seedLowStats(page);
	await page.goto("/#/");
	await expect(page.locator(".room-scene")).toBeVisible();

	// Seed = 20, decay only lowers stats, so anything well above 20 proves
	// the care boost landed (nominal boosts: feed +30, rest +35, wash +30,
	// pet +25 — thresholds keep a small wall-clock decay margin).
	await tapPoi(page, "Teddy's food bowl");
	await expect
		.poll(() => readStats(page).then((s) => s?.hunger))
		.toBeGreaterThanOrEqual(40);

	await tapPoi(page, "Teddy's bed");
	await expect
		.poll(() => readStats(page).then((s) => s?.energy))
		.toBeGreaterThanOrEqual(45);

	await tapPoi(page, "Teddy's bathtub");
	await expect
		.poll(() => readStats(page).then((s) => s?.cleanliness))
		.toBeGreaterThanOrEqual(40);

	// Petting is a tap on Teddy himself, wherever he stands.
	await page.getByRole("button", { name: "Teddy", exact: true }).click();
	await expect
		.poll(() => readStats(page).then((s) => s?.happiness))
		.toBeGreaterThanOrEqual(35);
});

test("toy box opens the runner", async ({ page }) => {
	await page.goto("/#/");
	await tapPoi(page, "Teddy's toy box");
	await expect(page).toHaveURL(/#\/runner/);
});

test("closet opens the wardrobe panel", async ({ page }) => {
	await page.goto("/#/");
	await tapPoi(page, "Teddy's wardrobe");
	const panel = page.locator(".wardrobe-panel");
	await expect(panel).toBeVisible();
	await page
		.getByRole("button", { name: "Close wardrobe" })
		.click();
	await expect(panel).not.toBeVisible();
});

test("bedtime dims the room and puts Teddy to sleep", async ({ page }) => {
	await page.goto("/#/parents");
	await page.getByRole("button", { name: "Turn bedtime on" }).click();
	await page.goto("/#/");
	await expect(page.locator(".room-scene")).toHaveClass(/night/);
	await expect(page.locator(".room-teddy-sprite")).toHaveAttribute(
		"src",
		/teddy-sleepy/,
	);
});

test("both orientations render the room", async ({ page }) => {
	await page.setViewportSize({ width: 360, height: 640 });
	await page.goto("/#/");
	await expect(page.locator(".room-scene")).toBeVisible();
	const portrait = await page.locator(".room-scene").boundingBox();
	expect(portrait?.height ?? 0).toBeGreaterThan(portrait?.width ?? 0);

	await page.setViewportSize({ width: 800, height: 360 });
	await expect(page.locator(".room-scene")).toBeVisible();
	const landscape = await page.locator(".room-scene").boundingBox();
	expect(landscape?.width ?? 0).toBeGreaterThan(landscape?.height ?? 0);
});
