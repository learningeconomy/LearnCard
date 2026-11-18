import { JWKWithPrivateKey } from '@learncard/types';
import { LearnCard } from '@learncard/core';

import { getAlgorithmForDidMethod } from './helpers';
import { didKeySeedToBytes } from './seed';

import { DidKeyPlugin, DependentMethods, Algorithm } from './types';

export * from './types';
export { getEd25519DidKeyFromSeed } from './didKeyFromSeed';

/**
 *
 * @group Plugins
 */
export const getDidKeyPlugin = async <DidMethod extends string>(
    learnCard: LearnCard<any, any, DependentMethods<DidMethod>>,
    key: string,
    defaultDidMethod: DidMethod
): Promise<DidKeyPlugin<DidMethod>> => {
    const { seed, seedBytes } = didKeySeedToBytes(key);

    const memoizedDids: Partial<Record<DidMethod, string>> = {};
    // secp256k1 is derived on first use: did:key and most wallets only need ed25519.
    const keyPairs: Partial<Record<Algorithm, JWKWithPrivateKey>> = {
        ed25519: learnCard.invoke.generateEd25519KeyFromBytes(seedBytes),
    };

    const keypair = (algorithm: Algorithm = 'ed25519'): JWKWithPrivateKey => {
        if (algorithm === 'secp256k1') {
            keyPairs.secp256k1 ??= learnCard.invoke.generateSecp256k1KeyFromBytes(seedBytes);
        }

        const pair = keyPairs[algorithm];
        if (!pair) throw new Error('Unsupported algorithm');

        return pair;
    };

    const did = (method = defaultDidMethod) => {
        if (!memoizedDids[method]) {
            const algorithm = getAlgorithmForDidMethod(method);
            memoizedDids[method] = learnCard.invoke.keyToDid(method, keypair(algorithm));
        }

        return memoizedDids[method]!;
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
