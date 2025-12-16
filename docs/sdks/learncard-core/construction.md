# Usage Examples

## Initialize SDK Client

Depending on your use-case and specific needs, constructing a LearnCard is likely as simple as the following code:

```typescript
import { initLearnCard } from '@learncard/init';

const learnCard = await initLearnCard({ seed: 'abc123' });
```

#### The initLearnCard function

While there are many init functions that are exposed and that can be used, we recommend instead sticking to the `initLearnCard` function.

`initLearnCard` is a config-driven, heavily overloaded function, that allows you to construct a wallet flexibly, without sacrificing type safety.

Under the hood, it is simply a map between the config you provide and the init function you would normally need to call, meaning calls like `initLearnCard()` and `emptyLearnCard()` are identical.

## Example Usage

```typescript
import { initLearnCard } from '@learncard/init';

// Constructs an empty LearnCard without key material (can not sign VCs). 
// Useful for Verifying Credentials only in a light-weight form.
const emptyLearncard = await initLearnCard();

// Constructs a LearnCard from a deterministic seed. 
const learncard = await initLearnCard({ seed: 'abc123' });

// Constructs a LearnCard default connected to LearnCard Network hosted at https://network.learncard.com
const networkLearnCard = await initLearnCard({ seed: 'abc123', network: true });

// Constructs a LearnCard default connected to VC-API at https://bridge.learncard.com for handling signing
const defaultApi = await initLearnCard({ vcApi: true });

// Constructs a LearnCard connected to a custom VC-API, with Issuer DID specified.
const customApi = await initLearnCard({ vcApi: 'vc-api.com', did: 'did:key:123' });

// Constructs a LearnCard connected to a custom VC-API that implements /did discovery endpoint.
const customApiWithDIDDiscovery = await initLearnCard({ vcApi: 'https://bridge.learncard.com' });

// Constructs a LearnCard with no plugins. Useful for building your own bespoke LearnCard
const customLearnCard = await initLearnCard({ custom: true });
```

The examples above are not exhaustive of possible ways to instantiate a LearnCard:

* For more on initialization with a VC-API, check out the [VC-API Plugin](../official-plugins/vc-api.md).&#x20;

#### The learnCardFromSeed function

Helper function to quickly create a LearnCard from seed.

```typescript
import { learnCardFromSeed } from '@learncard/init';

const learnCard = await learnCardFromSeed('abc123');
```

#### The emptyLearnCard function

For a bare-bones LearnCard wallet without any plugins.

```typescript
import { emptyLearncard } from '@learncard/init';

const learnCard = await emptyLearnCard();
```

## Key Generation

{% hint style="danger" %}
**There be dragons here.** 🐉&#x20;

In production environments, take great care and caution when generating and storing key material. Insufficient entropy or insecure storage, among other vectors, can easily compromise your data and identities.&#x20;

**Warning:** Key input should be a hexadecimal string. If you pass a string that is not valid hex, an error will be thrown!
{% endhint %}

{% hint style="warning" %}
**Good to know:** If you do not pass in a string that is 64 characters long. It will be prefixed with zeroes until it is 64 characters. This means that '1' and '001' are identical keys in the eyes of `initLearnCard`.
{% endhint %}

How to generate and store keys is left to you, the consumer. However, if you'd like to simply generate a random key, you can do so with the following code:

{% tabs %}
{% tab title="Browser" %}
```typescript
const randomKey = Array.from(crypto.getRandomValues(new Uint8Array(32)), dec =>
  dec.toString(16).padStart(2, "0")
).join("");
```
{% endtab %}

{% tab title="Node" %}
```typescript
import crypto from 'node:crypto';

const randomKey = crypto.randomBytes(32).toString('hex');
```
{% endtab %}
{% endtabs %}

