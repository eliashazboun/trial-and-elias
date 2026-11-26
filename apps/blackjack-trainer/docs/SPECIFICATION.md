# Current confirmed revision — November 25, 2026

The [hand totals, betting layout and payout animation amendment](HAND_PRESENTATION_SPECIFICATION.md) adds evaluated totals beneath each hand, card-centered wagers toward the dealer, persistent per-position side wagers and independent prominent net results. Settlement animations consume authoritative projected outcomes; they never change bankroll transactions. This amendment supersedes earlier conflicting result/stack presentation wording.

The [running-count guessing amendment](COUNT_GUESSING_SPECIFICATION.md) adds a compact inline guess after ten fully hidden completed rounds. Visibility/progress and one-shot peek penalties are persisted with the authoritative game state; initial pre-upgrade rounds earn no retroactive credit. An eligible reveal resets progress and arms one penalty, charged on hiding again (100 chips or the available balance). Existing running-count exercises share the eligibility rule. Card-counting arithmetic and strategy tables remain unchanged.

The [gameplay UI/UX overhaul](UI_OVERHAUL_SPECIFICATION.md) supersedes conflicting original presentation requirements below. All gameplay controls belong inside the table; active-hand actions float above that hand; every split hand stays visible. Seven chip denominations, 50,000-chip main limits, pure visual normalization, per-spot removal, immediate post-round betting and a three-second hint delay are confirmed. Original rules, paytables, persistence, privacy and engine authority remain. The complete original brief is retained below with updated numeric limits; the linked full overhaul controls conflicts.

# MASTER DEVELOPMENT PROMPT
# BLACKJACK TRAINER

## 1. ROLE AND PROJECT OBJECTIVE

You are a senior game developer, full-stack TypeScript engineer, UI/UX designer, blackjack mathematics specialist, and software architect.

Your assignment is to develop **Blackjack Trainer**, a polished, browser-based blackjack simulation and educational training platform.

The application must combine authentic blackjack gameplay with high-quality casino graphics, customizable educational assistance, detailed player statistics, and optional rewarded advertising.

This is not merely a blackjack game with a strategy chart attached.

It must be an integrated learning experience that allows players to:

- Learn blackjack fundamentals.
- Understand traditional blackjack rules.
- Play up to three independent betting positions.
- Practice mathematically correct basic strategy.
- Learn the Hi-Lo card counting system.
- Practice maintaining a running count.
- Understand and calculate true count.
- Identify recurring decision-making mistakes.
- Measure assisted and unassisted performance.
- Review historical rounds and individual decisions.
- Customize the playing experience.

The game must feel like a polished digital casino table while remaining accessible to beginners.

Use exclusively virtual chips with no monetary value.

Do not implement real-money wagering, deposits, purchases of chips, withdrawals, transferable currency, redeemable prizes, cryptocurrency, or links encouraging real-money gambling.

The game must not suggest that basic strategy or card counting guarantees a profit.

### Core development principles

1. Mathematical correctness comes before graphics.
2. Graphics must enhance gameplay rather than determine its outcome.
3. Desktop and mobile experiences are equally important.
4. Educational assistance must remain optional.
5. Learning performance must be measured independently of financial outcomes.
6. No account or authentication is required.
7. All gameplay and personal statistics remain local.
8. Advertising must be voluntary and separate from active gameplay.
9. The application must remain usable when advertising is unavailable.
10. The codebase must be maintainable, modular, and thoroughly tested.

---

## 2. PROJECT ENVIRONMENT

### Working title

Blackjack Trainer

The name must be configurable through centralized application metadata so it can be changed later without modifying dozens of files.

### Project location

Use the current Codex workspace.

Inspect the workspace before creating files.

If a project already exists, preserve working code and respect its established conventions where appropriate.

### Future hosting

The game will eventually be integrated into my existing personal website:

**Trial & Elias**

Website repository:

```text
https://github.com/eliashazboun/trial-and-elias
```

Existing Cloudflare Worker:

```text
trial-and-elias1
```

Develop the blackjack game independently in the current workspace first.

Make it straightforward to integrate into Trial & Elias later.

Suggested production route:

```text
/blackjack-trainer/
```

Do not modify or deploy the existing Trial & Elias website during initial development unless explicitly instructed.

Do not create a remote GitHub repository yet.

Prepare the project for local Git version control.

---

## 3. TECHNOLOGY STACK

Use the following technologies:

- Phaser 3.
- React.
- TypeScript.
- Vite.
- Tailwind CSS.
- shadcn/ui.
- Lucide React icons.
- Zustand.
- IndexedDB.
- localStorage.
- Vitest.
- Playwright.

Use strict TypeScript configuration.

### Responsibilities

**Phaser 3**

Responsible for:

- Casino table rendering.
- Playing cards.
- Card animations.
- Chip rendering.
- Chip stacks.
- Betting spots.
- Drag-and-drop interactions.
- Shoe and discard tray rendering.
- Visual effects.
- Table themes.
- Responsive gameplay positioning.
- Animation sequencing.

**React**

Responsible for:

- Main application layout.
- Menus.
- Settings.
- Wallet.
- Educational reference panels.
- Basic strategy charts.
- Statistics dashboards.
- Tutorials.
- History review.
- Achievement displays.
- Privacy controls.
- Accessible action buttons.
- Data management.

**Zustand**

Responsible for:

- Shared application state.
- React and Phaser synchronization.
- Presentation preferences.
- Current round snapshots.
- Active hand information.
- UI interaction state.

Zustand must not become a second independent implementation of blackjack rules.

**Independent TypeScript engine**

Responsible for:

- Card generation.
- Shoe management.
- Hand evaluation.
- Legal action calculation.
- Dealer rules.
- Player decisions.
- Splitting.
- Doubling.
- Insurance.
- Even money.
- Side bet evaluation.
- Settlement.
- Round state transitions.
- Authoritative game events.

The engine must run and be testable without Phaser, React, a DOM, or a browser canvas.

### Persistence

Use IndexedDB for:

- Wallet transactions.
- Active shoe and round snapshots.
- Session history.
- Detailed round history.
- Educational decision records.
- Counting checks.
- Aggregate statistics.
- Achievements.
- Cosmetic unlocks.

Use localStorage for lightweight preferences, such as:

- Audio settings.
- Theme selection.
- Card back selection.
- Assistance preferences.
- Keybindings.
- Interface preferences.

Do not introduce a remote player database, authentication provider, or backend.

---

## 4. PROJECT ARCHITECTURE

Use a modular project structure similar to:

```text
blackjack-trainer/
├── public/
│   └── assets/
│       ├── cards/
│       ├── chips/
│       ├── tables/
│       ├── audio/
│       └── fonts/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── engine/
│   │   ├── cards/
│   │   │   ├── Card.ts
│   │   │   ├── Deck.ts
│   │   │   ├── Shoe.ts
│   │   │   └── Shuffle.ts
│   │   ├── hands/
│   │   │   ├── Hand.ts
│   │   │   ├── HandEvaluator.ts
│   │   │   └── HandManager.ts
│   │   ├── rules/
│   │   │   ├── TableRules.ts
│   │   │   └── LegalActions.ts
│   │   ├── bets/
│   │   │   ├── BetManager.ts
│   │   │   ├── PerfectPairs.ts
│   │   │   ├── TwentyOnePlusThree.ts
│   │   │   ├── Insurance.ts
│   │   │   └── Settlement.ts
│   │   ├── round/
│   │   │   ├── RoundEngine.ts
│   │   │   ├── RoundState.ts
│   │   │   ├── RoundEvents.ts
│   │   │   └── StateMachine.ts
│   │   └── dealer/
│   │       └── DealerEngine.ts
│   ├── phaser/
│   │   ├── config.ts
│   │   ├── scenes/
│   │   ├── objects/
│   │   │   ├── CardSprite.ts
│   │   │   ├── ChipSprite.ts
│   │   │   ├── ChipStack.ts
│   │   │   ├── BettingSpot.ts
│   │   │   ├── CardShoe.ts
│   │   │   └── DiscardTray.ts
│   │   ├── layouts/
│   │   │   ├── DesktopLayout.ts
│   │   │   ├── PortraitLayout.ts
│   │   │   └── LandscapeLayout.ts
│   │   ├── animations/
│   │   ├── textures/
│   │   ├── themes/
│   │   └── PhaserBridge.ts
│   ├── training/
│   │   ├── strategy/
│   │   │   ├── StrategyEngine.ts
│   │   │   ├── StrategyTables.ts
│   │   │   ├── StrategyExplanation.ts
│   │   │   └── StrategyEvaluator.ts
│   │   ├── counting/
│   │   │   ├── CountingSystem.ts
│   │   │   ├── HiLoSystem.ts
│   │   │   ├── RunningCount.ts
│   │   │   └── TrueCount.ts
│   │   ├── tutorials/
│   │   ├── exercises/
│   │   └── presets/
│   ├── economy/
│   │   ├── Wallet.ts
│   │   ├── Ledger.ts
│   │   ├── HourlyRewards.ts
│   │   └── ChipDenominations.ts
│   ├── advertising/
│   │   ├── AdProvider.ts
│   │   ├── AdManager.ts
│   │   ├── RewardLifecycle.ts
│   │   ├── MockAdProvider.ts
│   │   └── DisabledAdProvider.ts
│   ├── analytics/
│   │   ├── SessionManager.ts
│   │   ├── GameplayAnalytics.ts
│   │   ├── StrategyAnalytics.ts
│   │   ├── CountingAnalytics.ts
│   │   ├── MistakeAnalysis.ts
│   │   └── MasteryEngine.ts
│   ├── achievements/
│   ├── cosmetics/
│   ├── storage/
│   │   ├── Database.ts
│   │   ├── Migrations.ts
│   │   ├── RoundRepository.ts
│   │   ├── WalletRepository.ts
│   │   ├── BackupService.ts
│   │   └── StorageManager.ts
│   ├── stores/
│   ├── hooks/
│   ├── components/
│   │   ├── ui/
│   │   ├── gameplay/
│   │   ├── wallet/
│   │   ├── strategy/
│   │   ├── statistics/
│   │   └── settings/
│   ├── pages/
│   ├── config/
│   ├── types/
│   └── styles/
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── mathematics/
│   └── e2e/
├── package.json
├── vite.config.ts
├── tsconfig.json
├── README.md
├── AGENTS.md
└── .gitignore
```

This structure is a suggested foundation.

Adjust individual modules when doing so improves maintainability.

Do not create unnecessary abstractions or empty placeholder files solely to match this directory tree.

---

## 5. BLACKJACK TABLE RULES

The following rules are confirmed requirements.

| Rule | Required behavior |
|---|---|
| Blackjack payout | 3:2 |
| Dealer behavior | Stand on all 17s, including soft 17 |
| Dealer hole card | American hole-card blackjack |
| Dealer peek | Check for blackjack with ace or ten-value upcard |
| Doubling | Any eligible initial two-card hand |
| Double after split | Allowed |
| Resplitting | Up to four hands per original betting position |
| Resplitting aces | Allowed |
| Split ace restrictions | One additional card per split ace, except when eligible to resplit |
| Surrender | Not available |
| Insurance | Available |
| Even money | Available |
| Original betting positions | Up to three |
| Available deck counts | 1, 2, 4, 6, 8 |
| Default shoe | Six decks |
| Default penetration | 75% |
| Penetration | Configurable slider and presets |
| Perfect Pairs | Enabled by default |
| 21+3 | Enabled by default |

Do not silently change these rules.

### Main game objective

A player attempts to achieve a hand total closer to 21 than the dealer without exceeding 21.

### Card values

- Cards 2–10 are worth their face value.
- Jacks, queens, and kings are worth 10.
- Aces are worth 1 or 11, depending on the best valid hand total.

### Hand evaluation

The hand evaluator must correctly calculate:

- Hard total.
- Soft total.
- Best valid total.
- Whether the hand is soft.
- Whether the hand is busted.
- Whether the hand is a natural blackjack.
- Whether the hand is a pair.
- Whether splitting is available.
- Whether doubling is available.

Support hands containing multiple aces.

Examples:

- A + 6 = soft 17.
- A + A + 5 = soft 17.
- A + 6 + 10 = hard 17.
- A + A + 9 = soft 21.
- A + K = natural blackjack only when it is an eligible original two-card hand.

A two-card 21 resulting from a split is not a natural blackjack.

---

## 6. CARD AND SHOE MODEL

### Physical card identity

Every card must have a unique physical identity.

Cards should contain information equivalent to:

```typescript
type Suit = "hearts" | "diamonds" | "clubs" | "spades";

type Rank =
  | "A"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "J"
  | "Q"
  | "K";

interface Card {
  id: string;
  rank: Rank;
  suit: Suit;
  deckIndex: number;
}
```

Two cards with identical ranks and suits from different decks are distinct physical cards.

This is essential for:

- Perfect Pairs.
- Suited trips.
- Card counting.
- Shoe integrity.
- Historical round reconstruction.

### Deck generation

Each deck must contain exactly 52 cards.

For the default six-deck shoe, generate exactly 312 physical cards.

Do not generate a random rank and suit every time a card is dealt.

All cards must come from the current shuffled shoe without replacement.

### Randomness

Use an unbiased Fisher-Yates shuffle.

Production randomness should come from `crypto.getRandomValues()` with unbiased integer sampling.

Use a deterministic, injectable seeded random source for:

- Unit tests.
- Integration tests.
- Mathematical simulations.
- Developer-only scenario fixtures.

Do not expose seeded production shoes as ordinary gameplay features.

Do not manipulate card distributions based on:

- Player balance.
- Recent wins or losses.
- Advertisement history.
- Session length.
- Educational assistance.
- Number of active betting positions.
- Player behavior.

Never rig results to encourage ad viewing or additional gameplay.

### Shoe information

Track:

- Shoe identifier.
- Original deck count.
- Total cards at initialization.
- Remaining undealt cards.
- Dealt cards.
- Discarded cards.
- Revealed cards.
- Hidden cards.
- Cut card position.
- Current penetration.
- Running count.
- Pending shuffle state.

---

## 7. SHUFFLE PENETRATION

Allow players to select the amount of the shoe dealt before a reshuffle is triggered.

### Default

75% penetration.

### Presets

- 50%.
- 60%.
- 70%.
- 75%.
- 80%.
- 85%.

Also provide an adjustable slider.

Suggested slider range: 50–90%, subject to safe shoe-exhaustion handling.

Explain penetration in simple language.

For example:

> A 75% penetration setting means approximately three quarters of the shoe will be dealt before a new shoe is introduced.

### Cut card behavior

When the configured cut-card threshold is reached:

1. Mark the shoe as needing a shuffle.
2. Finish the current round if sufficient cards remain.
3. Settle all wagers.
4. Move the completed round into history.
5. Shuffle a fresh shoe before another round begins.
6. Reset the running count.

Do not perform an ordinary shuffle during an active hand.

### Small-shoe exhaustion

Supporting one deck alongside three betting positions and up to twelve split hands creates a genuine exhaustion edge case.

Implement a documented, deterministic safety policy.

Requirements:

- Check available cards before beginning a new round.
- Shuffle early between rounds when the remaining shoe is clearly insufficient.
- Never fabricate replacement cards.
- Never draw the same physical card twice.
- Never silently recycle discarded cards during an active hand.
- Never read from an empty shoe.

If a genuinely exceptional round exhausts the shoe, apply a clearly documented emergency policy.

Recommended default:

- Cancel the incomplete main-hand outcomes and refund their committed wagers.
- Preserve already correctly resolved side bets.
- Resolve outstanding insurance only if its outcome is already known; otherwise refund it.
- Record the round as canceled due to shoe exhaustion.
- Exclude canceled main hands from ordinary win/loss statistics.
- Start a fresh shoe.

Make the policy clear in the rules interface.

### Settings changes

Changes to deck count or penetration must apply after the current round finishes.

Do not allow changing the shoe configuration to alter an active round.

Display a message indicating that a new shoe will begin after settlement.

---

## 8. BETTING POSITIONS AND HAND MANAGEMENT

Support up to three independent original betting positions.

Each position has:

- A main blackjack wager.
- An optional Perfect Pairs wager.
- An optional 21+3 wager.
- Original dealt cards.
- One or more resulting player hands.
- Insurance information when applicable.
- Independent settlement information.

A player activates a position by placing a valid main wager.

### Position identifiers

Use stable position identifiers.

For example:

```text
Position 1
Position 2
Position 3
```

Each split hand must have its own stable identifier.

For example:

```text
Position 2 — Hand A
Position 2 — Hand B
Position 2 — Hand C
Position 2 — Hand D
```

Do not rely on mutable array indices as permanent hand identifiers.

### Maximum hands

Each original betting position may result in up to four hands through resplitting.

Therefore, the game must support:

- Three original betting positions.
- Four hands per original position.
- Twelve total active or completed player hands in one round.

All engine systems, rendering layouts, persistence, and settlement logic must handle this maximum.

### Playing order

Use a predictable left-to-right position order.

Within an original position, play split hands in a documented, consistent order.

Only one player hand should accept gameplay decisions at a time.

The active hand must be unmistakable.

---

