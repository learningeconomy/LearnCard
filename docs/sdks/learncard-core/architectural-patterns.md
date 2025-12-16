---
description: Common architectural patterns for LearnCard SDK integration
---

# Architectural Patterns for LearnCard SDK

This guide describes common architectural patterns for integrating LearnCard SDK into your applications, with real-world examples and implementation recommendations.

## Choosing the Right Architecture

LearnCard can be integrated into various architectures depending on your specific requirements:

| Architecture | Best For | Considerations |
|--------------|----------|----------------|
| Browser-based client-side | Personal wallets, user-controlled credentials | Private key security, WASM loading |
| Server-side API | Credential issuer services, verification services | Key management, scaling |
| Mobile apps | Personal wallets with native integration | Storage, secure enclave |
| Serverless functions | Verification workflows, on-demand issuance | Cold starts, timeouts |
| Hybrid | Enterprise solutions with mixed requirements | Complexity, security boundaries |

## Pattern 1: Browser-Based Personal Wallet

This pattern uses LearnCard directly in the browser, with user-controlled keys.

### Components

1. **Frontend Application**: Typically a React/Vue/Angular SPA
2. **Browser Storage**: For secure storage of encrypted keys
3. **LearnCard Core**: Running directly in the browser
4. **External Storage Services**: Optional LearnCloud or Ceramic integration

### Implementation Example

```typescript
import { initLearnCard } from '@learncard/init';
import { deriveSeed } from '@learncard/crypto-plugin';

// User authentication flow using standard web auth
async function authenticateUser() {
  // ...login flow...
  
  // Derive a deterministic seed from user credentials
  const userKey = await deriveSeed(userId, userSecret);
  
  // Initialize LearnCard with the derived key
  const learnCard = await initLearnCard({ seed: userKey });
  
  // Store the LearnCard instance in application state
  setLearnCardInstance(learnCard);
}

// Credential management functions
async function storeCredential(credential) {
  const uri = await learnCard.store.LearnCloud.upload(credential);
  await learnCard.index.LearnCloud.add({ uri, id: credential.id });
  return uri;
}

async function getCredentials() {
  const records = await learnCard.index.LearnCloud.get();
  return Promise.all(records.map(async record => 
    learnCard.read.get(record.uri)
  ));
}
```

### Security Considerations

1. **Key Derivation**: Never store raw keys in localStorage or sessionStorage
2. **Recovery Mechanisms**: Implement key recovery flows (e.g., social recovery)
3. **Encryption**: Use additional encryption for sensitive data

## Pattern 2: Server-Side Issuer Service

This pattern uses LearnCard on a server to issue credentials to users.

### Components

1. **API Server**: Node.js/Express/FastAPI service
2. **Secure Key Storage**: Hardware Security Module (HSM) or KMS
3. **LearnCard Core**: Running on the server
4. **Database**: For tracking issued credentials

### Implementation Example

```typescript
import express from 'express';
import { initLearnCard } from '@learncard/init';
import { getSecureKey } from './keyManagement'; // Your secure key retrieval

const app = express();
app.use(express.json());

// Initialize LearnCard during service startup
let learnCard;
async function initializeService() {
  const seed = await getSecureKey();
  learnCard = await initLearnCard({ seed });
  console.log('Issuer DID:', await learnCard.invoke.getDid());
}

initializeService();

// API endpoint for credential issuance
app.post('/issue', async (req, res) => {
  try {
    const { type, subject, claims } = req.body;
    
    // Create unsigned credential
    const unsignedCredential = {
      "@context": ["https://www.w3.org/2018/credentials/v1"],
      type: ["VerifiableCredential", ...type],
      issuer: await learnCard.invoke.getDid(),
      issuanceDate: new Date().toISOString(),
      credentialSubject: {
        id: subject,
        ...claims
      }
    };
    
    // Issue the credential
    const credential = await learnCard.invoke.issueCredential(unsignedCredential);
    
    // Optionally store in LearnCloud
    const uri = await learnCard.store.LearnCloud.upload(credential);
    
    // Return both credential and URI
    res.json({ 
      credential,
      uri
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => console.log('Issuer service running on port 3000'));
```

### Security Considerations

1. **Access Control**: Implement proper authentication and authorization for the API
2. **Rate Limiting**: Prevent abuse with rate limiting
3. **Audit Logging**: Keep detailed logs of all issuance operations

## Pattern 3: Mobile Wallet Integration

This pattern integrates LearnCard into mobile applications.

### Components

