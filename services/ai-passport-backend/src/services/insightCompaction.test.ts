import { createHash } from 'node:crypto';
import { expect, test } from 'bun:test';
import type { ModelSafeCredentialProjection } from '@learncard/types';
import { compileProjectedSchema } from '../ai/bedrock-schema';
import {
    buildFullEvidenceInsightPrompt,
    prepareInsightEvidence,
    InsightCompactionError,
    INSIGHT_COMPACTION_VERSION,
    INSIGHT_COHORT_INPUT_BUDGET,
    INSIGHT_FINAL_INPUT_BUDGET,
    INSIGHT_COHORT_SUMMARY_MAX_CHARS,
    InsightCohortSummaryValidator,
    type InsightCompactionInput,
} from './insightCompaction';
const projection = (index: number, facts = 12): ModelSafeCredentialProjection => ({
    schemaVersion: '1',
    category: 'Synthetic learning',
    credentialTypes: ['CourseCredential'],
    facts: Array.from({ length: facts }, (_, fact) => ({
        kind: 'skill',
        value: `Source ${index} item ${fact} ${'synthetic systems engineering '.repeat(7)}`,
    })),
});
const inputs = (count: number, facts = 12) =>
    Array.from({ length: count }, (_, index) => ({
        key: `source-${String(index).padStart(4, '0')}`,
        projection: projection(index, facts),
    }));
const measure = async (message: string) => JSON.stringify([message]).length;
const harness = () => {
    const cache = new Map<string, string>();
    const calls: { systemPrompt: string; message: string }[] = [];
    let scope = 'owner-a:revision-a:model-a:locale-en';
    let freshError: unknown;
    let duringCall: (input: {
        systemPrompt: string;
        message: string;
    }) => Promise<unknown> = async () => ({
        summary: 'Synthetic compacted verified evidence with uncertainty.',
    });
    let reads = 0;
    let writes = 0;
    const deps = {
        measure,
        hash: (value: unknown) =>
            createHash('sha256').update(JSON.stringify({ scope, value })).digest('hex'),
        assertFresh: async () => {
            if (freshError) throw freshError;
        },
        read: async (hash: string) => {
            reads += 1;
            return cache.get(hash);
        },
        write: async (hash: string, summary: string) => {
            writes += 1;
            cache.set(hash, summary);
        },
        summarize: async (input: { systemPrompt: string; message: string }) => {
            calls.push(input);
            return duringCall(input);
        },
    };
    return {
        deps,
        cache,
        calls,
        get reads() {
            return reads;
        },
        get writes() {
            return writes;
        },
        scope: (value: string) => {
            scope = value;
        },
        failFresh: (error: unknown) => {
            freshError = error;
        },
        respond: (fn: typeof duringCall) => {
            duringCall = fn;
        },
    };
};
const catalog = (message: string) =>
    JSON.parse(message.slice(message.indexOf('{"sourceGroups"'))).sourceGroups as number[][];

test('cohort guidance shares its character limit while the original validator enforces the hard bound', async () => {
    const h = harness();
    await buildFullEvidenceInsightPrompt(prepareInsightEvidence(inputs(40)), h.deps);
    expect(h.calls.length).toBeGreaterThan(0);
    for (const { systemPrompt } of h.calls) {
        expect(systemPrompt).not.toContain('1200');
        expect(systemPrompt).toContain(
            `hard maximum is ${INSIGHT_COHORT_SUMMARY_MAX_CHARS} characters`
        );
        expect(systemPrompt).toContain('including spaces and punctuation, not words or tokens');
        expect(systemPrompt).toContain('Every supplied fragment contributes');
        expect(systemPrompt).toContain('preserving evidence meaning and attribution');
    }
    const compiled = compileProjectedSchema(InsightCohortSummaryValidator);
    const summary = (compiled.properties as Record<string, Record<string, unknown>>).summary!;
    expect(summary.maxLength).toBeUndefined();
    expect(summary.description).toContain('5000 characters');
    expect(InsightCohortSummaryValidator.safeParse({ summary: 'x'.repeat(5000) }).success).toBe(
        true
    );
    expect(InsightCohortSummaryValidator.safeParse({ summary: 'x'.repeat(5001) }).success).toBe(
        false
    );
    expect(InsightCohortSummaryValidator.safeParse({ summary: '😀'.repeat(2501) }).success).toBe(
        false
    );
});

