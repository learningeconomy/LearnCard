import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { AiSessionMode } from '@learncard/types';

const operations: string[] = [];
const threads: Array<{
    id: string;
    title: string;
    active?: boolean;
    ended_at?: string;
    mode?: AiSessionMode;
}> = [];
let nextThreadId = 1;
let endedThreadIds: string[] = [];
const createdOptions: Array<{
    active?: boolean;
    mode?: AiSessionMode;
}> = [];

const db = {
    endActiveThreads: mock(async () => {
        operations.push('end-active');
        await Promise.resolve();
        return endedThreadIds;
    }),
    createThread: mock(
        async (
            _did: string,
            title: string,
            options: { active?: boolean; mode?: AiSessionMode } = {}
        ) => {
            const id = `thread-${nextThreadId}`;
            nextThreadId += 1;
            operations.push(`create:${title}`);
            createdOptions.push(options);
            threads.push({ id, title, active: true, mode: options.mode });
            return id;
        }
    ),
    endThread: mock(async (threadId: string) => {
        operations.push(`end:${threadId}`);
    }),
    getThreads: mock(async () => threads),
    getThreadSummaryCredentials: mock(async () => []),
};
const cancelConversationSummary = mock(async () => undefined);

mock.module('../db', () => ({ db }));
mock.module('../workers/conversationSummary', () => ({
    cancelConversationSummary,
}));

// Bun must register dependency mocks before loading the lifecycle service.
const { createActiveSessionThread, getActiveSessionStatus } = await import('./sessionLifecycle');

describe('session lifecycle', () => {
    beforeEach(() => {
        operations.length = 0;
        threads.length = 0;
        createdOptions.length = 0;
        nextThreadId = 1;
        endedThreadIds = [];
        cancelConversationSummary.mockClear();
    });

    it('serializes active-thread replacement for one DID', async () => {
        const [first, second] = await Promise.all([
            createActiveSessionThread('did:example:learner', 'First', () => true),
            createActiveSessionThread('did:example:learner', 'Second', () => true),
        ]);

        expect(first).toBe('thread-1');
        expect(second).toBe('thread-2');
        expect(operations).toEqual(['end-active', 'create:First', 'end-active', 'create:Second']);
    });

    it('reports replaced thread IDs before creating the new active thread', async () => {
        endedThreadIds = ['thread-old'];
        const onThreadsEnded = mock(() => {
            operations.push('notify:thread-old');
        });

        await createActiveSessionThread(
            'did:example:learner',
            'Replacement',
            () => true,
            onThreadsEnded
        );

        expect(onThreadsEnded).toHaveBeenCalledWith(['thread-old']);
        expect(operations).toEqual(['end-active', 'notify:thread-old', 'create:Replacement']);
    });

    it('persists the requested session mode in the active-thread insert', async () => {
        await createActiveSessionThread(
            'did:example:learner',
            'Insights',
            () => true,
            undefined,
            AiSessionMode.insights
        );

        expect(createdOptions).toEqual([{ active: true, mode: AiSessionMode.insights }]);
    });

    it('ends a newly created thread when its startup loses ownership', async () => {
        let freshnessChecks = 0;

        await expect(
            createActiveSessionThread('did:example:stale', 'Stale', () => {
                freshnessChecks += 1;
                return freshnessChecks < 3;
            })
        ).rejects.toMatchObject({ name: 'AbortError' });

        expect(operations).toEqual(['end-active', 'create:Stale', 'end:thread-1']);
    });

    it('returns only unfinished threads without a summary as active', async () => {
        threads.push(
            { id: 'ended', title: 'Ended', active: false },
            {
                id: 'active',
                title: 'Active',
                active: true,
                mode: AiSessionMode.insights,
            }
        );

        expect(await getActiveSessionStatus('did:example:learner')).toEqual({
            isActive: true,
            activeThreadId: 'active',
            activeThreadTitle: 'Active',
            activeThreadMode: AiSessionMode.insights,
        });
    });
});
