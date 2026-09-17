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

### Basic Setup

```typescript
import { createSSSKeyManager } from '@learncard/sss-key-manager';

const keyManager = createSSSKeyManager({
    serverUrl: 'https://your-lca-api.com',
    authProvider: {
        getIdToken: async () => firebaseUser.getIdToken(),
        getCurrentUser: async () => ({
            id: firebaseUser.uid,
            email: firebaseUser.email,
            providerType: 'firebase',
        }),
        getProviderType: () => 'firebase',
        signOut: async () => firebaseAuth.signOut(),
    },
});
```

### New User Setup

```typescript
// Generate new key and split into shares
const privateKey = await keyManager.setupNewKey();
console.log('DID:', deriveDid(privateKey));
```

### Returning User

```typescript
// Reconstruct key from device + server shares
const privateKey = await keyManager.connect();
```

### Migration from Web3Auth

```typescript
// Extract key from Web3Auth and migrate to SSS
const web3AuthPrivateKey = await web3Auth.provider.request({ method: 'eth_private_key' });
await keyManager.migrate(web3AuthPrivateKey);
```

### Recovery

```typescript
// Add password recovery
await keyManager.addRecoveryMethod({
    type: 'password',
    password: userPassword,
});

// Recover with password
const privateKey = await keyManager.recover({
    type: 'password',
    password: userPassword,
});

// Export backup file
const backup = await keyManager.exportBackup(backupPassword);
downloadFile('wallet.lcbackup', JSON.stringify(backup));

// Import backup file
const privateKey = await keyManager.recover({
    type: 'backup',
    fileContents: backupFileJson,
    password: backupPassword,
});
```

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

### `createSSSKeyManager(config)`

Creates a new SSS Key Manager instance.

### `keyManager.connect()`

Reconstructs the private key from device and auth shares.

### `keyManager.setupNewKey()`

Generates a new private key and splits it into shares.

### `keyManager.setupWithKey(privateKey, primaryDid?)`

Sets up SSS with an existing private key (used for migration).

### `keyManager.migrate(privateKey)`

Migrates from Web3Auth to SSS, preserving the existing key.

### `keyManager.addRecoveryMethod(method)`

Adds a recovery method (password, passkey, or backup).

### `keyManager.recover(method)`

Recovers the private key using a recovery method.

### `keyManager.exportBackup(password)`

Exports an encrypted backup file.

### `keyManager.getSecurityLevel()`

Returns the current security level based on configured recovery methods.

## Four shares

`SSS_TOTAL_SHARES = 4` and `SSS_THRESHOLD = 2`: any two shares reconstruct the private key, while one share alone reveals nothing about it.

| Share          | Where it lives                                                                     | Purpose                            |
| -------------- | ---------------------------------------------------------------------------------- | ---------------------------------- |
| Device share   | Local IndexedDB                                                                    | Same-device sign-in                |
| Auth share     | LearnCard API server, encrypted at rest                                            | Authenticated sign-in and recovery |
| Recovery share | Passkey-protected server record, offline phrase, or password-encrypted backup file | User-controlled recovery           |
| Email share    | Recovery email backup, encrypted before delivery                                   | Optional additional recovery path  |

Passkeys protect the recovery share using a key derived from WebAuthn PRF output. A recovery phrase encodes the share as a mnemonic; a backup file encrypts it using Argon2id password derivation and AES-GCM, with its salt and KDF parameters stored in the file.

### Server-side encryption

The `lca-api` service derives an AES-256-GCM key from its server `SEED` using HKDF-SHA256, with salt `lca-auth-share-encryption` and info `v1`. Each auth-share encryption uses a fresh 12-byte IV; the stored ciphertext includes the 16-byte authentication tag.

This implementation encrypts the share directly with the derived key. It does **not** generate a per-share Data Encryption Key (DEK) wrapped by a separate Key Encryption Key (KEK): the `encryptedDek` field holds the format marker `server-v1`, not a wrapped DEK. Password backup encryption and server auth-share encryption are separate mechanisms.

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

| Option                   | Default | Description                                                            |
| ------------------------ | ------- | ---------------------------------------------------------------------- |
| `serverUrl`              | —       | Base URL of the lca-api server (e.g., `https://api.example.com/api`)   |
| `enableEmailBackupShare` | `false` | Automatically send a backup share to the user's email during key setup |

### Key Methods

| Method                                             | Purpose                                                               |
| -------------------------------------------------- | --------------------------------------------------------------------- |
| `fetchServerKeyStatus(token, providerType)`        | Check if a key record exists on the server for the authenticated user |
| `setupNewKey(token, providerType, signVp)`         | Generate a new key, split it, store shares on device and server       |
| `reconstructKey(token, providerType)`              | Reconstruct the key from device share + auth share                    |
| `recoverKey(token, providerType, input)`           | Recover the key using a recovery method + auth share                  |
| `hasLocalKey()`                                    | Check if a device share exists in IndexedDB                           |
| `clearLocalKey()`                                  | Remove the device share from IndexedDB                                |
| `setupRecoveryMethod(params)`                      | Set up a new recovery method (passkey, phrase, backup, email)         |
| `getAvailableRecoveryMethods(token, providerType)` | List the user's configured recovery methods                           |

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

## License

MIT
