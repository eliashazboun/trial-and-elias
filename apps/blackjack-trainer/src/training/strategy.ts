import { evaluate, value } from "../engine/cards";
import { activeHand, legalActions } from "../engine/engine";
import type { Action, Card, GameState, Hand } from "../engine/types";
export const STRATEGY_VERSION = "s17-das-no-surrender-2026.1";
export type Cell = "H" | "S" | "Dh" | "Ds" | "P";
export const upcards = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "A"];
const row = (s: string) => s.split(" ") as Cell[];
const multi = {
  hard: {
    8: row("H H H H H H H H H H"),
    9: row("H Dh Dh Dh Dh H H H H H"),
    10: row("Dh Dh Dh Dh Dh Dh Dh Dh H H"),
    11: row("Dh Dh Dh Dh Dh Dh Dh Dh Dh H"),
    12: row("H H S S S H H H H H"),
    13: row("S S S S S H H H H H"),
    14: row("S S S S S H H H H H"),
    15: row("S S S S S H H H H H"),
    16: row("S S S S S H H H H H"),
    17: row("S S S S S S S S S S"),
  },
  soft: {
    13: row("H H H Dh Dh H H H H H"),
    14: row("H H H Dh Dh H H H H H"),
    15: row("H H Dh Dh Dh H H H H H"),
    16: row("H H Dh Dh Dh H H H H H"),
    17: row("H Dh Dh Dh Dh H H H H H"),
    18: row("S Ds Ds Ds Ds S S H H H"),
    19: row("S S S S S S S S S S"),
  },
  pair: {
    2: row("P P P P P P H H H H"),
    3: row("P P P P P P H H H H"),
    4: row("H H H P P H H H H H"),
    6: row("P P P P P H H H H H"),
    7: row("P P P P P P H H H H"),
    8: row("P P P P P P P P P P"),
    9: row("P P P P P S P P S S"),
    11: row("P P P P P P P P P P"),
  },
};
export function tables(decks: number) {
  const t = structuredClone(multi) as {
    hard: Record<number, Cell[]>;
    soft: Record<number, Cell[]>;
    pair: Record<number, Cell[]>;
  };
  if (decks <= 2) {
    t.hard[9] = row("Dh Dh Dh Dh Dh H H H H H");
    t.hard[11] = row("Dh Dh Dh Dh Dh Dh Dh Dh Dh Dh");
    t.soft[14] = row("H H Dh Dh Dh H H H H H");
    t.pair[6] = row("P P P P P P H H H H");
    t.pair[7] = row("P P P P P P P H H H");
  }
  if (decks === 1) {
    t.hard[8] = row("H H H Dh Dh H H H H H");
    t.soft[13] = row("H H Dh Dh Dh H H H H H");
    t.soft[17] = row("Dh Dh Dh Dh Dh H H H H H");
    t.soft[18] = row("S Ds Ds Ds Ds S S H H S");
    t.soft[19] = row("S S S S Ds S S S S S");
    t.pair[3] = row("P P P P P P P H H H");
    t.pair[4] = row("H H P P P H H H H H");
    t.pair[7] = row("P P P P P P P S S H");
  }
  return t;
}
export function strategyCell(
  cards: Card[],
  dealer: Card,
  decks: number,
  allowPair = true,
): { cell: Cell; category: "pair" | "soft" | "hard"; total: number } {
  const e = evaluate(cards, false),
    t = tables(decks),
    index = value(dealer) === 11 ? 9 : value(dealer) - 2;
  const pair = e.pair && allowPair ? t.pair[value(cards[0]!)] : undefined;
  if (pair && (pair[index] === "P" || pair[index] === "S"))
    return { cell: pair[index]!, category: "pair", total: value(cards[0]!) };
  const table = e.soft ? t.soft : t.hard;
  let cell = table[e.total]?.[index];
  if (!cell) cell = e.total >= 17 ? "S" : "H";
  if (e.soft && e.total >= 19) cell = t.soft[e.total]?.[index] ?? "S"; // Total-dependent convention: double-deck multi-card soft 18 vs ace stands.
  if (
    decks === 2 &&
    e.soft &&
    e.total === 18 &&
    cards.length > 2 &&
    value(dealer) === 11
  )
    cell = "S";
  return { cell, category: e.soft ? "soft" : "hard", total: e.total };
}
const action = (cell: Cell): Action =>
  cell === "P"
    ? "split"
    : cell === "S"
      ? "stand"
      : cell === "Dh" || cell === "Ds"
        ? "double"
        : "hit";
export function recommend(
  s: GameState,
  hand: Hand | undefined = activeHand(s),
) {
  if (!hand || !s.round) return null;
  const dealer = s.round.dealer[0]!,
    idealCell = strategyCell(hand.cards, dealer, s.round.rules.decks);
  const legal = legalActions(s, false),
    affordable = legalActions(s);
  let ideal = action(idealCell.cell);
  let fallback = idealCell.cell === "Ds" ? "stand" : "hit";
  if (ideal === "split") {
    const c = strategyCell(hand.cards, dealer, s.round.rules.decks, false).cell;
    fallback = action(c);
    if (fallback === "double" && !affordable.includes("double"))
      fallback = c === "Ds" ? "stand" : "hit";
  }
  if (hand.splitAce && !affordable.includes("split")) fallback = "stand";
  if (!legal.includes(ideal) && ideal !== "split" && ideal !== "double")
    ideal = affordable[0] ?? "stand";
  const available = affordable.includes(ideal)
    ? ideal
    : affordable.includes(fallback as Action)
      ? (fallback as Action)
      : "stand";
  return {
    ...idealCell,
    ideal,
    available,
    legal,
    affordable,
    constrained: ideal !== available,
    explanation: `${evaluate(hand.cards, false).soft ? "Soft" : "Hard"} ${evaluate(hand.cards, false).total} against dealer ${dealer.rank}: ${ideal.toUpperCase()} under the ${s.round.rules.decks}-deck S17/DAS chart.${ideal !== available ? ` ${available.toUpperCase()} is the available alternative because of the hand rules, split limit or chip balance.` : ""} This evaluates the decision, not the eventual outcome.`,
  };
}
