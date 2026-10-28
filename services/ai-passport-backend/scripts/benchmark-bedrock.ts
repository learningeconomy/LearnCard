// Fixed synthetic-only smoke. Default is offline mock mode, with no AWS calls.
import { createInterface } from 'node:readline/promises';
import { fromIni } from '@aws-sdk/credential-providers';
import { getTokenProvider } from '@aws/bedrock-token-generator';
import { z } from 'zod';
import { createBedrockResponsesClient } from '../src/ai/bedrock-generation';
import {
    BedrockResponsesProvider,
    BedrockResponsesProtocolError,
} from '../src/ai/bedrock-responses';
import { normalizeAiProviderError } from '../src/ai/errors';

const MAX_ATTEMPTS = 6;
const INPUT_TOKEN_BOUND = 4096;
const OUTPUT_TOKEN_LIMIT = 2048; // Includes reasoning, visible and formatting output.
const RESERVE_PER_ATTEMPT = (INPUT_TOKEN_BOUND * 2.75 + OUTPUT_TOKEN_LIMIT * 11) / 1_000_000;
const BUDGET_USD = 0.25;
const ENDPOINT = 'https://bedrock-runtime.us-east-1.amazonaws.com/openai/v1/responses';
const focused = process.argv.includes('--focused');
const args = process.argv.slice(2).filter(arg => arg !== '--focused');
const live = args[0] === '--live-staging';
if (
    (live &&
        (args.length !== 3 ||
            args[1] !== '--profile' ||
            !/^[a-zA-Z0-9_-]{1,100}$/.test(args[2]!))) ||
    (!live && (args.length > 1 || (args.length === 1 && args[0] !== '--dry-run')))
) {
    console.error(
        'Usage: bun --no-env-file scripts/benchmark-bedrock.ts --dry-run | --live-staging --profile PROFILE'
    );
    process.exit(1);
}
const profile = live ? args[2]! : 'synthetic-mock';
// Remove ambient static/web-identity overrides. The explicitly chosen profile's
// existing configuration is the only local credential source; nothing is written.
const cleanEnvironment: NodeJS.ProcessEnv = {
    ...process.env,
    AWS_PROFILE: profile,
    AWS_EC2_METADATA_DISABLED: 'true',
    AWS_REGION: 'us-east-1',
    AWS_DEFAULT_REGION: 'us-east-1',
};
for (const key of [
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_SESSION_TOKEN',
    'AWS_WEB_IDENTITY_TOKEN_FILE',
    'AWS_ROLE_ARN',
    'AWS_CONTAINER_CREDENTIALS_FULL_URI',
    'AWS_CONTAINER_CREDENTIALS_RELATIVE_URI',
])
    delete cleanEnvironment[key];

let identity: { account: string; arn: string } = {
    account: 'synthetic-account',
    arn: 'synthetic-role',
};
if (live) {
    const result = Bun.spawnSync(
        [
            'aws',
            'sts',
            'get-caller-identity',
            '--profile',
            profile,
            '--region',
            'us-east-1',
            '--output',
            'json',
            '--no-cli-pager',
        ],
        { env: cleanEnvironment, stdout: 'pipe', stderr: 'pipe' }
    );
    if (result.exitCode !== 0) {
        console.error(
            'Account identity check failed. Run your usual MFA authentication, then retry. No model request was sent.'
        );
        process.exit(1);
    }
    try {
        const parsed = JSON.parse(result.stdout.toString());
        if (!/^\d{12}$/.test(parsed.Account) || !/^arn:aws:(sts|iam)::\d{12}:/.test(parsed.Arn))
            throw new Error();
        identity = { account: parsed.Account, arn: parsed.Arn };
    } catch {
        console.error('Account identity response was invalid; no model request was sent.');
        process.exit(1);
    }
    console.log(
        JSON.stringify({
            profile,
            identity,
            endpoint: ENDPOINT,
            maxAttempts: MAX_ATTEMPTS,
            maxOutputTokens: OUTPUT_TOKEN_LIMIT,
            inputTokenBound: INPUT_TOKEN_BOUND,
            inferenceReserveUSD: Number((RESERVE_PER_ATTEMPT * MAX_ATTEMPTS).toFixed(6)),
            budgetUSD: BUDGET_USD,
        })
    );
    const reader = createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    const approval = await reader.question(
        'Verify this is the intended staging account/role. Type RUN to allow up to six synthetic inference attempts: '
    );
    reader.close();
    if (approval !== 'RUN') {
        console.log('Cancelled; no model request sent.');
        process.exit(0);
    }
}

