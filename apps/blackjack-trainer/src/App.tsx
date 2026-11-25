import { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  ChartNoAxesCombined,
  Settings2,
  Wallet,
  CircleHelp,
  GraduationCap,
  Volume2,
  VolumeX,
} from "lucide-react";
import {
  useGame,
  initialize,
  dispose,
  dispatch,
  act,
  preferences,
  exposure,
} from "./store";
import type { Panel } from "./store";
import { metadata } from "./config/metadata";
import { presets } from "./config/preferences";
import type { Preferences } from "./config/preferences";
import { createTable } from "./phaser/Table";
import { activeHand, between, legalActions } from "./engine/engine";
import { evaluate, symbols } from "./engine/cards";
import { money, pendingTotal, sum } from "./engine/types";
import type { Action, Decision } from "./engine/types";
import { recommend, STRATEGY_VERSION } from "./training/strategy";
import { Button } from "./components/ui/button";
import { Dialog } from "./components/ui/dialog";
import { Panels } from "./components/Panels";
import { Audio } from "./phaser/audio";
function Canvas() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const game = createTable(ref.current!);
    const observer = new ResizeObserver(() => {
      if (ref.current)
        game.scale.setParentSize(
          ref.current.clientWidth,
          ref.current.clientHeight,
        );
    });
    observer.observe(ref.current!);
    return () => {
      observer.disconnect();
      game.destroy(true);
    };
  }, []);
  return (
    <div
      ref={ref}
      className="table-canvas"
      role="img"
      aria-label="Interactive blackjack table. Equivalent card information and betting controls are below."
    />
  );
}
const cardText = (c: { rank: string; suit: keyof typeof symbols }) =>
  c.rank + symbols[c.suit];
