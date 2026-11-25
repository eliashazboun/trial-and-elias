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

Current passing unit count: 126 total, including 43 Blackjack tests, 72 original dungeon tests, seven trainer tests and four homepage/config tests. Shared Vitest is patched to 4.1.12. TypeScript is strict. The original site header/hero/CSS preservation tests remain and the fourth Playground card is now expected.

Blackjack's property simulation plays 500 reproducible rounds (100 per deck count; seeds 1291, 1292, 1294, 1296, 1298). It varies one-to-three positions, legal randomized actions, penetration and side wagers. Invariants include physical card uniqueness/ownership, exposed-card count, ledger reconciliation, nonnegative balances, hand limits and completed/canceled ordinary rounds. Tests do not establish statistical long-run house edges.

Production browser coverage includes: full split/double round and exact ledger; refresh before decisions and after settlement; distinct storage from other games; ace insurance/half chips; twelve-hand layout; one-writer tab conflict and handoff; chart, lessons, skipped counting, cosmetics settings, JSON export, rejected malformed backup and confirmed restore; unavailable IndexedDB; canvas chip dragging/canceled drop; keyboard denomination selection and side-bet toggle refund. Existing homepage, complete trainer and compiled dungeon checks also pass.

Viewport emulation for the twelve-hand case: 1280×720, 1440×900, 1920×1080, 320×568, 360×800, 390×844, 430×932, 667×375, 844×390, 932×430 and 768×1024. The test preserves revision/state across resizing and checks no horizontal page overflow and usable Stand controls. Local screenshots were reviewed for betting, ordinary play, twelve hands and the desktop strategy panel. A side-panel clipping issue found during visual review is corrected using Phaser setParentSize and has a regression assertion.

Measured idle development table in headless Chromium on this Windows workstation at 1440×900: 119 requestAnimationFrame intervals, mean 16.81 ms, p95 16.80 ms, approximately 59.5 FPS. This is a real local sample, not a guarantee of 60 FPS on phones or proof of 120 Hz rendering. No physical phone, Safari/Firefox, native Linux build or live Cloudflare production run was available.

See DEVELOPMENT_PROGRESS.md and IMPLEMENTATION_REPORT.md for the latest final run and clean-install/dry-run status. Never claim unexecuted scenarios passed.
