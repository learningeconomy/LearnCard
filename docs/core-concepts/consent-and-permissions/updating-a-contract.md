---
description: Evolve requested access without replacing the connection or silently granting new access.
---

# Updating a ConsentFlow Contract

The owner can update a live contract at its existing URI. Each meaningful saved update creates an immutable version; `getContract(uri)` returns the current request with its `version`. Empty or equivalent updates leave the version, users' terms, history, and notifications unchanged.

When creating the initial request, **Preview Contract** shows the current unsaved draft. It does not require a saved URI or connect the account. Close the preview to keep editing, then select **Create Contract** to save.

## What happens to existing users

Mixed updates use the strongest change kind in this table, from bottom to top.

| Kind                | Examples                                                                                                                                                             | Existing access                                                                                         | What users see                                                                                |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `relaxed`           | Remove a category, make an item optional, extend expiry, remove an AutoBoost, edit presentation or per-item reason text, or change the redirect                      | Live terms move to the new version; removed grants are dropped                                          | A quiet history/feed entry; no push or unread badge                                           |
| `expanded_optional` | Add an optional read **or write** category or personal field                                                                                                         | Live terms move forward with the new option **off**, even when `defaultEnabled` is `true`               | A quiet feed entry and a new-option card subtitle for 14 days; users can review and enable it |
| `requires_consent`  | Add a required item, make an item required, add an AutoBoost or writer, shorten expiry, change the app name or overall access rationale, or begin requiring a parent | Existing live terms become `needs_reconsent`; their previously accepted version and grants are retained | One push notification, an unread feed entry, and “Needs your review” on the connected app     |

Optional additions never enable themselves. An update also does not reactivate a withdrawn connection or a consumed one-time request.

In the review, a new **Opt-out** option starts checked and a new **Opt-in** option starts unchecked, in both the developer preview and the user's review. These are proposed selections, not grants: access changes only when the user saves. Reopening a handled review refreshes saved choices, including an option the user turned off, rather than keeping cached defaults. A background refresh does not overwrite choices the user is currently editing.

The optional proposal window lasts 14 days. After it expires, reopening uses saved permissions instead of proposed Opt-out defaults. Saving sharing settings acknowledges the current optional proposal window even when the edit concerned another field; unselected options stay off.

Quiet optional updates advance the accepted version immediately, but do not acknowledge the user's review. `lastReviewedVersion` tracks the last explicit consent or sharing-settings save. Review accumulates every change since that version, so adding Alpha, then Beta, then editing a subtitle still shows both unreviewed options. A per-item reason-only edit—including a required item's reason—or a redirect-only edit does not pause access or ask for approval.

## Preview, then save

Save this example as `update-contract.mjs` alongside the files from the [ConsentFlow tutorial](../../tutorials/create-a-consentflow.md). Use the owner's `SECURE_SEED` and existing `CONTRACT_URI` in `.env`.

<!-- snippet: consentflow/update-contract.mjs -->

```javascript
import { pathToFileURL } from 'node:url';
import { initLearnCard } from '@learncard/init';

export const updateTutorialContract = async (learnCard, contractUri, { apply = false } = {}) => {
    // Scope maps merge: this adds Transcripts without dropping existing choices.
    const changes = {
        read: {
            credentials: {
                categories: {
                    Transcript: { required: true, reason: 'to calculate your GPA' },
                },
            },
        },
    };
    const options = {
        reason: 'We added transcripts so we can show your GPA on your résumé.',
        dryRun: !apply,
    };
    return learnCard.invoke.updateContract(contractUri, changes, options);
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    const { SECURE_SEED, CONTRACT_URI, APPLY_UPDATE } = process.env;
    if (!SECURE_SEED || !CONTRACT_URI) throw new Error('Set SECURE_SEED and CONTRACT_URI');
    const learnCard = await initLearnCard({ seed: SECURE_SEED, network: true });
    const result = await updateTutorialContract(learnCard, CONTRACT_URI, {
        apply: APPLY_UPDATE === 'true',
    });
    console.log(JSON.stringify(result, null, 2));
}
```

<!-- /snippet -->

Run `node --env-file=.env update-contract.mjs` to preview. The result contains `{ version, kind, affectedUsers, preview }`. `preview` includes the headline, subhead, change rows, and primary button label rendered by the user's review screen. A dry run writes no version, terms, transaction, or notification.

