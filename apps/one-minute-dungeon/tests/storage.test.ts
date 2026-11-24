import { Simulation } from "../src/game/systems/Simulation";
import { Recorder, verifyReplay } from "../src/game/systems/ReplaySystem";
import { EMPTY_INPUT } from "../src/game/types";
import { describe, it, expect } from "vitest";
import {
  StorageManager,
  STORAGE_KEY,
  validRecord,
  validReplay,
} from "../src/storage/StorageManager";
import { C, VERSION } from "../src/game/config";
import { defaults, recordKey } from "../src/storage/schemas";
import { comparableSplits } from "../src/game/systems/RunManager";
import type { RunRecord, Split } from "../src/game/types";
const split = (
  id: string,
  tick: number,
  refundTicks = 0,
  diamondRoute = "",
): Split => ({
  id,
  tick,
  refundTicks,
  rankedTicks: tick - refundTicks,
  diamondRoute,
});
const record = (overrides: Partial<RunRecord> = {}): RunRecord => {
  const ticks = overrides.ticks ?? 3600,
    refundTicks = overrides.refundTicks ?? 0;
  return {
    id: "test",
    date: new Date(0).toISOString(),
    options: { seed: C.standardSeed, category: "fixed", challenge: "standard" },
    ...VERSION,
    ticks,
    refundTicks,
    rankedTicks: ticks - refundTicks,
    maxCombo: 0,
    won: true,
    valid: true,
    reasons: [],
    cause: "",
    splits: [split("exit", ticks, refundTicks)],
    kills: 5,
    loot: 0,
    secrets: [],
    dashDodges: 0,
    usedWeapon: false,
    ...overrides,
  };
};
function memory() {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
    removeItem: (key: string) => {
      data.delete(key);
    },
  };
}
describe("ranked records and persistence", () => {
  it("persists actual time, refunds, ranked time, combo and settings", () => {
    const m = memory(),
      s = new StorageManager(m);
    s.data.settings.music = 0.7;
    expect(
      s.commit(record({ ticks: 4000, refundTicks: 600, maxCombo: 3, loot: 3 }))
        .pb,
    ).toBe(true);
    const loaded = new StorageManager(m);
    expect(loaded.best()).toMatchObject({
      ticks: 4000,
      rankedTicks: 3400,
      refundTicks: 600,
      maxCombo: 3,
    });
    expect(loaded.data.settings.music).toBe(0.7);
  });
  it("ranks a slower actual run higher when diamonds lower its ranked time", () => {
    const s = new StorageManager(memory());
    s.commit(record({ ticks: 3600 }));
    expect(s.commit(record({ ticks: 4000, refundTicks: 600 })).pb).toBe(true);
    expect(s.best()?.rankedTicks).toBe(3400);
  });
  it("uses actual elapsed as tie-breaker and retains existing PB on an exact tie", () => {
    const s = new StorageManager(memory());
    s.commit(record({ id: "first", ticks: 4000, refundTicks: 400 }));
    expect(
      s.commit(record({ id: "tie", ticks: 4000, refundTicks: 400 })).pb,
    ).toBe(false);
    expect(s.best()?.id).toBe("first");
    expect(
      s.commit(record({ id: "faster-actual", ticks: 3900, refundTicks: 300 }))
        .pb,
    ).toBe(true);
    expect(s.best()?.id).toBe("faster-actual");
  });
  it("rejects invalid, paused and incompatible PB candidates", () => {
    const s = new StorageManager(memory());
    s.commit(record());
    expect(
      s.commit(record({ ticks: 1000, valid: false, reasons: ["Paused"] })).pb,
    ).toBe(false);
    expect(s.commit(record({ ticks: 1000, rules: "old" })).pb).toBe(false);
    expect(s.best()?.ticks).toBe(3600);
  });
  it("validates extended runs up to 81 actual seconds without accepting a deadline completion", () => {
    expect(validRecord(record({ ticks: 9000, refundTicks: 2000 }))).toBe(true);
    expect(validRecord(record({ ticks: 9720, refundTicks: 2520 }))).toBe(false);
    expect(validRecord(record({ ticks: 9721, refundTicks: 2520 }))).toBe(false);
    expect(validRecord(record({ ticks: 10, refundTicks: 20 }))).toBe(false);
  });
  it("migrates original records, PBs, settings and unlocks without comparing old times", () => {
    const m = memory(),
      d = defaults(),
      r = record({ game: "1.0.0", rules: "120hz-q16-1" });
    const oldKey = "1.0.0/crypt-1/120hz-q16-1/fixed/standard";
    const legacy: Record<string, unknown> = {
      ...r,
      splits: [{ id: "exit", tick: 3600 }],
    };
    delete legacy.refundTicks;
    delete legacy.rankedTicks;
    delete legacy.maxCombo;
    const saved = {
      ...d,
      schema: 1,
      best: { [oldKey]: legacy },
      history: [legacy],
      achievements: ["challenge", "first"],
    };
    saved.settings.music = 0.8;
    m.setItem(STORAGE_KEY, JSON.stringify(saved));
    const s = new StorageManager(m);
    expect(s.data.schema).toBe(2);
    expect(s.data.best[oldKey]?.rankedTicks).toBe(3600);
    expect(s.data.history).toHaveLength(1);
    expect(s.data.achievements).toEqual(["challenge", "first"]);
    expect(s.data.settings.music).toBe(0.8);
    expect(s.best()).toBeUndefined();
    s.save();
    expect(new StorageManager(m).data.best[oldKey]).toBeDefined();
  });
  it("handles malformed saves, future schemas and denied storage", () => {
    const m = memory();
    m.setItem(STORAGE_KEY, "{bad");
    expect(new StorageManager(m).warning).toContain("could not");
    m.setItem(STORAGE_KEY, '{"schema":99}');
    expect(new StorageManager(m).warning).toContain("unsupported");
    const denied = {
      getItem: () => {
        throw Error("denied");
      },
      setItem: () => {
        throw Error("denied");
      },
      removeItem: () => {},
    };
    const s = new StorageManager(denied);
    expect(() => s.commit(record())).not.toThrow();
    expect(s.warning).toContain("unavailable");
  });
  it("bounds ordinary history independently from PBs", () => {
    const s = new StorageManager(memory());
    s.commit(record({ ticks: 1000 }));
    for (let i = 0; i < 110; i++)
      s.commit(record({ id: String(i), won: false, cause: "Restarted" }));
    expect(s.data.history).toHaveLength(100);
    expect(s.best()?.ticks).toBe(1000);
  });
  it("rejects corrupt replays and conflicting keybindings", () => {
    expect(validReplay({ format: 2 })).toBe(false);
    const m = memory(),
      d = defaults();
    d.settings.bindings.down = "KeyW";
    m.setItem(STORAGE_KEY, JSON.stringify(d));
    expect(new StorageManager(m).data.settings.bindings.down).toBe("KeyS");
  });
  it("preserves core records on replay quota failure", () => {
    const m = memory(),
      limited = {
        ...m,
        setItem: (key: string, value: string) => {
          if (value.length > 2500) throw Error("quota");
          m.setItem(key, value);
        },
      };
    const s = new StorageManager(limited);
    s.data.replays["large"] = JSON.parse(
      '{"payload":"' + "x".repeat(3000) + '"}',
    );
    s.commit(record());
    expect(s.data.replays).toEqual({});
    expect(s.best()).toBeDefined();
    expect(s.warning).toContain("Storage");
  });
  it("preserves earned cosmetics, revises Diamond Free unlock and resets safely", () => {
    const s = new StorageManager(memory());
    s.commit(record({ loot: 1 }));
    expect(s.data.achievements).not.toContain("challenge");
    s.commit(record({ loot: 0 }));
    expect(s.data.achievements).toContain("challenge");
    s.reset();
    expect(s.data.totals.attempts).toBe(0);
    expect(s.data.best[recordKey("fixed", "standard")]).toBeUndefined();
  });
  it("counts an attempt once from start through completion", () => {
    const s = new StorageManager(memory()),
      r = record();
    s.beginRun(r.options);
    s.commit(r, undefined, true);
    expect(s.data.totals.attempts).toBe(1);
    expect(s.data.totals.wins).toBe(1);
  });
  it("separates segments and pace by objective AND diamond progress", () => {
    const s = new StorageManager(memory());
    const a = [split("key", 100), split("switch-1", 200)],
      b = [
        split("key", 100, 0, "0:1:100"),
        split("switch-1", 200, 0, "0:1:100"),
      ];
    s.commit(record({ splits: a }));
    s.commit(record({ splits: b }));
    expect(Object.keys(s.data.segments)).toHaveLength(4);
    expect(comparableSplits(a, b, 1)).toBe(false);
    expect(comparableSplits(a, a, 1)).toBe(true);
    expect(
      comparableSplits(a, [split("switch-1", 100), split("key", 200)], 1),
    ).toBe(false);
  });
});

