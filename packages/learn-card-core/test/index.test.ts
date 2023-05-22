import { generateLearnCard } from '../src';
import { getTestStorage, getTestIndex } from '../src';

import { testVc } from './fixtures/vc';

describe('@learncard/core', () => {
    describe('generateLearnCard', () => {
        it('should create an empty LearnCard', async () => {
            const learnCard = await generateLearnCard();

            expect(learnCard.invoke).toEqual({});
            expect(learnCard.plugins).toHaveLength(0);
            expect(learnCard.debug).toBeUndefined();
        });
    });

    describe('Control Planes', () => {
        it('should be able to store/read with multiple planes', async () => {
            const learnCard = await generateLearnCard();

            const multiPlaneLearnCard = await learnCard.addPlugin(getTestStorage());

            const uri = await multiPlaneLearnCard.store['Test Storage'].upload(testVc);

            const resolvedVc = await multiPlaneLearnCard.read.get(uri);

            expect(resolvedVc).toEqual(testVc);
        });

        it('should dedupe records with same id in different index providers', async () => {
            const _learnCard = await generateLearnCard();

            const storageLearnCard = await _learnCard.addPlugin(getTestStorage());

            const learnCard = await storageLearnCard.addPlugin(getTestIndex());

            const uri = await learnCard.store['Test Storage'].upload(testVc);

            await learnCard.index['Test Storage'].add({ id: 'test', uri });
            await learnCard.index['Test Index'].add({ id: 'test', uri });

            const dedupedRecords = await learnCard.index.all.get();

            expect(dedupedRecords).toHaveLength(1);
        });
    });
});