## 9. ROUND STATE MACHINE

Implement an explicit blackjack round state machine.

Suggested phases:

```text
BETTING
INITIAL_DEAL
INSURANCE_OFFER
DEALER_PEEK
SIDE_BET_SETTLEMENT
PLAYER_ACTION
SPLIT_TRANSITION
DEALER_REVEAL
DEALER_ACTION
MAIN_SETTLEMENT
ROUND_COMPLETE
SHUFFLING
```

Also support controlled recovery and canceled-round states.

### Requirements

- Bets can only be modified during the betting phase.
- Deal can only occur when valid wagers are present.
- Player decisions can only occur during the appropriate action phase.
- Dealer actions must follow dealer rules.
- Settlement must occur exactly once.
- Invalid actions must be rejected by the engine, not merely hidden in the interface.
- Animations must not be authoritative game state.
- Multiple simultaneous input events must not cause duplicate actions.

### Initial dealing

Use traditional American blackjack dealing order.

Suggested order:

1. First card to each active betting position.
2. Dealer upcard.
3. Second card to each active betting position.
4. Dealer hole card.

Keep the dealer hole card hidden until the appropriate reveal event.

Resolve the original-card side bets once all required exposed initial cards are available.

Side bet outcomes are independent of whether the dealer has blackjack.

---

## 10. PLAYER ACTIONS

### Hit

- Draw one card from the current shoe.
- Recalculate the hand.
- Immediately finish the hand if busted.
- Automatically stand when the total reaches 21.
- Otherwise continue accepting legal actions.

### Stand

- Finish the current player hand.
- Advance to the next eligible hand.
- Begin dealer play when all player decisions are complete.

### Double

Doubling must be allowed on any eligible initial two-card hand.

Requirements:

- Commit an additional wager equal to the current hand's original wager.
- Draw exactly one additional card.
- End the hand immediately.
- Settle the doubled wager normally.
- Allow doubling after a non-ace split when otherwise eligible.

Disable doubling when:

- The hand contains more than two cards.
- The hand has already acted in a way that removes double eligibility.
- The player has insufficient available balance.
- The hand is a restricted split-ace hand.
- The round phase does not permit it.

### Split

Allow splitting eligible pairs.

Default implementation choice:

- Cards with the same blackjack value may be split, including mixed ten-value ranks.
- Document this explicitly in the rules.

Requirements:

- Reserve another wager equal to the original hand wager.
- Move one original card into each resulting hand.
- Draw replacement cards in a consistent documented order.
- Maintain the relationship with the original betting position.
- Permit resplitting until the position contains four hands.
- Do not duplicate the original side bets.

Default replacement-card policy:

- Deal a replacement card to the first split hand.
- Play that hand before moving to the next.
- Deal the second hand's replacement when its turn begins.

The count trainer must reflect cards in the actual order they are exposed.

### Splitting aces

Allow resplitting aces.

Each split ace normally receives exactly one additional card.

If that card is another ace and resplitting is legal, offer the resplit decision.

Otherwise, automatically finish the split-ace hand.

Do not permit ordinary hitting or doubling on restricted split-ace hands.

A split ace receiving a ten-value card forms an ordinary 21, not a natural blackjack.

### Insufficient funds

When a player cannot afford a legal additional wager:

- Disable the unaffordable action.
- Display the reason.
- Allow other legal actions.
- Never allow the wallet balance to become negative.

The strategy engine must distinguish the ideal recommendation from the best currently affordable legal alternative.

---

## 11. DEALER BEHAVIOR

The dealer receives an exposed upcard and a hidden hole card.

### Dealer peek

If the upcard is an ace:

1. Offer insurance.
2. Offer even money to eligible player blackjacks.
3. Complete all insurance decisions.
4. Check for dealer blackjack.

If the upcard is ten-valued:

- Check for dealer blackjack before ordinary player decisions.

If the dealer has blackjack:

- Reveal the hole card.
- Resolve insurance and even-money decisions.
- Settle player natural blackjacks as applicable.
- Settle all other main wagers as losses.
- Do not permit further hits, doubles, or splits.

### Dealer drawing

The dealer must:

- Hit hard totals below 17.
- Hit soft totals below 17.
- Stand on hard 17.
- Stand on soft 17.
- Stand on valid totals from 18–21.
- Stop on bust.

The dealer must never make random strategic decisions.

### Dealer reveal

Default behavior:

Reveal the dealer hole card at the end of every ordinary dealt round, even if all player hands have already busted.

This provides a consistent exposed-card history for the educational count trainer.

If no unresolved hand requires dealer drawing, do not draw unnecessary additional cards.

Document this simulated table procedure.

---

## 12. MAIN WAGER PAYOUTS

All payout calculations must distinguish net profit from returned stake.

| Outcome | Net payout | Total returned |
|---|---:|---:|
| Ordinary win | 1:1 | 2× wager |
| Natural blackjack | 3:2 | 2.5× wager |
| Push | 0 | Original wager |
| Loss | −1× wager | Nothing |

### Examples

A 100-chip ordinary winning wager:

- Original stake: 100.
- Profit: 100.
- Total returned: 200.

A 100-chip natural blackjack:

- Original stake: 100.
- Profit: 150.
- Total returned: 250.

A 25-chip natural blackjack:

- Original stake: 25.
- Profit: 37.5.
- Total returned: 62.5.

A doubled 100-chip wager:

- Total committed wager: 200.
- Ordinary winning profit: 200.
- Total returned: 400.

### Settlement priorities

Correctly distinguish:

- Player natural blackjack versus dealer natural blackjack.
- Player natural blackjack versus dealer ordinary 21.
- Player ordinary 21 versus dealer natural blackjack.
- Player bust versus subsequent dealer bust.
- Player and dealer equal totals.
- Split-hand 21 versus dealer 21.

A busted player hand loses regardless of whether the dealer later busts.

A player natural blackjack beats an ordinary dealer 21.

Do not pay 3:2 for a split-hand 21.

---

## 13. INSURANCE AND EVEN MONEY

### Insurance

Offer insurance only when the dealer shows an ace.

Offer insurance separately for each original active betting position.

Maximum insurance wager:

```text
50% of the corresponding original main wager
```

Allow declining insurance.

Insurance pays 2:1 net profit if the dealer has natural blackjack.

Otherwise, the insurance wager is lost.

### Example

A 100-chip main wager permits a maximum 50-chip insurance wager.

If the dealer has blackjack:

- Insurance stake returned: 50.
- Insurance profit: 100.
- Total insurance return: 150.

The main wager settles independently.

### Even money

When a player has natural blackjack and the dealer shows an ace, offer even money.

Accepting even money guarantees a 1:1 net payout on that main wager regardless of the dealer's blackjack status.

Do not allow accepting both even money and separate insurance on the same original position.

### Educational guidance

The ordinary basic strategy system should explain why insurance and even money are generally declined under conventional count-independent basic strategy.

Do not automatically select insurance or even money based on the running or true count.

Keep basic strategy education distinct from count-dependent decisions.

---

## 14. SIDE BET SETTINGS

Support both:

- Perfect Pairs.
- 21+3.

Both must be enabled by default.

Provide independent settings toggles:

```text
Enable Perfect Pairs
Enable 21+3
```

Also provide a convenience control for enabling or disabling both.

### Behavior when disabled

- Remove or hide the corresponding betting spots.
- Reallocate table space appropriately.
- Disable placing wagers on that side bet.
- Hide unnecessary side bet result indicators.
- Preserve historical statistics.
- Preserve the corresponding paytable in the rules reference.

If settings are changed before dealing, return any uncommitted wagers on the disabled side bet.

If settings are changed during an active round, apply the change only after the round settles.

Do not retroactively cancel committed side bets.

---

## 15. PERFECT PAIRS SIDE BET

Perfect Pairs evaluates the player's first two original cards.

### Paytable

| Combination | Description | Net payout |
|---|---|---:|
| Perfect Pair | Identical rank and suit | 25:1 |
| Colored Pair | Identical rank and color, different suits | 12:1 |
| Mixed Pair | Identical rank, different colors | 6:1 |
| No pair | Different ranks | Loss |

### Examples

Perfect Pair:

```text
K♠ + K♠
```

Colored Pair:

```text
K♥ + K♦
```

Mixed Pair:

```text
K♠ + K♥
```

Nonqualifying:

```text
K♠ + Q♥
```

Although a king and queen have the same blackjack value, they are not a Perfect Pairs combination.

### Evaluation

Evaluate mutually exclusive categories.

Use priority:

1. Perfect Pair.
2. Colored Pair.
3. Mixed Pair.
4. Loss.

Pay only the highest qualifying category.

### Example payout

A 10-chip Perfect Pair wager:

- Profit: 250.
- Returned stake: 10.
- Total return: 260.

### Single-deck considerations

An identical rank-and-suit pair is impossible in a standard single-deck shoe.

Do not artificially generate duplicate cards.

Clearly disclose unavailable combinations in the paytable when one deck is selected.

The remaining valid Perfect Pairs categories must continue to work normally.

---

## 16. 21+3 SIDE BET

21+3 evaluates exactly three cards:

- The player's first original card.
- The player's second original card.
- The dealer's original visible upcard.

Do not use the dealer hole card.

Do not use cards drawn after the initial deal.

### Paytable

| Combination | Net payout |
|---|---:|
| Suited Trips | 100:1 |
| Straight Flush | 40:1 |
| Three of a Kind | 30:1 |
| Straight | 10:1 |
| Flush | 5:1 |
| No qualifying combination | Loss |

### Combination definitions

**Suited Trips**

Three cards with identical rank and suit.

Example:

```text
7♥ 7♥ 7♥
```

**Straight Flush**

Three consecutive ranks of the same suit.

Example:

```text
7♠ 8♠ 9♠
```

**Three of a Kind**

Three cards of identical rank that do not qualify for suited trips.

Example:

```text
Q♠ Q♥ Q♦
```

**Straight**

Three consecutive ranks that do not qualify for a straight flush.

Example:

```text
5♠ 6♥ 7♦
```

**Flush**

Three cards of the same suit that do not qualify for a higher category.

Example:

```text
3♥ 8♥ K♥
```

### Ace handling

Support:

```text
A-2-3
Q-K-A
```

Do not treat K-A-2 as a straight.

Document ace handling in the paytable.

### Evaluation priority

Evaluate in this order:

1. Suited Trips.
2. Straight Flush.
3. Three of a Kind.
4. Straight.
5. Flush.
6. Loss.

Pay exactly one category.

### Side bet payout example

A 10-chip suited trips wager:

- Profit: 1,000.
- Returned stake: 10.
- Total return: 1,010.

### Deck count considerations

Suited trips cannot occur with fewer than three decks.

Display this information when relevant.

Do not change the confirmed payout ratios based on deck count.

Explain that side bet probabilities and mathematical returns vary with shoe size.

---

## 17. VIRTUAL CHIP ECONOMY

### Starting balance

Every new player receives:

```text
1,000 virtual chips
```

This is an initial balance, not a recurring session reward.

### Currency restrictions

Virtual chips:

- Have no real monetary value.
- Cannot be purchased.
- Cannot be sold.
- Cannot be redeemed.
- Cannot be exchanged for money or prizes.
- Cannot be transferred to another player.
- Cannot be used outside this game.

There are no deposits, withdrawals, payment processing, or user accounts.

### Chip denominations

| Denomination | Color |
|---|---|
| 1 | White |
| 5 | Red |
| 25 | Green |
| 100 | Black |
| 500 | Purple |
| 1,000 | Orange |
| 5,000 | Pink |

Each denomination must also display a numerical label.

Do not rely exclusively on color.

### Table limits

Main wager per original position:

```text
Minimum: 10 chips
Maximum: 50,000 chips
```

Each side bet:

```text
Minimum: 1 chip
Maximum: 100 chips
```

Side bets require a valid corresponding main wager.

The maximum main betting limit applies to the initial wager.

Legal doubles and splits may create total exposure greater than the original table maximum.

### Exact accounting

Support half-chip balances.

Store all monetary values using integer half-chip units.

For example:

```text
1 chip = 2 internal units
25 chips = 50 internal units
37.5 chips = 75 internal units
```

Initial wagers should be whole-chip amounts based on the supported chip denominations.

All payout and insurance calculations must produce exact integer internal units.

Do not use floating-point currency arithmetic.

Display half-chip balances accurately.

Use a distinct half-chip representation or numerical remainder indicator when necessary for settlement animations.

---

## 18. WALLET AND TRANSACTION LEDGER

Implement an authoritative wallet ledger.

Transaction categories should include:

- Initial balance.
- Main wager committed.
- Side wager committed.
- Insurance wager committed.
- Split wager committed.
- Double wager committed.
- Returned stake.
- Main wager profit.
- Side bet profit.
- Insurance profit.
- Hourly reward.
- Advertisement reward.
- Refund.
- Manual balance reset.

Every transaction must have:

- Unique transaction identifier.
- Timestamp.
- Transaction category.
- Amount.
- Related round identifier when applicable.
- Related hand or betting position identifier when applicable.
- Idempotency identifier where necessary.

Maintain a clear distinction between:

- Available balance.
- Pending betting selections.
- Committed wagers.
- Returned stakes.
- Net gameplay results.
- Free chip rewards.

Placing chips into a pending betting layout should reserve the corresponding available amount without treating it as a settled loss.

When Deal is accepted, commit the wagers atomically.

Do not deduct the same wager twice.

A payout must not be issued more than once.

---

## 19. BETTING INTERACTIONS

Support both tap-to-place and drag-and-drop.

### Tap behavior

1. Select a chip denomination.
2. Tap or click a betting spot.
3. Place that chip onto the spot.
4. Update the visible stack and wager total.

### Drag behavior

Allow dragging chips from the denomination tray into valid betting spots.

Support desktop mouse and mobile touch interactions.

Requirements:

- Clear drag feedback.
- Valid drop-zone highlighting.
- Reject invalid drop locations.
- Do not deduct chips for canceled drags.
- Prevent a drag gesture from also triggering a tap placement.
- Do not allow accidental duplicate wagers.

### Betting controls

Include:

- Undo.
- Clear.
- Rebet.
- Double Bet.
- Deal.

**Undo**

Reverse the most recent betting modification.

**Clear**

Remove all pending wagers and release reserved amounts.

**Rebet**

Restore the previous round's initial main and side wagers, not subsequent split or double wagers.

**Double Bet**

Double current pending wagers when affordable and within applicable limits.

Do not partially apply a multi-position rebet or double operation without informing the player.

Recommended default: reject the entire operation if it cannot be completed and explain why.

**Deal**

Start a round only when every active position has valid wagers.

Disable all wager-changing controls after the round begins.

---

## 20. CHIP RENDERING AND STACKS

Chips are a major visual component of the game.

Generate detailed dimensional chip textures programmatically.

Each chip should include:

- Denomination color.
- Numerical denomination.
- Central circular design.
- Contrasting edge markings.
- Visible thickness.
- Subtle shadow.
- Slightly elliptical appearance when viewed on the table.

### Stack representation

Preserve the actual denomination sequence placed by the player.

A stack containing:

```text
100 + 25 + 25 + 5 + 1
```

Its logical placement history remains black, green, green, red and white for undo. Its visible representation is normalized from the authoritative total.

Do not represent every wager as a single generic chip.

### Stack overflow

Large wagers can contain many individual chips.

Cap the rendered stack height.

Suggested initial maximum: 8–12 individually visible chips per stack.

Maintain the complete logical chip sequence even when rendering is capped.

Display:

- Exact wager total.
- Additional chip count when applicable.
- A clearly identifiable stack representation.

### Chip animations

Implement:

- Chip placement.
- Dragging.
- Stack formation.
- Undo.
- Returned wagers.
- Losing-chip collection.
- Winning-chip movement.
- Side bet settlement.

Use individual chip animations for ordinary-sized settlements.

For extremely large payouts, group animations to avoid unnecessary rendering load.

Animation style and duration must never alter actual wallet transactions.

Avoid exaggerated audiovisual effects that make losses look like wins.

---

## 21. HOURLY CHIP REWARDS

Players may manually claim:

```text
1,000 chips every hour
```

### Claim behavior

- Show a visible Claim Chips button in the wallet.
- Show a countdown until the next eligible claim.
- Credit the reward only when the player explicitly claims it.
- Start the next 60-minute cooldown when a claim succeeds.
- Do not accumulate multiple missed hourly rewards.
- Do not automatically credit rewards while the player is away.

### Initial eligibility

Recommended default:

The starting 1,000-chip balance begins the initial 60-minute cooldown.

Do not immediately grant another hourly reward on the first visit.

### Persistence

Store the last successful claim timestamp.

Determine eligibility using persisted timestamps, not an in-memory timer alone.

Refreshing the browser must not reset the countdown.

Changing browser tabs must not reset the countdown.

### Clock manipulation

The application is entirely client-side.

A user can manipulate browser storage or their device clock.

Implement reasonable handling of backwards clock movement and malformed timestamps.

Do not claim the hourly reward system is tamper-proof.

Avoid invasive fingerprinting or authentication solely to protect virtual currency.

---

## 22. REWARDED ADVERTISING

Implement a provider-independent rewarded advertising system.

