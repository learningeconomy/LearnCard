---
description: How LearnCard protects private keys using Shamir Secret Sharing
---

# Key Management (SSS)

## What is this section about?

This section explains how LearnCard protects user private keys using **Shamir Secret Sharing (SSS)** — a cryptographic technique that splits a secret into multiple shares so that no single party ever holds the complete key. This replaces the previous Web3Auth-based key management system with a fully self-hosted solution.

## Why is this important?

Private keys are the foundation of a user's digital identity. Whoever controls the key controls the identity, its credentials, and all associated data. SSS ensures that:

- **No single point of compromise** — neither the device, the server, nor any recovery method alone can reconstruct the key.
- **No third-party dependency** — key management is fully self-hosted, unlike the previous Web3Auth system.
- **Flexible recovery** — users can recover their key even if they lose their device, using any of several recovery methods.

## How It Works

### The 2-of-3 Threshold Scheme

When a user's private key is created (or migrated), it is split into **three shares** using Shamir's Secret Sharing with a **threshold of 2**. Any two of the three shares are sufficient to reconstruct the original key. No single share reveals anything about the key on its own.

```
Private Key (32 bytes)
    │
    ├── Split via Shamir 2-of-3 ──────────────────────────┐
    │                                                      │
    ▼                  ▼                    ▼               │
Device Share      Auth Share          Recovery Share(s)    │
(IndexedDB)    (lca-api server,      (passkey, phrase,     │
                AES-256-GCM          backup file, or       │
                encrypted at rest)   email backup)         │
                                                           │
Any 2 shares → reconstruct private key ◄──────────────────┘
```

### The Three Shares

#### 1. Device Share

- Stored locally on the user's device in **IndexedDB**.
- Versioned and keyed to the user's contact method (email or phone).
- Available immediately on the device where the key was created.
- **Lost when the user clears browser storage or switches devices.**

#### 2. Auth Share (Server Share)

- Stored on the LearnCard API server (`lca-api`).
- **Encrypted at rest** using AES-256-GCM with a key derived from a server-side seed via HKDF. The server never stores the share in plaintext.
- Retrieved by authenticating with the user's auth provider (e.g., Firebase).
- Supports **share versioning** — when shares are rotated, previous versions are kept so that recovery methods created against older shares remain valid.

#### 3. Recovery Share(s)

One or more recovery shares can be created by the user. Each recovery share is the third share, encrypted or encoded differently depending on the method:

| Method | How the share is protected | Storage |
|---|---|---|
| **Passkey (WebAuthn PRF)** | Encrypted using a key derived from the passkey's PRF output — hardware-bound, phishing-resistant | Server (encrypted) |
| **Recovery Phrase** | Encoded as a BIP39-style 24-word mnemonic that the user writes down | User (offline) |
| **Backup File** | Encrypted with a user-chosen password using Argon2id + AES-GCM, stored as a downloadable JSON file | User (file) |
| **Email Backup** | The encrypted backup share is emailed to the user's verified recovery email address | User (email) |

### Normal Login (Same Device)

When a user logs in on a device where they previously set up their key:

1. The **device share** is read from IndexedDB.
2. The **auth share** is fetched from the server (requires a valid auth token).
3. The two shares are combined to reconstruct the private key.
4. The key is used for the session and never persisted in plaintext.

### New Device Login

When a user logs in on a new device (no device share available):

1. Authentication succeeds, but the device share is missing.
2. The user enters **recovery mode** and is prompted to use one of their recovery methods.
3. The **recovery share** (from passkey, phrase, backup, or email) is combined with the **auth share** to reconstruct the key.
4. A **new device share** is generated and stored locally. The key is re-split so that all three shares are fresh.

---

## Security Levels

LearnCard defines three security levels based on how many recovery methods a user has configured:

| Level | Requirements | Risk Profile |
|---|---|---|
| **Basic** | Device share + server share only | If the user loses their device and clears storage, the key is **unrecoverable**. |
| **Enhanced** | + at least one recovery method (passkey or phrase) | The user can recover on a new device using the recovery method + server share. |
| **Advanced** | + multiple recovery methods | Maximum resilience — multiple independent paths to recovery. |

Users are prompted to set up recovery methods after their initial key setup. A persistent banner appears until at least one recovery method is configured.

---

## Share Versioning

When shares are rotated (e.g., after a recovery event or contact method upgrade), the server retains **previous auth share versions** in a history array. This ensures that recovery methods created against an older share version can still be used — the server can serve the correct historical auth share by `shareVersion` number.

Orphaned recovery methods (those referencing share versions no longer in the history) are automatically pruned.

---

## Server-Side Encryption

The auth share is never stored in plaintext on the server. The encryption flow:

1. A **Data Encryption Key (DEK)** is randomly generated per share.
2. The share is encrypted with the DEK using **AES-256-GCM**.
3. The DEK itself is encrypted using a **Key Encryption Key (KEK)** derived from the server's `SEED` environment variable via **HKDF-SHA256**.
4. Both the encrypted share and the encrypted DEK are stored together.

This means even a database breach does not expose the shares without the server's `SEED`.

---

## Migration from Web3Auth

Existing users who were on the previous Web3Auth-based key management system are automatically detected and migrated:

1. The **AuthCoordinator** detects that the user has an existing account but no SSS record on the server.
2. It enters a `needs_migration` state.
3. The legacy private key is retrieved from the cached Web3Auth Single Factor Auth (SFA) key.
4. The key is split into three shares using SSS, and the shares are stored as described above.
5. The user is marked as migrated on the server.
6. The user is prompted to set up recovery methods.

Migration is controlled by the `REACT_APP_ENABLE_SSS_MIGRATION` environment variable.

---

## Key Takeaways

- Private keys are **never stored whole** — they are always split into shares.
- **2-of-3 threshold** — any two shares can reconstruct the key, but one share alone reveals nothing.
- **Server shares are encrypted at rest** with AES-256-GCM using HKDF-derived keys.
- **Multiple recovery methods** provide resilience against device loss.
- **Share versioning** ensures backward compatibility when shares are rotated.
- The entire system is **self-hosted** — no third-party key custody service is involved.
