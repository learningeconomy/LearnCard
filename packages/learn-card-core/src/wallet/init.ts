import { customLearnCard } from './initializers/customLearnCard';
import { emptyLearnCard } from './initializers/emptyLearnCard';
import { learnCardFromSeed } from './initializers/learnCardFromSeed';
import { networkLearnCardFromSeed } from './initializers/networkLearnCardFromSeed';
import { learnCardFromApiUrl } from './initializers/apiLearnCard';

import {
    InitLearnCard,
    EmptyLearnCard,
    LearnCardFromSeed,
    NetworkLearnCardFromSeed,
    LearnCardFromVcApi,
    CustomLearnCard,
} from 'types/LearnCard';

export * from './initializers/customLearnCard';
export * from './initializers/emptyLearnCard';
export * from './initializers/learnCardFromSeed';
export * from './initializers/apiLearnCard';
export * from './initializers/networkLearnCardFromSeed';

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
 * Generates a full wallet connected to the LearnCard Network from a 32 byte seed
 *
 * @group Init Functions
 */
export function initLearnCard(
    config: NetworkLearnCardFromSeed['args']
): Promise<NetworkLearnCardFromSeed['returnValue']>;

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
            const { network } = config;

            return networkLearnCardFromSeed({
                ...config,
                // TODO: Update default endpoint
                network: network === true ? 'http://localhost:3000/trpc' : network,
            });
        }

        const { seed, ...keyConfig } = config;

        return learnCardFromSeed(seed, keyConfig);
    }

    return emptyLearnCard(config);
}
