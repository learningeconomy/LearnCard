import { expect, test } from 'bun:test';
import { createBedrockResponsesClient } from './bedrock-generation';
import { BedrockResponsesProvider } from './bedrock-responses';
import { AIInsightDataValidator } from './generation-schemas';
import {
    InsightCohortSummaryValidator,
    prepareInsightEvidence,
    buildFullEvidenceInsightPrompt,
} from '../services/insightCompaction';
import { createHash } from 'node:crypto';
const keyword = { occupations: null, careers: null, jobs: null, skills: null, fieldOfStudy: null };
const area = { title: 'Synthetic', summary: 'Synthetic bounded summary', keywords: keyword };
const insight = {
    strongestArea: area,
    weakestArea: area,
    roomForGrowth: area,
    generalSummary: 'Synthetic',
    suggestedPathways: [],
};
function harness(summary: string, finalInsight = insight) {
    const requests: any[] = [];
    const client = createBedrockResponsesClient(
        {},
        async (_url: RequestInfo | URL, options?: RequestInit) => {
            const body = JSON.parse(options!.body as string);
            requests.push(body);
            expect(body.model).toBe('us.openai.gpt-6.1-sol');
            expect(body.reasoning).toEqual({ effort: 'medium' });
            expect(body.store).toBe(false);
            expect(body.parallel_tool_calls).toBe(false);
            const name = body.tools[0].name;
            const args = JSON.stringify(body.stream ? finalInsight : { summary });
            const call = {
                type: 'function_call',
                id: 'item-1',
                call_id: 'call-1',
                name,
                arguments: args,
                status: 'completed',
            };
            const response = { status: 'completed', output: [call] };
            if (!body.stream) return Response.json(response);
            const events = [
                {
                    type: 'response.output_item.added',
                    output_index: 0,
                    item: { ...call, arguments: '', status: 'in_progress' },
                },
                {
                    type: 'response.function_call_arguments.delta',
                    output_index: 0,
                    item_id: call.id,
                    delta: args,
                },
                {
                    type: 'response.function_call_arguments.done',
                    output_index: 0,
                    item_id: call.id,
                    arguments: args,
                },
                { type: 'response.output_item.done', output_index: 0, item: call },
                { type: 'response.completed', response },
            ];
            return new Response(
                events.map(event => `data: ${JSON.stringify(event)}\n\n`).join('') +
                    'data: [DONE]\n\n',
                { headers: { 'content-type': 'text/event-stream' } }
            );
        },
        () => async () => 'synthetic-token'
    );
    return { requests, provider: new BedrockResponsesProvider(() => client) };
}
test('#97 full evidence compaction and bounded named stream traverse real Responses SDK offline', async () => {
    const f = harness('Synthetic bounded cohort evidence.');
    const plan = prepareInsightEvidence(
        Array.from({ length: 40 }, (_, index) => ({
            key: `synthetic-${index}`,
            projection: {
                schemaVersion: '1' as const,
                category: 'Learning',
                credentialTypes: ['CourseCredential'],
                facts: Array.from({ length: 12 }, (_, fact) => ({
                    kind: 'skill' as const,
                    value: `${index} ${fact} ${'synthetic systems engineering '.repeat(7)}`,
                })),
            },
        }))
    );
    const result = await buildFullEvidenceInsightPrompt(plan, {
        measure: async value => JSON.stringify([value]).length,
        hash: value => createHash('sha256').update(JSON.stringify(value)).digest('hex'),
        assertFresh: async () => {},
        read: async () => undefined,
        write: async () => {},
        summarize: input =>
            f.provider.call({
                ...input,
                model: 'gpt-6.1-sol',
                output: InsightCohortSummaryValidator,
                timeoutMs: 60_000,
            }),
    });
    expect(f.requests.length).toBeGreaterThan(1);
    expect(result.stats.representedCredentialCount).toBe(40);
    expect(result.stats.summaryModelCalls).toBeGreaterThan(1);
    const partials: unknown[] = [];
    const output = await f.provider.structuredStreamingCall({
        systemPrompt: 'Synthetic final instructions',
        message: result.message,
        model: 'gpt-6.1-sol',
        output: AIInsightDataValidator,
        toolName: 'generateAIInsights',
        timeoutMs: 60_000,
        onPartial: async value => {
            partials.push(value);
        },
    });
    expect(output).toEqual(insight);
    expect(partials.length).toBeGreaterThan(0);
    expect(
        AIInsightDataValidator.safeParse({ ...insight, generalSummary: 'x'.repeat(2001) }).success
    ).toBe(false);
});
test('#97 cohort bounds remain authoritative through Responses validation', async () => {
    const f = harness('x'.repeat(100_000));
    await expect(
        f.provider.call({
            message: 'Synthetic',
            model: 'gpt-6.1-sol',
            output: InsightCohortSummaryValidator,
        })
    ).rejects.toThrow();
    expect(f.requests).toHaveLength(1);
});

test('cohort and final bounds failures retain normal safe classification without payloads', async () => {
    const { providerFailureDetails } = await import('./provider-diagnostics');
    const cohort = harness('private-synthetic-value'.repeat(300));
    let cohortError: unknown;
    try {
        await cohort.provider.call({
            message: 'Synthetic',
            model: 'gpt-6.1-sol',
            output: InsightCohortSummaryValidator,
        });
    } catch (error) {
        cohortError = error;
    }
    expect(providerFailureDetails(cohortError)).toMatchObject({
        providerOperation: 'response_validation',
        providerFailureReason: 'response_bounds',
    });
    const final = harness('unused', {
        ...insight,
        generalSummary: 'private-synthetic-value'.repeat(200),
    });
    let finalError: unknown;
    try {
        await final.provider.structuredStreamingCall({
            systemPrompt: 'Synthetic',
            message: 'Synthetic',
            model: 'gpt-6.1-sol',
            output: AIInsightDataValidator,
            toolName: 'generateAIInsights',
            timeoutMs: 60000,
            onPartial: async () => {},
        });
    } catch (error) {
        finalError = error;
    }
    expect(providerFailureDetails(finalError)).toMatchObject({
        providerOperation: 'response_validation',
        providerFailureReason: 'response_bounds',
    });
    expect(JSON.stringify(providerFailureDetails(cohortError))).not.toContain(
        'private-synthetic-value'
    );
});
