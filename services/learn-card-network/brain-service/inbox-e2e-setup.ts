import { Neo4jContainer } from '@testcontainers/neo4j';
import { GenericContainer } from 'testcontainers';
import type { TestProject } from 'vitest/node';

/** Random host ports and fresh containers keep these tests away from development data. */
export default async function setup({ provide }: TestProject): Promise<() => Promise<void>> {
    const neo4j = await new Neo4jContainer('neo4j:5').start();
    try {
        const redis = await new GenericContainer('redis:7-alpine').withExposedPorts(6379).start();
        provide('neo4j-uri', neo4j.getBoltUri());
        provide('neo4j-password', neo4j.getPassword());
        provide('inbox-redis-host', redis.getHost());
        provide('inbox-redis-port', redis.getMappedPort(6379));
        return async () => {
            await Promise.all([redis.stop(), neo4j.stop()]);
        };
    } catch (error) {
        await neo4j.stop();
        throw error;
    }
}
