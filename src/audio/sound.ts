/**
 * Audio layer: tiny synthesized SFX + scheduler-driven music themes, all
 * generated with WebAudio (zero assets, fully offline). Every entry point
 * takes the parent settings and stays silent unless audible — callers never
 * branch on mute/bedtime themselves.
 *
 * Music timing follows the lookahead-scheduler pattern: a light pump driver
 * tops up the schedule, but every note is placed on the AudioContext clock
 * by the pure `MusicScheduler`, so loops never drift. Themes crossfade on
 * per-theme gain buses; stopping ramps buses down instead of cutting out.
 */
import { isAudible } from "../pet/settings";
import type { ParentSettings } from "../save/store";
import {
	FADE_S,
	MusicScheduler,
	type ScheduledNote,
	type SchedulerHost,
	type Theme,
} from "./scheduler";
import type { VoiceName } from "./themes";
import { envelopeFor, voiceFor } from "./voices";

let ctx: AudioContext | null = null;
let scheduler: MusicScheduler | null = null;
let pumpTimer: number | undefined;
let liveSettings: ParentSettings | null = null;
/** Themes registered by startMusic, so fade callbacks can find their gain. */
const themes = new Map<string, Theme>();
/** Per-theme gain buses — the crossfade happens between these. */
const buses = new Map<string, GainNode>();
/** Shared noise band for the shimmer voice, built once per context. */
let noiseBuffer: AudioBuffer | null = null;

/** How often the pump driver tops up the lookahead (ms). */
const PUMP_INTERVAL_MS = 200;
/** Quick fade-out on stop, so silence never arrives as a click. */
const STOP_FADE_S = 0.15;

/** The room's music-box theme: a gentle C–E–G fragment, looped seamlessly. */
const ROOM_THEME: Theme = {
	id: "room",
	loopS: 1.92,
	gain: 1,
	notes: [523, 659, 784, 659].map((frequency, index) => ({
		offsetS: index * 0.48,
		frequency,
		durationS: 0.5,
		volume: 0.05,
	})),
};

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

/** One soft enveloped tone, routed to `out` (the destination by default). */
function tone(
	context: AudioContext,
	frequency: number,
	delayS: number,
	durationS: number,
	volume = 0.12,
	type: OscillatorType = "sine",
	out: AudioNode = context.destination,
): void {
	const start = context.currentTime + delayS;
	const osc = context.createOscillator();
	const gain = context.createGain();
	osc.type = type;
	osc.frequency.value = frequency;
	gain.gain.setValueAtTime(0, start);
	gain.gain.linearRampToValueAtTime(volume, start + 0.02);
	gain.gain.exponentialRampToValueAtTime(0.001, start + durationS);
	osc.connect(gain).connect(out);
	osc.start(start);
	osc.stop(start + durationS + 0.05);
}

/** A one-second white-noise band, shared by every shimmer note. */
function noiseFor(context: AudioContext): AudioBuffer {
	if (noiseBuffer === null || noiseBuffer.sampleRate !== context.sampleRate) {
		const buffer = context.createBuffer(
			1,
			context.sampleRate,
			context.sampleRate,
		);
		const data = buffer.getChannelData(0);
		for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
		noiseBuffer = buffer;
	}
	return noiseBuffer;
}

