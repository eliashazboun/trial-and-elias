import { useGame } from "../store";
import { Dialog } from "./ui/dialog";
import { Wallet, Strategy, Count, Learn } from "./TrainingPanels";
import { Settings } from "./Settings";
import { Stats } from "./Stats";
function Rules() {
  const s = useGame((v) => v.state)!;
  return (
    <>
      <div className="rule-banner">BLACKJACK PAYS 3 TO 2</div>
      <p>
        Get closer to 21 than the dealer without busting. Aces count as 1 or 11;
        face cards count as 10. The dealer stands on all 17s, including soft 17.
      </p>
      <dl className="rules-grid">
        <dt>Current shoe</dt>
        <dd>
          {s.rules.decks} decks · {Math.round(s.rules.penetration * 100)}%
          penetration
        </dd>
        <dt>Main bets</dt>
        <dd>10–1,000 whole chips per position</dd>
        <dt>Side bets</dt>
        <dd>1–100 whole chips each, with a valid main bet</dd>
        <dt>Double</dt>
        <dd>
          Any eligible two-card hand, including after a split. One card, then
          stand.
        </dd>
        <dt>Split</dt>
        <dd>
          Equal blackjack values, including mixed tens. Up to four hands per
          position; twelve per round. First child plays before its sibling gets
          a replacement.
        </dd>
        <dt>Split aces</dt>
        <dd>
          One extra card; aces may resplit. No ordinary hit or double. Split 21
          pays 1:1.
        </dd>
        <dt>Insurance</dt>
        <dd>
          Against ace only, half the original wager, pays 2:1 profit. Even money
          on a natural pays 1:1 and excludes separate insurance.
        </dd>
        <dt>Dealer peek</dt>
        <dd>
          American hole card; checks aces after insurance and tens before play.
          Dealer blackjack ends the round.
        </dd>
      </dl>
      <h3>Perfect Pairs · original player cards</h3>
      <p>
        Perfect 25:1 · colored 12:1 · mixed 6:1. A perfect pair cannot occur
        with one deck.
      </p>
      <h3>21+3 · original player cards + dealer upcard</h3>
      <p>
        Suited trips 100:1 · straight flush 40:1 · trips 30:1 · straight 10:1 ·
        flush 5:1. Pay the highest category only. A–2–3 and Q–K–A qualify; K–A–2
        does not. Suited trips require at least three decks.
      </p>
      <h3>Shuffle and exhaustion</h3>
      <p>
        The cut card schedules a new shoe between rounds. Low shoes shuffle
        early. Exceptional exhaustion refunds incomplete main wagers and keeps
        already resolved side bets and insurance. It records a cancellation and
        schedules a fresh shoe. Cards are never fabricated or recycled during
        play.
      </p>
      <p>
        The hole card is revealed every dealt round, even if all players bust;
        unnecessary dealer draws are skipped. Running count includes exposed
        cards once. True count divides by undealt cards / 52. A hidden hole card
        reduces undealt quantity but its value stays out of the count.
      </p>
      <p className="muted">
        Side bet probabilities vary by deck count. Past results do not predict
        future cards. Virtual chips have no monetary value.
      </p>
    </>
  );
}
function Privacy() {
  return (
    <>
      <p>
        Blackjack Trainer is a simulated casino game for an adult audience.
        Virtual chips have no monetary value and cannot be purchased,
        transferred, redeemed or withdrawn.
      </p>
      <p>
        Gameplay, balances, sessions, learning records and history stay in this
        browser's namespaced Blackjack IndexedDB database. Preferences use
        localStorage. No account or remote player database is used.
      </p>
      <p>
        Advertisements are disabled. No ad SDK or new tracking script is loaded
        by this app. Existing website Cloudflare analytics remains controlled by
        the website owner and must be reviewed before publication.
      </p>
      <p>
        Settings → Data offers backup, restore and individually confirmed
        resets. Clearing browser data can erase progress. Anyone with access to
        the browser can inspect local data, including hidden cards. Local
        balances and clocks are not tamper-proof.
      </p>
      <p>
        Basic strategy and counting do not guarantee profit. The owner must
        verify applicable simulated-casino audience, advertising and privacy
        requirements before publication.
      </p>
    </>
  );
}
export function Panels() {
  const { panel, setPanel, error } = useGame();
  if (!panel) return null;
  const names = {
    wallet: "Your wallet",
    strategy: "Basic strategy",
    rules: "Table rules & paytables",
    stats: "Your statistics",
    settings: "Settings",
    learn: "Learn blackjack",
    count: "Count check",
    privacy: "Privacy & virtual chips",
  };
  return (
    <Dialog
      title={names[panel]}
      onClose={() => setPanel(null)}
      sidePanel={panel === "strategy"}
      wide={panel === "strategy" || panel === "stats"}
    >
      {error && (
        <div role="alert" className="alert error">
          {error}
          <button onClick={() => useGame.setState({ error: "" })}>
            Dismiss
          </button>
        </div>
      )}
      {panel === "wallet" ? (
        <Wallet />
      ) : panel === "strategy" ? (
        <Strategy />
      ) : panel === "rules" ? (
        <Rules />
      ) : panel === "stats" ? (
        <Stats />
      ) : panel === "settings" ? (
        <Settings />
      ) : panel === "learn" ? (
        <Learn />
      ) : panel === "count" ? (
        <Count />
      ) : (
        <Privacy />
      )}
    </Dialog>
  );
}
