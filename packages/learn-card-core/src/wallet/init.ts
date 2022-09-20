import { emptyWallet } from './initializers/emptyWallet';
import { walletFromKey } from './initializers/walletFromKey';

import { InitLearnCard, EmptyWallet, WalletFromKey } from 'types/LearnCard';

export * from './initializers/emptyWallet';
export * from './initializers/walletFromKey';

// Overloads (Unfortunately necessary boilerplate 😢)

/**
 * Generates an Empty Wallet
 *
 * @group Init Functions
 */
export function initLearnCard(config?: EmptyWallet['args']): Promise<EmptyWallet['returnValue']>;

/**
 * Generates a full wallet from a 32 byte seed
 *
 * @group Init Functions
 */
export function initLearnCard(config: WalletFromKey['args']): Promise<WalletFromKey['returnValue']>;

// Implementation

/**
 * Generates a new LearnCard wallet
 *
 * @group Init Functions
 */
export async function initLearnCard(
    config: InitLearnCard['args'] = {}
): InitLearnCard['returnValue'] {
    if ('seed' in config) {
        const { seed, ...keyConfig } = config;

        return walletFromKey(seed, keyConfig);
    }

    return emptyWallet(config);
}
