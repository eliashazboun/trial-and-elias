import { useEffect, useState } from "react";
import { dispatch, useGame } from "../store";
import { money } from "../engine/types";

/** The answer is evaluated in the engine; no actual count is passed into this form. */
export function CountGuess() {
  const { state, busy, pendingCommands, locked, preferences, exposure } =
    useGame();
  const training = state!.countTraining;
  const eligible = !training.visible && training.hiddenRounds >= 10;
  const [answer, setAnswer] = useState("");
  const [penaltyFresh, setPenaltyFresh] = useState(false);
  useEffect(() => {
    setAnswer("");
  }, [training.visible, training.peekId, eligible]);
  useEffect(() => {
    const remaining = (training.lastPenalty?.time ?? 0) + 4500 - Date.now();
    setPenaltyFresh(remaining > 0);
    if (remaining <= 0) return;
    const timer = setTimeout(() => setPenaltyFresh(false), remaining);
    return () => clearTimeout(timer);
  }, [training.lastPenalty?.id, training.lastPenalty?.time]);
  const valid =
    /^[+-]?\d+$/.test(answer.trim()) && Number.isSafeInteger(Number(answer));
  return (
    <div className="count-guess" aria-live="polite">
      {training.visible ? (
        training.peekId && (
          <p className="guess-warning">
            You can only guess the count when count is hidden
          </p>
        )
      ) : (
        <>
          {penaltyFresh && training.lastPenalty ? (
            <p className="guess-penalty" key={training.lastPenalty.id}>
              Cheaters never prosper{" "}
              <span>−{money(training.lastPenalty.amount)} chips</span>
              {training.lastPenalty.clearedBets && (
                <small>Pending wagers cleared.</small>
              )}
            </p>
          ) : (
            !eligible && (
              <p>
                Guess unlocks in {Math.max(0, 10 - training.hiddenRounds)}{" "}
                rounds.
              </p>
            )
          )}
          {eligible && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!valid || busy || pendingCommands || locked) return;
                void dispatch({
                  type: "countGuess",
                  value: Number(answer),
                  assisted:
                    preferences.weights ||
                    preferences.trueCount ||
                    !!exposure.weights ||
                    !!exposure.trueCount ||
                    !!exposure.running,
                });
                setAnswer("");
              }}
            >
              <input
                aria-label="Running count guess"
                type="number"
                step="1"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                autoComplete="off"
              />
              <button
                type="submit"
                disabled={!valid || busy || !!pendingCommands || locked}
              >
                Submit Guess
              </button>
            </form>
          )}
          {eligible && training.lastGuess && (
            <p
              className={
                training.lastGuess.correct ? "guess-correct" : "guess-incorrect"
              }
            >
              {training.lastGuess.correct
                ? "Correct!"
                : "Incorrect. Try again."}
            </p>
          )}
        </>
      )}
    </div>
  );
}
