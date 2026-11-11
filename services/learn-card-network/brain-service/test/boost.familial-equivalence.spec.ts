import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import { BindParam, QueryBuilder } from 'neogma';

import { neogma } from '@instance';
import { Boost, BoostInstance, Profile } from '@models';
import { countFamilialBoosts, getFamilialBoosts } from '@accesslayer/boost/read';
import {
    buildWhereForQueryBuilder,
    convertObjectRegExpToNeo4j,
    convertQueryResultToPropertiesObjectArray,
} from '@helpers/neo4j.helpers';
import { inflateObject } from '@helpers/objects.helpers';
import { BoostQuery } from '@learncard/types';

/**
 * Old-vs-new comparison for familial boosts.
 *
 * `reference*` below is the familial query as it was before it was rewritten to expand outward
 * from the start boost (one MATCH over every Boost, filtered by OR-ed path predicates). Every case
 * runs both forms against the same small graphs and expects the same answer.
 *
 * Ordering among boosts with the same CREATED_BY date is unspecified in both forms, so result sets
 * are compared as sorted multisets, and cursor pages compare the dates on each page (always
 * deterministic) plus the ids where no dates tie.
 */

type WhereQuery = Parameters<typeof buildWhereForQueryBuilder>[1];

type Generations = {
    parentGenerations: number;
    childGenerations: number;
    includeExtendedFamily: boolean;
};

const familyPredicate = ({
    parentGenerations,
    childGenerations,
    includeExtendedFamily,
}: Generations): string => {
    const p = Number.isFinite(parentGenerations) ? parentGenerations : '';
    const c = Number.isFinite(childGenerations) ? childGenerations : '';

    return `
((start)<-[:PARENT_OF*1..${p}]-(boost) OR 
(start)-[:PARENT_OF*1..${c}]->(boost) OR 
(start)<-[:PARENT_OF${includeExtendedFamily ? `*1..${p}` : ''}]-(:Boost)-[:PARENT_OF${
        includeExtendedFamily ? `*1..${c}` : ''
    }]->(boost) AND boost <> start)`;
};

const referenceGetFamilialBoosts = async (
    id: string,
    generations: Generations,
    { limit, cursor, query = {} }: { limit: number; cursor?: string; query?: BoostQuery }
) => {
    const { whereClause, params } = buildWhereForQueryBuilder(
        'boost',
        convertObjectRegExpToNeo4j(query) as WhereQuery
    );

    const _query = new QueryBuilder(new BindParam({ cursor, ...params }))
        .match({ model: Boost, where: { id }, identifier: 'start' })
        .match({ model: Boost, identifier: 'boost' })
        .where(`${familyPredicate(generations)}\nAND ${whereClause}`)
        .raw('MATCH (boost)-[createdBy:CREATED_BY]-()');

    const results = convertQueryResultToPropertiesObjectArray<{
        boost: Record<string, unknown>;
        createdBy: { date: string };
    }>(
        await (cursor ? _query.where('createdBy.date < $cursor') : _query)
            .return('DISTINCT boost, createdBy')
            .orderBy('createdBy.date DESC')
            .limit(limit)
            .run()
    );

    return results.map(result => ({
        ...(inflateObject(result.boost) as Record<string, unknown>),
        id: String(result.boost.id),
        created: result.createdBy.date,
    }));
};

const referenceCountFamilialBoosts = async (
    id: string,
    generations: Generations,
    query: BoostQuery = {}
): Promise<number> => {
    const { whereClause, params } = buildWhereForQueryBuilder(
        'boost',
        convertObjectRegExpToNeo4j(query) as WhereQuery
    );

    const result = await new QueryBuilder(new BindParam({ ...params }))
        .match({ model: Boost, where: { id }, identifier: 'start' })
        .match({ model: Boost, identifier: 'boost' })
        .where(`${familyPredicate(generations)}\nAND ${whereClause}`)
        .return('COUNT(DISTINCT boost) AS count')
        .run();

    return Number(result.records[0]?.get('count') ?? 0);
};

const asBoost = (id: string) => ({ id }) as unknown as BoostInstance;

const projection = (rows: Array<{ id: string; created: string }>) =>
    rows.map(row => `${row.created}|${row.id}`).sort();

/**
 * Graph shapes (every PARENT_OF points parent -> child). `date` is the CREATED_BY date; `null`
 * leaves the boost without one, and an array gives it several. `labels` overrides `:Boost` so a
 * non-Boost node can sit on a PARENT_OF path.
 */
type FixtureNode = {
    id: string;
    category?: string;
    status?: string;
    date?: string | string[] | null;
    labels?: string;
};

