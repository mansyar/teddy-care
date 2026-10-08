/**
 * Single owner of the pet save in the React tree.
 *
 * `App` mounts one `PetSaveProvider`; every screen and hook reads the save
 * through `usePetSaveContext`. Before this provider, each screen created
 * its own `usePetSave()` instance — five parallel IndexedDB loads and five
 * state forks, where a parent-panel mute toggle could persist the shell's
 * stale snapshot and erase stars the child had just earned.
 */
import { createContext, useContext, type ReactNode } from "react";
import { usePetSave, type PetSave } from "./usePetSave";

const PetSaveContext = createContext<PetSave | null>(null);

export function PetSaveProvider({ children }: { children: ReactNode }) {
	const petSave = usePetSave();
	return (
		<PetSaveContext.Provider value={petSave}>{children}</PetSaveContext.Provider>
	);
}

/** Access the one shared pet save. Must be used inside a `PetSaveProvider`. */
export function usePetSaveContext(): PetSave {
	const context = useContext(PetSaveContext);
	if (context === null) {
		throw new Error(
			"usePetSaveContext must be used inside a <PetSaveProvider>",
		);
	}
	return context;
}
