import OpenAI from 'openai';
import { getTokenProvider } from '@aws/bedrock-token-generator';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { compileProjectedSchema } from './bedrockSchema';

// Exact profiles and Responses protocol from AI Passport LC-2205 (#92).
export const BEDROCK_BASE_URL = 'https://bedrock-runtime.us-east-1.amazonaws.com/openai/v1';
export const GENERATION_MODELS = {
    reasoning: 'us.openai.gpt-6.1-sol',
    formatting: 'us.openai.gpt-6-luna',
} as const;
type GenerationTask = keyof typeof GENERATION_MODELS;

/** Lambda uses its execution role; the official generator refreshes short-term tokens. */
export const createBedrockClient = (
    baseURL = BEDROCK_BASE_URL,
    tokenFactory: typeof getTokenProvider = getTokenProvider,
    fetch: typeof globalThis.fetch = globalThis.fetch
): OpenAI => {
    if (baseURL !== BEDROCK_BASE_URL && baseURL !== `${BEDROCK_BASE_URL}/`) {
        throw new Error('Unapproved BEDROCK_BASE_URL for generation');
    }
    const provideToken = tokenFactory({ region: 'us-east-1' });
    return new OpenAI({
        baseURL: BEDROCK_BASE_URL,
        organization: null,
        project: null,
        maxRetries: 0,
        logLevel: 'off',
        fetch: (input, init) => fetch(input, { ...init, redirect: 'error' }),
        apiKey: async () => {
            try {
                const token = await provideToken();
                if (!token?.trim()) throw new Error();
                return token;
            } catch {
                // Never retain credential errors, JWTs, presigned URLs or raw provider bodies.
                throw new Error('Bedrock credentials unavailable');
            }
        },
    });
};

/** Non-streaming required-function output, with the original Zod validator authoritative. */
export const generateStructuredOutput = async <Schema extends z.ZodType>(
    client: OpenAI,
    params: {
        task: GenerationTask;
        instructions: string;
        input: string;
        schema: Schema;
    }
): Promise<z.output<Schema>> => {
    // Schema incompatibility fails locally before any request.
    const parameters = compileProjectedSchema(params.schema);
    try {
        const response = await client.responses.create(
            {
                model: GENERATION_MODELS[params.task],
                reasoning: { effort: params.task === 'reasoning' ? 'medium' : 'none' },
                instructions: params.instructions,
                input: [{ role: 'user', content: params.input }],
                store: false,
                stream: false,
                // Includes reasoning tokens. Incomplete/truncated output never becomes success.
                max_output_tokens: 8192,
                tools: [
                    {
                        type: 'function',
                        name: 'result',
                        description: 'Return the requested structured result',
                        parameters,
                        strict: false,
                    },
                ],
                tool_choice: 'required',
                parallel_tool_calls: false,
            },
            { timeout: 25_000 }
        );
        if (response.status !== 'completed' || !Array.isArray(response.output)) throw new Error();
        const calls = response.output.filter(item => item.type === 'function_call');
        if (
            calls.length !== 1 ||
            calls[0]!.name !== 'result' ||
            !calls[0]!.call_id ||
            calls[0]!.status === 'incomplete' ||
            calls[0]!.status === 'in_progress' ||
            response.output.some(
                item =>
                    item.type === 'message' && item.content.some(part => part.type === 'refusal')
            )
        )
            throw new Error();
        return await params.schema.parseAsync(JSON.parse(calls[0]!.arguments));
    } catch (error) {
        // Preserve actionable status without exposing SDK response bodies or validation values.
        const status = error instanceof OpenAI.APIError ? error.status : undefined;
        throw new TRPCError({
            code:
                status === 429
                    ? 'TOO_MANY_REQUESTS'
                    : status === 503 || status === 504
                      ? 'SERVICE_UNAVAILABLE'
                      : 'INTERNAL_SERVER_ERROR',
            message: status === 429 ? 'AI generation rate limited' : 'AI generation unavailable',
        });
    }
};
