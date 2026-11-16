import { generateEncryptedFieldsArray, generateIndexQuery } from '../helpers';

const learnCard = {
    invoke: { hash: async (message: string) => `h(${message})` },
} as never;

describe('generateIndexQuery', () => {
    it('keeps equality-only queries byte-identical to the legacy filter', async () => {
        const query = { category: 'Achievement', title: 'Badge', plain: 'x' };
        const legacyFields = await generateEncryptedFieldsArray(learnCard, query, ['plain']);

        expect(await generateIndexQuery(learnCard, query, ['plain'])).toEqual({
            plain: 'x',
            fields: { $in: legacyFields },
        });
        expect(await generateIndexQuery(learnCard, {})).toEqual({});
    });

    it('turns $ne and $nin on encrypted fields into fields.$nin hashes', async () => {
        expect(
            await generateIndexQuery(learnCard, {
                category: 'Achievement',
                hidden: { $ne: true },
            })
        ).toEqual({
            fields: { $in: ['h(category:"Achievement")'], $nin: ['h(hidden:true)'] },
        });
        expect(
            await generateIndexQuery(learnCard, {
                hidden: { $ne: true },
                category: { $nin: ['Hidden', 'hidden'] },
            })
        ).toEqual({
            fields: {
                $nin: ['h(hidden:true)', 'h(category:"Hidden")', 'h(category:"hidden")'],
            },
        });
    });

    it('matches any of an $in set without widening the other equality fields', async () => {
        expect(
            await generateIndexQuery(learnCard, {
                category: { $in: ['AI Topic', 'ai sessions'] },
                hidden: { $ne: true },
            })
        ).toEqual({
            fields: { $nin: ['h(hidden:true)'] },
            $and: [{ fields: { $in: ['h(category:"AI Topic")', 'h(category:"ai sessions")'] } }],
        });
    });

    it('passes operators on unencrypted fields through unchanged', async () => {
        expect(
            await generateIndexQuery(learnCard, { status: { $ne: 'revoked' } }, ['status'])
        ).toEqual({ status: { $ne: 'revoked' } });
    });
});
