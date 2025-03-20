import crypto from 'crypto';
import { getKeyPair } from './auth.helpers';
import { LTI_KEY_ID } from '../constants/lti';
import { MongoClient } from 'mongodb';
import { LTI_DATABASE_URI, LTI_DATABASE_NAME } from '../constants/lti';

// MongoDB connection cache
let client: MongoClient | null = null;
let db: any = null;

/**
 * Get a connection to the LTI MongoDB database
 */
export const getDatabase = async () => {
    if (!client) {
        client = new MongoClient(LTI_DATABASE_URI as string, {
            maxPoolSize: 5,
            minPoolSize: 1,
            connectTimeoutMS: 10000,
            socketTimeoutMS: 45000,
        });
        await client.connect();
        console.log('Connected to MongoDB for LTI');
    }

    if (!db) {
        db = client.db(LTI_DATABASE_NAME);
    }

    return db;
};

/**
 * Generate a JWKS for the LTI provider
 */
export const generateLtiJwks = () => {
    const { publicKey, keyId } = getKeyPair();
    const keyComponents = crypto.createPublicKey(publicKey).export({ format: 'jwk' });

    return {
        keys: [
            {
                ...keyComponents,
                use: 'sig',
                kid: LTI_KEY_ID,
                alg: 'RS256',
            },
        ],
    };
};

/**
 * Register or update a platform in the database
 */
export const registerPlatform = async (platformData: any) => {
    const db = await getDatabase();
    const platforms = db.collection('lti_platforms');

    const { issuer, client_id, deployment_id } = platformData;
    
    // Create a unique ID from a combination of these fields
    const id = `${issuer}#${client_id}#${deployment_id}`;
    
    const result = await platforms.updateOne(
        { _id: id },
        { $set: { ...platformData, _id: id, updatedAt: new Date() } },
        { upsert: true }
    );
    
    return result;
};

/**
 * Find a platform in the database
 */
export const findPlatform = async (issuer: string, clientId: string, deploymentId?: string) => {
    const db = await getDatabase();
    const platforms = db.collection('lti_platforms');
    
    let query: any = { issuer, client_id: clientId };
    if (deploymentId) {
        query.deployment_id = deploymentId;
    }
    
    return platforms.findOne(query);
};

/**
 * Create a state for OIDC flow
 */
export const createState = async (stateData: any) => {
    const db = await getDatabase();
    const states = db.collection('lti_states');
    
    const id = crypto.randomBytes(16).toString('hex');
    
    await states.insertOne({
        _id: id,
        ...stateData,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 3600000), // 1 hour expiry
    });
    
    return id;
};

/**
 * Retrieve and consume a state
 */
export const getAndConsumeState = async (id: string) => {
    const db = await getDatabase();
    const states = db.collection('lti_states');
    
    const state = await states.findOne({ _id: id });
    
    if (state) {
        await states.deleteOne({ _id: id });
    }
    
    return state;
};

/**
 * Store an LTI session
 */
export const storeSession = async (sessionData: any) => {
    const db = await getDatabase();
    const sessions = db.collection('lti_sessions');
    
    const id = crypto.randomBytes(16).toString('hex');
    
    await sessions.insertOne({
        _id: id,
        ...sessionData,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 86400000), // 24 hour expiry
    });
    
    return id;
};

/**
 * Retrieve an LTI session
 */
export const getSession = async (id: string) => {
    const db = await getDatabase();
    const sessions = db.collection('lti_sessions');
    
    return sessions.findOne({ _id: id });
};

/**
 * Map LMS user to DID
 * This allows linking LTI users to LearnCard DIDs
 */
export const mapUserToDid = async (platformId: string, userId: string, did: string) => {
    const db = await getDatabase();
    const mappings = db.collection('lti_user_mappings');
    
    const id = `${platformId}#${userId}`;
    
    await mappings.updateOne(
        { _id: id },
        { $set: { platformId, userId, did, updatedAt: new Date() } },
        { upsert: true }
    );
    
    return did;
};

/**
 * Get DID for LMS user
 */
export const getDidForUser = async (platformId: string, userId: string) => {
    const db = await getDatabase();
    const mappings = db.collection('lti_user_mappings');
    
    const id = `${platformId}#${userId}`;
    const mapping = await mappings.findOne({ _id: id });
    
    return mapping?.did;
};