const nodes: FixtureNode[] = [];
const edges: Array<[string, string]> = [];

const day = (n: number) => `2025-01-${String((n % 28) + 1).padStart(2, '0')}T00:00:00.000Z`;
let dateCounter = 0;
const uniqueDate = () => {
    dateCounter += 1;
    return `2025-03-01T00:00:${String(Math.floor(dateCounter / 60)).padStart(2, '0')}.${String(
        dateCounter % 60
    ).padStart(3, '0')}Z`;
};

const node = (id: string, extra: Omit<FixtureNode, 'id'> = {}) => {
    nodes.push({ category: 'A', status: 'LIVE', date: uniqueDate(), ...extra, id });
    return id;
};
const edge = (parent: string, child: string) => edges.push([parent, child]);

// Tree: root -> 3 children -> 3 grandchildren each -> 2 great-grandchildren each
const tree = node('tree-root', { category: 'Root' });
['a', 'b', 'c'].forEach((x, i) => {
    const child = node(`tree-${x}`, { category: i === 0 ? 'Few' : 'B' });
    edge(tree, child);
    [1, 2, 3].forEach(y => {
        const grandchild = node(`tree-${x}${y}`, {
            category: y === 1 ? 'A' : 'B',
            status: y === 3 ? 'DRAFT' : 'LIVE',
        });
        edge(child, grandchild);
        [1, 2].forEach(z => edge(grandchild, node(`tree-${x}${y}${z}`, { category: 'C' })));
    });
});

// Cycles and a self-loop
['cyc-a', 'cyc-b', 'cyc-c'].forEach(id => node(id, { category: 'Few' }));
edge('cyc-a', 'cyc-b');
edge('cyc-b', 'cyc-c');
edge('cyc-c', 'cyc-a');
node('cyc-d', { category: 'B' });
edge('cyc-a', 'cyc-d');
edge('cyc-d', 'cyc-d');
node('cyc-e');
edge('cyc-d', 'cyc-e');

// Several paths to one node, and a parallel edge
['mp-r', 'mp-x', 'mp-y', 'mp-z', 'mp-w', 'mp-v'].forEach(id => node(id, { category: 'B' }));
edge('mp-r', 'mp-x');
edge('mp-r', 'mp-x');
edge('mp-r', 'mp-y');
edge('mp-x', 'mp-z');
edge('mp-y', 'mp-z');
edge('mp-z', 'mp-w');
edge('mp-y', 'mp-v');

// Non-Boost nodes on PARENT_OF paths. nb-s's parent is a non-Boost node, so set-based cousin
// shortcuts must not apply there.
node('nb-x', { category: 'Few' });
node('nb-w', { labels: 'Thing' });
node('nb-s');
node('nb-z', { category: 'Few' });
node('nb-y');
node('nb-q', { category: 'Few' });
edge('nb-x', 'nb-w');
edge('nb-w', 'nb-s');
edge('nb-w', 'nb-z');
edge('nb-x', 'nb-y');
edge('nb-s', 'nb-q');
node('nb-m', { labels: 'Thing' });
node('nb-t', { category: 'Few' });
edge('tree-a', 'nb-m');
edge('nb-m', 'nb-t');

// Missing and duplicate CREATED_BY relationships
node('cb-root', { category: 'B' });
node('cb-none', { date: null });
node('cb-two', { date: [day(3), day(4)] });
node('cb-same', { date: [day(5), day(5)] });
node('cb-leaf', { category: 'Few' });
edge('cb-root', 'cb-none');
edge('cb-root', 'cb-two');
edge('cb-root', 'cb-same');
edge('cb-two', 'cb-leaf');

// Equal dates between siblings
node('tie-root', { category: 'B' });
[1, 2, 3, 4, 5].forEach(n => edge('tie-root', node(`tie-${n}`, { date: day(9) })));

// Isolated boost
node('iso', { category: 'Few' });

// Wide parent: more indexed candidates than the per-candidate path takes ("Many"), plus a few
// ("Few" and "Rare") that also exist outside the family
node('wide', { category: 'B' });
for (let n = 0; n < 30; n += 1) edge('wide', node(`wide-${n}`, { category: 'Many' }));
['wide-f1', 'wide-f2', 'wide-f3'].forEach(id => edge('wide', node(id, { category: 'Rare' })));
node('rare-outside', { category: 'Rare' });

