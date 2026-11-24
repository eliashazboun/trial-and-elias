import { useCallback, useEffect, useRef, useState } from "react";
import {
  ALPHABET,
  generateQuestions,
  formatTime,
  type Question,
  type Answer,
  type QuizResult,
} from "./quiz";
import { readHistoryState, persistResult } from "./history";
export default function TestingGrounds() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [phase, setPhase] = useState<"home" | "quiz" | "results">("home");
  const [history, setHistory] = useState<QuizResult[]>([]);
  const [currentResult, setCurrentResult] = useState<QuizResult | null>(null);
  const [viewedResult, setViewedResult] = useState<QuizResult | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const [storageWarning, setStorageWarning] = useState("");
  const [lastSaveSucceeded, setLastSaveSucceeded] = useState(false);
  const historyRef = useRef<QuizResult[]>([]);
  const finishedRef = useRef(false);
  const startTimeRef = useRef(0);
  const questionTimeRef = useRef(0);
  const lockedRef = useRef(false);

  const advanceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const loaded = readHistoryState();
    historyRef.current = loaded.history;
    setHistory(loaded.history);
    setStorageWarning(loaded.warning);
  }, []);

  useEffect(() => {
    if (phase !== "quiz") return;

    const timer = window.setInterval(() => {
      setElapsed(performance.now() - startTimeRef.current);
    }, 100);

    return () => window.clearInterval(timer);
  }, [phase]);

  const startQuiz = useCallback(() => {
    if (advanceTimeoutRef.current !== null) {
      clearTimeout(advanceTimeoutRef.current);
      advanceTimeoutRef.current = null;
    }
    finishedRef.current = false;
    setLastSaveSucceeded(false);
    const now = performance.now();

    setQuestions(generateQuestions());
    setIndex(0);
    setAnswers([]);
    setSelected(null);
    setCurrentResult(null);
    setViewedResult(null);
    setElapsed(0);

    startTimeRef.current = now;
    questionTimeRef.current = now;
    lockedRef.current = false;

    setPhase("quiz");
  }, []);

  const finishQuiz = useCallback((finalAnswers: Answer[]) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const durationMs = performance.now() - startTimeRef.current;

    const result: QuizResult = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      date: new Date().toISOString(),
      score: finalAnswers.filter((answer) => answer.isCorrect).length,
      total: finalAnswers.length,
      durationMs,
      answers: finalAnswers,
    };

    const persisted = persistResult(result, historyRef.current);
    historyRef.current = persisted.history;
    setHistory(persisted.history);
    setStorageWarning(persisted.warning);
    setLastSaveSucceeded(persisted.saved);
    setCurrentResult(result);
    setViewedResult(result);
    setElapsed(durationMs);
    setPhase("results");
  }, []);

  const submitAnswer = useCallback(
    (optionIndex: number) => {
      if (phase !== "quiz" || lockedRef.current) return;

      const question = questions[index];
      const choice = question?.options[optionIndex];

      if (!question || !choice) return;

      lockedRef.current = true;
      setSelected(choice);

      const answer: Answer = {
        letter: question.letter,
        correct: question.correct,
        selected: choice,
        isCorrect: choice === question.correct,
        timeMs: performance.now() - questionTimeRef.current,
      };

      const updatedAnswers = [...answers, answer];
      setAnswers(updatedAnswers);

      advanceTimeoutRef.current = setTimeout(() => {
        advanceTimeoutRef.current = null;
        if (index === questions.length - 1) {
          finishQuiz(updatedAnswers);
        } else {
          setIndex(index + 1);
          setSelected(null);
          questionTimeRef.current = performance.now();
          lockedRef.current = false;
        }
      }, 600);
    },
    [phase, questions, index, answers, finishQuiz],
  );

  useEffect(() => {
    if (phase !== "quiz") return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.repeat ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey
      )
        return;

      const target = event.target as HTMLElement | null;

      if (
        target?.isContentEditable ||
        target?.closest("input, textarea, select, [contenteditable='true']")
      )
        return;

      if (["1", "2", "3"].includes(event.key)) {
        event.preventDefault();
        submitAnswer(Number(event.key) - 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [phase, submitAnswer]);

  useEffect(() => {
    return () => {
      if (advanceTimeoutRef.current !== null) {
        clearTimeout(advanceTimeoutRef.current);
      }
    };
  }, []);

  const question = questions[index];
  const score = answers.filter((answer) => answer.isCorrect).length;
  const latestAnswer = answers[answers.length - 1];
  const bestScore = history.length
    ? Math.max(...history.map((result) => result.score))
    : null;

  const bestTime = history
    .filter(
      (result) =>
        result.score === ALPHABET.length && result.total === ALPHABET.length,
    )
    .reduce<
      number | null
    >((best, result) => (best === null ? result.durationMs : Math.min(best, result.durationMs)), null);

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      {/* Header */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <a
            href="/#projects"
            className="mb-4 inline-flex text-sm font-semibold text-blue-600 hover:text-blue-800"
          >
            ← Trial &amp; Elias
          </a>
          <p className="mb-1 text-sm font-semibold uppercase tracking-wider text-blue-600">
            Trial &amp; Elias
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            NATO Phonetic Trainer
          </h1>

          <p className="mt-2 text-slate-500">
            Master the NATO phonetic alphabet. Track your accuracy, improve your
            speed, and review previous attempts.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6">
        {storageWarning && (
          <p
            role="status"
            className="mx-auto max-w-4xl rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
          >
            {storageWarning}
          </p>
        )}

        {/* HOME */}
        {phase === "home" && (
          <div className="mx-auto max-w-4xl space-y-6">
            {/* Overview */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="grid grid-cols-3 gap-4 text-center">
                <Stat label="Questions" value="26" />

                <Stat
                  label="Best Score"
                  value={bestScore === null ? "—" : `${bestScore}/26`}
                />

                <Stat
                  label="Best Perfect Time"
                  value={bestTime === null ? "—" : formatTime(bestTime)}
                />
              </div>

              <div className="mt-6 border-t border-slate-100 pt-6">
                <button
                  type="button"
                  onClick={startQuiz}
                  className="w-full rounded-xl bg-blue-600 px-5 py-4 text-base font-bold text-white shadow-sm transition hover:bg-blue-700"
                >
                  Start Training →
                </button>

                <p className="mt-3 text-center text-sm text-slate-500">
                  26 randomized questions · 3 choices · Timed results
                </p>
              </div>
            </section>

            {/* Previous Attempts */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Previous Attempts
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Review your scores, completion times, and mistakes.
                  </p>
                </div>

                <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
                  {history.length}
                </span>
              </div>

              {history.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-12 text-center">
                  <p className="font-semibold text-slate-700">
                    No attempts yet
                  </p>

                  <p className="mt-2 text-sm text-slate-500">
                    Complete your first training session to start tracking your
                    progress.
                  </p>
                </div>
              ) : (
                <div className="max-h-[450px] space-y-3 overflow-y-auto">
                  {history.map((result, resultIndex) => {
                    const percentage = Math.round(
                      (result.score / result.total) * 100,
                    );

                    return (
                      <button
                        key={result.id}
                        type="button"
                        onClick={() => {
                          setViewedResult(result);
                          setPhase("results");
                        }}
                        className="flex w-full items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-blue-300 hover:bg-blue-50/50 hover:shadow-sm"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
                              percentage === 100
                                ? "bg-emerald-100 text-emerald-700"
                                : percentage >= 80
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {percentage}%
                          </div>

                          <div>
                            <p className="font-bold text-slate-900">
                              {result.score}/{result.total} Correct
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {new Date(result.date).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="font-mono text-sm font-bold text-blue-600">
                            {formatTime(result.durationMs)}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {resultIndex === 0
                              ? "Latest attempt"
                              : "View details →"}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}

        {/* QUIZ */}
        {phase === "quiz" && question && (
          <div className="mx-auto max-w-4xl space-y-6">
            {/* Progress */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Progress
                  </p>

                  <p className="mt-1 text-lg font-bold text-slate-900">
                    {index + 1}
                    <span className="text-slate-400">
                      {" "}
                      / {questions.length}
                    </span>
                  </p>
                </div>

                <div className="text-center">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Time
                  </p>

                  <p className="mt-1 font-mono text-lg font-bold text-blue-600">
                    {formatTime(elapsed)}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Correct
                  </p>

                  <p className="mt-1 text-lg font-bold text-emerald-600">
                    {score}
                  </p>
                </div>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all duration-300"
                  style={{
                    width: `${((index + 1) / questions.length) * 100}%`,
                  }}
                />
              </div>
            </section>

            {/* Current Letter */}
            <section className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                What is the NATO phonetic word for
              </p>

              <div className="my-6 text-8xl font-black tracking-tight text-slate-900 sm:text-9xl">
                {question.letter}
              </div>

              <p className="text-sm text-slate-400">
                Choose the correct phonetic word
              </p>
            </section>

            {/* Horizontal Answer Choices */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {question.options.map((option, optionIndex) => {
                const isCorrect = option === question.correct;
                const isSelected = selected === option;

                let styling =
                  "border-slate-200 bg-white hover:border-blue-300 hover:shadow-md";

                if (selected !== null) {
                  if (isCorrect) {
                    styling = "border-emerald-500 bg-emerald-50";
                  } else if (isSelected) {
                    styling = "border-red-500 bg-red-50";
                  } else {
                    styling = "border-slate-200 bg-white opacity-50";
                  }
                }

                return (
                  <button
                    key={option}
                    type="button"
                    disabled={selected !== null}
                    onClick={() => submitAnswer(optionIndex)}
                    className={`relative flex min-h-36 flex-col items-center justify-center gap-3 rounded-2xl border-2 p-5 text-center shadow-sm transition ${styling}`}
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 font-mono text-sm font-bold text-slate-600">
                      {optionIndex + 1}
                    </span>

                    <span className="text-xl font-bold text-slate-900">
                      {option}
                    </span>

                    {selected !== null && isCorrect && (
                      <span className="text-sm font-semibold text-emerald-600">
                        ✓ Correct
                      </span>
                    )}

                    {selected !== null && isSelected && !isCorrect && (
                      <span className="text-sm font-semibold text-red-600">
                        ✕ Incorrect
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Answer Feedback */}
            {selected !== null && latestAnswer && (
              <div
                role="status"
                aria-live="polite"
                className={`rounded-xl border px-5 py-4 text-center text-sm font-semibold ${
                  latestAnswer.isCorrect
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-red-200 bg-red-50 text-red-700"
                }`}
              >
                {latestAnswer.isCorrect
                  ? `Correct! ${question.letter} is ${question.correct}.`
                  : `Incorrect. ${question.letter} is ${question.correct}.`}
              </div>
            )}

            <p className="text-center text-sm text-slate-500">
              Press{" "}
              <kbd className="rounded border border-slate-300 bg-white px-2 py-1 font-mono font-semibold text-slate-700">
                1
              </kbd>
              ,{" "}
              <kbd className="rounded border border-slate-300 bg-white px-2 py-1 font-mono font-semibold text-slate-700">
                2
              </kbd>
              , or{" "}
              <kbd className="rounded border border-slate-300 bg-white px-2 py-1 font-mono font-semibold text-slate-700">
                3
              </kbd>{" "}
              to answer. The next question appears automatically.
            </p>
          </div>
        )}

        {/* RESULTS */}
        {phase === "results" && viewedResult && (
          <div className="mx-auto max-w-4xl space-y-6">
            {/* Score Summary */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                Training Results
              </p>

              <div className="my-5 text-6xl font-black tracking-tight text-blue-600">
                {Math.round((viewedResult.score / viewedResult.total) * 100)}%
              </div>

              <p className="mb-6 text-sm text-slate-500">
                {viewedResult.score === viewedResult.total
                  ? "Perfect score! Excellent work."
                  : "Review your answers below to see where you can improve."}
              </p>

              <div className="grid grid-cols-3 gap-3 border-t border-slate-100 pt-6">
                <Stat
                  label="Correct"
                  value={`${viewedResult.score}/${viewedResult.total}`}
                />

                <Stat
                  label="Time"
                  value={formatTime(viewedResult.durationMs)}
                />

                <Stat
                  label="Missed"
                  value={String(viewedResult.total - viewedResult.score)}
                />
              </div>

              <p className="mt-6 text-xs text-slate-400">
                {new Date(viewedResult.date).toLocaleString()}
              </p>
            </section>

            {/* Detailed Results */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5">
                <h2 className="text-lg font-bold text-slate-900">
                  Detailed Results
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Review every letter, your selected answer, and response time.
                </p>
              </div>

              {/* Missed Questions Summary */}
              {viewedResult.answers.some((answer) => !answer.isCorrect) && (
                <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
                  <p className="mb-3 text-sm font-bold text-red-700">
                    Letters to Review
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {viewedResult.answers
                      .filter((answer) => !answer.isCorrect)
                      .map((answer) => (
                        <span
                          key={answer.letter}
                          className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-bold text-red-700"
                        >
                          {answer.letter}
                        </span>
                      ))}
                  </div>
                </div>
              )}

              {/* Individual Answers */}
              <div className="space-y-3">
                {viewedResult.answers.map((answer, answerIndex) => (
                  <div
                    key={`${answer.letter}-${answerIndex}`}
                    className={`rounded-xl border p-4 ${
                      answer.isCorrect
                        ? "border-emerald-200 bg-emerald-50/50"
                        : "border-red-200 bg-red-50/50"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Letter */}
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl font-bold ${
                          answer.isCorrect
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {answer.letter}
                      </div>

                      {/* Answer Details */}
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-900">
                          {answer.correct}
                        </p>

                        {answer.isCorrect ? (
                          <p className="mt-1 text-xs font-medium text-emerald-700">
                            Correct answer
                          </p>
                        ) : (
                          <p className="mt-1 text-xs text-red-700">
                            Your answer:{" "}
                            <span className="font-semibold">
                              {answer.selected}
                            </span>
                          </p>
                        )}
                      </div>

                      {/* Status and Time */}
                      <div className="shrink-0 text-right">
                        <p
                          className={`text-lg font-bold ${
                            answer.isCorrect
                              ? "text-emerald-600"
                              : "text-red-600"
                          }`}
                        >
                          {answer.isCorrect ? "✓" : "✕"}
                        </p>

                        <p className="mt-1 font-mono text-xs text-slate-500">
                          {(answer.timeMs / 1000).toFixed(1)}s
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Navigation */}
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => {
                  setPhase("home");
                  setViewedResult(null);
                }}
                className="rounded-xl border border-slate-300 bg-white px-5 py-4 font-semibold text-slate-700 shadow-sm transition hover:border-blue-300 hover:bg-slate-50"
              >
                View History
              </button>

              <button
                type="button"
                onClick={startQuiz}
                className="rounded-xl bg-blue-600 px-5 py-4 font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                Train Again →
              </button>
            </div>

            {currentResult?.id === viewedResult.id && (
              <p className="text-center text-xs text-slate-500">
                {lastSaveSucceeded
                  ? "Your latest attempt has been saved locally."
                  : "Your latest attempt is available for this session only."}
              </p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-lg font-bold">{value}</div>
      <div className="mt-1 text-xs text-slate-400">{label}</div>
    </div>
  );
}
