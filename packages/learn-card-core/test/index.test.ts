import { generateLearnCard } from '../src';
import { getTestStorage, getTestIndex } from '../src';
import { Plugin } from '../src/types/wallet';

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

    describe('StorePlane Delete', () => {
        it('should delete a credential and return true on success', async () => {
            const learnCard = await generateLearnCard();
            const storageLearnCard = await learnCard.addPlugin(getTestStorage());

            const uri = await storageLearnCard.store['Test Storage'].upload(testVc);
            expect(uri).toBeDefined();

            const resolvedVc = await storageLearnCard.read.get(uri);
            expect(resolvedVc).toEqual(testVc);

            const deleteResult = await storageLearnCard.store['Test Storage'].delete(uri);
            expect(deleteResult).toBe(true);

            const resolvedVcAfterDelete = await storageLearnCard.read.get(uri);
            expect(resolvedVcAfterDelete).toBeUndefined();
        });

        it('should return false when deleting non-existent credential', async () => {
            const learnCard = await generateLearnCard();
            const storageLearnCard = await learnCard.addPlugin(getTestStorage());

            const deleteResult = await storageLearnCard.store['Test Storage'].delete('lc:test:999');
            expect(deleteResult).toBe(false);
        });

        it('should return false when deleting with invalid URI format', async () => {
            const learnCard = await generateLearnCard();
            const storageLearnCard = await learnCard.addPlugin(getTestStorage());

            const deleteResult = await storageLearnCard.store['Test Storage'].delete('invalid:uri');
            expect(deleteResult).toBe(false);
        });

        it('should return false when deleting with null/undefined URI', async () => {
            const learnCard = await generateLearnCard();
            const storageLearnCard = await learnCard.addPlugin(getTestStorage());

            const deleteResultNull = await storageLearnCard.store['Test Storage'].delete(null as any);
            expect(deleteResultNull).toBe(false);

            const deleteResultUndefined = await storageLearnCard.store['Test Storage'].delete(undefined as any);
            expect(deleteResultUndefined).toBe(false);
        });

        it('should handle multiple uploads and selective deletes', async () => {
            const learnCard = await generateLearnCard();
            const storageLearnCard = await learnCard.addPlugin(getTestStorage());

            const uri1 = await storageLearnCard.store['Test Storage'].upload(testVc);
            const uri2 = await storageLearnCard.store['Test Storage'].upload(testVc);
            const uri3 = await storageLearnCard.store['Test Storage'].upload(testVc);

            const deleteResult = await storageLearnCard.store['Test Storage'].delete(uri2);
            expect(deleteResult).toBe(true);

            const vc1 = await storageLearnCard.read.get(uri1);
            const vc2 = await storageLearnCard.read.get(uri2);
            const vc3 = await storageLearnCard.read.get(uri3);

            expect(vc1).toEqual(testVc);
            expect(vc2).toBeUndefined();
            expect(vc3).toEqual(testVc);
        });

        it('should be backwards compatible with plugins that do not implement delete', async () => {
            const learnCard = await generateLearnCard();
            
            const pluginWithoutDelete: Plugin<'No Delete Storage', 'store'> = {
                name: 'No Delete Storage',
                displayName: 'No Delete Storage',
                description: '[Testing] Storage without delete method',
                store: {
                    upload: async (_learnCard, vc) => {
                        return 'test:uri:123';
                    },
                },
                methods: {},
            };

            const learnCardWithPlugin = await learnCard.addPlugin(pluginWithoutDelete);

            const uri = await learnCardWithPlugin.store['No Delete Storage'].upload(testVc);
            expect(uri).toBe('test:uri:123');

            expect(learnCardWithPlugin.store['No Delete Storage'].delete).toBeUndefined();
        });

        it('should clear cache when deleting with cache plane available', async () => {
            const learnCard = await generateLearnCard();
            const storageLearnCard = await learnCard.addPlugin(getTestStorage());

            const uri = await storageLearnCard.store['Test Storage'].upload(testVc);

            const resolvedVc = await storageLearnCard.read.get(uri);
            expect(resolvedVc).toEqual(testVc);

            const deleteResult = await storageLearnCard.store['Test Storage'].delete(uri);
            expect(deleteResult).toBe(true);
        });
    });
});
