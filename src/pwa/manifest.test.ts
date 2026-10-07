import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { PRECACHE_ART, PWA_MANIFEST } from "./manifest.js";

const PUBLIC_DIR = join(import.meta.dirname, "..", "..", "public");

describe("PWA manifest", () => {
	it("is installable: named, standalone, with 192px and 512px icons", () => {
		expect(PWA_MANIFEST.name).toBe("Teddy Care");
		expect(PWA_MANIFEST.short_name).toBe("Teddy");
		expect(PWA_MANIFEST.display).toBe("standalone");
		expect(PWA_MANIFEST.start_url).toBe("/");
		const sizes = PWA_MANIFEST.icons.map((icon) => icon.sizes);
		expect(sizes).toContain("192x192");
		expect(sizes).toContain("512x512");
	});

	it("precaches every art file the MVP needs", () => {
		expect(PRECACHE_ART.length).toBeGreaterThan(0);
		for (const art of PRECACHE_ART) {
			expect(existsSync(join(PUBLIC_DIR, art)), `${art} is public`).toBe(true);
		}
	});

	it("precaches the bubble sprite for the Bubble Pop mini-game", () => {
		expect(PRECACHE_ART).toContain("teddy/bubble.webp");
	});

	it("precaches all three puzzle pictures for the puzzle mini-game", () => {
		expect(PRECACHE_ART).toContain("teddy/puzzle-ball.webp");
		expect(PRECACHE_ART).toContain("teddy/puzzle-tub.webp");
		expect(PRECACHE_ART).toContain("teddy/puzzle-bed.webp");
	});

	it("precaches the wardrobe accessory overlays and companion strips", () => {
		// Idle overlays (1024 canvases aligned to every emotion still) and the
		// walk/run companion strips that keep accessories on Teddy in motion.
		for (const art of [
			"teddy/teddy-hat.png",
			"teddy/teddy-scarf.png",
			"teddy/teddy-hat-walk.webp",
			"teddy/teddy-scarf-walk.webp",
			"teddy/teddy-hat-run.webp",
			"teddy/teddy-scarf-run.webp",
		]) {
			expect(PRECACHE_ART).toContain(art);
		}
	});

	it("keeps the offline payload lean: no raw exports or preview GIFs", () => {
		for (const art of PRECACHE_ART) {
			expect(art).not.toContain(".raw.png");
			expect(art).not.toMatch(/\.gif$/);
		}
	});
});
