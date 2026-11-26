export type Suit = "spades" | "hearts" | "diamonds" | "clubs";
export type Rank =
  | "A"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "J"
  | "Q"
  | "K";
export interface Card {
  id: string;
  rank: Rank;
  suit: Suit;
  deckIndex: number;
}
export type Action = "hit" | "stand" | "double" | "split";
export type BetKind = "main" | "pairs" | "three";
export interface Rules {
  decks: 1 | 2 | 4 | 6 | 8;
  penetration: number;
  pairs: boolean;
  three: boolean;
  version: "s17-das-v1";
}
export interface Bet {
  main: number[];
  pairs: number[];
  three: number[];
}
export interface Hand {
  id: string;
  parentId?: string;
  position: number;
  cards: Card[];
  stake: number;
  split: boolean;
  splitAce: boolean;
  doubled: boolean;
  done: boolean;
  outcome?: string;
  net?: number;
}
export interface SideResult {
  position: number;
  kind: "pairs" | "three";
  category: string;
  ratio: number;
  stake: number;
  net: number;
  cards: Card[];
}
export interface Position {
  index: number;
  original: Card[];
  bet: Bet;
  insurance: number;
  insuranceChoice?: "decline" | "insurance" | "even";
  even: boolean;
}
export interface Assistance {
  recommendation: boolean;
  strategyEnabled?: boolean;
  chart: boolean;
  explanation: boolean;
  warning: boolean;
  weights: boolean;
  running: boolean;
  trueCount: boolean;
  exactShoe: boolean;
}
export interface Decision {
  id: string;
  roundId: string;
  sessionId: string;
  time: number;
  position: number;
  handId: string;
  cards: Card[];
  dealer: Card;
  category: "hard" | "soft" | "pair" | "insurance";
  total: number;
  decks: number;
  rulesVersion: string;
  tableVersion: string;
  legal: string[];
  affordable: string[];
  ideal: string;
  available: string;
  selected: string;
  firstSelected: string;
  constrained: boolean;
  correct: boolean;
  assistance: Assistance;
  durationMs: number;
}
export interface GameEvent {
  id: string;
  type: string;
  text: string;
  handId?: string;
  card?: Card;
  hidden?: boolean;
  snapshot: Projection;
}
export interface Projection {
  sideResults?: SideResult[];
  dealer: (Card | null)[];
  hands: Hand[];
  active: string | null;
  phase: Round["phase"];
  running: number;
  remaining: number;
}
export interface Round {
  id: string;
  sessionId: string;
  shoeId: string;
  time: number;
  rules: Rules;
  positions: Position[];
  hands: Hand[];
  dealer: Card[];
  holeRevealed: boolean;
  active: string | null;
  phase: "insurance" | "player" | "complete" | "canceled";
  sideResults: SideResult[];
  events: GameEvent[];
  decisions: Decision[];
  startBalance: number;
  net: number;
  cancelReason?: string;
}
export interface Shoe {
  id: string;
  cards: Card[];
  cursor: number;
  revealed: string[];
  running: number;
  pending: boolean;
}
export interface Transaction {
  id: string;
  time: number;
  kind: string;
  amount: number;
  roundId?: string;
  handId?: string;
  key: string;
}
export interface CountCheck {
  id: string;
  time: number;
  kind: "running" | "true";
  submitted: number | null;
  actual: number;
  error: number | null;
  correct: boolean;
  assisted: boolean;
  revealed: boolean;
  durationMs: number;
  decks: number;
  penetration: number;
  sessionId: string;
}
export interface Session {
  id: string;
  start: number;
  end?: number;
  last: number;
  rounds: number;
  hands: number;
  net: number;
  rewards: number;
}
export interface Totals {
  rounds: number;
  positions: number;
  hands: number;
  wins: number;
  losses: number;
  pushes: number;
  naturals: number;
  busts: number;
  dealerBusts: number;
  dealerNaturals: number;
  doubles: number;
  splits: number;
  cards: number;
  shuffles: number;
  mainStaked: number;
  sideStaked: number;
  insuranceStaked: number;
  mainNet: number;
  sideNet: number;
  insuranceNet: number;
  rewards: number;
  decisions: number;
  correct: number;
  independent: number;
  independentCorrect: number;
  counts: number;
  countCorrect: number;
  categories: Record<string, { attempts: number; correct: number }>;
}
export interface CountTraining {
  visible: boolean;
  hiddenRounds: number;
  eligibleRoundId: string | null;
  peekId: string | null;
  lastPenalty: {
    id: string;
    time: number;
    amount: number;
    clearedBets: boolean;
  } | null;
  lastGuess: {
    id: string;
    time: number;
    submitted: number;
    correct: boolean;
  } | null;
}
export const emptyCountTraining = (visible = false): CountTraining => ({
  visible,
  hiddenRounds: 0,
  eligibleRoundId: null,
  peekId: null,
  lastPenalty: null,
  lastGuess: null,
});
export interface GameState {
  countTraining: CountTraining;
  schema: 1;
  revision: number;
  balance: number;
  ledgerBase: number;
  ledger: Transaction[];
  lastClaim: number;
  lastClock: number;
  rules: Rules;
  pendingRules: Rules | null;
  shoe: Shoe;
  bets: Bet[];
  undo: Bet[][];
  previousBets: Bet[];
  round: Round | null;
  history: Round[];
  checks: CountCheck[];
  sessions: Session[];
  sessionId: string;
  totals: Totals;
  achievements: Record<string, number>;
  tutorials: string[];
  reviewed: Record<string, { attempts: number; correct: number }>;
  historyBytes: number;
  retention: number;
  adReceipts: string[];
}
export type Command =
  | { type: "countVisibility"; visible: boolean }
  | { type: "countGuess"; value: number; assisted?: boolean }
  | { type: "removeChip"; position: number; kind: BetKind }
  | { type: "rebetDeal" }
  | { type: "reviewMistake"; category: string }
  | { type: "adReward"; eventId: string; requestId: string }
  | { type: "chip"; position: number; kind: BetKind; chip: number }
  | {
      type:
        | "undo"
        | "clear"
        | "rebet"
        | "doubleBet"
        | "deal"
        | "next"
        | "claim"
        | "newSession"
        | "endSession";
    }
  | { type: "action"; action: Action; handId: string; decision?: Decision }
  | {
      type: "insurance";
      position: number;
      choice: "decline" | "insurance" | "even";
      decision?: Decision;
    }
  | { type: "rules"; rules: Rules }
  | { type: "check"; check: CountCheck }
  | { type: "tutorial"; name: string }
  | {
      type: "reset";
      scope:
        | "balance"
        | "history"
        | "gameplay"
        | "education"
        | "achievements"
        | "all";
    }
  | { type: "retention"; value: number };
export interface Environment {
  now: number;
  id: () => string;
  randomInt: (max: number) => number;
}
export const DEFAULT_RULES: Rules = {
  decks: 6,
  penetration: 0.75,
  pairs: true,
  three: true,
  version: "s17-das-v1",
};
export const denominations = [1, 5, 25, 100, 500, 1000, 5000] as const;
export const emptyBet = (): Bet => ({ main: [], pairs: [], three: [] });
export const sum = (chips: number[]) => chips.reduce((a, b) => a + b * 2, 0);
export const betTotal = (b: Bet) => sum(b.main) + sum(b.pairs) + sum(b.three);
export const pendingTotal = (s: GameState) =>
  s.bets.reduce((a, b) => a + betTotal(b), 0);
export const money = (units: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(
    units / 2,
  );