test('overlong cohort output fails without repair calls, truncation or invalid cache writes', async () => {
    const h = harness();
    h.respond(async () => ({ summary: 'x'.repeat(5001) }));
    await expect(
        buildFullEvidenceInsightPrompt(prepareInsightEvidence(inputs(40)), h.deps)
    ).rejects.toMatchObject({ reason: 'invalid_summary' });
    expect(h.writes).toBe(0);
    expect(h.calls.length).toBeLessThanOrEqual(3);
});

test('5000-character summaries preserve coverage through bounded hierarchy and warm cache', async () => {
    const h = harness();
    const summary = 'x'.repeat(5000);
    h.respond(async () => ({ summary }));
    const plan = prepareInsightEvidence(inputs(196, 12));
    const result = await buildFullEvidenceInsightPrompt(plan, h.deps);
    expect(result.stats.levels).toBeGreaterThan(1);
    expect(catalog(result.message)).toHaveLength(196);
    expect(await h.deps.measure(result.message)).toBeLessThanOrEqual(INSIGHT_FINAL_INPUT_BUDGET);
    expect(result.stats.summaryModelCalls).toBeLessThanOrEqual(128);
    for (const cached of h.cache.values()) expect(cached).toBe(summary);
    const calls = h.calls.length;
    const warm = await buildFullEvidenceInsightPrompt(plan, h.deps);
    expect(warm.message).toBe(result.message);
    expect(h.calls.length).toBe(calls);
});

test('privacy-transformed final size remains decisive with 5000-character summaries', async () => {
    const h = harness();
    h.respond(async () => ({ summary: 'x'.repeat(5000) }));
    h.deps.measure = async message =>
        message.startsWith('Analyze all')
            ? INSIGHT_FINAL_INPUT_BUDGET + 1
            : JSON.stringify([message]).length;
    await expect(
        buildFullEvidenceInsightPrompt(prepareInsightEvidence(inputs(40)), h.deps)
    ).rejects.toMatchObject({ reason: 'reduction_stalled' });
    expect(h.calls.length).toBeLessThanOrEqual(128);
});

test('serialized output budget independently rejects 5000 highly escaped characters', async () => {
    const h = harness();
    const summary = '\u0001'.repeat(5000);
    expect(InsightCohortSummaryValidator.safeParse({ summary }).success).toBe(true);
    h.respond(async () => ({ summary }));
    await expect(
        buildFullEvidenceInsightPrompt(prepareInsightEvidence(inputs(40)), h.deps)
    ).rejects.toMatchObject({ reason: 'invalid_summary' });
    expect(h.writes).toBe(0);
});

