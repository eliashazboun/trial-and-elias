import { proficiency } from "../training/mastery";
import { evaluate, freshShoe, value, weight } from "./cards";
import { mainOutcome, perfectPairs, twentyOneThree } from "./payouts";
import {
  DEFAULT_RULES,
  betTotal,
  denominations,
  emptyBet,
  emptyCountTraining,
  pendingTotal,
  sum,
} from "./types";
import type {
  Action,
  Bet,
  Card,
  Command,
  Environment,
  GameState,
  Hand,
  Projection,
  Round,
  Rules,
  Totals,
} from "./types";
export const emptyTotals = (): Totals => ({
  rounds: 0,
  positions: 0,
  hands: 0,
  wins: 0,
  losses: 0,
  pushes: 0,
  naturals: 0,
  busts: 0,
  dealerBusts: 0,
  dealerNaturals: 0,
  doubles: 0,
  splits: 0,
  cards: 0,
  shuffles: 0,
  mainStaked: 0,
  sideStaked: 0,
  insuranceStaked: 0,
  mainNet: 0,
  sideNet: 0,
  insuranceNet: 0,
  rewards: 0,
  decisions: 0,
  correct: 0,
  independent: 0,
  independentCorrect: 0,
  counts: 0,
  countCorrect: 0,
  categories: {},
});
export function initialState(env: Environment): GameState {
  const sessionId = env.id();
  const s: GameState = {
    countTraining: emptyCountTraining(),
    schema: 1,
    revision: 0,
    balance: 0,
    ledgerBase: 0,
    ledger: [],
    lastClaim: env.now,
    lastClock: env.now,
    rules: { ...DEFAULT_RULES },
    pendingRules: null,
    shoe: freshShoe(6, env),
    bets: [emptyBet(), emptyBet(), emptyBet()],
    undo: [],
    previousBets: [emptyBet(), emptyBet(), emptyBet()],
    round: null,
    history: [],
    checks: [],
    sessions: [
      {
        id: sessionId,
        start: env.now,
        last: env.now,
        rounds: 0,
        hands: 0,
        net: 0,
        rewards: 0,
      },
    ],
    sessionId,
    totals: emptyTotals(),
    achievements: {},
    tutorials: [],
    reviewed: {},
    historyBytes: 0,
    retention: 5000,
    adReceipts: [],
  };
  ledger(s, env, "initial", 2000, "initial");
  return s;
}
export const between = (s: GameState) =>
  !s.round || ["complete", "canceled"].includes(s.round.phase);
