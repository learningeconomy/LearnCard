---
'@learncard/types': minor
---

Add `status: StatusCheckEntry[]` to `VerificationCheck`.

Surfaces the structured `credentialStatus` results emitted by `@learncard/didkit-plugin` (via the upstream `ssi-ldp::StatusCheckEntry` change in TaylorBeeston/ssi). Each entry exposes `entryType`, `statusPurpose`, `isSet`, `statusListCredential`, and `statusListIndex`, so callers can render structured "revoked" / "suspended" / "active" UI without string-matching the human-readable `errors` array.

Field is `.optional()` because the underlying serializer omits it when no `credentialStatus` was present on the credential, which means older WASM builds that pre-date this change still validate against the schema.
