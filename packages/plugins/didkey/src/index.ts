import { toUint8Array } from 'hex-lite';
import { isHex } from '@learncard/helpers';
import { JWK } from '@learncard/types';
import { LearnCard } from '@learncard/core';

import { getAlgorithmForDidMethod } from './helpers';

import { DidKeyPlugin, DependentMethods, Algorithm } from './types';

export * from './types';

/**
 *
 * @group Plugins
 */
export const getDidKeyPlugin = async <DidMethod extends string>(
    learnCard: LearnCard<any, any, DependentMethods<DidMethod>>,
    key: string,
    defaultDidMethod: DidMethod
): Promise<DidKeyPlugin<DidMethod>> => {
    if (key.length === 0) throw new Error("Please don't use an empty string for a key!");
    if (!isHex(key)) throw new Error('Key must be a hexadecimal string!');
    if (key.length > 64) throw new Error('Key must be less than 64 characters');

    if (key.length < 64) {
        console.warn(
            'Warning: A LearnCard has been initialized with a seed that is less than 32 bytes, and will be padded with zeroes'
        );
        console.warn(
            'Please instantiate LearnCards using 32 bytes that have been randomly generated in a cryptographically secure fashion!'
        );
        console.warn(
            'See https://app.gitbook.com/o/6uDv1QDlxaaZC7i8EaGb/s/FXvEJ9j3Vf3FW5Nc557n/learn-card-packages/learncard-core/instantiation#key-generation for details'
        );
    }

    const seed = key.padStart(64, '0');
    const seedBytes = toUint8Array(seed);

    const memoizedDids: Partial<Record<DidMethod, string>> = {};
    const keyPairs: Record<Algorithm, JWK> = {
        ed25519: learnCard.invoke.generateEd25519KeyFromBytes(seedBytes),
        secp256k1: learnCard.invoke.generateSecp256k1KeyFromBytes(seedBytes),
    };

    const did = (method = defaultDidMethod) => {
        if (!memoizedDids[method]) {
            const algorithm = getAlgorithmForDidMethod(method);
            memoizedDids[method] = learnCard.invoke.keyToDid(method, keyPairs[algorithm]);
        }

        return memoizedDids[method]!;
    };

    const keypair = (algorithm: Algorithm = 'ed25519') => {
        if (!keyPairs[algorithm]) throw new Error('Unsupported algorithm');

        return keyPairs[algorithm];
    };

    return {
        name: 'DID Key',
        displayName: 'DID Key',
        description: 'Generates dids and JWKs using 32 Secure Random Bytes of Entropy',
        id: {
            did: (_learnCard, method) => did(method as any),
            keypair: (_learnCard, algorithm) => keypair(algorithm as any),
        },
        methods: {
            getSubjectDid: (_learnCard, method = defaultDidMethod) => did(method),
            getSubjectKeypair: (_learnCard, algorithm = 'ed25519') => keypair(algorithm),
            getKey: () => seed,
        },
    };
};
