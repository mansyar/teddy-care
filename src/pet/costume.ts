/**
 * The MVP wardrobe: exactly one costume, a CSS-filter recolor.
 *
 * A filter (rather than new art) equips over every face automatically — the
 * filter applies to whichever face image is showing, including blink. Buying
 * spends stars and equips permanently; there is no unequip in the MVP, so
 * the save schema (single `costume` field) needs no migration.
 */
import type { SaveData } from "../save/store";
import { FIRST_COSTUME_PRICE, spendStars } from "./stars";

export interface Costume {
	id: string;
	name: string;
	icon: string;
	price: number;
	/** CSS filter applied to the sprite while equipped. */
	filter: string;
}

export const COSTUMES: Costume[] = [
	{
		id: "sunset-onesie",
		name: "Sunset Onesie",
		icon: "🌅",
		price: FIRST_COSTUME_PRICE,
		filter: "hue-rotate(-35deg) saturate(1.25)",
	},
];

/**
 * Buy a costume: deduct its price and equip it. Returns the save unchanged
 * when the id is unknown, the costume is already equipped, or stars fall
 * short (never negative, never double-charged).
 */
export function buyCostume(save: SaveData, id: string): SaveData {
	const costume = COSTUMES.find((c) => c.id === id);
	if (!costume || save.costume === id) return save;
	const paid = spendStars(save, costume.price);
	if (paid === save) return save;
	return { ...paid, costume: id };
}
