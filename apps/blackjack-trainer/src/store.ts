import { create } from "zustand";
import { Database } from "./storage/database";
import { applyCommand, activeHand, between, projection } from "./engine/engine";
import { secureInt } from "./engine/cards";
import { recommend, STRATEGY_VERSION } from "./training/strategy";
import {
  defaults,
  loadPreferences,
  savePreferences,
} from "./config/preferences";
import type { Preferences } from "./config/preferences";
import type {
  Action,
  Assistance,
  Command,
  Decision,
  GameState,
  Projection,
} from "./engine/types";
export type Panel =
  | "wallet"
  | "strategy"
  | "rules"
  | "stats"
  | "settings"
  | "learn"
  | "count"
  | "privacy"
  | null;
interface Store {
  firstSelected: Action | null;
  visual: Projection | null;
  state: GameState | null;
  preferences: Preferences;
  ready: boolean;
  busy: boolean;
  locked: boolean;
  error: string;
  notice: string;
  panel: Panel;
  chip: number;
  exposure: Partial<Assistance>;
  decisionAt: number;
  confirmation: Action | null;
  setPanel: (p: Panel) => void;
}
export const useGame = create<Store>((set) => ({
  firstSelected: null,
  visual: null,
  state: null,
  preferences: { ...defaults },
  ready: false,
  busy: false,
  locked: false,
  error: "",
  notice: "",
  panel: null,
  chip: 25,
  exposure: {},
  decisionAt: performance.now(),
  confirmation: null,
  setPanel: (panel) =>
    set((v) => ({
      panel,
      exposure:
        panel === "strategy" ? { ...v.exposure, chart: true } : v.exposure,
    })),
}));
const db = new Database();
let heartbeat: ReturnType<typeof setInterval> | undefined;
let disposed = false;
let animationToken = 0;
let releaseBrowserLock: (() => void) | null = null;
let ownsBrowserLock = false;
export const env = () => ({
  now: Date.now(),
  id: () =>
    Array.from(crypto.getRandomValues(new Uint32Array(3)), (n) =>
      n.toString(36),
    ).join("-"),
  randomInt: secureInt,
});
export async function initialize() {
  disposed = false;
  try {
    const browserSupported = typeof navigator.locks?.request === "function";
    const browserOwned = !browserSupported || (await acquireBrowserLock());
    const owned =
      browserOwned && (await db.acquire(Date.now(), browserSupported));
    if (!owned) {
      useGame.setState({
        locked: true,
        ready: true,
        error: "Another tab is playing. Close that tab, then retry here.",
      });
      return;
    }
    const state = await db.load(env());
    if (disposed) return;
    useGame.setState({
      state,
      preferences: loadPreferences(),
      ready: true,
      locked: false,
      error: "",
    });
    if (heartbeat) clearInterval(heartbeat);
    heartbeat = setInterval(
      () =>
        void db
          .acquire()
          .then((ok) => {
            if (!ok)
              useGame.setState({
                locked: true,
                error: "Table ownership changed. Reload before playing.",
              });
          })
          .catch(() =>
            useGame.setState({
              locked: true,
              error:
                "Could not renew the table lock. Reload to recover safely.",
            }),
          ),
      2000,
    );
  } catch (e) {
    useGame.setState({
      error: `Saved table could not be opened. Existing data has been left unchanged. ${e instanceof Error ? e.message : String(e)}`,
      ready: true,
    });
  }
}
export async function dispose() {
  disposed = true;
  animationToken++;
  if (heartbeat) clearInterval(heartbeat);
  await db.release().catch(() => {});
  db.close();
  releaseBrowserLock?.();
  releaseBrowserLock = null;
  ownsBrowserLock = false;
}
export function preferences(patch: Partial<Preferences>) {
  try {
    const next = { ...useGame.getState().preferences, ...patch };
    savePreferences(next);
    useGame.setState((v) => ({
      preferences: next,
      exposure: {
        ...v.exposure,
        recommendation:
          v.preferences.strategy || next.strategy || v.exposure.recommendation,
        weights: v.preferences.weights || next.weights || v.exposure.weights,
        running: v.preferences.running || next.running || v.exposure.running,
        trueCount:
          v.preferences.trueCount || next.trueCount || v.exposure.trueCount,
      },
    }));
  } catch (e) {
    useGame.setState({
      error: `Preferences were not saved: ${e instanceof Error ? e.message : String(e)}`,
    });
  }
}
export function exposure(patch: Partial<Assistance>) {
  useGame.setState((v) => ({ exposure: { ...v.exposure, ...patch } }));
}
export async function dispatch(
  command: Command,
  expected = useGame.getState().state?.revision,
) {
  const current = useGame.getState();
  if (current.busy || current.locked || !current.state) return;
  const previous = current.state;
  if (expected !== previous.revision) {
    useGame.setState({
      notice: "The active hand changed. Please choose again.",
    });
    return;
  }
  if (command.type === "deal") {
    const session = previous.sessions.find((s) => s.id === previous.sessionId)!;
    if (
      current.preferences.limitMinutes &&
      Date.now() - session.start >= current.preferences.limitMinutes * 60000
    ) {
      useGame.setState({
        notice:
          "Your chosen session limit has been reached. Change or clear it in Settings to play another round.",
      });
      return;
    }
  }
  useGame.setState({ busy: true, error: "", notice: "" });
  try {
    const state = applyCommand(previous, command, env());
    await db.save(state, previous.revision);
    const changed =
      state.round?.active !== previous.round?.active ||
      state.round?.phase !== previous.round?.phase ||
      command.type === "action" ||
      command.type === "insurance";
    useGame.setState({
      state,
      visual: state.round
        ? previous.round?.id === state.round.id
          ? projection(previous.round, previous.shoe)
          : (state.round.events[0]?.snapshot ??
            projection(state.round, state.shoe))
        : null,
      busy: true,
      confirmation: null,
      ...(changed
        ? { exposure: {}, firstSelected: null, decisionAt: performance.now() }
        : {}),
    });
    await present(previous, state);
    if (
      between(state) &&
      state.totals.rounds !== previous.totals.rounds &&
      current.preferences.checkpoint > 0 &&
      state.totals.rounds % current.preferences.checkpoint === 0
    )
      useGame.setState({ panel: "count" });
  } catch (e) {
    useGame.setState({
      busy: false,
      error: e instanceof Error ? e.message : String(e),
    });
  }
}
export function decision(
  selected: Action,
  firstSelected = selected,
): Decision | null {
  const { state: s, preferences: p, exposure, decisionAt } = useGame.getState();
  if (!s?.round) return null;
  const hand = activeHand(s),
    r = recommend(s);
  if (!hand || !r) return null;
  return {
    id: env().id(),
    roundId: s.round.id,
    sessionId: s.round.sessionId,
    time: Date.now(),
    position: hand.position,
    handId: hand.id,
    cards: structuredClone(hand.cards),
    dealer: s.round.dealer[0]!,
    category: r.category,
    total: r.total,
    decks: s.round.rules.decks,
    rulesVersion: s.round.rules.version,
    tableVersion: STRATEGY_VERSION,
    legal: r.legal,
    affordable: r.affordable,
    ideal: r.ideal,
    available: r.available,
    selected,
    firstSelected,
    constrained: r.constrained,
    correct: selected === r.available,
    assistance: {
      recommendation: p.strategy || !!exposure.recommendation,
      chart: !!exposure.chart,
      explanation: !!exposure.explanation,
      warning: !!exposure.warning,
      weights: p.weights || !!exposure.weights,
      running: p.running || !!exposure.running,
      trueCount: p.trueCount || !!exposure.trueCount,
      exactShoe: p.shoe === "exact",
    },
    durationMs: performance.now() - decisionAt,
  };
}
export async function act(
  action: Action,
  revision?: number,
  confirmed = false,
) {
  const current = useGame.getState(),
    record = decision(action, useGame.getState().firstSelected ?? action);
  if (!record || !current.state) return;
  if (
    current.preferences.feedback === "confirm" &&
    !record.correct &&
    !confirmed
  ) {
    exposure({ warning: true });
    useGame.setState({
      confirmation: action,
      firstSelected: current.firstSelected ?? action,
    });
    return;
  }
  if (confirmed) {
    record.assistance.warning = true;
  }
  const feedback =
    current.preferences.feedback === "educational" && !record.correct
      ? (recommend(current.state)?.explanation ?? "")
      : "";
  await dispatch(
    {
      type: "action",
      action,
      handId: current.state.round!.active!,
      decision: record,
    },
    revision,
  );
  if (feedback && useGame.getState().state!.revision > current.state.revision)
    useGame.setState({ notice: feedback });
}
export async function restore(state: GameState, prefs: Preferences) {
  const current = useGame.getState();
  if (
    !current.state ||
    !between(current.state) ||
    current.busy ||
    current.locked
  )
    throw Error("Restore is only available between rounds in the playing tab");
  const next = { ...state, revision: current.state.revision + 1 };
  await db.save(next, current.state.revision);
  useGame.setState({ state: next });
  preferences(prefs);
}

