# Gameplay overhaul report

Implemented locally on 2026-11-25 at /blackjack-trainer/ in Trial & Elias. The complete confirmed request is UI_OVERHAUL_SPECIFICATION.md; its amendments take precedence over older UI wording in SPECIFICATION.md.

## Result

The felt contains ordinary betting, chip selection, insurance, active-hand actions, counting and settlement controls. All twelve split hands remain visible with individual wagers/statuses. Floating actions follow the active hand. Strategy highlights wait three seconds after presentation and expose assistance only when actually displayed. Exposed card weights occupy their own layer; dealer-hole information remains hidden.

Rapid placement now uses stable DOM targets and an ordered transactional betting queue. Existing queued intents share a persistence write; each accepted placement keeps its original Undo history. Visual stacks normalize independently. Right-click and 500 ms touch hold remove the last placement for that spot. Seven denominations include orange 1,000 and pink 5,000. Initial main wagers allow 50,000 per position. Unaffordable chips are disabled. Rebet, Double Bet and atomic Rebet & Deal are available between rounds.

## Validation

- Strict TypeScript, Blackjack ESLint, production build and 138 unit tests pass (55 Blackjack, 72 dungeon, seven NATO trainer, four homepage/configuration).
- The final full Chromium/Worker browser regression passed all 28 scenarios in approximately 1.5 minutes.
- Unit coverage includes 500 seeded simulated rounds, unchanged mathematical cases, normalized half-chip totals, exact placement Undo/removal, limits, atomic betting transitions, legacy shortcuts and bounded twelve-hand geometry.
- Browser coverage includes rapid mixed placement across nine spots, pointer drag/cancel, real touch long-press, chip affordability, hint timing/exposure, independent and assisted count checks, persistence, split/double/insurance, backup/restore and existing site apps.
- Screenshot review includes twelve hands at 1920×1080, 1440×900, 1366×768, 768×1024, 390×844, 360×800 and 844×390. Large three-position wagers, ordinary hands, settlement and the anchored count popover also have captured evidence.

## Limits and handoff

Browser checks use local Chromium and Wrangler; physical phones and Safari/Firefox still require owner/device review. No push, upload, deployment, Worker/domain configuration change or real-money feature was performed. The existing dev server was reused and remains under the owner's control. Original game and unrelated app source were preserved.

Subsequent running-count guessing behavior follows COUNT_GUESSING_SPECIFICATION.md. Current progress and verification counts are in DEVELOPMENT_PROGRESS.md and TESTING.md.
