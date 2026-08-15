import { describe, expect, it } from 'vitest';

import { createMongoRuntime } from '../src/mongo';

describe('createMongoRuntime', () => {
    it('can be constructed without opening a MongoDB connection', async () => {
        const runtime = createMongoRuntime({
            mongoUri: undefined,
            mongoDbName: 'test-ai-agent',
        });

        await expect(runtime.getStatus()).resolves.toEqual({
            configured: false,
            connected: false,
            dbName: 'test-ai-agent',
        });
    });
});
