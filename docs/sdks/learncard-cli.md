# LearnCard CLI

**LearnCard CLI** is an easy to use node REPL that instantiates a Learn Card wallet for you and gives you all the tools you need to easily play around with the Learn Card SDK!

### Usage

```bash
npx @learncard/cli

# Optionally specify a deterministic seed to instantiate the wallet with
npx @learncard/cli 1b498556081a298261313657c32d5d0a9ce8285dc4d659e6787392207e4a7ac2h
```

### Getting Started

<figure><img src="../.gitbook/assets/Screen Shot 2022-09-29 at 6.08.26 PM.png" alt=""><figcaption><p>Run npx @learncard/cli to boot up the CLI - you should see this screen in your terminal! </p></figcaption></figure>

From within the CLI, you should be able to start playing around with a basic learn card wallet. When the CLI boots up, it creates a default LearnCard called `wallet` that you can interact with.

### Basic Usage

#### View your wallet's DID

One of the easiest ways to interact with your wallet, is to get your wallet's DID:

```javascript
wallet.did()
// 'did:key:z6MkuWb1dvhvime3BZdiuRGi1Q41o4h4hS5ZUizwBiGw3SU6'

wallet.did('pkh:sol');
// 'did:pkh:sol:G4Ky3gTVPE9a54o2DrJsAJW1yVRDHYqCni61MSJv8Dgi'

wallet.did('tz');
// 'did:tz:tz1Y2Rg8ofGpdGpRqHfix3yy4J6qqK19NE5h'

wallet.did('pkh:tz');
// 'did:pkh:tz:tz1Y2Rg8ofGpdGpRqHfix3yy4J6qqK19NE5h'
```

If your wallet is initialized to support more did methods, such as `did:web`, you could retrieve the corresponding DID through this function.&#x20;

#### Basic Verifiable Credential Issuance & Verification Flow

Once the CLI has booted up, you can start issuing credentials. Try a basic Verifiable Credential issuance and verification flow, for example:

```javascript
// Create a new, unsigned test Verifiable Credential
const unsignedVerifiableCredential = wallet.getTestVc();
/**
{
  '@context': [ 'https://www.w3.org/2018/credentials/v1' ],
  id: 'http://example.org/credentials/3731',
  type: [ 'VerifiableCredential' ],
  issuer: 'did:key:z6MkuWb1dvhvime3BZdiuRGi1Q41o4h4hS5ZUizwBiGw3SU6',
  issuanceDate: '2020-08-19T21:41:50Z',
  credentialSubject: { id: 'did:example:d23dd687a7dc6787646f2eb98d0' }
}
*/

// Then, issue the credential to yourself (i.e. sign the credential to turn it into a verifiable credential)
const signedVerifiableCredential = await wallet.issueCredential(unsignedVerifiableCredential);
/** 
{
  '@context': [ 'https://www.w3.org/2018/credentials/v1' ],
  id: 'http://example.org/credentials/3731',
  type: [ 'VerifiableCredential' ],
  credentialSubject: { id: 'did:example:d23dd687a7dc6787646f2eb98d0' },
  issuer: 'did:key:z6MkuWb1dvhvime3BZdiuRGi1Q41o4h4hS5ZUizwBiGw3SU6',
  issuanceDate: '2020-08-19T21:41:50Z',
  proof: {
    type: 'Ed25519Signature2018',
    proofPurpose: 'assertionMethod',
    verificationMethod: 'did:key:z6MkuWb1dvhvime3BZdiuRGi1Q41o4h4hS5ZUizwBiGw3SU6#z6MkuWb1dvhvime3BZdiuRGi1Q41o4h4hS5ZUizwBiGw3SU6',
    created: '2022-09-30T15:33:51.015Z',
    jws: 'eyJhbGciOiJFZERTQSIsImNyaXQiOlsiYjY0Il0sImI2NCI6ZmFsc2V9..NkaBWEFT2JCU1ZjMSGmbL72EPhVsAsLykAHULee2uh8YdqBqJbti_FmplQQvGnPDy80pbrFRA-IYQQUx11ISCw'
  }
}
**/

// Then, verify the credential! 
// The verifies that the credential is valid, has not been tampered with, and was issued by and to the correct DIDs
await wallet.verifyCredential(signedVerifiableCredential);
/**
[
  { status: 'Success', check: 'proof', message: 'Valid' },
  {
    status: 'Success',
    check: 'expiration',
    message: 'Valid • Does Not Expire'
  }
]
**/
```

#### Basic Verifiable Presentation Issuance & Verification Flow

