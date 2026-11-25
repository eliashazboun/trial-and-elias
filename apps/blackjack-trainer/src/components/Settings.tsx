import { useEffect, useState } from "react";
import { useGame, dispatch, preferences, restore } from "../store";
import { presets, defaults, validatePreferences } from "../config/preferences";
import type { Preferences } from "../config/preferences";
import { between } from "../engine/engine";
import { money } from "../engine/types";
import { exportBackup } from "../storage/backup";
import { parseBackup } from "../storage/validation";
import { Button } from "./ui/button";
import { Field, Select, Toggle } from "./fields";
export function Settings() {
  const { state: s, preferences: p, busy } = useGame();
  const [tab, setTab] = useState("Table"),
    [pending, setPending] = useState<ReturnType<typeof parseBackup> | null>(
      null,
    ),
    [usage, setUsage] = useState("Unknown");
  useEffect(() => {
    void navigator.storage
      ?.estimate?.()
      .then((x) =>
        setUsage(
          `${((x.usage ?? 0) / 1048576).toFixed(1)} MB used by this website origin`,
        ),
      );
  }, []);
  if (!s) return null;
  const rules = s.pendingRules ?? s.rules;
  const changeRules = (patch: Partial<typeof rules>) =>
    void dispatch({ type: "rules", rules: { ...rules, ...patch } });
  return (
    <>
      <div className="tabs">
        {[
          "Table",
          "Training",
          "Appearance",
          "Audio",
          "Controls",
          "Session",
          "Data",
        ].map((t) => (
          <Button
            key={t}
            variant={tab === t ? "primary" : "quiet"}
            onClick={() => setTab(t)}
          >
            {t}
          </Button>
        ))}
      </div>
      {tab === "Table" ? (
        <>
          <Field label="Deck count">
            <select
              value={rules.decks}
              onChange={(e) =>
                changeRules({ decks: Number(e.target.value) as 6 })
              }
            >
              {[1, 2, 4, 6, 8].map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </Field>
          <Field
            label={`Penetration · ${Math.round(rules.penetration * 100)}%`}
          >
            <input
              type="range"
              min="50"
              max="90"
              step="1"
              value={Math.round(rules.penetration * 100)}
              onChange={(e) =>
                changeRules({ penetration: Number(e.target.value) / 100 })
              }
            />
          </Field>
          <div className="button-row">
            {[50, 60, 70, 75, 80, 85].map((n) => (
              <Button
                key={n}
                onClick={() => changeRules({ penetration: n / 100 })}
              >
                {n}%
              </Button>
            ))}
          </div>
          <p className="muted">
            A fresh shoe is scheduled after this fraction has been dealt, never
            during an active hand.
          </p>
          <Field label="Perfect Pairs">
            <input
              type="checkbox"
              checked={rules.pairs}
              onChange={(e) => changeRules({ pairs: e.target.checked })}
            />
          </Field>
          <Field label="21+3">
            <input
              type="checkbox"
              checked={rules.three}
              onChange={(e) => changeRules({ three: e.target.checked })}
            />
          </Field>
          <div className="button-row">
            <Button onClick={() => changeRules({ pairs: true, three: true })}>
              Enable both
            </Button>
            <Button onClick={() => changeRules({ pairs: false, three: false })}>
              Disable both
            </Button>
          </div>
          {s.pendingRules && (
            <p role="status">
              New settings will apply after this round finishes.
            </p>
          )}
        </>
      ) : tab === "Training" ? (
        <>
          <div className="button-row">
            {Object.entries(presets).map(([name, config]) => (
              <Button
                key={name}
                onClick={() => preferences(config as Partial<Preferences>)}
              >
                {name} preset
              </Button>
            ))}
          </div>
          <Toggle label="Basic strategy indicator" name="strategy" />
          <Toggle label="Recommended action highlighting" name="highlight" />
          <Select
            label="Decision feedback"
            name="feedback"
            options={["silent", "educational", "confirm"]}
          />
          <Toggle label="Card counting weights" name="weights" />
          <Toggle label="Running count" name="running" />
          <Toggle label="True count" name="trueCount" />
          <Select
            label="Shoe information"
            name="shoe"
            options={["visual", "exact", "hidden"]}
          />
          <Field label="Count checkpoint every N rounds (0 = off)">
            <input
              type="number"
              min="0"
              max="100"
              value={p.checkpoint}
              onChange={(e) =>
                preferences({ checkpoint: Number(e.target.value) })
              }
            />
          </Field>
        </>
      ) : tab === "Appearance" ? (
        <>
          <Select
            label="Felt theme"
            name="theme"
            options={["green", "blue", "burgundy", "black"]}
          />
          <Select
            label="Card back"
            name="cardBack"
            options={[
              "blue",
              "red",
              "gold",
              "geometric",
              ...(s.achievements["First Lesson"] ? ["scholar"] : []),
            ]}
          />
          <Select
            label="Dealing speed"
            name="speed"
            options={["slow", "normal", "fast", "instant"]}
          />
          <Toggle label="Reduced motion" name="reducedMotion" />
          <Toggle label="Higher contrast" name="contrast" />
        </>
      ) : tab === "Audio" ? (
        <>
          <Toggle label="Master mute" name="muted" />
          {(["music", "ambience", "effects"] as const).map((name) => (
            <Field
              key={name}
              label={`${name} volume · ${Math.round(p[name] * 100)}%`}
            >
              <input
                type="range"
                min="0"
                max="1"
                step=".05"
                value={p[name]}
                onChange={(e) =>
                  preferences({ [name]: Number(e.target.value) })
                }
              />
            </Field>
          ))}
          <p className="muted">
            Original synthesized sounds. Music and ambience start off and
            require a player interaction. Audio pauses while the tab is hidden.
          </p>
        </>
      ) : tab === "Controls" ? (
        <>
          {Object.entries(p.shortcuts).map(([action, key]) => (
            <Field key={action} label={action}>
              <input
                value={key}
                maxLength={20}
                onKeyDown={(e) => {
                  if (e.key === "Tab") return;
                  e.preventDefault();
                  preferences({
                    shortcuts: { ...p.shortcuts, [action]: e.key },
                  });
                }}
                readOnly
              />
            </Field>
          ))}
          <Button
            onClick={() => preferences({ shortcuts: defaults.shortcuts })}
          >
            Restore default shortcuts
          </Button>
        </>
      ) : tab === "Session" ? (
        <>
          <Toggle label="Show elapsed session time" name="showTime" />
          <Field label="Break reminders every minutes (0 = off)">
            <select
              value={p.breakMinutes}
              onChange={(e) =>
                preferences({ breakMinutes: Number(e.target.value) })
              }
            >
              {[0, 15, 30, 60].map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </Field>
          <Field label="Voluntary session limit in minutes (0 = off)">
            <input
              type="number"
              min="0"
              max="240"
              value={p.limitMinutes}
              onChange={(e) =>
                preferences({ limitMinutes: Number(e.target.value) })
              }
            />
          </Field>
          <p>
            Reminders and limits wait until settlement. Taking a break does not
            expire hourly chips.
          </p>
        </>
      ) : (
        <>
          <p>
            {usage}. Blackjack retains {s.history.length} detailed rounds,{" "}
            {s.sessions.length} sessions and {s.totals.decisions} lifetime
            decisions.
          </p>
          <Field label="Detailed round retention">
            <select
              value={s.retention}
              onChange={(e) =>
                void dispatch({
                  type: "retention",
                  value: Number(e.target.value),
                })
              }
            >
              {[100, 500, 1000, 5000].map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </Field>
          <p className="muted">
            A 25 MB soft detail budget also applies. Pruning keeps lifetime
            aggregates and achievements. Browser storage can be cleared or
            evicted; keep a separate backup.
          </p>
          <div className="button-row">
            <Button
              disabled={!between(s) || busy}
              onClick={() => exportBackup(s, p)}
            >
              Export JSON backup
            </Button>
            <label className="button">
              Choose backup
              <input
                className="file-input"
                type="file"
                accept="application/json,.json"
                disabled={!between(s) || busy}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    if (file.size > 30 * 1048576)
                      throw Error("Backup exceeds 30 MB");
                    const backup = parseBackup(await file.text());
                    validatePreferences(backup.preferences);
                    setPending(backup);
                  } catch (error) {
                    useGame.setState({
                      error: `Backup rejected: ${error instanceof Error ? error.message : String(error)}`,
                    });
                  }
                }}
              />
            </label>
          </div>
          {pending && (
            <section className="inset">
              <h3>Replace Blackjack data?</h3>
              <p>
                Backup {pending.exported}, schema {pending.schema}:{" "}
                {pending.state.history.length} rounds,{" "}
                {pending.state.sessions.length} sessions,{" "}
                {money(pending.state.balance)} virtual chips. This replaces
                current Blackjack data; rewards are not merged. Other games are
                untouched.
              </p>
              <div className="button-row">
                <Button
                  variant="danger"
                  onClick={async () => {
                    try {
                      await restore(
                        pending.state,
                        validatePreferences(pending.preferences),
                      );
                      setPending(null);
                    } catch (e) {
                      useGame.setState({ error: String(e) });
                    }
                  }}
                >
                  Confirm restore
                </Button>
                <Button onClick={() => setPending(null)}>Cancel</Button>
              </div>
            </section>
          )}
          <h3>Reset selected data</h3>
          <div className="button-row">
            {(
              [
                "balance",
                "history",
                "gameplay",
                "education",
                "achievements",
                "all",
              ] as const
            ).map((scope) => (
              <Button
                key={scope}
                variant="danger"
                disabled={!between(s) || busy}
                onClick={() => {
                  if (
                    window.confirm(
                      `Reset ${scope === "all" ? "all Blackjack game data" : scope + " data"}? Other apps will not be changed. Balance reset keeps the hourly cooldown. Cleared data requires a backup to recover.`,
                    )
                  )
                    void dispatch({ type: "reset", scope });
                }}
              >
                Reset {scope}
              </Button>
            ))}
            <Button
              onClick={() => {
                if (window.confirm("Reset Blackjack preferences only?"))
                  preferences({ ...defaults });
              }}
            >
              Reset settings
            </Button>
          </div>
        </>
      )}
    </>
  );
}