if (live) {
    for (const key of [
        'AWS_ACCESS_KEY_ID',
        'AWS_SECRET_ACCESS_KEY',
        'AWS_SESSION_TOKEN',
        'AWS_WEB_IDENTITY_TOKEN_FILE',
        'AWS_ROLE_ARN',
        'AWS_CONTAINER_CREDENTIALS_FULL_URI',
        'AWS_CONTAINER_CREDENTIALS_RELATIVE_URI',
    ])
        delete process.env[key];
    process.env.AWS_EC2_METADATA_DISABLED = 'true';
}

const originalEffort = process.env.OPENAI_REASONING_EFFORT;
delete process.env.OPENAI_REASONING_EFFORT; // Smoke tests fixed actual default efforts, never ambient overrides.
const schema = z.object({
    answer: z.string().min(3),
    optional: z.string().optional(),
});
const prompt =
    'Synthetic developer smoke test. Explain in one short sentence why two halves make one whole. For tools, return the answer field; optional may be omitted. No personal facts are supplied.';
let attempts = 0;
let reservedUSD = 0;
const controls: {
    attempt: number;
    model: string;
    inputByteBound: number;
    outputTokenLimit: number;
}[] = [];
const mockResponse = (body: Record<string, unknown>): Response => {
    const tools = body.tools as { name: string }[] | undefined;
    const call = {
        type: 'function_call',
        id: 'item-1',
        call_id: 'call-1',
        name: tools?.[0]?.name,
        arguments: '{"answer":"Two halves make a whole."}',
        status: 'completed',
    };
    if (!body.stream) return Response.json({ status: 'completed', output: [call] });
    const events = tools
        ? [
              {
                  type: 'response.output_item.added',
                  output_index: 0,
                  item: { ...call, arguments: '', status: 'in_progress' },
              },
              {
                  type: 'response.function_call_arguments.delta',
                  item_id: 'item-1',
                  output_index: 0,
                  delta: call.arguments,
              },
              {
                  type: 'response.function_call_arguments.done',
                  item_id: 'item-1',
                  output_index: 0,
                  arguments: call.arguments,
              },
              { type: 'response.output_item.done', output_index: 0, item: call },
              {
                  type: 'response.completed',
                  response: { status: 'completed', output: [call] },
              },
          ]
        : [
              {
                  type: 'response.output_text.delta',
                  delta: 'Two halves make a whole.',
              },
              {
                  type: 'response.completed',
                  response: { status: 'completed', output: [] },
              },
          ];
    return new Response(
        events.map(event => `data: ${JSON.stringify(event)}\n\n`).join('') + 'data: [DONE]\n\n',
        { headers: { 'content-type': 'text/event-stream' } }
    );
};
const boundedFetch = async (url: RequestInfo | URL, options?: RequestInit) => {
    if (String(url) !== ENDPOINT || options?.method !== 'POST' || typeof options.body !== 'string')
        throw new Error('Smoke endpoint/request rejected');
    const body = JSON.parse(options.body);
    if (
        !['us.openai.gpt-6.1-sol', 'us.openai.gpt-6-luna'].includes(body.model) ||
        body.store !== false ||
        body.previous_response_id ||
        body.background
    )
        throw new Error('Smoke request contract rejected');
    body.max_output_tokens = OUTPUT_TOKEN_LIMIT;
    body.service_tier = 'default';
    const serialized = JSON.stringify(body);
    // A byte-level tokenizer token consumes at least one UTF-8 byte. Counting the
    // entire serialized request (including schemas, instructions and history) is
    // conservative. Reserve 512 more tokens for the fixed six fixtures' framing.
    const inputByteBound = Buffer.byteLength(serialized, 'utf8') + 512;
    if (inputByteBound > INPUT_TOKEN_BOUND)
        throw new Error('Synthetic input exceeds conservative token bound');
    if (attempts >= MAX_ATTEMPTS || reservedUSD + RESERVE_PER_ATTEMPT > BUDGET_USD)
        throw new Error('Smoke inference reserve exhausted');
    attempts += 1;
    reservedUSD += RESERVE_PER_ATTEMPT; // Reserve before sending, including failures/timeouts.
    controls.push({
        attempt: attempts,
        model: body.model,
        inputByteBound,
        outputTokenLimit: OUTPUT_TOKEN_LIMIT,
    });
    if (!live) return mockResponse(body);
    const response = await fetch(url, {
        ...options,
        body: serialized,
        redirect: 'error',
    });
    observedProviderHttpStatus = response.status;
    return response;
};
const tokenFactory = live
    ? () =>
          getTokenProvider({
              region: 'us-east-1',
              credentials: fromIni({
                  profile,
                  clientConfig: { region: 'us-east-1', maxAttempts: 1 },
              }),
          })
    : () => async () => 'synthetic-smoke-token';