### Reward amount

```text
500 virtual chips per successfully completed rewarded advertisement
```

### Placement

Rewarded ads are accessed through the chip wallet.

The wallet must remain separate from the active blackjack table.

Players must explicitly request an advertisement.

Advertisements must never automatically interrupt:

- Card dealing.
- Player decisions.
- Insurance decisions.
- Splitting.
- Doubling.
- Dealer play.
- Round settlement.
- Educational exercises.

Only initiate advertisements between completed rounds.

### Repeat requests

After a rewarded advertisement finishes, the player may voluntarily request another.

Do not impose an artificial application-level daily limit unless required by the selected provider.

However:

- Respect provider frequency caps.
- Respect inventory availability.
- Respect geographic restrictions.
- Respect consent requirements.
- Respect provider eligibility requirements.
- Never automatically chain advertisements.
- Never request another advertisement without a new user action.

### Advertising adapter

Define an interface similar to:

```typescript
interface RewardedAdProvider {
  initialize(): Promise<void>;

  isAvailable(): Promise<boolean>;

  showRewardedAd(request: RewardedAdRequest):
    Promise<RewardedAdResult>;

  dispose(): void;
}

type RewardedAdResult =
  | { status: "rewarded"; rewardEventId: string }
  | { status: "closed" }
  | { status: "unavailable" }
  | { status: "error"; message: string };
```

Adapt the interface to the actual provider's supported lifecycle.

### Reward lifecycle

1. Player opens wallet.
2. Player selects Watch Ad for 500 Chips.
3. Check consent and provider availability.
4. Generate a unique reward request identifier.
5. Show the rewarded advertisement.
6. Receive the provider's legitimate reward event.
7. Verify the request has not already been rewarded locally.
8. Credit exactly 500 chips.
9. Persist the transaction.
10. Restore wallet controls.

### Do not reward

Do not issue chips merely because:

- The advertisement button was clicked.
- An advertisement request was created.
- An ad started loading.
- The advertisement became visible.
- An impression occurred.
- A player clicked an advertisement.
- An advertisement was closed.
- A timer elapsed.

Use the provider's documented reward-granted event.

### Duplicate reward prevention

Use local idempotency identifiers.

Prevent duplicate grants caused by:

- Duplicate SDK callbacks.
- Multiple button presses.
- React remounting.
- Browser refreshes.
- Multiple tabs.
- Repeated completion events.

Disable the reward request button while an advertisement request is active.

### Advertisement unavailable behavior

If an advertisement cannot be served:

- Display a clear unavailable status.
- Display the hourly reward countdown.
- Allow the player to close the wallet.
- Do not grant a fake advertisement reward.
- Do not trap the user in an advertisement screen.
- Do not force ordinary advertisements.

### Development mock provider

Implement a development-only mock provider.

It must simulate:

- Successful reward.
- Unavailable inventory.
- User cancellation.
- Provider error.
- Duplicate reward callbacks.

Never include a production-accessible control that simulates paid advertisement completion.

### Production provider

Do not select or activate an advertising provider without verifying its current requirements.

Research providers supporting browser-based rewarded advertisements and simulated casino content.

Verify:

- Publisher eligibility.
- Simulated blackjack content eligibility.
- Anonymous player compatibility.
- Nontransferable virtual reward requirements.
- Consent obligations.
- Age-related policies.
- Geographic availability.
- Repeat-ad limitations.
- SDK implementation requirements.

Do not implement authentication merely to satisfy an incompatible advertising provider.

If no suitable provider is approved, keep production advertising disabled.

The rest of the game must remain complete and usable.

### Client-side verification limitation

All rewards are client-side.

No Cloudflare Worker verification service or remote wallet is required.

Document that client-side completion records and balances can be manipulated and that provider-side verification may be unavailable.

Do not represent this architecture as fraud-proof.

### Responsible monetization

Do not:

- Artificially generate ad impressions.
- Incentivize ad clicks.
- Use misleading advertisement buttons.
- Introduce fake scarcity.
- Manipulate blackjack outcomes to reduce balances.
- Reward users for repeatedly viewing advertisements through achievements.
- Bypass provider restrictions.
- Hide that virtual chips have no monetary value.

---

## 23. WALLET INTERFACE

Create a polished wallet dialog or drawer.

Display:

- Current available chip balance.
- Pending or committed wagers when applicable.
- Hourly reward amount.
- Hourly reward countdown.
- Claim button when eligible.
- Optional rewarded advertisement button.
- Advertisement availability.
- Recent reward transactions.
- Clear explanation of virtual currency.

Suggested layout:

```text
YOUR WALLET

Available chips
1,250

Hourly reward
+1,000 chips
Available in 32:15

Rewarded advertisement
+500 chips
[Watch Ad]

Virtual chips have no monetary value.
```

On mobile, use an accessible full-width drawer or modal.

Do not obscure the table during an active hand.

If a player has insufficient chips to place the minimum wager, offer a clear link to the wallet.

Do not pressure the player to watch an advertisement.

---

## 24. BASIC STRATEGY ENGINE

Build an independent, rules-aware basic strategy engine.

This is one of the most important systems in the application.

### Core inputs

The strategy engine must account for:

- Selected deck count.
- Dealer upcard.
- Player hand composition.
- Hard or soft total.
- Pair status.
- Number of cards.
- Whether the hand originated from a split.
- Whether the hand is a restricted split-ace hand.
- Whether doubling is legally available.
- Whether another split is legally available.
- Remaining split capacity.
- Applicable table rules.
- Available balance.

### Recommended actions

Support:

- Hit.
- Stand.
- Double.
- Split.
- Decline insurance.
- Decline even money.

Do not recommend surrender because surrender is not available.

### Two recommendation layers

Distinguish:

1. Ideal basic strategy action under the configured table rules.
2. Best available legal and affordable alternative.

Example:

If basic strategy recommends doubling but the player cannot afford the additional wager, show:

```text
Basic strategy: DOUBLE
Available alternative: HIT
Reason: Insufficient chips to double.
```

The alternative must be mathematically appropriate for that hand.

Do not assume every unavailable double should become a hit.

### Strategy tables

Use validated strategy data appropriate to:

- Single deck.
- Double deck.
- Four-deck shoe.
- Six-deck shoe.
- Eight-deck shoe.

Where multiple deck counts use the same validated table, document that explicitly.

Support hard totals, soft totals, and pairs.

Use structured, versioned strategy data rather than scattered conditional statements.

Validate recommendations against authoritative blackjack mathematics references.

Do not scrape or reproduce proprietary artwork or strategy charts without permission.

Generate the application's own chart presentation from verified data.

### Strategy scope

The primary trainer should teach conventional total-dependent basic strategy.

Do not silently incorporate hidden shoe composition or count-based deviations into the basic strategy engine.

If exact-composition strategy differs in uncommon situations, document the chosen training convention.

The strategy engine must not access:

- Unrevealed dealer hole cards.
- Future cards.
- The order of undealt cards.

---

## 25. BASIC STRATEGY REFERENCE

Provide a permanently accessible Basic Strategy button.

It should be available within one interaction from the blackjack table.

### Desktop

Open an expandable side panel.

Allow the player to continue viewing the table when sufficient screen space exists.

### Mobile portrait

Open a full-screen or near-full-screen modal with:

- Large text.
- Easily scrollable chart.
- Clear close button.
- Sticky legend where useful.

### Mobile landscape

Use a responsive side panel or appropriately sized modal.

### Chart sections

Include:

- Hard totals.
- Soft totals.
- Pairs.
- Insurance guidance.
- Action legend.
- Current table rules.
- Selected deck count.

Suggested legend:

| Symbol | Meaning |
|---|---|
| H | Hit |
| S | Stand |
| D | Double |
| P | Split |
| Ds | Double if allowed, otherwise stand |
| Dh | Double if allowed, otherwise hit |

Use color and text labels together.

### Live highlighting

When basic strategy assistance is enabled:

- Highlight the current player hand category.
- Highlight the dealer upcard column.
- Highlight the applicable strategy cell.

Do not highlight an inactive hand's recommendation as though it applies to the active hand.

Update highlighting when the active hand changes.

---

## 26. LIVE BASIC STRATEGY ASSISTANCE

Provide a settings toggle:

```text
Basic Strategy Indicator
```

When enabled:

- Display the recommended action.
- Highlight the corresponding legal action button.
- Clearly label the recommendation as educational guidance.
- Provide an expandable explanation.

Example:

```text
Basic strategy recommends: STAND

[Why?]
```

Expanding the explanation should provide a concise, situation-specific reason.

Avoid overly technical language by default.

### Feedback preferences

Allow the following modes:

**Silent Tracking**

- Record decisions.
- Do not display corrective feedback.

**Educational Feedback**

- Display a brief non-blocking explanation when a decision differs from basic strategy.

**Confirmation Warning**

- Warn that the selected action differs from the recommendation.
- Allow the player to continue with their original decision.
- Do not automatically replace the decision.

Allow the player to change these settings.

Default feedback mode: silent tracking.

Default live assistance: off, with an optional beginner preset offered during onboarding.

This allows ordinary gameplay without unwanted hints.

### Accuracy calculation

Record the correctness of a decision independently of the outcome.

A correct decision that loses remains correct.

An incorrect decision that wins remains incorrect.

Forced actions must not inflate the accuracy percentage.

Examples of forced or automatic actions:

- Automatic stand on 21.
- Automatic completion of restricted split-ace hands.
- Dealer actions.
- Automatic settlement.

Track constrained legal decisions separately from unrestricted decisions where appropriate.

---

## 27. CARD COUNTING ENGINE

Implement Hi-Lo as the first supported counting system.

Use an extensible interface so additional counting systems can be added later.

### Hi-Lo weights

| Card rank | Weight |
|---|---:|
| 2, 3, 4, 5, 6 | +1 |
| 7, 8, 9 | 0 |
| 10, J, Q, K, A | −1 |

### Running count

The running count starts at zero when a fresh shoe is created.

Each exposed physical card changes the running count exactly once.

Example:

```text
Starting count: 0

5 exposed: +1
K exposed: −1
3 exposed: +1
8 exposed:  0

Running count: +1
```

### Critical visibility rule

Never count the dealer's hidden hole card until it is revealed.

The same rule applies to any other unrevealed card.

The visible counting state must not be calculated by inspecting all cards already removed from the shoe.

Maintain an explicit revealed-card event history.

Prevent double counting caused by:

- Card animation completion.
- Repeated reveal events.
- Moving cards between split hands.
- Resizing the screen.
- Changing themes.
- Restoring an active round.
- Opening historical round review.

### Reset behavior

Reset the count only when a fresh shoe is introduced.

Do not reset it:

- Between rounds.
- After a loss.
- After a win.
- When placing additional wagers.
- When opening settings.
- When changing counting indicator visibility.

---

## 28. CARD WEIGHT INDICATORS

Provide an independent settings toggle:

```text
Show Card Counting Weights
```

When enabled, every exposed playing card should show its Hi-Lo weight.

Use:

- Green or another accessible positive indicator for +1.
- Neutral gray for 0.
- Red or another accessible negative indicator for −1.

Always include the numeric weight.

Do not rely on color alone.

### Indicator placement

Place weights in a small corner label or clearly visible overlay.

The weight must not obscure:

- Card rank.
- Suit.
- Face-card artwork.
- Existing card annotations.
- Side bet combination highlights.

### Independence

Card weight visibility is independent of running count visibility.

Players must be able to:

- See card weights and the running count.
- See weights but hide the running count.
- See the running count without card weights.
- Hide both.

Never show an unrevealed card's weight.

---

## 29. RUNNING COUNT INDICATOR

Provide an independent toggle:

```text
Show Running Count
```

When enabled, display the current running count in an easily understood training panel.

Example:

```text
Running Count
+6
```

The displayed value must update when each card becomes exposed.

The visible update should remain synchronized with the card's reveal animation.

When hidden:

- Continue calculating the running count internally.
- Do not reset it.
- Do not accidentally reveal it in unrelated tooltips.
- Allow the player to reveal it or perform a manual count check.

Show explanatory information on demand.

Avoid framing a positive count as a guaranteed profitable opportunity.

---

## 30. TRUE COUNT EDUCATION

Implement true count education and optional live indicators.

### Formula

```text
True Count = Running Count / Estimated Decks Remaining
```

For example:

```text
Running count: +6
Estimated decks remaining: 3

True count: +2
```

### Calculation convention

Use the current undealt shoe size divided by 52 as the default exact remaining-deck estimate.

Document how hidden cards and removed cards are treated.

The true count must not incorporate the values of hidden cards.

Display true count to one decimal place by default.

Retain the appropriate underlying calculation precision for exercises.

Explain that actual physical table players generally estimate the remaining decks rather than knowing an exact digital card count.

### Visibility settings

Provide independent controls for:

- Running count.
- True count.
- Individual card weights.
- Remaining shoe information.

### Remaining shoe modes

**Visual Estimate**

Show a graphical shoe and discard tray without exact remaining quantities.

**Exact Quantities**

Show:

- Undealt cards.
- Estimated remaining decks.
- Current penetration.

**Hidden Numerical Information**

Conceal numerical shoe quantities while preserving ordinary table graphics.

The selected setting must not alter the underlying shoe.

---

## 31. MANUAL COUNT CHECKS

Provide an easily accessible Count Check control between rounds.

The player enters their estimated running count.

Example:

```text
What is the current running count?

[ +4 ]

[Check Answer]
```

After submission, show:

- Player answer.
- Actual count.
- Exact correctness.
- Difference from the correct count.
- A short educational explanation.

### Optional checkpoints

Allow players to enable periodic running count checks.

Suggested frequency options:

- Every 5 completed rounds.
- Every 10 completed rounds.
- Every 20 completed rounds.
- Custom interval.

Default: disabled.

Never interrupt an active hand.

Allow skipping a checkpoint.

Skipped checks must not count as incorrect answers.

### True count exercises

Allow players to calculate the true count manually using:

- Running count.
- Remaining deck estimate.

Depending on the exercise mode, the player may also estimate one or both underlying quantities.

Track:

- Submitted answer.
- Correct answer.
- Absolute error.
- Response time.
- Assistance visibility.
- Shoe size.
- Exercise type.

Use a documented numerical tolerance for decimal true count exercises.

Suggested default tolerance: ±0.1 for one-decimal answers.

---

## 32. EDUCATIONAL TUTORIALS

Include written explanations and interactive demonstrations.

### Blackjack fundamentals

Explain:

- Blackjack objective.
- Card values.
- Hard and soft hands.
- Natural blackjack.
- Hit.
- Stand.
- Double.
- Split.
- Insurance.
- Even money.
- Push.
- Dealer S17 behavior.
- Side bets.

### Basic strategy tutorial

Explain:

- What basic strategy represents.
- How to use a strategy chart.
- How dealer upcards affect decisions.
- Why correct decisions can still lose.
- Why a winning result does not validate an incorrect decision.

### Card counting tutorial

Explain:

- Hi-Lo card values.
- Running count.
- Counting only exposed cards.
- Maintaining a count across rounds.
- Resetting after shuffling.
- Estimated decks remaining.
- True count.

### Interactive counting example

Provide a small deterministic sequence of tutorial cards.

Allow the user to calculate the count and compare it with the correct answer.

Tutorial examples must be separate from ordinary gameplay.

They must not:

- Consume virtual chips.
- Modify the live shoe.
- Alter the live running count.
- Award ordinary gameplay profits.
- Become a separate unlimited blackjack practice mode.

There is no unlimited free-play blackjack mode.

All actual blackjack rounds use the ordinary virtual bankroll.

---

## 33. TRAINING ASSISTANCE PRESETS

Provide three customizable presets.

### Beginner

Suggested configuration:

- Basic strategy indicator: enabled.
- Recommended action highlighting: enabled.
- Card weights: enabled.
- Running count: visible.
- True count: visible.
- Exact remaining shoe information: visible.
- Educational feedback: enabled.
- Dealing speed: slow.

### Intermediate

Suggested configuration:

- Basic strategy indicator: disabled.
- Card weights: enabled.
- Running count: hidden.
- True count: hidden.
- Visual shoe estimate.
- Manual count checks available.
- Silent strategy tracking.
- Normal dealing speed.

### Advanced

Suggested configuration:

- Basic strategy indicator: disabled.
- Card weights: hidden.
- Running count: hidden.
- True count: hidden.
- Numerical shoe information: hidden.
- Manual count checks available.
- Silent strategy tracking.
- Fast dealing speed.

Presets only modify presentation and educational preferences.

They must not alter:

- Deck contents.
- Shuffle randomness.
- Game rules.
- Payouts.
- Virtual chip rewards.
- Betting limits.
- Card distribution.

Players can customize individual settings after applying any preset.

Do not lock players into a learning progression.

---

## 34. VISUAL ART DIRECTION

The game should combine an authentic casino table with a modern interface.

### Overall style

Classic casino atmosphere:

- Rich felt surfaces.
- Elegant gold or cream markings.
- Subtle wooden or dark trim.
- Traditional cards.
- Dimensional chips.
- Natural shadows.
- Restrained decorative details.

Modern interface:

- Clean typography.
- Accessible controls.
- Responsive layouts.
- Polished shadcn components.
- Clear information hierarchy.
- Consistent spacing.
- Minimal visual clutter.

Do not use pixel art simply because Phaser is the graphics engine.

Use high-quality 2D rendering.

### Camera perspective

Use a slightly angled 2D perspective.

Create the impression of physical depth through:

- Elliptical betting circles.
- Chip thickness.
- Layered stacks.
- Card shadows.
- Table geometry.
- Subtle perspective adjustments.

Do not introduce an unnecessary 3D engine.

### Table markings

Include traditional table text:

```text
BLACKJACK PAYS 3 TO 2

DEALER STANDS ON ALL 17s
```

Also identify:

- Main betting spots.
- Perfect Pairs spots.
- 21+3 spots.
- Dealer area.
- Shoe.
- Discard tray.

Keep markings readable but subordinate to active gameplay.

---

## 35. PLAYING CARD GRAPHICS

Use traditional playing cards with enhanced readability.

Each card should have:

- White or off-white face.
- Rounded corners.
- Clear rank.
- Clear suit.
- Distinct red and black suits.
- Traditional face-card artwork when available.
- Visible corner markings.
- Subtle shadow.

### Asset approach

Use appropriately licensed playing card artwork where beneficial.

Alternatively, generate an original card set programmatically.

Maintain a replaceable asset system.

Do not depend on third-party image URLs during gameplay.

### Card backs

Provide several selectable card back designs.

Suggested initial designs:

- Classic blue.
- Classic red.
- Black and gold.
- Minimal geometric design.

Additional designs may be educational achievement rewards.

### Readability

Cards must remain readable when:

- Multiple original positions are active.
- Hands are split.
- Cards overlap.
- Mobile portrait mode is active.
- Mobile landscape mode is active.
- Card weights are displayed.

Card overlap should reveal sufficient rank and suit information.

Do not create miniature unreadable cards to accommodate large hand counts.

---

## 36. CARD DEALING AND SETTLEMENT ANIMATIONS

Implement polished dealing animations using Phaser.

### Dealing

Cards should:

1. Begin at the shoe.
2. Travel toward the destination hand.
3. Rotate slightly where appropriate.
4. Settle into position.
5. Reveal their face when applicable.

The dealer hole card remains face down.

### Flipping

Implement a smooth card flip that:

- Compresses or rotates the visible card representation.
- Swaps the face at the midpoint.
- Expands into the revealed card face.

The flip animation must not expose hidden card values prematurely.

### Splitting

Animate:

- Moving the original pair into separate hands.
- Adding the corresponding wager.
- Dealing replacement cards.
- Highlighting the next active hand.

### Settlement

Use clear result labels:

- WIN.
- LOSE.
- PUSH.
- BLACKJACK.
- BUST.
- INSURANCE WIN.
- EVEN MONEY.

Show exact net results for each hand.

Provide a compact round summary.

For example:

```text
Round complete

Main wagers: −25
Perfect Pairs: +60
21+3: −5

Net round result: +30 chips
```

Do not display returned stakes as profits.

Do not celebrate a net loss as a winning round merely because an individual side bet paid out.

### Dealing speed settings

Support:

- Slow.
- Normal.
- Fast.
- Instant.

Suggested default: normal.

Changing animation speed must not alter:

- Dealt cards.
- Card order.
- Running count.
- Player action legality.
- Payouts.
- Statistical outcomes.

---

## 37. SIDE BET VISUAL FEEDBACK

When a side bet resolves:

- Identify the corresponding betting position.
- Highlight the participating cards.
- Display the qualifying combination.
- Display the payout ratio.
- Display the net winnings.
- Animate settlement to the appropriate chip location.

Example:

```text
PERFECT PAIR

25:1

+250 chips
```

For 21+3, highlight the two original player cards and the dealer's upcard.

If several side bets resolve simultaneously, use clear sequential or grouped presentation.

Do not confuse one position's payout with another position's wager.

For a losing side bet, show a restrained, unambiguous loss indicator.

Do not use near-miss effects or imply that an almost-qualifying combination has special significance.

---

## 38. TABLE THEMES AND CUSTOMIZATION

Provide selectable felt themes.

Initial themes:

- Classic green.
- Deep blue.
- Burgundy.
- Black.

Themes should affect:

- Felt colors.
- Table accents.
- Decorative markings.
- Appropriate shadow or lighting adjustments.

Themes must not affect gameplay or card readability.

Provide several free card back designs from the beginning.

Additional cosmetic designs may be unlocked through educational achievements.

No cosmetic may change:

- Blackjack rules.
- Payouts.
- Card probabilities.
- Chip reward amounts.
- Betting limits.
- Gameplay assistance accuracy.

---

## 39. DESKTOP GAMEPLAY LAYOUT

Desktop should be a first-class experience.

Use most of the viewport for the table.

### Desktop layout regions

**Top bar**

- Game title.
- Wallet balance.
- Wallet button.
- Strategy button.
- Rules button.
- Statistics button.
- Settings button.

**Dealer area**

- Dealer cards.
- Dealer total when appropriate.
- Shoe.
- Discard tray.

**Player area**

- Three betting positions.
- Expanded split-hand groups.
- Main betting spots.
- Enabled side bet spots.
- Active hand indicators.

**Training panel**

- Running count.
- True count.
- Remaining decks.
- Strategy recommendation.

Only show enabled indicators.

**On-table controls (inside the table boundary)**

During betting:

- Chip denominations.
- Undo.
- Clear.
- Rebet.
- Double Bet.
- Deal.

During player decisions:

- Hit.
- Stand.
- Double.
- Split.
- Insurance-related controls when appropriate.

### Side panels

Basic strategy and supplemental educational information should open in collapsible side panels.

Recalculate table geometry when panels open.

Do not simply overlay a panel on top of critical player cards.

---

## 40. MOBILE PORTRAIT LAYOUT

Mobile portrait is equally important.

Do not render a tiny desktop table inside a phone viewport.

Create a dedicated portrait layout.

### Betting phase

Display:

- All three available betting positions.
- Main wager for each position.
- Enabled side bet spots.
- Exact wager totals.
- Accessible denomination selector.
- Clear betting controls.

### Player decision phase

Prioritize the active hand.

Display:

- Dealer upcard and applicable dealer information.
- Active player hand at a comfortable readable size.
- Active hand total.
- Active hand wager.
- Original position and split-hand label.
- Other hands in a compact overview.
- Available action buttons.

The user should be able to inspect other hands without accidentally changing the engine's active decision target.

Viewing a different hand is not the same as changing which hand is being played.

### Split-hand overview

Support up to twelve resulting hands.

Group them by original position.

Use compact status cards, scrollable hand summaries, or another accessible arrangement.

Always make the active hand clear.

### Mobile action bar

Use large, thumb-friendly action buttons.

Recommended minimum touch target: 44 × 44 CSS pixels.

Keep the main action bar within comfortable reach.

Account for:

- Device safe areas.
- Browser navigation bars.
- Dynamic viewport height.
- On-screen keyboards during exercises.
- Small screen widths.

Do not require landscape orientation.

---

## 41. MOBILE LANDSCAPE LAYOUT

Create a separate landscape layout configuration.

Use additional horizontal space for:

- Dealer cards.
- Multiple player hand groups.
- Training information.
- Side panels where appropriate.

Ensure vertical controls remain accessible on short screens.

Do not assume landscape devices have the same available height as desktop monitors.

The mobile landscape experience must be independently tested.

### Responsive transitions

When a device rotates or a browser resizes:

- Preserve the current round.
- Preserve all cards and wagers.
- Preserve the active hand.
- Recalculate visual positions.
- Preserve pending animations or resolve them safely.
- Do not draw additional cards.
- Do not replay settlement transactions.
- Do not reset the running count.

The authoritative engine state must remain unchanged.

---

## 42. PHASER RESPONSIVE RENDERING

Use dedicated layout classes for:

- Desktop.
- Mobile portrait.
- Mobile landscape.

Within each layout, calculate positions dynamically according to available dimensions.

Do not use one fixed desktop canvas scaled proportionally across every device.

### Rendering architecture

The Phaser scene consumes a read-only gameplay projection and presentation events.

It sends validated user commands through the game controller.

Example commands:

```text
PLACE_CHIP
REMOVE_CHIP
UNDO_BET
CLEAR_BETS
DEAL
HIT
STAND
DOUBLE
SPLIT
```

The independent engine determines whether each command is legal.

Phaser must never directly modify the wallet or deal a card by manipulating visual sprites.

### React synchronization

Use a typed bridge between Phaser and Zustand.

Prevent:

- Duplicate event subscriptions.
- React remounts creating additional game instances.
- Stale active-hand references.
- Disagreement between displayed balance and engine balance.
- Animation callbacks repeating committed actions.

Destroy Phaser instances and event listeners appropriately when unmounting.

---

## 43. PLAYER CONTROLS

Support mouse, keyboard, and touch.

### Suggested desktop shortcuts

| Action | Default key |
|---|---|
| Hit | H |
| Stand | S |
| Double | D |
| Split | P |
| Deal | Enter |
| Undo | U |
| Clear bets | C |
| Rebet | R |
| Double bet | B |
| Basic strategy | G |
| Wallet | W |
| Settings | Escape |
| Select chip | 1–5 |

Shortcuts must be customizable.

Prevent conflicting bindings.

Allow restoring default bindings.

### Input focus

Do not trigger gameplay shortcuts while:

- Typing a count answer.
- Editing settings.
- Using a form.
- Interacting with an input field.
- Entering a custom numerical value.
- Navigating a modal where the shortcut is inappropriate.

### Action accessibility

Use readable action labels.

Use icons only when accompanied by clear labels or accessible names.

Disable unavailable actions with an explanation.

The interface must not imply that an unavailable action is possible.

---

## 44. AUDIO DESIGN

Support independent audio categories.

### Lounge music

Optional, relaxing instrumental lounge music.

### Casino ambience

Optional environmental sound.

Avoid excessive noise or distracting simulated crowds.

### Sound effects

Include:

- Card slide.
- Card flip.
- Chip placement.
- Chip stack.
- Chip collection.
- Shuffle.
- Action selection.
- Interface feedback.
- Restrained settlement sounds.

Use realistic physical sounds combined with subtle digital feedback.

### Settings

Provide independent volume sliders for:

- Music.
- Ambience.
- Sound effects.

Also provide master mute.

Respect browser audio autoplay restrictions.

Suggested default:

- Music off until explicitly enabled.
- Ambience off until explicitly enabled.
- Sound effects enabled at a moderate volume after user interaction.

Use original or appropriately licensed audio assets.

Do not use external streaming services.

---

## 45. ACCESSIBILITY

Provide comprehensive visual and interaction accessibility.

Requirements:

- High-contrast text.
- Large readable card ranks.
- Distinguishable suits.
- Numerical chip denominations.
- Color-independent status indicators.
- Keyboard-accessible menus.
- Accessible React controls.
- Meaningful accessible names.
- Visible focus states.
- Dialog focus management.
- Reduced-motion settings.
- Independent audio controls.
- Large mobile touch targets.

Respect the browser's reduced-motion preference.

Allow players to override presentation preferences.

Provide accessible DOM representations of critical game information, such as:

- Current active hand.
- Player card values.
- Dealer upcard.
- Available actions.
- Current wagers.
- Hand outcomes.
- Enabled educational recommendations.

Do not make essential information accessible only through canvas pixels.

Avoid rapid flashing.

Do not rely on screen shake or sound as the only indication of a result.

---

## 46. STATISTICS ARCHITECTURE

Implement comprehensive local gameplay and educational statistics.

Use an event-based architecture where appropriate.

Each completed round should produce structured data that can support:

- Lifetime summaries.
- Current session summaries.
- Detailed hand history.
- Educational analysis.
- Historical filters.
- Achievement evaluation.

Do not calculate every lifetime statistic by repeatedly scanning an unlimited raw history database.

Maintain aggregate statistics transactionally.

Preserve lifetime aggregates when detailed history is pruned.

### Distinguish rounds and hands

One round may contain:

- One to three original positions.
- One to twelve resulting player hands.

Track both:

- Rounds played.
- Original positions played.
- Resulting hands played.

Do not inflate one metric by confusing it with another.

---

## 47. GENERAL GAMEPLAY STATISTICS

Track:

- Rounds completed.
- Original betting positions played.
- Resulting hands played.
- Hands won.
- Hands lost.
- Pushes.
- Natural blackjacks.
- Player busts.
- Dealer blackjacks.
- Dealer busts.
- Doubles.
- Successful doubled hands.
- Splits.
- Resplits.
- Insurance wagers.
- Insurance outcomes.
- Even-money decisions.
- Cards dealt.
- Shoes completed.
- Shuffles.
- Total session time.

Calculate:

- Win rate.
- Loss rate.
- Push rate.
- Observed blackjack frequency.
- Observed dealer bust frequency.

Clearly identify the denominator for every percentage.

Do not present observed historical frequencies as guaranteed future probabilities.

---

## 48. BANKROLL ANALYTICS

Track:

- Initial balance.
- Current balance.
- Total main wagers committed.
- Total side wagers committed.
- Total insurance wagers committed.
- Total additional double wagers.
- Total additional split wagers.
- Returned stakes.
- Net main-game results.
- Net side bet results.
- Net insurance results.
- Hourly rewards received.
- Advertisement rewards received.
- Refunds.
- Balance resets.

### Balance history

Provide a virtual balance history chart.

Allow viewing:

- Actual wallet balance.
- Gameplay-only cumulative net results.

Clearly separate free currency rewards from gameplay winnings.

For example:

```text
Gameplay net result: −750
Hourly rewards: +2,000
Advertisement rewards: +500
```

Do not report the resulting increase in balance as a profitable blackjack session.

### Observed return

If displaying an observed return metric, define it clearly.

Do not imply that past performance predicts future results.

Avoid wagering recommendations based on bankroll trends.

---

## 49. SESSION MANAGEMENT

Support automatic sessions and manual session controls.

### Automatic sessions

Create a session when a player first enters the game.

Persist the active session identifier.

Suggested inactivity threshold:

```text
30 minutes
```

After a sufficiently long period of inactivity, begin a new session when gameplay resumes.

A restored unfinished round must remain associated with its original session.

### Manual session management

Provide:

```text
Start New Session
```

and:

```text
End Session
```

Do not allow ending a session in a way that abandons committed wagers or corrupts an active round.

If necessary, defer the session transition until settlement.

### Session summary

At the end of a session, optionally display:

- Rounds played.
- Hands played.
- Net gameplay results.
- Free rewards received.
- Basic strategy accuracy.
- Unassisted strategy accuracy.
- Counting accuracy.
- Common mistakes.
- Educational achievements.
- Session duration.

Do not introduce formal learning goals or daily task requirements.

---

## 50. COMPLETE ROUND HISTORY

Record sufficient information to reconstruct a completed round.

Suggested data includes:

- Round ID.
- Session ID.
- Shoe ID.
- Timestamp.
- Table rules version.
- Deck count.
- Penetration.
- Original betting positions.
- Original main wagers.
- Original side wagers.
- Initial dealt cards.
- Dealer upcard.
- Dealer hole card after reveal.
- Dealer actions.
- Player actions in chronological order.
- Split-hand relationships.
- Additional wagers.
- Insurance decisions.
- Even-money decisions.
- Side bet combinations.
- Individual outcomes.
- Net round result.
- Educational decisions.
- Counting checks where applicable.

### Historical review

Provide a step-by-step round viewer.

Features:

- Start of round.
- Initial deal.
- Next event.
- Previous event.
- Player decisions.
- Correct strategy recommendations.
- Dealer reveal.
- Dealer actions.
- Final settlement.

The viewer should allow the player to understand the round in its original chronological order.

It does not require a full animated Phaser replay.

Historical review must never:

- Modify the current shoe.
- Affect running count.
- Alter the wallet.
- Duplicate a settlement.
- Unlock the same achievement repeatedly.
- Reveal hidden card values before the corresponding historical reveal step.

---

## 51. STRATEGY DECISION RECORDS

Record every meaningful player decision with its complete context.

Suggested structure:

```typescript
interface StrategyDecisionRecord {
  id: string;
  roundId: string;
  sessionId: string;
  positionId: string;
  handId: string;

  timestamp: number;

  deckCount: number;
  rulesVersion: string;

  visiblePlayerCards: Card[];
  dealerUpcard: Card;

  handCategory: "hard" | "soft" | "pair" | "insurance";

  legalActions: PlayerAction[];

  idealRecommendation: PlayerAction;
  availableRecommendation: PlayerAction;
  selectedAction: PlayerAction;

  constrainedByBalance: boolean;
  constrainedByRules: boolean;

  assistance: AssistanceSnapshot;

  decisionTimeMs: number;

  isCorrect: boolean;
}
```

Adapt these types to the final implementation.

### Assistance tracking

Record whether the player:

- Had live basic strategy assistance visible.
- Had recommended button highlighting enabled.
- Opened the reference chart during the decision.
- Viewed the current recommendation's explanation.
- Received a confirmation warning.
- Made the decision independently.

