---
description: Already issue credentials? Make LearnCard a place your users can claim them — with the protocol you use today, no new APIs required.
---

# Bring Your Credentials into LearnCard

You already issue credentials — over OID4VCI, VC-API, as signed JSON files, or through your own "add to wallet" page. You don't need to re-platform. LearnCard is a standards-compliant wallet: it **accepts** credentials over OID4VCI and VC-API, imports plain credential files, and **answers** verifiers over OID4VP and VC-API. Find your row, do the one thing in the second column, and LearnCard is a supported destination.

## Pick your path

| How you issue today                                                     | What to do                                                                                                                                                       | Effort     |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| **OID4VCI** (walt.id, Sphereon, EUDI-style issuers, most modern stacks) | Nothing new — show your credential offer as a QR code or link. [Path 1](#path-1-oid4vci-you-already-have-a-credential-offer)                                     | None       |
| **VC-API** exchanges                                                    | Link to `learncard.app/request?vc_request_url=…`, or publish an Interaction URL. [Path 2](#path-2-vc-api-deep-link-or-interaction-url)                           | Minutes    |
| **Signed VC / Open Badge JSON**, no protocol yet                        | One `POST /api/send` with the signed credential — LearnCard emails a claim link. Or let users import the file. [Path 3](#path-3-you-have-signed-credential-json) | 15 minutes |
| **A wallet selector / "Add to wallet" page**                            | Add a LearnCard option that opens your OID4VCI offer or the VC-API deep link. [Path 4](#path-4-add-learncard-to-your-wallet-selector)                            | Minutes    |
| **CHAPI**                                                               | The LearnCard app no longer handles CHAPI. Use Path 1 or 2 — both are a small change for a CHAPI issuer.                                                         | An hour    |
| **Not on an open standard yet**                                         | Start with Path 3 today; adopt OID4VCI or VC-API later without changing anything for your users.                                                                 | 15 minutes |

Need to **verify** a credential a LearnCard user holds? See [Requesting credentials from a LearnCard user](#requesting-credentials-from-a-learncard-user).

---

## Path 1: OID4VCI — you already have a credential offer

LearnCard implements [OpenID for Verifiable Credential Issuance](https://openid.net/specs/openid-4-verifiable-credential-issuance-1_0.html) as a wallet. If your issuer produces a credential offer, you're done.

**What LearnCard accepts**

- Offers by value (`credential_offer=`) or by reference (`credential_offer_uri=`), via the standard `openid-credential-offer://` scheme or a QR code of it
- Grants: `urn:ietf:params:oauth:grant-type:pre-authorized_code` (with or without a transaction code) and `authorization_code`
- Formats: `jwt_vc_json`, `ldp_vc`, and SD-JWT VC — with Ed25519Signature2020, DataIntegrityProof (EdDSA), and SD-JWT proofs

This is exercised in CI on every change against walt.id and Sphereon issuers and the EUDI reference wallet's test vectors, so it stays working.

**What your user sees:** they scan or tap the offer → LearnCard opens and shows the issuer and the credential(s) being offered → they tap **Accept** → it's in their wallet. If your flow uses `authorization_code`, LearnCard sends them to your authorization page and back.

{% hint style="info" %}
Put a LearnCard logo next to the QR code and you have a supported destination. There is nothing to register with us.
{% endhint %}

---

## Path 2: VC-API — deep link or Interaction URL

LearnCard implements the [VC-API exchange protocol](https://w3c-ccg.github.io/vc-api/) as a wallet. Two ways to point it at your exchange:

### 2a. Deep link (simplest)

Send the user to LearnCard with your exchange URL. LearnCard opens, `POST`s to it, and follows the exchange:

```javascript
const exchangeUrl = 'https://api.my-app.com/exchanges/abc123'; // your VC-API exchange endpoint

const addToLearnCard = `https://learncard.app/request?vc_request_url=${encodeURIComponent(exchangeUrl)}`;

// Put this behind your "Add to LearnCard" button
window.location.href = addToLearnCard;
```

### 2b. Interaction URL (works with any wallet)

Publish a URL ending in `?iuv=1` as a link or QR code. Any standards-compliant wallet — including LearnCard — `GET`s it with `Accept: application/json` and reads which protocols you offer. LearnCard honors `vcapi`, `openid4vci`, and `openid4vp` keys, so one QR code can serve several protocols.

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

The wallet starts by `POST`ing `{}` to your exchange URL. You reply with **one** of:

- **The credential**, if you don't need to know who's claiming: `{ "verifiablePresentation": { …, "verifiableCredential": [ yourSignedCredential ] } }`
- **A request for identity**, if you want to bind the credential to the holder's DID: `{ "verifiablePresentationRequest": { "query": [{ "type": "DIDAuthentication" }], "challenge": "…", "domain": "…" } }`. LearnCard answers with a signed DID-auth presentation; you reply with the credential on the next turn.
- **A redirect**, to send the user somewhere afterwards: `{ "redirectUrl": "https://my-app.com/done" }`

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

**What your user sees:** LearnCard opens, shows who's offering what, they tap **Accept**, done.

---

## Path 3: You have signed credential JSON

You have valid, signed W3C Verifiable Credentials or Open Badges 3.0 files but no wallet protocol in front of them. Two options — both leave you as the issuer; LearnCard only delivers.

### 3a. Send it — one API call

`POST /api/send` with your already-signed credential and the recipient's email (or phone). LearnCard emails a claim link; if they already use LearnCard it lands directly in their wallet. No signing authority, no key ceremony — just an API token with scope `boosts:write` ([2-minute setup](deploy-infrastructure/generate-api-tokens.md)).

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

The response tells you whether it was `PENDING` (claim link emailed) or `ISSUED` (already delivered). The claim link is itself an Interaction URL, so it works in [any standards-compliant wallet](#universal-inbox-claim-links-work-in-any-wallet). Full details: [Send & Issue Credentials](send-credentials.md).

### 3b. Let users import the file

In the LearnCard app, users can paste credential JSON or upload a `.json` file from the claim screen. LearnCard verifies the signature and shows the credential before saving it. This makes an existing "Download credential" button a supported path with no work on your side — just tell users LearnCard accepts the file.

---

## Path 4: Add LearnCard to your wallet selector

If you already show users a list of wallets, add LearnCard with whichever link you have:

| You have…             | LearnCard entry opens…                                                                                                     |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| An OID4VCI offer      | `openid-credential-offer://?credential_offer_uri=<encoded URL>` — LearnCard registers this scheme on iOS, Android, and web |
| A VC-API exchange URL | `https://learncard.app/request?vc_request_url=<encoded URL>`                                                               |
| An Interaction URL    | The URL itself (ending `?iuv=1`) — LearnCard negotiates the protocol                                                       |

Logo and brand assets: [learncard.com](https://www.learncard.com). Users without the app are taken to install it and then continue the same flow.

---

## Requesting credentials from a LearnCard user

To **verify** something a user holds (gate a course, confirm a certification, pre-fill a form), LearnCard responds as a holder over either standard:

- **OID4VP** — send an authorization request via `openid4vp://` (or a QR of it). LearnCard supports DCQL and DIF Presentation Exchange queries and returns `jwt_vc_json`, `ldp_vc`, or SD-JWT VC presentations, with selective disclosure where the format allows.
- **VC-API** — publish an Interaction URL (`?iuv=1`) whose exchange replies with a `verifiablePresentationRequest` using `QueryByExample`; LearnCard lets the user pick a matching credential and returns a signed presentation.

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

Every claim link LearnCard emails (from `send()` / `POST /api/send`) is an Interaction URL. Another wallet can negotiate it exactly as LearnCard would:

```bash
curl "https://learncard.app/interactions/inbox-claim/<token>?iuv=1" -H "Accept: application/json"
# {
#   "protocols": {
#     "vcapi": "https://network.learncard.com/api/workflows/inbox-claim/exchanges/<token>"
#   }
# }
```

So credentials you send through LearnCard aren't locked in — they can be claimed into any VC-API-capable wallet.

---

## Test it in five minutes

1. Install LearnCard on a phone ([iOS](https://apps.apple.com/us/app/learncard/id1635841898) · [Android](https://play.google.com/store/apps/details?id=com.learncard.app)) and sign in.
2. Show your QR code or link on a laptop and scan it with the phone camera (or tap the link on the phone).
3. LearnCard opens with your issuer name and a credential preview; tap **Accept**.
4. Open the credential in the wallet — your name, image, and description appear and it shows as verified.

| If…                                              | Then                                                                                                                                                              |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The camera opens a web page instead of LearnCard | For `https://` links LearnCard only claims URLs on `learncard.app`. Use the `openid-credential-offer://` scheme, the `/request?vc_request_url=` form, or `?iuv=1` |
| "Couldn't reach the issuer"                      | Your `?iuv=1` endpoint must return JSON when `Accept: application/json` is sent, and your exchange URL must accept a `POST` with `{}`                             |
| Credential shows as unverified                   | LearnCard checks the proof. Make sure the issuer DID resolves publicly and every `@context` URL is reachable                                                      |
| OID4VCI offer opens but fails after **Accept**   | Confirm your token endpoint honors the grant in the offer and your credential endpoint returns `jwt_vc_json`, `ldp_vc`, or SD-JWT VC                              |

---

## Next steps

- Want the credential to look great in the wallet? [Design a Custom Credential](../tutorials/create-a-credential.md) covers achievement types, images, and display hints.
- Want ongoing, automatic issuance instead of one-off claims? [Connect Your Website or Game](connect-systems/connect-a-website.md).
- Building a wallet or verifier yourself? The [Network API](../sdks/learncard-network/README.md) and [Wallet SDK](../sdks/learncard-core/README.md).
- Stuck on a protocol detail? [Open an issue](https://github.com/learningeconomy/LearnCard/issues/new/choose) or email [sdk@learningeconomy.io](mailto:sdk@learningeconomy.io) — we'd genuinely like to know which issuers you're connecting.
