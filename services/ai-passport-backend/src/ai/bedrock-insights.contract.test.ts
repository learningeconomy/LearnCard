import { beforeEach, expect, test } from 'bun:test';
import { z } from 'zod';
import { createBedrockResponsesClient } from './bedrock-generation';
import { BedrockResponsesProvider } from './bedrock-responses';
import { InsightCohortSummaryValidator } from '../services/insightCompaction';
import { normalizeAiProviderError, toAiErrorPayload } from './errors';
import { providerFailureDetails } from './provider-diagnostics';

let requests: Record<string, any>[];
let response: unknown;
let status: number;
const summaryResponse = (summary: unknown, name = 'function_0') => ({
    status: 'completed',
    output: [
        {
            type: 'function_call',
            id: 'item-1',
            call_id: 'call-1',
            status: 'completed',
            name,
            arguments: JSON.stringify({ summary }),
        },
    ],
});
const provider = () =>
    new BedrockResponsesProvider(() =>
        createBedrockResponsesClient(
            {},
            async (_url: RequestInfo | URL, options?: RequestInit) => {
                requests.push(JSON.parse(options!.body as string));
                return Response.json(response, { status });
            },
            () => async () => 'synthetic-token'
        )
    );
const call = (output: z.ZodType = InsightCohortSummaryValidator) =>
    provider().call({
        systemPrompt: 'Synthetic summary task',
        message: 'Synthetic evidence',
        model: 'gpt-6.1-sol',
        output,
        timeoutMs: 60_000,
    });
beforeEach(() => {
    requests = [];
    status = 200;
    response = summaryResponse('Synthetic summary');
});

test('actual SDK bounds rejection never logs the rejected summary', async () => {
    const captured: unknown[] = [];
    const original = console.warn;
    console.warn = (...args) => captured.push(args);
    try {
        response = summaryResponse('PRIVATE_SUMMARY_SENTINEL'.repeat(300));
        const error = await call().catch(error => error);
        expect(providerFailureDetails(error)).toMatchObject({
            providerOperation: 'response_validation',
            providerFailureReason: 'response_bounds',
        });
        expect(captured).toHaveLength(0);
        expect(JSON.stringify(providerFailureDetails(error))).not.toContain(
            'PRIVATE_SUMMARY_SENTINEL'
        );
    } finally {
        console.warn = original;
    }
});

test('real SDK cohort request preserves fixed bound hints, non-strict schema and no arbitrary descriptions', async () => {
    expect(await call()).toEqual({ summary: 'Synthetic summary' });
    const request = requests[0]!;
    expect(request.tools[0]).toMatchObject({
        strict: false,
        parameters: { type: 'object', additionalProperties: false, required: ['summary'] },
    });
    expect(request.tools[0].parameters.properties.summary.description).toContain('5000');
    expect(request.tools[0].parameters.properties.summary).not.toHaveProperty('maxLength');
    expect(request.tool_choice).toBe('required');
    expect(request.parallel_tool_calls).toBe(false);
    expect(request.reasoning).toEqual({ effort: 'medium' });
    expect(requests).toHaveLength(1);
});
test('schema descriptions are excluded while nullable bounds remain local and hinted', async () => {
    const output = z.object({
        summary: z.string().min(1).max(2000).describe('PRIVATE_SENTINEL'),
        nested: z.object({
            title: z.string().max(240).nullable(),
            labels: z.array(z.string().max(120)),
        }),
    });
    response = {
        ...summaryResponse('Synthetic'),
        output: [
            {
                ...summaryResponse('Synthetic').output[0]!,
                arguments: JSON.stringify({
                    summary: 'Synthetic',
                    nested: { title: null, labels: ['Label'] },
                }),
            },
        ],
    };
    await call(output);
    expect(JSON.stringify(requests[0]!.tools)).not.toContain('PRIVATE_SENTINEL');
    expect(JSON.stringify(requests[0]!.tools)).toContain('240');
    expect(JSON.stringify(requests[0]!.tools)).toContain('120');
});
for (const value of ['x'.repeat(5001), '😀'.repeat(2501)]) {
    test(`cohort bound rejects ${value.length} UTF-16 units without retry/truncation`, async () => {
        response = summaryResponse(value);
        const error = await call().catch((caught: unknown) => caught);
        expect(providerFailureDetails(error)).toEqual({
            providerOperation: 'response_validation',
            providerFailureReason: 'response_bounds',
        });
        expect(requests).toHaveLength(1);
    });
}
test('exact cohort bound accepts 5000 characters', async () => {
    response = summaryResponse('x'.repeat(5000));
    expect(await call()).toEqual({ summary: 'x'.repeat(5000) });
});
for (const [fixture, operation, reason] of [
    ['missing', 'tool_selection', 'missing_tool'],
    ['malformed', 'argument_parse', 'arguments_json'],
    ['wrong_name', 'tool_selection', 'invalid_tool'],
    ['collection', 'tool_selection', 'response_shape'],
    ['shape', 'response_validation', 'response_shape'],
    ['bounds', 'response_validation', 'response_bounds'],
] as const) {
    test(`${fixture} preserves fixed diagnostics through normalization`, async () => {
        response =
            fixture === 'missing'
                ? { status: 'completed', output: [] }
                : fixture === 'collection'
                  ? { status: 'completed', output: { private: 'PRIVATE_SENTINEL' } }
                  : fixture === 'malformed'
                    ? {
                          ...summaryResponse('Synthetic'),
                          output: [
                              {
                                  ...summaryResponse('Synthetic').output[0]!,
                                  arguments: 'PRIVATE_SENTINEL{invalid',
                              },
                          ],
                      }
                    : fixture === 'wrong_name'
                      ? summaryResponse('Synthetic', 'function_0_PRIVATE_SENTINEL')
                      : fixture === 'shape'
                        ? summaryResponse({ claim: 'PRIVATE_SENTINEL' })
                        : summaryResponse('PRIVATE_SENTINEL'.repeat(400));
        const error = await call().catch((caught: unknown) => caught);
        const expected = { providerOperation: operation, providerFailureReason: reason };
        expect(providerFailureDetails(error)).toEqual(expected);
        const normalized = normalizeAiProviderError(error, 'bedrock');
        expect(providerFailureDetails(normalized)).toEqual(expected);
        expect(JSON.stringify(providerFailureDetails(normalized))).not.toContain(
            'PRIVATE_SENTINEL'
        );
        expect(toAiErrorPayload(normalized)).not.toHaveProperty('providerFailureReason');
        expect(requests).toHaveLength(1);
    });
}
test('real SDK HTTP rejection preserves allowlisted request status without diagnostic payload', async () => {
    status = 400;
    response = { error: { message: 'PRIVATE_SENTINEL', code: 'bad_request' } };
    const error = await call().catch((caught: unknown) => caught);
    expect(providerFailureDetails(error)).toEqual({
        providerOperation: 'request',
        providerFailureReason: 'request_failed',
        providerStatus: 400,
    });
    expect(JSON.stringify(providerFailureDetails(error))).not.toContain('PRIVATE_SENTINEL');
    expect(requests).toHaveLength(1);
});
test('custom validator exception preserves identity and fixed category', async () => {
    const primary = new Error('PRIVATE_SENTINEL');
    await expect(
        call(
            z.object({
                summary: z.string().transform(() => {
                    throw primary;
                }),
            })
        )
    ).rejects.toBe(primary);
    expect(providerFailureDetails(primary)).toEqual({
        providerOperation: 'response_validation',
        providerFailureReason: 'response_value',
    });
});
