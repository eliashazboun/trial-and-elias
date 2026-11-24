# Existing Worker: Git integration and deployment approval

This repository targets the existing **trial-and-elias1** Worker. No replacement Worker or Cloudflare Pages application should be created.

## Review before connecting Builds

1. Open the Cloudflare dashboard and Workers & Pages, then select trial-and-elias1.
2. Record the current active deployment/version so it can be restored.
3. Inspect the dashboard's Worker source and settings: compatibility date/flags, routes, custom domains, variables/secrets, asset rules and any bindings or server-side logic.
4. Compare these with wrangler.jsonc. The previous local folder had no configuration to import. Merge required behavior rather than deploying over it.
5. Confirm trialandelias.com remains attached to this same Worker. Do not modify DNS, custom domains or route patterns as part of this preparation.
6. Keep existing Web Analytics injection enabled if desired. The source does not add a duplicate beacon.
7. Review local source, tests, public-source audit and the dry-run report. No credentials belong in Git.

## Native Workers Builds settings

Within the existing Worker, open **Settings → Builds → Connect** and connect the existing repository:

| Setting           | Value                                                  |
| ----------------- | ------------------------------------------------------ |
| Git provider      | GitHub                                                 |
| Repository        | eliashazboun/trial-and-elias                           |
| Production branch | main                                                   |
| Root directory    | repository root (blank or / as the dashboard requires) |
| Build command     | npm run build                                          |
| Deploy command    | npx wrangler deploy                                    |
| Worker name       | trial-and-elias1 (must match wrangler.jsonc)           |
| Node              | 24, selected by .nvmrc/.node-version                   |
| npm               | 11.8.0, selected by packageManager                     |

Use the normal root dependency installation and include development dependencies needed for Vite, TypeScript and Wrangler. No separate application deployment or manual dist copying is needed. Configure preview branches only if desired and review their publishing behavior before pushing.

Connecting an existing Worker and pushing can trigger deployment. Do not enable or trigger the first production build until the owner approves the reviewed revision and the existing dashboard settings have been verified.

## Commands proposed after approval (not executed)

```sh
git status
git remote -v
git log --oneline -3
git fetch origin
# Inspect any new remote history before proceeding. Never force-push.
git push -u origin main
```

If remote main has acquired a README or another commit since inspection, preserve that history before pushing. Do not use --force or discard unrelated changes. If Builds is not yet connected and a manual deployment is explicitly approved, npm run deploy builds and targets the existing Worker. That is a production operation and was not run during preparation.

After the first approved deployment, test /, /nato-phonetic-alphabet-trainer/, /one-minute-dungeon/, direct refresh, missing paths, analytics, storage, game audio and phone layout on the actual domain. Local validation does not replace that production smoke test.

Official references: [Connect an existing Worker](https://developers.cloudflare.com/workers/ci-cd/builds/), [static-asset routing](https://developers.cloudflare.com/workers/static-assets/), [build image/version selection](https://developers.cloudflare.com/workers/ci-cd/builds/build-image/).
