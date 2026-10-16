import { randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';

import type { AddPlugin } from '@learncard/core';
import { initLearnCard } from '@learncard/init';
import type { NetworkLearnCardFromSeed } from '@learncard/init';
import { getLCAPlugin } from '@learncard/lca-api-plugin';
import type { LCAPlugin } from '@learncard/lca-api-plugin';

import { DIDKIT_WASM_PATH, STACK } from './constants';

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
    seed: string = randomBytes(32).toString('hex')
): Promise<VerificationLearnCard> => {
    didkit ??= readFile(DIDKIT_WASM_PATH);
    const learnCard = await initLearnCard({
        seed,
        didkit,
        network: STACK.brain,
        // Local boosts are not in the production registry: trust only this owned network.
        trustedBoostRegistry: `data:application/json,${encodeURIComponent(
            JSON.stringify([
                {
                    id: 'LearnCard Verification Network',
                    url: 'http://localhost:4000',
                    did: STACK.brainDid,
                },
            ])
        )}`,
        cloud: { url: STACK.cloud },
    });

    return learnCard.addPlugin(
        await getLCAPlugin(learnCard as unknown as Parameters<typeof getLCAPlugin>[0], STACK.lcaApi)
    ) as unknown as VerificationLearnCard;
};

/** Create a run-owned network profile, returning the wallet and its profile ID. */
export const getVerificationProfile = async (
    profileId: string,
    displayName: string,
    seed?: string
): Promise<VerificationLearnCard> => {
    const learnCard = await getVerificationLearnCard(seed);
    if (!(await learnCard.invoke.getProfile())) {
        await learnCard.invoke.createProfile({ profileId, displayName, bio: '', shortBio: '' });
    }
    return learnCard;
};
