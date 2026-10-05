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

	it("keeps the offline payload lean: no raw exports or preview GIFs", () => {
		for (const art of PRECACHE_ART) {
			expect(art).not.toContain(".raw.png");
			expect(art).not.toMatch(/\.gif$/);
		}
	});
});
