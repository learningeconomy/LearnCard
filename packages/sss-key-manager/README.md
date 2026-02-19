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
pnpm add @learncard/sss-key-manager
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

## License

MIT
