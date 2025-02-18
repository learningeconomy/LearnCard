import crypto from 'crypto';

import jwt from 'jsonwebtoken';

import { isTest } from './test.helpers';
import { generateDeterministicRSAKeyPair, KeyPair } from './crypto.helpers';
import { XAPI_ENDPOINT } from '../constants/xapi';
import { getRsaInfo, setRsaInfo } from '@cache/rsa';

const seed = isTest ? 'a'.repeat(64) : process.env.LEARN_CLOUD_SEED;

let keyInfo: { keypair: KeyPair; kid: string };

const getKeyInfo = async () => {
    if (!keyInfo) {
        const cachedKeyInfo = await getRsaInfo();

        if (cachedKeyInfo) keyInfo = cachedKeyInfo;
        else {
            const keypair = generateDeterministicRSAKeyPair(Buffer.from(seed ?? '', 'hex'));

            keyInfo = {
                keypair,
                kid: crypto
                    .createHash('sha256')
                    .update(keypair.publicKey)
                    .digest('hex')
                    .slice(0, 16),
            };

            setRsaInfo(keyInfo);
        }
    }

    return keyInfo;
};

const ISSUER = process.env.SERVER_URL || 'http://localhost:4100';

export const generateToken = async (did: string, scope = 'lrs:all'): Promise<string> => {
    const {
        keypair: { privateKey },
        kid,
    } = await getKeyInfo();

    const token = jwt.sign({ iss: ISSUER, sub: did, aud: XAPI_ENDPOINT, scope, did }, privateKey, {
        expiresIn: '1h',
        algorithm: 'RS256',
        keyid: kid,
    });

    return token;
};

export const generateJwk = async () => {
    const {
        keypair: { publicKey },
        kid,
    } = await getKeyInfo();

    const keyComponents = crypto.createPublicKey(publicKey).export({ format: 'jwk' });

    return { ...keyComponents, use: 'sig', kid, alg: 'RS256' };
};