export function projection(r: Round, shoe?: GameState["shoe"]): Projection {
  return {
    sideResults: structuredClone(r.sideResults),
    dealer: r.dealer.map((c, i) => (i === 1 && !r.holeRevealed ? null : c)),
    hands: structuredClone(r.hands),
    active: r.active,
    phase: r.phase,
    running: shoe?.running ?? 0,
    remaining: shoe ? shoe.cards.length - shoe.cursor : 0,
  };
}
function event(
  s: GameState,
  e: Environment,
  type: string,
  text: string,
  card?: Card,
  handId?: string,
  hidden = false,
) {
  const r = s.round!;
  r.events.push({
    id: e.id(),
    type,
    text,
    ...(card ? { card } : {}),
    ...(handId ? { handId } : {}),
    hidden,
    snapshot: projection(r, s.shoe),
  });
}
function ledger(
  s: GameState,
  e: Environment,
  kind: string,
  amount: number,
  key: string,
  handId?: string,
) {
  if (s.ledger.some((t) => t.key === key))
    throw Error("Duplicate transaction rejected");
  if (!Number.isSafeInteger(amount) || s.balance + amount < 0)
    throw Error("Insufficient chips or invalid accounting");
  s.balance += amount;
  s.ledger.push({
    id: e.id(),
    time: e.now,
    kind,
    amount,
    key,
    roundId: s.round?.id,
    handId,
  });
}
function expose(s: GameState, c: Card) {
  if (!s.shoe.revealed.includes(c.id)) {
    s.shoe.revealed.push(c.id);
    s.shoe.running += weight(c);
  }
}
class Exhausted extends Error {}
function draw(
  s: GameState,
  e: Environment,
  target: Hand | "dealer",
  hidden = false,
) {
  const c = s.shoe.cards[s.shoe.cursor];
  if (!c) throw new Exhausted();
  s.shoe.cursor++;
  s.totals.cards++;
  s.shoe.pending ||=
    s.shoe.cursor >= Math.floor(s.shoe.cards.length * s.rules.penetration);
  if (target === "dealer") s.round!.dealer.push(c);
  else target.cards.push(c);
  if (!hidden) expose(s, c);
  event(
    s,
    e,
    "card",
    hidden
      ? "Dealer receives a face-down card"
      : `${target === "dealer" ? "Dealer" : target.id}: ${c.rank} of ${c.suit}`,
    hidden ? undefined : c,
    target === "dealer" ? undefined : target.id,
    hidden,
  );
  return c;
}
function reveal(s: GameState, e: Environment) {
  const r = s.round!;
  if (r.holeRevealed) return;
  r.holeRevealed = true;
  if (r.dealer[1]) expose(s, r.dealer[1]);
  event(s, e, "reveal", "Dealer hole card revealed", r.dealer[1]);
}
export function legalActions(s: GameState, affordable = true): Action[] {
  const r = s.round;
  if (r?.phase !== "player") return [];
  const h = r.hands.find((h) => h.id === r.active);
  if (!h || h.done) return [];
  const pair = evaluate(h.cards).pair;
  const split =
    pair &&
    r.hands.filter((x) => x.position === h.position).length < 4 &&
    (!affordable || s.balance >= h.stake);
  if (h.splitAce) return split ? ["stand", "split"] : ["stand"];
  const actions: Action[] = ["hit", "stand"];
  if (h.cards.length === 2 && (!affordable || s.balance >= h.stake))
    actions.push("double");
  if (split) actions.push("split");
  return actions;
}
function markTotals(s: GameState, e: Environment) {
  const r = s.round!,
    t = s.totals;
  if (r.phase === "complete") {
    t.rounds++;
    t.positions += r.positions.length;
    t.hands += r.hands.length;
    for (const h of r.hands) {
      if ((h.net ?? 0) > 0) t.wins++;
      else if (h.net === 0) t.pushes++;
      else t.losses++;
      if (h.outcome === "BLACKJACK") t.naturals++;
      if (evaluate(h.cards, false).bust) t.busts++;
      if (h.doubled) t.doubles++;
    }
    t.splits += r.hands.length - r.positions.length;
    if (evaluate(r.dealer).bust) t.dealerBusts++;
    if (evaluate(r.dealer).natural) t.dealerNaturals++;
  }
  for (const d of r.decisions) {
    t.decisions++;
    if (d.correct) t.correct++;
    const assisted =
      d.assistance.recommendation ||
      d.assistance.chart ||
      d.assistance.explanation ||
      d.assistance.warning;
    if (!assisted) {
      t.independent++;
      if (d.correct) t.independentCorrect++;
      const category = (t.categories[d.category] ??= {
        attempts: 0,
        correct: 0,
      });
      category.attempts++;
      if (d.correct) category.correct++;
    }
  }
  const session = s.sessions.find((x) => x.id === r.sessionId)!;
  session.rounds++;
  session.hands += r.phase === "complete" ? r.hands.length : 0;
  session.net += r.net;
  session.last = e.now;
  s.history.push(structuredClone(r));
  s.historyBytes += new TextEncoder().encode(JSON.stringify(r)).byteLength;
  while (s.history.length > s.retention || s.historyBytes > 25 * 1024 * 1024) {
    s.historyBytes -= new TextEncoder().encode(
      JSON.stringify(s.history.shift()),
    ).byteLength;
  }
  unlock(s, e);
}
function unlock(s: GameState, e: Environment) {
  const award = (id: string, ok: boolean) => {
    if (ok && !s.achievements[id]) s.achievements[id] = e.now;
  };
  award("First Lesson", s.tutorials.includes("fundamentals"));
  award("Know the Basics", s.tutorials.includes("strategy"));
  for (const [category, name] of Object.entries({
    hard: "Hard Decisions",
    soft: "Soft Touch",
    pair: "Split Personality",
  })) {
    const c = s.totals.categories[category];
    award(
      name,
      !!c &&
        c.attempts >= proficiency.samples &&
        c.correct / c.attempts >= proficiency.accuracy,
    );
  }
  award(
    "Independent Thinker",
    s.totals.independent >= proficiency.independentSamples &&
      s.totals.independentCorrect / s.totals.independent >=
        proficiency.accuracy,
  );
  award(
    "Keep Count",
    s.checks.some(
      (c) => c.kind === "running" && c.correct && !c.assisted && !c.revealed,
    ),
  );
  award(
    "True Understanding",
    s.checks.some(
      (c) => c.kind === "true" && c.correct && !c.assisted && !c.revealed,
    ),
  );
  award(
    "Lessons Learned",
    Object.entries(s.reviewed).some(([key, before]) => {
      const after = s.totals.categories[key];
      return (
        !!after &&
        after.attempts - before.attempts >= proficiency.samples &&
        (after.correct - before.correct) / (after.attempts - before.attempts) >=
          proficiency.accuracy
      );
    }),
  );
  award(
    "Well Rounded",
    [
      "Hard Decisions",
      "Soft Touch",
      "Split Personality",
      "Keep Count",
      "True Understanding",
    ].every((x) => !!s.achievements[x]),
  );
}
function finish(s: GameState, e: Environment) {
  const r = s.round!;
  reveal(s, e);
  const needsDealer = r.hands.some(
    (h) =>
      !evaluate(h.cards, false).bust &&
      !evaluate(h.cards, !h.split).natural &&
      !r.positions.find((p) => p.index === h.position)!.even,
  );
  if (needsDealer && !evaluate(r.dealer).natural)
    while (evaluate(r.dealer).total < 17) draw(s, e, "dealer");
  for (const h of r.hands) {
    const p = r.positions.find((x) => x.index === h.position)!;
    const outcome = mainOutcome(h.cards, r.dealer, h.stake, h.split, p.even);
    h.done = true;
    h.outcome = outcome.outcome;
    h.net = outcome.net;
    if (outcome.returned) {
      const returnedStake = Math.min(h.stake, outcome.returned);
      ledger(
        s,
        e,
        "returned stake",
        returnedStake,
        `${r.id}:${h.id}:stake`,
        h.id,
      );
      if (outcome.returned > returnedStake)
        ledger(
          s,
          e,
          "main profit",
          outcome.returned - returnedStake,
          `${r.id}:${h.id}:profit`,
          h.id,
        );
    }
    s.totals.mainNet += outcome.net;
    event(
      s,
      e,
      "settlement",
      `${h.id}: ${h.outcome}; net ${outcome.net / 2} chips`,
      undefined,
      h.id,
    );
  }
  r.active = null;
  r.phase = "complete";
  r.net =
    s.balance -
    r.startBalance -
    s.ledger
      .filter((t) => t.roundId === r.id && t.kind === "count peek penalty")
      .reduce((total, t) => total + t.amount, 0);
  event(s, e, "complete", `Round complete; net ${r.net / 2} chips`);
  markTotals(s, e);
}
function advance(s: GameState, e: Environment) {
  const r = s.round!;
  for (const h of r.hands) {
    if (h.done) continue;
    r.active = h.id;
    if (h.cards.length === 1) draw(s, e, h);
    const evald = evaluate(h.cards, !h.split);
    if (
      evald.total >= 21 ||
      r.positions.find((p) => p.index === h.position)!.even
    ) {
      h.done = true;
      continue;
    }
    if (
      h.splitAce &&
      !(
        evald.pair &&
        r.hands.filter((x) => x.position === h.position).length < 4 &&
        s.balance >= h.stake
      )
    ) {
      h.done = true;
      continue;
    }
    r.phase = "player";
    event(s, e, "active", `${h.id} to act`, undefined, h.id);
    return;
  }
  finish(s, e);
}
function peek(s: GameState, e: Environment) {
  const r = s.round!,
    blackjack = evaluate(r.dealer).natural;
  for (const p of r.positions) {
    if (p.insurance) {
      const returned = blackjack ? p.insurance * 3 : 0;
      if (returned) {
        ledger(
          s,
          e,
          "returned insurance",
          p.insurance,
          `${r.id}:${p.index}:insurance:stake`,
        );
        ledger(
          s,
          e,
          "insurance profit",
          p.insurance * 2,
          `${r.id}:${p.index}:insurance:profit`,
        );
      }
      s.totals.insuranceNet += returned - p.insurance;
      event(
        s,
        e,
        "insurance",
        `Position ${p.index + 1}: insurance ${blackjack ? "wins" : "loses"}`,
      );
    }
  }
  if (blackjack) {
    reveal(s, e);
    finish(s, e);
  } else advance(s, e);
}
function settleSides(s: GameState, e: Environment) {
  const r = s.round!;
  for (const p of r.positions) {
    for (const kind of ["pairs", "three"] as const) {
      const stake = sum(p.bet[kind]);
      if (!stake) continue;
      const [a, b] = p.original;
      const out =
        kind === "pairs"
          ? perfectPairs(a!, b!)
          : twentyOneThree(a!, b!, r.dealer[0]!);
      const net = out.ratio ? stake * out.ratio : -stake;
      r.sideResults.push({
        position: p.index,
        kind,
        ...out,
        stake,
        net,
        cards: kind === "pairs" ? [a!, b!] : [a!, b!, r.dealer[0]!],
      });
      if (out.ratio) {
        ledger(
          s,
          e,
          "returned side stake",
          stake,
          `${r.id}:${p.index}:${kind}:stake`,
        );
        ledger(
          s,
          e,
          "side profit",
          stake * out.ratio,
          `${r.id}:${p.index}:${kind}:profit`,
        );
      }
      s.totals.sideNet += net;
      event(
        s,
        e,
        "side",
        `Position ${p.index + 1} ${kind === "pairs" ? "Perfect Pairs" : "21+3"}: ${out.category}, ${out.ratio}:1, net ${net / 2} chips`,
      );
    }
  }
}
function cancel(s: GameState, e: Environment) {
  const r = s.round!;
  reveal(s, e);
  for (const h of r.hands) {
    ledger(s, e, "exhaustion refund", h.stake, `${r.id}:${h.id}:refund`, h.id);
    h.done = true;
    h.outcome = "REFUNDED";
    h.net = 0;
  }
  r.active = null;
  r.phase = "canceled";
  r.cancelReason =
    "Shoe exhausted. Main wagers refunded; resolved side bets and insurance retained.";
  r.net =
    s.balance -
    r.startBalance -
    s.ledger
      .filter((t) => t.roundId === r.id && t.kind === "count peek penalty")
      .reduce((total, t) => total + t.amount, 0);
  event(s, e, "canceled", r.cancelReason);
  markTotals(s, e);
  s.shoe.pending = true;
}
function validRules(r: Rules) {
  if (
    ![1, 2, 4, 6, 8].includes(r.decks) ||
    !Number.isFinite(r.penetration) ||
    r.penetration < 0.5 ||
    r.penetration > 0.9 ||
    typeof r.pairs !== "boolean" ||
    typeof r.three !== "boolean" ||
    r.version !== "s17-das-v1"
  )
    throw Error("Unsupported table rules");
}
function validateBets(s: GameState, bets: Bet[], dealing = false) {
  if (bets.length !== 3) throw Error("Three positions required");
  for (const b of bets) {
    for (const kind of ["main", "pairs", "three"] as const) {
      if (
        !b[kind].every((c) =>
          denominations.includes(c as (typeof denominations)[number]),
        )
      )
        throw Error("Unknown chip");
      const amount = sum(b[kind]);
      if (amount > (kind === "main" ? 100000 : 200))
        throw Error("Wager exceeds table limit");
      if (
        ((kind === "pairs" && !s.rules.pairs) ||
          (kind === "three" && !s.rules.three)) &&
        amount
      )
        throw Error("Side bet disabled");
      if (kind !== "main" && amount && sum(b.main) < 20)
        throw Error("Side bets require a main wager of at least 10 chips");
    }
    if (dealing && sum(b.main) > 0 && sum(b.main) < 20)
      throw Error("Main wager minimum is 10 chips");
  }
  if (bets.reduce((a, b) => a + betTotal(b), 0) > s.balance)
    throw Error("Insufficient available chips");
  if (dealing && !bets.some((b) => sum(b.main) >= 20))
    throw Error("Place a main wager of at least 10 chips");
}
function replaceShoe(s: GameState, e: Environment) {
  s.shoe = freshShoe(s.rules.decks, e);
  s.totals.shuffles++;
}
function resetBetting(s: GameState, e: Environment) {
  if (!between(s)) throw Error("Finish the current round first");
  s.round = null;
  if (s.pendingRules) {
    s.rules = s.pendingRules;
    s.pendingRules = null;
    replaceShoe(s, e);
  } else if (s.shoe.pending) replaceShoe(s, e);
  s.bets = [emptyBet(), emptyBet(), emptyBet()];
  s.undo = [];
}
function currentSession(s: GameState, e: Environment) {
  const session = s.sessions.find((x) => x.id === s.sessionId)!;
  if (session.end || e.now - session.last > 1800000) {
    session.end ??= e.now;
    s.sessionId = e.id();
    s.sessions.push({
      id: s.sessionId,
      start: e.now,
      last: e.now,
      rounds: 0,
      hands: 0,
      net: 0,
      rewards: 0,
    });
  }
  return s.sessions.find((x) => x.id === s.sessionId)!;
}
function setCountVisibility(s: GameState, e: Environment, visible: boolean) {
  const training = s.countTraining;
  if (training.visible === visible) return;
  if (visible) {
    if (training.hiddenRounds >= 10 && !training.peekId)
      training.peekId = e.id();
    training.hiddenRounds = 0;
    training.eligibleRoundId = null;
    training.lastGuess = null;
  } else if (training.peekId) {
    const id = training.peekId;
    const amount = Math.min(200, s.balance);
    ledger(s, e, "count peek penalty", -amount, "count-peek:" + id);
    const clearedBets = pendingTotal(s) > s.balance;
    if (clearedBets) {
      s.bets = [emptyBet(), emptyBet(), emptyBet()];
      s.undo = [];
    }
    training.lastPenalty = { id, time: e.now, amount, clearedBets };
    training.peekId = null;
    training.hiddenRounds = 0;
    training.eligibleRoundId = null;
    training.lastGuess = null;
  }
  training.visible = visible;
}
export function applyCommand(
  previous: GameState,
  command: Command,
  env: Environment,
): GameState {
  const s: GameState = structuredClone({ ...previous, history: [] });
  s.history = [...previous.history];
  const e = { ...env, now: Math.max(env.now, s.lastClock) };
  s.lastClock = e.now;
  try {
    switch (command.type) {
      case "countVisibility":
        setCountVisibility(s, e, command.visible);
        break;
      case "countGuess": {
        if (s.countTraining.visible || s.countTraining.hiddenRounds < 10)
          throw Error(
            "Guessing requires 10 completed rounds with the count hidden",
          );
        if (!Number.isSafeInteger(command.value))
          throw Error("Enter a whole-number count");
        const id = e.id(),
          actual = s.shoe.running;
        s.countTraining.lastGuess = {
          id,
          time: e.now,
          submitted: command.value,
          correct: command.value === actual,
        };
        s.checks.push({
          id,
          time: e.now,
          kind: "running",
          submitted: command.value,
          actual,
          error: command.value - actual,
          correct: command.value === actual,
          assisted: !!command.assisted,
          revealed: false,
          durationMs: 0,
          decks: s.rules.decks,
          penetration: s.shoe.cursor / s.shoe.cards.length,
          sessionId: s.sessionId,
        });
        s.totals.counts++;
        if (command.value === actual) s.totals.countCorrect++;
        if (s.checks.length > 5000) s.checks.shift();
        unlock(s, e);
        break;
      }
      case "rebetDeal": {
        const restored = applyCommand(previous, { type: "rebet" }, env);
        const dealt = applyCommand(restored, { type: "deal" }, env);
        dealt.revision = previous.revision + 1;
        assertState(dealt);
        return dealt;
      }
      case "removeChip":
      case "chip":
      case "undo":
      case "clear":
      case "rebet":
      case "doubleBet": {
        const fromSettlement = !!s.round;
        if (s.round) {
          if (!between(s))
            throw Error("Wagers cannot change during an active round");
          if (!["rebet", "doubleBet", "clear"].includes(command.type))
            throw Error("Choose a next-round betting action first");
          resetBetting(s, e);
        }
        const old = structuredClone(s.bets);
        if (command.type === "chip") {
          if (
            !Number.isInteger(command.position) ||
            command.position < 0 ||
            command.position > 2
          )
            throw Error("Invalid position");
          s.bets[command.position]![command.kind].push(command.chip);
        }
        if (command.type === "removeChip") {
          if (
            !Number.isInteger(command.position) ||
            command.position < 0 ||
            command.position > 2
          )
            throw Error("Invalid position");
          const chips = s.bets[command.position]![command.kind];
          if (!chips.length) throw Error("This spot is empty");
          chips.pop();
        }
        if (command.type === "undo") {
          const b = s.undo.pop();
          if (!b) throw Error("Nothing to undo");
          s.bets = b;
        } else if (command.type === "clear")
          s.bets = [emptyBet(), emptyBet(), emptyBet()];
        else if (command.type === "rebet") {
          s.bets = structuredClone(s.previousBets);
        } else if (command.type === "doubleBet")
          s.bets = (
            fromSettlement || !pendingTotal(s) ? s.previousBets : s.bets
          ).map((b) => ({
            main: [...b.main, ...b.main],
            pairs: [...b.pairs, ...b.pairs],
            three: [...b.three, ...b.three],
          }));
        validateBets(s, s.bets);
        if (command.type !== "undo") s.undo.push(old);
        if (s.undo.length > 200) s.undo.shift();
        break;
      }
      case "deal": {
        if (s.round) throw Error("Round already dealt");
        validateBets(s, s.bets, true);
        const session = currentSession(s, e);
        session.last = e.now;
        if (s.pendingRules) {
          s.rules = s.pendingRules;
          s.pendingRules = null;
          replaceShoe(s, e);
        }
        const active = s.bets
          .map((b, index) => ({ b, index }))
          .filter((x) => sum(x.b.main) > 0);
        if (
          s.shoe.pending ||
          s.shoe.cards.length - s.shoe.cursor <
            Math.max(20, active.length * 8 + 2)
        )
          replaceShoe(s, e);
        const id = e.id();
        s.round = {
          id,
          sessionId: s.sessionId,
          shoeId: s.shoe.id,
          time: e.now,
          rules: { ...s.rules },
          positions: active.map(({ b, index }) => ({
            index,
            original: [],
            bet: structuredClone(b),
            insurance: 0,
            even: false,
          })),
          hands: active.map(({ b, index }) => ({
            id: `P${index + 1}-A-${e.id()}`,
            position: index,
            cards: [],
            stake: sum(b.main),
            split: false,
            splitAce: false,
            doubled: false,
            done: false,
          })),
          dealer: [],
          holeRevealed: false,
          active: null,
          phase: "player",
          sideResults: [],
          events: [],
          decisions: [],
          startBalance: s.balance,
          net: 0,
        };
        s.previousBets = structuredClone(s.bets);
        for (const p of s.round.positions)
          for (const kind of ["main", "pairs", "three"] as const) {
            const units = sum(p.bet[kind]);
            if (units) {
              ledger(
                s,
                e,
                kind === "main" ? "main committed" : "side committed",
                -units,
                `${id}:${p.index}:${kind}:commit`,
              );
              if (kind === "main") s.totals.mainStaked += units;
              else s.totals.sideStaked += units;
            }
          }
        event(s, e, "start", "Wagers committed");
        for (let pass = 0; pass < 2; pass++) {
          for (const h of s.round.hands) draw(s, e, h);
          draw(s, e, "dealer", pass === 1);
        }
        for (const p of s.round.positions)
          p.original = [
            ...s.round.hands.find((h) => h.position === p.index)!.cards,
          ];
        settleSides(s, e);
        s.bets = [emptyBet(), emptyBet(), emptyBet()];
        s.undo = [];
        if (s.round.dealer[0]!.rank === "A") {
          s.round.phase = "insurance";
          event(
            s,
            e,
            "insurance-offer",
            "Insurance offered independently for each original position",
          );
        } else peek(s, e);
        break;
      }
      case "insurance": {
        const r = s.round;
        if (r?.phase !== "insurance") throw Error("Insurance is not offered");
        const p = r.positions.find((p) => p.index === command.position);
        if (!p || p.insuranceChoice)
          throw Error("Insurance decision already completed");
        if (command.choice === "even" && !evaluate(p.original).natural)
          throw Error("Even money requires a natural blackjack");
        if (command.choice === "insurance") {
          p.insurance = sum(p.bet.main) / 2;
          ledger(
            s,
            e,
            "insurance committed",
            -p.insurance,
            `${r.id}:${p.index}:insurance:commit`,
          );
          s.totals.insuranceStaked += p.insurance;
        }
        p.even = command.choice === "even";
        p.insuranceChoice = command.choice;
        if (command.decision) r.decisions.push(command.decision);
        event(
          s,
          e,
          "insurance-choice",
          `Position ${p.index + 1}: ${command.choice}`,
        );
        if (r.positions.every((p) => p.insuranceChoice)) peek(s, e);
        break;
      }
      case "action": {
        const r = s.round;
        if (
          r?.active !== command.handId ||
          !legalActions(s).includes(command.action)
        )
          throw Error("This action is no longer legal or affordable");
        const h = r.hands.find((h) => h.id === r.active)!;
        if (command.decision) r.decisions.push(command.decision);
        event(s, e, "decision", `${h.id}: ${command.action}`, undefined, h.id);
        if (command.action === "stand") h.done = true;
        if (command.action === "hit") {
          draw(s, e, h);
          if (evaluate(h.cards, false).total >= 21) h.done = true;
        }
        if (command.action === "double") {
          ledger(
            s,
            e,
            "double committed",
            -h.stake,
            `${r.id}:${h.id}:double`,
            h.id,
          );
          s.totals.mainStaked += h.stake;
          h.stake *= 2;
          h.doubled = true;
          draw(s, e, h);
          h.done = true;
        }
        if (command.action === "split") {
          ledger(
            s,
            e,
            "split committed",
            -h.stake,
            `${r.id}:${h.id}:split`,
            h.id,
          );
          s.totals.mainStaked += h.stake;
          const index = r.hands.indexOf(h);
          const children = h.cards.map((card) => ({
            id: `P${h.position + 1}-${e.id()}`,
            parentId: h.id,
            position: h.position,
            cards: [card],
            stake: h.stake,
            split: true,
            splitAce: card.rank === "A",
            doubled: false,
            done: false,
          }));
          r.hands.splice(index, 1, ...children);
          event(s, e, "split", `${h.id} split into two hands`);
        }
        advance(s, e);
        break;
      }
      case "next":
        resetBetting(s, e);
        break;
      case "rules": {
        validRules(command.rules);
        if (!between(s)) s.pendingRules = { ...command.rules };
        else {
          const shoeChanged =
            s.rules.decks !== command.rules.decks ||
            s.rules.penetration !== command.rules.penetration;
          s.rules = { ...command.rules };
          s.pendingRules = null;
          for (const b of s.bets) {
            if (!s.rules.pairs) b.pairs = [];
            if (!s.rules.three) b.three = [];
          }
          if (shoeChanged) replaceShoe(s, e);
        }
        break;
      }
      case "adReward": {
        if (!between(s))
          throw Error("Advertisements are only available between rounds");
        if (!command.eventId || !command.requestId)
          throw Error("Missing legitimate reward receipt");
        if (
          s.adReceipts.includes(command.eventId) ||
          s.adReceipts.includes(command.requestId)
        )
          break;
        s.adReceipts.push(command.eventId, command.requestId);
        ledger(s, e, "advertisement reward", 1000, "ad:" + command.eventId);
        s.totals.rewards += 1000;
        currentSession(s, e).rewards += 1000;
        break;
      }
      case "claim": {
        if (!between(s))
          throw Error("Hourly claims are available between rounds");
        if (e.now - s.lastClaim < 3600000)
          throw Error("Hourly chips are not ready yet");
        s.lastClaim = e.now;
        ledger(s, e, "hourly reward", 2000, `hourly:${e.now}`);
        s.totals.rewards += 2000;
        currentSession(s, e).rewards += 2000;
        break;
      }
      case "newSession":
      case "endSession": {
        if (!between(s))
          throw Error("Finish the active round before ending the session");
        const session = s.sessions.find((x) => x.id === s.sessionId)!;
        session.end = e.now;
        if (command.type === "newSession") {
          s.sessionId = e.id();
          s.sessions.push({
            id: s.sessionId,
            start: e.now,
            last: e.now,
            rounds: 0,
            hands: 0,
            net: 0,
            rewards: 0,
          });
        }
        break;
      }
      case "check": {
        const check = { ...command.check };
        if (check.revealed || check.kind === "true")
          setCountVisibility(s, e, true);
        if (check.kind === "running" && check.submitted !== null) {
          if (s.countTraining.visible || s.countTraining.hiddenRounds < 10)
            throw Error(
              "Guessing requires 10 completed rounds with the count hidden",
            );
          if (!Number.isSafeInteger(check.submitted))
            throw Error("Enter a whole-number count");
          check.actual = s.shoe.running;
          check.error = check.submitted! - s.shoe.running;
          check.correct = check.submitted === s.shoe.running;
        }
        if (!between(s))
          throw Error("Count checks are available between rounds");
        s.checks.push(check);
        if (check.submitted !== null) {
          s.totals.counts++;
          if (check.correct) s.totals.countCorrect++;
        }
        if (s.checks.length > 5000) s.checks.shift();
        unlock(s, e);
        break;
      }
      case "reviewMistake": {
        if (!["hard", "soft", "pair", "insurance"].includes(command.category))
          throw Error("Unknown hand category");
        s.reviewed[command.category] = {
          ...(s.totals.categories[command.category] ?? {
            attempts: 0,
            correct: 0,
          }),
        };
        break;
      }
      case "tutorial":
        if (!s.tutorials.includes(command.name)) s.tutorials.push(command.name);
        unlock(s, e);
        break;
      case "retention":
        if (![100, 500, 1000, 5000].includes(command.value))
          throw Error("Invalid retention limit");
        s.retention = command.value;
        while (s.history.length > s.retention) {
          s.historyBytes -= new TextEncoder().encode(
            JSON.stringify(s.history.shift()),
          ).byteLength;
        }
        break;
      case "reset": {
        if (!between(s))
          throw Error("Finish the current round before resetting data");
        if (command.scope === "all") {
          const fresh = initialState(e);
          fresh.revision = s.revision + 1;
          return fresh;
        }
        if (["balance", "gameplay", "education"].includes(command.scope)) {
          s.countTraining = {
            ...emptyCountTraining(s.countTraining.visible),
            peekId: s.countTraining.peekId,
          };
        }
        if (command.scope === "balance") {
          s.bets = [emptyBet(), emptyBet(), emptyBet()];
          s.undo = [];
          ledger(s, e, "balance reset", 2000 - s.balance, `reset:${e.id()}`);
        }
        if (command.scope === "history") {
          s.history = [];
          s.historyBytes = 0;
        }
        if (command.scope === "gameplay") {
          const educational = {
            decisions: s.totals.decisions,
            correct: s.totals.correct,
            independent: s.totals.independent,
            independentCorrect: s.totals.independentCorrect,
            counts: s.totals.counts,
            countCorrect: s.totals.countCorrect,
            categories: s.totals.categories,
          };
          s.totals = { ...emptyTotals(), ...educational };
        }
        if (command.scope === "education") {
          s.history = s.history.map((r) => ({ ...r, decisions: [] }));
          s.checks = [];
          s.reviewed = {};
          Object.assign(s.totals, {
            decisions: 0,
            correct: 0,
            independent: 0,
            independentCorrect: 0,
            counts: 0,
            countCorrect: 0,
            categories: {},
          });
        }
        if (command.scope === "achievements") {
          s.achievements = {};
          s.tutorials = [];
        }
        break;
      }
    }
  } catch (error) {
    if (error instanceof Exhausted && s.round) cancel(s, e);
    else throw error;
  }
  if (s.shoe.cursor !== previous.shoe.cursor || s.shoe.id !== previous.shoe.id)
    s.countTraining.lastGuess = null;
  // Only rounds that began hidden and never exposed the count earn credit.
  if (s.round && s.round.id !== previous.round?.id && !s.countTraining.visible)
    s.countTraining.eligibleRoundId = s.round.id;
  if (
    s.round?.phase === "complete" &&
    (previous.round?.id !== s.round.id || previous.round.phase !== "complete")
  ) {
    if (
      !s.countTraining.visible &&
      s.countTraining.eligibleRoundId === s.round.id
    )
      s.countTraining.hiddenRounds++;
    s.countTraining.eligibleRoundId = null;
  }
  if (s.round?.phase === "canceled") s.countTraining.eligibleRoundId = null;
  s.revision++;
  if (s.ledger.length > 20000) {
    const removed = s.ledger.splice(0, s.ledger.length - 20000);
    s.ledgerBase += removed.reduce((a, t) => a + t.amount, 0);
  }
  assertState(s);
  return s;
}
export function assertState(s: GameState) {
  const training = s.countTraining;
  if (
    !Number.isSafeInteger(training.hiddenRounds) ||
    training.hiddenRounds < 0 ||
    (training.visible &&
      (training.hiddenRounds > 0 || training.eligibleRoundId !== null)) ||
    (!training.visible && training.peekId !== null)
  )
    throw Error("Invalid count training state");
  if (
    !Number.isSafeInteger(s.balance) ||
    s.balance < 0 ||
    pendingTotal(s) > s.balance
  )
    throw Error("Wallet invariant violated");
  if (s.balance !== s.ledgerBase + s.ledger.reduce((a, t) => a + t.amount, 0))
    throw Error("Ledger reconciliation failed");
  if (new Set(s.ledger.map((t) => t.key)).size !== s.ledger.length)
    throw Error("Duplicate ledger key");
  if (
    new Set(s.shoe.cards.map((c) => c.id)).size !== s.shoe.cards.length ||
    s.shoe.cursor < 0 ||
    s.shoe.cursor > s.shoe.cards.length
  )
    throw Error("Shoe integrity failed");
  const seen = new Set(s.shoe.revealed);
  if (
    seen.size !== s.shoe.revealed.length ||
    s.shoe.running !==
      s.shoe.cards
        .slice(0, s.shoe.cursor)
        .filter((c) => seen.has(c.id))
        .reduce((a, c) => a + weight(c), 0)
  )
    throw Error("Exposed count invariant failed");
  if (s.round && s.round.shoeId === s.shoe.id) {
    const r = s.round;
    const locations = [...r.dealer, ...r.hands.flatMap((h) => h.cards)].map(
      (c) => c.id,
    );
    if (
      new Set(locations).size !== locations.length ||
      locations.some(
        (id) => !s.shoe.cards.slice(0, s.shoe.cursor).some((c) => c.id === id),
      )
    )
      throw Error("Card ownership failed");
    if (
      r.hands.length > 12 ||
      r.positions.some(
        (p) => r.hands.filter((h) => h.position === p.index).length > 4,
      )
    )
      throw Error("Hand limit exceeded");
    if (!r.holeRevealed && r.dealer[1] && seen.has(r.dealer[1].id))
      throw Error("Hidden card was counted");
    if (
      r.phase === "player" &&
      !r.hands.some((h) => h.id === r.active && !h.done)
    )
      throw Error("Invalid active hand");
  }
  if (
    new Set(s.shoe.cards.map((c) => `${c.deckIndex}:${c.rank}:${c.suit}`))
      .size !== s.shoe.cards.length
  )
    throw Error("Invalid physical deck contents");
  validateBets(s, s.bets);
  validRules(s.rules);
}
export function mockEnvironment(
  seedInt: (n: number) => number,
  now = 1000000,
): Environment {
  let id = 0;
  return { now, id: () => `test-${now}-${++id}`, randomInt: seedInt };
}
export const activeHand = (s: GameState) =>
  s.round?.hands.find((h) => h.id === s.round!.active);
export const dealerCategory = (c: Card) =>
  value(c) === 11 ? "A" : String(value(c));
