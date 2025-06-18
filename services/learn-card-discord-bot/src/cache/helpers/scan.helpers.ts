import type Redis from 'ioredis';

export const simpleScan = async (redis: Redis.Redis, pattern: string): Promise<string[]> => {
    try {
        return await new Promise<string[]>(res => {
            const results: string[] = [];
            const stream = redis.scanStream({ match: pattern });

            stream.on('data', keys => {
                const dedupedKeys = keys.filter((key: string) => !results.includes(key));

                results.push(...dedupedKeys);
            });

            stream.on('end', () => res(results));

            stream.on('error', error => {
                console.error('Cache simpleScan error', error);
                res([]);
            });
        });
    } catch (error) {
        console.error('Cache simpleScan error', error);
        return [];
    }
};
