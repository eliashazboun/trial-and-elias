import { describe, it, expect } from "vitest";
import { deck, evaluate, seeded, shuffled, weight } from "../src/engine/cards";
import {
  applyCommand,
  initialState,
  legalActions,
  mockEnvironment,
  assertState,
} from "../src/engine/engine";
import {
  perfectPairs,
  twentyOneThree,
  mainOutcome,
} from "../src/engine/payouts";
import type { Card, GameState, Rank, Command } from "../src/engine/types";
const card = (
  rank: Rank,
  suit: Card["suit"] = "spades",
  deckIndex = 0,
): Card => ({ id: `${rank}:${suit}:${deckIndex}`, rank, suit, deckIndex });
function fixture(ranks: Rank[], decks = 6) {
  const e = mockEnvironment(seeded(1));
  let s = initialState(e);
  s.rules.decks = decks as 6;
  s.shoe.cards = deck(decks, s.shoe.id);
  const selected: Card[] = [];
  for (const rank of ranks) {
    const i = s.shoe.cards.findIndex(
      (c) => c.rank === rank && !selected.some((x) => x.id === c.id),
    );
    selected.push(s.shoe.cards[i]!);
  }
  s.shoe.cards = [
    ...selected,
    ...s.shoe.cards.filter((c) => !selected.some((x) => x.id === c.id)),
  ];
  return { s, e, run: (cmd: Command) => (s = applyCommand(s, cmd, e)) };
}
const bet = (f: ReturnType<typeof fixture>, position = 0, amount = 25) =>
  f.run({ type: "chip", position, kind: "main", chip: amount });
