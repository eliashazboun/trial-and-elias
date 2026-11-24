import { C } from "../config";
import type { Vec } from "../types";
export const WIDTH = 59,
  HEIGHT = 45;
export interface Room {
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color: number;
  landmark: string;
}
export const ROOMS: Room[] = [
  {
    name: "Entrance Chamber",
    x: 2,
    y: 31,
    w: 15,
    h: 12,
    color: 0x273747,
    landmark: "entrance",
  },
  {
    name: "Hall of Blades",
    x: 2,
    y: 17,
    w: 15,
    h: 11,
    color: 0x393747,
    landmark: "blades",
  },
  {
    name: "Skeleton Gallery",
    x: 2,
    y: 2,
    w: 15,
    h: 12,
    color: 0x303849,
    landmark: "bones",
  },
  {
    name: "Forgotten Library",
    x: 21,
    y: 2,
    w: 15,
    h: 12,
    color: 0x263e43,
    landmark: "books",
  },
  {
    name: "Cursed Armory",
    x: 40,
    y: 2,
    w: 16,
    h: 12,
    color: 0x3b3045,
    landmark: "armory",
  },
  {
    name: "Collapsed Passage",
    x: 21,
    y: 17,
    w: 15,
    h: 11,
    color: 0x363b40,
    landmark: "ruins",
  },
  {
    name: "Ritual Chamber",
    x: 40,
    y: 17,
    w: 16,
    h: 11,
    color: 0x3c2940,
    landmark: "ritual",
  },
  {
    name: "Crypt Junction",
    x: 21,
    y: 31,
    w: 15,
    h: 12,
    color: 0x273747,
    landmark: "junction",
  },
  {
    name: "Gate Antechamber",
    x: 40,
    y: 31,
    w: 10,
    h: 12,
    color: 0x383c39,
    landmark: "antechamber",
  },
  {
    name: "Escape Gate",
    x: 52,
    y: 34,
    w: 5,
    h: 6,
    color: 0x38463d,
    landmark: "gate",
  },
];
export function at(x: number, y: number): Vec {
  return { x: x * C.tile + C.tile / 2, y: y * C.tile + C.tile / 2 };
}
const tiles = new Uint8Array(WIDTH * HEIGHT);
function carve(x: number, y: number, w: number, h: number): void {
  for (let j = y; j < y + h; j++)
    for (let i = x; i < x + w; i++) tiles[j * WIDTH + i] = 1;
}
for (const room of ROOMS) carve(room.x, room.y, room.w, room.h);
// Authored corridors, with loops connecting all three columns and rows.
for (const y of [7, 21, 36]) {
  carve(17, y, 4, 3);
  carve(36, y, 4, 3);
}
for (const x of [8, 27, 47]) {
  carve(x, 14, 3, 3);
  carve(x, 28, 3, 3);
}
carve(50, 36, 2, 3);
// Two permanent, discoverable passages; the middle tile is a breakable obstruction.
carve(17, 11, 4, 1);
carve(23, 14, 1, 3);
// Stone pillars with visible, matching collisions.
for (const [x, y] of [
  [5, 20],
  [13, 24],
  [24, 5],
  [32, 10],
  [43, 5],
  [52, 10],
  [43, 24],
  [53, 19],
  [24, 34],
  [32, 39],
])
  tiles[y! * WIDTH + x!] = 0;
export const FLOOR = tiles;
export const START = at(8, 37),
  EXIT = at(55, 37);
export const SWITCHES = [at(6, 5), at(30, 7), at(50, 23)];
export const KEY_SPOTS = [
  at(14, 10),
  at(25, 5),
  at(49, 7),
  at(24, 23),
  at(28, 36),
];
export const SECRETS = [
  { id: "cracked-wall", ...at(18, 11), tx: 18, ty: 11 },
  { id: "bookshelf", ...at(23, 15), tx: 23, ty: 15 },
];
export const LOOT_SPOTS = [
  at(4, 39),
  at(14, 4),
  at(33, 4),
  at(53, 6),
  at(23, 25),
  at(43, 39),
];
export const LOOT_ALTERNATES = [
  at(5, 39),
  at(14, 11),
  at(33, 11),
  at(53, 11),
  at(23, 19),
  at(43, 34),
];
export const WEAPON_SPOTS = [at(46, 9), at(32, 25)];
export const ENEMY_SPOTS = [at(12, 9), at(31, 10), at(44, 7), at(25, 21)];
export const GUARDIAN = at(48, 22);
export interface Trap extends Vec {
  kind: "spikes" | "blade" | "fire" | "pit" | "static";
  w: number;
  h: number;
  period: number;
  offset: number;
}
export const TRAPS: Trap[] = [
  { kind: "spikes", ...at(9, 20), w: 58, h: 18, period: 240, offset: 0 },
  { kind: "blade", ...at(10, 25), w: 72, h: 12, period: 300, offset: 75 },
  { kind: "fire", ...at(44, 20), w: 20, h: 66, period: 288, offset: 110 },
  { kind: "pit", ...at(28, 22), w: 48, h: 84, period: 1, offset: 0 },
  { kind: "static", ...at(33, 19), w: 24, h: 40, period: 1, offset: 0 },
];
export function tileAt(x: number, y: number): number {
  return x < 0 || y < 0 || x >= WIDTH || y >= HEIGHT
    ? 0
    : FLOOR[y * WIDTH + x]!;
}
export function trapPhase(
  trap: Trap,
  tick: number,
): "safe" | "warning" | "active" {
  if (trap.kind === "pit" || trap.kind === "static") return "active";
  const phase = (tick + trap.offset) % trap.period;
  return phase >= trap.period * 0.6
    ? "active"
    : phase >= trap.period * 0.42
      ? "warning"
      : "safe";
}
export function insideRect(
  p: Vec,
  r: Vec & { w: number; h: number },
  radius = 0,
): boolean {
  return (
    Math.abs(p.x - r.x) < r.w / 2 + radius &&
    Math.abs(p.y - r.y) < r.h / 2 + radius
  );
}
export function roomAt(p: Vec): Room | undefined {
  return ROOMS.find(
    (r) =>
      p.x >= r.x * C.tile &&
      p.x < (r.x + r.w) * C.tile &&
      p.y >= r.y * C.tile &&
      p.y < (r.y + r.h) * C.tile,
  );
}
