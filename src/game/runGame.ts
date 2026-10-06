/**
 * Teddy's runner mini-game: a Phaser scene where Teddy auto-runs along a
 * track, the player taps to jump for high stars, and every run ends happy
 * (no lose state). The scene only *reports* the run — reward math lives in
 * `src/pet/runner.ts` and is unit-tested there.
 *
 * Presentational — verified via `pnpm build` plus manual/Playwright runs.
 */
import Phaser from "phaser";
import { RUN_FINISH_M, type RunResult } from "../pet/runner";

export interface RunnerApi {
	/** Make Teddy jump (no-op mid-air). Safe to call anytime. */
	jump: () => void;
}

export interface RunnerOpts {
	onFinish: (result: RunResult) => void;
	onReady?: (api: RunnerApi) => void;
}

const WIDTH = 480;
const HEIGHT = 320;
const GROUND_Y = 272;
/** Visual scroll speed (px/s). Distance accrues at its own toddler pace. */
const SCROLL_PX_S = 220;
/** Meters per second — the 120m track takes ~30s. */
const SPEED_M_S = 4;
const JUMP_VELOCITY = -620;
const GRAVITY = 1500;
const STAR_EVERY_S = 1.4;

class RunnerScene extends Phaser.Scene {
	private opts: RunnerOpts;
	private teddy!: Phaser.GameObjects.Sprite;
	private vy = 0;
	private grounded = true;
	private distanceM = 0;
	private starsGrabbed = 0;
	private finished = false;
	private spawnIn = 1;
	private stars: Phaser.GameObjects.Text[] = [];
	private dashes: Phaser.GameObjects.Rectangle[] = [];
	private distanceText!: Phaser.GameObjects.Text;
	private starText!: Phaser.GameObjects.Text;

	constructor(opts: RunnerOpts) {
		super("runner");
		this.opts = opts;
	}

	preload(): void {
		this.load.spritesheet("teddy-run", "/teddy/side-run-asfilmed.strip.png", {
			frameWidth: 445,
			frameHeight: 520,
		});
	}

	create(): void {
		this.distanceM = 0;
		this.starsGrabbed = 0;
		this.finished = false;
		this.spawnIn = 1;
		this.stars = [];
		this.dashes = [];
		this.vy = 0;
		this.grounded = true;

		this.anims.create({
			key: "run",
			frames: this.anims.generateFrameNumbers("teddy-run", {
				start: 0,
				end: 14,
			}),
			frameRate: 24,
			repeat: -1,
		});

		// Ground + scrolling dashes for motion feel.
		this.add.rectangle(WIDTH / 2, GROUND_Y + 24, WIDTH, 96, 0x8fd18f);
		for (let i = 0; i < 8; i++) {
			const dash = this.add.rectangle(
				(i * WIDTH) / 7,
				GROUND_Y + 24,
				48,
				8,
				0xffffff,
			);
			this.dashes.push(dash);
		}

		// Lazy clouds.
		for (const [x, y, size] of [
			[80, 60, "48px"],
			[280, 40, "36px"],
			[420, 90, "56px"],
		] as const) {
			const cloud = this.add.text(x, y, "☁️", { fontSize: size });
			this.tweens.add({
				targets: cloud,
				x: x - 560,
				duration: 26000 + x * 40,
				repeat: -1,
			});
		}

		this.teddy = this.add.sprite(110, GROUND_Y, "teddy-run");
		this.teddy.setOrigin(0.5, 1).setScale(0.24);
		this.teddy.play("run");

		// Toddler HUD: distance left, stars right.
		this.distanceText = this.add
			.text(12, 8, `🏁 ${Math.ceil(RUN_FINISH_M)}m`, {
				fontSize: "28px",
				color: "#1b2a4a",
			})
			.setDepth(10);
		this.starText = this.add
			.text(WIDTH - 12, 8, "⭐ 0", { fontSize: "28px", color: "#1b2a4a" })
			.setOrigin(1, 0)
			.setDepth(10);

		// Tap anywhere on the track to jump.
		this.input.on("pointerdown", () => this.jump());
		this.opts.onReady?.({ jump: () => this.jump() });
	}

	override update(_time: number, delta: number): void {
		if (this.finished) return;
		const dt = delta / 1000;

		// Gravity + landing.
		if (!this.grounded) {
			this.vy += GRAVITY * dt;
			this.teddy.y += this.vy * dt;
			if (this.teddy.y >= GROUND_Y) {
				this.teddy.y = GROUND_Y;
				this.grounded = true;
			}
		}

		// Scroll dashes, stars, and distance.
		const dx = SCROLL_PX_S * dt;
		for (const dash of this.dashes) {
			dash.x -= dx;
			if (dash.x < -30) dash.x += WIDTH + 60;
		}
		this.distanceM += SPEED_M_S * dt;

		this.spawnIn -= dt;
		if (this.spawnIn <= 0) {
			this.spawnIn = STAR_EVERY_S;
			const high = Math.random() < 0.5;
			const star = this.add
				.text(WIDTH + 20, GROUND_Y - (high ? 115 : 40), "⭐", {
					fontSize: "36px",
				})
				.setOrigin(0.5);
			this.stars.push(star);
		}

		for (const star of [...this.stars]) {
			star.x -= dx;
			if (
				Math.abs(star.x - this.teddy.x) < 52 &&
				Math.abs(star.y - (this.teddy.y - 70)) < 62
			) {
				this.starsGrabbed++;
				this.starText.setText(`⭐ ${this.starsGrabbed}`);
				this.tweens.add({
					targets: star,
					scale: 1.6,
					alpha: 0,
					duration: 180,
					onComplete: () => star.destroy(),
				});
				this.stars = this.stars.filter((s) => s !== star);
			} else if (star.x < -30) {
				star.destroy();
				this.stars = this.stars.filter((s) => s !== star);
			}
		}

		const left = Math.max(0, Math.ceil(RUN_FINISH_M - this.distanceM));
		this.distanceText.setText(`🏁 ${left}m`);

		if (this.distanceM >= RUN_FINISH_M) this.finish();
	}

	private jump(): void {
		if (this.finished || !this.grounded) return;
		this.grounded = false;
		this.vy = JUMP_VELOCITY;
	}

	private finish(): void {
		this.finished = true;
		for (const star of this.stars) star.destroy();
		this.stars = [];
		this.add
			.text(WIDTH / 2, 120, "🎉 Teddy finished! 🎉", {
				fontSize: "34px",
				color: "#1b2a4a",
			})
			.setOrigin(0.5);
		this.opts.onFinish({
			distanceM: this.distanceM,
			starsGrabbed: this.starsGrabbed,
		});
	}
}

/** Mount the runner into a DOM node; destroy the returned game on unmount. */
export function createRunnerGame(
	parent: HTMLElement,
	opts: RunnerOpts,
): Phaser.Game {
	return new Phaser.Game({
		type: Phaser.AUTO,
		parent,
		width: WIDTH,
		height: HEIGHT,
		backgroundColor: "#cdeefb",
		scene: [new RunnerScene(opts)],
		scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
	});
}
