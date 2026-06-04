---
description: How holders can export, verify, and move LearnCard wallet data
---

# Holder Continuity

LearnCard is designed so a holder can keep control of the artifacts that define their identity: private key material, DIDs, Verifiable Credentials, Verifiable Presentations, consent records, and status snapshots.

## Current custody model

LearnCard's AuthCoordinator uses Shamir Secret Sharing with a **2-of-4 threshold**. The private key is split into four shares:

| Share          | Where it lives                                            | Purpose                           |
| -------------- | --------------------------------------------------------- | --------------------------------- |
| Device share   | Local IndexedDB                                           | Fast same-device login            |
| Auth share     | LearnCard API server, encrypted at rest                   | Authenticated recovery and login  |
| Recovery share | Passkey, phrase, or password backup                       | User-controlled recovery          |
| Email share    | Verified recovery email backup, encrypted before delivery | Optional additional recovery path |

Any two shares can reconstruct the key. One share alone is not useful.

## What the holder controls

The holder continuity export includes:

-   DID key material as encrypted JWKs and the private key seed.
-   A recovery phrase derived from the current SSS recovery share.
-   The primary DID document and locally derivable DID variants.
-   W3C Verifiable Credential and Verifiable Presentation payloads exactly as resolved from the holder's wallet index.
-   Encrypted LearnCloud index metadata, including URI, record ID, category, and title where available.
-   ConsentFlow contracts, terms, statuses, and transaction history returned by the authenticated holder export metadata route.
-   Status-list credential snapshots when the status URL is publicly fetchable during export.

The export preserves issuer-signed JSON. It does not normalize proofs or rewrite credential contents.

## Zero-cooperation exit path

A holder who can still access their wallet can export a bundle with the LearnCard CLI:

```js
const password = await getLearnCardBundlePassword();

await exportLearnCardBundle(learnCard, {
    out: './learncard-export.zip',
    password,
});
```

The CLI also supports `await exportLearnCardBundle({ ...options })`, which exports the default `learnCard` wallet created at startup.

The underlying bundle helpers live in `@learncard/holder-continuity`:

```ts
import {
    exportLearnCardBundle,
    importLearnCardBundle,
    restoreLearnCardFromBundle,
} from '@learncard/holder-continuity';
```

After the ZIP is created, the holder can decrypt and inspect it with only the bundle password and public tooling. The readable `manifest.json` lists every payload and SHA-256 hash, while sensitive payloads and LearnCloud index records remain encrypted. Encrypted files use Argon2id and AES-GCM through the same `@learncard/sss-key-manager` password envelope used for account backup files.

A fresh LearnCard wallet can import the bundle without help from the original LearnCard account:

```js
const freshWallet = await initLearnCard({ seed: '0'.repeat(64) });
await importLearnCardBundle('./learncard-export.zip', {
    password,
    wallet: freshWallet,
    verifyBeforeImport: true,
});
```

The original wallet identity can also be reconstructed directly from the exported seed:

```js
const restoredWallet = await restoreLearnCardFromBundle('./learncard-export.zip', {
    password,
    init: { network: true, didkit: 'node' },
});
```

Import writes to the target wallet. Use `verifyBeforeImport: true` when the target wallet can verify VCs/VPs before upload; otherwise, only import bundles from sources you trust.

Status-list snapshots are fetched only from public HTTPS URLs, with timeout and response-size limits, to avoid turning holder-supplied credentials into server-side fetches to private networks.

Restore passes the exported `key-private-seed` to `initLearnCard(...)`. It recreates the original key and DID; it does not upload payloads or recreate index records. Use restore when you want the original wallet identity back, and use import when you want to copy credentials into another wallet.

## Continuity of service

The exported artifacts are based on public standards and readable formats:

-   DIDs and DID Documents are JSON.
-   Verifiable Credentials and Verifiable Presentations are W3C VC/VP JSON payloads.
-   JSON-LD proofs, JWT VCs, and BitstringStatusList or StatusList2021 credentials can be verified by non-LearnCard libraries that support those suites and contexts.
-   Consent records are JSON snapshots with contract terms and transaction history.
-   The outer container is a normal ZIP file; encryption is per-payload JSON, not proprietary ZIP encryption.

If LearnCard services are unavailable, the bundle remains useful for independent verification, audit, and migration work.

## What is not exported

Some LearnCard network behavior is service-specific and cannot be fully reconstructed from holder artifacts alone:

-   Boost authoring semantics and issuer-side template management.
-   Claim hooks, notification queues, inbox delivery state, and server-only activity feeds.
-   Network graph edges that are not represented in a credential, consent record, or transaction.
-   LearnCard convenience relationships such as profile recommendations or app-specific UI grouping.

Some of this can be recreated from credentials and consent records. For example, a credential's issuer, subject, proof, and status fields remain available. Server-only state that was never written into a holder-controlled artifact is not portable.

## Sensitivity warning

A holder continuity export is personal data. It can include identifiers, credentials, consent history, transaction timestamps, and key material. Store it like a password vault backup, rotate the export if it is exposed, and treat status-cache files as point-in-time snapshots rather than live revocation guarantees.

Critically, the export contains the wallet's **full raw private-key seed** (encrypted with the bundle password). The live wallet normally protects this key with the 2-of-4 SSS threshold described above, where no single share is enough to reconstruct it. The bundle does not preserve that threshold: the exported seed alone is sufficient to take full control of the identity, so the bundle password is the only thing protecting it. The exported recovery phrase is derived from the current recovery share for reference and is not independently sufficient to recover the key — restore uses the exported seed.

## Compatibility with other wallets

No third-party wallet imports the LearnCard ZIP bundle directly today. External wallets receive credentials through protocols (OID4VCI, DIDComm) or through SDK-level JSON import, not by reading `manifest.json` and decrypting entries.

In practice, the portable path is: decrypt the bundle, take the individual Verifiable Credential and Presentation JSON payloads, and hand them to the target wallet through whatever import path that wallet documents. Keep the original ZIP as an audit backup.

The table below reflects what each vendor's public docs describe at the time of writing. Treat it as a starting point — verify against current vendor docs, and do not assume a wallet supports the LearnCard bundle unless it has been tested against the ZIP format.

| Wallet / toolkit | Raw ZIP import | Credential JSON import (after decrypt) | OID4VCI receive | DIDComm receive |
|---|---|---|---|---|
| [Spruce / SpruceKit](https://www.sprucekit.dev/sprucekit-mobile/sprucekit-mobile-sdk/core-components/credentialpack) | No | Yes — `CredentialPack.addJsonVc(...)` | Yes | Not documented |
| [Sphereon Wallet / SSI SDK](https://ssisdk.docs.sphereon.com/mobile-wallet/receiving-credentials) | No | Not documented | Yes | Not documented |
| [MATTR](https://learn.mattr.global/docs/holding/credential-claiming-overview) | No | Not documented | Yes | Not documented |
| [Paradym Wallet](https://docs.paradym.id/api-and-dashboard/integrating-with-a-holder-wallet/paradym-wallet) | No | Not documented | Yes | Not documented |

## Related pages

-   [LearnCard CLI](../sdks/learncard-cli.md)
-   [Key Management (SSS)](identities-and-keys/key-management-sss.md)