Do not classify a decision as completely unassisted if the player already saw its answer.

A recommendation viewed and subsequently hidden must still count as assisted.

Track first-attempt decisions separately when a confirmation warning causes the player to change their selection.

---

## 52. EDUCATIONAL ANALYTICS

Create a comprehensive strategy analytics dashboard.

### Overall statistics

Display:

- Total evaluated decisions.
- Correct decisions.
- Incorrect decisions.
- Overall accuracy.
- Assisted accuracy.
- Unassisted accuracy.
- Constrained decision accuracy.

### Hand category breakdown

Separate:

- Hard totals.
- Soft totals.
- Pairs.
- Insurance and even money.

### Decision accuracy matrix

Provide a matrix organized by:

- Player total or pair.
- Dealer upcard.
- Number of attempts.
- Number of correct decisions.
- Accuracy percentage.

Allow filtering by:

- Deck count.
- Session.
- Date.
- Assistance level.
- Original table position.
- Hand category.

### Recurring mistakes

Identify frequently misunderstood situations.

Examples:

- Soft hand decisions.
- Pair splitting.
- Hard totals against low dealer upcards.
- Recognizing when doubling is permitted.
- Understanding insurance.

Provide the number of observations behind each conclusion.

Do not declare a weakness based on a single incorrect decision.

Suggested minimum sample size: five relevant decisions for an initial recurring-pattern indicator.

Use larger samples for stronger mastery conclusions.

### Mistake review

Display:

- Original hand.
- Dealer upcard.
- Legal actions.
- Player selection.
- Recommended action.
- Explanation.
- Whether assistance was used.
- Final hand outcome, separately.

The outcome must not determine whether the decision was correct.

---

## 53. COUNTING ANALYTICS

Track running count and true count exercises separately.

Record:

- Number of completed checks.
- Number of exact matches.
- Accuracy rate.
- Average absolute error.
- Average signed error.
- Response time.
- Shoe size.
- Penetration at the time of the check.
- Assistance visibility.
- Whether numerical shoe information was visible.

### Performance trends

Provide charts showing:

- Running count accuracy over time.
- True count calculation accuracy.
- Average error over time.
- Response-time trends.
- Performance by deck count.
- Assisted versus independent checks.

### Assistance integrity

If the correct running count was visible during a count check, classify that exercise accordingly.

Do not count copying the displayed answer as independent mastery.

For a formal independent count check, conceal the answer before the input is presented and record whether it had already been visible.

Do not leak the answer through accessibility labels or other visible game elements.

---

## 54. SIDE BET ANALYTICS

Track Perfect Pairs and 21+3 separately.

For each side bet, show:

- Number of wagers.
- Total chips wagered.
- Number of winning wagers.
- Number of losing wagers.
- Observed hit rate.
- Total returned stakes.
- Total profit.
- Net result.
- Combination frequencies.

### Perfect Pairs breakdown

- Perfect pairs.
- Colored pairs.
- Mixed pairs.
- Nonqualifying hands.

### 21+3 breakdown

- Suited trips.
- Straight flushes.
- Three of a kind.
- Straights.
- Flushes.
- Nonqualifying hands.

Separate results by deck count where appropriate.

Explain that rare side bet combinations are not equally likely and that some are impossible with smaller shoes.

Do not present side bet history as a prediction of which wager will win next.

---

## 55. STATISTICS DASHBOARD

Use a modern tabbed dashboard.

Suggested tabs:

1. Overview.
2. Gameplay.
3. Virtual Bankroll.
4. Basic Strategy.
5. Card Counting.
6. Side Bets.
7. History.
8. Achievements.

### Overview

Show high-level metrics:

- Total hands.
- Sessions completed.
- Current balance.
- Basic strategy accuracy.
- Unassisted accuracy.
- Counting accuracy.
- Educational mastery.

### Charts

Use a lightweight React-compatible charting library where appropriate.

Charts should be:

- Responsive.
- Accessible.
- Clearly labeled.
- Correctly formatted.
- Efficient with large histories.

Do not use fabricated example data in production.

Provide meaningful empty states for new players.

### Filters

Support:

- Current session.
- Specific session.
- Today.
- Last seven days.
- Last thirty days.
- Lifetime.
- Custom date range.
- Deck count.
- Assistance level.
- Hand category.
- Original betting position.

When detailed data has been pruned, clearly identify filters that only cover retained history.

Do not pretend lifetime aggregates can reconstruct missing detailed records.

---

## 56. EDUCATIONAL MASTERY

Provide skill-specific mastery tracking.

Separate three primary skill groups:

### Blackjack fundamentals

Understanding:

- Card values.
- Legal actions.
- Basic rules.
- Settlement.
- Dealer behavior.

### Basic strategy

Understanding:

- Hard totals.
- Soft totals.
- Pair decisions.
- Insurance.
- Unassisted decision accuracy.

### Card counting

Understanding:

- Hi-Lo weights.
- Running count.
- Maintaining a count.
- True count.
- Deck estimation.

### Mastery levels

Suggested labels:

```text
Learning
Developing
Proficient
Advanced
Mastered
```

Base levels on demonstrated educational performance and sufficient observations.

Do not award mastery solely for:

- Playing many hands.
- Spending more time.
- Winning more chips.
- Wagering larger amounts.
- Viewing advertisements.

Mastery thresholds must be configurable and documented.

Players must not be required to complete mastery levels to access ordinary gameplay.

---

## 57. ACHIEVEMENTS

Implement educational achievements.

Example achievements:

**First Lesson**

Complete the blackjack fundamentals tutorial.

**Know the Basics**

Complete the basic strategy tutorial.

**Hard Decisions**

Demonstrate proficiency in hard-total decisions.

**Soft Touch**

Demonstrate proficiency in soft-total decisions.

**Split Personality**

Demonstrate proficiency in pair decisions.

**Keep Count**

Complete an accurate independent running count check.

**True Understanding**

Successfully complete a true count exercise.

**Independent Thinker**

Demonstrate sustained basic strategy accuracy without assistance.

**Well Rounded**

Reach proficiency across the major educational categories.

**Lessons Learned**

Review recurring mistakes and demonstrate improvement in those categories.

### Suggested threshold policy

Use meaningful sample sizes.

For example:

- At least 30 relevant independent decisions for an initial proficiency achievement.
- At least 90% accuracy for a proficiency threshold.
- Multiple independent count checks for advanced counting achievements.

These are starting defaults, not mathematically universal definitions of mastery.

Keep them centralized and adjustable.

### Cosmetic unlocks

Achievements may unlock:

- Card back designs.
- Felt variants.
- Cosmetic table accents.
- Profile-style educational badges.

All ordinary gameplay features must remain accessible.

Do not reward:

- Losses.
- Wager amounts.
- Winning streaks.
- Repeated advertisement viewing.
- Continuous session length.

---

## 58. SESSION AWARENESS

Provide optional session awareness controls.

Settings:

- Show elapsed session time.
- Enable break reminders.
- Break reminder interval.
- Optional voluntary session time limit.

Suggested break reminder presets:

- 15 minutes.
- 30 minutes.
- 60 minutes.

Default: reminders available but disabled unless the player enables them.

When a reminder occurs:

- Wait until the current round finishes.
- Display a non-coercive reminder.
- Allow the player to close the game or continue.

When a voluntary time limit is reached:

- Finish the current round.
- Prevent another round until the player explicitly changes or clears their chosen limit.

Do not make leaving the game difficult.

Do not create retention mechanisms that penalize breaks or ending sessions.

Hourly rewards must not expire merely because the player takes a break.

---

## 59. INDEXEDDB PERSISTENCE

Use a versioned IndexedDB database.

Suggested stores:

```text
meta
wallet
transactions
activeRound
activeShoe
sessions
roundHistory
strategyDecisions
countChecks
aggregateStatistics
achievements
cosmeticUnlocks
```

Define appropriate primary keys and indexes.

Indexes may include:

- Timestamp.
- Session ID.
- Round ID.
- Deck count.
- Position ID.
- Assistance classification.
- Hand category.

### Schema management

Implement:

- Versioned schemas.
- Migrations.
- Validation.
- Corrupted data handling.
- Transactional writes.
- Storage quota handling.
- Storage usage estimation.

Do not silently delete the database when a migration fails.

Provide a clear recovery or reset option.

### Storage limitations

Browser storage can be cleared or evicted.

Inform players that their progress is saved locally and can be lost if they clear browser data or switch devices.

Provide backup and restore functionality.

---

## 60. EXACT ROUND RESTORATION

Refreshing during an active round must restore the exact round.

Persist:

- Shoe order.
- Shoe draw position.
- Round identifier.
- Current round phase.
- Original betting positions.
- All player hands.
- All split relationships.
- Dealer hand.
- Dealer hole card visibility.
- Current active hand.
- Main wagers.
- Side wagers.
- Insurance wagers.
- Even-money decisions.
- Committed wallet transactions.
- Resolved payouts.
- Revealed card identities.
- Running count.
- Pending shuffle.
- Pending table-setting changes.
- Educational records.

### Persistence boundary

Persist authoritative state after each accepted command and resulting event batch.

Critical state changes should commit atomically with the associated ledger changes.

If a persistence transaction fails, do not allow the interface to continue as though the command succeeded.

### Restore behavior

After reload:

- Load and validate the saved state.
- Restore the current phase.
- Restore the visible cards.
- Restore the active decision.
- Reconcile committed transactions.
- Resume or skip incomplete presentation animations safely.
- Never repeat an already completed payout.

### Hidden information

Although hidden cards must not appear in the ordinary interface, a technically knowledgeable user can inspect browser-local storage.

Do not claim hidden client-side cards are cryptographically protected from the player.

---

## 61. MULTIPLE BROWSER TABS

Allow one active playing tab per browser origin and game instance.

Use the Web Locks API where supported.

Provide a fallback using an appropriate combination of:

- BroadcastChannel.
- IndexedDB or localStorage coordination.
- Expiring ownership lease.
- Heartbeat.
- Unique tab identifier.

### Behavior

If another tab opens while a playing tab is active:

- Display a clear message.
- Prevent simultaneous gameplay.
- Prevent wager changes.
- Prevent reward claims.
- Prevent advertisement reward duplication.

Allow a controlled handoff after ownership is safely released.

Handle browser crashes and stale locks.

Use database transaction checks and idempotency even when a tab lock exists.

Do not claim browser-local locking can provide perfect coordination across all environments.

Document any fallback limitations.

---

## 62. STORAGE-AWARE HISTORY MANAGEMENT

Retain comprehensive detailed history while respecting browser storage limitations.

Suggested initial limits:

- Up to 5,000 detailed completed rounds.
- Configurable detailed history retention.
- A soft application storage budget of approximately 25 MB.

Actual limits should respect the device's available storage.

### Pruning

When the configured retention limit is reached:

- Remove the oldest eligible detailed records.
- Preserve lifetime aggregates.
- Preserve educational mastery progress.
- Preserve achievements.
- Preserve relevant summary statistics.
- Preserve active round data.
- Preserve wallet transaction integrity.

Do not prune records needed to resolve an active wager or pending transaction.

Use compact aggregate buckets to support common historical filters after raw history has been removed.

Clearly explain retention limitations.

---

## 63. EXPORT AND IMPORT

Provide:

- Full JSON backup and restore.
- CSV statistics export.

### JSON backup

Include:

- Schema version.
- Export timestamp.
- Application version.
- Settings.
- Virtual balance snapshot.
- Applicable wallet records.
- Lifetime aggregates.
- Sessions.
- Retained round history.
- Educational records.
- Achievements.
- Cosmetic unlocks.

Do not export provider secrets or private credentials.

Recommend exporting only between completed rounds.

### Import behavior

Validate imported data.

Display:

- Backup date.
- Schema version.
- Record counts.
- Compatibility information.
- What data will be replaced.

Require explicit confirmation.

Use a transactional restore operation.

Do not merge wallet rewards from multiple backups.

Do not let import trigger advertisement callbacks or issue rewards as if advertisements had been watched.

Backup restoration is a local data operation, not a way to transfer virtual chips to another player.

### CSV exports

Provide separate export options for:

- Round history.
- Hand history.
- Basic strategy decisions.
- Card counting checks.
- Side bet statistics.
- Session summaries.
- Wallet transaction summaries.

Use clear column names.

Escape CSV values correctly and protect against spreadsheet formula injection.

---

## 64. PLAYER DATA MANAGEMENT

Provide a dedicated Data Management settings section.

Display:

- Approximate storage usage.
- Number of saved rounds.
- Number of saved sessions.
- Number of educational records.
- Current history retention settings.

Provide individually confirmed reset options:

- Reset virtual balance.
- Clear detailed history.
- Reset gameplay statistics.
- Reset educational statistics.
- Reset achievements and cosmetics.
- Reset settings.
- Full factory reset.

### Reset behavior

Do not allow destructive resets during active rounds.

Explain dependencies between records.

Resetting balance must create a documented ledger baseline.

Recommended default: reset balance to the original 1,000 chips.

Resetting balance should not automatically reset the hourly reward cooldown.

A full reset may restore initial application state after explicit confirmation.

Do not silently clear unrelated data.

---

## 65. SETTINGS INTERFACE

Use organized settings categories.

### Table settings

- Deck count.
- Penetration slider.
- Penetration presets.
- Perfect Pairs toggle.
- 21+3 toggle.
- Rules reference.

### Training settings

- Basic strategy indicator.
- Action highlighting.
- Feedback behavior.
- Card counting system.
- Card weight visibility.
- Running count visibility.
- True count visibility.
- Remaining shoe visibility.
- Manual count checks.
- Optional periodic checks.
- Training presets.

### Appearance settings

- Felt theme.
- Card back.
- Reduced motion.
- Contrast preferences.
- Animation speed.

### Audio settings

- Master mute.
- Music volume.
- Ambience volume.
- Sound effect volume.

### Controls

- Keyboard shortcut configuration.
- Restore default shortcuts.
- Touch interaction preferences where appropriate.

### Session awareness

- Session timer.
- Break reminders.
- Reminder frequency.
- Voluntary time limit.

### Privacy

- Advertising consent controls.
- Website analytics preferences where applicable.
- Privacy policy access.
- Clear explanation of local storage.

### Data management

- History retention.
- Storage usage.
- Export.
- Import.
- Individual reset controls.
- Full reset.

---

## 66. PRIVACY AND ANALYTICS

Gameplay data remains on the player's device.

Do not upload:

- Card histories.
- Virtual balances.
- Individual player decisions.
- Count checks.
- Educational mistakes.
- Personal learning profiles.
- Detailed session histories.

Allow privacy-conscious website analytics for aggregate application usage.

Potential examples:

- Page visits.
- Anonymous route usage.
- General application error rates.

Do not collect invasive fingerprints.

Do not introduce personal identifiers merely for analytics.

### Consent

Implement applicable advertising and analytics consent requirements.

Do not load nonessential tracking scripts before consent where consent is required.

Allow players to revisit consent preferences.

If advertising consent is denied, respect the selected provider's permitted behavior.

Do not prevent ordinary gameplay solely because a user declines tracking.

### Privacy disclosure

Provide accessible privacy information describing:

- Local data storage.
- Optional website analytics.
- Advertising provider data handling.
- Virtual currency restrictions.
- Data deletion.
- Backup and restore.

Include an appropriate adult-audience disclosure for the simulated casino content and verify applicable age-related requirements before publication.

---

## 67. OFFLINE-READY ARCHITECTURE

The application should be designed so that gameplay does not depend on external services.

Bundle required:

- Card assets.
- Chip assets.
- Table assets.
- Fonts.
- Audio.
- Educational data.
- Strategy tables.

Do not request external resources merely to deal a hand or calculate a recommendation.

When advertisements are unavailable because the device is offline, display an appropriate unavailable state.

Do not implement service workers or PWA installation in the initial version.

Keep the architecture suitable for a future offline-installable version.

Do not claim the game supports cold-start offline loading before such functionality is implemented.

---

## 68. PERFORMANCE REQUIREMENTS

Support smooth rendering on desktop and mobile.

Targets:

- Stable 60 FPS on suitable ordinary devices.
- Smooth 120 Hz and higher presentation where supported.
- Adaptive visual effects on lower-powered devices.

### Optimization

Use:

- Reusable card textures.
- Reusable chip textures.
- Object pooling where beneficial.
- Efficient Phaser containers.
- Bounded particle counts.
- Batched or grouped settlement animations.
- Throttled dashboard updates.
- Efficient IndexedDB queries.
- Paginated or virtualized large history lists.
- Memoized aggregate calculations.

Do not update React state every animation frame unless necessary.

Do not repeatedly regenerate textures.

Do not perform expensive database scans during gameplay animations.

### Rendering independence

The blackjack engine is discrete and event-driven.

It does not require a fixed-timestep physics simulation.

Rendering frame rate must never affect:

- Shuffle randomness.
- Dealt cards.
- Legal actions.
- Settlement.
- Running count.
- Wallet balance.
- Educational accuracy.

---

## 69. ERROR HANDLING

Handle errors gracefully.

### Expected failure scenarios

