import { GenericContainer } from 'testcontainers';
import type { TestProject } from 'vitest/node';

/**
 * Real Redis for the LC-2187 endpoint tests. A random host port and a fresh
 * container keep the suite away from development data. The replay path is
 * security-critical, so it is exercised against a real Redis, never a mock.
 */
export default async function setup({ provide }: TestProject): Promise<() => Promise<void>> {
    const redis = await new GenericContainer('redis:7-alpine').withExposedPorts(6379).start();

    provide('share-content-redis-host', redis.getHost());
    provide('share-content-redis-port', redis.getMappedPort(6379));

    return async () => {
        await redis.stop();
    };
}
