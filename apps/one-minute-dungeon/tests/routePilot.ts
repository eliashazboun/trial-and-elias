import { C, WEAPONS } from "../src/game/config";
import { Simulation } from "../src/game/systems/Simulation";
import { Recorder } from "../src/game/systems/ReplaySystem";
import {
  distance,
  isSolid,
  collides,
  lineClear,
} from "../src/game/systems/CollisionSystem";
import {
  WIDTH,
  HEIGHT,
  TRAPS,
  SWITCHES,
  EXIT,
  at,
  insideRect,
} from "../src/game/maps/dungeon01";
import { EMPTY_INPUT, type Vec, type InputFrame } from "../src/game/types";
function safe(p: Vec, sim: Simulation): boolean {
  return (
    !collides(p.x, p.y, 7, sim.state.secrets) &&
    !TRAPS.some((t) => insideRect(p, t, 10))
  );
}
function path(from: Vec, to: Vec, sim: Simulation): Vec[] {
  const start = Math.floor(from.y / 24) * WIDTH + Math.floor(from.x / 24),
    goal = Math.floor(to.y / 24) * WIDTH + Math.floor(to.x / 24);
  const parent = new Int32Array(WIDTH * HEIGHT).fill(-1),
    q = [start];
  parent[start] = start;
  for (let i = 0; i < q.length; i++) {
    const n = q[i]!;
    if (n === goal) break;
    for (const k of [n - WIDTH, n + 1, n + WIDTH, n - 1]) {
      if (k < 0 || k >= parent.length || parent[k] !== -1) continue;
      const x = k % WIDTH,
        y = Math.floor(k / WIDTH);
      if (isSolid(x, y, sim.state.secrets) || !safe(at(x, y), sim)) continue;
      parent[k] = n;
      q.push(k);
    }
  }
  if (parent[goal] === -1) return [];
  const result: Vec[] = [];
  let n = goal;
  while (n !== start) {
    result.push(at(n % WIDTH, Math.floor(n / WIDTH)));
    n = parent[n]!;
  }
  return result.reverse();
}
export function solve(
  seed: number = C.standardSeed,
  collect: boolean | number[] = false,
  waitTicks = 0,
  earlyBoss = false,
): { sim: Simulation; recorder: Recorder } {
  const sim = new Simulation({
      seed,
      category: "fixed",
      challenge: "standard",
    }),
    recorder = new Recorder();
  let targetIndex = 0,
    pathPoints: Vec[] = [],
    pathFor = -1;
  const loot = sim.state.loot.map((p) =>
    collect === true || (Array.isArray(collect) && collect.includes(p.id))
      ? p
      : undefined,
  );
  const guardianTarget = { x: 48 * 24 + 12, y: 22 * 24 + 12 };
  const hunt = earlyBoss ? [] : sim.state.enemies.slice(0, 4);
  const relic = (id: number) => (loot[id] ? [loot[id]!] : []);
  const targets = [
    ...relic(0),
    SWITCHES[0]!,
    ...relic(1),
    sim.state.key,
    ...relic(2),
    SWITCHES[1]!,
    ...hunt,
    ...relic(3),
    ...relic(4),
    at(34, 21),
    guardianTarget,
    SWITCHES[2]!,
    ...relic(5),
    EXIT,
  ];
  const guardianIndex = targets.indexOf(guardianTarget);
  for (
    let tick = 0;
    tick < C.maxRunTicks && sim.state.status === "running";
    tick++
  ) {
    if (tick < waitTicks) {
      sim.step(EMPTY_INPUT);
      recorder.record(EMPTY_INPUT, sim);
      continue;
    }
    const s = sim.state,
      p = s.player,
      guardian = s.enemies.find((e) => e.kind === "guardian")!;
    while (
      targetIndex < targets.length &&
      "hp" in targets[targetIndex]! &&
      Number((targets[targetIndex] as Vec & { hp: number }).hp) <= 0
    ) {
      targetIndex++;
      pathFor = -1;
    }
    if (targetIndex === guardianIndex && guardian.hp <= 0) {
      targetIndex++;
      pathFor = -1;
    }
    let target = targets[targetIndex] ?? EXIT;
    if (distance(p, target) < 15 && targetIndex !== guardianIndex) {
      targetIndex++;
      pathFor = -1;
      target = targets[targetIndex] ?? EXIT;
    }
    let input: InputFrame = { ...EMPTY_INPUT, interact: true };
    const nearby = s.enemies
      .filter(
        (e) => e.hp > 0 && distance(p, e) < 100 && lineClear(p, e, s.secrets),
      )
      .sort((a, b) => distance(p, a) - distance(p, b))[0];
    if (nearby) {
      const d = distance(p, nearby),
        a = Math.atan2(nearby.y - p.y, nearby.x - p.x);
      input.aim = a;
      input.attack = d < WEAPONS[p.weapon].range + 6 && s.tick >= p.attackReady;
      let direction = 0;
      if (nearby.kind === "guardian")
        direction =
          nearby.phase === "windup" || nearby.phase === "attack"
            ? d < 70
              ? -1
              : 0
            : d > 36
              ? 1
              : 0;
      else if (
        nearby.kind === "hound" &&
        (nearby.phase === "windup" || nearby.phase === "attack")
      ) {
        const aim = nearby.angle;
        const side = {
          x: Math.cos(aim + Math.PI / 2),
          y: Math.sin(aim + Math.PI / 2),
        };
        input.mx = Math.sign(side.x);
        input.my = Math.sign(side.y);
      } else direction = d > 33 ? 1 : 0;
      if (direction) {
        input.mx = Math.sign(Math.cos(a) * direction);
        input.my = Math.sign(Math.sin(a) * direction);
      }
      pathFor = -1;
    } else {
      if (pathFor !== targetIndex || !pathPoints.length) {
        pathPoints = path(p, target, sim);
        pathFor = targetIndex;
      }
      let point = pathPoints[0] ?? target;
      if (distance(p, point) < 2) {
        pathPoints.shift();
        point = pathPoints[0] ?? target;
      }
      input.mx = Math.abs(point.x - p.x) > 1 ? Math.sign(point.x - p.x) : 0;
      input.my = Math.abs(point.y - p.y) > 1 ? Math.sign(point.y - p.y) : 0;
    }
    // Sidestep committed bolts and charges without changing simulation state.
    const bolt = s.projectiles.find(
      (b) =>
        b.active &&
        distance(b, p) < 65 &&
        (p.x - b.x) * b.dx + (p.y - b.y) * b.dy > 0,
    );
    const charging = s.enemies.find(
      (e) =>
        e.hp > 0 &&
        e.kind === "hound" &&
        (e.phase === "windup" || e.phase === "attack") &&
        distance(e, p) < 150,
    );
    if (bolt || charging) {
      const dx = bolt?.dx ?? Math.cos(charging!.angle),
        dy = bolt?.dy ?? Math.sin(charging!.angle);
      const origin = bolt ?? charging!;
      const side = (p.x - origin.x) * -dy + (p.y - origin.y) * dx >= 0 ? 1 : -1;
      const length = Math.hypot(dx, dy) || 1,
        sx = (-dy / length) * side,
        sy = (dx / length) * side;
      const dangerLine =
        Math.abs((p.x - origin.x) * -dy + (p.y - origin.y) * dx) / length;
      if (dangerLine < 24) {
        input.mx = Math.abs(sx) > 0.2 ? Math.sign(sx) : 0;
        input.my = Math.abs(sy) > 0.2 ? Math.sign(sy) : 0;
        if (
          s.tick >= p.dashReady &&
          safe({ x: p.x + sx * 60, y: p.y + sy * 60 }, sim)
        )
          input.dash = true;
        pathFor = -1;
      }
    }
    // Never deliberately step into a lethal trap while using the combat policy.
    const len = Math.hypot(input.mx, input.my) || 1;
    if (
      !safe(
        { x: p.x + (input.mx / len) * 2, y: p.y + (input.my / len) * 2 },
        sim,
      )
    ) {
      input.mx = 0;
      input.my = 0;
      pathFor = -1;
    }
    sim.step(input);
    recorder.record(input, sim);
  }
  return { sim, recorder };
}
