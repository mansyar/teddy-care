import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import { PRECACHE_ART, PWA_MANIFEST } from "./src/pwa/manifest.ts";

// https://vite.dev/config/
export default defineConfig({
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
