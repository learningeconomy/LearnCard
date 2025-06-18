import { customLearnCard } from './initializers/customLearnCard';
import { emptyLearnCard } from './initializers/emptyLearnCard';
import { learnCardFromSeed } from './initializers/learnCardFromSeed';
import { networkLearnCardFromSeed } from './initializers/networkLearnCardFromSeed';
import { didWebLearnCardFromSeed } from './initializers/didWebLearnCardFromSeed';
import { didWebNetworkLearnCardFromSeed } from './initializers/didWebNetworkLearnCardFromSeed';
import { learnCardFromApiUrl } from './initializers/apiLearnCard';

import type {
    InitLearnCard,
    EmptyLearnCard,
    LearnCardFromSeed,
    LearnCardFromVcApi,
    CustomLearnCard,
    NetworkLearnCardFromSeed,
    DidWebLearnCardFromSeed,
    DidWebNetworkLearnCardFromSeed,
} from './types/LearnCard';

export * from './initializers/customLearnCard';
export * from './initializers/emptyLearnCard';
export * from './initializers/learnCardFromSeed';
export * from './initializers/networkLearnCardFromSeed';
export * from './initializers/didWebLearnCardFromSeed';
export * from './initializers/didWebNetworkLearnCardFromSeed';
export * from './initializers/apiLearnCard';

// Overloads (Unfortunately necessary boilerplate 😢)

/**
 * Generates an Empty Wallet
 *
 * @group Init Functions
 */
export function initLearnCard(
    config?: EmptyLearnCard['args']
): Promise<EmptyLearnCard['returnValue']>;

/**
 * Generates a full wallet from a 32 byte seed
 *
 * @group Init Functions
 */
export function initLearnCard(
    config: LearnCardFromSeed['args']
): Promise<LearnCardFromSeed['returnValue']>;

/**
 * Generates a full wallet from a 32 byte seed
 *
 * @group Init Functions
 */
export function initLearnCard(
    config: DidWebLearnCardFromSeed['args']
): Promise<DidWebLearnCardFromSeed['returnValue']>;

/**
 * Generates a full wallet with access to LearnCard Network from a 32 byte seed
 *
 * @group Init Functions
 */
export function initLearnCard(
    config: NetworkLearnCardFromSeed['args']
): Promise<NetworkLearnCardFromSeed['returnValue']>;

/**
 * Generates a full wallet with access to LearnCard Network from a 32 byte seed using a different did:web
 *
 * @group Init Functions
 */
export function initLearnCard(
    config: DidWebNetworkLearnCardFromSeed['args']
): Promise<DidWebNetworkLearnCardFromSeed['returnValue']>;

/**
 * Generates a wallet that can sign VCs/VPs from a VC API
 *
 * @group Init Functions
 */
export function initLearnCard(
    config: LearnCardFromVcApi['args']
): Promise<LearnCardFromVcApi['returnValue']>;

/**
 * Generates a custom wallet with no plugins added
 *
 * @group Init Functions
 */
export function initLearnCard(
    config: CustomLearnCard['args']
): Promise<CustomLearnCard['returnValue']>;

// Implementation

/**
 * Generates a new LearnCard wallet
 *
 * @group Init Functions
 */
export async function initLearnCard(
    config: InitLearnCard['args'] = {}
): InitLearnCard['returnValue'] {
    if ('custom' in config) return customLearnCard({ debug: config.debug });

    if ('vcApi' in config) {
        const { vcApi, did, debug } = config;

        return learnCardFromApiUrl({
            url: typeof vcApi === 'string' ? vcApi : 'https://bridge.learncard.com',
            did: vcApi === true ? 'did:key:z6MkjSz4mYqcn7dePGuktJ5PxecMkXQQHWRg8Lm6okATyFVh' : did,
            debug,
        });
    }

    if ('seed' in config) {
        if ('network' in config) {
            if ('didWeb' in config) return didWebNetworkLearnCardFromSeed(config);

            return networkLearnCardFromSeed(config);
        }

        if ('didWeb' in config) return didWebLearnCardFromSeed(config);

        return learnCardFromSeed(config);
    }

    return emptyLearnCard(config);
}
