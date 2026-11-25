# Blackjack Trainer implementation report

Blackjack Trainer is implemented locally as another Trial & Elias application at /blackjack-trainer/. It has a Playground card, independent React/Phaser document, isolated styling, namespaced storage and a homepage return link. The same existing repository build assembles all four entries. No production push or deployment has occurred.

## Working systems

- Independent TypeScript engine: secure physical shoe, all five deck counts, configurable penetration, S17/peek, three positions, sequential splits/resplits up to twelve hands, split-ace restrictions, hit/stand/double, insurance/even money and exact main/side settlement.
- Exact half-chip wallet ledger, pending reservations, chip stacks, tap/drag, undo/clear/rebet/double, table limits, manually claimed hourly chips and duplicate reward protection.
- Responsive generated casino table, card deal/flip/split presentation, winning-side card outlines, restrained chip settlement, desktop strategy side panel, accessible React action equivalents, keyboard remaps, themes/backs, reduced motion and optional synthesized audio.
- Versioned strategy charts and available-action fallbacks, actual assistance exposure, independent decision accuracy, feedback modes, Hi-Lo and true count, manual/periodic checks, lessons and educational achievements/mastery.
- Transactional IndexedDB restoration with revision/ownership validation, Web Locks plus expiring lease fallback, protected error handling, bounded detail/history, aggregate statistics, sessions, history review, filters, counting trends, JSON backup/confirmed restore, CSV exports and scoped data resets.
- Provider-independent advertising lifecycle, disabled production provider and test-only mocks. No ad SDK or new analytics script is loaded.

## Run locally

From the repository root:

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:5175/blackjack-trainer/. The homepage is http://127.0.0.1:5175/. The trainer and dungeon retain their existing paths. Root npm run preview serves compiled output on port 4175; npm run dev:worker serves the local Cloudflare asset handler on 8787. The blackjack child server uses 5187. Local verification servers are stopped after handoff so a subsequent npm ci does not encounter locked binaries.

## Actual validation

- Strict TypeScript and Blackjack ESLint pass.
- 126 unit/logic tests pass: 43 Blackjack, 72 dungeon, seven NATO trainer and four homepage/config.
- Blackjack mathematics includes exhaustive Perfect Pairs combinations for every supported deck count; exhaustive 21+3 combinations for one/two decks against independent combinatorial formulas; payout, insurance, splitting, counting, twelve-hand, exhaustion, wallet and recovery fixtures.
- 500 seeded complete-round simulations pass over all five deck counts, varying positions, penetration, side wagers and legal randomized actions.
- 14 production Worker browser scenarios pass: eight Blackjack and six existing-site regressions. A targeted confirmation-feedback case was additionally rerun after extending its assertions.
- Maximum twelve-hand state was exercised at eleven desktop/portrait/landscape/tablet viewport sizes. Browser checks cover exact refresh/settlement recovery, concurrent tabs, backup export/rejected import/confirmed restore, chip drag/canceled drop, keyboard denomination selection, independent side-bet visibility, hint feedback and unavailable storage.
- Production build and local Wrangler dry run pass. Worker routing includes direct loads/refreshes, slash redirects with query strings and real missing-path 404s for Blackjack and the original entries.
- npm audit reports zero known vulnerabilities after patching Zod and the shared Vitest runner. Public-source audit passes. Runtime license notices ship with the artifact.
- Measured idle development table in headless Chromium/Windows at 1440×900: 119 frame intervals, mean 16.81 ms, p95 16.80 ms, about 59.5 FPS. This does not prove high-refresh or physical-phone performance.
- Clean-clone install/build verification is recorded in the final progress update after the local implementation commit.

## Local Git and production boundary

Local review branch: codex/blackjack-trainer. The existing origin remains https://github.com/eliashazboun/trial-and-elias.git. Local commits contain implementation and validation documentation. Nothing is pushed. The original standalone game folder is unchanged; the integrated copy only receives a development test-runner dependency patch in this update.

The existing Worker remains trial-and-elias1, with unchanged domain/DNS/routes and root Workers Builds commands npm run build and npx wrangler deploy. Review the original Worker's dashboard-managed logic/settings before any approved publication. This work neither connects Builds nor activates production advertising.

## Limits and release review

Read KNOWN_ISSUES.md for the full limits. Strategy follows researched total-dependent charts rather than a finite-deck EV solver. Physical devices, Safari/Firefox, native Linux/Cloudflare production, worst-case near-budget storage performance and high-refresh monitors were not verified. Filtered detail cannot reconstruct pruned history. Client storage and clocks are not anti-tamper security. An approved ad provider and its audience/consent requirements remain external prerequisites. Original generated assets avoid redistribution uncertainty; the owner has not selected a project-wide code license.

The local implementation is ready for review. Public release still awaits owner approval, existing Worker settings verification, audience/privacy review and a live-domain smoke test. Do not equate local tests with a production deployment.
