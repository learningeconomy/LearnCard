---
description: How users securely transfer key access to a new device via QR code
---

# Cross-Device Login (QR)

## What is this section about?

This section explains how LearnCard enables users to log in on a new device by scanning a QR code (or entering a short numeric code) from an already-authenticated device. This flow securely transfers the **device share** from the old device to the new one without the server ever seeing the share in plaintext.

## Why is this important?

When a user signs in on a new device, they normally need to use a [recovery method](account-recovery.md) to reconstruct their key. QR login provides a faster alternative — if the user has another device already logged in, they can transfer the device share directly, skipping the recovery flow entirely.

---

## How It Works

The QR login flow uses **ephemeral ECDH (Elliptic Curve Diffie-Hellman) key exchange** to establish an encrypted channel between two devices. The server acts only as a relay — it never sees the device share in plaintext.

### Flow Diagram

```
Device B (new)                  Server (Redis)               Device A (logged in)
     │                              │                              │
     │── createSession(pubKey) ────▶│                              │
     │◀── sessionId + shortCode ────│                              │
     │                              │                              │
     │    (display QR code or       │                              │
     │     short numeric code)      │                              │
     │                              │                              │
     │                              │◀── scan QR / enter code ─────│
     │                              │                              │
     │                              │◀── approve(encryptedShare) ──│
     │                              │                              │
     │── poll for payload ─────────▶│                              │
     │◀── encryptedPayload ─────────│                              │
     │                              │                              │
     │  (decrypt locally with       │                              │
     │   ephemeral private key)     │                              │
     │                              │                              │
     │  ✓ Device share received     │                              │
```

### Step by Step

1. **Device B** (the new device) generates an **ephemeral ECDH key pair** and sends the public key to the server, creating a session.

2. The server returns a **session ID** and a **short numeric code** (6 digits). Device B displays these as a QR code and/or a typeable code.

3. **Device A** (the already-logged-in device) scans the QR code or the user types the short code. Device A looks up the session and retrieves Device B's ephemeral public key.

4. Device A computes the **shared secret** using ECDH (its own key + Device B's public key), encrypts the device share with AES-GCM using the shared secret, and posts the encrypted payload to the server.

5. Device B **polls** the server for the encrypted payload. Once it arrives, Device B computes the same shared secret (its own private key + Device A's public key) and decrypts the device share.

6. Device B now has the device share. Combined with the auth share from the server, it can reconstruct the private key.

---

## Security Properties

| Property | Guarantee |
|---|---|
| **End-to-end encryption** | The device share is encrypted with a shared secret derived via ECDH. The server only relays opaque bytes. |
| **Ephemeral keys** | A new key pair is generated for each session. No long-lived key material is exchanged. |
| **Short-lived sessions** | Sessions are stored in Redis with a short TTL and are automatically evicted. |
| **No plaintext on server** | The server never has access to the ECDH private key and cannot decrypt the payload. |
| **One-time use** | Once a session is approved, it cannot be reused. |

---

## Push Notifications

To improve the user experience, Device B can optionally send a **push notification** to Device A, prompting the user to open the QR approver flow. This is fire-and-forget — if the notification fails, the user can still manually open the app on Device A.

---

## Server Routes

The QR login relay is implemented as a set of routes on the `lca-api` server:

| Route | Method | Purpose |
|---|---|---|
| `/qr-login/session` | POST | Create a session with Device B's ephemeral public key |
| `/qr-login/session/{lookup}` | GET | Look up a session by ID or short code |
| `/qr-login/session/{sessionId}/approve` | POST | Post the encrypted share payload (Device A) |
| `/qr-login/notify` | POST | Send a push notification to the user's other devices |

All session data lives in **Redis** with short TTLs. No session data is persisted to a database.

---

## When to Use QR Login vs. Recovery

| Scenario | Recommended approach |
|---|---|
| User has another device nearby and logged in | **QR Login** — fastest path, no recovery method needed |
| User lost their only device | **Recovery** — use passkey, phrase, backup file, or email backup |
| User is setting up for the first time | Neither — the key is generated fresh |

---

## Key Takeaways

- QR login lets users transfer their device share to a new device **without the server seeing the share**.
- The transfer uses **ephemeral ECDH** for end-to-end encryption between the two devices.
- Sessions are **short-lived** (Redis TTL) and **one-time use**.
- QR login is an **alternative to recovery** — it's faster when the user has another authenticated device available.
