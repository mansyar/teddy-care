/**
 * Tests for the pure theme library: the five composed themes live here as
 * plain data, and `themeFor` resolves one active theme from the current
 * route and the parent settings. Bedtime always wins with the lullaby;
 * anything unrouteable lands on the room theme. Pure data + pure logic —
 * no WebAudio here, so these run in plain node.
 */
import { describe, expect, it } from "vitest";
import { THEMES, themeFor } from "./themes";

const ROUTES = [
	["/", "room"],
	["/runner", "runner"],
	["/bubbles", "bubbles"],
	["/puzzle", "puzzle"],
] as const;

describe("theme resolution", () => {
	it("maps each screen route to its own theme", () => {
		for (const [route, id] of ROUTES) {
			expect(themeFor(route, false).id, route).toBe(id);
		}
	});

	it("falls back to the room theme for unknown routes", () => {
		expect(themeFor("/somewhere-else", false).id).toBe("room");
		expect(themeFor("", false).id).toBe("room");
	});

	it("bedtime overrides every route with the lullaby", () => {
		for (const [route] of ROUTES) {
			expect(themeFor(route, true).id, route).toBe("lullaby");
		}
		expect(themeFor("/nowhere", true).id).toBe("lullaby");
	});
});

describe("the five themes are valid, distinct music data", () => {
	it("defines exactly the five expected theme ids", () => {
		expect(Object.keys(THEMES).sort()).toEqual(
			["bubbles", "lullaby", "puzzle", "room", "runner"].sort(),
		);
	});

	it("every theme is loopable: non-empty notes inside the loop window", () => {
		for (const theme of Object.values(THEMES)) {
			expect(theme.loopS, theme.id).toBeGreaterThan(0);
			expect(theme.gain, theme.id).toBeGreaterThan(0);
			expect(theme.notes.length, theme.id).toBeGreaterThan(0);
			for (const note of theme.notes) {
				expect(note.offsetS, theme.id).toBeGreaterThanOrEqual(0);
				expect(note.offsetS, theme.id).toBeLessThan(theme.loopS);
				expect(note.frequency, theme.id).toBeGreaterThan(0);
				expect(note.durationS, theme.id).toBeGreaterThan(0);
				expect(note.volume, theme.id).toBeGreaterThan(0);
			}
		}
	});

	it("the lullaby is quieter than the room theme", () => {
		expect(THEMES.lullaby.gain).toBeLessThan(THEMES.room.gain);
	});

	it("every theme has its own voice palette", () => {
		const palettes = Object.values(THEMES).map((theme) =>
			[...new Set(theme.notes.map((note) => note.voice))].sort().join("+"),
		);
		expect(new Set(palettes).size).toBe(Object.values(THEMES).length);
	});
});
