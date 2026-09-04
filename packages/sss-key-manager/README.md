# @learncard/sss-key-manager

Shamir Secret Sharing (SSS) key manager for LearnCard - replaces Web3Auth SFA.

## Overview

This package provides a secure, self-hosted alternative to Web3Auth Single Factor Authentication (SFA) for managing cryptographic private keys. It uses Shamir Secret Sharing to split keys into multiple shares that can be distributed across device storage, server storage, and recovery methods.

## Features

- **Key Splitting**: Split ed25519 private keys into 3 shares with 2-of-3 threshold
- **Device Storage**: Encrypted local storage using AES-GCM with IndexedDB
- **Server Storage**: Encrypted auth share stored on server with envelope encryption
- **Recovery Methods**:
    - Password-based (Argon2id KDF)
    - Passkey/WebAuthn PRF (coming soon)
    - Backup file export/import
- **Migration**: Seamless migration from Web3Auth SFA

## Installation

```bash
bun add @learncard/sss-key-manager
```

## Usage

### AuthCoordinator Setup

```typescript
import { createSSSStrategy } from '@learncard/sss-key-manager';

const keyDerivation = createSSSStrategy({
    serverUrl: 'https://your-lca-api.com',
});
```

Use this strategy with LearnCard's `AuthCoordinator`, which obtains a fresh DID challenge for every
protected write.

> `createSSSKeyManager` and `SSSApiClient` are deprecated compatibility exports. Their legacy write
> methods fail closed because they cannot satisfy the hardened DID-challenge routes. Migrate callers
> to `createSSSStrategy`.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Private Key                          │
└─────────────────────────────────────────────────────────┘
                          │
                    SSS Split (3,2)
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│ Device Share  │ │  Auth Share   │ │Recovery Share │
│ (IndexedDB)   │ │   (Server)    │ │  (Optional)   │
│ AES-GCM local │ │ Envelope enc  │ │ Password/Key  │
└───────────────┘ └───────────────┘ └───────────────┘
```

## Security Model

- **Device Share**: Encrypted with non-extractable AES-GCM key stored in IndexedDB
- **Auth Share**: Server-side envelope encryption (DEK + KMS-encrypted DEK)
- **Recovery Share**: Password-based uses Argon2id KDF with secure parameters
- **Threshold**: Any 2 of 3 shares can reconstruct the key

## Auth Provider Support

The package is designed to work with any authentication provider:

- Firebase Authentication (default for production)
- SuperTokens (recommended for self-hosting/local dev)
- Keycloak (enterprise SSO)
- Any OIDC-compliant provider

## API Reference

### `createSSSStrategy(config)`

Creates the SSS key-derivation strategy used by `AuthCoordinator` for setup, migration, recovery,
and DID-authorized server writes.

## License

MIT
