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

In the App Store developer dashboard's Testing tab, paste the proposed `changes` JSON, enter the reason when requesting additional access, and select **Preview update**. It opens the same review sheet using the API's returned copy. Its buttons only dismiss the preview; publishing still requires `updateContract` without `dryRun`.

To save the update, set `APPLY_UPDATE=true` in your private `.env` and run the same command. The reason is required for `requires_consent` and is limited to 140 characters. Missing it produces `A reason is required when asking users for more access`.

`changes` accepts creation metadata and a `contract` object; the SDK also accepts `read` and `write` directly, as above. Category and personal-field maps merge with the current request: omitted entries stay unchanged, and an empty map does not remove existing access. Set an individual entry to `null` to remove it, for example `{ read: { credentials: { categories: { Transcript: null } } } }`. AutoBoost and writer arrays still describe the complete next configuration. Use `updateContract` instead of the removed SDK `addAutoBoostsToContract` and `removeAutoBoostsFromContract` methods.

Set `expiresAt: null` to clear expiry. Extending or clearing expiry follows the ticket's quiet-update policy: this can extend how long an app can access existing data without another approval prompt.

Unknown AutoBoost IDs and writer profiles are rejected as invalid input before committing a version. A concurrency conflict means the saved request changed while the update was being applied, not that the referenced items were missing.

Use `getContractVersions(uri)` to list saved versions, their timestamps, change kinds, and reasons. Deleting a contract retires it and withdraws access; it does not erase users' terms or transactions from their holder export. Do not delete and recreate a connection to change requested access.

## Pause the feature, not the whole app

Before using a connected feature, call `getConsentStatus(uri, profileId)`. While the state is `needs_reconsent` or `suspended`, `verifyConsent(uri, profileId)` returns `false`; credential writes, AutoBoost issuance, and synchronization are forbidden with `User has not yet approved the latest version of this contract`.

Reads may still return data already allowed by the user's `consentedVersion`. They never grant access to newly requested data. Do not treat retained data or an old successful check as approval for the update.

When `needsReconsent` is true, offer a link to the returned `reviewUrl` from the feature that needs access. The LearnCard app does not open a review automatically at startup. The review shows only the changes and lets the user allow them or stop sharing.

The user accepts with their own LearnCard:

```javascript
await userLearnCard.invoke.acceptContractUpdate(termsUri, {
    version: currentContract.version,
    audienceVersion: currentContract.audienceVersion,
    terms: selectedTerms,
});
```

Here `termsUri` and `selectedTerms` come from the user's existing consent record and review selections. Pass the `audienceVersion` from the current contract whose data recipients the user reviewed; approval rejects a changed audience. Required items must be granted; optional items remain off unless the user selects them. Parent approval is still required where applicable. Acceptance records a `reconsent` transaction and restores `live` access. Declining uses `withdrawConsent(termsUri)`.

An update requiring approval defaults to a deadline 30 days after it is saved. Pass an ISO `reconsentDeadline` in `updateContract` options to choose another date. When the deadline passes, the scheduled job moves unanswered requests to `suspended`. The user can still review and approve the latest request to reconnect.

## Rolling out versioned access

Docker startup and Lambda application bootstrap await the same idempotent backfill before serving version-aware requests. It creates version 1 for legacy requests, records the accepted version on existing connections, and renames consumed one-time connections.

Drain old request writers during the deployment cutover so they cannot create unversioned requests after a new process completes its readiness gate. The `migrate:consent-flow-versions` service command remains available for an explicit pre-deployment backfill; it is no longer the only migration path for Lambda.

A malformed legacy request is logged by ID and skipped so healthy requests can start. Its missing snapshot remains fail-closed; the service does not invent grants from an unaccepted request. A database failure still rejects startup rather than serving before migration finishes.
