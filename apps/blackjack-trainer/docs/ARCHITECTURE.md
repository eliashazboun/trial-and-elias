# Architecture

An independent event-driven TypeScript engine owns cards, rules, wallet and round transitions. It has no React, Phaser, Zustand or DOM dependency. Commands create a candidate immutable state, validate invariants, then a single IndexedDB readwrite transaction checks revision and writer ownership and commits it. Only after persistence succeeds does Zustand publish it. React and Phaser never change cards or balances from animation callbacks.

Physical cards retain shoe/deck/rank/suit IDs. Dealer hole-card projections contain null until reveal. Running count is driven by unique exposed identities, not all removed cards. Event snapshots provide chronological public projections for animation and read-only history; final private shoe order stays in the authoritative state for exact restoration.

React presents accessible controls and data views. Phaser generates reusable traditional card, card-back and dimensional chip textures. Dedicated desktop/portrait/short-landscape layouts calculate geometry from current available space. Parent-size observation supports the desktop strategy panel. Animations can be skipped without changing a command's outcome. Audio is generated locally and initialized after interaction.

IndexedDB schema v1 has state and ownership stores. A single snapshot avoids duplicated wallets or non-atomic per-store updates. It includes ledger, active shoe/round, sessions, bounded history, aggregates, decisions, counting checks, achievement progress and pending rules. This favors correctness and simple recovery over maximum large-history write performance. Preferences are a separate namespaced localStorage record; preference failures are reported and do not alter the wallet. Version upgrades must migrate existing data explicitly; no reset-on-error behavior is permitted.

A Web Lock coordinates one active document when supported. A database lease/heartbeat remains mandatory; CAS revision checking is independent of Web Locks. Crashed/unavailable-lock browsers may need up to eight seconds to reclaim ownership. This is local coordination, not anti-tamper security.

The repository registry assembles four entries into one dist artifact. The app's Vite base is /blackjack-trainer/, with no external assets or backend. Existing Worker configuration, domain and routes are unchanged.

The 2026-11-25 table uses shared pure layout geometry for Phaser cards and a stable React input/annotation overlay. Phaser has no betting hit zones or gameplay callbacks. Consecutive already-queued betting intents reduce in order into one persisted candidate; non-betting commands form barriers. Display stack normalization never rewrites placement history or ledger values. All real split children remain visible, including children awaiting their second card. See DECISIONS.md and UI_OVERHAUL_REPORT.md.
