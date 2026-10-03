# LC-2222 — Managed Resume Builder publication

Approved sprint follow-up to LC-2190. Jira: https://welibrary.atlassian.net/browse/LC-2222. Independent branch based on current main; LC-2220/2221 remain in PR #1646 for manual review.

## Access and attachment design

New publications use the existing managed share lifecycle and `/s/:id#key` viewer. Preserve the generated PDF bytes and stage AES-256-GCM encrypted chunks in the existing immutable LearnCloud share-content store. A Brain gateway authorizes every chunk against the exact committed share ID, content version, attachment ID, active state, expiry and passcode. It rechecks committed state after reading storage. There is no independently reusable provider URL. The PDF key, digest, exact length and descriptor live inside the signed LER-RS credential and encrypted share manifest; Brain commits only attachment ID and count. Owner credentials and retry checkpoints are also encrypted.

The initial inline-PDF design was rejected after measurement: a representative one-page export was 286,991 bytes; multi-page exports reached 571,739 and 856,067 bytes. Lossless compression and high-quality JPEG did not fit typical multi-page exports within the existing 512 KiB envelope limit. See pdf-size-probe.md. Chunking preserves PDF quality and the existing service request/envelope limits.

Limit one PDF to 4 MiB, with raw chunks of 256 KiB (at most 16). Each request remains below 1 MiB and each encrypted envelope below 512 KiB. Validate MIME, PDF magic, length and SHA-256, bind AES additional authenticated data to the share/version/attachment/index/count/length, and validate exact chunk response bindings. Never silently truncate credentials or lower PDF fidelity. The server checks all staged chunks before commitment and pins the attachment stage against concurrent deletion; incomplete attachments cannot become active.

Server-visible inventory: owner/profile and share association, opaque attachment UUID, version, count, ciphertext sizes/timing, staging state and cleanup metadata. The gateway/provider cannot read PDF bytes, PDF key, hash, personal fields or credential bodies from these encrypted objects. Existing managed-share metadata still includes title, counts and lifecycle policy. Do not add tracking or input logging. LearnCloud receives ciphertext and internal immutable tuple metadata; no Filestack upload occurs. Authenticated internal storage paths cannot bypass the public managed policy.

Retention: new links expire after 30 days by default; expiry blocks access immediately, independently of eventual physical cleanup. Stop/content replacement/abandon queue bounded attachment cleanup through existing maintenance. Expired committed ciphertext is retained with the original managed lifecycle so the owner can extend expiry; expiry alone does not physically delete it. Never-committed stages expire after 24 hours and are collected in batches of 10; at most 8 live staging sets per owner. Owner private resume records retain prior publication URI history; same-browser IndexedDB encrypted retry checkpoints are deleted after successful finalization or safe explicit discard. Retry recovery is not cross-device. The encrypted checkpoint is bounded to 12 MiB in IndexedDB. A successful passcode check issues a 60-second HMAC grant bound to the exact owner/share/version/attachment/passcode verifier/source address; it amortizes the existing six-guesses-per-minute budget across chunks while each chunk still checks current policy. Chunk staging has its own 120-writes-per-hour owner budget; managed create/update keeps the existing 60-writes-per-hour budget. Previously downloaded copies remain beyond our control.

A future request for a stopped/expired link cannot retrieve either credential or PDF bytes. The download card checks active status/content version before and after retrieval; bytes are never preloaded and no native PDF iframe is rendered. Chromium smoke testing confirmed a sandboxed PDF iframe cannot display the browser plugin. Previously decrypted local download object URLs are released after handing bytes to the browser. Previously decrypted/saved copies cannot be revoked. No claims of remote-copy retraction. Existing `/verify/resume?uri&seed&pin` links remain supported with their existing weaker boundary; new UI explains that older URLs and copies are not retracted by republishing.

## Publication and recovery

Capture account/profile and Resume Builder snapshot before awaits. Reject late results after logout or account changes, including away/back switches. Build from visible fields only: do not restore hidden name/email from currentUser. Use static diagnostics, with no filenames, hashes, selected URIs, credential bodies, capabilities or exception bodies logged.

Reuse prepareShare/prepareShareUpdate, encrypted owner recovery, expected-version checks, clientRequestId, and classifySharePublication. A new resume creates one managed entry with a 30-day default expiry. Republish an active associated resume updates that same entry and preserves the URL key and expiry; an inactive/missing associated entry must fail explicitly, never create a replacement silently. Resume indexes retain only owner-side shareId/status metadata; recover the key from owner recovery to copy/open the existing URL.

Stage only encrypted owner credentials. Retain the exact prepared attempt across uncertain create/update outcomes and retry/reconcile that attempt before allowing a new one. Pending or ambiguous outcomes must not show publication success. Index-finalization failure after a successful commit must recover without a second share. Clean definitely unreferenced staged credentials; preserve uncertain/active data. Surface cleanup failures with a generic warning. Do not mutate another account's store or index.

## Delegated work

1. Backend attachment gateway: typed owner staging/cleanup and public reads, atomic attachment binding and staging pins, lifecycle cleanup and access/race tests. The primary agent owns PDF cryptography, chunk integrity, real signing tests, size probe and integration review.
2. Publication adapter + hook: managed create/update/recovery, encrypted staging/index metadata, account isolation and failure tests. Own useIssueTcpResume, new publication modules, existing-resume/index hydration types/helpers, and related tests.
3. Owner UI + managed recipient integration: remove automatic legacy link creation from Resume Builder/ResumeShareLink; show returned/recovered managed link; add exact protected PDF download card with lifecycle checks to existing managed viewer; localized error/limitation copy and integration tests. Own ResumeBuilder/ResumeShareLink, managed viewer/new recipient component, locale messages and UI tests. Leave legacy viewer intact.

The primary agent reviews all changes, fixes integration gaps, runs combined unit/type/lint/localization/safe-area checks and relevant lifecycle tests, then creates an independent draft PR. No production deployment.

## Review checklist

- New publication creates one Shared item; update preserves id/key and advances content version.
- PDF upload provider is never invoked and server-visible envelope contains no PDF/plaintext/contact/URI canaries.
- Size/integrity failures happen before an accessible publication; no partial selected content.
- HTTP/create ambiguity, pending operation, index failure, clear retry, stale version and account-switch tests.
- Expiry/stop and stale cached download deny new PDF access; object URLs are revoked.
- Legacy viewer unchanged; older public URLs and downloaded-copy limitations stated honestly.
- Actual local test evidence recorded separately from deployed service/browser QA.
