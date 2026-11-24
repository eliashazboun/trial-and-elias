import fs from "node:fs";
import crypto from "node:crypto";
import { describe, it, expect } from "vitest";
import {
  ALPHABET,
  generateQuestions,
  formatTime,
  STORAGE_KEY,
  type QuizResult,
} from "../src/quiz";
import { persistResult, readHistoryState } from "../src/history";
const expected = [
  "Alfa",
  "Bravo",
  "Charlie",
  "Delta",
  "Echo",
  "Foxtrot",
  "Golf",
  "Hotel",
  "India",
  "Juliett",
  "Kilo",
  "Lima",
  "Mike",
  "November",
  "Oscar",
  "Papa",
  "Quebec",
  "Romeo",
  "Sierra",
  "Tango",
  "Uniform",
  "Victor",
  "Whiskey",
  "X-ray",
  "Yankee",
  "Zulu",
];
function memory(raw: string | null = null) {
  return {
    getItem: () => raw,
    setItem: (_key: string, value: string) => {
      raw = value;
    },
  };
}
const result = (id = "test"): QuizResult => ({
  id,
  date: "2026-11-24T12:00:00.000Z",
  score: 26,
  total: 26,
  durationMs: 20000,
  answers: ALPHABET.map((a) => ({
    letter: a.letter,
    correct: a.correct,
    selected: a.correct,
    isCorrect: true,
    timeMs: 100,
  })),
});
describe("supplied NATO trainer", () => {
  it("preserves every correct spelling and all ten distractors per letter", () => {
    expect(ALPHABET.map((a) => a.correct)).toEqual(expected);
    expect(ALPHABET.map((a) => a.letter).join("")).toBe(
      "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    );
    for (const entry of ALPHABET) {
      expect(entry.incorrect).toHaveLength(10);
      expect(new Set(entry.incorrect).size).toBe(10);
      expect(entry.incorrect).not.toContain(entry.correct);
    }
  });
  it("randomizes a complete quiz with three unique choices and one correct answer", () => {
    const orders = new Set<string>();
    for (let i = 0; i < 50; i++) {
      const quiz = generateQuestions();
      expect(quiz).toHaveLength(26);
      expect(new Set(quiz.map((q) => q.letter)).size).toBe(26);
      orders.add(quiz.map((q) => q.letter).join(""));
      for (const q of quiz) {
        expect(q.options).toHaveLength(3);
        expect(new Set(q.options).size).toBe(3);
        expect(q.options.filter((x) => x === q.correct)).toHaveLength(1);
        expect(
          q.options.every(
            (x) =>
              x === q.correct ||
              ALPHABET.find((a) => a.letter === q.letter)!.incorrect.includes(
                x,
              ),
          ),
        ).toBe(true);
      }
    }
    expect(orders.size).toBeGreaterThan(1);
  });
  it("preserves the storage key and timing formatter", () => {
    expect(STORAGE_KEY).toBe("nato-phonetic-trainer-results");
    expect(formatTime(0)).toBe("00:00.0");
    expect(formatTime(61999)).toBe("01:01.9");
  });
  it("reads original records unchanged and persists a completion once", () => {
    const original = result("original"),
      store = memory(JSON.stringify([original]));
    expect(readHistoryState(store).history).toEqual([original]);
    const next = result("next");
    expect(persistResult(next, [original], store).saved).toBe(true);
    expect(persistResult(next, [], store).history).toHaveLength(2);
    expect(readHistoryState(store).history.map((r) => r.id)).toEqual([
      "next",
      "original",
    ]);
  });
  it("preserves malformed entries rather than silently deleting old data", () => {
    const old = result("original"),
      invalid = { legacy: "preserve me" },
      store = memory(JSON.stringify([invalid, old]));
    expect(readHistoryState(store).history).toEqual([old]);
    expect(readHistoryState(store).warning).toContain("preserved");
    persistResult(result("next"), [old], store);
    expect(JSON.parse(store.getItem()!)).toContainEqual(invalid);
  });
  it("does not overwrite corrupt JSON and keeps failed saves in session memory", () => {
    const store = memory("{broken"),
      next = result();
    const saved = persistResult(next, [], store);
    expect(saved.saved).toBe(false);
    expect(saved.history).toEqual([next]);
    expect(store.getItem()).toBe("{broken");
    expect(readHistoryState(store).history).toEqual([]);
    const denied = {
      getItem: () => {
        throw Error("denied");
      },
      setItem: () => {
        throw Error("quota");
      },
    };
    expect(persistResult(next, [], denied).saved).toBe(false);
    expect(
      persistResult(result("second"), [next], denied).history,
    ).toHaveLength(2);
  });
});

it("preserves the complete original distractor dataset byte-for-value", () => {
  const expected = JSON.parse(
    fs.readFileSync(
      new URL("../../../docs/preservation.json", import.meta.url),
      "utf8",
    ),
  ).trainerAlphabetSha256;
  expect(
    crypto.createHash("sha256").update(JSON.stringify(ALPHABET)).digest("hex"),
  ).toBe(expected);
});
