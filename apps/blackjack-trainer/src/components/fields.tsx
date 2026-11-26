import type { ReactNode } from "react";
import { useGame, preferences } from "../store";
import type { Preferences } from "../config/preferences";
export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}
export function Toggle({
  label,
  name,
}: {
  label: string;
  name: keyof Preferences;
}) {
  const p = useGame((s) => s.preferences);
  const pending = useGame((s) => s.busy || !!s.pendingCommands || s.locked);
  return (
    <Field label={label}>
      <input
        type="checkbox"
        disabled={name === "running" && pending}
        checked={!!p[name]}
        onChange={(e) => preferences({ [name]: e.target.checked })}
      />
    </Field>
  );
}
export function Select({
  label,
  name,
  options,
}: {
  label: string;
  name: keyof Preferences;
  options: string[];
}) {
  const p = useGame((s) => s.preferences);
  return (
    <Field label={label}>
      <select
        value={String(p[name])}
        onChange={(e) => preferences({ [name]: e.target.value })}
      >
        {options.map((x) => (
          <option key={x}>{x}</option>
        ))}
      </select>
    </Field>
  );
}
export const percent = (n: number, d: number) =>
  d ? `${Math.round((100 * n) / d)}%` : "—";
