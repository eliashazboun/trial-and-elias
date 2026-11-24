import { StorageManager, validReplay } from "../src/storage/StorageManager";
import { recordKey } from "../src/storage/schemas";
import { makeRecord } from "../src/game/systems/RunManager";
import { it, expect } from "vitest";
import { solve } from "./routePilot";
import { verifyReplay } from "../src/game/systems/ReplaySystem";
import { Playback } from "../src/game/systems/ReplaySystem";
import { FixedClock } from "../src/game/systems/FixedClock";
import { C } from "../src/game/config";
it("completes the sole fixed-seed dungeon without collecting diamonds", () => {
  const { sim, recorder } = solve();
  expect(sim.state.status, sim.state.cause).toBe("won");
  expect(sim.state.lootCount).toBe(0);
  expect(sim.state.kills).toBe(sim.state.enemies.length);
  expect(verifyReplay(recorder.finish(sim)).error).toBe("");
});
it("checks diamond routes and an actual run beyond sixty seconds", () => {
  const base = solve();
  let improved = false;
  for (const diamonds of [true, [0], [1], [2], [0, 1, 2], [1, 2]] as (
    | boolean
    | number[]
  )[]) {
    const { sim, recorder } = solve(C.standardSeed, diamonds);
    expect(sim.state.status, sim.state.cause).toBe("won");
    expect(verifyReplay(recorder.finish(sim)).error).toBe("");
    if (sim.state.tick - sim.state.refundTicks < base.sim.state.tick)
      improved = true;
  }
  expect(improved).toBe(true);
  const extended = solve(C.standardSeed, true, 18 * C.hz);
  expect(extended.sim.state.status, extended.sim.state.cause).toBe("won");
  expect(extended.sim.state.tick).toBeGreaterThan(C.deadline);
  const extendedReplay = extended.recorder.finish(extended.sim);
  expect(validReplay(extendedReplay)).toBe(true);
  let saved: string | null = null;
  const memory = {
    getItem: () => saved,
    setItem: (_key: string, value: string) => {
      saved = value;
    },
    removeItem: () => {
      saved = null;
    },
  };
  const store = new StorageManager(memory);
  expect(store.commit(makeRecord(extended.sim), extendedReplay).pb).toBe(true);
  const loaded = new StorageManager(memory);
  expect(loaded.best()?.ticks).toBe(extended.sim.state.tick);
  expect(
    loaded.data.replays[recordKey("fixed", "standard")]?.ticks,
  ).toBeGreaterThan(C.deadline);

  expect(verifyReplay(extended.recorder.finish(extended.sim)).error).toBe("");
});
it("records and replays a real protected-guardian death", () => {
  const { sim, recorder } = solve(C.standardSeed, false, 0, true);
  expect(sim.state.status).toBe("dead");
  expect(sim.state.cause).toBe("Struck the shielded guardian.");
  expect(verifyReplay(recorder.finish(sim)).error).toBe("");
});
it("full winning replay remains identical under 60, 120 and 144 Hz render schedules", () => {
  const { sim, recorder } = solve(C.standardSeed, true, 18 * C.hz);
  const replay = recorder.finish(sim);
  const hashes = [60, 120, 144].map((hz) => {
    const playback = new Playback(replay),
      clock = new FixedClock();
    clock.reset(1);
    for (
      let frame = 1;
      playback.sim.state.tick < replay.ticks &&
      frame < hz * (C.maxRunTicks / C.hz + 1);
      frame++
    )
      clock.advance(
        1 + (frame * 1000) / hz,
        () => playback.step(),
        () => {},
      );
    expect(playback.error).toBe("");
    expect(playback.sim.state.status).toBe("won");
    return playback.sim.hash();
  });
  expect(new Set(hashes).size).toBe(1);
});
