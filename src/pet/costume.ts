/**
 * The wardrobe: a small, joyful set of costumes in two render styles.
 *
 * "filter" costumes recolor the sprite with a CSS filter — they equip over
 * every face and animation by construction. "overlay" accessories are real
 * art drawn over base Teddy, so they need companion strips to follow the
 * walk and run. Buying spends stars, records ownership, and equips; owned
 * items can be re-equipped at any time (free switching, including back to
 * the default onesie).
 */
import type { SaveData } from "../save/store";
import {
	COZY_SCARF_PRICE,
	FIRST_COSTUME_PRICE,
	PARTY_HAT_PRICE,
	spendStars,
} from "./stars";

export interface Costume {
	id: string;
	name: string;
	icon: string;
	price: number;
	/** Render style: "filter" recolors the sprite, "overlay" draws accessory art. */
	kind: "filter" | "overlay";
	/** CSS filter applied to the sprite while equipped (filter kind only). */
	filter?: string;
}

export const COSTUMES: Costume[] = [
	{
		id: "sunset-onesie",
		name: "Sunset Onesie",
		icon: "🌅",
		price: FIRST_COSTUME_PRICE,
		kind: "filter",
		filter: "hue-rotate(-35deg) saturate(1.25)",
	},
	{
		id: "party-hat",
		name: "Party Hat",
		icon: "🎉",
		price: PARTY_HAT_PRICE,
		kind: "overlay",
	},
	{
		id: "cozy-scarf",
		name: "Cozy Scarf",
		icon: "🧣",
		price: COZY_SCARF_PRICE,
		kind: "overlay",
	},
];

/**
 * Buy a costume: deduct its price, record ownership, and equip it. An
 * already-owned costume equips again for free. Returns the save unchanged
 * when the id is unknown, the costume is already equipped, or stars fall
 * short (never negative, never double-charged).
 */
export function buyCostume(save: SaveData, id: string): SaveData {
	const costume = COSTUMES.find((c) => c.id === id);
	if (!costume || save.costume === id) return save;
	if (save.owned.includes(id)) return { ...save, costume: id };
	const paid = spendStars(save, costume.price);
	if (paid === save) return save;
	return { ...paid, costume: id, owned: [...paid.owned, id] };
}

/**
 * Wear an owned costume, or the default onesie with null. Returns the save
 * unchanged when the id is not owned — nobody wears what they don't have.
 */
export function equipCostume(save: SaveData, id: string | null): SaveData {
	if (id === null) return { ...save, costume: null };
	if (!save.owned.includes(id) || save.costume === id) return save;
	return { ...save, costume: id };
}
