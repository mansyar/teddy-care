/**
 * Tests for the screen-music decision logic: the pure heart of the
 * `useScreenMusic` hook. Given the theme the hook wants playing, whether
 * the engine is actually playing, the parent settings, the current
 * route, and whether the user has made their first gesture, it resolves
 * exactly one active theme — or a clean stop that keeps the desired
 * theme so unmuting restores the right music. Pure logic, plain node.
 */
import { describe, expect, it } from "vitest";
import { decideMusic } from "./useScreenMusic";

const AUDIBLE = { muted: false, bedtime: false };
const MUTED = { muted: true, bedtime: false };
const BEDTIME = { muted: false, bedtime: true };

describe("decideMusic", () => {
	it("does nothing before the first gesture, whatever the settings", () => {
		expect(decideMusic(null, false, AUDIBLE, "/", false)).toEqual({
			themeId: "",
			command: "none",
		});
		expect(decideMusic("room", true, AUDIBLE, "/runner", false).command).toBe(
			"none",
		);
	});

	it("starts the current route's theme after the first gesture", () => {
		expect(decideMusic(null, false, AUDIBLE, "/", true)).toEqual({
			themeId: "room",
			command: "play",
		});
		expect(decideMusic(null, false, AUDIBLE, "/runner", true)).toEqual({
			themeId: "runner",
			command: "play",
		});
	});

	it("keeps exactly one theme when already playing it", () => {
		expect(decideMusic("room", true, AUDIBLE, "/", true)).toEqual({
			themeId: "room",
			command: "none",
		});
	});

	it("switches themes when the route changes", () => {
		expect(decideMusic("room", true, AUDIBLE, "/bubbles", true)).toEqual({
			themeId: "bubbles",
			command: "play",
		});
	});

	it("bedtime overrides the route with the lullaby", () => {
		expect(decideMusic("runner", true, BEDTIME, "/runner", true)).toEqual({
			themeId: "lullaby",
			command: "play",
		});
		expect(decideMusic("lullaby", true, BEDTIME, "/", true)).toEqual({
			themeId: "lullaby",
			command: "none",
		});
	});

	it("mute stops the music but keeps the desired theme", () => {
		expect(decideMusic("bubbles", true, MUTED, "/bubbles", true)).toEqual({
			themeId: "bubbles",
			command: "stop",
		});
	});

	it("unmuting restarts the remembered theme", () => {
		expect(decideMusic("bubbles", false, AUDIBLE, "/bubbles", true)).toEqual({
			themeId: "bubbles",
			command: "play",
		});
	});

	it("mute while nothing plays is a no-op", () => {
		expect(decideMusic(null, false, MUTED, "/", true)).toEqual({
			themeId: "",
			command: "none",
		});
	});

	it("the parent panel keeps whatever was playing (FR3)", () => {
		expect(decideMusic("bubbles", true, AUDIBLE, "/parents", true)).toEqual({
			themeId: "bubbles",
			command: "none",
		});
		// Restarted after a mute, still the remembered theme.
		expect(decideMusic("bubbles", false, AUDIBLE, "/parents", true)).toEqual({
			themeId: "bubbles",
			command: "play",
		});
		// Nothing yet? The room theme fills in.
		expect(decideMusic(null, false, AUDIBLE, "/parents", true)).toEqual({
			themeId: "room",
			command: "play",
		});
	});
});
