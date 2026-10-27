import { expect, mock, test } from 'bun:test';
const calls: Record<string, unknown>[] = [];
mock.module('./client', () => ({
    aiCall: async (args: Record<string, unknown>) => {
        calls.push(args);
        return { fullText: 'synthetic' };
    },
}));
mock.module('../constants/env', () => ({ TITLE_MODEL: 'synthetic-model' }));
const { generateCredentialEmbeddingTexts } = await import('./embedding-texts');
test('managed generation timeout and existing signal/token cap reach aiCall unchanged', async () => {
    const signal = new AbortController().signal;
    await generateCredentialEmbeddingTexts('synthetic', {
        signal,
        timeoutMs: 240000,
        maxOutputTokens: 4096,
    });
    expect(calls[0]?.timeoutMs).toBe(240000);
    expect(calls[0]?.signal).toBe(signal);
    expect(calls[0]?.maxOutputTokens).toBe(4096);
    expect(calls).toHaveLength(1);
});
test('ordinary embedding text callers do not acquire a timeout override', async () => {
    await generateCredentialEmbeddingTexts('synthetic');
    expect(calls[1]).not.toHaveProperty('timeoutMs');
    expect(calls).toHaveLength(2);
});
