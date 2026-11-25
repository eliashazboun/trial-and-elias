# Mathematics validation

Primary reference charts inspected on 2026-11-24:

- https://wizardofodds.com/games/blackjack/strategy/1-deck/
- https://wizardofodds.com/games/blackjack/strategy/2-decks/
- https://wizardofodds.com/games/blackjack/strategy/4-decks/

The app draws its own chart from versioned action data; no reference artwork is distributed. Rules are S17, American peek, DAS and no surrender. Reference surrender cells use their documented hit/stand fallback. The single-deck pair-of-sevens stand exceptions are preserved. Ideal recommendations and legal/affordable alternatives are distinct; unavailable soft-18 doubles fall back to stand, not hit. Split-cap fallback uses the hand's ordinary total, respecting restricted split aces.

This is conventional total-dependent basic strategy. It is not a depleted-shoe composition-dependent solver or a promise that every unusual composition has the same EV. The double-deck reference notes soft 18 versus ace: the app hits a two-card hand and stands on multi-card soft 18. Counts and future cards are not strategy inputs.

Tests cover deck/card multiset integrity, multi-ace hand evaluation, S17, 3:2 naturals and odd wagers, split 21, bust priorities, insurance/even money, sequential split/double behavior, twelve-hand capacity, pending rules, hourly rewards, exact ledger reconciliation, hidden-card exclusion, exhaustion refunds and seeded complete rounds.

Perfect Pairs is exhaustively enumerated for every supported deck count. With d decks, independent category counts are:

- Perfect: 52 × C(d,2).
- Colored: 26 × d².
- Mixed: 52 × d².
- Nonqualifying: C(52d,2) minus those three mutually exclusive categories.

21+3 is exhaustively enumerated for one and two decks and compared against independent combination formulas. With d decks:

- Suited trips: 52 × C(d,3).
- Straight flush: 48 × d³ (twelve rank sequences, four suits).
- Other trips: 13 × C(4d,3) minus suited trips.
- Other straights: 12 × (4d)³ minus straight flushes.
- Other flushes: 4 × C(13d,3) minus suited trips and straight flushes.
- Losses: C(52d,3) minus the five qualifying categories.

A–2–3 and Q–K–A count; K–A–2 does not. Exact exhaustive category checks, not plausible average profits, are the primary side-bet validation. The deterministic simulation is a secondary engine-invariant check, not a house-edge estimate or proof of all strategies.

All monetary calculations use integer half-chip units. A 25-chip wager is 50 units; natural profit is 75 units and total return 125 units. Maximum insurance is 25 units. Main wins, returned stakes and side/insurance profit use separate ledger transactions and unique keys.

Known validation limits: no independent finite-deck EV solver, no exhaustive enumeration of all possible round trees, no statistical house-edge certification, and no live-money suitability claim. Further high-volume simulations and external mathematics review are useful before marketing the trainer as certified.
