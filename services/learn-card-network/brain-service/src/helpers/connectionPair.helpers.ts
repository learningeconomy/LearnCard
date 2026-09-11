import { QueryResult } from 'neo4j-driver';

import { neogma } from '@instance';

type RetriableNeo4jError = {
    code?: string;
    retriable?: boolean;
};

const wait = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

export const runConnectionPairQuery = async (
    query: string,
    params: Record<string, unknown>
): Promise<QueryResult> => {
    const maxAttempts = 5;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        try {
            return await neogma.queryRunner.run(query, params);
        } catch (error) {
            const neo4jError = error as RetriableNeo4jError;
            const isDeadlock =
                neo4jError.code === 'Neo.TransientError.Transaction.DeadlockDetected';
            const canRetry = (neo4jError.retriable === true || isDeadlock) && attempt < maxAttempts;

            if (!canRetry) throw error;

            await wait(10 * attempt);
        }
    }

    throw new Error('Connection pair query retry limit reached');
};