- IndexedDB unavailable.
- Storage quota exceeded.
- Corrupted saved round.
- Invalid backup.
- Asset loading failure.
- Audio initialization failure.
- Unsupported browser API.
- Advertisement unavailable.
- Advertisement SDK error.
- Multiple tab conflict.
- Shoe exhaustion.
- Invalid gameplay command.
- Browser resize during animation.

### Recovery principles

- Preserve valid saved data whenever possible.
- Do not fabricate cards or payouts.
- Do not duplicate rewards.
- Do not continue from an inconsistent engine state.
- Explain failures in understandable language.
- Provide actionable recovery options.

If the saved round is unrecoverable, offer a clearly documented recovery process.

Do not silently issue arbitrary refunds or overwrite a valid wallet.

---

## 70. DEVELOPMENT TOOLS

Provide development-only diagnostic tools.

Examples:

- Force known player hands.
- Force dealer upcards.
- Inject a deterministic test shoe.
- Test all side bet categories.
- Simulate insufficient balance.
- Simulate corrupted storage.
- Simulate advertisement completion.
- Simulate duplicate reward callbacks.
- Test twelve-hand layouts.
- Inspect the round state machine.
- Display rendering performance.

Development tools must be excluded from or inaccessible in the production build.

Do not provide production users with developer-only shoe controls.

---

## 71. MATHEMATICAL TESTING

Mathematical correctness is mandatory.

Create extensive automated tests.

### Card tests

Verify:

- Each deck contains exactly 52 cards.
- Each rank and suit combination appears exactly once per deck.
- Each physical card has a unique identifier.
- Multi-deck shoes contain the correct number of cards.
- No card is dealt twice.
- Shuffling preserves the complete card multiset.

### Hand evaluation tests

Cover:

- Hard totals.
- Soft totals.
- Multiple aces.
- Busts.
- Natural blackjack.
- Split-hand 21.
- Pair eligibility.
- Mixed ten-value pair behavior.

### Dealer tests

Cover:

- Hard 16 hits.
- Soft 16 hits.
- Hard 17 stands.
- Soft 17 stands.
- Dealer blackjack.
- Dealer bust.
- Peek behavior.
- Hole card visibility.

### Main settlement tests

Cover:

- Ordinary wins.
- Losses.
- Pushes.
- Natural blackjack.
- Dealer natural blackjack.
- Player natural blackjack versus dealer ordinary 21.
- Split-hand 21.
- Doubled wins.
- Doubled losses.
- Doubled pushes.
- Odd wager blackjack payouts.
- Simultaneous multi-position settlement.

### Splitting tests

Cover:

- Initial split.
- Resplit.
- Maximum four hands per position.
- Three independent positions.
- Twelve total player hands.
- Insufficient balance.
- Split aces.
- Resplitting aces.
- Split-ace restrictions.
- Double after split.
- No repeated side bet settlement.

### Insurance tests

Cover:

- Insurance only offered against an ace.
- Maximum half-wager restriction.
- Fractional insurance wager values.
- Insurance success.
- Insurance loss.
- Independent main wager settlement.
- Even money.
- Mutual exclusion between even money and insurance.

---

## 72. SIDE BET MATHEMATICAL VALIDATION

Test every qualifying category.

### Perfect Pairs

Verify:

- Identical rank and suit.
- Identical rank and color.
- Identical rank with different colors.
- Same blackjack value but different ranks.
- Nonqualifying hands.
- Correct category priority.
- Correct payouts.
- Single-deck impossible combinations.

### 21+3

Verify:

- Suited trips.
- Straight flush.
- Three of a kind.
- Straight.
- Flush.
- Nonqualifying hands.
- Correct category priority.
- Ace-low straights.
- Ace-high straights.
- Invalid wraparound straights.
- Multi-deck duplicate physical cards.
- Two-deck impossible suited trips.
- Correct use of dealer upcard only.

### Exhaustive enumeration

Where computationally reasonable, exhaustively enumerate physical card combinations for the supported shoe sizes.

Alternatively, use exact combinatorial calculations and independently validate category counts.

Confirm that:

- Categories are mutually exclusive.
- All possible combinations are accounted for.
- Impossible outcomes have zero probability.
- Expected payout calculations match the implemented paytables.

Use seeded Monte Carlo simulations as a secondary validation tool.

Do not use simulation results alone as proof of exact mathematical correctness.

---

## 73. BASIC STRATEGY VALIDATION

Validate every supported strategy table against authoritative references or an independently verified mathematical solver.

Test:

- Every hard-total table cell.
- Every soft-total table cell.
- Every pair table cell.
- All ten dealer upcard categories.
- Every supported deck count.
- Doubling restrictions.
- Split restrictions.
- Resplit limits.
- Insufficient balance.
- Restricted split aces.
- Insurance guidance.
- Even-money guidance.

Test available-action fallbacks explicitly.

Verify that the strategy engine never consumes:

- The dealer's unrevealed card.
- Future shoe cards.
- Hidden shoe composition information.

Document the mathematical convention used by the trainer.

Do not claim that every recommendation is exact for every possible depleted-shoe composition if the engine implements ordinary total-dependent basic strategy.

---

## 74. CARD COUNTING VALIDATION

Test:

- Every rank's Hi-Lo weight.
- Running count initialization.
- Revealed card counting.
- Hidden hole-card exclusion.
- Counting the hole card exactly once upon reveal.
- Cards moved during splits.
- Duplicate visual reveal events.
- Multiple active betting positions.
- Multiple split hands.
- Shoe resets.
- True count calculation.
- Remaining deck calculation.
- Zero-card edge cases.
- Manual check accuracy.
- Decimal tolerance.
- Assistance classification.
- Reload restoration.
- Historical round review isolation.

A complete balanced Hi-Lo shoe must sum to zero when all its cards are exposed and counted exactly once.

---

## 75. ECONOMY AND PERSISTENCE TESTING

Verify:

- Starting balance is issued once.
- Bets reserve the correct amounts.
- Main wagers respect limits.
- Side bets respect limits.
- Undo restores pending funds.
- Clear restores pending funds.
- Rebet works correctly.
- Double Bet respects limits and available balance.
- Settlement returns correct stakes and profit.
- No negative balances.
- Half-chip arithmetic remains exact.
- Hourly claims occur at most once per eligibility interval.
- Hourly rewards do not accumulate offline.
- Refresh does not reset cooldowns.
- Duplicate reward events do not duplicate credits.
- Multiple tabs cannot normally spend the same balance.
- Restoring a round does not repeat a transaction.
- Imports do not double-count balances.
- History pruning preserves aggregate statistics.
- Storage migrations preserve supported data.

Use invariant-based tests.

Important invariant:

```text
Wallet balance =
initial balance
+ net gameplay results
+ free rewards
+ documented reset/refund adjustments
− currently outstanding committed stakes
```

Adapt the exact accounting expression to the ledger's chosen transaction model.

Ensure the invariant holds throughout round execution, not only after settlement.

---

## 76. ADVERTISING TESTING

Use the mock provider for automated tests.

Cover:

- Successful rewarded event.
- Advertisement unavailable.
- Provider initialization failure.
- User closing an advertisement.
- Duplicate reward callback.
- Repeated request attempts.
- Browser refresh.
- Multiple tab conflict.
- Consent denied.
- Request during an active round.
- Provider timeout or error.

Verify that chips are credited only after a valid reward event.

Verify exactly one 500-chip credit per valid completed request.

Do not use live advertisements for routine automated testing.

Do not generate artificial production impressions or clicks.

---

## 77. RESPONSIVE BROWSER TESTING

Use Playwright and manual verification.

Test desktop viewport sizes including approximately:

```text
1280 × 720
1440 × 900
1920 × 1080
```

Test mobile portrait:

```text
320 × 568
360 × 800
390 × 844
430 × 932
```

Test mobile landscape:

```text
667 × 375
844 × 390
932 × 430
```

Test tablet-sized layouts.

### Required scenarios

- Single-position betting.
- Three-position betting.
- Nine possible betting spots.
- Both side bets disabled.
- Only one side bet enabled.
- Mixed-denomination chip stacks.
- All main action buttons.
- Insurance.
- Resplitting.
- Maximum twelve-hand display.
- Strategy reference modal.
- Desktop strategy side panel.
- Wallet.
- Statistics.
- Settings.
- Count check input.
- Screen rotation during gameplay.
- Browser resize during animation.
- Refresh during active decisions.

### Acceptance

No essential controls should be:

- Clipped.
- Inaccessible.
- Unreadably small.
- Permanently hidden below the viewport.
- Obscured by modal panels.
- Covered by device safe areas.

Browser viewport emulation does not replace real-device testing.

Document which devices and browsers were actually tested.

---

## 78. PERFORMANCE VALIDATION

Profile:

- Table rendering.
- Multiple active player hands.
- Large chip stacks.
- Large side bet payouts.
- Frequent card animations.
- Dashboard rendering.
- Large retained histories.
- Database query performance.
- Mobile orientation changes.

Test reduced-motion and instant-dealing modes.

Measure performance rather than merely asserting that the game supports high refresh rates.

Report:

- Tested device or environment.
- Observed rendering FPS.
- Relevant frame-time measurements.
- Slow operations.
- Optimizations made.
- Remaining limitations.

---

## 79. DEVELOPMENT PHASES

Build in structured milestones.

Every phase must leave the application in a working state.

Do not build the entire settings interface before producing a playable blackjack round.

### Phase 1 — Independent blackjack engine

Implement:

- Card model.
- Deck generation.
- Secure shoe shuffling.
- Hand evaluation.
- Round state machine.
- Dealer behavior.
- Main wagers.
- Hit.
- Stand.
- Double.
- Split.
- Resplit.
- Insurance.
- Even money.
- Main settlement.

Acceptance:

The independent engine passes comprehensive unit tests and can execute complete blackjack rounds.

### Phase 2 — Virtual economy and side bets

Implement:

- Integer half-chip accounting.
- Wallet ledger.
- Starting balance.
- Three betting positions.
- Betting limits.
- Perfect Pairs.
- 21+3.
- Side bet toggles.
- Hourly claim system.
- Undo.
- Clear.
- Rebet.
- Double Bet.

Acceptance:

Every supported wager settles correctly, and the wallet remains consistent.

### Phase 3 — Playable Phaser table

Implement:

- Table rendering.
- Card graphics.
- Chip textures.
- Exact chip stacks.
- Betting spots.
- Tap-to-place.
- Drag-and-drop.
- Card dealing.
- Card flipping.
- Active hand indicators.
- Player controls.
- Basic settlement animations.

Acceptance:

The player can complete full rounds through the graphical interface.

### Phase 4 — Responsive layouts

Implement:

- Desktop layout.
- Mobile portrait layout.
- Mobile landscape layout.
- Adaptive split-hand presentation.
- Accessible action controls.
- Keyboard shortcuts.
- Orientation changes.
- Side panel resizing.

Acceptance:

All three layout modes support the complete blackjack game, including multi-position splits.

### Phase 5 — Educational systems

Implement:

- Rules-aware basic strategy.
- Strategy charts.
- Live highlighting.
- Expandable explanations.
- Feedback modes.
- Hi-Lo counting.
- Card weights.
- Running count.
- True count.
- Shoe visibility modes.
- Written tutorials.
- Interactive tutorials.
- Manual count checks.
- Periodic checkpoints.
- Training presets.

Acceptance:

Players can learn and practice strategy and counting without assistance affecting actual game outcomes.

### Phase 6 — Persistence and restoration

Implement:

- IndexedDB database.
- localStorage preferences.
- Versioned schemas.
- Transactional wallet persistence.
- Exact round restoration.
- Multiple tab locking.
- Storage management.
- Backup and restore.

Acceptance:

Refreshing or reopening the browser preserves legitimate game state without duplicated payouts.

### Phase 7 — Statistics and educational analytics

Implement:

- Session management.
- General statistics.
- Bankroll analytics.
- Side bet analytics.
- Complete round history.
- Step-by-step review.
- Strategy analytics.
- Counting analytics.
- Recurring mistake analysis.
- Advanced filters.
- CSV exports.

Acceptance:

Statistics accurately represent actual gameplay and educational performance.

### Phase 8 — Mastery, customization, and polish

Implement:

- Educational mastery.
- Educational achievements.
- Cosmetic unlocks.
- Felt themes.
- Card back designs.
- Music.
- Ambience.
- Sound effects.
- Advanced settlement animations.
- Reduced motion.
- Accessibility.
- Session awareness.

Acceptance:

The application feels cohesive, polished, readable, and complete.

### Phase 9 — Advertising infrastructure

Implement:

- Provider-independent adapter.
- Development mock provider.
- Reward lifecycle.
- Wallet advertisement controls.
- Idempotent reward crediting.
- Unavailable-ad behavior.
- Consent integration.

Research and connect a production provider only if approved and compatible with the confirmed requirements.

Acceptance:

The complete mock lifecycle works, and disabled production advertising does not break the game.

### Phase 10 — Final validation and integration readiness

Complete:

- Mathematical validation.
- Strategy validation.
- Unit tests.
- Integration tests.
- End-to-end tests.
- Responsive testing.
- Storage failure tests.
- Performance profiling.
- Production build.
- Documentation.
- Trial & Elias integration preparation.

Acceptance:

The game is ready for local review and subsequent website integration.

---

## 80. TRIAL & ELIAS INTEGRATION READINESS

Prepare the application for future deployment under:

```text
/blackjack-trainer/
```

### Build requirements

Use configurable Vite base paths.

Ensure:

- JavaScript assets load from the correct base path.
- CSS assets load correctly.
- Card textures resolve correctly.
- Phaser audio assets resolve correctly.
- Dynamic imports work.
- Fonts work.
- Educational data loads.
- No absolute Windows filesystem paths are required.

Do not hardcode root-relative asset paths that will fail when deployed under a subdirectory.

Provide documentation for integrating the production output into the existing Trial & Elias build.

### Styles

Prevent global CSS from modifying unrelated Trial & Elias pages.

Use appropriately isolated application styling.

Do not assume the entire parent website uses the same Tailwind configuration.

### Storage namespacing

Namespace blackjack-specific IndexedDB databases and localStorage keys.

Avoid collisions with:

- NATO Phonetic Alphabet Trainer.
- One Minute Dungeon.
- Future Trial & Elias applications.

Remember that applications hosted on different paths of the same origin share access to origin-scoped browser storage.

### Return navigation

Provide an unobtrusive configurable return link.

Suggested production destination:

```text
/#projects
```

Do not display a broken parent-site link in standalone development mode.

### Deployment restrictions

Do not:

- Modify the existing Worker without permission.
- Create a replacement Cloudflare Worker.
- Modify DNS.
- Create a GitHub remote repository.
- Push production code.
- Deploy automatically.

Stop at a locally validated implementation.

---

## 81. REQUIRED PROJECT COMMANDS

Provide working commands for:

```bash
npm install
npm run dev
npm run build
npm run preview
npm run typecheck
npm run lint
npm run test
npm run test:e2e
```

Also provide mathematical or simulation test scripts where useful.

For example:

```bash
npm run test:math
npm run simulate
```

Ensure production builds are reproducible from a clean installation.

Commit the package-manager lockfile.

Keep environment-specific values configurable.

Do not include secrets in frontend code.

---

## 82. DOCUMENTATION

Create a detailed README covering:

- Project purpose.
- Technology stack.
- Installation.
- Local development.
- Production builds.
- Architecture.
- Blackjack rules.
- Supported deck counts.
- Penetration behavior.
- Shuffle exhaustion policy.
- Perfect Pairs paytable.
- 21+3 paytable.
- Chip denominations.
- Virtual economy.
- Hourly rewards.
- Advertising architecture.
- Basic strategy implementation.
- Card counting conventions.
- Training settings.
- Persistence.
- Backup and restore.
- Statistics.
- Responsive layouts.
- Keyboard controls.
- Testing.
- Privacy.
- Known limitations.
- Trial & Elias integration.

### AGENTS.md

Create an AGENTS.md file explaining important project constraints for future coding agents.

Include:

- The independent engine is authoritative.
- Never implement gameplay rules inside Phaser animation callbacks.
- Never use floating-point currency arithmetic.
- Never count hidden cards.
- Never modify the confirmed paytables without approval.
- Never manipulate randomness based on player behavior.
- Never introduce real-money wagering.
- Never automatically activate advertising.
- Preserve mobile and desktop quality.
- Preserve existing saved data compatibility when possible.
- Run relevant tests after engine modifications.

---

## 83. NON-NEGOTIABLE REQUIREMENTS

Do not change the following confirmed decisions:

