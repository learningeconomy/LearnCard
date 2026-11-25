# lca-api scripts

Operational scripts run directly with `bun scripts/<name>.ts` from
`services/learn-card-network/lca-api/`. These are not part of the deployed
service and are not built by `bun run build`; they import `src/` files by
relative path (not the `@alias` path mappings used inside `src/`, since
`scripts/` is intentionally outside this package's `tsconfig.json` `include`
and those aliases don't resolve from here — see `escrow-blob-mode-report.ts`
if you need the full explanation).

## `strip-email.ts`

Removes the email attribute from a Firebase user by UID, via the Identity
Toolkit REST API (the Admin SDK can't clear an email, only replace it).

```bash
bun scripts/strip-email.ts <uid>
```

Requires `GOOGLE_APPLICATION_CREDENTIAL`.

## `escrow-blob-mode-report.ts` (P6.2)

Read-only counts report over the `userkeys` and `escrowholds` collections:
escrow blob counts by `enclaveMode` / `enclaveKeyId`, enabled-PIN count,
pending-hold counts by `releasePolicy`, opted-out count, and a software→nitro
"re-seal" breakdown. Never writes to the database and never prints PII (counts
only — no DIDs, emails, or Mongo `_id`s).

```bash
# Human-readable table
bun scripts/escrow-blob-mode-report.ts

# Machine-readable JSON
bun scripts/escrow-blob-mode-report.ts --json

# Also print the CloudWatch PutMetricData payload for the counts
bun scripts/escrow-blob-mode-report.ts --json --publish-metrics
```

Requires the same env as the lca-api server: `SEED`, `MONGO_URI`,
`MONGO_DB_NAME` (point `MONGO_URI` at whichever environment you want to report
on). Full flag/limitation reference lives in the script's own header comment.

**CloudWatch:** `--publish-metrics` does not call AWS itself — lca-api has no
`@aws-sdk/client-cloudwatch` dependency (only
`services/learn-card-network/ai-agent` does elsewhere in this monorepo, and it
isn't shared with lca-api). The flag prints the exact `MetricData` payload
(namespace `LearnCard/Escrow`, metrics `EscrowBlobs` per `EnclaveMode`
dimension and `EscrowBlobsStale`) for the P7.1 monitor Lambda or an ops job
that already has AWS SDK access to forward.

### Running it locally against a throwaway Mongo

There's no persistent local Mongo fixture for scripts (unlike `test/*.spec.ts`,
which get one via `vitest-setup.ts`'s `mongodb-memory-server` global setup).
To try the report against real data without touching a real environment, spin
up your own `mongodb-memory-server` instance and point the script at it:

```ts
// tmp-run-report.mjs (delete after use — do not commit)
import { MongoMemoryServer } from 'mongodb-memory-server';
import { spawnSync } from 'node:child_process';

const mongod = await MongoMemoryServer.create();
// ...seed `userkeys` / `escrowholds` via a MongoClient here...

spawnSync('bun', ['scripts/escrow-blob-mode-report.ts', '--json'], {
    env: {
        ...process.env,
        NODE_ENV: 'development',
        SEED: 'a'.repeat(64),
        MONGO_URI: mongod.getUri(),
        MONGO_DB_NAME: 'report-harness',
    },
    stdio: 'inherit',
});

await mongod.stop();
```

### Testing

`escrow-blob-mode-report.test.ts` covers the pure aggregation → report
formatting logic (zero-count modes, an unknown `enclaveMode`/`releasePolicy`
value, the CloudWatch payload shape) without touching Mongo. It's picked up by
the same `bun run test` as `src/**/*.test.ts` — `vitest.config.ts`'s `include`
was extended to also match `scripts/**/*.test.ts`.
