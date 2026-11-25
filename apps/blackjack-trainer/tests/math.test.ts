import { describe, it, expect } from "vitest";
import { deck, seeded, weight } from "../src/engine/cards";
import { perfectPairs, twentyOneThree } from "../src/engine/payouts";
import {
  initialState,
  applyCommand,
  legalActions,
  mockEnvironment,
  assertState,
} from "../src/engine/engine";
import { tables, strategyCell } from "../src/training/strategy";
const choose = (n: number, k: number) => {
  if (n < k) return 0;
  let x = 1;
  for (let i = 1; i <= k; i++) x = (x * (n - i + 1)) / i;
  return Math.round(x);
};
describe("exact physical-card side bet enumeration", () => {
  for (const d of [1, 2, 4, 6, 8])
    it(`exhausts every Perfect Pairs combination for ${d} decks`, () => {
      const cards = deck(d),
        counts: Record<number, number> = { 0: 0, 6: 0, 12: 0, 25: 0 };
      for (let i = 0; i < cards.length; i++)
        for (let j = i + 1; j < cards.length; j++)
          counts[perfectPairs(cards[i]!, cards[j]!).ratio]!++;
      expect(counts[25]).toBe(52 * choose(d, 2));
      expect(counts[12]).toBe(26 * d * d);
      expect(counts[6]).toBe(52 * d * d);
      expect(Object.values(counts).reduce((a, b) => a + b, 0)).toBe(
        choose(52 * d, 2),
      );
    });
  for (const d of [1, 2])
    it(`independently enumerates every 21+3 combination for ${d} decks`, () => {
      const cards = deck(d),
        counts: Record<number, number> = {
          0: 0,
          5: 0,
          10: 0,
          30: 0,
          40: 0,
          100: 0,
        };
      for (let i = 0; i < cards.length; i++)
        for (let j = i + 1; j < cards.length; j++)
          for (let k = j + 1; k < cards.length; k++)
            counts[twentyOneThree(cards[i]!, cards[j]!, cards[k]!).ratio]!++;
      const suited = 52 * choose(d, 3),
        sf = 48 * d ** 3,
        trips = 13 * choose(4 * d, 3) - suited,
        straight = 12 * (4 * d) ** 3 - sf,
        flush = 4 * choose(13 * d, 3) - sf - suited;
      expect(counts).toEqual({
        100: suited,
        40: sf,
        30: trips,
        10: straight,
        5: flush,
        0: choose(52 * d, 3) - suited - sf - trips - straight - flush,
      });
    });
});
describe("strategy reference data and counting", () => {
  it("all five deck tables contain ten dealer columns and valid actions", () => {
    for (const d of [1, 2, 4, 6, 8])
      for (const rows of Object.values(tables(d)))
        for (const cells of Object.values(rows)) {
          expect(cells).toHaveLength(10);
          expect(
            cells.every((c) => ["H", "S", "Dh", "Ds", "P"].includes(c)),
          ).toBe(true);
        }
    expect(tables(4)).toEqual(tables(6));
    expect(tables(6)).toEqual(tables(8));
  });
  it("retains verified deck-dependent doubles and fallback distinctions", () => {
    expect(tables(1).hard[8]).toEqual([
      "H",
      "H",
      "H",
      "Dh",
      "Dh",
      "H",
      "H",
      "H",
      "H",
      "H",
    ]);
    expect(tables(2).hard[11]![9]).toBe("Dh");
    expect(tables(6).hard[11]![9]).toBe("H");
    expect(tables(6).soft[18]![1]).toBe("Ds");
    expect(tables(1).pair[7]![8]).toBe("S");
  });
  it("does not look at hidden/future cards and counts a balanced shoe to zero", () => {
    const cards = deck(6);
    expect(cards.reduce((n, c) => n + weight(c), 0)).toBe(0);
    const hand = cards
      .filter((c) => c.rank === "A" || c.rank === "7")
      .slice(0, 2);
    const dealer = cards.find((c) => c.rank === "6")!;
    const before = strategyCell(hand, dealer, 6);
    cards.reverse();
    expect(strategyCell(hand, dealer, 6)).toEqual(before);
  });
});
it("supports twelve resulting hands and four-hand limit in every position", () => {
  const env = mockEnvironment(seeded(9));
  let s = initialState(env);
  const cards = s.shoe.cards,
    eights = cards.filter((c) => c.rank === "8"),
    six = cards.find((c) => c.rank === "6")!,
    ten = cards.find((c) => c.rank === "10")!;
  const first = [
    ...eights.slice(0, 3),
    six,
    ...eights.slice(3, 6),
    ten,
    ...eights.slice(6),
  ];
  s.shoe.cards = [
    ...first,
    ...cards.filter((c) => !first.some((x) => x.id === c.id)),
  ];
  s.balance = 10000;
  s.ledgerBase = 8000;
  for (let p = 0; p < 3; p++)
    s = applyCommand(
      s,
      { type: "chip", position: p, kind: "main", chip: 25 },
      env,
    );
  s = applyCommand(s, { type: "deal" }, env);
  let max = 0;
  while (s.round!.phase === "player") {
    max = Math.max(max, s.round!.hands.length);
    const choices = legalActions(s);
    s = applyCommand(
      s,
      {
        type: "action",
        action: choices.includes("split") ? "split" : "stand",
        handId: s.round!.active!,
      },
      env,
    );
  }
  expect(s.round!.hands).toHaveLength(12);
  expect(max).toBe(12);
  expect(
    s.round!.positions.every(
      (p) => s.round!.hands.filter((h) => h.position === p.index).length === 4,
    ),
  ).toBe(true);
  assertState(s);
});
it("emergency exhaustion refunds committed main wagers without changing already paid side bets", () => {
  const env = mockEnvironment(seeded(11));
  let s = initialState(env);
  const chosen: typeof s.shoe.cards = [];
  for (const rank of ["8", "6", "8", "10"]) {
    chosen.push(
      s.shoe.cards.find(
        (c) => c.rank === rank && !chosen.some((x) => x.id === c.id),
      )!,
    );
  }
  s.shoe.cards = [
    ...chosen,
    ...s.shoe.cards.filter((c) => !chosen.some((x) => x.id === c.id)),
  ];
  s = applyCommand(
    s,
    { type: "chip", position: 0, kind: "main", chip: 25 },
    env,
  );
  s = applyCommand(
    s,
    { type: "chip", position: 0, kind: "pairs", chip: 5 },
    env,
  );
  s = applyCommand(s, { type: "deal" }, env);
  if (s.round!.phase === "insurance")
    s = applyCommand(
      s,
      { type: "insurance", position: 0, choice: "decline" },
      env,
    );
  expect(s.round!.phase).toBe("player");
  const side = s.round!.sideResults[0]!.net;
  s.shoe.cursor = s.shoe.cards.length;
  s = applyCommand(
    s,
    { type: "action", action: "hit", handId: s.round!.active! },
    env,
  );
  expect(s.round!.phase).toBe("canceled");
  expect(s.balance).toBe(2000 + side);
  expect(s.totals.hands).toBe(0);
  expect(s.shoe.pending).toBe(true);
  expect(s.round!.hands.every((h) => h.net === 0)).toBe(true);
});
