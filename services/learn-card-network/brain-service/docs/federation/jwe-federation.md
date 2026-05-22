# JWE Federation Handshake

## Status

Phase 4.5 — The current implementation already satisfies the core requirement.

## Behavior

When a cross-instance resolve request arrives at `/storage/resolve` for an `encrypted-only` credential:

1. The server returns the JWE blob as-is — it does NOT decrypt it
2. The requesting instance receives the opaque JWE
3. Only a party with a recipient key (i.e., a DID listed in the JWE recipients) can decrypt

This is enforced by the `StoredCredential` discriminator (Phase 3.5): the resolve path handles both `plaintext` and `jwe` kinds, returning JWE payloads without modification.

## Requirements for Cross-Instance Decryption

For a requesting instance to decrypt a JWE credential:
- The requesting user's DID must be in the JWE recipients list
- The user's private key material must be available (device key or recovery key)

## Recovery Key

Phase 3.3 added `getJweRecipients(userDid, recoveryKeyDid?)` in `learn-card-base`. When a recovery key DID is provided, it is included as a second JWE recipient. This ensures the user can decrypt their credentials even after device loss.

## No Server Decryption

The brain-service has no decryption capability over user credentials (Phase 1.6 deleted `decryptCredential`). Cross-instance federation therefore cannot leak plaintext — the server can only forward the JWE blob.
