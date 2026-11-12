import { Neo4jContainer } from '@testcontainers/neo4j';
import type { TestProject } from 'vitest/node';

export default async function setup({ provide }: TestProject) {
    // Never reuse a database: this suite owns and clears only this disposable container.
    const container = await new Neo4jContainer('neo4j:5').start();
    provide('neo4j-uri', container.getBoltUri());
    provide('neo4j-password', container.getPassword());
    return () => container.stop();
}
