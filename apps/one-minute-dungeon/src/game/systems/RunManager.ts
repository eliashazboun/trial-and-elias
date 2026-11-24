import { C, VERSION } from "../config";
import type { RunRecord, Split } from "../types";
import type { Simulation } from "./Simulation";
export function currentRecord(
  record: Pick<RunRecord, "game" | "map" | "rules" | "options">,
): boolean {
  return (
    record.game === VERSION.game &&
    record.map === VERSION.map &&
    record.rules === VERSION.rules &&
    record.options.category === "fixed" &&
    record.options.challenge === "standard" &&
    record.options.seed === C.standardSeed
  );
}
export function comparableSplits(
  a: Split[],
  b: Split[],
  index: number,
): boolean {
  return (
    a.length > index &&
    b.length > index &&
    a
      .slice(0, index + 1)
      .every(
        (split, i) =>
          split.id === b[i]!.id && split.diamondRoute === b[i]!.diamondRoute,
      )
  );
}
export function makeRecord(
  sim: Simulation,
  cause = sim.state.cause,
): RunRecord {
  const s = sim.state;
  return {
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
    options: { ...sim.options },
    game: VERSION.game,
    map: VERSION.map,
    rules: VERSION.rules,
    ticks: s.tick,
    refundTicks: s.refundTicks,
    rankedTicks: s.tick - s.refundTicks,
    maxCombo: s.maxCombo,
    won: s.status === "won",
    valid: s.valid,
    reasons: [...s.invalidReasons],
    cause,
    splits: s.splits.map((x) => ({ ...x })),
    kills: s.kills,
    loot: s.lootCount,
    secrets: s.secrets.filter((id) => id !== "gate-open"),
    dashDodges: s.dashDodges,
    usedWeapon: s.usedWeapon,
  };
}
