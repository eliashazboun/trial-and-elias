# One Minute Dungeon — v1.1.0

A standalone dark-fantasy dungeon speedrunner using Phaser 3, strict TypeScript and Vite. One hit kills. The clock starts at 60 seconds; six optional diamonds refund spent time and improve your ranked result. No accounts, backend, remote assets or permanent gameplay upgrades.

## Start locally

Requires Node.js 20.19+ or 22.12+ and npm. Dependencies are already installed in this working copy.

```powershell
cd apps/one-minute-dungeon
npm install
npm run dev
```

Open the local URL printed by Vite, normally http://127.0.0.1:5175/one-minute-dungeon/. Leave the terminal running; Ctrl+C stops it. Refresh an already-open page after updating.

```text
npm run typecheck   Strict TypeScript validation
npm run test        Simulation, scoring, combat, replay, persistence and route tests
npm run build       Type-check and build dist/
npm run preview     Serve the production build locally
npm run test:e2e    Chromium browser checks
```

On another machine, install the test browser once with `npx playwright install chromium`.

## How to escape

There is one standard Play mode, using the original primary fixed seed `00C0FFEE`. There are no challenge, difficulty, random-run or category selectors. The authored ten-room crypt, corridors, switches, hazards, six diamond sites/seeded choices and enemy setup remain reproducible on every retry.

1. Collect the gold key.
2. Explicitly activate all three seals with E.
3. Slay every non-boss enemy to release the guardian's shield.
4. Defeat the guardian, release its seal, and physically cross the escape gate.

Diamonds are optional. You can defeat the guardian and escape without collecting any.

| Action               | Default            |
| -------------------- | ------------------ |
| Move                 | WASD               |
| Aim / sword attack   | Mouse / left click |
| Dash                 | Space              |
| Activate nearby seal | E                  |
| Instant retry        | R                  |
| Pause / resume       | Escape             |
| Toggle ghost         | G                  |
| Toggle splits        | Tab                |
| Performance overlay  | F3                 |

Gameplay keyboard and mouse bindings can be remapped in Settings; duplicate bindings are rejected. Audio, reduced visual effects and screen shake remain configurable.

## Diamonds, combos and time refunds

Exactly six diamonds appear. Each disappears when collected, can award time only once, and never respawns during the attempt. R restores all six and resets the combo.

The first diamond nominally refunds 1 second. Collect the next within five gameplay seconds of the PREVIOUS pickup for 2 seconds, then 3, 4, 5 and 6. A complete six-diamond chain can refund up to 21 seconds. Exactly five seconds qualifies; anything longer starts a new chain at 1 second. Refunds do not extend this window. Pausing freezes it.

The HUD distinguishes:

- **Actual elapsed:** active simulation time since the run began; never moves backward.
- **Applied refunds:** time actually restored by diamonds.
- **Ranked time:** actual elapsed minus applied refunds.
- **Remaining:** 60 seconds minus ranked time.

For example, after 10 actual seconds the clock has 50 seconds left. A 1-second refund changes that to 51 remaining and 9 ranked, while actual stays at 10.

Remaining time cannot exceed 60, and ranked time cannot fall below zero. Refunds restore only already-spent time; excess is discarded, never banked. If the first pickup happens after 0.69 seconds, it applies 0.69 seconds rather than a full second. The popup shows the applied amount accurately.

Runs can exceed 60 actual seconds. Six one-time diamonds bound the theoretical maximum duration at 81 seconds; a successful escape must occur before its effective deadline. The effective deadline is checked before pickups or escape on each tick: a diamond on an already-expired tick cannot save the attempt.

## Guardian protection

The guardian's purple circular shield and nearby text mean **SLAY ALL OTHER ENEMIES FIRST**. The HUD also shows the remaining non-boss enemy count.

A valid sword hit on the protected guardian instantly kills you, even during dash invulnerability. It does not damage the guardian. Missed swings, ordinary body contact, and attacks blocked by walls do not trigger this rule. The shield status is evaluated before resolving any enemy damage in a tick, so hitting the guardian and the final mob with the same swing is still fatal regardless of array order.

When the final non-boss enemy dies, the shield releases once, a sound plays, and **Guardian vulnerable** appears. The guardian then uses its original combat: it blocks frontal attacks outside recovery; strike its flank or the mint-colored recovery window. Diamonds, keys and seals never affect this protection requirement.

All original movement, collision, enemies, temporary weapons, timed traps and shortcuts remain. Dash lasts 17 ticks (about 141.7 ms); invulnerability covers dash ages 4 through 12 inclusive. Walls stop it. A precisely positioned dash can clear the narrow pit; landing inside kills you. Attack the cracked masonry and concealed library obstruction to open the two fixed shortcuts.

## Records, results and progression

Lowest ranked completion time wins. Actual elapsed time breaks ranked ties; if both times tie, the existing PB is retained. Results, history and statistics label actual time, applied refunds and ranked time, along with diamonds out of six and highest combo.

Pausing, hiding the page, losing window focus, or a significant simulation stall makes an attempt practice. Practice can finish but cannot replace a competitive PB. Settings opened mid-run go through pause. R always begins a fresh run immediately.

Achievements and cosmetic rewards remain. The old challenge-dependent Jade trail reward now belongs to **Diamond Free**, earned by escaping without diamonds. Existing earned rewards are grandfathered and preserved. There are no permanent mechanical upgrades.

## Determinism, splits, ghosts and replays

The authoritative simulation runs at 120 Hz using integer time/refund/combo ticks. Positions and directions are quantized to 1/65536; angles to 1/4096 radians. Phaser interpolates presentation without writing simulation state. The accumulator bounds catch-up and invalidates competition after a gap over 150 ms or an overflow.

