[<img src="https://user-images.githubusercontent.com/2185016/190510561-294db809-09fd-4771-9749-6c0e0f4144fd.png" width="215"/>](https://learncard.com)

# @learncard/didkit-plugin

[![npm version](https://img.shields.io/npm/v/@learncard/didkit-plugin)](https://www.npmjs.com/package/@learncard/didkit-plugin)
[![npm downloads](https://img.shields.io/npm/dw/@learncard/didkit-plugin)](https://www.npmjs.com/package/@learncard/didkit-plugin)

Wraps the [DIDKit](https://github.com/spruceid/didkit) WASM build to sign and verify credentials and presentations and resolve DIDs.

## Documentation

All LearnCard documentation can be found at:
https://docs.learncard.com

## Install

```bash
bun add @learncard/init @learncard/didkit-plugin
```

## Usage

This package exports `getDidKitPlugin`.

```ts
import { initLearnCard } from '@learncard/init';
import { getDidKitPlugin } from '@learncard/didkit-plugin';

const learnCard = await initLearnCard({ custom: true });

// Optional args: a custom WASM URL/module, and allowRemoteContexts (default false)
const didkitLearnCard = await learnCard.addPlugin(await getDidKitPlugin());
```

On Node, prefer [`@learncard/didkit-plugin-node`](../didkit-plugin-node) (or `initLearnCard({ seed, didkit: 'node' })`). Seed-based `initLearnCard` wallets already include a DIDKit plugin.

### Final P-256 Data Integrity proofs

The native and WASM engines support explicit `ecdsa-rdfc-2019` proofs with P-256/ES256
keys. Verification accepts equivalent P-256 JWKs and validated compressed P-256
Multikeys. This suite is distinct from the legacy `ecdsa-2019` suite; omitted-suite
selection and existing EdDSA behavior are unchanged. P-384 is not supported by the
new suite.

For DIDAuth verification, supply the expected `proofPurpose: 'authentication'`,
`challenge`, and `domain`. The holder's DID document must authorize the verification
method for authentication. Final-suite proofs may omit `created`; a verification
date cutoff applies to timestamps that are present.

Low-level signing requires an explicit P-256 key and an appropriate document context.
An Ed25519 wallet does not gain P-256 key selection, and outgoing OpenID negotiation
does not advertise this suite.

Inbox claims additionally require a supported X25519 key-agreement method for encrypted
delivery and recovery. Use separate authentication and encryption keys in a `did:web`
document. Signing-only P-256 `did:key` holders can use generic claim links, but not inbox
claims; an unsupported delivery key leaves the pending credential and challenge available
for retry.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

### Browser encryption regression

From this package directory, run:

```bash
bunx playwright install chromium firefox
bun run test:browser
```

These tests load the checked-in JavaScript/WASM pair in Chromium and Firefox.
They stub only the recipient's DID document, using the inline X25519 2019 keys
emitted for managed profiles. They verify both JWE and DAG-JWE encryption to every
key, reject an unrelated key, and check manager additions and removals after a DID
cache refresh. All requests are intercepted; no network services or credentials
are required. Private test keys are generated in browser memory, without traces.

This is cryptographic coverage, not proof of provisioning, DID cache invalidation,
consent authorization, or deployed/CDN artifacts.

### Vendored Rust dependency locks

WASM builds use DIDKit's committed workspace lock at `lib/didkit/Cargo.lock` with
`--locked`. DIDKit source updates must include a valid lock; LearnCard does not
overlay or regenerate it. The native addon has its own lock at
`../didkit-plugin-node/native/Cargo.lock`.

Using DIDKit's lock adopts its dependency versions rather than LearnCard's former
separate WASM graph. The committed WASM/glue pair and hosted URL are retained until
the normal source-update workflow builds, tests, and publishes a matching artifact
pair and updates the URL and bridge integrity pin.

## License

MIT © [Learning Economy Foundation](https://github.com/Learning-Economy-Foundation)
