---
description: Self-contained SSS key management library
---

# SSS Key Manager

`@learncard/sss-key-manager` is a self-contained library that implements Shamir Secret Sharing (SSS) key management for LearnCard. It has zero UI dependencies and can be used in any JavaScript/TypeScript environment.

## Installation

```bash
pnpm add @learncard/sss-key-manager
```

## Overview

This package provides the `KeyDerivationStrategy` implementation used by the [AuthCoordinator](../core-concepts/architecture-and-principles/auth-coordinator.md). It handles:

- **Key splitting and reconstruction** using a 2-of-3 Shamir threshold scheme
- **Local device share storage** in IndexedDB with versioning
- **Server communication** for storing and retrieving auth shares
- **Recovery methods** — passkey (WebAuthn PRF), recovery phrase, backup file, email backup
- **Cross-device login** via QR code with ephemeral ECDH encryption
- **Migration** from Web3Auth to SSS

## Architecture

```
sss-key-manager/
├── sss.ts                  # Shamir split (2-of-3) and reconstruct primitives
├── sss-strategy.ts         # KeyDerivationStrategy implementation
├── storage.ts              # IndexedDB device share persistence
├── crypto.ts               # AES-GCM encryption, PBKDF2 key derivation
├── passkey.ts              # WebAuthn PRF-based share encryption
├── recovery-phrase.ts      # BIP39-style mnemonic ↔ share encoding
├── qr-crypto.ts            # ECDH ephemeral key exchange
├── qr-login.ts             # Cross-device login flow
├── atomic-operations.ts    # Split-and-verify with rollback
├── api-client.ts           # Typed fetch wrapper for lca-api routes
└── types.ts                # All types, re-exports from @learncard/types
```

## Key Types

### ContactMethod

Identifies a user by their primary contact method:

```typescript
type ContactMethodType = 'email' | 'phone';

interface ContactMethod {
    type: ContactMethodType;
    value: string;
}
```

### SecurityLevel

Describes how well-protected a user's key is:

```typescript
type SecurityLevel = 'basic' | 'enhanced' | 'advanced';
```

- **basic** — device + server share only (no recovery method)
- **enhanced** — at least one recovery method configured
- **advanced** — multiple recovery methods configured

### RecoveryInput

What the user provides to recover their key:

```typescript
type RecoveryInput =
    | { method: 'passkey'; credentialId: string }
    | { method: 'phrase'; phrase: string }
    | { method: 'backup'; fileContents: string; password: string }
    | { method: 'email'; emailShare: string };
```

### RecoverySetupInput

What the user provides to set up a new recovery method:

```typescript
type RecoverySetupInput =
    | { method: 'passkey' }
    | { method: 'phrase' }
    | { method: 'backup'; password: string; did: string }
    | { method: 'email' };
```

### BackupFile

The JSON structure of a downloadable backup file:

```typescript
interface BackupFile {
    version: 1;
    createdAt: string;
    primaryDid: string;
    shareVersion?: number;
    encryptedShare: {
        ciphertext: string;
        iv: string;
        salt: string;
        kdfParams: {
            algorithm: 'argon2id';
            timeCost: number;
            memoryCost: number;
            parallelism: number;
        };
    };
}
```

## SSSStrategy

The main class that implements `KeyDerivationStrategy`. It is typically instantiated by the AuthCoordinator, not directly by application code.

### Configuration

```typescript
interface SSSStrategyConfig {
    serverUrl: string;
    enableEmailBackupShare?: boolean;
}
```

| Option | Default | Description |
|---|---|---|
| `serverUrl` | — | Base URL of the lca-api server (e.g., `https://api.example.com/api`) |
| `enableEmailBackupShare` | `false` | Automatically send a backup share to the user's email during key setup |

### Key Methods

| Method | Purpose |
|---|---|
| `fetchServerKeyStatus(token, providerType)` | Check if a key record exists on the server for the authenticated user |
| `setupNewKey(token, providerType, signVp)` | Generate a new key, split it, store shares on device and server |
| `reconstructKey(token, providerType)` | Reconstruct the key from device share + auth share |
| `recoverKey(token, providerType, input)` | Recover the key using a recovery method + auth share |
| `hasLocalKey()` | Check if a device share exists in IndexedDB |
| `clearLocalKey()` | Remove the device share from IndexedDB |
| `setupRecoveryMethod(params)` | Set up a new recovery method (passkey, phrase, backup, email) |
| `getAvailableRecoveryMethods(token, providerType)` | List the user's configured recovery methods |

## API Client

The `api-client.ts` module provides a typed fetch wrapper for all lca-api `/keys/*` and `/qr-login/*` routes. It is used internally by the SSS strategy but can also be used directly:

```typescript
import { createApiClient } from '@learncard/sss-key-manager';

const client = createApiClient({ serverUrl: 'https://api.example.com/api' });

const status = await client.getAuthShare({
    authToken: token,
    providerType: 'firebase',
    contactMethod: { type: 'email', value: 'user@example.com' },
});
```

## Testing

The package includes ~249 unit tests across 13 test files:

```bash
pnpm exec nx test sss-key-manager
```
