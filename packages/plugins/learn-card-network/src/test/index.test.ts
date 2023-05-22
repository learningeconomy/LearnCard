import { generateLearnCard, LearnCard } from '@learncard/core';
import { getDidKitPlugin, DIDKitPlugin, DidMethod } from '@learncard/didkit-plugin';
import { getDidKeyPlugin, DidKeyPlugin } from '@learncard/didkey-plugin';
import { getCeramicPlugin, CeramicPlugin } from '@learncard/ceramic-plugin';
import { getVCPlugin, VCPlugin } from '@learncard/vc-plugin';

import { getLearnCardNetworkPlugin, LearnCardNetworkPlugin } from '../';
import { SAMPLE_VCS } from './mocks/sample-vcs';

let learnCards: Record<
    string,
    {
        learnCard: LearnCard<
            [DIDKitPlugin, DidKeyPlugin<DidMethod>, CeramicPlugin, VCPlugin, LearnCardNetworkPlugin]
        >;
    }
> = {};

const getLearnCard = async (seed = 'a'.repeat(64)) => {
    if (!learnCards[seed]) {
        const didkitCard = await (await generateLearnCard()).addPlugin(await getDidKitPlugin());
        const didkeyCard = await didkitCard.addPlugin(
            await getDidKeyPlugin(didkitCard, seed, 'key' as DidMethod)
        );
        const ceramicCard = await didkeyCard.addPlugin(
            await getCeramicPlugin(didkeyCard, {} as any)
        );
        const vcCard = await ceramicCard.addPlugin(getVCPlugin(ceramicCard));
        const learnCard = await vcCard.addPlugin(
            await getLearnCardNetworkPlugin(vcCard, 'https://network.learncard.com/trpc')
        );

        learnCards[seed] = { learnCard };
    }

    return {
        ...learnCards[seed].learnCard,
    };
};

// Skipping until LCN has the updated function and vc-templates can be updated with resolveable VCs.
describe.skip('LearnCard Network Plugin', () => {
    describe('NetworkLearnCard', () => {
        it('should work', async () => {
            await expect(getLearnCard()).resolves.toBeDefined();
        });
    });

    describe('VerifyBoost Plugin', () => {
        // This test can't pass till we can sign an authentic boost with LearnCard Network.
        it.skip('should verify an Authentic Boost as valid', async () => {
            const networkLC = await getLearnCard();
            expect(
                (await networkLC.invoke.verifyCredential(SAMPLE_VCS.VALID_BOOST)).errors
            ).toEqual([]);
            expect(
                (await networkLC.invoke.verifyCredential(SAMPLE_VCS.VALID_BOOST)).warnings
            ).toEqual([]);
        });

        it('should warn that Boost was validated outside of registry', async () => {
            const networkLC = await getLearnCard();
            expect(
                (await networkLC.invoke.verifyCredential(SAMPLE_VCS.VALID_BOOST_OUTSIDE_REGISTRY))
                    .warnings.length
            ).toBeGreaterThan(0);
        });

        it('should fail validation if a Boost Certificate was tampered with', async () => {
            const networkLC = await getLearnCard();
            expect(
                (await networkLC.invoke.verifyCredential(SAMPLE_VCS.TAMPERED_BOOST_CERTIFICATE))
                    .errors.length
            ).toBeGreaterThan(0);
        });

        it('should fail validation if a Boost Credential was tampered with', async () => {
            const networkLC = await getLearnCard();
            expect(
                (await networkLC.invoke.verifyCredential(SAMPLE_VCS.TAMPERED_BOOST_CREDENTIAL))
                    .errors.length
            ).toBeGreaterThan(0);
        });

        it('should fail validation if a Boost Credential has a mismatched ID from its Boost Certificate', async () => {
            const networkLC = await getLearnCard();
            expect(
                (await networkLC.invoke.verifyCredential(SAMPLE_VCS.MISMATCHED_BOOST_ID_CREDENTIAL))
                    .errors.length
            ).toBeGreaterThan(0);
        });
    });
});
