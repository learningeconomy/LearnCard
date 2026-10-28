import { Readable } from 'node:stream';
import { EventStreamCodec } from '@smithy/core/event-streams';
import type { BedrockRuntimeClient, ConverseStreamOutput } from '@aws-sdk/client-bedrock-runtime';
import type { HttpRequest } from '@smithy/core/protocols';
import {
    createBedrockConverseClient,
    type BedrockTokenProviderFactory,
} from './bedrock-generation';

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const codec = new EventStreamCodec(
    bytes => decoder.decode(bytes),
    text => encoder.encode(text)
);

/** Actual AWS event-stream frames, including headers and CRCs, not decoded SDK mocks. */
export function encodeBedrockEvents(events: ConverseStreamOutput[]): Uint8Array[] {
    return events.map(event => {
        const entries = Object.entries(event);
        if (entries.length !== 1) throw new Error('Fixture requires exactly one event member');
        const [name, value] = entries[0]!;
        return codec.encode({
            headers: {
                ':message-type': { type: 'string', value: 'event' },
                ':event-type': { type: 'string', value: name },
                ':content-type': { type: 'string', value: 'application/json' },
            },
            body: encoder.encode(JSON.stringify(value)),
        });
    });
}

export type NativeFixtureRequest = {
    hostname: string;
    path: string;
    headers: Record<string, string>;
    body: unknown;
};

export type NativeFixture = {
    client: BedrockRuntimeClient;
    requests: NativeFixtureRequest[];
    json: (value: unknown, statusCode?: number) => void;
    events: (value: ConverseStreamOutput[]) => void;
};

export function nativeFixture(
    tokenProviderFactory: BedrockTokenProviderFactory = () => async () => 'synthetic-native-fixture'
): NativeFixture {
    const requests: NativeFixtureRequest[] = [];
    let status = 200;
    let json: unknown = {
        output: {
            message: {
                role: 'assistant',
                content: [{ text: '{"answer":"synthetic"}' }],
            },
        },
        stopReason: 'end_turn',
        usage: { inputTokens: 2, outputTokens: 3, totalTokens: 5 },
        metrics: { latencyMs: 1 },
    };
    let events: ConverseStreamOutput[] = [];
    const client = createBedrockConverseClient(
        {},
        {
            handle: async (
                request: HttpRequest,
                options?: { abortSignal?: { aborted: boolean } }
            ) => {
                if (options?.abortSignal?.aborted)
                    throw new DOMException('Request aborted', 'AbortError');
                if (request.hostname !== 'bedrock-runtime.us-east-1.amazonaws.com')
                    throw new Error('Unexpected fixture destination: network disabled');
                const body =
                    typeof request.body === 'string'
                        ? request.body
                        : request.body instanceof Uint8Array
                          ? decoder.decode(request.body)
                          : undefined;
                if (body === undefined) throw new Error('Expected serialized native JSON');
                requests.push({
                    hostname: request.hostname,
                    path: request.path,
                    headers: Object.fromEntries(new Headers(request.headers)),
                    body: JSON.parse(body),
                });
                const streaming = request.path.endsWith('/converse-stream') && status === 200;
                return {
                    response: {
                        statusCode: status,
                        headers: {
                            'content-type': streaming
                                ? 'application/vnd.amazon.eventstream'
                                : 'application/json',
                        },
                        // Deliberately split frame preambles across chunks to exercise the real decoder.
                        body: streaming
                            ? Readable.from(
                                  encodeBedrockEvents(events).flatMap(frame => [
                                      frame.slice(0, 5),
                                      frame.slice(5),
                                  ])
                              )
                            : encoder.encode(JSON.stringify(json)),
                    },
                };
            },
        },
        tokenProviderFactory
    );
    return {
        client,
        requests,
        json(value: unknown, statusCode = 200) {
            json = value;
            status = statusCode;
        },
        events(value: ConverseStreamOutput[]) {
            events = value;
            status = 200;
        },
    };
}

export function toolEvents(input: string, name = 'answer'): ConverseStreamOutput[] {
    return [
        { messageStart: { role: 'assistant' } },
        {
            contentBlockStart: {
                contentBlockIndex: 0,
                start: { toolUse: { name, toolUseId: 'synthetic-call' } },
            },
        },
        {
            contentBlockDelta: {
                contentBlockIndex: 0,
                delta: { toolUse: { input } },
            },
        },
        { contentBlockStop: { contentBlockIndex: 0 } },
        { messageStop: { stopReason: 'tool_use' } },
        {
            metadata: {
                usage: { inputTokens: 2, outputTokens: 3, totalTokens: 5 },
                metrics: { latencyMs: 1 },
            },
        },
    ];
}

export function textEvents(text: string): ConverseStreamOutput[] {
    return [
        { messageStart: { role: 'assistant' } },
        { contentBlockDelta: { contentBlockIndex: 0, delta: { text } } },
        { contentBlockStop: { contentBlockIndex: 0 } },
        { messageStop: { stopReason: 'end_turn' } },
    ];
}
