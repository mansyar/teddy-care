import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { defineConfig } from "vitest/config";
import { PRECACHE_ART, PWA_MANIFEST } from "./src/pwa/manifest.ts";

// https://vite.dev/config/
export default defineConfig({
	test: {
		// Playwright specs live here too — Vitest must not swallow them.
		exclude: ["e2e/**", "node_modules/**"],
	},
	plugins: [
		react(),
		VitePWA({
			registerType: "autoUpdate",
			includeAssets: [...PRECACHE_ART, "icons/*.png"],
			manifest: PWA_MANIFEST,
			workbox: {
				// Fully offline: precache everything, no runtime network caching.
				globPatterns: ["**/*.{js,css,html,png,json,svg}"],
				runtimeCaching: [],
				navigateFallback: "index.html",
			},
		}),
	],
});
