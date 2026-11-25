import { metadata } from "../config/metadata";
import type { GameState } from "../engine/types";
export function download(
  name: string,
  content: string,
  type = "application/json",
) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function exportBackup(state: GameState, preferences: unknown) {
  download(
    "blackjack-backup.json",
    JSON.stringify({
      format: "trial-elias-blackjack",
      schema: 1,
      version: metadata.version,
      exported: new Date().toISOString(),
      state,
      preferences,
    }),
  );
}
export function csv(rows: Record<string, unknown>[]) {
  const keys = [...new Set(rows.flatMap(Object.keys))];
  const escape = (v: unknown) => {
    let text = typeof v === "object" ? JSON.stringify(v) : String(v ?? "");
    if (/^[\s]*[=+\-@]/.test(text)) text = "'" + text;
    return '"' + text.replaceAll('"', '""') + '"';
  };
  return [
    keys.map(escape).join(","),
    ...rows.map((r) => keys.map((k) => escape(r[k])).join(",")),
  ].join("\r\n");
}
export function exportCSV<T extends object>(name: string, rows: T[]) {
  download(
    `blackjack-${name}.csv`,
    csv(
      (rows as Record<string, unknown>[]).map((row) =>
        Object.fromEntries(
          Object.entries(row).map(([key, value]) => [
            ["stake", "amount", "balance", "net"].includes(key)
              ? key + "HalfChips"
              : key,
            value,
          ]),
        ),
      ),
    ),
    "text/csv;charset=utf-8",
  );
}
