---
name: learncard-wallet
description: Use the configured LearnCard wallet through approved capabilities.
version: 0.4.0
---

# LearnCard Wallet

## When To Use

Use this skill when you need a capability on the configured LearnCard wallet and there is not a dedicated narrow tool for the exact task.

## Authorization Boundary

Both `call` and `inspect` require the authenticated `ownerDid` supplied by the server. Model arguments cannot set or override this identity. Credential operations use the service wallet, not a learner wallet. Profile lookup and search instead use a separate anonymous Brain client with no service credentials.

The complete permitted method set is:

- Public identity/profile lookup: `id.did`, `invoke.getProfile`, `invoke.searchProfiles`.
- Credential templates: `invoke.createBoost`, `invoke.createChildBoost`, `invoke.getBoost`.
- Credential issuance/delivery: `invoke.issueCredential`, `invoke.sendBoost`, `invoke.send`, `invoke.sendCredentialViaInbox`.

Every other method/path is denied, including key export, account or signing-authority management, connections/recipient lists, aggregate ConsentFlow reads, arbitrary-DID learner reads, raw storage/index/cache access, and decryption. Private learner data must use the existing owner-bound `getConsentedUserData` tool and its approved ConsentFlow contract.

`invoke.getProfile` requires an explicit profile ID; it never reads the service wallet's own profile. `invoke.searchProfiles` accepts only public search options (`limit` from 1 to 99, and `includeServiceProfiles`). Self and connection-status options are denied. Public profile visibility is enforced by the Brain service's unauthenticated access tier, not by stripping selected fields from a service-authenticated response.

Boost URI arguments must have the form `lc:network:<network-and-optional-path-prefix>/trpc:boost:<boost-id>`, including preview URIs such as `lc:network:pr-99.preview.learncard.ai/brain/trpc:boost:abc123` and local encoded or raw port numbers. Reuse the URI returned by `createBoost` for reads, sends, or child creation. Generic credential/storage URIs are not accepted as templates, including by send operations whose SDK otherwise falls back to storage resolution. Unified `invoke.send` supports only `type: "boost"`.

`inspect` exposes only this capability facade, at `""`, `"id"`, `"invoke"`, or an exact permitted method. It never exposes raw values, function source, hidden properties, or function traversal (`call`, `apply`, `bind`). Unknown paths are denied even if a future SDK adds them.

## Tool

Use `learnCardWallet` with one of two operations:

- `inspect`: list approved namespaces and documented functions available on this wallet.
- `call`: invoke an approved method by its exact dot-separated path with positional `args`.

The `path` starts at the wallet root. Pass `args` as an array, even when there is only one argument.

Inspect results can include:

- TypeScript-derived metadata for approved LearnCard Network methods,
- argument details,
- examples,
- preconditions,
- method notes.

Inspection uses curated metadata, never implementation source or default parameter values.

## Procedure

1. Start with `inspect` if you do not already know the method path or argument order.
2. Inspect the exact function before credential creation, issuance, or delivery.
3. Use the smallest method that answers the request.
4. If a write call fails, read the structured error payload before retrying. It includes `method`, `argsSummary`, `underlyingError`, `knownUsage`, and `failureHints` when available.
5. Summarize results in user-friendly language instead of dumping raw JSON.

For large namespaces, include `query` instead of inspecting everything. For example, use query `"profile"` when looking for profile methods.

## Basic Examples

Inspect the wallet root:

```json
{ "operation": "inspect", "path": "" }
```

Search network methods:

```json
{ "operation": "inspect", "path": "invoke", "query": "profile", "limit": 25 }
```

Inspect one function with known metadata:

```json
{ "operation": "inspect", "path": "invoke.sendBoost" }
```

Get the current wallet DID:

```json
{ "operation": "call", "path": "id.did", "args": [] }
```

Get a public profile by its explicit profile ID:

```json
{ "operation": "call", "path": "invoke.getProfile", "args": ["example-profile-id"] }
```

Search profiles:

```json
{ "operation": "call", "path": "invoke.searchProfiles", "args": ["Taylor"] }
```

To read the current learner's shared credential content, use `getConsentedUserData`. Raw `read.get` access is intentionally unavailable.

## Boost Workflow

Boosts are templates. A Boost template may store `credentialSubject.id` as a placeholder such as `did:example:123`. This is normal. The recipient-specific credential is created by `sendBoost`, which rewrites `credentialSubject.id` to the recipient profile DID before issuing.

Create a Boost:

```json
{
    "operation": "call",
    "path": "invoke.createBoost",
    "args": [
        {
            "@context": ["https://www.w3.org/ns/credentials/v2"],
            "type": ["VerifiableCredential", "AchievementCredential"],
            "issuer": "did:web:localhost%3A4000:users:issuer",
            "validFrom": "2026-05-22T00:00:00.000Z",
            "name": "Synthetic Test Achievement: TypeScript",
            "description": "Synthetic credential for personalization testing.",
            "credentialSubject": {
                "id": "did:example:123",
                "type": ["AchievementSubject"],
                "achievement": {
                    "id": "urn:learncard:test-achievement:typescript",
                    "type": ["Achievement"],
                    "name": "TypeScript Application Architecture",
                    "description": "Demonstrated TypeScript architecture skills."
                }
            }
        },
        {
            "name": "Synthetic Test Achievement: TypeScript",
            "category": "Achievement",
            "status": "LIVE"
        }
    ]
}
```

Send a Boost to a profile:

```json
{
    "operation": "call",
    "path": "invoke.sendBoost",
    "args": [
        "taylor",
        "lc:network:localhost%3A4000/trpc:boost:example",
        { "encrypt": true, "skipNotification": true }
    ]
}
```

Important `sendBoost` details:

- Argument order is `profileId`, then `boostUri`, then optional `options`.
- Use profile IDs such as `"taylor"`, not DIDs, for direct profile sends.
- Direct sends may require an accepted connection. Connection inspection and management are unavailable through this tool.
- If a connection is required, ask the operator to arrange it outside this tool, or use an authorized email/phone inbox delivery.

For email or phone recipients, use the unified `invoke.send` route when you have a Boost URI, or `sendCredentialViaInbox` for lower-level inbox issuance.

Unified send with a Boost URI:

```json
{
    "operation": "call",
    "path": "invoke.send",
    "args": [
        {
            "type": "boost",
            "recipient": "student@example.edu",
            "templateUri": "lc:network:localhost%3A4000/trpc:boost:example",
            "options": { "suppressDelivery": true }
        }
    ]
}
```

Useful readbacks:

```json
{
    "operation": "call",
    "path": "invoke.getBoost",
    "args": ["lc:network:localhost%3A4000/trpc:boost:example"]
}
```

## Universal Inbox

Use `sendCredentialViaInbox` for email or phone recipients. Do not use it for profile IDs or DIDs.

Valid recipient shapes:

```json
{ "type": "email", "value": "student@example.edu" }
```

```json
{ "type": "phone", "value": "+15555555555" }
```

Unsigned inbox credentials require a primary registered signing authority or an explicit `configuration.signingAuthority`. Put signing authority config under `configuration`, not at the top level.

```json
{
    "operation": "call",
    "path": "invoke.sendCredentialViaInbox",
    "args": [
        {
            "recipient": { "type": "email", "value": "student@example.edu" },
            "credential": {
                "@context": ["https://www.w3.org/ns/credentials/v2"],
                "type": ["VerifiableCredential", "AchievementCredential"],
                "issuer": "did:web:localhost%3A4000:users:issuer",
                "validFrom": "2026-05-22T00:00:00.000Z",
                "credentialSubject": {
                    "id": "did:example:recipient",
                    "achievement": { "name": "Synthetic Test Achievement" }
                }
            },
            "configuration": {
                "signingAuthority": {
                    "endpoint": "https://issuer.example/issue",
                    "name": "default-issuer"
                },
                "delivery": { "suppress": true }
            }
        }
    ]
}
```

## Signing Authorities

Signing authorities must be configured by an operator outside this tool. Creating, registering, listing, or changing the primary authority is not permitted. For inbox delivery, use an already signed credential or an existing operator-configured authority. If neither is available, report the missing prerequisite rather than attempting account management.

## Failure Diagnostics

Failed wallet calls return a bounded diagnostic payload as the tool error string. Treat `underlyingError` as the most important field once you have already followed the documented method signature.

Example shape:

```json
{
    "error": "Wallet method call failed",
    "method": "invoke.sendBoost",
    "argsSummary": ["taylor", "lc:network:localhost%3A4000/trpc:boost:example"],
    "underlyingError": {
        "name": "Error",
        "message": "Target profile not found",
        "cause": {
            "message": "Network route rejected the request"
        }
    },
    "knownUsage": "sendBoost(profileId, boostUri, options?)",
    "failureHints": [
        "Usage: sendBoost(profileId, boostUri, options?). Put the profile ID first and the Boost URI second."
    ]
}
```

Do not keep retrying the same write call when `argsSummary` and `knownUsage` show the call shape is already correct. Use `underlyingError.message`, `code`, `statusCode`, `data`, `issues`, or `cause` to decide whether the next step is permissions, credential validation, signing authority setup, recipient lookup, or user action.

## Available Namespaces

- `id`: the public service wallet DID only.
- `invoke`: only the public lookup and credential operations listed above.

## Safety

Do not ask for, expose, or summarize private seed material or private keys. Issue or send credentials only when the user clearly asks for that action. Prefer inspection when the request is ambiguous. Prompt instructions do not grant access to denied capabilities.