test('15 equivalent credentials retain multiplicity, exact normalized groups and provenance without source IDs', async () => {
    const source = projection(1, 2);
    const batch = Array.from({ length: 15 }, (_, index) => ({
        key: `private-source-${index}`,
        projection: {
            ...structuredClone(source),
            credentialTypes:
                index % 2
                    ? ['CourseCredential', 'BadgeCredential']
                    : ['BadgeCredential', 'CourseCredential'],
        },
    }));
    const before = structuredClone(batch);
    const plan = prepareInsightEvidence(batch);
    expect(plan.groups).toHaveLength(1);
    expect(plan.groups[0]!.count).toBe(15);
    const h = harness();
    const result = await buildFullEvidenceInsightPrompt(plan, h.deps);
    expect(result.stats).toMatchObject({
        strategy: 'direct',
        representedCredentialCount: 15,
        representativeCount: 1,
        duplicateCount: 14,
        summaryModelCalls: 0,
    });
    expect(catalog(result.message)).toEqual([[1, 1, 15]]);
    expect(result.message).not.toContain('private-source-');
    expect(result.message).toContain('not independent corroboration');
    expect(h.calls).toHaveLength(0);
    expect(batch).toEqual(before);
});
test('196 sources all contribute through bounded cohorts; warm summaries require zero new summary calls', async () => {
    const batch = inputs(196);
    const before = structuredClone(batch);
    const plan = prepareInsightEvidence(batch);
    const h = harness();
    const result = await buildFullEvidenceInsightPrompt(plan, h.deps);
    expect(result.stats.representedCredentialCount).toBe(196);
    expect(result.stats.strategy).toBe('cohort_compaction');
    expect(result.stats.summaryModelCalls).toBeGreaterThan(1);
    expect(result.stats.summaryModelCalls).toBeLessThan(128);
    expect(await measure(result.message)).toBeLessThanOrEqual(INSIGHT_FINAL_INPUT_BUDGET);
    const covered = new Set<number>();
    for (const call of h.calls) {
        expect(await measure(call.message)).toBeLessThanOrEqual(INSIGHT_COHORT_INPUT_BUDGET);
        JSON.parse(call.message).evidence.forEach((node: { groups: number[] }) =>
            node.groups.forEach(id => covered.add(id))
        );
    }
    expect(covered.size).toBe(196);
    expect(catalog(result.message)).toHaveLength(196);
    expect(catalog(result.message).reduce((total, item) => total + item[2]!, 0)).toBe(196);
    expect(batch).toEqual(before);
    const coldCalls = h.calls.length;
    const warm = await buildFullEvidenceInsightPrompt(plan, h.deps);
    expect(warm.message).toBe(result.message);
    expect(h.calls).toHaveLength(coldCalls);
    expect(warm.stats.summaryModelCalls).toBe(0);
    expect(warm.stats.summaryCacheHits).toBe(result.stats.cohortCount);
});
test('oversized individual projection preserves every whole fact/type/label across fragments', async () => {
    const huge: ModelSafeCredentialProjection = {
        schemaVersion: '1',
        category: 'Quoted evidence',
        credentialTypes: ['CourseCredential', 'AssessmentCredential'],
        facts: Array.from({ length: 100 }, (_, index) => ({
            kind: 'skill',
            value: `${index} ${'"\\'.repeat(115)}`,
            label: '"\\'.repeat(60),
        })),
    };
    const batch = Array.from({ length: 15 }, (_, index) => ({
        key: `source-${index}`,
        projection: structuredClone(huge),
    }));
    const h = harness();
    const result = await buildFullEvidenceInsightPrompt(prepareInsightEvidence(batch), h.deps);
    expect(result.stats.splitProjectionCount).toBe(1);
    expect(result.stats.representedCredentialCount).toBe(15);
    expect(result.stats.duplicateCount).toBe(14);
    const facts: { kind: string; value: string; label?: string }[] = [];
    const types: string[] = [];
    for (const call of h.calls)
        for (const node of JSON.parse(call.message).evidence) {
            const item = JSON.parse(node.content);
            if (item.field?.fact) facts.push(item.field.fact);
            if (item.field?.credentialType) types.push(item.field.credentialType);
        }
    expect(facts.sort((a, b) => a.value.localeCompare(b.value))).toEqual(
        [...huge.facts].sort((a, b) => a.value.localeCompare(b.value))
    );
    expect(types.sort()).toEqual([...huge.credentialTypes].sort());
    expect(catalog(result.message)).toEqual([[1, 1, 15]]);
});
for (const change of [
    'owner-b:revision-a:model-a:locale-en',
    'owner-a:revision-b:model-a:locale-en',
    'owner-a:revision-a:model-b:locale-en',
    'owner-a:revision-a:model-a:locale-fr',
]) {
    test(`summary cache invalidates relevant scope ${change}`, async () => {
        const plan = prepareInsightEvidence(inputs(40));
        const h = harness();
        await buildFullEvidenceInsightPrompt(plan, h.deps);
        const cold = h.calls.length;
        h.scope(change);
        const next = await buildFullEvidenceInsightPrompt(plan, h.deps);
        expect(h.calls.length).toBeGreaterThan(cold);
        expect(next.stats.summaryCacheHits).toBe(0);
    });
}
test('changed evidence/multiplicity invalidates only exact matching cohort inputs without old-insight updates', async () => {
    const h = harness();
    const batch = inputs(60);
    await buildFullEvidenceInsightPrompt(prepareInsightEvidence(batch), h.deps);
    const cold = h.calls.length;
    batch[0]!.projection = projection(999);
    const changed = await buildFullEvidenceInsightPrompt(prepareInsightEvidence(batch), h.deps);
    expect(changed.stats.summaryCacheHits).toBeGreaterThan(0);
    expect(changed.stats.summaryModelCalls).toBeGreaterThan(0);
    expect(h.calls.length - cold).toBeLessThan(cold);
    const prior = h.calls.length;
    batch.push({
        key: 'extra-duplicate',
        projection: structuredClone(batch[0]!.projection),
    });
    const counted = await buildFullEvidenceInsightPrompt(prepareInsightEvidence(batch), h.deps);
    expect(counted.stats.representedCredentialCount).toBe(61);
    expect(counted.stats.duplicateCount).toBe(1);
    expect(h.calls.length).toBeGreaterThan(prior);
    expect(h.calls.every(call => !call.message.includes('earlier insight'))).toBe(true);
});
test('hierarchical reduction retains complete source groups and counts under escaped output pressure', async () => {
    const h = harness();
    h.respond(async () => ({ summary: '"\\'.repeat(1000) }));
    const result = await buildFullEvidenceInsightPrompt(
        prepareInsightEvidence(inputs(196, 12)),
        h.deps
    );
    expect(result.stats.levels).toBeGreaterThan(1);
    expect(catalog(result.message)).toHaveLength(196);
    expect(await measure(result.message)).toBeLessThanOrEqual(INSIGHT_FINAL_INPUT_BUDGET);
    for (const call of h.calls)
        expect(await measure(call.message)).toBeLessThanOrEqual(INSIGHT_COHORT_INPUT_BUDGET);
});
test('first cohort failure stops scheduling and drains active siblings before rejecting', async () => {
    const h = harness();
    const release = Promise.withResolvers<void>();
    const entered = Promise.withResolvers<void>();
    const primary = new Error('synthetic unavailable');
    let calls = 0;
    let settled = false;
    h.respond(async () => {
        calls += 1;
        if (calls === 1) {
            await entered.promise;
            throw primary;
        }
        entered.resolve();
        await release.promise;
        return { summary: 'Synthetic sibling evidence' };
    });
    const operation = buildFullEvidenceInsightPrompt(prepareInsightEvidence(inputs(196)), h.deps);
    const observed = operation.then(
        () => {
            settled = true;
        },
        () => {
            settled = true;
        }
    );
    await entered.promise;
    await Bun.sleep(20);
    expect(settled).toBe(false);
    release.resolve();
    await observed;
    await expect(operation).rejects.toBe(primary);
    expect(h.calls).toHaveLength(3);
});
test('revocation after summary cannot populate cache or yield partial success', async () => {
    const h = harness();
    const primary = Object.assign(new Error('synthetic revoked'), {
        name: 'AiConsentError',
    });
    h.respond(async () => {
        h.failFresh(primary);
        return { summary: 'Synthetic evidence' };
    });
    await expect(
        buildFullEvidenceInsightPrompt(prepareInsightEvidence(inputs(40)), h.deps)
    ).rejects.toBe(primary);
    expect(h.writes).toBe(0);
});
test('invalid and oversized model/cache output fail closed without exposing raw response', async () => {
    for (const response of [
        { summary: 'x'.repeat(5001) },
        { summary: 'ok', private: 'x'.repeat(20000) },
        { unexpected: 'private' },
    ]) {
        const h = harness();
        h.respond(async () => response);
        await expect(
            buildFullEvidenceInsightPrompt(prepareInsightEvidence(inputs(40)), h.deps)
        ).rejects.toMatchObject({
            name: 'InsightCompactionError',
            reason: 'invalid_summary',
        });
        expect(h.writes).toBe(0);
    }
    const h = harness();
    const plan = prepareInsightEvidence(inputs(40));
    await buildFullEvidenceInsightPrompt(plan, h.deps);
    for (const key of h.cache.keys()) h.cache.set(key, 'x'.repeat(5001));
    const calls = h.calls.length;
    await expect(buildFullEvidenceInsightPrompt(plan, h.deps)).rejects.toMatchObject({
        reason: 'invalid_summary',
    });
    expect(h.calls).toHaveLength(calls);
});
test('unknown storage failures retain identity and never fall back to omitted or historical evidence', async () => {
    const h = harness();
    const primary = new Error('synthetic cache failure');
    h.deps.read = async () => {
        throw primary;
    };
    await expect(
        buildFullEvidenceInsightPrompt(prepareInsightEvidence(inputs(40)), h.deps)
    ).rejects.toBe(primary);
    expect(h.calls).toHaveLength(0);
});
test('resource and indivisible-unit limits fail explicitly before model calls', async () => {
    expect(() => prepareInsightEvidence(inputs(1001))).toThrow(InsightCompactionError);
    const h = harness();
    await expect(
        buildFullEvidenceInsightPrompt(prepareInsightEvidence(inputs(300, 100)), h.deps)
    ).rejects.toMatchObject({ reason: 'resource_limit' });
    expect(h.calls).toHaveLength(0);
    const one: InsightCompactionInput[] = [
        {
            key: 'source',
            projection: {
                schemaVersion: '1',
                category: 'Synthetic',
                credentialTypes: [],
                facts: [{ kind: 'skill', value: 'indivisible-marker' }],
            },
        },
    ];
    h.deps.measure = async (message: string) =>
        message.includes('indivisible-marker') ? 100001 : JSON.stringify([message]).length;
    await expect(
        buildFullEvidenceInsightPrompt(prepareInsightEvidence(one), h.deps)
    ).rejects.toMatchObject({ reason: 'unit_too_large' });
    expect(h.calls).toHaveLength(0);
});
test('malformed measurements and duplicate source keys cannot silently claim complete coverage', async () => {
    expect(() =>
        prepareInsightEvidence([
            { key: 'same', projection: projection(1) },
            { key: 'same', projection: projection(2) },
        ])
    ).toThrow(InsightCompactionError);
    const h = harness();
    h.deps.measure = async () => NaN;
    await expect(
        buildFullEvidenceInsightPrompt(prepareInsightEvidence(inputs(1)), h.deps)
    ).rejects.toMatchObject({ reason: 'input_budget' });
    expect(h.calls).toHaveLength(0);
});

