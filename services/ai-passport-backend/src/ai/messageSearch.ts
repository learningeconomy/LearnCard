type MessageSearchFilter = {
    must: {
        key: 'threadId' | 'userId';
        match: { value: string };
    }[];
};

export const getMessageSearchFilter = (did: string, threadId?: string): MessageSearchFilter => ({
    must: [
        { key: 'userId', match: { value: did } },
        ...(threadId ? [{ key: 'threadId' as const, match: { value: threadId } }] : []),
    ],
});
