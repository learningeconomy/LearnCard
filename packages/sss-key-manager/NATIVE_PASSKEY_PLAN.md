# Native Passkey Recovery — Implementation Plan

> **Status:** Not started — passkey recovery is currently hidden on native Capacitor apps.
> **Priority:** Medium — password and recovery phrase methods cover native users today.

## Problem

Our passkey recovery uses the **WebAuthn PRF extension** to derive an AES-GCM key
directly from a passkey assertion. This key encrypts/decrypts the SSS recovery share
entirely client-side — no server round-trip needed for the secret material.

This does **not** work on native Capacitor apps because:

1. **iOS WKWebView** does not expose `navigator.credentials` (WebAuthn). Only Safari,
   `SFSafariViewController`, and `ASWebAuthenticationSession` have access.
2. **Android WebView** also lacks WebAuthn support. Only Chrome Custom Tabs have it.
3. Even if we bridge to native passkey APIs, **Apple's `ASAuthorizationController`
   does not support the PRF extension** as of iOS 18. Android's Credential Manager
   has limited PRF support as well.

### Current state

- `RecoverySetupModal.tsx` and `RecoveryFlowModal.tsx` filter out the passkey
  tab/option when `Capacitor.isNativePlatform()` is true.
- `isWebAuthnSupported()` in `passkey.ts` returns `false` in native WebViews, so
  even if the UI filter were bypassed, the code fails gracefully.
- Password and recovery phrase methods work on all platforms.

## Recommended Architecture

Since PRF is unavailable natively, we propose a **server-assisted passkey recovery**
model for native. The passkey authenticates the user via native APIs, then the server
releases the recovery share over an authenticated channel.

### High-level flow

```
┌─────────────┐     1. Native passkey assertion     ┌──────────────┐
│  Mobile App  │ ──────────────────────────────────► │  Native OS   │
│  (Capacitor) │ ◄────────────────────────────────── │  Passkey API │
│              │     2. Signed assertion              └──────────────┘
│              │
│              │     3. Send assertion to server      ┌──────────────┐
│              │ ──────────────────────────────────► │  SSS Server  │
│              │ ◄────────────────────────────────── │              │
│              │     4. Server verifies assertion,    │              │
│              │        returns recovery share        └──────────────┘
│              │
│              │     5. Reconstruct private key
│              │        from device share + recovery share
└─────────────┘
```

### Comparison with current web flow

| Aspect | Web (current) | Native (proposed) |
|--------|--------------|-------------------|
| Passkey API | WebAuthn (`navigator.credentials`) | Native: `ASAuthorizationController` (iOS) / Credential Manager (Android) |
| Key derivation | PRF extension → AES-GCM key | N/A — not needed |
| Share encryption | Client-side AES-GCM with PRF-derived key | Server-side: share stored encrypted with server key |
| Share delivery | Encrypted share stored on server, decrypted client-side | Server verifies passkey assertion, releases share over TLS |
| Trust model | Zero-knowledge (server never sees plaintext share) | Server sees plaintext share momentarily during delivery |
| Offline recovery | Yes (PRF works offline after initial setup) | No — requires server connectivity |

### Security considerations

The native approach has a **weaker trust model** than the web PRF approach: the
server momentarily handles the plaintext recovery share. Mitigations:

1. Use TLS certificate pinning on native to prevent MITM.
2. The recovery share alone is insufficient to reconstruct the key — the device
   share (stored in encrypted SQLite) is also required.
3. Rate-limit recovery attempts per credential to prevent brute-force.
4. Log all recovery events for audit.

If zero-knowledge is a hard requirement, an alternative is to use the passkey's
**`largeBlob` extension** (supported on some Android devices) to store the encrypted
share directly on the authenticator. However, this has poor cross-platform support
and is not available on iOS.

## Implementation Steps

### Phase 1: Capacitor Passkey Plugin

Create or adopt a Capacitor plugin that wraps native passkey APIs.

**Option A — Custom plugin (recommended):**

```
packages/capacitor-passkey/
├── ios/
│   └── Plugin/
│       ├── PasskeyPlugin.swift          # ASAuthorizationController bridge
│       └── PasskeyPlugin.m              # ObjC registration
├── android/
│   └── src/main/java/.../
│       └── PasskeyPlugin.kt             # CredentialManager bridge
├── src/
│   ├── definitions.ts                   # TypeScript interface
│   ├── index.ts                         # Capacitor plugin registration
│   └── web.ts                           # Web fallback (delegates to WebAuthn)
├── package.json
└── tsconfig.json
```

**TypeScript interface:**

