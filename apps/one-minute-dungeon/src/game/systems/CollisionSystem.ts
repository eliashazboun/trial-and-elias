import { C } from "../config";
import { SECRETS, tileAt } from "../maps/dungeon01";
import type { Vec } from "../types";
export function isSolid(
  tx: number,
  ty: number,
  secrets: readonly string[] = [],
): boolean {
  return (
    (tx === 51 && ty >= 36 && ty <= 38 && !secrets.includes("gate-open")) ||
    tileAt(tx, ty) === 0 ||
    SECRETS.some((s) => s.tx === tx && s.ty === ty && !secrets.includes(s.id))
  );
}
export function collides(
  x: number,
  y: number,
  radius: number,
  secrets: readonly string[] = [],
): boolean {
  for (
    let ty = Math.floor((y - radius) / C.tile);
    ty <= Math.floor((y + radius) / C.tile);
    ty++
  ) {
    for (
      let tx = Math.floor((x - radius) / C.tile);
      tx <= Math.floor((x + radius) / C.tile);
      tx++
    ) {
      if (!isSolid(tx, ty, secrets)) continue;
      const nearX = Math.max(tx * C.tile, Math.min(x, (tx + 1) * C.tile));
      const nearY = Math.max(ty * C.tile, Math.min(y, (ty + 1) * C.tile));
      if ((x - nearX) ** 2 + (y - nearY) ** 2 < radius ** 2) return true;
    }
  }
  return false;
}
export function move(
  body: Vec,
  dx: number,
  dy: number,
  radius: number,
  secrets: readonly string[],
): void {
  // Substeps prevent tunneling, even with charges and future tuning changes.
  const count = Math.max(
    1,
    Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 3),
  );
  for (let i = 0; i < count; i++) {
    if (!collides(body.x + dx / count, body.y, radius, secrets))
      body.x += dx / count;
    if (!collides(body.x, body.y + dy / count, radius, secrets))
      body.y += dy / count;
  }
}
export function lineClear(a: Vec, b: Vec, secrets: readonly string[]): boolean {
  const d = Math.hypot(b.x - a.x, b.y - a.y),
    n = Math.max(1, Math.ceil(d / 5));
  for (let i = 0; i <= n; i++)
    if (
      isSolid(
        Math.floor((a.x + ((b.x - a.x) * i) / n) / C.tile),
        Math.floor((a.y + ((b.y - a.y) * i) / n) / C.tile),
        secrets,
      )
    )
      return false;
  return true;
}
export function distance(a: Vec, b: Vec): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
export function angleDifference(a: number, b: number): number {
  return Math.atan2(Math.sin(a - b), Math.cos(a - b));
}
