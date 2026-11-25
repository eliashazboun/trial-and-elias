import { Trend } from "./Trend";
import { useState } from "react";
import { mastery } from "../training/mastery";
import type { ReactNode } from "react";
import { useGame, dispatch } from "../store";
import { between } from "../engine/engine";
import { symbols } from "../engine/cards";
import { money } from "../engine/types";
import type { Card, Round } from "../engine/types";
import { Button } from "./ui/button";
import { Field, percent } from "./fields";
import { exportCSV } from "../storage/backup";
const cardsText = (cards: Card[]) =>
  cards.map((c) => c.rank + symbols[c.suit]).join(" ");
function HistoryViewer({ round }: { round: Round }) {
  const [step, setStep] = useState(0);
  const event = round.events[Math.min(step, round.events.length - 1)];
  if (!event) return null;
  return (
    <section className="inset">
      <h3>
        Round review · event {step + 1} / {round.events.length}
      </h3>
      <p>{event.text}</p>
      <p>
        Dealer:{" "}
        {event.snapshot.dealer
          .map((c) => (c ? c.rank + symbols[c.suit] : "Face down"))
          .join(" · ")}
      </p>
      {event.snapshot.hands.map((h) => (
        <p key={h.id}>
          Position {h.position + 1} · {cardsText(h.cards)} ·{" "}
          {h.outcome ?? "In play"}
        </p>
      ))}
      <div className="button-row">
        <Button disabled={!step} onClick={() => setStep(step - 1)}>
          Previous event
        </Button>
        <Button
          disabled={step >= round.events.length - 1}
          onClick={() => setStep(step + 1)}
        >
          Next event
        </Button>
      </div>
      <p className="muted">
        Read-only review. Cards remain hidden until the original reveal event.
      </p>
    </section>
  );
}
function BalanceChart({ rounds }: { rounds: Round[] }) {
  let total = 0;
  const values = [0, ...rounds.map((r) => (total += r.net / 2))],
    min = Math.min(...values),
    max = Math.max(...values),
    range = Math.max(1, max - min);
  const points = values
    .map(
      (v, i) =>
        `${10 + (i / Math.max(1, values.length - 1)) * 580},${150 - ((v - min) / range) * 130}`,
    )
    .join(" ");
  return (
    <svg
      className="balance-chart"
      viewBox="0 0 600 180"
      role="img"
      aria-label={`Retained gameplay cumulative net, ${rounds.length} rounds, ending ${total} chips`}
    >
      <title>Retained gameplay net in virtual chips</title>
      <line x1="10" y1="155" x2="590" y2="155" stroke="#777" />
      <polyline points={points} fill="none" stroke="#dec487" strokeWidth="2" />
      <text x="10" y="176" fill="currentColor">
        {rounds.length} rounds · {total} chips net
      </text>
    </svg>
  );
}
export function Stats() {
  const { state: s } = useGame();
  const [tab, setTab] = useState("Overview"),
    [deck, setDeck] = useState("all"),
    [period, setPeriod] = useState("lifetime"),
    [assistance, setAssistance] = useState("all"),
    [position, setPosition] = useState("all"),
    [category, setCategory] = useState("all"),
    [session, setSession] = useState("all"),
    [from, setFrom] = useState(""),
    [to, setTo] = useState(""),
    [review, setReview] = useState<Round | null>(null),
    [historyPage, setHistoryPage] = useState(0);
  if (!s) return null;
  const t = s.totals;
  const history = s.history.filter(
    (r) =>
      (deck === "all" || r.rules.decks === Number(deck)) &&
      (session === "all" || r.sessionId === session) &&
      (period === "lifetime" ||
        Date.now() - r.time < Number(period) * 86400000) &&
      (!from || r.time >= Date.parse(from)) &&
      (!to || r.time < Date.parse(to) + 86400000),
  );
  const decisions = history
    .flatMap((r) => r.decisions)
    .filter(
      (d) =>
        (position === "all" || d.position === Number(position)) &&
        (category === "all" || d.category === category) &&
        (assistance === "all" ||
          (d.assistance.recommendation ||
            d.assistance.chart ||
            d.assistance.explanation ||
            d.assistance.warning) ===
            (assistance === "assisted")),
    );
  const selected = history.filter((r) => r.phase === "complete"),
    hands = selected
      .flatMap((r) => r.hands)
      .filter((h) => position === "all" || h.position === Number(position)),
    sides = history
      .flatMap((r) => r.sideResults)
      .filter((x) => position === "all" || x.position === Number(position)),
    independent = decisions.filter(
      (d) =>
        !d.assistance.recommendation &&
        !d.assistance.chart &&
        !d.assistance.explanation &&
        !d.assistance.warning,
    );
  const checks = s.checks.filter(
    (c) =>
      c.submitted !== null &&
      (deck === "all" || c.decks === Number(deck)) &&
      (session === "all" || c.sessionId === session),
  );
  const matrix = new Map<string, { attempts: number; correct: number }>();
  for (const d of decisions) {
    const key = `${d.category} ${d.total} vs ${d.dealer.rank}`,
      m = matrix.get(key) ?? { attempts: 0, correct: 0 };
    m.attempts++;
    if (d.correct) m.correct++;
    matrix.set(key, m);
  }
  const line = (label: string, v: ReactNode) => (
    <div className="list-row">
      <span>{label}</span>
      <strong>{v}</strong>
    </div>
  );
  return (
    <>
      <div className="tabs">
        {[
          "Overview",
          "Gameplay",
          "Bankroll",
          "Strategy",
          "Counting",
          "Side bets",
          "History",
          "Achievements",
          "Sessions",
        ].map((name) => (
          <Button
            key={name}
            variant={tab === name ? "primary" : "quiet"}
            onClick={() => setTab(name)}
          >
            {name}
          </Button>
        ))}
      </div>
      <details>
        <summary>Filter retained history</summary>
        <div className="settings-grid">
          <Field label="Decks">
            <select value={deck} onChange={(e) => setDeck(e.target.value)}>
              <option value="all">All decks</option>
              {[1, 2, 4, 6, 8].map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </Field>
          <Field label="Period">
            <select value={period} onChange={(e) => setPeriod(e.target.value)}>
              <option value="lifetime">All retained</option>
              <option value="1">Last day</option>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
            </select>
          </Field>
          <Field label="Session">
            <select
              value={session}
              onChange={(e) => setSession(e.target.value)}
            >
              <option value="all">All sessions</option>
              {s.sessions.map((x) => (
                <option value={x.id} key={x.id}>
                  {new Date(x.start).toLocaleString()}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Assistance">
            <select
              value={assistance}
              onChange={(e) => setAssistance(e.target.value)}
            >
              {["all", "assisted", "independent"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </Field>
          <Field label="Position">
            <select
              value={position}
              onChange={(e) => setPosition(e.target.value)}
            >
              <option value="all">All positions</option>
              {[0, 1, 2].map((x) => (
                <option value={x} key={x}>
                  {x + 1}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Hand category">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {["all", "hard", "soft", "pair", "insurance"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </Field>
          <Field label="From">
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </Field>
          <Field label="Through">
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </Field>
        </div>
      </details>
      <p className="muted">
        Lifetime overview uses preserved aggregates. Filtered details cover{" "}
        {history.length} retained rounds only. Pruned rounds cannot be
        reconstructed.
      </p>
      {tab === "Overview" ? (
        <>
          <div className="metric-grid">
            {[
              ["Rounds", t.rounds],
              ["Player hands", t.hands],
              ["Strategy accuracy", percent(t.correct, t.decisions)],
              [
                "Independent accuracy",
                percent(t.independentCorrect, t.independent),
              ],
              ["Counting accuracy", percent(t.countCorrect, t.counts)],
              ["Gameplay net", money(t.mainNet + t.sideNet + t.insuranceNet)],
            ].map(([label, v]) => (
              <div className="metric" key={label}>
                <small>{label}</small>
                <strong>{v}</strong>
              </div>
            ))}
          </div>
          <p>
            Decision quality is measured independently of chips won or lost.
            Forced actions do not inflate accuracy.
          </p>
        </>
      ) : tab === "Gameplay" ? (
        <div className="list">
          {line("Retained completed rounds", selected.length)}
          {line(
            "Original positions",
            selected.reduce((a, r) => a + r.positions.length, 0),
          )}
          {line("Resulting hands", hands.length)}
          {line(
            "Wins / losses / pushes",
            `${hands.filter((h) => (h.net ?? 0) > 0).length} / ${hands.filter((h) => (h.net ?? 0) < 0).length} / ${hands.filter((h) => h.net === 0).length}`,
          )}
          {line(
            "Win rate per retained hand",
            percent(hands.filter((h) => (h.net ?? 0) > 0).length, hands.length),
          )}
          {line(
            "Natural frequency per retained hand",
            percent(
              hands.filter((h) => h.outcome === "BLACKJACK").length,
              hands.length,
            ),
          )}
          {line("Lifetime doubles / splits", `${t.doubles} / ${t.splits}`)}
          {line("Lifetime cards / shuffles", `${t.cards} / ${t.shuffles}`)}
        </div>
      ) : tab === "Bankroll" ? (
        <>
          <div className="list">
            {line("Actual wallet", money(s.balance))}
            {line("Lifetime main net", money(t.mainNet))}
            {line("Lifetime side net", money(t.sideNet))}
            {line("Lifetime insurance net", money(t.insuranceNet))}
            {line("Free rewards", money(t.rewards))}
            {line(
              "Committed main / side / insurance",
              `${money(t.mainStaked)} / ${money(t.sideStaked)} / ${money(t.insuranceStaked)}`,
            )}
          </div>
          <BalanceChart rounds={history} />
          <p className="muted">
            Cumulative net from retained rounds, excluding rewards and resets.
          </p>
          <Button onClick={() => exportCSV("wallet", s.ledger)}>
            Export wallet CSV
          </Button>
        </>
      ) : tab === "Strategy" ? (
        <>
          <p>
            {decisions.length} decisions ·{" "}
            {percent(
              decisions.filter((d) => d.correct).length,
              decisions.length,
            )}{" "}
            correct · {independent.length} independent
          </p>
          <div className="list">
            {[...matrix].map(([key, m]) => (
              <div className="list-row" key={key}>
                <span>
                  {key}
                  {m.attempts >= 5 && m.correct / m.attempts < 0.8
                    ? " · recurring mistake"
                    : ""}
                </span>
                <strong>
                  {m.correct}/{m.attempts} · {percent(m.correct, m.attempts)}
                </strong>
              </div>
            ))}
          </div>
          <h3>Mistake review</h3>
          {decisions
            .filter((d) => !d.correct)
            .slice(-30)
            .reverse()
            .map((d) => (
              <div className="inset" key={d.id}>
                <p>
                  {cardsText(d.cards)} against {d.dealer.rank} · {d.selected}{" "}
                  selected · {d.available} recommended
                </p>
                <Button
                  variant="quiet"
                  onClick={() =>
                    void dispatch({
                      type: "reviewMistake",
                      category: d.category,
                    })
                  }
                >
                  Mark explanation reviewed
                </Button>
                <small>
                  {d.constrained ? "Constrained" : "Unconstrained"} ·{" "}
                  {d.assistance.chart ||
                  d.assistance.recommendation ||
                  d.assistance.warning
                    ? "Assisted"
                    : "Independent"}{" "}
                  · {Math.round(d.durationMs)} ms · {d.tableVersion}
                </small>
              </div>
            ))}
          <Button onClick={() => exportCSV("decisions", decisions)}>
            Export decisions CSV
          </Button>
        </>
      ) : tab === "Counting" ? (
        <>
          {["running", "true"].map((kind) => {
            const rows = checks.filter((c) => c.kind === kind);
            return (
              <section className="inset" key={kind}>
                <h3>{kind} count</h3>
                <p>
                  {rows.length} submitted ·{" "}
                  {percent(rows.filter((c) => c.correct).length, rows.length)}{" "}
                  correct · mean absolute error{" "}
                  {rows.length
                    ? (
                        rows.reduce((a, c) => a + Math.abs(c.error ?? 0), 0) /
                        rows.length
                      ).toFixed(2)
                    : "—"}
                </p>
                <p>
                  Independent:{" "}
                  {rows.filter((c) => !c.assisted && !c.revealed).length} ·
                  average response{" "}
                  {rows.length
                    ? Math.round(
                        rows.reduce((a, c) => a + c.durationMs, 0) /
                          rows.length,
                      )
                    : 0}{" "}
                  ms
                </p>
                <Trend
                  label="Correctness (1 = correct, 0 = incorrect)"
                  values={rows.map((c) => (c.correct ? 1 : 0))}
                />
                <Trend
                  label="Absolute count error"
                  values={rows.map((c) => Math.abs(c.error ?? 0))}
                />
                <Trend
                  label="Response time in seconds"
                  values={rows.map((c) => c.durationMs / 1000)}
                />
                <p>
                  Mean signed error:{" "}
                  {rows.length
                    ? (
                        rows.reduce((total, c) => total + (c.error ?? 0), 0) /
                        rows.length
                      ).toFixed(2)
                    : "—"}
                </p>
                {rows.slice(-10).map((c) => (
                  <small className="count-row" key={c.id}>
                    {new Date(c.time).toLocaleDateString()} · answer{" "}
                    {c.submitted} · expected{" "}
                    {c.actual.toFixed(kind === "true" ? 1 : 0)} · error{" "}
                    {c.error?.toFixed(2)} ·{" "}
                    {c.assisted ? "assisted" : "independent"}
                  </small>
                ))}
              </section>
            );
          })}
          <Button onClick={() => exportCSV("count-checks", checks)}>
            Export counting CSV
          </Button>
        </>
      ) : tab === "Side bets" ? (
        <>
          {["pairs", "three"].map((kind) => {
            const rows = sides.filter((x) => x.kind === kind);
            return (
              <section className="inset" key={kind}>
                <h3>{kind === "pairs" ? "Perfect Pairs" : "21+3"}</h3>
                <p>
                  {rows.length} wagers · hit rate{" "}
                  {percent(rows.filter((x) => x.ratio > 0).length, rows.length)}{" "}
                  · stake {money(rows.reduce((a, x) => a + x.stake, 0))} · net{" "}
                  {money(rows.reduce((a, x) => a + x.net, 0))}
                </p>
                <p>
                  Wins {rows.filter((x) => x.ratio > 0).length} · Losses{" "}
                  {rows.filter((x) => !x.ratio).length} · Returned stakes{" "}
                  {money(
                    rows
                      .filter((x) => x.ratio > 0)
                      .reduce((total, x) => total + x.stake, 0),
                  )}{" "}
                  · Winning profit{" "}
                  {money(
                    rows
                      .filter((x) => x.ratio > 0)
                      .reduce((total, x) => total + x.net, 0),
                  )}
                </p>
                {[...new Set(rows.map((x) => x.category))].map((c) => (
                  <p key={c}>
                    {c}: {rows.filter((x) => x.category === c).length}
                  </p>
                ))}
              </section>
            );
          })}
          <Button onClick={() => exportCSV("side-bets", sides)}>
            Export side bets CSV
          </Button>
        </>
      ) : tab === "History" ? (
        <>
          {review && <HistoryViewer key={review.id} round={review} />}
          <div className="list">
            {history
              .slice(
                Math.max(0, history.length - (historyPage + 1) * 50),
                Math.max(0, history.length - historyPage * 50),
              )
              .reverse()
              .map((r) => (
                <button
                  className="history-row"
                  key={r.id}
                  onClick={() => setReview(r)}
                >
                  <span>
                    {new Date(r.time).toLocaleString()}
                    <small>
                      {r.rules.decks} decks · {r.hands.length} hands · {r.phase}
                    </small>
                  </span>
                  <strong>
                    {r.net > 0 ? "+" : ""}
                    {money(r.net)}
                  </strong>
                </button>
              ))}
          </div>
          <div className="button-row">
            <Button
              disabled={!historyPage}
              onClick={() => setHistoryPage(historyPage - 1)}
            >
              Newer rounds
            </Button>
            <Button
              disabled={(historyPage + 1) * 50 >= history.length}
              onClick={() => setHistoryPage(historyPage + 1)}
            >
              Older rounds
            </Button>
          </div>
          {!history.length && (
            <p>No rounds yet. Play a round to begin your history.</p>
          )}
          <div className="button-row">
            <Button
              onClick={() =>
                exportCSV(
                  "rounds",
                  history.map((r) => ({
                    id: r.id,
                    time: r.time,
                    session: r.sessionId,
                    decks: r.rules.decks,
                    hands: r.hands.length,
                    netChips: r.net / 2,
                    phase: r.phase,
                  })),
                )
              }
            >
              Rounds CSV
            </Button>
            <Button onClick={() => exportCSV("hands", hands)}>Hands CSV</Button>
          </div>
        </>
      ) : tab === "Achievements" ? (
        <>
          <p>
            Proficiency requires 30 independent decisions at 90% accuracy per
            category. Independent Thinker requires 100 independent decisions at
            90%. Wagers, wins and advertisements do not earn mastery.
          </p>
          {[
            "First Lesson",
            "Know the Basics",
            "Hard Decisions",
            "Soft Touch",
            "Split Personality",
            "Keep Count",
            "True Understanding",
            "Independent Thinker",
            "Well Rounded",
            "Lessons Learned",
          ].map((name) => (
            <div className="list-row" key={name}>
              <span>{name}</span>
              <strong>{s.achievements[name] ? "Unlocked" : "Learning"}</strong>
            </div>
          ))}
          <h3>Skill mastery</h3>
          <p>
            Fundamentals:{" "}
            {s.tutorials.includes("fundamentals") ? "Developing" : "Learning"} ·
            Basic strategy: {mastery(t.independent, t.independentCorrect)} ·
            Counting:{" "}
            {mastery(
              checks.filter((c) => !c.assisted).length,
              checks.filter((c) => !c.assisted && c.correct).length,
            )}
          </p>
          <p>
            Levels require independent observations: Developing 5; Proficient 30
            at 90%; Advanced 100 at 95%; Mastered 250 at 98%.
          </p>
          <p>
            First Lesson unlocks the Scholar card back. Lessons Learned requires
            reviewing a mistake and then 30 independent decisions in that
            category at 90% accuracy.
          </p>
        </>
      ) : (
        <>
          <div className="button-row">
            <Button
              disabled={!between(s)}
              onClick={() => void dispatch({ type: "newSession" })}
            >
              Start new session
            </Button>
            <Button
              disabled={!between(s)}
              onClick={() => void dispatch({ type: "endSession" })}
            >
              End session
            </Button>
          </div>
          {s.sessions
            .slice(-30)
            .reverse()
            .map((x) => (
              <div className="list-row" key={x.id}>
                <span>
                  {new Date(x.start).toLocaleString()}
                  <small>
                    {x.end ? "Ended" : "Active"} · {x.rounds} rounds · {x.hands}{" "}
                    hands
                  </small>
                </span>
                <strong>{money(x.net)} gameplay</strong>
              </div>
            ))}
          <Button onClick={() => exportCSV("sessions", s.sessions)}>
            Export sessions CSV
          </Button>
        </>
      )}
    </>
  );
}
