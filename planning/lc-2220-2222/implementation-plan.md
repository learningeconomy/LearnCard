# Approved private sharing follow-ups

Approved for the sprint by Donny, 2026-10-02. Baseline: origin/main, ca397d6a81371127f1b242d8da2fc13f51ac3f87.

## Product decisions

Verifier receipts are opt-in, limited to 90 days and 500 entries. Do not record for managed accounts; guardian visibility needs a separate design. The learner approved these defaults on 2026-10-02. Disabling recording keeps previous history; clearing history keeps the preference. A receipt describes transport success or CHAPI handoff, never verifier acceptance or revocability. A credential title is a reminder, not a list of disclosed claims.

## Review order

1. [LC-2220](https://welibrary.atlassian.net/browse/LC-2220): encrypted custom-document adapter, immutable consent snapshots, protocol integrations, diagnostic hardening, privacy and failure tests.
2. [LC-2221](https://welibrary.atlassian.net/browse/LC-2221): separate Shared with verifiers group, opt-in/delete/clear controls, identity isolation and telemetry suppression before plaintext loads, accessible localized UI and interaction tests. Depends on LC-2220.
3. [LC-2222](https://welibrary.atlassian.net/browse/LC-2222): Resume Builder publication through the managed share service, protected PDF delivery, update/recovery/cleanup, legacy compatibility, expiry/revocation tests. Independent of verifier history.

Full research: https://welibrary.atlassian.net/wiki/spaces/LC/pages/1026359297

## LC-2220 implementation contract

Use LearnCloud custom documents outside the credential index. Encrypt an allowlisted nested payload to the captured holder before passing it to the generic Cloud adapter; this prevents tokenization of verifier names, purposes and titles even if custom-field configuration changes. The only lookup is one opaque scope token. Use explicit cursor pagination, includeAssociatedDids=false, and validated exact document IDs for deletion. Do not use the generic read loop, broad delete, or multi-field AND queries (Cloud implements those as OR).

Append immutable settings records with a consent revision and history generation. Every toggle changes the consent revision; clear changes both revision and generation while preserving enabled. A disclosure captures the current holder and revision before transport. Saving rechecks that consent after transport; stale attempts cannot create visible receipts in a cleared generation. Writes never retry or resend a presentation after an uncertain Cloud response. Reconcile by random event ID, and deduplicate reads.

No claims, VP, credential IDs/URIs, nonces, response paths/query strings or capabilities in receipts. VC-API/CHAPI currently do not display a requester name/purpose at credential review, so omit those fields rather than silently inferring a recipient. Keep only visible chosen titles. No Brain sharing edges, analytics or credential-index writes.

Maintenance prunes expired/overflow records on successful access. Offline clients cannot promise physical deletion exactly at day 90. Concurrent devices can temporarily exceed 500 stored records; subsequent successful maintenance converges. Reads remain capped at 500 visible entries. Report failed cleanup honestly. Existing Cloud APIs provide no transaction/CAS; do not describe these limits as atomic cross-device guarantees.

Tests: real holder encryption and unrelated-key failure; service-visible envelope canaries; pagination and associated DID exclusion; no index/Brain writes; disabled/managed/cancel/DID-only behavior; protocol failure/success/handoff; uncertain persistence without transport retry; clear/toggle during flight; retention, quota and exact deletion.

## LC-2221 implementation contract

Load history only after activating the existing sticky private-session guard, before decryption/render. Exclude the group from feedback screenshots, replay and analytics capture. Purge component state on account switch/logout and reject late results. Keep history separate from revocable share links; do not offer Stop sharing for verifier receipts. Show truthful outcomes and reminders that deleting history cannot retract a disclosure. Localize new copy in en/es/fr/ar. Test controls, failures and identity changes.

## LC-2222 design gate

A managed link cannot revoke today's independently uploaded Filestack PDF. Before enabling publication, implement protected attachment delivery so the PDF is available only through the active decrypted share. Avoid a permanent raw PDF URL in the new credential/index. Validate size limits before upload; specify behavior for existing resumes and already downloaded copies. Reuse owner recovery and idempotent commit semantics from LC-2187; preserve a prepared attempt across uncertain commits. Do not silently create a second share or mutate a different profile after account switch. Stage and validate encrypted assets before committing; clean definite failures and abandoned drafts. Keep the legacy viewer intact and label weaker legacy controls. Verify both the viewer and attachment access after expiry/stop.

## Execution update — 2026-10-02

LC-2220 and LC-2221 have an initial implementation together on `codex/lc-2220-private-verifier-history`. The history controls are accessible from Data Sharing Center independently of the multiple-link feature flag. CHAPI and VC-API omit undisplayed recipient metadata. Persistence runs after transport in the background so a slow cleanup cannot trap the user on the sending screen; the pre-send preference lookup is bounded at three seconds. Explicit user-triggered exchange reports keep their existing policy (sanitized counterparty host and user note); the history preference is not a new diagnostic permission.

The initial test set covers real DIDKit holder encryption and the generic Cloud envelope, storage/error/concurrency cases, account revision isolation, CHAPI/VC-API delegation, accessible UI actions and existing sticky privacy/screenshot guards. These are local tests with mocked transports, not deployed storage, verifier interoperability, or vendor recorder certification. Full app TypeScript checking exposes baseline errors across the checkout and stale workspace dependency declarations; record focused checks separately instead of claiming a clean whole-app build.

Before calling either story complete: finish protocol end-to-end and differential network/telemetry validation (including OID4VP cold/error paths), confirm private-session behavior with actual recorder SDKs, and assess retention/quota concurrency against deployed Cloud. Keep these as one reviewable draft while validation continues.

LC-2222 remains planned. Its first implementation decision is how to carry the protected PDF: an encrypted asset tied to share-service authorization avoids the existing public upload, whereas embedding a PDF in the encrypted share would require a strict size ceiling under the existing one-megabyte envelope limit. Resolve this against representative generated PDF sizes before selecting the storage contract. No Resume Builder publishing code has been changed yet.

Validated locally: 44 app tests and 13 SDK submit tests pass; focused application diagnostics for ten implementation/test files report zero errors; history adapter/tests and the complete OID4VC SDK pass TypeScript checks; localization and safe-area guards pass. Whole-app TypeScript remains unverified because that check reports errors elsewhere in this checkout.
