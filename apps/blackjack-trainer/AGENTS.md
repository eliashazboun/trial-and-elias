# Blackjack Trainer agent guidance

Read docs/SPECIFICATION.md, DEVELOPMENT_PROGRESS.md and docs/DECISIONS.md before extending this app. The user's subsequent instruction authorizes integration into Trial & Elias at /blackjack-trainer/; it supersedes the specification's standalone-only destination.

The independent TypeScript engine is authoritative. React/Zustand and Phaser render committed state; animations never draw cards, credit chips or make decisions. Currency is integer half-chip units. Never count hidden cards, change confirmed rules/paytables, rig shuffling, add real money, or activate advertising. Preserve original website, trainer and dungeon behavior. No push or production deployment without approval.

Keep desktop/portrait/landscape accessible. Preserve database compatibility and never overwrite unreadable data. Run typecheck, unit/mathematics tests, simulations, browser checks and production build for relevant changes. Record actual passing checks and remaining requirements in DEVELOPMENT_PROGRESS.md. Do not claim unfinished release gates are complete.
