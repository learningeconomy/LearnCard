# VC-API

The VC-API plugin makes it easy for your LearnCard to interact with a VC-API endpoint like LearnCard Bridge.&#x20;

The **VC-API Plugin:**

* Exposes signing and verification methods using a VC-API.
* Enables discovery of the VC-API's Issuer DID automatically _if_ it has a `/did` endpoint. Alternatively, the VC-API plugin requires the implementer to specify the Issuer DID the API controls.
* Validates all inputs/outputs to intelligently prevent ill-formed requests, and guarantees the VC-API returns well-formed responses.

#### Initialization:

```javascript
// Initializes a LearnCard default connected to https://bridge.learncard.com
const defaultApi = await initLearnCard({ vcApi: true });

// Initializes a LearnCard connected to a custom VC-API, with Issuer DID specified.
const customApi = await initLearnCard({ vcApi: 'vc-api.com', did: 'did:key:123' });

// Initializes a LearnCard connected to a custom VC-API that implements /did discovery endpoint.
const customApiWithDIDDiscovery = await initLearnCard({ vcApi: 'https://bridge.learncard.com' });
```
