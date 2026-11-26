import { z } from "zod";
import { assertState } from "../engine/engine";
import { emptyCountTraining } from "../engine/types";
import type { GameState } from "../engine/types";
const card = z.object({
  id: z.string().max(200),
  rank: z.enum([
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
  ]),
  suit: z.enum(["hearts", "diamonds", "clubs", "spades"]),
  deckIndex: z.number().int().min(0).max(7),
});
const units = z.number().int().safe();
const nonnegative = units.nonnegative();
const rule = z.object({
  decks: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(4),
    z.literal(6),
    z.literal(8),
  ]),
  penetration: z.number().min(0.5).max(0.9),
  pairs: z.boolean(),
  three: z.boolean(),
  version: z.literal("s17-das-v1"),
});
const bet = z.object({
  main: z.array(z.number()).max(50000),
  pairs: z.array(z.number()).max(100),
  three: z.array(z.number()).max(100),
});
const hand = z.object({
  id: z.string(),
  parentId: z.string().optional(),
  position: z.number().int().min(0).max(2),
  cards: z.array(card).max(52),
  stake: nonnegative.max(200000),
  split: z.boolean(),
  splitAce: z.boolean(),
  doubled: z.boolean(),
  done: z.boolean(),
  outcome: z.string().optional(),
  net: units.optional(),
});
const projection = z.object({
  sideResults: z
    .array(
      z.object({
        position: z.number().int().min(0).max(2),
        kind: z.enum(["pairs", "three"]),
        category: z.string(),
        ratio: z.number().finite(),
        stake: nonnegative,
        net: units,
        cards: z.array(card).max(3),
      }),
    )
    .optional(),
  running: units,
  remaining: nonnegative,
  dealer: z.array(card.nullable()).max(52),
  hands: z.array(hand).max(12),
  active: z.string().nullable(),
  phase: z.enum(["insurance", "player", "complete", "canceled"]),
});
const assistance = z.object({
  recommendation: z.boolean(),
  strategyEnabled: z.boolean().optional(),
  chart: z.boolean(),
  explanation: z.boolean(),
  warning: z.boolean(),
  weights: z.boolean(),
  running: z.boolean(),
  trueCount: z.boolean(),
  exactShoe: z.boolean(),
});
const decision = z.object({
  id: z.string(),
  roundId: z.string(),
  sessionId: z.string(),
  time: z.number().finite(),
  position: z.number().int().min(0).max(2),
  handId: z.string(),
  cards: z.array(card).max(52),
  dealer: card,
  category: z.enum(["hard", "soft", "pair", "insurance"]),
  total: z.number().finite(),
  decks: z.number(),
  rulesVersion: z.string(),
  tableVersion: z.string(),
  legal: z.array(z.string()),
  affordable: z.array(z.string()),
  ideal: z.string(),
  available: z.string(),
  selected: z.string(),
  firstSelected: z.string(),
  constrained: z.boolean(),
  correct: z.boolean(),
  assistance,
  durationMs: z.number().finite().nonnegative(),
});
const round = z.object({
  id: z.string(),
  sessionId: z.string(),
  shoeId: z.string(),
  time: z.number().finite(),
  rules: rule,
  positions: z
    .array(
      z.object({
        index: z.number().int().min(0).max(2),
        original: z.array(card).max(2),
        bet,
        insurance: nonnegative,
        insuranceChoice: z.enum(["decline", "insurance", "even"]).optional(),
        even: z.boolean(),
      }),
    )
    .max(3),
  hands: z.array(hand).max(12),
  dealer: z.array(card).max(52),
  holeRevealed: z.boolean(),
  active: z.string().nullable(),
  phase: z.enum(["insurance", "player", "complete", "canceled"]),
  sideResults: z
    .array(
      z.object({
        position: z.number(),
        kind: z.enum(["pairs", "three"]),
        category: z.string(),
        ratio: z.number().nonnegative(),
        stake: nonnegative,
        net: units,
        cards: z.array(card).max(3),
      }),
    )
    .max(6),
  events: z
    .array(
      z.object({
        id: z.string(),
        type: z.string(),
        text: z.string(),
        handId: z.string().optional(),
        card: card.optional(),
        hidden: z.boolean().optional(),
        snapshot: projection,
      }),
    )
    .max(500),
  decisions: z.array(decision).max(300),
  startBalance: nonnegative,
  net: units,
  cancelReason: z.string().optional(),
});
const totals = z
  .object({
    categories: z.record(
      z.string(),
      z.object({ attempts: nonnegative, correct: nonnegative }),
    ),
  })
  .catchall(z.number().finite());