```typescript
export interface PasskeyPlugin {
    /**
     * Create a new passkey credential (registration).
     * On web, delegates to navigator.credentials.create().
     * On native, uses ASAuthorizationController / CredentialManager.
     */
    createCredential(options: {
        userId: string;
        userName: string;
        rpId: string;
        rpName: string;
        challenge: string; // base64
    }): Promise<{
        credentialId: string;   // base64
        publicKey: string;      // base64 (COSE or SPKI)
        attestation: string;    // base64 (CBOR attestation object)
    }>;

    /**
     * Assert an existing passkey credential (authentication).
     * On web, delegates to navigator.credentials.get().
     * On native, uses ASAuthorizationController / CredentialManager.
     */
    getAssertion(options: {
        rpId: string;
        challenge: string;      // base64
        allowCredentials?: { id: string; type: string }[];
    }): Promise<{
        credentialId: string;   // base64
        authenticatorData: string; // base64
        clientDataJSON: string;    // base64
        signature: string;         // base64
    }>;

    /**
     * Check if passkeys are available on this platform.
     */
    isAvailable(): Promise<{ available: boolean }>;
}
```

**Option B — Existing community plugin:**

- `@darkedges/capacitor-native-webauthn` (v0.0.4) — wraps native APIs but is
  low-maturity and not actively maintained. Could be forked.

### Phase 2: Server-Side Assertion Verification

Add a new endpoint to the SSS key server:

```
POST /keys/recovery/passkey-assert
Authorization: Bearer <firebase-id-token>
Content-Type: application/json

{
    "credentialId": "<base64>",
    "authenticatorData": "<base64>",
    "clientDataJSON": "<base64>",
    "signature": "<base64>",
    "providerType": "firebase"
}
```

Server flow:
1. Look up the stored public key for this `credentialId` + user.
2. Verify the WebAuthn assertion signature using the stored public key.
3. Verify the challenge (must match a server-issued nonce).
4. If valid, decrypt and return the recovery share.

Also add a registration endpoint:

```
POST /keys/recovery/passkey-register
Authorization: Bearer <firebase-id-token>
Content-Type: application/json

{
    "credentialId": "<base64>",
    "publicKey": "<base64>",
    "attestation": "<base64>",
    "recoveryShare": "<encrypted-share>",
    "providerType": "firebase"
}
```

### Phase 3: Integrate into SSS Strategy

Update `sss-strategy.ts` to support a native passkey recovery path:

```typescript
// In executeRecovery, detect platform and branch:
if (input.method === 'passkey') {
    if (Capacitor.isNativePlatform()) {
        // Use the Capacitor plugin for assertion
        const assertion = await PasskeyPlugin.getAssertion({ ... });
        // Send assertion to server for verification + share release
        const { recoveryShare } = await fetch('/keys/recovery/passkey-assert', {
            body: JSON.stringify(assertion),
        });
        // Reconstruct key from device share + recovery share
        return reconstructFromShares(deviceShare, recoveryShare);
    } else {
        // Existing web PRF flow
        return existingPasskeyRecovery(input);
    }
}
```

### Phase 4: UI Updates

Remove the `Capacitor.isNativePlatform()` filter from:
- `RecoverySetupModal.tsx` (line ~114)
- `RecoveryFlowModal.tsx` (line ~133)

The `isAvailable()` check from the plugin replaces the `isWebAuthnSupported()` check.

### Phase 5: Testing

- **Unit tests:** Mock the Capacitor plugin and verify the assertion flow.
- **E2E tests:** Test passkey registration and recovery on iOS Simulator / Android
  Emulator (requires Xcode / Android Studio).
- **Manual testing:** Verify biometric prompts appear correctly on physical devices.

## Dependencies

| Dependency | Purpose | Status |
|-----------|---------|--------|
| iOS 16+ | `ASAuthorizationController` passkey support | Available |
| Android API 34+ | Credential Manager passkey support | Available |
| Capacitor 5+ | Plugin bridge | Already in use |
| SSS key server | New endpoints for assertion verification | Needs implementation |

## Estimated Effort

| Phase | Effort |
|-------|--------|
| Phase 1: Capacitor plugin | 3-5 days |
| Phase 2: Server endpoints | 2-3 days |
| Phase 3: Strategy integration | 1-2 days |
| Phase 4: UI updates | 0.5 day |
| Phase 5: Testing | 2-3 days |
| **Total** | **~2 weeks** |

## Files That Will Change

- `packages/sss-key-manager/src/passkey.ts` — add native passkey adapter
- `packages/sss-key-manager/src/sss-strategy.ts` — branch recovery by platform
- `apps/learn-card-app/src/components/recovery/RecoverySetupModal.tsx` — remove native filter
- `apps/learn-card-app/src/components/recovery/RecoveryFlowModal.tsx` — remove native filter
- SSS key server — new `/keys/recovery/passkey-assert` and `/keys/recovery/passkey-register` endpoints
- New package: `packages/capacitor-passkey/` (or community plugin)

## References

- [Apple ASAuthorizationController docs](https://developer.apple.com/documentation/authenticationservices/asauthorizationcontroller)
- [Android Credential Manager docs](https://developer.android.com/identity/sign-in/credential-manager)
- [WebAuthn PRF extension spec](https://w3c.github.io/webauthn/#prf-extension)
- [darkedges/capacitor-native-webauthn](https://github.com/darkedges/capacitor-native-webauthn) — community plugin reference
- [WebAuthnKit-iOS](https://github.com/lyokato/WebAuthnKit-iOS) — native iOS WebAuthn library
