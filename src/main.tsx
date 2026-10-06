import { registerSW } from "virtual:pwa-register";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Register the precache service worker so installed/airplane-mode launches
// serve the shell and all Teddy art from cache. onRegisterError keeps a
// future registration failure loud instead of silent.
registerSW({
	immediate: true,
	onRegisterError: (error) => console.error("SW registration failed:", error),
});

const rootElement = document.getElementById("root");
if (rootElement === null) {
	throw new Error("Root element #root not found");
}

createRoot(rootElement).render(
	<StrictMode>
		<App />
	</StrictMode>,
);
