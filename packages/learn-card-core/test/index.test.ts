import { generateLearnCard } from '../src';

describe('@learncard/core', () => {
    describe('generateLearnCard', () => {
        it('should create an empty LearnCard', async () => {
            const learnCard = await generateLearnCard();

            expect(learnCard.invoke).toEqual({});
            expect(learnCard.plugins).toHaveLength(0);
            expect(learnCard.debug).toBeUndefined();
        });
    });
});
