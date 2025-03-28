import { MongoClient } from 'mongodb';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { LearnCard, getLearnCard } from './learncard.helpers';

// MongoDB connection
const MONGO_URI = 'mongodb://localhost:27017';
const DB_NAME = 'learn-cloud';
let mongoClient: MongoClient | null = null;

/**
 * Get a MongoDB client connection
 */
export const getMongoClient = async (): Promise<MongoClient> => {
    if (!mongoClient) {
        mongoClient = new MongoClient(MONGO_URI);
        await mongoClient.connect();
    }
    return mongoClient;
};

/**
 * Close the MongoDB connection
 */
export const closeMongoClient = async (): Promise<void> => {
    if (mongoClient) {
        await mongoClient.close();
        mongoClient = null;
    }
};

/**
 * Register a test platform
 */
export const registerTestPlatform = async (options: {
    issuer?: string;
    client_id?: string;
    deployment_id?: string;
    auth_login_url?: string;
    auth_token_url?: string;
    key_set_url?: string;
} = {}): Promise<string> => {
    const client = await getMongoClient();
    const db = client.db(DB_NAME);
    const platforms = db.collection('lti_platforms');

    const platformData = {
        issuer: options.issuer || 'https://test-lms.example.com',
        client_id: options.client_id || 'test-client-id',
        deployment_id: options.deployment_id || 'test-deployment-id',
        auth_login_url: options.auth_login_url || 'https://test-lms.example.com/auth',
        auth_token_url: options.auth_token_url || 'https://test-lms.example.com/token',
        key_set_url: options.key_set_url || 'https://test-lms.example.com/jwks',
        redirect_uris: ['http://localhost:4100/lti/launch', 'http://localhost:4100/lti/deep-linking'],
        custom_parameters: { test_param: 'test_value' },
    };

    const id = `${platformData.issuer}#${platformData.client_id}#${platformData.deployment_id}`;
    
    await platforms.updateOne(
        { _id: id },
        { $set: { ...platformData, _id: id, updatedAt: new Date() } },
        { upsert: true }
    );

    return id;
};

/**
 * Generate test key pair for LTI
 */
export const generateTestKeyPair = (): { publicKey: string; privateKey: string; keyId: string } => {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
            type: 'spki',
            format: 'pem',
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem',
        },
    });

    const keyId = 'test-key-' + crypto.randomBytes(4).toString('hex');

    return { publicKey, privateKey, keyId };
};

/**
 * Generate JWKS for test LMS
 */
export const generateTestJwks = (keys: Array<{ publicKey: string; keyId: string }>) => {
    const jwksKeys = keys.map(({ publicKey, keyId }) => {
        const keyComponents = crypto.createPublicKey(publicKey).export({ format: 'jwk' });
        return {
            ...keyComponents,
            use: 'sig',
            kid: keyId,
            alg: 'RS256',
        };
    });

    return {
        keys: jwksKeys,
    };
};

/**
 * Create a new LTI state
 */
export const createLtiState = async (options: {
    state?: string;
    nonce?: string;
    platformId?: string;
    target_link_uri?: string;
} = {}): Promise<string> => {
    const client = await getMongoClient();
    const db = client.db(DB_NAME);
    const states = db.collection('lti_states');

    const stateData = {
        state: options.state || crypto.randomBytes(16).toString('hex'),
        nonce: options.nonce || crypto.randomBytes(16).toString('hex'),
        platform_id: options.platformId || 'https://test-lms.example.com#test-client-id#test-deployment-id',
        target_link_uri: options.target_link_uri || 'http://localhost:4100/lti/launch',
    };

    const id = crypto.randomBytes(16).toString('hex');

    await states.insertOne({
        _id: id,
        ...stateData,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 3600000), // 1 hour expiry
    });

    return stateData.state;
};

/**
 * Create an ID token for LTI launch
 */
export const createLtiIdToken = (
    payload: Record<string, any>,
    privateKey: string,
    keyId: string
): string => {
    const now = Math.floor(Date.now() / 1000);
    
    const defaultPayload = {
        iss: 'https://test-lms.example.com',
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
        'https://purl.imsglobal.org/spec/lti/claim/custom': {
            test_param: 'test_value',
        },
    };

    const mergedPayload = { ...defaultPayload, ...payload };

    return jwt.sign(mergedPayload, privateKey, {
        algorithm: 'RS256',
        keyid: keyId,
    });
};

/**
 * Map a user to a DID in the LTI system
 */
export const mapUserToDid = async (platformId: string, userId: string, did: string): Promise<void> => {
    const client = await getMongoClient();
    const db = client.db(DB_NAME);
    const mappings = db.collection('lti_user_mappings');
    
    const id = `${platformId}#${userId}`;
    
    await mappings.updateOne(
        { _id: id },
        { $set: { platformId, userId, did, updatedAt: new Date() } },
        { upsert: true }
    );
};

/**
 * Get a LearnCard instance with a DID and map it to an LTI user
 */
export const getLtiUserLearnCard = async (userId = 'test-user-id') => {
    const learnCard = await getLearnCard('lti'.repeat(16));
    const did = learnCard.id.did();
    
    // Map the user to the DID
    await mapUserToDid(
        'https://test-lms.example.com#test-client-id#test-deployment-id',
        userId,
        did
    );
    
    return { learnCard, did };
};

/**
 * Create a mock credential from LTI context
 */
export const createMockLtiCredential = (did: string, contextId: string) => {
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
            achievement: 'Completed Test Course'
        }
    };
};