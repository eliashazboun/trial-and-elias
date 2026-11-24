import Phaser from "phaser";
import { C } from "./config";
import { Simulation } from "./systems/Simulation";
import {
  Recorder,
  Playback,
  sameRun,
  verifyReplay,
} from "./systems/ReplaySystem";
import { FixedClock } from "./systems/FixedClock";
import { InputSystem } from "./systems/InputSystem";
import { AudioSystem } from "./systems/AudioSystem";
import { DungeonScene } from "./scenes/DungeonScene";
import { StorageManager } from "../storage/StorageManager";
import { recordKey, type Action } from "../storage/schemas";
import type { Replay, RunOptions, Vec } from "./types";
import { makeRecord } from "./systems/RunManager";
import { UI } from "../ui/UI";
export class DungeonGame {
  readonly storage = new StorageManager();
  readonly audio = new AudioSystem(() => this.storage.data.settings);
  readonly ui: UI;
  readonly phaser: Phaser.Game;
  readonly clock = new FixedClock();
  sim = new Simulation({
    seed: C.standardSeed,
    category: "fixed",
    challenge: "standard",
  });
  recorder = new Recorder();
  mode: "menu" | "play" | "paused" | "results" | "replay" = "menu";
  scene?: DungeonScene;
  input?: InputSystem;
  replay?: Playback;
  replayData?: Replay;
  replayPaused = false;
  replaySpeed = 1;
  replayError = "";
  ghostPositions: Vec[] = [];
  ghostMessage = "No compatible personal best yet";
  lastOptions: RunOptions = {
    seed: C.standardSeed,
    category: "fixed",
    challenge: "standard",
  };
  private completed = false;
  private hudAt = 0;
  constructor() {
    this.ui = new UI(this, document.querySelector<HTMLDivElement>("#ui")!);
    this.phaser = new Phaser.Game({
      type: Phaser.AUTO,
      parent: "game",
      backgroundColor: "#101724",
      pixelArt: true,
      roundPixels: false,
      antialias: false,
      scale: {
        mode: Phaser.Scale.RESIZE,
        width: window.innerWidth,
        height: window.innerHeight,
      },
      render: { powerPreference: "high-performance" },
      scene: [new DungeonScene(this)],
      audio: { noAudio: true },
      banner: false,
    });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) this.interrupt("Page hidden during the run");
    });
    window.addEventListener("blur", () =>
      this.interrupt("Window lost focus during the run"),
    );
    window.addEventListener("keydown", (e) => {
      if (e.code === "F3") {
        e.preventDefault();
        this.ui.performanceVisible = !this.ui.performanceVisible;
      }
    });
    if (import.meta.env.DEV)
      Object.defineProperty(window, "__DUNGEON__", {
        get: () => ({
          mode: this.mode,
          state: structuredClone(this.sim.state),
          options: { ...this.sim.options },
          ghost: this.ghostPositions.length,
          warning: this.storage.warning,
          screenPlayer: {
            x:
              (this.sim.state.player.x -
                (this.scene?.cameras.main.worldView.x ?? 0)) *
              (this.scene?.cameras.main.zoom ?? 2),
            y:
              (this.sim.state.player.y -
                (this.scene?.cameras.main.worldView.y ?? 0)) *
              (this.scene?.cameras.main.zoom ?? 2),
          },
        }),
      });
  }
  attach(scene: DungeonScene): void {
    this.scene = scene;
    this.input = new InputSystem(
      () => this.storage.data.settings,
      (a) => this.action(a),
      this.phaser.canvas,
    );
    this.ui.menu();
  }
  start(): void {
    this.lastOptions = {
      category: "fixed",
      challenge: "standard",
      seed: C.standardSeed,
    };
    this.sim = new Simulation(this.lastOptions);
    this.recorder = new Recorder();
    this.replay = undefined;
    this.completed = false;
    this.ghostPositions = [];
    this.ghostMessage = "No compatible personal best yet";
    const key = recordKey("fixed", "standard"),
      replay = this.storage.data.replays[key];
    if (replay) {
      if (sameRun(replay.options, this.lastOptions)) {
        const result = verifyReplay(replay);
        if (result.error) this.ghostMessage = result.error;
        else {
          this.ghostPositions = result.positions;
          this.ghostMessage = "Personal best ghost";
        }
      } else
        this.ghostMessage = "PB seed differs; ghost unavailable for this seed";
    }
    this.storage.beginRun(this.lastOptions);
    this.mode = "play";
    this.input?.clear();
    if (this.input) this.input.active = true;
    this.clock.reset(performance.now());
    this.scene?.dungeonView.reset();
    this.ui.gameplay();
    void this.audio.unlock();
  }
  restart(): void {
    if (this.mode === "replay") {
      if (this.replayData) this.watch(this.replayData);
      return;
    }
    if (!this.completed && this.mode !== "menu") this.finish("Restarted");
    this.start();
  }
  menu(): void {
    if (!this.completed && (this.mode === "play" || this.mode === "paused"))
      this.finish("Returned to menu");
    this.mode = "menu";
    if (this.input) {
      this.input.active = false;
      this.input.clear();
    }
    this.ui.menu();
  }
  private interrupt(reason: string): void {
    if (this.mode === "play") {
      this.sim.invalidate(reason);
      this.pause();
    } else if (this.mode === "replay") {
      this.replayPaused = true;
      this.ui.updateReplay();
    }
  }
  pause(): void {
    if (this.mode === "replay") {
      this.replayPaused = !this.replayPaused;
      this.clock.reset(performance.now());
      this.ui.updateReplay();
      return;
    }
    if (this.mode === "play") {
      this.sim.invalidate("Paused");
      this.mode = "paused";
      this.input?.clear();
      this.ui.pause();
    } else if (this.mode === "paused") {
      this.mode = "play";
      this.input?.clear();
      this.clock.reset(performance.now());
      this.ui.gameplay();
    }
  }
  action(action: Action): void {
    if (action === "restart") this.restart();
    else if (action === "pause") this.pause();
    else if (action === "ghost" || action === "splits") {
      const s = this.storage.data.settings;
      s[action] = !s[action];
      this.storage.save();
    }
  }
  frame(now: number, delta: number): void {
    if (!this.scene) return;
    let alpha = 1;
    if (this.mode === "play")
      alpha = this.clock.advance(
        now,
        () => {
          if (this.sim.state.status !== "running") return;
          const input = this.input!.sample(
            this.scene!.dungeonView.aim(
              this.input!.mouse.x,
              this.input!.mouse.y,
              this.sim,
            ),
          );
          this.sim.step(input);
          this.recorder.record(input, this.sim);
          for (const event of this.sim.events) {
            this.audio.sound(event.type);
            this.scene!.dungeonView.event(event, this.storage.data.settings);
            if (event.detail) this.ui.toast(event.detail);
            if (event.type === "loot" || event.type === "guardian-vulnerable")
              this.ui.updateHUD();
          }
          if (this.sim.state.status !== "running") this.finish();
        },
        (reason) => this.sim.invalidate(reason),
      );
    else if (this.mode === "replay" && !this.replayPaused && this.replay) {
      alpha = this.clock.advance(
        now,
        () => {
          const beforeTick = this.replay!.sim.state.tick;
          this.replay!.step();
          this.sim = this.replay!.sim;
          if (this.sim.state.tick !== beforeTick && !this.replay!.error)
            for (const event of this.sim.events) {
              this.audio.sound(event.type);
              this.scene!.dungeonView.event(event, this.storage.data.settings);
              if (event.detail) this.ui.toast(event.detail);
            }
          if (this.replay!.error) {
            this.replayError = this.replay!.error;
            this.replayPaused = true;
            this.ui.updateReplay();
          }
          if (this.sim.state.tick >= this.replay!.replay.ticks) {
            this.replayPaused = true;
            this.ui.updateReplay();
          }
        },
        () => {},
        this.replaySpeed,
      );
    } else this.clock.reset(now);
    const ghost =
      this.mode === "play" || this.mode === "paused"
        ? this.ghostPositions[this.sim.state.tick]
        : undefined;
    this.scene.dungeonView.draw(
      this.sim,
      alpha,
      Math.min(delta / 1000, 0.05),
      this.storage.data.settings,
      ghost,
    );
    this.audio.update(
      this.mode === "play" || (this.mode === "replay" && !this.replayPaused),
    );
    if (now - this.hudAt > 50) {
      this.ui.updateHUD();
      this.ui.updatePerformance(delta);
      this.hudAt = now;
    }
  }
  private finish(cause?: string): void {
    if (this.completed) return;
    this.completed = true;
    const s = this.sim.state;
    const record = makeRecord(this.sim, cause ?? s.cause);
    const result = this.storage.commit(
      record,
      record.won && record.valid ? this.recorder.finish(this.sim) : undefined,
      true,
    );
    if (cause) return;
    this.mode = "results";
    if (result.pb) this.audio.sound("pb");
    if (result.unlocked.length) this.audio.sound("achievement");
    this.ui.results(record, result);
  }
  watch(replay: Replay): void {
    const result = verifyReplay(replay);
    if (result.error) {
      this.ui.toast(result.error);
      return;
    }
    if (!this.completed && (this.mode === "play" || this.mode === "paused"))
      this.finish("Opened replay");
    this.replayData = replay;
    this.replay = new Playback(replay);
    this.sim = this.replay.sim;
    this.mode = "replay";
    this.replayPaused = false;
    this.replaySpeed = 1;
    this.replayError = "";
    this.ghostPositions = [];
    if (this.input) {
      this.input.clear();
      this.input.active = true;
    }
    this.clock.reset(performance.now());
    this.scene?.dungeonView.reset();
    this.ui.replay();
  }
}
