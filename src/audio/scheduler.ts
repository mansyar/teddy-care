/**
 * Pure music scheduler: the looping brain behind the per-screen themes.
 *
 * This module owns only the tricky timing logic — lookahead loop scheduling,
 * crossfade hand-off between themes, and clean stop/restart — with zero
 * WebAudio dependency. The host callbacks receive every decision so the
 * wiring layer (`sound.ts`) can turn them into oscillators and gain ramps.
 * Kindness invariant: exactly one loop is ever active, notes never drift or
 * double, and a restart lands back on the loop's first beat.
 */

/** One note inside a theme loop, positioned relative to the loop start. */
export interface ScheduledNote {
	/** Seconds after the loop start. */
	offsetS: number;
	frequency: number;
	durationS: number;
	volume: number;
	/**
	 * Which synthesizer voice plays the note. Opaque to the scheduler —
	 * the palette lives in `themes.ts`, the wiring interprets it.
	 */
	voice?: string;
}

/** A composed, seamlessly-looping phrase for one screen mood. */
export interface Theme {
	id: string;
	/** Length of one loop iteration in seconds. */
	loopS: number;
	/** Base gain for the theme's voices (fade envelopes scale this). */
	gain: number;
	notes: readonly ScheduledNote[];
}

/** The WebAudio boundary: the scheduler decides, the host performs. */
export interface SchedulerHost {
	/** Play one note at the absolute time `atS` (seconds on the host clock). */
	note(atS: number, note: ScheduledNote, theme: Theme): void;
	/**
	 * Begin a crossfade: ramp `prev` (or nothing) down and `next` up over
	 * FADE_S starting at `atS`. Notes already scheduled from `prev` taper
	 * under the fade-out envelope.
	 */
	fade(prev: string | null, next: string, atS: number): void;
}

/** How far ahead notes are scheduled (seconds on the host clock). */
export const LOOKAHEAD_S = 2;

/** Crossfade length for theme hand-offs (seconds). */
export const FADE_S = 1;

/**
 * Clock-agnostic loop scheduler. All times are in seconds on the host's
 * clock (in production, `AudioContext.currentTime`). Scheduling is
 * pointer-based: every note whose absolute time falls inside the lookahead
 * window is handed to the host exactly once, so loops stay seamless without
 * ever scheduling a whole iteration past the horizon.
 */
export class MusicScheduler {
	private host: SchedulerHost;
	private current: Theme | null = null;
	private order: ScheduledNote[] = [];
	/** Loop origin on the host clock (the theme's first beat). */
	private origin = 0;
	/** Position in the loop: which iteration and which note within it. */
	private iteration = 0;
	private index = 0;
	private stopped = true;

	constructor(host: SchedulerHost) {
		this.host = host;
	}

	/** Theme currently looping, or null when stopped. */
	get active(): string | null {
		return this.current?.id ?? null;
	}

	/**
	 * Start looping `theme` from `atS`. Idempotent for the already-active
	 * theme; after a stop, the loop restarts from its first beat.
	 */
	start(theme: Theme, atS: number): void {
		if (!this.stopped && this.current?.id === theme.id) return;
		const prev = this.stopped ? null : (this.current?.id ?? null);
		this.begin(theme, atS, prev);
	}

	/**
	 * Crossfade to `theme` at `atS`: the previous loop stops being scheduled
	 * immediately (its already-scheduled notes taper under the fade-out
	 * envelope) and the new theme begins at once. On a stopped scheduler
	 * this behaves like `start`.
	 */
	switchTo(theme: Theme, atS: number): void {
		const prev = this.stopped ? null : (this.current?.id ?? null);
		this.begin(theme, atS, prev);
	}

	/** Stop scheduling entirely; already-scheduled notes taper via the host. */
	stop(): void {
		this.stopped = true;
		this.current = null;
	}

	/**
	 * Fill the lookahead window: schedule every note that begins within
	 * `nowS + LOOKAHEAD_S`, exactly once.
	 */
	pump(nowS: number): void {
		this.scheduleUntil(nowS + LOOKAHEAD_S);
	}

	/** Common start path: reset loop state, announce the hand-off, prime. */
	private begin(theme: Theme, atS: number, prev: string | null): void {
		this.current = theme;
		this.order = [...theme.notes].sort((a, b) => a.offsetS - b.offsetS);
		this.origin = atS;
		this.iteration = 0;
		this.index = 0;
		this.stopped = false;
		this.host.fade(prev, theme.id, atS);
		this.scheduleUntil(atS + LOOKAHEAD_S);
	}

	/** Hand every note before `deadline` to the host, in order, once each. */
	private scheduleUntil(deadline: number): void {
		if (this.stopped || this.current === null || this.order.length === 0) {
			return;
		}
		const theme = this.current;
		for (;;) {
			const note = this.order[this.index];
			const atS = this.origin + this.iteration * theme.loopS + note.offsetS;
			if (atS >= deadline) return;
			this.host.note(atS, note, theme);
			this.index++;
			if (this.index >= this.order.length) {
				this.index = 0;
				this.iteration++;
			}
		}
	}
}
