import { initLearnCard } from '@learncard/init';

export const getLearnCard = (seed = 'a'.repeat(64)) => {
    return initLearnCard({
        seed,
        network: 'http://localhost:4000/trpc',
        cloud: { url: 'http://localhost:4100/trpc' },
    });
};

export const USERS = {
    a: { seed: 'a'.repeat(64), profileId: 'usera', displayName: 'User A' },
    b: { seed: 'b'.repeat(64), profileId: 'userb', displayName: 'User B' },
    c: { seed: 'c'.repeat(64), profileId: 'userc', displayName: 'User C' },
    d: { seed: 'd'.repeat(64), profileId: 'userd', displayName: 'User D' },
    e: { seed: 'e'.repeat(64), profileId: 'usere', displayName: 'User E' },
} as const satisfies Record<string, { seed: string; profileId: string; displayName: string }>;

export const getLearnCardForUser = async (userKey: keyof typeof USERS) => {
    const user = USERS[userKey];

    const learnCard = await getLearnCard(user.seed);

    await learnCard.invoke.createProfile({
        profileId: user.profileId,
        displayName: user.displayName,
        bio: '',
        shortBio: '',
    });

    return learnCard;
};
