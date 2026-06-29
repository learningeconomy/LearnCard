import { assertSafeMongoQuery } from '@helpers/query.helpers';

describe('assertSafeMongoQuery', () => {
    describe('rejects server-side-JavaScript operators', () => {
        it.each([
            ['top-level $where', { $where: '1' }],
            ['top-level $function', { $function: { body: '', args: [], lang: 'js' } }],
            ['top-level $accumulator', { $accumulator: {} }],
            ['nested inside $and/$expr', { $and: [{ a: 1 }, { $expr: { $function: {} } }] }],
            ['deeply nested $accumulator', { nested: { deep: { $accumulator: {} } } }],
            ['inside an array element', { arr: [{ ok: 1 }, { $where: '2' }] }],
        ])('throws BAD_REQUEST for %s', (_label, query) => {
            expect(() => assertSafeMongoQuery(query)).toThrow(/not allowed/);
        });

        it('reports the offending operator in the message', () => {
            expect(() => assertSafeMongoQuery({ $where: '1' })).toThrow(/\$where/);
        });
    });

    describe('allows safe queries', () => {
        it.each([
            ['a plain field', { name: 'x' }],
            ['an empty object', {}],
            ['safe comparison operators', { $and: [{ a: { $gt: 1 } }] }],
            ['nested plain objects and arrays', { a: { b: [{ c: 1 }] } }],
            ['null and primitive values', { a: null, b: 1, c: 'str', d: true }],
        ])('does not throw for %s', (_label, query) => {
            expect(() => assertSafeMongoQuery(query)).not.toThrow();
        });

        it('handles a top-level array', () => {
            expect(() => assertSafeMongoQuery([{ a: 1 }, { b: 2 }])).not.toThrow();
        });
    });

    describe('depth limit (stack-overflow DoS guard)', () => {
        const buildDeep = (levels: number): Record<string, unknown> => {
            let node: Record<string, unknown> = { value: 1 };
            for (let i = 0; i < levels; i += 1) node = { a: node };
            return node;
        };

        it('rejects a pathologically deep object with BAD_REQUEST', () => {
            expect(() => assertSafeMongoQuery(buildDeep(5_000))).toThrow(/nested too deeply/);
        });

        it('allows objects within the depth limit', () => {
            expect(() => assertSafeMongoQuery(buildDeep(10))).not.toThrow();
        });
    });
});