Now, take the `signedVerifiableCredential` you created in the [VC issuance flow above](learncard-cli.md#basic-verifiable-credential-issuance-and-verification-flow), and try wrapping it into a Verifiable Presentation, and verifying it.&#x20;

<pre class="language-javascript"><code class="lang-javascript">// Get an unsigned, test Verifiable Presentation template containing your signe dVC
const unsignedVerifiablePresentation = await wallet.getTestVp(signedVerifiableCredential);
/**
{
  '@context': [ 'https://www.w3.org/2018/credentials/v1' ],
  type: [ 'VerifiablePresentation' ],
  holder: 'did:key:z6MkuWb1dvhvime3BZdiuRGi1Q41o4h4hS5ZUizwBiGw3SU6',
  verifiableCredential: {
    '@context': [ 'https://www.w3.org/2018/credentials/v1' ],
    id: 'http://example.org/credentials/3731',
    type: [ 'VerifiableCredential' ],
    credentialSubject: { id: 'did:example:d23dd687a7dc6787646f2eb98d0' },
    issuer: 'did:key:z6MkuWb1dvhvime3BZdiuRGi1Q41o4h4hS5ZUizwBiGw3SU6',
    issuanceDate: '2020-08-19T21:41:50Z',
    proof: {
      type: 'Ed25519Signature2018',
      proofPurpose: 'assertionMethod',
      verificationMethod: 'did:key:z6MkuWb1dvhvime3BZdiuRGi1Q41o4h4hS5ZUizwBiGw3SU6#z6MkuWb1dvhvime3BZdiuRGi1Q41o4h4hS5ZUizwBiGw3SU6',
      created: '2022-09-30T15:33:51.015Z',
      jws: 'eyJhbGciOiJFZERTQSIsImNyaXQiOlsiYjY0Il0sImI2NCI6ZmFsc2V9..NkaBWEFT2JCU1ZjMSGmbL72EPhVsAsLykAHULee2uh8YdqBqJbti_FmplQQvGnPDy80pbrFRA-IYQQUx11ISCw'
    }
  }
}
**/

// Issue (sign) the Verifiable Presentation 
<strong>const verifiablePresentation = await wallet.issuePresentation(unsignedVerifiablePresentation);
</strong>/**
{
  '@context': [ 'https://www.w3.org/2018/credentials/v1' ],
  type: [ 'VerifiablePresentation' ],
  verifiableCredential: {
    '@context': [ 'https://www.w3.org/2018/credentials/v1' ],
    id: 'http://example.org/credentials/3731',
    type: [ 'VerifiableCredential' ],
    credentialSubject: { id: 'did:example:d23dd687a7dc6787646f2eb98d0' },
    issuer: 'did:key:z6MkuWb1dvhvime3BZdiuRGi1Q41o4h4hS5ZUizwBiGw3SU6',
    issuanceDate: '2020-08-19T21:41:50Z',
    proof: {
      type: 'Ed25519Signature2018',
      proofPurpose: 'assertionMethod',
      verificationMethod: 'did:key:z6MkuWb1dvhvime3BZdiuRGi1Q41o4h4hS5ZUizwBiGw3SU6#z6MkuWb1dvhvime3BZdiuRGi1Q41o4h4hS5ZUizwBiGw3SU6',
      created: '2022-09-30T15:33:51.015Z',
      jws: 'eyJhbGciOiJFZERTQSIsImNyaXQiOlsiYjY0Il0sImI2NCI6ZmFsc2V9..NkaBWEFT2JCU1ZjMSGmbL72EPhVsAsLykAHULee2uh8YdqBqJbti_FmplQQvGnPDy80pbrFRA-IYQQUx11ISCw'
    }
  },
  proof: {
    type: 'Ed25519Signature2018',
    proofPurpose: 'assertionMethod',
    verificationMethod: 'did:key:z6MkuWb1dvhvime3BZdiuRGi1Q41o4h4hS5ZUizwBiGw3SU6#z6MkuWb1dvhvime3BZdiuRGi1Q41o4h4hS5ZUizwBiGw3SU6',
    created: '2022-09-30T15:41:39.175Z',
    jws: 'eyJhbGciOiJFZERTQSIsImNyaXQiOlsiYjY0Il0sImI2NCI6ZmFsc2V9..iOAHkQiIp5fi9IiuKIxCAnTQ-A7BL8cbCVAF_-pwDr5uvewWHuk1UISoElVSzeDxBO_OjsjDJ4qZeowwZ4WEDA'
  },
  holder: 'did:key:z6MkuWb1dvhvime3BZdiuRGi1Q41o4h4hS5ZUizwBiGw3SU6'
}
**/

// Verify the Verifiable Presentation has not been tampered with.
await wallet.verifyPresentation(verifiablePresentation);
/**
{ checks: [ 'proof' ], warnings: [], errors: [] }
**/
</code></pre>

#### Initialize more LearnCard wallets

At any point, you can initialize additional wallets in the CLI, which can be helpful for testing cross-wallet flows:

```javascript
// Initialize an empty wallet (can not sign credentials)
const emptyWallet = await initLearnCard();

// Initializes a new wallet with deterministically seeded key material.
const seededWallet = await initLearnCard({ seed: 'abc123' });
```

Check out docs on[ initializing LearnCards](learncard-core/construction.md#the-initlearncard-function) for more ways to create a wallet.

#### And beyond!&#x20;

There is a ton of functionality exposed through the CLI. Explore the Usage Examples in LearnCard Wallet SDK:

{% content-ref url="learncard-core/construction.md" %}
[construction.md](learncard-core/construction.md)
{% endcontent-ref %}
