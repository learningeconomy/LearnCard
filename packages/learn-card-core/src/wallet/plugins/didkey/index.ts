import { toUint8Array } from 'hex-lite';

import { DependentMethods, DidKeyPluginMethods } from './types';
import { Plugin, UnlockedWallet } from 'types/wallet';

const isHex = (str: string) => /^[0-9a-f]+$/i.test(str);

export const getDidKeyPlugin = async <T extends string>(
    wallet: UnlockedWallet<string, DependentMethods<T>>,
    key: string
): Promise<Plugin<'DID Key', DidKeyPluginMethods<T>>> => {
    if (key.length === 0) throw new Error("Please don't use an empty string for a key!");
    if (!isHex(key)) throw new Error('Key must be a hexadecimal string!');
    if (key.length > 64) throw new Error('Key must be less than 64 characters');

    const seed = key.padStart(64, '0');
    const seedBytes = toUint8Array(seed);

    const ed25519Kp = wallet.pluginMethods.generateEd25519KeyFromBytes(seedBytes);
    const secp256k1Kp = wallet.pluginMethods.generateSecp256k1KeyFromBytes(seedBytes);

    return {
        pluginMethods: {
            getSubjectDid: (_wallet, type) => {
                if (type === 'ethr') return wallet.pluginMethods.keyToDid(type, secp256k1Kp);

                return wallet.pluginMethods.keyToDid(type, ed25519Kp);
            },
            getSubjectKeypair: (_wallet, type = 'ed25519') => {
                if (type === 'ed25519') return ed25519Kp;
                if (type === 'secp256k1') return secp256k1Kp;

                throw new Error('Unsupported algorithm');
            },
            getKey: () => seed,
        },
    };
};
