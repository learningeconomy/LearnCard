---
description: Embedded app authentication and xAPI with identity tokens, X-VP, and common 401 errors.
---

# Embedded App Auth & xAPI

Embedded apps use separate credentials for user identity and xAPI requests.

## Getting the user's identity

Inside LearnCard, the Partner Connect SDK asks the host for the user's identity:

```typescript
const { token, user } = await learnCard.requestIdentity();
// user.did → the user's DID (e.g. did:web:learncard.app:users:alice)
// token   → a JWT signed by LearnCard, for verifying the user on YOUR backend
```

Verify `token` on **your own** backend, then use `user.did` as the user's stable identifier.

## Sending xAPI statements

xAPI requests to LearnCloud authenticate with an **`X-VP` header** containing a Verifiable Presentation JWT — not the `requestIdentity()` token.

{% hint style="warning" %}
**`requestIdentity().token` is NOT an `X-VP` value.** The identity token proves who the user is _to your app_. The `X-VP` header is a VP JWT signed by the DID that appears as the xAPI statement's actor. LearnCloud verifies the VP's signature and requires the VP holder's DID to match the statement's actor DID — a mismatch is the most common cause of `401 Unauthorized`.
{% endhint %}

For the statement format and endpoints, see the [xAPI Reference](../../sdks/learncloud-storage-api/xapi-reference.md). For server-side sending with a wallet instance, see [Send xAPI Statements](../../tutorials/sending-xapi-statements.md).

## Common 401 causes

1. **Actor/holder mismatch** — the DID in the statement's `actor` doesn't match the VP holder's DID
2. **Wrong token in `X-VP`** — an identity JWT or API token instead of a VP JWT
3. **Expired or malformed VP JWT** — regenerate the presentation
4. **Delegate credential without the right scope** — delegated read/write requires a valid delegate credential inside the VP

## Required network endpoints

For schools or districts with network filtering, allow outbound traffic to these domains. The SDK's separate `hostOrigin` setting controls which LearnCard hosts can send messages to your app.

| Domain                  | Purpose                        |
| ----------------------- | ------------------------------ |
| `learncard.app`         | The LearnCard host application |
| `network.learncard.com` | LearnCloud Network API         |
| `cloud.learncard.com`   | LearnCloud Storage / xAPI      |

Self-hosted and staging environments use the domains in their tenant configuration.

## End-to-end shape

Your app calls `requestIdentity()`, and your backend verifies the returned token and links `user.did` to an account. After learning activity occurs, send an xAPI statement whose actor is `user.did` with an `X-VP` presentation JWT. LearnCloud verifies the presentation and stores the statement.

For other questions, [open an issue](https://github.com/learningeconomy/LearnCard/issues/new/choose) or email [sdk@learningeconomy.io](mailto:sdk@learningeconomy.io).
