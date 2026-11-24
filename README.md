# Trial & Elias

The existing Trial & Elias homepage, the supplied NATO Phonetic Alphabet Trainer, and the existing One Minute Dungeon game in one self-contained npm workspace repository. Production targets the existing Cloudflare Worker **trial-and-elias1**, using Workers Static Assets and native Workers Builds. No production upload or GitHub push has been performed during preparation.

See [the final implementation report](INTEGRATION_REPORT.md) for actual validation results, Git status and the remaining production approval checks.

## Start locally

Use Node.js 24 and npm 11.8.0 (Node 22.12+ meets the packages' minimum requirements). Version files select Node 24; packageManager pins npm. From a fresh checkout:

```sh
git clone https://github.com/eliashazboun/trial-and-elias.git
cd trial-and-elias
npm ci
npm run dev
```

The GitHub clone command becomes useful after the owner approves publishing the prepared local commits; the remote was empty when inspected. In the current local repository, run npm install or npm ci followed by npm run dev.

Development URLs:

| Route        | URL                                                   |
| ------------ | ----------------------------------------------------- |
| Homepage     | http://127.0.0.1:5175/                                |
| NATO trainer | http://127.0.0.1:5175/nato-phonetic-alphabet-trainer/ |
| Dungeon      | http://127.0.0.1:5175/one-minute-dungeon/             |

The root Vite server proxies the two independent development applications on ports 5185 and 5186. HMR uses those application servers. Ctrl+C closes the development servers. The ports avoid the original standalone game's usual ports. A production build has no dependency on these development processes.

## Commands

| Command                | Purpose                                                                                       |
| ---------------------- | --------------------------------------------------------------------------------------------- |
| npm install / npm ci   | Install all workspace dependencies from the root                                              |
| npm run dev            | Start all three applications behind one development origin                                    |
| npm run typecheck      | Strict TypeScript checks for the homepage, trainer, game and test source                      |
| npm run test           | Homepage preservation tests, trainer logic/history tests and all original game tests          |
| npm run build          | Build and assemble every entry point into one dist directory; never deploys                   |
| npm run preview        | Serve the complete compiled artifact on http://127.0.0.1:4175/                                |
| npm run dev:worker     | Build, then run the actual local Worker on http://127.0.0.1:8787/                             |
| npm run worker:serve   | Serve an already-built verified artifact in the local Worker                                  |
| npm run test:e2e       | Build and test all three production routes through the local Worker                           |
| npm run test:e2e:game  | Run the integrated game's complete original browser suite                                     |
| npm run audit:public   | Scan publishable source for credentials, private environment files and machine-specific paths |
| npm run deploy:dry-run | Build and validate Wrangler locally without uploading                                         |
| npm run deploy         | Build and deploy to trial-and-elias1 — owner approval required                                |

Before browser tests on a new machine, run `npx playwright install chromium` (or `npx playwright install --with-deps chromium` on a Linux test runner). A native Linux build has not been executed on this Windows workstation; scripts use Node APIs, portable paths and case-consistent imports rather than Windows-only copy commands.

## Architecture

```text
trial-and-elias/
├── index.html                       Original homepage structure and copy
├── src/home/                        Exact recovered stylesheet, year and card registry
├── apps/
│   ├── nato-trainer/                Supplied React/TypeScript app; isolated Tailwind
│   └── one-minute-dungeon/          Copied Phaser app, source, assets and original tests
├── public/404.html                  Real custom not-found response
├── public/licenses/                Bundled library license notices
├── project-manifest.mjs             Application build/development registry
├── scripts/                        Portable build, verification, preview and audit helpers
├── tests/                          Homepage and compiled Worker integration checks
├── docs/                           Preservation evidence and deployment instructions
├── package.json / package-lock.json One root installation and reproducible dependency graph
└── wrangler.jsonc                   Existing Worker name; dist static assets
```

Each application has its own HTML entry, CSS and Vite configuration. The Phaser game stays independent of React. Tailwind is compiled only into the trainer's document, so its reset and utility classes do not reach the homepage or game. Applications navigate between documents, not through a shared SPA router.

The root build first builds the existing homepage, then both workspaces, then copies their generated output into dist/nato-phonetic-alphabet-trainer and dist/one-minute-dungeon. It verifies every entry and referenced script/stylesheet. No external local game directory is required after this copy. Build output, dependency folders and caches are ignored by Git.

## What was preserved

The original local website folder and remote repository were empty. Complete public HTML and inline CSS were recovered from https://trialandelias.com/. The original header, hero and base stylesheet were retained; preservation hashes are recorded in docs/preservation.json. Header and hero screenshots were compared locally against the live baseline. Only the required third Playground card, a wide-screen three-column grid rule and nonvisual metadata/module setup were added. The existing intermediate two-column and mobile one-column design remain. About text, logo colors, navigation, footer wording and dynamic year remain.

Baseline source/screenshots are available in the ignored .preservation folder on this workstation. They are not needed to build a clean checkout. Tests always verify the original content/style hashes; screenshot byte comparisons run when the local baseline images exist.

Cloudflare's analytics beacon appeared in browser-rendered production HTML but not in the origin HTML fetched directly. It is therefore left dashboard-managed: no version-specific injected beacon was copied into application source and no duplicate analytics script was added. No favicon was served by the original site, and no replacement icon was invented.

The trainer is the supplied TestingGrounds component, adapted to Vite rather than rewritten. All 26 words, all distractors, randomized question/choice behavior, keyboard/mouse/touch controls, 600 ms feedback, performance.now timing, score/history/results UI and result structure remain. The branding now says Trial & Elias, and a small homepage return link was added. Duplicate completion is guarded, timer/listener cleanup remains, and loaded records are validated. Invalid JSON is not overwritten. Invalid array entries remain in stored data while valid history is shown. Storage failures keep current attempts in memory and show an accurate warning. IDs retain the supplied Date.now/Math.random method, so insecure HTTP does not require crypto.randomUUID.

The game's original source directory was not modified. Its integrated copy keeps the original map, combat, dash, 120 Hz simulation, diamond refunds, guardian protection, single standard mode, compatible records/replays, audio and animated cosmetic previews. Earlier plans mentioned randomized/challenge selectors, but the current game intentionally has only its existing standard Play mode; this integration does not restore removed modes. Integration changes are limited to URL/build configuration, page metadata, test base paths and a homepage link inside the main menu. No persistent navigation overlaps active gameplay.

## Persistence

- Trainer: `nato-phonetic-trainer-results`, with the original Answer and QuizResult object structures.
- Game: `one-minute-dungeon:v1`, preserving its current schema and replay compatibility.

The keys do not collide on the shared website origin. Existing history on the same production origin remains readable. Data on localhost, another port, HTTP instead of HTTPS, or another domain does not automatically migrate to trialandelias.com. The game's existing JSON export remains; it has no import interface. Do not promise automatic cross-origin migration.

## Cloudflare configuration and approval boundary

The verified local configuration targets trial-and-elias1, compatibility date 2026-11-24, assets.directory ./dist, not_found_handling 404-page, and html_handling auto-trailing-slash. No custom domain, DNS route, account ID, binding, API or extra Worker resource is invented. Known application directories redirect to their trailing-slash URLs; unknown paths receive the real 404 page instead of another application's index.

The local folder did not contain the manually deployed Worker's script or dashboard settings. The public homepage is static, so this is a suitable static-assets candidate, but it is NOT proof that the existing Worker has no hidden routing, bindings, variables or other logic. Before production, the owner must inspect/export that configuration and merge any required settings into Wrangler. Do not replace existing Worker behavior blindly. No account authentication or remote configuration changes were made.

See [Cloudflare setup and approval](docs/CLOUDFLARE_SETUP.md) for exact native Git settings and [rollback](docs/ROLLBACK.md) for recovery. Native Git deployment remains unconnected by this local work. A push to production main can deploy once the owner connects Builds, so publishing main is treated as a deployment action requiring approval.

## Add another project

1. Put its independent client source in apps/new-project with its own HTML/Vite configuration and a unique workspace package name.
2. Set its Vite base to /new-project/ and choose an unused development port.
3. Add slug, directory and port to project-manifest.mjs.
4. Add the title, description, icon, status, URL and CTA to src/home/projects.ts. Vite renders cards before the page is delivered, preventing layout shifts.
5. Add a small return-to-home link without forcing the homepage layout onto the application.
6. Keep assets local to that app or give shared public assets explicit nonconflicting paths; do not assume root /assets belongs to the app.
7. Run install, typecheck, tests, build, Worker route checks, dry run and public-source audit; review licenses and storage keys.
8. Commit reviewed source. Publish through the existing approved workflow; never force-push or create another Worker/Pages project.

## Limitations

Cloudflare dashboard-managed configuration and the first actual deployment require owner verification. Automated browser checks use Chromium on Windows, including a genuinely insecure HTTP test origin; independent Safari/Firefox, physical touch/audio devices and Cloudflare's Linux build environment are not independently verified. Vite warns about the large locally bundled Phaser asset; the game intentionally remains separate from the other pages so its bundle is loaded only on its route. Public source has no project-wide license selected; third-party notices are included and no uncertain downloaded art/audio/font assets were found.
#   t r i a l - a n d - e l i a s  
 