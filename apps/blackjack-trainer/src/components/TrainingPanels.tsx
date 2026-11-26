import { useEffect, useState } from "react";
import { useGame, dispatch, env, preferences } from "../store";
import { between, activeHand } from "../engine/engine";
import { money, pendingTotal } from "../engine/types";
import type { CountCheck } from "../engine/types";
import { trueCount, value } from "../engine/cards";
import {
  recommend,
  tables,
  upcards,
  STRATEGY_VERSION,
} from "../training/strategy";
import { Button } from "./ui/button";
import { Field } from "./fields";
export function Wallet() {
  const { state: s, busy } = useGame();
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  if (!s) return null;
  const seconds = Math.max(
    0,
    Math.ceil((s.lastClaim + 3600000 - Math.max(now, s.lastClock)) / 1000),
  );
  return (
    <>
      <p className="eyebrow">Virtual chips only</p>
      <div className="wallet-amount">
        {money(s.balance - pendingTotal(s))}
        <small> available chips</small>
      </div>
      <p>
        {money(pendingTotal(s))} reserved in pending bets. Committed wagers are
        already deducted.
      </p>
      <section className="inset">
        <h3>Hourly chips · +1,000</h3>
        <p>
          {seconds
            ? `Available in ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`
            : "Ready to claim"}
        </p>
        <Button
          variant="primary"
          disabled={!!seconds || !between(s) || busy}
          onClick={() => void dispatch({ type: "claim" })}
        >
          Claim chips
        </Button>
        <p className="muted">
          Manual claim only. Missed hours do not accumulate.
        </p>
      </section>
      <section className="inset">
        <h3>Rewarded advertisements · +500</h3>
        <p>Unavailable. No advertising provider is connected.</p>
        <Button disabled>Watch ad · unavailable</Button>
        <p className="muted">Learning tools never require an advertisement.</p>
      </section>
      <h3>Recent wallet transactions</h3>
      <div className="list">
        {s.ledger
          .slice(-12)
          .reverse()
          .map((t) => (
            <div className="list-row" key={t.id}>
              <span>
                {t.kind}
                <small>{new Date(t.time).toLocaleString()}</small>
              </span>
              <strong>
                {t.amount > 0 ? "+" : ""}
                {money(t.amount)}
              </strong>
            </div>
          ))}
      </div>
      <p className="muted">
        Virtual chips have no monetary value. They cannot be purchased,
        transferred, withdrawn or redeemed.
      </p>
    </>
  );
}
export function Strategy() {
  const { state: s, preferences: p } = useGame();
  if (!s) return null;
  const current = recommend(s),
    t = tables(s.rules.decks),
    h = activeHand(s),
    dealer = s.round?.dealer[0];
  return (
    <>
      <p>{s.rules.decks} decks · S17 · double after split · no surrender</p>
      <p className="muted">
        H: Hit · S: Stand · Dh: Double, otherwise hit · Ds: Double, otherwise
        stand · P: Split
      </p>
      {Object.entries(t).map(([category, rows]) => (
        <section key={category}>
          <h3>
            {category === "pair"
              ? "Pairs"
              : category === "soft"
                ? "Soft totals"
                : "Hard totals"}
          </h3>
          <div className="chart-scroll">
            <table className="strategy-chart">
              <thead>
                <tr>
                  <th scope="col">Hand</th>
                  {upcards.map((u) => (
                    <th key={u} scope="col">
                      {u}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(rows).map(([total, cells]) => (
                  <tr key={total}>
                    <th scope="row">
                      {category === "pair"
                        ? `${Number(total) === 11 ? "A" : total}, ${Number(total) === 11 ? "A" : total}`
                        : total}
                    </th>
                    {cells.map((cell, i) => {
                      const highlight =
                        p.strategy &&
                        h &&
                        dealer &&
                        current?.category === category &&
                        current.total === Number(total) &&
                        i === (value(dealer) === 11 ? 9 : value(dealer) - 2);
                      return (
                        <td
                          key={i}
                          className={`${cell} ${highlight ? "current" : ""}`}
                          title={`${category} ${total} against ${upcards[i]}: ${cell}`}
                        >
                          {cell}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
      <p>
        Hard totals below the range hit; hard 17+ stands. Soft 19+ stands except
        the displayed single-deck soft 19 double. Fives use hard 10; tens stand.
        Decline insurance and even money under conventional count-independent
        strategy.
      </p>
      <p className="muted">
        Version {STRATEGY_VERSION}. No hidden cards, future cards or count
        deviations enter recommendations. Two-deck multi-card soft 18 versus ace
        stands; two-card soft 18 hits. This is educational guidance, not a
        guarantee of profit.
      </p>
    </>
  );
}
export function Count() {
  const { state: s, preferences: p } = useGame();
  const [kind, setKind] = useState<"running" | "true">("running"),
    [answer, setAnswer] = useState(""),
    [result, setResult] = useState<CountCheck | null>(null);
  const [started] = useState(performance.now());
  const [wasAssisted] = useState(
    p.running ||
      p.trueCount ||
      p.weights ||
      !!useGame.getState().exposure.running ||
      !!useGame.getState().exposure.trueCount ||
      !!useGame.getState().exposure.weights,
  );
  if (!s) return null;
  const runningLocked =
    kind === "running" &&
    (s.countTraining.visible || s.countTraining.hiddenRounds < 10);
  const check = async (skip = false, reveal = false) => {
    if (!skip && !reveal && runningLocked) return;
    if (
      !skip &&
      !reveal &&
      (answer.trim() === "" || !Number.isFinite(Number(answer)))
    ) {
      useGame.setState({ notice: "Enter a number for your count." });
      return;
    }
    const actual = kind === "running" ? s.shoe.running : trueCount(s.shoe),
      submitted = skip || reveal ? null : Number(answer),
      error = submitted === null ? null : submitted - actual;
    const record: CountCheck = {
      id: env().id(),
      time: Date.now(),
      kind,
      submitted,
      actual,
      error,
      correct:
        error !== null &&
        Math.abs(error) <= (kind === "running" ? 0 : 0.100000001),
      assisted: wasAssisted,
      revealed: reveal,
      durationMs: performance.now() - started,
      decks: s.rules.decks,
      penetration: s.shoe.cursor / s.shoe.cards.length,
      sessionId: s.sessionId,
    };
    await dispatch({ type: "check", check: record });
    const committed = useGame
      .getState()
      .state?.checks.find((c) => c.id === record.id);
    if (committed) setResult(committed);
  };
  return (
    <>
      <p>
        Between-round practice. Your answer does not affect the shoe or wallet.
      </p>
      {!result ? (
        <>
          <Field label="Exercise">
            <select
              value={kind}
              onChange={(e) => {
                const kind = e.target.value as "running" | "true";
                setKind(kind);
                if (kind === "true") preferences({ running: true });
              }}
            >
              <option value="running">Running count</option>
              <option value="true">True count</option>
            </select>
          </Field>
          {kind === "true" && (
            <p>
              Running count: {s.shoe.running}. Undealt decks:{" "}
              {((s.shoe.cards.length - s.shoe.cursor) / 52).toFixed(2)}. Divide
              the first by the second; answer to one decimal place.
            </p>
          )}
          {runningLocked && (
            <p>
              Keep the running count hidden for 10 completed rounds to unlock
              guessing.
            </p>
          )}
          {!runningLocked && (
            <Field label={`Your ${kind} count`}>
              <input
                autoFocus
                type="number"
                step={kind === "true" ? ".1" : "1"}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") check();
                }}
              />
            </Field>
          )}
          <div className="button-row">
            <Button
              variant="primary"
              disabled={runningLocked}
              onClick={() => check()}
            >
              Check answer
            </Button>
            <Button onClick={() => check(true)}>Skip</Button>
            <Button variant="quiet" onClick={() => check(false, true)}>
              Reveal answer
            </Button>
          </div>
          <p className="muted">
            {wasAssisted
              ? "Classified as assisted because counting help was already visible."
              : "The live count is concealed during this check."}{" "}
            Skips and reveals are not graded as incorrect.
          </p>
        </>
      ) : (
        <section className="inset">
          <h3>
            {result.submitted === null
              ? result.revealed
                ? "Answer revealed"
                : "Skipped"
              : result.correct
                ? "Correct"
                : "Keep practicing"}
          </h3>
          {(result.submitted !== null || result.revealed) && (
            <p>
              Correct count: {result.actual.toFixed(kind === "true" ? 1 : 0)}
            </p>
          )}
          {result.error !== null && (
            <p>
              Your answer: {result.submitted} · difference{" "}
              {result.error.toFixed(2)}
            </p>
          )}
          <p>
            {kind === "true"
              ? "True count is running count / undealt decks. Answers within ±0.1 are accepted."
              : "Hi-Lo: 2–6 = +1; 7–9 = 0; tens and aces = −1. Count each exposed card once."}
          </p>
        </section>
      )}
    </>
  );
}
export function Learn() {
  const s = useGame((v) => v.state)!;
  const [topic, setTopic] = useState("fundamentals"),
    [answer, setAnswer] = useState(""),
    [review, setReview] = useState(false);
  return (
    <>
      <div className="tabs">
        {["fundamentals", "strategy", "counting"].map((t) => (
          <Button
            key={t}
            onClick={() => {
              setTopic(t);
              setReview(false);
              setAnswer("");
            }}
          >
            {t}
          </Button>
        ))}
      </div>
      {topic === "fundamentals" ? (
        <>
          <h3>Make a hand, then make a decision</h3>
          <p>
            Aces flex between 1 and 11. A + 6 is soft 17; adding a ten makes
            hard 17. An original ace and ten is a natural blackjack. A split ace
            plus ten is ordinary 21.
          </p>
          <p>
            Hit takes a card. Stand keeps your hand. Double commits an equal
            wager, takes one card and stands. Split creates two hands from
            equal-valued cards with a matching stake. A push returns the stake.
            A bust loses even if the dealer later busts.
          </p>
          <p>
            Insurance bets that the dealer has blackjack. Even money trades 3:2
            potential for a guaranteed 1:1. The dealer follows S17. Side bets
            use separate combinations.
          </p>
          <Field label="A + 6 + 10 has what total?">
            <select value={answer} onChange={(e) => setAnswer(e.target.value)}>
              <option value="">Choose</option>
              <option>17</option>
              <option>27</option>
            </select>
          </Field>
        </>
      ) : topic === "strategy" ? (
        <>
          <h3>Judge the decision separately</h3>
          <p>
            Basic strategy chooses the best long-run expectation under these
            rules. It does not promise a winning hand. Find the hard total, soft
            total or pair row, then the dealer upcard. Unavailable doubles and
            splits use chart fallbacks.
          </p>
          <p>
            A correct stand can lose; an incorrect hit can win. Your decision is
            recorded before the next card. Recommendations never inspect the
            hole card or future cards.
          </p>
          <Field label="Does winning make an incorrect decision correct?">
            <select value={answer} onChange={(e) => setAnswer(e.target.value)}>
              <option value="">Choose</option>
              <option>No</option>
              <option>Yes</option>
            </select>
          </Field>
        </>
      ) : (
        <>
          <h3>Count visible cards</h3>
          <p>
            Hi-Lo assigns +1 to 2–6, 0 to 7–9, −1 to tens and aces. Keep a
            running total across rounds; reset only on a new shoe. True count
            divides by undealt decks. A positive count does not guarantee
            profit.
          </p>
          <div className="tutorial-cards">5♣ · K♥ · 3♠ · 8♦</div>
          <p>Start at zero. What is the count after these four cards?</p>
          <Field label="Tutorial count">
            <input
              type="number"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
            />
          </Field>
        </>
      )}
      <Button
        variant="primary"
        disabled={!answer}
        onClick={() => {
          setReview(true);
          if (
            answer ===
            (topic === "fundamentals"
              ? "17"
              : topic === "strategy"
                ? "No"
                : "1")
          )
            void dispatch({ type: "tutorial", name: topic });
        }}
      >
        Check lesson
      </Button>
      {review && (
        <p role="status">
          {answer ===
          (topic === "fundamentals" ? "17" : topic === "strategy" ? "No" : "1")
            ? "Correct. Lesson completed."
            : `Try again. ${topic === "fundamentals" ? "The ace becomes 1, so the total is 17." : topic === "strategy" ? "A result does not change the original decision." : "The weights +1, −1, +1, 0 finish at +1."}`}
        </p>
      )}
      <p className="muted">
        Tutorials never affect the live shoe or wallet. Completed:{" "}
        {s.tutorials.join(", ") || "none yet"}.
      </p>
    </>
  );
}
