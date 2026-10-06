/**
 * Tests for parent settings helpers: immutable patch merges and the
 * audibility rule (muted or bedtime ⇒ silent).
 */
import { describe, expect, it } from "vitest";
import { DEFAULT_SAVE, type SaveData } from "../save/store";
import { isAudible, withSettings } from "./settings";

describe("withSettings", () => {
	it("merges a patch without touching anything else", () => {
		const save: SaveData = { ...DEFAULT_SAVE, stars: 7 };
		const after = withSettings(save, { muted: true });
		expect(after.settings).toEqual({ muted: true, bedtime: false });
		expect(after.stars).toBe(7);
	});

	it("does not mutate the original save", () => {
		const save: SaveData = {
			...DEFAULT_SAVE,
			settings: { muted: false, bedtime: false },
		};
		withSettings(save, { bedtime: true });
		expect(save.settings.bedtime).toBe(false);
	});
});

describe("isAudible", () => {
	it("is silent when muted or at bedtime", () => {
		expect(isAudible({ muted: true, bedtime: false })).toBe(false);
		expect(isAudible({ muted: false, bedtime: true })).toBe(false);
		expect(isAudible({ muted: true, bedtime: true })).toBe(false);
	});

	it("plays sound when unmuted and not bedtime", () => {
		expect(isAudible({ muted: false, bedtime: false })).toBe(true);
	});
});
