import {
    UnsignedVCValidator,
    VC,
    VCValidator,
    UnsignedVPValidator,
    VPValidator,
} from '@learncard/types';

import { initLCALearnCard, LCALearnCard } from '../';

let learnCards: Record<
    string,
    {
        learnCard: LCALearnCard;
    }
> = {};

const getLearnCard = async (seed = 'a'.repeat(64)) => {
    if (!learnCards[seed]) {

        const learnCard = await initLCALearnCard({ seed });
        learnCards[seed] = { learnCard: learnCard };
    }

    return {
        ...learnCards[seed].learnCard,
    };
};

// Skipping until LCA is up.
describe.skip('LCA Plugin', () => {
    describe('LCALearnCard', () => {
        it('should work', async () => {
            await expect(getLearnCard()).resolves.toBeDefined();
        });
    });
});