test('Unicode summaries and cached summaries remain whole, bounded and reusable', async () => {
    for (const summary of [
        'The learner understands π radians.',
        'Δ = α + β',
        'Иван studies systems.',
        '“Learning”—… 👩🏽‍💻',
    ]) {
        const h = harness();
        h.respond(async () => ({ summary }));
        const plan = prepareInsightEvidence(inputs(40));
        const result = await buildFullEvidenceInsightPrompt(plan, h.deps);
        expect(result.message).toContain(summary);
        expect(h.writes).toBeGreaterThan(0);
        expect(h.calls[0]!.systemPrompt).not.toContain('Spell out mathematical Greek letters');
        const calls = h.calls.length;
        const warm = await buildFullEvidenceInsightPrompt(plan, h.deps);
        expect(warm.message).toBe(result.message);
        expect(h.calls.length).toBe(calls);
    }
    expect(INSIGHT_COMPACTION_VERSION).toBe('v5-small-cohorts');
});
test('Unicode survives hierarchical reduction and final assembly without stripping or omission', async () => {
    const h = harness();
    const summary = 'π Δ Иван 👩🏽‍💻 “Learning”—… ' + '"\\'.repeat(970);
    h.respond(async () => ({ summary }));
    const result = await buildFullEvidenceInsightPrompt(
        prepareInsightEvidence(inputs(196, 12)),
        h.deps
    );
    expect(result.stats.levels).toBeGreaterThan(1);
    expect(result.message).toContain('π Δ Иван');
    expect(catalog(result.message)).toHaveLength(196);
});