export default function App() {
  const game = useGame(),
    {
      state: s,
      ready,
      busy,
      locked,
      error,
      notice,
      panel,
      setPanel,
      preferences: p,
      confirmation,
    } = game;
  const [now, setNow] = useState(Date.now()),
    [lastBreak, setLastBreak] = useState(Date.now());
  useEffect(() => {
    void initialize();
    const interval = setInterval(() => setNow(Date.now()), 1000);
    const leave = () => {
      void dispose();
    };
    const resume = (event: PageTransitionEvent) => {
      if (event.persisted) void initialize();
    };
    window.addEventListener("pageshow", resume);
    window.addEventListener("pagehide", leave);
    return () => {
      clearInterval(interval);
      window.removeEventListener("pagehide", leave);
      window.removeEventListener("pageshow", resume);
      Audio.dispose();
      void dispose();
    };
  }, []);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const current = useGame.getState();
      if (
        current.panel ||
        current.confirmation ||
        e.repeat ||
        e.ctrlKey ||
        e.altKey ||
        e.metaKey ||
        e.shiftKey ||
        (e.target instanceof HTMLElement &&
          e.target.closest('input,textarea,select,[contenteditable="true"]'))
      )
        return;
      const name = Object.entries(current.preferences.shortcuts).find(
        ([, key]) => key.toLowerCase() === e.key.toLowerCase(),
      )?.[0];
      if (!name) return;
      e.preventDefault();
      Audio.unlock();
      if (["hit", "stand", "double", "split"].includes(name)) {
        void act(name as Action, current.state?.revision);
        return;
      }
      if (["strategy", "wallet", "settings"].includes(name)) {
        current.setPanel(name as Panel);
        return;
      }
      if (name.startsWith("chip")) {
        useGame.setState({ chip: Number(name.slice(4)) });
        return;
      }
      if (["deal", "undo", "clear", "rebet", "doubleBet"].includes(name))
        void dispatch({ type: name as "deal" }, current.state?.revision);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  if (!ready)
    return (
      <main className="loading">
        <span className="suit-logo">♠</span>
        <h1>{metadata.name}</h1>
        <p>Opening your saved table…</p>
      </main>
    );
  if (!s || locked)
    return (
      <main className="loading">
        <h1>{metadata.name}</h1>
        <p role="alert">
          {error ||
            "Your saved table could not be loaded. Existing data is unchanged."}
        </p>
        <Button onClick={() => void initialize()}>Retry saved table</Button>
        <a href={metadata.returnUrl}>Back to Trial & Elias</a>
      </main>
    );
  const shown = game.visual,
    visibleRunning = shown?.running ?? s.shoe.running,
    visibleRemaining = shown?.remaining ?? s.shoe.cards.length - s.shoe.cursor;
  const hand = activeHand(s),
    rec = recommend(s),
    legal = legalActions(s),
    session = s.sessions.find((x) => x.id === s.sessionId)!;
  const elapsed = now - session.start;
  const reminder =
    p.breakMinutes > 0 &&
    now - lastBreak >= p.breakMinutes * 60000 &&
    between(s);
  const insurance = (
    position: number,
    choice: "decline" | "insurance" | "even",
  ) => {
    const r = s.round!,
      pos = r.positions.find((p) => p.index === position)!,
      record: Decision = {
        id: `insurance-${r.id}-${position}`,
        roundId: r.id,
        sessionId: r.sessionId,
        time: now,
        position,
        handId: r.hands.find((h) => h.position === position)!.id,
        cards: pos.original,
        dealer: r.dealer[0]!,
        category: "insurance",
        total: evaluate(pos.original).total,
        decks: r.rules.decks,
        rulesVersion: r.rules.version,
        tableVersion: STRATEGY_VERSION,
        legal: [
          "decline",
          "insurance",
          ...(evaluate(pos.original).natural ? ["even"] : []),
        ],
        affordable: [
          "decline",
          ...(s.balance >= sum(pos.bet.main) / 2 ? ["insurance"] : []),
        ],
        ideal: "decline",
        available: "decline",
        selected: choice,
        firstSelected: choice,
        constrained: false,
        correct: choice === "decline",
        assistance: {
          recommendation: p.strategy,
          chart: !!game.exposure.chart,
          explanation: false,
          warning: false,
          weights: p.weights,
          running: p.running,
          trueCount: p.trueCount,
          exactShoe: p.shoe === "exact",
        },
        durationMs: performance.now() - game.decisionAt,
      };
    void dispatch(
      { type: "insurance", position, choice, decision: record },
      s.revision,
    );
  };
  return (
    <div
      className={`app ${p.contrast ? "high-contrast" : ""} ${panel === "strategy" ? "strategy-open" : ""}`}
      onPointerDown={() => Audio.unlock()}
    >
      <header className="topbar">
        <div className="brand">
          <a href={metadata.returnUrl}>Trial & Elias</a>
          <div>
            <span className="suit-logo">♠</span>
            <h1>{metadata.name}</h1>
            <span className="practice-tag">PRACTICE TABLE</span>
          </div>
        </div>
        <nav aria-label="Blackjack tools">
          <Button
            aria-label="Basic strategy"
            onClick={() => setPanel("strategy")}
          >
            <BookOpen size={17} />
            <span>Basic strategy</span>
          </Button>
          <Button aria-label="Rules" onClick={() => setPanel("rules")}>
            <CircleHelp size={17} />
            <span>Rules</span>
          </Button>
          <Button aria-label="Statistics" onClick={() => setPanel("stats")}>
            <ChartNoAxesCombined size={17} />
            <span>Statistics</span>
          </Button>
          <Button aria-label="Learn" onClick={() => setPanel("learn")}>
            <GraduationCap size={17} />
            <span>Learn</span>
          </Button>
          <Button
            aria-label="Wallet"
            className="wallet-button"
            onClick={() => setPanel("wallet")}
          >
            <Wallet size={17} />
            <strong>{money(s.balance - pendingTotal(s))}</strong>
            <span>chips</span>
          </Button>
          <Button aria-label="Settings" onClick={() => setPanel("settings")}>
            <Settings2 size={19} />
          </Button>
        </nav>
      </header>
      <main>
        <div className="table-heading">
          <div>
            <span className="eyebrow">YOUR SEAT IS READY</span>
            <h2>
              {s.round?.phase === "insurance"
                ? "Insurance decisions"
                : s.round?.phase === "player"
                  ? "Play your hand"
                  : s.round?.phase === "complete"
                    ? "Round complete"
                    : s.round?.phase === "canceled"
                      ? "Round canceled"
                      : "A little practice. A better decision."}
            </h2>
          </div>
          <div className="table-spec">
            {s.rules.decks} decks <span>·</span> S17 <span>·</span> 3:2{" "}
            <span>·</span> Virtual chips
            {p.showTime && (
              <small>{Math.floor(elapsed / 60000)} min session</small>
            )}
          </div>
        </div>
        {error && (
          <div role="alert" className="alert error">
            {error}
            <Button
              variant="quiet"
              onClick={() => useGame.setState({ error: "" })}
            >
              Dismiss
            </Button>
          </div>
        )}
        {notice && (
          <div role="status" className="alert">
            {notice}
            <Button
              variant="quiet"
              onClick={() => useGame.setState({ notice: "" })}
            >
              Dismiss
            </Button>
          </div>
        )}
        {reminder && (
          <div role="status" className="alert">
            Your chosen break reminder is ready. Take a break whenever you like.
            <Button onClick={() => setLastBreak(now)}>Continue</Button>
            <a href={metadata.returnUrl}>Leave table</a>
          </div>
        )}
        <div className="game-layout">
          <section className="table-shell">
            <Canvas />
            <div className="table-status">
              <span>
                {!s.round
                  ? "Select a chip, then a betting spot"
                  : busy
                    ? "Saving and presenting the table…"
                    : s.round.phase === "player"
                      ? `Position ${(hand?.position ?? 0) + 1} is active`
                      : s.round.phase === "insurance"
                        ? "Choose separately for each position"
                        : "Your results are saved locally"}
              </span>
              <Button
                variant="quiet"
                aria-label={p.muted ? "Unmute audio" : "Mute audio"}
                onClick={() => preferences({ muted: !p.muted })}
              >
                {p.muted ? <VolumeX size={17} /> : <Volume2 size={17} />}
              </Button>
            </div>
          </section>
          <aside className="training-card">
            <span className="eyebrow">YOUR TRAINING</span>
            <h3>Play at your pace.</h3>
            <p>
              Every hand is a chance to practice. Help is here when you want it.
            </p>
            {p.strategy && rec && (
              <div className="recommendation">
                <small>Basic strategy recommends</small>
                <strong>{rec.available.toUpperCase()}</strong>
                <details
                  onToggle={(e) => {
                    if (e.currentTarget.open) exposure({ explanation: true });
                  }}
                >
                  <summary>Why this action?</summary>
                  <p>{rec.explanation}</p>
                </details>
              </div>
            )}
            {panel !== "count" && (
              <>
                {p.running && (
                  <div className="training-value">
                    <span>Running count</span>
                    <strong>
                      {visibleRunning > 0 ? "+" : ""}
                      {visibleRunning}
                    </strong>
                  </div>
                )}
                {p.trueCount && (
                  <div className="training-value">
                    <span>True count</span>
                    <strong>
                      {(visibleRemaining > 0
                        ? visibleRunning / (visibleRemaining / 52)
                        : 0
                      ).toFixed(1)}
                    </strong>
                  </div>
                )}
              </>
            )}
            {p.shoe === "exact" && (
              <p className="muted">
                {s.shoe.cards.length - s.shoe.cursor} undealt ·{" "}
                {((s.shoe.cards.length - s.shoe.cursor) / 52).toFixed(2)} decks
                · {Math.round((s.shoe.cursor / s.shoe.cards.length) * 100)}%
                dealt
              </p>
            )}
            <Button onClick={() => setPanel("strategy")}>
              <BookOpen size={17} />
              Open strategy chart
            </Button>
            <Button
              disabled={!between(s) || busy}
              onClick={() => setPanel("count")}
            >
              Count check
            </Button>
            <p className="fine-print">
              Decision quality matters more than the last result.
            </p>
          </aside>
        </div>
        <section className="action-deck" aria-label="Table controls">
          {!s.round ? (
            <>
              <div className="chip-selector" aria-label="Chip denomination">
                {[1, 5, 25, 100, 500].map((n) => (
                  <button
                    key={n}
                    className={`chip chip-${n} ${game.chip === n ? "selected" : ""}`}
                    aria-pressed={game.chip === n}
                    onClick={() => useGame.setState({ chip: n })}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <div className="button-row betting-controls">
                {(["undo", "clear", "rebet", "doubleBet"] as const).map(
                  (type) => (
                    <Button
                      key={type}
                      disabled={busy}
                      onClick={() => void dispatch({ type }, s.revision)}
                    >
                      {type === "doubleBet"
                        ? "Double bet"
                        : type.charAt(0).toUpperCase() + type.slice(1)}
                    </Button>
                  ),
                )}
                <Button
                  variant="primary"
                  disabled={busy || pendingTotal(s) < 20}
                  onClick={() => void dispatch({ type: "deal" }, s.revision)}
                >
                  Deal cards <kbd>↵</kbd>
                </Button>
              </div>
              <div
                className="accessible-bets"
                aria-label="Accessible betting spots"
              >
                {s.bets.map((b, position) => (
                  <div key={position}>
                    <strong>Position {position + 1}</strong>
                    {(
                      [
                        "main",
                        ...(s.rules.pairs ? ["pairs"] : []),
                        ...(s.rules.three ? ["three"] : []),
                      ] as const
                    ).map((kind) => (
                      <Button
                        key={kind}
                        disabled={busy}
                        onClick={() =>
                          void dispatch(
                            {
                              type: "chip",
                              position,
                              kind: kind as "main",
                              chip: game.chip,
                            },
                            s.revision,
                          )
                        }
                      >
                        {kind === "main"
                          ? "Main"
                          : kind === "pairs"
                            ? "Perfect Pairs"
                            : "21+3"}
                        : {money(sum(b[kind as keyof typeof b]))}
                      </Button>
                    ))}
                  </div>
                ))}
              </div>
            </>
          ) : s.round.phase === "insurance" ? (
            <div className="insurance-grid">
              {s.round.positions
                .filter((pos) => !pos.insuranceChoice)
                .map((pos) => (
                  <section key={pos.index}>
                    <h3>
                      Position {pos.index + 1} · {cardText(pos.original[0]!)}{" "}
                      {cardText(pos.original[1]!)}
                    </h3>
                    <div className="button-row">
                      <Button
                        disabled={busy}
                        onClick={() => insurance(pos.index, "decline")}
                      >
                        Decline insurance
                      </Button>
                      <Button
                        disabled={busy || s.balance < sum(pos.bet.main) / 2}
                        onClick={() => insurance(pos.index, "insurance")}
                      >
                        Insure {money(sum(pos.bet.main) / 2)}
                      </Button>
                      {evaluate(pos.original).natural && (
                        <Button
                          disabled={busy}
                          onClick={() => insurance(pos.index, "even")}
                        >
                          Take even money
                        </Button>
                      )}
                    </div>
                  </section>
                ))}
            </div>
          ) : s.round.phase === "player" ? (
            <div className="play-controls">
              <div className="active-summary" aria-live="polite">
                <small>
                  POSITION {(hand?.position ?? 0) + 1} · ACTIVE HAND
                </small>
                <strong>
                  {hand?.cards.map(cardText).join(" ")} ·{" "}
                  {hand ? evaluate(hand.cards, false).total : ""}
                </strong>
                <span>{money(hand?.stake ?? 0)} chips</span>
              </div>
              <div className="button-row">
                {(["hit", "stand", "double", "split"] as Action[]).map(
                  (action) => (
                    <Button
                      key={action}
                      variant={
                        p.strategy && p.highlight && rec?.available === action
                          ? "primary"
                          : "default"
                      }
                      disabled={busy || !legal.includes(action)}
                      title={
                        !legal.includes(action)
                          ? "Unavailable: hand rules, split limit or insufficient chips"
                          : action
                      }
                      onClick={() => void act(action, s.revision)}
                    >
                      {action.charAt(0).toUpperCase() + action.slice(1)}
                      <kbd>{p.shortcuts[action]?.toUpperCase()}</kbd>
                    </Button>
                  ),
                )}
              </div>
            </div>
          ) : (
            <div className="round-summary" aria-live="polite">
              <div>
                <small>
                  {s.round.cancelReason ??
                    "NET ROUND RESULT · STAKES ALREADY ACCOUNTED FOR"}
                </small>
                <strong className={s.round.net >= 0 ? "positive" : "negative"}>
                  {s.round.net > 0 ? "+" : ""}
                  {money(s.round.net)} chips
                </strong>
                <p>
                  Main{" "}
                  {money(s.round.hands.reduce((a, h) => a + (h.net ?? 0), 0))} ·
                  Side bets{" "}
                  {money(s.round.sideResults.reduce((a, x) => a + x.net, 0))}
                </p>
              </div>
              <Button
                variant="primary"
                disabled={busy}
                onClick={() => void dispatch({ type: "next" }, s.revision)}
              >
                Next round
              </Button>
            </div>
          )}
        </section>
        {s.round && (
          <section className="hands-overview" aria-label="All player hands">
            <p className="dealer-dom">
              Dealer:{" "}
              {(
                shown?.dealer ??
                s.round.dealer.map((c, i) =>
                  i === 1 && !s.round!.holeRevealed ? null : c,
                )
              )
                .map((c) => (c ? cardText(c) : "Face down"))
                .join(" · ")}
            </p>
            <div className="hand-list">
              {s.round.hands.map((h, i) => (
                <details
                  key={h.id}
                  className={h.id === s.round!.active ? "active" : ""}
                >
                  <summary>
                    Position {h.position + 1} · Hand {i + 1} ·{" "}
                    {evaluate(h.cards, false).total} ·{" "}
                    {h.outcome ?? (h.done ? "Stand" : "In play")}
                  </summary>
                  <p>
                    {h.cards.map(cardText).join(" ")} · wager {money(h.stake)}
                    {h.net !== undefined ? ` · net ${money(h.net)}` : ""}
                  </p>
                </details>
              ))}
            </div>
            {s.round.sideResults.length > 0 && (
              <div className="side-results">
                {s.round.sideResults.map((x) => (
                  <span key={`${x.position}-${x.kind}`}>
                    P{x.position + 1} · {x.kind === "pairs" ? "PP" : "21+3"} ·{" "}
                    {x.category} · {x.ratio}:1 · {money(x.net)}
                  </span>
                ))}
              </div>
            )}
          </section>
        )}
        <footer className="app-footer">
          <span>Practice with purpose. No real money. No account.</span>
          <Button variant="quiet" onClick={() => setPanel("privacy")}>
            Privacy & local data
          </Button>
        </footer>
      </main>
      <Panels />
      {confirmation && (
        <Dialog
          title="Review your decision"
          onClose={() => useGame.setState({ confirmation: null })}
        >
          <p>
            Basic strategy recommends {rec?.available.toUpperCase()}. You
            selected {confirmation.toUpperCase()}.
          </p>
          <p>{rec?.explanation}</p>
          <div className="button-row">
            <Button onClick={() => useGame.setState({ confirmation: null })}>
              Choose again
            </Button>
            <Button
              variant="primary"
              onClick={() => void act(confirmation, s.revision, true)}
            >
              Continue with {confirmation}
            </Button>
          </div>
        </Dialog>
      )}
      {!p.onboarded && (
        <Dialog
          title="Welcome to your practice table"
          onClose={() => preferences({ onboarded: true })}
        >
          <p>
            Start with 1,000 virtual chips. Learn at your own pace with optional
            strategy and counting tools. All progress stays in this browser.
          </p>
          <p>
            Simulated casino content for adults. Chips have no monetary value.
            Strategy and counting do not guarantee profit.
          </p>
          <div className="button-row">
            <Button
              variant="primary"
              onClick={() => preferences({ onboarded: true })}
            >
              Play without hints
            </Button>
            <Button
              onClick={() =>
                preferences({
                  ...(presets.beginner as Partial<Preferences>),
                  onboarded: true,
                })
              }
            >
              Use beginner assistance
            </Button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
