---
description: Evolve requested access without replacing the connection or silently granting new access.
---

# Updating a ConsentFlow Contract

The owner can update a live contract at its existing URI. Each saved update creates an immutable version; `getContract(uri)` returns the current request with its `version`. Existing users keep their consent records and transaction history.

When creating the initial request, **Preview Contract** shows the current unsaved draft. It does not require a saved URI or connect the account. Close the preview to keep editing, then select **Create Contract** to save.

## What happens to existing users

Mixed updates use the strongest change kind in this table, from bottom to top.

| Kind                | Examples                                                                                                                                                                                      | Existing access                                                                                         | What users see                                                                                |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `relaxed`           | Remove a category, make an item optional, extend expiry, remove an AutoBoost, or edit presentation text                                                                                       | Live terms move to the new version; removed grants are dropped                                          | A quiet history/feed entry; no push or unread badge                                           |
| `expanded_optional` | Add an optional read **or write** category or personal field                                                                                                                                  | Live terms move forward with the new option **off**, even when `defaultEnabled` is `true`               | A quiet feed entry and a new-option card subtitle for 14 days; users can review and enable it |
| `requires_consent`  | Add a required item, make an item required, change a required item's reason, add an AutoBoost or writer, shorten expiry, change the app name or access rationale, or begin requiring a parent | Existing live terms become `needs_reconsent`; their previously accepted version and grants are retained | One push notification, an unread feed entry, and “Needs your review” on the connected app     |

Optional additions never enable themselves. An update also does not reactivate a withdrawn connection or a consumed one-time request.

In the review, a new **Opt-out** option starts checked and a new **Opt-in** option starts unchecked, in both the developer preview and the user's review. These are proposed selections, not grants: access changes only when the user saves. Reopening a handled review refreshes saved choices, including an option the user turned off, rather than keeping cached defaults. A background refresh does not overwrite choices the user is currently editing.

The optional proposal window lasts 14 days. After it expires, reopening uses saved permissions instead of proposed Opt-out defaults. Saving sharing settings acknowledges the current optional proposal window even when the edit concerned another field; unselected options stay off.

Quiet optional updates advance the accepted version immediately. Their dedicated review shows the latest publication, not a cumulative queue of optional additions from earlier publications. Earlier options remain at their saved values and are still editable in **Data Sharing**. Required updates continue to accumulate every unaccepted required change.

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

Unknown AutoBoost IDs and writer profiles are rejected as invalid input before committing a version. A concurrency conflict means the saved request changed while the update was being applied, not that the referenced items were missing.

Use `getContractVersions(uri)` to list saved versions, their timestamps, change kinds, and reasons. Deleting a contract retires it and withdraws access; it does not erase users' terms or transactions from their holder export. Do not delete and recreate a connection to change requested access.

## Pause the feature, not the whole app

Before using a connected feature, call `getConsentStatus(uri, profileId)`. While the state is `needs_reconsent` or `suspended`, `verifyConsent(uri, profileId)` returns `false`; credential writes, AutoBoost issuance, and synchronization are forbidden with `User has not yet approved the latest version of this contract`.

Reads may still return data already allowed by the user's `consentedVersion`. They never grant access to newly requested data. Do not treat retained data or an old successful check as approval for the update.

When `needsReconsent` is true, offer a link to the returned `reviewUrl` from the feature that needs access. The LearnCard app does not open a review automatically at startup. The review shows only the changes and lets the user allow them or stop sharing.

In the current LearnCard app, opening the ordinary consent screen for a pending or suspended connection goes to update review instead of showing an already-connected form. If a required update arrives while an ordinary consent dialog is open, its approval-required response closes the modal stack and opens that same review. This handoff does not accept the update or run the connection's success callback. Other authorization errors, including missing guardian approval, retain their own recovery path.

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

If a request changes several times before a user reviews it, `getConsentedContracts()` includes a `cumulativeUpdate` from their accepted version to the current version. Review and grant every required item in that cumulative change, not just the last published update, before accepting the current version.

The web review, notification card, and history labels use the active app language (English, Spanish, French, or Arabic). Opening an update notification clears the modal stack so the review remains interactive even when Alerts was above another overlay. Navigation does not wait for the best-effort read receipt; dismissal errors stay visible with a retry action.

An update requiring approval defaults to a deadline 30 days after it is saved. Pass an ISO `reconsentDeadline` in `updateContract` options to choose another date. When the deadline passes, the scheduled job moves unanswered requests to `suspended`. The user can still review and approve the latest request to reconnect.

## Rolling out versioned access

Docker startup and Lambda handlers await the same idempotent backfill before serving version-aware requests. It creates version 1 for legacy requests, records the accepted version on existing connections, and renames consumed one-time connections. A failed Lambda migration is retried by the next request; concurrent requests share one migration attempt. Application import failures retain the bootstrap's separate memoization policy.

Drain old request writers during the deployment cutover so they cannot create unversioned requests after a new process completes its readiness gate. The `migrate:consent-flow-versions` service command remains available for an explicit pre-deployment backfill; it is no longer the only migration path for Lambda.

A malformed legacy request is skipped so healthy requests can start. The migration emits a bounded report containing skipped contract IDs and an `invalid_contract` reason, with a total count and truncation flag; it never logs credential contents. Its missing snapshot remains fail-closed. A database failure still rejects readiness rather than serving before migration finishes.

A successful, complete backfill records `ConsentFlowContractMigration { id: 'legacy-v1' }` with `completedAt`; later cold starts check that marker instead of rescanning every request and connection. Interrupted migrations and migrations that skip malformed requests do not mark completion. Repair reported IDs and rerun the service migration command. A missing version-1 lookup can also initialize a single valid, unversioned request written after completion, including its existing connection markers. This scoped repair leaves unrelated requests and the global marker unchanged; it never reconstructs missing history for an already-versioned request.

After restoring legacy data, or rolling back to an older writer and then rolling forward, clear only this migration marker before rerunning the full idempotent backfill—never delete snapshots or consent history. Scoped recovery is a safety net, not a substitute for draining old writers during cutover.

## One-time delivery and interrupted sends

An explicit one-time consent, re-consent, or live terms update can deliver a newly enabled AutoBoost while recording the connection as `consumed`. Repeating a consumed terms update is rejected; explicitly consenting again does not issue the same Boost twice for that connection.

AutoBoost claims are indexed by connection and Boost identity. Failures before sending begins release the claim. Once sending starts, an ambiguous failure or process crash leaves the claim in place: expiring it blindly could deliver a duplicate. Ambiguous-send errors include `claimId`, `termsId`, and `boostId` with the original error so operators can identify the retained claim. Inspect the existing credential and write transaction before reconciling it. This deliberately favors avoiding duplicates over automatically retrying a delivery whose outcome is unknown.
