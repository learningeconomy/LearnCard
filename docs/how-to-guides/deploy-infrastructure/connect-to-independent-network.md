---
description: Point the LearnCard SDK or REST API at your own independent network infrastructure.
---

# Run Your Own Network

If you run your own instance of the LearnCard Network, point the LearnCard SDK or REST API to your infrastructure instead of the public network.

**~15 minutes · Needs:** Docker, LearnCard SDK

## What you're running

The LearnCard Network consists of three main services located in `services/learn-card-network/`:

- **Brain Service** (`brain-service`): The core network API and graph database.
- **LearnCloud** (`learn-cloud-service`): The storage layer for credentials.
- **LCA API** (`lca-api`): The backend for the LearnCard App.

## Run locally

To run the network locally for development, use the provided Docker Compose file:

```bash
cd services/learn-card-network
docker compose up
```

This will start all necessary services, databases (Neo4j, MongoDB), and queues.

## Point the SDK and REST at it

### Option A: Using the LearnCard SDK

Pass your independent network's URL to the `network` parameter when initializing the LearnCard SDK:

```javascript
import { initLearnCard } from '@learncard/init';

// Initialize LearnCard with your Independent Network
const networkLearnCard = await initLearnCard({
    seed: 'your-secure-hex-seed',
    network: 'https://network.independent.example.org/trpc', // Point to your Independent Network
});

// Send a credential to a user on your network
const result = await networkLearnCard.invoke.send({
    type: 'boost',
    recipient: 'user@example.com',
    templateUri: 'urn:lc:boost:abc123',
});

console.log('Credential sent:', result);
```

### Option B: Using the REST API

You can interact with your independent network directly via its REST API.

Generate an API token with the `boosts:write` scope (see [Generate API Tokens](generate-api-tokens.md)).

Use `POST /api/send` to issue a credential:

```bash
curl -X POST https://network.independent.example.org/api/send \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "boost",
    "recipient": "user@example.com",
    "templateUri": "urn:lc:boost:abc123"
  }'
```

#### Sending a credential you signed yourself

Pass a credential you already signed as `signedCredential` — the same shape the [Quickstart](../../quick-start/your-first-integration.md) uses. Your issuer DID must resolve on the network you're calling:

```bash
curl -X POST https://network.independent.example.org/api/send \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "boost",
    "recipient": "user@example.com",
    "signedCredential": {
      "@context": [
        "https://www.w3.org/ns/credentials/v2",
        "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json"
      ],
      "type": ["VerifiableCredential", "OpenBadgeCredential"],
      "issuer": "did:web:network.independent.example.org:users:your-issuer-id",
      "validFrom": "2025-01-01T00:00:00Z",
      "name": "Custom Achievement",
      "credentialSubject": {
        "type": ["AchievementSubject"],
        "achievement": {
          "id": "urn:uuid:12345678-1234-1234-1234-1234567890ab",
          "type": ["Achievement"],
          "achievementType": "Badge",
          "name": "Custom Achievement",
          "description": "Awarded for connecting to an independent network."
        }
      },
      "proof": { "...": "produced by learnCard.invoke.issueCredential(...)" }
    }
  }'
```

### What to check when it doesn't work

| Symptom                                      | Likely cause                                                                                        |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `ECONNREFUSED` / timeouts from the SDK       | `network` must be the tRPC base URL of your Brain Service (usually ends in `/trpc`), not a web page |
| `401` from `/api/send`                       | Token was minted on a different network — API tokens are per-network; create one on yours           |
| Recipient never gets an email                | Your network's email provider isn't configured — check the Brain Service delivery settings          |
| `Profile not found` when creating the issuer | Profiles live per-network: create your issuer profile on the independent network first              |

## Production Deployment

The services are designed to be deployed via serverless architecture (you can find the `serverless.yml` files in each service directory). Because production deployments require careful configuration of databases, queues, and email providers, please email sdk@learningeconomy.io before a production deployment and we'll help you get set up.
