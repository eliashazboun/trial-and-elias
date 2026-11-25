import type { Card, Rank, Suit, Environment, Shoe } from "./types";
export const ranks: Rank[] = [
  "A",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
];
export const suits: Suit[] = ["spades", "hearts", "diamonds", "clubs"];
export const symbols: Record<Suit, string> = {
  spades: "♠",
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
};
export function deck(decks: number, id = "shoe"): Card[] {
  return Array.from({ length: decks }, (_, deckIndex) =>
    suits.flatMap((suit) =>
      ranks.map((rank) => ({
        id: `${id}:${deckIndex}:${suit}:${rank}`,
        rank,
        suit,
        deckIndex,
      })),
    ),
  ).flat();
}
export function secureInt(max: number) {
  if (!Number.isSafeInteger(max) || max < 1 || max > 4294967296)
    throw Error("Invalid random bound");
  const limit = Math.floor(4294967296 / max) * max;
  const bytes = new Uint32Array(1);
  do {
    crypto.getRandomValues(bytes);
  } while (bytes[0]! >= limit);
  return bytes[0]! % max;
}
export function shuffled<T>(items: T[], randomInt: (max: number) => number) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}
export function freshShoe(decks: number, env: Environment): Shoe {
  const id = env.id();
  return {
    id,
    cards: shuffled(deck(decks, id), env.randomInt),
    cursor: 0,
    revealed: [],
    running: 0,
    pending: false,
  };
}
export const value = (c: Card) =>
  c.rank === "A" ? 11 : ["J", "Q", "K"].includes(c.rank) ? 10 : Number(c.rank);
export function evaluate(cards: Card[], natural = true) {
  const hard = cards.reduce((a, c) => a + (c.rank === "A" ? 1 : value(c)), 0);
  const soft = cards.some((c) => c.rank === "A") && hard + 10 <= 21;
  const total = hard + (soft ? 10 : 0);
  return {
    hard,
    soft,
    total,
    bust: total > 21,
    natural: natural && cards.length === 2 && total === 21,
    pair: cards.length === 2 && value(cards[0]!) === value(cards[1]!),
  };
}
export const weight = (c: Card) =>
  value(c) >= 10 ? -1 : value(c) <= 6 ? 1 : 0;
export function trueCount(shoe: Shoe) {
  const decks = (shoe.cards.length - shoe.cursor) / 52;
  return decks > 0 ? shoe.running / decks : 0;
}
export function seeded(seed: number) {
  return (max: number) => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return Math.floor((((t ^ (t >>> 14)) >>> 0) / 4294967296) * max);
  };
}
