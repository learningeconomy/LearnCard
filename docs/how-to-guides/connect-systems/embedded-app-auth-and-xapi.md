---
description: How embedded apps authenticate users and send xAPI statements — identity tokens, X-VP, and common 401s.
---

# Embedded App Auth & xAPI

The most-asked integration questions in one place: how your embedded app gets the user's identity, and how it records learning activity (xAPI) for that user.

## Getting the user's identity

Inside LearnCard, use the Partner Connect SDK — the host handles all authentication:

```typescript
const { token, user } = await learnCard.requestIdentity();
// user.did → the user's DID (e.g. did:web:learncard.app:users:alice)
// token   → a JWT signed by LearnCard, for verifying the user on YOUR backend
```

Use `token` to authenticate the user against **your own** backend (verify the JWT, then trust `user.did` as the user's stable identifier).

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

If your app runs inside schools or districts with network filtering, ask IT to allow outbound traffic to these domains. (This is separate from the SDK's `hostOrigin` setting, which controls which LearnCard hosts your app will accept messages from.)

| Domain                  | Purpose                        |
| ----------------------- | ------------------------------ |
| `learncard.app`         | The LearnCard host application |
| `network.learncard.com` | LearnCloud Network API         |
| `cloud.learncard.com`   | LearnCloud Storage / xAPI      |

(Self-hosted or staging environments use their own domains — check your tenant configuration.)

## End-to-end shape

```
User opens your app in LearnCard
  → requestIdentity() → { user.did, token }
  → your backend verifies token, links user.did to your account
  → learning activity happens
  → xAPI statement (actor = user.did) sent with X-VP presentation JWT
  → LearnCloud verifies VP, stores the statement
```

Questions this page doesn't answer? [Open an issue](https://github.com/learningeconomy/LearnCard/issues/new/choose) or email [sdk@learningeconomy.io](mailto:sdk@learningeconomy.io).