1. **Mobile App**: Native or React Native application
2. **Secure Storage**: Keychain/Keystore for secure key storage
3. **LearnCard Core**: Running in the mobile environment
4. **Local DB**: For caching and offline functionality

### Implementation Example (React Native)

```typescript
import { initLearnCard } from '@learncard/init';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';

// Key management functions
async function getOrCreateKey() {
  // Try to retrieve existing key
  let key = await SecureStore.getItemAsync('learncard_key');
  
  if (!key) {
    // Generate a new key if none exists
    key = Array.from(
      crypto.getRandomValues(new Uint8Array(32))
    ).map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Require biometric authentication to store the key
    const authResult = await LocalAuthentication.authenticateAsync();
    if (authResult.success) {
      await SecureStore.setItemAsync('learncard_key', key);
    } else {
      throw new Error('Authentication required to create wallet');
    }
  }
  
  return key;
}

// Initialize LearnCard with secure key
export async function getLearnCard() {
  const key = await getOrCreateKey();
  return initLearnCard({ seed: key });
}

// Example usage in a React component
function WalletScreen() {
  const [credentials, setCredentials] = useState([]);
  const [learnCard, setLearnCard] = useState(null);
  
  useEffect(() => {
    async function initialize() {
      const lc = await getLearnCard();
      setLearnCard(lc);
      
      // Load credentials
      const records = await lc.index.all.get();
      const creds = await Promise.all(
        records.map(record => lc.read.get(record.uri))
      );
      setCredentials(creds);
    }
    
    initialize();
  }, []);
  
  // Render credential list, etc.
}
```

### Security Considerations

1. **Biometric Protection**: Use biometric authentication for key access
2. **Secure Enclave**: Utilize secure hardware when available
3. **Offline Support**: Implement proper caching for offline usage

## Pattern 4: Verification Service

This pattern implements a dedicated service for verifying credentials.

### Components

1. **API Server**: Lightweight verification endpoint
2. **LearnCard Core**: Configured with verification plugins
3. **Caching Layer**: For improved performance
4. **Monitoring**: For tracking verification metrics

### Implementation Example

```typescript
import express from 'express';
import { initLearnCard } from '@learncard/init';
import { createClient } from 'redis';

const app = express();
app.use(express.json());

// Initialize Redis for caching
const redis = createClient();
redis.connect();

// Initialize LearnCard with minimal configuration
let learnCard;
async function initializeService() {
  // For verification only, we don't need a specific seed
  learnCard = await initLearnCard();
  console.log('Verification service initialized');
}

initializeService();

// Verification endpoint
app.post('/verify', async (req, res) => {
  try {
    const { credential, options } = req.body;
    
    // Generate cache key based on credential
    const cacheKey = `verify:${JSON.stringify(credential)}`;
    
    // Check cache first
    const cachedResult = await redis.get(cacheKey);
    if (cachedResult) {
      return res.json(JSON.parse(cachedResult));
    }
    
    // Verify the credential
    const result = await learnCard.invoke.verifyCredential(credential, options);
    
    // Cache the result (only if valid, with short TTL)
    if (result.errors.length === 0) {
      await redis.set(cacheKey, JSON.stringify(result), { EX: 300 }); // 5 minutes
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(4000, () => console.log('Verification service running on port 4000'));
```

### Performance Considerations

1. **Caching**: Cache verification results for frequently verified credentials
2. **DID Resolution Caching**: Cache DID documents to reduce resolution time
3. **Horizontal Scaling**: Deploy multiple instances for high-volume scenarios

## Pattern 5: Hybrid Credential Exchange

This pattern combines elements of client and server approaches for enterprise scenarios.

### Components

1. **Client Wallet**: Browser or mobile wallet for user
2. **Issuer Service**: Server-side credential issuance
3. **Exchange Protocol**: CHAPI, QR, or direct API
4. **Verification Service**: Independent verification capability

### Implementation Example (CHAPI Exchange)

