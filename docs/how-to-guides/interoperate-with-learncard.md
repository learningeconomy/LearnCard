---
description: 'How-To Guide: Interoperating with LearnCard'
---

# Interoperate with LearnCard

This guide provides practical, standards-based recipes for sending credentials to and receiving credentials from a LearnCard Passport. Our platform is built on open standards like [VC-API](https://w3c-ccg.github.io/vc-api) to ensure seamless interoperability across the ecosystem.

This guide is for developers who want to enable their applications to interact with LearnCard or any other standards-compliant wallet.

## 1. Sending a Credential TO a LearnCard Passport

There are two primary, standards-based methods for sending a credential to a user's passport.

### **Recipe 1a: Sending via a VC-API Deep Link (Simple Method)**

**Goal:** Your application has issued a credential, and you want to give your user a simple "Send to LearnCard" button to add it to their passport.

**Method:** We will use a **VC-API Deep Link**. This is the simplest way to initiate an issuance flow, as it puts the responsibility on the LearnCard app to "pull" the credential from your server.

**The Recipe:**

1. **Create a** [**VC-API Endpoint**](https://w3c-ccg.github.io/vc-api)**:** Your server must expose an endpoint that can initiate a VC-API exchange. When LearnCard calls this endpoint, it should respond with the credential you want to send.
2. **Construct the Deep Link:** In your application's UI, create a link or button that points to the LearnCard deep link format. The `vc_request_url` parameter should be the URL of your endpoint from Step 1.
3. **Redirect the User:** When the user clicks the link, they will be taken to their LearnCard Passport, which will automatically initiate the exchange with your server to claim the credential.

**Example:**

<pre class="language-javascript"><code class="lang-javascript">=== "JavaScript (Frontend)"
<strong>// Your server has an endpoint ready at https://api.my-app.com/issue/xyz 
</strong><strong>const vcApiEndpoint = 'https://api.my-app.com/issue/xyz';
</strong>
// Construct the deep link
const learnCardDeepLink = `https://learncard.app/request?vc_request_url=${encodeURIComponent(vcApiEndpoint)}`;

// When a user clicks your "Send to LearnCard" button, redirect them:
window.location.href = learnCardDeepLink;

</code></pre>

**What Happens:**

* The user is seamlessly transitioned to their LearnCard Passport.
* LearnCard automatically makes a request to your `vc_request_url`, follows the VC-API exchange protocol, and pulls the credential into the user's passport.

### **Recipe 1b: Sending via an Interaction URL (Universal Method)**

{% embed url="https://www.loom.com/share/6c4aef61e68d4f0bb3ec92d23e8fb6b1?sid=290d3fa1-cd46-4153-8e42-185cd00366e6" %}
Video showing creating a VC-API interaction URL, and claiming it in LearnCard Native App using VC-API exchange flow.
{% endembed %}

**Goal:** You want to offer a credential via a QR code or link that _any_ standards-compliant wallet can use, providing maximum interoperability.

**Method:** We will use a standard [**Interaction URL**](https://w3c-ccg.github.io/vc-api/#interaction-url-format). This is a two-step process: the wallet first identifies itself, and then you send it the credential.

**The Recipe:**

1. **Generate an Interaction URL:** Create a unique URL for the issuance, ending in `?iuv=1`. Display this as a link or QR code.
2. **Serve Protocols:** When a wallet `GET`s this URL, respond with your `vcapi` exchange endpoint.
3. **Request Identity:** When the wallet `POST`s to your exchange endpoint, your server must first ask "Who are you?". You do this by responding with a `VerifiablePresentationRequest` for a `DIDAuthentication` presentation.
4. **Issue the Credential:** Once the wallet sends back the `DidAuth` presentation, your server verifies it, extracts the holder's DID, and can now respond with a final `VerifiablePresentation` containing the credential.

**Example:**

<pre class="language-javascript"><code class="lang-javascript">=== "Node.js (Server-Side)"
<strong>// Example using Express.js to handle a multi-step issuance exchange
</strong>
// 1. A QR code on your site points to: https://api.my-app.com/issue-offer/xyz?iuv=1

// 2. Handle the initial GET from the wallet for protocol discovery
app.get('/issue-offer/xyz', (req, res) => {
  if (req.headers.accept === 'application/json') {
    return res.json({
      protocols: {
        vcapi: 'https://api.my-app.com/vc-api/issue-exchange/xyz'
      }
    });
  }
  res.send('Please scan this with a digital passport to claim your credential.');
});

// 3 &#x26; 4. Handle the multi-step VC-API exchange
app.post('/vc-api/issue-exchange/xyz', async (req, res) => {
  // Check if the wallet is responding with its identity (DidAuth VP)
  if (req.body.verifiablePresentation &#x26;&#x26; req.body.verifiablePresentation.proof) {
    // Step 4: Wallet has identified itself.
    // You must verify the DidAuth presentation to get the holder's DID securely.
    const holderDid = await verifyDidAuth(req.body.verifiablePresentation);

    // Now, create the credential specifically for that holder
    const issuedCredential = createCredentialFor(holderDid); // Your logic here

    // Respond with the final credential
    return res.status(200).json({
      verifiablePresentation: {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiablePresentation'],
        verifiableCredential: [issuedCredential]
      }
    });

  } else {
    // Step 3: This is the first POST from the wallet. Request its identity.
    const didAuthRequest = {
      verifiablePresentationRequest: {
        query: [{ type: "DIDAuthentication" }],
        challenge: "a-unique-challenge-for-this-session",
        domain: "my-app.com"
      }
    };
    return res.status(200).json(didAuthRequest);
  }
});
</code></pre>



## 2. Receiving a Credential FROM a LearnCard Passport

**Goal:** You want to verify a user's credential to grant them access to a service, confirm a skill, or pre-fill a form.

**Method:** We will use a standard [**Interaction URL**](https://w3c-ccg.github.io/vc-api/#interaction-url-format) to request a credential from the user. This is typically presented as a QR code or a clickable link.

**The Recipe:**

1. **Generate an Interaction URL:** For each verification session, your server should generate a unique URL. This URL must follow the standard, ending in `?iuv=1`.
2. **Serve a Protocols Response:** When a wallet (like LearnCard) performs an HTTP `GET` on this Interaction URL with an `Accept: application/json` header, your server must respond with a JSON object listing the supported protocols. The key is the `vcapi` protocol, which points to your exchange endpoint.
3. **Initiate the Exchange:** The wallet will then make a `POST` request to your `vcapi` service endpoint. Your server's first move in this exchange is to respond with a `VerifiablePresentationRequest`, asking for the specific credential you need.
4. **Receive and Verify:** The wallet will respond with a `VerifiablePresentation` containing the credential. Your server can then verify its authenticity and grant access.

**Example:**

````javascript
=== "Node.js (Server-Side)" 
/ Example using Express.js to handle the interaction
// 1. A user visits your verification page, which displays a QR code
//    pointing to: https://api.my-app.com/verify/session-123?iuv=1

// 2. Your server handles the GET request from the wallet
app.get('/verify/session-123', (req, res) => {
  // Check for the standard content negotiation header
  if (req.headers.accept === 'application/json') {
    // Respond with the supported protocols
    return res.json({
      protocols: {
        // This is the endpoint where the actual exchange will happen
        vcapi: 'https://api.my-app.com/vc-api/exchange/session-123'
      }
    });
  }
  // If it's a regular browser, show a human-readable page
  res.send('Please scan this with LearnCard.');
});

// 3. The wallet POSTs to your exchange endpoint to start the flow
app.post('/vc-api/exchange/session-123', (req, res) => {
  // For the first interaction, we request the credential we need.
  const presentationRequest = {
    verifiablePresentationRequest: {
      query: [{
        type: "QueryByExample",
        credentialQuery: [{
          reason: "We need to verify your 'Advanced JavaScript' certificate.",
          example: {
            type: "CertificateOfCompletion",
            credentialSubject: { course: "Advanced JavaScript" }
          }
        }]
      }],
      challenge: "a-unique-challenge-string",
      domain: "my-app.com"
    }
  };
  res.status(200).json(presentationRequest);
});
```

````

## 3. How LearnCard's Universal Inbox is Interoperable

**Goal:** Understand how the `claimUrl` you receive from the [Universal Inbox API](send-credentials.md) can be used by _any_ standards-compliant wallet, not just LearnCard.

**Method:** The `claimUrl` is simply a pre-built **Interaction URL**. It follows the exact same content negotiation standard described in Recipe 2.

**The Recipe:**

An external wallet application can treat the `claimUrl` as an interoperable endpoint.

1. **Fetch with Content Negotiation:** The wallet performs an HTTP `GET` on the `claimUrl`, but with a crucial difference: it sets the `Accept` header to `application/json`.
2. **Receive Protocols:** The LearnCard server will detect this header and respond with the JSON `protocols` object, including the `vcapi` endpoint where the credential claim exchange can be initiated.
3. **Initiate VC-API Exchange:** The external wallet can then proceed with the standard VC-API flow at the provided endpoint to claim the credential on behalf of its user.

**Example:**

````bash
=== "cURL (Wallet Simulation)"
# An external wallet performing content negotiation on a LearnCard claim URL
# The claim URL you received from the Universal Inbox API:
# https://learncard.app/interactions/abc123xyz?iuv=1

curl -X GET "https://learncard.app/interactions/abc123xyz?iuv=1" \
  -H "Accept: application/json"

# The LearnCard server responds with the protocols:
# {
#   "protocols": {
#     "vcapi": "https://api.learncard.com/v1/workflows/inbox-claim/exchanges/abc123xyz",
#     "website": "https://learncard.app/interactions/abc123xyz"
#   }
# }
```

````

**What Happens:** The external wallet now has the direct VC-API endpoint it needs to start the claim flow. This demonstrates how the Universal Inbox is not a closed system, but a powerful issuance tool built on top of open, interoperable standards.
