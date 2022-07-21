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

    const keypair = wallet.pluginMethods.generateEd25519KeyFromBytes(
        toUint8Array(key.padStart(64, '0'))
    );

    return {
        pluginMethods: {
            getSubjectDid: (_wallet, type) => wallet.pluginMethods.keyToDid(type, keypair),
            getSubjectKeypair: () => keypair,
            getKey: () => key.padStart(64, '0'),
        },
    };
};