New compatibility identifiers:

- Game: `1.1.0`
- Map: `crypt-1` (unchanged geometry)
- Rules: `diamond-refund-shield-2`
- Replay format: `2`
- Storage schema: `2`

A PB replay contains changed tick-indexed inputs, 120-tick hashes, scoring summaries, splits and the final hash. Bounds now support 9720 actual ticks and up to 81 checkpoints. Playback verifies diamond refunds, combos, protection, death and final scoring before opening. Incompatible recordings are rejected clearly. Viewer controls retain pause, restart and 0.5x/1x/2x/4x playback. Playback never commits attempts, records or achievements.

Ghost movement is indexed by ACTUAL simulation ticks. A refund changes scoring without rewinding or jumping the ghost. Split snapshots include actual ticks, refunds, ranked ticks and diamond progress. Pace comparisons require matching objective order plus diamond collection order, combo rewards and applied refunds. Otherwise the HUD says route differs. Comparable segment statistics use actual durations and matching preceding conditions.

## Local data, migration and offline use

Only localStorage is used, under the existing key `one-minute-dungeon:v1`. Original schema-1 saves are read into schema 2 without erasing settings, earned cosmetics, achievements, old PBs, valid replay data or retained history. The unchanged key allows in-place migration on the next save.

Old records remain archived by their original compatibility identifiers. They do not compete with new scores or appear as current PB replays. Current statistics use the new ruleset's totals; archived information remains in JSON export. History is still capped at 100 summaries independently of PB retention. The reset option still requires confirmation.

Malformed saved entries are discarded safely. Unsupported future schemas fall back safely. Storage denial or quota errors keep the game playable and show a warning; replay payloads may be dropped to preserve core records. Export is available in Statistics; there is no backup-import interface.

After its assets load, the game needs no network: art and audio are generated locally. A fresh offline launch still requires a local server or an already-loaded page. There is no service worker.

## Implementation and validation

- `Simulation.ts`: movement, melee, enemy FSMs, shield preflight, objectives and pickups.
- `TimerSystem.ts`: ranked/remaining time, rolling combos, applied refunds and diamond progress signatures.
- `RunManager.ts`: result snapshots, compatibility filtering and split comparability.
- `ReplaySystem.ts`: tick inputs, checkpoint validation and passive ghost samples.
- `StorageManager.ts`: schema migration, bounds, PB ordering, statistics, archive retention and storage failures.
- `DungeonRenderer.ts` / `UI.ts`: shield warnings, refund popups, one-mode menus and labeled timing displays.

Tuning and version identifiers are centralized in `src/game/config.ts`. Maximum refund and actual-duration bounds derive from the six diamonds and 120 Hz tick rate. Bump rules/replay compatibility when mechanics change.

Automated checks include exact five-second boundaries, cap overflow, one-time pickups, extended deadlines, instant shield deaths including dash invulnerability, same-tick enemy-order independence, normal post-shield boss combat, score ordering/ties, legacy migration, storage failures and real-input full routes.

The test-only route pilot does not teleport, remove enemies or grant invulnerability. It verifies a diamond-free escape, profitable diamond detours, a six-diamond route, a protected-boss death, and a successful run lasting about **64.21 actual seconds with 57.21 ranked seconds**. The extended winning replay is checked under 60/120/144 Hz render schedules. Chromium tests check live controls, pickups, pause/retry, remapping, high-DPI aiming, offline play, shield warnings, Node-to-Chromium replay hashes, ghosts and an isolated verified-results presentation fixture.

Generated screenshots are in `test-results/` after browser tests. Art remains locally generated pixel art with compact two-frame character animation. Extended human balancing, independent Firefox/Safari checks and physical high-refresh-display testing remain outside the verified scope. Quantized Node/Chromium replay agreement is tested; universal cross-engine bitwise equivalence is not claimed. Local records are editable by the browser owner. Vite's large-bundle warning comes from bundling Phaser locally.

## Animated appearance previews

Open **Cosmetics** from the menu to see all fourteen original appearance choices with previews beside their names. Skins use the game's original two sprite frames; swords loop a swing and rest; dash samples move and fade; ghosts use the actual tint and 0.35 opacity; profile titles stay readable beneath an idling knight. Dash demonstrations play more slowly for readability and fade out before resetting. Locked rewards remain fully visible with their original unlock requirements; only available options can be equipped.

These are silent, presentation-only Canvas 2D previews. The shared `SpriteArt.ts` pixel generator feeds both Phaser textures and cached preview frames, while `CosmeticStyle.ts` supplies the actual sword, trail and ghost colors. No extra Phaser games, simulation instances, gameplay randomness or replay data are used. Viewing previews does not write localStorage. Explicit equipping uses the existing settings persistence and restores keyboard focus to the selected option. Gameplay, competitive versions and saved PB compatibility are unchanged.

One `PreviewLoop` schedules all cards. It stops when the appearance page closes, suspends while the tab is hidden, and resumes without catching up hidden time. `CosmeticPreviews` disconnects its resize observer and visibility/motion/resize listeners and releases cached canvases on disposal. Reduced visual effects or `prefers-reduced-motion: reduce` display useful stills, including a visible trail and sword pose, without an animation loop. Pixel buffers track device pixel ratio with nearest-neighbor sprite sampling; titles use readable DOM text.

Coverage includes scheduler cancellation/visibility/reopening, shared colors and pixel geometry, all unlocks and original options, keyboard equipping and reload persistence, save/simulation isolation, reduced-effects and browser-emulated reduced motion, simulated visibility events, and a 390-pixel layout at 2x device pixel ratio. Browser screenshots are in `test-results/appearance-*.png`. Chromium is verified; independent Firefox/Safari and physical OS display-preference checks remain unverified.
