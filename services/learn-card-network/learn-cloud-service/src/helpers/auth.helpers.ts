import crypto from 'crypto';

import jwt from 'jsonwebtoken';

import { isTest } from './test.helpers';
import { generateDeterministicRsaKeyPair } from './crypto.helpers';
import { XAPI_ENDPOINT } from '../constants/xapi';

const seed = isTest ? 'a'.repeat(64) : process.env.LEARN_CLOUD_SEED;

const { privateKey, publicKey } = generateDeterministicRsaKeyPair(Buffer.from(seed ?? '', 'hex'));

const ISSUER = process.env.SERVER_URL || 'http://localhost:4100';
const KEY_ID = crypto.createHash('sha256').update(publicKey).digest('hex').slice(0, 16);

export const generateToken = (did: string, scope = 'lrs:all'): string => {
    const token = jwt.sign({ iss: ISSUER, sub: did, aud: XAPI_ENDPOINT, scope, did }, privateKey, {
        expiresIn: '1h',
        algorithm: 'RS256',
        keyid: KEY_ID,
    });

    return token;
};

export const generateJwk = () => {
    const keyComponents = crypto.createPublicKey(publicKey).export({ format: 'jwk' });

    return { ...keyComponents, use: 'sig', kid: KEY_ID, alg: 'RS256' };
};