/** Play one scheduled theme note with its voice's timbre and envelope. */
function playVoice(
	context: AudioContext,
	out: AudioNode,
	atS: number,
	note: ScheduledNote,
): void {
	const spec = voiceFor((note.voice ?? "pluck") as VoiceName);
	const env = envelopeFor(spec, note.durationS);
	const level = note.volume * spec.gainScale;
	const releaseStart = atS + env.attackS + env.holdS;
	const endS = releaseStart + env.releaseS;

	const gain = context.createGain();
	gain.gain.setValueAtTime(0, atS);
	gain.gain.linearRampToValueAtTime(level, atS + env.attackS);
	gain.gain.setValueAtTime(level, releaseStart);
	gain.gain.exponentialRampToValueAtTime(0.001, endS);

	let source: AudioScheduledSourceNode;
	if (spec.noise) {
		const band = context.createBufferSource();
		band.buffer = noiseFor(context);
		band.loop = true;
		source = band;
	} else {
		const osc = context.createOscillator();
		osc.type = spec.wave;
		osc.frequency.value = note.frequency;
		source = osc;
	}
	source.connect(gain);

	let tail: AudioNode = gain;
	if (spec.filterHz !== undefined) {
		const filter = context.createBiquadFilter();
		filter.type = "lowpass";
		filter.frequency.value = spec.filterHz;
		gain.connect(filter);
		tail = filter;
	}
	tail.connect(out);
	source.start(atS);
	source.stop(endS + 0.05);
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

/** Shimmering ascending run for the buy-a-costume celebration. */
export function playSparkle(settings: ParentSettings): void {
	play(settings, [
		{ frequency: 880, delayS: 0, durationS: 0.1, volume: 0.09 },
		{ frequency: 1175, delayS: 0.07, durationS: 0.1, volume: 0.09 },
		{ frequency: 1320, delayS: 0.14, durationS: 0.12, volume: 0.1 },
		{ frequency: 1760, delayS: 0.21, durationS: 0.3, volume: 0.1 },
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
export function playPopBubble(settings: ParentSettings): void {
	play(settings, [{ frequency: 1150, delayS: 0, durationS: 0.08 }]);
}

/** Quick light tick when a puzzle piece is picked up. */
export function playPickup(settings: ParentSettings): void {
	play(settings, [
		{ frequency: 660, delayS: 0, durationS: 0.06, volume: 0.07 },
	]);
}

/** Two-note snap when a puzzle piece lands on its outline. */
export function playSnap(settings: ParentSettings): void {
	play(settings, [
		{ frequency: 880, delayS: 0, durationS: 0.05 },
		{ frequency: 1175, delayS: 0.06, durationS: 0.06 },
	]);
}

/** Gentle descending boop when a piece meets the wrong outline. */
export function playBoop(settings: ParentSettings): void {
	play(settings, [
		{ frequency: 300, delayS: 0, durationS: 0.09, volume: 0.08 },
		{ frequency: 220, delayS: 0.08, durationS: 0.1, volume: 0.08 },
	]);
}

/** Per-theme gain bus, created silent; the fade envelope brings it up. */
function busFor(context: AudioContext, theme: Theme): GainNode {
	const existing = buses.get(theme.id);
	if (existing) return existing;
	const node = context.createGain();
	node.gain.value = 0;
	node.connect(context.destination);
	buses.set(theme.id, node);
	return node;
}

/** The WebAudio side of the scheduler boundary, bound to one context. */
function musicHost(context: AudioContext): SchedulerHost {
	return {
		note(atS, note, theme) {
			playVoice(context, busFor(context, theme), atS, note);
		},
		fade(prev, next, atS) {
			const nextTheme = themes.get(next);
			if (nextTheme) {
				const node = busFor(context, nextTheme);
				node.gain.setValueAtTime(0, atS);
				node.gain.linearRampToValueAtTime(nextTheme.gain, atS + FADE_S);
			}
			if (prev !== null) {
				const old = buses.get(prev);
				if (old) {
					old.gain.cancelScheduledValues(atS);
					old.gain.setValueAtTime(old.gain.value, atS);
					old.gain.linearRampToValueAtTime(0, atS + FADE_S);
					// Drop the map entry now so a quick switch-back gets a
					// fresh bus; disconnect the fading node a beat later.
					buses.delete(prev);
					globalThis.setTimeout(
						() => old.disconnect(),
						(atS + FADE_S - context.currentTime) * 1000 + 100,
					);
				}
			}
		},
	};
}

/**
 * Start (or crossfade to) a music theme. Idempotent for the running theme.
 * The optional theme keeps the historical one-argument call sites working;
 * per-screen themes arrive with the screen-music hook.
 */
export function startMusic(
	settings: ParentSettings,
	theme: Theme = ROOM_THEME,
): void {
	if (!isAudible(settings)) return;
	const context = audio();
	if (context === null) return;
	themes.set(theme.id, theme);
	liveSettings = settings;
	if (scheduler !== null) {
		if (scheduler.active === theme.id) return;
		scheduler.switchTo(theme, context.currentTime);
		scheduler.pump(context.currentTime);
		return;
	}
	scheduler = new MusicScheduler(musicHost(context));
	scheduler.start(theme, context.currentTime);
	scheduler.pump(context.currentTime);
	// Light pump driver: only tops up the lookahead — every note time comes
	// from the AudioContext clock, so the loop never drifts.
	pumpTimer = window.setInterval(() => {
		if (liveSettings === null || !isAudible(liveSettings)) {
			stopMusic();
			return;
		}
		const live = audio();
		if (live !== null) scheduler?.pump(live.currentTime);
	}, PUMP_INTERVAL_MS);
}

/** Stop the music (mute, bedtime, or teardown): ramp buses down, no clicks. */
export function stopMusic(): void {
	if (pumpTimer !== undefined) {
		window.clearInterval(pumpTimer);
		pumpTimer = undefined;
	}
	liveSettings = null;
	scheduler?.stop();
	scheduler = null;
	if (ctx === null) {
		buses.clear();
		return;
	}
	const now = ctx.currentTime;
	for (const [id, node] of buses) {
		node.gain.cancelScheduledValues(now);
		node.gain.setValueAtTime(node.gain.value, now);
		node.gain.linearRampToValueAtTime(0, now + STOP_FADE_S);
		// Free the map entry immediately so a quick restart builds a fresh
		// bus; the fading node disconnects once the ramp is done.
		buses.delete(id);
		globalThis.setTimeout(() => node.disconnect(), STOP_FADE_S * 1000 + 100);
	}
}
