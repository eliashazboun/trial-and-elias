import type { Card } from "./types";
import { ranks } from "./cards";
const red = (c: Card) => c.suit === "hearts" || c.suit === "diamonds";
export function perfectPairs(a: Card, b: Card) {
  if (a.rank !== b.rank) return { category: "No pair", ratio: 0 };
  if (a.suit === b.suit) return { category: "Perfect pair", ratio: 25 };
  return red(a) === red(b)
    ? { category: "Colored pair", ratio: 12 }
    : { category: "Mixed pair", ratio: 6 };
}
export function twentyOneThree(a: Card, b: Card, c: Card) {
  const cards = [a, b, c];
  const sameRank = cards.every((x) => x.rank === a.rank);
  const flush = cards.every((x) => x.suit === a.suit);
  const ns = cards.map((x) => ranks.indexOf(x.rank) + 1).sort((a, b) => a - b);
  const straight =
    (ns[0]! + 1 === ns[1] && ns[1]! + 1 === ns[2]) ||
    ns.join(",") === "1,12,13";
  if (sameRank && flush) return { category: "Suited trips", ratio: 100 };
  if (straight && flush) return { category: "Straight flush", ratio: 40 };
  if (sameRank) return { category: "Three of a kind", ratio: 30 };
  if (straight) return { category: "Straight", ratio: 10 };
  if (flush) return { category: "Flush", ratio: 5 };
  return { category: "No combination", ratio: 0 };
}
export function mainOutcome(
  player: Card[],
  dealer: Card[],
  stake: number,
  split = false,
  even = false,
) {
  const p = evalHand(player, !split),
    d = evalHand(dealer, true);
  if (even) return { outcome: "EVEN MONEY", returned: stake * 2, net: stake };
  if (p.bust) return { outcome: "BUST", returned: 0, net: -stake };
  if (d.natural)
    return p.natural
      ? { outcome: "PUSH", returned: stake, net: 0 }
      : { outcome: "LOSE", returned: 0, net: -stake };
  if (p.natural)
    return {
      outcome: "BLACKJACK",
      returned: (stake * 5) / 2,
      net: (stake * 3) / 2,
    };
  if (d.bust || p.total > d.total)
    return { outcome: "WIN", returned: stake * 2, net: stake };
  if (p.total === d.total) return { outcome: "PUSH", returned: stake, net: 0 };
  return { outcome: "LOSE", returned: 0, net: -stake };
}
import { evaluate as evalHand } from "./cards";
