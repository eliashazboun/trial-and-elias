import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties, PointerEvent } from "react";
import {
  Eye,
  EyeOff,
  Plus,
  Hand as HandIcon,
  ChevronsUp,
  Split,
  Undo2,
  RotateCcw,
  Trash2,
  Play,
  X,
  BookOpen,
} from "lucide-react";
import { useGame, dispatch, act, preferences, exposure, env } from "../store";
import { between, projection, legalActions } from "../engine/engine";
import { evaluate, symbols, weight } from "../engine/cards";
import { money, pendingTotal, sum, denominations } from "../engine/types";
import type { Action, BetKind, Decision } from "../engine/types";
import { chipColors } from "../engine/chips";
import { recommend, STRATEGY_VERSION } from "../training/strategy";
import { createTable } from "../phaser/Table";
import { tableLayout } from "../phaser/layout";
import type { Rect, Spot } from "../phaser/layout";
import { Stack, WagerVisual, resultLabel } from "./WagerVisual";
import { CountGuess } from "./CountGuess";
import { Count } from "./TrainingPanels";
const position = (r: Rect): CSSProperties => ({
  left: r.x,
  top: r.y,
  width: r.width,
  height: r.height,
});
function BettingSpot({ spot }: { spot: Spot }) {
  const { state: s, chip } = useGame(),
    held = useRef(false),
    timer = useRef<ReturnType<typeof setTimeout> | null>(null),
    start = useRef({ x: 0, y: 0 });
  const [removing, setRemoving] = useState(false);
  const cancel = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };
  useEffect(() => () => cancel(), []);
  if (!s) return null;
  const amount = sum(s.bets[spot.position]![spot.kind]),
    name =
      spot.kind === "main"
        ? "Main"
        : spot.kind === "pairs"
          ? "Perfect Pairs"
          : "21+3";
  const remove = () => {
    if (amount) {
      setRemoving(true);
      void dispatch({
        type: "removeChip",
        position: spot.position,
        kind: spot.kind,
      }).finally(() => setRemoving(false));
    }
  };
  return (
    <button
      type="button"
      className={`table-bet-spot ${amount ? "occupied" : ""} ${removing ? "removing" : ""}`}
      style={position(spot)}
      data-betspot={`${spot.position}:${spot.kind}`}
      aria-label={`Position ${spot.position + 1} ${name}: ${money(amount)}`}
      title="Click to add. Right-click or hold to remove the most recent placement."
      onContextMenu={(e) => {
        e.preventDefault();
        if (!held.current) remove();
      }}
      onPointerDown={(e) => {
        held.current = false;
        start.current = { x: e.clientX, y: e.clientY };
        if (e.pointerType === "touch") {
          timer.current = setTimeout(() => {
            held.current = true;
            remove();
          }, 500);
        }
      }}
      onPointerMove={(e) => {
        if (
          Math.hypot(e.clientX - start.current.x, e.clientY - start.current.y) >
          9
        )
          cancel();
      }}
      onPointerCancel={cancel}
      onPointerUp={cancel}
      onClick={() => {
        cancel();
        if (held.current) {
          held.current = false;
          return;
        }
        void dispatch({
          type: "chip",
          position: spot.position,
          kind: spot.kind,
          chip,
        });
      }}
    >
      <span className="spot-name">
        {spot.kind === "main" ? `POSITION ${spot.position + 1}` : name}
      </span>
      {amount ? (
        <Stack units={amount} />
      ) : (
        <span className="empty-spot">
          {spot.kind === "main"
            ? "MAIN"
            : spot.kind === "pairs"
              ? "PP"
              : "21+3"}
        </span>
      )}
    </button>
  );
}
function ChipTray({ rect }: { rect: Rect }) {
  const { state: s, chip } = useGame(),
    origin = useRef<{ x: number; y: number; chip: number } | null>(null),
    dragged = useRef(false),
    skipClick = useRef(false);
  const [ghost, setGhost] = useState<{
    x: number;
    y: number;
    chip: number;
  } | null>(null);
  if (!s) return null;
  const available = s.balance - pendingTotal(s);
  const move = (e: PointerEvent<HTMLButtonElement>) => {
    if (!origin.current) return;
    if (
      Math.hypot(e.clientX - origin.current.x, e.clientY - origin.current.y) > 7
    )
      dragged.current = true;
    if (dragged.current) {
      e.preventDefault();
      setGhost({ x: e.clientX, y: e.clientY, chip: origin.current.chip });
    }
  };
  return (
    <>
      <div
        className="on-table-chip-tray"
        style={position(rect)}
        aria-label="Chip denomination"
      >
        {denominations.map((value) => (
          <button
            key={value}
            type="button"
            className={`rack-chip ${chip === value ? "selected" : ""}`}
            disabled={available < value * 2}
            aria-label={`${money(value * 2)} chip${available < value * 2 ? ", insufficient available chips" : ""}`}
            aria-pressed={chip === value}
            style={{ "--chip-color": chipColors[value] } as CSSProperties}
            onPointerDown={(e) => {
              origin.current = { x: e.clientX, y: e.clientY, chip: value };
              dragged.current = false;
              e.currentTarget.setPointerCapture(e.pointerId);
            }}
            onPointerMove={move}
            onPointerCancel={() => {
              origin.current = null;
              setGhost(null);
            }}
            onPointerUp={(e) => {
              if (dragged.current && origin.current) {
                skipClick.current = true;
                const spot = document
                  .elementFromPoint(e.clientX, e.clientY)
                  ?.closest<HTMLElement>("[data-betspot]");
                if (spot) {
                  const [p, k] = spot.dataset.betspot!.split(":");
                  void dispatch({
                    type: "chip",
                    position: Number(p),
                    kind: k as BetKind,
                    chip: origin.current.chip,
                  });
                }
              }
              origin.current = null;
              setGhost(null);
              if (e.currentTarget.hasPointerCapture(e.pointerId))
                e.currentTarget.releasePointerCapture(e.pointerId);
            }}
            onClick={() => {
              if (skipClick.current) {
                skipClick.current = false;
                return;
              }
              useGame.setState({ chip: value });
            }}
          >
            {value.toLocaleString()}
          </button>
        ))}
      </div>
      {ghost && (
        <span
          className="drag-chip"
          style={
            {
              left: ghost.x,
              top: ghost.y,
              "--chip-color": chipColors[ghost.chip],
            } as CSSProperties
          }
        >
          {ghost.chip.toLocaleString()}
        </span>
      )}
    </>
  );
}
export function TableExperience() {
  const game = useGame(),
    { state: s, visual, busy, preferences: p, panel, error, notice } = game;
  const stage = useRef<HTMLDivElement>(null),
    canvas = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 1000, height: 700 }),
    [hint, setHint] = useState(false);
  useLayoutEffect(() => {
    const element = stage.current;
    if (!element) return;
    const observer = new ResizeObserver(() =>
      setSize({ width: element.clientWidth, height: element.clientHeight }),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!canvas.current) return;
    const instance = createTable(canvas.current);
    const observer = new ResizeObserver(() => {
      if (canvas.current)
        instance.scale.setParentSize(
          canvas.current.clientWidth,
          canvas.current.clientHeight,
        );
    });
    observer.observe(canvas.current);
    return () => {
      observer.disconnect();
      instance.destroy(true);
    };
  }, []);
  const decisionKey =
    s?.round?.phase === "player" && !busy && !game.pendingCommands
      ? `${s.round.id}:${s.round.active}:${game.decisionAt}`
      : null;
  useEffect(() => {
    setHint(false);
    if (!decisionKey || !p.strategy || (panel && panel !== "strategy")) return;
    const timer = setTimeout(() => {
      const current = useGame.getState();
      if (
        current.busy ||
        !current.state ||
        current.state.round?.phase !== "player" ||
        !current.preferences.strategy
      )
        return;
      setHint(true);
      if (current.preferences.highlight) exposure({ recommendation: true });
    }, 3000);
    return () => clearTimeout(timer);
  }, [decisionKey, p.strategy, p.highlight, panel]);
  if (!s) return null;
  const view = visual ?? (s.round ? projection(s.round, s.shoe) : null),
    layout = tableLayout(size.width, size.height, s, view, p.weights),
    rec = recommend(s),
    actions = legalActions(s),
    betting = !s.round,
    completed = between(s) && !!s.round,
    hasPrevious = s.previousBets.some((b) => sum(b.main) > 0),
    countHidden = !p.running,
    running = view?.running ?? s.shoe.running;
  const actNow = (action: Action) => {
    setHint(false);
    void act(action, s.revision);
  };
  const insurance = (
    positionIndex: number,
    choice: "decline" | "insurance" | "even",
  ) => {
    const r = s.round!,
      pos = r.positions.find((pos) => pos.index === positionIndex)!;
    const record: Decision = {
      id: env().id(),
      roundId: r.id,
      sessionId: r.sessionId,
      time: Date.now(),
      position: positionIndex,
      handId: r.hands.find((h) => h.position === positionIndex)!.id,
      cards: pos.original,
      dealer: r.dealer[0]!,
      category: "insurance",
      total: evaluate(pos.original).total,
      decks: r.rules.decks,
      rulesVersion: r.rules.version,
      tableVersion: STRATEGY_VERSION,
      legal: ["decline", "insurance", "even"],
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
        recommendation: false,
        strategyEnabled: p.strategy,
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
      { type: "insurance", position: positionIndex, choice, decision: record },
      s.revision,
    );
  };
  return (
    <section
      className="table-stage"
      ref={stage}
      aria-label="Blackjack table"
      data-collection-x={layout.collection.x}
      data-collection-y={layout.collection.y}
    >
      <div ref={canvas} className="table-canvas" aria-hidden="true" />
      <div className="table-overlay">
        <div
          className="count-instrument"
          style={{
            ...position(layout.count),
            height: "auto",
            minHeight: layout.count.height,
          }}
        >
          <span>Running count</span>
          <strong
            aria-label={
              countHidden
                ? "Running count concealed"
                : `Running count ${running}`
            }
          >
            {countHidden ? "•••" : `${running > 0 ? "+" : ""}${running}`}
          </strong>
          <button
            className="eye-button"
            aria-label={p.running ? "Hide running count" : "Show running count"}
            disabled={busy || !!game.pendingCommands || game.locked}
            onClick={() => preferences({ running: !p.running })}
          >
            {p.running ? <Eye size={17} /> : <EyeOff size={17} />}
          </button>
          <button
            className="count-check-button"
            aria-label="Count check"
            title="Count check exercises"
            disabled={!between(s) || busy}
            onClick={() => game.setPanel(panel === "count" ? null : "count")}
          >
            <BookOpen size={12} />
          </button>
          <CountGuess />
        </div>
        {(p.trueCount || p.shoe === "exact") && panel !== "count" && (
          <div
            className="shoe-extra"
            style={{
              left: layout.count.x,
              top:
                size.height < 430
                  ? size.height - 26
                  : layout.count.y + layout.count.height + 3,
              maxWidth: layout.count.width,
            }}
          >
            {p.trueCount
              ? `TC ${((view?.remaining ?? s.shoe.cards.length - s.shoe.cursor) > 0 ? running / ((view?.remaining ?? s.shoe.cards.length - s.shoe.cursor) / 52) : 0).toFixed(1)}`
              : ""}
            {p.shoe === "exact"
              ? ` · ${((view?.remaining ?? s.shoe.cards.length - s.shoe.cursor) / 52).toFixed(2)} decks`
              : ""}
          </div>
        )}
        {view && (
          <div
            className="dealer-summary"
            style={{ top: layout.dealerLabel.y, left: layout.dealerLabel.x }}
          >
            DEALER{" "}
            <span>
              {view.dealer
                .map((c) => (c ? c.rank + symbols[c.suit] : "Face down"))
                .join(" · ")}
            </span>
          </div>
        )}
        {[...layout.dealer, ...layout.hands.flatMap((h) => h.cards)].map(
          (item) =>
            item.card && (
              <span
                key={item.key}
                className="card-label"
                data-card-label={item.key}
                style={{
                  left: item.x + 3,
                  top: item.y + 2,
                  fontSize: Math.max(11, Math.min(17, item.width * 0.21)),
                }}
              >
                {/* rank remains readable even on compact multi-hand fans */}
                <span
                  className={
                    ["hearts", "diamonds"].includes(item.card.suit)
                      ? "red-suit"
                      : ""
                  }
                >
                  {item.card.rank}
                  {symbols[item.card.suit]}
                </span>
              </span>
            ),
        )}
        {p.weights &&
          [...layout.dealer, ...layout.hands.flatMap((h) => h.cards)].map(
            (item) =>
              item.card && (
                <span
                  className={`count-weight weight-${weight(item.card)}`}
                  key={item.key}
                  data-card-weight={item.key}
                  style={{
                    left: item.badgeX,
                    top: item.badgeY,
                    ...(layout.hands.some(
                      (h) =>
                        h.compact && h.cards.some((c) => c.key === item.key),
                    )
                      ? { minWidth: 12, padding: 0, fontSize: 9 }
                      : {}),
                  }}
                  aria-label={`${item.card.rank} ${item.card.suit}: Hi-Lo ${weight(item.card)}`}
                >
                  {weight(item.card) > 0 ? "+" : ""}
                  {weight(item.card)}
                </span>
              ),
          )}
        {betting &&
          layout.spots.map((spot) => (
            <BettingSpot key={`${spot.position}:${spot.kind}`} spot={spot} />
          ))}
        {layout.hands.map((item) => {
          const h = item.hand,
            status =
              h.outcome ??
              (evaluate(h.cards, false).bust
                ? "Busted"
                : evaluate(h.cards, !h.split).natural
                  ? "Blackjack"
                  : evaluate(h.cards, false).total === 21
                    ? "21"
                    : h.cards.length === 1
                      ? "Waiting"
                      : h.doubled
                        ? "Doubled"
                        : h.done
                          ? "Standing"
                          : h.id === view?.active
                            ? "Your turn"
                            : "Waiting");
          return (
            <div
              key={h.id}
              className={`on-table-hand ${h.id === view?.active ? "active-hand" : ""} ${item.compact ? "compact-hand" : ""} ${h.net !== undefined ? "resolved-hand" : ""}`}
              style={position(item)}
              data-hand-id={h.id}
              aria-label={`Position ${h.position + 1} Hand ${item.label.split("·")[1]?.trim()}: ${h.cards.map((c) => c.rank + symbols[c.suit]).join(" ")}; ${status}; wager ${money(h.stake)}`}
            >
              <div className="hand-heading">
                <strong>{item.label}</strong>
                <span>{status}</span>
              </div>
              <span
                className={
                  "hand-total " +
                  (evaluate(h.cards, false).bust ? "bust-total" : "")
                }
                style={{
                  left: item.total.x - item.x,
                  top: item.total.y - item.y,
                  width: item.total.width,
                  height: item.total.height,
                }}
                data-hand-total={h.id}
              >
                <small>{item.label}</small>
                {evaluate(h.cards, false).bust
                  ? "BUST · "
                  : evaluate(h.cards, false).soft &&
                      !evaluate(h.cards, !h.split).natural
                    ? "Soft "
                    : ""}
                {evaluate(h.cards, false).total}
              </span>
              {h.net !== undefined && (
                <strong
                  className={
                    "hand-result " +
                    (h.net > 0
                      ? "win-result"
                      : h.net < 0
                        ? "loss-result"
                        : "push-result")
                  }
                  data-hand-result={h.id}
                  data-outcome={h.outcome}
                  style={{
                    left: item.result.x - item.x,
                    top: item.result.y - item.y,
                    width: item.result.width,
                    height: item.result.height,
                  }}
                >
                  {h.outcome === "BLACKJACK" ? (
                    <>
                      <span className="natural-result-label">BLACKJACK!</span>
                      <span>{resultLabel(h.net)}</span>
                    </>
                  ) : (
                    resultLabel(h.net, h.outcome)
                  )}
                </strong>
              )}
            </div>
          );
        })}
        {layout.hands.map((item) => (
          <WagerVisual
            key={(s.round?.id ?? "") + item.hand.id}
            id={item.hand.id}
            stake={item.hand.stake}
            net={item.hand.net}
            source={item.wager}
            collection={layout.collection}
            playerY={Math.min(size.height - 22, item.total.y + 80)}
            skip={p.reducedMotion || p.speed === "instant"}
            compact={item.compact}
          />
        ))}
        {s.round?.positions.flatMap((pos) =>
          layout.spots
            .filter(
              (spot) =>
                spot.position === pos.index &&
                spot.kind !== "main" &&
                sum(pos.bet[spot.kind]) > 0,
            )
            .map((spot) => {
              const result = (
                view?.sideResults ?? (!busy ? s.round!.sideResults : [])
              ).find((r) => r.position === pos.index && r.kind === spot.kind);
              const stake = sum(pos.bet[spot.kind]),
                id = s.round!.id + ":" + pos.index + ":" + spot.kind;
              return (
                <div key={id}>
                  <div
                    className="round-side-bet"
                    data-round-side={pos.index + ":" + spot.kind}
                    style={position(spot)}
                  >
                    <span>
                      {spot.kind === "pairs" ? "PP" : "21+3"} · {money(stake)}
                    </span>
                    {result && (
                      <strong
                        className={
                          "side-result " +
                          (result.net > 0
                            ? "win-result"
                            : result.net < 0
                              ? "loss-result"
                              : "push-result")
                        }
                        data-side-result={pos.index + ":" + spot.kind}
                        title={result.category}
                      >
                        {resultLabel(result.net)}
                      </strong>
                    )}
                  </div>
                  <WagerVisual
                    id={id}
                    stake={stake}
                    net={result?.net}
                    source={{ x: spot.x + spot.width / 2, y: spot.y + 28 }}
                    collection={layout.collection}
                    playerY={Math.min(size.height - 22, spot.y + 85)}
                    skip={p.reducedMotion || p.speed === "instant"}
                    compact
                  />
                </div>
              );
            }),
        )}
        {layout.hands
          .filter((h) => h.actions)
          .map((item) => (
            <div
              key={item.hand.id}
              className="floating-actions"
              style={position(item.actions!)}
              data-active-hand={item.hand.id}
              aria-label="Active hand actions"
            >
              {(["hit", "stand", "double", "split"] as Action[]).map(
                (action, index) => {
                  const Icon = [Plus, HandIcon, ChevronsUp, Split][index]!;
                  return (
                    <button
                      key={action}
                      aria-label={
                        action.charAt(0).toUpperCase() + action.slice(1)
                      }
                      className={
                        hint &&
                        p.highlight &&
                        rec?.available === action &&
                        actions.includes(action)
                          ? "strategy-suggestion"
                          : ""
                      }
                      disabled={busy || !actions.includes(action)}
                      title={
                        !actions.includes(action)
                          ? "Unavailable for these cards, remaining split capacity or available chips"
                          : action
                      }
                      onClick={() => actNow(action)}
                    >
                      <Icon size={15} />
                      <span>{action}</span>
                      <kbd>{p.shortcuts[action]}</kbd>
                    </button>
                  );
                },
              )}
              {hint && rec && (
                <details
                  className="hint-explanation"
                  onToggle={(e) => {
                    if (e.currentTarget.open) exposure({ explanation: true });
                  }}
                >
                  <summary aria-label="Explain recommendation">
                    <BookOpen size={15} />
                  </summary>
                  <p>{rec.explanation}</p>
                </details>
              )}
            </div>
          ))}
        {s.round?.phase === "insurance" && !busy && (
          <div className="insurance-on-table">
            {s.round.positions
              .filter((pos) => !pos.insuranceChoice)
              .map((pos) => (
                <section key={pos.index}>
                  <strong>Position {pos.index + 1} · Insurance?</strong>
                  <button onClick={() => insurance(pos.index, "decline")}>
                    Decline
                  </button>
                  <button
                    disabled={s.balance < sum(pos.bet.main) / 2}
                    onClick={() => insurance(pos.index, "insurance")}
                  >
                    Insure {money(sum(pos.bet.main) / 2)}
                  </button>
                  {evaluate(pos.original).natural && (
                    <button onClick={() => insurance(pos.index, "even")}>
                      Even money
                    </button>
                  )}
                </section>
              ))}
          </div>
        )}
        {(betting || completed) && (
          <>
            <div
              className="on-table-betting-controls"
              style={position(layout.bettingBar)}
              aria-label="Betting controls"
            >
              <button
                disabled={!betting || !s.undo.length}
                onClick={() => void dispatch({ type: "undo" })}
              >
                <Undo2 size={15} />
                Undo
              </button>
              <button
                disabled={!betting && !completed}
                onClick={() => void dispatch({ type: "clear" })}
              >
                <Trash2 size={15} />
                {completed ? "New bets" : "Clear"}
              </button>
              <button
                disabled={!hasPrevious}
                onClick={() => void dispatch({ type: "rebet" })}
              >
                <RotateCcw size={15} />
                Rebet
              </button>
              <button
                disabled={completed ? !hasPrevious : pendingTotal(s) === 0}
                onClick={() => void dispatch({ type: "doubleBet" })}
                title={
                  completed
                    ? "Restore twice the previous initial bets for review"
                    : "Double pending bets for review"
                }
              >
                Double bet
              </button>
              <button
                disabled={!hasPrevious}
                onClick={() => void dispatch({ type: "rebetDeal" })}
              >
                Rebet & Deal
              </button>
              {betting && (
                <button
                  className="deal-primary"
                  disabled={pendingTotal(s) < 20}
                  onClick={() => void dispatch({ type: "deal" })}
                >
                  <Play size={15} />
                  Deal
                </button>
              )}
              {completed && (
                <span className={`round-net ${s.round!.net < 0 ? "loss" : ""}`}>
                  NET {s.round!.net > 0 ? "+" : ""}
                  {money(s.round!.net)}
                </span>
              )}
            </div>
            {betting && <ChipTray rect={layout.rack} />}
          </>
        )}
        {betting && (
          <p
            className="table-instructions"
            style={{ top: Math.max(42, layout.spots[0]!.y - 27) }}
          >
            Select a chip · tap a spot · right-click or hold to remove
          </p>
        )}
        {(error || notice) && (!panel || panel === "count") && (
          <div
            role={error ? "alert" : "status"}
            className={`on-table-message ${error ? "error" : ""}`}
          >
            <span>{error || notice}</span>
            <button
              aria-label="Dismiss table message"
              onClick={() => useGame.setState({ error: "", notice: "" })}
            >
              <X size={15} />
            </button>
          </div>
        )}
        {panel === "count" && (
          <section
            className="count-popover"
            role="dialog"
            aria-label="Count check"
            style={{ right: 14, top: layout.count.y + layout.count.height + 8 }}
          >
            <header>
              <strong>Count check</strong>
              <button
                aria-label="Close count check"
                onClick={() => game.setPanel(null)}
              >
                <X size={17} />
              </button>
            </header>
            <Count />
          </section>
        )}
      </div>
    </section>
  );
}
