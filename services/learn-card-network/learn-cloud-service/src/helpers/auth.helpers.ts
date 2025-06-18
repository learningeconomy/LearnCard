// crypto.helpers.ts
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { XAPI_ENDPOINT } from '../constants/xapi';

type KeyPair = {
    privateKey: string;
    publicKey: string;
    keyId: string;
}

let cachedKeyPair: KeyPair | null = null;

/**
 * Get RSA keypair from environment variables
 * Falls back to generating a new keypair if not in environment
 * (not deterministic, but only used as fallback in development)
 */
export function getKeyPair(): KeyPair {
    if (cachedKeyPair) {
        return cachedKeyPair;
    }

    // Try to get keys from environment
    const privateKey = process.env.RSA_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const publicKey = process.env.RSA_PUBLIC_KEY?.replace(/\\n/g, '\n');

    // If we have valid keys in env, use them
    if (privateKey && publicKey) {
        try {
            // Verify keys are valid
            crypto.createPrivateKey(privateKey);
            crypto.createPublicKey(publicKey);

            const keyId = crypto.createHash('sha256').update(publicKey).digest('hex').slice(0, 16);

            cachedKeyPair = { privateKey, publicKey, keyId };
            return cachedKeyPair;
        } catch (error) {
            console.warn('Invalid RSA keys in environment variables:', error);
            // Fall through to generating new keys
        }
    }

    // Generate new keypair (only for development/testing)
    console.warn('Generating new RSA keypair (for development only)');
    const { privateKey: newPrivateKey, publicKey: newPublicKey } = crypto.generateKeyPairSync(
        'rsa',
        {
            modulusLength: 2048,
            publicKeyEncoding: {
                type: 'spki',
                format: 'pem',
            },
            privateKeyEncoding: {
                type: 'pkcs8',
                format: 'pem',
            },
        }
    );

    const keyId = crypto.createHash('sha256').update(newPublicKey).digest('hex').slice(0, 16);

    cachedKeyPair = {
        privateKey: newPrivateKey,
        publicKey: newPublicKey,
        keyId,
    };

    // Output keys so they can be set as environment variables
    console.log('\nAdd these to your environment variables:');
    console.log(`RSA_PRIVATE_KEY=${newPrivateKey.replace(/\n/g, String.raw`\n`)}`);
    console.log(`RSA_PUBLIC_KEY=${newPublicKey.replace(/\n/g, String.raw`\n`)}\n`);

    return cachedKeyPair;
}

const ISSUER = process.env.SERVER_URL || 'http://localhost:4100';

export const generateToken = (did: string, scope = 'lrs:all'): string => {
    const { privateKey, keyId } = getKeyPair();

    return jwt.sign(
        {
            iss: ISSUER,
            sub: did,
            aud: XAPI_ENDPOINT,
            scope,
            did,
        },
        privateKey,
        {
            expiresIn: '1h',
            algorithm: 'RS256',
            keyid: keyId,
        }
    );
};

export const generateJwk = () => {
    const { publicKey, keyId } = getKeyPair();
    const keyComponents = crypto.createPublicKey(publicKey).export({ format: 'jwk' });

    return {
        ...keyComponents,
        use: 'sig',
        kid: keyId,
        alg: 'RS256',
    };
};