// Deep chain with a side child on every level
for (let n = 0; n <= 20; n += 1) node(`deep-${n}`, { category: n % 5 === 0 ? 'Few' : 'Deep' });
for (let n = 0; n < 20; n += 1) edge(`deep-${n + 1}`, `deep-${n}`);
for (let n = 1; n <= 20; n += 1) edge(`deep-${n}`, node(`deep-side-${n}`, { category: 'Side' }));

const starts = [
    'tree-root',
    'tree-a',
    'tree-b2',
    'tree-c31',
    'cyc-a',
    'cyc-d',
    'mp-z',
    'mp-x',
    'nb-s',
    'nb-t',
    'cb-two',
    'tie-3',
    'iso',
    'wide-4',
    'deep-0',
    'deep-10',
    'missing-boost',
];

const generationSets: Generations[] = [
    { parentGenerations: 1, childGenerations: 1, includeExtendedFamily: false },
    { parentGenerations: 2, childGenerations: 1, includeExtendedFamily: false },
    { parentGenerations: 1, childGenerations: 3, includeExtendedFamily: false },
    { parentGenerations: Infinity, childGenerations: 1, includeExtendedFamily: false },
    { parentGenerations: 1, childGenerations: Infinity, includeExtendedFamily: false },
    { parentGenerations: 1, childGenerations: 1, includeExtendedFamily: true },
    { parentGenerations: 2, childGenerations: 2, includeExtendedFamily: true },
    { parentGenerations: Infinity, childGenerations: Infinity, includeExtendedFamily: true },
];

const filters: Array<[string, BoostQuery]> = [
    ['no filter', {}],
    ['category, few matches', { category: 'Few' }],
    ['category, more than 16 matches', { category: 'Many' }],
    ['category, absent', { category: 'Absent' }],
    ['category $in', { category: { $in: ['Rare', 'Few', 'Side'] } }],
    ['id', { id: 'tree-a1' }],
    ['category and status', { category: 'B', status: 'DRAFT' }],
    ['status only', { status: 'DRAFT' }],
    ['document-level $or', { $or: [{ category: 'Few' }, { category: 'Side' }] } as BoostQuery],
];

const genLabel = (g: Generations) =>
    `p${g.parentGenerations} c${g.childGenerations}${g.includeExtendedFamily ? ' extended' : ''}`;

const cases = starts.flatMap(start =>
    generationSets.flatMap(generations =>
        filters.map(([filterName, query]) => ({ start, generations, filterName, query }))
    )
);

