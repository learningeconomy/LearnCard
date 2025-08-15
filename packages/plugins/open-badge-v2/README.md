# @learncard/open-badge-v2-plugin

Wrap legacy Open Badges v2.0 (OBv2) assertions into self‑issued W3C Verifiable Credentials (VCs) so they can be stored, indexed, and used within the LearnCard ecosystem.

- Name: `OpenBadgeV2`
- Method: `wrapOpenBadgeV2(obv2Assertion: object | string): Promise<VC>`
- Context added: `https://ctx.learncard.com/wrappers/obv2/1.0.0.json`
- VC type produced: `LegacyOpenBadgeCredential`

## Why this plugin?

Many issuers still publish Open Badges v2.0 assertions (JSON), not VCs. This plugin provides a backwards‑compatibility bridge by wrapping the raw OBv2 assertion inside a signed VC you control, preserving the original badge payload under `legacyAssertion`.

This enables:
- Use of legacy badges anywhere a VC is expected (storage, indexing, sharing).
- A stable LearnCard vocabulary for the wrapper (`LegacyOpenBadgeCredential`).
- Consistent DID‑based signing and verification workflows.

## What it produces

A signed VC with these characteristics:
- `@context`: `["https://www.w3.org/ns/credentials/v2", "https://ctx.learncard.com/wrappers/obv2/1.0.0.json"]`
- `type`: `["VerifiableCredential", "LegacyOpenBadgeCredential"]`
- `issuer`: your LearnCard DID
- `validFrom`: `new Date().toISOString()`
- `credentialSubject.id`: your LearnCard DID
- `legacyAssertion`: the original OBv2 assertion JSON

Notes:
- The wrapper signs the fact that “you attest to this legacy assertion,” not that you were the original OBv2 issuer.
- Minimal OBv2 validation is performed: `id` (string), `type` includes `"Assertion"`, `issuedOn` (string).

## Requirements

- A LearnCard instance with the VC plugin installed (used to sign the VC).
- Fetch available for remote inputs (Node 18+ or a polyfill like `undici`).

## Installation

This package is part of the monorepo. In external usage, install from npm (when published) and ensure peer packages are available.

```bash
# inside the monorepo
pnpm nx run open-badge-v2-plugin:build
```

## Usage

Below examples assume you already have a `learnCard` instance and you add both the VC plugin and this plugin.

```ts
import { getVCPlugin } from '@learncard/vc-plugin';
import { openBadgeV2Plugin } from '@learncard/open-badge-v2-plugin';

// Ensure VC plugin is installed first (required for signing)
await learnCard.addPlugin(getVCPlugin(learnCard));

// Install the OpenBadge v2 wrapper plugin
await learnCard.addPlugin(openBadgeV2Plugin(learnCard));
```

### 1) Wrap from a remote HTTP(S) URL

```ts
const url = 'https://example.org/badges/assertions/123.json';
const vc = await learnCard.invoke.wrapOpenBadgeV2(url);

// Optional: verify the signed VC
const verification = await learnCard.invoke.verifyCredential(vc);
```

### 2) Wrap from IPFS

```ts
const ipfsUrl = 'ipfs://bafybeigdyr...';
const vc = await learnCard.invoke.wrapOpenBadgeV2(ipfsUrl);
```

### 3) Wrap from a raw OBv2 object

```ts
const obv2 = {
  '@context': 'https://w3id.org/openbadges/v2',
  type: 'Assertion',
  id: 'https://issuer.example.org/assertions/abc',
  issuedOn: '2024-05-02T12:34:56Z',
  recipient: { type: 'email', identity: 'user@example.org', hashed: false },
  badge: 'https://issuer.example.org/badges/my-badge'
  // ... any other OBv2 fields ...
};

const vc = await learnCard.invoke.wrapOpenBadgeV2(obv2);
```

### 4) Wrap from a JSON string

```ts
const obv2String = JSON.stringify(obv2);
const vc = await learnCard.invoke.wrapOpenBadgeV2(obv2String);
```

## API

```ts
wrapOpenBadgeV2(obv2Assertion: object | string): Promise<VC>
```

- `obv2Assertion` may be:
  - A raw OBv2 assertion object
  - A URL string (http(s)://, ipfs://, ipns://) pointing to the assertion JSON
  - A JSON string containing the assertion

Validation rules enforced:
- `assertion.id` must be a non‑empty string
- `assertion.type` must include `"Assertion"`
- `assertion.issuedOn` must be a string

## JSON‑LD Context

The wrapper vocabulary is published at:

- `https://ctx.learncard.com/wrappers/obv2/1.0.0.json`

It defines:
- `LegacyOpenBadgeCredential`
- `legacyAssertion` as `@type: @json` for embedding raw OBv2 JSON

## Development

- Build: `pnpm nx run open-badge-v2-plugin:build`
- Source: `packages/plugins/open-badge-v2/src/`
- Context file: `packages/learn-card-contexts/wrappers/obv2/1.0.0.json`

## Caveats

- Wrapping does not retroactively convert OBv2 into a first‑party VC issued by the original badge issuer; it produces a VC signed by your DID that embeds the legacy assertion.
- Always fetch and wrap assertions from trusted sources.

## License

MIT
