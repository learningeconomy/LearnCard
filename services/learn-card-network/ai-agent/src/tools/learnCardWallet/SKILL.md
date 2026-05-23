---
name: learncard-wallet
description: Use the configured LearnCard wallet through one freeform tool.
version: 0.2.0
---

# LearnCard Wallet

## When To Use

Use this skill when you need a capability on the configured LearnCard wallet and there is not a dedicated narrow tool for the exact task.

## Tool

Use `learnCardWallet` with one of two operations:

-   `inspect`: list functions, objects, and scalar values available at a wallet path.
-   `call`: invoke a wallet method by dot-separated path with positional `args`.

The `path` starts at the wallet root. Pass `args` as an array, even when there is only one argument.

Inspect results can include:

-   parsed JavaScript parameters when available,
-   TypeScript-derived metadata for common LearnCard Network methods,
-   argument details,
-   examples,
-   preconditions,
-   method notes.

Bound SDK methods may still appear as native functions in JavaScript. When inspection returns `argumentDetails`, `examples`, or `metadataSource`, treat those as more reliable than `arg1`/`arg2`.

## Procedure

1. Start with `inspect` if you do not already know the method path or argument order.
2. Inspect the exact function before write operations such as create, send, issue, revoke, delete, or register.
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

Get the configured agent profile:

```json
{ "operation": "call", "path": "invoke.getProfile", "args": [] }
```

Get another profile:

```json
{ "operation": "call", "path": "invoke.getProfile", "args": ["example-profile-id"] }
```

Search profiles:

```json
{ "operation": "call", "path": "invoke.searchProfiles", "args": ["Taylor"] }
```

Read stored credential content:

```json
{ "operation": "call", "path": "read.get", "args": ["lc:credential-uri"] }
```

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

-   Argument order is `profileId`, then `boostUri`, then optional `options`.
-   Use profile IDs such as `"taylor"`, not DIDs, for direct profile sends.
-   `connectWith(profileId)` may create a pending connection. Check `getConnections()` and `getPendingConnections()` before assuming the recipient can receive direct sends.
-   If direct send is blocked by a pending connection, ask the user to accept the connection or use an email/phone inbox flow if appropriate.

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
{ "operation": "call", "path": "invoke.getBoost", "args": ["lc:network:localhost%3A4000/trpc:boost:example"] }
```

```json
{ "operation": "call", "path": "invoke.countBoostRecipients", "args": ["lc:network:localhost%3A4000/trpc:boost:example"] }
```

## Connections

Find a profile:

```json
{ "operation": "call", "path": "invoke.searchProfiles", "args": ["Taylor"] }
```

Request a connection:

```json
{ "operation": "call", "path": "invoke.connectWith", "args": ["taylor"] }
```

Check accepted and pending state:

```json
{ "operation": "call", "path": "invoke.getConnections", "args": [] }
```

```json
{ "operation": "call", "path": "invoke.getPendingConnections", "args": [] }
```

Accept an incoming request:

```json
{ "operation": "call", "path": "invoke.acceptConnectionRequest", "args": ["profile-id"] }
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

If the wallet exposes `invoke.createSigningAuthority`, the typical managed authority setup is:

```json
{ "operation": "call", "path": "invoke.createSigningAuthority", "args": ["default-issuer"] }
```

Then register it:

```json
{
    "operation": "call",
    "path": "invoke.registerSigningAuthority",
    "args": ["https://issuer.example/issue", "default-issuer", "did:key:zExample"]
}
```

Then set it as primary:

```json
{
    "operation": "call",
    "path": "invoke.setPrimaryRegisteredSigningAuthority",
    "args": ["https://issuer.example/issue", "default-issuer"]
}
```

Read current signing authority state:

```json
{ "operation": "call", "path": "invoke.getPrimaryRegisteredSigningAuthority", "args": [] }
```

If `createSigningAuthority` is not available, you can only register an external authority if the user or system gives you its `endpoint`, `name`, and `did`.

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
    "failureHints": ["Usage: sendBoost(profileId, boostUri, options?). Put the profile ID first and the Boost URI second."]
}
```

Do not keep retrying the same write call when `argsSummary` and `knownUsage` show the call shape is already correct. Use `underlyingError.message`, `code`, `statusCode`, `data`, `issues`, or `cause` to decide whether the next step is permissions, credential validation, signing authority setup, recipient lookup, or user action.

## Common Planes

-   `id`: identity helpers such as `did`.
-   `read`: retrieve credential or document content by URI.
-   `store`: persist credential or document content.
-   `index`: query or update indexes.
-   `cache`: temporary key/value storage.
-   `context`: resolve JSON-LD contexts.
-   `invoke`: LearnCard and LearnCard Network plugin methods.

## Safety

Do not ask for, expose, or summarize private seed material or private keys. Do not call methods that send, issue, revoke, delete, remove, or overwrite data unless the user clearly asked for that action. Prefer read-only inspection first when the request is ambiguous.
