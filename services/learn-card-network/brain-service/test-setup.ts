import { Neo4jContainer } from '@testcontainers/neo4j';
import 'zod-openapi/extend';

export default async function setup({ provide }) {
    const container = await new Neo4jContainer('neo4j:5').withReuse().start();

    provide('neo4j-uri', container.getBoltUri());
    provide('neo4j-password', container.getPassword());

    return () => container?.stop?.();
}
