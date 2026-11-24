import { C, VERSION } from "../game/config";
import type { Replay, RunRecord, Split } from "../game/types";
import { currentRecord } from "../game/systems/RunManager";
import {
  ACTIONS,
  DEFAULT_SETTINGS,
  defaults,
  emptyTotals,
  recordKey,
  type Settings,
  type Totals,
} from "./schemas";
// Retain the storage key so existing installations are migrated in place.
export const STORAGE_KEY = "one-minute-dungeon:v1";
const object = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const integer = (
  v: unknown,
  min: number = 0,
  max: number = C.maxRunTicks,
): v is number =>
  typeof v === "number" && Number.isInteger(v) && v >= min && v <= max;
const finite = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);
const strings = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((x) => typeof x === "string");
const legacyModes = [
  "standard",
  "no-dash",
  "rusty-blade",
  "pacifist",
  "treasure",
  "guardian-hunt",
];
function options(v: unknown): boolean {
  return (
    object(v) &&
    (v.category === "fixed" || v.category === "random") &&
    legacyModes.includes(String(v.challenge)) &&
    integer(v.seed, 0, 4294967295)
  );
}
function validSplit(v: unknown): v is Split {
  return (
    object(v) &&
    typeof v.id === "string" &&
    integer(v.tick) &&
    integer(v.refundTicks, 0, C.maxRefundTicks) &&
    integer(v.rankedTicks) &&
    v.tick - v.refundTicks === v.rankedTicks &&
    typeof v.diamondRoute === "string" &&
    v.diamondRoute.length < 500
  );
}
function splits(v: unknown): boolean {
  return (
    Array.isArray(v) &&
    v.length <= 20 &&
    v.every(validSplit) &&
    v.every((s, i, a) => i === 0 || s.tick >= a[i - 1]!.tick)
  );
}
function scoring(v: Record<string, unknown>): boolean {
  return (
    integer(v.ticks) &&
    integer(v.refundTicks, 0, C.maxRefundTicks) &&
    integer(v.rankedTicks) &&
    v.ticks - v.refundTicks === v.rankedTicks &&
    integer(v.maxCombo, 0, C.diamondCount)
  );
}
export function validRecord(v: unknown): v is RunRecord {
  return (
    object(v) &&
    typeof v.id === "string" &&
    typeof v.date === "string" &&
    options(v.options) &&
    typeof v.game === "string" &&
    typeof v.map === "string" &&
    typeof v.rules === "string" &&
    scoring(v) &&
    typeof v.won === "boolean" &&
    typeof v.valid === "boolean" &&
    strings(v.reasons) &&
    typeof v.cause === "string" &&
    splits(v.splits) &&
    integer(v.kills, 0, 100) &&
    integer(v.loot, 0, C.diamondCount) &&
    strings(v.secrets) &&
    integer(v.dashDodges, 0, 100000) &&
    typeof v.usedWeapon === "boolean" &&
    (!v.won || Number(v.rankedTicks) < C.deadline)
  );
}
function migrateSplits(value: unknown): unknown {
  return Array.isArray(value)
    ? value.map((s) =>
        object(s)
          ? { ...s, refundTicks: 0, rankedTicks: s.tick, diamondRoute: "" }
          : s,
      )
    : value;
}
function normalizeRecord(v: unknown): RunRecord | null {
  if (!object(v)) return null;
  // Only original v1 records receive legacy defaults; malformed current records are rejected.
  const next =
    v.game === "1.0.0" && v.rules === "120hz-q16-1"
      ? {
          ...v,
          refundTicks: 0,
          rankedTicks: v.ticks,
          maxCombo: 0,
          splits: migrateSplits(v.splits),
        }
      : v;
  return validRecord(next) ? next : null;
}
export function validReplay(v: unknown): v is Replay {
  if (
    !object(v) ||
    !integer(v.format, 1, 100) ||
    typeof v.game !== "string" ||
    typeof v.map !== "string" ||
    typeof v.rules !== "string" ||
    !integer(v.hz, 1, 1000) ||
    !options(v.options) ||
    !scoring(v) ||
    !integer(v.ticks, 1, C.maxRunTicks) ||
    typeof v.finalHash !== "string" ||
    !splits(v.splits)
  )
    return false;
  if (
    !Array.isArray(v.frames) ||
    v.frames.length < 1 ||
    v.frames.length > C.maxRunTicks
  )
    return false;
  if (
    !v.frames.every(
      (f, i, a) =>
        Array.isArray(f) &&
        f.length === 5 &&
        f.every(finite) &&
        integer(f[0], 1, Number(v.ticks)) &&
        (i === 0 ? f[0] === 1 : f[0] > a[i - 1][0]) &&
        integer(f[1], -1, 1) &&
        integer(f[2], -1, 1) &&
        integer(f[3], -20000, 20000) &&
        integer(f[4], 0, 7),
    )
  )
    return false;
  return (
    Array.isArray(v.checkpoints) &&
    v.checkpoints.length <= C.maxRunTicks / C.hz &&
    v.checkpoints.every(
      (c, i, a) =>
        object(c) &&
        integer(c.tick, 1, Number(v.ticks)) &&
        c.tick % C.hz === 0 &&
        typeof c.hash === "string" &&
        (i === 0 || c.tick > a[i - 1].tick),
    )
  );
}
function normalizeReplay(v: unknown): Replay | null {
  if (!object(v)) return null;
  const next =
    v.game === "1.0.0" && v.format === 1
      ? {
          ...v,
          refundTicks: 0,
          rankedTicks: v.ticks,
          maxCombo: 0,
          splits: migrateSplits(v.splits),
        }
      : v;
  return validReplay(next) ? next : null;
}
function loadSettings(v: unknown): Settings {
  const s = structuredClone(DEFAULT_SETTINGS);
  if (!object(v)) return s;
  for (const k of ["music", "sfx"] as const)
    if (finite(v[k])) s[k] = Math.max(0, Math.min(1, v[k]));
  for (const k of ["mute", "reduced", "shake", "ghost", "splits"] as const)
    if (typeof v[k] === "boolean") s[k] = v[k];
  if (object(v.bindings)) {
    const next = { ...s.bindings };
    for (const a of ACTIONS)
      if (
        typeof v.bindings[a] === "string" &&
        /^(Key[A-Z]|Digit[0-9]|Arrow(Up|Down|Left|Right)|Space|Tab|Escape|Shift(Left|Right)|Control(Left|Right)|Alt(Left|Right)|Enter|Backspace|Mouse[0-4])$/.test(
          v.bindings[a],
        )
      )
        next[a] = v.bindings[a];
    if (new Set(Object.values(next)).size === ACTIONS.length) s.bindings = next;
  }
  for (const k of ["skin", "sword", "trail", "ghostColor", "title"] as const)
    if (typeof v[k] === "string" && v[k].length < 50) s[k] = v[k];
  return s;
}
function loadTotals(v: unknown): Totals {
  const t = emptyTotals();
  if (!object(v)) return t;
  for (const k of [
    "attempts",
    "wins",
    "failures",
    "timeouts",
    "ticks",
    "rankedTicks",
    "refundTicks",
    "kills",
    "loot",
    "guardianKills",
  ] as const)
    if (finite(v[k]) && v[k] >= 0) t[k] = v[k];
  if (object(v.deaths))
    for (const [k, n] of Object.entries(v.deaths))
      if (finite(n) && n >= 0) t.deaths[k] = n;
  if (strings(v.secrets)) t.secrets = v.secrets;
  if (strings(v.challenges)) t.challenges = v.challenges;
  return t;
}
function browserStorage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export class StorageManager {
  data = defaults();
  warning = "";
  constructor(
    private readonly storage: Pick<
      Storage,
      "getItem" | "setItem" | "removeItem"
    > | null = browserStorage(),
  ) {
    this.load();
  }
  private load(): void {
    try {
      const raw = this.storage?.getItem(STORAGE_KEY);
      if (!raw) return;
      const v: unknown = JSON.parse(raw);
      if (!object(v) || (v.schema !== 1 && v.schema !== 2)) {
        this.warning =
          "Saved data uses an unsupported schema. Defaults loaded safely.";
        return;
      }
      const d = defaults();
      d.settings = loadSettings(v.settings);
      d.totals = loadTotals(v.totals);
      if (Array.isArray(v.history))
        d.history = v.history
          .map(normalizeRecord)
          .filter((r): r is RunRecord => !!r)
          .slice(-100);
      if (object(v.best))
        for (const [k, r] of Object.entries(v.best)) {
          const record = normalizeRecord(r);
          if (record?.won && record.valid) d.best[k] = record;
        }
      if (object(v.replays))
        for (const [k, r] of Object.entries(v.replays)) {
          const replay = normalizeReplay(r);
          if (replay) d.replays[k] = replay;
        }
      if (strings(v.achievements)) d.achievements = v.achievements;
      if (object(v.categories))
        for (const [k, t] of Object.entries(v.categories))
          d.categories[k] = loadTotals(t);
      if (object(v.segments))
        for (const [key, ticks] of Object.entries(v.segments))
          if (integer(ticks)) d.segments[key] = ticks;
      this.data = d;
    } catch {
      this.warning =
        "Saved data could not be read. Playing with safe defaults.";
    }
  }
  save(): void {
    try {
      if (!this.storage) throw Error("Unavailable");
      this.storage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch {
      this.warning =
        "Storage is full or unavailable. Replay storage was reduced; export a backup from Statistics.";
      try {
        this.data.replays = {};
        if (!this.storage) throw Error("Unavailable");
        this.storage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      } catch {
        this.warning =
          "Browser storage is unavailable. Progress is kept in memory for this session.";
      }
    }
  }
  best(
    category: RunRecord["options"]["category"] = "fixed",
    challenge: RunRecord["options"]["challenge"] = "standard",
  ): RunRecord | undefined {
    const record = this.data.best[recordKey(category, challenge)];
    return record && currentRecord(record) ? record : undefined;
  }
  beginRun(options: RunRecord["options"]): void {
    const key = recordKey(options.category, options.challenge);
    if (!this.data.categories[key]) this.data.categories[key] = emptyTotals();
    this.data.totals.attempts++;
    this.data.categories[key]!.attempts++;
    if (
      this.data.totals.attempts >= 100 &&
      !this.data.achievements.includes("hundred")
    )
      this.data.achievements.push("hundred");
    this.save();
  }
  commit(
    record: RunRecord,
    replay?: Replay,
    attemptStarted = false,
  ): { pb: boolean; previous?: RunRecord; unlocked: string[] } {
    const d = this.data,
      key = recordKey(record.options.category, record.options.challenge),
      previous = this.best();
    d.history.push(record);
    d.history = d.history.slice(-100);
    if (!d.categories[key]) d.categories[key] = emptyTotals();
    for (const t of [d.totals, d.categories[key]!]) {
      if (!attemptStarted) t.attempts++;
      t.kills += record.kills;
      t.loot += record.loot;
      if (record.splits.some((s) => s.id === "guardian")) t.guardianKills++;
      t.secrets = [...new Set([...t.secrets, ...record.secrets])];
      if (record.won) {
        t.wins++;
        t.ticks += record.ticks;
        t.rankedTicks += record.rankedTicks;
        t.refundTicks += record.refundTicks;
      } else {
        t.failures++;
        if (record.cause === "Time expired") t.timeouts++;
        t.deaths[record.cause] = (t.deaths[record.cause] ?? 0) + 1;
      }
    }
    const pb =
      validRecord(record) &&
      record.won &&
      record.valid &&
      currentRecord(record) &&
      (!previous ||
        record.rankedTicks < previous.rankedTicks ||
        (record.rankedTicks === previous.rankedTicks &&
          record.ticks < previous.ticks));
    if (pb) {
      d.best[key] = record;
      if (
        replay &&
        validReplay(replay) &&
        replay.game === VERSION.game &&
        replay.rules === VERSION.rules &&
        replay.ticks === record.ticks &&
        replay.rankedTicks === record.rankedTicks
      )
        d.replays[key] = replay;
      else delete d.replays[key];
    }
    if (record.won && record.valid && currentRecord(record)) {
      let start = 0;
      const prefix = ["spawn"];
      for (const split of record.splits) {
        prefix.push(split.id + "[" + split.diamondRoute + "]");
        const segmentKey = key + "|" + prefix.join(">"),
          duration = split.tick - start;
        if (duration >= 0)
          d.segments[segmentKey] = Math.min(
            d.segments[segmentKey] ?? Infinity,
            duration,
          );
        start = split.tick;
      }
    }
    const earned: Record<string, boolean> = {
      first: record.won,
      speed: record.won && record.rankedTicks < 45 * C.hz,
      untouchable: record.won && record.dashDodges === 0,
      bare: record.won && !record.usedWeapon,
      treasure: record.won && record.loot === C.diamondCount,
      secret: d.totals.secrets.length === 2,
      hundred: d.totals.attempts >= 100,
      guardian: d.totals.guardianKills >= 10,
      challenge: record.won && record.loot === 0,
    };
    const unlocked = Object.keys(earned).filter(
      (k) => earned[k] && !d.achievements.includes(k),
    );
    d.achievements.push(...unlocked);
    this.save();
    return { pb, previous, unlocked };
  }
  reset(): void {
    this.data = defaults();
    this.warning = "";
    this.save();
  }
}
