import {
    UnsignedVCValidator,
    VC,
    VCValidator,
    UnsignedVPValidator,
    VPValidator,
} from '@learncard/types';

import { initNetworkLearnCard, NetworkLearnCard } from '../';
import { SAMPLE_VCS } from './mocks/sample-vcs';

let learnCards: Record<
    string,
    {
        learnCard: NetworkLearnCard;
    }
> = {};

const getLearnCard = async (seed = 'a'.repeat(64)) => {
    if (!learnCards[seed]) {

        const learnCard = await initNetworkLearnCard({ seed });
        learnCards[seed] = { learnCard: learnCard };
    }

    return {
        ...learnCards[seed].learnCard,
    };
};

describe('LearnCard Network Plugin', () => {
    describe('NetworkLearnCard', () => {
        it('should work', async () => {
            await expect(getLearnCard()).resolves.toBeDefined();
        });
    });

    describe('VerifyBoost Plugin', () => {
        it('should be added to the Network LearnCard', async () => {
            const networkLC = await getLearnCard();
            expect(networkLC.plugins.find(p => p.name === 'VerifyBoost')).toBeDefined();
        });

        // This test can't pass till we can sign an authentic boost with LearnCard Network.
        it.skip('should verify an Authentic Boost as valid', async () => {
            const networkLC = await getLearnCard();
            expect((await networkLC.invoke.verifyCredential(SAMPLE_VCS.VALID_BOOST)).errors).toEqual([])
            expect((await networkLC.invoke.verifyCredential(SAMPLE_VCS.VALID_BOOST)).warnings).toEqual([])
        });

        it('should warn that Boost was validated outside of registry', async () => {
            const networkLC = await getLearnCard();
            expect((await networkLC.invoke.verifyCredential(SAMPLE_VCS.VALID_BOOST_OUTSIDE_REGISTRY)).warnings.length).toBeGreaterThan(0);
        });

        it('should fail validation if a Boost Certificate was tampered with', async () => {
            const networkLC = await getLearnCard();
            expect((await networkLC.invoke.verifyCredential(SAMPLE_VCS.TAMPERED_BOOST_CERTIFICATE)).errors.length).toBeGreaterThan(0);
        });

        it('should fail validation if a Boost Credential was tampered with', async () => {
            const networkLC = await getLearnCard();
            expect((await networkLC.invoke.verifyCredential(SAMPLE_VCS.TAMPERED_BOOST_CREDENTIAL)).errors.length).toBeGreaterThan(0);
        });

        it('should fail validation if a Boost Credential has a mismatched ID from its Boost Certificate', async () => {
            const networkLC = await getLearnCard();
            expect((await networkLC.invoke.verifyCredential(SAMPLE_VCS.MISMATCHED_BOOST_ID_CREDENTIAL)).errors.length).toBeGreaterThan(0);
        });
    })
});

