---
"@learncard/types": major
"@learncard/network-plugin": major
"@learncard/network-brain-service": major
"@learncard/helpers": minor
"@learncard/lca-api-service": minor
"learn-card-app": minor
"learn-card-base": minor
---

feat: [LC-2194] Support versioned ConsentFlow updates and user review.

Keep a connection's URI and history while publishing immutable access updates. New optional read/write choices stay off; required additions pause writes until the user reviews the changes. Add explicit update acceptance, review notifications, deadlines, once-only AutoBoost delivery, and safe retirement. Unsaved request previews no longer require a URI.

Preserve existing grants in partial scope updates, gate Lambda startup on legacy snapshots, and retain once-only delivery during explicit one-time updates. Localize review and history content, recover from cancelled guardian checks and concurrent updates, and keep handled notifications safe to reopen.

Retry transient Lambda migration failures without poisoning warm application imports. Record completed migrations for fast cold starts, report malformed request IDs without credential data, and identify retained ambiguous AutoBoost claims for reconciliation. Load runtime secrets before importing the scheduled deadline worker, including secrets-only Lambda deployments. Keep inbox maintenance coverage behavioral rather than pinning Lambda wrapper source text.

Recover valid, unversioned contracts created after the migration marker through scoped version-1 initialization. Atomically backfill only their existing connections, preserve global migration completion, and keep missing history on already-versioned or malformed contracts fail-closed.

Settle guardian PIN actions on external dismissal or unmount without cancelling valid submissions. Cover reapproval, signing failures and referral cancellation with the current PIN modal contract. Clear stacked overlays before opening a contract-update review. Cancel delayed modal-removal timers when their provider unmounts while preserving closing animations. Use stable localization keys independent of English labels and stop proposing optional defaults after their window expires.

Route pending and suspended connections from ordinary consent entry to explicit update review. Recover the same way when the latest-approval error arrives during an open consent dialog, without treating the connection as approved or bypassing guardian checks.

Reject overlapping top-level and nested SDK scope patches instead of silently dropping changes. Restore strict type-only imports, declare the runnable update snippet's SDK contract, and narrow unsuccessful notification reads in end-to-end consumers without raising the typecheck allowance.

Include cumulative changes in consent records so users can approve all required additions across multiple unreviewed versions. Clear the pending optional-choice marker only when the holder successfully saves their choices.

Resolve built-in request categories and personal fields to localized labels and descriptions in English, Spanish, French, and Arabic, including learning history and career/AI categories. Recognize the legitimate French cognates “Image” and “Qualifications” in the existing untranslated-value guard.

Dismiss Alerts when opening a contract-update review without waiting for read-status writes. Give unread indicators their own layout space so they cannot overlap notification dates.

Use one shared request form with the original creation controls for creating and editing requests, without per-item purpose fields or added default-enabled checkboxes. Keep the overall update explanation separate. Replace JSON authoring with readable changes and Preview Update / Publish Update actions in the Contracts tab. Show an accessible help icon and meaningful existing-access/defaults disclosures.

Start new optional review controls from their Opt-in/Opt-out settings without silently granting access. Use the edited request's defaults in previews, refresh saved choices when reopening without overwriting active edits, and reduce the extra spacing below the current version.

Separate Advanced Options from changes, published feedback, and actions. Add space below the current version while keeping the image's remove control in its original outside corner.

Show a clear unavailable state for networks that omit contract version metadata, including cached responses. Keep publishing disabled until a versioned response is available, and never assume an unversioned response is version 1.

Use direct Mongo connections for the local Docker APIs so the single-node replica's localhost address does not prevent them from starting. Gate Mongo-dependent services on a writable primary so they do not exit during replica initialization or election.

Pre-bundle the remaining workspace crypto and cloud-client dependencies before serving the local app, avoiding dependency-discovery reloads during browser startup.

Open an on-demand Update contract modal from each configured request in the Contracts tab, rather than the Testing tab. Reveal the update explanation only after edits, separate it from grouped current/next values, and keep user-review previews in the shared modal stack for correct focus and Escape behavior.

Breaking SDK/API changes: use `updateContract` instead of the removed `addAutoBoostsToContract` and `removeAutoBoostsFromContract` SDK methods. One-time consent status is now `consumed`, not `stale`. The deprecated HTTP AutoBoost routes remain available for one compatibility release and use the versioned update path. Legacy AutoBoost additions also pause writes and synchronization pending explicit holder review; coordinate partner upgrades and support `getConsentStatus` / `reviewUrl` before rollout.

Reject stale editor drafts with their original expected version, treat equivalent updates as no-ops, require future reconsent deadlines, and restrict legacy AutoBoost publications to contract owners. Paginate tied consent-data timestamps with stable opaque cursors and preserve all unreviewed optional additions across later updates.

Track each holder's last explicit review, backfill that baseline from transaction history, and timestamp legacy snapshots at the revision actually captured. Keep per-item explanation-only and redirect-only changes quiet. Retain ambiguous initial AutoBoost claims and reject mismatched concurrent initial credential deliveries.

Show material metadata, writer, and automatic-delivery changes alongside scope updates. Refresh holder terms before enabling review edits, populate newly enabled personal fields from the holder profile, and use a structured approval-required reason instead of matching error text.

Regenerate the Python API client from the current router graph, including all consent lifecycle states, versioned updates, and review metadata. Preserve explicit null inputs during regeneration rather than silently converting them to omitted fields.

Preserve existing delegated AutoBoost issuers when owners publish unchanged configurations, while keeping new configurations owner-issued and rejecting changes to an existing delegated signer. Defer new cross-account setup until an explicit issuer-authorization flow is available. Use pre-upgrade persisted fixtures for legacy-delegation regressions without reopening writer publication, and fix the signer mock's recursive self-call in consent regressions.

Keep saves from already handled reviews in ordinary sharing-update history, and preserve the saved one-time setting when update or reconsent inputs omit it.