describe('Familial boosts match the previous query', () => {
    beforeAll(async () => {
        await Boost.delete({ detach: true, where: {} });
        await Profile.delete({ detach: true, where: {} });
        await neogma.queryRunner.run('MATCH (n:Thing) DETACH DELETE n', {});

        await neogma.queryRunner.run(
            `CREATE (:Profile {profileId: 'familial-creator', did: 'did:test:familial-creator'})`,
            {}
        );

        for (const n of nodes) {
            await neogma.queryRunner.run(
                `MATCH (creator:Profile {profileId: 'familial-creator'})
                 CREATE (b:${n.labels ?? 'Boost'} {id: $id, name: $id, category: $category, status: $status, type: 'test', boost: '{}'})
                 WITH b, creator
                 UNWIND $dates AS date
                 CREATE (b)-[:CREATED_BY {date: date}]->(creator)`,
                {
                    id: n.id,
                    category: n.category,
                    status: n.status,
                    dates: n.date === null ? [] : Array.isArray(n.date) ? n.date : [n.date],
                }
            );
        }

        for (const [parent, child] of edges) {
            await neogma.queryRunner.run(
                `MATCH (p {id: $parent}) MATCH (c {id: $child}) CREATE (p)-[:PARENT_OF]->(c)`,
                { parent, child }
            );
        }
    });

    afterAll(async () => {
        await Boost.delete({ detach: true, where: {} });
        await Profile.delete({ detach: true, where: {} });
        await neogma.queryRunner.run('MATCH (n:Thing) DETACH DELETE n', {});
    });

    it('covers every start, generation setting and filter', () => {
        expect(cases.length).toBe(starts.length * generationSets.length * filters.length);
        expect(cases.length).toBe(1224);
    });

    // Split per start so each case stays well under Vitest's 30 s timeout
    describe.each(starts)('from %s', start => {
        const startCases = cases.filter(c => c.start === start);

        it(`counts match on ${startCases.length} cases`, async () => {
            const diffs: string[] = [];

            for (const { start, generations, filterName, query } of startCases) {
                const expected = await referenceCountFamilialBoosts(start, generations, query);
                const actual = await countFamilialBoosts(asBoost(start), { ...generations, query });

                if (actual !== expected) {
                    diffs.push(
                        `${start} ${genLabel(generations)} ${filterName}: ${actual} != ${expected}`
                    );
                }
            }

            expect(diffs).toEqual([]);
        });

        it(`full result sets match on ${startCases.length} cases`, async () => {
            const diffs: string[] = [];

            for (const { start, generations, filterName, query } of startCases) {
                const expected = await referenceGetFamilialBoosts(start, generations, {
                    limit: 1000,
                    query,
                });
                const actual = await getFamilialBoosts(asBoost(start), {
                    ...generations,
                    limit: 1000,
                    query,
                });

                const dates = actual.map(row => row.created);
                const sortedDesc = [...dates].sort().reverse();

                if (JSON.stringify(projection(actual)) !== JSON.stringify(projection(expected))) {
                    diffs.push(`${start} ${genLabel(generations)} ${filterName}: rows differ`);
                } else if (JSON.stringify(dates) !== JSON.stringify(sortedDesc)) {
                    diffs.push(`${start} ${genLabel(generations)} ${filterName}: not date-ordered`);
                }
            }

            expect(diffs).toEqual([]);
        });

        it(`cursor pages of 2 match on ${startCases.length} cases`, async () => {
            const diffs: string[] = [];
            let pages = 0;

            for (const { start, generations, filterName, query } of startCases) {
                const all = await referenceGetFamilialBoosts(start, generations, {
                    limit: 1000,
                    query,
                });
                const dateCounts = new Map<string, number>();
                all.forEach(row =>
                    dateCounts.set(row.created, (dateCounts.get(row.created) ?? 0) + 1)
                );

                let cursor: string | undefined;

                for (let page = 0; page < 8; page += 1) {
                    const expected = await referenceGetFamilialBoosts(start, generations, {
                        limit: 2,
                        cursor,
                        query,
                    });
                    const actual = await getFamilialBoosts(asBoost(start), {
                        ...generations,
                        limit: 2,
                        cursor,
                        query,
                    });
                    pages += 1;

                    const label = `${start} ${genLabel(generations)} ${filterName} page ${page}`;
                    const expectedDates = expected.map(row => row.created);

                    if (
                        JSON.stringify(actual.map(row => row.created)) !==
                        JSON.stringify(expectedDates)
                    ) {
                        diffs.push(`${label}: dates differ`);
                        break;
                    }

                    // Ids are only deterministic when no other row shares the date
                    const uniqueIds = (rows: typeof expected) =>
                        rows.filter(row => dateCounts.get(row.created) === 1).map(row => row.id);

                    if (JSON.stringify(uniqueIds(actual)) !== JSON.stringify(uniqueIds(expected))) {
                        diffs.push(`${label}: ids differ`);
                        break;
                    }

                    if (expected.length < 2) break;

                    cursor = expected[expected.length - 1]!.created;
                }
            }

            // A missing or isolated start still fetches one (empty or short) page per case
            expect(pages).toBeGreaterThanOrEqual(startCases.length);
            expect(diffs).toEqual([]);
        });
    });

    it.each([
        ['tree-a', { parentGenerations: 1, childGenerations: 2, includeExtendedFamily: false }, {}],
        [
            'deep-10',
            { parentGenerations: Infinity, childGenerations: 1, includeExtendedFamily: true },
            {},
        ],
        [
            'wide-4',
            { parentGenerations: 1, childGenerations: 1, includeExtendedFamily: false },
            { category: 'Rare' },
        ],
        ['mp-z', { parentGenerations: 2, childGenerations: 2, includeExtendedFamily: true }, {}],
        [
            'tree-a2',
            { parentGenerations: 2, childGenerations: 2, includeExtendedFamily: true },
            { category: 'Few' },
        ],
    ] as Array<[string, Generations, BoostQuery]>)(
        'returns the same boosts, in order, for %s',
        async (start, generations, query) => {
            const expected = await referenceGetFamilialBoosts(start, generations, {
                limit: 1000,
                query,
            });
            const actual = await getFamilialBoosts(asBoost(start), {
                ...generations,
                limit: 1000,
                query,
            });

            // These families have no tied dates, so the order is fully determined
            expect(new Set(expected.map(row => row.created)).size).toBe(expected.length);
            expect(expected.length).toBeGreaterThan(1);
            expect(actual).toEqual(expected);

            const expectedPage = await referenceGetFamilialBoosts(start, generations, {
                limit: 2,
                query,
            });
            const actualPage = await getFamilialBoosts(asBoost(start), {
                ...generations,
                limit: 2,
                query,
            });

            expect(actualPage).toEqual(expectedPage);
        }
    );
});
