import { expect, test } from 'bun:test';
import OpenAI from 'openai';
import type { ChatCompletionChunk } from 'openai/resources/chat/completions';

// Dependency-lock SDK wire evidence only. This is not a production generation path.
const delta: ChatCompletionChunk = {
    id: 'synthetic-completion',
    object: 'chat.completion.chunk',
    created: 1,
    model: 'synthetic-sse-model',
    choices: [
        {
            index: 0,
            delta: { role: 'assistant', content: 'Synthetic answer' },
            finish_reason: null,
        },
    ],
};
const finish: ChatCompletionChunk = {
    ...delta,
    choices: [{ index: 0, delta: {}, finish_reason: 'stop' }],
};
const fixtures: { name: string; ending: 'done' | 'eof' | 'finished' }[] = [
    { name: 'content delta then DONE without finish_reason', ending: 'done' },
    {
        name: 'clean EOF after content delta without DONE or finish_reason',
        ending: 'eof',
    },
    {
        name: 'content delta then valid stop completion and DONE',
        ending: 'finished',
    },
];

test.each(fixtures)('real OpenAI SDK SSE behavior: $name', async ({ ending }) => {
    const wire =
        `data: ${JSON.stringify(delta)}\n\n` +
        (ending === 'finished' ? `data: ${JSON.stringify(finish)}\n\n` : '') +
        (ending === 'eof' ? '' : 'data: [DONE]\n\n');
    const bytes = new TextEncoder().encode(wire);
    const server = Bun.serve({
        hostname: '127.0.0.1',
        port: 0,
        fetch: () =>
            new Response(
                new ReadableStream<Uint8Array>({
                    start(controller) {
                        // Split the SSE data prefix; exercise the SDK's real incremental parser.
                        controller.enqueue(bytes.slice(0, 3));
                        controller.enqueue(bytes.slice(3));
                        controller.close();
                    },
                }),
                { headers: { 'content-type': 'text/event-stream' } }
            ),
    });
    const client = new OpenAI({
        apiKey: 'synthetic-localhost-only',
        baseURL: new URL('/v1', server.url).href,
        maxRetries: 0,
        timeout: 2_000,
        fetch: (input, init) => {
            const destination = new URL(input instanceof Request ? input.url : String(input));
            if (destination.origin !== server.url.origin)
                throw new Error('SDK fixture forbids non-local requests');
            return fetch(input, init);
        },
    });
    const parameters = {
        model: 'synthetic-sse-model',
        messages: [{ role: 'user' as const, content: 'Synthetic exercise' }],
    };
    try {
        // The raw create(stream:true) request resolves and its iterator ends normally,
        // even for incomplete DONE/EOF. It is not a validated completed answer.
        const raw = await client.chat.completions.create({
            ...parameters,
            stream: true,
        });
        const rawChunks: ChatCompletionChunk[] = [];
        for await (const chunk of raw) rawChunks.push(chunk);
        expect(rawChunks).toEqual(ending === 'finished' ? [delta, finish] : [delta]);

        // The SDK's higher-level accumulator exposes provisional chunks but rejects
        // missing terminal state through both iteration and finalChatCompletion().
        const stream = client.chat.completions.stream(parameters);
        const finalOutcome = stream.finalChatCompletion().then(
            value => ({ status: 'resolved' as const, value }),
            (error: unknown) => ({ status: 'rejected' as const, error })
        );
        const accumulatedChunks: ChatCompletionChunk[] = [];
        let iteratorError: unknown;
        try {
            for await (const chunk of stream) accumulatedChunks.push(chunk);
        } catch (error) {
            iteratorError = error;
        }
        const outcome = await finalOutcome;
        expect(accumulatedChunks).toEqual(rawChunks);
        if (ending === 'finished') {
            expect(iteratorError).toBeUndefined();
            expect(outcome.status).toBe('resolved');
            if (outcome.status !== 'resolved') throw outcome.error;
            expect(outcome.value.choices[0]?.finish_reason).toBe('stop');
            expect(outcome.value.choices[0]?.message).toMatchObject({
                role: 'assistant',
                content: 'Synthetic answer',
            });
        } else {
            expect(iteratorError).toBeInstanceOf(OpenAI.OpenAIError);
            expect(outcome.status).toBe('rejected');
            if (outcome.status !== 'rejected')
                throw new Error('Incomplete SDK fixture resolved a final completion');
            expect(outcome.error).toBeInstanceOf(OpenAI.OpenAIError);
        }
    } finally {
        server.stop(true);
    }
});
