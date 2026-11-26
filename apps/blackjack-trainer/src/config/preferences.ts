import { z } from "zod";
import { metadata } from "../config/metadata";
export const shortcuts = {
  hit: "h",
  stand: "s",
  double: "d",
  split: "p",
  deal: "Enter",
  undo: "u",
  clear: "c",
  rebet: "r",
  doubleBet: "b",
  strategy: "g",
  wallet: "w",
  settings: "Escape",
  chip1: "1",
  chip5: "2",
  chip25: "3",
  chip100: "4",
  chip500: "5",
  chip1000: "6",
  chip5000: "7",
};
export const defaults = {
  theme: "green",
  cardBack: "blue",
  speed: "normal",
  reducedMotion:
    typeof matchMedia !== "undefined" &&
    matchMedia("(prefers-reduced-motion: reduce)").matches,
  contrast: false,
  strategy: false,
  highlight: true,
  feedback: "silent",
  weights: false,
  running: false,
  trueCount: false,
  shoe: "visual",
  checkpoint: 0,
  muted: false,
  music: 0,
  ambience: 0,
  effects: 0.35,
  showTime: false,
  breakMinutes: 0,
  limitMinutes: 0,
  shortcuts,
  onboarded: false,
};
export type Preferences = typeof defaults;
const settings = z.object({
  theme: z.enum(["green", "blue", "burgundy", "black"]),
  cardBack: z.enum(["blue", "red", "gold", "geometric", "scholar"]),
  speed: z.enum(["slow", "normal", "fast", "instant"]),
  reducedMotion: z.boolean(),
  contrast: z.boolean(),
  strategy: z.boolean(),
  highlight: z.boolean(),
  feedback: z.enum(["silent", "educational", "confirm"]),
  weights: z.boolean(),
  running: z.boolean(),
  trueCount: z.boolean(),
  shoe: z.enum(["visual", "exact", "hidden"]),
  checkpoint: z.number().int().min(0).max(100),
  muted: z.boolean(),
  music: z.number().min(0).max(1),
  ambience: z.number().min(0).max(1),
  effects: z.number().min(0).max(1),
  showTime: z.boolean(),
  breakMinutes: z.number().min(0).max(120),
  limitMinutes: z.number().min(0).max(240),
  shortcuts: z.record(z.string(), z.string().min(1).max(20)),
  onboarded: z.boolean(),
});
export function validatePreferences(raw: unknown): Preferences {
  const parsed = settings.parse(raw);
  for (const [name, preferred] of [
    ["chip1000", "6"],
    ["chip5000", "7"],
  ]) {
    if (!parsed.shortcuts[name!]) {
      const used = new Set(
        Object.values(parsed.shortcuts).map((k) => k.toLowerCase()),
      );
      parsed.shortcuts[name!] = [
        preferred!,
        "8",
        "9",
        "0",
        "F6",
        "F7",
        "F8",
      ].find((key) => !used.has(key.toLowerCase()))!;
    }
  }
  for (const key of Object.keys(shortcuts))
    if (!parsed.shortcuts[key]) throw Error("Missing shortcut");
  const values = Object.values(parsed.shortcuts).map((x) => x.toLowerCase());
  if (new Set(values).size !== values.length)
    throw Error("Each shortcut needs a different key");
  return parsed as Preferences;
}
export function loadPreferences() {
  try {
    const raw = localStorage.getItem(metadata.preferences);
    return raw ? validatePreferences(JSON.parse(raw)) : { ...defaults };
  } catch {
    return { ...defaults };
  }
}
export function savePreferences(p: Preferences) {
  const valid = validatePreferences(p);
  localStorage.setItem(metadata.preferences, JSON.stringify(valid));
}
export const presets = {
  beginner: {
    strategy: true,
    weights: true,
    running: true,
    trueCount: true,
    shoe: "exact",
    feedback: "educational",
    speed: "slow",
  },
  intermediate: {
    strategy: false,
    weights: true,
    running: false,
    trueCount: false,
    shoe: "visual",
    feedback: "silent",
    speed: "normal",
  },
  advanced: {
    strategy: false,
    weights: false,
    running: false,
    trueCount: false,
    shoe: "hidden",
    feedback: "silent",
    speed: "fast",
  },
};
