import { emptyWallet } from './initializers/emptyWallet';
import { walletFromKey } from './initializers/walletFromKey';
import { walletFromApiUrl } from './initializers/apiWallet';

import { InitLearnCard, EmptyWallet, WalletFromKey, WalletFromVcApi } from 'types/LearnCard';

export * from './initializers/emptyWallet';
export * from './initializers/walletFromKey';
export * from './initializers/apiWallet';

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

/**
 * Generates a wallet that can sign VCs/VPs from a VC API
 *
 * @group Init Functions
 */
export function initLearnCard(
    config: WalletFromVcApi['args']
): Promise<WalletFromVcApi['returnValue']>;

// Implementation

/**
 * Generates a new LearnCard wallet
 *
 * @group Init Functions
 */
export async function initLearnCard(
    config: InitLearnCard['args'] = {}
): InitLearnCard['returnValue'] {
    if ('vcApi' in config) {
        const { vcApi, did, ...apiConfig } = config;

        return walletFromApiUrl(
            typeof vcApi === 'string' ? vcApi : 'https://bridge.learncard.com',
            vcApi === true ? 'did:key:z6MkjSz4mYqcn7dePGuktJ5PxecMkXQQHWRg8Lm6okATyFVh' : did,
            apiConfig
        );
    }

    if ('seed' in config) {
        const { seed, ...keyConfig } = config;

        return walletFromKey(seed, keyConfig);
    }

    return emptyWallet(config);
}