1. Phaser 3, React, TypeScript, and Vite.
2. Tailwind CSS, shadcn/ui, and Lucide.
3. Zustand shared state.
4. Independent modular blackjack engine.
5. Traditional 3:2 blackjack payouts.
6. Dealer stands on soft 17.
7. American hole-card rules.
8. Double on eligible initial two-card hands.
9. Double after split.
10. Resplit up to four hands per original position.
11. Resplitting aces.
12. One additional card per split ace, subject to resplitting.
13. No surrender.
14. Insurance and even money.
15. Three independent original betting positions.
16. Support up to twelve resulting player hands.
17. One, two, four, six, and eight decks.
18. Default six-deck shoe.
19. Default 75% penetration.
20. Penetration slider and presets.
21. Shoe changes apply after the current round.
22. Secure production randomness.
23. Seeded developer test mode.
24. Starting balance of 1,000 chips.
25. Chip denominations of 1, 5, 25, 100, 500, 1,000 and 5,000.
26. Main wager limits of 10–50,000.
27. Side wager limits of 1–100.
28. Perfect Pairs payouts of 25:1, 12:1, and 6:1.
29. 21+3 payouts of 100:1, 40:1, 30:1, 10:1, and 5:1.
30. Both side bets enabled by default.
31. Independently configurable side bet visibility.
32. Tap and drag-and-drop chip placement.
33. Exact denomination stacks with visual overflow handling.
34. Undo, Clear, Rebet, Double Bet, and Deal.
35. Exact half-chip balances.
36. Persistent virtual balance.
37. Manually claimable 1,000-chip hourly reward.
38. No offline accumulation of hourly rewards.
39. Optional 500-chip rewarded advertisements.
40. Advertisements accessed through the wallet.
41. Repeat voluntary ad requests subject to provider policies.
42. Provider-independent advertising adapter.
43. Client-side-only reward accounting.
44. No fake production advertisement completions.
45. No authentication.
46. No separate unlimited blackjack practice mode.
47. No real-money wagering or redeemable prizes.
48. Adaptive basic strategy reference.
49. Rules-aware strategy chart.
50. Live recommendation and action highlighting.
51. Expandable strategy explanations.
52. Configurable incorrect-decision feedback.
53. Comprehensive strategy accuracy tracking.
54. Extensible Hi-Lo counting system.
55. Independent count and card-weight visibility.
56. True count indicator and exercises.
57. Configurable shoe information.
58. Manual and optional periodic count checks.
59. Written and interactive tutorials.
60. Beginner, intermediate, and advanced presets.
61. Slow, normal, fast, and instant dealing.
62. Classic casino graphics with modern interfaces.
63. Slightly angled 2D table perspective.
64. Detailed dimensional chips.
65. Traditional readable playing cards.
66. Selectable card backs.
67. Polished dealing and settlement animations.
68. Side bet card highlights.
69. Adaptive split-hand layouts.
70. Equal-quality desktop and mobile experiences.
71. Dedicated portrait and landscape layouts.
72. Customizable keyboard shortcuts.
73. Optional lounge music and ambience.
74. Realistic and subtle sound effects.
75. Selectable felt themes.
76. Comprehensive accessibility.
77. Comprehensive gameplay statistics.
78. Detailed bankroll analytics.
79. Automatic and manual session management.
80. Complete round history with educational decisions.
81. Step-by-step history review.
82. Complete side bet analytics.
83. Strategy accuracy matrix.
84. Detailed assistance tracking.
85. Complete counting analytics.
86. Personalized mistake review.
87. Advanced statistics filters.
88. Skill-specific mastery.
89. Educational achievements.
90. Default cosmetics plus educational unlocks.
91. No formal learning goals.
92. Optional session awareness settings.
93. Storage-aware history management.
94. JSON backup and CSV exports.
95. Complete data management controls.
96. Tabbed dashboard and optional session summary.
97. IndexedDB plus localStorage.
98. Exact active round restoration.
99. One active playing tab.
100. Hybrid generated and licensed assets.
101. High-refresh-rate rendering support.
102. Privacy-conscious website analytics.
103. Offline-ready architecture without mandatory PWA support.
104. Trial & Elias integration readiness.
105. Local project first, without creating a remote repository.
106. Comprehensive mathematical and technical validation.
107. Phased implementation.

---

## 84. IMPLEMENTATION INSTRUCTIONS FOR CODEX

Before beginning:

1. Inspect the current workspace.
2. Identify existing project files.
3. Determine whether an initial application already exists.
4. Preserve unrelated working files.
5. Establish a concise implementation plan.
6. Identify the first playable milestone.
7. Record any assumptions and genuine blockers.

Then begin implementation.

Do not stop after presenting a plan.

Do not deliver a static blackjack table mockup instead of a functioning game.

Do not implement graphical controls without connecting them to working engine behavior.

Do not claim features are complete because corresponding files exist.

### For each milestone

1. Implement the required functionality.
2. Integrate it with existing systems.
3. Run TypeScript validation.
4. Run relevant automated tests.
5. Verify the application still builds.
6. Perform practical browser validation where available.
7. Fix discovered issues.
8. Record completed work and remaining tasks.

Keep the repository in a runnable state.

Do not introduce unnecessary dependencies.

Do not silently change previously confirmed design decisions.

If a feature cannot be completed, document the blocker precisely.

Do not fabricate a production advertisement provider, test result, or deployment status.

---

## 85. FINAL ACCEPTANCE CRITERIA

The game is ready for review only when:

### Core gameplay

- [ ] A player can launch the game without creating an account.
- [ ] The blackjack engine correctly implements the confirmed rules.
- [ ] All five deck counts work.
- [ ] Shuffle penetration works.
- [ ] Dealer peek behavior works.
- [ ] Three independent positions work.
- [ ] Splitting and resplitting work.
- [ ] Twelve-hand scenarios work.
- [ ] Split aces behave correctly.
- [ ] Doubling works.
- [ ] Insurance works.
- [ ] Even money works.
- [ ] Blackjack settlement is mathematically correct.

### Side bets

- [ ] Perfect Pairs evaluates correctly.
- [ ] 21+3 evaluates correctly.
- [ ] Both paytables match the specification.
- [ ] Side bets settle independently.
- [ ] Both side bets are enabled by default.
- [ ] Either side bet can be disabled independently.
- [ ] Impossible small-shoe combinations are handled correctly.

### Virtual economy

- [ ] Starting balance is correct.
- [ ] Chip denominations are correct.
- [ ] Betting limits are enforced.
- [ ] Half-chip accounting is exact.
- [ ] Undo works.
- [ ] Clear works.
- [ ] Rebet works.
- [ ] Double Bet works.
- [ ] Hourly rewards work.
- [ ] Wallet persistence works.
- [ ] Duplicate transactions are prevented.

### Advertising

- [ ] Provider-independent adapter is implemented.
- [ ] Development mock provider is implemented.
- [ ] Reward lifecycle is tested.
- [ ] Successful rewards credit exactly 500 chips.
- [ ] Unavailable advertisements do not generate false rewards.
- [ ] Advertisements cannot interrupt active rounds.
- [ ] Repeat voluntary requests respect provider availability.
- [ ] Production advertisements remain disabled unless an approved provider is configured.

### Educational systems

- [ ] Basic strategy recommendations are validated.
- [ ] Strategy chart adapts to the selected deck count.
- [ ] Live highlighting works.
- [ ] Explanations work.
- [ ] Feedback modes work.
- [ ] Hi-Lo counting works.
- [ ] Hidden cards are not counted.
- [ ] Running count visibility works.
- [ ] Card weight visibility works.
- [ ] True count works.
- [ ] Shoe visibility settings work.
- [ ] Manual count checks work.
- [ ] Optional checkpoints work.
- [ ] Tutorials work.
- [ ] Training presets work.
- [ ] Educational decisions are measured independently of outcomes.

### Graphics and interaction

- [ ] Playing cards are readable.
- [ ] Chip denomination colors are recognizable.
- [ ] Mixed-denomination stacks are visible.
- [ ] Drag-and-drop works.
- [ ] Tap-to-place works.
- [ ] Dealing animations work.
- [ ] Card flipping works.
- [ ] Settlement animations work.
- [ ] Side bet highlights work.
- [ ] Active hand indicators work.
- [ ] Theme selection works.
- [ ] Card back selection works.
- [ ] Audio settings work.
- [ ] Reduced motion works.
- [ ] Custom keyboard shortcuts work.

### Responsive design

- [ ] Desktop layout works.
- [ ] Mobile portrait layout works.
- [ ] Mobile landscape layout works.
- [ ] Twelve-hand scenarios remain navigable.
- [ ] Mobile controls are comfortably usable.
- [ ] Orientation changes preserve gameplay.
- [ ] No important controls are clipped or inaccessible.

### Statistics and persistence

- [ ] General statistics are accurate.
- [ ] Bankroll rewards and gameplay results remain separate.
- [ ] Assisted and unassisted decisions are distinguishable.
- [ ] Educational analytics work.
- [ ] Counting analytics work.
- [ ] Side bet statistics work.
- [ ] Session management works.
- [ ] Round history works.
- [ ] Step-by-step review works.
- [ ] Achievements work.
- [ ] Mastery indicators work.
- [ ] Cosmetic unlocks work.
- [ ] IndexedDB persistence works.
- [ ] Refresh restores an active round exactly.
- [ ] Multiple playing tabs are prevented under supported conditions.
- [ ] JSON backup and restore work.
- [ ] CSV exports work.
- [ ] Storage-aware history pruning works.
- [ ] Data reset controls work.

### Release readiness

- [ ] TypeScript validation passes.
- [ ] Automated tests pass.
- [ ] Mathematical tests pass.
- [ ] Strategy validation passes.
- [ ] Responsive browser tests pass.
- [ ] Production build succeeds.
- [ ] Documentation is complete.
- [ ] Asset redistribution rights are documented.
- [ ] Privacy controls are implemented.
- [ ] No real-money functionality exists.
- [ ] Trial & Elias integration instructions are complete.
- [ ] No production deployment occurs without approval.

---

## 86. FINAL IMPLEMENTATION REPORT

When development reaches its review milestone, provide:

### Completed functionality

Describe what is actually implemented.

### Architecture

Show the final project structure and major system boundaries.

### Local development

Provide exact startup commands.

### Mathematical validation

Report:

- Rules tests.
- Settlement tests.
- Side bet tests.
- Strategy table validation.
- Card counting tests.
- Simulation results, where performed.

### Interface validation

Report:

- Tested desktop viewports.
- Tested mobile portrait viewports.
- Tested mobile landscape viewports.
- Real devices tested, if any.
- Accessibility checks.
- Known visual limitations.

### Persistence validation

Report:

- Active round recovery tests.
- Wallet consistency tests.
- Multiple-tab behavior.
- Backup and restore testing.
- Storage failure behavior.

### Advertising status

Identify:

- Implemented adapter.
- Mock provider status.
- Production provider status.
- Publisher approval requirements.
- Consent requirements.
- Outstanding integration blockers.

Do not imply advertising monetization is live if an approved provider has not been connected.

### Outstanding issues

Explicitly document:

- Incomplete features.
- Failed tests.
- Unverified assumptions.
- Mathematical limitations.
- Browser compatibility limitations.
- Licensing questions.
- Privacy requirements.
- Production deployment considerations.

### Deployment readiness

Explain how the completed game can be integrated into Trial & Elias.

Do not modify the live website or deploy automatically.

---

## FINAL DIRECTIVE

Build **Blackjack Trainer** into a complete, polished, mathematically reliable blackjack simulator and educational platform.

The blackjack table must feel authentic.

Cards should deal naturally. Chips should look like physical chips. Different denominations should remain recognizable when stacked. The interface should feel thoughtfully designed on a desktop computer and equally thoughtfully designed on a phone.

The educational systems should make blackjack rules, basic strategy, running count, and true count easier to understand without forcing assistance on players.

The statistics should help players understand how they make decisions, not merely how many virtual chips they have won or lost.

The application must remain transparent, fair, and independent of advertising outcomes.

Build the core game first. Validate its mathematics. Add the educational systems, persistence, statistics, graphics, and monetization infrastructure in structured phases.

Do not sacrifice correctness for appearance.

Do not sacrifice mobile usability for desktop presentation.

Do not sacrifice desktop presentation for mobile simplicity.

Do not sacrifice the educational purpose for monetization.

Create a blackjack game that is enjoyable to play and genuinely useful for learning.

Begin by inspecting the current workspace and implementing the first development milestone.

## 87. IMPLEMENTATION AUTONOMY AND DECISION-MAKING

You are responsible for implementing the application, not merely generating examples or suggesting how it could be implemented.

Treat this master prompt as the authoritative product specification.

### Decision hierarchy

When making implementation decisions, prioritize:

1. Explicitly confirmed requirements in this specification.
2. Mathematical correctness.
3. Game state and wallet integrity.
4. Educational accuracy.
5. Accessibility and responsive usability.
6. Maintainability.
7. Performance.
8. Visual polish.

If a requirement is ambiguous, select a reasonable implementation that is consistent with the overall project objectives.

Document material assumptions.

Do not repeatedly request clarification for ordinary engineering decisions that can reasonably be made independently.

### Decisions requiring explicit approval

Do not independently:

- Change confirmed blackjack rules.
- Change confirmed payout ratios.
- Replace the selected technology stack.
- Introduce mandatory authentication.
- Introduce a remote database.
- Introduce a paid dependency.
- Activate a production advertising provider.
- Modify the existing Trial & Elias website.
- Create a remote repository.
- Deploy the application publicly.
- Introduce real-money functionality.

### Implementation freedom

You may independently determine:

- Internal TypeScript interfaces.
- Component organization.
- Utility functions.
- Naming conventions.
- Appropriate supporting dependencies.
- Database indexes.
- Animation timing.
- Responsive breakpoints.
- Visual spacing.
- Asset generation techniques.
- Internal event structures.
- Testing fixtures.
- Error recovery mechanisms.

These decisions must remain consistent with the confirmed architecture and product requirements.

---

## 88. PROJECT PROGRESS AND CONTEXT MANAGEMENT

This project is sufficiently large that development may span multiple coding sessions and context windows.

Do not rely exclusively on conversation history to maintain continuity.

Create and maintain the following project documentation:

```text
AGENTS.md
README.md
docs/
├── SPECIFICATION.md
├── ARCHITECTURE.md
├── DEVELOPMENT_PROGRESS.md
├── DECISIONS.md
├── TESTING.md
├── MATHEMATICAL_VALIDATION.md
├── ASSET_LICENSES.md
├── ADVERTISING.md
├── KNOWN_ISSUES.md
└── INTEGRATION.md
```

### AGENTS.md

Include:

- Project objectives.
- Technology stack.
- Architectural boundaries.
- Coding conventions.
- Required validation commands.
- Non-negotiable requirements.
- Instructions for resuming development.
- References to the authoritative specification.

Keep this file concise enough to be useful during subsequent development sessions.

### SPECIFICATION.md

Preserve the complete master development specification.

Do not shorten the specification in a manner that removes confirmed functionality.

Do not silently modify confirmed requirements.

### DEVELOPMENT_PROGRESS.md

Maintain an up-to-date implementation checklist containing:

- Current development phase.
- Completed milestones.
- Features currently being implemented.
- Remaining features.
- Latest successful validation commands.
- Failed tests.
- Known blockers.
- Recommended next implementation task.

Update this file whenever a meaningful implementation milestone is completed.

### DECISIONS.md

Record significant architectural decisions.

Each entry should include:

- Decision.
- Reasoning.
- Alternatives considered.
- Relevant trade-offs.
- Affected systems.
- Whether the decision was explicitly specified or independently selected.

### Resuming development

Whenever development resumes in a new session:

1. Read AGENTS.md.
2. Read the specification.
3. Read DEVELOPMENT_PROGRESS.md.
4. Inspect the existing implementation.
5. Review relevant architectural decisions.
6. Run appropriate validation commands.
7. Continue from the first incomplete milestone.

Do not unnecessarily rebuild functionality that already exists and works.

Do not assume that an earlier implementation is correct merely because it was marked complete.

Verify important functionality before extending it.

---

## 89. AUTHORITATIVE STATE AND EVENT PROCESSING

Maintain a single authoritative source of truth for gameplay.

The independent blackjack engine owns the logical state of the game.

React and Phaser consume projections of that state.

### Recommended event flow

```text
Player interaction
        ↓
Application command
        ↓
Engine validation
        ↓
Engine state transition
        ↓
Persistence transaction
        ↓
Committed game events
        ↓
React and Phaser presentation
```

The exact implementation may differ, provided the same guarantees are preserved.

### Commands

Represent meaningful gameplay interactions as explicit commands.

Examples:

- Place chip.
- Remove chip.
- Clear wagers.
- Rebet.
- Deal.
- Hit.
- Stand.
- Double.
- Split.
- Accept insurance.
- Decline insurance.
- Accept even money.
- Claim hourly reward.

Each command must be validated against the current authoritative state.

Where necessary, include:

- Command identifier.
- Round identifier.
- Active hand identifier.
- Expected state revision.
- Relevant command parameters.

Reject stale or duplicate commands safely.

### Events

Represent completed logical transitions as explicit game events.

Examples:

- Round started.
- Wagers committed.
- Card dealt.
- Card revealed.
- Hand split.
- Hand completed.
- Dealer revealed.
- Side bet settled.
- Main hand settled.
- Round completed.
- Shoe replaced.

Events must be suitable for:

- Animation sequencing.
- Historical replay.
- Statistics generation.
- Educational tracking.
- State recovery.
- Debugging.

### State revisions

Use a monotonically increasing revision number or equivalent mechanism to detect stale state.

Do not allow delayed callbacks, animation events, or outdated React closures to issue actions against a different active hand.

### Persistence failures

