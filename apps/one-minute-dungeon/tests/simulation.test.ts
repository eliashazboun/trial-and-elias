import { describe, it, expect } from "vitest";
import { C, VERSION } from "../src/game/config";
import { Simulation, createEnemy } from "../src/game/systems/Simulation";
import { FixedClock } from "../src/game/systems/FixedClock";
import { collides, lineClear } from "../src/game/systems/CollisionSystem";
import {
  Recorder,
  Playback,
  verifyReplay,
} from "../src/game/systems/ReplaySystem";
import { EMPTY_INPUT } from "../src/game/types";
import {
  EXIT,
  KEY_SPOTS,
  START,
  SWITCHES,
  SECRETS,
  at,
  trapPhase,
  TRAPS,
} from "../src/game/maps/dungeon01";
const fresh = () =>
  new Simulation({
    seed: C.standardSeed,
    category: "fixed",
    challenge: "standard",
  });
const step = (sim: Simulation, n: number, input = EMPTY_INPUT) => {
  for (let i = 0; i < n; i++) sim.step(input);
};
describe("movement and combat", () => {
  it("normalizes diagonal movement", () => {
    const a = fresh(),
      b = fresh();
    step(a, 20, { ...EMPTY_INPUT, mx: 1 });
    step(b, 20, { ...EMPTY_INPUT, mx: 1, my: 1 });
    expect(
      Math.hypot(a.state.player.x - START.x, a.state.player.y - START.y),
    ).toBeCloseTo(
      Math.hypot(b.state.player.x - START.x, b.state.player.y - START.y),
      3,
    );
  });
  it("dashes in last facing, honors cooldown and exact invulnerability ticks", () => {
    const s = fresh();
    s.step({ ...EMPTY_INPUT, mx: 1 });
    s.step({ ...EMPTY_INPUT, dash: true });
    expect(s.state.player.dashX).toBe(1);
    const start = s.state.player.dashAt;
    for (let i = 0; i < 90; i++) {
      const age = s.state.tick - start;
      expect(s.invulnerable).toBe(age >= 4 && age < 13);
      s.step({ ...EMPTY_INPUT, dash: true });
      if (s.state.tick < start + 90) expect(s.state.player.dashAt).toBe(start);
    }
    expect(s.state.player.dashAt).toBe(start + 90);
  });
  it("does not tunnel through a wall while dashing", () => {
    const s = fresh();
    s.state.player.x = 2 * C.tile + 7;
    s.step({ ...EMPTY_INPUT, mx: -1, dash: true });
    step(s, 30, { ...EMPTY_INPUT, mx: -1 });
    expect(s.state.player.x).toBeGreaterThanOrEqual(2 * C.tile + C.radius);
    expect(collides(s.state.player.x, s.state.player.y, C.radius)).toBe(false);
  });
  it("kills in one valid hit, but only absorbs damage inside the dash window", () => {
    const s = fresh();
    s.step({ ...EMPTY_INPUT, dash: true });
    step(s, 4);
    s.damage("test");
    expect(s.state.status).toBe("running");
    step(s, 10);
    s.damage("test");
    expect(s.state.status).toBe("dead");
  });
  it("does not deal contact damage", () => {
    const s = fresh();
    s.state.enemies = [createEnemy(0, "skeleton", s.state.player)];
    s.step(EMPTY_INPUT);
    expect(s.state.status).toBe("running");
  });
  it("damages each target once per sword swing and respects its arc", () => {
    const s = fresh(),
      p = s.state.player;
    s.state.enemies = [
      createEnemy(0, "hound", { x: p.x + 30, y: p.y }),
      createEnemy(1, "skeleton", { x: p.x - 30, y: p.y }),
    ];
    s.step({ ...EMPTY_INPUT, attack: true, aim: 0 });
    expect(s.state.enemies[0]!.hp).toBe(1);
    step(s, 10);
    expect(s.state.enemies[0]!.hp).toBe(1);
    expect(s.state.enemies[1]!.hp).toBe(1);
  });
  it("does not attack through walls", () => {
    const s = fresh();
    s.state.player.x = 16 * 24 + 16;
    s.state.player.y = 35 * 24 + 12;
    s.state.enemies = [
      createEnemy(0, "skeleton", { x: 18 * 24, y: s.state.player.y }),
    ];
    s.step({ ...EMPTY_INPUT, attack: true });
    expect(s.state.enemies[0]!.hp).toBe(1);
    expect(lineClear(s.state.player, s.state.enemies[0]!, [])).toBe(false);
  });
  it("allows deterministic shortcut discovery with a sword", () => {
    const s = fresh();
    s.state.player.x = SECRETS[0]!.x - 25;
    s.state.player.y = SECRETS[0]!.y;
    s.step({ ...EMPTY_INPUT, attack: true });
    expect(s.state.secrets).toContain("cracked-wall");
  });
});
describe("objectives, traps and deadline", () => {
  it("starts at exactly sixty seconds before any diamond pickups", () => {
    const s = fresh();
    expect(s.state.tick).toBe(0);
    step(s, 120);
    expect((C.deadline - s.state.tick) / C.hz).toBe(59);
  });
  it("requires all three explicit interactions and guardian defeat", () => {
    const s = fresh();
    s.state.player.x = SWITCHES[0]!.x;
    s.state.player.y = SWITCHES[0]!.y;
    s.step(EMPTY_INPUT);
    expect(s.state.switches[0]).toBe(false);
    s.step({ ...EMPTY_INPUT, interact: true });
    s.step({ ...EMPTY_INPUT, interact: true });
    expect(s.state.splits.filter((x) => x.id === "switch-1")).toHaveLength(1);
    s.state.player.x = SWITCHES[2]!.x;
    s.state.player.y = SWITCHES[2]!.y;
    s.step({ ...EMPTY_INPUT, interact: true });
    expect(s.state.switches[2]).toBe(false);
    expect(s.state.gateOpen).toBe(false);
  });
  it.each([7198, 7199])(
    "resolves the exit strictly before deadline starting at tick %s",
    (tick) => {
      const s = fresh();
      s.state.tick = tick;
      s.state.hasKey = true;
      s.state.switches = [true, true, true];
      s.state.enemies = [];
      Object.assign(s.state.player, EXIT);
      s.step(EMPTY_INPUT);
      expect(s.state.status).toBe(tick === 7198 ? "won" : "dead");
    },
  );
  it("closed gate has physical matching collision", () => {
    expect(collides(at(51, 37).x, at(51, 37).y, 6)).toBe(true);
    expect(collides(at(51, 37).x, at(51, 37).y, 6, ["gate-open"])).toBe(false);
  });
  it("each timed trap has predictable warning and lethal phases", () => {
    for (const trap of TRAPS.filter((t) => t.period > 1)) {
      const states = new Set(
        Array.from({ length: trap.period }, (_, tick) => trapPhase(trap, tick)),
      );
      expect(states.size).toBe(3);
      expect(trapPhase(trap, 0)).toBe(trapPhase(trap, trap.period));
    }
  });
});
describe("randomization, recording and rendering independence", () => {
  it("reproduces seeds and varies among all five curated key positions", () => {
    const spots = new Set<string>();
    for (let seed = 0; seed < 100; seed++) {
      const a = new Simulation({
          seed,
          category: "fixed",
          challenge: "standard",
        }),
        b = new Simulation({ seed, category: "fixed", challenge: "standard" });
      expect(a.hash()).toBe(b.hash());
      spots.add(JSON.stringify(a.state.key));
      for (const e of a.state.enemies)
        expect(collides(e.x, e.y, 7)).toBe(false);
    }
    expect(spots.size).toBe(KEY_SPOTS.length);
  });
  it("recorded inputs reproduce movement, enemies, objective events and hashes", () => {
    const s = fresh(),
      rec = new Recorder();
    for (let i = 0; i < 720; i++) {
      const input = {
        ...EMPTY_INPUT,
        mx: i < 80 ? 1 : 0,
        my: i >= 80 && i < 160 ? -1 : 0,
        attack: i % 40 === 0,
        dash: i % 120 === 0,
        aim: i / 720,
      };
      s.step(input);
      rec.record(input, s);
    }
    const r = rec.finish(s),
      result = verifyReplay(r);
    expect(result.error).toBe("");
    const play = new Playback(r);
    while (play.sim.state.tick < r.ticks) play.step();
    expect(play.sim.hash()).toBe(s.hash());
  });
  it("rejects incompatible or corrupted replays clearly", () => {
    const s = fresh(),
      rec = new Recorder();
    s.step(EMPTY_INPUT);
    rec.record(EMPTY_INPUT, s);
    const r = rec.finish(s);
    expect(verifyReplay({ ...r, game: "old" }).error).toContain("different");
    expect(verifyReplay({ ...r, finalHash: "corrupted" }).error).toContain(
      "outcome",
    );
    expect(r.format).toBe(VERSION.replay);
  });
  it("render rates of 60, 120 and 144 Hz produce identical authoritative outcomes", () => {
    const outcomes = [60, 120, 144].map((hz) => {
      const s = fresh(),
        clock = new FixedClock();
      clock.reset(1);
      for (let f = 1; f <= hz * 5; f++)
        clock.advance(
          1 + (f * 1000) / hz,
          () =>
            s.step({ ...EMPTY_INPUT, mx: s.state.tick < 100 ? 1 : 0, aim: 0 }),
          () => s.invalidate("stall"),
        );
      return s.hash();
    });
    expect(new Set(outcomes).size).toBe(1);
  });
  it("invalidates rather than catching up through a browser stall", () => {
    const s = fresh(),
      clock = new FixedClock();
    clock.reset(1);
    clock.advance(
      1001,
      () => s.step(EMPTY_INPUT),
      (reason) => s.invalidate(reason),
    );
    expect(s.state.tick).toBe(0);
    expect(s.state.valid).toBe(false);
  });
  it("ghost verification cannot mutate the live simulation", () => {
    const live = fresh(),
      s = fresh(),
      r = new Recorder();
    s.step(EMPTY_INPUT);
    r.record(EMPTY_INPUT, s);
    const before = live.hash();
    verifyReplay(r.finish(s));
    expect(live.hash()).toBe(before);
  });
});

it("cultists retreat during recovery to maintain distance without passing through walls", () => {
  const s = fresh();
  s.state.tick = 120;
  const p = s.state.player;
  const enemy = createEnemy(0, "cultist", { x: p.x + 45, y: p.y });
  enemy.phase = "recovery";
  enemy.until = 240;
  s.state.enemies = [enemy];
  s.step(EMPTY_INPUT);
  expect(enemy.x).toBeGreaterThan(p.x + 45);
  expect(collides(enemy.x, enemy.y, 7)).toBe(false);
});
