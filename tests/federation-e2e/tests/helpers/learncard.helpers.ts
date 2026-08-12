import { readFile } from 'node:fs/promises';

import { initLearnCard, type NetworkLearnCardFromSeed } from '@learncard/init';

const didkit = readFile(
    require.resolve('@learncard/didkit-plugin/dist/didkit/didkit_wasm_bg.wasm')
);

export type BrainALearnCard = NetworkLearnCardFromSeed['returnValue'];
export type BrainBLearnCard = NetworkLearnCardFromSeed['returnValue'];

export const getBrainALearnCard = async (
    seed = 'a'.repeat(64),
    debug = false
): Promise<BrainALearnCard> => {
    const learnCard = await initLearnCard({
        seed,
        didkit,
        network: 'http://localhost:4000/trpc',
        ...(debug && { debug: console.log }),
    });

    return learnCard;
};

export const getBrainBLearnCard = async (
    seed = 'b'.repeat(64),
    debug = false
): Promise<BrainBLearnCard> => {
    const learnCard = await initLearnCard({
        seed,
        didkit,
        network: 'http://localhost:4001/trpc',
        ...(debug && { debug: console.log }),
    });

    return learnCard;
};

export const USERS = {
    a: { seed: 'a'.repeat(64), profileId: 'testa', displayName: 'User A' },
    b: { seed: 'b'.repeat(64), profileId: 'testb', displayName: 'User B' },
    c: { seed: 'c'.repeat(64), profileId: 'testc', displayName: 'User C' },
} as const satisfies Record<string, { seed: string; profileId: string; displayName: string }>;

export const getLearnCardForUserOnBrainA = async (userKey: keyof typeof USERS) => {
    const user = USERS[userKey];

    const learnCard = await getBrainALearnCard(user.seed);

    try {
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
        const msg = (error as Error)?.message ?? String(error);
        if (!/already exists/i.test(msg)) throw error;
    }

    return learnCard;
};

export const getLearnCardForUserOnBrainB = async (userKey: keyof typeof USERS) => {
    const user = USERS[userKey];

    const learnCard = await getBrainBLearnCard(user.seed);

    try {
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
        const msg = (error as Error)?.message ?? String(error);
        if (!/already exists/i.test(msg)) throw error;
    }

    return learnCard;
};
