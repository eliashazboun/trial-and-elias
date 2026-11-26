import { useEffect, useState } from "react";
import {
  BookOpen,
  ChartNoAxesCombined,
  Settings2,
  Wallet,
  CircleHelp,
  GraduationCap,
} from "lucide-react";
import {
  useGame,
  initialize,
  dispose,
  dispatch,
  act,
  preferences,
} from "./store";
import type { Panel } from "./store";
import { metadata } from "./config/metadata";
import { presets } from "./config/preferences";
import type { Preferences } from "./config/preferences";
import { between } from "./engine/engine";
import { money, pendingTotal } from "./engine/types";
import type { Action } from "./engine/types";
import { recommend } from "./training/strategy";
import { Button } from "./components/ui/button";
import { Dialog } from "./components/ui/dialog";
import { Panels } from "./components/Panels";
import { TableExperience } from "./components/TableExperience";
import { Audio } from "./phaser/audio";
import "./table-ui.css";
export default function App() {
  const {
    state: s,
    ready,
    locked,
    error,
    preferences: p,
    panel,
    setPanel,
    confirmation,
  } = useGame();
  const [now, setNow] = useState(Date.now()),
    [lastBreak, setLastBreak] = useState(Date.now());
  useEffect(() => {
    void initialize();
    const interval = setInterval(() => setNow(Date.now()), 1000);
    const leave = () => void dispose(),
      resume = (event: PageTransitionEvent) => {
        if (event.persisted) void initialize();
      };
    window.addEventListener("pagehide", leave);
    window.addEventListener("pageshow", resume);
    return () => {
      clearInterval(interval);
      window.removeEventListener("pagehide", leave);
      window.removeEventListener("pageshow", resume);
      Audio.dispose();
      void dispose();
    };
  }, []);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      const game = useGame.getState();
      if (
        game.panel ||
        game.confirmation ||
        event.repeat ||
        event.ctrlKey ||
        event.altKey ||
        event.metaKey ||
        event.shiftKey ||
        (event.target instanceof HTMLElement &&
          event.target.closest(
            'input,textarea,select,[contenteditable="true"]',
          ))
      )
        return;
      const action = Object.entries(game.preferences.shortcuts).find(
        ([, value]) => value.toLowerCase() === event.key.toLowerCase(),
      )?.[0];
      if (!action) return;
      event.preventDefault();
      Audio.unlock();
      if (["hit", "stand", "double", "split"].includes(action)) {
        void act(action as Action, game.state?.revision);
        return;
      }
      if (["strategy", "wallet", "settings"].includes(action)) {
        game.setPanel(action as Panel);
        return;
      }
      if (action.startsWith("chip")) {
        const chip = Number(action.slice(4));
        if (
          game.state &&
          game.state.balance - pendingTotal(game.state) >= chip * 2
        )
          useGame.setState({ chip });
        return;
      }
      if (["deal", "undo", "clear", "rebet", "doubleBet"].includes(action))
        void dispatch({ type: action as "deal" });
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  if (!ready)
    return (
      <main className="loading">
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
            "Saved table unavailable. Existing data has been left unchanged."}
        </p>
        <Button onClick={() => void initialize()}>Retry saved table</Button>
        <a href={metadata.returnUrl}>Trial & Elias</a>
      </main>
    );
  const rec = recommend(s),
    session = s.sessions.find((x) => x.id === s.sessionId)!,
    reminder =
      p.breakMinutes > 0 &&
      now - lastBreak >= p.breakMinutes * 60000 &&
      between(s);
  return (
    <div
      className={`app casino-app ${p.contrast ? "high-contrast" : ""} ${p.reducedMotion ? "reduced-motion" : ""} ${panel === "strategy" ? "strategy-open" : ""}`}
      onPointerDown={() => Audio.unlock()}
    >
      <header className="topbar casino-topbar">
        <div className="brand">
          <a href={metadata.returnUrl}>Trial & Elias</a>
          <div>
            <span className="suit-logo">♠</span>
            <h1>{metadata.name}</h1>
            <span className="practice-tag">
              VIRTUAL CHIPS · {s.rules.decks} DECKS · S17 · 3:2
            </span>
          </div>
        </div>
        <nav aria-label="Blackjack tools">
          {(
            [
              { panel: "strategy", label: "Basic strategy", Icon: BookOpen },
              { panel: "rules", label: "Rules", Icon: CircleHelp },
              {
                panel: "stats",
                label: "Statistics",
                Icon: ChartNoAxesCombined,
              },
              { panel: "learn", label: "Learn", Icon: GraduationCap },
            ] as const
          ).map(({ panel, label, Icon }) => (
            <Button
              key={panel}
              aria-label={label}
              onClick={() => setPanel(panel)}
            >
              <Icon size={17} />
              <span>{label}</span>
            </Button>
          ))}
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
            <Settings2 size={18} />
          </Button>
        </nav>
      </header>
      <main className="casino-main">
        <TableExperience />
        {p.showTime && (
          <span className="session-clock">
            Session: {Math.floor((now - session.start) / 60000)} min
          </span>
        )}
        <footer className="casino-footer">
          <span>Virtual chips. Real practice.</span>
          <button onClick={() => setPanel("privacy")}>
            Privacy & local data
          </button>
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
            <Button onClick={() => void act(confirmation, s.revision, true)}>
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
            Start with 1,000 virtual chips. Select a chip, then tap a table
            spot. Right-click or hold a spot to remove the last placement.
          </p>
          <p>
            Optional strategy hints wait three seconds so you can think first.
            All progress stays on your device.
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
      {reminder && (
        <Dialog title="Your break reminder" onClose={() => setLastBreak(now)}>
          <p>
            Take a break whenever you like. Your hourly chips do not expire.
          </p>
          <Button onClick={() => setLastBreak(now)}>Continue</Button>
          <a href={metadata.returnUrl}>Leave table</a>
        </Dialog>
      )}
    </div>
  );
}
