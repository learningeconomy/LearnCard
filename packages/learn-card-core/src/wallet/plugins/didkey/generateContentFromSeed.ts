import { Ed25519KeyPair } from '@transmute/did-key-ed25519';
import crypto from '../../base/crypto';

import { JWK } from './types';

export const seedToId = async (seed: Uint8Array) => {
    const buffer = await crypto.subtle.digest('SHA-256', seed);

    return `urn:digest:${Buffer.from(new Uint8Array(buffer)).toString('hex')}`;
};

const generateContentFromSeed = async (seed: Uint8Array): Promise<JWK[]> => {
    const ed25519KeyPair = await Ed25519KeyPair.generate({
        secureRandom: () => {
            return Buffer.from(seed);
        },
    });

    const signingKey = await ed25519KeyPair.toJsonWebKeyPair(true);
    const encryptionKey = await (
        await Ed25519KeyPair.toX25519KeyPair(ed25519KeyPair)
    ).toJsonWebKeyPair(true);

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
        id: signingKey.controller + signingKey.id,
        '@context': ['http://w3id.org/wallet/v1'],
        name: 'Signing Key',
        image: 'https://via.placeholder.com/150',
        description: 'Used to produce digital signatures.',
        tags: ['inception'],
        generatedFrom: [secret.id],
    };

    const key1: JWK = {
        ...encryptionKey,
        id: encryptionKey.controller + encryptionKey.id,
        '@context': ['http://w3id.org/wallet/v1'],
        name: 'Encryption Key',
        image: 'https://via.placeholder.com/150',
        description: 'Used to derive symmetric keys for encryption.',
        tags: ['inception'],
        generatedFrom: [secret.id],
    };

    return [secret, key0, key1];
};

export { generateContentFromSeed };
