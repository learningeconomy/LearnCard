import { generateEd25519KeyFromBytes, keyToDID } from 'didkit';
import { toUint8Array } from 'hex-lite';

import { DidKeyPluginMethods } from './types';
import { Plugin } from 'types/wallet';

export const getDidKeyPlugin = async (
    key: string
): Promise<Plugin<'DID Key', DidKeyPluginMethods>> => {
    const keypair = JSON.parse(generateEd25519KeyFromBytes(toUint8Array(key.padStart(64, '0'))));
    const did = keyToDID('key', JSON.stringify(keypair));

    return {
        pluginMethods: {
            getSubjectDid: () => did,
            getSubjectKeypair: () => keypair,
            getKey: () => key,
        },
    };
};