describe("physical shoe and evaluator", () => {
  for (const n of [1, 2, 4, 6, 8])
    it(`${n} decks have unique physical cards and balanced Hi-Lo`, () => {
      const cards = deck(n);
      expect(cards).toHaveLength(n * 52);
      expect(new Set(cards.map((c) => c.id)).size).toBe(n * 52);
      expect(cards.reduce((a, c) => a + weight(c), 0)).toBe(0);
      expect(
        shuffled(cards, seeded(5))
          .map((c) => c.id)
          .sort(),
      ).toEqual(cards.map((c) => c.id).sort());
    });
  it.each([
    ["A,A,5", 17, true],
    ["A,6,10", 17, false],
    ["A,A,9", 21, true],
    ["K,Q,2", 22, false],
  ])("evaluates %s", (r, total, soft) => {
    expect(evaluate(r.split(",").map((x) => card(x as Rank)))).toMatchObject({
      total,
      soft,
    });
  });
  it("natural only on original two-card 21", () => {
    expect(evaluate([card("A"), card("K")], false).natural).toBe(false);
  });
});
describe("exact payouts", () => {
  it("odd whole-chip blackjack produces a legitimate half chip", () => {
    expect(
      mainOutcome([card("A"), card("K")], [card("10"), card("9")], 50),
    ).toEqual({ outcome: "BLACKJACK", returned: 125, net: 75 });
  });
  it("natural beats ordinary 21, split 21 pushes it, and bust never wins", () => {
    const p = [card("A"), card("K")],
      d = [card("7"), card("7", "clubs"), card("7", "hearts")];
    expect(mainOutcome(p, d, 50).net).toBe(75);
    expect(mainOutcome(p, d, 50, true).net).toBe(0);
    expect(
      mainOutcome(
        [card("K"), card("Q"), card("2")],
        [card("K"), card("Q"), card("3")],
        50,
      ).net,
    ).toBe(-50);
  });
  it("Perfect Pairs ranks and colors are exact", () => {
    expect(perfectPairs(card("K"), card("K", "spades", 1)).ratio).toBe(25);
    expect(perfectPairs(card("K", "hearts"), card("K", "diamonds")).ratio).toBe(
      12,
    );
    expect(perfectPairs(card("K"), card("K", "hearts")).ratio).toBe(6);
    expect(perfectPairs(card("K"), card("Q")).ratio).toBe(0);
  });
  it.each([
    ["A,2,3", 40],
    ["Q,K,A", 40],
    ["K,A,2", 5],
    ["7,7,7", 100],
  ])("21+3 %s pays one category", (rs, ratio) => {
    const c = rs.split(",").map((r, i) => card(r as Rank, "spades", i));
    expect(twentyOneThree(c[0]!, c[1]!, c[2]!).ratio).toBe(ratio);
  });
});
describe("engine and wallet", () => {
  it("reserves without debiting and atomically undoes/doubles/rebets", () => {
    const f = fixture([]);
    bet(f);
    expect(f.run({ type: "doubleBet" }).balance).toBe(2000);
    expect(f.run({ type: "undo" }).bets[0]!.main).toEqual([25]);
    expect(f.run({ type: "clear" }).bets[0]!.main).toEqual([]);
  });
  it("excludes hidden card and reveals it once; S17 does not draw", () => {
    const f = fixture(["10", "A", "8", "6"]);
    bet(f);
    let s = f.run({ type: "deal" });
    expect(s.round!.phase).toBe("insurance");
    expect(s.shoe.revealed).toHaveLength(3);
    expect(s.shoe.running).toBe(-2);
    s = f.run({ type: "insurance", position: 0, choice: "decline" });
    s = f.run({ type: "action", action: "stand", handId: s.round!.active! });
    expect(s.shoe.cursor).toBe(4);
    expect(s.round!.dealer.map((c) => c.rank)).toEqual(["A", "6"]);
    expect(s.shoe.revealed).toHaveLength(4);
    expect(s.shoe.running).toBe(-1);
    expect(s.balance).toBe(2050);
    expect(() =>
      f.run({ type: "action", action: "stand", handId: "old" }),
    ).toThrow();
  });
  it("insurance and natural push return exact odd-chip amounts", () => {
    const f = fixture(["A", "A", "K", "K"]);
    bet(f);
    f.run({ type: "deal" });
    const s = f.run({ type: "insurance", position: 0, choice: "insurance" });
    expect(s.balance).toBe(2050);
    expect(s.round!.hands[0]!.outcome).toBe("PUSH");
  });
  it("even money is independent of dealer blackjack and never also insures", () => {
    for (const hole of ["K", "6"] as Rank[]) {
      const f = fixture(["A", "A", "K", hole]);
      bet(f);
      f.run({ type: "deal" });
      const s = f.run({ type: "insurance", position: 0, choice: "even" });
      expect(s.balance).toBe(2050);
      expect(s.round!.positions[0]!.insurance).toBe(0);
    }
  });
  it("splits mixed tens, sequential replacements and doubles after split", () => {
    const f = fixture(["K", "6", "Q", "10", "2", "9", "8", "5"]);
    bet(f);
    let s = f.run({ type: "deal" });
    expect(legalActions(s)).toContain("split");
    s = f.run({ type: "action", action: "split", handId: s.round!.active! });
    expect(s.round!.hands[1]!.cards).toHaveLength(1);
    s = f.run({ type: "action", action: "double", handId: s.round!.active! });
    expect(s.round!.hands[0]!.cards).toHaveLength(3);
    expect(s.round!.hands[1]!.cards).toHaveLength(2);
  });
  it("split ace restriction auto-finishes non-pairs, no natural bonus", () => {
    const f = fixture(["A", "6", "A", "10", "K", "Q", "8"]);
    bet(f);
    let s = f.run({ type: "deal" });
    s = f.run({ type: "action", action: "split", handId: s.round!.active! });
    expect(s.round!.phase).toBe("complete");
    expect(s.round!.hands.every((h) => h.outcome === "WIN")).toBe(true);
    expect(s.balance).toBe(2100);
  });
  it("pending rule changes cannot alter active shoe or committed side bets", () => {
    const f = fixture(["10", "6", "8", "10"]);
    bet(f);
    let s = f.run({ type: "deal" });
    const id = s.shoe.id;
    s = f.run({ type: "rules", rules: { ...s.rules, decks: 1, pairs: false } });
    expect(s.rules.decks).toBe(6);
    expect(s.shoe.id).toBe(id);
    s = f.run({ type: "action", action: "stand", handId: s.round!.active! });
    s = f.run({ type: "next" });
    expect(s.rules.decks).toBe(1);
    expect(s.shoe.cards).toHaveLength(52);
  });
  it("hourly claims cannot be duplicated, accumulated or reset by a backwards clock", () => {
    const f = fixture([]);
    expect(() => f.run({ type: "claim" })).toThrow();
    f.e.now += 3600000;
    expect(f.run({ type: "claim" }).balance).toBe(4000);
    expect(() => f.run({ type: "claim" })).toThrow();
    f.e.now -= 7200000;
    expect(() => f.run({ type: "claim" })).toThrow();
  });
  it("three positions settle independently and snapshot round restoration preserves ledger", () => {
    const f = fixture(["10", "9", "8", "6", "9", "9", "9", "10", "5"]);
    for (let p = 0; p < 3; p++) bet(f, p);
    let s = f.run({ type: "deal" });
    const restored = JSON.parse(JSON.stringify(s)) as GameState;
    assertState(restored);
    while (s.round!.phase === "player")
      s = f.run({ type: "action", action: "stand", handId: s.round!.active! });
    expect(s.round!.hands).toHaveLength(3);
    assertState(s);
    expect(s.totals.hands).toBe(3);
  });
});
