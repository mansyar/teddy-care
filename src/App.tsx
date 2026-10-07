import { HashRouter, NavLink, Route, Routes } from "react-router-dom";
import CareScreen from "./screens/CareScreen.tsx";
import ParentScreen from "./screens/ParentScreen.tsx";
import RoomScreen from "./screens/RoomScreen.tsx";
import RunnerScreen from "./screens/RunnerScreen.tsx";

/**
 * App shell with toddler-safe tab navigation.
 * Hash routing keeps refresh + offline file serving working in the static PWA.
 */
export default function App() {
	return (
		<HashRouter>
			<div className="app">
				<main className="app-main">
					<Routes>
						<Route path="/" element={<CareScreen />} />
						{/* Temporary Room preview; replaces CareScreen in Phase 3. */}
						<Route path="/room" element={<RoomScreen />} />
						<Route path="/runner" element={<RunnerScreen />} />
						<Route path="/parents" element={<ParentScreen />} />
					</Routes>
				</main>
				<nav className="app-nav" aria-label="Main">
					<NavLink to="/" end aria-label="Care">
						<span aria-hidden="true">🐻</span>
					</NavLink>
					<NavLink to="/runner" aria-label="Runner game">
						<span aria-hidden="true">🏃</span>
					</NavLink>
					<NavLink to="/parents" aria-label="Grown-ups">
						<span aria-hidden="true">🌙</span>
					</NavLink>
				</nav>
			</div>
		</HashRouter>
	);
}