Changed rows use shared canonical category labels and descriptions, not tenant-specific branding. The API returns canonical English preview text and structured scopes; clients can localize the same headline, rows, and actions from that structure. A developer-authored per-item `reason` stays verbatim and takes precedence over the shared description.

Saved updates also expose non-scope changes in `latestUpdate.diff.details`, including request metadata, writers, and automatic deliveries. Review shows current and next values alongside category changes instead of hiding a material update behind an empty scope list.

Update notifications identify the connected app using the request's public `contractName`, not the owner's profile name.

### Update from the developer dashboard

Versioned updates require a network running the updated backend, not just an updated frontend. New contracts on that backend start at version 1. If the service omits version metadata, the editor explains that updates are unavailable on that network instead of displaying an invented version or allowing publication.

No SDK script or JSON is needed to publish an update:

1. Open your project's **Contracts** tab and select **Update contract** on the request you want to change. The shared form opens in a modal. An app with several configured requests has a separate update action for each one; the Testing tab remains for trying its ConsentFlow.
2. Edit its details, read/write categories, or read-side personal fields using the original creation controls. Personal fields keep their **Required/Optional** toggle; a category's settings button offers **Required**, **Opt-in**, or **Opt-out**. There are no per-item purpose fields or added default-enabled checkboxes. Unedited settings and existing SDK-supplied purposes stay unchanged.
3. After you make an edit, **Your changes** groups current and next values under request details, read access, and write access. The separate **Why are you making this update?** field appears below this summary with room to breathe. Approval-requiring changes need a reason of at most 140 characters; reverting all changes hides both sections.
4. Select **Preview Update** to open the user review in a second modal. It does not save anything. Closing it or pressing Escape returns to the editor with your draft intact. Its help icon explains the connection; its access disclosure lists unchanged defaults from the current request, not a person's saved permissions. An empty disclosure explains that no default access stays unchanged.
5. Select **Publish Update** in the editor. A success message shows the saved version. Reload the page and reopen **Update contract** to see the persisted request. Closing the editor without publishing discards its draft.

If the request changed elsewhere, reload it before publishing. A failed publication keeps your draft; a failed refresh after successful publication offers a reload rather than publishing the same draft again.

In a person's actual update review, the disclosure uses accepted choices, not defaults. If no access is enabled, it says so; if all existing access is already described in the changed rows, it explains that instead.

### SDK alternative

To save with the SDK instead, set `APPLY_UPDATE=true` in your private `.env` and run the same command. The reason is required for `requires_consent` and is limited to 140 characters. Missing it produces `A reason is required when asking users for more access`.

`changes` accepts creation metadata and a `contract` object; the SDK also accepts `read` and `write` directly, as above. Use only one shape for each area: supplying both `read` and `contract.read`, or both `write` and `contract.write`, is rejected before a network mutation instead of silently discarding part of the patch. Different areas may use different shapes. Category and personal-field maps merge with the current request: omitted entries stay unchanged, and an empty map does not remove existing access. Set an individual entry to `null` to remove it, for example `{ read: { credentials: { categories: { Transcript: null } } } }`. AutoBoost and writer arrays still describe the complete next configuration. Use `updateContract` instead of the removed SDK `addAutoBoostsToContract` and `removeAutoBoostsFromContract` methods.

Set `expiresAt: null` to clear expiry. Extending or clearing expiry follows the ticket's quiet-update policy: this can extend how long an app can access existing data without another approval prompt.

Unknown AutoBoost IDs and writer profiles are rejected as invalid input before committing a version. Pass `expectedVersion` from the request originally loaded into your draft to both preview and publication; a mismatch returns `CONFLICT` without applying the draft. Do not replace it with a freshly fetched version while keeping an older draft. The publication also checks its version atomically, protecting against changes made after preflight.

Use `getContractVersions(uri)` to list saved versions, their timestamps, change kinds, and reasons. Deleting a contract retires it and withdraws access; it does not erase users' terms or transactions from their holder export. Do not delete and recreate a connection to change requested access.

## Pagination and exports

Consent-list, consented-data, and transaction-history APIs return opaque cursors.
Pass the returned cursor unchanged to the same endpoint while `hasMore` is true;
do not interpret it as a date. Timestamp ties use a stable record-ID boundary,
including legacy terms whose update date falls back to their creation date.
Holder exports use the same boundaries so a bulk update or deadline sweep does
not truncate tied records.

