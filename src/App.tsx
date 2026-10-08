/**
 * App shell with toddler-safe tab navigation.
 * Hash routing keeps refresh + offline file serving working in the static PWA.
 * Teddy's Room is the home screen; mini-games live behind the toy box POI.
 * One screen-music hook keeps exactly one theme playing across routes.
 */
import {
	HashRouter,
	NavLink,
	Route,
	Routes,
	useLocation,
} from "react-router-dom";
import { useScreenMusic } from "./audio/useScreenMusic.ts";
import { useSettings } from "./pet/useSettings.ts";
import BubblesScreen from "./screens/BubblesScreen.tsx";
import ParentScreen from "./screens/ParentScreen.tsx";
import PuzzleScreen from "./screens/PuzzleScreen.tsx";
import RoomScreen from "./screens/RoomScreen.tsx";
import RunnerScreen from "./screens/RunnerScreen.tsx";

function Shell() {
	// Shell owns the settings so the music hook and the parent panel see
	// the same state — a second usePetSave instance here would fork the
	// truth and the panel's toggles would never reach the music.
	const { settings, updateSettings } = useSettings();
	const { pathname } = useLocation();
	useScreenMusic(settings, pathname);
	return (
		<div className="app">
			<main className="app-main">
				<Routes>
					<Route path="/" element={<RoomScreen />} />
					<Route path="/runner" element={<RunnerScreen />} />
					<Route path="/bubbles" element={<BubblesScreen />} />
					<Route path="/puzzle" element={<PuzzleScreen />} />
					<Route
						path="/parents"
						element={
							<ParentScreen
								settings={settings}
								updateSettings={updateSettings}
							/>
						}
					/>
					{/* Unknown hashes land back home — never an empty room. */}
					<Route path="*" element={<RoomScreen />} />
				</Routes>
			</main>
			<nav className="app-nav" aria-label="Main">
				<NavLink to="/" end aria-label="Teddy's Room">
					<span aria-hidden="true">🐻</span>
				</NavLink>
				<NavLink to="/parents" aria-label="Grown-ups">
					<span aria-hidden="true">🌙</span>
				</NavLink>
			</nav>
		</div>
	);
}

export default function App() {
	return (
		<HashRouter>
			<Shell />
		</HashRouter>
	);
}
