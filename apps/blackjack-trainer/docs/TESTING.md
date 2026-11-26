# Testing and review

Commands from the repository root:

```sh
npm run typecheck
npm run lint --workspace blackjack-trainer
npm run test
npm run test:math --workspace blackjack-trainer
npm run simulate --workspace blackjack-trainer
npm run build
npx playwright test
npm audit
npm run audit:public
npm run deploy:dry-run
```

The app workspace also has build/preview/test:e2e commands; build the root artifact before its Worker browser command. Playwright runs Chromium against the actual local Wrangler static-assets handler, not just Vite.

Original-release unit count: 126 total, including 43 Blackjack tests, 72 original dungeon tests, seven trainer tests and four homepage/config tests. Shared Vitest is patched to 4.1.12. TypeScript is strict. The original site header/hero/CSS preservation tests remain and the fourth Playground card is now expected.

Blackjack's property simulation plays 500 reproducible rounds (100 per deck count; seeds 1291, 1292, 1294, 1296, 1298). It varies one-to-three positions, legal randomized actions, penetration and side wagers. Invariants include physical card uniqueness/ownership, exposed-card count, ledger reconciliation, nonnegative balances, hand limits and completed/canceled ordinary rounds. Tests do not establish statistical long-run house edges.

Production browser coverage includes: full split/double round and exact ledger; refresh before decisions and after settlement; distinct storage from other games; ace insurance/half chips; twelve-hand layout; one-writer tab conflict and handoff; chart, lessons, skipped counting, cosmetics settings, JSON export, rejected malformed backup and confirmed restore; unavailable IndexedDB; canvas chip dragging/canceled drop; keyboard denomination selection and side-bet toggle refund. Existing homepage, complete trainer and compiled dungeon checks also pass.

Viewport emulation for the twelve-hand case: 1280×720, 1440×900, 1920×1080, 320×568, 360×800, 390×844, 430×932, 667×375, 844×390, 932×430 and 768×1024. The test preserves revision/state across resizing and checks no horizontal page overflow and usable Stand controls. Local screenshots were reviewed for betting, ordinary play, twelve hands and the desktop strategy panel. A side-panel clipping issue found during visual review is corrected using Phaser setParentSize and has a regression assertion.

Measured idle development table in headless Chromium on this Windows workstation at 1440×900: 119 requestAnimationFrame intervals, mean 16.81 ms, p95 16.80 ms, approximately 59.5 FPS. This is a real local sample, not a guarantee of 60 FPS on phones or proof of 120 Hz rendering. No physical phone, Safari/Firefox, native Linux build or live Cloudflare production run was available.

See DEVELOPMENT_PROGRESS.md and IMPLEMENTATION_REPORT.md for the latest final run and clean-install/dry-run status. Never claim unexecuted scenarios passed.

Final clean checkout: local implementation commit e642599 was cloned into an isolated temporary directory. npm ci installed 375 packages; unified strict build and all 126 tests passed. The final complete Worker suite has 14 passing scenarios; the eight Blackjack scenarios were rerun after final visual changes and passed. Local dry run read 68 assets and performed no upload. Source and npm audits passed.


## Gameplay overhaul validation — 2026-11-25

Current unit count is 138: 55 Blackjack, 72 dungeon, seven NATO trainer and four homepage/configuration tests. Strict TypeScript, Blackjack ESLint, unified production build, the 500-round simulation and public-source audit pass. Local Wrangler dry run reads 68 assets and exits without upload.

The final Chromium/Worker suite passed all 28 scenarios in approximately 1.5 minutes. New regressions cover rapid alternating placements across all nine spots; all seven denominations and pending-reservation affordability; pointer dragging/cancellation; native touch long-press removal with Undo; normalized stacks and exact totals; first-round and post-settlement Double Bet; Rebet & Deal; 2999/3000 ms hint boundaries; a fresh timer after Hit; timing after normal-speed presentation; independent decisions before hints; canceled hints; unavailable-action fallbacks; zero/negative count answers and visibility masking; and independent versus assisted count submissions.

The maximum-hand regression keeps all twelve real hands visible and checks every enabled table control and exposed-card badge remains inside the table, without badge overlap or horizontal page overflow. Overhaul screenshot sizes are 1920×1080, 1440×900, 1366×768, 768×1024, 390×844, 360×800 and 844×390. Additional screenshots cover three simultaneous 50,000-chip wagers, ordinary play, settlement and the anchored count popover. Existing refresh, insurance, split/double ledger, tab ownership, backups, lessons and unrelated site flows remain covered.

Earlier clean-clone and performance measurements above belong to the original release; a new clean-clone install and physical-device benchmark were not repeated for this UI-only overhaul. Physical-phone, Safari/Firefox and high-refresh review remain open. No production deployment or remote push was made.


## Running-count guessing validation — 2026-11-25

152 unit tests pass: 69 Blackjack, 72 dungeon, seven NATO trainer and four homepage/configuration tests. Fourteen new engine cases cover nine/ten completed rounds, current integer grading, visible/invalid rejection, early free toggles, a persisted armed peek, idempotent repeated toggles, another ten-round streak, zero/half-chip/low balances, reservation cleanup/Undo, multiple positions/splits, mid-round and canceled-round accounting, legacy save migration, partial/full reset behavior, and direct existing-exercise gating/reveals. Existing mathematics and 500 simulated rounds remain passing.

The full Worker browser suite passed all 33 scenarios in approximately 1.8 minutes. Five dedicated flows cover 9-to-10 unlock through actual UI play; empty/fractional rejection and correct/incorrect feedback; eye masking without answer-derived input metadata; saved reveal/hide recovery with exactly one charge; ordinary free toggles; Settings visibility; low balance/full reset; and compact layout at 1440×900, 390×844, 360×800 and 844×390. Existing running-count tests now verify the new gate. Existing Skip checks assert that skipping never shows the answer. No physical-device, Safari or Firefox run is claimed.


## Hand totals / settlement presentation — 2026-11-25

159 unit tests pass: 76 Blackjack, 72 dungeon, seven NATO trainer and four homepage/configuration. Seven added unit cases check actual net formatting, unchanged full-stake returns versus profit display, all-hand fan centers and below-card totals, long fans, ordered side-settlement snapshots and legacy projection validation. Strict build/typecheck and Blackjack ESLint pass.

The full Worker suite passed all 43 scenarios in approximately 2.3 minutes. Ten new cases exercise win/loss/push/3:2 blackjack, persisted settled reload without flights or ledger duplication, soft/hard/bust totals through Hit, split-hand independent wins/losses with Double, all six side wagers and early side settlement, winning stack values from actual returns, dealer-target loss motion, result reading interval with queued Rebet & Deal, reduced-motion equivalence, and twelve settled hands plus six side bets across desktop/portrait/landscape. The maximum-density regression checks every total/result/side area is in bounds and no result/total boxes intersect.

Screenshot review covers 1440×900, 390×844, 360×800 and 844×390 for dense settled play; existing twelve-hand tests cover additional desktop/tablet dimensions. A narrow-portrait overlap and short-landscape dealer-sidebar overlap found during QA were corrected. Physical-phone/Safari/Firefox/high-refresh review remains open.

Final artifact check: unified build/typecheck passed, then all ten presentation browser scenarios passed again after the final seat-alignment adjustment. Local Wrangler dry run read 68 assets and exited without upload. Public-source audit and whitespace checks passed.