This major release no longer accepts old date-only cursors. They and malformed
tokens return `BAD_REQUEST`, not a server error. Restart a pagination session
without a cursor after upgrading rather than carrying a pre-upgrade date forward.

## Partner rollout and legacy AutoBoost callers

This is a major SDK/API release, not a behavior-preserving replacement. The deprecated HTTP AutoBoost add/remove routes remain available for one compatibility release, but only the contract owner may use them; delegated writers cannot change the request for every holder. They use the versioned publication rules. Adding an AutoBoost through the old add route publishes `requires_consent`: every existing live connection becomes `needs_reconsent`, and writes, automatic delivery and synchronization pause until that person approves.

New automatic deliveries use the contract owner's signer. Existing pre-upgrade deliveries configured by a delegated writer retain that original issuer when the owner submits the same Boost and signer configuration, including in a complete replacement array. The owner does not need access to the writer's signing key to preserve that existing setup.

An owner cannot change an existing delegated delivery's signer in place. Remove it before configuring a replacement using the owner's signer and Boost issuance permissions. Being listed as a writer does not authorize another account to use that writer's signer.

New cross-account automatic-delivery setup is deferred from this release. A follow-up ticket should define an authenticated issuer-authorization flow, bound to the contract, Boost, and signer, before an owner can preview and publish it. This is a partner-integration step, not an additional learner prompt.

Before enabling these publications:

1. Upgrade partner integrations to `updateContract`. Send the complete desired AutoBoost configuration and a reason, and preview the change before saving.
2. Ship support for `getConsentStatus` and its returned `reviewUrl` in the feature that needs access. Deploy the updated LearnCard review surface alongside the backend. Older native or embedded clients without that route must open the updated web review URL; retrying ordinary `consentToContract` cannot approve a newer version.
3. Notify existing integration owners before their next AutoBoost addition or bulk configuration job. Treat a pending update as a feature-level pause, not an instruction to repeatedly retry writes or disconnect everyone.
4. After approval, let the person return to the partner and restart its original sign-in or launch flow if necessary. The update review does not generate that partner's callback or challenged sign-in proof.

## Pause the feature, not the whole app

Before using a connected feature, call `getConsentStatus(uri, profileId)`. While the state is `needs_reconsent` or `suspended`, `verifyConsent(uri, profileId)` returns `false`; credential writes, AutoBoost issuance, and synchronization are forbidden with `User has not yet approved the latest version of this contract`.

Reads may still return data already allowed by the user's `consentedVersion`. They never grant access to newly requested data. Do not treat retained data or an old successful check as approval for the update.

When `needsReconsent` is true, offer a link to the returned `reviewUrl` from the feature that needs access. The LearnCard app does not open a review automatically at startup. The review shows only the changes and lets the user allow them or stop sharing.

In the current LearnCard app, opening the ordinary consent screen for a pending or suspended connection goes to update review instead of showing an already-connected form. If a required update arrives while an ordinary consent dialog is open, its approval-required response closes the modal stack and opens that same review. This handoff does not accept the update or run the connection's success callback. Other authorization errors, including missing guardian approval, retain their own recovery path.

The ordinary consent response identifies this case with `FORBIDDEN` and `data.reason: 'CONTRACT_APPROVAL_REQUIRED'`. Clients should use that structured reason, not match the human-readable message.

The user accepts with their own LearnCard:

```javascript
await userLearnCard.invoke.acceptContractUpdate(termsUri, {
    version: currentContract.version,
    audienceVersion: currentContract.audienceVersion,
    terms: selectedTerms,
});
```

Here `termsUri` and `selectedTerms` come from the user's existing consent record and review selections. Pass the `audienceVersion` from the current contract whose data recipients the user reviewed; approval rejects a changed audience. Required items must be granted; optional grants follow the selections submitted by the user. Parent approval is still required where applicable. Acceptance records a `reconsent` transaction and restores `live` access. Declining uses `withdrawConsent(termsUri)`.

Reopening a handled update shows **Done** instead of submitting approval again; users can still stop sharing. If that update added optional choices, users can change those choices without accepting the same version again. Cancelling the parent PIN with its button, Escape, a backdrop, or a back gesture settles the pending action and leaves the review available to retry. Once a valid PIN submits the action, closing that PIN modal cannot cancel the submission. A version conflict reloads the latest request before another approval attempt.

