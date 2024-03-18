import { Neo4jContainer } from '@testcontainers/neo4j';

export default async function setup({ provide }) {
    const container = await new Neo4jContainer().withReuse().start();

    provide('neo4j-uri', container.getBoltUri());
    provide('neo4j-password', container.getPassword());

    return container.stop;
}