```typescript
// Server-side Issuer Component
import { initLearnCard } from '@learncard/init';
import express from 'express';

// Initialize server-side LearnCard
const issuerLearnCard = await initLearnCard({ seed: process.env.ISSUER_SEED });

app.post('/prepare-credential', async (req, res) => {
  const { subjectDid, claims } = req.body;
  
  // Create the credential for the subject
  const unsignedVC = {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    type: ['VerifiableCredential', 'Achievement'],
    credentialSubject: {
      id: subjectDid,
      ...claims
    }
  };
  
  // Issue the credential
  const vc = await issuerLearnCard.invoke.issueCredential(unsignedVC);
  
  // Generate CHAPI exchange request
  const chapiRequest = await issuerLearnCard.invoke.prepareChapiRequest(vc);
  
  res.json({ chapiRequest });
});

// Client-side Wallet Component
import { initLearnCard } from '@learncard/init';
import { installChapiHandler } from '@learncard/chapi-plugin';

async function setupChapiWallet() {
  // Initialize client-side LearnCard with secure user key
  const userLearnCard = await initLearnCard({ seed: userSeed });
  
  // Install CHAPI handler
  await installChapiHandler(userLearnCard);
  
  // Register for credential receipt
  userLearnCard.on('credentialReceived', async (credential) => {
    // Verify the credential
    const result = await userLearnCard.invoke.verifyCredential(credential);
    
    if (result.errors.length === 0) {
      // Store valid credential
      const uri = await userLearnCard.store.LearnCloud.upload(credential);
      await userLearnCard.index.LearnCloud.add({ uri, id: generateId() });
      
      // Update UI
      updateCredentialList();
    }
  });
}
```

### Architectural Considerations

1. **Authentication Flows**: Ensure proper user authentication on both sides
2. **Protocol Standards**: Adhere to standard protocols (CHAPI, DIDComm)
3. **Privacy**: Minimize data sharing between services

## Pattern 6: Enterprise Integration Hub

This pattern creates a central hub for enterprise credential issuance and verification.

### Components

1. **Admin Dashboard**: Management interface for enterprise users
2. **Key Manager**: Secure storage for multiple issuer keys
3. **Credential Service**: API for credential operations
4. **Integration Adapters**: Connectors to enterprise systems

### Implementation Example

```typescript
// Key Management Service
class EnterpriseKeyManager {
  async getIssuerKey(departmentId) {
    // Retrieve department-specific key from secure storage
    return secureStorage.getDepartmentKey(departmentId);
  }
  
  async getWalletForDepartment(departmentId) {
    const seed = await this.getIssuerKey(departmentId);
    return initLearnCard({ seed });
  }
}

// Credential Issuance API
app.post('/departments/:deptId/issue', async (req, res) => {
  const { deptId } = req.params;
  const { recipient, credential } = req.body;
  
  // Get department-specific LearnCard
  const keyManager = new EnterpriseKeyManager();
  const learnCard = await keyManager.getWalletForDepartment(deptId);
  
  // Prepare credential with department as issuer
  const deptDid = await learnCard.invoke.getDid();
  const unsignedVC = {
    ...credential,
    issuer: deptDid,
    issuanceDate: new Date().toISOString()
  };
  
  // Issue credential
  const signedVC = await learnCard.invoke.issueCredential(unsignedVC);
  
  // Store in enterprise credential registry
  await credentialRegistry.store(signedVC, deptId, recipient);
  
  // Return the signed credential
  res.json({ credential: signedVC });
});

// Integration with HR System (example adapter)
class HRSystemAdapter {
  async syncEmployeeCredentials() {
    // Get new employees/achievements from HR system
    const achievements = await hrApi.getNewAchievements();
    
    // Issue credentials for each achievement
    for (const achievement of achievements) {
      const { employeeId, departmentId, type, metadata } = achievement;
      
      // Get employee DID
      const employeeDid = await employeeDirectory.getEmployeeDid(employeeId);
      
      // Prepare credential data
      const credentialData = {
        type: ['VerifiableCredential', type],
        credentialSubject: {
          id: employeeDid,
          ...metadata
        }
      };
      
      // Issue through the credential API
      await fetch(`/departments/${departmentId}/issue`, {
        method: 'POST',
        body: JSON.stringify({
          recipient: employeeId,
          credential: credentialData
        })
      });
    }
  }
}
```

### Enterprise Considerations

1. **Compliance**: Ensure the system meets regulatory requirements
2. **Audit Trails**: Implement comprehensive logging for all operations
3. **Role-Based Access**: Restrict operations based on user roles
4. **Backup and Recovery**: Implement secure backup procedures for keys

## Conclusion

These architectural patterns provide a foundation for integrating LearnCard SDK into various application scenarios. When designing your architecture, consider:

1. **Security requirements** - especially around key management
2. **Performance needs** - for high-volume credential operations
3. **User experience** - particularly for wallet interfaces
4. **Integration points** - with existing systems and services

Each pattern can be adapted and combined to suit your specific requirements. The flexibility of LearnCard's plugin architecture allows for customization while maintaining standard credential workflows.