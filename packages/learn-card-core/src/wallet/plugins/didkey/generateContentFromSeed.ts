import { generateEd25519KeyFromBytes, keyToDID } from '@src/didkit/index';
import crypto from '../../base/crypto';

import { JWK } from './types';

export const seedToId = async (seed: Uint8Array) => {
    const buffer = await crypto.subtle.digest('SHA-256', seed);

    return `urn:digest:${Buffer.from(new Uint8Array(buffer)).toString('hex')}`;
};

const generateContentFromSeed = async (seed: Uint8Array): Promise<JWK[]> => {
    const privateKeyJwk = JSON.parse(generateEd25519KeyFromBytes(seed));
    const controller = keyToDID('key', JSON.stringify(privateKeyJwk));
    const { d, ...publicKeyJwk } = privateKeyJwk;

    const signingKey = {
        controller,
        id: `${controller}#${controller.split(':').at(-1)}`,
        privateKeyJwk,
        publicKeyJwk,
        type: 'JsonWebKey2020',
    };

    const seedId = await seedToId(seed);

    const secret: JWK = {
        '@context': ['http://w3id.org/wallet/v1'],
        id: seedId,
        name: 'DID Key Secret',
        image: 'https://via.placeholder.com/150',
        description: 'Used to generate a DID with a signing and encryption key.',
        tags: ['inception'],
        type: 'Entropy',
        value: Buffer.from(seed).toString('hex'),
    };

    const key0: JWK = {
        ...signingKey,
        '@context': ['http://w3id.org/wallet/v1'],
        name: 'Signing Key',
        image: 'https://via.placeholder.com/150',
        description: 'Used to produce digital signatures.',
        tags: ['inception'],
        generatedFrom: [secret.id],
    };

    return [secret, key0];
};

export { generateContentFromSeed };
