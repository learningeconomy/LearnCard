---
'@learncard/types': minor
'@learncard/helpers': minor
'@learncard/network-brain-service': minor
'@learncard/network-plugin': minor
'@learncard/vc-plugin': minor
'@learncard/encryption-plugin': minor
---

Add holder-authorized pre-accept managed delivery receipts and shared binding validation.
Allow refresh callers to pin the original public status and refresh service, and reject
changed managed versions without a strictly newer signed validFrom. Verify managed
deliveries before claim previews, acceptance and local indexing, and retain their
validated binding with the local index record.

Add a strict ciphertext-only holder handoff contract, an explicit-recipient DAG JWE
primitive that does not add the caller, and a shared exact recipient-key-set check.

Enable server-side holder-mode (student-only encrypted) managed sends and publishes.
`boost.prepareRefreshableSend({ encryption: 'holder' })` returns the exact
key-agreement recipient set (holder + current managers) to encrypt to and pins the
refresh aggregate to holder mode. New issuer routes
`credentialRefresh.sendHolderEncryptedRefreshable`,
`credentialRefresh.publishHolderEncryptedRefreshable` and
`credentialRefresh.getEncryptionRecipients` accept and deliver an already-encrypted
handoff without ever decrypting it; a manager-set change since prepare fails with
`CONFLICT`/`RECIPIENTS_CHANGED` instead of silently narrowing who can decrypt. A
holder-mode aggregate rejects inbox recipients, signed-credential-only sends, mixed
network/holder sends on the same aggregate, and signing-authority publication.

SDK support: `send({ refresh: true, encryption: 'holder' })` builds and signs the
credential locally exactly as the network-mode path does, then encrypts it to the
prepared recipient set with `createDagJweExact`, checks the resulting JWE's recipient
set and the signed credential's binding before ever calling the network, and sends
only the ciphertext handoff via `credentialRefresh.sendHolderEncryptedRefreshable`. A
`RECIPIENTS_CHANGED` conflict is retried once after re-fetching
`credentialRefresh.getEncryptionRecipients`. The new `publishHolderEncryptedRefreshable`
method does the same for later versions with an explicit `notify` flag. Both reject
client-side for inbox recipients, a caller-supplied `signedCredential`, and wallets
without local signing or the Encryption plugin; an old server response missing
`recipientKeyIds` is rejected rather than silently sent in network mode.
