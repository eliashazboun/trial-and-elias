# Hand totals, betting layout and settlement visuals

Implemented locally on 2026-11-25 inside the existing /blackjack-trainer/ app. The complete request is HAND_PRESENTATION_SPECIFICATION.md.

## Changes and causes

Player totals now appear directly beneath each actual fan, including Soft totals, natural 21 and BUST totals. Resolved hands show individual prominent green net winnings, red losses, amber PUSH or the actual blackjack net. Split/doubled hands keep independent labels and wager amounts.

The right-offset wager was caused by layout.wager.x using the container's right edge (x + width - 27). It now uses the midpoint of the actual fan's left/right bounds. Wagers sit toward the dealer above their cards, with totals below.

Side-bet placement state was correct: at Deal the engine moves it from pending bets into round.positions. Its stack component, however, only rendered before Deal, and the only remaining UI was aggregate result text. Each position/kind now reads its original round wager, keeps a labeled betting area and shows its own result. Side areas follow occupied seat groups, keeping short-landscape bets out of the dealer sidebar.

## Synchronization and integrity

Projection snapshots now include optional sideResults, with backward-compatible validation for older saves. The existing chronological presentation processes side events alongside cards and main settlements. Consequently a result appears when its own snapshot resolves, including side bets that finish before main hands.

A wager animation starts once when an existing unresolved wager gains a committed result. Losses travel to the visible dealer collection area; wins/pushes travel toward the player using stake plus authoritative net (or stake alone for a push). Net notifications exclude returned stakes. Stack totals retain exact half-chip values. Once finished, chips disappear. Already-resolved mounted or reloaded wagers start cleared and do not replay flights. Resize updates geometry without restarting the settlement effect. Instant/reduced-motion modes skip flights and reach the same final state.

No animation callback modifies money, draws cards, or invokes settlement. The existing engine still commits the entire result before presentation. Final outcomes get a 1.5-second reading interval; an explicit next-round request queues until that interval ends, then old notifications clear with the old round. Canceled/refunded hands are labeled REFUNDED rather than PUSH.

## Files for this update

- src/components/TableExperience.tsx: evaluated totals, per-hand results, position-specific side bets and shared geometry.
- src/components/WagerVisual.tsx (new): normalized stack component, net labels and one-shot visual flights.
- src/phaser/layout.ts: card bounds, centered wager/total/result anchors, dense layouts, dealer target and side areas.
- src/phaser/Table.ts: visible dealer collection marker.
- src/table-ui.css: total/result styling, layering, movement and reduced-motion support.
- src/store.ts: chronological side events and minimum result reading interval.
- src/engine/types.ts, src/engine/engine.ts: optional projected side results; no rule or financial changes.
- src/storage/validation.ts: backward-compatible snapshot field validation.
- tests/hand-presentation.test.ts and ../../tests/e2e/blackjack-hand-presentation.spec.ts: regression coverage.
- docs/SPECIFICATION.md, HAND_PRESENTATION_SPECIFICATION.md, DECISIONS.md, TESTING.md and DEVELOPMENT_PROGRESS.md: confirmed behavior and evidence.

## Verification

159 unit tests pass (76 Blackjack, 72 dungeon, seven NATO trainer and four homepage/configuration tests), including the existing mathematics and seeded 500-round simulation. Seven new unit cases cover actual net labels, centered fan geometry, below-card totals, ordered side projections and old-save compatibility.

Ten dedicated browser scenarios cover win/loss/push/blackjack and refresh, soft/hard/bust totals, split/doubled opposite results, independent side wins/losses across all seats, dealer-target loss motion, exact returned side-chip values, no repeated ledger effects, queued next-round readability, reduced motion, and twelve resolved hands plus six side bets. The complete site regression passed all 43 scenarios in approximately 2.3 minutes.

Screenshots reviewed include ordinary wins/blackjack, opposite split outcomes, active side results and dense settled layouts at 1440×900, 390×844, 360×800 and 844×390. Existing twelve-hand review also covers tablet and additional desktop sizes. Physical phones, Safari/Firefox and high-refresh hardware still require manual review. Supported side-bet rules have no push outcome; no new side-bet rule was introduced.

No dependency, remote push, deployment, Worker/domain/DNS change, real-money feature or unrelated app change was made.
