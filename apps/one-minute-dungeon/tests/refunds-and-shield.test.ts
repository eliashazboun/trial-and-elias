import { describe, it, expect } from "vitest";
import { C } from "../src/game/config";
import { Simulation, createEnemy } from "../src/game/systems/Simulation";
import {
  remainingTicks,
  rankedTicks,
  enemiesRemaining,
} from "../src/game/systems/TimerSystem";
import { EMPTY_INPUT } from "../src/game/types";
import { START, EXIT } from "../src/game/maps/dungeon01";
const fresh = () =>
  new Simulation({
    seed: C.standardSeed,
    category: "fixed",
    challenge: "standard",
  });
function take(sim: Simulation, id: number, tick: number): void {
  sim.state.tick = tick - 1;
  const diamond = sim.state.loot[id]!;
  sim.state.player.x = diamond.x;
  sim.state.player.y = diamond.y;
  sim.step(EMPTY_INPUT);
}
function quiet() {
  const s = fresh();
  s.state.enemies = [];
  return s;
}
describe("six one-time diamonds and rolling refunds", () => {
  it("starts with six, collects once, never respawns, and restores on a fresh run", () => {
    const s = quiet();
    expect(s.state.loot).toHaveLength(6);
    take(s, 0, 600);
    for (let i = 0; i < 100; i++) s.step(EMPTY_INPUT);
    expect(s.state.lootCount).toBe(1);
    expect(s.state.refundTicks).toBe(120);
    expect(s.state.loot[0]!.collected).toBe(true);
    expect(fresh().state.loot.every((d) => !d.collected)).toBe(true);
  });
  it("refunds one second without moving the actual clock backward", () => {
    const s = quiet();
    take(s, 0, 1200);
    expect(s.state.tick).toBe(1200);
    expect(s.state.refundTicks).toBe(120);
    expect(rankedTicks(s.state)).toBe(1080);
    expect(remainingTicks(s.state)).toBe(6120);
  });
  it("chains all six at exact five-second boundaries for 21 seconds", () => {
    const s = quiet();
    for (let i = 0; i < 6; i++) {
      take(s, i, 600 + i * 600);
      expect(s.state.combo).toBe(i + 1);
      expect(s.state.diamondEvents[i]!.nominalTicks).toBe((i + 1) * 120);
    }
    expect(s.state.refundTicks).toBe(2520);
    expect(s.state.maxCombo).toBe(6);
  });
  it("measures each window from the previous pickup, independent of refunds", () => {
    const s = quiet();
    take(s, 0, 600);
    take(s, 1, 1200);
    take(s, 2, 1800);
    expect(s.state.combo).toBe(3);
    expect(s.state.lastDiamondTick).toBe(1800);
    expect(s.state.refundTicks).toBe(720);
  });
  it("resets after 601 ticks and preserves the peak combo", () => {
    const s = quiet();
    take(s, 0, 600);
    take(s, 1, 1200);
    take(s, 2, 1801);
    expect(s.state.combo).toBe(1);
    expect(s.state.maxCombo).toBe(2);
    expect(s.state.refundTicks).toBe(480);
  });
  it("expires visually after five seconds without waiting for another pickup", () => {
    const s = quiet();
    take(s, 0, 600);
    Object.assign(s.state.player, START);
    for (let i = 0; i < 600; i++) s.step(EMPTY_INPUT);
    expect(s.state.combo).toBe(1);
    s.step(EMPTY_INPUT);
    expect(s.state.combo).toBe(0);
  });
  it("caps refunds at spent time and discards overflow instead of banking it", () => {
    const s = quiet();
    take(s, 0, 60);
    expect(s.state.tick).toBe(60);
    expect(s.state.refundTicks).toBe(60);
    expect(rankedTicks(s.state)).toBe(0);
    expect(remainingTicks(s.state)).toBe(7200);
    Object.assign(s.state.player, START);
    s.step(EMPTY_INPUT);
    expect(remainingTicks(s.state)).toBe(7199);
    take(s, 1, 120);
    expect(s.state.diamondEvents[1]!.nominalTicks).toBe(240);
    expect(s.state.diamondEvents[1]!.appliedTicks).toBe(60);
    expect(s.state.refundTicks).toBe(120);
    expect(remainingTicks(s.state)).toBe(7200);
  });
  it("does not change combos or clocks when no simulation steps occur", () => {
    const s = quiet();
    take(s, 0, 600);
    const hash = s.hash();
    for (let i = 0; i < 20; i++) remainingTicks(s.state);
    expect(s.hash()).toBe(hash);
  });
  it("records actual, refund and ranked split timestamps with diamond progress", () => {
    const s = quiet();
    take(s, 0, 600);
    s.split("test");
    expect(s.state.splits.at(-1)).toEqual({
      id: "test",
      tick: 600,
      refundTicks: 120,
      rankedTicks: 480,
      diamondRoute: "0:1:120",
    });
  });
});
describe("strict effective deadline", () => {
  it("allows active simulation beyond sixty actual seconds after refunds", () => {
    const s = quiet();
    s.state.tick = 7200;
    s.state.refundTicks = 120;
    s.step(EMPTY_INPUT);
    expect(s.state.tick).toBe(7201);
    expect(s.state.status).toBe("running");
    expect(remainingTicks(s.state)).toBe(119);
  });
  it("a pickup on an expired tick cannot save the player", () => {
    const s = quiet();
    s.state.tick = 7199;
    Object.assign(s.state.player, {
      x: s.state.loot[0]!.x,
      y: s.state.loot[0]!.y,
    });
    s.step(EMPTY_INPUT);
    expect(s.state.status).toBe("dead");
    expect(s.state.lootCount).toBe(0);
    expect(s.state.refundTicks).toBe(0);
  });
  it.each([9718, 9719])(
    "resolves extended exit at tick %s before or at the effective deadline",
    (tick) => {
      const s = quiet();
      s.state.tick = tick;
      s.state.refundTicks = 2520;
      s.state.hasKey = true;
      s.state.switches = [true, true, true];
      Object.assign(s.state.player, EXIT);
      s.step(EMPTY_INPUT);
      expect(s.state.status).toBe(tick === 9718 ? "won" : "dead");
    },
  );
});
describe("guardian protection", () => {
  function setup() {
    const s = fresh();
    s.state.tick = 100;
    const p = s.state.player;
    const boss = createEnemy(4, "guardian", { x: p.x + 32, y: p.y });
    boss.phase = "recovery";
    boss.until = 1000;
    const mob = createEnemy(0, "skeleton", { x: p.x + 150, y: p.y });
    s.state.enemies = [mob, boss];
    return { s, boss, mob };
  }
  it("counts only living non-boss enemies; diamonds and objectives do not release protection", () => {
    const { s, boss } = setup();
    s.state.hasKey = true;
    s.state.switches = [true, true, true];
    s.state.loot.forEach((d) => (d.collected = true));
    s.state.lootCount = 6;
    s.step(EMPTY_INPUT);
    expect(s.state.bossShielded).toBe(true);
    expect(enemiesRemaining(s.state)).toBe(1);
    boss.hp = 0;
    expect(enemiesRemaining(s.state)).toBe(1);
  });
  it("a valid sword hit instantly kills without damaging the shielded boss", () => {
    const { s, boss } = setup();
    s.step({ ...EMPTY_INPUT, attack: true, aim: 0 });
    expect(s.state.status).toBe("dead");
    expect(s.state.cause).toBe("Struck the shielded guardian.");
    expect(boss.hp).toBe(4);
  });
  it("bypasses active dash invulnerability", () => {
    const { s, boss } = setup();
    s.state.player.dashAt = 97;
    expect(s.invulnerable).toBe(false);
    s.step({ ...EMPTY_INPUT, attack: true, aim: 0 });
    expect(s.invulnerable).toBe(true);
    expect(s.state.status).toBe("dead");
    expect(boss.hp).toBe(4);
  });
  it("missed swings and ordinary boss contact are safe", () => {
    const { s, boss } = setup();
    s.step({ ...EMPTY_INPUT, attack: true, aim: Math.PI });
    expect(s.state.status).toBe("running");
    s.state.player.x = boss.x;
    s.state.player.y = boss.y;
    s.state.player.attackAt = -1000;
    s.step(EMPTY_INPUT);
    expect(s.state.status).toBe("running");
  });
  it("cannot strike a protected boss through a wall", () => {
    const { s, boss } = setup();
    s.state.player.x = 16 * 24 + 16;
    s.state.player.y = 35 * 24 + 12;
    boss.x = 18 * 24;
    boss.y = s.state.player.y;
    s.step({ ...EMPTY_INPUT, attack: true, aim: 0 });
    expect(s.state.status).toBe("running");
    expect(boss.hp).toBe(4);
  });
  it.each([false, true])(
    "same-tick last-mob and boss hit is fatal regardless of enemy order %s",
    (reverse) => {
      const { s, boss, mob } = setup();
      mob.x = s.state.player.x + 28;
      mob.y = s.state.player.y;
      if (reverse) s.state.enemies.reverse();
      s.step({ ...EMPTY_INPUT, attack: true, aim: 0 });
      expect(s.state.status).toBe("dead");
      expect(boss.hp).toBe(4);
      expect(mob.hp).toBe(1);
    },
  );
  it("releases once after the last mob dies and permits normal boss damage", () => {
    const { s, boss, mob } = setup();
    mob.x = s.state.player.x + 30;
    boss.x = s.state.player.x + 120;
    s.step({ ...EMPTY_INPUT, attack: true, aim: 0 });
    expect(mob.hp).toBe(0);
    expect(s.state.bossShielded).toBe(false);
    expect(
      s.events.filter((e) => e.type === "guardian-vulnerable"),
    ).toHaveLength(1);
    s.state.player.x = boss.x - 32;
    s.state.player.attackReady = 0;
    s.step({ ...EMPTY_INPUT, attack: true, aim: 0 });
    expect(boss.hp).toBe(3);
    expect(s.state.status).toBe("running");
    expect(s.events.some((e) => e.type === "guardian-vulnerable")).toBe(false);
  });
});
