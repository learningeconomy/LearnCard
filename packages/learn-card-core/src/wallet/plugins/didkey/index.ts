import { generateEd25519KeyFromBytes, keyToDID } from 'didkit';
import { toUint8Array } from 'hex-lite';

import { DidKeyPluginMethods } from './types';
import { Plugin } from 'types/wallet';

const isHex = (str: string) => /^[0-9a-f]+$/i.test(str);

export const getDidKeyPlugin = async (
    key: string
): Promise<Plugin<'DID Key', DidKeyPluginMethods>> => {
    if (key.length === 0) throw new Error("Please don't use an empty string for a key!");
    if (!isHex(key)) throw new Error('Key must be a hexadecimal string!');
    if (key.length > 64) throw new Error('Key must be less than 64 characters');

    const keypair = JSON.parse(generateEd25519KeyFromBytes(toUint8Array(key.padStart(64, '0'))));
    const did = keyToDID('key', JSON.stringify(keypair));

    return {
        pluginMethods: {
            getSubjectDid: () => did,
            getSubjectKeypair: () => keypair,
            getKey: () => key.padStart(64, '0'),
        },
    };
};
