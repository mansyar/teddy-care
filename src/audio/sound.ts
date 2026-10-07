/**
 * Placeholder audio: tiny synthesized SFX + a gentle music-box loop, all
 * generated with WebAudio (zero assets, fully offline). Every entry point
 * takes the parent settings and stays silent unless audible — callers never
 * branch on mute/bedtime themselves. Real compositions replace these
 * placeholders in a later track without touching call sites.
 */
import { isAudible } from "../pet/settings";
import type { ParentSettings } from "../save/store";

let ctx: AudioContext | null = null;
let musicTimer: number | undefined;

/** Lazily create (and resume) the shared context; null where unsupported. */
function audio(): AudioContext | null {
	try {
		if (typeof window === "undefined" || !("AudioContext" in window)) {
			return null;
		}
		if (ctx === null) ctx = new AudioContext();
		if (ctx.state === "suspended") void ctx.resume();
		return ctx;
	} catch {
		return null;
	}
}

/** One soft enveloped tone. */
function tone(
	context: AudioContext,
	frequency: number,
	delayS: number,
	durationS: number,
	volume = 0.12,
	type: OscillatorType = "sine",
): void {
	const start = context.currentTime + delayS;
	const osc = context.createOscillator();
	const gain = context.createGain();
	osc.type = type;
	osc.frequency.value = frequency;
	gain.gain.setValueAtTime(0, start);
	gain.gain.linearRampToValueAtTime(volume, start + 0.02);
	gain.gain.exponentialRampToValueAtTime(0.001, start + durationS);
	osc.connect(gain).connect(context.destination);
	osc.start(start);
	osc.stop(start + durationS + 0.05);
}

function play(
	settings: ParentSettings,
	notes: {
		frequency: number;
		delayS: number;
		durationS: number;
		volume?: number;
	}[],
): void {
	if (!isAudible(settings)) return;
	const context = audio();
	if (context === null) return;
	for (const note of notes) {
		tone(context, note.frequency, note.delayS, note.durationS, note.volume);
	}
}

/** Soft pop for care buttons. */
export function playPop(settings: ParentSettings): void {
	play(settings, [{ frequency: 520, delayS: 0, durationS: 0.12 }]);
}

/** Gentle alternating footstep ticks while Teddy walks. */
export function playFootsteps(settings: ParentSettings): void {
	play(settings, [
		{ frequency: 180, delayS: 0, durationS: 0.07, volume: 0.06 },
		{ frequency: 150, delayS: 0.18, durationS: 0.07, volume: 0.06 },
		{ frequency: 180, delayS: 0.36, durationS: 0.07, volume: 0.05 },
		{ frequency: 150, delayS: 0.54, durationS: 0.07, volume: 0.05 },
	]);
}

/** Three low crunches for a meal at the bowl. */
export function playMunch(settings: ParentSettings): void {
	play(settings, [
		{ frequency: 220, delayS: 0, durationS: 0.09, volume: 0.1 },
		{ frequency: 180, delayS: 0.14, durationS: 0.09, volume: 0.1 },
		{ frequency: 220, delayS: 0.28, durationS: 0.12, volume: 0.09 },
	]);
}

/** Bubbly water fizz for the bathtub. */
export function playFizz(settings: ParentSettings): void {
	play(settings, [
		{ frequency: 740, delayS: 0, durationS: 0.09, volume: 0.07 },
		{ frequency: 980, delayS: 0.09, durationS: 0.09, volume: 0.07 },
		{ frequency: 820, delayS: 0.18, durationS: 0.09, volume: 0.06 },
		{ frequency: 1100, delayS: 0.27, durationS: 0.12, volume: 0.06 },
	]);
}

/** Sleepy descending yawn for tucking in. */
export function playYawn(settings: ParentSettings): void {
	play(settings, [
		{ frequency: 420, delayS: 0, durationS: 0.25, volume: 0.08 },
		{ frequency: 330, delayS: 0.22, durationS: 0.3, volume: 0.08 },
		{ frequency: 260, delayS: 0.45, durationS: 0.4, volume: 0.07 },
	]);
}

/** Happy three-note giggle for taps and petting. */
export function playGiggle(settings: ParentSettings): void {
	play(settings, [
		{ frequency: 660, delayS: 0, durationS: 0.12 },
		{ frequency: 880, delayS: 0.09, durationS: 0.12 },
		{ frequency: 990, delayS: 0.18, durationS: 0.18 },
	]);
}

/** Bright chime for earned stars and purchases. */
export function playStar(settings: ParentSettings): void {
	play(settings, [
		{ frequency: 880, delayS: 0, durationS: 0.2 },
		{ frequency: 1320, delayS: 0.1, durationS: 0.3 },
	]);
}

/** Little victory run for finishing the race. */
export function playFanfare(settings: ParentSettings): void {
	play(settings, [
		{ frequency: 523, delayS: 0, durationS: 0.15 },
		{ frequency: 659, delayS: 0.12, durationS: 0.15 },
		{ frequency: 784, delayS: 0.24, durationS: 0.15 },
		{ frequency: 1047, delayS: 0.36, durationS: 0.35 },
	]);
}

/** Bright short blip for popping a bubble in the tap game. */
export function popBubble(settings: ParentSettings): void {
	play(settings, [{ frequency: 1150, delayS: 0, durationS: 0.08 }]);
}

/** Placeholder music-box loop (C–E–G lullaby fragment). Idempotent. */
export function startMusic(settings: ParentSettings): void {
	if (!isAudible(settings) || musicTimer !== undefined) return;
	const context = audio();
	if (context === null) return;
	const phrase = [523, 659, 784, 659];
	let step = 0;
	musicTimer = window.setInterval(() => {
		if (!isAudible(settings)) {
			stopMusic();
			return;
		}
		const live = audio();
		if (live === null) return;
		tone(live, phrase[step % phrase.length], 0, 0.5, 0.05, "triangle");
		step++;
	}, 480);
}

/** Stop the music loop (mute, bedtime, or teardown). */
export function stopMusic(): void {
	window.clearInterval(musicTimer);
	musicTimer = undefined;
}