To speed up instantiation of the wallet, you can host our[ didkit](https://github.com/spruceid/didkit) wasm binary yourself.

{% tabs %}
{% tab title="Webpack 5" %}
<pre class="language-typescript"><code class="lang-typescript">// Make sure you have the didkit plugin installed! pnpm i @learncard/didkit-plugin

import { initLearnCard } from '@learncard/init';
<strong>import didkit from '@learncard/didkit-plugin/dist/didkit/didkit_wasm_bg.wasm';
</strong>
const learnCard = await initLearnCard({ seed: 'abc123', didkit });
</code></pre>
{% endtab %}

{% tab title="Vite" %}
<pre class="language-typescript"><code class="lang-typescript">// Make sure you have the didkit plugin installed! pnpm i @learncard/didkit-plugin

import { initLearnCard } from '@learncard/init';
<strong>import didkit from '@learncard/didkit-plugin/dist/didkit/didkit_wasm_bg.wasm?url';
</strong>
const learnCard = await initLearnCard({ seed: 'abc123', didkit });
</code></pre>
{% endtab %}
{% endtabs %}

If you're curious about what the above code is doing, read more[ here](../official-plugins/didkit.md).

## Create Credentials

### Test Credential

One of the easiest—and fastest—ways to create a credential is to generate a test credential:

```typescript
// Returns an unsigned, test credential in the OBv3 spec.
const unsignedVc = learnCard.invoke.getTestVc();
```

### Basic Boost Credential

In it's most basic form, you can create a Boost credential using the following schema:

```json
{
  "@context": [
    "https://www.w3.org/2018/credentials/v1",
    "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.1.json",
    "https://ctx.learncard.com/boosts/1.0.0.json",
  ],
  "credentialSubject": {
    "achievement": {
      "achievementType": "ext:LCA_CUSTOM:Social Badge:Adventurer",
      "criteria": {
        "narrative": "This badge is awarded for being a adventurer."
      },
      "description": "An adventure badge.",
      "id": "urn:uuid:123",
      "image": "https://i.postimg.cc/s2xdx5Ss/erik-jan-leusink-Ib-Px-GLg-Ji-MI-unsplash.jpg",
      "name": "Adventurer",
      "type": [
        "Achievement"
      ]
    },
    "id": "did:web:network.learncard.com:users:example",
    "type": [
      "AchievementSubject"
    ]
  },
  "display": {
    "backgroundColor": "",
    "backgroundImage": "",
    "displayType": "badge"
  },
  "image": "https://i.postimg.cc/s2xdx5Ss/erik-jan-leusink-Ib-Px-GLg-Ji-MI-unsplash.jpg",
  "skills": [],
  "issuanceDate": "2025-04-01T16:56:00.667Z",
  "issuer": "did:web:network.learncard.com:users:issuer-example",
  "name": "Tabby Cat",
  "type": [
    "VerifiableCredential",
    "OpenBadgeCredential",
    "BoostCredential"
  ]
}
```

### Credentials from Template

But sometimes the test credential is too basic for most use cases. That's why LearnCard has out-of-the-box support for some basic types of credentials, and a simple function to create new credentials:

```typescript
// Returns an unsigned, basic credential
const basicCredential = learnCard.invoke.newCredential({ type: 'basic' });
// Returns an unsigned, achievement credential. 
const achievementCredential = learnCard.invoke.newCredential({ type: 'achievement' });
```

## Issue Credentials

First, make an unsigned [Verifiable Credential](https://www.w3.org/TR/vc-data-model/). You can do this yourself if you already have that set up for your app, or, if you just need to test out working with this library, you can use the `newCredential` method to easily create a test VC.

```typescript
const unsignedVc = learnCard.invoke.newCredential();
```

To sign (or "issue") that VC, simply call `issueCredential`

```typescript
const signedVc = await learnCard.invoke.issueCredential(unsignedVc);
```

## Verify Credentials

After a credential is signed, the credential may be transferred via an exchange mechanism, where a receiving party can verify it! To verify a signed Verifiable Credential, you can use `verifyCredential`

{% tabs %}
{% tab title="Valid Credential" %}
```typescript
const result = await learnCard.invoke.verifyCredential(signedVc);

console.log(result);
// { checks: ['proof', 'expiration'], warnings: [], errors: [] }

// OR, for a more human readable output:

const result = await learnCard.invoke.verifyCredential(signedVc, {}, true);
// [
//     { status: "Success", check: "proof", message: "Valid" },
//     {
//         status: "Success",
//         check: "expiration",
//         message: "Valid • Does Not Expire"
//     }
// ]
```
{% endtab %}

{% tab title="Invalid Credential" %}
```typescript
signedVc.expirationDate = '2022-06-10T18:26:57.687Z';

const result = await learnCard.invoke.verifyCredential(signedVc);

console.log(result);
// {
//   checks: ['proof'],
//   warnings: [],
//   errors: [
//     'signature error: Verification equation was not satisfied',
//     'expiration error: Credential is expired'
//   ]
// }

// OR, for a more human readable output:

const result = await learnCard.invoke.verifyCredential(signedVc, {}, true);

console.log(result); 
// [
//     { 
//         status: "Failed",
//         check: "signature",
//         details: "signature error: Verification equation was not satisfied"
//     },
//     {
//         status: "Failed",
//         check: "expiration",
//         details: "Invalid • Expired 10 JUN 2022"
//     },
//     { status: "Success", check: "proof", message: "Valid" }
// ]
```
{% endtab %}
{% endtabs %}

## Issue/Verify Presentations

Similar to Verifiable Credentials, LearnCard has methods for verifying and issuing Verifiable Presentations:

{% tabs %}
{% tab title="Valid Presentation" %}
```typescript
const unsignedVp = await learnCard.invoke.getTestVp();

//Package signed Verifiable Credential into the presentation
unsignedVp.verifiableCredential = signedVc;

const vp = await learnCard.invoke.issuePresentation(unsignedVp);

const result = await learnCard.invoke.verifyPresentation(vp);

console.log(result);
// {
//   checks: ['proof'],
//   warnings: [],
//   errors: [],
// }
```
{% endtab %}

{% tab title="Invalid Presentation" %}
```typescript
const unsignedVp = await learnCard.invoke.getTestVp();
const vp = await learnCard.invoke.issuePresentation(unsignedVp);

vp.holder = 'did:key:nope';

const result = await learnCard.invoke.verifyPresentation(vp);

console.log(result);
// {
//     checks: [],
//     warnings: [],
//     errors: ['Unable to filter proofs: Unable to resolve: invalidDid'],
// }
```
{% endtab %}
{% endtabs %}

{% hint style="info" %}
**What is a** [**Verifiable Presentation**](https://www.w3.org/TR/vc-data-model/#dfn-presentations)**, and why would I use one?**&#x20;

Verifiable Presentations enable trusted sharing of one or more claims in a single, verifiable package. Claims may be bundled from one or multiple issuers, and they may consist of the original Verifiable Credential, or a derived "zero-knowledge proof."

**As a general principle,** you should use Verifiable Presentations when _presenting_ Verifiable Credentials to a verifying party because it proves the relationship between the user or entity presenting the credential, and the credential itself.&#x20;
{% endhint %}

## Storing/Retrieving Credentials

Credentials can be converted back and forth to [URIs](../../core-concepts/credentials-and-data/uris.md), which can be stored per holder using [Control Planes](../../core-concepts/architecture-and-principles/control-planes.md). [URIs](../../core-concepts/credentials-and-data/uris.md) simplify complex processes, such as indexing and caching, over credentials stored in many different locations, such as in IPFS, device storage, or a Decentralized Web Node.

{% code title="Issuer" %}
```typescript
const holderDid = 'did:key:z6MknqnHBn4Rx64gH4Dy1qjmaHjxFjaNG1WioKvQuXKhEKL5'
const uvc = learnCard.invoke.newCredential({ subject: holderDid });
const vc = await learnCard.invoke.issueCredential(uvc);
const uri = await learnCard.store.LearnCloud.uploadEncrypted(vc);

// *** Send URI to Holder ***
```
{% endcode %}

{% code title="Holder" %}
```typescript
// *** Receive URI from Issuer ***

const credential = await learnCard.read.get(uri);
const result = await learnCard.invoke.verifyCredential(credential);

if (result.errors.length == 0) {
    await learnCard.index.LearnCloud.add({ uri, id: 'test' });
}

// Later, when the Holder would like to see the credential again
const records = await learnCard.index.LearnCloud.get();
const record = records.find(({ id }) => id === 'test');
const storedCredential = await learnCard.read.get(record.uri);

// _.isEqual(credential, storedCredential) = true 
```
{% endcode %}

{% hint style="info" %}
The above example uses LearnCloud storage, but there are many ways to store and retrieve a credential! Check out the[ **Store control plane**](../../core-concepts/architecture-and-principles/control-planes.md#store-control-plane) for more info and options.
{% endhint %}



## LearnCloud Network

### **Create a Profile**

To create a new profile, use the `createProfile` method. This method accepts an object containing the profile information, excluding the `did` and `isServiceProfile` properties.

```javascript
await  learnCard.invoke.createProfile({
  displayName: 'John Smith',
  profileId: 'johnsmith',
  image: 'https://example.com/avatar.jpg',
});
```

These examples demonstrate creating, retrieving, updating, and deleting different types of profiles and profile managers.

```typescript
// --- Creating Profiles ---
const profileDetails = {
  profileId: 'john.doe',
  displayName: 'John Doe',
  email: 'john.doe@example.com',
  // ... other LCNProfile fields
};

const managerDetails = {
    managerDid: 'did:example:manager123',
    // ... other LCNProfileManager fields
};

try {
  // Create a regular user profile
  const regularProfileDid = await learnCard.invoke.createProfile(profileDetails);
  console.log('Regular Profile DID:', regularProfileDid);

  // Create a service profile
  const serviceProfileDid = await learnCard.invoke.createServiceProfile(profileDetails);
  console.log('Service Profile DID:', serviceProfileDid);

  // Create a managed profile (often used for profiles requiring oversight)
  const managedProfileDid = await learnCard.invoke.createManagedProfile(profileDetails);
  console.log('Managed Profile DID:', managedProfileDid);
  
  // Create a managed service profile
  const managedServiceProfileDid = await learnCard.invoke.createManagedServiceProfile(profileDetails);
  console.log('Managed Service Profile DID:', managedServiceProfileDid);

  // Create a profile manager
  const profileManagerId = await learnCard.invoke.createProfileManager(managerDetails);
  console.log('Profile Manager ID:', profileManagerId);

  // Create a child profile manager under an existing parent
  const parentManagerUri = 'uri:manager:parent123'; // Replace with actual parent URI
  const childProfileManagerId = await learnCard.invoke.createChildProfileManager(parentManagerUri, managerDetails);
  console.log('Child Profile Manager ID:', childProfileManagerId);

} catch (error) {
  console.error('Error creating profile:', error);
}
```

### Retrieving & Searching Profiles <a href="#retrieving-profiles" id="retrieving-profiles"></a>

To search for profiles, use the `searchProfiles` method. This method accepts an optional `profileId` parameter and an `options` object. The `options` object can contain the following properties:

* `limit`: Maximum number of profiles to return.
* `includeSelf`: Whether to include the current user's profile in the results.
* `includeConnectionStatus`: Whether to include connection status in the results.

```javascript
const profileId = 'johnsmith';
const options = { limit: 10, includeSelf: false, includeConnectionStatus: true };

learnCard.invoke.searchProfiles(profileId, options);
```

More advanced usage:

```typescript
// --- Retrieving & Searching Profiles ---
const queryOptionsMock = { limit: 10, cursor: undefined }; // Example pagination
const profileQueryMock = { displayName: 'John' }; // Example query

try {
  // Get the current authenticated user's profile
  const myProfile = await learnCard.invoke.getProfile(); // No argument for self
  console.log('My Profile:', myProfile);

  // Get another profile by its ID
  const otherProfileId = 'jane.doe'; // Example profile ID
  const otherProfile = await learnCard.invoke.getProfile(otherProfileId);
  console.log(`Profile for ${otherProfileId}:`, otherProfile);

  // Get profile manager details
  const someManagerId = 'manager-xyz'; // Example manager ID
  const profileManager = await learnCard.invoke.getProfileManagerProfile(someManagerId);
  console.log('Profile Manager:', profileManager);

  // Search for profiles
  const searchResults = await learnCard.invoke.searchProfiles('john', { limit: 5, includeConnectionStatus: true });
  console.log('Search Results for "john":', searchResults);
  
  // Get profiles available to the current user (e.g., owned or managed)
  const availableProfiles = await learnCard.invoke.getAvailableProfiles({ query: profileQueryMock, ...queryOptionsMock });
  console.log('Available Profiles:', availableProfiles);

  // Get profiles managed by the current user
  const managedProfiles = await learnCard.invoke.getManagedProfiles({ query: profileQueryMock, ...queryOptionsMock });
  console.log('Managed Profiles:', managedProfiles);

  // Get service profiles managed by the user (or by a specific manager ID if provided)
  const managerIdForServiceProfiles = 'manager-abc';
  const managedServiceProfiles = await learnCard.invoke.getManagedServiceProfiles({ id: managerIdForServiceProfiles, ...queryOptionsMock });
  console.log(`Managed Service Profiles for manager ${managerIdForServiceProfiles}:`, managedServiceProfiles);

} catch (error) {
  console.error('Error retrieving profiles:', error);
}
```

### Updating & Deleting Profiles <a href="#retrieving-profiles" id="retrieving-profiles"></a>

```typescript
// --- Updating & Deleting Profiles ---
const profileUpdates = {
  displayName: 'Johnathan Doe',
  bio: 'Updated bio information.',
  // ... other fields to update
};

const managerUpdates = {
    displayName: 'Senior Manager',
    // ... other fields
}

try {
  // Update the current authenticated user's profile
  // Note: updateProfile typically updates the profile associated with the current learnCard instance's DID
  const updateSuccess = await learnCard.invoke.updateProfile(profileUpdates);
  console.log('Profile update success:', updateSuccess);

  // Update a profile manager's profile
  // Assuming managerUpdates includes the manager's identifier or is for the current profile manager context
  const managerUpdateSuccess = await learnCard.invoke.updateProfileManagerProfile(managerUpdates);
  console.log('Manager profile update success:', managerUpdateSuccess);

  // Delete the current authenticated user's profile
  // Be very careful with this operation!
  // const deleteSuccess = await learnCard.invoke.deleteProfile();
  // console.log('Profile delete success:', deleteSuccess);
} catch (error) {
  console.error('Error updating/deleting profile:', error);
}
```

### Connection Management

#### **Connect with a Profile**

To send a connection request to another profile, use the `connectWith` method. This method accepts a `profileId` parameter.

```javascript
const profileId = 'janesmith';

await learnCard.invoke.connectWith(profileId);
```

#### **Generate an Invite**

To generate an invite, use the `generateInvite` method. This method now accepts two parameters: a `challenge` and an `expiration` parameter. The `challenge` parameter is optional and will be automatically generated if not provided. The `expiration` parameter sets the duration (in seconds) for which the invite remains valid and defaults to 30 days if not specified.

```javascript
const challenge = 'your_challenge'; // Custom challenge string (optional)
const expiration = 3600 * 24 * 7; // Invitation expires in 7 days (optional)

await learnCard.invoke.generateInvite({ challenge, expiration });
```

#### **Connect with a Profile using an Invite**

To connect with another profile using an invite, use the `connectWithInvite` method. This method requires a `profileId` and a `challenge` parameter.&#x20;

<pre class="language-javascript"><code class="lang-javascript">const profileId = 'janesmith';
const challenge = 'your_challenge';

<strong>await learnCard.invoke.connectWithInvite(profileId, challenge);
</strong></code></pre>

#### **Accept a Connection Request**

To accept a connection request from another profile, use the `acceptConnectionRequest` method. This method accepts a `profileId` parameter.

```javascript
const profileId = 'janesmith';

await learnCard.invoke.acceptConnectionRequest(profileId);
```

Advanced examples for establishing, managing, and retrieving connections between profiles.

```typescript
const targetProfileId = 'jane.doe.connections'; // Example target profile ID for connection
const connectionRequestProfileId = 'john.wayne.connections'; // Example profile ID of an incoming connection request

try {
  // --- Connection Operations ---
  // Send a connection request
  const connectSuccess = await learnCard.invoke.connectWith(targetProfileId);
  console.log(`Connection request to ${targetProfileId} success:`, connectSuccess);

  // Accept an incoming connection request
  const acceptSuccess = await learnCard.invoke.acceptConnectionRequest(connectionRequestProfileId);
  console.log(`Accepted connection request ${connectionRequestProfileId}:`, acceptSuccess);

  // Disconnect with a connected profile
  const disconnectSuccess = await learnCard.invoke.disconnectWith(targetProfileId);
  console.log(`Disconnected from ${targetProfileId}:`, disconnectSuccess);

  // Cancel an outgoing connection request you previously sent
  const cancelSuccess = await learnCard.invoke.cancelConnectionRequest(targetProfileId);
  console.log(`Cancelled connection request to ${targetProfileId}:`, cancelSuccess);


  // --- Connection Invitations ---
  // Generate an invitation
  const inviteDetails = await learnCard.invoke.generateInvite('optional-challenge-string', 3600); // Expires in 1 hour
  console.log('Generated Invite:', inviteDetails);
  // (Off-band: share inviteDetails.profileId and inviteDetails.challenge with another user)

  // Another user connects using the invitation
  // This would typically be called by a different learnCard instance/user
  // const connectingProfileId = inviteDetails.profileId; 
  // const challengeFromInvite = inviteDetails.challenge;
  // const connectInviteSuccess = await otherLearnCard.invoke.connectWithInvite(connectingProfileId, challengeFromInvite);
  // console.log('Connected via invite:', connectInviteSuccess);
  

  // --- Retrieving Connections ---
  const paginationOptions = { limit: 10 };

  const connections = await learnCard.invoke.getPaginatedConnections(paginationOptions);
  console.log('My Connections:', connections.records);

  const pendingRequests = await learnCard.invoke.getPaginatedPendingConnections(paginationOptions);
  console.log('My Pending Outgoing Requests:', pendingRequests.records);

  const incomingRequests = await learnCard.invoke.getPaginatedConnectionRequests(paginationOptions);
  console.log('My Incoming Connection Requests:', incomingRequests.records);


  // --- Blocking Profiles ---
  const profileToBlock = 'annoying.user';
  const blockSuccess = await learnCard.invoke.blockProfile(profileToBlock);
  console.log(`Blocked ${profileToBlock}:`, blockSuccess);

  const blockedProfiles = await learnCard.invoke.getBlockedProfiles();
  console.log('Blocked Profiles:', blockedProfiles);

  // Unblock a profile
  // const unblockSuccess = await learnCard.invoke.unblockProfile(profileToBlock);
  // console.log(`Unblocked ${profileToBlock}:`, unblockSuccess);

} catch (error) {
  console.error('Error in connection management:', error);
}
```

### Credential & Presentation Exchange <a href="#retrieving-profiles" id="retrieving-profiles"></a>

Demonstrates sending, receiving, and managing Verifiable Credentials (VCs) and Verifiable Presentations (VPs).

#### **Send a Credential**

To send a credential to another profile, use the `sendCredential` method. This method accepts a `profileId`, a `vc` object (which can be an `UnsignedVC` or `VC`), and an optional `encrypt` parameter.

<pre class="language-javascript"><code class="lang-javascript">const profileId = 'janesmith';
const vc = await networkLearnCard.invoke.issueCredential(networkLearnCard.invoke.newCredential())
const encrypt = true;

<strong>await learnCard.invoke.sendCredential(profileId, vc, encrypt);
</strong></code></pre>

#### **Get Received Credentials**

To retrieve all received credentials, use the `getReceivedCredentials` method. This method accepts an optional `from` parameter.

```javascript
const from = 'johnsmith';

await learnCard.invoke.getReceivedCredentials(from);
```

#### **Accept a Credential**

To accept a credential, use the `acceptCredential` method. This method accepts a `uri` parameter.

<pre class="language-javascript"><code class="lang-javascript">const uri = 'your_credential_uri';
<strong>await learnCard.invoke.acceptCredential(uri);
</strong></code></pre>

#### **Send a Presentation**

To send a presentation to another profile, use the `sendPresentation` method. This method accepts a `profileId`, a `vp` object, and an optional `encrypt` parameter.

```javascript
const profileId = 'janesmith';
const vp = your_presentation;
const encrypt = true;

await learnCard.invoke.sendPresentation(profileId, vp, encrypt);
```

#### Advanced Examples:

```typescript
// Assume vcMock and vpMock are properly structured Verifiable Credential and Presentation objects
const vcMock = await learnCard.invoke.issueCredential(learnCard.invoke.getTestVc())
const vpMock = await learnCard.invoke.issuePresentation(await learnCard.invoke.getTestVp())

const recipientProfileId = 'bob.the.receiver';
const credentialUriToManage = 'uri:credential:xyz789'; // Example URI of a received/sent credential

try {
  // --- Sending Credentials & Presentations ---
  const sentCredentialUri = await learnCard.invoke.sendCredential(recipientProfileId, vcMock, true); // Encrypt = true
  console.log('Sent Credential URI:', sentCredentialUri);

  const sentPresentationUri = await learnCard.invoke.sendPresentation(recipientProfileId, vpMock, true); // Encrypt = true
  console.log('Sent Presentation URI:', sentPresentationUri);

  // --- Accepting Credentials & Presentations ---
  // (This would typically be called by the recipient's learnCard instance)
  // const receivedCredentialUri = 'uri:credential:abc123'; // URI from notification or shared link
  // const acceptCredentialSuccess = await recipientLearnCard.invoke.acceptCredential(receivedCredentialUri);
  // console.log('Accepted Credential:', acceptCredentialSuccess);

  // const receivedPresentationUri = 'uri:presentation:def456';
  // const acceptPresentationSuccess = await recipientLearnCard.invoke.acceptPresentation(receivedPresentationUri);
  // console.log('Accepted Presentation:', acceptPresentationSuccess);


  // --- Retrieving Information ---
  // Assuming 'did:example:sender' is the DID of a profile that sent you credentials
  const receivedCredentials = await learnCard.invoke.getReceivedCredentials('did:example:sender');
  console.log('Received Credentials:', receivedCredentials);

  const sentCredentials = await learnCard.invoke.getSentCredentials(recipientProfileId);
  console.log('Sent Credentials:', sentCredentials);
  
  const incomingCredentials = await learnCard.invoke.getIncomingCredentials(); // Get all pending incoming
  console.log('Incoming Credentials (pending acceptance):', incomingCredentials);

  // Similar retrieval for presentations
  const receivedPresentations = await learnCard.invoke.getReceivedPresentations('did:example:sender');
  console.log('Received Presentations:', receivedPresentations);


  // --- Deleting ---
  // const deleteCredentialSuccess = await learnCard.invoke.deleteCredential(credentialUriToManage);
  // console.log('Deleted Credential:', deleteCredentialSuccess);
  
  // const deletePresentationSuccess = await learnCard.invoke.deletePresentation(credentialUriToManage); // Assuming a presentation URI
  // console.log('Deleted Presentation:', deletePresentationSuccess);

} catch (error) {
  console.error('Error in credential/presentation exchange:', error);
}
```

### Boost Management <a href="#retrieving-profiles" id="retrieving-profiles"></a>

Examples covering the lifecycle of Boosts, including creation, retrieval, hierarchy, recipients, permissions, and sending.

#### &#x20;**Create a Boost**

To create a boost, use the `createBoost` method. This method accepts a `credential` object (which can be an `UnsignedVC` or `VC`) and an optional `metadata` object.

```javascript
const credential = your_credential;
const metadata = {
  name: 'Your Boost Name',
  description: 'Your Boost Description',
};

await learnCard.invoke.createBoost(credential, metadata);
```

#### **Get a Boost**

To get a boost, use the `getBoost` method. This method accepts a `uri` parameter.

```javascript
const uri = 'your_boost_uri';
await learnCard.invoke.getBoost(uri);
```

#### **Send a Boost**

To send a boost to another profile, use the `sendBoost` method. This method accepts a `profileId`, a `boostUri` parameter, and an optional `encrypt` parameteropconst profileId = 'janesmith';

```javascript
const boostUri = 'your_boost_uri';
const encrypt = true;

learnCard.invoke.sendBoost(profileId, boostUri, encrypt);
```

These are the API calls related to boosts management in the LearnCard Network API. Use these methods to create, update, retrieve, and delete boosts, as well as send boosts to other profiles.

#### Advanced Examples:

```typescript
// Assume vcForBoost is a Verifiable Credential object for the boost content
const vcForBoost = await learnCard.invoke.issueCredential(learnCard.invoke.getTestVc())
const boostMetadataMock = { name: 'My First Boost', category: 'Achievement' };
const parentBoostUri = 'uri:boost:parent123'; // Example
const childBoostUri = 'uri:boost:child456'; // Example
const someBoostUri = 'uri:boost:abc789'; // Example
const profileIdForBoost = 'carol.manager';
const boostQueryMock = { category: 'Education' };
const paginationOptions = { limit: 5 };


try {
  // --- Creating Boosts ---
  const boostUri = await learnCard.invoke.createBoost(vcForBoost, boostMetadataMock);
  console.log('Created Boost URI:', boostUri);

  const newChildBoostUri = await learnCard.invoke.createChildBoost(parentBoostUri, vcForBoost, { name: 'Child Boost 1' });
  console.log('Created Child Boost URI:', newChildBoostUri);


  // --- Retrieving Boosts ---
  const boostDetails = await learnCard.invoke.getBoost(boostUri);
  console.log('Boost Details:', boostDetails);

  const allBoosts = await learnCard.invoke.getPaginatedBoosts({ query: boostQueryMock, ...paginationOptions });
  console.log('Paginated Boosts:', allBoosts.records);

  const boostCount = await learnCard.invoke.countBoosts(boostQueryMock);
  console.log('Total Boosts matching query:', boostCount);


  // --- Boost Hierarchy ---
  const children = await learnCard.invoke.getBoostChildren(parentBoostUri, { numberOfGenerations: 1, ...paginationOptions });
  console.log(`Children of ${parentBoostUri}:`, children.records);

  const parents = await learnCard.invoke.getBoostParents(newChildBoostUri, { numberOfGenerations: 1, ...paginationOptions });
  console.log(`Parents of ${newChildBoostUri}:`, parents.records);

  const makeParentSuccess = await learnCard.invoke.makeBoostParent({ parentUri: parentBoostUri, childUri: newChildBoostUri });
  console.log('Made parent successful:', makeParentSuccess);
  
  // const removeParentSuccess = await learnCard.invoke.removeBoostParent({ parentUri: parentBoostUri, childUri: newChildBoostUri });
  // console.log('Removed parent successful:', removeParentSuccess);


  // --- Boost Recipients & Permissions ---
  const recipients = await learnCard.invoke.getPaginatedBoostRecipients(someBoostUri, 10, undefined, true);
  console.log(`Recipients for ${someBoostUri}:`, recipients.records);

  const admins = await learnCard.invoke.getBoostAdmins(someBoostUri, { includeSelf: true });
  console.log(`Admins for ${someBoostUri}:`, admins.records);
  
  const addAdminSuccess = await learnCard.invoke.addBoostAdmin(someBoostUri, profileIdForBoost);
  console.log(`Added ${profileIdForBoost} as admin to ${someBoostUri}:`, addAdminSuccess);

  const permissions = await learnCard.invoke.getBoostPermissions(someBoostUri, profileIdForBoost);
  console.log(`Permissions for ${profileIdForBoost} on ${someBoostUri}:`, permissions);

  const updatePermsSuccess = await learnCard.invoke.updateBoostPermissions(someBoostUri, { canEdit: true }, profileIdForBoost);
  console.log('Updated permissions:', updatePermsSuccess);


  // --- Updating & Deleting Boosts ---
  const boostUpdates = { description: 'Updated description for this amazing boost!' };
  const updateBoostSuccess = await learnCard.invoke.updateBoost(someBoostUri, boostUpdates);
  console.log('Boost update success:', updateBoostSuccess);

  // const deleteBoostSuccess = await learnCard.invoke.deleteBoost(someBoostUri);
  // console.log('Boost delete success:', deleteBoostSuccess);

  
  // --- Sending Boosts ---
  const targetProfileForBoost = 'dave.recipient';
  const sentBoostCredentialUri = await learnCard.invoke.sendBoost(targetProfileForBoost, someBoostUri, { encrypt: true });
  console.log(`Sent boost ${someBoostUri} to ${targetProfileForBoost}. Credential URI:`, sentBoostCredentialUri);

} catch (error) {
  console.error('Error in boost management:', error);
}
```

### Signing Authorities & Claim Links <a href="#retrieving-profiles" id="retrieving-profiles"></a>

Examples for registering and using signing authorities, and generating/claiming boosts via links.

```typescript
const authorityEndpoint = 'https://my-authority.example.com/sign';
const authorityName = 'MyOrg Signer';
const authorityDid = 'did:example:authority123'; // DID of the signing authority
const boostUriForClaimLink = 'uri:boost:claimable123';

// LCNBoostClaimLinkSigningAuthorityType
const claimLinkSigningAuthorityConfig = { 
  endpoint: authorityEndpoint, 
  name: authorityName,
  did: authorityDid
}; 

// LCNBoostClaimLinkOptionsType
const claimLinkOptions = { ttlSeconds: 86400, totalUses: 10 }; // e.g., expires in 24 hours, 10 max claims

try {
  // --- Signing Authorities ---
  const registerSuccess = await learnCard.invoke.registerSigningAuthority(authorityEndpoint, authorityName, authorityDid);
  console.log('Registered Signing Authority:', registerSuccess);

  const authorities = await learnCard.invoke.getRegisteredSigningAuthorities();
  console.log('Retrieved Signing Authorities:', authorities);

  const singleAuthority = await learnCard.invoke.getRegisteredSigningAuthority(authorityEndpoint, authorityName);
  console.log('Single Retrieved Authority:', singleAuthority);


  // --- Claim Links ---
  const claimLinkData = await learnCard.invoke.generateClaimLink(boostUriForClaimLink, claimLinkSigningAuthorityConfig, claimLinkOptions);
  console.log('Generated Claim Link Data:', claimLinkData);
  // (Off-band: share this link/data with a user)

  // User claims the boost using the link data
  // This would typically be called by a different learnCard instance/user
  // const claimedCredentialUri = await otherLearnCard.invoke.claimBoostWithLink(claimLinkData.boostUri, claimLinkData.challenge);
  // console.log('Boost claimed via link, Credential URI:', claimedCredentialUri);

} catch (error) {
  console.error('Error with Signing Authorities or Claim Links:', error);
}
```

### ConsentFlow Contracts <a href="#retrieving-profiles" id="retrieving-profiles"></a>

Examples for creating and managing Consent Flow Contracts, user consent, and data access.

```typescript
// Assume consentFlowContractDefinition, consentTermsObjectMock are defined according to your types
const consentFlowContractDefinition = { contract: { read: { personal: { name: { required: true } } }, write: {} }, name: "Data Sharing Agreement", description: "Share basic profile info." };
const consentTermsObjectMock = { read: { personal: { name: 'Consented Name' } }, write: {} }; // User's specific terms based on contract

const contractUriToManage = 'uri:contract:xyz789';
const termsUriToManage = 'uri:terms:abc123'; // URI of a specific consent instance
const userDidForConsentData = 'did:example:user123';
const queryOptions = { limit: 10 };

try {
  // --- Contract Management (by Owner) ---
  const newContractUri = await learnCard.invoke.createContract(consentFlowContractDefinition);
  console.log('Created Contract URI:', newContractUri);

  // const autoBoostConfigs = [{ boostUri: 'uri:boost:auto123', signingAuthority: { endpoint: '...', name: '...' } }];
  // const addAutoBoostSuccess = await learnCard.invoke.addAutoBoostsToContract(newContractUri, autoBoostConfigs);
  // console.log('Added Auto-Boosts:', addAutoBoostSuccess);
  
  const contractDetails = await learnCard.invoke.getContract(newContractUri);
  console.log('Contract Details:', contractDetails);
  
  const allMyContracts = await learnCard.invoke.getContracts(queryOptions);
  console.log('My Contracts:', allMyContracts.records);

  // const deleteContractSuccess = await learnCard.invoke.deleteContract(newContractUri);
  // console.log('Deleted Contract:', deleteContractSuccess);


  // --- User Consent Actions ---
  // (User consents to a contract)
  const consentTermsDetails = { terms: consentTermsObjectMock, expiresAt: new Date(Date.now() + 3600 * 1000 * 24 * 30).toISOString() }; // Expires in 30 days
  const consentedTermsUri = await learnCard.invoke.consentToContract(contractUriToManage, consentTermsDetails);
  console.log('Consented to Contract, Terms URI:', consentedTermsUri);

  // (User retrieves their consented contracts)
  const myConsentedContracts = await learnCard.invoke.getConsentedContracts(queryOptions);
  console.log('My Consented Contracts (Terms):', myConsentedContracts.records);

  // (User updates their terms for a specific consent)
  const updatedTermsDetails = { terms: { ...consentTermsObjectMock, read: { personal: { name: 'Updated Name' }}}, oneTime: true };
  const updateTermsSuccess = await learnCard.invoke.updateContractTerms(termsUriToManage, updatedTermsDetails);
  console.log('Updated Contract Terms:', updateTermsSuccess);

  // (User withdraws consent)
  // const withdrawSuccess = await learnCard.invoke.withdrawConsent(termsUriToManage);
  // console.log('Withdrew Consent:', withdrawSuccess);


  // --- Data Access & Transactions (by Contract Owner or authorized profiles) ---
  const consentDataForContract = await learnCard.invoke.getConsentFlowData(contractUriToManage, queryOptions);
  console.log('Consented Data for Contract:', consentDataForContract.records);

  const consentDataForDid = await learnCard.invoke.getConsentFlowDataForDid(userDidForConsentData, queryOptions);
  console.log(`Consented Data involving DID ${userDidForConsentData}:`, consentDataForDid.records);
  
  // const allConsentData = await learnCard.invoke.getAllConsentFlowData({}, queryOptions);
  // console.log('All Consented Data for my contracts:', allConsentData.records);

  const transactions = await learnCard.invoke.getConsentFlowTransactions(termsUriToManage, queryOptions);
  console.log('Consent Transactions for Terms:', transactions.records);
  
  const credentialsForContractTerms = await learnCard.invoke.getCredentialsForContract(termsUriToManage, queryOptions);
  console.log('Credentials related to Contract Terms:', credentialsForContractTerms.records);


  // --- Writing & Syncing Credentials based on Consent ---
  // (Owner writes a credential to a consented user for a specific boost related to the contract)
  const didOfConsentedUser = 'did:example:consenter123';
  const boostUriRelatedToContract = 'uri:boost:contractRelatedBoost456';
  // const writtenCredentialUri = await learnCard.invoke.writeCredentialToContract(didOfConsentedUser, contractUriToManage, vcMock, boostUriRelatedToContract);
  // console.log('Credential written to contract for user:', writtenCredentialUri);
  
  // (Consenter syncs their credentials to the contract terms)
  const credentialsToSyncByCategory = { "Achievement": ["uri:credential:ach1", "uri:credential:ach2"] };
  const syncSuccess = await learnCard.invoke.syncCredentialsToContract(termsUriToManage, credentialsToSyncByCategory);
  console.log('Synced credentials to contract:', syncSuccess);

  
  // --- Verifying Consent ---
  const isConsentValid = await learnCard.invoke.verifyConsent(termsUriToManage, userDidForConsentData); // Check if userDidForConsentData has valid consent for termsUriToManage
  console.log(`Consent valid for ${userDidForConsentData} on ${termsUriToManage}:`, isConsentValid);
  

} catch (error) {
  console.error('Error in Consent Flow management:', error);
}
```

### DID Metadata Management <a href="#retrieving-profiles" id="retrieving-profiles"></a>

Examples for adding, retrieving, updating, and deleting DID metadata.

```typescript
// Assume didDocumentPartial is an object with some DID Document properties
const didDocumentPartial = { service: [{ id: '#service-1', type: 'MyService', serviceEndpoint: 'https://example.com/service' }] };
const metadataIdToManage = 'some-metadata-id'; // This would be an ID returned by addDidMetadata or associated with a DID

try {
  const addMetadataSuccess = await learnCard.invoke.addDidMetadata(didDocumentPartial);
  console.log('Added DID Metadata Success (or ID):', addMetadataSuccess); // Might return ID or boolean

  const myDidMetadataList = await learnCard.invoke.getMyDidMetadata();
  console.log('My DID Metadata Records:', myDidMetadataList);

  if (myDidMetadataList.length > 0) {
    const firstMetadataId = myDidMetadataList[0].id;
    const specificMetadata = await learnCard.invoke.getDidMetadata(firstMetadataId);
    console.log(`Specific DID Metadata for ${firstMetadataId}:`, specificMetadata);

    const updatesToMetadata = { service: [{ id: '#service-1', type: 'UpdatedService', serviceEndpoint: 'https://new.example.com/service' }] };
    const updateMetadataSuccess = await learnCard.invoke.updateDidMetadata(firstMetadataId, updatesToMetadata);
    console.log('Updated DID Metadata:', updateMetadataSuccess);

    // const deleteMetadataSuccess = await learnCard.invoke.deleteDidMetadata(firstMetadataId);
    // console.log('Deleted DID Metadata:', deleteMetadataSuccess);
  }
} catch (error) {
  console.error('Error managing DID Metadata:', error);
}
```

### Claim Hooks <a href="#retrieving-profiles" id="retrieving-profiles"></a>

Examples for managing claim hooks for Boosts.

```typescript
// --- Claim Hooks ---

// Example 1: Creating a 'GRANT_PERMISSIONS' Claim Hook
// This hook would grant specific permissions on 'targetBoostUri'
// when 'sourceBoostClaimUri' is successfully claimed.
const grantPermissionsHookDefinition: ClaimHook = {
  type: 'GRANT_PERMISSIONS', // As per ClaimHookTypeValidator
  data: {
    claimUri: 'uri:boost:sourceBoostClaimUri123', // The boost that, when claimed, triggers this hook
    targetUri: 'uri:boost:targetBoostUri456',   // The boost on which permissions will be granted
    permissions: {                              // Partial<BoostPermissions> from BoostPermissionsValidator
      canEdit: true,
      canIssue: false,
      // Add other permission fields as needed, e.g., canViewAnalytics: true
    },
  },
};

// Example 2: Creating an 'ADD_ADMIN' Claim Hook
// This hook would make the claimer an admin of 'targetResourceUriForAdmin'
// when 'anotherSourceBoostUri' is successfully claimed.
const addAdminHookDefinition: ClaimHook = {
    type: 'ADD_ADMIN', // As per ClaimHookTypeValidator
    data: {
        claimUri: 'uri:boost:anotherSourceBoostUri789', // The boost that, when claimed, triggers this hook
        targetUri: 'uri:boost:targetResourceUriForAdmin000', // The resource (e.g., another boost) the claimer becomes admin of
    },
};


const boostUriToQueryHooksFor = 'uri:boost:sourceBoostClaimUri123';
const paginationOptions = { limit: 10 };

// Example Query for getClaimHooksForBoost
const specificClaimHookQuery: ClaimHookQuery = {
    type: 'GRANT_PERMISSIONS', // Filter for hooks of type 'GRANT_PERMISSIONS'
    data: {
        targetUri: 'uri:boost:targetBoostUri456', // Further filter by the targetUri in the hook's data
        // You could also add filters for permissions if your BoostPermissionsQueryValidator supports it
        // permissions: { canEdit: true }
    }
};

try {
  // Create the 'GRANT_PERMISSIONS' hook
  const grantPermissionsHookId = await learnCard.invoke.createClaimHook(grantPermissionsHookDefinition);
  console.log('Created GRANT_PERMISSIONS Claim Hook ID:', grantPermissionsHookId);

  // Create the 'ADD_ADMIN' hook
  const addAdminHookId = await learnCard.invoke.createClaimHook(addAdminHookDefinition);
  console.log('Created ADD_ADMIN Claim Hook ID:', addAdminHookId);

  // Get all claim hooks for a specific boost URI with pagination
  const allHooksForBoost = await learnCard.invoke.getClaimHooksForBoost({ 
    uri: boostUriToQueryHooksFor, 
    ...paginationOptions 
  });
  console.log(`All Claim Hooks for ${boostUriToQueryHooksFor}:`, allHooksForBoost.records);

  // Get claim hooks for a specific boost URI with a query and pagination
  const filteredHooksForBoost = await learnCard.invoke.getClaimHooksForBoost({
    uri: boostUriToQueryHooksFor,
    query: specificClaimHookQuery,
    ...paginationOptions,
  });
  console.log(`Filtered Claim Hooks for ${boostUriToQueryHooksFor}:`, filteredHooksForBoost.records);

  // Delete a claim hook (e.g., the first one we created)
  // const deleteGrantPermissionsHookSuccess = await learnCard.invoke.deleteClaimHook(grantPermissionsHookId);
  // console.log('Deleted GRANT_PERMISSIONS Claim Hook:', deleteGrantPermissionsHookSuccess);

} catch (error) {
  console.error('Error managing Claim Hooks:', error);
}
```

### Authorization Grants & API Tokens <a href="#retrieving-profiles" id="retrieving-profiles"></a>

Examples for managing authorization grants and generating API tokens.

{% hint style="info" %}
Click here for more information on [Auth Grants and Scopes](../../core-concepts/architecture-and-principles/auth-grants-and-api-tokens.md).
{% endhint %}

```typescript
const authGrantPartial = { name: "External Service XYZ", description: "Auth Grant for XYZ Service", scope: 'read:profile write:boosts', expiresAt: new Date(Date.now() + 3600000).toISOString() };
const authGrantIdToManage = 'grant-id-xyz'; // Example ID of an existing grant

try {
  const newAuthGrantId = await learnCard.invoke.addAuthGrant(authGrantPartial);
  console.log('Added Auth Grant ID:', newAuthGrantId);

  const specificAuthGrant = await learnCard.invoke.getAuthGrant(newAuthGrantId);
  console.log('Specific Auth Grant:', specificAuthGrant);

  const allAuthGrants = await learnCard.invoke.getAuthGrants({ limit: 10 });
  console.log('All Auth Grants:', allAuthGrants);

  const updatesToAuthGrant = { description: 'Updated grant for special access' };
  const updateGrantSuccess = await learnCard.invoke.updateAuthGrant(newAuthGrantId, updatesToAuthGrant);
  console.log('Updated Auth Grant:', updateGrantSuccess);
  
  const apiToken = await learnCard.invoke.getAPITokenForAuthGrant(newAuthGrantId);
  console.log('API Token for Auth Grant:', apiToken);

  // const revokeGrantSuccess = await learnCard.invoke.revokeAuthGrant(newAuthGrantId);
  // console.log('Revoked Auth Grant:', revokeGrantSuccess);

  // const deleteGrantSuccess = await learnCard.invoke.deleteAuthGrant(newAuthGrantId);
  // console.log('Deleted Auth Grant:', deleteGrantSuccess);
} catch (error) {
  console.error('Error managing Auth Grants:', error);
}
```



#### Create an AuthGrant

Use the LearnCard SDK's `addAuthGrant` method to create a new AuthGrant:

```javascript
const authGrantID = await learnCard.invoke.addAuthGrant({
    name: "Example Auth Grant",
    description: "Full Access Auth Grant",
    scope: '*:*',
})
```

#### AuthGrant Properties

* `id`: Unique identifier (auto-generated if not provided)
* `name`: Name of the AuthGrant
* `description`: (Optional) Description of the purpose or use case
* `challenge`: Security challenge string (must start with AuthGrant prefix)
* `status`: Either 'active' or 'revoked'
* `scope`: Permission scope string
* `createdAt`: ISO 8601 datetime string of creation (auto-generated if not provided)
* `expiresAt`: (Optional) ISO 8601 datetime string for expiration

#### Generating an API Token

Once you have an AuthGrant, you can generate an API token using the `getAPITokenForAuthGrant` method:

```javascript
const apiToken = await learnCard.invoke.getAPITokenForAuthGrant(authGrantID)
```

This token encapsulates the permissions defined in the AuthGrant and should be used for authentication in API requests.

#### Using the API Token for HTTP Requests

Use the generated API token in the Authorization header with the Bearer scheme:

```javascript
const response = await fetch(
    'https://api.learncard.network/api/boost/send/via-signing-authority/RECIPIENT_ID',
    {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiToken}`,
        },
        body: JSON.stringify(payload),
    }
);
```

#### Generate API Token End-to-End Example

Here's a complete example showing how to:

1. Create an AuthGrant
2. Generate an API token
3. Use the token to send a boost via the HTTP API

```javascript
// Step 1: Create an AuthGrant with specific permissions
const grantId = await learnCard.invoke.addAuthGrant({
    name: "Boost Sender Auth",
    description: "Permission to send boosts",
    scope: 'boosts:write',
});

// Step 2: Generate an API token from the AuthGrant
const token = await learnCard.invoke.getAPITokenForAuthGrant(grantId);

// Step 3: Prepare the payload for your API request
const payload = {
    boostUri: "uri-of-the-boost-to-send",
    signingAuthority: "your-signing-authority"
};

// Step 4: Make an authenticated HTTP request using the token
const response = await fetch(
    `https://api.learncard.network/api/boost/send/via-signing-authority/RECIPIENT_PROFILE_ID`,
    {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    }
);

// Step 5: Process the response
if (response.status === 200) {
    const sentBoostUri = await response.json();
    console.log(`Boost sent successfully: ${sentBoostUri}`);
} else {
    console.error(`Error sending boost: ${response.status}`);
    const errorDetails = await response.json();
    console.error(errorDetails);
}
```

#### Retrieving AuthGrants

```javascript
// Get a single AuthGrant by ID
const authGrant = await learnCard.invoke.getAuthGrant(authGrantID);

// Get multiple AuthGrants with optional filtering
const authGrants = await learnCard.invoke.getAuthGrants({
    query: {
        status: 'active',
        name: { contains: 'API' }
    }
});
```

#### Updating AuthGrants

```javascript
// Update an existing AuthGrant
const updatedGrant = await learnCard.invoke.updateAuthGrant(authGrantID, {
    description: "Updated description",
});
```

#### Revoking AuthGrants

```javascript
// Revoke an AuthGrant to invalidate its tokens
await learnCard.invoke.revokeAuthGrant(authGrantID);

// Or delete it completely
await learnCard.invoke.deleteAuthGrant(authGrantID);
```

### General Utilities <a href="#retrieving-profiles" id="retrieving-profiles"></a>

```typescript
const someLearnCardNetworkUri = 'uri:boost:abc123'; // Example URI

try {
  // Resolve any LCN URI to its underlying object (VC, VP, Contract, etc.)
  const resolvedObject = await learnCard.invoke.resolveFromLCN(someLearnCardNetworkUri);
  console.log(`Resolved object for ${someLearnCardNetworkUri}:`, resolvedObject);

  // Get the underlying LCN Client instance (if advanced usage is needed)
  const lcnClient = await learnCard.invoke.getLCNClient();
  console.log('LCN Client instance retrieved.');
  // Now you could potentially use methods directly on lcnClient if necessary,
  // though most operations should be covered by learnCard.invoke wrappers.
} catch (error) {
  console.error('Error with LCN utilities:', error);
}
```