test('soft targets retain complete nodes and full group coverage at every level', async () => {
    const h = harness();
    h.respond(async () => ({ summary: 'x'.repeat(5000) }));
    const plan = prepareInsightEvidence(inputs(196));
    const result = await buildFullEvidenceInsightPrompt(plan, h.deps);
    expect(result.stats.levels).toBeGreaterThan(1);
    const initial = h.calls.filter(call =>
        JSON.parse(call.message).evidence[0].content.startsWith('{')
    );
    expect(
        initial
            .flatMap(call => JSON.parse(call.message).evidence)
            .map(node => node.groups[0])
            .sort((a, b) => a - b)
    ).toEqual(plan.groups.map(group => group.id));
    for (const call of h.calls) {
        const nodes = JSON.parse(call.message).evidence;
        expect(nodes.length).toBeLessThanOrEqual(8);
        expect(await measure(call.message)).toBeLessThanOrEqual(20000);
        if (!nodes[0].content.startsWith('{'))
            for (const node of nodes) expect(node.content).toBe('x'.repeat(5000));
        expect(call.systemPrompt).toContain(
            'do not repeat representative credential ordinals or multiplicities'
        );
    }
    expect(catalog(result.message)).toHaveLength(196);
});

test('one complete node may exceed soft targets without splitting within the hard limit', async () => {
    const h = harness();
    const plan = prepareInsightEvidence(inputs(4, 100));
    const result = await buildFullEvidenceInsightPrompt(plan, h.deps);
    expect(result.stats.splitProjectionCount).toBe(0);
    expect(h.calls).toHaveLength(4);
    for (const call of h.calls) {
        const nodes = JSON.parse(call.message).evidence;
        expect(nodes).toHaveLength(1);
        expect(JSON.parse(nodes[0].content).projection.facts).toHaveLength(100);
        expect(await measure(call.message)).toBeGreaterThan(20000);
        expect(await measure(call.message)).toBeLessThanOrEqual(60000);
    }
});