Saving optional choices on an already handled review records an `update`, not
another `reconsent`. Omitting `oneTime` preserves the saved one-time setting;
accepting a newer version does not silently turn a consumed connection live.

If a request changes several times before a user reviews it, `getConsentedContracts()` includes a `cumulativeUpdate` from `lastReviewedVersion` to the current version. On older records without that marker, the accepted version is the fallback. Review and grant every required item in that cumulative change, not just the last published update, before accepting the current version.

The web review, notification card, and history labels use the active app language (English, Spanish, French, or Arabic). Opening an update notification clears the modal stack so the review remains interactive even when Alerts was above another overlay. Navigation does not wait for the best-effort read receipt; dismissal errors stay visible with a retry action.

An update requiring approval defaults to a deadline 30 days after it is saved. Pass an ISO `reconsentDeadline` strictly later than publication time to choose another date; past dates and the current instant are rejected. When the deadline passes, the scheduled job moves unanswered requests to `suspended`. The user can still review and approve the latest request to reconnect.

## Rolling out versioned access

Docker startup and Lambda handlers await the same idempotent backfill before serving version-aware requests. It creates version 1 for legacy requests, records the accepted version on existing connections, and renames consumed one-time connections. A legacy snapshot uses the saved request's `updatedAt` (falling back to `createdAt`), not an invented reconstruction of its original content. A failed Lambda migration is retried by the next request; concurrent requests share one migration attempt. Application import failures retain the bootstrap's separate memoization policy.

The scheduled deadline Lambda also loads its runtime secrets before importing environment validation or database clients. A deployment using only `RUNTIME_SECRETS_ID` does not need to copy those secrets into the function environment. If startup leaves less than two seconds for the invocation, the worker skips suspension work until the next run.

Drain old request writers during the deployment cutover so they cannot create unversioned requests after a new process completes its readiness gate. The `migrate:consent-flow-versions` service command remains available for an explicit pre-deployment backfill; it is no longer the only migration path for Lambda.

A malformed legacy request is skipped so healthy requests can start. The migration emits a bounded report containing skipped contract IDs and an `invalid_contract` reason, with a total count and truncation flag; it never logs credential contents. Its missing snapshot remains fail-closed. A database failure still rejects readiness rather than serving before migration finishes.

A successful, complete backfill records `ConsentFlowContractMigration { id: 'legacy-v1' }` with `completedAt`; later cold starts check that marker instead of rescanning every request and connection. Interrupted migrations and migrations that skip malformed requests do not mark completion. Repair reported IDs and rerun the service migration command. A missing version-1 lookup can also initialize a single valid, unversioned request written after completion, including its existing connection markers. This scoped repair leaves unrelated requests and the global marker unchanged; it never reconstructs missing history for an already-versioned request.

This repair runs only through single-version lookups used by consent creation and terms changes, contract updates and retirement, and the legacy AutoBoost endpoints. Batched consent-list reads and credential writes do not initialize missing snapshots; they remain fail-closed when history is missing.

After restoring legacy data, or rolling back to an older writer and then rolling forward, clear only the `legacy-v1` migration marker before rerunning the full idempotent backfill—never delete snapshots or consent history. Scoped recovery is a safety net, not a substitute for draining old writers during cutover.

A separate `holder-review-v1` marker upgrades existing versioned connections once. It reconstructs their last explicit review from consent, re-consent, and user settings transactions, rather than treating quiet automatic version advances as review. Existing immutable snapshots are not rewritten.

## One-time delivery and interrupted sends

An explicit one-time consent, re-consent, or live terms update can deliver a newly enabled AutoBoost while recording the connection as `consumed`. Repeating a consumed terms update is rejected; explicitly consenting again does not issue the same Boost twice for that connection.

AutoBoost claims are indexed by connection and Boost identity. Failures before sending begins release the claim. Once sending starts, an ambiguous failure or process crash leaves the claim in place: expiring it blindly could deliver a duplicate. Ambiguous-send errors include `claimId`, `termsId`, and `boostId` with the original error so operators can identify the retained claim. Inspect the existing credential and write transaction before reconciling it. This deliberately favors avoiding duplicates over automatically retrying a delivery whose outcome is unknown.
