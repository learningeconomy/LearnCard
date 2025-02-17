import { readFile } from 'fs/promises';

import { initLearnCard } from '@learncard/init';

const didkit = readFile(
    require.resolve('@learncard/didkit-plugin/dist/didkit/didkit_wasm_bg.wasm')
);

export const getLearnCard = (seed = 'a'.repeat(64), managedDid?: string, debug = false) => {
    return initLearnCard({
        seed,
        didkit,
        network: 'http://localhost:4000/trpc',
        cloud: { url: 'http://localhost:4100/trpc' },
        ...(managedDid && { didWeb: managedDid }),
        ...(debug && { debug: console.log }),
    });
};

export const USERS = {
    a: { seed: 'a'.repeat(64), profileId: 'testa', displayName: 'User A' },
    b: { seed: 'b'.repeat(64), profileId: 'testb', displayName: 'User B' },
    c: { seed: 'c'.repeat(64), profileId: 'testc', displayName: 'User C' },
    d: { seed: 'd'.repeat(64), profileId: 'testd', displayName: 'User D' },
    e: { seed: 'e'.repeat(64), profileId: 'teste', displayName: 'User E' },
} as const satisfies Record<string, { seed: string; profileId: string; displayName: string }>;

export const getLearnCardForUser = async (userKey: keyof typeof USERS) => {
    const user = USERS[userKey];

    const learnCard = await getLearnCard(user.seed);

    try {
        await learnCard.invoke.createProfile({
            profileId: user.profileId,
            displayName: user.displayName,
            bio: '',
            shortBio: '',
        });
    } catch (error) {
        console.error(error);
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
