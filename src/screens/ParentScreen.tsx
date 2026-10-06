/**
 * Parent panel: sound toggle, bedtime toggle, and a two-tap start-over.
 * Plain words, big buttons — a tired grown-up at 9pm is the user here.
 * Settings ride inside the save, so starting over resets them too (no
 * stuck bedtime dim or mute can survive a fresh Teddy).
 */
import { useState } from "react";
import { useSettings } from "../pet/useSettings";
import { resetSave } from "../save/store";

export default function ParentScreen() {
	const { settings, updateSettings } = useSettings();
	const [armingReset, setArmingReset] = useState(false);

	const handleReset = async () => {
		if (!armingReset) {
			setArmingReset(true);
			return;
		}
		await resetSave();
		window.location.reload();
	};

	return (
		<section aria-label="Parents">
			<h1>Grown-ups</h1>
			<div className="parent-card">
				<button
					type="button"
					className="care-btn"
					aria-pressed={settings.muted}
					onClick={() => updateSettings({ muted: !settings.muted })}
					aria-label={settings.muted ? "Turn sound on" : "Turn sound off"}
				>
					{settings.muted ? "🔇 Sound off" : "🔊 Sound on"}
				</button>
				<button
					type="button"
					className="care-btn"
					aria-pressed={settings.bedtime}
					onClick={() => updateSettings({ bedtime: !settings.bedtime })}
					aria-label={settings.bedtime ? "Turn bedtime off" : "Turn bedtime on"}
				>
					{settings.bedtime ? "🌙 Bedtime on" : "☀️ Bedtime off"}
				</button>
				<button
					type="button"
					className="care-btn danger"
					onClick={() => void handleReset()}
					aria-label={
						armingReset
							? "Confirm: erase Teddy and start over"
							: "Start over with a fresh Teddy"
					}
				>
					{armingReset ? "⚠️ Tap again to erase" : "🧹 Start over"}
				</button>
				{armingReset && (
					<p role="status">
						This erases Teddy, stars, and these settings. Nothing leaves this
						device either way.
					</p>
				)}
			</div>
		</section>
	);
}
