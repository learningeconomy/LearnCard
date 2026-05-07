import dotenv from 'dotenv';
import { Neogma, QueryBuilder } from 'neogma';

import { traceDb } from '@tracing';

dotenv.config();

const uri = process.env.NEO4J_URI;
const username = process.env.NEO4J_USERNAME;
const password = process.env.NEO4J_PASSWORD;

if (!uri) throw new Error('Whoops! No URI found');
if (!username) throw new Error('Whoops! No Username found');
if (!password) throw new Error('Whoops! No Password found');

export const neogma = new Neogma({ url: uri, username, password });

const summarizeCypher = (query: string): string => {
    const normalized = query
        .replace(/\/\/.*$/gm, '')
        .replace(/\s+/g, ' ')
        .trim();

    const verb =
        normalized
            .match(
                /^(OPTIONAL MATCH|DETACH DELETE|MATCH|CREATE|MERGE|DELETE|SET|REMOVE|RETURN|CALL|UNWIND|WITH)/i
            )?.[0]
            ?.toUpperCase() ?? 'QUERY';

    const label = normalized.match(/:([A-Z][A-Za-z0-9_]*)/)?.[1];

    return label ? `${verb} ${label}` : verb;
};

/**
 * Auto-tracing wrapper for `neogma.queryRunner.run`.
 *
 * Every Cypher query executed through `neogma.queryRunner.run(...)` or
 * `new QueryBuilder(...).run()` (which shares the same runner via the
 * static assignment below) is automatically wrapped in a `traceDb` span.
 *
 * Manual `traceDb('logicalName', ...)` calls in helpers/access layers
 * remain useful: they create a parent span that contains the auto-traced
 * Cypher span as a child, giving both logical and query-level visibility.
 *
 * The full Cypher (truncated to 500 chars) is attached as span metadata,
 * which surfaces in the JSON and Sentry providers but stays out of the
 * console output to keep logs readable.
 */
const originalRun = neogma.queryRunner.run.bind(neogma.queryRunner);

neogma.queryRunner.run = ((...args: Parameters<typeof originalRun>) => {
    const query = args[0];
    const queryStr = typeof query === 'string' ? query : String(query);
    const name = summarizeCypher(queryStr);
    const cypher = queryStr.length > 500 ? `${queryStr.slice(0, 500)}…` : queryStr;
    return traceDb(name, () => originalRun(...args), { cypher });
}) as typeof neogma.queryRunner.run;

QueryBuilder.queryRunner = neogma.queryRunner;

export default neogma;
