# Service configuration

Private workspace package consumed from TypeScript source, like `learn-card-base`.
There is no package build or publishing step. Services declare
`"@learncard/service-config": "workspace:*"`; esbuild bundles its source.

## Runtime API

- `parseRuntimeSecrets(serialized)` validates a flat `ENV_NAME` → string JSON
  object. Errors omit the payload, keys, and values.
- `mergeRuntimeSecrets(current, secrets)` returns a new environment object;
  non-empty current values win.
- `applyStageConfig({ base, stages, stage })` fills unset `process.env` entries
  from the base and selected stage. Unknown stages use only the base.
- `loadRuntimeSecrets({ secretIdEnv = 'RUNTIME_SECRETS_ID' } = {})` loads and
  merges a bundle only inside Lambda (`AWS_LAMBDA_FUNCTION_NAME` is set).
  Concurrent calls share a fetch; failed fetches retry on the next call with
  sanitized errors. Warm processes cache successful loads.
- `bootstrapLambda({ base, stages, stage, importApp })` returns a memoized
  `() => Promise<App>`. It applies stage config, loads secrets, then imports the
  application. Only secret-fetch failures retry; failed imports stay memoized.

Empty strings are unset at every layer. Precedence is schema defaults < base <
stage < bundle < real environment. The application owns its Zod schema and
statically imported JSON files; this package does not read config from disk.

```ts
import { bootstrapLambda } from '@learncard/service-config';
import base from './config/config.json';
import dev from './config/config.dev.json';
import production from './config/config.production.json';

const getApp = bootstrapLambda({
    base,
    stages: { dev, production },
    stage: process.env.AWS_LAMBDA_FUNCTION_NAME
        ? process.env.LAMBDA_STAGE
        : process.env.CONFIG_STAGE,
    importApp: () => import('./lambdaApp'),
});
```

Do not eagerly import the application or its environment module in a bootstrap.
For Docker/local entrypoints, call `applyStageConfig` before importing them.

## Serverless CommonJS helper

```js
const { pickNonEmpty, functionEnvironment } = require('@learncard/service-config/function-env.cjs');

exports.api = () =>
    functionEnvironment({
        always: ['RUNTIME_SECRETS_ID'],
        fallback: ['SEED', 'MONGO_URI'],
    });
```

`pickNonEmpty(keys, env = process.env)` omits unset/empty values.
`functionEnvironment({ always, fallback, env = process.env })` includes fallback
keys only when `RUNTIME_SECRETS_ID` is unset. Keep bundle IDs on functions whose
execution role can read the bundle; function-specific credentials can use an
independent `pickNonEmpty` export.

Run `bun run test` and `bun run typecheck` in this package.
