import { C } from "../config";
import {
  ENEMY_SPOTS,
  EXIT,
  HEIGHT,
  KEY_SPOTS,
  LOOT_SPOTS,
  LOOT_ALTERNATES,
  START,
  SWITCHES,
  TRAPS,
  WIDTH,
  at,
  insideRect,
  tileAt,
  WEAPON_SPOTS,
  GUARDIAN,
} from "./dungeon01";

/** Curated spawn points are accepted only if a hazard-free route exists in the authored map. */
export function validateDungeon(): string[] {
  const errors: string[] = [],
    seen = new Set<number>(),
    queue = [
      Math.floor(START.y / C.tile) * WIDTH + Math.floor(START.x / C.tile),
    ];
  seen.add(queue[0]!);
  for (let i = 0; i < queue.length; i++) {
    const n = queue[i]!;
    for (const k of [n - WIDTH, n + 1, n + WIDTH, n - 1]) {
      if (k < 0 || k >= WIDTH * HEIGHT || seen.has(k)) continue;
      const x = k % WIDTH,
        y = Math.floor(k / WIDTH),
        p = at(x, y);
      if (!tileAt(x, y) || TRAPS.some((t) => insideRect(p, t, 7))) continue;
      // Closed hidden passages are optional; standard routes must work without them.
      if ((x === 18 && y === 11) || (x === 23 && y === 15)) continue;
      seen.add(k);
      queue.push(k);
    }
  }
  for (const p of [
    ...KEY_SPOTS,
    ...SWITCHES,
    ...LOOT_SPOTS,
    ...LOOT_ALTERNATES,
    ...WEAPON_SPOTS,
    EXIT,
    GUARDIAN,
    ...ENEMY_SPOTS,
  ]) {
    const index = Math.floor(p.y / C.tile) * WIDTH + Math.floor(p.x / C.tile);
    if (!seen.has(index))
      errors.push(`Unreachable curated spawn/objective at ${p.x},${p.y}`);
  }
  return errors;
}
let validated = false;
export function assertDungeon(): void {
  if (validated) return;
  const errors = validateDungeon();
  if (errors.length) throw Error(errors.join("; "));
  validated = true;
}
