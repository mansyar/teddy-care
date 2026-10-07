/**
 * Single source of truth for the PWA manifest and the offline precache list.
 * `vite.config.ts` consumes both so tests guard what ships offline.
 */

export interface PwaIcon {
	src: string;
	sizes: string;
	type: string;
}

export interface PwaManifest {
	name: string;
	short_name: string;
	start_url: string;
	scope: string;
	display: "standalone";
	background_color: string;
	theme_color: string;
	icons: PwaIcon[];
}

export const PWA_MANIFEST: PwaManifest = {
	name: "Teddy Care",
	short_name: "Teddy",
	start_url: "/",
	scope: "/",
	display: "standalone",
	background_color: "#fff7ef",
	theme_color: "#ffd9c0",
	icons: [
		{ src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
		{ src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
	],
};

/** Art files (relative to `public/`) bundled into the offline precache. */
export const PRECACHE_ART: string[] = [
	"teddy/teddy-base.png",
	"teddy/teddy-blink.png",
	"teddy/teddy-happy.png",
	"teddy/teddy-sad.png",
	"teddy/teddy-sleepy.png",
	"teddy/teddy-eating.png",
	"teddy/side-run-asfilmed.strip.png",
	// Teddy's Room: backgrounds, walk cycle, wardrobe panel art (WebP).
	"teddy/room-portrait.webp",
	"teddy/room-landscape.webp",
	"teddy/teddy-walk.webp",
	"teddy/closet.webp",
	// Bubble Pop: rising bubble sprite for the tap mini-game (WebP).
	"teddy/bubble.webp",

	// Puzzle Pieces: three round pictures, sliced into pieces at runtime (WebP).
	"teddy/puzzle-ball.webp",
	"teddy/puzzle-tub.webp",
	"teddy/puzzle-bed.webp",
];
