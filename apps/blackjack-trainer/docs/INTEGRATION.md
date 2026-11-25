# Trial & Elias integration

The owner explicitly requested this app become part of the existing website like One Minute Dungeon. Integration is local and authorized; production changes remain excluded.

- Source: apps/blackjack-trainer, maintained as an independent React/Phaser workspace.
- Public route/base: /blackjack-trainer/.
- Playground card: src/home/projects.ts.
- Build/dev registry: project-manifest.mjs (child port 5187).
- Unified development: npm run dev at repository root; browse http://127.0.0.1:5175/blackjack-trainer/.
- Unified artifact: dist/blackjack-trainer/index.html and local hashed assets.
- Preview: npm run preview at root, same path on port 4175.
- Local Worker: npm run dev:worker at root, same path on port 8787.
- Return navigation: /#projects, centralized in src/config/metadata.ts.

CSS lives only in the Blackjack document. Existing homepage header/hero/base CSS, dungeon and NATO trainer behavior and storage keys remain. Blackjack uses trial-and-elias:blackjack:v1 IndexedDB and trial-and-elias:blackjack:preferences:v1 localStorage.

Cloudflare remains the existing trial-and-elias1 Worker and the root wrangler.jsonc. Native Builds settings remain repository root, npm run build and npx wrangler deploy, with the existing main production branch. Never create another Worker/Pages site or modify DNS/domain/routes for this app. The original manually deployed Worker dashboard settings still require owner review before the first approved deployment. No push, remote repository creation or production upload is performed by this implementation.

The previous repository integration report describes the original three-entry consolidation. The new entry makes four: homepage plus three playable applications. Detailed original game source remains untouched; its integrated copy changes only the test-runner devDependency patch in this update.
