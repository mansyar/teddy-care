/**
 * Star economy: pure earn/spend rules.
 *
 * Generous by design — every care action earns a star, and the first costume
 * unlocks after about ten actions (one or two sittings for a 4-year-old).
 * Spending never fails loudly: an unaffordable purchase leaves the save
 * untouched so the UI can simply keep the costume locked.
 */
import type { SaveData } from "../save/store";

/** Stars earned per care action. */
export const STARS_PER_CARE = 1;
/** Price of the first (MVP) unlockable costume. */
export const FIRST_COSTUME_PRICE = 10;
/** Price of the mid-tier costume. */
export const MINT_DREAM_PRICE = 20;
/** Price of the top-tier costume. */
export const BERRY_NIGHT_PRICE = 30;

/** Add the care-action reward to a save's star balance. */
export function earnCareStar(save: SaveData): SaveData {
	return { ...save, stars: save.stars + STARS_PER_CARE };
}

/** True when the save's balance covers the given price. */
export function canAfford(save: SaveData, price: number): boolean {
	return save.stars >= price;
}

/**
 * Deduct a price from the balance. Returns the save unchanged when
 * unaffordable — the balance never goes negative.
 */
export function spendStars(save: SaveData, price: number): SaveData {
	if (!canAfford(save, price)) return save;
	return { ...save, stars: save.stars - price };
}
