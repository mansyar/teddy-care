/**
 * Synthesis voices: pure descriptions of how each theme note sounds.
 * A voice is a waveform (or noise band), an envelope shape, and a mix
 * level — plain data the WebAudio wiring turns into nodes. The envelope
 * function is pure too: it clamps attack + release to fit inside the
 * note, so even a tiny note never produces a negative or overshooting
 * envelope.
 */
import type { VoiceName } from "./themes";

/** How a voice sounds: waveform, envelope shape, mix level, tone shaping. */
export interface VoiceSpec {
	/** Oscillator waveform; ignored when `noise` is set. */
	wave: "sine" | "triangle" | "square" | "sawtooth";
	/** Seconds to swell from silence to full level. */
	attackS: number;
	/** Seconds to fade back to silence after the hold. */
	releaseS: number;
	/** Mix multiplier applied to the note's own volume. */
	gainScale: number;
	/** Noise-band voice (the shimmer) instead of a pitched oscillator. */
	noise?: boolean;
	/** Optional low-pass filter frequency, taming bright waveforms. */
	filterHz?: number;
}

const PLUCK: VoiceSpec = {
	wave: "triangle",
	attackS: 0.01,
	releaseS: 0.25,
	gainScale: 1,
};

const PAD: VoiceSpec = {
	wave: "sine",
	attackS: 0.8,
	releaseS: 1.2,
	gainScale: 0.5,
	filterHz: 1200,
};

const ARPEGGIO: VoiceSpec = {
	wave: "square",
	attackS: 0.005,
	releaseS: 0.08,
	gainScale: 0.6,
	filterHz: 2000,
};

const SHIMMER: VoiceSpec = {
	wave: "sine",
	attackS: 1.5,
	releaseS: 1.5,
	gainScale: 0.5,
	noise: true,
	filterHz: 6000,
};

const PERCUSSION: VoiceSpec = {
	wave: "sine",
	attackS: 0.001,
	releaseS: 0.1,
	gainScale: 1,
};

const MARIMBA: VoiceSpec = {
	wave: "sine",
	attackS: 0.005,
	releaseS: 0.3,
	gainScale: 0.9,
};

/** Every voice, by name. */
export const VOICES: Record<VoiceName, VoiceSpec> = {
	pluck: PLUCK,
	pad: PAD,
	arpeggio: ARPEGGIO,
	shimmer: SHIMMER,
	percussion: PERCUSSION,
	marimba: MARIMBA,
};

/** Resolve a voice spec; unknown names fall back to the trusty pluck. */
export function voiceFor(name: VoiceName): VoiceSpec {
	return VOICES[name] ?? PLUCK;
}

/** One note's envelope, clamped to fit the note's duration. */
export interface Envelope {
	attackS: number;
	/** Seconds held at full level between attack and release. */
	holdS: number;
	releaseS: number;
}

/**
 * The note's envelope: natural attack/hold/release when the note is long
 * enough, proportionally shrunk attack and release when it is not.
 */
export function envelopeFor(spec: VoiceSpec, durationS: number): Envelope {
	const natural = spec.attackS + spec.releaseS;
	if (natural <= durationS) {
		return {
			attackS: spec.attackS,
			holdS: durationS - natural,
			releaseS: spec.releaseS,
		};
	}
	const scale = durationS / natural;
	const attackS = spec.attackS * scale;
	return { attackS, holdS: 0, releaseS: durationS - attackS };
}
