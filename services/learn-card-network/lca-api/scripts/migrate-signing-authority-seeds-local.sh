#!/usr/bin/env bash
# Run one local migration phase using the API container's database and keys.
set -euo pipefail

usage() {
    echo 'Usage: bun run migrate:sa-seeds:local --dry-run|--prepare|--verify|--purge'
    echo 'Defaults to read-only dry-run. Runs one phase to completion and streams logs.'
}

if [[ "$#" -gt 1 ]]; then
    usage >&2
    exit 1
fi

case "${1:---dry-run}" in
    --dry-run|--prepare|--verify|--purge) SA_PHASE="${1:---dry-run}"; SA_PHASE="${SA_PHASE#--}" ;;
    --help|-h) usage; exit 0 ;;
    *) usage >&2; exit 1 ;;
esac

SA_REPO_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../../../.." && pwd)"
cd "$SA_REPO_ROOT"
printf 'Running local signing-authority migration: %s\n' "$SA_PHASE"

docker compose -f apps/learn-card-app/compose-local.yaml exec -T \
  -e "SA_MIGRATION_PHASE=$SA_PHASE" \
  -w /app/services/learn-card-network/lca-api api bun --conditions=development -e '
import { environment } from "./src/config/environment";
import { client, mongodb } from "./src/mongo";
import { runSeedMigrationBatch, SeedMigrationError } from "./src/migrations/signingAuthoritySeeds";

try {
    let result;
    do {
        result = await runSeedMigrationBatch(
            mongodb,
            { phase: process.env.SA_MIGRATION_PHASE, batchSize: 50 },
            { encryptedWritesEnabled: environment.SA_SEED_ENCRYPT_WRITES }
        );
        console.log(JSON.stringify(result, null, 2));
        if (!result.done && result.processed === 0 && !result.rescanRequired) {
            throw new Error("No progress");
        }
    } while (!result.done);
} catch (error) {
    console.error(error instanceof SeedMigrationError ? error.category : "operation_failed");
    process.exitCode = 1;
} finally {
    await client.close();
}
'
