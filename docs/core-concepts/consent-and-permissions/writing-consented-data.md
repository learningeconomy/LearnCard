# Reading & Writing Consented Data

A [contract](consentflow-overview.md#contracts) defines requested access; a user's [terms](consentflow-overview.md#terms-what-the-user-actually-agreed-to) define what they granted. Reading shares existing data with a contract owner. Writing delivers a credential to a consenting user. Neither grants unrestricted access to the user's account.

All methods below are called through `learnCard.invoke`. For a runnable implementation, including verified identity from the consent redirect, follow [Build a ConsentFlow](../../tutorials/create-a-consentflow.md).

## Reading

### One user: the safe default

For user-facing features, use `getConsentFlowDataForDid(did, options?)` rather than searching an aggregate result for a person.

1. Establish the user's identity from a verified source, not an untrusted redirect parameter.
2. Resolve their network profile and call `verifyConsent(contractUri, profileId)` before reading or using cached data. If it returns false or the check fails, deny access.
3. Fetch that user's data and retain only records whose `contractUri` equals the intended contract URI.
4. Repeat the filter for every page. Do not mix records from other contracts into the current app session.

Each record contains:

| Field         | Meaning                                    |
| ------------- | ------------------------------------------ |
| `contractUri` | Contract under which the data was shared   |
| `personal`    | Map of shared field names to string values |
| `credentials` | Array of `{ category, uri }` entries       |
| `date`        | Record date                                |

The optional `query` filters credential categories, personal fields, or contract `id`. The response's `contractUri` is still the explicit boundary to check. Credential URIs are references, not full credential payloads; retrieve authorized content with `learnCard.read.get(uri)`.

{% hint style="warning" %}
Record presence is not proof of active consent. The current per-user query can return withdrawn terms. Always gate access with `verifyConsent`, including before reusing cached results.
{% endhint %}

### Aggregate data

`getConsentFlowData(contractUri, options?)` reads data across all consenters to a contract the caller owns. Its records contain `personal`, `credentials.categories` (category-to-URI-array map), and `date`—**no identity field**. Do not use record order or personal fields to infer which record belongs to a signed-in user.

`getAllConsentFlowData(query?, options?)` reads across the caller's contracts and returns the same aggregate record shape. Unlike the other read methods, its query is the **first argument**, separate from pagination options.

These methods support credential-category and personal-field filters; aggregate queries also support `anonymize`. They are not substitutes for a per-user consent check. For any operation tied to a person, use the guarded per-user path above; an aggregate row cannot supply the `profileId` needed by `verifyConsent`.

### Pagination

Read methods return `{ records, hasMore, cursor }`:

- Set `limit` in the options to bound each request.
- When `hasMore` is true, pass the returned `cursor` in the next request's options.
- Preserve the same query and contract filter across pages.
- Stop when `hasMore` is false. Treat the cursor as a continuation token, not a date-range filter.

## Writing

### Delivering a credential

`writeCredentialToContract(did, contractUri, credential, boostUri)` returns a credential URI. The credential must be a signed Verifiable Credential or an encrypted JWE, and `boostUri` must identify a real, published boost.

Writing requires:

- Active consent for the recipient and contract; check `verifyConsent` before starting.
- Permission for the sender to issue the boost.
- An approved contract writer who is not denied by the user's terms.
- Write permission in the terms for the boost's category, such as `write.credentials.categories.Achievement: true`.

The network checks permissions during the write and records a `write` transaction. A prior successful check does not guarantee a later write will succeed: terms can change between requests. Handle rejection without falling back to a delivery path that bypasses consent.

### Sharing existing credentials

The consenting user calls `syncCredentialsToContract(termsUri, categories)`, where `categories` is a `Record<string, string[]>` mapping contract read-category names to credential URIs. This shares existing credentials; it does not issue new ones.

The terms must belong to the caller, remain live, and not be expired. Categories must exist in the contract's read definition. Sync adds and deduplicates URIs in the shared arrays, records a `sync` transaction, and returns a boolean.

### The send convenience method

`send()` supports a **top-level** `contractUri` alongside `type: 'boost'`, `recipient`, and the template or signed credential. `SendOptionsValidator` has **no** `contractUri` field: do not put it inside `options`.

Contract integration routes a consenting recipient through the contract, but `send()` can fall back to normal delivery when consent is absent. It is therefore not a consent gate. For workflows that must stop without consent, use the guarded direct write rather than relying on `send()` alone. See [Send Credentials](../../how-to-guides/send-credentials.md).

## Withdrawal

The user calls `withdrawConsent(termsUri)`, not `withdrawConsent(contractUri)`. Withdrawal is recorded in the [transaction history](consentflow-overview.md#transactions-the-audit-trail).

- `verifyConsent(contractUri, profileId)` returns false after withdrawal.
- Guarded reads must stop, even if an underlying query still returns a stored record.
- Contract writes and credential syncing are no longer authorized by those terms.
- Stop queued issuance and invalidate cached data before reuse. Delete retained copies according to your data-retention obligations; withdrawal cannot erase copies already exported to your system.
- Previously issued credentials are not automatically revoked by withdrawing consent. Normal delivery outside this contract is separate, which is why the `send()` fallback must not be used to bypass a failed consent check.

The [Build tutorial's withdrawal step](../../tutorials/create-a-consentflow.md#6-handle-withdrawal) demonstrates a cache that fails closed when active consent cannot be confirmed.
