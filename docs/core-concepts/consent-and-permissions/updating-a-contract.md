---
description: Evolve requested access without replacing the connection or silently granting new access.
---

# Updating a ConsentFlow Contract

The owner can update a live contract at its existing URI. Each saved update creates an immutable version; `getContract(uri)` returns the current request with its `version`. Existing users keep their consent records and transaction history.

## What happens to existing users

Mixed updates use the strongest change kind in this table, from bottom to top.

| Kind                | Examples                                                                                                                                                     | Existing access                                                                                         | What users see                                                                                |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `relaxed`           | Remove a category, make an item optional, extend expiry, remove an AutoBoost, or edit presentation text                                                      | Live terms move to the new version; removed grants are dropped                                          | A quiet history/feed entry; no push or unread badge                                           |
| `expanded_optional` | Add an optional read **or write** category or personal field                                                                                                 | Live terms move forward with the new option **off**, even when `defaultEnabled` is `true`               | A quiet feed entry and a new-option card subtitle for 14 days; users can review and enable it |
| `requires_consent`  | Add a required item, make an item required, add an AutoBoost or writer, shorten expiry, change the app name or access rationale, or begin requiring a parent | Existing live terms become `needs_reconsent`; their previously accepted version and grants are retained | One push notification, an unread feed entry, and “Needs your review” on the connected app     |

Optional additions never enable themselves. An update also does not reactivate a withdrawn connection or a consumed one-time request.

## Preview, then save

Save this example as `update-contract.mjs` alongside the files from the [ConsentFlow tutorial](../../tutorials/create-a-consentflow.md). Use the owner's `SECURE_SEED` and existing `CONTRACT_URI` in `.env`.

<!-- snippet: consentflow/update-contract.mjs -->

```javascript
import { pathToFileURL } from 'node:url';
import { initLearnCard } from '@learncard/init';

export const updateTutorialContract = async (learnCard, contractUri, { apply = false } = {}) => {
    const current = await learnCard.invoke.getContract(contractUri);
    // Category maps replace the supplied section: preserve existing entries explicitly.
    const changes = {
        read: {
            ...current.contract.read,
            credentials: {
                ...current.contract.read.credentials,
                categories: {
                    ...current.contract.read.credentials.categories,
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

Changed rows use shared canonical category labels and descriptions, not tenant-specific branding, so the API preview, developer preview, and user review display identical copy. A per-item `reason` takes precedence over the shared description.

Update notifications identify the connected app using the request's public `contractName`, not the owner's profile name.

In the App Store developer dashboard's Testing tab, paste the proposed `changes` JSON, enter the reason when requesting additional access, and select **Preview update**. It opens the same review sheet using the API's returned copy. Its buttons only dismiss the preview; publishing still requires `updateContract` without `dryRun`.

To save the update, set `APPLY_UPDATE=true` in your private `.env` and run the same command. The reason is required for `requires_consent` and is limited to 140 characters. Missing it produces `A reason is required when asking users for more access`.

`changes` accepts creation metadata and a `contract` object; the SDK also accepts `read` and `write` directly, as above. Preserve existing entries in each supplied section when adding an item; omit entries deliberately when removing them. AutoBoost and writer arrays describe the complete next configuration. Use `updateContract` instead of the removed SDK `addAutoBoostsToContract` and `removeAutoBoostsFromContract` methods.

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
