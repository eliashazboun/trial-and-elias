import { C, VERSION } from "../config";
import type { InputFrame, Replay, RunOptions, Vec } from "../types";
import { quantizeInput, Simulation } from "./Simulation";
export function pack(input: InputFrame): number[] {
  const i = quantizeInput(input);
  return [
    i.mx,
    i.my,
    Math.round(i.aim * 4096),
    (i.attack ? 1 : 0) | (i.dash ? 2 : 0) | (i.interact ? 4 : 0),
  ];
}
export function unpack(frame: readonly number[]): InputFrame {
  return {
    mx: frame[0]!,
    my: frame[1]!,
    aim: frame[2]! / 4096,
    attack: !!(frame[3]! & 1),
    dash: !!(frame[3]! & 2),
    interact: !!(frame[3]! & 4),
  };
}
export class Recorder {
  frames: number[][] = [];
  checkpoints: Replay["checkpoints"] = [];
  record(input: InputFrame, sim: Simulation): void {
    const frame = pack(input),
      last = this.frames[this.frames.length - 1];
    // Run-length input events: [tick, x, y, aim, bits].
    if (!last || frame.some((value, index) => value !== last[index + 1]))
      this.frames.push([sim.state.tick, ...frame]);
    if (sim.state.tick % 120 === 0)
      this.checkpoints.push({ tick: sim.state.tick, hash: sim.hash() });
  }
  finish(sim: Simulation): Replay {
    return {
      format: VERSION.replay,
      ...VERSION,
      hz: C.hz,
      options: { ...sim.options },
      frames: this.frames,
      checkpoints: this.checkpoints,
      ticks: sim.state.tick,
      refundTicks: sim.state.refundTicks,
      rankedTicks: sim.state.tick - sim.state.refundTicks,
      maxCombo: sim.state.maxCombo,
      splits: sim.state.splits.map((s) => ({ ...s })),
      finalHash: sim.hash(),
    };
  }
}
export function compatibility(replay: Replay): string | null {
  if (
    replay.format !== VERSION.replay ||
    replay.game !== VERSION.game ||
    replay.map !== VERSION.map ||
    replay.rules !== VERSION.rules ||
    replay.hz !== C.hz
  )
    return "This replay belongs to a different game, map or ruleset version.";
  if (
    replay.options.category !== "fixed" ||
    replay.options.challenge !== "standard" ||
    !Number.isInteger(replay.options.seed) ||
    replay.options.seed < 0 ||
    replay.options.seed > 4294967295
  )
    return "This replay uses an unsupported game mode or invalid seed.";
  return null;
}
export class Playback {
  readonly sim: Simulation;
  index = 0;
  checkpointIndex = 0;
  error = "";
  constructor(readonly replay: Replay) {
    this.error = compatibility(replay) ?? "";
    this.sim = new Simulation(
      this.error
        ? { seed: C.standardSeed, category: "fixed", challenge: "standard" }
        : replay.options,
    );
  }
  step(): void {
    if (this.error || this.sim.state.tick >= this.replay.ticks) return;
    const nextTick = this.sim.state.tick + 1;
    while (
      this.index + 1 < this.replay.frames.length &&
      this.replay.frames[this.index + 1]![0]! <= nextTick
    )
      this.index++;
    const frame = this.replay.frames[this.index];
    if (!frame || frame[0]! > nextTick) {
      this.error = "Replay is missing input data.";
      return;
    }
    this.sim.step(unpack(frame.slice(1)));
    const checkpoint = this.replay.checkpoints[this.checkpointIndex];
    if (checkpoint && checkpoint.tick === this.sim.state.tick) {
      if (checkpoint.hash !== this.sim.hash())
        this.error = `Replay diverged at tick ${checkpoint.tick}. Saved data may be corrupted.`;
      this.checkpointIndex++;
    }
    if (
      this.sim.state.tick === this.replay.ticks &&
      (this.sim.hash() !== this.replay.finalHash ||
        JSON.stringify(this.sim.state.splits) !==
          JSON.stringify(this.replay.splits) ||
        this.sim.state.refundTicks !== this.replay.refundTicks ||
        this.sim.state.tick - this.sim.state.refundTicks !==
          this.replay.rankedTicks ||
        this.sim.state.maxCombo !== this.replay.maxCombo)
    )
      this.error = "Replay final outcome does not match its recording.";
    if (
      this.sim.state.status !== "running" &&
      this.sim.state.tick < this.replay.ticks
    )
      this.error = "Replay ended before its recorded finish.";
  }
}
export function verifyReplay(replay: Replay): {
  error: string;
  positions: Vec[];
} {
  const incompatible = compatibility(replay);
  if (incompatible) return { error: incompatible, positions: [] };
  const playback = new Playback(replay),
    positions: Vec[] = [
      { x: playback.sim.state.player.x, y: playback.sim.state.player.y },
    ];
  if (
    !Number.isInteger(replay.ticks) ||
    replay.ticks < 1 ||
    replay.ticks > C.maxRunTicks
  )
    return { error: "Invalid replay duration.", positions: [] };
  while (!playback.error && playback.sim.state.tick < replay.ticks) {
    const before = playback.sim.state.tick;
    playback.step();
    positions.push({
      x: playback.sim.state.player.x,
      y: playback.sim.state.player.y,
    });
    if (playback.sim.state.tick === before) break;
  }
  return { error: playback.error, positions };
}
export function sameRun(a: RunOptions, b: RunOptions): boolean {
  return (
    a.category === b.category &&
    a.challenge === b.challenge &&
    a.seed === b.seed
  );
}
