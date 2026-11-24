import { STORAGE_KEY, type Answer, type QuizResult } from "./quiz";
const object = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const finite = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v) && v >= 0;
function validAnswer(v: unknown): v is Answer {
  return (
    object(v) &&
    typeof v.letter === "string" &&
    typeof v.correct === "string" &&
    typeof v.selected === "string" &&
    typeof v.isCorrect === "boolean" &&
    finite(v.timeMs)
  );
}
export function validResult(v: unknown): v is QuizResult {
  return (
    object(v) &&
    typeof v.id === "string" &&
    typeof v.date === "string" &&
    !Number.isNaN(Date.parse(v.date)) &&
    finite(v.score) &&
    Number.isInteger(v.score) &&
    finite(v.total) &&
    Number.isInteger(v.total) &&
    v.total > 0 &&
    v.total <= 26 &&
    v.score <= v.total &&
    finite(v.durationMs) &&
    Array.isArray(v.answers) &&
    v.answers.every(validAnswer)
  );
}
interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
function browserStorage(): StorageLike | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}
export function readHistoryState(
  storage: StorageLike | null = browserStorage(),
): { history: QuizResult[]; warning: string } {
  try {
    if (!storage)
      return {
        history: [],
        warning:
          "Browser storage is unavailable. Attempts can be kept for this session.",
      };
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return { history: [], warning: "" };
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed))
      return {
        history: [],
        warning:
          "Saved history could not be read. Existing data has been left unchanged.",
      };
    const history = parsed.filter(validResult);
    return {
      history,
      warning:
        history.length === parsed.length
          ? ""
          : "Some saved entries could not be displayed. Original entries are preserved.",
    };
  } catch {
    return {
      history: [],
      warning:
        "Saved history could not be read. Existing data has been left unchanged.",
    };
  }
}
export function persistResult(
  result: QuizResult,
  session: QuizResult[],
  storage: StorageLike | null = browserStorage(),
): { history: QuizResult[]; saved: boolean; warning: string } {
  const fallback = [result, ...session.filter((r) => r.id !== result.id)];
  try {
    if (!storage) throw Error("Unavailable");
    const raw = storage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) throw Error("Unreadable existing history");
    const storedIds = new Set(parsed.filter(validResult).map((r) => r.id));
    if (storedIds.has(result.id))
      return { history: parsed.filter(validResult), saved: true, warning: "" };
    const combined: unknown[] = [
      result,
      ...session.filter((r) => r.id !== result.id && !storedIds.has(r.id)),
      ...parsed,
    ];
    storage.setItem(STORAGE_KEY, JSON.stringify(combined));
    const history = combined.filter(validResult);
    return {
      history,
      saved: true,
      warning:
        history.length === combined.length
          ? ""
          : "Some saved entries could not be displayed. Original entries are preserved.",
    };
  } catch {
    return {
      history: fallback,
      saved: false,
      warning:
        "This attempt is available for this session only. Existing stored history was not replaced.",
    };
  }
}
