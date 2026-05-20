---
name: learncard-wallet
description: Use the configured LearnCard wallet through one freeform tool.
version: 0.1.0
---

# LearnCard Wallet

## When To Use

Use this skill when you need any capability on the configured LearnCard wallet and there is not a dedicated narrow tool for the exact task.

## Tool

Use `learnCardWallet` with one of two operations:

-   `inspect`: list the functions, objects, and scalar values available at a wallet path.
-   `call`: invoke a wallet method by dot-separated path with positional `args`.

The `path` starts at the wallet root. Pass `args` as an array, even when there is only one argument. Inspect results include function paths, arity, parsed parameters when JavaScript exposes them, and a signature.

## Procedure

1. Start with `inspect` if you do not already know the method path.
2. Call the smallest method that answers the user request.
3. Summarize the result in user-friendly language instead of dumping raw JSON.

For large namespaces, include `query` instead of inspecting everything. For example, use query `"profile"` when looking for profile methods.

## Examples

Inspect the wallet root:

```json
{ "operation": "inspect", "path": "" }
```

Inspect network methods:

```json
{ "operation": "inspect", "path": "invoke" }
```

Search network methods:

```json
{ "operation": "inspect", "path": "invoke", "query": "profile", "limit": 25 }
```

Inspect one function signature:

```json
{ "operation": "inspect", "path": "invoke.searchProfiles" }
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

Query a LearnCloud index category:

```json
{ "operation": "call", "path": "index.LearnCloud.get", "args": [{ "category": "ID" }] }
```

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
