# Blackjack Trainer

Blackjack, basic-strategy practice and Hi-Lo counting inside Trial & Elias. Only virtual chips are used; they have no cash value. No account, purchases, remote wallet or gameplay-data upload is included. The full product specification is preserved in docs/SPECIFICATION.md. The owner's later instruction makes this an integrated website app, superseding the original standalone-only destination.

## Run and verify

From the Trial & Elias repository root:

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:5175/blackjack-trainer/. The homepage links to it from The Playground. The independent child dev server uses port 5187; the normal root command supplies parent-site navigation and the shared origin.

```sh
npm run typecheck
npm run lint --workspace blackjack-trainer
npm run test
npm run test:math --workspace blackjack-trainer
npm run simulate --workspace blackjack-trainer
npm run build
npm run test:e2e
npm run preview
npm run deploy:dry-run
```

The root build automatically places this application at dist/blackjack-trainer alongside the homepage, trainer and dungeon. Preview uses port 4175; local Worker testing uses 8787. A build does not deploy. Production remains the existing trial-and-elias1 Worker and requires owner approval. No new repository, Worker, backend or Pages app is created.

## System boundaries

- engine/: independent physical-card model, secure shuffle, hand evaluation, exact half-chip ledger, wager controls, round transitions, dealer play and settlement. No DOM, React or Phaser dependencies.
- training/: versioned S17/DAS strategy data, legal/affordable alternatives and configurable mastery thresholds.
- storage/: validated IndexedDB snapshot/CAS transaction, single-writer lease, namespaced preferences, bounded backups and formula-safe CSV export.
- store.ts: commands pass through validation, authoritative reduction, atomic persistence and then presentation. Busy/revision checks reject duplicate or stale UI commands.
- phaser/: original generated cards/chips/felt, resize-aware layouts, non-authoritative animations and synthesized audio.
- components/: accessible React game controls, Radix/shadcn-style UI, learning, wallet, statistics, history, settings and data management.
- advertising/: disabled production provider, provider-independent lifecycle and isolated test-only mock. Legitimate reward receipts are persisted idempotently.

## Confirmed rules and economy

Six decks and 75% penetration by default; 1, 2, 4, 6 or 8 decks and 50–90% penetration are selectable. American hole card/peek, S17, 3:2 naturals, double any eligible first two cards, DAS, no surrender, equal-value splitting including mixed tens, maximum four hands per position and three positions. Split aces receive one card, may resplit, and cannot hit or double normally. First split child plays before the next child receives its replacement. Split 21 pays ordinary 1:1.

Insurance is offered independently against an ace, at exactly half the original wager, paying 2:1 net. Natural blackjacks may take 1:1 even money instead. The dealer reveals the hole card each dealt round, including all-bust rounds, and draws only if an ordinary unresolved player hand needs comparison.

Perfect Pairs: 25:1 perfect, 12:1 colored, 6:1 mixed. 21+3: 100:1 suited trips, 40:1 straight flush, 30:1 trips, 10:1 straight, 5:1 flush. Highest category only; A–2–3 and Q–K–A qualify, K–A–2 does not. Original player cards and dealer upcard only. Perfect pairs are impossible in one deck; suited trips require at least three.

New players receive 1,000 chips once. Main bets 10–1,000 and side bets 1–100 whole chips. Denominations: 1 white, 5 red, 25 green, 100 black, 500 purple. Pending selections reserve funds without debiting; Deal commits atomically. Main wager minimum must be met before side chips can be placed. Undo, Clear, Rebet and Double Bet work between rounds. Mixed chip sequences are preserved; visual stacks cap at nine with overflow counts. Legal split/double exposure may exceed initial limits.

All amounts are integer half-chip units: 1 chip = 2 units. Returned stakes and profit have distinct ledger categories. A manual +1,000-chip hourly claim starts a new 60-minute cooldown; missed hours do not accumulate. The initial grant begins the first cooldown. Backward clocks cannot create an early claim. Device clocks and local data are not tamper-proof. Production ads stay unavailable without an approved provider; valid rewarded completions would grant 500 chips once per receipt/request.

