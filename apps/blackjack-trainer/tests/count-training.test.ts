import { describe, it, expect } from "vitest";
import {
  initialState,
  applyCommand,
  mockEnvironment,
  assertState,
  between,
} from "../src/engine/engine";
import { seeded } from "../src/engine/cards";
import { emptyCountTraining } from "../src/engine/types";
import type { GameState, Command } from "../src/engine/types";
import { validateState } from "../src/storage/validation";
function setup() {
  const e = mockEnvironment(seeded(431));
  let s = initialState(e);
  return {
    get s() {
      return s;
    },
    set s(value: GameState) {
      s = value;
    },
    send(c: Command) {
      e.now++;
      s = applyCommand(s, c, e);
      return s;
    },
  };
}
function round(f: ReturnType<typeof setup>, positions = 1) {
  if (f.s.round) f.send({ type: "next" });
  for (let p = 0; p < positions; p++)
    f.send({ type: "chip", position: p, kind: "main", chip: 25 });
  f.send({ type: "deal" });
  while (!between(f.s)) {
    if (f.s.round!.phase === "insurance")
      f.send({
        type: "insurance",
        position: f.s.round!.positions.find((p) => !p.insuranceChoice)!.index,
        choice: "decline",
      });
    else
      f.send({ type: "action", action: "stand", handId: f.s.round!.active! });
  }
}
function unlock() {
  const f = setup();
  for (let n = 0; n < 10; n++) round(f);
  return f;
}
describe("persistent hidden-count training", () => {
  it("locks nine rounds, unlocks ten and counts each completed round once", () => {
    const f = setup();
    for (let n = 0; n < 9; n++) round(f);
    expect(f.s.countTraining.hiddenRounds).toBe(9);
    expect(() => f.send({ type: "countGuess", value: 0 })).toThrow(
      /10 completed/,
    );
    round(f);
    expect(f.s.countTraining.hiddenRounds).toBe(10);
    f.send({ type: "tutorial", name: "counting" });
    f.send({ type: "next" });
    expect(f.s.countTraining.hiddenRounds).toBe(10);
  });
  it("grades current positive, negative and zero integers without revealing or resetting", () => {
    const f = unlock();
    const actual = f.s.shoe.running;
    f.send({ type: "countGuess", value: actual });
    expect(f.s.countTraining.lastGuess?.correct).toBe(true);
    for (const value of [-5, 0, 5]) {
      f.send({ type: "countGuess", value });
      expect(f.s.checks.at(-1)).toMatchObject({
        actual,
        submitted: value,
        correct: value === actual,
      });
    }
    expect(f.s.countTraining).toMatchObject({
      visible: false,
      hiddenRounds: 10,
    });
    for (const value of [NaN, Infinity, 1.1])
      expect(() => f.send({ type: "countGuess", value })).toThrow(
        /whole-number/,
      );
  });
  it("rejects visible guesses and does not penalize ordinary toggles", () => {
    const f = setup();
    round(f);
    const balance = f.s.balance;
    for (let n = 0; n < 4; n++) {
      f.send({ type: "countVisibility", visible: true });
      expect(() => f.send({ type: "countGuess", value: 0 })).toThrow();
      f.send({ type: "countVisibility", visible: false });
    }
    expect(f.s.balance).toBe(balance);
    expect(f.s.countTraining.hiddenRounds).toBe(0);
    expect(
      f.s.ledger.filter((t) => t.kind === "count peek penalty"),
    ).toHaveLength(0);
  });
  it("persists an unlocked peek through refresh, consumes it once, then requires ten new rounds", () => {
    const f = unlock(),
      balance = f.s.balance;
    f.send({ type: "countVisibility", visible: true });
    const id = f.s.countTraining.peekId;
    expect(id).toBeTruthy();
    expect(f.s.countTraining.hiddenRounds).toBe(0);
    f.s = validateState(JSON.parse(JSON.stringify(f.s)));
    f.send({ type: "countVisibility", visible: true });
    expect(f.s.countTraining.peekId).toBe(id);
    f.send({ type: "countVisibility", visible: false });
    expect(f.s.balance).toBe(balance - 200);
    f.s = validateState(JSON.parse(JSON.stringify(f.s)));
    for (let n = 0; n < 3; n++) {
      f.send({ type: "countVisibility", visible: false });
      f.send({ type: "countVisibility", visible: true });
      f.send({ type: "countVisibility", visible: false });
    }
    expect(f.s.balance).toBe(balance - 200);
    expect(
      f.s.ledger.filter((t) => t.kind === "count peek penalty"),
    ).toHaveLength(1);
    for (let n = 0; n < 10; n++) round(f);
    expect(f.s.countTraining.hiddenRounds).toBe(10);
    assertState(f.s);
  });
  it.each([0, 1, 99, 199])(
    "deducts only %i available half-chip units",
    (balance) => {
      const f = unlock();
      f.s.ledgerBase += balance - f.s.balance;
      f.s.balance = balance;
      f.send({ type: "countVisibility", visible: true });
      f.send({ type: "countVisibility", visible: false });
      expect(f.s.balance).toBe(0);
      expect(f.s.ledger.at(-1)?.amount).toBe(-balance);
      expect(f.s.countTraining.lastPenalty?.amount).toBe(balance);
      assertState(f.s);
    },
  );
  it("clears unaffordable pending reservations and their undo history atomically", () => {
    const f = unlock();
    f.send({ type: "next" });
    f.s.ledgerBase += 200 - f.s.balance;
    f.s.balance = 200;
    f.send({ type: "chip", position: 0, kind: "main", chip: 100 });
    f.send({ type: "countVisibility", visible: true });
    f.send({ type: "countVisibility", visible: false });
    expect(f.s.bets.every((b) => b.main.length === 0)).toBe(true);
    expect(f.s.undo).toHaveLength(0);
    expect(f.s.countTraining.lastPenalty?.clearedBets).toBe(true);
    assertState(f.s);
  });
  it("multiple positions and split hands still earn exactly one completed round", () => {
    const f = setup();
    const ranks = ["8", "8", "8", "6", "8", "8", "8", "10"];
    const chosen = f.s.shoe.cards.filter(() => false);
    for (const rank of ranks)
      chosen.push(
        f.s.shoe.cards.find((c) => c.rank === rank && !chosen.includes(c))!,
      );
    f.s.shoe.cards = [
      ...chosen,
      ...f.s.shoe.cards.filter((c) => !chosen.includes(c)),
    ];
    for (let p = 0; p < 3; p++)
      f.send({ type: "chip", position: p, kind: "main", chip: 25 });
    f.send({ type: "deal" });
    f.send({ type: "action", action: "split", handId: f.s.round!.active! });
    expect(f.s.countTraining.hiddenRounds).toBe(0);
    while (!between(f.s))
      f.send({ type: "action", action: "stand", handId: f.s.round!.active! });
    expect(f.s.round!.hands.length).toBeGreaterThan(3);
    expect(f.s.countTraining.hiddenRounds).toBe(1);
  });
  it("a mid-round peek resets the streak and leaves game net/payouts unchanged", () => {
    const f = unlock();
    f.send({ type: "next" });
    f.send({ type: "chip", position: 0, kind: "main", chip: 25 });
    f.send({ type: "deal" });
    if (between(f.s)) throw Error("fixture must have a decision");
    const reference = structuredClone(f.s);
    f.send({ type: "countVisibility", visible: true });
    f.send({ type: "countVisibility", visible: false });
    while (!between(f.s)) {
      if (f.s.round!.phase === "insurance")
        f.send({ type: "insurance", position: 0, choice: "decline" });
      else
        f.send({ type: "action", action: "stand", handId: f.s.round!.active! });
    }
    expect(f.s.countTraining.hiddenRounds).toBe(0);
    expect(f.s.round!.net).toBe(
      f.s.round!.hands.reduce((total, h) => total + h.net!, 0),
    );
    expect(f.s.balance - reference.balance).toBe(
      f.s.round!.hands.reduce((total, h) => total + h.stake + h.net!, 0) - 200,
    );
    assertState(f.s);
  });
  it("canceled/exhausted rounds do not count", () => {
    const f = setup();
    f.send({ type: "chip", position: 0, kind: "main", chip: 25 });
    f.send({ type: "deal" });
    expect(f.s.round?.phase).toBe("player");
    f.s.countTraining.hiddenRounds = 10;
    f.send({ type: "countVisibility", visible: true });
    f.send({ type: "countVisibility", visible: false });
    f.s.shoe.cursor = f.s.shoe.cards.length;
    f.send({ type: "action", action: "hit", handId: f.s.round!.active! });
    expect(f.s.round?.phase).toBe("canceled");
    expect(f.s.round?.net).toBe(0);
    expect(f.s.countTraining.hiddenRounds).toBe(0);
  });
  it("migrates old saves with no retroactive credit and resets relevant training state", () => {
    const f = unlock();
    const raw = JSON.parse(JSON.stringify(f.s));
    delete raw.countTraining;
    expect(validateState(raw).countTraining).toEqual(emptyCountTraining());
    for (const scope of ["balance", "gameplay", "education", "all"] as const) {
      const fresh = setup();
      fresh.s = structuredClone(f.s);
      fresh.send({ type: "reset", scope });
      expect(fresh.s.countTraining.hiddenRounds).toBe(0);
    }
  });
  it("the existing exercise also enforces eligibility and records reveals atomically", () => {
    const f = unlock();
    f.send({ type: "countGuess", value: f.s.shoe.running });
    const check = f.s.checks.at(-1)!;
    f.send({ type: "countVisibility", visible: true });
    expect(() => f.send({ type: "check", check })).toThrow(/10 completed/);
    f.send({ type: "countVisibility", visible: false });
    for (let n = 0; n < 10; n++) round(f);
    f.send({
      type: "check",
      check: {
        ...check,
        id: "revealed-check",
        submitted: null,
        error: null,
        correct: false,
        revealed: true,
      },
    });
    expect(f.s.countTraining).toMatchObject({ visible: true, hiddenRounds: 0 });
    expect(f.s.countTraining.peekId).toBeTruthy();
    const balance = f.s.balance;
    f.send({ type: "countVisibility", visible: false });
    expect(f.s.balance).toBe(balance - 200);
  });
});
