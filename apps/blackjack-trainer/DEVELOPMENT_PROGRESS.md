# Development progress

Current phase: Phase 10, local release validation and owner review. The authoritative complete brief is docs/SPECIFICATION.md. The owner's follow-up authorizes website integration now; it supersedes the original standalone destination.

## Implemented

- [x] Independent physical-card engine, secure shuffle, hand evaluation, S17/peek and confirmed main/insurance/even-money/split/double rules.
- [x] Three positions, twelve-hand capacity, exact half-chip ledger, side bets, wager controls and hourly claims.
- [x] Playable generated Phaser table, tap/drag, cards/backs/chips, responsive layouts, presentation and accessible React controls.
- [x] Strategy reference/fallbacks, Hi-Lo/true count, optional guidance, feedback, assistance snapshots, lessons/checks and training presets.
- [x] Atomic IndexedDB state/CAS, Web Locks/lease ownership, exact recovery, bounded history, backup/restore and data controls.
- [x] Gameplay/bankroll/educational statistics, sessions, filters, matrix/mistake review, trends, paginated history and CSVs.
- [x] Mastery thresholds, educational achievements, cosmetic back unlock, themes, audio, reduced motion and session awareness.
- [x] Disabled advertising adapter, test-only mock, legitimate reward receipts, idempotency and timeout recovery.
- [x] Trial & Elias registry/card/build integration, subdirectory routing, return navigation and preserved existing pages/apps.

## Validation and fixes

Strict typecheck, Blackjack lint and 126 total unit tests pass, including 43 Blackjack tests and 500 seeded simulated rounds. The full Worker browser suite has 14 passing scenarios. Eleven viewports were used for the twelve-hand state. Dependency and publishable-source audits pass. Production build and local-only Wrangler dry run pass. See docs/TESTING.md and docs/MATHEMATICAL_VALIDATION.md for scope and evidence.

Browser/visual review discovered and fixed reload lease contention, errors hidden behind modal accessibility, table clipping during desktop strategy-panel resizing, asynchronous checkbox assertion timing, educational feedback being cleared by persistence, and decision timing starting before presentation finished. No known failing check is being ignored.

## Final verification / remaining review

- [x] Clean Git clone of implementation commit e642599 installed with npm ci (375 packages), passed the unified build/typecheck and all 126 tests. No external source folders were needed.
- [ ] Owner reviews gameplay and confirms the existing Worker dashboard script/bindings/flags/domain/routes before approving publication.
- [ ] Physical phone/Safari/Firefox and high-refresh hardware review; near-budget storage and large-history stress profiling.
- [ ] First approved Cloudflare Linux build and actual-domain smoke check.
- [ ] Optional ad provider selection/account eligibility/consent verification, only if separately approved. Production ads remain disabled.

No remote push, Worker creation, DNS change or production deployment is performed. The application does not continue implementing itself after the session. Future work should start with any failed real-device/storage review, not by replacing the verified engine. Preserve the current schema and confirmed paytables.

Final validation: clean-clone install/build/test passed; final Blackjack presentation suite passed all eight scenarios; the whole site has 14 passing Worker browser scenarios. Dependency audit: zero known vulnerabilities. Final Wrangler dry run read 68 static files and exited without upload. Local dev/review processes were stopped for handoff.


## Gameplay overhaul — 2026-11-25

The confirmed overhaul in docs/UI_OVERHAUL_SPECIFICATION.md is implemented. Ordinary controls now live inside the table, all split hands remain visible, and dedicated annotation layers preserve exposed-card weights. Added delayed strategy hints, anchored count checks, seven chip denominations, 50,000 initial wagers per position, normalized visual stacks, placement-aware removal/Undo, atomic repeat wagering and stable ordered betting input.

Root-cause fixes: sprite recreation previously destabilized hit targets; stable DOM targets now share layout with the read-only Phaser scene. Rapid persistence backlog is avoided by batching already-queued ordered betting intents without delaying or debouncing clicks. Financial state still commits atomically through existing CAS/ownership checks. Legacy preferences/storage remain compatible.

Current verification: 138 unit tests pass, including 55 Blackjack tests and the seeded 500-round simulation. Strict typecheck, ESLint and production build pass. The final full Worker browser suite passed all 28 scenarios. Public-source audit, production dependency audit (zero known vulnerabilities) and the 68-asset local Wrangler dry run also pass; details are in docs/TESTING.md. Screenshots cover portrait, landscape, ordinary/maximum-hand states, large wagers, settlement and count checks. See docs/UI_OVERHAUL_REPORT.md for details and remaining physical-device review. No production operation was performed.


## Running-count guessing — 2026-11-25

Implemented the confirmed docs/COUNT_GUESSING_SPECIFICATION.md as an extension of the existing table instrument. Numeric guessing unlocks only after ten fully hidden completed rounds. Progress, current visibility, unique pending peek ID and latest feedback are stored with the game snapshot; engine validation enforces the gate. Guesses grade against the current shoe without revealing the indicator. Eligible reveal/hide sequences charge one ledger penalty capped at available balance. Partial resets clear progress but preserve armed peeks; full resets create a fresh table.

Existing running-count exercises share the gate. Exercise reveals/true-count help use the same visibility transition, and Skip no longer discloses the answer. Bankroll penalties remain separate from blackjack outcomes and session win/loss net, including exhausted rounds. Pending reservations are cleared atomically only if the reduced bankroll cannot fund them. No strategy table, counting weight, card draw or payout rule changed.

Validation: 152 unit tests pass, including 69 Blackjack tests (14 dedicated count-training cases) and the existing 500-round simulation. Strict typecheck, Blackjack ESLint and production build pass. All 33 Worker browser scenarios passed; desktop, portrait and short-landscape screenshots were reviewed. Browser evidence is recorded in docs/TESTING.md. Production deployment and remote push remain excluded.


## Hand totals and settlement visuals — 2026-11-25

Implemented docs/HAND_PRESENTATION_SPECIFICATION.md. Every hand now has an evaluated total beneath its card fan, an individually centered wager toward the dealer, and prominent net win/loss/PUSH/blackjack feedback. Side wagers render from original round.positions rather than disappearing with the pending betting UI. They resolve independently using optional backward-compatible projected side results.

Wager flights use real stake/net values, travel toward the visible dealer collection area or player, then clear. Existing settled snapshots mount cleared and reduced-motion/instant presentation skips flights. No animation callback changes money. Next-round commands queue through a 1.5-second minimum result reading interval. No rules, paytables, card draws or ledger calculations were changed.

Current checks: 159 unit tests pass, including 76 Blackjack tests and the existing 500-round simulation. Strict build/typecheck and lint pass. The complete browser suite passed all 43 scenarios; final results and physical-device limits are in docs/TESTING.md. docs/HAND_PRESENTATION_REPORT.md lists modified files, root causes, synchronization and screenshot review. No production operation was performed.

Final artifact check: unified build/typecheck passed, then all ten presentation browser scenarios passed again after the final seat-alignment adjustment. Local Wrangler dry run read 68 assets and exited without upload. Public-source audit and whitespace checks passed.