## Shoes, persistence and recovery

Every physical card is unique and dealt without replacement. Production uses crypto.getRandomValues with rejection sampling and Fisher–Yates; seeded sources exist only in tests. A cut-card crossing schedules a shuffle between rounds. Shoes with fewer than max(20, 8 × active positions + 2) remaining cards shuffle before Deal. Exceptional exhaustion refunds main stakes, keeps already resolved side/insurance results, records cancellation, excludes canceled main hands from win/loss counts and schedules a fresh shoe.

Database: trial-and-elias:blackjack:v1. Preferences: trial-and-elias:blackjack:preferences:v1. These do not collide with the existing applications. Version 1 stores one validated authoritative snapshot plus an ownership record, rather than duplicating wallet/round copies across stores. An atomic transaction checks lease ownership and expected revision before replacing the snapshot. A failed write leaves the UI on the last committed state.

Web Locks coordinates immediate reload and tab ownership when supported. An IndexedDB lease/heartbeat is the fallback; after a crash or on unsupported browsers, recovery may wait up to eight seconds. Multiple tabs cannot ordinarily spend the same snapshot because database CAS and lease checks remain in force. Browser-local state cannot resist deliberate devtools manipulation.

Exact shoe order, draw position, hidden cards, active hands, wagers, transactions and educational context are saved after accepted commands. Animations are presentation only and can be skipped after reload or backgrounding. Hidden cards are excluded from running counts and public projections until reveal; technically knowledgeable users can inspect client storage.

Detailed rounds are bounded by retention (100–5,000) and a 25 MB soft detail budget. Lifetime aggregates, achievements, active state and wallet reconciliation survive pruning. The ledger retains 20,000 recent entries plus a reconciled opening baseline. Filters explicitly identify retained detail; they cannot reconstruct pruned round events. JSON backups are schema-validated and capped at 30 MB, previewed and confirmed before transactional replacement. Restore does not merge rewards. CSV is quoted and protects spreadsheet formula prefixes; fields ending HalfChips use internal integer units, while netChips is displayed chip value.

## Training, controls and privacy

Default strategy assistance is off and feedback is silent. Beginner/intermediate/advanced presets are customizable. Running count, true count, card weights and exact shoe information have independent toggles. True count = exposed-card running count / (undealt cards / 52), displayed to one decimal; hidden removed cards reduce remaining quantity but never contribute their value. Decimal checks accept ±0.1; skipped/revealed exercises are not incorrect submissions. Tutorial demonstrations never change the live shoe or wallet.

Decision snapshots retain ideal and available action, rules/table version, cards/upcard, first selection, chosen action, timing, constraints and actual hint/chart/warning exposure. Turning hints off after seeing them does not make that decision independent. Correctness is recorded before the next card, separately from wins/losses. Automatic stands are not graded as decisions. Educational achievements use independent sample thresholds and do not reward wagering or time spent.

Keyboard defaults: H hit, S stand, D double, P split, Enter deal, U undo, C clear, R rebet, B double bet, G strategy, W wallet, Escape settings, 1–5 chip selection. Settings allow nonconflicting remaps. Shortcuts ignore repeats/modifiers/form input and inappropriate modal contexts. Mouse/touch betting has equivalent accessible DOM buttons. Strategy is a responsive desktop side panel or mobile modal; focused dialogs, visible focus, readable card text and reduced motion are included. Optional music, ambience and effects have independent controls; audio starts only after interaction and pauses when hidden.

Local data can be deleted or exported in Settings → Data. No new analytics/ad script is loaded. The existing site's dashboard-managed analytics and adult-audience requirements must be reviewed before public release. See docs/KNOWN_ISSUES.md, docs/TESTING.md, docs/MATHEMATICAL_VALIDATION.md and DEVELOPMENT_PROGRESS.md for actual validation and remaining release checks.
