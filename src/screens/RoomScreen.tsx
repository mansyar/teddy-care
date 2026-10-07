/**
 * Room screen: Teddy's Room — the wander-around home that will replace the
 * Care screen (track teddys_room_20261007).
 *
 * Screen-level glue over the tested layout model and the presentational
 * RoomScene: picks the layout for the live viewport orientation and derives
 * Teddy's face from his mood. Interaction wiring (walk→act, POI actions)
 * lands in Phase 3 — taps are inert for now.
 */
import { useEffect, useState } from "react";
import { COSTUMES } from "../pet/costume";
import { deriveMood, FACE_FOR_MOOD } from "../pet/mood";
import { usePetSave } from "../pet/usePetSave";
import { useSettings } from "../pet/useSettings";
import { resolveLayout } from "../room/layout";
import RoomScene from "../room/RoomScene";

/** Current viewport orientation-tracked layout. */
function useRoomLayout() {
	const [layout, setLayout] = useState(() =>
		resolveLayout(window.innerWidth, window.innerHeight),
	);
	useEffect(() => {
		const onResize = () =>
			setLayout(resolveLayout(window.innerWidth, window.innerHeight));
		window.addEventListener("resize", onResize);
		return () => window.removeEventListener("resize", onResize);
	}, []);
	return layout;
}

export default function RoomScreen() {
	const { save } = usePetSave();
	const { settings } = useSettings();
	const layout = useRoomLayout();

	const stats = save?.stats;
	const mood = stats
		? deriveMood(stats, { bedtime: settings.bedtime })
		: "idle";
	const costumeFilter =
		COSTUMES.find((c) => c.id === save?.costume)?.filter ?? "none";

	// Teddy starts on the open floor (center of the walkable zone).
	const floor = layout.floor;
	const teddyX = floor.x + floor.w / 2;
	const teddyY = floor.y + floor.h * 0.8;

	return (
		<section aria-label="Teddy's Room" className="room-page">
			<RoomScene
				layout={layout}
				teddyX={teddyX}
				teddyY={teddyY}
				walking={false}
				facing="right"
				face={FACE_FOR_MOOD[mood]}
				costumeFilter={costumeFilter}
			/>
		</section>
	);
}
