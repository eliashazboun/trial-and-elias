import { it, expect } from "vitest";
import {
  initialState,
  mockEnvironment,
  applyCommand,
  projection,
} from "../src/engine/engine";
import { seeded } from "../src/engine/cards";
import { tableLayout } from "../src/phaser/layout";
import { resultLabel } from "../src/components/WagerVisual";
import { validateState } from "../src/storage/validation";
it.each([
  [50, "WIN", "+$25"],
  [-100, "LOSS", "-$50"],
  [0, "PUSH", "PUSH"],
  [75, "BLACKJACK", "BLACKJACK! +$37.5"],
  [0, "REFUNDED", "REFUNDED"],
])(
  "formats actual net %s independently of returned stake",
  (net, outcome, label) => {
    expect(resultLabel(net as number, outcome as string)).toBe(label);
  },
);
it("anchors wagers and totals to actual card bounds across seats, splits and long fans", () => {
  const s = initialState(mockEnvironment(seeded(11)));
  const hands = Array.from({ length: 12 }, (_, i) => ({
    id: "h" + i,
    position: Math.floor(i / 4),
    cards: s.shoe.cards.slice(i * 2, i * 2 + 2),
    stake: i === 0 ? 100 : 50,
    split: true,
    splitAce: false,
    doubled: i === 0,
    done: i < 11,
  }));
  const view = {
    dealer: [s.shoe.cards[32]!, null],
    hands,
    active: "h11",
    phase: "player" as const,
    running: 0,
    remaining: 200,
  };
  for (const [width, height] of [
    [1404, 780],
    [382, 700],
    [352, 660],
    [832, 322],
    [760, 900],
  ]) {
    const layout = tableLayout(width!, height!, s, view, true);
    for (const h of layout.hands) {
      const left = Math.min(...h.cards.map((c) => c.x)),
        right = Math.max(...h.cards.map((c) => c.x + c.width)),
        bottom = Math.max(...h.cards.map((c) => c.y + c.height));
      expect(h.wager.x).toBeCloseTo((left + right) / 2);
      expect(h.wager.y).toBeLessThan(h.cards[0]!.y);
      expect(h.total.x + h.total.width / 2).toBeCloseTo(h.wager.x);
      expect(h.total.y).toBeGreaterThan(bottom);
      expect(h.total.y + h.total.height).toBeLessThanOrEqual(height!);
      expect(h.result.y + h.result.height).toBeLessThan(h.cards[0]!.y);
    }
  }
  const hand = { ...hands[0]!, cards: s.shoe.cards.slice(0, 8) };
  const layout = tableLayout(
    800,
    700,
    s,
    { ...view, hands: [hand], active: hand.id },
    true,
  );
  const h = layout.hands[0]!;
  expect(h.total.y).toBeGreaterThan(
    Math.max(...h.cards.map((c) => c.y + c.height)),
  );
});
it("projects side settlements in event order and remains compatible with older saves", () => {
  const env = mockEnvironment(seeded(18));
  let s = initialState(env);
  for (const kind of ["main", "pairs", "three"] as const)
    s = applyCommand(
      s,
      { type: "chip", position: 0, kind, chip: kind === "main" ? 25 : 5 },
      env,
    );
  s = applyCommand(s, { type: "deal" }, env);
  expect(
    s.round!.events.filter((e) => e.type === "card")[0]!.snapshot.sideResults,
  ).toHaveLength(0);
  expect(
    s
      .round!.events.filter((e) => e.type === "side")
      .map((e) => e.snapshot.sideResults!.length),
  ).toEqual([1, 2]);
  expect(projection(s.round!, s.shoe).sideResults).toEqual(
    s.round!.sideResults,
  );
  const old = JSON.parse(JSON.stringify(s));
  for (const e of old.round.events) delete e.snapshot.sideResults;
  expect(validateState(old).balance).toBe(s.balance);
});
