/**
 * React binding between the save store and the pure stats engine.
 *
 * Loads the save on mount, applies wall-clock decay immediately (kind
 * offline timers), and exposes instant care actions: state updates render
 * synchronously while persistence happens in the background, so visible
 * feedback always lands well under 300ms.
 */
import { useCallback, useEffect, useState } from "react";
import { loadSave, type SaveData, saveSave } from "../save/store";
import { buyCostume } from "./costume";
import { awardRun, type RunResult } from "./runner";
import { earnCareStar } from "./stars";
import { applyCareAction, applyWallClockDecay, type CareAction } from "./stats";

export interface PetSave {
	/** Current save, or null while loading. */
	save: SaveData | null;
	loading: boolean;
	/** Apply a care action instantly (render first, persist in background). */
	act: (action: CareAction) => void;
	/** Buy (and equip) a costume by id; no-op when unaffordable or unknown. */
	buy: (id: string) => void;
	/** Bank a finished runner run (stars + happiness). */
	award: (result: RunResult) => void;
}

export function usePetSave(): PetSave {
	const [save, setSave] = useState<SaveData | null>(null);

	useEffect(() => {
		let alive = true;
		void loadSave().then((loaded) => {
			if (!alive) return;
			const decayed = applyWallClockDecay(loaded, Date.now());
			setSave(decayed);
			// Persist the decayed snapshot so the next launch measures from now.
			void saveSave(decayed);
		});
		return () => {
			alive = false;
		};
	}, []);

	const act = useCallback((action: CareAction) => {
		setSave((prev) => {
			if (prev === null) return prev;
			const next: SaveData = earnCareStar({
				...prev,
				stats: applyCareAction(prev.stats, action),
			});
			void saveSave(next);
			return next;
		});
	}, []);

	const buy = useCallback((id: string) => {
		setSave((prev) => {
			if (prev === null) return prev;
			const next = buyCostume(prev, id);
			if (next !== prev) void saveSave(next);
			return next;
		});
	}, []);

	const award = useCallback((result: RunResult) => {
		setSave((prev) => {
			if (prev === null) return prev;
			const next = awardRun(prev, result);
			void saveSave(next);
			return next;
		});
	}, []);

	return { save, loading: save === null, act, buy, award };
}
