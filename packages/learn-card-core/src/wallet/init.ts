import { emptyWallet } from './initializers/emptyWallet';
import { walletFromKey } from './initializers/walletFromKey';

import { InitLearnCard, EmptyWallet, WalletFromKey } from 'types/LearnCard';

export * from './initializers/emptyWallet';
export * from './initializers/walletFromKey';

// Overloads (Unfortunately necessary boilerplate 😢)
export function initLearnCard(config?: EmptyWallet['args']): Promise<EmptyWallet['returnValue']>;
export function initLearnCard(config: WalletFromKey['args']): Promise<WalletFromKey['returnValue']>;

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