async function present(previous: GameState, state: GameState) {
  const token = ++animationToken,
    p = useGame.getState().preferences;
  const events =
    state.round?.events
      .slice(
        previous.round?.id === state.round.id
          ? previous.round.events.length
          : 0,
      )
      .filter((e) =>
        ["card", "reveal", "split", "settlement"].includes(e.type),
      ) ?? [];
  const delay =
    p.reducedMotion || p.speed === "instant"
      ? 0
      : ({ slow: 380, normal: 200, fast: 65 }[p.speed] ?? 200);
  for (const event of events) {
    if (!delay || document.hidden || token !== animationToken) break;
    useGame.setState({ visual: event.snapshot });
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
  if (token === animationToken)
    useGame.setState({
      visual: state.round ? projection(state.round, state.shoe) : null,
      busy: false,
      decisionAt: performance.now(),
    });
}

function acquireBrowserLock() {
  if (ownsBrowserLock) return Promise.resolve(true);
  return new Promise<boolean>((resolve, reject) => {
    void navigator.locks
      .request(
        "trial-and-elias:blackjack:writer",
        { ifAvailable: true },
        async (lock) => {
          if (!lock) {
            resolve(false);
            return;
          }
          ownsBrowserLock = true;
          resolve(true);
          await new Promise<void>((release) => {
            releaseBrowserLock = release;
          });
          ownsBrowserLock = false;
        },
      )
      .catch(reject);
  });
}
