---
description: LCA API routes for SSS key management and QR login
---

# LCA API — Key Management & QR Login

The LCA API (`lca-api`) provides server-side routes for SSS key share storage, recovery method management, and cross-device QR login. These routes are consumed by the [SSS Key Manager](../sss-key-manager.md) client library.

## Base URL

The key management routes are served under the same base URL as the rest of the LCA API (e.g., `https://api.example.com/api`).

---

## Authentication

Routes use two authentication mechanisms:

- **Auth Token** — a Firebase (or other provider) ID token, passed in the request body as `authToken` + `providerType`. The server verifies the token and extracts the user's contact method.
- **DID Auth** — a signed DID-Auth Verifiable Presentation (VP) JWT, passed as `Authorization: Bearer <jwt>`. Used for routes that modify key data.

Routes marked **open** require an auth token in the body but no DID-Auth header. Routes marked **DID** require both.

---

## Key Management Routes (`/keys/*`)

### Get Auth Share

Retrieve the encrypted auth share for the authenticated user.

| | |
|---|---|
| **Endpoint** | `POST /keys/auth-share` |
| **Auth** | Auth Token (body) |

**Request Body:**

```json
{
    "authToken": "firebase-id-token",
    "providerType": "firebase",
    "contactMethod": { "type": "email", "value": "user@example.com" },
    "shareVersion": 2
}
```

- `shareVersion` (optional) — request a specific historical share version. If omitted, returns the latest.

**Response (200):**

```json
{
    "exists": true,
    "authShare": {
        "encryptedData": "...",
        "encryptedDek": "...",
        "iv": "..."
    },
    "securityLevel": "enhanced",
    "recoveryMethods": [{ "type": "passkey", "createdAt": "2025-01-15T..." }],
    "maskedRecoveryEmail": "u***@example.com",
    "shareVersion": 2,
    "primaryDid": "did:key:z6Mk..."
}
```

---

### Store Auth Share

Store or rotate the encrypted auth share. Requires DID-Auth.

| | |
|---|---|
| **Endpoint** | `PUT /keys/auth-share` |
| **Auth** | DID Auth (header) |

**Request Body:**

```json
{
    "authToken": "firebase-id-token",
    "providerType": "firebase",
    "contactMethod": { "type": "email", "value": "user@example.com" },
    "authShare": {
        "encryptedData": "...",
        "encryptedDek": "...",
        "iv": "..."
    },
    "primaryDid": "did:key:z6Mk...",
    "keyProvider": "sss"
}
```

**Response (200):**

```json
{ "success": true }
```

---

### Add Recovery Method

Add a recovery method (passkey, backup, phrase, or email). Requires DID-Auth.

| | |
|---|---|
| **Endpoint** | `POST /keys/recovery` |
| **Auth** | DID Auth (header) |

**Request Body:**

```json
{
    "authToken": "firebase-id-token",
    "providerType": "firebase",
    "type": "passkey",
    "credentialId": "base64url-credential-id",
    "encryptedShare": "encrypted-share-data",
    "shareVersion": 2
}
```

**Response (200):**

```json
{ "success": true }
```

---

### Get Recovery Share

Retrieve an encrypted recovery share by type and credential ID.

| | |
|---|---|
| **Endpoint** | `GET /keys/recovery` |
| **Auth** | Query parameters |

**Query Parameters:**

- `contactMethodType` — `email` or `phone`
- `contactMethodValue` — the email or phone number
- `type` — recovery method type (e.g., `passkey`)
- `credentialId` — the passkey credential ID

**Response (200):**

```json
{
    "encryptedShare": "...",
    "shareVersion": 2
}
```

---

### Add Recovery Email

Send a 6-digit verification code to the specified email address.

| | |
|---|---|
| **Endpoint** | `POST /keys/recovery-email/add` |
| **Auth** | DID Auth (header) |

**Request Body:**

```json
{
    "authToken": "firebase-id-token",
    "providerType": "firebase",
    "email": "recovery@example.com"
}
```

**Response (200):**

```json
{ "success": true }
```

---

### Verify Recovery Email

Verify the 6-digit code and persist the recovery email.

| | |
|---|---|
| **Endpoint** | `POST /keys/recovery-email/verify` |
| **Auth** | DID Auth (header) |

**Request Body:**

```json
{
    "authToken": "firebase-id-token",
    "providerType": "firebase",
    "code": "123456"
}
```

**Response (200):**