it("retains original replay frames and hashes while refusing incompatible playback safely", () => {
  const sim = new Simulation({
      seed: C.standardSeed,
      category: "fixed",
      challenge: "standard",
    }),
    rec = new Recorder();
  sim.step(EMPTY_INPUT);
  rec.record(EMPTY_INPUT, sim);
  const replay = rec.finish(sim),
    legacy: Record<string, unknown> = {
      ...replay,
      game: "1.0.0",
      rules: "120hz-q16-1",
      format: 1,
      options: { seed: 42, category: "random", challenge: "pacifist" },
    };
  delete legacy.refundTicks;
  delete legacy.rankedTicks;
  delete legacy.maxCombo;
  const oldKey = "1.0.0/crypt-1/120hz-q16-1/random/pacifist",
    m = memory();
  m.setItem(
    STORAGE_KEY,
    JSON.stringify({ ...defaults(), schema: 1, replays: { [oldKey]: legacy } }),
  );
  const storage = new StorageManager(m),
    archived = storage.data.replays[oldKey]!;
  expect(archived).toBeDefined();
  expect(archived.format).toBe(1);
  expect(archived.frames).toEqual(replay.frames);
  expect(archived.finalHash).toBe(replay.finalHash);
  expect(verifyReplay(archived).error).toContain("different");
  storage.save();
  expect(new StorageManager(m).data.replays[oldKey]?.format).toBe(1);
});
it("rejects inconsistent score metadata and unsupported current replay modes", () => {
  const sim = new Simulation({
      seed: C.standardSeed,
      category: "fixed",
      challenge: "standard",
    }),
    rec = new Recorder();
  sim.step(EMPTY_INPUT);
  rec.record(EMPTY_INPUT, sim);
  const replay = rec.finish(sim);
  expect(validReplay({ ...replay, rankedTicks: 100 })).toBe(false);
  expect(() =>
    verifyReplay({
      ...replay,
      options: {
        seed: C.standardSeed,
        category: "random",
        challenge: "standard",
      },
    }),
  ).not.toThrow();
  expect(
    verifyReplay({
      ...replay,
      options: {
        seed: C.standardSeed,
        category: "random",
        challenge: "standard",
      },
    }).error,
  ).toContain("unsupported");
});
