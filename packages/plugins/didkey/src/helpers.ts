import { Algorithm } from './types';

export const ED25519_METHODS = ['key', 'tz', 'pkh:tz', 'pkh:tezos', 'pkh:sol', 'pkh:solana'];

export const SECP256K1_METHODS = [
    'key',
    'tz',
    'ethr',
    'pkh:tz',
    'pkh:tezos',
    'pkh:eth',
    'pkh:celo',
    'pkh:poly',
    'pkh:btc',
    'pkh:doge',
    'pkh:eip155',
    'pkh:bip122',
];

export const getAlgorithmForDidMethod = <DidMethod extends string>(
    didMethod: DidMethod
): Algorithm => {
    if (ED25519_METHODS.includes(didMethod)) return 'ed25519';
    if (
        SECP256K1_METHODS.includes(didMethod) ||
        didMethod.startsWith('pkh:eip155:') ||
        didMethod.startsWith('pkh:bip122:')
    ) {
        return 'secp256k1';
    }

    throw new Error('Unspported Did Method');
};