```json
{
    "success": true,
    "maskedRecoveryEmail": "r***@example.com"
}
```

---

### Get Recovery Email

Retrieve the masked recovery email for a user.

| | |
|---|---|
| **Endpoint** | `GET /keys/recovery-email` |
| **Auth** | Query parameters |

**Query Parameters:**

- `contactMethodType` — `email` or `phone`
- `contactMethodValue` — the email or phone number

**Response (200):**

```json
{
    "maskedRecoveryEmail": "r***@example.com"
}
```

---

### Send Email Backup

Send the encrypted backup share to the user's recovery email (or a specified email).

| | |
|---|---|
| **Endpoint** | `POST /keys/email-backup` |
| **Auth** | Auth Token (body) |

**Request Body:**

```json
{
    "authToken": "firebase-id-token",
    "providerType": "firebase",
    "encryptedShare": "...",
    "email": "specific@example.com",
    "useRecoveryEmail": false
}
```

Either `email` or `useRecoveryEmail: true` must be provided (not both).

**Response (200):**

```json
{ "success": true }
```

---

### Upgrade Contact Method

Upgrade a user's primary contact method (e.g., phone → email). Verifies an OTP code, links the email to the Firebase account, and updates the server record.

| | |
|---|---|
| **Endpoint** | `POST /keys/upgrade-contact-method` |
| **Auth** | Auth Token (body) |

**Request Body:**

```json
{
    "authToken": "firebase-id-token",
    "providerType": "firebase",
    "oldContactMethod": { "type": "phone", "value": "+1234567890" },
    "newContactMethod": { "type": "email", "value": "user@example.com" },
    "code": "123456"
}
```

**Response (200):**

```json
{
    "success": true,
    "customToken": "firebase-custom-token"
}
```

The client should re-authenticate with the returned custom token.

---

### Mark Migrated

Mark a user as migrated from Web3Auth to SSS.

| | |
|---|---|
| **Endpoint** | `POST /keys/migrate` |
| **Auth** | Auth Token (body) |

**Request Body:**

```json
{
    "authToken": "firebase-id-token",
    "providerType": "firebase"
}
```

**Response (200):**

```json
{ "success": true }
```

---

### Delete User Key

Delete all key data for a user. Requires DID-Auth.

| | |
|---|---|
| **Endpoint** | `POST /keys/delete` |
| **Auth** | DID Auth (header) |

**Request Body:**

```json
{
    "authToken": "firebase-id-token",
    "providerType": "firebase"
}
```

**Response (200):**

```json
{ "success": true }
```

---

## QR Login Routes (`/qr-login/*`)

These routes implement the ephemeral relay for [cross-device login](../../core-concepts/identities-and-keys/cross-device-login.md). All session data lives in Redis with short TTLs.

### Create Session

Create a new QR login session with the new device's ephemeral public key.

| | |
|---|---|
| **Endpoint** | `POST /qr-login/session` |
| **Auth** | None |

**Request Body:**

```json
{
    "publicKey": "base64-encoded-ephemeral-public-key"
}
```

**Response (200):**

```json
{
    "sessionId": "uuid",
    "shortCode": "123456"
}
```

---

### Look Up Session

Look up a session by its ID or short code.

| | |
|---|---|
| **Endpoint** | `GET /qr-login/session/{lookup}` |
| **Auth** | None |

**Response (200):**

```json
{
    "sessionId": "uuid",
    "publicKey": "base64-encoded-ephemeral-public-key",
    "status": "pending"
}
```

---

### Approve Session

Post the encrypted device share payload from the logged-in device.

| | |
|---|---|
| **Endpoint** | `POST /qr-login/session/{sessionId}/approve` |
| **Auth** | Auth Token (body) |

**Request Body:**

```json
{
    "authToken": "firebase-id-token",
    "providerType": "firebase",
    "encryptedPayload": "base64-encoded-encrypted-share"
}
```

**Response (200):**

```json
{ "success": true }
```

---

### Send Push Notification

Send a push notification to the user's other devices to prompt approval.

| | |
|---|---|
| **Endpoint** | `POST /qr-login/notify` |
| **Auth** | Auth Token (body) |

**Request Body:**

```json
{
    "authToken": "firebase-id-token",
    "providerType": "firebase",
    "sessionId": "uuid",
    "shortCode": "123456"
}
```

**Response (200):**

```json
{
    "sent": true,
    "deviceCount": 2
}
```
