import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import OpenAI from 'openai';
import {
    BEDROCK_BASE_URL,
    createBedrockClient,
    generateStructuredOutput,
    GENERATION_MODELS,
} from './bedrockGeneration';
import { compileProjectedSchema } from './bedrockSchema';
import { BoostSkillHierarchyValidator } from '../types/skills';

const schema = z.object({ title: z.string().min(1).max(8), optional: z.string().optional() });
const completed = (argumentsText = '{"title":"Hello"}'): Record<string, unknown> => ({
    id: 'resp_synthetic',
    object: 'response',
    status: 'completed',
    output: [
        {
            type: 'function_call',
            name: 'result',
            call_id: 'call_synthetic',
            status: 'completed',
            arguments: argumentsText,
        },
    ],
});
const harness = (result: unknown = completed(), status = 200) => {
    const fetch = vi.fn<typeof globalThis.fetch>(
        async () =>
            new Response(JSON.stringify(result), {
                status,
                headers: { 'content-type': 'application/json' },
            })
    );
    const provideToken = vi.fn(async () => 'synthetic-token');
    const factory = vi.fn(() => provideToken);
    const client = createBedrockClient(undefined, factory, fetch);
    const run = (task: 'reasoning' | 'formatting' = 'reasoning') =>
        generateStructuredOutput(client, {
            task,
            instructions: 'Fixed instruction',
            input: 'Synthetic learner description',
            schema,
        });
    return { client, fetch, provideToken, factory, run };
};
afterEach(() => vi.unstubAllEnvs());

