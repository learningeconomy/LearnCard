import type { AiSessionMode } from '@learncard/types';
import { db } from '../db';
import { cancelConversationSummary } from '../workers/conversationSummary';

export type ActiveSessionStatus = {
    isActive: boolean;
    activeThreadId: string | null;
    activeThreadTitle?: string;
    activeThreadMode?: AiSessionMode;
};

const didChains = new Map<string, Promise<void>>();

const runForDid = <T>(did: string, operation: () => Promise<T>): Promise<T> => {
    const previous = didChains.get(did) ?? Promise.resolve();
    const result = previous.catch(() => undefined).then(operation);
    const entry = result.then(
        () => undefined,
        () => undefined
    );

    didChains.set(did, entry);

    void entry.finally(() => {
        if (didChains.get(did) === entry) didChains.delete(did);
    });

    return result;
};

export const createActiveSessionThread = (
    did: string,
    title: string,
    isCurrent: () => boolean,
    onThreadsEnded?: (threadIds: string[]) => void,
    mode?: AiSessionMode
): Promise<string> =>
    runForDid(did, async () => {
        if (!isCurrent()) throw new DOMException('Session start superseded', 'AbortError');

        const endedThreadIds = await db.endActiveThreads(did);

        if (endedThreadIds.length > 0) {
            try {
                onThreadsEnded?.(endedThreadIds);
            } catch (error) {
                console.error('Failed to notify ended session clients:', error);
            }
        }

        if (!isCurrent()) throw new DOMException('Session start superseded', 'AbortError');

        const threadId = await db.createThread(did, title, { active: true, mode });

        if (isCurrent()) return threadId;

        await db.endThread(threadId, did);

        throw new DOMException('Session start superseded', 'AbortError');
    });

export const getActiveSessionStatus = async (did: string): Promise<ActiveSessionStatus> => {
    const threads = await db.getThreads(did);

    for (const thread of threads) {
        if (thread.active === false || thread.ended_at) continue;

        const summaries = await db.getThreadSummaryCredentials(did, thread.id);

        if (summaries.length === 0) {
            return {
                isActive: true,
                activeThreadId: thread.id,
                activeThreadTitle: thread.title,
                ...(thread.mode ? { activeThreadMode: thread.mode } : {}),
            };
        }
    }

    return { isActive: false, activeThreadId: null };
};

export const prepareThreadFinish = async (
    did: string,
    threadId: string,
    sendSummary: boolean
): Promise<{ shouldSummarize: boolean }> => {
    await db.endThread(threadId, did);

    try {
        await cancelConversationSummary(did, threadId);
    } catch (error) {
        console.error('Error removing queued summary job:', error);
    }

    return { shouldSummarize: sendSummary };
};
