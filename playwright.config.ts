/**
 * Playwright config: runs the built PWA (dist/) under `vite preview` so
 * service-worker and precache behavior is tested for real.
 */
import { defineConfig } from "@playwright/test";

export default defineConfig({
	testDir: "./e2e",
	webServer: {
		command: "pnpm exec vite preview --port 4317",
		port: 4317,
		// Never reuse a foreign server: a squatter on this port once made the
		// suite test the wrong app. Playwright always boots its own preview.
		reuseExistingServer: false,
	},
	use: { baseURL: "http://localhost:4317" },
});
