# Restore a known-good Worker deployment

A rollback is a production action requiring explicit owner approval. No rollback was performed during preparation.

1. In Cloudflare Workers & Pages, select trial-and-elias1 and open Deployments.
2. Identify the previously recorded working version. Use its menu and the Rollback action, reviewing the affected deployment before confirming.
3. Verify the homepage, both application paths, custom domain/routes and analytics afterward. Already-loaded browser pages may still request assets from the newer version; refresh and check for missing assets.
4. Resource bindings are not rolled back with code. Do not assume a rollback recreates deleted or changed resources.

Separately, correct the repository with a new revert/fix commit. After review and approval, pushing that revision through native Builds restores source-controlled behavior and prevents a later build from redeploying the broken source. Do not rewrite remote history or force-push. A dashboard rollback does not itself revert Git commits.

[Official Worker rollback documentation](https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/).
