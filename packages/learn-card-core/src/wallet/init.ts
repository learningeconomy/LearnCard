import { emptyWallet } from './initializers/emptyWallet';
import { walletFromKey } from './initializers/walletFromKey';

import { InitLearnCard, EmptyInit, KeyInit } from 'types/LearnCard';

export * from './initializers/emptyWallet';
export * from './initializers/walletFromKey';

// Overloads (Unfortunately necessary boilerplate 😢)
export async function initLearnCard(config?: EmptyInit['args']): Promise<EmptyInit['returnValue']>;
export async function initLearnCard(config?: KeyInit['args']): Promise<KeyInit['returnValue']>;

// Implementation
export async function initLearnCard(
    config: InitLearnCard['args'] = {}
): InitLearnCard['returnValue'] {
    if ('seed' in config) {
        const { seed, ...keyConfig } = config;

        return walletFromKey(seed, keyConfig);
    }

    return emptyWallet(config);
}
