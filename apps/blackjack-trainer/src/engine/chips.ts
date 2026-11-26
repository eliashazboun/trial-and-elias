import { denominations } from "./types";
export interface NormalizedStack {
  chips: number[];
  counts: { denomination: number; count: number }[];
  totalChips: number;
  halfChip: boolean;
  units: number;
}
/** Exact grouped breakdown plus a bounded preview; never writes financial state. */
export function normalizeChips(units: number): NormalizedStack {
  if (!Number.isSafeInteger(units) || units < 0)
    throw Error("Invalid half-chip amount");
  let whole = Math.floor(units / 2),
    totalChips = 0;
  const chips: number[] = [],
    counts: NormalizedStack["counts"] = [];
  for (const value of [...denominations].reverse()) {
    const count = Math.floor(whole / value);
    if (count) counts.push({ denomination: value, count });
    totalChips += count;
    for (let i = 0; i < Math.min(count, Math.max(0, 256 - chips.length)); i++)
      chips.push(value);
    whole %= value;
  }
  return { chips, counts, totalChips, halfChip: units % 2 === 1, units };
}
export const chipColors: Record<number, string> = {
  1: "#eee8d9",
  5: "#b73542",
  25: "#267f5b",
  100: "#202733",
  500: "#784899",
  1000: "#e5842f",
  5000: "#dc7ca7",
};
