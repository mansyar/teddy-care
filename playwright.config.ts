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
		reuseExistingServer: !process.env.CI,
	},
	use: { baseURL: "http://localhost:4317" },
});
