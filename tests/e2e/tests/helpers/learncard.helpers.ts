import { readFile } from 'fs/promises';
import crypto from 'crypto';

// Try importing actual LearnCard packages, but provide fallbacks if they fail
let hasLearnCardPackages = true;
let initLearnCardImport;
let SimpleSigningPluginImport;

try {
  // Try loading actual packages
  initLearnCardImport = require('@learncard/init');
  SimpleSigningPluginImport = require('@learncard/simple-signing-plugin');
} catch (error) {
  // If packages aren't available, mark for fallback
  hasLearnCardPackages = false;
  console.warn('LearnCard packages not available, using mock implementation');
}

// Type definitions for LearnCard-like interface
export interface LearnCardLike {
  id: {
    did: () => string;
    keyPair: () => any;
  };
  invoke: {
    issueCredential: (credential: any) => Promise<any>;
    verifyCredential: (credential: any) => Promise<any>;
    createProfile?: (profile: any) => Promise<any>;
    [key: string]: any;
  };
  store?: {
    LearnCloud?: {
      upload: (data: any) => Promise<string>;
      get: (uri: string) => Promise<any>;
    };
  };
  read?: {
    get: (uri: string) => Promise<any>;
  };
  addPlugin?: (plugin: any) => LearnCardLike;
  [key: string]: any;
}

/**
 * Generate a deterministic DID from a seed
 */
const generateDidFromSeed = (seed: string): string => {
  const hash = crypto.createHash('sha256').update(seed).digest('hex');
  return `did:key:z6Mk${hash.substring(0, 40)}`;
};

/**
 * Create a mock implementation of LearnCard
 */
export const createMockLearnCard = async (seed = 'test-seed'): Promise<LearnCardLike> => {
  const did = generateDidFromSeed(seed);
  
  return {
    id: {
      did: () => did,
      keyPair: () => ({
        publicKey: 'mock-public-key',
        privateKey: 'mock-private-key',
        keyId: 'mock-key-id'
      })
    },
    invoke: {
      issueCredential: async (credential: any) => {
        return {
          ...credential,
          issuer: credential.issuer || { id: did },
          proof: {
            type: 'Ed25519Signature2018',
            created: new Date().toISOString(),
            verificationMethod: `${did}#keys-1`,
            proofPurpose: 'assertionMethod',
            jws: 'mock-signature'
          }
        };
      },
      verifyCredential: async (credential: any) => {
        return { verified: true };
      },
      createProfile: async (profile: any) => {
        return { ...profile, did };
      }
    },
    store: {
      LearnCloud: {
        upload: async (data: any) => {
          const id = crypto.randomBytes(16).toString('hex');
          return `learncard:data:${id}`;
        },
        get: async (uri: string) => {
          if (!uri.startsWith('learncard:')) {
            throw new Error('Invalid URI format');
          }
          return { _uri: uri, mockData: true };
        }
      }
    },
    read: {
      get: async (uri: string) => {
        if (!uri.startsWith('learncard:')) {
          throw new Error('Invalid URI format');
        }
        return { _uri: uri, mockData: true };
      }
    },
    addPlugin: function(plugin: any) {
      // Simple mock implementation that merges plugin functionality
      return {
        ...this,
        invoke: {
          ...this.invoke,
          ...(plugin.invoke || {})
        }
      };
    }
  };
};

// Legacy imports for backward compatibility
let didkit;
try {
  didkit = readFile(
    require.resolve('@learncard/didkit-plugin/dist/didkit/didkit_wasm_bg.wasm')
  );
} catch (error) {
  // Ignore error if didkit is not available
}

// Original definitions
export const USERS = {
  a: { seed: 'a'.repeat(64), profileId: 'testa', displayName: 'User A' },
  b: { seed: 'b'.repeat(64), profileId: 'testb', displayName: 'User B' },
  c: { seed: 'c'.repeat(64), profileId: 'testc', displayName: 'User C' },
  d: { seed: 'd'.repeat(64), profileId: 'testd', displayName: 'User D' },
  e: { seed: 'e'.repeat(64), profileId: 'teste', displayName: 'User E' },
} as const;

/**
 * Get a LearnCard instance, falling back to mock if packages aren't available
 */
export const getLearnCard = async (
  seed = 'a'.repeat(64),
  managedDid?: string,
  debug = false
): Promise<LearnCardLike> => {
  // If LearnCard packages are available, use them
  if (hasLearnCardPackages && didkit) {
    try {
      const { initLearnCard } = initLearnCardImport;
      const { getSimpleSigningPlugin } = SimpleSigningPluginImport;
      
      const learnCard = await initLearnCard({
        seed,
        didkit,
        network: 'http://localhost:4000/trpc',
        cloud: { url: 'http://localhost:4100/trpc' },
        ...(managedDid && { didWeb: managedDid }),
        ...(debug && { debug: console.log }),
      });

      return learnCard.addPlugin(
        await getSimpleSigningPlugin(learnCard, 'http://localhost:4200/trpc')
      );
    } catch (error) {
      console.warn('Error initializing real LearnCard, falling back to mock:', error);
    }
  }
  
  // Fall back to mock implementation
  return createMockLearnCard(seed);
};

/**
 * Get a LearnCard for a predefined user
 */
export const getLearnCardForUser = async (userKey: keyof typeof USERS) => {
  const user = USERS[userKey];
  const learnCard = await getLearnCard(user.seed);

  try {
    await learnCard.invoke.createProfile?.({
      profileId: user.profileId,
      displayName: user.displayName,
      bio: '',
      shortBio: '',
    });
  } catch (error) {
    console.error(error);
  }

  return learnCard;
};

/**
 * Get a managed LearnCard for a user
 */
export const getManagedLearnCardForUser = async (
  userKey: keyof typeof USERS,
  managedDid: string,
  debug = false
) => {
  const user = USERS[userKey];
  return getLearnCard(user.seed, managedDid, debug);
};

/**
 * Create a mock credential for testing
 */
export const createMockCredential = (subjectDid: string, type = 'TestCredential', additionalData = {}) => {
  return {
    '@context': [
      'https://www.w3.org/2018/credentials/v1'
    ],
    type: ['VerifiableCredential', type],
    issuer: {
      id: 'did:web:test.learncard.io'
    },
    issuanceDate: new Date().toISOString(),
    credentialSubject: {
      id: subjectDid,
      ...additionalData
    }
  };
};

/**
 * Create a mock signed credential for testing
 */
export const createMockSignedCredential = (subjectDid: string, type = 'TestCredential', additionalData = {}) => {
  const credential = createMockCredential(subjectDid, type, additionalData);
  
  return {
    ...credential,
    proof: {
      type: 'Ed25519Signature2018',
      created: new Date().toISOString(),
      verificationMethod: 'did:web:test.learncard.io#keys-1',
      proofPurpose: 'assertionMethod',
      jws: 'mock-signature'
    }
  };
};