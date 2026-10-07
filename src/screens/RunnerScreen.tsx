/**
 * Runner screen: mounts the Phaser track, banks finished runs into the save
 * (stars + happiness via the hook), and celebrates every finish — there is
 * no losing. Tap the track or the big Jump button to hop for high stars.
 *
 * Screen-level wiring (glue over tested reward math) — verified via `pnpm
 * build` plus manual/Playwright runs.
 */
import { useEffect, useRef, useState } from "react";
import { playFanfare } from "../audio/sound";
import { createRunnerGame, type RunnerApi } from "../game/runGame";
import { type RunResult, runReward } from "../pet/runner";
import { usePetSave } from "../pet/usePetSave";
import { useSettings } from "../pet/useSettings";

interface FinishedRun {
	result: RunResult;
	reward: number;
}

export default function RunnerScreen() {
	const { award } = usePetSave();
	const { settings } = useSettings();
	const hostRef = useRef<HTMLDivElement>(null);
	const apiRef = useRef<RunnerApi | null>(null);
	const [runId, setRunId] = useState(0);
	const [finished, setFinished] = useState<FinishedRun | null>(null);
	// Latest settings for the finish fanfare. The game mounts once per run
	// and must NOT remount when the save loads: each loadSave resolution
	// mints a new settings object, which used to reboot Phaser mid-entry
	// and strand a second canvas in the track.
	const settingsRef = useRef(settings);
	settingsRef.current = settings;

	// runId is a deliberate remount key: a fresh game per run.
	// biome-ignore lint/correctness/useExhaustiveDependencies: remount on runId
	useEffect(() => {
		if (!hostRef.current) return;
		apiRef.current = null;
		const game = createRunnerGame(hostRef.current, {
			onReady: (api) => {
				apiRef.current = api;
			},
			onFinish: (result) => {
				setFinished({ result, reward: runReward(result) });
				award(result);
				playFanfare(settingsRef.current);
			},
		});
		return () => {
			game.destroy(true);
		};
	}, [runId, award]);

	const runAgain = () => {
		setFinished(null);
		setRunId((id) => id + 1);
	};

	return (
		<section aria-label="Runner">
			<h1>Run, Teddy, Run!</h1>
			<div className="runner-track" ref={hostRef} />
			<button
				type="button"
				className="care-btn jump-btn"
				onPointerDown={() => apiRef.current?.jump()}
				onClick={() => apiRef.current?.jump()}
				aria-label="Jump"
			>
				<span aria-hidden="true">🦘</span> Jump!
			</button>
			{finished && (
				<div className="wardrobe-card" role="status">
					<span>
						<span aria-hidden="true">🎉</span> Teddy ran{" "}
						{Math.round(finished.result.distanceM)}m and earned ⭐
						{finished.reward}!
					</span>
					<button
						type="button"
						className="care-btn"
						onClick={runAgain}
						aria-label="Run again"
					>
						Again!
					</button>
				</div>
			)}
		</section>
	);
}
