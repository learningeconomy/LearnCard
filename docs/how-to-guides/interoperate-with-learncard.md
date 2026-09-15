---
description: Already issue credentials? Make LearnCard a place your users can claim them — with the protocol you use today, no new APIs required.
---

# Bring Your Credentials into LearnCard

If you already issue credentials, you don't need to change how. LearnCard accepts credentials over OID4VCI and VC-API, imports credential files, and answers verifiers over OID4VP and VC-API. Find how you issue today and follow that path.

{% hint style="info" %}
**~15 min** · You already issue credentials somewhere else.
{% endhint %}

## Pick your path

| How you issue today                              | What to do                                                                                                                                                       | Effort     |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| **OID4VCI**                                      | Show your credential offer as a QR code or link. [Path 1](#path-1-oid4vci-you-already-have-a-credential-offer)                                                   | None       |
| **VC-API** exchanges                             | Link to `learncard.app/request?vc_request_url=…`, or publish an Interaction URL. [Path 2](#path-2-vc-api-deep-link-or-interaction-url)                           | Minutes    |
| **Signed VC / Open Badge JSON**, no protocol yet | One `POST /api/send` with the signed credential — LearnCard emails a claim link. Or let users import the file. [Path 3](#path-3-you-have-signed-credential-json) | 15 minutes |
| **A wallet selector / "Add to wallet" page**     | Add a LearnCard option that opens your OID4VCI offer or the VC-API deep link. [Path 4](#path-4-add-learncard-to-your-wallet-selector)                            | Minutes    |
| **CHAPI**                                        | Not supported in the LearnCard app. Use Path 1 or 2.                                                                                                             | An hour    |
| **Not on an open standard yet**                  | Start with Path 3. You can adopt OID4VCI or VC-API later.                                                                                                        | 15 minutes |

Need to **verify** a credential a LearnCard user holds? See [Requesting credentials from a LearnCard user](#requesting-credentials-from-a-learncard-user).

---

## Path 1: OID4VCI — you already have a credential offer

LearnCard is an [OpenID for Verifiable Credential Issuance](https://openid.net/specs/openid-4-verifiable-credential-issuance-1_0.html) wallet. If your issuer produces a credential offer, LearnCard can claim it.

**What LearnCard accepts**

- Offers by value (`credential_offer=`) or by reference (`credential_offer_uri=`), as an `openid-credential-offer://` link or QR code
- Grants: `urn:ietf:params:oauth:grant-type:pre-authorized_code` (with or without a transaction code) and `authorization_code`
- Formats: `jwt_vc_json`, `ldp_vc`, and SD-JWT VC — with Ed25519Signature2020, DataIntegrityProof (EdDSA), and SD-JWT proofs

**What your user sees:** they scan or tap the offer, LearnCard opens and shows the issuer and credential, they tap **Accept**. With `authorization_code`, LearnCard sends them to your authorization page and back first.

{% hint style="info" %}
There is nothing to register with LearnCard. Add a LearnCard logo next to your QR code and you're done.
{% endhint %}

---

## Path 2: VC-API — deep link or Interaction URL

LearnCard is a [VC-API](https://w3c-ccg.github.io/vc-api/) wallet. Two ways to point it at your exchange:

### 2a. Deep link (simplest)

Link to LearnCard with your exchange URL. LearnCard opens, `POST`s to it, and runs the exchange:

```javascript
const exchangeUrl = 'https://api.my-app.com/exchanges/abc123'; // your VC-API exchange endpoint

const addToLearnCard = `https://learncard.app/request?vc_request_url=${encodeURIComponent(exchangeUrl)}`;

// Put this behind your "Add to LearnCard" button
window.location.href = addToLearnCard;
```

### 2b. Interaction URL (works with any wallet)

Publish a URL ending in `?iuv=1` as a link or QR code. Wallets `GET` it with `Accept: application/json` to learn which protocols you offer. LearnCard reads the `vcapi`, `openid4vci`, and `openid4vp` keys.

```javascript
// Express.js. The QR code points to https://api.my-app.com/offers/abc123?iuv=1

app.get('/offers/:id', (req, res) => {
    if (req.accepts('json') && !req.accepts('html')) {
        return res.json({
            protocols: {
                vcapi: `https://api.my-app.com/exchanges/${req.params.id}`,
                // openid4vci: 'openid-credential-offer://?credential_offer_uri=…', // optional
            },
        });
    }
    res.send('Scan this with your digital wallet to claim your credential.');
});
```

### What the exchange looks like

The wallet `POST`s `{}` to your exchange URL. You reply with one of:

- **The credential**, if you don't need to know who is claiming: `{ "verifiablePresentation": { …, "verifiableCredential": [ yourSignedCredential ] } }`
- **A request for identity**, to bind the credential to the holder's DID: `{ "verifiablePresentationRequest": { "query": [{ "type": "DIDAuthentication" }], "challenge": "…", "domain": "…" } }`. LearnCard answers with a signed DID-auth presentation; you reply with the credential.
- **A redirect**: `{ "redirectUrl": "https://my-app.com/done" }`

```javascript
app.post('/exchanges/:id', async (req, res) => {
    const vp = req.body?.verifiablePresentation;

    if (!vp) {
        // First turn: ask who is claiming
        return res.json({
            verifiablePresentationRequest: {
                query: [{ type: 'DIDAuthentication' }],
                challenge: newChallengeFor(req.params.id),
                domain: 'my-app.com',
            },
        });
    }

    // Second turn: verify the DID-auth presentation, then issue to that holder
    const holderDid = await verifyDidAuth(vp, expectedChallengeFor(req.params.id)); // your verifier
    const credential = await issueTo(holderDid, req.params.id); // your issuance

    return res.json({
        verifiablePresentation: {
            '@context': ['https://www.w3.org/ns/credentials/v2'],
            type: ['VerifiablePresentation'],
            verifiableCredential: [credential],
        },
    });
});
```

**What your user sees:** LearnCard opens, shows the issuer and credential, they tap **Accept**.

---

## Path 3: You have signed credential JSON

You have signed W3C Verifiable Credentials or Open Badges 3.0 files but no wallet protocol. Two options. In both, you remain the issuer; LearnCard only delivers.

### 3a. Send it — one API call

`POST /api/send` with your signed credential and the recipient's email or phone. LearnCard emails a claim link, or delivers directly if they already use LearnCard. You need an API token with scope `boosts:write` ([setup](deploy-infrastructure/generate-api-tokens.md)).

```bash
curl -X POST https://network.learncard.com/api/send \
  -H "Authorization: Bearer $LEARNCARD_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "boost",
    "recipient": "learner@example.com",
    "signedCredential": { "...": "your signed VC or OBv3, proof included" }
  }'
```

The response is `PENDING` (claim link emailed) or `ISSUED` (delivered). The claim link is an Interaction URL, so it also works in [other wallets](#universal-inbox-claim-links-work-in-any-wallet). Full details: [Send & Issue Credentials](send-credentials.md).

### 3b. Let users import the file

In the LearnCard app, users can paste credential JSON or upload a `.json` file from the claim screen. LearnCard verifies the signature and shows the credential before saving it. If you already offer a "Download credential" button, this works with no changes.

---

## Path 4: Add LearnCard to your wallet selector

If you show users a list of wallets, add LearnCard with whichever link you have:

| You have…             | LearnCard entry opens…                                          |
| --------------------- | --------------------------------------------------------------- |
| An OID4VCI offer      | `openid-credential-offer://?credential_offer_uri=<encoded URL>` |
| A VC-API exchange URL | `https://learncard.app/request?vc_request_url=<encoded URL>`    |
| An Interaction URL    | The URL itself (ending `?iuv=1`)                                |

Logo and brand assets: [learncard.com](https://www.learncard.com). Users without the app are prompted to install it, then continue.

---

## Requesting credentials from a LearnCard user

To verify a credential a user holds, request it over either standard:

- **OID4VP** — send an authorization request as an `openid4vp://` link or QR code. LearnCard supports DCQL and DIF Presentation Exchange queries and returns `jwt_vc_json`, `ldp_vc`, or SD-JWT VC presentations.
- **VC-API** — publish an Interaction URL (`?iuv=1`) whose exchange replies with a `QueryByExample` request. The user picks a matching credential and LearnCard returns a signed presentation.

```json
{
    "verifiablePresentationRequest": {
        "query": [
            {
                "type": "QueryByExample",
                "credentialQuery": [
                    {
                        "reason": "We need to confirm your Advanced JavaScript certificate.",
                        "example": {
                            "type": "OpenBadgeCredential",
                            "credentialSubject": {
                                "achievement": { "name": "Advanced JavaScript" }
                            }
                        }
                    }
                ]
            }
        ],
        "challenge": "unique-per-session",
        "domain": "my-app.com"
    }
}
```

Verify what comes back with your own verifier, or with LearnCard's — see [Verify Credentials](../tutorials/verify-credentials.md).

---

## Universal Inbox claim links work in any wallet

Every claim link LearnCard emails is an Interaction URL, so other wallets can claim it too:

```bash
curl "https://learncard.app/interactions/inbox-claim/<token>?iuv=1" -H "Accept: application/json"
# {
#   "protocols": {
#     "vcapi": "https://network.learncard.com/api/workflows/inbox-claim/exchanges/<token>"
#   }
# }
```

---

## Test it in five minutes

1. Install LearnCard on a phone ([iOS](https://apps.apple.com/us/app/learncard/id1635841898) · [Android](https://play.google.com/store/apps/details?id=com.learncard.app)) and sign in.
2. Scan your QR code with the phone camera, or tap the link on the phone.
3. LearnCard opens and shows your issuer name and the credential. Tap **Accept**.
4. Open the credential in the wallet. It should show your name, image, and description, and be marked verified.

| If…                                              | Then                                                                                                                                            |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| The camera opens a web page instead of LearnCard | Only `https://learncard.app/…` links open the app. Use `openid-credential-offer://`, `learncard.app/request?vc_request_url=`, or a `?iuv=1` URL |
| "Couldn't reach the issuer"                      | Your `?iuv=1` endpoint must return JSON when `Accept: application/json` is sent, and your exchange URL must accept a `POST` with `{}`           |
| Credential shows as unverified                   | Check that the issuer DID resolves publicly and every `@context` URL is reachable                                                               |
| OID4VCI offer opens but fails after **Accept**   | Check that your token endpoint accepts the grant in the offer and your credential endpoint returns `jwt_vc_json`, `ldp_vc`, or SD-JWT VC        |

---

## Next steps

- [The fields that make a credential yours](../core-concepts/credentials-and-data/building-verifiable-credentials.md#fields-that-make-a-credential-yours) — achievement types, images, and display hints so it looks right in the wallet.
- [Connect a User's LearnCard to Your Platform](../tutorials/create-a-consentflow.md) — ongoing, automatic issuance instead of one-off claims.
- [Network API](../sdks/learncard-network/README.md) and [Wallet SDK](../sdks/learncard-core/README.md) — if you're building a wallet or verifier.
- Questions: [open an issue](https://github.com/learningeconomy/LearnCard/issues/new/choose) or email [sdk@learningeconomy.io](mailto:sdk@learningeconomy.io).
