import { readFile } from 'fs/promises';

import { AddPlugin } from '@learncard/core';
import {
    initLearnCard,
    NetworkLearnCardFromSeed,
    NetworkLearnCardFromApiKey,
} from '@learncard/init';
import { getSimpleSigningPlugin, SimpleSigningPlugin } from '@learncard/simple-signing-plugin';

const didkit = readFile(
    require.resolve('@learncard/didkit-plugin/dist/didkit/didkit_wasm_bg.wasm')
);

export type LearnCard = AddPlugin<NetworkLearnCardFromSeed['returnValue'], SimpleSigningPlugin>;

export type ApiKeyLearnCard = NetworkLearnCardFromApiKey['returnValue'];

export const getLearnCard = async (
    seed = 'a'.repeat(64),
    managedDid?: string,
    debug = false
): Promise<LearnCard> => {
    const learnCard = await initLearnCard({
        seed,
        didkit,
        network: 'http://localhost:4000/trpc',
        cloud: { url: 'http://localhost:4100/trpc' },
        ...(managedDid && { didWeb: managedDid }),
        ...(debug && { debug: console.log }),
    });

    return learnCard.addPlugin(
        await getSimpleSigningPlugin(learnCard, 'http://localhost:4200/trpc')
    ) as any;
};

export const USERS = {
    a: { seed: 'a'.repeat(64), profileId: 'testa', displayName: 'User A' },
    b: { seed: 'b'.repeat(64), profileId: 'testb', displayName: 'User B' },
    c: { seed: 'c'.repeat(64), profileId: 'testc', displayName: 'User C' },
    d: { seed: 'd'.repeat(64), profileId: 'testd', displayName: 'User D' },
    e: { seed: 'e'.repeat(64), profileId: 'teste', displayName: 'User E' },
    f: { seed: 'e'.repeat(62) + '00', profileId: 'testf', displayName: 'User F' },
} as const satisfies Record<string, { seed: string; profileId: string; displayName: string }>;

export const getLearnCardForUser = async (userKey: keyof typeof USERS) => {
    const user = USERS[userKey];

    const learnCard = await getLearnCard(user.seed);

    try {
        // Avoid creating a duplicate profile if it already exists
        const existing = await learnCard.invoke.getProfile();

        if (!existing) {
            await learnCard.invoke.createProfile({
                profileId: user.profileId,
                displayName: user.displayName,
                bio: '',
                shortBio: '',
            });
        }
    } catch (error) {
        // Swallow only known "already exists" scenarios; rethrow unexpected errors
        const msg = (error as any)?.message ?? String(error);
        if (!/already exists/i.test(msg)) throw error;
    }

    return learnCard;
};

export const getManagedLearnCardForUser = async (
    userKey: keyof typeof USERS,
    managedDid: string,
    debug = false
) => {
    const user = USERS[userKey];

    return getLearnCard(user.seed, managedDid, debug);
};

/**
 * Initialize a LearnCard in API-key mode for a given user by:
 * 1) Creating an auth grant on the user's seed-based LearnCard
 * 2) Exchanging that grant for an API token
 * 3) Initializing a LearnCard configured with the API token (no local seed/id plane)
 */
export const getApiKeyLearnCardForUser = async (
    userKey: keyof typeof USERS,
    scope: string | string[] = 'boosts:write',
    debug = false
): Promise<ApiKeyLearnCard> => {
    // Ensure the user has an account before creating an auth grant
    const seedLc = await getLearnCardForUser(userKey);

    const grantId = await seedLc.invoke.addAuthGrant({
        name: 'e2e',
        scope: Array.isArray(scope) ? scope.join(' ') : scope,
    });

    const apiToken = await seedLc.invoke.getAPITokenForAuthGrant(grantId);

    const apiLc = await initLearnCard({
        apiKey: apiToken,
        didkit,
        network: 'http://localhost:4000/trpc',
        ...(debug && { debug: console.log }),
    });

    try {
        await apiLc.invoke.getProfile();
    } catch (error) {
        console.error(error);
    }

    return apiLc;
};

export const createApiTokenForUser = async (
    userKey: keyof typeof USERS,
    scope: string | string[] = 'boosts:write',
    _debug = false
): Promise<{ seedLc: LearnCard; grantId: string; token: string }> => {
    const seedLc = await getLearnCardForUser(userKey);

    const grantId = await seedLc.invoke.addAuthGrant({
        name: 'e2e',
        scope: Array.isArray(scope) ? scope.join(' ') : scope,
    });

    const token = await seedLc.invoke.getAPITokenForAuthGrant(grantId);

    return { seedLc, grantId, token };
};

export const initApiKeyLearnCard = async (
    apiKey: string,
    debug = false
): Promise<ApiKeyLearnCard> => {
    const apiLc = await initLearnCard({
        apiKey,
        didkit,
        network: 'http://localhost:4000/trpc',
        ...(debug && { debug: console.log }),
    });

    return apiLc;
};