test('cold-call planning rejects an unaffordable level before scheduling its calls', async () => {
    const h = harness();
    h.respond(async () => ({ summary: 'x'.repeat(5000) }));
    await expect(
        buildFullEvidenceInsightPrompt(prepareInsightEvidence(inputs(128, 40)), h.deps)
    ).rejects.toMatchObject({ reason: 'resource_limit' });
    expect(h.calls).toHaveLength(128);
    expect(
        h.calls.every(call => JSON.parse(call.message).evidence[0].content.startsWith('{'))
    ).toBe(true);
    const rejected = harness();
    await expect(
        buildFullEvidenceInsightPrompt(prepareInsightEvidence(inputs(129, 40)), rejected.deps)
    ).rejects.toMatchObject({ reason: 'resource_limit' });
    expect(rejected.calls).toHaveLength(0);
});

test('escaped valid summaries fail closed when soft-target batches cannot reduce', async () => {
    const h = harness();
    h.respond(async () => ({
        summary: String.fromCharCode(34, 92).repeat(2500),
    }));
    await expect(
        buildFullEvidenceInsightPrompt(prepareInsightEvidence(inputs(196)), h.deps)
    ).rejects.toMatchObject({ reason: 'reduction_stalled' });
    expect(h.calls.length).toBeLessThanOrEqual(128);
});

test('privacy-measured expansion controls the soft input target', async () => {
    const h = harness();
    h.deps.measure = async message =>
        message.startsWith('Analyze all') ? 80001 : (await measure(message)) * 2;
    await expect(
        buildFullEvidenceInsightPrompt(prepareInsightEvidence(inputs(40)), h.deps)
    ).rejects.toMatchObject({ reason: 'reduction_stalled' });
    for (const call of h.calls) {
        const nodes = JSON.parse(call.message).evidence;
        expect(nodes.length).toBeLessThanOrEqual(8);
        if (nodes.length > 1) expect(await h.deps.measure(call.message)).toBeLessThanOrEqual(20000);
    }
});

test('node count target caps small cohorts even when characters fit', async () => {
    const h = harness();
    h.deps.measure = async message =>
        message.startsWith('Analyze all') ? 80001 : await measure(message);
    await expect(
        buildFullEvidenceInsightPrompt(prepareInsightEvidence(inputs(40, 1)), h.deps)
    ).rejects.toMatchObject({ reason: 'reduction_stalled' });
    expect(JSON.parse(h.calls[0]!.message).evidence).toHaveLength(8);
    expect(h.calls.every(call => JSON.parse(call.message).evidence.length <= 8)).toBe(true);
});
