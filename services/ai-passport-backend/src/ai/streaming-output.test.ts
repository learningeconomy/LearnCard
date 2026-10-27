import { expect, test } from 'bun:test';
import { createJsonStringTracker, createRestoredTextStream } from './streaming-output';

const token = `{{NAME_${'a'.repeat(32)}}}`;
const restore = async (text: string) => text.replaceAll(token, 'Taylor');

test('streams ordinary text and never emits any split identifier fragment', async () => {
    for (let split = 1; split < token.length; split++) {
        const chunks: string[] = [];
        const stream = createRestoredTextStream(restore, {
            onChunk: chunk => {
                chunks.push(chunk);
            },
        });
        await stream.push(`Hello ${token.slice(0, split)}`);
        expect(chunks).toEqual(['Hello ']);
        await stream.push(`${token.slice(split)}!`);
        expect(chunks).toEqual(['Hello ', 'Taylor!']);
        expect(stream.finish()).toBe('Hello Taylor!');
    }
});

test('waits for restoration and consumer backpressure without accumulating disabled output', async () => {
    let releaseRestore!: () => void;
    let releaseConsumer!: () => void;
    const lookup = new Promise<void>(resolve => {
        releaseRestore = resolve;
    });
    const consumer = new Promise<void>(resolve => {
        releaseConsumer = resolve;
    });
    const chunks: string[] = [];
    const stream = createRestoredTextStream(
        async text => {
            await lookup;
            return restore(text);
        },
        {
            accumulateContent: false,
            onChunk: async chunk => {
                chunks.push(chunk);
                await consumer;
            },
        }
    );
    let completed = false;
    const push = stream.push(token).then(() => {
        completed = true;
    });
    expect(chunks).toEqual([]);
    releaseRestore();
    await lookup;
    expect(completed).toBe(false);
    releaseConsumer();
    await push;
    expect(chunks).toEqual(['Taylor']);
    expect(stream.finish()).toBe('');
});

test('does not flush truncated identifiers, failed lookups, or aborted restored text', async () => {
    const chunks: string[] = [];
    const options = {
        onChunk: (chunk: string) => {
            chunks.push(chunk);
        },
    };
    const truncated = createRestoredTextStream(restore, options);
    await truncated.push(token.slice(0, -1));
    expect(() => truncated.finish()).toThrow('Incomplete provider identifier token');
    const failed = createRestoredTextStream(async () => {
        throw new Error('lookup failed');
    }, options);
    await expect(failed.push(token)).rejects.toThrow('lookup failed');
    const controller = new AbortController();
    const aborted = createRestoredTextStream(
        async text => {
            controller.abort();
            return restore(text);
        },
        { ...options, signal: controller.signal }
    );
    await expect(aborted.push(token)).rejects.toThrow();
    expect(chunks).toEqual([]);
});

test('tracks escaped quotes and backslashes across structured JSON deltas', () => {
    const track = createJsonStringTracker();
    expect(track('{"answer":"Hello \\')).toBe(true);
    expect(track('"quoted\\" ')).toBe(true);
    expect(track(token.slice(0, 15))).toBe(true);
    expect(track(token.slice(15))).toBe(true);
    expect(track('","path":"folder\\')).toBe(true);
    expect(track('\\",')).toBe(false);
    expect(track('"done":true}')).toBe(false);
});
