/**
 * The wardrobe: a small, joyful set of filter-recolor costumes.
 *
 * Every costume tints Teddy's sprite with a CSS filter — the same mechanism
 * scene-wide, so each look is automatically consistent across the idle room,
 * the walk cycle, and the runner with no extra art. Buying spends stars,
 * records ownership, and equips; owned items can be re-equipped at any time
 * (free switching, including back to the default onesie).
 */
import type { SaveData } from "../save/store";
import {
	BERRY_NIGHT_PRICE,
	FIRST_COSTUME_PRICE,
	MINT_DREAM_PRICE,
	spendStars,
} from "./stars";

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
	{
		id: "mint-dream",
		name: "Mint Dream",
		icon: "🌿",
		price: MINT_DREAM_PRICE,
		filter: "hue-rotate(-60deg) saturate(0.9) brightness(1.05)",
	},
	{
		id: "berry-night",
		name: "Berry Night",
		icon: "🫐",
		price: BERRY_NIGHT_PRICE,
		filter: "hue-rotate(60deg) saturate(1.2) brightness(0.85)",
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
