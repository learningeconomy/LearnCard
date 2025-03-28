import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { generateTestKeyPair } from './lti.helpers';

/**
 * Mock database for storing state during tests
 * This allows tests to run without actual MongoDB connections
 */
class MockLtiDatabase {
  private platforms: Map<string, any> = new Map();
  private states: Map<string, any> = new Map();
  private sessions: Map<string, any> = new Map();
  private userMappings: Map<string, any> = new Map();

  // Mock platform registration
  async registerPlatform(platformData: any) {
    const { issuer, client_id, deployment_id = '' } = platformData;
    const id = `${issuer}#${client_id}#${deployment_id}`;
    
    platformData._id = id;
    platformData.updatedAt = new Date();
    this.platforms.set(id, platformData);
    
    return { upsertedId: id };
  }

  // Mock platform lookup
  async findPlatform(issuer: string, clientId: string, deploymentId?: string) {
    // Try exact match first
    if (deploymentId) {
      const exactId = `${issuer}#${clientId}#${deploymentId}`;
      const platform = this.platforms.get(exactId);
      if (platform) return platform;
    }
    
    // Otherwise search through all platforms
    for (const [id, platform] of this.platforms.entries()) {
      if (platform.issuer === issuer && platform.client_id === clientId) {
        if (!deploymentId || platform.deployment_id === deploymentId) {
          return platform;
        }
      }
    }
    
    return null;
  }

  // Mock state creation
  async createState(stateData: any) {
    const id = crypto.randomBytes(16).toString('hex');
    
    const fullStateData = {
      _id: id,
      ...stateData,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000), // 1 hour expiry
    };
    
    this.states.set(stateData.state, fullStateData);
    return id;
  }

  // Mock state retrieval and consumption
  async getAndConsumeState(stateValue: string) {
    for (const [key, state] of this.states.entries()) {
      if (state.state === stateValue) {
        this.states.delete(key);
        return state;
      }
    }
    return null;
  }

  // Mock session creation
  async storeSession(sessionData: any) {
    const id = crypto.randomBytes(16).toString('hex');
    
    const fullSessionData = {
      _id: id,
      ...sessionData,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 86400000), // 24 hour expiry
    };
    
    this.sessions.set(id, fullSessionData);
    return id;
  }

  // Mock session retrieval
  async getSession(id: string) {
    return this.sessions.get(id) || null;
  }

  // Mock user to DID mapping
  async mapUserToDid(platformId: string, userId: string, did: string) {
    const id = `${platformId}#${userId}`;
    
    const mapping = {
      _id: id,
      platformId,
      userId,
      did,
      updatedAt: new Date()
    };
    
    this.userMappings.set(id, mapping);
    return did;
  }

  // Mock DID retrieval for user
  async getDidForUser(platformId: string, userId: string) {
    const id = `${platformId}#${userId}`;
    const mapping = this.userMappings.get(id);
    return mapping?.did || null;
  }
}

// Create a singleton instance
export const mockDatabase = new MockLtiDatabase();

/**
 * Mock implementation of the LTI helpers
 * These versions don't require actual MongoDB connections
 */

export const registerPlatform = async (platformData: any) => {
  return mockDatabase.registerPlatform(platformData);
};

export const findPlatform = async (issuer: string, clientId: string, deploymentId?: string) => {
  return mockDatabase.findPlatform(issuer, clientId, deploymentId);
};

export const createState = async (stateData: any) => {
  return mockDatabase.createState(stateData);
};

export const getAndConsumeState = async (stateValue: string) => {
  return mockDatabase.getAndConsumeState(stateValue);
};

export const storeSession = async (sessionData: any) => {
  return mockDatabase.storeSession(sessionData);
};

export const getSession = async (id: string) => {
  return mockDatabase.getSession(id);
};

export const mapUserToDid = async (platformId: string, userId: string, did: string) => {
  return mockDatabase.mapUserToDid(platformId, userId, did);
};

export const getDidForUser = async (platformId: string, userId: string) => {
  return mockDatabase.getDidForUser(platformId, userId);
};

/**
 * Mock JWKS generator that doesn't require real keys
 */
export const generateLtiJwks = () => {
  const keyPair = generateTestKeyPair();
  
  // Extract JWK components
  const keyComponents = crypto.createPublicKey(keyPair.publicKey).export({ format: 'jwk' });
  
  return {
    keys: [
      {
        ...keyComponents,
        use: 'sig',
        kid: keyPair.keyId,
        alg: 'RS256',
      },
    ],
  };
};

/**
 * Create a test credential based on LTI context information
 */
export const createMockLtiCredential = (did: string, contextId: string, additionalData = {}) => {
  return {
    '@context': [
      'https://www.w3.org/2018/credentials/v1',
      'https://purl.imsglobal.org/spec/lti/claim/context'
    ],
    type: ['VerifiableCredential', 'LtiCredential'],
    issuer: {
      id: 'did:web:localhost:4100'
    },
    issuanceDate: new Date().toISOString(),
    credentialSubject: {
      id: did,
      contextId,
      contextTitle: 'Test Course Title',
      platformId: 'https://test-lms.example.com#test-client-id#test-deployment-id',
      role: 'http://purl.imsglobal.org/vocab/lis/v2/membership#Learner',
      ...additionalData
    }
  };
};

/**
 * Create a mock LTI ID token with the given private key and claims
 */
export const createMockLtiIdToken = (claims: any, keyPair: ReturnType<typeof generateTestKeyPair>) => {
  const now = Math.floor(Date.now() / 1000);
  
  const defaultClaims = {
    iss: 'https://lti-ri.imsglobal.org',
    sub: 'test-user-id',
    aud: 'test-client-id',
    exp: now + 3600,
    iat: now,
    nonce: crypto.randomBytes(16).toString('hex'),
    'https://purl.imsglobal.org/spec/lti/claim/message_type': 'LtiResourceLinkRequest',
    'https://purl.imsglobal.org/spec/lti/claim/version': '1.3.0',
    'https://purl.imsglobal.org/spec/lti/claim/deployment_id': 'test-deployment-id',
    'https://purl.imsglobal.org/spec/lti/claim/target_link_uri': 'http://localhost:4100/lti/launch',
    'https://purl.imsglobal.org/spec/lti/claim/resource_link': {
      id: 'test-resource-link-id',
      title: 'Test Resource',
      description: 'Test Resource Description',
    },
    'https://purl.imsglobal.org/spec/lti/claim/context': {
      id: 'test-context-id',
      label: 'Test Course',
      title: 'Test Course Title',
      type: ['http://purl.imsglobal.org/vocab/lis/v2/course#CourseOffering'],
    },
    'https://purl.imsglobal.org/spec/lti/claim/roles': [
      'http://purl.imsglobal.org/vocab/lis/v2/membership#Learner',
    ],
  };
  
  const mergedClaims = { ...defaultClaims, ...claims };
  
  return jwt.sign(mergedClaims, keyPair.privateKey, {
    algorithm: 'RS256',
    keyid: keyPair.keyId,
  });
};

// Mock LearnCard for testing
export const getEmptyLearnCard = async () => {
  // Return a minimal mock LearnCard
  return {
    id: {
      did: () => 'did:web:test.learncard.io',
    },
    invoke: {
      issueCredential: async (credential: any) => ({ ...credential, proof: { type: 'MockProof' } }),
      verifyCredential: async (credential: any) => ({ verified: true }),
    }
  };
};