let observedProviderHttpStatus: number | undefined;
let eventTypes: string[] = [];
const client = createBedrockResponsesClient({}, boundedFetch, tokenFactory);
const provider = new BedrockResponsesProvider(
    () => client,
    type => {
        if (eventTypes.at(-1) !== type && eventTypes.length < 64) eventTypes.push(type);
    }
);
const results: {
    scenario: string;
    model: string;
    status: string;
    durationMs: number;
    failureCode?: string;
    normalizedHttpStatus?: number;
    providerHttpStatus?: number;
    eventTypes?: string[];
}[] = [];
try {
    for (const model of ['gpt-6.1-sol', 'gpt-6-luna-none']) {
        for (const transport of ['text-stream', 'required-tool', 'tool-stream']) {
            if (
                focused &&
                (transport === 'text-stream' ||
                    (model === 'gpt-6-luna-none' && transport === 'required-tool'))
            )
                continue;
            observedProviderHttpStatus = undefined;
            eventTypes = [];
            const start = performance.now();
            try {
                if (transport === 'text-stream')
                    await provider.streamingCall({
                        message: prompt,
                        model,
                        options: { timeoutMs: 30_000, onChunk: () => {} },
                    });
                else if (transport === 'required-tool')
                    await provider.call({
                        message: prompt,
                        model,
                        output: schema,
                        timeoutMs: 30_000,
                    });
                else
                    await provider.structuredStreamingCall({
                        message: prompt,
                        systemPrompt: 'Use only the supplied synthetic exercise.',
                        model,
                        output: schema,
                        toolName: 'answer',
                        timeoutMs: 30_000,
                        onPartial: () => {},
                    });
                results.push({
                    scenario: transport,
                    model,
                    status: live ? 'validated-live-synthetic' : 'validated-offline-mock',
                    providerHttpStatus: observedProviderHttpStatus,
                    eventTypes,
                    durationMs: Math.round(performance.now() - start),
                });
            } catch (error) {
                const safe = normalizeAiProviderError(error, 'bedrock');
                results.push({
                    scenario: transport,
                    model,
                    status: 'failed',
                    failureCode:
                        error instanceof z.ZodError
                            ? 'output_validation_failed'
                            : error instanceof BedrockResponsesProtocolError
                              ? error.failureCode
                              : error instanceof SyntaxError
                                ? 'invalid_response_json'
                                : safe.code,
                    normalizedHttpStatus: safe.httpStatus,
                    providerHttpStatus: observedProviderHttpStatus,
                    eventTypes,
                    durationMs: Math.round(performance.now() - start),
                });
            }
        }
    }
} finally {
    if (originalEffort === undefined) delete process.env.OPENAI_REASONING_EFFORT;
    else process.env.OPENAI_REASONING_EFFORT = originalEffort;
}
const summary = {
    focused,
    mode: live ? 'live-synthetic' : 'offline-mock-no-network',
    createdAt: new Date().toISOString(),
    identity,
    profile,
    attempts,
    reservedInferenceUSD: Number(reservedUSD.toFixed(6)),
    budgetUSD: BUDGET_USD,
    controls,
    results,
    releaseReady: false,
    notes: 'No learner data, Guardrails calls, credentials, prompts, generated text or provider bodies recorded. Reserve includes failed/time-out attempts and is not an AWS account spending cap. Ancillary costs excluded. Separate production privacy/retention/logging/authorization gates remain.',
};
const destination = new URL(
    live
        ? focused
            ? '../tmp/bedrock-responses-smoke-focused-summary.json'
            : '../tmp/bedrock-responses-smoke-summary.json'
        : '../tmp/bedrock-responses-smoke-dry-run.json',
    import.meta.url
);
await Bun.write(destination, JSON.stringify(summary, null, 2) + '\n');
console.log(
    JSON.stringify({
        mode: summary.mode,
        attempts,
        reservedInferenceUSD: summary.reservedInferenceUSD,
        results,
        summaryPath: destination.pathname,
    })
);
if (results.some(result => result.status === 'failed')) process.exitCode = 1;
