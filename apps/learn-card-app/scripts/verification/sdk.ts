import { randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';

import type { AddPlugin } from '@learncard/core';
import { initLearnCard } from '@learncard/init';
import type { NetworkLearnCardFromSeed } from '@learncard/init';
import { getLCAPlugin } from '@learncard/lca-api-plugin';
import type { LCAPlugin } from '@learncard/lca-api-plugin';

import { DIDKIT_WASM_PATH } from './constants';
import type { StackEndpoints } from './types';

export type VerificationLearnCard = AddPlugin<NetworkLearnCardFromSeed['returnValue'], LCAPlugin>;

let didkit: Promise<Buffer> | undefined;

/**
 * Initialize a real, network-enabled LearnCard against the owned local stack.
 *
 * Run under `bun --conditions=development` (lc verify does) so workspace packages resolve to
 * their `src/` entry points: an agent verifying an SDK change exercises the checkout, not a
 * stale `dist/` build.
 */
export const getVerificationLearnCard = async (
    stack: StackEndpoints,
    seed: string = randomBytes(32).toString('hex')
): Promise<VerificationLearnCard> => {
    didkit ??= readFile(DIDKIT_WASM_PATH);
    const learnCard = await initLearnCard({
        seed,
        didkit,
        network: stack.brain,
        // Local boosts are not in the production registry: trust only this owned network.
        trustedBoostRegistry: `data:application/json,${encodeURIComponent(
            JSON.stringify([
                {
                    id: 'LearnCard Verification Network',
                    url: new URL(stack.brain).origin,
                    did: stack.brainDid,
                },
            ])
        )}`,
        cloud: { url: stack.cloud },
    });

    return learnCard.addPlugin(
        await getLCAPlugin(learnCard as unknown as Parameters<typeof getLCAPlugin>[0], stack.lcaApi)
    ) as unknown as VerificationLearnCard;
};

/** Create a run-owned network profile, returning the wallet and its profile ID. */
export const getVerificationProfile = async (
    stack: StackEndpoints,
    profileId: string,
    displayName: string,
    seed?: string
): Promise<VerificationLearnCard> => {
    const learnCard = await getVerificationLearnCard(stack, seed);
    if (!(await learnCard.invoke.getProfile())) {
        await learnCard.invoke.createProfile({ profileId, displayName, bio: '', shortBio: '' });
    }
    return learnCard;
};
