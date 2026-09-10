---
description: The `lc:` URIs that point at credentials, templates, and contracts — and how to resolve them.
---

# Credential URIs

Most things the LearnCard Network gives you back are **URIs**, not raw JSON. A URI is a stable pointer to something stored somewhere; you pass it around, and resolve it when you need the content.

They all start with `lc:` and follow `lc:<where>:<location>`:

| You'll see                                              | It points at                                          | You got it from                |
| ------------------------------------------------------- | ----------------------------------------------------- | ------------------------------ |
| `lc:network:network.learncard.com/trpc:boost:<id>`      | A credential template ([Boost](boost-credentials.md)) | `createBoost()`, `send().uri`  |
| `lc:network:network.learncard.com/trpc:credential:<id>` | A credential stored on the network                    | `send().credentialUri`         |
| `lc:network:network.learncard.com/trpc:contract:<id>`   | A consent contract                                    | `createContract()`             |
| `lc:network:network.learncard.com/trpc:terms:<id>`      | One user's consent to a contract                      | `consentToContract().termsUri` |
| `lc:cloud:<encoded host>:cred:<id>`                     | A credential in a user's encrypted LearnCloud storage | `store.LearnCloud.upload()`    |

The host in the URI is the network it lives on — a staging URI won't resolve on production.

## Resolving a URI

```typescript
const credential = await learnCard.read.get(uri);
```

`read.get` looks at the URI's method (`network`, `cloud`, …) and asks the right plugin to fetch it. `store.upload(credential)` does the reverse: saves a credential and hands you a URI.

## Two rules

- **Never build a URI by hand.** Always use the value a method returned. The format is stable, but the IDs aren't guessable and the host matters.
- **Keep the returned URI.** It's your only handle on the thing. If you send a credential and want to revoke it later, you'll need `credentialUri`.
