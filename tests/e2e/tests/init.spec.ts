import { initLearnCard } from '@learncard/init';
import { describe, test, expect } from 'vitest';

describe('Init', () => {
    // TODO: This test is kind of just a demo for a hacky way of making sure your did is correct.
    // In the future, we should make this more robust, likely by adding in signals that can be awaited!
    test('LCN plugin should not have your did right away, but you should be able to know that it does by awaiting getProfile', async () => {
        const learnCard = await initLearnCard({
            seed: 'a',
            network: 'http://localhost:4000/trpc',
            cloud: { url: 'http://localhost:4100/trpc' },
        });

        const didKey = learnCard.id.did('key');

        expect(didKey.includes('web')).toBeFalsy();

        try {
            await learnCard.invoke.createProfile({
                profileId: 'test',
                displayName: 'Test',
                bio: '',
                shortBio: '',
            });
        } catch (error) {
            // Profile might already exist, nothing to see here
        }

        const didWeb = learnCard.id.did();

        expect(didWeb.includes('web')).toBeTruthy();
        expect(didWeb).not.toEqual(didKey);

        const learnCard2 = await initLearnCard({
            seed: 'a',
            network: 'http://localhost:4000/trpc',
            cloud: { url: 'http://localhost:4100/trpc' },
        });

        expect(learnCard2.id.did()).toEqual(didKey);

        const learnCard3 = await initLearnCard({
            seed: 'a',
            network: 'http://localhost:4000/trpc',
            cloud: { url: 'http://localhost:4100/trpc' },
        });
        await learnCard3.invoke.getProfile();

        expect(learnCard3.id.did()).toEqual(didWeb);
    });
});