describe('Bedrock Responses real SDK contract (offline)', () => {
    it('retains SDK compatibility for the separate first-party DALL-E image request', async () => {
        const fetch = vi.fn<typeof globalThis.fetch>(
            async () =>
                new Response(
                    JSON.stringify({ data: [{ url: 'https://example.com/synthetic.png' }] }),
                    { headers: { 'content-type': 'application/json' } }
                )
        );
        const imageClient = new OpenAI({ apiKey: 'synthetic-image-key', fetch });
        const result = await imageClient.images.generate({
            prompt: 'Synthetic image',
            model: 'dall-e-3',
            size: '1024x1024',
            user: 'did:synthetic',
        });
        expect(result.data?.[0]?.url).toBe('https://example.com/synthetic.png');
        expect(String(fetch.mock.calls[0]![0])).toBe(
            'https://api.openai.com/v1/images/generations'
        );
        expect(JSON.parse(fetch.mock.calls[0]![1]!.body as string)).toMatchObject({
            model: 'dall-e-3',
            size: '1024x1024',
            user: 'did:synthetic',
        });
    });
    it.each(['reasoning', 'formatting'] as const)(
        'uses approved %s profile and request fields',
        async task => {
            vi.stubEnv('OPENAI_ORG_ID', 'ambient-organization');
            vi.stubEnv('OPENAI_PROJECT_ID', 'ambient-project');
            const h = harness();
            expect(await h.run(task)).toEqual({ title: 'Hello' });
            const [url, init] = h.fetch.mock.calls[0]!;
            expect(String(url)).toBe(`${BEDROCK_BASE_URL}/responses`);
            expect(init?.redirect).toBe('error');
            const headers = new Headers(init?.headers);
            expect(headers.get('authorization')).toBe('Bearer synthetic-token');
            expect(headers.has('openai-organization')).toBe(false);
            expect(headers.has('openai-project')).toBe(false);
            const body = JSON.parse(init!.body as string);
            expect(body).toMatchObject({
                model: GENERATION_MODELS[task],
                reasoning: { effort: task === 'reasoning' ? 'medium' : 'none' },
                store: false,
                stream: false,
                max_output_tokens: 8192,
                tool_choice: 'required',
                parallel_tool_calls: false,
                tools: [{ name: 'result', type: 'function', strict: false }],
            });
            expect(body).not.toHaveProperty('response_format');
            expect(body).not.toHaveProperty('temperature');
            expect(body).not.toHaveProperty('user');
            expect(h.client.timeout).toBeDefined();
            expect(h.factory).toHaveBeenCalledWith({ region: 'us-east-1' });
        }
    );
    it('resolves the token on each request rather than pinning a bearer for process life', async () => {
        const h = harness();
        await h.run();
        await h.run();
        expect(h.provideToken).toHaveBeenCalledTimes(2);
    });
    it('rejects alternate endpoints before generating tokens', () => {
        const factory = vi.fn();
        expect(() => createBedrockClient('https://example.com/openai/v1', factory)).toThrow(
            'Unapproved'
        );
        expect(factory).not.toHaveBeenCalled();
        expect(
            createBedrockClient(`${BEDROCK_BASE_URL}/`, () => async () => 'synthetic')
        ).toBeDefined();
    });
    it('removes SDK credential error causes and never sends a failed credential', async () => {
        const fetch = vi.fn();
        const client = createBedrockClient(
            undefined,
            () => async () => {
                throw new Error('synthetic-sensitive-credential');
            },
            fetch
        );
        await expect(
            generateStructuredOutput(client, {
                task: 'reasoning',
                instructions: 'test',
                input: 'test',
                schema,
            })
        ).rejects.toMatchObject({ message: 'AI generation unavailable', cause: undefined });
        expect(fetch).not.toHaveBeenCalled();
    });
    it.each([429, 500, 503, 401])('sanitizes HTTP %s without retries or fallback', async status => {
        const h = harness({ error: { message: 'synthetic-private-body', type: 'error' } }, status);
        await expect(h.run()).rejects.toMatchObject({
            code:
                status === 429
                    ? 'TOO_MANY_REQUESTS'
                    : status === 503
                      ? 'SERVICE_UNAVAILABLE'
                      : 'INTERNAL_SERVER_ERROR',
            cause: undefined,
        });
        expect(h.fetch).toHaveBeenCalledTimes(1);
    });
    it.each([
        {
            ...completed(),
            status: 'incomplete',
            incomplete_details: { reason: 'max_output_tokens' },
        },
        { ...completed(), status: 'failed', error: { code: 'error', message: 'private' } },
        { ...completed(), output: [] },
        {
            ...completed(),
            output: [...(completed().output as unknown[]), ...(completed().output as unknown[])],
        },
        {
            ...completed(),
            output: [{ type: 'function_call', name: 'wrong', call_id: 'call', arguments: '{}' }],
        },
        { ...completed(), output: [{ type: 'function_call', name: 'result', arguments: '{}' }] },
        {
            ...completed(),
            output: [
                {
                    type: 'function_call',
                    name: 'result',
                    call_id: 'call',
                    status: 'incomplete',
                    arguments: '{}',
                },
            ],
        },
        {
            ...completed(),
            output: [
                ...(completed().output as unknown[]),
                { type: 'message', content: [{ type: 'refusal', refusal: 'private' }] },
            ],
        },
        completed('```json\n{"title":"Hello"}\n```'),
        completed('{"title":"Too long to pass local validation"}'),
        completed('{"title":7}'),
    ])('rejects incomplete, malformed, refused or invalid structured output %#', async result => {
        const h = harness(result);
        await expect(h.run()).rejects.toMatchObject({
            message: 'AI generation unavailable',
            cause: undefined,
        });
        expect(h.fetch).toHaveBeenCalledTimes(1);
    });
    it('compiles the entire existing skills hierarchy preserving optional categories', () => {
        const compiled = compileProjectedSchema(BoostSkillHierarchyValidator);
        expect(compiled.type).toBe('object');
        expect(compiled.required).toBeUndefined();
        expect(compiled.properties).toHaveProperty('medical');
        expect(BoostSkillHierarchyValidator.parse({})).toEqual({});
    });
    it('rejects unsupported schemas before egress', async () => {
        const h = harness();
        await expect(
            generateStructuredOutput(h.client, {
                task: 'formatting',
                instructions: 'test',
                input: 'test',
                schema: z.record(z.string(), z.string()),
            })
        ).rejects.toThrow('Unsupported Bedrock schema');
        expect(h.fetch).not.toHaveBeenCalled();
    });
});
