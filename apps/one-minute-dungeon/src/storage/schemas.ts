import { VERSION, type Category, type Challenge } from "../game/config";
import type { Replay, RunRecord } from "../game/types";
export const ACTIONS = [
  "up",
  "down",
  "left",
  "right",
  "attack",
  "dash",
  "interact",
  "restart",
  "pause",
  "ghost",
  "splits",
] as const;
export type Action = (typeof ACTIONS)[number];
export interface Settings {
  bindings: Record<Action, string>;
  music: number;
  sfx: number;
  mute: boolean;
  reduced: boolean;
  shake: boolean;
  ghost: boolean;
  splits: boolean;
  skin: string;
  sword: string;
  trail: string;
  ghostColor: string;
  title: string;
}
export const DEFAULT_SETTINGS: Settings = {
  bindings: {
    up: "KeyW",
    down: "KeyS",
    left: "KeyA",
    right: "KeyD",
    attack: "Mouse0",
    dash: "Space",
    interact: "KeyE",
    restart: "KeyR",
    pause: "Escape",
    ghost: "KeyG",
    splits: "Tab",
  },
  music: 0.24,
  sfx: 0.5,
  mute: false,
  reduced: false,
  shake: true,
  ghost: true,
  splits: true,
  skin: "ember",
  sword: "steel",
  trail: "ember",
  ghostColor: "cyan",
  title: "Crypt Wanderer",
};
export interface Totals {
  attempts: number;
  wins: number;
  failures: number;
  timeouts: number;
  ticks: number;
  rankedTicks: number;
  refundTicks: number;
  kills: number;
  loot: number;
  guardianKills: number;
  deaths: Record<string, number>;
  secrets: string[];
  challenges: string[];
}
export interface SaveData {
  schema: number;
  settings: Settings;
  history: RunRecord[];
  best: Record<string, RunRecord>;
  replays: Record<string, Replay>;
  achievements: string[];
  totals: Totals;
  segments: Record<string, number>;
  categories: Record<string, Totals>;
}
export function emptyTotals(): Totals {
  return {
    attempts: 0,
    wins: 0,
    failures: 0,
    timeouts: 0,
    ticks: 0,
    rankedTicks: 0,
    refundTicks: 0,
    kills: 0,
    loot: 0,
    guardianKills: 0,
    deaths: {},
    secrets: [],
    challenges: [],
  };
}
export function defaults(): SaveData {
  return {
    schema: 2,
    settings: structuredClone(DEFAULT_SETTINGS),
    history: [],
    best: {},
    replays: {},
    achievements: [],
    totals: emptyTotals(),
    segments: {},
    categories: {},
  };
}
export function recordKey(category: Category, challenge: Challenge): string {
  return `${VERSION.game}/${VERSION.map}/${VERSION.rules}/${category}/${challenge}`;
}
export const ACHIEVEMENTS = [
  {
    id: "first",
    name: "First Escape",
    description: "Escape the Forgotten Crypt.",
    reward: "Jade knight",
  },
  {
    id: "speed",
    name: "Speed Demon",
    description: "Escape in under 45 seconds.",
    reward: "Violet knight",
  },
  {
    id: "untouchable",
    name: "Untouchable",
    description: "Escape without absorbing damage with dash invulnerability.",
    reward: "Ivory knight",
  },
  {
    id: "bare",
    name: "Bare Steel",
    description: "Escape without a temporary weapon.",
    reward: "Gold sword",
  },
  {
    id: "treasure",
    name: "Treasure Hunter",
    description: "Collect all six diamonds in a successful run.",
    reward: "Relic trail",
  },
  {
    id: "secret",
    name: "Secret Keeper",
    description: "Discover both hidden passages.",
    reward: "Violet ghost",
  },
  {
    id: "hundred",
    name: "Hundred Attempts",
    description: "Begin 100 attempts.",
    reward: "Crypt Veteran title",
  },
  {
    id: "guardian",
    name: "Guardian Slayer",
    description: "Defeat the mandatory guardian ten times.",
    reward: "Guardian Slayer title",
  },
  {
    id: "challenge",
    name: "Diamond Free",
    description: "Escape without collecting a diamond.",
    reward: "Jade trail",
  },
] as const;
