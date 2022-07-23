import { toUint8Array } from 'hex-lite';

import { isHex, getAlgorithmForDidMethod } from './helpers';

import { DependentMethods, DidKeyPluginMethods, Algorithm } from './types';
import { Plugin, Wallet } from 'types/wallet';
import { KeyPair } from '../didkit/types';

export const getDidKeyPlugin = async <DidMethod extends string>(
    wallet: Wallet<string, DependentMethods<DidMethod>>,
    key: string
): Promise<Plugin<'DID Key', DidKeyPluginMethods<DidMethod>>> => {
    if (key.length === 0) throw new Error("Please don't use an empty string for a key!");
    if (!isHex(key)) throw new Error('Key must be a hexadecimal string!');
    if (key.length > 64) throw new Error('Key must be less than 64 characters');

    const seed = key.padStart(64, '0');
    const seedBytes = toUint8Array(seed);

    const memoizedDids: Partial<Record<DidMethod, string>> = {};
    const keyPairs: Record<Algorithm, KeyPair> = {
        ed25519: wallet.pluginMethods.generateEd25519KeyFromBytes(seedBytes),
        secp256k1: wallet.pluginMethods.generateSecp256k1KeyFromBytes(seedBytes),
    };

    return {
        pluginMethods: {
            getSubjectDid: (_wallet, type) => {
                if (!memoizedDids[type]) {
                    const algorithm = getAlgorithmForDidMethod(type);
                    memoizedDids[type] = wallet.pluginMethods.keyToDid(type, keyPairs[algorithm]);
                }

                return memoizedDids[type]!;
            },
            getSubjectKeypair: (_wallet, type = 'ed25519') => {
                if (!keyPairs[type]) throw new Error('Unsupported algorithm');

                return keyPairs[type];
            },
            getKey: () => seed,
        },
    };
};