If a critical state transition cannot be persisted:

- Prevent additional conflicting gameplay mutations.
- Preserve the last known committed state.
- Display a recoverable error.
- Avoid issuing additional payouts.
- Allow retrying or restoring the last valid snapshot.

Do not silently continue with a wallet balance that differs from persisted transaction history.

---

## 90. GAME INVARIANTS

Define and enforce important application invariants.

An invariant represents a condition that must remain true regardless of player behavior, animation timing, browser refreshes, or unusual game scenarios.

### Shoe invariants

- Every physical card has a unique identity within its shoe.
- A physical card cannot occupy multiple logical locations simultaneously.
- Cards cannot be dealt twice from the same shoe.
- Card ownership and location remain consistent.
- The running count equals the sum of eligible exposed-card weights.
- Unrevealed cards never affect the running count.
- The number of cards within the shoe and its associated card collections remains consistent with the original deck count.

### Hand invariants

- An original betting position cannot exceed four resulting hands.
- A round cannot exceed twelve resulting player hands.
- Only one hand can accept ordinary player actions at a time.
- Completed hands cannot accept additional player decisions.
- A split hand cannot receive a natural blackjack payout.
- A doubled hand receives exactly one additional card.
- Restricted split-ace hands cannot perform prohibited actions.

### Wallet invariants

- Available balance cannot become negative.
- Pending reservations cannot exceed available funds.
- Every committed wager corresponds to an authoritative transaction.
- A committed wager cannot be deducted twice.
- Returned stakes cannot be credited twice.
- A settled wager cannot be settled again.
- Advertisement rewards and hourly rewards cannot be duplicated.
- Wallet values are represented using integer half-chip units.

### Round invariants

- A completed round cannot return to an active player-action phase.
- Dealer behavior is deterministic under the configured rules.
- Settlement occurs exactly once for each eligible wager.
- Settings changes cannot retroactively modify committed round rules.
- Animation state cannot change logical outcomes.
- Historical replay cannot mutate the active game.

Enforce these conditions through appropriate validation, assertions, integration tests, and property-based testing where beneficial.

---

## 91. ADDITIONAL MATHEMATICAL EDGE CASES

Explicitly validate uncommon combinations of rules and game states.

### Natural blackjack and insurance

Test:

- Player blackjack versus dealer blackjack.
- Player blackjack versus dealer ordinary 21.
- Player blackjack against an ace when even money is declined.
- Player blackjack against an ace when even money is accepted.
- Multiple original positions accepting different insurance decisions.
- Partial insurance wagers, if supported.
- Insurance wagers involving odd whole-chip main wagers.
- Insufficient available balance for maximum insurance.

### Splitting

Test:

- Splitting mixed ten-value ranks.
- Resplitting into four hands.
- Reaching four hands independently at multiple betting positions.
- Reaching twelve total player hands.
- Insufficient funds during a resplit opportunity.
- Doubling after splitting.
- Splitting aces.
- Resplitting aces.
- Automatic completion of restricted split-ace hands.
- Ordinary 21 resulting from split aces.
- Split hands competing against dealer blackjack and ordinary dealer 21 where applicable.

### Fractional chip accounting

Verify that all supported main wager and insurance combinations remain compatible with integer half-chip accounting.

For example:

```text
Main wager: 25 chips
Blackjack profit: 37.5 chips
Total return: 62.5 chips
Maximum insurance: 12.5 chips
Insurance profit: 25 chips
```

If an optional betting interaction would require finer precision than half-chip units, constrain that interaction to supported increments.

Never silently round a player's legitimate payout.

### Side bets

Test:

- Impossible combinations in single-deck configurations.
- Impossible suited trips in two-deck configurations.
- Identical ranks with different suits.
- Identical physical rank-and-suit combinations from different decks.
- Ace-low straights.
- Ace-high straights.
- Invalid wraparound straights.
- Overlapping qualifying combinations.
- Side bet settlement during dealer blackjack.
- Side bets after the original hand has been split.

### Shoe exhaustion

Test:

- Cut-card threshold reached during a player decision.
- Cut-card threshold reached during dealer play.
- Early reshuffle before a round.
- Exceptional exhaustion during an active round.
- Outstanding insurance during canceled rounds.
- Previously settled side bets during canceled rounds.
- Correct refund amounts for incomplete main wagers.
- Running count reset after emergency shoe replacement.

---

## 92. AUTOMATED PROPERTY AND REGRESSION TESTING

In addition to predefined test cases, implement randomized validation of the engine.

Use deterministic seeds so failures can be reproduced.

### Simulation objectives

Run simulated rounds across:

- Every supported deck count.
- Multiple penetration settings.
- One, two, and three active betting positions.
- Different starting balances.
- Side bets enabled and disabled.
- Multiple split and double scenarios.
- Legal randomized player actions.

### Validate throughout each simulation

- No duplicate physical cards.
- No invalid state transitions.
- No negative available balances.
- No duplicate payouts.
- No unhandled exceptions.
- No exceeded hand limits.
- No invalid dealer actions.
- No inconsistent running counts.
- No orphaned committed wagers.
- No unresolved ordinary rounds.

When a simulation fails, report:

- Random seed.
- Initial configuration.
- Relevant commands.
- State before failure.
- State after failure, if available.
- Violated invariant.

Convert important discovered failures into permanent regression tests.

### Statistical validation

Where sufficiently large simulations are practical, compare observed mathematical results against appropriately verified theoretical expectations.

Document:

- Number of simulated rounds.
- Rule configuration.
- Strategy assumptions.
- Observed results.
- Expected results.
- Sampling uncertainty.
- Known limitations.

Do not claim that a simulation proves correctness merely because its average outcome appears plausible.

---

## 93. VISUAL QUALITY ASSURANCE

Functional correctness alone is insufficient.

The application must also be deliberately reviewed as a visual product.

### Review representative game states

Capture and inspect the interface during:

- Initial loading.
- Empty betting table.
- One active position.
- Three active positions.
- Initial card dealing.
- Insurance decisions.
- Ordinary player decisions.
- Split hands.
- Twelve-hand scenarios.
- Dealer play.
- Main settlement.
- Side bet settlement.
- Shoe reshuffling.
- Wallet display.
- Basic strategy reference.
- Statistics dashboard.
- Historical round review.
- Settings.
- Tutorials.

Review these states across desktop, mobile portrait, and mobile landscape viewports.

### Visual defects to prevent

- Overlapping cards that obscure ranks.
- Unreadable suits.
- Incorrect chip colors.
- Excessively tall chip stacks.
- Clipped controls.
- Unintentional horizontal scrolling.
- Unreadable annotations.
- Misaligned betting spots.
- Hidden active-hand indicators.
- Excessive empty space.
- Inconsistent typography.
- Layout shifts during animations.
- Mobile controls positioned outside comfortable reach.
- Poor foreground and background contrast.
- Dialogs that cannot be dismissed.

### Design consistency

Maintain centralized design tokens for:

- Typography.
- Spacing.
- Interface colors.
- Borders.
- Shadows.
- Corner radii.
- Animation durations.
- Focus states.
- Responsive layout measurements.

The surrounding interface should feel like part of the same product as the Phaser table.

Do not allow default component-library styling to dominate the visual identity.

---

## 94. LIFECYCLE AND RESOURCE MANAGEMENT

Phaser, React, IndexedDB, and browser lifecycle events must be integrated carefully.

### Phaser lifecycle

Ensure that:

- Only the intended game instance exists.
- React rerenders do not recreate the Phaser game unnecessarily.
- Scene transitions do not leak event listeners.
- Unmounting the game disposes appropriate resources.
- Resizing does not duplicate sprites or logical card objects.
- Theme changes do not reset the active round.
- Historical replay does not interfere with the active gameplay scene.

### Browser lifecycle

Handle:

- Window resizing.
- Orientation changes.
- Browser tab visibility changes.
- Background throttling.
- Page refreshes.
- Navigation away from gameplay.
- Browser back and forward navigation.
- Temporary storage failures.
- Unexpected tab closure.

When returning to an interrupted presentation sequence, reconstruct the visuals from authoritative state.

Do not depend on every individual animation callback having executed.

### Audio lifecycle

- Respect browser autoplay restrictions.
- Avoid duplicated background audio.
- Suspend or reduce audio appropriately when the application is inactive.
- Preserve user audio preferences.
- Dispose unused audio resources.

### Cleanup

Clean up:

- Event subscriptions.
- Timers.
- Animation references.
- Keyboard listeners.
- Resize observers.
- Broadcast channels.
- Browser locks.
- Database connections where appropriate.

---

## 95. EDUCATIONAL DATA INTEGRITY

Educational records must accurately describe the information available to the player when a decision was made.

### Assistance classification

Record relevant assistance exposure rather than relying solely on whether an assistance setting was enabled.

Distinguish:

- Recommendation displayed before a decision.
- Strategy chart opened during a decision.
- Corrective feedback displayed after a decision.
- Card weights visible.
- Running count visible.
- True count visible.
- Remaining shoe information visible.
- Relevant count information revealed before an exercise submission.

A player who consulted the strategy chart with the live recommendation indicator disabled should not automatically be classified as completely unassisted.

### Decision integrity

Capture the recommendation and relevant rules before applying the selected action.

Do not recalculate historical correctness using a later hand state.

Preserve:

- Strategy table version.
- Table rule configuration.
- Legal actions.
- Affordable actions.
- Ideal recommendation.
- Best available recommendation.
- Selected action.
- Relevant assistance exposure.

### Exercise integrity

Distinguish:

- Independent attempts.
- Assisted attempts.
- Skipped exercises.
- Answers revealed without submission.
- Retried exercises.
- Interrupted exercises.

Do not count skipped exercises as incorrect.

Do not treat an answer entered after revealing the correct answer as independent mastery.

### Version changes

If strategy data or educational evaluation logic changes:

- Preserve historical records.
- Identify the version originally used.
- Do not silently rewrite historical accuracy.
- Document whether historical records can be re-evaluated.

---

## 96. SECURITY AND DEPENDENCY MANAGEMENT

Although the application does not involve real money or authentication, follow reasonable software security practices.

### Dependencies

- Prefer established, maintained packages.
- Avoid unnecessary dependencies.
- Commit the package-manager lockfile.
- Review significant dependency vulnerabilities.
- Document unresolved vulnerabilities that materially affect the application.

### External services

Do not embed:

- Private API keys.
- Advertising account secrets.
- Cloudflare credentials.
- GitHub access tokens.
- Personal credentials.

Anything included in a browser build must be treated as publicly accessible.

### Imported data

Treat imported backup files as untrusted data.

Validate:

- File format.
- Schema version.
- Required fields.
- Identifiers.
- Numeric bounds.
- Transaction consistency.
- Supported game states.
- Maximum reasonable file size.

Reject malformed or incompatible backups with understandable error messages.

Do not partially replace existing player data following a failed import.

### Content safety

Do not execute imported strings as code.

Avoid unsafe HTML rendering.

Do not introduce unnecessary third-party tracking scripts.

Keep development-only controls inaccessible in ordinary production builds.

---

## 97. FEATURE COMPLETENESS STANDARD

A feature is not considered complete merely because a corresponding component, module, or interface exists.

A feature is complete only when all applicable requirements have been satisfied.

### Definition of done

For each feature, verify:

1. The underlying functionality exists.
2. The functionality is connected to the application.
3. Relevant interactions work.
4. Invalid inputs are handled.
5. Loading and error states are handled where applicable.
6. Persistence works where required.
7. Refresh behavior is correct.
8. Responsive layouts work.
9. Accessibility requirements are met.
10. Appropriate tests exist.
11. Tests pass.
12. Documentation reflects the implementation.

### Prohibited shortcuts

Do not present the following as completed functionality:

- Buttons that do nothing.
- Hardcoded statistics.
- Fabricated gameplay history.
- Fake wallet transactions.
- Placeholder strategy recommendations.
- Randomly selected dealer decisions.
- Nonfunctional settings toggles.
- Static mockups of interactive features.
- Simulated production advertisement rewards.
- Placeholder achievements that cannot actually unlock.
- Historical replay that merely displays a final screenshot.
- Mobile layouts that omit required functionality.

Temporary placeholders are acceptable during intermediate development only when clearly documented and subsequently replaced.

---

## 98. RELEASE GATES

Before considering the project ready for final review, complete the following release gates.

### Gate 1 — Engine integrity

- All confirmed blackjack rules are implemented.
- Settlement is mathematically correct.
- Shoe management is reliable.
- Side bet evaluation is correct.
- Game invariants are enforced.

### Gate 2 — Economy integrity

- Wallet accounting is exact.
- Pending and committed wagers are distinct.
- Refunds work.
- Rewards are idempotent.
- Refreshes cannot duplicate legitimate payouts under supported conditions.

### Gate 3 — Educational integrity

- Strategy recommendations are validated.
- Assistance classification is accurate.
- Running counts are correct.
- True counts follow the documented convention.
- Exercise grading is accurate.

### Gate 4 — Interface quality

- Desktop gameplay is complete.
- Mobile portrait gameplay is complete.
- Mobile landscape gameplay is complete.
- Maximum-hand scenarios remain usable.
- Graphics and animations are polished.
- Important controls are accessible.

### Gate 5 — Persistence and recovery

- Exact active-round restoration works.
- Multiple-tab protection works under documented browser conditions.
- Backup and restoration work.
- Database migrations are tested.
- Storage failures are handled appropriately.

### Gate 6 — Production readiness

- Production compilation succeeds.
- Development-only tools are excluded.
- Asset licenses are documented.
- Advertising is disabled unless approved and configured.
- No real-money functionality exists.
- Trial & Elias integration instructions are complete.
- Known limitations are documented.

Do not bypass a failed release gate by changing the acceptance criteria.

---

## 99. DEVELOPMENT HANDOFF PROCEDURE

At the conclusion of each coding session, leave the project in a state that another developer or coding agent can resume.

Provide a concise handoff containing:

### Current status

- Active development phase.
- Completed features.
- Partially implemented features.
- Remaining requirements.

### Implementation details

- Important files created or modified.
- Architectural decisions made.
- Relevant database changes.
- New dependencies.
- Significant bug fixes.

### Validation

- Commands executed.
- Tests passed.
- Tests failed.
- Browser scenarios reviewed.
- Validation that could not be performed.

### Next steps

Identify the highest-priority remaining implementation tasks in dependency order.

Do not recommend cosmetic refinements ahead of unresolved game-engine, mathematical, or wallet-integrity defects.

Update DEVELOPMENT_PROGRESS.md before ending the session.

Do not claim that the project will continue implementing itself after the coding session ends.

---

## 100. FINAL PRODUCT PHILOSOPHY

Blackjack Trainer should be developed as a real software product, not as a disposable demonstration.

The application should demonstrate that an independently developed browser game can combine:

- Correct game mathematics.
- Reliable software architecture.
- Attractive interactive graphics.
- Educational depth.
- Detailed local analytics.
- Thoughtful responsive design.
- Transparent monetization.
- Respect for player privacy.

A new player should be able to learn blackjack without prior knowledge.

An experienced player should be able to disable assistance and practice independently.

A player returning after closing the browser should find their legitimate progress preserved.

A developer examining the repository should be able to understand, test, maintain, and extend the application without reconstructing its design from conversation history.

A player should never need to view advertisements to access educational functionality.

The application should encourage learning rather than excessive wagering or prolonged play.

Success is measured by the quality, correctness, usability, and educational value of the finished software, not by the amount of code generated.

---

## FINAL DIRECTIVE

Build **Blackjack Trainer** into a complete, polished, mathematically reliable blackjack simulator and educational platform.

This specification represents the intended finished product.

Begin by inspecting the current workspace.

Preserve existing working files and establish the project documentation.

Create an actionable implementation plan based on the defined development phases.

Then immediately begin implementing the first incomplete milestone.

Do not stop after producing a plan.

Do not stop after scaffolding the application.

Do not substitute static mockups for working functionality.

Prioritize the independent blackjack engine and its mathematical validation before introducing complex graphical presentation.

Build each subsequent feature on top of verified foundations.

Maintain accurate implementation progress documentation throughout development so the project can be resumed across coding sessions and context windows.

Resolve ordinary engineering decisions independently.

Document assumptions, limitations, failed validations, and genuine blockers.

Keep the project runnable throughout development.

Do not deploy the application, modify Trial & Elias, or activate production advertising without explicit approval.

The finished blackjack table must feel authentic.

Cards should deal naturally. Chips should resemble physical casino chips. Mixed denominations should remain recognizable when stacked. Animations should feel deliberate and responsive.

The desktop experience must be thoughtfully designed. The mobile experience must receive equal attention.

The educational systems should teach blackjack fundamentals, basic strategy, running count, and true count without forcing assistance on players.

The statistics should help players understand the quality of their decisions independently of wins, losses, and virtual chip balances.

The application must remain fair and transparent.

Do not sacrifice mathematical correctness for appearance.

Do not sacrifice maintainability for implementation speed.

Do not sacrifice mobile usability for desktop presentation.

Do not sacrifice educational integrity for monetization.

Build something that is genuinely worth using, maintaining, and sharing.

**Begin implementation now.**