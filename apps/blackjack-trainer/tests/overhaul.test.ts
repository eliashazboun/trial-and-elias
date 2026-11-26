import { describe, it, expect } from "vitest";
import { normalizeChips } from "../src/engine/chips";
import {
  applyCommand,
  initialState,
  mockEnvironment,
} from "../src/engine/engine";
import { seeded } from "../src/engine/cards";
import { money, sum } from "../src/engine/types";
import { tableLayout } from "../src/phaser/layout";
const setup = () => {
  const e = mockEnvironment(seeded(99));
  return { e, s: initialState(e) };
};
describe("presentation normalization preserves exact half-chip value", () => {
  it.each([
    [200, [100]],
    [1000, [500]],
    [2000, [1000]],
    [10000, [5000]],
    [12750, [5000, 1000, 100, 100, 100, 25, 25, 25]],
  ])("%i units normalize optimally", (units, chips) => {
    expect(normalizeChips(units as number).chips).toEqual(chips);
  });
  it("preserves arbitrary and half-chip amounts without wallet transactions", () => {
    const { s } = setup(),
      before = JSON.stringify(s);
    for (let units = 0; units < 100000; units += 73) {
      const result = normalizeChips(units);
      expect(sum(result.chips) + (result.halfChip ? 1 : 0)).toBe(units);
    }
    expect(JSON.stringify(s)).toBe(before);
    expect(normalizeChips(125)).toMatchObject({
      chips: [25, 25, 5, 5, 1, 1],
      halfChip: true,
    });
    expect(money(125)).toBe("62.5");
  });
});
describe("new wager contracts", () => {
  it("undo and spot removal follow placement history after consolidation", () => {
    const { s, e } = setup();
    let next = s;
    for (let i = 0; i < 4; i++)
      next = applyCommand(
        next,
        { type: "chip", position: 0, kind: "main", chip: 25 },
        e,
      );
    expect(normalizeChips(sum(next.bets[0]!.main)).chips).toEqual([100]);
    next = applyCommand(
      next,
      { type: "removeChip", position: 0, kind: "main" },
      e,
    );
    expect(sum(next.bets[0]!.main)).toBe(150);
    next = applyCommand(next, { type: "undo" }, e);
    expect(sum(next.bets[0]!.main)).toBe(200);
    next = applyCommand(next, { type: "undo" }, e);
    expect(sum(next.bets[0]!.main)).toBe(150);
  });
  it("supports 50,000 independently per position, rejects excess atomically and keeps side limit 100", () => {
    const { s, e } = setup();
    s.balance = 400000;
    s.ledgerBase = s.balance - 2000;
    let n = s;
    for (let p = 0; p < 3; p++)
      for (let c = 0; c < 10; c++)
        n = applyCommand(
          n,
          { type: "chip", position: p, kind: "main", chip: 5000 },
          e,
        );
    expect(n.bets.map((b) => sum(b.main))).toEqual([100000, 100000, 100000]);
    const before = JSON.stringify(n);
    expect(() =>
      applyCommand(n, { type: "chip", position: 0, kind: "main", chip: 1 }, e),
    ).toThrow();
    expect(JSON.stringify(n)).toBe(before);
    n = applyCommand(
      n,
      { type: "chip", position: 0, kind: "pairs", chip: 100 },
      e,
    );
    expect(() =>
      applyCommand(n, { type: "chip", position: 0, kind: "pairs", chip: 1 }, e),
    ).toThrow();
  });
  it("post-settlement rebet, doubled review and rebet/deal are atomic", () => {
    const { s, e } = setup();
    let n = applyCommand(
      s,
      { type: "chip", position: 0, kind: "main", chip: 25 },
      e,
    );
    n = applyCommand(n, { type: "deal" }, e);
    while (n.round!.phase !== "complete" && n.round!.phase !== "canceled") {
      n =
        n.round!.phase === "insurance"
          ? applyCommand(
              n,
              { type: "insurance", position: 0, choice: "decline" },
              e,
            )
          : applyCommand(
              n,
              { type: "action", action: "stand", handId: n.round!.active! },
              e,
            );
    }
    const settled = n;
    n = applyCommand(settled, { type: "doubleBet" }, e);
    expect(n.round).toBeNull();
    expect(sum(n.bets[0]!.main)).toBe(100);
    n = applyCommand(settled, { type: "rebetDeal" }, e);
    expect(n.round!.id).not.toBe(settled.round!.id);
    const poor = {
      ...settled,
      balance: 10,
      ledgerBase: settled.ledgerBase + 10 - settled.balance,
    };
    const before = JSON.stringify(poor);
    expect(() => applyCommand(poor, { type: "rebetDeal" }, e)).toThrow();
    expect(JSON.stringify(poor)).toBe(before);
    const disabled = {
      ...settled,
      rules: { ...settled.rules, pairs: false },
      previousBets: settled.previousBets.map((b, i) =>
        i ? b : { ...b, pairs: [5] },
      ),
    };
    expect(() => applyCommand(disabled, { type: "rebetDeal" }, e)).toThrow(
      "Side bet disabled",
    );
  });
});
it("shared layout keeps every hand, exposed annotation and active control in the table", () => {
  const { s } = setup();
  const hands = Array.from({ length: 12 }, (_, i) => ({
    id: "hand-" + i,
    position: Math.floor(i / 4),
    cards: s.shoe.cards.slice(i * 2, i * 2 + 2),
    stake: 50,
    split: true,
    splitAce: false,
    doubled: false,
    done: i < 11,
  }));
  const view = {
    dealer: [s.shoe.cards[30]!, null],
    hands,
    active: "hand-11",
    phase: "player" as const,
    running: 0,
    remaining: 286,
  };
  for (const [width, height] of [
    [1884, 980],
    [1404, 800],
    [1330, 668],
    [760, 914],
    [382, 733],
    [352, 689],
    [832, 322],
  ]) {
    const layout = tableLayout(width!, height!, s, view, true);
    expect(layout.hands).toHaveLength(12);
    expect(layout.hands.filter((h) => h.actions)).toHaveLength(1);
    for (const card of [
      ...layout.dealer,
      ...layout.hands.flatMap((h) => h.cards),
    ]) {
      expect(card.x).toBeGreaterThanOrEqual(0);
      expect(card.y).toBeGreaterThanOrEqual(0);
      expect(card.x + card.width).toBeLessThanOrEqual(width! + 1);
      expect(card.y + card.height).toBeLessThanOrEqual(height! + 1);
    }
    for (const hand of layout.hands) {
      if (hand.actions) {
        expect(hand.actions.y).toBeLessThan(hand.cards[0]!.y);
        expect(hand.actions.x + hand.actions.width).toBeLessThanOrEqual(width!);
      }
    }
  }
});
it("adds new shortcut defaults without resetting existing preferences or stealing custom keys", async () => {
  const { defaults, validatePreferences } = await import(
    "../src/config/preferences"
  );
  const keys: Record<string, string> = { ...defaults.shortcuts };
  delete keys.chip1000;
  delete keys.chip5000;
  keys.hit = "6";
  const legacy = {
    ...defaults,
    theme: "burgundy",
    weights: true,
    shortcuts: keys,
  };
  const restored = validatePreferences(legacy);
  expect(restored.theme).toBe("burgundy");
  expect(restored.weights).toBe(true);
  expect(restored.shortcuts.hit).toBe("6");
  expect(restored.shortcuts.chip1000).not.toBe("6");
  expect(Object.keys(legacy.shortcuts)).not.toContain("chip1000");
});
it("large monetary totals retain an exact grouped breakdown without allocating unbounded sprites", () => {
  const units = Number.MAX_SAFE_INTEGER;
  const result = normalizeChips(units);
  expect(result.chips.length).toBeLessThanOrEqual(256);
  expect(
    result.counts.reduce(
      (total, group) => total + group.denomination * 2 * group.count,
      0,
    ) + (result.halfChip ? 1 : 0),
  ).toBe(units);
});
