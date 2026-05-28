# @learncard/holder-continuity

Helpers for creating, reading, importing, and restoring LearnCard holder continuity bundles.

A bundle is a normal ZIP file with a readable `manifest.json` and encrypted payload files for key material, credentials, presentations, LearnCloud index records, consent records, and status-list snapshots.

## Install

```bash
pnpm add @learncard/holder-continuity
```

## Export a wallet

```ts
import { exportLearnCardBundle } from '@learncard/holder-continuity';

await exportLearnCardBundle(learnCard, {
    out: './learncard-export.zip',
    password: 'use-a-strong-password',
});
```

## Read a bundle

```ts
import { readLearnCardBundle } from '@learncard/holder-continuity';

const bundle = await readLearnCardBundle('./learncard-export.zip', {
    password: 'use-a-strong-password',
});
```

`manifest.json` is readable without the password, but sensitive payloads are encrypted by default.

## Restore the original wallet

```ts
import { restoreLearnCardFromBundle } from '@learncard/holder-continuity';

const restored = await restoreLearnCardFromBundle('./learncard-export.zip', {
    password: 'use-a-strong-password',
    init: { network: true },
});
```

Restore decrypts the exported `key-private-seed` and passes it to `initLearnCard(...)`, so the returned wallet has the same key material and DID as the original wallet.

Restore does not upload or re-index the bundle contents. Use it when you want the original wallet identity back. Use `importLearnCardBundle(...)` when you want to copy credentials and index records into another wallet.

## Import into another wallet

```ts
import { importLearnCardBundle } from '@learncard/holder-continuity';

await importLearnCardBundle('./learncard-export.zip', {
    password: 'use-a-strong-password',
    wallet: freshWallet,
    verifyBeforeImport: true,
});
```

Import uploads credential and presentation payloads to the target wallet's LearnCloud store and recreates their LearnCloud index records.

If `verifyBeforeImport` is not set, import only proves bundle integrity and successful decryption. It does not prove issuer signatures, so only import bundles from sources you trust.

Bundle readers enforce default compressed-bundle, per-entry, and JSON parse size limits. Override `maxBundleBytes`, `maxEntryBytes`, or `maxJsonBytes` only for trusted local workflows.

## Bundle format

See [`BUNDLE_SPEC.md`](./BUNDLE_SPEC.md) for the ZIP layout, manifest hashing rules, and encryption model.