const schema = z.object({
  countTraining: z
    .object({
      visible: z.boolean(),
      hiddenRounds: nonnegative,
      eligibleRoundId: z.string().nullable(),
      peekId: z.string().nullable(),
      lastPenalty: z
        .object({
          id: z.string(),
          time: z.number().finite(),
          amount: nonnegative.max(200),
          clearedBets: z.boolean(),
        })
        .nullable(),
      lastGuess: z
        .object({
          id: z.string(),
          time: z.number().finite(),
          submitted: units,
          correct: z.boolean(),
        })
        .nullable(),
    })
    .default(emptyCountTraining),
  reviewed: z
    .record(
      z.string(),
      z.object({ attempts: nonnegative, correct: nonnegative }),
    )
    .default({}),
  historyBytes: nonnegative.default(0),
  adReceipts: z.array(z.string().max(300)).max(100000).default([]),
  schema: z.literal(1),
  revision: nonnegative,
  balance: nonnegative,
  ledgerBase: units,
  ledger: z
    .array(
      z.object({
        id: z.string(),
        time: z.number().finite(),
        kind: z.string(),
        amount: units,
        roundId: z.string().optional(),
        handId: z.string().optional(),
        key: z.string(),
      }),
    )
    .max(20000),
  lastClaim: z.number().finite().nonnegative(),
  lastClock: z.number().finite().nonnegative(),
  rules: rule,
  pendingRules: rule.nullable(),
  shoe: z.object({
    id: z.string(),
    cards: z.array(card).min(52).max(416),
    cursor: nonnegative,
    revealed: z.array(z.string()).max(416),
    running: units,
    pending: z.boolean(),
  }),
  bets: z.array(bet).length(3),
  undo: z.array(z.array(bet).length(3)).max(200),
  previousBets: z.array(bet).length(3),
  round: round.nullable(),
  history: z.array(round).max(5000),
  checks: z
    .array(
      z.object({
        id: z.string(),
        time: z.number().finite(),
        kind: z.enum(["running", "true"]),
        submitted: z.number().finite().nullable(),
        actual: z.number().finite(),
        error: z.number().finite().nullable(),
        correct: z.boolean(),
        assisted: z.boolean(),
        revealed: z.boolean(),
        durationMs: z.number().finite().nonnegative(),
        decks: z.number(),
        penetration: z.number(),
        sessionId: z.string(),
      }),
    )
    .max(5000),
  sessions: z
    .array(
      z.object({
        id: z.string(),
        start: z.number().finite(),
        end: z.number().finite().optional(),
        last: z.number().finite(),
        rounds: nonnegative,
        hands: nonnegative,
        net: units,
        rewards: nonnegative,
      }),
    )
    .max(10000),
  sessionId: z.string(),
  totals,
  achievements: z.record(z.string(), z.number()),
  tutorials: z.array(z.string()).max(20),
  retention: z.number().min(100).max(5000),
});
export function validateState(raw: unknown): GameState {
  const parsed = schema.parse(raw) as unknown as GameState;
  const keys = [
    "rounds",
    "positions",
    "hands",
    "wins",
    "losses",
    "pushes",
    "naturals",
    "busts",
    "dealerBusts",
    "dealerNaturals",
    "doubles",
    "splits",
    "cards",
    "shuffles",
    "mainStaked",
    "sideStaked",
    "insuranceStaked",
    "mainNet",
    "sideNet",
    "insuranceNet",
    "rewards",
    "decisions",
    "correct",
    "independent",
    "independentCorrect",
    "counts",
    "countCorrect",
  ];
  if (
    keys.some(
      (k) =>
        !Number.isFinite(
          (parsed.totals as unknown as Record<string, number>)[k],
        ),
    )
  )
    throw Error("Missing aggregate values");
  if (parsed.shoe.cards.length !== parsed.rules.decks * 52)
    throw Error("Invalid shoe size");
  if (!parsed.sessions.some((s) => s.id === parsed.sessionId))
    throw Error("Missing session");
  parsed.historyBytes = parsed.history.reduce(
    (total, round) =>
      total + new TextEncoder().encode(JSON.stringify(round)).byteLength,
    0,
  );
  if (parsed.historyBytes > 30 * 1024 * 1024)
    throw Error("Detailed history exceeds backup budget");
  assertState(parsed);
  return parsed;
}
export function parseBackup(text: string) {
  if (text.length > 30 * 1024 * 1024)
    throw Error("Backup exceeds the 30 MB limit");
  const payload = z
    .object({
      format: z.literal("trial-elias-blackjack"),
      schema: z.literal(1),
      version: z.string(),
      exported: z.string(),
      state: z.unknown(),
      preferences: z.unknown(),
    })
    .parse(JSON.parse(text));
  return { ...payload, state: validateState(payload.state) };
}
