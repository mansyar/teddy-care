/**
 * App shell with toddler-safe tab navigation.
 * Hash routing keeps refresh + offline file serving working in the static PWA.
 * Teddy's Room is the home screen; mini-games live behind the toy box POI.
 */
import { HashRouter, NavLink, Route, Routes } from "react-router-dom";
import BubblesScreen from "./screens/BubblesScreen.tsx";
import ParentScreen from "./screens/ParentScreen.tsx";
import RoomScreen from "./screens/RoomScreen.tsx";
import RunnerScreen from "./screens/RunnerScreen.tsx";

export default function App() {
	return (
		<HashRouter>
			<div className="app">
				<main className="app-main">
					<Routes>
						<Route path="/" element={<RoomScreen />} />
						<Route path="/runner" element={<RunnerScreen />} />
						<Route path="/bubbles" element={<BubblesScreen />} />
						<Route path="/parents" element={<ParentScreen />} />
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
		</HashRouter>
	);
}
